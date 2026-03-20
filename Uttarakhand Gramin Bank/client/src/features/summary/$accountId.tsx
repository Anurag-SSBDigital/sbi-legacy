// /* ------------------------------------------------------------------ */
// /* routes/_authenticated/npa/summary/$accountId.tsx — Redesigned      */
// /* ------------------------------------------------------------------ */
// import React, { useMemo } from 'react'
// import { createFileRoute, createLink } from '@tanstack/react-router'
// import { motion } from 'framer-motion'
// import {
//   FileSearch,
//   CalendarClock,
//   FileText,
//   ClipboardCheck,
//   Gavel,
//   AlertTriangle,
//   FileBadge,
// } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// /* --- shadcn/ui ---------------------------------------------------- */
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Separator } from '@/components/ui/separator'
// import { Skeleton } from '@/components/ui/skeleton'
// import PaginatedTable from '@/components/paginated-table'

// /* ------------------------------------------------------------------ */
// export const Route = createFileRoute('/_authenticated/npa/summary/$accountId')({
//   component: AccountSummaryPage,
// })
// /* ------------------------------------------------------------------ */
// function AccountSummaryPage() {
//   const { accountId } = Route.useParams()

//   /* ----------------------------- */
//   /* Queries                       */
//   /* ----------------------------- */
//   const {
//     data: acctResp,
//     isLoading: acctLoading,
//     isError: acctError,
//   } = $api.useQuery('get', '/account/NpaAccount/{acctNo}', {
//     params: { path: { acctNo: accountId } },
//     enabled: !!accountId,
//     onError: () => toast.error('Could not fetch account'),
//   })
//   const account = acctResp?.data

//   const { data: followResp } = $api.useQuery(
//     'get',
//     '/ActtionAccount/follow-ups',
//     {
//       params: { query: { accountNumber: accountId } },
//       enabled: !!accountId,
//       onError: () => toast.error('Could not fetch follow-ups'),
//     }
//   )
//   const followUps = followResp?.data ?? []

//   /* ----------------------------- */
//   /* Table Columns                 */
//   /* ----------------------------- */
//   const columns = useMemo(
//     () => [
//       { key: 'date', label: 'Date', sortable: true },
//       { key: 'followUpType', label: 'Follow-up Type' },
//       { key: 'remarks', label: 'Remarks' },
//     ],
//     []
//   )

//   /* ----------------------------- */
//   /* UI                            */
//   /* ----------------------------- */
//   return (
//     <MainWrapper>
//       <motion.div
//         initial={{ opacity: 0, y: 24 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4, ease: 'easeOut' }}
//         className='space-y-10'
//       >
//         {/* ---------- Hero ---------- */}
//         <header className='text-center'>
//           <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
//             Account Summary
//           </h1>
//           <p className='text-muted-foreground mx-auto mt-1 max-w-xl'>
//             A 360-degree view of the borrower’s profile, obligations and next
//             steps — all in one place.
//           </p>
//         </header>

//         {/* ------ Stats Overview ----- */}
//         <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
//           {acctLoading ? (
//             [...Array(4)].map((_, i) => <Skeleton key={i} className='h-24' />)
//           ) : (
//             <>
//               <StatsCard
//                 label='Outstanding'
//                 value={formatCurrency(account?.outstand)}
//               />
//               <StatsCard
//                 label='Arrears (₹)'
//                 value={formatCurrency(account?.arrearRs)}
//               />
//               <StatsCard label='EMIs Due' value={account?.emisDue ?? '—'} />
//               <StatsCard label='Segment' value={account?.segement ?? '—'} />
//             </>
//           )}
//         </section>

//         {/* ------ General Details ----- */}
//         <Card className='mx-auto w-full max-w-5xl'>
//           <CardHeader>
//             <CardTitle className='text-xl'>General Details</CardTitle>
//             <CardDescription>
//               Key borrower and facility information.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {acctLoading ? (
//               <div className='grid grid-cols-2 gap-4'>
//                 {[...Array(8)].map((_, i) => (
//                   <Skeleton key={i} className='h-6' />
//                 ))}
//               </div>
//             ) : acctError ? (
//               <p className='text-destructive'>
//                 Something went wrong. Please try again.
//               </p>
//             ) : (
//               <DetailGrid account={account} />
//             )}
//           </CardContent>
//         </Card>

