// import { useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { createFileRoute, redirect } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { toast } from 'sonner'
// import { useAuthStore } from '@/stores/authStore'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
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
// import PaginatedTable from '@/components/paginated-table'
// import {
//   DateCell,
//   DeleteActionCell,
//   EditActionCell,
// } from '@/components/table/cells.ts'
// export const Route = createFileRoute(
//   '/_authenticated/(summary)/$category/summary/$accountId/action/statutoryAuditors'
// )({
//   component: RouteComponent,
//   beforeLoad: () => {
//     const user = useAuthStore.getState().auth.user
//     if (!user) throw redirect({ to: '/' })
//   },
// })
// type StatutoryAuditor = components['schemas']['StatutoryAuditor']
// export default function RouteComponent() {
//   const { accountId } = Route.useParams()
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [editAuditor, setEditAuditor] = useState<StatutoryAuditor | null>(null)
//   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
//   const [auditorToDelete, setAuditorToDelete] = useState<number | null>(null)
//   const form = useForm({
//     defaultValues: {
//       auditorName: '',
//       accountNo: accountId,
//       icaiMembership: '',
//       lastAuditDate: '',
//       financialYear: '',
//     },
//   })
//   const { data, refetch } = $api.useQuery(
//     'get',
//     '/statutory-auditor/by-accountNo',
//     {
//       params: { query: { accountNo: accountId } },
//     }
//   )
//   const auditors = Array.isArray(data?.data) ? data.data : []
//   const createMutation = $api.useMutation('post', '/statutory-auditor/create', {
//     onSuccess: () => {
//       toast.success('Auditor saved')
//       setDialogOpen(false)
//       form.reset()
//       setEditAuditor(null)
//       refetch()
//     },
//     onError: () => toast.error('Failed to save auditor'),
//   })
//   const deleteMutation = $api.useMutation(
//     'delete',
//     '/statutory-auditor/delete/{id}',
//     {
//       onSuccess: () => {
//         toast.success('Deleted')
//         setConfirmDialogOpen(false)
//         refetch()
//       },
//       onError: () => toast.error('Delete failed'),
//     }
//   )
//   const onSubmit = (values: StatutoryAuditor) => {
//     createMutation.mutate({ body: values })
//   }
//   const onEdit = (auditor: components['schemas']['StatutoryAuditor']) => {
//     setEditAuditor(auditor)
//     setDialogOpen(true)
//     form.reset({ ...auditor })
//   }
//   const handleDelete = (id: number) => {
//     setAuditorToDelete(id)
//     setConfirmDialogOpen(true)
//   }
//   const confirmDelete = () => {
//     if (auditorToDelete) {
//       deleteMutation.mutate({ params: { path: { id: auditorToDelete } } })
//     }
//   }
//   return (
//     <>
//       <div className='mb-6 flex items-center justify-between'>
//         <h1 className='text-2xl font-semibold'>Statutory Auditors</h1>
//         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//           <DialogTrigger asChild>
//             <Button
//               onClick={() => {
//                 setEditAuditor(null)
//                 form.reset({
//                   auditorName: '',
//                   accountNo: accountId,
//                   icaiMembership: '',
//                   lastAuditDate: '',
//                   financialYear: '',
//                 })
//               }}
//             >
//               {editAuditor ? 'Edit Auditor' : 'Add Auditor'}
//             </Button>
//           </DialogTrigger>
//           <DialogContent className='sm:max-w-xl'>
//             <DialogHeader>
//               <DialogTitle>
//                 {editAuditor
//                   ? 'Edit Statutory Auditor'
//                   : 'Add Statutory Auditor'}
//               </DialogTitle>
//             </DialogHeader>
//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit(onSubmit)}
//                 className='grid gap-4'
//               >
//                 <FormField
//                   control={form.control}
//                   name='auditorName'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Auditor Name</FormLabel>
//                       <FormControl>
//                         <Input {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='icaiMembership'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>ICAI Membership No.</FormLabel>
//                       <FormControl>
//                         <Input {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='lastAuditDate'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Last Audit Date</FormLabel>
//                       <FormControl>
//                         <Input type='date' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='financialYear'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Financial Year</FormLabel>
//                       <FormControl>
//                         <Input {...field} placeholder='e.g. 2024-2025' />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <DialogFooter>
//                   <Button type='submit'>Save</Button>
//                 </DialogFooter>
//               </form>
//             </Form>
//           </DialogContent>
//         </Dialog>
//       </div>
//       <Card>
//         <CardContent className='p-4'>
//           <PaginatedTable
//             data={auditors}
//             columns={[
//               { key: 'auditorName', label: 'Auditor' },
//               { key: 'icaiMembership', label: 'ICAI No.' },
//               { key: 'lastAuditDate', label: 'Last Audit' },
//               { key: 'financialYear', label: 'FY' },
//               {
//                 key: 'auditorName',
//                 label: 'Actions',
//                 render: (_, row) => (
//                   <div className='flex gap-2'>
//                     <Button
//                       size='sm'
//                       variant='outline'
//                       onClick={() => onEdit(row)}
//                     >
//                       Edit
//                     </Button>
//                     <Button
//                       size='sm'
//                       variant='destructive'
//                       onClick={() => row.id && handleDelete(row.id)}
//                     >
//                       Delete
//                     </Button>
//                   </div>
//                 ),
//               },
//             ]}
//             emptyMessage='No auditors found.'
//           />
//         </CardContent>
//       </Card>
//       <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
//         <DialogContent className='sm:max-w-md'>
//           <DialogHeader>
//             <DialogTitle>Confirm Deletion</DialogTitle>
//           </DialogHeader>
//           <p>Are you sure you want to delete this auditor?</p>
//           <DialogFooter>
//             <Button
//               variant='outline'
//               onClick={() => setConfirmDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button variant='destructive' onClick={confirmDelete}>
//               Confirm
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import PaginatedTable from '@/components/paginated-table'
import {
  DateCell,
  DeleteActionCell,
  EditActionCell,
} from '@/components/table/cells.ts'

