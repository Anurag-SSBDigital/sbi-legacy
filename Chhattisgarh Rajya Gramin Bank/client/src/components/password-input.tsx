// src/components/password-input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false)

  return (
    <div className='relative'>
      <Input
        type={show ? 'text' : 'password'}
        className={cn(
          // match your Username input exactly + add padding for the toggle
          'h-11 rounded-xl border-(--color-input) bg-(--color-card)',
          'text-(--color-foreground) placeholder:text-(--color-muted-foreground)',
          'shadow-[0_6px_20px_-12px_rgba(0,0,0,.35)] transition-all',
          'hover:border-(--color-ring)',
          'focus-visible:ring-2 focus-visible:ring-(--color-ring)',
          'focus-visible:border-(--color-primary)',
          'pr-10', // space for the eye icon
          className
        )}
        {...props}
      />
      <button
        type='button'
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((s) => !s)}
        className={cn(
          // 1. Positioning: "top-1/2 -translate-y-1/2" guarantees vertical center
          'absolute top-1/2 right-2 -translate-y-1/2',

          // 2. Alignment: Flexbox centers the SVG inside the button
          'flex h-7 w-7 items-center justify-center rounded-md',

          // 3. Colors: "text-muted-foreground" works with stroke='currentColor' in the SVG
          'text-muted-foreground hover:text-foreground',

          // 4. Focus: Standard ring for accessibility
          'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        {/* simple eye glyph with currentColor; replace with your icon if you have one */}
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          {show ? (
            // State A: Password Visible (Eye with Slash)
            <>
              <path
                d='M9.88 9.88a3 3 0 1 0 4.24 4.24'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M10.73 5.05A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.8 0 1.6-.06 2.37-.17'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <line
                x1='2'
                y1='2'
                x2='22'
                y2='22'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </>
          ) : (
            // State B: Password Hidden (Your Original Eye)
            <>
              <path
                d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle
                cx='12'
                cy='12'
                r='3.2'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
