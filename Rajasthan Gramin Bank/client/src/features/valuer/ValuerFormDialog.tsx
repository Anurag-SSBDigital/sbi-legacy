import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ValuerForm = {
  id?: number
  valuerName: string
  fullName: string
  emailId: string
  mobileNo: string
  regNumber: string
  empanelmentNo: string
  address: string
  isActive: boolean
}

interface ValuerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ValuerForm) => void
  isSubmitting: boolean
  initialData?: ValuerForm | null
}

const defaultValues: ValuerForm = {
  valuerName: '',
  fullName: '',
  emailId: '',
  mobileNo: '',
  regNumber: '',
  empanelmentNo: '',
  address: '',
  isActive: true,
}

export function ValuerFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: ValuerFormDialogProps) {
  const isEditMode = initialData != null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ValuerForm>({
    defaultValues: initialData || defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(initialData || defaultValues)
    }
  }, [open, initialData, reset])

  const inputFields: Array<
    [keyof ValuerForm, string, string, string?, object?]
  > = [
    [
      'valuerName',
      'Valuer Name *',
      'text',
      'e.g., ABC Associates',
      {
        minLength: { value: 2, message: 'Valuer Name is too short.' },
      },
    ],
    [
      'fullName',
      'Full Name *',
      'text',
      'e.g., John Michael Doe',
      {
        minLength: { value: 2, message: 'Full Name is too short.' },
      },
    ],
    [
      'emailId',
      'Email ID *',
      'email',
      'e.g., john.doe@example.com',
      {
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address',
        },
      },
    ],
    [
      'mobileNo',
      'Mobile No. *',
      'tel',
      'e.g., 9876543210',
      {
        pattern: {
          value: /^[0-9]{10}$/,
          message: 'Mobile number must be 10 digits.',
        },
      },
    ],
    ['regNumber', 'Registration No *', 'text', 'e.g., REG123456'],
    ['empanelmentNo', 'Empanelment No *', 'text', 'e.g., EMP789101'],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
            {isEditMode ? 'Edit Valuer' : 'Create New Valuer'}
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Fill in the details below. Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>
        <form
          id='valuer-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-2 px-6'
        >
          {/* Input fields mapping */}
          {inputFields.map(([name, label, type, placeholder, validation]) => (
            <div key={name} className='grid gap-1.5'>
              <Label
                htmlFor={name as string}
                className='font-medium text-gray-700 dark:text-gray-300'
              >
                {label}
              </Label>
              <Input
                id={name as string}
                type={type}
                placeholder={
                  placeholder ||
                  `Enter ${label.replace(' *', '').toLowerCase()}`
                }
                {...register(name as keyof ValuerForm, {
                  required: `${label.replace(' *', '')} is required.`,
                  ...(validation || {}),
                })}
                className={`dark:border-gray-600 dark:bg-gray-700 ${
                  errors[name]
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors[name] && (
                <p className='pt-1 text-sm text-red-500'>
                  {errors[name]?.message as string}
                </p>
              )}
            </div>
          ))}

          {/* Address Textarea */}
          <div className='grid gap-1.5'>
            <Label
              htmlFor='address'
              className='font-medium text-gray-700 dark:text-gray-300'
            >
              Address *
            </Label>
            <Textarea
              id='address'
              placeholder='Enter full address'
              {...register('address', { required: 'Address is required.' })}
              className={`min-h-[80px] dark:border-gray-600 dark:bg-gray-700 ${
                errors.address
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.address && (
              <p className='pt-1 text-sm text-red-500'>
                {errors.address?.message as string}
              </p>
            )}
          </div>

          {/* IsActive Checkbox */}
          <div className='flex items-center space-x-2 pt-2'>
            <Controller
              name='isActive'
              control={control}
              render={({ field }) => (
                <Checkbox
                  id='isActive'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className='dark:border-gray-600'
                />
              )}
            />
            <Label
              htmlFor='isActive'
              className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300'
            >
              Is Active
            </Label>
          </div>
        </form>
        <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' form='valuer-form' disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : isEditMode
                ? 'Save Changes'
                : 'Save Valuer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
