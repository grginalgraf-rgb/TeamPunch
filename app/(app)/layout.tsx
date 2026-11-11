import { AppShell } from '@/components/app/app-shell'
import { getOpenShift } from '@/lib/attendance/queries'
import { presenceOf } from '@/lib/attendance/shifts'
import { getActiveView, requireUser } from '@/lib/session'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser()
  const [view, openShift] = await Promise.all([getActiveView(me), getOpenShift(me.id)])

  return (
    <AppShell user={me} view={view} presence={presenceOf(openShift)}>
      {children}
    </AppShell>
  )
}
