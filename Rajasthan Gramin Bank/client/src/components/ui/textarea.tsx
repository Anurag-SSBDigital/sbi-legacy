import * as React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: string
  error?: string
}

export function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: TextareaProps) {
  const autoId = React.useId()
  const textareaId = id ?? autoId

  return (
    <div className='grid w-full gap-1.5'>
      {label && (
        <label
          htmlFor={textareaId}
          className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        data-slot='textarea'
        aria-invalid={!!error}
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        {...props}
      />

      {error && (
        <p className='text-destructive mt-1 text-sm' role='alert'>
          {error}
        </p>
      )}
    </div>
  )
}
