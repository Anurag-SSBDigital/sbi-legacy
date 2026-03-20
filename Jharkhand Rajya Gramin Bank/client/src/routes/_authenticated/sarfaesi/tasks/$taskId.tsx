import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  Info,
  Upload,
  User,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api, fetchClient } from '@/lib/api'
import { toastError } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  stageFormConfigs,
  type StageFormConfig,
  type StageKey,
} from '@/features/sarfaesi/stage-form-config'

// Assuming you have a cn utility

// --- Types ---
export const Route = createFileRoute('/_authenticated/sarfaesi/tasks/$taskId')({
  component: RouteComponent,
})

const safeText = (v: unknown, fallback = '—') => {
  if (v === undefined || v === null) return fallback
  const s = String(v).trim()
  return s.length ? s : fallback
}

const sameStageName = (a?: string | null, b?: string | null) =>
  String(a ?? '')
    .trim()
    .toLowerCase() ===
  String(b ?? '')
    .trim()
    .toLowerCase()

const isApprovalStageKey = (stageKey?: string | null) =>
  stageKey === 'SARFAESI_APPROVAL_LEVEL_1' ||
  stageKey === 'SARFAESI_APPROVAL_LEVEL_2' ||
  stageKey === 'SARFAESI_APPROVAL_LEVEL_3'

async function downloadPdfViaClient(args: {
  accountNumber: string
  stageKey: string
  stageName?: string
}) {
  const { accountNumber, stageKey, stageName } = args

  const res = await fetchClient.POST(
    '/api/sarfaesi/pdf/generate/{accountNumber}/{stageKey}',
    {
      params: {
        path: {
          accountNumber: String(accountNumber),
          stageKey: String(stageKey),
        },
      },
      parseAs: 'blob',
    }
  )

  if (!res.response?.ok || !res.data) {
    const status = res.response?.status
    throw new Error(`Failed with status ${status ?? 'unknown'}`)
  }

  const blob = res.data as Blob

  const cd = res.response.headers.get('content-disposition') ?? ''
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd)
  const filenameFromHeader = decodeURIComponent(match?.[1] || match?.[2] || '')

  const fallbackName = `${accountNumber}-${stageKey}${
    stageName ? `-${String(stageName).replace(/\s+/g, '_')}` : ''
  }.pdf`

  const filename = filenameFromHeader || fallbackName

  const objectUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(objectUrl)
}

const computeDueDate = (noticeDate?: string, days?: number) => {
  if (!noticeDate) return ''
  const base = new Date(`${noticeDate}T00:00:00`)
  if (Number.isNaN(base.getTime())) return ''
  const n = Number(days ?? 0)
  if (!Number.isFinite(n)) return ''
  base.setDate(base.getDate() + n)
  return base.toISOString().slice(0, 10)
}

type StageDocument = components['schemas']['DocumentHistory']

type StageSummaryItem = {
  stageKey: string
  stageName: string
  status: string
  startDate: string | null
  endDate: string | null
  duration: string | null
  completedBy: string | null
  documents?: StageDocument[]
  actions?: {
    actionDate: string
    actionBy: string
    actionType: string
    stageName: string
    comments?: string | null
    payload?: unknown
    taskId?: number
  }[]
}

// --- Helpers ---
const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusDotClasses = (status?: string | null) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]'
    case 'IN_PROGRESS':
      return 'bg-blue-600 border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)] animate-pulse'
    case 'PENDING':
      return 'bg-muted-foreground/30 border-muted-foreground/30'
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-red-500 border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'
    default:
      return 'bg-muted border-muted'
  }
}

// --- Sub-Components ---

