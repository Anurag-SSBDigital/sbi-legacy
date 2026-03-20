/* --------------------------------------------- */
/* components/long-text-cell.tsx                 */
/* --------------------------------------------- */
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface LongTextCellProps {
  /** The text you want to show in the cell */
  value: string
  /** Optional: set a custom max-width (Tailwind class, default w-48 = 12 rem) */
  maxWidthClass?: string
}

export function LongTextCell({
  value,
  maxWidthClass = 'w-48',
}: LongTextCellProps) {
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger
        asChild
        className={`${maxWidthClass} cursor-default overflow-hidden text-ellipsis whitespace-nowrap`}
      >
        {/*  
          Use a <span> rather than <div> so the cell respects inline-flow
          and plays nicely with TanStack Table’s flex layout.
        */}
        <span>{value}</span>
      </HoverCardTrigger>

      <HoverCardContent className='max-w-sm whitespace-pre-wrap'>
        {value}
      </HoverCardContent>
    </HoverCard>
  )
}
