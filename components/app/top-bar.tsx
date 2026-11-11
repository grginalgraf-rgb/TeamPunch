'use client'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { StatusBadge } from '@/components/attendance/status-badge'
import type { PresenceStatus } from '@/lib/attendance/shifts'
import type { ActiveView, SessionUser } from '@/lib/session'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

export function TopBar({
  user,
  view,
  presence,
}: {
  user: SessionUser
  view: ActiveView
  presence: PresenceStatus
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger aria-label="Toggle navigation" />
        <Separator orientation="vertical" className="h-5" />
        <span className="truncate text-sm font-semibold">Kintai Cloud</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs text-muted-foreground">Your status</span>
          <StatusBadge status={presence} />
        </div>
        <StatusBadge status={presence} className="sm:hidden" />
        <ThemeToggle />
        <UserMenu user={user} view={view} />
      </div>
    </header>
  )
}
