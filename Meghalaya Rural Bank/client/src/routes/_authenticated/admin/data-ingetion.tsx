import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  CheckCircle2,
  File as FileIcon,
  FolderArchive,
  History,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { $api } from '@/lib/api.ts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import PaginatedTable, {
  type PaginatedTableColumn,
} from '@/components/paginated-table.tsx'

// ------------------ Route Definition ------------------
export const Route = createFileRoute('/_authenticated/admin/data-ingetion')({
  component: DataIngestionComponent,
})

// ------------------ API Types ------------------
type ZipUploadLog = {
  id?: number
  zipFileName?: string
  uploadedBy?: string
  uploadTime?: string // date-time
  extractedPath?: string
  dataDate?: string // YYYY-MM-DD (string)
}

type FileProcessingLog = {
  id?: number
  zipUploadId?: number
  fileName?: string
  fileType?: string
  status?: string
  errorMessage?: string
  startTime?: string
  endTime?: string
  dataDate?: string
  filePath?: string
}

// ------------------ Utils ------------------
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—')
const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString() : '—')
const durationMs = (start?: string, end?: string) => {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m < 60) return `${m}m ${rem}s`
  const h = Math.floor(m / 60)
  const mr = m % 60
  return `${h}h ${mr}m`
}
const extractArray = <T,>(resp: unknown): T[] => {
  if (!resp) return []
  if (Array.isArray(resp)) return resp as T[]
  if (Array.isArray((resp as { data: T[] })?.data))
    return (resp as { data: T[] }).data as T[]
  if (Array.isArray((resp as { data: { data: T[] } })?.data?.data))
    return (resp as { data: { data: T[] } }).data.data as T[]
  return []
}

