/* ----------------------------------------- */
/* components/status-pill.tsx                */
/* ----------------------------------------- */
import { CheckCircle, Clock, HelpCircle, ThumbsUp, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Status =
  | 'Completed'
  | 'Accepted'
  | 'APPROVED'
  | 'REJECTED'
  | 'Pending'
  | 'Rejected'
  | 'PENDING_APPROVAL'
  | 'Unknown'

export interface StatusPillProps {
  status: Status
  className?: string
}

const statusMap: Record<
  Status,
  {
    icon: React.ElementType
    classes: string
  }
> = {
  APPROVED: {
    icon: CheckCircle,
    classes:
      'border-none bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  },
  Completed: {
    icon: CheckCircle,
    classes:
      'border-none bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  },
  Accepted: {
    icon: ThumbsUp,
    classes:
      'border-none bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
  Pending: {
    icon: Clock,
    classes:
      'border-none bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  },
  PENDING_APPROVAL: {
    icon: Clock,
    classes:
      'border-none bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  },
  REJECTED: {
    icon: XCircle,
    classes:
      'border-none bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  Rejected: {
    icon: XCircle,
    classes:
      'border-none bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  Unknown: {
    icon: HelpCircle, // Fallback icon
    classes:
      'border-none bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300', // Fallback style
  },
}

export function StatusPillCell({
  status,
}: {
  status: StatusPillProps['status']
}) {
  const { icon: Icon, classes } = statusMap[status] || statusMap.Unknown // Fallback to 'Unknown' if status is not found

  return (
    <Badge
      variant='outline'
      className={`gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${classes}`}
    >
      <Icon size={14} strokeWidth={2} />
      {status}
    </Badge>
  )
}

export default StatusPillCell
