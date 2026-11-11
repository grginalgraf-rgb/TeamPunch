'use client'

import { Clock, Coffee, Timer } from 'lucide-react'
import { useNow } from '@/hooks/use-now'
import { breakMs, formatHours, formatTime, netMs, type ShiftDTO } from '@/lib/attendance/shifts'

export function TodayStats({
  shifts,
  initialNow,
  timeZone,
}: {
  shifts: ShiftDTO[]
  initialNow: number
  timeZone: string
}) {
  const now = useNow(initialNow, 15000)
  const worked = shifts.reduce((sum, s) => sum + netMs(s, now), 0)
  const breaks = shifts.reduce((sum, s) => sum + breakMs(s, now), 0)
  const first = shifts[0]

  const stats = [
    { label: 'Worked today', value: formatHours(worked), icon: Timer },
    { label: 'Break time', value: formatHours(breaks), icon: Coffee },
    {
      label: 'First clock-in',
      value: first ? formatTime(first.clockIn, timeZone) : '—',
      icon: Clock,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-ink-foreground">
            <stat.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