function RequiredDocumentUploadRow({
  docType,
  uploading,
  onUpload,
  documents = [],
  documentsLoading,
}: {
  docType: string
  uploading: boolean
  onUpload: (docType: string, file: File, comments?: string) => Promise<void>
  documents?: StageDocument[]
  documentsLoading?: boolean
}) {
  const [comments, setComments] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const hasDocuments = documents.length > 0
  // const isPending = !hasDocuments && !documentsLoading

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
  }

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    await onUpload(docType, selectedFile, comments)
    setSelectedFile(null)
    setComments('')
  }

  return (
    <div
      className={cn(
        'group rounded-xl border p-5 transition-all duration-200',
        hasDocuments
          ? 'border-emerald-200 bg-emerald-50/30'
          : 'bg-card hover:border-primary/50 hover:bg-muted/20 border-dashed'
      )}
    >
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        {/* Header Section */}
        <div className='flex items-start gap-3'>
          <div
            className={cn(
              'mt-1 flex h-8 w-8 items-center justify-center rounded-full',
              hasDocuments
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-primary/10 text-primary'
            )}
          >
            {hasDocuments ? (
              <CheckCircle2 className='h-4 w-4' />
            ) : (
              <FileText className='h-4 w-4' />
            )}
          </div>
          <div>
            <h4 className='text-foreground text-sm font-medium capitalize'>
              {docType.replace(/_/g, ' ').toLowerCase()}
            </h4>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {hasDocuments
                ? `${documents.length} file(s) uploaded`
                : 'Upload required document (PDF/Image)'}
            </p>
          </div>
        </div>

        {/* Upload Controls */}
        <div className='flex w-full flex-col gap-3 md:w-auto md:max-w-sm'>
          <div className='flex gap-2'>
            <Input
              type='file'
              className='file:text-foreground h-9 cursor-pointer text-xs'
              accept='application/pdf,image/*'
              disabled={uploading}
              onChange={handleFileChange}
            />
            <Button
              type='button'
              size='sm'
              onClick={handleUploadClick}
              disabled={uploading || !selectedFile}
              className='shrink-0'
            >
              {uploading ? (
                <Upload className='mr-2 h-3 w-3 animate-spin' />
              ) : (
                <Upload className='mr-2 h-3 w-3' />
              )}
              {uploading ? '...' : 'Upload'}
            </Button>
          </div>
          {(selectedFile || comments) && (
            <Textarea
              placeholder='Add optional comments...'
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className='min-h-[60px] resize-none text-xs'
            />
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {(hasDocuments || documentsLoading) && (
        <div className='mt-4 space-y-2 pl-0 md:pl-11'>
          {documentsLoading ? (
            <div className='bg-muted h-8 w-full animate-pulse rounded' />
          ) : (
            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-1'>
              {documents.map((doc) => (
                <div
                  key={
                    doc.documentId ?? `${doc.documentType}-${doc.uploadedAt}`
                  }
                  className='bg-background group/item flex items-center justify-between rounded-md border p-2.5 text-sm shadow-sm transition-colors hover:border-emerald-300'
                >
                  <div className='flex items-center gap-3 overflow-hidden'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50'>
                      <FileText className='h-4 w-4 text-red-500' />
                    </div>
                    <div className='flex flex-col overflow-hidden'>
                      <a
                        href={`${import.meta.env.VITE_APP_API_URL}/${doc.fileUrl}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-foreground hover:text-primary truncate font-medium hover:underline'
                      >
                        {doc.documentName ?? 'View Document'}
                      </a>
                      <span className='text-muted-foreground truncate text-[10px]'>
                        {formatDateTime(doc.uploadedAt)} • {doc.uploadedBy}
                      </span>
                    </div>
                  </div>
                  {doc.comments && (
                    <div className='text-muted-foreground hidden text-xs italic md:block'>
                      "{doc.comments}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RouteComponent() {
  const { taskId } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data } = $api.useSuspenseQuery(
    'get',
    '/api/sarfaesi/tasks/{taskId}',
    {
      params: {
        path: { taskId: Number(taskId) },
        header: { Authorization: '' },
      },
    }
  )

  const task = data.task
  const guidance = data.guidance
  const caseHistory = data.caseHistory

  const accountNumber = task?.accountNumber
  const currentStageKey = task?.currentStage
  const currentStageName = task?.stageName ?? guidance?.stageName

  const isApprovalStage = guidance?.stageType === 'APPROVAL'
  const requiredDocuments: string[] = guidance?.requiredDocuments ?? []
  const requiredFieldsFromGuidance = new Set(guidance?.requiredFields ?? [])
  const requiredActions: string[] = guidance?.requiredActions ?? []

  const requiresDocuments = Boolean(
    data.caseHistory?.workflowInstance?.currentStage?.requiresDocuments
  )

  const requiredDocumentsForUI = useMemo(
    () => requiredDocuments.filter((d) => d !== 'OTHER'),
    [requiredDocuments]
  )

  // --- Queries & Mutations ---
  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = $api.useQuery(
    'get',
    '/api/sarfaesi/{accountNumber}/documents/stage/{stageKey}',
    {
      params: {
        path: {
          accountNumber: String(accountNumber),
          stageKey: currentStageKey ?? '',
        },
      },
    },
    { enabled: Boolean(accountNumber) && Boolean(currentStageKey) }
  )

  const documentsByType = useMemo(() => {
    const map: Record<string, StageDocument[]> = {}
    ;(documents as StageDocument[] | undefined)?.forEach((doc) => {
      const key = doc.documentType ?? 'OTHER'
      if (!map[key]) map[key] = []
      map[key].push(doc)
    })
    return map
  }, [documents])

  const uploadDocumentMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/{accountNumber}/upload-documents'
  )

  const currentStageFormData = $api.useQuery(
    'get',
    '/api/sarfaesi/{accountNumber}/current-stage/form-data',
    {
      params: {
        path: { accountNumber: String(accountNumber) },
        header: { Authorization: '' },
      },
    },
    { enabled: !!accountNumber }
  )

  const updateFormMutation = $api.useMutation(
    'put',
    '/api/sarfaesi/{accountNumber}/current-stage/form-data'
  )
  const submitFormMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/{accountNumber}/submit-form'
  )
  const completeTaskMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/{accountNumber}/complete-task'
  )

  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)
  // const [isDownloadingStagePdf, setIsDownloadingStagePdf] = useState(false)

  // const handleDownloadStagePdf = useCallback(async () => {
  //   if (!accountNumber || !currentStageKey) {
  //     toast.error('Missing account number or stage key')
  //     return
  //   }

  //   try {
  //     setIsDownloadingStagePdf(true)
  //     await downloadPdfViaClient({
  //       accountNumber: String(accountNumber),
  //       stageKey: String(currentStageKey),
  //       stageName: String(currentStageName ?? ''),
  //     })
  //   } catch (err) {
  //     toastError(err, 'Failed to download stage PDF')
  //   } finally {
  //     setIsDownloadingStagePdf(false)
  //   }
  // }, [accountNumber, currentStageKey, currentStageName])

  const downloadStagePdf = useCallback(
    async (stageKey: string, stageName?: string) => {
      if (!accountNumber) {
        toast.error('Missing account number')
        return
      }
      if (!stageKey) {
        toast.error('Missing stage key')
        return
      }

      try {
        setDownloadingStageKey(stageKey)
        await downloadPdfViaClient({
          accountNumber: String(accountNumber),
          stageKey: String(stageKey),
          stageName,
        })
      } catch (err) {
        toastError(err, 'Failed to download stage PDF')
      } finally {
        setDownloadingStageKey(null)
      }
    },
    [accountNumber]
  )
  const [downloadingStageKey, setDownloadingStageKey] = useState<string | null>(
    null
  )

  const handleUploadDocument = useCallback(
    async (docType: string, file: File, comments?: string) => {
      try {
        setUploadingDocType(docType)
        const fd = new FormData()
        fd.append('files', file)
        await uploadDocumentMutation.mutateAsync({
          params: {
            query: { documentType: docType, comments },
            path: { accountNumber: String(accountNumber) },
            header: { Authorization: '' },
          },
          body: fd as unknown as { files: string[] },
        })
        toast.success(`Uploaded ${docType} successfully`)
        await refetchDocuments?.()
      } catch {
        toast.error(`Failed to upload ${docType}`)
      } finally {
        setUploadingDocType(null)
      }
    },
    [uploadDocumentMutation, accountNumber, refetchDocuments]
  )

  const stageConfig: StageFormConfig | undefined = currentStageKey
    ? stageFormConfigs[currentStageKey as StageKey]
    : undefined

  type FormValues = Record<string, string | number | null | undefined>
  const normalizeFormValues = (data: unknown): FormValues =>
    data && typeof data === 'object' ? (data as FormValues) : {}

  const currentStageFormDataResponse = currentStageFormData.data
  const existingFormId = (
    currentStageFormDataResponse?.data as { id?: number | string } | undefined
  )?.id

  const existingFormValues = useMemo(
    () => normalizeFormValues(currentStageFormDataResponse?.data ?? {}),
    [currentStageFormDataResponse]
  )

  const initialFormValues = useMemo(() => {
    if (!stageConfig) return {}
    const baseDefaults = stageConfig.defaultValues ?? {}
    const fromApi =
      existingFormValues && typeof existingFormValues === 'object'
        ? existingFormValues
        : {}
    return {
      ...baseDefaults,
      ...(accountNumber ? { accountNumber } : {}),
      ...fromApi,
    }
  }, [accountNumber, existingFormValues, stageConfig])

  const form = useForm<FormValues>({
    resolver: stageConfig
      ? standardSchemaResolver(stageConfig.schema)
      : undefined,
    mode: 'onBlur',
    defaultValues: initialFormValues as FormValues,
  })

  // Keep dueDate always in sync for DEMAND_NOTICE_PREPARATION
  useEffect(() => {
    if (currentStageKey !== 'DEMAND_NOTICE_PREPARATION') return

    const subscription = form.watch((values) => {
      const noticeDate = values.noticeDate as string | undefined
      const daysRaw = values.statutoryPeriodDays as unknown
      const days =
        typeof daysRaw === 'string'
          ? Number(daysRaw)
          : (daysRaw as number | undefined)

      const dueDate = computeDueDate(noticeDate, days)

      if ((values.dueDate as string | undefined) !== dueDate) {
        form.setValue('dueDate', dueDate, {
          shouldDirty: true,
          shouldValidate: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [form, currentStageKey])

  useEffect(() => {
    if (stageConfig) form.reset(initialFormValues)
  }, [form, initialFormValues, stageConfig])

  const isSubmittingForm =
    submitFormMutation.isPending ||
    updateFormMutation.isPending ||
    form.formState.isSubmitting

  const hasAllRequiredDocumentsUploaded = useMemo(() => {
    if (!requiredDocumentsForUI.length) return true
    return requiredDocumentsForUI.every(
      (docType) => (documentsByType[docType] ?? []).length > 0
    )
  }, [documentsByType, requiredDocumentsForUI])

  const hasAnyDocumentsUploadedForStage = useMemo(() => {
    const stageDocs = (documents as StageDocument[] | undefined) ?? []
    return stageDocs.length > 0
  }, [documents])

  const hasAllRequiredFieldsFilledInSavedForm = useMemo(() => {
    if (!requiredFieldsFromGuidance.size) return true
    const values = existingFormValues || {}
    let allFilled = true
    requiredFieldsFromGuidance.forEach((key) => {
      const value = values[
        key as keyof FormValues
      ] as FormValues[keyof FormValues]
      if (value === undefined || value === null || value === '')
        allFilled = false
    })
    return allFilled
  }, [existingFormValues, requiredFieldsFromGuidance])

  const canCompleteTask =
    (!requiresDocuments || hasAnyDocumentsUploadedForStage) &&
    hasAllRequiredDocumentsUploaded &&
    (hasAllRequiredFieldsFilledInSavedForm || isApprovalStage)

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | undefined>()
  const [completionComments, setCompletionComments] = useState('')

  const handleDynamicStageSubmit = useCallback(
    async (values: FormValues) => {
      if (!stageConfig) return
      const missingGuidanceFields = Array.from(
        requiredFieldsFromGuidance
      ).filter((key) => {
        const value = values[key as keyof FormValues]
        return value === undefined || value === null || value === ''
      })
      if (missingGuidanceFields.length > 0) {
        toast.error(
          `Please fill all required fields: ${missingGuidanceFields.join(', ')}`
        )
        return
      }

      const dueDateComputed =
        currentStageKey === 'DEMAND_NOTICE_PREPARATION'
          ? computeDueDate(
              values.noticeDate as string,
              Number(values.statutoryPeriodDays ?? 0)
            )
          : undefined

      const { accountNumber: accFromForm, id: _id, ...rest } = values ?? {}

      const basePayload = {
        ...rest,
        ...(dueDateComputed ? { dueDate: dueDateComputed } : {}),
      } as FormValues
      const payload: FormValues = existingFormId
        ? ({ id: existingFormId, ...basePayload } as FormValues)
        : basePayload
      const mutate = existingFormId
        ? updateFormMutation.mutateAsync
        : submitFormMutation.mutateAsync
      const requestBody = existingFormId
        ? payload
        : { accountNumber: String(accFromForm), formData: payload }

      try {
        await mutate({
          params: {
            path: { accountNumber: String(accFromForm) },
            header: { Authorization: '' },
          },
          body: requestBody as unknown as {
            [key: string]: Record<string, never>
          },
        })
        toast.success(
          existingFormId ? 'Form data updated' : 'Form submitted successfully'
        )
        form.reset({ ...values, accountNumber: accFromForm })
        await currentStageFormData.refetch()
      } catch (error) {
        toastError(error, `Failed to save form`)
      }
    },
    [
      accountNumber,
      currentStageFormData,
      form,
      existingFormId,
      stageConfig,
      submitFormMutation,
      updateFormMutation,
      requiredFieldsFromGuidance,
      currentStageKey,
    ]
  )

  const handleConfirmCompleteTask = useCallback(async () => {
    if (!accountNumber || !selectedAction) {
      if (!selectedAction) toast.error('Select an action')
      return
    }
    try {
      await completeTaskMutation.mutateAsync({
        params: {
          path: { accountNumber: String(accountNumber) },
          header: { Authorization: '' },
        },
        body: {
          accountNumber: String(accountNumber),
          action: selectedAction,
          comments: completionComments,
          payload: {},
        } as unknown as { [key: string]: Record<string, never> },
      })
      toast.success('Task marked as complete')
      setIsCompleteDialogOpen(false)
      setSelectedAction(undefined)
      setCompletionComments('')
      navigate({ to: '/sarfaesi/tasks' })
    } catch (error) {
      toastError(error, 'Failed to complete task')
    }
  }, [
    accountNumber,
    selectedAction,
    completionComments,
    completeTaskMutation,
    navigate,
  ])

  // --- Dynamic Form Renderer ---
  const renderStageForm = () => {
    if (!stageConfig) {
      return (
        <Card className='border-dashed bg-slate-50'>
          <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
            <div className='rounded-full bg-slate-100 p-3'>
              <FileText className='text-muted-foreground h-6 w-6' />
            </div>
            <h3 className='mt-4 font-semibold'>Manual Processing</h3>
            <p className='text-muted-foreground mt-2 max-w-md text-sm'>
              No digital form is configured for{' '}
              <span className='text-foreground font-mono font-medium'>
                {currentStageKey}
              </span>
              . Please proceed with offline procedures and document uploads.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className='border-none shadow-sm ring-1 ring-slate-900/5'>
        <CardHeader className='border-b bg-slate-50/40 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <CardTitle className='text-lg tracking-tight'>
                {stageConfig.title}
              </CardTitle>
              {stageConfig.description && (
                <CardDescription className='text-xs'>
                  {stageConfig.description}
                </CardDescription>
              )}
            </div>
            {existingFormId && (
              <Badge
                variant='outline'
                className='border-emerald-200 bg-emerald-50 text-emerald-700'
              >
                <CheckCircle2 className='mr-1 h-3 w-3' /> Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className='p-6'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleDynamicStageSubmit)}
              className='space-y-6'
            >
              <div className='grid gap-6 md:grid-cols-2'>
                {stageConfig.fields.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: rhfField }) => (
                      <FormItem
                        className={
                          field.type === 'textarea' ? 'md:col-span-2' : ''
                        }
                      >
                        <FormLabel className='text-xs font-medium tracking-wide text-slate-600 uppercase'>
                          {field.label}
                          {requiredFieldsFromGuidance.has(field.name) && (
                            <span className='ml-1 text-red-500'>*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          {field.type === 'textarea' ? (
                            <Textarea
                              className='resize-y bg-slate-50/50 focus:bg-white'
                              rows={4}
                              placeholder={field.placeholder}
                              readOnly={field.readOnly}
                              {...rhfField}
                              value={(rhfField.value ?? '') as string}
                            />
                          ) : (
                            <Input
                              className='bg-slate-50/50 focus:bg-white'
                              type={
                                field.type === 'number'
                                  ? 'number'
                                  : field.type === 'date'
                                    ? 'date'
                                    : 'text'
                              }
                              step={
                                field.type === 'number' ? '0.01' : undefined
                              }
                              placeholder={field.placeholder}
                              readOnly={field.readOnly}
                              disabled={isSubmittingForm}
                              {...rhfField}
                              value={
                                field.type === 'number'
                                  ? (rhfField.value ?? '')
                                  : ((rhfField.value ?? '') as string)
                              }
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className='flex items-center justify-end gap-3 pt-4'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={isSubmittingForm}
                  onClick={() => form.reset(initialFormValues)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  Reset
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  className='min-w-[120px]'
                  disabled={isSubmittingForm}
                >
                  {isSubmittingForm
                    ? 'Saving...'
                    : existingFormId
                      ? 'Update Data'
                      : 'Save Progress'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  // --- Main Layout ---
  return (
    <MainWrapper>
      <div className='min-h-screen bg-slate-50/50 pb-20'>
        {/* 1. Page Header */}
        <div className='sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60'>
          <div className='container mx-auto px-4 py-4 md:px-8'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1.5'>
                <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase'>
                  <span>Sarfaesi</span>
                  <span className='text-muted-foreground/40'>/</span>
                  <span className='text-primary'>Task #{task?.taskId}</span>
                </div>
                <h1 className='text-foreground text-2xl font-bold tracking-tight'>
                  {task?.taskDescription}
                </h1>
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <div className='flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-sm shadow-sm'>
                  <Clock
                    className={cn(
                      'h-3.5 w-3.5',
                      task?.overdue ? 'text-red-500' : 'text-slate-500'
                    )}
                  />
                  <span
                    className={
                      task?.overdue
                        ? 'font-medium text-red-600'
                        : 'text-slate-600'
                    }
                  >
                    {task?.overdue
                      ? 'Overdue'
                      : `Due in ${task?.daysRemaining} day(s)`}
                  </span>
                </div>
                <Badge
                  variant='secondary'
                  className={cn(
                    'px-3 py-1 font-medium',
                    task?.priority === 'HIGH'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {task?.priority} Priority
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className='container mx-auto mt-8 grid grid-cols-1 gap-8 px-4 md:px-8 lg:grid-cols-12'>
          {/* 2. Left Main Column (Timeline, Form, Documents) */}
          <div className='space-y-8 lg:col-span-8'>
            {/* Timeline */}
            {caseHistory?.stageSummary &&
              caseHistory.stageSummary.length > 0 && (
                <div className='rounded-xl border bg-white p-1 shadow-sm'>
                  <ScrollArea className='w-full rounded-lg whitespace-nowrap'>
                    <div className='flex w-max items-start space-x-0 p-6'>
                      {caseHistory.stageSummary.map((s, idx) => (
                        <StageTimelineItem
                          key={idx}
                          summary={s as StageSummaryItem}
                          idx={idx}
                          total={caseHistory?.stageSummary?.length ?? 0}
                          caseHistory={caseHistory}
                          accountNumber={accountNumber}
                          downloadingStageKey={downloadingStageKey}
                          downloadStagePdf={downloadStagePdf}
                        />
                      ))}
                    </div>
                    <ScrollBar orientation='horizontal' className='h-2' />
                  </ScrollArea>
                </div>
              )}

            {/* Stage Actions Section */}
            <div className='space-y-6'>
              <div className='flex items-end justify-between border-b pb-4'>
                <div>
                  <h2 className='text-xl font-semibold tracking-tight'>
                    Stage Details
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    Complete the form and upload required documents for{' '}
                    <span className='text-foreground font-medium'>
                      {currentStageName}
                    </span>
                  </p>
                </div>
                {/* <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='hidden sm:flex'
                  onClick={handleDownloadStagePdf}
                  disabled={
                    !accountNumber || !currentStageKey || isDownloadingStagePdf
                  }
                >
                  {isDownloadingStagePdf
                    ? 'Generating...'
                    : 'Download Stage PDF'}
                  <Download className='ml-2 h-3.5 w-3.5' />
                </Button> */}
              </div>

              {/* Guidance / Approval Banner */}
              {isApprovalStage && stageConfig && (
                <div className='flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-blue-900'>
                  <Info className='mt-0.5 h-5 w-5 shrink-0 text-blue-600' />
                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>Approval Requirements</p>
                    <div className='flex flex-wrap gap-2'>
                      {requiredDocuments.map((d) => (
                        <Badge
                          key={d}
                          variant='secondary'
                          className='border-blue-200 bg-white text-blue-700'
                        >
                          Doc: {d.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {Array.from(requiredFieldsFromGuidance).map((f) => (
                        <Badge
                          key={f}
                          variant='secondary'
                          className='border-blue-200 bg-white text-blue-700'
                        >
                          Field: {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              {renderStageForm()}

              {/* Required Documents */}
              {requiredDocumentsForUI.length > 0 && (
                <div className='space-y-4 pt-4'>
                  <h3 className='flex items-center gap-2 text-lg font-semibold'>
                    Required Documents
                  </h3>
                  <div className='space-y-3'>
                    {requiredDocumentsForUI.map((docType) => (
                      <RequiredDocumentUploadRow
                        key={docType}
                        docType={docType}
                        uploading={uploadingDocType === docType}
                        onUpload={handleUploadDocument}
                        documents={documentsByType[docType] ?? []}
                        documentsLoading={documentsLoading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Documents */}
              <div className='space-y-4 pt-4'>
                <h3 className='flex items-center gap-2 text-lg font-semibold'>
                  Additional Documents
                </h3>
                <RequiredDocumentUploadRow
                  docType='OTHER'
                  uploading={uploadingDocType === 'OTHER'}
                  onUpload={handleUploadDocument}
                  documents={documentsByType['OTHER'] ?? []}
                  documentsLoading={documentsLoading}
                />
              </div>
            </div>
          </div>

          {/* 3. Right Sidebar Column (Sticky) */}
          <div className='space-y-6 lg:col-span-4'>
            <div className='sticky top-28 space-y-6'>
              {/* Action Card */}
              <Card className='border-primary/20 ring-primary/5 overflow-hidden shadow-md ring-1'>
                <div className='bg-primary/5 border-primary/10 border-b px-6 py-4'>
                  <h3 className='text-primary flex items-center gap-2 font-semibold'>
                    <CheckCircle2 className='h-5 w-5' />
                    Task Actions
                  </h3>
                </div>
                <CardContent className='space-y-6 p-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between rounded-lg border bg-slate-50 p-3 text-sm'>
                      <span className='text-slate-600'>Documents</span>
                      {!requiresDocuments ? (
                        <span className='text-muted-foreground text-xs'>
                          Not required
                        </span>
                      ) : hasAnyDocumentsUploadedForStage ? (
                        <div className='flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                          <CheckCircle2 className='h-4 w-4' /> Ready
                        </div>
                      ) : (
                        <div className='flex items-center gap-1.5 text-xs font-medium text-amber-600'>
                          <AlertCircle className='h-4 w-4' /> Pending
                        </div>
                      )}
                    </div>
                    <div className='flex items-center justify-between rounded-lg border bg-slate-50 p-3 text-sm'>
                      <span className='text-slate-600'>Form Data</span>
                      {hasAllRequiredFieldsFilledInSavedForm ||
                      isApprovalStage ? (
                        <div className='flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                          <CheckCircle2 className='h-4 w-4' /> Complete
                        </div>
                      ) : (
                        <div className='flex items-center gap-1.5 text-xs font-medium text-amber-600'>
                          <AlertCircle className='h-4 w-4' /> Incomplete
                        </div>
                      )}
                    </div>
                  </div>

                  <Dialog
                    open={isCompleteDialogOpen}
                    onOpenChange={(open) => {
                      setIsCompleteDialogOpen(open)
                      if (!open) {
                        setSelectedAction(undefined)
                        setCompletionComments('')
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className='w-full shadow-sm'
                        size='lg'
                        disabled={
                          !canCompleteTask ||
                          completeTaskMutation.isPending ||
                          requiredActions.length === 0
                        }
                      >
                        {completeTaskMutation.isPending
                          ? 'Processing...'
                          : 'Complete Task'}
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Complete Stage</DialogTitle>
                        <DialogDescription>
                          Select the final outcome for{' '}
                          <span className='text-foreground font-medium'>
                            {currentStageName}
                          </span>
                          .
                        </DialogDescription>
                      </DialogHeader>
                      <div className='grid gap-6 py-4'>
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>
                            Decision
                          </label>
                          <Select
                            value={selectedAction}
                            onValueChange={setSelectedAction}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select decision...' />
                            </SelectTrigger>
                            <SelectContent>
                              {requiredActions.map((action) => (
                                <SelectItem key={action} value={action}>
                                  {action.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>Remarks</label>
                          <Textarea
                            placeholder='Add final comments...'
                            value={completionComments}
                            onChange={(e) =>
                              setCompletionComments(e.target.value)
                            }
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => setIsCompleteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmCompleteTask}
                          disabled={
                            !selectedAction || completeTaskMutation.isPending
                          }
                        >
                          Confirm Completion
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card className='shadow-sm'>
                <CardHeader className='border-b bg-slate-50/50 pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <User className='text-muted-foreground h-4 w-4' />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground mb-1 block text-xs'>
                      Customer Name
                    </span>
                    <span className='text-base font-medium'>
                      {caseHistory?.accountDetails?.customerName}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <span className='text-muted-foreground mb-1 block text-xs'>
                        Account No
                      </span>
                      <span className='bg-muted rounded px-2 py-1 font-mono text-xs font-medium'>
                        {caseHistory?.accountDetails?.accountNumber}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground mb-1 block text-xs'>
                        NPA Date
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <Calendar className='text-muted-foreground h-3 w-3' />
                        {caseHistory?.accountDetails?.dateOfNpa}
                      </span>
                    </div>
                  </div>

                  <div className='rounded-lg border bg-slate-50 p-3'>
                    <div className='flex items-start gap-3'>
                      <Building2 className='text-muted-foreground mt-0.5 h-4 w-4' />
                      <div>
                        <p className='text-xs font-medium'>
                          {caseHistory?.accountDetails?.branchName}
                        </p>
                        <p className='text-muted-foreground text-[11px]'>
                          Code: {caseHistory?.accountDetails?.branchCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-3'>
                    <div className='flex items-center gap-2'>
                      <Wallet className='h-4 w-4 text-emerald-600' />
                      <span className='text-xs font-medium text-emerald-800'>
                        Outstanding
                      </span>
                    </div>
                    <span className='text-lg font-bold text-emerald-700'>
                      ₹
                      {caseHistory?.accountDetails?.outstandingBalance?.toLocaleString(
                        'en-IN'
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainWrapper>
  )
}

export default RouteComponent

const toTime = (v?: string) => {
  if (!v) return 0
  const t = Date.parse(v) // returns NaN if invalid
  return Number.isFinite(t) ? t : 0
}

function StageTimelineItem({
  summary,
  idx,
  total,
  caseHistory,
  accountNumber,
  downloadingStageKey,
  downloadStagePdf,
}: {
  summary: StageSummaryItem
  idx: number
  total: number
  caseHistory: components['schemas']['CaseHistory']
  accountNumber?: string | number | null
  downloadingStageKey: string | null
  downloadStagePdf: (stageKey: string, stageName?: string) => Promise<void>
}) {
  const stageKey = String(summary.stageKey ?? '')
  const stageName = String(summary.stageName ?? '')

  const stageTimelineItem =
    (caseHistory?.stageTimeline ?? []).find(
      (t) => String(t.stageKey ?? '') === stageKey
    ) ?? null

  const actionsFromActionHistory =
    (caseHistory?.actionHistory ?? []).filter((a) =>
      sameStageName(a.stageName, stageName)
    ) ?? []

  const docsFromDocumentHistory =
    (caseHistory?.documentHistory ?? []).filter((d) =>
      sameStageName(d.stageName, stageName)
    ) ?? []

  const docsFromStageSummary = (summary.documents ?? []) as StageDocument[]
  const actionsFromStageSummary = (summary.actions ?? []) as NonNullable<
    StageSummaryItem['actions']
  >

  const mergedDocs = useMemo(() => {
    const all = [...docsFromStageSummary, ...docsFromDocumentHistory]
    const seen = new Set<string>()
    return all.filter((d) => {
      const k = String(
        d.documentId ?? `${d.fileUrl ?? ''}-${d.uploadedAt ?? ''}`
      )
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [docsFromStageSummary, docsFromDocumentHistory])

  const mergedActions = useMemo(() => {
    const all = [...actionsFromStageSummary, ...actionsFromActionHistory]
    const seen = new Set<string>()
    return all.filter((a) => {
      const k = String(
        a.taskId ??
          `${a.actionType ?? ''}-${a.actionDate ?? ''}-${a.actionBy ?? ''}`
      )
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [actionsFromStageSummary, actionsFromActionHistory])

  const isActive = summary.status === 'IN_PROGRESS'
  const isCompleted = summary.status === 'COMPLETED'
  const isLast = idx === total - 1

  return (
    <div className='group relative flex min-w-[180px] flex-col items-center'>
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute top-[11px] left-1/2 -z-10 h-[2px] w-full',
            isCompleted ? 'bg-emerald-500/50' : 'bg-slate-200'
          )}
        />
      )}

      {/* Dot */}
      <div
        className={cn(
          'z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition-all duration-300',
          getStatusDotClasses(summary.status)
        )}
      >
        {isCompleted && <CheckCircle2 className='h-3 w-3 text-white' />}
      </div>

      {/* Label */}
      <div className='mt-3 flex flex-col items-center space-y-1 px-2 text-center'>
        <p
          className={cn(
            'max-w-[140px] text-xs leading-tight font-semibold whitespace-normal',
            isActive ? 'text-blue-600' : 'text-slate-600'
          )}
        >
          {summary.stageName}
        </p>
        <p className='text-[10px] font-medium text-slate-400'>
          {summary.endDate
            ? format(new Date(summary.endDate), 'dd MMM')
            : isActive
              ? 'Current'
              : ''}
        </p>
      </div>

      {/* Details Dialog Trigger */}
      {(summary.documents?.length ?? 0) > 0 ||
      (summary.actions?.length ?? 0) > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='mt-1 h-6 w-6 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            >
              <History className='h-3 w-3' />
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle>{summary.stageName}</DialogTitle>
              <DialogDescription>Stage History & Audit Log</DialogDescription>
            </DialogHeader>

            <ScrollArea className='max-h-[60vh] pr-4'>
              <div className='space-y-6'>
                {/* Stats Grid */}
                <div className='grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-4 text-sm'>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Status</p>
                    <Badge variant='outline'>{safeText(summary.status)}</Badge>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Duration</p>
                    <p className='font-medium'>{safeText(summary.duration)}</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Started</p>
                    <p className='font-medium'>
                      {formatDateTime(summary.startDate)}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Ended</p>
                    <p className='font-medium'>
                      {formatDateTime(summary.endDate)}
                    </p>
                  </div>
                  {stageTimelineItem?.notes && (
                    <div className='col-span-2 mt-2 rounded bg-white p-2 text-xs'>
                      <span className='font-semibold'>Notes:</span>{' '}
                      {stageTimelineItem.notes}
                    </div>
                  )}
                </div>

                {!isApprovalStageKey(summary.stageKey) && (
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() =>
                      downloadStagePdf(
                        String(summary.stageKey ?? ''),
                        String(summary.stageName ?? '')
                      )
                    }
                    disabled={
                      !accountNumber ||
                      !summary.stageKey ||
                      downloadingStageKey === String(summary.stageKey)
                    }
                  >
                    {downloadingStageKey === String(summary.stageKey) ? (
                      <Clock className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    Download Stage PDF
                  </Button>
                )}

                {/* Actions Timeline */}
                <div>
                  <h4 className='mb-3 text-sm font-semibold'>Activity Log</h4>
                  {mergedActions.length === 0 ? (
                    <p className='text-muted-foreground text-sm italic'>
                      No actions recorded.
                    </p>
                  ) : (
                    <div className='relative space-y-4 pl-4 before:absolute before:top-2 before:left-0 before:h-full before:w-[2px] before:bg-slate-100'>
                      {mergedActions
                        .sort(
                          (a, b) => toTime(b.actionDate) - toTime(a.actionDate)
                        )
                        .map((a, i) => (
                          <div
                            key={`${a.taskId}-${i}`}
                            className='relative text-sm'
                          >
                            <div className='absolute top-1.5 -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-slate-300 ring-4 ring-white' />
                            <div className='rounded-lg border bg-white p-3 shadow-sm'>
                              <div className='flex items-center justify-between'>
                                <Badge variant='secondary' className='text-xs'>
                                  {safeText(a.actionType).replace(/_/g, ' ')}
                                </Badge>
                                <span className='text-muted-foreground text-[10px]'>
                                  {formatDateTime(a.actionDate)}
                                </span>
                              </div>
                              <p className='mt-2 text-xs'>
                                <span className='text-muted-foreground'>
                                  By:{' '}
                                </span>
                                {safeText(a.actionBy)}
                              </p>
                              {a.comments && (
                                <p className='bg-muted/30 mt-2 rounded p-2 text-xs italic'>
                                  "{a.comments}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Documents List */}
                <div>
                  <h4 className='mb-3 text-sm font-semibold'>
                    Documents ({mergedDocs.length})
                  </h4>
                  {mergedDocs.length === 0 ? (
                    <p className='text-muted-foreground text-sm italic'>
                      No documents found.
                    </p>
                  ) : (
                    <div className='grid gap-2'>
                      {mergedDocs.map((doc) => (
                        <div
                          key={doc.documentId}
                          className='flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='rounded bg-red-50 p-2 text-red-500'>
                              <FileText className='h-4 w-4' />
                            </div>
                            <div className='flex flex-col'>
                              <a
                                href={`${import.meta.env.VITE_APP_API_URL}/${doc.fileUrl}`}
                                target='_blank'
                                rel='noreferrer'
                                className='text-foreground font-medium hover:underline'
                              >
                                {doc.documentName}
                              </a>
                              <span className='text-muted-foreground text-[10px]'>
                                {formatDateTime(doc.uploadedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      ) : (
        <div className='h-7' />
      )}
    </div>
  )
}
