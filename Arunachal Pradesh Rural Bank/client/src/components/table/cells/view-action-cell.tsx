import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewActionCellProps {
  onClick: () => void
}

export default function ViewActionCell({ onClick }: ViewActionCellProps) {
  return (
    <Button size='sm' variant='outline' onClick={onClick}>
      <Eye className='h-4 w-4' />
      View
    </Button>
  )
}
