import * as React from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header text shown at the top-left */
  title: string
  /** Optional element (button, dropdown…) shown top-right */
  rightAction?: React.ReactNode
}

export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ title, rightAction, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-4 rounded-lg border p-4 shadow-sm', className)}
      {...rest}
    >
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>{title}</h3>
        {rightAction}
      </div>

      {children}
    </div>
  )
)
SectionCard.displayName = 'SectionCard'