//         {/* ------------ Actions ------------- */}
//         <section className='mx-auto max-w-5xl space-y-4'>
//           <h2 className='text-xl font-semibold'>Quick Actions</h2>
//           <ActionGrid accountId={accountId} />
//         </section>

//         <Separator />

//         {/* -------- Follow-ups Table -------- */}
//         <Card className='mx-auto w-full max-w-5xl'>
//           <CardHeader>
//             <CardTitle>Follow-ups</CardTitle>
//             <CardDescription>
//               Latest interaction history for this account.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <PaginatedTable
//               data={followUps}
//               columns={columns}
//               initialRowsPerPage={5}
//               emptyMessage='No follow-ups recorded'
//             />
//           </CardContent>
//         </Card>
//       </motion.div>
//     </MainWrapper>
//   )
// }
// /* ------------------------------------------------------------------ */
// /* Helpers                                                            */
// /* ------------------------------------------------------------------ */
// interface StatsCardProps {
//   label: string
//   value: React.ReactNode
// }
// const StatsCard = ({ label, value }: StatsCardProps) => (
//   <Card className='flex flex-col justify-center p-4'>
//     <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
//       {label}
//     </p>
//     <p className='text-lg leading-snug font-semibold'>{value}</p>
//   </Card>
// )

// const DetailGrid = ({
//   account,
// }: {
//   account: Record<string, unknown> | undefined
// }) => (
//   <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
//     <Detail label='Account No.' value={account?.acctNo} />
//     <Detail label='Customer Name' value={account?.custName} />
//     <Detail label='CIF Number' value={account?.cifNumber} />
//     <Detail label='Phone' value={account?.telNo} />
//     <Detail label='Product' value={account?.productCode} />
//     <Detail label='Sanction Date' value={account?.sanctDt} />
//   </div>
// )

// interface DetailProps {
//   label: string
//   value: React.ReactNode
// }
// const Detail = ({ label, value }: DetailProps) => (
//   <div className='bg-muted rounded-lg p-3'>
//     <p className='text-muted-foreground text-xs tracking-wide uppercase'>
//       {label}
//     </p>
//     <p className='font-medium break-all'>{value ?? '—'}</p>
//   </div>
// )

// /* ---------- Action Grid --------- */
// const actions = [
//   { icon: FileSearch, label: 'Inspection', path: 'inspection' },
//   { icon: CalendarClock, label: 'Interview', path: 'interview' },
//   { icon: FileText, label: 'Notice', path: 'notice' },
//   { icon: ClipboardCheck, label: 'Stock Audit', path: 'stock-audit' },
//   { icon: Gavel, label: 'Record Event', path: 'events' },
//   { icon: AlertTriangle, label: 'Compliances', path: 'compliance' },
// ]

// function ActionGrid({ accountId }: { accountId: string }) {
//   return (
//     <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
//       {actions.map(({ icon, label, path }) => (
//         <ActionLink
//           key={path}
//           icon={icon}
//           label={label}
//           to='/$category/summary/$path/$accountId'
//           params={{ category: 'npa', path, accountId }}
//         />
//       ))}
//       {/* Report download */}
//       <Button
//         variant='secondary'
//         size='lg'
//         asChild
//         className='col-span-full flex w-full items-center justify-center gap-2'
//       >
//         <a
//           href={`https://mscbank.ssbd.in/backend/AlertReport/generate/${accountId}`}
//           download
//         >
//           <FileBadge className='h-4 w-4' />
//           Generate Report
//         </a>
//       </Button>
//     </div>
//   )
// }

// const ActionLink = createLink(
//   React.forwardRef<
//     HTMLAnchorElement,
//     {
//       icon: React.ComponentType<{ className?: string }>
//       label: string
//       className?: string
//     }
//   >(({ icon: Icon, label, className, ...linkProps }, ref) => (
//     <Button
//       size='lg'
//       variant='outline'
//       asChild
//       className={`w-full gap-2 ${className ?? ''}`}
//     >
//       <a {...linkProps} ref={ref as any}>
//         <Icon className='h-4 w-4' />
//         {label}
//       </a>
//     </Button>
//   ))
// )

// /* ---------- Utils -------------- */
// function formatCurrency(value: number | undefined | null) {
//   if (value == null) return '—'
//   return Number(value).toLocaleString('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     minimumFractionDigits: 2,
//   })
// }

// export default AccountSummaryPage
