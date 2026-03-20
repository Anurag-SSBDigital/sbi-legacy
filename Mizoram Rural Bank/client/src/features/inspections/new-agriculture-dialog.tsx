/* ------------------------------------------------------------------ */
/* components/inspection/new-agriculture-dialog.tsx                   */
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
  setOpen: (open: boolean) => void
  accountId: string
  onSuccess: () => void
}

interface FormValues {
  name: string
  residenceAddress: string
  residenceVisited: 'yes' | 'no'
  residenceObservations: string
  purposeOfVisit: string
  otherLocationAddress: string
  otherLocationObservations: string
}

/* ---------------------- component -------------------------------- */
const NewAgricultureDialog: React.FC<Props> = ({
  open,
  setOpen,
  accountId,
  onSuccess,
}) => {
  /* ------------------------- form -------------------------------- */
  const form = useForm<FormValues>({
    defaultValues: {
      residenceVisited: 'no',
    },
  })

  const {
    setValue,
    // watch,
    reset,
    formState: { isSubmitting },
  } = form

  // const resVisited = watch('residenceVisited')

  /* --------------- fetch borrower name once ---------------------- */
  const { data: borrowerName } = $api.useQuery('get', '/account/getName', {
    params: { query: { acctNo: accountId } },
    enabled: !!accountId,
  })

  useEffect(() => {
    if (borrowerName?.data) {
      setValue('name', borrowerName.data)
    }
  }, [borrowerName, setValue])

  /* -------------------------- images ----------------------------- */
  const [uploadedNames, setUploadedNames] = useState<string[]>([])

  const uploadMutation = $api.useMutation(
    'post',
    '/Agriculture_inspections/uploadImages'
  )

  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))
    try {
      await uploadMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: {
          query: undefined as unknown as { files: string[] },
        },
      })
      setUploadedNames((p) => [...p, ...Array.from(files).map((f) => f.name)])
      toast.success(`${files.length} image(s) uploaded`)
    } catch {
      toast.error('Could not upload images')
    }
  }

  /* --------------------- geo — state + helpers ------------------- */
  const [resLat, setResLat] = useState('')
  const [resLon, setResLon] = useState('')
  const [othLat, setOthLat] = useState('')
  const [othLon, setOthLon] = useState('')

  /** grabs browser location and writes into whichever setter pair is passed */
  const fetchLocation = (
    setLat: React.Dispatch<React.SetStateAction<string>>,
    setLon: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLat(coords.latitude.toString())
        setLon(coords.longitude.toString())
      },
      () => toast.error('Unable to fetch location'),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  /* reset coordinates & uploads when dialog closes */
  useEffect(() => {
    if (open) return
    reset()
    setUploadedNames([])
    setResLat('')
    setResLon('')
    setOthLat('')
    setOthLon('')
  }, [open, reset])

  /* -------------------- create mutation -------------------------- */
  const createMutation = $api.useMutation(
    'post',
    '/Agriculture_inspections/create',
    {
      onSuccess: () => {
        toast.success('Agriculture inspection created')
        onSuccess()
        setOpen(false)
      },
      onError: () => toast.error('Could not create inspection'),
    }
  )

  /* ------------------------- submit ------------------------------ */
  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync({
      params: { header: { Authorization: '' } },
      body: {
        ...values,
        residenceGeoLocation: `Latitude: ${resLat}, Longitude: ${resLon}`,
        otherLocationGeoLocation: `Latitude: ${othLat}, Longitude: ${othLon}`,
        inspectionImages: uploadedNames,
        accountNumber: accountId,
      },
    })
  }

  /* --------------------------- ui -------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <DialogHeader>
              <DialogTitle>New Agriculture Inspection</DialogTitle>
              <DialogDescription>
                Fill in the details and submit to record an inspection.
              </DialogDescription>
            </DialogHeader>

            {/* -------- Borrower -------- */}
            <FormField
              control={form.control}
              name='name'
              rules={{ required: 'Borrower name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Borrower'
                      readOnly={!!borrowerName}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ========== RESIDENCE SECTION ========== */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Residence Details
              </legend>

              <FormField
                control={form.control}
                name='residenceAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder='Residence address' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Visited toggle */}
              <div className='flex items-center gap-6'>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    value='yes'
                    {...form.register('residenceVisited')}
                  />
                  Visited
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    value='no'
                    {...form.register('residenceVisited')}
                  />
                  Not Visited
                </label>
              </div>

              <FormField
                control={form.control}
                name='residenceObservations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Observations…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* coordinates + manual fetch */}
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  type='number'
                  step='any'
                  title='Latitude'
                  placeholder='Lat'
                  value={resLat}
                  onChange={(e) => setResLat(e.target.value)}
                />
                <Input
                  type='number'
                  step='any'
                  title='Longitude'
                  placeholder='Lon'
                  value={resLon}
                  onChange={(e) => setResLon(e.target.value)}
                />
              </div>
              <Button
                type='button'
                size='sm'
                onClick={() => fetchLocation(setResLat, setResLon)}
              >
                Use current location
              </Button>
            </fieldset>

            {/* ========== OTHER LOCATION SECTION ========== */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Other Location
              </legend>

              <FormField
                control={form.control}
                name='otherLocationAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder='Other location address' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='otherLocationObservations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Observations…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* coordinates + manual fetch */}
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  type='number'
                  step='any'
                  title='Latitude'
                  placeholder='Lat'
                  value={othLat}
                  onChange={(e) => setOthLat(e.target.value)}
                />
                <Input
                  type='number'
                  step='any'
                  title='Longitude'
                  placeholder='Lon'
                  value={othLon}
                  onChange={(e) => setOthLon(e.target.value)}
                />
              </div>
              <Button
                type='button'
                size='sm'
                onClick={() => fetchLocation(setOthLat, setOthLon)}
              >
                Use current location
              </Button>
            </fieldset>

            {/* Purpose of visit */}
            <FormField
              control={form.control}
              name='purposeOfVisit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Visit</FormLabel>
                  <FormControl>
                    <Input placeholder='Purpose' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* -------- Images -------- */}
            <div className='space-y-2'>
              <FormLabel>Inspection Images</FormLabel>
              <Input
                type='file'
                multiple
                accept='image/*'
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {uploadedNames.length > 0 && (
                <ul className='space-y-1'>
                  {uploadedNames.map((n, i) => (
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
                          setUploadedNames((p) =>
                            p.filter((_, idx) => idx !== i)
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

            {/* Footer */}
            <DialogFooter>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Create Inspection'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewAgricultureDialog
