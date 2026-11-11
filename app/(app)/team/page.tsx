import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { AutoRefresh } from '@/components/manager/auto-refresh'
import { RosterTable } from '@/components/manager/roster-table'
import { getOrgPolicy, getRoster } from '@/lib/attendance/queries'
import { requireAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Team Overview' }

export default async function TeamPage() {
  await requireAdmin()
  const policy = await getOrgPolicy()
  const roster = await getRoster(policy.timezone)

  return (
    <>
      <PageHeader
        title="Team overview"
        description="Search the roster, open any employee's full log, and flag entries for review."
      >
        <AutoRefresh />
      </PageHeader>
      <RosterTable roster={roster} initialNow={Date.now()} timeZone={policy.timezone} />
    </>
  )
}
