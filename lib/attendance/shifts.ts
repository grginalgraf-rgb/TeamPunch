export type ShiftStatus = 'ACTIVE' | 'BREAK' | 'COMPLETED'
export type PresenceStatus = 'ACTIVE' | 'BREAK' | 'OFF'

export type BreakDTO = {
  id: string
  startTime: string
  endTime: string | null
}

export type ShiftDTO = {
  id: string
  clockIn: string
  clockOut: string | null
  status: ShiftStatus
  latitude: number | null
  longitude: number | null
  isLate: boolean
  outsideGeofence: boolean
  flagged: boolean
  flagReason: string | null
  breaks: BreakDTO[]
}

export type RosterEntry = {
  id: string
  name: string
  email: string
  role: 'EMPLOYEE' | 'ADMIN'
  presence: PresenceStatus
  todayShifts: ShiftDTO[]
  lastAction: { label: string; at: string } | null
  latestShiftId: string | null
  latestShiftFlagged: boolean
  isLate: boolean
  outsideGeofence: boolean
  flagged: boolean
}

export type ManagerMetrics = {
  total: number
  active: number
  onBreak: number
  offDuty: number
  lateOrFlagged: number
}

export type WeeklySummary = {
  totalMs: number
  shiftCount: number
  days: { date: string; label: string; ms: number }[]
}

export type OrgPolicy = {
  timezone: string
  workStart: string
  graceMinutes: number
  geofenceLat: number | null
  geofenceLng: number | null
  geofenceRadiusM: number
}

const ts = (iso: string) => new Date(iso).getTime()

export function breakMs(shift: ShiftDTO, now: number) {
  const shiftEnd = shift.clockOut ? ts(shift.clockOut) : now
  return shift.breaks.reduce((sum, b) => {
    const end = b.endTime ? ts(b.endTime) : shiftEnd
    return sum + Math.max(0, end - ts(b.startTime))
  }, 0)
}

export function netMs(shift: ShiftDTO, now: number) {
  const end = shift.clockOut ? ts(shift.clockOut) : now
  return Math.max(0, end - ts(shift.clockIn) - breakMs(shift, now))
}

export function openBreak(shift: ShiftDTO | null) {
  return shift?.breaks.find((b) => !b.endTime) ?? null
}

export function presenceOf(shift: ShiftDTO | null): PresenceStatus {
  if (!shift || shift.clockOut) return 'OFF'
  return shift.status === 'BREAK' ? 'BREAK' : 'ACTIVE'
}

export function formatClock(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatHours(ms: number) {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export function formatDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(iso))
}

export function formatDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
