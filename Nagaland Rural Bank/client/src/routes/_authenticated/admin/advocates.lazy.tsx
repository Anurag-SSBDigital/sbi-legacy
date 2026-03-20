// import { useState } from 'react'
// import { createLazyFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { toastError } from '@/lib/utils.ts'
// import { useCanAccess } from '@/hooks/use-can-access.tsx'
// import { Button } from '@/components/ui/button'
// import PaginatedTable from '@/components/paginated-table.tsx'
// import {
//   YesNoCell,
//   EditActionCell,
//   DeleteActionCell,
//   SemiBoldCell,
//   EmailCell,
//   MobileCell,
// } from '@/components/table/cells.ts'
// import { AdvocateFormDialog } from '@/features/advocate/AdvocateFormDialog.tsx'
// export const Route = createLazyFileRoute('/_authenticated/admin/advocates')({
//   // Changed route
//   component: RouteComponent,
// })
// type AdvocateForm = {
//   id?: number | undefined
//   advocateName: string
//   fullName: string
//   emailId: string
//   mobileNo: string
//   barRegNumber: string
//   empanelmentNo: string
//   address: string
//   isActive: boolean
// }
// function RouteComponent() {
//   const [isFormOpen, setFormOpen] = useState(false)
//   const [editingAdvocate, setEditingAdvocate] = useState<AdvocateForm | null>(
//     null
//   )
//   const canCreate = useCanAccess('auditors', 'create')
//   const canEdit = useCanAccess('auditors', 'update')
//   const canDelete = useCanAccess('auditors', 'delete')
//   const createAdvocateMutation = $api.useMutation('post', '/advocate/create', {
//     onSuccess: () => {
//       toast.success('Advocate created successfully!')
//       refetch()
//       setFormOpen(false)
//     },
//     onError: (error) =>
//       toastError(error, 'Could not create advocate. Please try again.'),
//   })
//   const updateAdvocateMutation = $api.useMutation(
//     'put',
//     '/advocate/update/{id}',
//     {
//       onSuccess: () => {
//         toast.success('Advocate updated successfully!')
//         refetch()
//         setFormOpen(false)
//       },
//       onError: (error) =>
//         toastError(error, 'Could not update advocate. Please try again.'),
//     }
//   )
//   const {
//     data: usersData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/advocate/all', {})
//   const deleteAuditorMutation = $api.useMutation(
//     'delete',
//     '/advocate/delete/{id}'
//   )
//   const handleEdit = (advocate: AdvocateForm) => {
//     setEditingAdvocate(advocate)
//     setFormOpen(true)
//   }
//   const handleCreate = () => {
//     setEditingAdvocate(null)
//     setFormOpen(true)
//   }
//   const handleFormSubmit = async (values: AdvocateForm) => {
//     const isEditMode = editingAdvocate?.id != null
//     if (isEditMode) {
//       if (editingAdvocate.id) {
//         updateAdvocateMutation.mutate({
//           body: values,
//           params: {
//             path: { id: editingAdvocate.id },
//             header: { Authorization: '' },
//           },
//         })
//       }
//     } else {
//       createAdvocateMutation.mutate({
//         body: values,
//         params: { header: { Authorization: '' } },
//       })
//     }
//   }
//   const isSubmitting =
//     createAdvocateMutation.isPending || updateAdvocateMutation.isPending
//   const handleDelete = (auditorId: number) => {
//     deleteAuditorMutation.mutate(
//       {
//         params: {
//           path: { id: auditorId },
//         },
//       },
//       {
//         onSuccess: () => {
//           toast.success('Auditor deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete auditor'),
//       }
//     )
//   }
//   return (
//     <>
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}
//         {/* --- Title Row & Create User Dialog Trigger --- */}
//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Advocates
//           </h1>
//           {canCreate && (
//             <Button size='sm' onClick={handleCreate}>
//               New Advocate
//             </Button>
//             // <CreateUserForm // Changed from CreateBranchForm
//             //   open={isCreateUserDialogOpen}
//             //   onOpenChange={setCreateUserDialogOpen}
//             //   onSuccess={() => {
//             //     setCreateUserDialogOpen(false)
//             //     refetch()
//             //   }}
//             // />
//           )}
//         </div>
//         {/* --- Data Table --- */}
//         {usersData?.data?.length ? ( // Changed from branchesData
//           <div>
//             <PaginatedTable
//               data={usersData.data} // Changed from branchesData
//               renderActions={(row) => (
//                 <div className='flex flex-row gap-2'>
//                   {canEdit && (
//                     <EditActionCell
//                       onClick={() => handleEdit(row as AdvocateForm)}
//                     />
//                   )}
//                   {canDelete && (
//                     <DeleteActionCell
//                       title={`Delete "${row.fullName}"?`}
//                       onConfirm={() => row.id && handleDelete(row.id)}
//                       isConfirming={
//                         deleteAuditorMutation.isPending || isSubmitting
//                       }
//                     />
//                   )}
//                 </div>
//               )}
//               columns={[
//                 {
//                   key: 'advocateName',
//                   label: 'Advocate Name',
//                   render: (value) => <SemiBoldCell value={value || ''} />,
//                 },
//                 {
//                   key: 'fullName',
//                   label: 'Full Name',
//                   render: (value) => <SemiBoldCell value={value || ''} />,
//                 },
//                 {
//                   key: 'emailId',
//                   label: 'Email',
//                   render: (value) => <EmailCell value={value ?? ''} />,
//                 },
//                 {
//                   key: 'mobileNo',
//                   label: 'Mobile',
//                   render: (value) => <MobileCell value={value ?? ''} />,
//                 },
//                 { key: 'barRegNumber', label: 'Bar Reg. No' },
//                 { key: 'empanelmentNo', label: 'Empanelment No' },
//                 {
//                   key: 'isActive',
//                   label: 'Active',
//                   render: (v) => <YesNoCell value={v} />,
//                 },
//               ]}
//               emptyMessage='No Advocates found.'
//             />
//           </div>
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 No Advocates Found {/* Changed message */}
//               </h3>
//               <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                 Get started by creating a new user.
//               </p>
//             </div>
//           )
//         )}
//       </>
//       <AdvocateFormDialog
//         open={isFormOpen}
//         onOpenChange={setFormOpen}
//         onSubmit={handleFormSubmit}
//         isSubmitting={isSubmitting}
//         initialData={editingAdvocate}
//       />
//     </>
//   )
// }
import { useState, useMemo } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  YesNoCell,
  EditActionCell,
  DeleteActionCell,
  SemiBoldCell,
  EmailCell,
  MobileCell,
} from '@/components/table/cells.ts'
import { AdvocateFormDialog } from '@/features/advocate/AdvocateFormDialog'

