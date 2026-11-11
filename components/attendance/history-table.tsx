'use client'

import { Flag, MapPin } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useNow } from '@/hooks/use-now'
import {
  breakMs,
  formatDate,
  formatHours,
  formatTime,
  netMs,
  type ShiftDTO,
} from '@/lib/attendance/shifts'
import { StatusBadge } from './status-badge'

export function HistoryTable({
  shifts,
  initialNow,
  timeZone,
  showLocation = false,
}: {
  shifts: ShiftDTO[]
  initialNow: number
  timeZone: string
  showLocation?: boolean
}) {
  const now = useNow(initialNow, 15000)

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
        <p className="text-sm font-medium">No shifts recorded yet</p>
        <p className="text-sm text-muted-foreground">Shifts appear here after the first clock-in.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">Date</TableHead>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Break Time</TableHead>
          <TableHead>Net Hours</TableHead>
          {showLocation && <TableHead>Location</TableHead>}
          <TableHead className="pr-6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shifts.map((shift) => (
          <TableRow key={shift.id}>
            <TableCell className="pl-6 font-medium">
              <span className="flex items-center gap-2">
                {formatDate(shift.clockIn, timeZone)}
                {shift.flagged && (
                  <Tooltip>
                    <TooltipTrigger
                      render={<span className="inline-flex text-destructive" />}
                      aria-label={`Flagged: ${shift.flagReason ?? 'No reason given'}`}
                    >
                      <Flag className="size-3.5" aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent>{shift.flagReason ?? 'Flagged by a manager'}</TooltipContent>
                  </Tooltip>
                )}
              </span>
            </TableCell>
            <TableCell className="tabular-nums">
              <span className="flex items-center gap-2">
                {formatTime(shift.clockIn, timeZone)}
                {shift.isLate && (
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning-strong">
                    Late
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {shift.clockOut ? formatTime(shift.clockOut, timeZone) : '—'}
            </TableCell>
            <TableCell className="tabular-nums">{formatHours(breakMs(shift, now))}</TableCell>
            <TableCell className="font-medium tabular-nums">{formatHours(netMs(shift, now))}</TableCell>
            {showLocation && (
              <TableCell>
                {shift.latitude !== null && shift.longitude !== null ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {shift.latitude.toFixed(3)}, {shift.longitude.toFixed(3)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )}
            <TableCell className="pr-6">
              <StatusBadge status={shift.clockOut ? 'COMPLETED' : shift.status === 'BREAK' ? 'BREAK' : 'ACTIVE'} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
