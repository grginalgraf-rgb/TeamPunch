'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { setActiveView } from '@/app/actions/settings'
import type { ActiveView } from '@/lib/session'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ActiveView; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
]

export function ViewSwitcher({ view }: { view: ActiveView }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function choose(next: ActiveView) {
    if (next === view) return
    startTransition(async () => {
      const result = await setActiveView(next)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.push('/')
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label="Dashboard view"
      className={cn(
        'grid grid-cols-2 gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-1',
        pending && 'opacity-70',
      )}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === view
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={pending}
            onClick={() => choose(option.value)}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              selected
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
