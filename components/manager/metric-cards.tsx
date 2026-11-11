import { AlertTriangle, Coffee, Moon, UserCheck, Users } from 'lucide-react'
import type { ManagerMetrics } from '@/lib/attendance/shifts'
import { cn } from '@/lib/utils'

export function MetricCards({ metrics }: { metrics: ManagerMetrics }) {
  const cards = [
    { label: 'Total employees', value: metrics.total, icon: Users, tone: 'bg-primary text-primary-foreground' },
    { label: 'Active now', value: metrics.active, icon: UserCheck, tone: 'bg-success/15 text-success-strong' },
    { label: 'On break', value: metrics.onBreak, icon: Coffee, tone: 'bg-warning/15 text-warning-strong' },
    { label: 'Off-duty', value: metrics.offDuty, icon: Moon, tone: 'bg-muted text-muted-foreground' },
    {
      label: 'Late or flagged',
      value: metrics.lateOrFlagged,
      icon: AlertTriangle,
      tone: 'bg-destructive/10 text-destructive',
    },
  ]

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" aria-label="Team metrics">
      {cards.map((card, index) => {
        const featured = index === 0
        return (
          <li
            key={card.label}
            className={cn(
              'flex flex-col gap-5 rounded-2xl border p-5 shadow-sm',
              featured ? 'border-transparent bg-ink text-ink-foreground' : 'bg-card',
            )}
          >
            <span className={cn('flex size-10 items-center justify-center rounded-xl', card.tone)}>
              <card.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-4xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </span>
              <span className={cn('text-sm', featured ? 'text-ink-muted' : 'text-muted-foreground')}>
                {card.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
