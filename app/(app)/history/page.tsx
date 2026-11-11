import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { HistoryTable } from '@/components/attendance/history-table'
import { computeWeeklySummary, getOrgPolicy, getRecentShifts } from '@/lib/attendance/queries'
import { formatHours } from '@/lib/attendance/shifts'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Attendance History' }

export default async function HistoryPage() {
  const me = await requireUser()
  const policy = await getOrgPolicy()
  const [shifts, summary] = await Promise.all([
    getRecentShifts(me.id, 60),
    computeWeeklySummary(me.id, policy.timezone),
  ])

  return (
    <>
      <PageHeader
        title="Attendance history"
        description={`Your last ${shifts.length} shifts with captured location. Times shown in ${policy.timezone}.`}
      >
        <div className="flex flex-col rounded-lg border bg-card px-4 py-2 shadow-sm">
          <span className="text-xs text-muted-foreground">Last 7 days</span>
          <span className="text-lg font-semibold tabular-nums">{formatHours(summary.totalMs)}</span>
        </div>
      </PageHeader>
      <section aria-label="Shift log" className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <HistoryTable shifts={shifts} initialNow={Date.now()} timeZone={policy.timezone} showLocation />
      </section>
    </>
  )
}
