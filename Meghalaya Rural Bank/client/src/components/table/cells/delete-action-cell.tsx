import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog'

interface DeleteActionCellProps {
  onConfirm: () => void
  isConfirming: boolean
  title: string
  description?: string
}

export default function DeleteActionCell({
  onConfirm,
  isConfirming,
  title,
  description,
}: DeleteActionCellProps) {
  return (
    <ConfirmDeleteDialog
      title={title}
      description={description}
      onConfirm={onConfirm}
      isConfirming={isConfirming}
    >
      <Button type='button' variant='destructive' size='sm'>
        <Trash2 className='h-4 w-4' />
      </Button>
    </ConfirmDeleteDialog>
  )
}
