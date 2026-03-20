import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'

interface TooltipCellProps {
  value: string
  maxLength?: number
}

export default function TooltipCell({
  value,
  maxLength = 180,
}: TooltipCellProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className='inline-block truncate'
            style={{ maxWidth: maxLength }}
          >
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent>{value}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
