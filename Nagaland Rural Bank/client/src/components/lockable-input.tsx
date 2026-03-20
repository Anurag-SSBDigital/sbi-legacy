/* eslint-disable @typescript-eslint/no-explicit-any */
// oxlint-disable no-explicit-any
import { useState, useEffect } from 'react'
import {
  UseControllerProps,
  useController,
  useFormContext,
} from 'react-hook-form'
import { Lock, LockOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// Helper to safely get nested object values (e.g., "user.address.city")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDeepValue(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

interface LockableInputProps extends UseControllerProps<any> {
  label: string
  placeholder?: string
  type?: string
  className?: string
}

export function LockableInput({
  label,
  placeholder,
  type = 'text',
  className,
  ...props
}: LockableInputProps) {
  const { field } = useController(props)
  // We need the context to access the loaded defaultValues
  const {
        formState: { defaultValues },
  } = useFormContext()

  const [isLocked, setIsLocked] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // EFFECT: Auto-lock ONLY when data first loads from the API
  useEffect(() => {
    if (!hasInitialized && defaultValues) {
      const initialValue = getDeepValue(defaultValues, props.name)

      // Logic: If there is a value (and it's not just an empty string), lock it.
      if (
        initialValue !== undefined &&
        initialValue !== '' &&
        initialValue !== null
      ) {
        setIsLocked(true)
      }
      setHasInitialized(true)
    }
  }, [defaultValues, props.name, hasInitialized])

  const toggleLock = () => {
    setIsLocked((prev) => !prev)
  }

  return (
    <FormItem className={className}>
      <FormLabel className='flex items-center gap-2'>
        {label}
        {/* {isLocked && <span className="text-[10px] font-normal text-muted-foreground"></span>} */}
      </FormLabel>
      <div className='relative flex items-center'>
        <FormControl>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={isLocked} // The disable magic
            // Add padding-right so text doesn't hide behind the lock icon
            className={cn(
              'pr-10',
              isLocked && 'bg-muted text-muted-foreground opacity-100'
            )}
          />
        </FormControl>

        {/* The Lock/Unlock Trigger */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={toggleLock}
          className='text-muted-foreground hover:text-foreground absolute top-0 right-0 h-full px-3'
          title={isLocked ? 'Unlock to edit' : 'Lock field'}
        >
          {isLocked ? (
            <Lock className='h-4 w-4' />
          ) : (
            <LockOpen className='h-4 w-4' />
          )}
        </Button>
      </div>
      <FormMessage />
    </FormItem>
  )
}
