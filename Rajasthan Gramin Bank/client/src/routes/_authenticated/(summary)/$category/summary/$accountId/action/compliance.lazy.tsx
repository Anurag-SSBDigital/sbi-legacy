/* ------------------------------------------------------------------ */
/* routes/_authenticated/npa/summary/compliance/$accountId.tsx        */
/*    Offline Alerts History — list & create offline alerts           */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'
import {
  DateCell,
  DocumentNameCell,
  YesNoCell,
} from '@/components/table/cells.ts'
import NewOfflineAlertDialog from '@/features/compliance/new-offline-alert-dialog.tsx'

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */
export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/compliance'
)({
  component: OfflineAlertsPage,
})

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function OfflineAlertsPage() {
  const { accountId } = Route.useParams()

  /* -------- account holder name -------- */
  const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
    'get',
    '/account/getName',
    {
      params: { query: { acctNo: accountId } },
      onError: () => toast.error('Could not fetch account holder name'),
    }
  )

  /* -------- offline alert data -------- */
  const {
    data: alertsRes,
    isLoading: alertsLoading,
    refetch, // <-- to refresh after adding a new alert
  } = $api.useQuery('get', '/AlertOffline/get/{accountNumber}', {
    params: { path: { accountNumber: accountId } },
    onError: () => toast.error('Could not fetch offline alerts'),
  })

  const alerts = alertsRes?.data ?? []

  /* -------- modal state -------- */
  const [dialogOpen, setDialogOpen] = useState(false)

  /* -------- table columns -------- */
  const columns = useMemo<
    PaginatedTableColumn<components['schemas']['AlertOffline']>[]
  >(
    () => [
      {
        key: 'createdTime',
        label: 'Date',
        sortable: true,
        render: (v) => <DateCell value={v} />,
      },
      { key: 'pointNo', label: 'Point #', sortable: true },
      { key: 'point', label: 'Point' },
      { key: 'decision', label: 'Decision' },
      { key: 'description', label: 'Description' },
      {
        key: 'documentName',
        label: 'Documents',
        render: (docs: unknown) => <DocumentNameCell docs={docs} />,
      },
      { key: 'createdBy', label: 'Created By', sortable: true },
      {
        key: 'isActive',
        label: 'Active',
        render: (v) => <YesNoCell value={v} />,
      },
    ],
    []
  )

  const loading = nameLoading || alertsLoading

  /* -------- UI -------- */
  return (
    <>
      <div className='space-y-6'>
        {/* page header */}
        <header className='text-center'>
          {loading ? (
            <Skeleton className='mx-auto h-6 w-72' />
          ) : (
            <h2 className='text-2xl font-semibold tracking-tight'>
              Offline Alerts History — {nameRes?.data ?? ''} ({accountId})
            </h2>
          )}
        </header>

        {/* table card */}
        <Card>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Alert Records</CardTitle>

            {/* ---- New Alert button ---- */}
            <button
              onClick={() => setDialogOpen(true)}
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm'
            >
              <PlusCircle className='h-4 w-4' />
              <span className='hidden sm:inline'>New Offline Alert</span>
            </button>
          </CardHeader>

          <CardContent>
            <PaginatedTable
              data={alerts}
              columns={columns}
              initialRowsPerPage={10}
              showSearch
              frameless
              emptyMessage='No offline alerts found'
            />
          </CardContent>
        </Card>
      </div>

      {/* dialog */}
      <NewOfflineAlertDialog
        open={dialogOpen}
        setOpen={(o) => {
          setDialogOpen(o)
          if (!o) refetch() // refresh list after dialog closes
        }}
        accountId={accountId}
      />
    </>
  )
}

export default OfflineAlertsPage
