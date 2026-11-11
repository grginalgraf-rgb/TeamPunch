'use client'

import { ArrowLeftRight, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setActiveView } from '@/app/actions/settings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/auth-client'
import { initials } from '@/lib/attendance/shifts'
import type { ActiveView, SessionUser } from '@/lib/session'

export function UserMenu({ user, view }: { user: SessionUser; view: ActiveView }) {
  const router = useRouter()
  const otherView: ActiveView = view === 'manager' ? 'employee' : 'manager'

  async function switchView() {
    const result = await setActiveView(otherView)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.push('/')
  }

  async function signOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="flex items-center gap-2 rounded-full p-0.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:rounded-lg md:py-1 md:pr-2.5 md:pl-1"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-ink text-xs font-semibold text-ink-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start leading-tight md:flex">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {user.role === 'ADMIN' ? 'Admin' : 'Employee'}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === 'ADMIN' && (
            <DropdownMenuItem onClick={switchView}>
              <ArrowLeftRight aria-hidden="true" />
              {otherView === 'manager' ? 'Switch to Manager view' : 'Switch to Employee view'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
