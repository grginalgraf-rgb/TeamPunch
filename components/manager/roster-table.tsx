'use client'

import { Flag, FlagOff, MapPinOff, MoreHorizontal, ScrollText, Search } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { clearFlag } from '@/app/actions/attendance'
import { StatusBadge } from '@/components/attendance/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNow } from '@/hooks/use-now'
import {
  formatHours,
  formatTime,
  initials,
  netMs,
  type PresenceStatus,
  type RosterEntry,
} from '@/lib/attendance/shifts'
import { cn } from '@/lib/utils'
import { EmployeeLogSheet } from './employee-log-sheet'
import { FlagDialog } from './flag-dialog'

const FILTERS: { value: PresenceStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BREAK', label: 'On Break' },
  { value: 'OFF', label: 'Off-Duty' },
]

export function RosterTable({
  roster,
  initialNow,
  timeZone,
}: {
  roster: RosterEntry[]
  initialNow: number
  timeZone: string
}) {
  const now = useNow(initialNow, 15000)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PresenceStatus | 'ALL'>('ALL')
  const [logFor, setLogFor] = useState<RosterEntry | null>(null)
  const [flagFor, setFlagFor] = useState<RosterEntry | null>(null)
  const [, startTransition] = useTransition()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roster.filter(
      (r) =>
        (filter === 'ALL' || r.presence === filter) &&
        (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
    )
  }, [roster, query, filter])

  function unflag(entry: RosterEntry) {
    if (!entry.latestShiftId) return
    const id = entry.latestShiftId
    startTransition(async () => {
      const result = await clearFlag(id)
      if (result.ok) toast.success(`Cleared flag for ${entry.name}`)
      else toast.error(result.error)
    })
  }

  return (
    <section aria-labelledby="roster-heading" className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 px-6 pt-6 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="roster-heading" className="text-base font-semibold">
            Team roster
          </h2>
          <p className="text-sm text-muted-foreground">Live presence for everyone in the workspace.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-lg border bg-muted/50 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  filter === f.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees"
              aria-label="Search employees"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
          <p className="text-sm font-medium">No employees match</p>
          <p className="text-sm text-muted-foreground">Try a different filter or search term.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last action</TableHead>
              <TableHead>Today</TableHead>
              <TableHead>Alerts</TableHead>
              <TableHead className="pr-6 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((entry) => {
              const today = entry.todayShifts.reduce((sum, s) => sum + netMs(s, now), 0)
              return (
                <TableRow key={entry.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(entry.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{entry.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{entry.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={entry.presence} />
                  </TableCell>
                  <TableCell>
                    {entry.lastAction ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{entry.lastAction.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatTime(entry.lastAction.at, timeZone)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No activity</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">{formatHours(today)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.isLate && (
                        <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning-strong">
                          Late
                        </span>
                      )}
                      {entry.outsideGeofence && (
                        <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning-strong">
                          <MapPinOff className="size-3" aria-hidden="true" />
                          Off-site
                        </span>
                      )}
                      {entry.latestShiftFlagged && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                          <Flag className="size-3" aria-hidden="true" />
                          Flagged
                        </span>
                      )}
                      {!entry.isLate && !entry.outsideGeofence && !entry.latestShiftFlagged && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${entry.name}`} />
                        }
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setLogFor(entry)}>
                          <ScrollText aria-hidden="true" />
                          View full log
                        </DropdownMenuItem>
                        {entry.latestShiftFlagged ? (
                          <DropdownMenuItem onClick={() => unflag(entry)}>
                            <FlagOff aria-hidden="true" />
                            Clear flag
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled={!entry.latestShiftId}
                            onClick={() => setFlagFor(entry)}
                          >
                            <Flag aria-hidden="true" />
                            Flag latest entry
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <EmployeeLogSheet
        employee={logFor}
        timeZone={timeZone}
        onOpenChange={(open) => !open && setLogFor(null)}
      />
      <FlagDialog employee={flagFor} onOpenChange={(open) => !open && setFlagFor(null)} />
    </section>
  )
}
