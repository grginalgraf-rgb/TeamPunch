import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { HistoryTable } from '@/components/attendance/history-table'
import {
  computeWeeklySummary,
  getOrgPolicy,
  getRecentShifts,
  getTodayShifts,
} from '@/lib/attendance/queries'
import type { SessionUser } from '@/lib/session'
import { ClockCard } from './clock-card'
import { TodayStats } from './today-stats'
import { WeeklySummary } from './weekly-summary'

export async function EmployeeDashboard({ user }: { user: SessionUser }) {
  const policy = await getOrgPolicy()
  const [todayShifts, recent, summary] = await Promise.all([
    getTodayShifts(user.id, policy.timezone),
    getRecentShifts(user.id, 7),
    computeWeeklySummary(user.id, policy.timezone),
  ])
  const openShift = todayShifts.find((s) => !s.clockOut) ?? null
  const now = Date.now()

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        description="Clock in, take breaks, and keep an eye on your hours."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClockCard initialShift={openShift} initialNow={now} />
        </div>
        <TodayStats shifts={todayShifts} initialNow={now} timeZone={policy.timezone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="recent-heading"
          className="overflow-hidden rounded-xl border bg-card shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
            <h2 id="recent-heading" className="text-base font-semibold">
              Recent shifts
            </h2>
            <Link href="/history" className="text-sm font-medium text-accent-foreground underline-offset-4 hover:underline">
              View all
            </Link>
          </div>
          <HistoryTable shifts={recent} initialNow={now} timeZone={policy.timezone} />
        </section>
        <WeeklySummary summary={summary} />
      </div>
    </>
  )
}
