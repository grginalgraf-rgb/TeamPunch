import { Clock3, MapPin, ShieldCheck, Users } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'

const FEATURES = [
  { icon: MapPin, text: 'Location-verified clock-ins' },
  { icon: Clock3, text: 'Live shift and break timers' },
  { icon: Users, text: 'Real-time team presence for managers' },
]

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSessionUser()) redirect('/')

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-12 bg-ink p-12 text-ink-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clock3 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">Kintai Cloud</span>
        </div>

        <div className="flex flex-col gap-8">
          <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-balance xl:text-5xl">
            Every shift, <span className="text-primary">punched in</span> with proof.
          </p>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-ink-muted">
                <span className="flex size-9 items-center justify-center rounded-lg border border-ink-border bg-ink-raised text-ink-foreground">
                  <feature.icon className="size-4" aria-hidden="true" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Secured with encrypted sessions
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-4 py-12">{children}</main>
    </div>
  )
}
