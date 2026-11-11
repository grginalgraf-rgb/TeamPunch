'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

const subscribe = () => () => {}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  return (
    <section
      aria-labelledby="appearance-heading"
      className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 id="appearance-heading" className="text-base font-semibold">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground">Saved on this device.</p>
      </div>
      <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const selected = mounted && theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <option.icon className="size-5" aria-hidden="true" />
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
