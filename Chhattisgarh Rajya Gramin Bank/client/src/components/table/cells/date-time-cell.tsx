/* ---------------------------------------------------- */
/* components/date-time-cell.tsx                        */
/* ---------------------------------------------------- */
import { format, parseISO } from 'date-fns'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface DateTimeCellProps {
  /** ISO-8601 datetime string, e.g. 2025-01-08T12:44:07.100726 */
  value: string
  /**
   * Display format for the main cell (date-fns tokens).
   * Default: "dd MMM yyyy · hh:mm a" → 08 Jan 2025 · 12:44 PM
   */
  displayFormat?: string
}

export function DateTimeCell({
  value,
  displayFormat = 'dd MMM yyyy · hh:mm a',
}: DateTimeCellProps) {
  let formatted = value
  let full = value

  try {
    const date = parseISO(value)
    formatted = format(date, displayFormat)
    // Full ISO without microseconds makes the hover easier to read
    full = date.toISOString().replace('Z', '')
  } catch {
    /* keep the original string if parsing fails */
  }

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild className='cursor-default whitespace-nowrap'>
        <span>{formatted}</span>
      </HoverCardTrigger>

      {/* Show the complete timestamp on hover */}
      <HoverCardContent className='whitespace-nowrap'>{full}</HoverCardContent>
    </HoverCard>
  )
}

export default DateTimeCell
