import * as React from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Settings2,
  UserCog,
  FileJson,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  Clock,
  LucideProps,
} from 'lucide-react'
// Local Imports
import { $api } from '@/lib/api.ts'
import { cn } from '@/lib/utils'
import useBranchOptions from '@/hooks/use-branch-dropdown.ts'
import { Badge } from '@/components/ui/badge'
// UI Components
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Schema
// ─────────────────────────────────────────────────────────────────────────────

const NONE_VALUE = '__none__'

export const stageSchema = z
  .object({
    id: z.number().int().optional(),
    definitionId: z.number().int().optional(),
    stageOrder: z.number({ error: 'Required' }).int().positive(),

    // Key validation
    key: z
      .string({ error: 'Key is required' })
      .min(3, 'Min 3 chars')
      .max(64, 'Max 64 chars')
      .regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),

    name: z.string({ error: 'Name is required' }).min(3).max(120),
    stageType: z.union([z.literal('FORM'), z.literal('APPROVAL')]).optional(),

    assignmentType: z
      .union([
        z.literal('ROLE'),
        z.literal('USER'),
        z.literal('DEPARTMENT'),
        z.literal('BRANCH'),
      ])
      .optional(),

    roleId: z.string().optional(),
    username: z.string().optional(),
    departmentId: z.string().optional(),
    branchId: z.string().optional(),

    requiresDocuments: z.boolean().default(false),
    slaDays: z.number().int().nonnegative().optional(),
    skippable: z.boolean().default(false),
    enabled: z.boolean().default(true),

    metadataJson: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || !val.trim()) return true
          try {
            JSON.parse(val)
            return true
          } catch {
            return false
          }
        },
        { message: 'Invalid JSON format' }
      ),
  })
  .superRefine((val, ctx) => {
    const t = (val.assignmentType ?? '') as string
    if (t === 'ROLE' && !val.roleId)
      ctx.addIssue({
        code: 'custom',
        path: ['roleId'],
        message: 'Select a Role',
      })
    if (t === 'USER' && !val.username)
      ctx.addIssue({
        code: 'custom',
        path: ['username'],
        message: 'Select a User',
      })
    if (t === 'DEPARTMENT' && !val.departmentId)
      ctx.addIssue({
        code: 'custom',
        path: ['departmentId'],
        message: 'Select a Department',
      })
    if (t === 'BRANCH' && !val.branchId)
      ctx.addIssue({
        code: 'custom',
        path: ['branchId'],
        message: 'Select a Branch',
      })
  })

export type StageFormInput = z.input<typeof stageSchema>
export type StageFormType = z.output<typeof stageSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type User = {
  id?: string
  username?: string
  fullName?: string
  branchId?: string | null
  departmentId?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className='text-destructive animate-in fade-in slide-in-from-top-1 mt-1.5 flex items-center gap-2 text-[0.8rem] font-medium'>
      <AlertCircle className='h-3 w-3' />
      <span>{message}</span>
    </div>
  )
}

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >
  title: string
  description?: string
}) => (
  <div className='mb-6 flex items-start gap-3'>
    <div className='bg-primary/10 text-primary mt-0.5 rounded-md p-2'>
      <Icon className='h-4 w-4' />
    </div>
    <div>
      <h3 className='text-base leading-none font-semibold tracking-tight'>
        {title}
      </h3>
      {description && (
        <p className='text-muted-foreground mt-1.5 text-sm'>{description}</p>
      )}
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StageDialog({
  initialData,
  isEditMode,
  orderOptions,
  users,
  onSubmit,
}: {
  initialData?: StageFormType
  isEditMode?: boolean
  orderOptions: number[]
  users: User[]
  onSubmit: (data: StageFormType) => void
}) {
  const defaultStageOrder = React.useMemo(
    () => orderOptions[orderOptions.length - 1] ?? 1,
    [orderOptions]
  )

  // API Hooks
  const { data: rolesResp, isLoading: rolesLoading } = $api.useQuery(
    'get',
    '/roles/getAllRoles',
    { params: { header: { Authorization: '' } }, staleTime: 5 * 60 * 1000 }
  ) as {
    data?: { data?: { id: string; roleName: string }[] }
    isLoading: boolean
  }
  const roles = rolesResp?.data ?? []

  const { data: branchesResp, isLoading: branchesLoading } = useBranchOptions()

  const { data: departmentsResp, isLoading: departmentsLoading } =
    $api.useQuery('get', '/departments/get/dropdown', {
      params: { header: { Authorization: '' } },
    }) as {
      data?: { data?: { id: string; name: string }[] }
      isLoading: boolean
    }
  const departments = departmentsResp?.data ?? []

  // Form Setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageFormInput, undefined, StageFormType>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      stageOrder: defaultStageOrder,
      key: '',
      name: '',
      requiresDocuments: false,
      skippable: false,
      enabled: true,
    },
    mode: 'onChange',
  })

  // Effects
  React.useEffect(() => {
    if (initialData) {
      reset(initialData as Partial<StageFormInput>)
    } else {
      reset({
        stageOrder: defaultStageOrder,
        key: '',
        name: '',
        requiresDocuments: false,
        skippable: false,
        enabled: true,
      } satisfies Partial<StageFormInput>)
    }
  }, [initialData, reset, defaultStageOrder])

  const assignmentType = watch('assignmentType') || ''

  // Clear dependent fields when assignment type changes
  React.useEffect(() => {
    const fieldsToClear = [
      'roleId',
      'username',
      'departmentId',
      'branchId',
    ] as const
    const targetField =
      assignmentType === 'ROLE'
        ? 'roleId'
        : assignmentType === 'USER'
          ? 'username'
          : assignmentType === 'DEPARTMENT'
            ? 'departmentId'
            : assignmentType === 'BRANCH'
              ? 'branchId'
              : null

    fieldsToClear.forEach((f) => {
      if (f !== targetField) setValue(f, undefined)
    })
  }, [assignmentType, setValue])

  return (
    // Changed max-w-5xl to max-w-3xl for better readability
    <DialogContent className='flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-3xl'>
      <DialogHeader className='border-b px-6 py-4'>
        <div className='flex items-center gap-2'>
          <Badge
            variant={isEditMode ? 'secondary' : 'default'}
            className='mb-1'
          >
            {isEditMode ? 'Editing' : 'New'}
          </Badge>
        </div>
        <DialogTitle className='text-xl'>
          {isEditMode ? 'Edit Workflow Stage' : 'Create Workflow Stage'}
        </DialogTitle>
        <DialogDescription>
          Configure the lifecycle, assignment, and rules for this stage.
        </DialogDescription>
      </DialogHeader>

      <div className='flex-1 overflow-y-auto'>
        <form
          id='stage-form'
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col space-y-8 px-6 py-6'
        >
          {/* === SECTION 1: IDENTITY === */}
          <section>
            <SectionHeader
              icon={Fingerprint}
              title='Stage Identity'
              description='Basic information used to identify this step in the process.'
            />

            <div className='grid grid-cols-12 gap-x-6 gap-y-5'>
              {/* Order */}
              {orderOptions.length > 0 && (
                <div className='col-span-12 sm:col-span-3'>
                  <Label htmlFor='stageOrder' className='mb-2 block'>
                    Order Step
                  </Label>
                  <Controller
                    name='stageOrder'
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? '')}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger
                          className={cn(
                            errors.stageOrder && 'border-destructive'
                          )}
                        >
                          <SelectValue placeholder='#' />
                        </SelectTrigger>
                        <SelectContent>
                          {orderOptions.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              Step {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <ErrorMessage message={errors.stageOrder?.message} />
                </div>
              )}

              {/* Name */}
              <div className='col-span-12 sm:col-span-9'>
                <Label htmlFor='name' className='mb-2 block'>
                  Display Name <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='e.g. Manager Approval'
                  className={cn(
                    errors.name &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('name')}
                />
                <ErrorMessage message={errors.name?.message} />
              </div>

              {/* Key (Readonly logic) */}
              <div className='col-span-12 sm:col-span-6'>
                <Label
                  htmlFor='key'
                  className='mb-2 flex items-center justify-between'
                >
                  System Key <span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='key'
                    placeholder='e.g. manager_approval'
                    readOnly={isEditMode}
                    disabled={isEditMode}
                    className={cn(
                      'font-mono text-sm',
                      isEditMode &&
                        'bg-muted text-muted-foreground cursor-not-allowed opacity-100',
                      errors.key &&
                        'border-destructive focus-visible:ring-destructive'
                    )}
                    {...register('key')}
                  />
                  {isEditMode && (
                    <div className='absolute top-2.5 right-3'>
                      <Fingerprint className='text-muted-foreground/50 h-4 w-4' />
                    </div>
                  )}
                </div>
                {isEditMode ? (
                  <p className='text-muted-foreground mt-1.5 text-[0.8rem]'>
                    Unique identifiers cannot be changed after creation.
                  </p>
                ) : (
                  <ErrorMessage message={errors.key?.message} />
                )}
              </div>

              {/* Stage Type */}
              <div className='col-span-12 sm:col-span-6'>
                <Label htmlFor='stageType' className='mb-2 block'>
                  Stage Type
                </Label>
                <Controller
                  name='stageType'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE_VALUE}
                      onValueChange={(v) =>
                        field.onChange(v === NONE_VALUE ? undefined : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type (Optional)' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                        <SelectItem value='FORM'>Data Entry Form</SelectItem>
                        <SelectItem value='APPROVAL'>
                          Decision / Approval
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECTION 2: BEHAVIOR & RULES === */}
          <section>
            <SectionHeader
              icon={Settings2}
              title='Behavior & Rules'
              description='Define constraints and feature toggles for this stage.'
            />

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* Enabled */}
              <Controller
                name='enabled'
                control={control}
                render={({ field }) => (
                  <div
                    className={cn(
                      'flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors',
                      field.value ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    )}
                  >
                    <div className='space-y-0.5'>
                      <Label className='text-sm font-medium'>Active</Label>
                      <p className='text-muted-foreground text-xs'>
                        Visible in workflow
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Docs */}
              <Controller
                name='requiresDocuments'
                control={control}
                render={({ field }) => (
                  <div className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm'>
                    <div className='space-y-0.5'>
                      <Label className='text-sm font-medium'>Documents</Label>
                      <p className='text-muted-foreground text-xs'>
                        Force uploads
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Skippable */}
              <Controller
                name='skippable'
                control={control}
                render={({ field }) => (
                  <div className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm'>
                    <div className='space-y-0.5'>
                      <Label className='text-sm font-medium'>Skippable</Label>
                      <p className='text-muted-foreground text-xs'>
                        Optional step
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* SLA Input (Combined into grid) */}
              <div className='flex flex-col justify-center rounded-lg border p-4 shadow-sm'>
                <div className='flex items-center justify-between gap-4'>
                  <Label
                    htmlFor='slaDays'
                    className='flex items-center gap-2 text-sm font-medium'
                  >
                    <Clock className='text-muted-foreground h-4 w-4' /> SLA
                    Limit
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='slaDays'
                      type='number'
                      min={0}
                      placeholder='None'
                      className='h-8 w-24 text-right'
                      {...register('slaDays', { valueAsNumber: true })}
                    />
                    <span className='text-muted-foreground text-xs'>days</span>
                  </div>
                </div>
                <ErrorMessage message={errors.slaDays?.message} />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECTION 3: ASSIGNMENT === */}
          <section>
            <SectionHeader
              icon={UserCog}
              title='Assignment'
              description='Who is responsible for completing this stage?'
            />

            <div className='bg-muted/40 rounded-lg border p-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Assignment Type Selector */}
                <div className='space-y-2'>
                  <Label>Assign To Type</Label>
                  <Controller
                    name='assignmentType'
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) =>
                          field.onChange(v === NONE_VALUE ? undefined : v)
                        }
                      >
                        <SelectTrigger className='bg-background'>
                          <SelectValue placeholder='Select assignment type...' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>
                            -- Unassigned --
                          </SelectItem>
                          <SelectItem value='ROLE'>Specific Role</SelectItem>
                          <SelectItem value='USER'>Specific User</SelectItem>
                          <SelectItem value='DEPARTMENT'>
                            Entire Department
                          </SelectItem>
                          <SelectItem value='BRANCH'>Entire Branch</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <ErrorMessage message={errors.assignmentType?.message} />
                </div>

                {/* Dynamic Target Selector */}
                <div className='space-y-2'>
                  <Label>Target Entity</Label>

                  {!assignmentType && (
                    <div className='text-muted-foreground flex h-10 items-center rounded-md border border-dashed px-3 text-sm'>
                      Select a type on the left first
                    </div>
                  )}

                  {assignmentType === 'ROLE' && (
                    <Controller
                      name='roleId'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? NONE_VALUE}
                          onValueChange={(v) =>
                            field.onChange(v === NONE_VALUE ? undefined : v)
                          }
                          disabled={rolesLoading}
                        >
                          <SelectTrigger
                            className={cn(
                              'bg-background',
                              errors.roleId && 'border-destructive'
                            )}
                          >
                            <SelectValue
                              placeholder={
                                rolesLoading ? 'Loading...' : 'Select Role'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter((r) => !!r.id)
                              .map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.roleName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  {assignmentType === 'USER' && (
                    <Controller
                      name='username'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? NONE_VALUE}
                          onValueChange={(v) =>
                            field.onChange(v === NONE_VALUE ? undefined : v)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              'bg-background',
                              errors.username && 'border-destructive'
                            )}
                          >
                            <SelectValue placeholder='Select User' />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((u) => !!u.username)
                              .map((u) => (
                                <SelectItem
                                  key={u.username!}
                                  value={u.username!}
                                >
                                  {u.fullName || u.username}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  {assignmentType === 'DEPARTMENT' && (
                    <Controller
                      name='departmentId'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? NONE_VALUE}
                          onValueChange={(v) =>
                            field.onChange(v === NONE_VALUE ? undefined : v)
                          }
                          disabled={departmentsLoading}
                        >
                          <SelectTrigger
                            className={cn(
                              'bg-background',
                              errors.departmentId && 'border-destructive'
                            )}
                          >
                            <SelectValue placeholder='Select Department' />
                          </SelectTrigger>
                          <SelectContent>
                            {departments
                              .filter((d) => !!d.id)
                              .map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  {assignmentType === 'BRANCH' && (
                    <Controller
                      name='branchId'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? NONE_VALUE}
                          onValueChange={(v) =>
                            field.onChange(v === NONE_VALUE ? undefined : v)
                          }
                          disabled={branchesLoading}
                        >
                          <SelectTrigger
                            className={cn(
                              'bg-background',
                              errors.branchId && 'border-destructive'
                            )}
                          >
                            <SelectValue placeholder='Select Branch' />
                          </SelectTrigger>
                          <SelectContent>
                            {(branchesResp ?? [])
                              .filter((b) => !!b.id)
                              .map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  {/* Dynamic Error for Target */}
                  <ErrorMessage
                    message={
                      assignmentType === 'ROLE'
                        ? errors.roleId?.message
                        : assignmentType === 'USER'
                          ? errors.username?.message
                          : assignmentType === 'DEPARTMENT'
                            ? errors.departmentId?.message
                            : assignmentType === 'BRANCH'
                              ? errors.branchId?.message
                              : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECTION 4: ADVANCED === */}
          <section className='pb-2'>
            <SectionHeader
              icon={FileJson}
              title='Advanced Configuration'
              description='Additional metadata for custom workflow logic.'
            />
            <div className='grid gap-2'>
              <Textarea
                id='metadataJson'
                placeholder='{"custom_flag": true, "notify": ["admin"]}'
                className={cn(
                  'bg-muted/50 min-h-[100px] font-mono text-xs',
                  errors.metadataJson &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                {...register('metadataJson')}
              />
              <ErrorMessage message={errors.metadataJson?.message} />
            </div>
          </section>
        </form>
      </div>

      <DialogFooter className='bg-muted/10 border-t px-6 py-4'>
        <Button
          variant='ghost'
          type='button'
          onClick={() => reset()}
          className='mr-2'
        >
          Reset
        </Button>
        <Button
          type='submit'
          form='stage-form'
          disabled={isSubmitting}
          className='min-w-[140px]'
        >
          {isSubmitting ? (
            <div className='flex items-center gap-2'>
              <span className='animate-spin'>⏳</span> Saving...
            </div>
          ) : (
            <>
              {isEditMode ? (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              ) : (
                <Fingerprint className='mr-2 h-4 w-4' />
              )}
              {isEditMode ? 'Save Changes' : 'Create Stage'}
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
