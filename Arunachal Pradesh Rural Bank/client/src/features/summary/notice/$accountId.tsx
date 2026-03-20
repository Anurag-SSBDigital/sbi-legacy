// /* ------------------------------------------------------------------ */
// /* Notice History — list & create notices for an account              */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { FilePlus2 } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import PaginatedTable from '@/components/paginated-table'
// import NewNoticeDialog from '@/features/notice/new-notice-dialog.tsx'

// /* ------------------------------------------------------------------ */
// /* Route                                                              */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/npa/summary/notice/$accountId'
// )({
//   component: NoticeHistoryPage,
// })

// /* ------------------------------------------------------------------ */
// /* Component                                                          */
// /* ------------------------------------------------------------------ */
// function NoticeHistoryPage() {
//   const { accountId } = Route.useParams()

//   /* ------------------- fetch notice info ------------------- */
//   const {
//     data: noticeRes,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/Notice/{accountNumber}', {
//     params: { path: { accountNumber: accountId } },
//     onError: () => toast.error('Could not fetch notice info'),
//   })

//   const info = noticeRes?.data
//   const history = info?.history ?? []

//   const [dialogOpen, setDialogOpen] = useState(false)

//   /* ------------------- table columns ----------------------- */
//   const columns = useMemo(
//     () => [
//       {
//         key: 'issuedDate',
//         label: 'Issued Date',
//         sortable: true,
//         render: (v: string) =>
//           new Date(v).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//       },
//       { key: 'noticeType', label: 'Notice Type', sortable: true },
//       { key: 'followUpType', label: 'Follow-up Type' },
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
//       { key: 'createdBy', label: 'Created By' },
//     ],
//     []
//   )

//   /* ------------------- ui ------------------------ */
//   return (
//     <MainWrapper>
//       <div className='space-y-6'>
//         <header className='text-center'>
//           {isLoading ? (
//             <Skeleton className='mx-auto h-6 w-72' />
//           ) : (
//             <h2 className='text-2xl font-semibold tracking-tight'>
//               Notice History — {info?.name ?? ''} ({accountId})
//             </h2>
//           )}
//         </header>

//         {/* ---------- account + notice summary ---------- */}
//         <Card>
//           {isLoading ? (
//             <Skeleton className='h-40 w-full' />
//           ) : (
//             <>
//               <CardHeader>
//                 <CardTitle>Account Details</CardTitle>
//               </CardHeader>
//               <CardContent className='space-y-1 text-sm'>
//                 <div>
//                   <span className='font-medium'>Account&nbsp;No:</span>{' '}
//                   {info?.acctNo}
//                 </div>
//                 <div>
//                   <span className='font-medium'>Name:</span> {info?.name}
//                 </div>
//                 <div>
//                   <span className='font-medium'>Address:</span>{' '}
//                   {[info?.add1, info?.add2, info?.add3, info?.add4]
//                     .filter(Boolean)
//                     .join(', ')}
//                 </div>
//                 <div>
//                   <span className='font-medium'>Irregular Amount:</span> ₹
//                   {info?.irregAmt ?? 0}
//                 </div>
//                 {/* <div>
//                   <span className='font-medium'>Default&nbsp;Notice Type:</span>{' '}
//                   {info?.noticeType}
//                 </div> */}
//               </CardContent>
//             </>
//           )}
//         </Card>

//         {/* ---------- history table ---------- */}
//         <Card>
//           <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
//             <CardTitle>Notice Records</CardTitle>
//             <Button
//               size='sm'
//               onClick={() => setDialogOpen(true)}
//               className='gap-2'
//             >
//               <FilePlus2 className='h-4 w-4' />
//               <span className='hidden sm:inline'>New Notice</span>
//             </Button>
//           </CardHeader>
//           <CardContent>
//             <PaginatedTable
//               data={history}
//               columns={columns}
//               initialRowsPerPage={10}
//               showSearch
//               frameless
//               emptyMessage='No notice records found'
//             />
//           </CardContent>
//         </Card>
//       </div>

//       {/* dialog */}
//       {info && (
//         <NewNoticeDialog
//           open={dialogOpen}
//           setOpen={(o) => {
//             setDialogOpen(o)
//             if (!o) refetch() // refresh when dialog closes
//           }}
//           accountId={accountId}
//           noticeInfo={info}
//         />
//       )}
//     </MainWrapper>
//   )
// }

// export default NoticeHistoryPage
