import { Button } from '@/components/ui/button'

interface EditActionCellProps {
  onClick: () => void
}

export default function EditActionCell({ onClick }: EditActionCellProps) {
  return (
    <Button size='sm' variant='outline' onClick={onClick}>
      Edit
    </Button>
  )
}
