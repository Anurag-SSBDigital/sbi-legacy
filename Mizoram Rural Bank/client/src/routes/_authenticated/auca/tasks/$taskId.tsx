import React, { useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Paperclip,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

/* =========================================
   Route
========================================= */

export const Route = createFileRoute('/_authenticated/auca/tasks/$taskId')({
  component: RouteComponent,
})

/* =========================================
   Types
========================================= */

type StageDocument = components['schemas']['StoredFileInfo']

type CaseHistory = {
  accountDetails?: components['schemas']['SarfaesiAccountIdentification']
  workflowInstance?: components['schemas']['WorkflowInstance']
  stageTimeline?: components['schemas']['StageTimeline'][]
  actionHistory?: components['schemas']['ActionHistory'][]
  documentHistory?: components['schemas']['DocumentHistory'][]
  stageSummary?: components['schemas']['StageSummary'][]
  currentStatus?: components['schemas']['CurrentStatus']
}

/* =========================================
   Helpers
========================================= */

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
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
      return 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-500/20'
    case 'IN_PROGRESS':
      return 'bg-blue-600 border-blue-600 ring-4 ring-blue-600/20 animate-pulse'
    case 'PENDING':
      return 'bg-muted-foreground/30 border-muted-foreground/30'
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-red-500 border-red-500'
    default:
      return 'bg-muted border-muted'
  }
}

const getStageStatus = (s: components['schemas']['StageSummary']) => {
  // ✅ New schema has no stageSummary.status, startDate/endDate/completedBy/duration fields.
  // Derive status from visits/tasks/current flag.
  if (s.current) return 'IN_PROGRESS'

  const hasCompletedTask =
    (s.tasks ?? []).some((t) => (t?.status ?? '').toUpperCase() === 'COMPLETED')

  const hasExited =
    (s.visits ?? []).some((v) => Boolean(v?.exitedAt))

  if (hasCompletedTask || hasExited) return 'COMPLETED'
  return 'PENDING'
}

const getStageStart = (s: components['schemas']['StageSummary']) => {
  const visits = s.visits ?? []
  const entered = visits.map((v) => v?.enteredAt).filter(Boolean) as string[]
  if (entered.length === 0) return undefined
  // earliest
  return entered.slice().sort((a, b) => Date.parse(a) - Date.parse(b))[0]
}

const getStageEnd = (s: components['schemas']['StageSummary']) => {
  const visits = s.visits ?? []
  const exited = visits.map((v) => v?.exitedAt).filter(Boolean) as string[]
  if (exited.length === 0) return undefined
  // latest exit
  return exited.slice().sort((a, b) => Date.parse(b) - Date.parse(a))[0]
}