export const Route = createLazyFileRoute('/_authenticated/admin/advocates')({
  component: RouteComponent,
})

type AdvocateForm = {
  id?: number | undefined
  advocateName: string
  fullName: string
  emailId: string
  mobileNo: string
  barRegNumber: string
  empanelmentNo: string
  address: string
  isActive: boolean
}

/* =============================
   Export helpers (strictly typed)
============================= */
function fileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toTitleCase(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

function buildRowsAndHeaders<T extends Record<string, unknown>>(
  rows: readonly T[]
): { headers: string[]; headerLabels: string[]; matrix: string[][] } {
  const keySet = new Set<string>()
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => keySet.add(k))
  })
  const headers = Array.from(keySet)

  // Put "id" first if present
  const idIdx = headers.indexOf('id')
  if (idIdx > 0) {
    headers.splice(idIdx, 1)
    headers.unshift('id')
  }

  const headerLabels = headers.map(toTitleCase)

  const matrix: string[][] = rows.map((row) =>
    headers.map((h) => {
      const val = row[h as keyof T]
      if (val == null) return ''
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }
      return String(val)
    })
  )

  return { headers, headerLabels, matrix }
}

function exportCSV<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'advocates.csv'
) {
  const { headerLabels, matrix } = buildRowsAndHeaders(rows)
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

  const lines = [
    headerLabels.map(escape).join(','),
    ...matrix.map((r) => r.map(escape).join(',')),
  ]
  const csv = '\uFEFF' + lines.join('\n')
  fileDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

async function exportExcel<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'advocates.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)

    // xlsx expects a mutable array
    const mutableRows: T[] = Array.from(rows)

    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Advocates')
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    fileDownload(
      new Blob([wbout], { type: 'application/octet-stream' }),
      filename
    )
  } catch {
    // Fallback to CSV if xlsx isn't available
    exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
  }
}
/* ============================= */

