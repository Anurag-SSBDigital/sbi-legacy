import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // oxlint-disable-next-line no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any | null
  comment: string
  onCommentChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function RejectDialog({
  open,
  onOpenChange,
  row,
  comment,
  onCommentChange,
  onSubmit,
  isLoading,
}: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h3 className='text-lg font-medium'>Reject Alert</h3>
        </DialogHeader>

        {row && (
          <div className='mb-4 space-y-1 text-sm'>
            <p>
              <strong>Account Number:</strong> {row.acctNumber}
            </p>
            <p>
              <strong>Description:</strong> {row.description}
            </p>
            <p>
              <strong>Date:</strong> {row.createdAt}
            </p>
            <p>
              <strong>Status:</strong> {row.status}
            </p>
          </div>
        )}

        <div className='mb-4'>
          <label
            htmlFor='reject-comment'
            className='mb-2 block text-sm font-medium text-gray-700'
          >
            Rejection Comment
          </label>
          <Input
            id='reject-comment'
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder='Enter rejection comment'
            required
          />
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!comment.trim() || isLoading}>
            {isLoading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
