'use client'

import { Crosshair, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateOrgPolicy } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OrgPolicy } from '@/lib/attendance/shifts'

export function PolicySettings({ policy }: { policy: OrgPolicy }) {
  const [form, setForm] = useState({
    timezone: policy.timezone,
    workStart: policy.workStart,
    graceMinutes: String(policy.graceMinutes),
    geofenceLat: policy.geofenceLat?.toString() ?? '',
    geofenceLng: policy.geofenceLng?.toString() ?? '',
    geofenceRadiusM: String(policy.geofenceRadiusM),
  })
  const [pending, startTransition] = useTransition()
  const [locating, setLocating] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not available in this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          geofenceLat: pos.coords.latitude.toFixed(6),
          geofenceLng: pos.coords.longitude.toFixed(6),
        }))
        setLocating(false)
      },
      () => {
        toast.error('Location permission was denied.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateOrgPolicy({
        timezone: form.timezone.trim(),
        workStart: form.workStart,
        graceMinutes: Number(form.graceMinutes),
        geofenceLat: form.geofenceLat.trim() === '' ? null : Number(form.geofenceLat),
        geofenceLng: form.geofenceLng.trim() === '' ? null : Number(form.geofenceLng),
        geofenceRadiusM: Number(form.geofenceRadiusM),
      })
      if (result.ok) toast.success('Attendance policy saved')
      else toast.error(result.error)
    })
  }

  return (
    <section
      aria-labelledby="policy-heading"
      className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2"
    >
      <div className="flex flex-col gap-1">
        <h2 id="policy-heading" className="text-base font-semibold">
          Attendance policy
        </h2>
        <p className="text-sm text-muted-foreground">
          Used to mark late arrivals and off-site clock-ins for everyone in the workspace.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="sr-only">Work hours</legend>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone}
              onChange={update('timezone')}
              placeholder="Asia/Tokyo"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="work-start">Work starts at</Label>
            <Input id="work-start" type="time" value={form.workStart} onChange={update('workStart')} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grace">Grace period (min)</Label>
            <Input
              id="grace"
              type="number"
              min={0}
              max={120}
              value={form.graceMinutes}
              onChange={update('graceMinutes')}
              required
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Office geofence</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={form.geofenceLat}
                onChange={update('geofenceLat')}
                placeholder="Not set"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={form.geofenceLng}
                onChange={update('geofenceLng')}
                placeholder="Not set"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="radius">Radius (m)</Label>
              <Input
                id="radius"
                type="number"
                min={25}
                max={50000}
                value={form.geofenceRadiusM}
                onChange={update('geofenceRadiusM')}
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Leave latitude and longitude empty to skip geofence checks.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
              Use my location
            </Button>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save policy
          </Button>
        </div>
      </form>
    </section>
  )
}
