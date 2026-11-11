'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { flagEntry } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { RosterEntry } from '@/lib/attendance/shifts'

export function FlagDialog({
  employee,
  onOpenChange,
}: {
  employee: RosterEntry | null
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!employee?.latestShiftId) return
    const id = employee.latestShiftId
    const name = employee.name
    startTransition(async () => {
      const result = await flagEntry(id, reason)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Flagged ${name}'s latest entry`)
      setReason('')
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Flag entry</DialogTitle>
            <DialogDescription>
              {employee ? `Mark ${employee.name}'s latest shift for review.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="flag-reason">Reason</Label>
            <Textarea
              id="flag-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Clock-out time looks incorrect"
              maxLength={200}
              required
              minLength={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || reason.trim().length < 3}>
              {pending ? 'Flagging…' : 'Flag entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
