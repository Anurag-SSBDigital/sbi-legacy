/* ------------------------------------------------------------------ */
/* New Event Dialog                                                   */
/* ------------------------------------------------------------------ */
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  accountId: string
}

interface FormValues {
  summary: string
  eventType: string
}

const EVENT_TYPES = [
  'Legal Notice',
  'Suit File',
  'Hearing',
  'Decree',
  'Transfer to AUCA',
  'Transfer to Recall Asset',
]

const NewEventDialog: React.FC<Props> = ({ open, setOpen, accountId }) => {
  /* ------------ form -------------- */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { eventType: '' },
  })

  /* --------- images --------------- */
  const [imageNames, setImageNames] = useState<string[]>([])
  const uploadMutation = $api.useMutation(
    'post',
    '/Events/uploadImages', // adjust if your backend uses another URL
    {
      onError: () => toast.error('Image upload failed'),
    }
  )

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))

    try {
      await uploadMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: { query: undefined as unknown as { files: string[] } },
      })
      setImageNames((prev) => [
        ...prev,
        ...Array.from(files).map((f) => f.name),
      ])
      toast.success(`${files.length} image(s) uploaded`)
    } catch {
      /* handled in mutation */
    }
  }

  /* --------- create mutation ------- */
  const createMutation = $api.useMutation('post', '/Events/create', {
    onSuccess: () => {
      toast.success('Event created')
      setOpen(false)
      reset()
      setImageNames([])
    },
    onError: () => toast.error('Could not create event'),
  })

  /* ---------- submit --------------- */
  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      body: {
        ...values,
        eventImages: imageNames,
        accountNumber: accountId,
      },
      params: { header: { Authorization: '' } },
    })
  })

  /* ---------- UI ------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <form onSubmit={onSubmit} className='space-y-8'>
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
            <DialogDescription>
              Enter details and attach any supporting images.
            </DialogDescription>
          </DialogHeader>

          {/* Event Type */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Event Type</label>
            <Select
              onValueChange={(v) => setValue('eventType', v)}
              defaultValue={watch('eventType')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Summary</label>
            <Textarea
              rows={3}
              placeholder='Brief summary…'
              {...register('summary', { required: true })}
            />
          </div>

          {/* Images */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Event Images</label>
            <Input
              type='file'
              accept='image/*'
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            {imageNames.length > 0 && (
              <ul className='space-y-1'>
                {imageNames.map((n, i) => (
                  <li
                    key={i}
                    className='bg-muted flex items-center justify-between rounded px-3 py-1 text-sm'
                  >
                    <span className='max-w-[200px] truncate'>{n}</span>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      onClick={() =>
                        setImageNames((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* footer */}
          <DialogFooter>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewEventDialog
