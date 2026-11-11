import { cn } from '@/lib/utils'

export type BadgeStatus = 'ACTIVE' | 'BREAK' | 'OFF' | 'COMPLETED'

const META: Record<BadgeStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'border-success/30 bg-success/10 text-success-strong',
    dot: 'bg-success',
  },
  BREAK: {
    label: 'On Break',
    className: 'border-warning/30 bg-warning/10 text-warning-strong',
    dot: 'bg-warning',
  },
  OFF: {
    label: 'Off-Duty',
    className: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border-accent-foreground/20 bg-accent text-accent-foreground',
    dot: 'bg-accent-foreground',
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus
  className?: string
}) {
  const meta = META[status]
  const live = status === 'ACTIVE' || status === 'BREAK'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        {live && (
          <span
            className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', meta.dot)}
          />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', meta.dot)} />
      </span>
      {meta.label}
    </span>
  )
}
