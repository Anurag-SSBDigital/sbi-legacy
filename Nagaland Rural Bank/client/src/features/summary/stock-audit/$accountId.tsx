// /* ------------------------------------------------------------------ */
// /* Stock Audit — history & assignment for an account                  */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { Layers3 } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
// import PaginatedTable from '@/components/paginated-table'
// import NewStockAuditDialog from '@/features/stock-audit/new-stock-audit-dialog.tsx'

// /* ------------------------------------------------------------------ */
// /* Route                                                              */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/npa/summary/stock-audit/$accountId'
// )({
//   component: StockAuditPage,
// })

// /* ------------------------------------------------------------------ */
// /* Component                                                          */
// /* ------------------------------------------------------------------ */
// function StockAuditPage() {
//   const { accountId } = Route.useParams()

//   /* ---------------- queries ---------------- */
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
//   } = $api.useQuery('get', '/stockAuditAssign/history/{accountNumber}', {
//     params: { path: { accountNumber: accountId } },
//     onError: () => toast.error('Could not fetch stock-audit history'),
//   })

//   const statusBuckets = historyRes?.data ?? {
//     COMPLETED: [],
//     ACCEPTED: [],
//     PENDING: [],
//     REJECTED: [],
//   }

//   /* flatten all rows once so we don’t recompute */
//   const allRows = useMemo(() => {
//     const res: any[] = []
//     Object.entries(statusBuckets).forEach(([status, arr]: any) => {
//       arr?.forEach((row: any) => res.push({ ...row, status }))
//     })
//     return res
//   }, [statusBuckets])

//   const [tab, setTab] = useState<
//     'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
//   >('PENDING')
//   const [dialogOpen, setDialogOpen] = useState(false)

//   /* --------------- columns --------------- */
//   const columns = useMemo(
//     () => [
//       { key: 'id', label: 'ID', sortable: true },
//       {
//         key: 'auditPeriodFrom',
//         label: 'From',
//         sortable: true,
//         render: (v: string) => new Date(v).toLocaleDateString('en-IN'),
//       },
//       {
//         key: 'auditPeriodTo',
//         label: 'To',
//         sortable: true,
//         render: (v: string) => new Date(v).toLocaleDateString('en-IN'),
//       },
//       { key: 'facilityType', label: 'Facility' },
//       { key: 'stockLocation', label: 'Location' },
//       { key: 'auditorName', label: 'Auditor', sortable: true },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
//       },
//       { key: 'status', label: 'Status' },
//     ],
//     []
//   )

//   const loading = nameLoading || historyLoading

//   /* --------------- UI -------------------- */
//   return (
//     <MainWrapper>
//       <div className='space-y-6'>
//         {/* page header */}
//         <header className='text-center'>
//           {loading ? (
//             <Skeleton className='mx-auto h-6 w-72' />
//           ) : (
//             <h2 className='text-2xl font-semibold tracking-tight'>
//               Stock Audit — {nameRes?.data ?? ''} ({accountId})
//             </h2>
//           )}
//         </header>

//         {/* main card */}
//         <Card>
//           <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
//             <CardTitle>Assignment Records</CardTitle>

//             <Button
//               size='sm'
//               className='gap-2'
//               onClick={() => setDialogOpen(true)}
//             >
//               <Layers3 className='h-4 w-4' />
//               <span className='hidden sm:inline'>New Assignment</span>
//             </Button>
//           </CardHeader>

//           <CardContent>
//             {/* --- shadcn tabs + single table --- */}
//             <Tabs
//               value={tab}
//               onValueChange={(v) => setTab(v)}
//               defaultValue='PENDING'
//             >
//               <TabsList className='mb-4'>
//                 {(
//                   ['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'] as const
//                 ).map((s) => (
//                   <TabsTrigger key={s} value={s}>
//                     {s}
//                   </TabsTrigger>
//                 ))}
//               </TabsList>

//               {(['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'] as const).map(
//                 (s) => (
//                   <TabsContent key={s} value={s}>
//                     <PaginatedTable
//                       data={allRows.filter((r) => r.status === s)}
//                       columns={columns}
//                       initialRowsPerPage={10}
//                       showSearch
//                       frameless
//                       emptyMessage={`No ${s.toLowerCase()} records`}
//                     />
//                   </TabsContent>
//                 )
//               )}
//             </Tabs>
//           </CardContent>
//         </Card>
//       </div>

//       {/* dialog */}
//       <NewStockAuditDialog
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

// export default StockAuditPage
