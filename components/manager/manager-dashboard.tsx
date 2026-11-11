import { PageHeader } from '@/components/app/page-header'
import { getOrgPolicy, getRoster, metricsFromRoster } from '@/lib/attendance/queries'
import { AutoRefresh } from './auto-refresh'
import { MetricCards } from './metric-cards'
import { RosterTable } from './roster-table'

export async function ManagerDashboard() {
  const policy = await getOrgPolicy()
  const roster = await getRoster(policy.timezone)
  const metrics = metricsFromRoster(roster)

  return (
    <>
      <PageHeader
        title="Team dashboard"
        description={`Live attendance across your workspace · ${policy.timezone}`}
      >
        <AutoRefresh />
      </PageHeader>
      <MetricCards metrics={metrics} />
      <RosterTable roster={roster} initialNow={Date.now()} timeZone={policy.timezone} />
    </>
  )
}
