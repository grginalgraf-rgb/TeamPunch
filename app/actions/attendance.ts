'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { attendance, attendanceBreak, user } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/session'
import {
  computeWeeklySummary,
  getOpenShift,
  getOrgPolicy,
  getRecentShifts,
  getRoster,
  hasShiftToday,
  metricsFromRoster,
} from '@/lib/attendance/queries'
import type { ManagerMetrics, ShiftDTO, WeeklySummary } from '@/lib/attendance/shifts'

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const LOCATION_REQUIRED =
  'Location permissions are required to clock in. Please enable location access.'
const SIGNED_OUT = 'Your session has expired. Please sign in again.'

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

function minutesInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return get('hour') * 60 + get('minute')
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function isCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

function refresh() {
  revalidatePath('/', 'layout')
}

export async function handleClockIn(
  latitude: number,
  longitude: number,
): Promise<ActionResult<ShiftDTO>> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  if (!isCoordinate(latitude, longitude)) return fail(LOCATION_REQUIRED)

  if (await getOpenShift(me.id)) return fail('You are already clocked in.')

  const policy = await getOrgPolicy()
  const now = new Date()
  const [startH, startM] = policy.workStart.split(':').map(Number)
  const isLate =
    !(await hasShiftToday(me.id, policy.timezone)) &&
    minutesInZone(now, policy.timezone) > startH * 60 + startM + policy.graceMinutes
  const outsideGeofence =
    policy.geofenceLat !== null &&
    policy.geofenceLng !== null &&
    distanceMeters(latitude, longitude, policy.geofenceLat, policy.geofenceLng) >
      policy.geofenceRadiusM

  try {
    await db.insert(attendance).values({
      userId: me.id,
      clockIn: now,
      latitude,
      longitude,
      isLate,
      outsideGeofence,
    })
  } catch (error) {
    if (isUniqueViolation(error)) return fail('You are already clocked in.')
    throw error
  }

  const shift = await getOpenShift(me.id)
  refresh()
  return shift ? { ok: true, data: shift } : fail('Could not start your shift.')
}

export async function handleClockOut(attendanceId: string): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)

  const now = new Date()
  const [closed] = await db
    .update(attendance)
    .set({ clockOut: now, status: 'COMPLETED' })
    .where(
      and(
        eq(attendance.id, attendanceId),
        eq(attendance.userId, me.id),
        isNull(attendance.clockOut),
      ),
    )
    .returning({ id: attendance.id })
  if (!closed) return fail('No active shift found to clock out of.')

  await db
    .update(attendanceBreak)
    .set({ endTime: now })
    .where(and(eq(attendanceBreak.attendanceId, closed.id), isNull(attendanceBreak.endTime)))

  refresh()
  return { ok: true, data: null }
}

export async function handleStartBreak(
  attendanceId: string,
): Promise<ActionResult<{ breakId: string }>> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)

  const [updated] = await db
    .update(attendance)
    .set({ status: 'BREAK' })
    .where(
      and(
        eq(attendance.id, attendanceId),
        eq(attendance.userId, me.id),
        eq(attendance.status, 'ACTIVE'),
        isNull(attendance.clockOut),
      ),
    )
    .returning({ id: attendance.id })
  if (!updated) return fail('You need an active shift to take a break.')

  try {
    const [created] = await db
      .insert(attendanceBreak)
      .values({ attendanceId: updated.id })
      .returning({ id: attendanceBreak.id })
    refresh()
    return { ok: true, data: { breakId: created.id } }
  } catch (error) {
    if (isUniqueViolation(error)) return fail('You are already on a break.')
    throw error
  }
}

export async function handleEndBreak(breakId: string): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)

  const [owned] = await db
    .select({ attendanceId: attendanceBreak.attendanceId })
    .from(attendanceBreak)
    .innerJoin(attendance, eq(attendance.id, attendanceBreak.attendanceId))
    .where(
      and(
        eq(attendanceBreak.id, breakId),
        eq(attendance.userId, me.id),
        isNull(attendanceBreak.endTime),
      ),
    )
    .limit(1)
  if (!owned) return fail('No active break found.')

  await db
    .update(attendanceBreak)
    .set({ endTime: new Date() })
    .where(eq(attendanceBreak.id, breakId))
  await db
    .update(attendance)
    .set({ status: 'ACTIVE' })
    .where(and(eq(attendance.id, owned.attendanceId), isNull(attendance.clockOut)))

  refresh()
  return { ok: true, data: null }
}

export async function getWeeklySummary(): Promise<ActionResult<WeeklySummary>> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  const policy = await getOrgPolicy()
  return { ok: true, data: await computeWeeklySummary(me.id, policy.timezone) }
}

export async function getManagerMetrics(): Promise<ActionResult<ManagerMetrics>> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  if (me.role !== 'ADMIN') return fail('Only admins can view team metrics.')
  const policy = await getOrgPolicy()
  return { ok: true, data: metricsFromRoster(await getRoster(policy.timezone)) }
}

export async function getEmployeeLog(
  userId: string,
): Promise<ActionResult<{ name: string; shifts: ShiftDTO[] }>> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  if (me.role !== 'ADMIN' && me.id !== userId) {
    return fail('You do not have access to this log.')
  }
  const [employee] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!employee) return fail('Employee not found.')
  return { ok: true, data: { name: employee.name, shifts: await getRecentShifts(userId, 20) } }
}

export async function flagEntry(
  attendanceId: string,
  reason: string,
): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  if (me.role !== 'ADMIN') return fail('Only admins can flag entries.')

  const trimmed = reason.trim()
  if (trimmed.length < 3) return fail('Add a short reason (at least 3 characters).')
  if (trimmed.length > 200) return fail('Keep the reason under 200 characters.')

  const [updated] = await db
    .update(attendance)
    .set({ flagged: true, flagReason: trimmed })
    .where(eq(attendance.id, attendanceId))
    .returning({ id: attendance.id })
  if (!updated) return fail('Entry not found.')

  refresh()
  return { ok: true, data: null }
}

export async function clearFlag(attendanceId: string): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return fail(SIGNED_OUT)
  if (me.role !== 'ADMIN') return fail('Only admins can update flags.')

  await db
    .update(attendance)
    .set({ flagged: false, flagReason: null })
    .where(eq(attendance.id, attendanceId))

  refresh()
  return { ok: true, data: null }
}
