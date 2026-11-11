import { formatHours, type WeeklySummary as Summary } from '@/lib/attendance/shifts'
import { cn } from '@/lib/utils'

export function WeeklySummary({ summary }: { summary: Summary }) {
  const max = Math.max(...summary.days.map((d) => d.ms), 8 * 60 * 60 * 1000)

  return (
    <section
      aria-labelledby="weekly-heading"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="weekly-heading" className="text-sm font-medium text-muted-foreground">
            Last 7 days
          </h2>
          <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {formatHours(summary.totalMs)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.shiftCount} {summary.shiftCount === 1 ? 'shift' : 'shifts'}
        </p>
      </div>
      <ul className="flex h-32 items-end gap-2" aria-label="Net hours per day">
        {summary.days.map((day, index) => {
          const isToday = index === summary.days.length - 1
          return (
            <li key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="sr-only">
                {day.label}: {formatHours(day.ms)}
              </span>
              <div className="flex w-full flex-1 items-end rounded-lg bg-muted" aria-hidden="true">
                <div
                  className={cn(
                    'w-full rounded-lg transition-all',
                    isToday ? 'bg-primary' : 'bg-ink dark:bg-chart-2',
                  )}
                  style={{ height: `${Math.max(day.ms > 0 ? 6 : 0, (day.ms / max) * 100)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs',
                  isToday ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {day.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
