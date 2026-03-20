/* ------------------------------------------------------------------ */
/* Stock Audit — history & assignment for an account                  */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  DateCell,
  CurrencyCell,
  StockAuditActionsCell,
} from '@/components/table/cells.ts'
import NewStockAuditDialog from '@/features/stock-audit/new-stock-audit-dialog.tsx'

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */
export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/stock-audit'
)({
  component: StockAuditPage,
})

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function StockAuditPage() {
  const { accountId } = Route.useParams()

  /* ---------------- queries ---------------- */
  const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
    'get',
    '/account/getName',
    {
      params: { query: { acctNo: accountId } },
      onError: () => toast.error('Could not fetch account holder name'),
    }
  )

  const {
    data: historyRes,
    isLoading: historyLoading,
    refetch,
  } = $api.useQuery('get', '/stockAudit/history/{accountNumber}', {
    params: { path: { accountNumber: accountId } },
    onError: () => toast.error('Could not fetch stock-audit history'),
  })

  const statusBuckets = useMemo(
    () =>
      historyRes?.data ?? {
        COMPLETED: [],
        ACCEPTED: [],
        PENDING: [],
        REJECTED: [],
      },
    [historyRes?.data]
  )

  /* flatten all rows once so we don’t recompute */
  const allRows = useMemo(() => {
    const res: components['schemas']['StockAuditAssignment'][] = []
    Object.entries(statusBuckets).forEach(([status, arr]) => {
      arr?.forEach((row) =>
        res.push({ ...row, status } as { status: 'COMPLETED' })
      )
    })
    return res
  }, [statusBuckets])

  // const [tab, setTab] = useState<
  //   'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  // >('PENDING')
  const [dialogOpen, setDialogOpen] = useState(false)

  /* --------------- columns --------------- */
  // const columns = useMemo(
  //   () => [
  //     { key: 'id', label: 'ID', sortable: true },
  //     {
  //       key: 'auditPeriodFrom',
  //       label: 'From',
  //       sortable: true,
  //       render: (v: string) => new Date(v).toLocaleDateString('en-IN'),
  //     },
  //     {
  //       key: 'auditPeriodTo',
  //       label: 'To',
  //       sortable: true,
  //       render: (v: string) => new Date(v).toLocaleDateString('en-IN'),
  //     },
  //     { key: 'facilityType', label: 'Facility' },
  //     { key: 'stockLocation', label: 'Location' },
  //     { key: 'auditorName', label: 'Auditor', sortable: true },
  //     {
  //       key: 'sanctionLimit',
  //       label: 'Sanction Limit',
  //       render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
  //     },
  //     { key: 'status', label: 'Status' },
  //     {
  //       key: 'actions',
  //       label: 'Actions',
  //       render: (_: any, row: any) => (
  //         <div className='flex flex-row items-center gap-2'>
  //           {/* Start Button */}
  //           <Button
  //             size='sm'
  //             onClick={() => {
  //               startAuditMutation.mutate({
  //                 params: {
  //                   path: { assignmentId: row.id },
  //                   header: { Authorization: '' },
  //                 },
  //               })
  //             }}
  //           >
  //             Start
  //           </Button>

  //           {/* Fill Descriptions */}
  //           <Link
  //             to='/stock-audit/$accountId/descriptions/$assignmentId'
  //             params={{ accountId: row.accountNo, assignmentId: row.id }}
  //           >
  //             <Button size='sm'>Fill Descriptions</Button>
  //           </Link>

  //           {/* Dropdown */}
  //           <DropdownMenu>
  //             <DropdownMenuTrigger asChild>
  //               <Button size='icon' variant='ghost' className='h-8 w-8'>
  //                 <MoreVertical className='h-4 w-4' />
  //               </Button>
  //             </DropdownMenuTrigger>

  //             <DropdownMenuContent align='end' className='w-48'>
  //               <DropdownMenuItem asChild>
  //                 <a
  //                   href={`${BASE_URL}/stockAudit/fullReportPdf/${row.id}`}
  //                   target='_blank'
  //                   rel='noopener noreferrer'
  //                   className='flex items-center gap-2'
  //                 >
  //                   <Download className='h-4 w-4' />
  //                   Audit Report
  //                 </a>
  //               </DropdownMenuItem>

  //               <DropdownMenuItem asChild>
  //                 <a
  //                   href={`${BASE_URL}/stockAudit/generatePdf/${row.id}`}
  //                   target='_blank'
  //                   rel='noopener noreferrer'
  //                   className='flex items-center gap-2'
  //                 >
  //                   <Download className='h-4 w-4' />
  //                   Assignment Letter
  //                 </a>
  //               </DropdownMenuItem>
  //             </DropdownMenuContent>
  //           </DropdownMenu>
  //         </div>
  //       ),
  //     },
  //   ],
  //   []
  // )

  const loading = nameLoading || historyLoading

  /* --------------- UI -------------------- */
  return (
    <>
      <div className='space-y-6'>
        {/* page header */}
        <header className='text-center'>
          {loading ? (
            <Skeleton className='mx-auto h-6 w-72' />
          ) : (
            <h2 className='text-2xl font-semibold tracking-tight'>
              Stock Audit — {nameRes?.data ?? ''} ({accountId})
            </h2>
          )}
        </header>

        {/* main card */}
        <Card>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Assignment Records</CardTitle>
          </CardHeader>

          <CardContent>
            <PaginatedTable
              data={allRows}
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                {
                  key: 'auditPeriodFrom',
                  label: 'From',
                  sortable: true,
                  render: (v) => <DateCell value={v} />,
                },
                {
                  key: 'auditPeriodTo',
                  label: 'To',
                  sortable: true,
                  render: (v) => <DateCell value={v} />,
                },
                { key: 'facilityType', label: 'Facility' },
                { key: 'stockLocation', label: 'Location' },
                { key: 'auditorName', label: 'Auditor', sortable: true },
                {
                  key: 'sanctionLimit',
                  label: 'Sanction Limit',
                  render: (v) => <CurrencyCell value={String(v)} />,
                },
                { key: 'status', label: 'Status' },
                {
                  key: 'id',
                  label: 'Actions',
                  render: (_, row) => <StockAuditActionsCell row={row} />,
                },
              ]}
              initialRowsPerPage={10}
              showSearch
              emptyMessage='No assignment records found'
            />
          </CardContent>
        </Card>
      </div>

      {/* dialog */}
      <NewStockAuditDialog
        open={dialogOpen}
        setOpen={(o) => {
          setDialogOpen(o)
          if (!o) refetch()
        }}
        accountId={accountId}
      />
    </>
  )
}
