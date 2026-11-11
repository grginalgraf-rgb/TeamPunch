'use client'

import { AlertCircle, Clock3, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

type Mode = 'sign-in' | 'sign-up'

const COPY = {
  'sign-in': {
    title: 'Welcome back',
    subtitle: 'Sign in to clock in and review your shifts.',
    submit: 'Sign in',
    switchText: 'New to Kintai Cloud?',
    switchLink: 'Create an account',
    switchHref: '/sign-up',
  },
  'sign-up': {
    title: 'Create your account',
    subtitle: 'The first account in a workspace becomes its admin.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchHref: '/sign-in',
  },
} as const

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const copy = COPY[mode]

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const { error: authError } =
      mode === 'sign-up'
        ? await authClient.signUp.email({
            email,
            password,
            name: String(form.get('name') ?? '').trim(),
          })
        : await authClient.signIn.email({ email, password })

    if (authError) {
      console.error('[auth] request failed', authError.status)
      setError(
        mode === 'sign-up'
          ? 'We could not create that account. Try a different email or a longer password.'
          : 'That email and password combination did not work.',
      )
      setPending(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Clock3 className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{copy.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        {error && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === 'sign-up' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
          {mode === 'sign-up' && (
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          )}
        </div>
        <Button type="submit" size="lg" className="mt-2 h-10" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {copy.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {copy.switchText}{' '}
        <Link href={copy.switchHref} className="font-medium text-accent-foreground underline decoration-primary decoration-2 underline-offset-4">
          {copy.switchLink}
        </Link>
      </p>
    </div>
  )
}
