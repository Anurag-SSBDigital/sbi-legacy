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

// A single, reusable type for the auditor form data
export type AuditorForm = {
  id?: number
  auditorName: string
  fullName: string
  emailId: string
  mobileNo: string
  company: string
  empanelmentDate: string
  empanelmentExpiryDate: string
  address: string
  isActive: boolean
}

interface AuditorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AuditorForm) => void
  isSubmitting: boolean
  initialData?: AuditorForm | null // Optional data for pre-filling the form in edit mode
}

// Default values for creating a new auditor
const defaultValues: AuditorForm = {
  auditorName: '',
  fullName: '',
  emailId: '',
  mobileNo: '',
  company: '',
  empanelmentDate: '',
  empanelmentExpiryDate: '',
  address: '',
  isActive: true,
}

export function AuditorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: AuditorFormDialogProps) {
  const isEditMode = initialData != null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AuditorForm>({
    defaultValues: initialData || defaultValues,
  })

  // This effect listens for changes to the dialog's open state or the initial data.
  // It resets the form to the correct state (empty for create, pre-filled for edit).
  useEffect(() => {
    if (open) {
      reset(initialData || defaultValues)
    }
  }, [open, initialData, reset])

  const inputFields: Array<
    [keyof AuditorForm, string, string, string?, object?]
  > = [
    ['auditorName', 'Auditor Name *', 'text', 'e.g., Raghav'],
    ['fullName', 'Full Name *', 'text', 'e.g., Raghav Chauhan'],
    [
      'emailId',
      'Email ID *',
      'email',
      'e.g., raghav.ch@example.com',
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
      'e.g., 7600592662',
      {
        pattern: {
          value: /^[0-9]{10}$/,
          message: 'Mobile number must be 10 digits.',
        },
      },
    ],
    ['company', 'Company *', 'text', 'e.g., AAA'],
    ['empanelmentDate', 'Empanelment Date *', 'date', ''],
    ['empanelmentExpiryDate', 'Empanelment Expiry Date *', 'date', ''],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
            {isEditMode ? 'Edit Auditor' : 'Create New Auditor'}
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Fill in the details below. Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>

        <form
          id='auditor-form' // Unique form ID
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-5 px-6 pt-2 pb-2'
        >
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
                {...register(name as keyof AuditorForm, {
                  required: `${label.replace(' *', '')} is required.`,
                  ...(validation || {}),
                })}
                className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors[name] && (
                <p className='pt-1 text-sm text-red-500'>
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}

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
              className={`min-h-[80px] dark:border-gray-600 dark:bg-gray-700 ${errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {errors.address && (
              <p className='pt-1 text-sm text-red-500'>
                {errors.address?.message}
              </p>
            )}
          </div>

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
            form='auditor-form'
            disabled={isSubmitting}
            className='text-white'
          >
            {isSubmitting
              ? 'Saving...'
              : isEditMode
                ? 'Save Changes'
                : 'Save Auditor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
