'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { orgSettings } from '@/lib/db/schema'
import { getSessionUser, VIEW_COOKIE, type ActiveView } from '@/lib/session'
import type { OrgPolicy } from '@/lib/attendance/shifts'
import type { ActionResult } from './attendance'

export async function setActiveView(view: ActiveView): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return { ok: false, error: 'Please sign in again.' }
  if (me.role !== 'ADMIN') return { ok: false, error: 'Only admins can switch views.' }

  ;(await cookies()).set(VIEW_COOKIE, view === 'employee' ? 'employee' : 'manager', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export async function updateOrgPolicy(input: OrgPolicy): Promise<ActionResult> {
  const me = await getSessionUser()
  if (!me) return { ok: false, error: 'Please sign in again.' }
  if (me.role !== 'ADMIN') return { ok: false, error: 'Only admins can change policy.' }

  if (!isValidTimeZone(input.timezone)) return { ok: false, error: 'Choose a valid timezone.' }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.workStart)) {
    return { ok: false, error: 'Enter the work start time as HH:MM.' }
  }
  const grace = Math.round(Number(input.graceMinutes))
  if (!Number.isFinite(grace) || grace < 0 || grace > 120) {
    return { ok: false, error: 'Grace period must be between 0 and 120 minutes.' }
  }
  const radius = Math.round(Number(input.geofenceRadiusM))
  if (!Number.isFinite(radius) || radius < 25 || radius > 50_000) {
    return { ok: false, error: 'Geofence radius must be between 25 m and 50 km.' }
  }

  const hasLat = input.geofenceLat !== null
  const hasLng = input.geofenceLng !== null
  if (hasLat !== hasLng) {
    return { ok: false, error: 'Provide both latitude and longitude, or neither.' }
  }
  if (
    hasLat &&
    (Math.abs(Number(input.geofenceLat)) > 90 || Math.abs(Number(input.geofenceLng)) > 180)
  ) {
    return { ok: false, error: 'Geofence coordinates are out of range.' }
  }

  await db
    .update(orgSettings)
    .set({
      timezone: input.timezone,
      workStart: input.workStart,
      graceMinutes: grace,
      geofenceLat: hasLat ? Number(input.geofenceLat) : null,
      geofenceLng: hasLng ? Number(input.geofenceLng) : null,
      geofenceRadiusM: radius,
    })
    .where(eq(orgSettings.id, 1))

  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}
