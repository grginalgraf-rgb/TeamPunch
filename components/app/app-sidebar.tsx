'use client'

import { Clock3, History, LayoutDashboard, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { ActiveView, SessionUser } from '@/lib/session'
import { ViewSwitcher } from './view-switcher'

export function AppSidebar({ user, view }: { user: SessionUser; view: ActiveView }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const isAdmin = user.role === 'ADMIN'

  const items = [
    {
      href: '/',
      label: view === 'manager' ? 'Team Dashboard' : 'My Dashboard',
      icon: LayoutDashboard,
    },
    { href: '/history', label: 'Attendance History', icon: History },
    ...(isAdmin ? [{ href: '/team', label: 'Team Overview', icon: Users }] : []),
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpenMobile(false)}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Kintai Cloud</span>
            <span className="text-xs text-sidebar-foreground/70">Attendance</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      className="relative h-9 text-sidebar-foreground/80 data-active:font-medium data-active:text-sidebar-accent-foreground data-active:before:absolute data-active:before:inset-y-2 data-active:before:left-0 data-active:before:w-1 data-active:before:rounded-full data-active:before:bg-sidebar-primary"
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isAdmin && (
        <SidebarFooter className="p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-sidebar-foreground/70">Dashboard view</span>
            <ViewSwitcher view={view} />
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
