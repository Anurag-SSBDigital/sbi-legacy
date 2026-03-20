// /* ------------------------------------------------------------------ */
// /* Interview History — list all interviews for an account             */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { ClipboardList } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Skeleton } from '@/components/ui/skeleton'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table'
// import NewInterviewDialog from '@/features/inteview/new-interview-dialog.tsx'
// /* ------------------------------------------------------------------ */
// /* Route                                                              */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/(summary)/$category/summary/$accountId/action/interview'
// )({
//   component: InterviewHistoryPage,
// })
// /* ------------------------------------------------------------------ */
// /* Component                                                          */
// /* ------------------------------------------------------------------ */
// function InterviewHistoryPage() {
//   const { accountId } = Route.useParams()
//   /* ------------------- queries ------------------- */
//   const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
//     'get',
//     '/account/getName',
//     {
//       params: { query: { acctNo: accountId } },
//       onError: () => toast.error('Could not fetch account holder name'),
//     }
//   )
//   const {
//     data: historyRes,
//     isLoading: historyLoading,
//     refetch,
//   } = $api.useQuery('get', '/Interviews/history/{accountNumber}', {
//     params: { path: { accountNumber: accountId } },
//     onError: () => toast.error('Could not fetch interviews'),
//   })
//   const interviews = historyRes?.data ?? []
//   const [dialogOpen, setDialogOpen] = useState(false)
//   /* ------------------- table columns ------------- */
//   const columns = useMemo<
//     PaginatedTableProps<components['schemas']['InterviewDto']>['columns']
//   >(
//     () => [
//       {
//         key: 'createDateTime',
//         label: 'Date',
//         sortable: true,
//         render: (v) =>
//           new Date(`${v}`).toLocaleDateString(`en-IN`, {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//       },
//       { key: 'personInterviewed', label: 'Person Interviewed', sortable: true },
//       { key: 'interviewerName', label: 'Interviewer', sortable: true },
//       // { key: 'place', label: 'Place' },
//       { key: 'summary', label: 'Summary' },
//       {
//         key: 'report',
//         label: 'Report',
//         render: (url) =>
//           url ? (
//             <a
//               href={`${url}`}
//               target='_blank'
//               rel='noopener noreferrer'
//               className='text-primary underline'
//             >
//               View
//             </a>
//           ) : (
//             '—'
//           ),
//       },
//     ],
//     []
//   )
//   const loading = nameLoading || historyLoading
//   /* ------------------- ui ------------------------ */
//   return (
//     <>
//       <div className='space-y-6'>
//         <header className='text-center'>
//           {loading ? (
//             <Skeleton className='mx-auto h-6 w-72' />
//           ) : (
//             <h2 className='text-2xl font-semibold tracking-tight'>
//               Interview History — {nameRes?.data ?? ''} ({accountId})
//             </h2>
//           )}
//         </header>
//         <Card>
//           <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
//             <CardTitle>Interview Records</CardTitle>
//             <Button
//               size='sm'
//               className='gap-2'
//               onClick={() => setDialogOpen(true)}
//             >
//               <ClipboardList className='h-4 w-4' />
//               <span className='hidden sm:inline'>New Interview</span>
//             </Button>
//           </CardHeader>
//           <CardContent>
//             <PaginatedTable
//               data={interviews}
//               columns={columns}
//               initialRowsPerPage={10}
//               emptyMessage='No interview records found'
//               showSearch
//               frameless
//             />
//           </CardContent>
//         </Card>
//       </div>
//       {/* dialog */}
//       <NewInterviewDialog
//         open={dialogOpen}
//         setOpen={(o) => {
//           setDialogOpen(o)
//           if (!o) refetch() // refresh list after close
//         }}
//         accountId={accountId}
//       />
//     </>
//   )
// }
// export default InterviewHistoryPage
/* ------------------------------------------------------------------ */
/* Interview History — list all interviews for an account             */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { useCanAccess } from '@/hooks/use-can-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import {
  DateCell,
  ReportCell,
  DeleteActionCell,
} from '@/components/table/cells.ts'
import NewInterviewDialog from '@/features/inteview/new-interview-dialog.tsx'

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */
export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/interview'
)({
  component: InterviewHistoryPage,
})

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function InterviewHistoryPage() {
  const { accountId } = Route.useParams()

  /* ------------------- queries ------------------- */
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
  } = $api.useQuery('get', '/Interviews/history/{accountNumber}', {
    params: { path: { accountNumber: accountId } },
    onError: () => toast.error('Could not fetch interviews'),
  })

  const interviews = historyRes?.data ?? []

  const [dialogOpen, setDialogOpen] = useState(false)

  /* ------------------- delete mutation ----------- */
  const deleteInterviewMutation = $api.useMutation(
    'delete',
    '/Interviews/delete/{interviewId}'
  )

  const handleDelete = async (interviewId: number) => {
    try {
      const res = await deleteInterviewMutation.mutateAsync({
        params: { path: { interviewId } },
      })

      if (res) {
        toast.success('Interview deleted successfully')
        refetch()
      }
    } catch {
      toast.error('Could not delete interview')
    }
  }

  const canDelete = useCanAccess('interview', 'delete')

  /* ------------------- table columns ------------- */
  const columns = useMemo<
    PaginatedTableProps<components['schemas']['InterviewDto']>['columns']
  >(() => {
    const baseColumns: PaginatedTableProps<
      components['schemas']['InterviewDto']
    >['columns'] = [
      {
        key: 'createDateTime',
        label: 'Date',
        sortable: true,
        render: (v) => <DateCell value={v} />,
      },
      { key: 'personInterviewed', label: 'Person Interviewed', sortable: true },
      { key: 'interviewerName', label: 'Interviewer', sortable: true },
      { key: 'summary', label: 'Summary' },
      {
        key: 'report',
        label: 'Report',
        render: (v) => <ReportCell url={v} />,
      },
    ]

    if (canDelete) {
      baseColumns.push({
        key: 'interview_id',
        label: 'Actions',
        render: (_, row: components['schemas']['InterviewDto']) => (
          <div className='flex justify-center'>
            <DeleteActionCell
              title='Delete Interview'
              description='Are you sure you want to delete this interview? This action cannot be undone.'
              onConfirm={() => handleDelete(Number(row.interview_id))}
              isConfirming={deleteInterviewMutation.isPending}
            />
          </div>
        ),
      })
    }
    return baseColumns
  }, [canDelete])

  const loading = nameLoading || historyLoading

  /* ------------------- ui ------------------------ */
  return (
    <>
      <div className='space-y-6'>
        <header className='text-center'>
          {loading ? (
            <Skeleton className='mx-auto h-6 w-72' />
          ) : (
            <h2 className='text-2xl font-semibold tracking-tight'>
              Interview History — {nameRes?.data ?? ''} ({accountId})
            </h2>
          )}
        </header>

        <Card>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Interview Records</CardTitle>

            <Button
              size='sm'
              className='gap-2'
              onClick={() => setDialogOpen(true)}
            >
              <ClipboardList className='h-4 w-4' />
              <span className='hidden sm:inline'>New Interview</span>
            </Button>
          </CardHeader>

          <CardContent>
            <PaginatedTable
              data={interviews}
              columns={columns}
              initialRowsPerPage={10}
              emptyMessage='No interview records found'
              showSearch
              frameless
            />
          </CardContent>
        </Card>
      </div>

      {/* dialog */}
      <NewInterviewDialog
        open={dialogOpen}
        setOpen={(o) => {
          setDialogOpen(o)
          if (!o) refetch() // refresh list after close
        }}
        accountId={accountId}
      />
    </>
  )
}

export default InterviewHistoryPage
