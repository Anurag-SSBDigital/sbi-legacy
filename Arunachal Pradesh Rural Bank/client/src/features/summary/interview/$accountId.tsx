// /* ------------------------------------------------------------------ */
// /* Interview History — list all interviews for an account             */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { ClipboardList } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import PaginatedTable from '@/components/paginated-table'
// import NewInterviewDialog from '@/features/inteview/new-interview-dialog.tsx'

// /* ------------------------------------------------------------------ */
// /* Route                                                              */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/npa/summary/interview/$accountId'
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
//   const columns = useMemo(
//     () => [
//       {
//         key: 'createDateTime',
//         label: 'Date',
//         sortable: true,
//         render: (v: string) =>
//           new Date(v).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//       },
//       { key: 'personInterviewed', label: 'Person Interviewed', sortable: true },
//       { key: 'interviewerName', label: 'Interviewer', sortable: true },
//       { key: 'place', label: 'Place' },
//       { key: 'summary', label: 'Summary' },
//       {
//         key: 'report',
//         label: 'Report',
//         render: (url: string) =>
//           url ? (
//             <a
//               href={url}
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
//     <MainWrapper>
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
//     </MainWrapper>
//   )
// }

// export default InterviewHistoryPage
