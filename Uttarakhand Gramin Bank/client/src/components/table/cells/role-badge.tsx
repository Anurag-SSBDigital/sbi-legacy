import { cn } from '@/lib/utils.ts'
import { Badge } from '@/components/ui/badge.tsx'

const RoleBadge = ({ role }: { role: string }) => {
  const roleClasses = cn('font-semibold', {
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200':
      role === 'Admin' || role === 'Super Admin',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
      role.includes('Auditor'),
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200':
      role === 'Advocate',
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': ![
      'Admin',
      'Super Admin',
      'Auditor',
      'Stock Auditor',
      'Advocate',
    ].includes(role),
  })

  return <Badge className={roleClasses}>{role}</Badge>
}

export default RoleBadge
