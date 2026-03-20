import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'

export default function EditActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className='hover:bg-[#0fc2c0] hover:text-white'
      size='icon'
      variant='outline'
      onClick={onClick}
    >
      <Pencil className='h-4 w-4' />
      <span className='sr-only'>Edit</span>
    </Button>
  )
}
