import { Phone } from 'lucide-react'

interface MobileCellProps {
  value: string
}

export default function MobileCell({ value }: MobileCellProps) {
  return (
    <div className='flex items-center gap-2'>
      <Phone className='h-4 w-4 text-gray-500' />
      <span>{value}</span>
    </div>
  )
}
