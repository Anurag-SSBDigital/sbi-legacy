import { Eye } from 'lucide-react'
import { Button } from './button.tsx'

interface ViewButtonProps {
  variant?:
    | 'link'
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | null
    | undefined
  size?: 'default' | 'sm' | 'lg' | 'icon' | null | undefined
  className?: string | undefined
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export default function ViewButton({
  size = 'sm',
  variant = 'outline',
  className,
  onClick,
}: ViewButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      className={className}
    >
      <Eye className='mr-1 h-4 w-4' />
      View
    </Button>
  )
}
