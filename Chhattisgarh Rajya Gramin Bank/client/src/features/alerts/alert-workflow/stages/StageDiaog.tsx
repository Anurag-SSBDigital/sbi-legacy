import React, { useEffect } from 'react'
import { z } from 'zod'
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { AnimatePresence, motion } from 'framer-motion'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

// -----------------------------------------------------------------------------
// Schema & Types
// -----------------------------------------------------------------------------
const stageSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  stageOrder: z
    .number({
      error: (issue) =>
        issue.input === undefined ? 'Select an sort order' : 'Not a string',
    })
    .positive(),
  stageType: z.enum(['BRANCH', 'DEPARTMENT', 'OTHER'], {
    // required_error: 'Stage type required',
    error: (issue) =>
      issue.input === undefined ? 'Stage type required' : 'Not a string',
  }),
  roleId: z.string().optional(),
  username: z.string().optional().nullable(),
  requiresDocuments: z.boolean(),
  timeLimitDays: z
    .number()
    .int({ message: 'Must be an integer' })
    .positive({ message: 'Must be positive' })
    .optional(),
})

export type StageFormType = z.infer<typeof stageSchema>

// Props are updated to handle edit mode
interface StageDialogProps {
  orderOptions: number[]
  users: { username?: string; fullName?: string }[]
  onSubmit: (data: StageFormType) => void
  isEditMode: boolean
  initialData?: StageFormType
}

