'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const INTERVAL_MS = 30_000

export function AutoRefresh() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') startTransition(() => router.refresh())
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
      >
        <RefreshCw className={cn(pending && 'animate-spin')} aria-hidden="true" />
        Refresh
      </Button>
    </div>
  )
}
