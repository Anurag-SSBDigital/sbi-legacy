// import { components } from '@/types/api/v1.js'
// import { Badge } from '@/components/ui/badge.tsx'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from '@/components/ui/dialog.tsx'

// // Import Badge for status indicators

// type Row = components['schemas']['AlertSummaryDTO']

// interface EWSAlertDetailDialogProps {
//   viewingRow?: Row | null
//   onClose: () => void
// }

// // Reusable component for each detail item
// interface DetailItemProps {
//   label: string
//   children?: React.ReactNode
// }

// const DetailItem: React.FC<DetailItemProps> = ({ label, children }) => {
//   const hasContent =
//     children !== null &&
//     typeof children !== 'undefined' &&
//     (typeof children !== 'string' || children.trim() !== '')
//   const isBooleanFalse = children === false // Specifically handle 'false' boolean

//   return (
//     <div className='py-3 sm:grid sm:grid-cols-3 sm:gap-4'>
//       <dt className='text-muted-foreground text-sm leading-6 font-medium'>
//         {label}
//       </dt>
//       <dd className='text-foreground mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0'>
//         {hasContent || isBooleanFalse ? (
//           children
//         ) : (
//           <span className='text-slate-500 italic dark:text-slate-400'>
//             Not Provided
//           </span>
//         )}
//       </dd>
//     </div>
//   )
// }

// // Helper to format date strings
// const formatDate = (dateString?: string | null) => {
//   if (!dateString) return null // Let DetailItem handle null/undefined
//   try {
//     return new Date(dateString).toLocaleString(undefined, {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     })
//   } catch {
//     return dateString // Fallback to original string if date is invalid
//   }
// }

// export default function EWSAlertDetailDialog({
//   viewingRow,
//   onClose,
// }: EWSAlertDetailDialogProps) {
//   if (!viewingRow) {
//     return null // If no row is provided, we don't render the dialog
//   }

//   return (
//     <Dialog
//       open={!!viewingRow}
//       onOpenChange={(open) => {
//         if (!open) {
//           onClose()
//         }
//       }}
//     >
//       <DialogContent className='dark:bg-background max-h-[85vh] overflow-y-auto rounded-lg bg-white shadow-xl sm:max-w-3xl'>
//         <DialogHeader className='px-6 pt-6'>
//           <DialogTitle className='text-foreground text-2xl font-semibold'>
//             Alert Resolution Details
//           </DialogTitle>
//           <DialogDescription className='text-muted-foreground mt-1 text-sm'>
//             Detailed information for the selected alert resolution.
//           </DialogDescription>
//         </DialogHeader>

//         <div className='border-border border-t border-b px-6 py-4'>
//           <dl className='divide-border text-foreground divide-y text-sm'>
//             {viewingRow.id && (
//               <DetailItem label='Resolution ID'>{viewingRow.id}</DetailItem>
//             )}
//             {viewingRow.alertType && (
//               <DetailItem label='Alert Type'>{viewingRow.alertType}</DetailItem>
//             )}
//             {viewingRow.resolutionText && (
//               <DetailItem label='Resolution Text'>
//                 <span className='break-words whitespace-pre-line'>
//                   {viewingRow.resolutionText}
//                 </span>
//               </DetailItem>
//             )}
//             {viewingRow.status && (
//               <DetailItem label='Status'>
//                 <Badge
//                   variant={
//                     viewingRow.status.toLowerCase().includes('resolve')
//                       ? 'default'
//                       : viewingRow.status.toLowerCase().includes('pend')
//                         ? 'secondary'
//                         : 'outline'
//                   }
//                   className='capitalize'
//                 >
//                   {viewingRow.status}
//                 </Badge>
//               </DetailItem>
//             )}
//             {viewingRow.createdAt && (
//               <DetailItem label='Created At'>
//                 {formatDate(viewingRow.createdAt)}
//               </DetailItem>
//             )}
//             {viewingRow.createdBy && (
//               <DetailItem label='Created By'>{viewingRow.createdBy}</DetailItem>
//             )}
//             {viewingRow.updatedAt && (
//               <DetailItem label='Updated At'>
//                 {formatDate(viewingRow.updatedAt)}
//               </DetailItem>
//             )}
//             {viewingRow.branchCode && (
//               <DetailItem label='Branch Code'>
//                 {viewingRow.branchCode}
//               </DetailItem>
//             )}
//             {viewingRow.resolutionText && (
//               <DetailItem label='Resolution Description'>
//                 <span className='break-words whitespace-pre-line'>
//                   {viewingRow.resolutionText}
//                 </span>
//               </DetailItem>
//             )}

//             {Array.isArray(viewingRow.documents) &&
//               viewingRow.documents.length > 0 && (
//                 <DetailItem label='Documents'>
//                   <ul className='list-inside list-disc space-y-1 pl-1'>
//                     {viewingRow.documents.map((doc, index) => (
//                       <li key={index}>
//                         <a
//                           href={doc.documentPath}
//                           target='_blank'
//                           className='text-blue-500 hover:underline'
//                         >
//                           {doc.documentName}
//                         </a>
//                       </li>
//                     ))}
//                   </ul>
//                 </DetailItem>
//               )}
//             {typeof viewingRow.isActive === 'boolean' && (
//               <DetailItem label='Is Active'>
//                 <Badge variant={viewingRow.isActive ? 'default' : 'outline'}>
//                   {viewingRow.isActive ? 'Active' : 'Inactive'}
//                 </Badge>
//               </DetailItem>
//             )}
//             {viewingRow.updatedBy && (
//               <DetailItem label='Updated By'>{viewingRow.updatedBy}</DetailItem>
//             )}
//           </dl>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