// ------------------ Dialog (ZIP → File logs) ------------------
function ZipFileLogsDialog({
  open,
  onOpenChange,
  zip,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  zip: ZipUploadLog
}) {
  const { data: filesResp, isLoading } = $api.useQuery(
    'get',
    '/api/zip/{zipId}/files',
    {
      params: {
        path: { zipId: Number(zip.id) },
      },
    }
  ) as {
    data?: FileProcessingLog[] | { data?: FileProcessingLog[] }
    isLoading: boolean
  }

  const fileLogs = extractArray<FileProcessingLog>(filesResp)

  const fileColumns = useMemo<PaginatedTableColumn<FileProcessingLog>[]>(
    () => [
      { key: 'fileName', label: 'File' },
      { key: 'fileType', label: 'Type' },
      {
        key: 'status',
        label: 'Status',
        render: (v) => {
          const s = String(v || '').toLowerCase()
          const tone =
            s === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : s === 'processing'
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                : s === 'skipped'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
          return (
            <Badge className={tone + ' font-medium'} variant='secondary'>
              {String(v || '—')}
            </Badge>
          )
        },
      },
      {
        key: 'startTime',
        label: 'Start',
        render: (v) => <span>{fmtDateTime(String(v))}</span>,
      },
      {
        key: 'endTime',
        label: 'End',
        render: (v) => <span>{fmtDateTime(String(v))}</span>,
      },
      {
        key: 'startTime',
        label: 'Duration',
        render: (_v, row) => (
          <span>{durationMs(row.startTime, row.endTime)}</span>
        ),
      },
      {
        key: 'dataDate',
        label: 'Data Date',
        render: (v) => <span>{fmtDate(String(v))}</span>,
      },
      {
        key: 'errorMessage',
        label: 'Error',
        render: (v) =>
          v ? (
            <span
              title={String(v)}
              className='line-clamp-1 max-w-[24rem] text-xs text-rose-700 dark:text-rose-300'
            >
              {String(v)}
            </span>
          ) : (
            <span className='text-xs text-muted-foreground'>—</span>
          ),
      },
    ],
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200/70 bg-background p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950'>
        <DialogHeader className='border-b border-slate-200/70 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50'>
                <History className='h-4 w-4 text-sky-500' />
                File Processing Logs
              </DialogTitle>
              <DialogDescription className='mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    <FolderArchive className='h-3 w-3' />
                    {zip.zipFileName}
                  </span>
                  {zip.dataDate && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                      Data Date: {fmtDate(zip.dataDate)}
                    </span>
                  )}
                </div>
                <div className='flex flex-wrap gap-4 text-[11px]'>
                  <span>
                    <span className='font-medium text-slate-600 dark:text-slate-200'>
                      Uploaded:
                    </span>{' '}
                    {fmtDateTime(zip.uploadTime)}
                  </span>
                  {zip.uploadedBy && (
                    <span>
                      <span className='font-medium text-slate-600 dark:text-slate-200'>
                        By:
                      </span>{' '}
                      {zip.uploadedBy}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>

            {/* Status legend */}
            <div className='hidden flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 sm:flex'>
              <span className='font-semibold uppercase tracking-wide'>
                Legend
              </span>
              <div className='flex flex-wrap gap-1'>
                <Badge className='bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'>
                  Success
                </Badge>
                <Badge className='bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'>
                  Processing
                </Badge>
                <Badge className='bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'>
                  Skipped
                </Badge>
                <Badge className='bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'>
                  Failed
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='max-h-[70vh] overflow-y-auto px-4 pb-4 pt-3'>
          {isLoading ? (
            <div className='flex items-center justify-center py-10 text-sm text-muted-foreground'>
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              Loading logs…
            </div>
          ) : (
            <PaginatedTable<FileProcessingLog>
              data={fileLogs}
              columns={fileColumns}
              initialRowsPerPage={10}
              showSearch
              tableTitle='Files in ZIP'
              emptyMessage='No files found for this ZIP.'
              frameless
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ------------------ Main Component ------------------
function DataIngestionComponent() {
  // --- Upload state (with faux progress) ---
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressTimer = useRef<number | null>(null)

  // --- Filters for uploads list ---
  const [filters, setFilters] = useState<{
    startDate?: string
    endDate?: string
    uploadedBy?: string
  }>({})
  const [appliedFilters, setAppliedFilters] = useState(filters)

  // --- Selected ZIP for dialog ---
  const [selectedZip, setSelectedZip] = useState<ZipUploadLog | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)

  const token = sessionStorage.getItem('token') || ''

  // ---- Queries / Mutations using $api ----
  const {
    data: uploadsResp,
    isLoading: listLoading,
    refetch: refetchUploads,
  } = $api.useQuery('get', '/api/zip/uploads', {
    params: {
      query: {
        ...(appliedFilters.startDate
          ? { startDate: appliedFilters.startDate }
          : {}),
        ...(appliedFilters.endDate ? { endDate: appliedFilters.endDate } : {}),
        ...(appliedFilters.uploadedBy
          ? { uploadedBy: appliedFilters.uploadedBy }
          : {}),
      },
    },
  }) as {
    data?: ZipUploadLog[] | { data?: ZipUploadLog[] }
    isLoading: boolean
    refetch: () => void
  }

  const uploadZipMutation = $api.useMutation('post', '/api/zip/upload')

  const zipUploads = useMemo(
    () => extractArray<ZipUploadLog>(uploadsResp),
    [uploadsResp]
  )

  // ---- Upload handlers ----
  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const isZip =
        selectedFile.name.endsWith('.zip') ||
        [
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream',
        ].includes(selectedFile.type)
      if (!isZip) {
        setStatus('error')
        setError('Invalid file type. Please upload a .zip file.')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setStatus('idle')
      setError(null)
    }
  }

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }

  const startFauxProgress = () => {
    setProgress(10)
    if (progressTimer.current) window.clearInterval(progressTimer.current)
    // Smoothly move towards 90% while uploading
    progressTimer.current = window.setInterval(() => {
      setProgress((p) =>
        p < 90 ? p + Math.max(1, Math.round((90 - p) * 0.08)) : p
      )
    }, 250) as unknown as number
  }

  const stopFauxProgress = (complete = false) => {
    if (progressTimer.current) window.clearInterval(progressTimer.current)
    progressTimer.current = null
    setProgress(complete ? 100 : 0)
    if (complete) {
      setTimeout(() => setProgress(0), 800)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setError(null)
    startFauxProgress()

    const formData = new FormData()
    formData.append('file', file)

    uploadZipMutation.mutate(
      {
        body: formData as unknown as { file: string }, // runtime: FormData is fine
        params: {
          header: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
      {
        onSuccess: () => {
          stopFauxProgress(true)
          setStatus('success')
          toast.success('Upload successful')
          refetchUploads()
        },
        onError: (err) => {
          stopFauxProgress(false)
          setStatus('error')
          setError(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || 'Upload failed. Please try again.'
          )
          toast.error('Upload failed')
        },
      }
    )
  }

  const clearFile = () => {
    setFile(null)
    setProgress(0)
    setStatus('idle')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---- Columns ----
  const zipColumns = useMemo<PaginatedTableColumn<ZipUploadLog>[]>(
    () => [
      {
        key: 'zipFileName',
        label: 'ZIP File',
        render: (v, row) => (
          <button
            type='button'
            className='max-w-xs truncate text-left text-sm font-medium text-sky-700 hover:underline dark:text-sky-300'
            onClick={() => {
              setSelectedZip(row)
              setLogsOpen(true)
            }}
            title='View file processing logs'
          >
            {v || '—'}
          </button>
        ),
      },
      {
        key: 'uploadedBy',
        label: 'Uploaded By',
        render: (v) =>
          v ? (
            <span className='text-sm'>{v}</span>
          ) : (
            <span className='text-xs text-muted-foreground'>—</span>
          ),
      },
      {
        key: 'uploadTime',
        label: 'Uploaded At',
        render: (v) => (
          <span className='text-xs text-slate-600 dark:text-slate-300'>
            {fmtDateTime(String(v))}
          </span>
        ),
      },
      {
        key: 'dataDate',
        label: 'Data Date',
        render: (v) => (
          <span className='text-xs text-slate-700 dark:text-slate-200'>
            {fmtDate(String(v))}
          </span>
        ),
      },
    ],
    []
  )

  // ---- Apply/Reset filters -> drives useQuery params via appliedFilters ----
  const applyFilters = useCallback(() => setAppliedFilters(filters), [filters])
  const resetFilters = useCallback(() => {
    setFilters({})
    setAppliedFilters({})
  }, [])

  useEffect(() => {
    return () => {
      if (progressTimer.current) window.clearInterval(progressTimer.current)
    }
  }, [])

  return (
    <div className='mx-auto flex flex-col gap-6 p-4 md:p-6'>
      {/* Page header / meta */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          {/* <div className='inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700 dark:bg-sky-900/50 dark:text-sky-100'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
            Data Lake Ingestion · ZIP Upload
          </div> */}
          <h1 className='mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl'>
            <UploadCloud className='h-6 w-6 text-sky-500' />
            Data Ingestion
          </h1>
          <p className='mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400'>
            Upload daily or periodic ZIP dumps. Files are unpacked and processed
            automatically, with a complete audit trail of each file.
          </p>
        </div>

        {/* Small summary pill */}
        <div className='flex flex-col items-end gap-2 text-right text-[11px] text-slate-500 dark:text-slate-400'>
          {zipUploads.length > 0 && (
            <div className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200'>
              <History className='h-3.5 w-3.5 text-sky-500' />
              <span>
                {zipUploads.length} upload
                {zipUploads.length > 1 ? 's' : ''} tracked
              </span>
            </div>
          )}
          <span className='hidden md:inline'>
            Click any ZIP name to drill down into file-wise logs.
          </span>
        </div>
      </div>

      {/* Two-column layout: Upload + History */}
      <div className='grid gap-6 md:grid-cols-1'>
        {/* Upload Card */}
        <Card className='border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-md dark:border-slate-800 dark:from-slate-950 dark:to-slate-900'>
          <CardHeader className='border-b border-slate-200/70 pb-4 dark:border-slate-800'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <UploadCloud className='h-5 w-5 text-sky-500' />
              Upload ZIP
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 dark:text-slate-400'>
              Only compressed <span className='font-medium'>.zip</span> files
              are accepted. A single ZIP can contain multiple data files.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 pt-4'>
            {/* Dropzone */}
            <div
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-sm transition-colors duration-200 ease-in-out ${isDragging
                ? 'border-sky-500 bg-sky-50/70 dark:border-sky-400 dark:bg-sky-900/40'
                : 'border-slate-300 bg-slate-50/60 hover:border-sky-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-sky-400/80'
                }`}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className='flex flex-col items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-200'>
                  <UploadCloud className='h-6 w-6' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm'>
                    <span className='font-semibold text-sky-700 dark:text-sky-200'>
                      Click to upload
                    </span>{' '}
                    or drag and drop a ZIP file
                  </p>
                  <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                    Max recommended size depends on server limits. Only{' '}
                    <span className='font-medium'>.zip</span> formats are
                    accepted.
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type='file'
                  accept='.zip,application/zip'
                  className='hidden'
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            {/* Selected file preview */}
            {file && (
              <div className='flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sky-600 dark:bg-slate-800 dark:text-sky-200'>
                    <FileIcon className='h-5 w-5' />
                  </div>
                  <div className='space-y-0.5'>
                    <p className='truncate text-sm font-medium text-slate-900 dark:text-slate-50'>
                      {file.name}
                    </p>
                    <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={clearFile}
                  className='h-8 w-8 rounded-full'
                  aria-label='Clear file'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}

            {/* Progress / status */}
            {status === 'uploading' && (
              <div className='space-y-2'>
                <Progress value={progress} className='h-2 w-full rounded-full' />
                <p className='text-center text-xs text-slate-500 dark:text-slate-400'>
                  Uploading… {progress}%
                </p>
              </div>
            )}

            {status === 'success' && (
              <Alert
                variant='default'
                className='mt-1 border-emerald-200 bg-emerald-50 text-xs dark:border-emerald-900 dark:bg-emerald-950'
              >
                <CheckCircle2 className='h-4 w-4 !text-emerald-500' />
                <AlertTitle className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
                  Upload Successful
                </AlertTitle>
                <AlertDescription className='text-xs text-emerald-700/90 dark:text-emerald-300/90'>
                  Your ZIP has been accepted and queued for processing. You can
                  track file-wise status in the Uploaded ZIPs section.
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && error && (
              <Alert
                variant='destructive'
                className='mt-1 border-rose-300 bg-rose-50 text-xs dark:border-rose-900 dark:bg-rose-950'
              >
                <AlertCircle className='h-4 w-4' />
                <AlertTitle className='text-sm font-semibold'>
                  Upload Error
                </AlertTitle>
                <AlertDescription className='text-xs'>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className='border-t border-slate-200/70 bg-slate-50/70 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/70'>
            <Button
              onClick={handleUpload}
              disabled={
                !file ||
                status === 'uploading' ||
                status === 'success' ||
                uploadZipMutation.isPending
              }
              className='w-full text-sm font-medium'
            >
              {status === 'uploading' || uploadZipMutation.isPending ? (
                <span className='inline-flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Uploading…
                </span>
              ) : (
                'Upload ZIP'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Filters + ZIP List */}
        <Card className='border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950'>
          <CardHeader className='border-b border-slate-200/70 pb-3 dark:border-slate-800'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <History className='h-5 w-5 text-sky-500' />
                  Uploaded ZIPs
                </CardTitle>
                <CardDescription className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                  Browse historical uploads and drill down into file-level
                  processing status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-4 pt-4'>
            {/* Filters */}
            <div className='rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/70'>
              <div className='mb-3 flex items-center justify-between gap-2'>
                <span className='font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300'>
                  Filters
                </span>
                {Object.values(appliedFilters).some(Boolean) && (
                  <span className='text-[11px] text-slate-500 dark:text-slate-400'>
                    Showing filtered results
                  </span>
                )}
              </div>

              <div className='grid gap-3 md:grid-cols-4'>
                <div>
                  <label className='mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300'>
                    Start Date
                  </label>
                  <Input
                    type='date'
                    value={filters.startDate ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        startDate: e.target.value || undefined,
                      }))
                    }
                    className='h-8 text-xs'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300'>
                    End Date
                  </label>
                  <Input
                    type='date'
                    value={filters.endDate ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        endDate: e.target.value || undefined,
                      }))
                    }
                    className='h-8 text-xs'
                  />
                </div>
                <div className='md:col-span-1 lg:col-span-1'>
                  <label className='mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300'>
                    Uploaded By
                  </label>
                  <Input
                    placeholder='Username / email'
                    value={filters.uploadedBy ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        uploadedBy: e.target.value || undefined,
                      }))
                    }
                    className='h-8 text-xs'
                  />
                </div>
                <div className='flex items-end gap-2 md:justify-end'>
                  <Button
                    onClick={applyFilters}
                    className='h-8 flex-1 text-xs md:flex-none'
                  >
                    {listLoading ? (
                      <span className='inline-flex items-center gap-2'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        Loading
                      </span>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={resetFilters}
                    className='h-8 flex-1 text-xs md:flex-none'
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <PaginatedTable<ZipUploadLog>
              data={zipUploads}
              columns={zipColumns}
              initialRowsPerPage={10}
              tableTitle={listLoading ? 'Loading…' : 'Recent Uploads'}
              renderActions={(row) => (
                <Button
                  size='sm'
                  variant='outline'
                  className='h-8 text-xs'
                  onClick={() => {
                    setSelectedZip(row)
                    setLogsOpen(true)
                  }}
                >
                  View files
                </Button>
              )}
              emptyMessage={
                listLoading
                  ? 'Loading…'
                  : 'No uploads found yet. Upload your first ZIP on the left.'
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Logs Dialog (mounts only when open) */}
      {selectedZip && (
        <ZipFileLogsDialog
          open={logsOpen}
          onOpenChange={setLogsOpen}
          zip={selectedZip}
        />
      )}
    </div>
  )
}










// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import {
//   AlertCircle,
//   CheckCircle2,
//   File as FileIcon,
//   Loader2,
//   UploadCloud,
//   X,
// } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// import { Badge } from '@/components/ui/badge.tsx'
// import { Button } from '@/components/ui/button'
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Progress } from '@/components/ui/progress'
// import PaginatedTable, {
//   type PaginatedTableColumn,
// } from '@/components/paginated-table.tsx'

// // ------------------ Route Definition ------------------
// export const Route = createFileRoute('/_authenticated/admin/data-ingetion')({
//   component: DataIngestionComponent,
// })

// // ------------------ API Types ------------------
// type ZipUploadLog = {
//   id?: number
//   zipFileName?: string
//   uploadedBy?: string
//   uploadTime?: string // date-time
//   extractedPath?: string
//   dataDate?: string // YYYY-MM-DD (string)
// }

// type FileProcessingLog = {
//   id?: number
//   zipUploadId?: number
//   fileName?: string
//   fileType?: string
//   status?: string
//   errorMessage?: string
//   startTime?: string
//   endTime?: string
//   dataDate?: string
//   filePath?: string
// }

// // ------------------ Utils ------------------
// const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—')
// const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString() : '—')
// const durationMs = (start?: string, end?: string) => {
//   if (!start || !end) return '—'
//   const ms = new Date(end).getTime() - new Date(start).getTime()
//   if (ms < 0) return '—'
//   const s = Math.floor(ms / 1000)
//   if (s < 60) return `${s}s`
//   const m = Math.floor(s / 60)
//   const rem = s % 60
//   if (m < 60) return `${m}m ${rem}s`
//   const h = Math.floor(m / 60)
//   const mr = m % 60
//   return `${h}h ${mr}m`
// }
// const extractArray = <T,>(resp: unknown): T[] => {
//   if (!resp) return []
//   if (Array.isArray(resp)) return resp as T[]
//   if (Array.isArray((resp as { data: T[] })?.data))
//     return (resp as { data: T[] }).data as T[]
//   if (Array.isArray((resp as { data: { data: T[] } })?.data?.data))
//     return (resp as { data: { data: T[] } }).data.data as T[]
//   return []
// }

// // ------------------ Dialog (lazy query) ------------------
// function ZipFileLogsDialog({
//   open,
//   onOpenChange,
//   zip,
// }: {
//   open: boolean
//   onOpenChange: (v: boolean) => void
//   zip: ZipUploadLog
// }) {
//   const { data: filesResp, isLoading } = $api.useQuery(
//     'get',
//     '/api/zip/{zipId}/files',
//     {
//       params: {
//         path: { zipId: Number(zip.id) },
//       },
//     }
//   ) as {
//     data?: FileProcessingLog[] | { data?: FileProcessingLog[] }
//     isLoading: boolean
//   }

//   const fileLogs = extractArray<FileProcessingLog>(filesResp)

//   const fileColumns = useMemo<PaginatedTableColumn<FileProcessingLog>[]>(
//     () => [
//       { key: 'fileName', label: 'File' },
//       { key: 'fileType', label: 'Type' },
//       {
//         key: 'status',
//         label: 'Status',
//         render: (v) => {
//           const s = String(v || '').toLowerCase()
//           const tone =
//             s === 'success'
//               ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
//               : s === 'processing'
//                 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
//                 : s === 'skipped'
//                   ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
//                   : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
//           return (
//             <Badge className={tone + ' font-medium'} variant='secondary'>
//               {String(v || '—')}
//             </Badge>
//           )
//         },
//       },
//       {
//         key: 'startTime',
//         label: 'Start',
//         render: (v) => <span>{fmtDateTime(String(v))}</span>,
//       },
//       {
//         key: 'endTime',
//         label: 'End',
//         render: (v) => <span>{fmtDateTime(String(v))}</span>,
//       },
//       {
//         key: 'startTime',
//         label: 'Duration',
//         render: (_v, row) => (
//           <span>{durationMs(row.startTime, row.endTime)}</span>
//         ),
//       },
//       {
//         key: 'dataDate',
//         label: 'Data Date',
//         render: (v) => <span>{fmtDate(String(v))}</span>,
//       },
//       {
//         key: 'errorMessage',
//         label: 'Error',
//         render: (v) =>
//           v ? (
//             <span title={String(v)} className='line-clamp-1 max-w-[24rem]'>
//               {String(v)}
//             </span>
//           ) : (
//             <span className='text-muted-foreground'>—</span>
//           ),
//       },
//     ],
//     []
//   )

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='min-w-[85vw] overflow-scroll'>
//         <DialogHeader>
//           <DialogTitle>File Processing Logs</DialogTitle>
//           <DialogDescription>
//             <div className='mt-1 text-xs'>
//               <div>
//                 <span className='font-medium'>ZIP:</span> {zip.zipFileName}
//               </div>
//               <div className='flex gap-4'>
//                 <span>
//                   <span className='font-medium'>Uploaded:</span>{' '}
//                   {fmtDateTime(zip.uploadTime)}
//                 </span>
//                 <span>
//                   <span className='font-medium'>Data Date:</span>{' '}
//                   {fmtDate(zip.dataDate)}
//                 </span>
//               </div>
//             </div>
//           </DialogDescription>
//         </DialogHeader>

//         {isLoading ? (
//           <div className='text-muted-foreground flex items-center justify-center py-10'>
//             <Loader2 className='mr-2 h-5 w-5 animate-spin' />
//             Loading logs…
//           </div>
//         ) : (
//           <PaginatedTable<FileProcessingLog>
//             data={fileLogs}
//             columns={fileColumns}
//             initialRowsPerPage={10}
//             showSearch
//             tableTitle='Files'
//             emptyMessage='No files found for this ZIP.'
//             frameless
//           />
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// }

// // ------------------ Main Component ------------------
// function DataIngestionComponent() {
//   // --- Upload state (with faux progress) ---
//   const [file, setFile] = useState<File | null>(null)
//   const [progress, setProgress] = useState(0)
//   const [status, setStatus] = useState<
//     'idle' | 'uploading' | 'success' | 'error'
//   >('idle')
//   const [error, setError] = useState<string | null>(null)
//   const [isDragging, setIsDragging] = useState(false)
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const progressTimer = useRef<number | null>(null)

//   // --- Filters for uploads list ---
//   const [filters, setFilters] = useState<{
//     startDate?: string
//     endDate?: string
//     uploadedBy?: string
//   }>({})
//   const [appliedFilters, setAppliedFilters] = useState(filters)

//   // --- Selected ZIP for dialog ---
//   const [selectedZip, setSelectedZip] = useState<ZipUploadLog | null>(null)
//   const [logsOpen, setLogsOpen] = useState(false)

//   const token = sessionStorage.getItem('token') || ''

//   // ---- Queries / Mutations using $api ----
//   const {
//     data: uploadsResp,
//     isLoading: listLoading,
//     refetch: refetchUploads,
//   } = $api.useQuery('get', '/api/zip/uploads', {
//     params: {
//       query: {
//         ...(appliedFilters.startDate
//           ? { startDate: appliedFilters.startDate }
//           : {}),
//         ...(appliedFilters.endDate ? { endDate: appliedFilters.endDate } : {}),
//         ...(appliedFilters.uploadedBy
//           ? { uploadedBy: appliedFilters.uploadedBy }
//           : {}),
//       },
//     },
//   }) as {
//     data?: ZipUploadLog[] | { data?: ZipUploadLog[] }
//     isLoading: boolean
//     refetch: () => void
//   }

//   const uploadZipMutation = $api.useMutation('post', '/api/zip/upload')

//   const zipUploads = useMemo(
//     () => extractArray<ZipUploadLog>(uploadsResp),
//     [uploadsResp]
//   )

//   // ---- Upload handlers ----
//   const handleFileChange = (selectedFile: File | null) => {
//     if (selectedFile) {
//       const isZip =
//         selectedFile.name.endsWith('.zip') ||
//         [
//           'application/zip',
//           'application/x-zip-compressed',
//           'application/octet-stream',
//         ].includes(selectedFile.type)
//       if (!isZip) {
//         setStatus('error')
//         setError('Invalid file type. Please upload a .zip file.')
//         setFile(null)
//         return
//       }
//       setFile(selectedFile)
//       setStatus('idle')
//       setError(null)
//     }
//   }

//   const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//     setIsDragging(true)
//   }
//   const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//     setIsDragging(false)
//   }
//   const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//     setIsDragging(false)
//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       handleFileChange(e.dataTransfer.files[0])
//       e.dataTransfer.clearData()
//     }
//   }

//   const startFauxProgress = () => {
//     setProgress(10)
//     if (progressTimer.current) window.clearInterval(progressTimer.current)
//     // Smoothly move towards 90% while uploading
//     progressTimer.current = window.setInterval(() => {
//       setProgress((p) =>
//         p < 90 ? p + Math.max(1, Math.round((90 - p) * 0.08)) : p
//       )
//     }, 250) as unknown as number
//   }

//   const stopFauxProgress = (complete = false) => {
//     if (progressTimer.current) window.clearInterval(progressTimer.current)
//     progressTimer.current = null
//     setProgress(complete ? 100 : 0)
//     if (complete) {
//       setTimeout(() => setProgress(0), 800)
//     }
//   }

//   const handleUpload = async () => {
//     if (!file) return
//     setStatus('uploading')
//     setError(null)
//     startFauxProgress()

//     const formData = new FormData()
//     formData.append('file', file)

//     uploadZipMutation.mutate(
//       {
//         body: formData as unknown as { file: string }, // $api expects a body; FormData is fine at runtime
//         params: {
//           header: {
//             Authorization: `Bearer ${token}`,
//             // Do NOT set Content-Type manually; browser will set proper multipart boundary
//           },
//         },
//       },
//       {
//         onSuccess: () => {
//           stopFauxProgress(true)
//           setStatus('success')
//           toast.success('Upload successful')
//           refetchUploads()
//         },
//         onError: (err) => {
//           stopFauxProgress(false)
//           setStatus('error')
//           setError(
//             (err as { response: { data: { message: string } } })?.response?.data
//               ?.message || 'Upload failed. Please try again.'
//           )
//           toast.error('Upload failed')
//         },
//       }
//     )
//   }

//   const clearFile = () => {
//     setFile(null)
//     setProgress(0)
//     setStatus('idle')
//     setError(null)
//     if (fileInputRef.current) fileInputRef.current.value = ''
//   }

//   // ---- Columns ----
//   const zipColumns = useMemo<PaginatedTableColumn<ZipUploadLog>[]>(
//     () => [
//       {
//         key: 'zipFileName',
//         label: 'ZIP File',
//         render: (v, row) => (
//           <button
//             className='text-left font-medium hover:underline'
//             onClick={() => {
//               setSelectedZip(row)
//               setLogsOpen(true)
//             }}
//             title='View file processing logs'
//           >
//             {v || '—'}
//           </button>
//         ),
//       },
//       { key: 'uploadedBy', label: 'Uploaded By' },
//       {
//         key: 'uploadTime',
//         label: 'Uploaded At',
//         render: (v) => <span>{fmtDateTime(String(v))}</span>,
//       },
//       {
//         key: 'dataDate',
//         label: 'Data Date',
//         render: (v) => <span>{fmtDate(String(v))}</span>,
//       },
//     ],
//     []
//   )

//   // ---- Apply/Reset filters -> drives useQuery params via appliedFilters ----
//   const applyFilters = useCallback(() => setAppliedFilters(filters), [filters])
//   const resetFilters = useCallback(() => {
//     setFilters({})
//     setAppliedFilters({})
//   }, [])

//   useEffect(() => {
//     return () => {
//       if (progressTimer.current) window.clearInterval(progressTimer.current)
//     }
//   }, [])

//   return (
//     <div className='container mx-auto max-w-6xl space-y-6 p-4'>
//       {/* Upload Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle className='text-2xl'>Data Ingestion</CardTitle>
//           <CardDescription>
//             Upload a single ZIP file containing the required data dumps.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div
//             className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 ${isDragging ? `border-primary bg-primary/10` : `border-border hover:border-primary/50`} transition-colors duration-200 ease-in-out`}
//             onDragEnter={onDragEnter}
//             onDragLeave={onDragLeave}
//             onDragOver={(e) => e.preventDefault()}
//             onDrop={onDrop}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <UploadCloud className='text-muted-foreground h-12 w-12' />
//             <p className='text-muted-foreground mt-4 text-center'>
//               <span className='text-primary font-semibold'>
//                 Click to upload
//               </span>{' '}
//               or drag and drop a .zip file here.
//             </p>
//             <Input
//               ref={fileInputRef}
//               type='file'
//               accept='.zip,application/zip'
//               className='hidden'
//               onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
//             />
//           </div>

//           {file && (
//             <div className='mt-4 flex items-center justify-between rounded-lg border p-4'>
//               <div className='flex items-center gap-3'>
//                 <FileIcon className='text-primary h-6 w-6' />
//                 <div>
//                   <p className='text-sm font-medium'>{file.name}</p>
//                   <p className='text-muted-foreground text-xs'>
//                     {(file.size / (1024 * 1024)).toFixed(2)} MB
//                   </p>
//                 </div>
//               </div>
//               <Button variant='ghost' size='icon' onClick={clearFile}>
//                 <X className='h-4 w-4' />
//               </Button>
//             </div>
//           )}

//           {status === 'uploading' && (
//             <div className='mt-4'>
//               <Progress value={progress} className='w-full' />
//               <p className='text-muted-foreground mt-2 text-center text-sm'>
//                 {progress}%
//               </p>
//             </div>
//           )}

//           {status === 'success' && (
//             <Alert
//               variant='default'
//               className='mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
//             >
//               <CheckCircle2 className='h-4 w-4 !text-green-500' />
//               <AlertTitle className='text-green-700 dark:text-green-400'>
//                 Upload Successful!
//               </AlertTitle>
//               <AlertDescription className='text-green-600 dark:text-green-500'>
//                 Your file has been uploaded and is being processed.
//               </AlertDescription>
//             </Alert>
//           )}

//           {status === 'error' && error && (
//             <Alert variant='destructive' className='mt-4'>
//               <AlertCircle className='h-4 w-4' />
//               <AlertTitle>Upload Error</AlertTitle>
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}
//         </CardContent>
//         <CardFooter>
//           <Button
//             onClick={handleUpload}
//             disabled={
//               !file ||
//               status === 'uploading' ||
//               status === 'success' ||
//               uploadZipMutation.isPending
//             }
//             className='w-full'
//           >
//             {status === 'uploading' || uploadZipMutation.isPending ? (
//               <span className='inline-flex items-center gap-2'>
//                 <Loader2 className='h-4 w-4 animate-spin' />
//                 Uploading…
//               </span>
//             ) : (
//               'Upload File'
//             )}
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* Filters + ZIP List */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Uploaded ZIPs</CardTitle>
//           <CardDescription>
//             Browse recent uploads and view file processing status.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className='space-y-4'>
//           <div className='flex gap-4'>
//             <div className='sm:col-span-1'>
//               <label className='mb-1 block text-sm font-medium'>
//                 Start Date
//               </label>
//               <Input
//                 type='date'
//                 value={filters.startDate ?? ''}
//                 onChange={(e) =>
//                   setFilters((f) => ({
//                     ...f,
//                     startDate: e.target.value || undefined,
//                   }))
//                 }
//               />
//             </div>
//             <div className='sm:col-span-1'>
//               <label className='mb-1 block text-sm font-medium'>End Date</label>
//               <Input
//                 type='date'
//                 value={filters.endDate ?? ''}
//                 onChange={(e) =>
//                   setFilters((f) => ({
//                     ...f,
//                     endDate: e.target.value || undefined,
//                   }))
//                 }
//               />
//             </div>
//             <div className='sm:col-span-2'>
//               <label className='mb-1 block text-sm font-medium'>
//                 Uploaded By
//               </label>
//               <Input
//                 placeholder='Username / Email'
//                 value={filters.uploadedBy ?? ''}
//                 onChange={(e) =>
//                   setFilters((f) => ({
//                     ...f,
//                     uploadedBy: e.target.value || undefined,
//                   }))
//                 }
//               />
//             </div>
//             <div className='flex items-end gap-2 sm:col-span-1'>
//               <Button onClick={applyFilters} className='w-full'>
//                 {listLoading ? (
//                   <span className='inline-flex items-center gap-2'>
//                     <Loader2 className='h-4 w-4 animate-spin' />
//                     Loading
//                   </span>
//                 ) : (
//                   'Apply'
//                 )}
//               </Button>
//               <Button variant='outline' onClick={resetFilters}>
//                 Reset
//               </Button>
//             </div>
//           </div>

//           <PaginatedTable<ZipUploadLog>
//             data={zipUploads}
//             columns={zipColumns}
//             initialRowsPerPage={10}
//             tableTitle={listLoading ? 'Loading…' : undefined}
//             renderActions={(row) => (
//               <Button
//                 size='sm'
//                 variant='outline'
//                 onClick={() => {
//                   setSelectedZip(row)
//                   setLogsOpen(true)
//                 }}
//               >
//                 View files
//               </Button>
//             )}
//             emptyMessage={listLoading ? 'Loading…' : 'No uploads found.'}
//           />
//         </CardContent>
//       </Card>

//       {/* Logs Dialog (mounts only when open) */}
//       {selectedZip && (
//         <ZipFileLogsDialog
//           open={logsOpen}
//           onOpenChange={setLogsOpen}
//           zip={selectedZip}
//         />
//       )}
//     </div>
//   )
// }
