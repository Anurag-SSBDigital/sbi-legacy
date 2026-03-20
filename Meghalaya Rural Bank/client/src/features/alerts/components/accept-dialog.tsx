import { components } from '@/types/api/v1.js'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'

interface AcceptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: components['schemas']['AlertResolution'] | null
  comment: string
  onCommentChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function AcceptDialog({
  open,
  onOpenChange,
  row,
  comment,
  onCommentChange,
  onSubmit,
  isLoading,
}: AcceptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h3 className='text-lg font-medium'>Confirm Accept</h3>
        </DialogHeader>

        {row && (
          <div className='grid grid-cols-2 gap-4 py-4'>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>Resolution ID</p>
              <p className='text-sm'>{row.id}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>Alert Type</p>
              <p className='text-sm'>{row.alertType}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>
                Resolution Text
              </p>
              <p className='text-sm'>{row.resolutionText}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>Status</p>
              <p className='text-sm'>{row.status}</p>
            </div>
            {row.createdAt && (
              <div className='space-y-2'>
                <p className='text-sm font-medium text-gray-500'>Created At</p>
                <p className='text-sm'>
                  {new Date(row.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>Created By</p>
              <p className='text-sm'>{row.createdBy}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-500'>Updated At</p>
              <p className='text-sm'>
                {row.updatedAt
                  ? new Date(row.updatedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            {row.documents && row.documents.length > 0 && (
              <div className='space-y-2'>
                <p className='text-sm font-medium text-gray-500'>Documents</p>
                <ul className='list-disc pl-5'>
                  {row.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.documentPath}
                        target='_blank'
                        className='text-blue-500 hover:underline'
                      >
                        {doc.documentName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className='space-y-2'>
          <p className='text-sm font-medium text-gray-500'>Comment</p>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder='Enter your comment here...'
          />
        </div>

        <p>Are you sure you want to accept this alert?</p>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Accepting...' : 'Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
