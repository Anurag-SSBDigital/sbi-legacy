/* ------------------------------------------------------------------ */
/* components/inspection/new-stock-audit-dialog.tsx                   */
/* ------------------------------------------------------------------ */
import React, { useEffect } from 'react'
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

// interface AuditorDDL {
//   id: string // username / email
//   name: string // display name
// }

interface FormValues {
  auditPeriodFrom: string
  auditPeriodTo: string
  facilityType: string
  stockLocation: string
  auditorName: string
  auditorAddress: string
  auditScope: string
  sanctionLimit: string
  assignedAuditorUsername: string
}

const NewStockAuditDialog: React.FC<Props> = ({ open, setOpen, accountId }) => {
  /* ------------------------- form -------------------------------- */
  const form = useForm<FormValues>({
    defaultValues: {
      auditPeriodFrom: '',
      auditPeriodTo: '',
    },
  })
  const {
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = form

  /* ----------- load auditors for dropdown ------------------------ */
  const { data: ddlRes, isLoading: ddlLoading } = $api.useQuery(
    'get',
    '/stockAuditor/dropdown',
    { enabled: open, onError: () => toast.error('Could not load auditors') }
  )
  const auditors = ddlRes?.data ?? []

  /* ----------- load account details ------------------------------ */
  const { data: acctRes } = $api.useQuery('get', '/account/getAccountDetail', {
    params: { query: { acctNm: accountId } },
    enabled: open,
  })

  useEffect(() => {
    if (acctRes?.segement)
      setValue(
        'facilityType',
        (acctRes as unknown as { segement: string }).segement
      )
    if (acctRes?.loanLimit) setValue('sanctionLimit', String(acctRes.loanLimit))
  }, [acctRes, setValue])

  /* ---- when user picks an auditor, fetch full details ----------- */
  const username = watch('assignedAuditorUsername')
  const { data: auditorRes } = $api.useQuery(
    'get',
    '/stockAuditor/getDetails',
    { params: { query: { email: username } } },
    { enabled: !!username }
  )

  useEffect(() => {
    if (auditorRes?.fullName) setValue('auditorName', auditorRes.fullName)
    if (auditorRes?.address) setValue('auditorAddress', auditorRes.address)
  }, [auditorRes, setValue])

  /* ---------------- submit mutation ------------------------------ */
  const createMutation = $api.useMutation('post', '/stockAudit/create', {
    onSuccess: () => {
      toast.success('Assignment created')
      setOpen(false)
    },
    onError: () => toast.error('Could not create assignment'),
  })

  const onSubmit = async (v: FormValues) => {
    if (
      v.auditPeriodFrom &&
      v.auditPeriodTo &&
      v.auditPeriodFrom > v.auditPeriodTo
    ) {
      toast.error('“Audit Period From” cannot be after “To”')
      return
    }
    await createMutation.mutateAsync({
      params: { header: { Authorization: '' } },
      body: {
        accountNo: accountId,
        ...v,
        sanctionLimit: Number(v.sanctionLimit),
      },
    })
  }

  /* -------- reset when dialog closes ---------------------------- */
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  /* ---------------------------- UI ------------------------------ */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <DialogHeader>
              <DialogTitle>New Stock Audit Assignment</DialogTitle>
              <DialogDescription>
                Select an auditor and define the audit period.
              </DialogDescription>
            </DialogHeader>

            {/* Audit Period */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='auditPeriodFrom'
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Period From</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='auditPeriodTo'
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Period To</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Facility & Location */}
            <FormField
              control={form.control}
              name='facilityType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Type</FormLabel>
                  <FormControl>
                    <Input readOnly {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='stockLocation'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Location</FormLabel>
                  <FormControl>
                    <Input placeholder='Location' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Sanction Limit */}
            <FormField
              control={form.control}
              name='sanctionLimit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sanction Limit (₹)</FormLabel>
                  <FormControl>
                    <Input type='number' step='any' readOnly {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Auditor dropdown */}
            <FormField
              control={form.control}
              name='assignedAuditorUsername'
              rules={{ required: 'Select an auditor' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Auditor</FormLabel>
                  <Select
                    disabled={ddlLoading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select Auditor' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {auditors.map((a) => (
                        <SelectItem key={a.id} value={a.id ?? ''}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Filled via extra query */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='auditorName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Name</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='auditorAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Address</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Audit Scope */}
            <FormField
              control={form.control}
              name='auditScope'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Scope</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder='Scope…' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

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
                {isSubmitting ? 'Saving…' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewStockAuditDialog
