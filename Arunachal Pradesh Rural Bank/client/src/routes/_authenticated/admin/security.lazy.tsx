import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  EditActionCell,
  DeleteActionCell,
  SemiBoldCell,
} from '@/components/table/cells.ts'
import { SecurityFormDialog } from '@/features/security/SecurityFormDialog'

export const Route = createLazyFileRoute('/_authenticated/admin/security')({
  component: RouteComponent,
})

// function normalizeList(data: any): SecurityForm[] {
//   const raw = Array.isArray(data?.data)
//     ? data.data
//     : Array.isArray(data?.data?.content)
//     ? data.data.content
//     : Array.isArray(data)
//     ? data
//     : []
//   return raw.map((d: any) => ({
//     id: d.id,
//     securityType: d.securityType ?? '',
//   }))
// }

export type SecurityForm = {
  id?: number
  securityType: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isSecurityFormLike(
  v: unknown
): v is { id?: unknown; securityType?: unknown } {
  return isRecord(v)
}

function extractArray(data: unknown): unknown[] {
  if (isRecord(data)) {
    const d = (data as Record<string, unknown>).data
    if (Array.isArray(d)) return d
    if (isRecord(d) && Array.isArray(d.content)) return d.content
  }
  if (Array.isArray(data)) return data
  return []
}

function normalizeList(data: unknown): SecurityForm[] {
  return extractArray(data)
    .filter(isSecurityFormLike)
    .map((d) => ({
      id: typeof d.id === 'number' ? d.id : undefined,
      securityType: typeof d.securityType === 'string' ? d.securityType : '',
    }))
}

function RouteComponent() {
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingSecurity, setEditingSecurity] = useState<SecurityForm | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const canCreate = useCanAccess('security', 'create')
  const canEdit = useCanAccess('security', 'update')
  const canDelete = useCanAccess('security', 'delete')

  // --- API hooks (your endpoints) ---
  const createSecurityMutation = $api.useMutation(
    'post',
    '/legal-securityType/create',
    {
      onSuccess: () => {
        toast.success('Security created successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not create security. Please try again.'),
    }
  )

  const updateSecurityMutation = $api.useMutation(
    'put',
    '/legal-securityType/update/{id}',
    {
      onSuccess: () => {
        toast.success('Security updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not update security. Please try again.'),
    }
  )

  const {
    data: securityResp,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/legal-securityType/all', {})

  const deleteSecurityMutation = $api.useMutation(
    'delete',
    '/legal-securityType/delete/{id}'
  )

  // Normalize + sort A→Z
  const tableData = useMemo<SecurityForm[]>(() => {
    return normalizeList(securityResp).sort((a, b) =>
      (a.securityType || '').localeCompare(b.securityType || '', undefined, {
        sensitivity: 'base',
      })
    )
  }, [securityResp])

  // --- Handlers ---
  const handleEdit = (row: SecurityForm) => {
    setEditingSecurity({ id: row.id, securityType: row.securityType })
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingSecurity(null)
    setFormOpen(true)
  }

  const nameExists = (name: string, ignoreId?: number | null) => {
    const n = name.trim().toLowerCase()
    return tableData.some(
      (x) =>
        x.securityType.trim().toLowerCase() === n &&
        (ignoreId ? x.id !== ignoreId : true)
    )
  }

  const handleFormSubmit = async (values: SecurityForm) => {
    const securityType = values.securityType.trim()
    const isEdit = editingSecurity?.id != null

    if (!securityType) {
      toast.error('Security Type is required')
      return
    }
    if (nameExists(securityType, editingSecurity?.id ?? null)) {
      toast.error('Security Type already exists')
      return
    }

    if (isEdit && editingSecurity?.id) {
      updateSecurityMutation.mutate({
        body: { securityType },
        params: {
          path: { id: editingSecurity.id },
          header: { Authorization: '' },
        },
      })
    } else {
      createSecurityMutation.mutate({
        body: { securityType },
        params: { header: { Authorization: '' } },
      })
    }
  }

  const handleDelete = (id: number) => {
    setDeletingId(id)
    deleteSecurityMutation.mutate(
      { params: { path: { id } } },
      {
        onSuccess: () => {
          toast.success('Security deleted')
          setDeletingId(null)
          refetch()
        },
        onError: () => {
          toast.error('Could not delete security')
          setDeletingId(null)
        },
      }
    )
  }

  const isSubmitting =
    createSecurityMutation.isPending || updateSecurityMutation.isPending

  return (
    <>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Security Types
        </h1>
        {canCreate && (
          <Button size='sm' onClick={handleCreate}>
            New Security
          </Button>
        )}
      </div>

      {tableData.length ? (
        <PaginatedTable
          data={tableData}
          renderActions={(row) => {
            const r = row as SecurityForm
            const rowDeleting =
              deletingId === r.id && deleteSecurityMutation.isPending
            return (
              <div className='flex flex-row gap-2'>
                {canEdit && (
                  <EditActionCell
                    // onClick={() => handleEdit(r)}
                    // disabled={rowDeleting || isSubmitting}
                    onClick={() => {
                      if (rowDeleting || isSubmitting) return
                      handleEdit(r)
                    }}
                  />
                )}
                {canDelete && (
                  <DeleteActionCell
                    title={`Delete "${r.securityType}"?`}
                    onConfirm={() => r.id && handleDelete(r.id)}
                    isConfirming={rowDeleting || isSubmitting}
                  />
                )}
              </div>
            )
          }}
          columns={[
            {
              key: 'securityType',
              label: 'Security Type',
              render: (value) => <SemiBoldCell value={value || ''} />,
            },
          ]}
          emptyMessage='No security types found.'
        />
      ) : (
        !isLoading && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
            <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
              No Security Types Found
            </h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              Get started by creating a new security type.
            </p>
            {canCreate && (
              <Button className='mt-4' onClick={handleCreate}>
                New Security
              </Button>
            )}
          </div>
        )
      )}

      <SecurityFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingSecurity}
      />
    </>
  )
}
