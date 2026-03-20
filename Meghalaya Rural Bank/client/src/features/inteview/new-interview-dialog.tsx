/* ------------------------------------------------------------------ */
/* components/inspection/new-interview-dialog.tsx                     */
/* ------------------------------------------------------------------ */
import React, { useEffect, useState } from 'react'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/* ----------------------- props & types ---------------------------- */
interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  accountId: string
}

interface FormValues {
  personInterviewed: string
  interviewerName: string
  createDateTime: string
  interviewMinutes: string
  place: string
  summary: string
}

/* ---------------------- component -------------------------------- */
const NewInterviewDialog: React.FC<Props> = ({ open, setOpen, accountId }) => {
  const {
    data: borrowerName,
    isSuccess: borrowerNameSuccess,
    isPending: borrowerNamePending,
    isError: borrowerNameError,
  } = $api.useQuery('get', '/account/getName', {
    params: { query: { acctNo: accountId } },
  })

  const form = useForm<FormValues>({
    defaultValues: {
      createDateTime: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
    },
  })

  const { setValue } = form

  useEffect(() => {
    if (
      !borrowerNamePending &&
      !borrowerNameError &&
      borrowerNameSuccess &&
      borrowerName?.data
    ) {
      setValue('personInterviewed', borrowerName.data)
    }
  }, [
    setValue,
    borrowerName,
    borrowerNamePending,
    borrowerNameError,
    borrowerNameSuccess,
  ])

  const {
    formState: { isSubmitting },
    reset,
  } = form

  /* ----------------------- image upload -------------------------- */
  const [imageNames, setImageNames] = useState<string[]>([])

  const uploadMutation = $api.useMutation('post', '/Interviews/uploadImages')

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))
    try {
      await uploadMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: { query: undefined as unknown as { files: string[] } },
      })
      setImageNames((p) => [...p, ...Array.from(files).map((f) => f.name)])
      toast.success(`${files.length} image(s) uploaded`)
    } catch {
      toast.error('Could not upload images')
    }
  }

  /* -------------------- create mutation -------------------------- */
  const createMutation = $api.useMutation('post', '/Interviews/create', {
    onSuccess: () => {
      toast.success('Interview record created')
      setOpen(false)
      reset()
      setImageNames([])
    },
    onError: () => toast.error('Could not create interview record'),
  })

  /* --------------------------- submit ---------------------------- */
  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync({
      params: { header: { Authorization: '' } },
      body: {
        ...values,
        interviewImagesName: imageNames,
        accountNumber: accountId,
      },
    })
  }

  /* ---------------------------- ui ------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <DialogHeader>
              <DialogTitle>New Interview Record</DialogTitle>
              <DialogDescription>
                Fill in the details below and save to add a new interview.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name='createDateTime'
              rules={{ required: 'Date & time is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='personInterviewed'
              rules={{ required: 'Borrower is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Name'
                      {...field}
                      readOnly={borrowerName?.data !== undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='interviewerName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Name' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='interviewMinutes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type='number' min={0} placeholder='60' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='place'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place</FormLabel>
                  <FormControl>
                    <Input placeholder='Location' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='summary'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder='Brief summary…'
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* -------- images -------- */}
            <div className='space-y-2'>
              <FormLabel>Interview Images</FormLabel>
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
                          setImageNames((p) => p.filter((_, idx) => idx !== i))
                        }
                      >
                        ✕
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* -------- footer -------- */}
            <DialogFooter>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Save Interview'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewInterviewDialog
