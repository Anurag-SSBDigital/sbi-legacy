import * as React from 'react'
import { z } from 'zod'
import {
  useForm,
  Controller,
  useFieldArray,
  type FieldErrors,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  Settings2,
  UserCog,
  FileJson,
  FileText,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  LucideProps,
} from 'lucide-react'
// Local Imports
import { $api } from '@/lib/api.ts'
import { formatDropdownLabel } from '@/lib/dropdown-label.ts'
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
import {
  listWorkflowDocumentTemplates,
  type WorkflowDocumentTemplateRecord,
} from '@/features/form-designer/workflow-document-template-api.ts'
import {
  listWorkflowFormSchemas,
  type WorkflowFormSchemaRecord,
} from '@/features/form-designer/workflow-form-schema-api.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Schema
// ─────────────────────────────────────────────────────────────────────────────

const NONE_VALUE = '__none__'
const ASSIGNMENT_TYPES = ['ROLE', 'USER', 'DEPARTMENT', 'BRANCH'] as const
const STAGE_TYPES = ['FORM', 'APPROVAL'] as const

const generatedDocumentSchema = z
  .object({
    id: z.number().int().optional(),
    code: z
      .string({ error: 'Document code is required' })
      .trim()
      .min(1, 'Document code is required')
      .max(120, 'Max 120 chars'),
    label: z.string().trim().max(255).optional(),
    mode: z.union([z.literal('ON_DEMAND'), z.literal('IMMEDIATE')]).optional(),
    docType: z.string().trim().max(120).optional(),
    fileNamePattern: z.string().trim().max(255).optional(),
    templateId: z
      .number()
      .int()
      .positive({ error: 'Select a template version' }),
    templateKey: z.string().optional(),
    templateVersion: z.number().int().positive().optional(),
    enabled: z.boolean().default(true),
  })
  .transform((val) => ({
    ...val,
    mode: val.mode ?? 'ON_DEMAND',
  }))

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
    formSchemaId: z.number().int().positive().optional(),

    assignmentType: z
      .union([
        z.literal('ROLE'),
        z.literal('USER'),
        z.literal('DEPARTMENT'),
        z.literal('BRANCH'),
      ])
      .optional(),

    roleId: z.string().nullish(),
    username: z.string().nullish(),
    departmentId: z.string().nullish(),
    branchId: z.string().nullish(),

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
    generatedDocuments: z.array(generatedDocumentSchema).default([]),
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

    const seenCodes = new Set<string>()
    ;(val.generatedDocuments ?? []).forEach((doc, index) => {
      const normalizedCode = (doc.code ?? '').trim().toLowerCase()
      if (!normalizedCode) return
      if (seenCodes.has(normalizedCode)) {
        ctx.addIssue({
          code: 'custom',
          path: ['generatedDocuments', index, 'code'],
          message: 'Document code must be unique within this stage',
        })
      } else {
        seenCodes.add(normalizedCode)
      }
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

const createGeneratedDocumentDraft = () => ({
  code: '',
  label: '',
  mode: 'ON_DEMAND' as const,
  docType: '',
  fileNamePattern: '',
  templateId: 0,
  templateKey: '',
  templateVersion: undefined,
  enabled: true,
})

const asOptionalEnum = <T extends readonly string[]>(
  value: unknown,
  allowed: T
): T[number] | undefined => {
  if (typeof value !== 'string') return undefined
  return allowed.includes(value as T[number]) ? (value as T[number]) : undefined
}

const formatErrorPath = (segments: string[]): string => {
  if (segments.length === 0) return 'Form'

  if (segments[0] === 'generatedDocuments') {
    const index = Number(segments[1])
    const field = segments[2]
    const prefix = Number.isFinite(index)
      ? `Generated document #${index + 1}`
      : 'Generated documents'

    if (field === 'code') return `${prefix} code`
    if (field === 'templateId') return `${prefix} template`
    if (field === 'mode') return `${prefix} mode`
    if (field === 'docType') return `${prefix} document type`
    if (field === 'fileNamePattern') return `${prefix} file name pattern`

    return prefix
  }

  const labelByField: Record<string, string> = {
    stageOrder: 'Stage order',
    key: 'System key',
    name: 'Stage name',
    stageType: 'Stage type',
    formSchemaId: 'Stage form schema',
    assignmentType: 'Assignment type',
    roleId: 'Role',
    username: 'User',
    departmentId: 'Department',
    branchId: 'Branch',
    requiresDocuments: 'Documents required',
    slaDays: 'SLA days',
    skippable: 'Skippable',
    enabled: 'Enabled',
    metadataJson: 'Metadata JSON',
  }

  const first = segments[0]
  return labelByField[first] ?? segments.join('.')
}

const collectErrorMessages = (node: unknown, path: string[] = []): string[] => {
  if (!node || typeof node !== 'object') return []

  const current = node as Record<string, unknown>
  const messages: string[] = []

  if (typeof current.message === 'string' && current.message.trim()) {
    const fieldName = formatErrorPath(path)
    messages.push(
      path.length > 0 ? `${fieldName}: ${current.message}` : current.message
    )
  }

  Object.entries(current).forEach(([key, value]) => {
    if (key === 'message' || key === 'type' || key === 'ref' || key === 'types')
      return
    messages.push(...collectErrorMessages(value, [...path, key]))
  })

  return messages
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
  onInvalidSubmit,
}: {
  initialData?: StageFormType
  isEditMode?: boolean
  orderOptions: number[]
  users: User[]
  onSubmit: (data: StageFormType) => void | Promise<void>
  onInvalidSubmit?: (errors: FieldErrors<StageFormInput>) => void
}) {
  const defaultStageOrder = React.useMemo(
    () => orderOptions[orderOptions.length - 1] ?? 1,
    [orderOptions]
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const submitLockRef = React.useRef(false)
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
      data?: {
        data?: Array<{
          id: string
          name: string
          code?: string
          departmentCode?: string
        }>
      }
      isLoading: boolean
    }
  const departments = (departmentsResp?.data ?? []).map((dept) => ({
    ...dept,
    name: formatDropdownLabel(dept),
  }))

  const { data: formSchemas = [], isLoading: formSchemasLoading } = useQuery({
    queryKey: ['wf-form-schemas', 'stage-dialog'],
    queryFn: () => listWorkflowFormSchemas(),
    staleTime: 60 * 1000,
  })

  const { data: documentTemplates = [], isLoading: documentTemplatesLoading } =
    useQuery({
      queryKey: ['wf-document-templates', 'stage-dialog'],
      queryFn: () => listWorkflowDocumentTemplates(),
      staleTime: 60 * 1000,
    })

  const formSchemaOptions = React.useMemo(
    () =>
      [...formSchemas].sort((a, b) => {
        const aKey = (a.schemaKey ?? '').toLowerCase()
        const bKey = (b.schemaKey ?? '').toLowerCase()
        if (aKey !== bKey) return aKey.localeCompare(bKey)
        return (b.version ?? 0) - (a.version ?? 0)
      }),
    [formSchemas]
  )
  const handleValidSubmit = React.useCallback(
    async (data: StageFormType) => {
      if (submitLockRef.current) return

      submitLockRef.current = true
      setIsSaving(true)

      try {
        await Promise.resolve(onSubmit(data))
      } finally {
        submitLockRef.current = false
        setIsSaving(false)
      }
    },
    [onSubmit]
  )
  const documentTemplateOptions = React.useMemo(
    () =>
      [...documentTemplates]
        .filter((template) => Number(template.id) > 0)
        .sort((a, b) => {
          const aKey = (a.templateKey ?? '').toLowerCase()
          const bKey = (b.templateKey ?? '').toLowerCase()
          if (aKey !== bKey) return aKey.localeCompare(bKey)
          return (b.version ?? 0) - (a.version ?? 0)
        }),
    [documentTemplates]
  )

  // Form Setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<StageFormInput, undefined, StageFormType>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      stageOrder: defaultStageOrder,
      key: '',
      name: '',
      requiresDocuments: false,
      skippable: false,
      enabled: true,
      generatedDocuments: [],
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const {
    fields: generatedDocumentFields,
    append: appendGeneratedDocument,
    remove: removeGeneratedDocument,
  } = useFieldArray({
    control,
    name: 'generatedDocuments',
  })

  // Effects
  React.useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        stageOrder:
          typeof initialData.stageOrder === 'number' &&
          Number.isFinite(initialData.stageOrder)
            ? initialData.stageOrder
            : defaultStageOrder,
        key: initialData.key ?? '',
        name: initialData.name ?? '',
        formSchemaId:
          typeof initialData.formSchemaId === 'number' &&
          Number.isFinite(initialData.formSchemaId) &&
          initialData.formSchemaId > 0
            ? Number(initialData.formSchemaId)
            : undefined,
        stageType: asOptionalEnum(initialData.stageType, STAGE_TYPES),
        assignmentType: asOptionalEnum(
          initialData.assignmentType,
          ASSIGNMENT_TYPES
        ),
        requiresDocuments:
          typeof initialData.requiresDocuments === 'boolean'
            ? initialData.requiresDocuments
            : false,
        skippable:
          typeof initialData.skippable === 'boolean'
            ? initialData.skippable
            : false,
        enabled:
          typeof initialData.enabled === 'boolean' ? initialData.enabled : true,
        slaDays:
          typeof initialData.slaDays === 'number' &&
          Number.isFinite(initialData.slaDays)
            ? initialData.slaDays
            : undefined,
        metadataJson: initialData.metadataJson ?? '',
        generatedDocuments: (initialData.generatedDocuments ?? []).map(
          (doc) => ({
            ...doc,
            mode: doc.mode === 'IMMEDIATE' ? 'IMMEDIATE' : 'ON_DEMAND',
            templateId:
              doc.templateId && Number(doc.templateId) > 0
                ? Number(doc.templateId)
                : 0,
            templateVersion:
              doc.templateVersion && Number(doc.templateVersion) > 0
                ? Number(doc.templateVersion)
                : undefined,
            enabled: doc.enabled ?? true,
          })
        ),
      } as Partial<StageFormInput>)
    } else {
      reset({
        stageOrder: defaultStageOrder,
        key: '',
        name: '',
        requiresDocuments: false,
        skippable: false,
        enabled: true,
        generatedDocuments: [],
      } satisfies Partial<StageFormInput>)
    }
  }, [initialData, reset, defaultStageOrder])

  const assignmentType = watch('assignmentType') || ''
  const selectedStageType = watch('stageType')
  const currentFormSchemaId = watch('formSchemaId')
  const errorSummary = React.useMemo(
    () => Array.from(new Set(collectErrorMessages(errors))),
    [errors]
  )
  const selectedFormSchemaId = watch('formSchemaId')
  const selectedFormSchema = React.useMemo(
    () =>
      formSchemaOptions.find(
        (schema) => Number(schema.id) === Number(selectedFormSchemaId)
      ) as WorkflowFormSchemaRecord | undefined,
    [formSchemaOptions, selectedFormSchemaId]
  )

  const latestFormSchemaByKey = React.useMemo(() => {
    const map = new Map<string, WorkflowFormSchemaRecord>()
    formSchemaOptions.forEach((schema) => {
      const key = String(schema.schemaKey ?? '').trim()
      if (!key) return
      const current = map.get(key)
      if (
        !current ||
        Number(schema.version ?? 0) > Number(current.version ?? 0)
      ) {
        map.set(key, schema)
      }
    })
    return map
  }, [formSchemaOptions])

  const latestSelectedFormSchema = React.useMemo(() => {
    const key = String(selectedFormSchema?.schemaKey ?? '').trim()
    if (!key) return undefined
    return latestFormSchemaByKey.get(key)
  }, [latestFormSchemaByKey, selectedFormSchema])

  const selectedFormSchemaIsOutdated =
    Boolean(selectedFormSchema && latestSelectedFormSchema) &&
    Number(selectedFormSchema?.version ?? 0) <
      Number(latestSelectedFormSchema?.version ?? 0)

  const documentTemplateById = React.useMemo(() => {
    const map = new Map<number, WorkflowDocumentTemplateRecord>()
    documentTemplateOptions.forEach((template) => {
      const id = Number(template.id)
      if (id > 0) map.set(id, template)
    })
    return map
  }, [documentTemplateOptions])

  const latestDocumentTemplateByKey = React.useMemo(() => {
    const map = new Map<string, WorkflowDocumentTemplateRecord>()
    documentTemplateOptions.forEach((template) => {
      const key = String(template.templateKey ?? '').trim()
      if (!key) return
      const current = map.get(key)
      if (
        !current ||
        Number(template.version ?? 0) > Number(current.version ?? 0)
      ) {
        map.set(key, template)
      }
    })
    return map
  }, [documentTemplateOptions])
  React.useEffect(() => {
    if (selectedStageType !== 'FORM' && currentFormSchemaId) {
      setValue('formSchemaId', undefined, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [selectedStageType, currentFormSchemaId, setValue])
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
  // console.log('Form Errors:', errors)
  // console.log('Form Values:', watch())

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
          onSubmit={handleSubmit(handleValidSubmit, (formErrors) =>
            onInvalidSubmit?.(formErrors)
          )}
          className='flex flex-col space-y-8 px-6 py-6'
        >
          {submitCount > 0 && errorSummary.length > 0 && (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-red-900'>
              <p className='text-sm font-semibold'>
                Please fix these validation issues:
              </p>
              <ul className='mt-2 list-disc space-y-1 pl-5 text-sm'>
                {errorSummary.slice(0, 8).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
              {errorSummary.length > 8 && (
                <p className='mt-2 text-xs'>
                  +{errorSummary.length - 8} more issue(s)
                </p>
              )}
            </div>
          )}

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
                  <>
                    <p className='text-muted-foreground mt-1.5 text-[0.8rem]'>
                      Unique identifiers cannot be changed after creation.
                    </p>
                    <ErrorMessage message={errors.key?.message} />
                  </>
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
                      value={(field.value as string) ?? NONE_VALUE}
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
                <ErrorMessage message={errors.stageType?.message} />
              </div>

              {selectedStageType === 'FORM' && (
                <div className='col-span-12'>
                  <Label htmlFor='formSchemaId' className='mb-2 block'>
                    Stage Form Schema (Optional)
                  </Label>
                  <Controller
                    name='formSchemaId'
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={
                          field.value && Number(field.value) > 0
                            ? String(field.value)
                            : NONE_VALUE
                        }
                        onValueChange={(value) =>
                          field.onChange(
                            value === NONE_VALUE ? undefined : Number(value)
                          )
                        }
                        disabled={formSchemasLoading}
                      >
                        <SelectTrigger id='formSchemaId'>
                          <SelectValue
                            placeholder={
                              formSchemasLoading
                                ? 'Loading schema versions...'
                                : 'No schema selected'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>
                            -- None (No form schema) --
                          </SelectItem>
                          {formSchemaOptions.map((schema) => (
                            <SelectItem
                              key={String(schema.id)}
                              value={String(schema.id)}
                            >
                              {(schema.schemaKey ?? 'schema').trim()} v
                              {schema.version ?? 1} -{' '}
                              {(schema.name ?? 'Untitled Schema').trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedFormSchema ? (
                    <div className='mt-1.5 space-y-1'>
                      <p className='text-muted-foreground text-[0.8rem]'>
                        Selected:{' '}
                        <span className='font-medium'>
                          {selectedFormSchema.schemaKey} v
                          {selectedFormSchema.version}
                        </span>
                        {selectedFormSchema.description
                          ? ` — ${selectedFormSchema.description}`
                          : ''}
                      </p>
                      {selectedFormSchemaIsOutdated &&
                        latestSelectedFormSchema && (
                          <div className='flex flex-wrap items-center gap-2'>
                            <p className='text-[0.8rem] text-amber-600 dark:text-amber-300'>
                              Newer version available: v
                              {latestSelectedFormSchema.version}
                            </p>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                setValue(
                                  'formSchemaId',
                                  Number(latestSelectedFormSchema.id)
                                )
                              }
                            >
                              Use Latest
                            </Button>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className='text-muted-foreground mt-1.5 text-[0.8rem]'>
                      Choose a schema version from Form Designer. Leave empty if
                      this stage has no form requirement.
                    </p>
                  )}
                </div>
              )}
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
                      {...register('slaDays', {
                        setValueAs: (value) =>
                          value === '' || value === null || value === undefined
                            ? undefined
                            : Number(value),
                      })}
                    />
                    <span className='text-muted-foreground text-xs'>days</span>
                  </div>
                </div>
                <ErrorMessage message={errors.slaDays?.message} />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECTION 3: GENERATED DOCUMENTS === */}
          <section>
            <SectionHeader
              icon={FileText}
              title='Generated Documents'
              description='Configure optional PDF outputs mapped to this stage.'
            />

            <div className='space-y-4'>
              {generatedDocumentFields.length === 0 && (
                <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
                  No generated documents configured for this stage.
                </div>
              )}

              {generatedDocumentFields.map((field, index) => {
                const codeError =
                  errors.generatedDocuments?.[index]?.code?.message
                const templateError =
                  errors.generatedDocuments?.[index]?.templateId?.message
                const modeValue = watch(
                  `generatedDocuments.${index}.mode` as const
                )
                const templateIdValue = Number(
                  watch(`generatedDocuments.${index}.templateId` as const) ?? 0
                )
                const selectedTemplate =
                  documentTemplateById.get(templateIdValue)
                const latestSelectedTemplate = selectedTemplate
                  ? latestDocumentTemplateByKey.get(
                      String(selectedTemplate.templateKey ?? '').trim()
                    )
                  : undefined
                const selectedTemplateIsOutdated =
                  Boolean(selectedTemplate && latestSelectedTemplate) &&
                  Number(selectedTemplate?.version ?? 0) <
                    Number(latestSelectedTemplate?.version ?? 0)

                return (
                  <div
                    key={field.id}
                    className='bg-muted/20 space-y-4 rounded-lg border p-4'
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <h4 className='text-sm font-medium'>
                        Generated Document #{index + 1}
                      </h4>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive'
                        onClick={() => removeGeneratedDocument(index)}
                      >
                        <Trash2 className='mr-1 h-4 w-4' />
                        Remove
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label>Document Code *</Label>
                        <Input
                          placeholder='e.g. sanction_letter'
                          className={cn(
                            codeError &&
                              'border-destructive focus-visible:ring-destructive'
                          )}
                          {...register(
                            `generatedDocuments.${index}.code` as const
                          )}
                        />
                        <ErrorMessage
                          message={codeError as string | undefined}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label>Display Label</Label>
                        <Input
                          placeholder='e.g. Sanction Letter'
                          {...register(
                            `generatedDocuments.${index}.label` as const
                          )}
                        />
                      </div>

                      <div className='space-y-2 md:col-span-2'>
                        <Label>Document Template Version *</Label>
                        <Controller
                          name={
                            `generatedDocuments.${index}.templateId` as const
                          }
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={
                                field.value && Number(field.value) > 0
                                  ? String(field.value)
                                  : NONE_VALUE
                              }
                              onValueChange={(value) => {
                                const templateId =
                                  value === NONE_VALUE ? 0 : Number(value)
                                field.onChange(templateId)
                                const template =
                                  documentTemplateById.get(templateId)
                                setValue(
                                  `generatedDocuments.${index}.templateKey`,
                                  template?.templateKey ?? ''
                                )
                                setValue(
                                  `generatedDocuments.${index}.templateVersion`,
                                  template?.version
                                    ? Number(template.version)
                                    : undefined
                                )
                              }}
                              disabled={documentTemplatesLoading}
                            >
                              <SelectTrigger
                                className={cn(
                                  templateError &&
                                    'border-destructive focus-visible:ring-destructive'
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    documentTemplatesLoading
                                      ? 'Loading templates...'
                                      : 'Select template version'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE_VALUE}>
                                  -- Select --
                                </SelectItem>
                                {documentTemplateOptions.map((template) => (
                                  <SelectItem
                                    key={String(template.id)}
                                    value={String(template.id)}
                                  >
                                    {(
                                      template.templateKey ?? 'template'
                                    ).trim()}{' '}
                                    v{template.version ?? 1} -{' '}
                                    {(template.name ?? 'Untitled').trim()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <ErrorMessage
                          message={templateError as string | undefined}
                        />
                        {selectedTemplate && (
                          <div className='mt-1.5 space-y-1'>
                            <p className='text-muted-foreground text-xs'>
                              Selected:{' '}
                              <span className='font-medium'>
                                {selectedTemplate.templateKey} v
                                {selectedTemplate.version}
                              </span>
                            </p>
                            {selectedTemplateIsOutdated &&
                              latestSelectedTemplate && (
                                <div className='flex flex-wrap items-center gap-2'>
                                  <p className='text-xs text-amber-600 dark:text-amber-300'>
                                    Newer version available: v
                                    {latestSelectedTemplate.version}
                                  </p>
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='outline'
                                    onClick={() => {
                                      const latestId = Number(
                                        latestSelectedTemplate.id
                                      )
                                      setValue(
                                        `generatedDocuments.${index}.templateId`,
                                        latestId,
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        }
                                      )
                                      setValue(
                                        `generatedDocuments.${index}.templateKey`,
                                        latestSelectedTemplate.templateKey ?? ''
                                      )
                                      setValue(
                                        `generatedDocuments.${index}.templateVersion`,
                                        latestSelectedTemplate.version
                                          ? Number(
                                              latestSelectedTemplate.version
                                            )
                                          : undefined
                                      )
                                    }}
                                  >
                                    Use Latest
                                  </Button>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label>Mode</Label>
                        <Controller
                          name={`generatedDocuments.${index}.mode` as const}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ?? 'ON_DEMAND'}
                              onValueChange={(value) => field.onChange(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select mode' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='ON_DEMAND'>
                                  ON_DEMAND
                                </SelectItem>
                                <SelectItem value='IMMEDIATE'>
                                  IMMEDIATE
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <p className='text-muted-foreground text-xs'>
                          {modeValue === 'IMMEDIATE'
                            ? 'Generated as soon as stage is processed.'
                            : 'Generated only when user downloads from task page.'}
                        </p>
                        <ErrorMessage
                          message={
                            errors.generatedDocuments?.[index]?.mode
                              ?.message as string | undefined
                          }
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label>Document Type</Label>
                        <Input
                          placeholder='e.g. REPORT'
                          {...register(
                            `generatedDocuments.${index}.docType` as const
                          )}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label>File Name Pattern</Label>
                        <Input
                          placeholder='e.g. {{instance.businessKey}}_report'
                          {...register(
                            `generatedDocuments.${index}.fileNamePattern` as const
                          )}
                        />
                      </div>

                      <div className='flex items-end justify-between rounded-md border p-3'>
                        <div>
                          <Label className='text-sm font-medium'>Enabled</Label>
                          <p className='text-muted-foreground text-xs'>
                            Toggle this mapping without deleting it.
                          </p>
                        </div>
                        <Controller
                          name={`generatedDocuments.${index}.enabled` as const}
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  appendGeneratedDocument(createGeneratedDocumentDraft())
                }
                className='gap-2'
              >
                <Plus className='h-4 w-4' />
                Add Generated Document
              </Button>
            </div>
          </section>

          <Separator />

          {/* === SECTION 4: ASSIGNMENT === */}
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

          {/* === SECTION 5: ADVANCED === */}
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
          disabled={isSaving}
        >
          Reset
        </Button>
        <Button
          type='submit'
          form='stage-form'
          disabled={isSubmitting || isSaving}
          className='min-w-[140px]'
        >
          {isSubmitting || isSaving ? (
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
