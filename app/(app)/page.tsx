import { EmployeeDashboard } from '@/components/employee/employee-dashboard'
import { ManagerDashboard } from '@/components/manager/manager-dashboard'
import { getActiveView, requireUser } from '@/lib/session'

export default async function DashboardPage() {
  const me = await requireUser()
  const view = await getActiveView(me)
  return view === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard user={me} />
}