const diffHuman = (start?: string, end?: string) => {
  if (!start || !end) return '—'
  const a = Date.parse(start)
  const b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return '—'
  const mins = Math.floor((b - a) / 60000)
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (hrs <= 0) return `${rem}m`
  return `${hrs}h ${rem}m`
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function pickBlob(res: unknown): Blob | null {
  if (typeof Blob !== 'undefined' && res instanceof Blob) return res
  if (isRecord(res) && typeof Blob !== 'undefined' && res.data instanceof Blob)
    return res.data
  return null
}

/* =========================================
   Document Upload Row
========================================= */

function DocumentUploadRow({
  uploading,
  onUpload,
  documents = [],
  documentsLoading,
  requiresDocuments,
}: {
  uploading: boolean
  onUpload: (file: File, comments?: string) => Promise<void>
  documents?: StageDocument[]
  documentsLoading?: boolean
  requiresDocuments?: boolean
}) {
  const [comments, setComments] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
  }

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    await onUpload(selectedFile, comments)
    setSelectedFile(null)
    setComments('')
  }

  return (
    <div className='bg-card group rounded-lg border p-4 transition-all hover:shadow-sm'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 rounded-full p-2'>
            <FileText className='text-primary h-4 w-4' />
          </div>
          <span className='font-medium'>Upload documents</span>
        </div>
        <Badge
          variant={requiresDocuments ? 'destructive' : 'outline'}
          className='text-[10px] tracking-wide uppercase'
        >
          {requiresDocuments ? 'Required' : 'Optional'}
        </Badge>
      </div>

      <div className='grid gap-4 md:grid-cols-[1fr,auto]'>
        <div className='space-y-3'>
          <Input
            type='file'
            className='file:text-foreground cursor-pointer text-xs'
            accept='application/pdf,image/*'
            disabled={uploading}
            onChange={handleFileChange}
          />
          <Textarea
            placeholder='Add optional comments...'
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className='min-h-[60px] resize-none text-xs'
          />
        </div>
        <div className='flex flex-col justify-end'>
          <Button
            type='button'
            size='sm'
            onClick={handleUploadClick}
            disabled={uploading || !selectedFile}
            className='w-full md:w-auto'
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {(documents?.length > 0 || documentsLoading) && (
        <div className='bg-muted/30 mt-4 rounded-md border p-3'>
          <p className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
            Uploaded Files
          </p>
          {documentsLoading ? (
            <div className='space-y-2'>
              <div className='bg-muted h-8 w-full animate-pulse rounded' />
            </div>
          ) : (
            <div className='space-y-2'>
              {documents.map((doc) => (
                <div
                  key={doc.storedFileName}
                  className='bg-background flex items-center justify-between rounded-md border p-2 text-sm shadow-sm'
                >
                  <div className='flex items-center gap-2 overflow-hidden'>
                    <Paperclip className='text-muted-foreground h-3.5 w-3.5 flex-shrink-0' />
                    <div className='flex flex-col'>
                      <a
                        href={`${import.meta.env.VITE_APP_API_URL}/${doc.fileUrl}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary truncate font-medium hover:underline'
                      >
                        {doc.storedFileName ?? 'View Document'}
                      </a>
                      <span className='text-muted-foreground text-[10px]'>
                        {formatDateTime(doc.uploadTime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================
   Shallow mutation wrapper
========================================= */

type ShallowMutationResult = {
  mutate: (input: unknown) => void
  mutateAsync: (input: unknown) => Promise<unknown>
  isPending?: boolean
}
const useMutationShallow = $api.useMutation as unknown as (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  opts?: unknown
) => ShallowMutationResult

/* =========================================
   Component
========================================= */

function RouteComponent() {
  const { taskId } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data } = $api.useSuspenseQuery('get', '/api/auca/tasks/{taskId}', {
    params: {
      path: { taskId: Number(taskId) },
      header: { Authorization: '' },
    },
  })

  const task = data.task
  const guidance = data.guidance
  const caseHistory = data.caseHistory as CaseHistory | undefined

  const stageDefId = guidance?.stageId
  const accountNumber = task?.accountNumber
  const currentStageKey = task?.currentStage
  const currentStageName = task?.stageName ?? guidance?.stageName

  // (keeping your existing logic)
  const isApprovalStage = true

  const requiredDocuments: string[] = guidance?.requiredDocuments ?? []
  const requiresDocuments: boolean = guidance?.requiresDocuments ?? false
  const requiredFieldsFromGuidance = new Set(guidance?.requiredFields ?? [])
  const requiredActions: string[] = guidance?.requiredActions ?? []

  const showAnnexureBDownload = guidance?.currentStage !== 'TGB_RECOMMENDATION'

  // --- Queries & Mutations ---
  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = $api.useQuery(
    'get',
    '/api/auca/documents/{accountNumber}/stageDef/{stageDefId}',
    {
      params: {
        path: {
          accountNumber: String(accountNumber),
          stageDefId: Number(stageDefId),
        },
        header: { Authorization: '' },
      },
    },
    { enabled: Boolean(accountNumber) && Boolean(stageDefId) }
  )

  const allDocuments: StageDocument[] = useMemo(
    () => documents?.data ?? [],
    [documents]
  )

  const uploadDocumentMutation = $api.useMutation(
    'post',
    '/api/auca/{accountNumber}/upload-documents'
  )

  const completeTaskMutation = $api.useMutation(
    'post',
    '/api/auca/{accountNumber}/complete-task'
  )

  const downloadAnnexureBMutation = useMutationShallow(
    'get',
    '/auca-transfer/tgb/pdf/annexure-b/{accountNumber}'
  )

  const handleDownloadAnnexureB = useCallback(async () => {
    if (!accountNumber) {
      toast.error('Account number not found')
      return
    }

    try {
      const res = await downloadAnnexureBMutation.mutateAsync({
        params: {
          path: { accountNumber: String(accountNumber) },
          header: { Authorization: '', Accept: '*/*' },
        },
        parseAs: 'blob',
      } as unknown)

      const blob = pickBlob(res)
      if (!blob) {
        toast.error('Failed to download Annexure B.')
        return
      }

      const filename = `Annexure-B-${String(accountNumber)}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Annexure B download started.')
    } catch (err) {
      toastError(err, 'Failed to download Annexure B.')
    }
  }, [accountNumber, downloadAnnexureBMutation])

  const [isUploading, setIsUploading] = useState(false)

  // ------------------------------
  // TGB Recommendation - Update Fields
  // ------------------------------
  const isTgbRecommendationStage = currentStageKey === 'TGB_RECOMMENDATION'

  const { data: aucaTransfers } = $api.useQuery(
    'get',
    '/auca-transfer/account/{accountNumber}',
    { params: { path: { accountNumber: accountNumber ?? '' } } },
    { enabled: isTgbRecommendationStage }
  )

  const auTransferId = aucaTransfers?.data?.at(0)?.id

  const updateTgbFieldsMutation = $api.useMutation(
    'patch',
    '/auca-transfer/{id}/update-TGB-fields'
  )

  const [excludingUnappliedInterest, setExcludingUnappliedInterest] =
    useState<string>('')

  const [includingUnappliedInterest, setIncludingUnappliedInterest] =
    useState<string>('')

  const normalizeDecimal = (v: string) => {
    const trimmed = v.trim()
    if (!trimmed) return 0
    const ok = /^-?\d+(\.\d+)?$/.test(trimmed)
    return ok ? Number(trimmed) : 0
  }

  const handleSaveTgbFields = useCallback(async () => {
    if (!auTransferId) {
      toast.error('Transfer ID not found for updating TGB fields')
      return
    }

    const excl = normalizeDecimal(excludingUnappliedInterest)
    const incl = normalizeDecimal(includingUnappliedInterest)

    try {
      await updateTgbFieldsMutation.mutateAsync({
        params: {
          path: { id: Number(auTransferId) },
          header: { Authorization: '' },
        },
        body: {
          excludingUnappliedInterest: excl,
          includingUnappliedInterest: incl,
        },
      })

      toast.success('TGB fields updated successfully')
    } catch (error) {
      toastError(error, 'Failed to update TGB fields')
    }
  }, [
    auTransferId,
    excludingUnappliedInterest,
    includingUnappliedInterest,
    updateTgbFieldsMutation,
  ])

  // --- Handlers ---
  const handleUploadDocument = useCallback(
    async (file: File, comments?: string) => {
      try {
        setIsUploading(true)
        const fd = new FormData()
        fd.append('files', file)

        await uploadDocumentMutation.mutateAsync({
          params: {
            query: { comments, documentType: 'OTHERS' },
            path: { accountNumber: String(accountNumber) },
            header: { Authorization: '' },
          },
          body: fd as unknown as { files: string[] },
        })

        toast.success(`Document uploaded successfully`)
        await refetchDocuments?.()
      } catch {
        toast.error(`Failed to upload document`)
      } finally {
        setIsUploading(false)
      }
    },
    [uploadDocumentMutation, accountNumber, refetchDocuments]
  )

  const hasAnyDocumentUploaded = useMemo(
    () => allDocuments.length > 0,
    [allDocuments]
  )

  const canCompleteTask =
    isApprovalStage &&
    (!requiresDocuments || (hasAnyDocumentUploaded && !documentsLoading))

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | undefined>()
  const [completionComments, setCompletionComments] = useState('')

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
          payload: { approvalComments: completionComments },
        } as unknown as { [key: string]: Record<string, never> },
      })
      toast.success('Task marked as complete')
      setIsCompleteDialogOpen(false)
      setSelectedAction(undefined)
      setCompletionComments('')
      navigate({ to: '/auca/tasks' })
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

  /* =========================================
     ✅ NEW SCHEMA: stageSummary rendering
     - Use: current, visits, actions, documents, tasks, slaDays, requiresDocuments, assignmentType...
========================================= */

  const stageSummarySorted = useMemo(() => {
    const list = caseHistory?.stageSummary ?? []
    return list
      .slice()
      .sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
  }, [caseHistory?.stageSummary])

  // --- Main Layout ---
  return (
    <MainWrapper>
      <div className='min-h-screen pb-20'>
        {/* 1. Page Header */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur'>
          <div className='container mx-auto px-4 py-4 md:px-8'>
            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
              <div className='space-y-1'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <span>Tasks</span>
                  <span className='text-muted-foreground/50'>/</span>
                  <span>SARFAESI</span>
                  <span className='text-muted-foreground/50'>/</span>
                  <span className='text-foreground font-medium'>
                    #{task?.taskId}
                  </span>
                </div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {task?.taskDescription}
                </h1>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge
                  variant={task?.overdue ? 'destructive' : 'secondary'}
                  className='h-7 px-3'
                >
                  <Clock className='mr-1.5 h-3 w-3' />
                  {task?.overdue
                    ? 'Overdue'
                    : `Due in ${task?.daysRemaining} day(s)`}
                </Badge>
                <Badge
                  variant='outline'
                  className='border-primary/20 text-primary bg-primary/5 h-7'
                >
                  {task?.priority} Priority
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className='container mx-auto mt-6 grid grid-cols-1 gap-6 px-4 md:px-8 lg:grid-cols-12'>
          {/* 2. Left Main Column */}
          <div className='space-y-6 lg:col-span-8'>
            {/* ✅ Timeline (NEW SCHEMA) */}
            {stageSummarySorted.length > 0 && (
              <Card className='overflow-hidden border-none shadow-sm'>
                <CardContent className='p-0'>
                  <ScrollArea className='bg-background w-full whitespace-nowrap'>
                    <div className='flex w-max space-x-0 p-4'>
                      {stageSummarySorted.map((summary, idx) => {
                        const status = getStageStatus(summary)
                        const isActive = status === 'IN_PROGRESS'
                        const isCompleted = status === 'COMPLETED'
                        const isLast = idx === stageSummarySorted.length - 1

                        const start = getStageStart(summary)
                        const end = getStageEnd(summary)

                        const hasArtifacts =
                          (summary.documents?.length ?? 0) > 0 ||
                          (summary.actions?.length ?? 0) > 0 ||
                          (summary.tasks?.length ?? 0) > 0 ||
                          (summary.visits?.length ?? 0) > 0

                        return (
                          <div
                            key={`${summary.stageKey ?? 'stage'}-${idx}`}
                            className='group relative flex min-w-[170px] flex-col items-center'
                          >
                            {!isLast && (
                              <div
                                className={`absolute top-3 left-1/2 z-0 h-0.5 w-full ${isCompleted ? 'bg-primary/40' : 'bg-border'
                                  }`}
                              />
                            )}

                            <div
                              className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${getStatusDotClasses(
                                status
                              )}`}
                            >
                              {isCompleted && (
                                <CheckCircle2 className='h-3 w-3 text-white' />
                              )}
                            </div>

                            <div className='mt-3 space-y-1 px-2 text-center'>
                              <p
                                className={`max-w-[150px] text-xs leading-tight font-semibold whitespace-normal ${isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                  }`}
                              >
                                {summary.stageName ?? summary.stageKey ?? 'Stage'}
                              </p>

                              <div className='text-muted-foreground text-[10px] space-y-0.5'>
                                {end ? (
                                  <p>{format(new Date(end), 'dd MMM')}</p>
                                ) : isActive ? (
                                  <p>Current</p>
                                ) : (
                                  <p />
                                )}
                                {summary.slaDays != null && (
                                  <p>SLA: {summary.slaDays}d</p>
                                )}
                              </div>
                            </div>

                            {hasArtifacts ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='text-muted-foreground hover:text-foreground mt-1 h-6 w-6'
                                    title='View stage details'
                                  >
                                    <Info className='h-3 w-3' />
                                  </Button>
                                </DialogTrigger>

                                <DialogContent className='sm:max-w-2xl'>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {summary.stageName ?? summary.stageKey}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Stage summary (new schema): visits, tasks, actions & documents.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className='space-y-4'>
                                    {/* Meta */}
                                    <div className='grid gap-3 rounded-lg border bg-muted/20 p-3 text-xs sm:grid-cols-2'>
                                      <div>
                                        <p className='text-muted-foreground'>Stage Key</p>
                                        <p className='font-medium'>{summary.stageKey ?? '—'}</p>
                                      </div>
                                      <div>
                                        <p className='text-muted-foreground'>Status</p>
                                        <p className='font-medium'>{status}</p>
                                      </div>
                                      <div>
                                        <p className='text-muted-foreground'>Assignment</p>
                                        <p className='font-medium'>{summary.assignmentType ?? '—'}</p>
                                      </div>
                                      <div>
                                        <p className='text-muted-foreground'>Assignee</p>
                                        <p className='font-medium'>
                                          {summary.username ?? summary.roleId ?? summary.departmentId ?? '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className='text-muted-foreground'>Start</p>
                                        <p className='font-medium'>{formatDateTime(start ?? null)}</p>
                                      </div>
                                      <div>
                                        <p className='text-muted-foreground'>End</p>
                                        <p className='font-medium'>{formatDateTime(end ?? null)}</p>
                                      </div>
                                      <div className='sm:col-span-2'>
                                        <p className='text-muted-foreground'>Duration</p>
                                        <p className='font-medium'>
                                          {start && end ? diffHuman(start, end) : isActive && start ? diffHuman(start, new Date().toISOString()) : '—'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Visits */}
                                    {(summary.visits?.length ?? 0) > 0 && (
                                      <div className='space-y-2'>
                                        <p className='text-xs font-semibold tracking-wide uppercase text-muted-foreground'>
                                          Visits ({summary.visits?.length})
                                        </p>
                                        <div className='space-y-2'>
                                          {summary.visits?.map((v, i) => (
                                            <div key={i} className='rounded-md border bg-background p-3 text-xs'>
                                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <span className='font-medium'>
                                                  Entered: {formatDateTime(v.enteredAt ?? null)}
                                                </span>
                                                <span className='text-muted-foreground'>
                                                  By: {v.enteredBy ?? '—'}
                                                </span>
                                              </div>
                                              <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                                                <div>
                                                  <p className='text-muted-foreground'>Entry Trigger</p>
                                                  <p>{v.entryTrigger ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Entry Notes</p>
                                                  <p>{v.entryNotes ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Exited</p>
                                                  <p>{formatDateTime(v.exitedAt ?? null)}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Exited By</p>
                                                  <p>{v.exitedBy ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Exit Trigger</p>
                                                  <p>{v.exitTrigger ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Exit Notes</p>
                                                  <p>{v.exitNotes ?? '—'}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tasks */}
                                    {(summary.tasks?.length ?? 0) > 0 && (
                                      <div className='space-y-2'>
                                        <p className='text-xs font-semibold tracking-wide uppercase text-muted-foreground'>
                                          Tasks ({summary.tasks?.length})
                                        </p>
                                        <div className='space-y-2'>
                                          {summary.tasks?.map((t, i) => (
                                            <div key={i} className='rounded-md border bg-background p-3 text-xs'>
                                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <span className='font-medium'>Task #{t.taskId ?? '—'}</span>
                                                <Badge variant='outline' className='text-[10px]'>
                                                  {t.status ?? '—'}
                                                </Badge>
                                              </div>
                                              <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                                                <div>
                                                  <p className='text-muted-foreground'>Created</p>
                                                  <p>{formatDateTime(t.createdAt ?? null)}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Due</p>
                                                  <p>{formatDateTime(t.dueAt ?? null)}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Acted By</p>
                                                  <p>{t.actedBy ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Acted At</p>
                                                  <p>{formatDateTime(t.actedAt ?? null)}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    {(summary.actions?.length ?? 0) > 0 && (
                                      <div className='space-y-2'>
                                        <p className='text-xs font-semibold tracking-wide uppercase text-muted-foreground'>
                                          Actions ({summary.actions?.length})
                                        </p>
                                        <div className='space-y-2'>
                                          {summary.actions?.map((a, i) => (
                                            <div key={i} className='rounded-md border bg-background p-3 text-xs'>
                                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <span className='font-medium'>
                                                  {a.trigger ?? 'Action'}
                                                </span>
                                                <span className='text-muted-foreground'>
                                                  {formatDateTime(a.at ?? null)}
                                                </span>
                                              </div>
                                              <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                                                <div>
                                                  <p className='text-muted-foreground'>Changed By</p>
                                                  <p>{a.changedBy ?? '—'}</p>
                                                </div>
                                                <div>
                                                  <p className='text-muted-foreground'>Move</p>
                                                  <p>
                                                    {(a.fromStageKey ?? '—')} → {(a.toStageKey ?? '—')}
                                                  </p>
                                                </div>
                                                <div className='sm:col-span-2'>
                                                  <p className='text-muted-foreground'>Notes</p>
                                                  <p>{a.notes ?? '—'}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Documents */}
                                    {(summary.documents?.length ?? 0) > 0 && (
                                      <div className='space-y-2'>
                                        <p className='text-xs font-semibold tracking-wide uppercase text-muted-foreground'>
                                          Documents ({summary.documents?.length})
                                        </p>
                                        <div className='space-y-2'>
                                          {summary.documents?.map((d, i) => (
                                            <div
                                              key={`${d.documentId ?? i}`}
                                              className='rounded-md border bg-background p-3 text-xs'
                                            >
                                              <div className='flex flex-wrap items-start justify-between gap-2'>
                                                <div className='min-w-0'>
                                                  <p className='font-medium truncate'>
                                                    {d.documentName ?? d.documentType ?? 'Document'}
                                                  </p>
                                                  <p className='text-muted-foreground text-[11px]'>
                                                    Uploaded: {formatDateTime(d.uploadedAt ?? null)} {d.uploadedBy ? `• by ${d.uploadedBy}` : ''}
                                                  </p>
                                                  {d.comment && (
                                                    <p className='text-muted-foreground mt-1'>
                                                      {d.comment}
                                                    </p>
                                                  )}
                                                </div>

                                                {d.url ? (
                                                  <Button
                                                    type='button'
                                                    variant='outline'
                                                    size='sm'
                                                    className='text-[11px]'
                                                    onClick={() => window.open(d.url as string, '_blank', 'noopener,noreferrer')}
                                                  >
                                                    Open
                                                  </Button>
                                                ) : (
                                                  <Badge variant='secondary' className='text-[10px]'>
                                                    No URL
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {!hasArtifacts && (
                                      <p className='text-muted-foreground text-xs'>
                                        No visits/tasks/actions/documents recorded for this stage.
                                      </p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <div className='h-7' />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <ScrollBar orientation='horizontal' />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Stage Details + Documents (Approval stages) */}
            {isApprovalStage ? (
              <>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-lg font-semibold tracking-tight'>
                      Stage Details
                    </h2>
                    <Badge variant='outline'>{currentStageName}</Badge>
                  </div>

                  <Card className='border-blue-100 bg-blue-50/50'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm font-medium text-blue-800'>
                        <Info className='h-4 w-4' /> Approval Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='flex flex-wrap gap-2'>
                        {requiredDocuments.map((d) => (
                          <Badge
                            key={d}
                            variant='secondary'
                            className='border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                          >
                            {d.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {Array.from(requiredFieldsFromGuidance).map((f) => (
                          <Badge
                            key={f}
                            variant='secondary'
                            className='border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                          >
                            Field: {f}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='space-y-4'>
                  <h2 className='text-lg font-semibold tracking-tight'>
                    Documents
                  </h2>
                  <Card>
                    <CardContent className='space-y-4 p-6'>
                      <DocumentUploadRow
                        uploading={isUploading}
                        onUpload={handleUploadDocument}
                        documents={allDocuments}
                        documentsLoading={documentsLoading}
                        requiresDocuments={requiresDocuments}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : isTgbRecommendationStage ? (
              <Card className='border-amber-100 bg-amber-50/40'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-amber-900'>
                    TGB Recommendation Fields
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Annexure-B amounts (BigDecimal)
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-muted-foreground text-xs font-medium'>
                        Excluding unapplied interest
                      </label>
                      <Input
                        inputMode='decimal'
                        placeholder='e.g. 12345.67'
                        value={excludingUnappliedInterest}
                        onChange={(e) =>
                          setExcludingUnappliedInterest(e.target.value)
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='text-muted-foreground text-xs font-medium'>
                        Including unapplied interest
                      </label>
                      <Input
                        inputMode='decimal'
                        placeholder='e.g. 12345.67'
                        value={includingUnappliedInterest}
                        onChange={(e) =>
                          setIncludingUnappliedInterest(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      onClick={handleSaveTgbFields}
                      disabled={
                        updateTgbFieldsMutation.isPending || !auTransferId
                      }
                    >
                      {updateTgbFieldsMutation.isPending
                        ? 'Saving...'
                        : 'Save TGB Fields'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Stage not handled here
                  </CardTitle>
                  <CardDescription>
                    This screen is designed for <strong>approval</strong> stages
                    only. Please use the relevant module or screen for
                    processing this stage.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* 3. Right Sidebar Column (Sticky) */}
          <div className='space-y-6 lg:col-span-4'>
            <div className='sticky top-24 space-y-6'>
              {/* Task Actions only for approval stages */}
              {isApprovalStage && (
                <Card className='border-primary/20 ring-primary/5 shadow-md ring-1'>
                  <CardHeader className='bg-muted/20 pb-3'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <CheckCircle2 className='text-primary h-4 w-4' />
                      Task Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4 pt-4'>
                    <div className='space-y-2 text-sm'>
                      <div className='text-muted-foreground flex items-center justify-between'>
                        <span>Documents</span>
                        {requiresDocuments ? (
                          documentsLoading ? (
                            <span className='text-muted-foreground text-xs'>
                              Checking...
                            </span>
                          ) : hasAnyDocumentUploaded ? (
                            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                          ) : (
                            <span className='text-xs text-amber-600'>
                              Required
                            </span>
                          )
                        ) : (
                          <span className='text-muted-foreground text-xs'>
                            Optional
                          </span>
                        )}
                      </div>
                    </div>

                    {showAnnexureBDownload && (
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                        disabled={
                          !accountNumber ||
                          !!downloadAnnexureBMutation.isPending
                        }
                        onClick={handleDownloadAnnexureB}
                      >
                        {downloadAnnexureBMutation.isPending
                          ? 'Downloading Annexure B…'
                          : 'Download Annexure B'}
                      </Button>
                    )}

                    <Separator />
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
                          className='w-full'
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
                            <strong>{currentStageName}</strong>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className='grid gap-4 py-4'>
                          <div className='grid gap-2'>
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
                          <div className='grid gap-2'>
                            <label className='text-sm font-medium'>
                              Remarks
                            </label>
                            <Textarea
                              placeholder='Add final comments...'
                              value={completionComments}
                              onChange={(e) =>
                                setCompletionComments(e.target.value)
                              }
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
              )}

              {/* Account Info Card */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <User className='text-muted-foreground h-4 w-4' />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm'>
                  <div className='grid grid-cols-1 gap-1'>
                    <span className='text-muted-foreground text-xs'>
                      Customer Name
                    </span>
                    <span className='font-medium'>{task?.customerName}</span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <span className='text-muted-foreground mb-1 block text-xs'>
                        Account No
                      </span>
                      <span className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs font-medium'>
                        {task?.accountNumber}
                      </span>
                    </div>
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
