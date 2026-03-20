// /* ------------------------------------------------------------------ */
// /* Event History — list & create events for an account                */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { CalendarPlus } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import PaginatedTable from '@/components/paginated-table'
// import NewEventDialog from '@/features/events/new-event-history-dialog.tsx'

// /* ------------------------------------------------------------------ */
// /* Route                                                              */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/(summary)/$category/summary/events/$accountId'
// )({
//   component: EventHistoryPage,
// })

// /* ------------------------------------------------------------------ */
// /* Component                                                          */
// /* ------------------------------------------------------------------ */
// function EventHistoryPage() {
//   const { accountId } = Route.useParams()

//   /* ------- fetch account holder name ------- */
//   const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
//     'get',
//     '/account/getName',
//     {
//       params: { query: { acctNo: accountId } },
//       onError: () => toast.error('Could not fetch account holder name'),
//     }
//   )

//   /* ------------- fetch events --------------- */
//   const {
//     data: eventsRes,
//     isLoading: eventsLoading,
//     refetch,
//   } = $api.useQuery('get', `/Events/history/${accountId}`, {
//     onError: () => toast.error('Could not fetch events'),
//   })

//   const events = eventsRes?.data ?? []
//   const [dialogOpen, setDialogOpen] = useState(false)

//   /* ------------- table columns -------------- */
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
//       { key: 'eventType', label: 'Event Type', sortable: true },
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

//   const loading = nameLoading || eventsLoading

//   /* ------------- UI ------------------------ */
//   return (
//     <MainWrapper>
//       <div className='space-y-6'>
//         <header className='text-center'>
//           {loading ? (
//             <Skeleton className='mx-auto h-6 w-72' />
//           ) : (
//             <h2 className='text-2xl font-semibold tracking-tight'>
//               Event History — {nameRes?.data ?? ''} ({accountId})
//             </h2>
//           )}
//         </header>

//         <Card>
//           <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
//             <CardTitle>Event Records</CardTitle>

//             <Button
//               size='sm'
//               className='gap-2'
//               onClick={() => setDialogOpen(true)}
//             >
//               <CalendarPlus className='h-4 w-4' />
//               <span className='hidden sm:inline'>New Event</span>
//             </Button>
//           </CardHeader>

//           <CardContent>
//             <PaginatedTable
//               data={events}
//               columns={columns}
//               initialRowsPerPage={10}
//               showSearch
//               frameless
//               emptyMessage='No event records found'
//             />
//           </CardContent>
//         </Card>
//       </div>

//       {/* dialog */}
//       <NewEventDialog
//         open={dialogOpen}
//         setOpen={(o) => {
//           setDialogOpen(o)
//           if (!o) refetch()
//         }}
//         accountId={accountId}
//       />
//     </MainWrapper>
//   )
// }

// export default EventHistoryPage
