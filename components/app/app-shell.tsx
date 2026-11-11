'use client'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { PresenceStatus } from '@/lib/attendance/shifts'
import type { ActiveView, SessionUser } from '@/lib/session'
import { AppSidebar } from './app-sidebar'
import { TopBar } from './top-bar'

export function AppShell({
  user,
  view,
  presence,
  children,
}: {
  user: SessionUser
  view: ActiveView
  presence: PresenceStatus
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} view={view} />
      <SidebarInset className="min-w-0">
        <TopBar user={user} view={view} presence={presence} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
