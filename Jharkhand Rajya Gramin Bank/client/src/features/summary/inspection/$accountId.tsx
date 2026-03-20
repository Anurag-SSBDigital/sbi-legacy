// /* ------------------------------------------------------------------ */
// /* routes/_authenticated/npa/summary/inspection/$accountId.tsx        */
// /*      Inspection History — list all inspections for an account      */
// /* ------------------------------------------------------------------ */
// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { Tractor, Users, Factory } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip'
// import PaginatedTable from '@/components/paginated-table'
// import NewAgricultureDialog from '@/features/inspections/new-agriculture-dialog.tsx'
// import NewMsmeDialog from '@/features/inspections/new-msme-inspection-dialog.tsx'
// import NewPSegmentDialog from '@/features/inspections/new-psegmnet-dialog.tsx'

// /* ------------------------------------------------------------------ */
// /* Route Definition                                                   */
// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute(
//   '/_authenticated/npa/summary/inspection/$accountId'
// )({
//   component: InspectionHistoryPage,
// })

// /* ------------------------------------------------------------------ */
// /* Component                                                          */
// /* ------------------------------------------------------------------ */
// function InspectionHistoryPage() {
//   const { accountId } = Route.useParams()

//   /* --------------------- */
//   /* Queries                */
//   /* --------------------- */
//   const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
//     'get',
//     '/account/getName',
//     {
//       params: {
//         query: { acctNo: accountId },
//       },
//       onError: () => toast.error('Could not fetch account holder name'),
//     }
//   )

//   const { data: inspectionsRes, isLoading: inspectionsLoading } = $api.useQuery(
//     'get',
//     '/Inspections/getAll',
//     {
//       params: {
//         query: { accountNumber: accountId },
//       },
//       onError: () => toast.error('Could not fetch inspections'),
//     }
//   )

//   const inspections = inspectionsRes?.data ?? []

//   const [agricultureDialogOpen, setAgricultureDialogOpen] = useState(false)
//   const [psegmnetDialogOpen, setPsegmnetDialogOpen] = useState(false)
//   const [msmeDialogOpen, setMsmeDialogOpen] = useState(false)

//   /* --------------------- */
//   /* Table Columns          */
//   /* --------------------- */
//   const columns = useMemo(
//     () => [
//       {
//         key: 'date',
//         label: 'Date',
//         sortable: true,
//         render: (value: string) =>
//           new Date(value).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//       },
//       { key: 'followUpType', label: 'Type', sortable: true },
//       { key: 'location', label: 'Location' },
//       { key: 'summary', label: 'Summary' },
//       {
//         key: 'report',
//         label: 'Report',
//         render: (v: string) =>
//           v ? (
//             <a
//               href={v}
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

//   const loading = inspectionsLoading || nameLoading

//   /* --------------------- */
//   /* UI                    */
//   /* --------------------- */
//   return (
//     <MainWrapper>
//       <div className='space-y-6'>
//         <header className='text-center'>
//           {loading ? (
//             <Skeleton className='mx-auto h-6 w-72' />
//           ) : (
//             <h2 className='text-2xl font-semibold tracking-tight'>
//               Inspection History — {nameRes?.data ?? ''} ({accountId})
//             </h2>
//           )}
//         </header>

//         <Card>
//           <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
//             <CardTitle>Inspection Records</CardTitle>

//             {/* ------------------------------------------------------------------ */}
//             {/* CTA: New Inspection Buttons                                         */}
//             {/* ------------------------------------------------------------------ */}
//             <div className='flex flex-wrap gap-3'>
//               {/* Agriculture */}
//               <TooltipProvider delayDuration={300}>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Button
//                       variant='default'
//                       size='sm'
//                       className='gap-2'
//                       onClick={() => {
//                         setAgricultureDialogOpen(true)
//                       }}
//                     >
//                       <Tractor className='h-4 w-4' />
//                       <span className='hidden sm:inline'>New Agriculture</span>
//                     </Button>
//                   </TooltipTrigger>
//                   <TooltipContent>Create Agriculture Inspection</TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>

//               {/* P-Segment */}
//               <TooltipProvider delayDuration={300}>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Button
//                       variant='default'
//                       size='sm'
//                       className='gap-2'
//                       onClick={() => {
//                         setPsegmnetDialogOpen(true)
//                       }}
//                     >
//                       <Users className='h-4 w-4' />
//                       <span className='hidden sm:inline'>New P-Segment</span>
//                     </Button>
//                   </TooltipTrigger>
//                   <TooltipContent>Create P-Segment Inspection</TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>

//               {/* MSME */}
//               <TooltipProvider delayDuration={300}>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Button
//                       variant='default'
//                       size='sm'
//                       className='gap-2'
//                       onClick={() => {
//                         setMsmeDialogOpen(true)
//                       }}
//                     >
//                       <Factory className='h-4 w-4' />
//                       <span className='hidden sm:inline'>New MSME</span>
//                     </Button>
//                   </TooltipTrigger>
//                   <TooltipContent>Create MSME Inspection</TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>
//             </div>
//           </CardHeader>

//           <CardContent>
//             <PaginatedTable
//               data={inspections}
//               columns={columns}
//               initialRowsPerPage={10}
//               emptyMessage='No inspections found'
//               showSearch={true}
//               frameless={true}
//             />
//           </CardContent>
//         </Card>
//       </div>
//       <NewAgricultureDialog
//         open={agricultureDialogOpen}
//         setOpen={setAgricultureDialogOpen}
//         accountId={accountId}
//       />

//       <NewPSegmentDialog
//         open={psegmnetDialogOpen}
//         setOpen={setPsegmnetDialogOpen}
//         accountId={accountId}
//       />
//       <NewMsmeDialog
//         open={msmeDialogOpen}
//         setOpen={setMsmeDialogOpen}
//         accountId={accountId}
//       />
//     </MainWrapper>
//   )
// }

// export default InspectionHistoryPage
