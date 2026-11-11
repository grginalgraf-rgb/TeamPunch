'use client'

import { AlertCircle, Coffee, Loader2, LogIn, LogOut, MapPin, Play, ShieldCheck } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  handleClockIn,
  handleClockOut,
  handleEndBreak,
  handleStartBreak,
} from '@/app/actions/attendance'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/attendance/status-badge'
import { useNow } from '@/hooks/use-now'
import {
  breakMs,
  formatClock,
  formatHours,
  netMs,
  openBreak,
  presenceOf,
  type ShiftDTO,
} from '@/lib/attendance/shifts'
import { cn } from '@/lib/utils'

const LOCATION_ERROR =
  'Location permissions are required to clock in. Please enable location access.'

const HOUR_MS = 60 * 60 * 1000
const TARGET_MS = 8 * HOUR_MS

type Phase = 'idle' | 'locating' | 'saving'

function requestPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  })
}

export function ClockCard({
  initialShift,
  initialNow,
}: {
  initialShift: ShiftDTO | null
  initialNow: number
}) {
  const now = useNow(initialNow)
  const [shift, setShift] = useState(initialShift)
  const [syncedFrom, setSyncedFrom] = useState(initialShift)
  const [phase, setPhase] = useState<Phase>('idle')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Adopt fresh server data whenever the server-rendered shift changes.
  if (initialShift !== syncedFrom) {
    setSyncedFrom(initialShift)
    setShift(initialShift)
  }

  const presence = presenceOf(shift)
  const activeBreak = openBreak(shift)
  const busy = phase !== 'idle' || isPending

  async function clockIn() {
    setLocationError(null)
    setPhase('locating')
    let position: GeolocationPosition
    try {
      position = await requestPosition()
    } catch {
      setLocationError(LOCATION_ERROR)
      setPhase('idle')
      return
    }

    setPhase('saving')
    const { latitude, longitude } = position.coords
    const result = await handleClockIn(latitude, longitude)
    setPhase('idle')
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setShift(result.data)
    toast.success('Clocked in', {
      description: result.data.isLate ? 'Recorded as a late arrival.' : 'Have a productive shift.',
    })
  }

  function clockOut() {
    if (!shift) return
    const previous = shift
    const endedAt = new Date().toISOString()
    startTransition(async () => {
      setShift(null)
      const result = await handleClockOut(previous.id)
      if (!result.ok) {
        setShift(previous)
        toast.error(result.error)
        return
      }
      toast.success('Clocked out', {
        description: `Net time: ${formatHours(netMs({ ...previous, clockOut: endedAt }, Date.now()))}`,
      })
    })
  }

  function toggleBreak() {
    if (!shift) return
    const previous = shift

    if (activeBreak) {
      const endTime = new Date().toISOString()
      startTransition(async () => {
        setShift({
          ...previous,
          status: 'ACTIVE',
          breaks: previous.breaks.map((b) => (b.id === activeBreak.id ? { ...b, endTime } : b)),
        })
        const result = await handleEndBreak(activeBreak.id)
        if (!result.ok) {
          setShift(previous)
          toast.error(result.error)
        }
      })
      return
    }

    const startTime = new Date().toISOString()
    startTransition(async () => {
      setShift({
        ...previous,
        status: 'BREAK',
        breaks: [...previous.breaks, { id: 'pending', startTime, endTime: null }],
      })
      const result = await handleStartBreak(previous.id)
      if (!result.ok) {
        setShift(previous)
        toast.error(result.error)
        return
      }
      setShift((current) =>
        current
          ? {
              ...current,
              breaks: current.breaks.map((b) =>
                b.id === 'pending' ? { ...b, id: result.data.breakId } : b,
              ),
            }
          : current,
      )
    })
  }

  const date = new Date(now)
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const net = shift ? netMs(shift, now) : 0
  const progress = Math.min(100, Math.round((net / TARGET_MS) * 100))

  return (
    <section
      aria-labelledby="clock-heading"
      className="flex flex-col gap-7 rounded-2xl bg-ink p-6 text-ink-foreground shadow-xl shadow-ink/20 md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2
            id="clock-heading"
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Time clock
          </h2>
          <p className="text-sm text-ink-muted" suppressHydrationWarning>
            {dateLabel}
          </p>
        </div>
        <StatusBadge status={presence} className="border-ink-border bg-ink-raised text-ink-foreground" />
      </div>

      <div className="flex flex-col gap-1">
        <p
          className="font-mono text-5xl font-semibold tracking-tighter tabular-nums sm:text-6xl md:text-7xl"
          suppressHydrationWarning
        >
          {timeLabel}
        </p>
        <p className="text-sm text-ink-muted">Local time on this device</p>
      </div>

      <div
        className={cn(
          'flex flex-col gap-5 rounded-xl border border-ink-border bg-ink-raised p-5',
          presence === 'ACTIVE' && 'border-success/50',
          presence === 'BREAK' && 'border-warning/50',
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {presence === 'BREAK' ? 'Shift paused' : 'Shift timer'}
            </span>
            <span
              className="font-mono text-4xl font-semibold tabular-nums"
              aria-live="off"
              role="timer"
              aria-label="Elapsed net shift time"
            >
              {formatClock(net)}
            </span>
          </div>
          {shift && (
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Break time
              </span>
              <span className="font-mono text-lg font-medium tabular-nums">
                {formatClock(breakMs(shift, now))}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label="Progress toward an 8-hour day"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="grid grid-cols-8 gap-1.5"
          >
            {Array.from({ length: 8 }, (_, hour) => {
              const fill = Math.min(1, Math.max(0, net / HOUR_MS - hour))
              return (
                <span key={hour} className="h-2.5 overflow-hidden rounded-full bg-ink-border">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                    style={{ width: `${fill * 100}%` }}
                  />
                </span>
              )
            })}
          </div>
          <div className="flex justify-between font-mono text-xs text-ink-muted" aria-hidden="true">
            <span>0h</span>
            <span>{progress}% of 8h</span>
            <span>8h</span>
          </div>
        </div>
      </div>

      {locationError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Location required</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {shift ? (
          <Button
            size="lg"
            onClick={clockOut}
            disabled={busy}
            className="h-14 flex-1 bg-destructive-solid text-base font-semibold text-ink-foreground hover:bg-destructive-solid/90"
          >
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
            Clock Out
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={clockIn}
            disabled={busy}
            className="h-14 flex-1 bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            {phase === 'idle' ? (
              <LogIn aria-hidden="true" />
            ) : (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            {phase === 'locating' ? 'Verifying location…' : phase === 'saving' ? 'Clocking in…' : 'Clock In'}
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={toggleBreak}
          disabled={!shift || busy}
          className="h-14 border-ink-border bg-transparent text-base text-ink-foreground hover:bg-ink-raised hover:text-ink-foreground disabled:opacity-40 sm:w-52 dark:bg-transparent dark:hover:bg-ink-raised"
        >
          {activeBreak ? <Play aria-hidden="true" /> : <Coffee aria-hidden="true" />}
          {activeBreak ? 'Resume Work' : 'Take a Break'}
        </Button>
      </div>

      <LocationIndicator shift={shift} />
    </section>
  )
}

function LocationIndicator({ shift }: { shift: ShiftDTO | null }) {
  if (!shift || shift.latitude === null || shift.longitude === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <MapPin className="size-4" aria-hidden="true" />
        Your location is captured once when you clock in.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <ShieldCheck className="size-4" aria-hidden="true" />
        Location Verified
      </span>
      <span className="font-mono text-xs text-ink-muted">
        {shift.latitude.toFixed(5)}, {shift.longitude.toFixed(5)}
      </span>
      {shift.outsideGeofence && (
        <span className="text-xs font-medium text-warning">Outside office geofence</span>
      )}
    </div>
  )
}
