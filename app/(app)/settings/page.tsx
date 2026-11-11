import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { AppearanceSettings } from '@/components/settings/appearance-settings'
import { PolicySettings } from '@/components/settings/policy-settings'
import { getOrgPolicy } from '@/lib/attendance/queries'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const me = await requireUser()
  const policy = me.role === 'ADMIN' ? await getOrgPolicy() : null

  return (
    <>
      <PageHeader title="Settings" description="Personal preferences and workspace attendance policy." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AppearanceSettings />
        {policy ? (
          <PolicySettings policy={policy} />
        ) : (
          <section className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-semibold">Attendance policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Work hours, late thresholds, and the office geofence are managed by your workspace
              admin.
            </p>
          </section>
        )}
      </div>
    </>
  )
}
