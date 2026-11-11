import { and, asc, desc, eq, gte, inArray, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  attendance,
  attendanceBreak,
  orgSettings,
  user,
  type AttendanceRow,
} from '@/lib/db/schema'
import {
  netMs,
  presenceOf,
  type ManagerMetrics,
  type OrgPolicy,
  type RosterEntry,
  type ShiftDTO,
  type WeeklySummary,
} from './shifts'

export async function getOrgPolicy(): Promise<OrgPolicy> {
  const [row] = await db.select().from(orgSettings).where(eq(orgSettings.id, 1))
  return {
    timezone: row?.timezone ?? 'UTC',
    workStart: row?.workStart ?? '09:00',
    graceMinutes: row?.graceMinutes ?? 5,
    geofenceLat: row?.geofenceLat ?? null,
    geofenceLng: row?.geofenceLng ?? null,
    geofenceRadiusM: row?.geofenceRadiusM ?? 200,
  }
}

function isToday(timeZone: string) {
  return sql`(${attendance.clockIn} AT TIME ZONE ${timeZone})::date = (now() AT TIME ZONE ${timeZone})::date`
}

async function withBreaks(rows: AttendanceRow[]): Promise<ShiftDTO[]> {
  if (rows.length === 0) return []
  const breaks = await db
    .select()
    .from(attendanceBreak)
    .where(
      inArray(
        attendanceBreak.attendanceId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(attendanceBreak.startTime))

  return rows.map((r) => ({
    id: r.id,
    clockIn: r.clockIn.toISOString(),
    clockOut: r.clockOut?.toISOString() ?? null,
    status: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
    isLate: r.isLate,
    outsideGeofence: r.outsideGeofence,
    flagged: r.flagged,
    flagReason: r.flagReason,
    breaks: breaks
      .filter((b) => b.attendanceId === r.id)
      .map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime?.toISOString() ?? null,
      })),
  }))
}

export async function getOpenShift(userId: string) {
  const rows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.userId, userId), isNull(attendance.clockOut)))
    .limit(1)
  const [shift] = await withBreaks(rows)
  return shift ?? null
}

export async function getTodayShifts(userId: string, timeZone: string) {
  const rows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        or(isNull(attendance.clockOut), isToday(timeZone)),
      ),
    )
    .orderBy(asc(attendance.clockIn))
  return withBreaks(rows)
}

export async function hasShiftToday(userId: string, timeZone: string) {
  const rows = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(and(eq(attendance.userId, userId), isToday(timeZone)))
    .limit(1)
  return rows.length > 0
}

export async function getRecentShifts(userId: string, limit = 10) {
  const rows = await db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, userId))
    .orderBy(desc(attendance.clockIn))
    .limit(limit)
  return withBreaks(rows)
}

export async function computeWeeklySummary(
  userId: string,
  timeZone: string,
): Promise<WeeklySummary> {
  const now = Date.now()
  const since = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.userId, userId), gte(attendance.clockIn, since)))
  const shifts = await withBreaks(rows)

  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone })
  const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone })

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
    return { date: dayKey.format(date), label: dayLabel.format(date), ms: 0 }
  })

  for (const shift of shifts) {
    const key = dayKey.format(new Date(shift.clockIn))
    const day = days.find((d) => d.date === key)
    if (day) day.ms += netMs(shift, now)
  }

  return {
    totalMs: days.reduce((sum, d) => sum + d.ms, 0),
    shiftCount: shifts.length,
    days,
  }
}

const LAST_ACTION_LABEL = {
  clockIn: 'Clocked in',
  clockOut: 'Clocked out',
  breakStart: 'Started break',
  breakEnd: 'Resumed work',
} as const

function lastActionOf(shift: ShiftDTO | undefined) {
  if (!shift) return null
  const events: { label: string; at: string }[] = [
    { label: LAST_ACTION_LABEL.clockIn, at: shift.clockIn },
  ]
  for (const b of shift.breaks) {
    events.push({ label: LAST_ACTION_LABEL.breakStart, at: b.startTime })
    if (b.endTime) events.push({ label: LAST_ACTION_LABEL.breakEnd, at: b.endTime })
  }
  if (shift.clockOut) events.push({ label: LAST_ACTION_LABEL.clockOut, at: shift.clockOut })
  return events.reduce((latest, e) => (e.at > latest.at ? e : latest))
}

export async function getRoster(timeZone: string): Promise<RosterEntry[]> {
  const [users, todayRows, latestRows] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .orderBy(asc(user.name)),
    db
      .select()
      .from(attendance)
      .where(or(isNull(attendance.clockOut), isToday(timeZone)))
      .orderBy(asc(attendance.clockIn)),
    db
      .selectDistinctOn([attendance.userId])
      .from(attendance)
      .orderBy(attendance.userId, desc(attendance.clockIn)),
  ])

  const todayIds = new Set(todayRows.map((r) => r.id))
  const shifts = await withBreaks([
    ...todayRows,
    ...latestRows.filter((r) => !todayIds.has(r.id)),
  ])
  const byId = new Map(shifts.map((s) => [s.id, s]))

  return users.map((u) => {
    const todayShifts = todayRows
      .filter((r) => r.userId === u.id)
      .map((r) => byId.get(r.id)!)
    const open = todayShifts.find((s) => !s.clockOut) ?? null
    const latestRow = latestRows.find((r) => r.userId === u.id)
    const latest = latestRow ? byId.get(latestRow.id) : undefined

    return {
      ...u,
      presence: presenceOf(open),
      todayShifts,
      lastAction: lastActionOf(latest),
      latestShiftId: latest?.id ?? null,
      latestShiftFlagged: latest?.flagged ?? false,
      isLate: todayShifts.some((s) => s.isLate),
      outsideGeofence: todayShifts.some((s) => s.outsideGeofence),
      flagged: todayShifts.some((s) => s.flagged),
    }
  })
}

export function metricsFromRoster(roster: RosterEntry[]): ManagerMetrics {
  const active = roster.filter((r) => r.presence === 'ACTIVE').length
  const onBreak = roster.filter((r) => r.presence === 'BREAK').length
  return {
    total: roster.length,
    active,
    onBreak,
    offDuty: roster.length - active - onBreak,
    lateOrFlagged: roster.filter((r) => r.isLate || r.outsideGeofence || r.flagged)
      .length,
  }
}
