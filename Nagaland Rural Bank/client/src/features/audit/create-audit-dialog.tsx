// /* ------------------------------------------------------------------ */
// /* components/audit/create-audit-dialog.tsx                           */
// /* ------------------------------------------------------------------ */
// import React, { useEffect } from 'react'
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
// import { Separator } from '@radix-ui/react-separator'
// import { components } from '@/types/api/v1.js'
// import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea.tsx'
// /* --------------------------- schema ------------------------------- */
// const schema = z.object({
//   auditPeriodFrom: z.string().min(1, 'Required'),
//   auditPeriodTo: z.string().min(1, 'Required'),
//   facilityType: z.string().min(1, 'Required'),
//   stockLocation: z.string().min(1, 'Required'),
//   auditorName: z.string().min(1, 'Required'),
//   auditorAddress: z.string().min(1, 'Required'),
//   auditScope: z.string().min(1, 'Required'),
//   sanctionLimit: z.coerce.number().positive(),
//   assignedAuditorUsername: z.string().email('Pick an auditor'),
// })
// type FormValues = z.infer<typeof schema>
// type Row = components['schemas']['Customer2']
// /* --------------------------- props -------------------------------- */
// interface Props {
//   open: boolean
//   onOpenChange: (o: boolean) => void
//   selectedRow: Row | null
//   onSuccess?: () => void
// }
// /* ------------------------- component ------------------------------ */
// export const CreateAuditDialog: React.FC<Props> = ({
//   open,
//   onOpenChange,
//   selectedRow,
//   onSuccess,
// }) => {
//   /* ---------------------- dropdown data -------------------------- */
//   const { data: ddlRes, isLoading: ddlLoading } = $api.useQuery(
//     'get',
//     '/stockAuditor/dropdown',
//     { enabled: open, onError: () => toast.error('Could not fetch auditors') }
//   )
//   const auditors = ddlRes?.data ?? []
//   /* ---------------------- form & helpers ------------------------- */
//   const form = useForm<FormValues>({ resolver: standardSchemaResolver(schema) })
//   const {
//     setValue,
//     watch,
//     reset,
//     formState: { isSubmitting },
//   } = form
//   /* -------- auto-fill facility / limit when dialog opens --------- */
//   useEffect(() => {
//     if (!open) return
//     if (selectedRow?.segement) setValue('facilityType', selectedRow.segement)
//     if (selectedRow?.loanLimit)
//       setValue('sanctionLimit', Number(selectedRow.loanLimit))
//   }, [open, selectedRow, setValue])
//   /* ------------- fetch auditor details after select -------------- */
//   const username = watch('assignedAuditorUsername')
//   const { data: auditorDetail } = $api.useQuery(
//     'get',
//     '/stockAuditor/getDetails',
//     { params: { query: { email: username } } },
//     { enabled: !!username }
//   )
//   useEffect(() => {
//     if (!auditorDetail) return
//     setValue('auditorName', auditorDetail.fullName ?? '')
//     setValue('auditorAddress', auditorDetail.address ?? '')
//   }, [auditorDetail, setValue])
//   /* -------------------- submit mutation -------------------------- */
//   const createAudit = $api.useMutation('post', '/stockAudit/create', {
//     onSuccess: () => {
//       toast.success('Audit created')
//       onOpenChange(false)
//       onSuccess?.()
//       reset()
//     },
//     onError: () => toast.error('Failed to create audit'),
//   })
//   const onSubmit = (v: FormValues) => {
//     if (v.auditPeriodFrom > v.auditPeriodTo) {
//       form.setError('auditPeriodTo', {
//         type: 'validate',
//         message: '“To” date must be after “From” date',
//       })
//       return
//     }
//     if (!selectedRow) return
//     createAudit.mutate({
//       params: { header: { Authorization: '' } },
//       body: {
//         ...v,
//         accountNo: selectedRow.acctNo,
//         status: 'PENDING',
//       },
//     })
//   }
//   /* ---------------------------- UI ------------------------------- */
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='max-h-[85vh] w-full overflow-y-auto'>
//         <DialogHeader>
//           <DialogTitle>Create Stock Audit</DialogTitle>
//         </DialogHeader>
//         <Separator className='my-3' />
//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className='grid gap-6 lg:grid-cols-2'
//           >
//             {/* ----- Period ----- */}
//             <div className='space-y-4'>
//               <h4 className='text-primary font-semibold'>Audit Period</h4>
//               <FormField
//                 control={form.control}
//                 name='auditPeriodFrom'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>From</FormLabel>
//                     <FormControl>
//                       <Input type='date' {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='auditPeriodTo'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>To</FormLabel>
//                     <FormControl>
//                       <Input type='date' {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//             {/* ----- Facility & Limit ----- */}
//             <div className='space-y-4'>
//               <h4 className='text-primary font-semibold'>Facility Details</h4>
//               <FormField
//                 control={form.control}
//                 name='facilityType'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Facility Type</FormLabel>
//                     <FormControl>
//                       <Input readOnly {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='stockLocation'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Stock Location</FormLabel>
//                     <FormControl>
//                       <Input placeholder='Location' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='sanctionLimit'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Sanction Limit (₹)</FormLabel>
//                     <FormControl>
//                       <Input type='number' step='any' readOnly {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </div>
//             {/* ----- Auditor ----- */}
//             <div className='space-y-4 lg:col-span-2'>
//               <h4 className='text-primary font-semibold'>Auditor</h4>
//               <div className='grid gap-4 lg:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='assignedAuditorUsername'
//                   render={({ field }) => (
//                     <FormItem className='lg:col-span-1'>
//                       <FormLabel>Assign Auditor</FormLabel>
//                       <Select
//                         value={field.value}
//                         onValueChange={field.onChange}
//                         disabled={ddlLoading}
//                       >
//                         <FormControl>
//                           <SelectTrigger className='w-full'>
//                             <SelectValue
//                               placeholder={ddlLoading ? 'Loading…' : 'Select'}
//                             />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {auditors.map((a) => (
//                             <SelectItem key={a.id} value={a.id ?? ''}>
//                               {a.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='auditorName'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Auditor Name</FormLabel>
//                       <FormControl>
//                         <Input readOnly {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='auditorAddress'
//                   render={({ field }) => (
//                     <FormItem className='lg:col-span-2'>
//                       <FormLabel>Auditor Address</FormLabel>
//                       <FormControl>
//                         <Input readOnly {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </div>
//             {/* ----- Scope ----- */}
//             <div className='space-y-4 lg:col-span-2'>
//               <h4 className='text-primary font-semibold'>Scope</h4>
//               <FormField
//                 control={form.control}
//                 name='auditScope'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormControl>
//                       <Textarea placeholder='Audit scope / notes…' {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//             {/* ----- Footer ----- */}
//             <DialogFooter className='lg:col-span-2'>
//               <Button
//                 type='submit'
//                 disabled={isSubmitting || !selectedRow}
//                 className='w-full lg:w-auto'
//               >
//                 {isSubmitting ? 'Creating…' : 'Create Audit'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   )
// }
/* ------------------------------------------------------------------ */
/* components/audit/create-audit-dialog.tsx - Single Column Layout    */
/* ------------------------------------------------------------------ */
import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Separator } from '@radix-ui/react-separator'
import { components } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  CalendarDays,
  BadgeIndianRupee,
  Building2,
  UserCheck2,
  NotebookPen,
  CircleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea.tsx'

