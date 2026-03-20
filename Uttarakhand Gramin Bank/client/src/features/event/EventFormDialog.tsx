import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type EventForm = { id?: number; eventType: string }

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (values: EventForm) => void
  isSubmitting?: boolean
  initialData: EventForm | null
}

export const EventFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const [eventType, setEventType] = React.useState('')

  React.useEffect(() => {
    setEventType(initialData?.eventType ?? '')
  }, [initialData, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = eventType.trim()
    if (!trimmed) return
    onSubmit({ id: initialData?.id, eventType: trimmed })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData?.id ? 'Edit Event Type' : 'New Event Type'}
            </DialogTitle>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='eventType'>Event Type</Label>
              <Input
                id='eventType'
                placeholder='e.g., Hypothecation, Mortgage'
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || !eventType.trim()}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// export BOTH ways to satisfy any import style
export default EventFormDialog
