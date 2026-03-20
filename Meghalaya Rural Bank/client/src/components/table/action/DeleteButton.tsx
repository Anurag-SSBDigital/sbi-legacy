import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'

export default function DeleteActionButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <Button
      className='bg-[#BF665E]'
      size='icon'
      variant='destructive'
      onClick={onClick}
    >
      <Trash2 className='h-4 w-4' />
    </Button>
  )
}
