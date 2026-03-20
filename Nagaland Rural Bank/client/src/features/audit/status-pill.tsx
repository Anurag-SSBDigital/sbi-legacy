export type StatusType = 'STARTED' | 'PENDING' | 'COMPLETED' | 'REJECTED'

interface StatusPillProps {
  status: StatusType
}

/**
 * Renders a small “pill” (badge) styled according to the status value.
 *
 * Usage:
 *   <StatusPill status="STARTED" />
 *   <StatusPill status="PENDING" />
 *   <StatusPill status="COMPLETED" />
 *   <StatusPill status="REJECTED" />
 */
export default function StatusPill({ status }: StatusPillProps) {
  // Decide Tailwind classes based on the status
  let bgColorClass = ''
  let textColorClass = ''

  switch (status) {
    case 'STARTED':
      bgColorClass = 'bg-blue-100'
      textColorClass = 'text-blue-800'
      break
    case 'PENDING':
      bgColorClass = 'bg-yellow-100'
      textColorClass = 'text-yellow-800'
      break
    case 'COMPLETED':
      bgColorClass = 'bg-green-100'
      textColorClass = 'text-green-800'
      break
    case 'REJECTED':
      bgColorClass = 'bg-red-100'
      textColorClass = 'text-red-800'
      break
    default:
      // Fallback styling if someone passes an invalid string
      bgColorClass = 'bg-gray-100'
      textColorClass = 'text-gray-800'
      break
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColorClass} ${textColorClass} `}
    >
      {status}
    </span>
  )
}
