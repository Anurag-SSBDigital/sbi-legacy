import type { components } from '@/types/api/v1.d.ts'
import { User as UserIcon } from 'lucide-react'

const UserCell = ({ row }: { row: components['schemas']['User'] }) => (
  <div className='flex items-center gap-3'>
    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700'>
      <UserIcon className='h-5 w-5 text-gray-500 dark:text-gray-400' />
    </div>
    <div>
      <div className='font-medium text-gray-800 dark:text-gray-100'>
        {row.fullName || row.name}
      </div>
      <div className='text-sm text-gray-500 dark:text-gray-400'>
        {row.email}
      </div>
    </div>
  </div>
)

export default UserCell