export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/statutoryAuditors'
)({
  component: RouteComponent,
  beforeLoad: () => {
    const user = useAuthStore.getState().auth.user
    if (!user) throw redirect({ to: '/' })
  },
})

type StatutoryAuditor = components['schemas']['StatutoryAuditor']

function RouteComponent() {
  const { accountId } = Route.useParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editAuditor, setEditAuditor] = useState<StatutoryAuditor | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [auditorToDelete, setAuditorToDelete] = useState<number | null>(null)
  const [auditors, setAuditors] = useState<StatutoryAuditor[]>([])

  const form = useForm({
    defaultValues: {
      auditorName: '',
      accountNo: accountId,
      icaiMembership: '',
      lastAuditDate: '',
      financialYear: '',
    },
  })

  const { data, refetch } = $api.useQuery(
    'get',
    '/statutory-auditor/by-accountNo',
    {
      params: { query: { accountNo: accountId } },
    }
  )

  // Update local state when data changes
  useEffect(() => {
    if (Array.isArray(data?.data)) {
      setAuditors(data.data)
    }
  }, [data])

  const createMutation = $api.useMutation('post', '/statutory-auditor/create', {
    onSuccess: () => {
      toast.success('Auditor saved')
      setDialogOpen(false)
      form.reset()
      setEditAuditor(null)
      refetch()
    },
    onError: () => toast.error('Failed to save auditor'),
  })

  const deleteMutation = $api.useMutation(
    'delete',
    '/statutory-auditor/delete/{id}',
    {
      onSuccess: (_, variables) => {
        toast.success('Deleted')
        setConfirmDialogOpen(false)
        setAuditors((prev) =>
          prev.filter((a) => a.id !== variables.params.path.id)
        )
        refetch()
      },
      onError: () => toast.error('Delete failed'),
    }
  )

  const onSubmit = (values: StatutoryAuditor) => {
    createMutation.mutate({ body: values })
  }

  const onEdit = (auditor: StatutoryAuditor) => {
    setEditAuditor(auditor)
    setDialogOpen(true)
    form.reset({ ...auditor })
  }

  const handleDelete = (id: number) => {
    setAuditorToDelete(id)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = () => {
    if (auditorToDelete) {
      deleteMutation.mutate({ params: { path: { id: auditorToDelete } } })
    }
  }

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Statutory Auditors</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditAuditor(null)
                form.reset({
                  auditorName: '',
                  accountNo: accountId,
                  icaiMembership: '',
                  lastAuditDate: '',
                  financialYear: '',
                })
              }}
            >
              {editAuditor ? 'Edit Auditor' : 'Add Auditor'}
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle>
                {editAuditor
                  ? 'Edit Statutory Auditor'
                  : 'Add Statutory Auditor'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='grid gap-4'
              >
                <FormField
                  control={form.control}
                  name='auditorName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auditor Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='icaiMembership'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ICAI Membership No.</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lastAuditDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Audit Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='financialYear'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='e.g. 2024-2025' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type='submit'>Save</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className='p-4'>
          <PaginatedTable
            key={auditors.length} // forces re-render on data change
            data={auditors}
            columns={[
              { key: 'auditorName', label: 'Auditor' },
              { key: 'icaiMembership', label: 'ICAI No.' },
              {
                key: 'lastAuditDate',
                label: 'Last Audit',
                render: (value) => <DateCell value={value} />,
              },
              { key: 'financialYear', label: 'FY' },
              {
                key: 'auditorName',
                label: 'Actions',
                render: (_, row) => (
                  <div className='flex gap-2'>
                    <EditActionCell onClick={() => onEdit(row)} />
                    <DeleteActionCell
                      title='Confirm Deletion'
                      description='Are you sure you want to delete this auditor?'
                      onConfirm={() => row.id && handleDelete(row.id)}
                      isConfirming={deleteMutation.isPending}
                    />
                  </div>
                ),
              },
            ]}
            emptyMessage='No auditors found.'
          />
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this auditor?</p>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
