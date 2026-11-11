'use client'

import useSWR from 'swr'
import { getEmployeeLog } from '@/app/actions/attendance'
import { HistoryTable } from '@/components/attendance/history-table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { RosterEntry } from '@/lib/attendance/shifts'

async function fetchLog(userId: string) {
  const result = await getEmployeeLog(userId)
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export function EmployeeLogSheet({
  employee,
  timeZone,
  onOpenChange,
}: {
  employee: RosterEntry | null
  timeZone: string
  onOpenChange: (open: boolean) => void
}) {
  const { data, error, isLoading } = useSWR(
    employee ? ['employee-log', employee.id] : null,
    ([, id]) => fetchLog(id),
  )

  return (
    <Sheet open={employee !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b p-6">
          <SheetTitle>{employee?.name ?? 'Employee'}</SheetTitle>
          <SheetDescription>Last 20 shifts, including location and break time.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {error && (
            <p className="p-6 text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
          {data && (
            <HistoryTable
              shifts={data.shifts}
              initialNow={Date.now()}
              timeZone={timeZone}
              showLocation
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
