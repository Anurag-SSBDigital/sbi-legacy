import type { components } from '@/types/api/v1.d.ts'
import { Briefcase, Building, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import { Badge } from '@/components/ui/badge.tsx'

const AssignmentCell = ({ row }: { row: components['schemas']['User'] }) => {
  let label = 'System'
  let icon = <ShieldCheck className='h-4 w-4' />
  let badgeClasses =
    'inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'

  if (row.departmentName) {
    label = `Department: ${row.departmentName}`
    icon = <Briefcase className='h-4 w-4' />
    badgeClasses =
      'inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
  } else if (row.branchName) {
    label = `Branch: ${row.branchName}`
    icon = <Building className='h-4 w-4' />
    badgeClasses =
      'inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  }

  return (
    <Badge className={cn('rounded-md text-xs', badgeClasses)}>
      {icon}
      <span>{label}</span>
    </Badge>
  )
}

export default AssignmentCell
