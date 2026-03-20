import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import AccountNoCell from '@/components/table/cells/account-no-cell.tsx'
import { DateTimeCell } from '@/components/table/cells/date-time-cell.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

export default function FRMBranchView() {
  const [branch, setBranch] = useState<string | undefined>(undefined)

  const { data, isLoading, refetch } = $api.useQuery(
    'get',
    '/onlineAlert/FRM/getAll',
    {
      params: { query: { id: branch }, header: { Authorization: '' } },
    }
  )

  const tabs = [
    {
      key: 'PENDING',
      label: 'Pending Approval',
      data: data?.data?.pendingAlerts ?? [],
    },
    {
      key: 'ACCEPTED',
      label: 'Accepted',
      data: data?.data?.acceptedAlerts ?? [],
    },
    {
      key: 'NORESOLUTION',
      label: 'Pending Resolution',
      data: data?.data?.noResolutionAlerts ?? [],
    },
    {
      key: 'REJECTED',
      label: 'Rejected',
      data: data?.data?.rejectedAlerts ?? [],
    },
  ] as const

  const columns: PaginatedTableProps<
    (typeof tabs)[number]['data'][number]
  >['columns'] = [
    {
      key: 'acctNo',
      label: 'Account Number',
      render: (value) => (value ? <AccountNoCell value={value} /> : '--'),
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => (value ? <DateTimeCell value={value} /> : '--'),
    },
    { key: 'description', label: 'Description' },
    { key: 'segement', label: 'Segment' },
  ]

  return (
    <MainWrapper extra={<BranchSelector value={branch} setValue={setBranch} />}>
      <div className='mx-2 text-2xl font-semibold'>FRM Alerts</div>
      <Separator className='my-2 lg:my-4' />

      {isLoading ? (
        <LoadingBar />
      ) : (
        <Tabs defaultValue={tabs[0].key} className='w-full'>
          <TabsList className='mb-4'>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label} ({tab.data?.length})
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <PaginatedTable
                data={tab.data ?? []}
                columns={columns}
                tableTitle={`${tab.label} Audits`}
                showSearch
                emptyMessage={`No ${tab.label.toLowerCase()} audits found.`}
                initialRowsPerPage={5}
                renderActions={
                  tab.key === 'ACCEPTED' || tab.key === 'PENDING'
                    ? undefined
                    : (row) => {
                        return (
                          <ResolutionDialog row={row} onSuccess={refetch} />
                        )
                      }
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </MainWrapper>
  )
}

interface ResolutionDialogProps {
  row: {
    description?: string
    segement?: string
    acctNo?: string
    guid?: string
    branchCode?: string
  }
  onSuccess?: () => void
}

function ResolutionDialog({ row, onSuccess }: ResolutionDialogProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [resolutionDesc, setResolutionDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = $api.useMutation(
    'post',
    '/FrmAlertResolution/{description}/{accountNumber}/upload'
  )
  const submitMutation = $api.useMutation('post', '/FrmAlertResolution/create')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview))
    }
  }, [previews])

  const resetForm = () => {
    setFiles([])
    setPreviews([])
    setResolutionDesc('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolutionDesc.trim()) {
      setError('Please enter resolution description.')
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      const documentNames: string[] = []

      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))

      await uploadMutation.mutateAsync(
        {
          body: formData as unknown as undefined,
          params: {
            query: undefined as unknown as { files: string[] },
            path: {
              description: row.description ?? '',
              accountNumber: row.acctNo ?? '',
            },
          },
        },
        {
          onSuccess: () => {
            documentNames.push(...files.map((f) => f.name))
            toast.success(`Uploaded ${files.length} file(s) successfully`)
          },
          onError: (err) => {
            toast.error(
              (err as Error)?.message ||
                `Failed to upload ${files.length} file(s)`
            )
          },
        }
      )

      await submitMutation.mutateAsync(
        {
          body: {
            description: row.description,
            segement: row.segement,
            acctNumber: row.acctNo,
            documentName: documentNames,
            branchCode: row.branchCode,
            resoluationDesc: resolutionDesc,
          },
        },
        {
          onSuccess: (res) => {
            toast.success(res?.message || 'Resolution submitted')
            setOpen(false)
            resetForm()
            onSuccess?.()
          },
          onError: (err) => {
            const msg =
              (err as unknown) instanceof Error
                ? (err as Error).message
                : 'Submission failed'
            toast.error(msg)
            setError(msg)
          },
        }
      )
    } catch {
      // handled above
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Resolve
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='mb-2 text-lg font-semibold'>
            Submit Resolution
          </DialogTitle>
          {/* Display key row data here */}
          <div className='mb-6 space-y-1 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700'>
            <p>
              <span className='font-semibold'>Description:</span>{' '}
              {row.description}
            </p>
            <p>
              <span className='font-semibold'>Account No:</span> {row.acctNo}
            </p>
            <p>
              <span className='font-semibold'>Segment:</span> {row.segement}
            </p>
            <p>
              <span className='font-semibold'>Branch Code:</span>{' '}
              {row.branchCode}
            </p>
            <p>
              <span className='font-semibold'>GUID:</span> {row.guid}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* File Upload Section */}
          <section>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Upload Images
            </label>
            <Input
              type='file'
              multiple
              accept='image/*'
              onChange={handleFileChange}
              className='mt-1'
              disabled={isSubmitting}
            />
            {files.length === 0 && (
              <p className='mt-1 text-xs text-gray-400'>
                No files selected. You can upload multiple images.
              </p>
            )}
          </section>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <section>
              <p className='mb-2 text-sm font-medium'>
                Image Previews ({previews.length})
              </p>
              <div className='grid grid-cols-3 gap-3'>
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className='relative overflow-hidden rounded shadow-sm transition-shadow duration-200 hover:shadow-md'
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className='h-24 w-full object-cover'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='absolute top-1 right-1 flex h-6 w-6 items-center justify-center p-0'
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resolution Description */}
          <section>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Resolution Description
            </label>
            <Textarea
              value={resolutionDesc}
              onChange={(e) => setResolutionDesc(e.target.value)}
              placeholder='Enter resolution details'
              className='mt-1'
              rows={4}
              disabled={isSubmitting}
            />
            <p className='mt-1 text-right text-xs text-gray-400'>
              {resolutionDesc.length} / 500
            </p>
          </section>

          {/* Error message */}
          {error && (
            <p className='text-sm font-semibold text-red-600'>{error}</p>
          )}

          {/* Buttons */}
          <DialogFooter className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                isSubmitting || !resolutionDesc.trim() || files.length === 0
              }
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