/* --------------------------- schema ------------------------------- */
const schema = z.object({
  auditPeriodFrom: z.string().min(1, 'Required'),
  auditPeriodTo: z.string().min(1, 'Required'),
  facilityType: z.string().min(1, 'Required'),
  stockLocation: z.string().min(1, 'Required'),
  auditorName: z.string().min(1, 'Required'),
  auditorAddress: z.string().min(1, 'Required'),
  auditScope: z.string().min(1, 'Required'),
  sanctionLimit: z.coerce.number().positive(),
  assignedAuditorUsername: z.string().email('Pick an auditor'),
})
type FormValues = z.infer<typeof schema>
type Row = components['schemas']['Customer2']

/* --------------------------- props -------------------------------- */
interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  selectedRow: Row | null
  onSuccess?: () => void
}

/* ------------------------- component ------------------------------ */
export const CreateAuditDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  selectedRow,
  onSuccess,
}) => {
  const { data: ddlRes, isLoading: ddlLoading } = $api.useQuery(
    'get',
    '/stockAuditor/dropdown',
    { enabled: open, onError: () => toast.error('Could not fetch auditors') }
  )
  const auditors: Array<{ id?: string; name?: string }> = ddlRes?.data ?? []

  const form = useForm<FormValues>({ resolver: standardSchemaResolver(schema) })
  const {
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = form

  useEffect(() => {
    if (!open) return
    if (selectedRow?.segement) setValue('facilityType', selectedRow.segement)
    if (selectedRow?.loanLimit)
      setValue('sanctionLimit', Number(selectedRow.loanLimit))
  }, [open, selectedRow, setValue])

  const username = watch('assignedAuditorUsername')
  const { data: auditorDetail } = $api.useQuery(
    'get',
    '/stockAuditor/getDetails',
    { params: { query: { email: username } } },
    { enabled: !!username }
  )
  useEffect(() => {
    if (!auditorDetail) return
    setValue('auditorName', auditorDetail.fullName ?? '')
    setValue('auditorAddress', auditorDetail.address ?? '')
  }, [auditorDetail, setValue])

  const createAudit = $api.useMutation('post', '/stockAudit/create', {
    onSuccess: () => {
      toast.success('Audit created')
      onOpenChange(false)
      onSuccess?.()
      reset()
    },
    onError: () => toast.error('Failed to create audit'),
  })

  const onSubmit = (v: FormValues) => {
    if (v.auditPeriodFrom > v.auditPeriodTo) {
      form.setError('auditPeriodTo', {
        type: 'validate',
        message: '“To” date must be after “From” date',
      })
      return
    }
    if (!selectedRow) return
    createAudit.mutate({
      params: { header: { Authorization: '' } },
      body: { ...v, accountNo: selectedRow.acctNo, status: 'PENDING' },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl p-0'>
        {/* Header */}
        <DialogHeader className='bg-background/80 sticky top-0 z-10 border-b px-8 pt-5 pb-4 backdrop-blur'>
          <DialogTitle className='text-2xl font-semibold tracking-tight'>
            Create Stock Audit
          </DialogTitle>
          {selectedRow?.acctNo && (
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              <CircleAlert className='size-4' /> Account No:{' '}
              <span className='font-medium'>{selectedRow.acctNo}</span>
            </p>
          )}
        </DialogHeader>

        {/* Content */}
        <div className='px-8 py-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Audit Period */}
              <Section
                title='Audit Period'
                icon={<CalendarDays className='text-primary size-4' />}
              >
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='auditPeriodFrom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              {/* Facility */}
              <Section
                title='Facility Details'
                icon={<Building2 className='text-primary size-4' />}
              >
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
                  <FormField
                    control={form.control}
                    name='sanctionLimit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sanction Limit (₹)</FormLabel>
                        <div className='relative'>
                          <BadgeIndianRupee className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                          <FormControl>
                            <Input
                              type='number'
                              readOnly
                              className='pl-9'
                              {...field}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              {/* Auditor */}
              <Section
                title='Auditor'
                icon={<UserCheck2 className='text-primary size-4' />}
              >
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='assignedAuditorUsername'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Auditor</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={ddlLoading}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {auditors.map((a) => (
                              <SelectItem key={a.id ?? ''} value={a.id ?? ''}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <FormItem className='md:col-span-2'>
                        <FormLabel>Auditor Address</FormLabel>
                        <FormControl>
                          <Input readOnly {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              {/* Scope */}
              <Section
                title='Scope'
                icon={<NotebookPen className='text-primary size-4' />}
              >
                <FormField
                  control={form.control}
                  name='auditScope'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder='Audit scope / notes…'
                          className='min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              {/* Footer */}
              <Separator />
              <DialogFooter className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting || !selectedRow}>
                  {isSubmitting ? 'Creating…' : 'Create Audit'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* Small helper component for section layout */
const Section: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon, children }) => (
  <div className='bg-card space-y-4 rounded-xl border p-4'>
    <div className='flex items-center gap-2'>
      <div className='bg-primary/10 grid size-8 place-items-center rounded-lg'>
        {icon}
      </div>
      <h4 className='font-semibold'>{title}</h4>
    </div>
    {children}
  </div>
)
