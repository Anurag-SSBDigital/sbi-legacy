// import { useState } from 'react'
// import { components } from '@/types/api/v1.js'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import PaginatedTable from '@/components/paginated-table.tsx'
// import AccountNoCell from '@/components/table/cells/account-no-cell.tsx'
// import { DateTimeCell } from '@/components/table/cells/date-time-cell.tsx'
// import EllipsedText from '@/components/table/cells/ellipsed-text.tsx'
// import {
//   StatusPillCell,
//   StatusPillProps,
// } from '@/components/table/cells/status-pill-cell.tsx'
// import { AlertRowActionsMenu } from '@/features/alerts/table/actions.tsx'
// import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'
// import ViewButton from '../../../components/ui/view-button.js'
// import { AcceptDialog } from '../components/accept-dialog.tsx'
// import { RejectDialog } from '../components/reject-dialog.tsx'
// import { HistoryDialog } from '../components/reject-history-dialog.tsx'
// import EWSAlertDetailDialog from './detail-dialog.tsx'

// // ─────────────────────────────────────────────────────────────────────────

// type Row = components['schemas']['AlertResolution']

// export default function EWSAdminView() {
//   const [branch, setBranch] = useState<string | undefined>(undefined)

//   // ─── New state for “viewing” a row ────────────────────────────────────
//   const [viewingRow, setViewingRow] = useState<Row | null>(null)
//   // ─────────────────────────────────────────────────────────────────────

//   const [rejectingRow, setRejectingRow] = useState<Row | null>(null)
//   const [rejectComment, setRejectComment] = useState('')
//   const [acceptingRow, setAcceptingRow] = useState<Row | null>(null)

//   const { data, isLoading, refetch } = $api.useQuery(
//     'get',
//     '/AlertResolution/all',
//     {
//       params: { query: { id: branch }, header: { Authorization: '' } },
//     }
//   )

//   const acceptMutation = $api.useMutation('post', '/AlertResolution/accept', {
//     onSuccess: (res) => {
//       toast.success(res.message)
//       refetch()
//       setAcceptingRow(null)
//     },
//     onError: (err) => {
//       toast.error(
//         (err as unknown) instanceof Error
//           ? (err as Error)?.message
//           : 'Something went wrong'
//       )
//     },
//   })

//   const rejectMutation = $api.useMutation('post', '/AlertResolution/reject', {
//     onSuccess: (res) => {
//       toast.success(res.message)
//       refetch()
//       setRejectingRow(null)
//       setRejectComment('')
//     },
//     onError: (err) => {
//       toast.error(
//         (err as unknown) instanceof Error
//           ? (err as Error)?.message
//           : 'Something went wrong'
//       )
//     },
//   })

//   const [historyRow, setHistoryRow] = useState<Row | null>(null)

//   const {
//     data: historyResponse,
//     isLoading: historyLoading,
//     error: historyError,
//   } = $api.useQuery(
//     'get',
//     '/onlineAlert/getResolutionHistory',
//     {
//       params: {
//         query: {
//           acctNo: historyRow?.acctNumber ?? '',
//           description: historyRow?.description ?? '',
//         },
//       },
//     },
//     {
//       enabled: !!historyRow, // fetch only when historyRow is set
//       retry: false,
//     }
//   )

//   const handleConfirmAccept = () => {
//     if (acceptingRow && acceptingRow.resoluationId) {
//       acceptMutation.mutate({
//         params: { query: { resolutionId: acceptingRow.resoluationId } },
//       })
//     }
//   }

//   const handleSubmitReject = () => {
//     if (rejectingRow && rejectingRow.resoluationId && rejectComment) {
//       rejectMutation.mutate({
//         params: {
//           query: {
//             resolutionId: rejectingRow.resoluationId,
//             rejectComments: rejectComment.trim(),
//           },
//         },
//       })
//     }
//   }

//   return (
//     <MainWrapper extra={<BranchSelector value={branch} setValue={setBranch} />}>
//       {isLoading ? (
//         <LoadingBar />
//       ) : (
//         <>
//           <PaginatedTable
//             tableTitle='EWS Alerts'
//             data={data?.data ?? []}
//             columns={[
//               {
//                 key: 'acctNumber',
//                 label: 'Account Number',
//                 render: (value) => (
//                   <AccountNoCell value={(value ?? '') as string} />
//                 ),
//               },
//               {
//                 key: 'createdAt',
//                 label: 'Date',
//                 render: (row) => <DateTimeCell value={row as string} />,
//               },
//               {
//                 key: 'description',
//                 label: 'Description',
//                 render: (value) => (
//                   <EllipsedText text={value as string} maxWidth={150} />
//                 ),
//               },
//               { key: 'segement', label: 'Segment' },
//               {
//                 key: 'status',
//                 label: 'Status',
//                 render: (value) => (
//                   <StatusPillCell
//                     status={`${value}` as unknown as StatusPillProps['status']}
//                   />
//                 ),
//               },
//             ]}
//             renderActions={(row) => {
//               return (
//                 <div className='flex items-center space-x-2'>
//                   {/* ─── New “View” Button ──────────────────────────────── */}
//                   <ViewButton onClick={() => setViewingRow(row)} />
//                   {/* ────────────────────────────────────────────────────── */}

//                   <AlertRowActionsMenu
//                     row={row}
//                     onAccept={() => setAcceptingRow(row)}
//                     onReject={() => setRejectingRow(row)}
//                     onDocumentView={() => {}}
//                     onHistoryView={() => {
//                       setHistoryRow(row)
//                     }}
//                   />
//                 </div>
//               )
//             }}
//           />

//           {/* ─── Accept Confirmation Dialog ──────────────────────────────── */}
//           <AcceptDialog
//             open={!!acceptingRow}
//             onOpenChange={(open) => !open && setAcceptingRow(null)}
//             row={acceptingRow}
//             onConfirm={handleConfirmAccept}
//             isLoading={acceptMutation.isPending}
//           />

//           {/* ─── Reject Confirmation Dialog ──────────────────────────────── */}
//           <RejectDialog
//             open={!!rejectingRow}
//             onOpenChange={(open) => {
//               if (!open) {
//                 setRejectingRow(null)
//                 setRejectComment('')
//               }
//             }}
//             row={rejectingRow}
//             comment={rejectComment}
//             onCommentChange={setRejectComment}
//             onSubmit={handleSubmitReject}
//             isLoading={rejectMutation.isPending}
//           />

//           {/* ─── History Dialog ─────────────────────────────────────────── */}
//           <HistoryDialog
//             open={!!historyRow}
//             onOpenChange={(open) => !open && setHistoryRow(null)}
//             row={historyRow}
//             loading={historyLoading}
//             error={historyError}
//             data={historyResponse?.data}
//           />

//           {/* ─── New “View Details” Dialog ───────────────────────────────── */}
//           <EWSAlertDetailDialog
//             viewingRow={viewingRow}
//             onClose={() => setViewingRow(null)}
//           />

//           {/* ───────────────────────────────────────────────────────────────── */}
//         </>
//       )}
//     </MainWrapper>
//   )
// }
