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
  DateTimeCell,
  SemiBoldCell,
  EmailCell,
  MobileCell,
} from '@/components/table/cells.ts'
import { ValuerFormDialog } from '@/features/valuer/ValuerFormDialog.tsx'

export const Route = createLazyFileRoute('/_authenticated/admin/valuers')({
  component: RouteComponent,
})

// Matches backend entity fields
export type ValuerDTO = {
  id?: number
  valuerName: string
  fullName: string
  emailId: string
  mobileNo: string
  regNumber: string
  empanelmentNo: string
  address: string
  isActive: boolean
  // read-only auditing fields that might be present from API
  createdTime?: string
  updatedTime?: string
  createdBy?: string
  updatedBy?: string
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
  filename = 'valuers.csv'
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
  filename = 'valuers.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)

    // xlsx expects a mutable array
    const mutableRows: T[] = Array.from(rows)

    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Valuers')
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
  const [editingValuer, setEditingValuer] = useState<ValuerDTO | null>(null)

  const canCreate = useCanAccess('valuers', 'create')
  const canEdit = useCanAccess('valuers', 'update')
  const canDelete = useCanAccess('valuers', 'delete')

  const createValuerMutation = $api.useMutation('post', '/api/valuers/create', {
    onSuccess: () => {
      toast.success('Valuer created successfully!')
      refetch()
      setFormOpen(false)
    },
    onError: (error) =>
      toastError(error, 'Could not create valuer. Please try again.'),
  })

  const updateValuerMutation = $api.useMutation(
    'put',
    '/api/valuers/update/{id}',
    {
      onSuccess: () => {
        toast.success('Valuer updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not update valuer. Please try again.'),
    }
  )

  const {
    data: usersData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/api/valuers/all', {})

  const deleteValuerMutation = $api.useMutation(
    'delete',
    '/api/valuers/delete/{id}'
  )

  const handleEdit = (valuer: ValuerDTO) => {
    setEditingValuer(valuer)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingValuer(null)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: ValuerDTO) => {
    const isEditMode = editingValuer?.id != null

    // Ensure we don't send read-only fields back
    const { createdTime, updatedTime, createdBy, updatedBy, ...payload } =
      values

    if (isEditMode && editingValuer?.id) {
      updateValuerMutation.mutate({
        body: payload,
        params: {
          path: { id: editingValuer.id },
          header: { Authorization: '' },
        },
      })
    } else {
      createValuerMutation.mutate({
        body: payload,
        params: { header: { Authorization: '' } },
      })
    }
  }

  const isSubmitting =
    createValuerMutation.isPending || updateValuerMutation.isPending

  const handleDelete = (valuerId: number) => {
    deleteValuerMutation.mutate(
      {
        params: {
          path: { id: valuerId },
        },
      },
      {
        onSuccess: () => {
          toast.success('Valuer deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete valuer'),
      }
    )
  }

  // Materialize current table rows (no filters on this page)
  const valuerRows: ValuerDTO[] = useMemo(
    () => (usersData?.data as ValuerDTO[] | undefined) ?? [],
    [usersData?.data]
  )

  // Export handlers (export exactly what's displayed)
  const handleExportCSV = () => {
    if (!valuerRows.length) {
      toast.info('No data to export.')
      return
    }
    exportCSV<ValuerDTO>(valuerRows, 'valuers.csv')
  }

  const handleExportExcel = async () => {
    if (!valuerRows.length) {
      toast.info('No data to export.')
      return
    }
    await exportExcel<ValuerDTO>(valuerRows, 'valuers.xlsx')
  }

  return (
    <>
      <>
        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}
        {/* --- Title Row & Create Dialog Trigger --- */}
        <div className='mb-2 flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Valuers
          </h1>
          <div className='flex items-center gap-2'>
            {/* Export Buttons */}
            <Button variant='outline' size='sm' onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant='outline' size='sm' onClick={handleExportExcel}>
              Export Excel
            </Button>

            {canCreate && (
              <Button size='sm' onClick={handleCreate}>
                New Valuer
              </Button>
            )}
          </div>
        </div>
        {/* --- Data Table --- */}
        {valuerRows.length ? (
          <div>
            <PaginatedTable
              data={valuerRows}
              renderActions={(row) => (
                <div className='flex flex-row gap-2'>
                  {canEdit && (
                    <EditActionCell
                      onClick={() => handleEdit(row as ValuerDTO)}
                    />
                  )}
                  {canDelete && (
                    <DeleteActionCell
                      title={`Delete "${row.fullName}"?`}
                      onConfirm={() => row.id && handleDelete(row.id)}
                      isConfirming={
                        deleteValuerMutation.isPending || isSubmitting
                      }
                    />
                  )}
                </div>
              )}
              columns={[
                {
                  key: 'valuerName',
                  label: 'Valuer Name',
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
                { key: 'regNumber', label: 'Registration No' },
                { key: 'empanelmentNo', label: 'Empanelment No' },
                {
                  key: 'isActive',
                  label: 'Active',
                  render: (v) => <YesNoCell value={v} />,
                },
              {
                  key: 'createdTime',
                  label: 'Created Time',
                  render: (value) =>
                    value ? <DateTimeCell value={value} /> : null,
                },
                {
                  key: 'updatedTime',
                  label: 'Updated Time',
                  render: (value) =>
                    value ? <DateTimeCell value={value} /> : null,
                },
              ]}
              emptyMessage='No Valuers found.'
            />
          </div>
        ) : (
          !isLoading && (
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
              <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
                No Valuers Found
              </h3>
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new valuer.
              </p>
            </div>
          )
        )}
      </>
      <ValuerFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingValuer ?? undefined}
      />
    </>
  )
}
