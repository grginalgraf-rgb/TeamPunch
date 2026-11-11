import { eq } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export type Role = 'EMPLOYEE' | 'ADMIN'
export type ActiveView = 'employee' | 'manager'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}

export const VIEW_COOKIE = 'kintai-view'

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  // Role is read from the database so a demotion takes effect immediately.
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  if (!row) return null

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: row.role,
  }
})

export async function requireUser() {
  const me = await getSessionUser()
  if (!me) redirect('/sign-in')
  return me
}

export async function requireAdmin() {
  const me = await requireUser()
  if (me.role !== 'ADMIN') redirect('/')
  return me
}

export async function getActiveView(me: SessionUser): Promise<ActiveView> {
  if (me.role !== 'ADMIN') return 'employee'
  const value = (await cookies()).get(VIEW_COOKIE)?.value
  return value === 'employee' ? 'employee' : 'manager'
}
