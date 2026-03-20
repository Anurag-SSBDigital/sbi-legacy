import { useEffect, useState } from 'react'
import { components } from '@/types/api/v1.js'
import { X } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea.tsx'
import { AccountNoCell } from '@/components/table/cells'

export interface ResolutionDialogProps {
  row: components['schemas']['AlertDetailDTO']
  onSuccess?: () => void
}

export function ResolutionDialog({ row, onSuccess }: ResolutionDialogProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [resolutionDesc, setResolutionDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveMutation = $api.useMutation(
    'post',
    '/alert/resolutions/{alertType}/{alertId}/branch-resolution'
  )

  const reResolveMutation = $api.useMutation(
    'post',
    '/alert/resolutions/{resolutionId}/reResolve'
  )

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
      const formData = new FormData()
      formData.set('text', resolutionDesc)
      files.forEach((f) => formData.append('documents', f))

      if (row.alertId && row.alertType) {
        if (row.status === 'REJECTED' && row.resolutionId) {
          const reResolvePayload = {
            body: formData as unknown as {
              text: string
              documents: string[]
            },
            params: {
              path: { resolutionId: row.resolutionId },
              header: { Authorization: '' },
            },
          } as unknown as Parameters<typeof reResolveMutation.mutateAsync>[0]

          await reResolveMutation.mutateAsync(reResolvePayload)
        } else {
          const resolvePayload = {
            params: {
              header: { Authorization: '' },
              path: { alertType: row.alertType, alertId: row.alertId },
            },
            body: formData as unknown as {
              text: string
              documents: string[]
            },
          } as unknown as Parameters<typeof resolveMutation.mutateAsync>[0]

          await resolveMutation.mutateAsync(resolvePayload, {
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
          })
        }
      }
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
          {row.status === 'REJECTED' ? 'Re-Resolve' : 'Resolve'}
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='mb-2 text-lg font-semibold'>
            {row.status === 'REJECTED'
              ? 'Submit Re-Resolution'
              : 'Submit Resolution'}
          </DialogTitle>
          {/* Display key row data here */}
          <div className='mb-6 space-y-1 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700'>
            <p>
              <span className='font-semibold'>Reason:</span> {row.alertReason}
            </p>
            <p>
              <span className='font-semibold'>Account No:</span>
              <AccountNoCell value={String(row.accountNo)} />
            </p>

            <p>
              <span className='font-semibold'>Branch Code:</span>{' '}
              {row.branchCode}
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
              disabled={isSubmitting || !resolutionDesc.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
