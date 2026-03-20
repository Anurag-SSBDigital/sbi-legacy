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
import {
  AuditorForm,
  AuditorFormDialog,
} from '@/features/auditors/AuditorFormDialog.tsx'

export const Route = createLazyFileRoute('/_authenticated/admin/auditors')({
  component: RouteComponent,
})

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
  filename = 'auditors.csv'
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
  filename = 'auditors.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)

    // xlsx expects a mutable array
    const mutableRows: T[] = Array.from(rows)

    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditors')
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
  const [editingAuditor, setEditingAuditor] = useState<AuditorForm | null>(null)

  const canCreate = useCanAccess('auditors', 'create')
  const canEdit = useCanAccess('auditors', 'update')
  const canDelete = useCanAccess('auditors', 'delete')

  const {
    data: usersData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/stockAuditor/all', {})

  // --- API Mutations ---
  const createAuditorMutation = $api.useMutation(
    'post',
    '/stockAuditor/create',
    {
      onSuccess: (res) => {
        toast.success(res.message || 'Auditor created successfully!', {
          duration: 12000,
        })
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not create auditor. Please try again.'),
    }
  )

  const updateAuditorMutation = $api.useMutation(
    'put',
    '/stockAuditor/update/{id}',
    {
      onSuccess: () => {
        toast.success('Auditor updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not update auditor. Please try again.'),
    }
  )

  const deleteAuditorMutation = $api.useMutation(
    'delete',
    '/stockAuditor/delete/{id}'
  )

  // --- Event Handlers ---
  const handleDelete = (auditorId: number) => {
    deleteAuditorMutation.mutate(
      { params: { path: { id: auditorId } } },
      {
        onSuccess: () => {
          toast.success('Auditor deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete auditor'),
      }
    )
  }

  const handleEditClick = (auditor: AuditorForm) => {
    setEditingAuditor(auditor)
    setFormOpen(true)
  }

  const handleCreateClick = () => {
    setEditingAuditor(null)
    setFormOpen(true)
  }

  const handleFormSubmit = (values: AuditorForm) => {
    const token = sessionStorage.getItem('token') || ''
    if (!token) {
      toast.error('Authentication token not found.')
      return
    }
    const headers = { Authorization: `Bearer ${token}` }

    if (editingAuditor && editingAuditor.id) {
      updateAuditorMutation.mutate({
        body: values,
        params: { path: { id: editingAuditor.id }, header: headers },
      })
    } else {
      createAuditorMutation.mutate({
        body: values,
        params: { header: headers },
      })
    }
  }

  const isSubmitting =
    createAuditorMutation.isPending || updateAuditorMutation.isPending

  // Rows currently shown (no filters on this page)
  const auditorRows: AuditorForm[] = useMemo(
    () => (usersData?.data as AuditorForm[] | undefined) ?? [],
    [usersData?.data]
  )

  // Export exactly what's displayed
  const handleExportCSV = () => {
    if (!auditorRows.length) {
      toast.info('No data to export.')
      return
    }
    exportCSV<AuditorForm>(auditorRows, 'auditors.csv')
  }

  const handleExportExcel = async () => {
    if (!auditorRows.length) {
      toast.info('No data to export.')
      return
    }
    await exportExcel<AuditorForm>(auditorRows, 'auditors.xlsx')
  }

  return (
    <>
      <>
        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}

        {/* Title & Actions */}
        <div className='mb-2 flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Auditors
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
              <Button
                size='sm'
                onClick={handleCreateClick}
                className='text-white'
              >
                New Auditor
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {auditorRows.length ? (
          <div>
            <PaginatedTable
              data={auditorRows}
              renderActions={(row) => (
                <div className='flex flex-row gap-2'>
                  {canEdit && (
                    <EditActionCell
                      onClick={() => handleEditClick(row as AuditorForm)}
                    />
                  )}
                  {canDelete && (
                    <DeleteActionCell
                      title={`Delete “${row.fullName}”?`}
                      onConfirm={() => row.id && handleDelete(row.id)}
                      isConfirming={deleteAuditorMutation.isPending}
                    />
                  )}
                </div>
              )}
              columns={[
                {
                  key: 'auditorName',
                  label: 'Auditor Name',
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
                { key: 'company', label: 'Company' },
                {
                  key: 'isActive',
                  label: 'Active',
                  render: (value) => <YesNoCell value={value} />,
                },
              ]}
              emptyMessage='No users to display at the moment.'
            />
          </div>
        ) : (
          !isLoading && (
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
              <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
                No Auditors Found
              </h3>
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new user.
              </p>
            </div>
          )
        )}
      </>
      <AuditorFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingAuditor}
      />
    </>
  )
}