function RouteComponent() {
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingAdvocate, setEditingAdvocate] = useState<AdvocateForm | null>(
    null
  )

  const canCreate = useCanAccess('auditors', 'create')
  const canEdit = useCanAccess('auditors', 'update')
  const canDelete = useCanAccess('auditors', 'delete')

  const createAdvocateMutation = $api.useMutation('post', '/advocate/create', {
    onSuccess: () => {
      toast.success('Advocate created successfully!')
      refetch()
      setFormOpen(false)
    },
    onError: (error) =>
      toastError(error, 'Could not create advocate. Please try again.'),
  })

  const updateAdvocateMutation = $api.useMutation(
    'put',
    '/advocate/update/{id}',
    {
      onSuccess: () => {
        toast.success('Advocate updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not update advocate. Please try again.'),
    }
  )

  const {
    data: usersData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/advocate/all', {})

  const deleteAuditorMutation = $api.useMutation(
    'delete',
    '/advocate/delete/{id}'
  )

  const handleEdit = (advocate: AdvocateForm) => {
    setEditingAdvocate(advocate)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingAdvocate(null)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: AdvocateForm) => {
    const isEditMode = editingAdvocate?.id != null

    if (isEditMode) {
      if (editingAdvocate.id) {
        updateAdvocateMutation.mutate({
          body: values,
          params: {
            path: { id: editingAdvocate.id },
            header: { Authorization: '' },
          },
        })
      }
    } else {
      createAdvocateMutation.mutate({
        body: values,
        params: { header: { Authorization: '' } },
      })
    }
  }

  const isSubmitting =
    createAdvocateMutation.isPending || updateAdvocateMutation.isPending

  const handleDelete = (auditorId: number) => {
    deleteAuditorMutation.mutate(
      {
        params: {
          path: { id: auditorId },
        },
      },
      {
        onSuccess: () => {
          toast.success('Auditor deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete auditor'),
      }
    )
  }

  // Materialize current table rows (no filters on this page)
  const advocateRows: AdvocateForm[] = useMemo(
    () => (usersData?.data as AdvocateForm[] | undefined) ?? [],
    [usersData?.data]
  )

  // Export handlers (export exactly what's displayed)
  const handleExportCSV = () => {
    if (!advocateRows.length) {
      toast.info('No data to export.')
      return
    }
    exportCSV<AdvocateForm>(advocateRows, 'advocates.csv')
  }

  const handleExportExcel = async () => {
    if (!advocateRows.length) {
      toast.info('No data to export.')
      return
    }
    await exportExcel<AdvocateForm>(advocateRows, 'advocates.xlsx')
  }

  return (
    <>
      <>
        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}
        {/* --- Title Row & Create User Dialog Trigger --- */}
        <div className='mb-2 flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Advocates
          </h1>
          <div className='flex items-center gap-2'>
            {/* NEW: Export Buttons */}
            <Button variant='outline' size='sm' onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant='outline' size='sm' onClick={handleExportExcel}>
              Export Excel
            </Button>

            {canCreate && (
              <Button size='sm' onClick={handleCreate}>
                New Advocate
              </Button>
            )}
          </div>
        </div>
        {/* --- Data Table --- */}
        {advocateRows.length ? (
          <div>
            <PaginatedTable
              data={advocateRows}
              renderActions={(row) => (
                <div className='flex flex-row gap-2'>
                  {canEdit && (
                    <EditActionCell
                      onClick={() => handleEdit(row as AdvocateForm)}
                    />
                  )}
                  {canDelete && (
                    <DeleteActionCell
                      title={`Delete "${row.fullName}"?`}
                      onConfirm={() => row.id && handleDelete(row.id)}
                      isConfirming={
                        deleteAuditorMutation.isPending || isSubmitting
                      }
                    />
                  )}
                </div>
              )}
              columns={[
                {
                  key: 'advocateName',
                  label: 'Advocate Name',
                  render: (value) => <SemiBoldCell value={value || ''} />,
                },
                {
                  key: 'fullName',
                  label: 'Full Name',
                  render: (value) => <SemiBoldCell value={value || ''} />,
                },
                {
                  key: 'emailId',
                  label: 'Email',
                  render: (value) => <EmailCell value={value ?? ''} />,
                },
                {
                  key: 'mobileNo',
                  label: 'Mobile',
                  render: (value) => <MobileCell value={value ?? ''} />,
                },
                { key: 'barRegNumber', label: 'Bar Reg. No' },
                { key: 'empanelmentNo', label: 'Empanelment No' },
                {
                  key: 'isActive',
                  label: 'Active',
                  render: (v) => <YesNoCell value={v} />,
                },
              ]}
              emptyMessage='No Advocates found.'
            />
          </div>
        ) : (
          !isLoading && (
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
              <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
                No Advocates Found
              </h3>
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new user.
              </p>
            </div>
          )
        )}
      </>
      <AdvocateFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingAdvocate}
      />
    </>
  )
}
