import { Badge } from '@/components/ui/badge'

// New SeverityLevelCell component with className styles
export default function SeverityLevelCell({
  value,
}: {
  value: 'HIGH' | 'MEDIUM' | 'LOW'
}) {
  let className = 'text-xs font-medium px-2 py-0.5 rounded'

  if (value === 'HIGH') {
    className += ' bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  } else if (value === 'MEDIUM') {
    className +=
      ' bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
  } else if (value === 'LOW') {
    className +=
      ' bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
  }

  return <Badge className={className}>{value}</Badge>
}
