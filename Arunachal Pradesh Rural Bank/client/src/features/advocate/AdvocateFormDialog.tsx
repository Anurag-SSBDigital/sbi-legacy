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

// The form data structure remains the same
type AdvocateForm = {
  id?: number
  advocateName: string
  fullName: string
  emailId: string
  mobileNo: string
  barRegNumber: string
  empanelmentNo: string
  address: string
  isActive: boolean
}

// Props are updated for reusability
interface AdvocateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AdvocateForm) => void // Generic onSubmit prop
  isSubmitting: boolean // Receive submission state from parent
  initialData?: AdvocateForm | null // Optional initial data for editing
}

// The default values for a new advocate entry
const defaultValues: AdvocateForm = {
  advocateName: '',
  fullName: '',
  emailId: '',
  mobileNo: '',
  barRegNumber: '',
  empanelmentNo: '',
  address: '',
  isActive: true,
}

export function AdvocateFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: AdvocateFormDialogProps) {
  const isEditMode = initialData != null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AdvocateForm>({
    defaultValues: initialData || defaultValues,
  })

  // Effect to reset the form when the dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      reset(initialData || defaultValues)
    }
  }, [open, initialData, reset])

  const inputFields: Array<
    [keyof AdvocateForm, string, string, string?, object?]
  > = [
    ['advocateName', 'Advocate Name *', 'text', 'e.g., John'],
    ['fullName', 'Full Name *', 'text', 'e.g., John Michael Doe'],
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
    ['barRegNumber', 'Bar Registration No *', 'text', 'e.g., BRN123456'],
    ['empanelmentNo', 'Empanelment No *', 'text', 'e.g., EMP789101'],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
            {isEditMode ? 'Edit Advocate' : 'Create New Advocate'}
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Fill in the details below. Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>
        <form
          id='advocate-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-5 px-6 pt-2 pb-2'
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
                {...register(name as keyof AdvocateForm, {
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
                  {errors[name]?.message}
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
                {errors.address?.message}
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
          <Button
            type='submit'
            form='advocate-form'
            disabled={isSubmitting}
            className='text-white'
          >
            {isSubmitting
              ? 'Saving...'
              : isEditMode
                ? 'Save Changes'
                : 'Save Advocate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