const StageDialog: React.FC<StageDialogProps> = ({
  orderOptions,
  users,
  onSubmit,
  isEditMode,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageFormType>({
    resolver: standardSchemaResolver(stageSchema),
    defaultValues: {
      name: '',
      stageType: 'BRANCH',
      requiresDocuments: true,
      roleId: undefined,
      username: undefined,
      timeLimitDays: undefined,
      stageOrder: orderOptions[orderOptions.length - 1],
    },
  })

  // Use useEffect to populate the form with initialData when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      reset(initialData)
    }
  }, [isEditMode, initialData, reset])

  const stageType = useWatch({ control, name: 'stageType' })

  const { data: rolesResp, isLoading: rolesLoading } = $api.useQuery(
    'get',
    '/roles/getAllRoles',
    {
      params: { header: { Authorization: '' } },
      staleTime: 5 * 60 * 1000,
    }
  )
  const roles = rolesResp?.data ?? []

  const submit: SubmitHandler<StageFormType> = (data: StageFormType) => {
    // Clean up optional fields before submitting
    const payload = {
      ...data,
      timeLimitDays: data.timeLimitDays ?? undefined,
    }
    onSubmit(payload)
  } // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <DialogContent className='sm:max-w-lg'>
      {' '}
      <form onSubmit={handleSubmit(submit)} className='space-y-6'>
        {' '}
        <DialogHeader>
          {/* Dialog title changes based on the mode */}{' '}
          <DialogTitle>
            {isEditMode ? 'Edit Stage' : 'Create Stage'}
          </DialogTitle>{' '}
        </DialogHeader>
        {/* Basic section */}{' '}
        <fieldset className='grid gap-4'>
          {/* Name */}{' '}
          <div className='grid grid-cols-4 items-center gap-4'>
            {' '}
            <Label htmlFor='name' className='text-right'>
              Name{' '}
            </Label>{' '}
            <div className='col-span-3 space-y-1'>
              {' '}
              <Input
                id='name'
                placeholder='Stage name'
                {...register('name')}
              />{' '}
              {errors.name && (
                <p className='text-destructive text-xs'>
                  {errors.name.message}{' '}
                </p>
              )}{' '}
            </div>{' '}
          </div>
          {/* Order */}{' '}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>Order</Label>{' '}
            <Controller
              name='stageOrder'
              control={control}
              render={({ field }) => (
                <Select
                  // The Order field is disabled in edit mode
                  disabled={isEditMode}
                  value={field.value?.toString()}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  {' '}
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Order' />{' '}
                  </SelectTrigger>{' '}
                  <SelectContent>
                    {' '}
                    {orderOptions.map((o) => (
                      <SelectItem key={o} value={o.toString()}>
                        {o}{' '}
                      </SelectItem>
                    ))}{' '}
                  </SelectContent>{' '}
                </Select>
              )}
            />{' '}
          </div>
          {/* Type */}{' '}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>Type</Label>{' '}
            <Controller
              name='stageType'
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  {' '}
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Type' />{' '}
                  </SelectTrigger>{' '}
                  <SelectContent>
                    {' '}
                    <SelectItem value='BRANCH'>Branch</SelectItem>
                    <SelectItem value='DEPARTMENT'>Department</SelectItem>{' '}
                    <SelectItem value='OTHER'>Other</SelectItem>{' '}
                  </SelectContent>{' '}
                </Select>
              )}
            />{' '}
          </div>{' '}
        </fieldset>
        <Separator /> {/* Conditional section – Roles & Users */}{' '}
        <AnimatePresence mode='wait'>
          {' '}
          {stageType && (
            <motion.fieldset
              key={stageType}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className='grid gap-4'
            >
              {/* Role */}{' '}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>Role</Label>{' '}
                <Controller
                  name='roleId'
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={rolesLoading || roles.length === 0}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      {' '}
                      <SelectTrigger className='col-span-3'>
                        {' '}
                        <SelectValue
                          placeholder={
                            rolesLoading ? 'Loading…' : 'Select role'
                          }
                        />{' '}
                      </SelectTrigger>{' '}
                      <SelectContent>
                        {' '}
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id ?? ''}>
                            {r.roleName}{' '}
                          </SelectItem>
                        ))}{' '}
                      </SelectContent>{' '}
                    </Select>
                  )}
                />{' '}
              </div>
              {/* User */}{' '}
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>User</Label>{' '}
                <Controller
                  name='username'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      {' '}
                      <SelectTrigger className='col-span-3'>
                        {' '}
                        <SelectValue placeholder='Select user' />{' '}
                      </SelectTrigger>{' '}
                      <SelectContent>
                        {' '}
                        {users.map((u) => (
                          <SelectItem key={u.username} value={u.username || ''}>
                            {u.fullName || u.username}{' '}
                          </SelectItem>
                        ))}{' '}
                      </SelectContent>{' '}
                    </Select>
                  )}
                />{' '}
              </div>{' '}
            </motion.fieldset>
          )}{' '}
        </AnimatePresence>
        <Separator /> {/* Other settings */}{' '}
        <fieldset className='grid gap-4'>
          {/* Docs required */}{' '}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>Docs Required</Label>{' '}
            <Controller
              name='requiresDocuments'
              control={control}
              render={({ field }) => (
                <div className='col-span-3 flex items-center gap-2'>
                  {' '}
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span>{field.value ? 'Yes' : 'No'}</span>{' '}
                </div>
              )}
            />{' '}
          </div>
          {/* Time limit */}{' '}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>Time Limit (days)</Label>{' '}
            <div className='col-span-3 space-y-1'>
              {' '}
              <Input
                type='number'
                min={1}
                placeholder='e.g. 7'
                {...register('timeLimitDays', { valueAsNumber: true })}
              />{' '}
              {errors.timeLimitDays && (
                <p className='text-destructive text-xs'>
                  {errors.timeLimitDays.message}{' '}
                </p>
              )}{' '}
            </div>{' '}
          </div>{' '}
        </fieldset>{' '}
        <DialogFooter>
          {' '}
          <Button type='submit' disabled={isSubmitting}>
            {/* Button text changes based on the mode */}{' '}
            {isSubmitting
              ? 'Saving…'
              : isEditMode
                ? 'Save Changes'
                : 'Create Stage'}{' '}
          </Button>{' '}
        </DialogFooter>{' '}
      </form>{' '}
    </DialogContent>
  )
}

export default StageDialog
