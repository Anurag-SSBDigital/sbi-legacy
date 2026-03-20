// /* ------------------------------------------------------------------ */
// /* components/inspection/new-psegment-dialog.tsx                      */
// /* ------------------------------------------------------------------ */
// import React, { useEffect, useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import useAccountDetails from '@/hooks/use-account-details.ts'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// type YesNo = 'yes' | 'no'
// const ynToBool = (v?: YesNo) => v === 'yes'
// const nowLocal = () => {
//   // datetime-local -> YYYY-MM-DDTHH:mm
//   const d = new Date()
//   const pad = (n: number) => String(n).padStart(2, '0')
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
//     d.getHours()
//   )}:${pad(d.getMinutes())}`
// }
// const toISO = (dtLocal?: string) =>
//   dtLocal ? new Date(dtLocal).toISOString() : undefined
// const asNumber = (v?: string) => {
//   if (!v || !String(v).trim()) return undefined
//   const n = Number(v)
//   return Number.isFinite(n) ? n : undefined
// }
// const asStringOrUndef = (v?: string) => {
//   const s = (v ?? '').trim()
//   return s ? s : undefined
// }
// interface Props {
//   open: boolean
//   setOpen: (open: boolean) => void
//   accountId: string
//   onSuccess: () => void
// }
// interface FormValues {
//   /* Base */
//   name: string
//   createDateTime: string // datetime-local
//   followUpType: string
//   /* Borrower / Loan */
//   borrowerAddress: string
//   mobileNumber: string
//   loanAmount: string
//   dateOfSanction: string
//   loanPurpose: string
//   loanTenure: string
//   emiAmount: string
//   /* Residence */
//   residenceVisited: YesNo
//   residenceAddress: string
//   residenceObservations: string
//   residenceGeoLocation: string
//   /* Inspection observations */
//   borrowerLocatedAtResidence: YesNo
//   neighbourFeedback: string
//   newResidenceAddress: string
//   borrowerAttendedCall: YesNo
//   borrowerWhereaboutsFeedback: string
//   /* Employment */
//   workingInSameOrganization: YesNo
//   employerAddressChanged: YesNo
//   newEmployerAddress: string
//   newEmployerContactNumber: string
//   employmentStatus: string
//   employmentStatusDate: string
//   transferredOfficeAddress: string
//   transferredOfficeContact: string
//   /* Salary */
//   salaryApplicable: YesNo
//   salaryCreditedRegularly: YesNo
//   salaryNotPaidReason: string
//   expectedSalaryPaymentDate: string
//   /* Business */
//   businessApplicable: YesNo
//   businessClosedOrShiftedDate: string
//   newBusinessAddress: string
//   newBusinessContactNumber: string
//   tenantStillOccupying: YesNo
//   tenantVacatedDate: string
//   tenantVacationReason: string
//   pensionReceivedBySpouse: YesNo
//   loanRepaidFromPension: YesNo
//   /* Account position */
//   outstandingAmount: string
//   irregularAmount: string
//   dateOfIrregularity: string
//   iracStatus: string
//   /* Security / Vehicle */
//   securityDetails: YesNo
//   vehicleMake: string
//   vehicleModel: string
//   engineNumber: string
//   chassisNumber: string
//   vehicleDescriptionMatches: YesNo
//   engineChassisVerified: YesNo
//   vehiclePhotographTaken: YesNo
//   vehicleConditionGood: YesNo
//   deliveryNoteReceived: YesNo
//   taxInvoiceReceived: YesNo
//   insurancePolicyReceived: YesNo
//   roadTaxReceiptReceived: YesNo
//   registrationChargesReceived: YesNo
//   vehicleRegistered: YesNo
//   rcReceived: YesNo
//   vahanVerified: YesNo
//   /* Other */
//   inspectionDate: string
//   inspectionPlace: string
//   inspectionPlaceName: string
//   inspectorName: string
//   inspectorDesignation: string
//   inspectorBranch: string
//   emiMandateDate: string
//   repaymentRegular: YesNo
//   irregularityReason: string
//   recoverySteps: string
//   seizureInitiated: YesNo
//   seizureStatus: string
//   otherDeficiencies: string
//   briefRemarks: string
// }
// const joinAddress = (...parts: Array<string | null | undefined>) =>
//   parts
//     .map((p) => (p ?? '').trim())
//     .filter(Boolean)
//     .join(', ')
// const toLocalDT = (isoOrDate?: string | null) => {
//   // convert "2026-01-01..." to datetime-local format
//   if (!isoOrDate) return ''
//   const d = new Date(isoOrDate)
//   if (Number.isNaN(d.getTime())) return ''
//   const pad = (n: number) => String(n).padStart(2, '0')
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
//     d.getHours()
//   )}:${pad(d.getMinutes())}`
// }
// const NewPSegmentDialog: React.FC<Props> = ({
//   open,
//   setOpen,
//   accountId,
//   onSuccess,
// }) => {
//   /* Borrower name */
//   const { data: customerDetail } = useAccountDetails(accountId)
//   const form = useForm<FormValues>({
//     defaultValues: {
//       name: '',
//       createDateTime: nowLocal(),
//       followUpType: '',
//       borrowerAddress: '',
//       mobileNumber: '',
//       loanAmount: '',
//       dateOfSanction: '',
//       loanPurpose: '',
//       loanTenure: '',
//       emiAmount: '',
//       residenceVisited: 'no',
//       residenceAddress: '',
//       residenceObservations: '',
//       residenceGeoLocation: '',
//       borrowerLocatedAtResidence: 'no',
//       neighbourFeedback: '',
//       newResidenceAddress: '',
//       borrowerAttendedCall: 'no',
//       borrowerWhereaboutsFeedback: '',
//       workingInSameOrganization: 'yes',
//       employerAddressChanged: 'no',
//       newEmployerAddress: '',
//       newEmployerContactNumber: '',
//       employmentStatus: '',
//       employmentStatusDate: '',
//       transferredOfficeAddress: '',
//       transferredOfficeContact: '',
//       salaryApplicable: 'no',
//       salaryCreditedRegularly: 'no',
//       salaryNotPaidReason: '',
//       expectedSalaryPaymentDate: '',
//       businessApplicable: 'no',
//       businessClosedOrShiftedDate: '',
//       newBusinessAddress: '',
//       newBusinessContactNumber: '',
//       tenantStillOccupying: 'no',
//       tenantVacatedDate: '',
//       tenantVacationReason: '',
//       pensionReceivedBySpouse: 'no',
//       loanRepaidFromPension: 'no',
//       outstandingAmount: '',
//       irregularAmount: '',
//       dateOfIrregularity: '',
//       iracStatus: '',
//       securityDetails: 'no',
//       vehicleMake: '',
//       vehicleModel: '',
//       engineNumber: '',
//       chassisNumber: '',
//       vehicleDescriptionMatches: 'no',
//       engineChassisVerified: 'no',
//       vehiclePhotographTaken: 'no',
//       vehicleConditionGood: 'no',
//       deliveryNoteReceived: 'no',
//       taxInvoiceReceived: 'no',
//       insurancePolicyReceived: 'no',
//       roadTaxReceiptReceived: 'no',
//       registrationChargesReceived: 'no',
//       vehicleRegistered: 'no',
//       rcReceived: 'no',
//       vahanVerified: 'no',
//       inspectionDate: nowLocal(),
//       inspectionPlace: '',
//       inspectionPlaceName: '',
//       inspectorName: '',
//       inspectorDesignation: '',
//       inspectorBranch: '',
//       emiMandateDate: '',
//       repaymentRegular: 'yes',
//       irregularityReason: '',
//       recoverySteps: '',
//       seizureInitiated: 'no',
//       seizureStatus: '',
//       otherDeficiencies: '',
//       briefRemarks: '',
//     },
//     mode: 'onSubmit',
//   })
//   const { watch, reset } = form
//   const {
//     formState: { errors, isSubmitting },
//   } = form
//   useEffect(() => {
//     if (!open) return
//     if (!customerDetail) return
//     reset((prev) => ({
//       ...prev,
//       // ---- from customerDetail ----
//       name: customerDetail.custName ?? prev.name,
//       mobileNumber: customerDetail.telNo ?? prev.mobileNumber,
//       borrowerAddress:
//         joinAddress(
//           customerDetail.add1,
//           customerDetail.add2,
//           customerDetail.add3,
//           customerDetail.add4
//         ) || prev.borrowerAddress,
//       loanAmount:
//         customerDetail.loanLimit !== undefined &&
//         customerDetail.loanLimit !== null
//           ? String(customerDetail.loanLimit)
//           : prev.loanAmount,
//       loanPurpose:
//         customerDetail.acctDesc !== undefined &&
//         customerDetail.acctDesc !== null
//           ? String(customerDetail.acctDesc)
//           : prev.loanPurpose,
//       emiAmount:
//         customerDetail.instalAmt !== undefined &&
//         customerDetail.instalAmt !== null
//           ? String(customerDetail.instalAmt)
//           : prev.emiAmount,
//       outstandingAmount:
//         customerDetail.outstand !== undefined &&
//         customerDetail.outstand !== null
//           ? String(customerDetail.outstand)
//           : prev.outstandingAmount,
//       irregularAmount:
//         customerDetail.irregAmt !== undefined &&
//         customerDetail.irregAmt !== null
//           ? String(customerDetail.irregAmt)
//           : prev.irregularAmount,
//       dateOfSanction: customerDetail.sanctDt
//         ? toLocalDT(customerDetail.sanctDt)
//         : prev.dateOfSanction,
//       dateOfIrregularity: customerDetail.irrgDt
//         ? toLocalDT(customerDetail.irrgDt)
//         : prev.dateOfIrregularity,
//       // optional: you can prefill IRAC/SMA related labels if you want
//       // iracStatus: customerDetail.smaCodeIncipientStress ?? prev.iracStatus,
//       // keep defaults for toggles/sections you want user to explicitly set
//     }))
//   }, [open, customerDetail, reset])
//   /* toggles */
//   const residenceVisited = watch('residenceVisited')
//   const salaryApplicable = watch('salaryApplicable')
//   const salaryCreditedRegularly = watch('salaryCreditedRegularly')
//   const businessApplicable = watch('businessApplicable')
//   const tenantStillOccupying = watch('tenantStillOccupying')
//   const employerAddressChanged = watch('employerAddressChanged')
//   const repaymentRegular = watch('repaymentRegular')
//   const seizureInitiated = watch('seizureInitiated')
//   const securityDetails = watch('securityDetails')
//   /* images (residence only) */
//   const [resImages, setResImages] = useState<string[]>([])
//   const uploadResidenceMutation = $api.useMutation(
//     'post',
//     '/Psegement_inspections/uploadResidenceImages'
//   )
//   const uploadImages = async (files: FileList | null) => {
//     if (!files?.length) return
//     const fd = new FormData()
//     Array.from(files).forEach((f) => fd.append('files', f))
//     try {
//       await uploadResidenceMutation.mutateAsync({
//         body: fd as unknown as undefined,
//         params: { query: undefined as unknown as { files: string[] } },
//       })
//       setResImages((prev) => [...prev, ...Array.from(files).map((f) => f.name)])
//       toast.success(`${files.length} image(s) uploaded`)
//     } catch {
//       toast.error('Could not upload images')
//     }
//   }
//   /* create */
//   const createMutation = $api.useMutation(
//     'post',
//     '/Psegement_inspections/create',
//     {
//       onSuccess: () => {
//         onSuccess()
//         toast.success('P-Segment inspection created')
//         setOpen(false)
//       },
//       onError: () => toast.error('Could not create inspection'),
//     }
//   )
//   const onSubmit = async (v: FormValues) => {
//     await createMutation.mutateAsync({
//       params: { header: { Authorization: '' } },
//       body: {
//         accountNumber: accountId,
//         name: asStringOrUndef(v.name),
//         followUpType: asStringOrUndef(v.followUpType),
//         createDateTime: toISO(v.createDateTime),
//         /* borrower / loan */
//         borrowerAddress: asStringOrUndef(v.borrowerAddress),
//         mobileNumber: asStringOrUndef(v.mobileNumber),
//         loanAmount: asNumber(v.loanAmount),
//         dateOfSanction: toISO(v.dateOfSanction),
//         loanPurpose: asStringOrUndef(v.loanPurpose),
//         loanTenure: asNumber(v.loanTenure),
//         emiAmount: asNumber(v.emiAmount),
//         /* residence */
//         residenceVisited: v.residenceVisited, // API expects string
//         residenceAddress:
//           residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceAddress)
//             : undefined,
//         residenceObservations:
//           residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceObservations)
//             : undefined,
//         residenceGeoLocation:
//           residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceGeoLocation)
//             : undefined,
//         residenceImages: residenceVisited === 'yes' ? resImages : [],
//         /* inspection observations */
//         borrowerLocatedAtResidence: ynToBool(v.borrowerLocatedAtResidence),
//         neighbourFeedback: asStringOrUndef(v.neighbourFeedback),
//         newResidenceAddress: asStringOrUndef(v.newResidenceAddress),
//         borrowerAttendedCall: ynToBool(v.borrowerAttendedCall),
//         borrowerWhereaboutsFeedback: asStringOrUndef(
//           v.borrowerWhereaboutsFeedback
//         ),
//         /* employment */
//         workingInSameOrganization: ynToBool(v.workingInSameOrganization),
//         employerAddressChanged: ynToBool(v.employerAddressChanged),
//         newEmployerAddress:
//           employerAddressChanged === 'yes'
//             ? asStringOrUndef(v.newEmployerAddress)
//             : undefined,
//         newEmployerContactNumber:
//           employerAddressChanged === 'yes'
//             ? asStringOrUndef(v.newEmployerContactNumber)
//             : undefined,
//         employmentStatus: asStringOrUndef(v.employmentStatus),
//         employmentStatusDate: toISO(v.employmentStatusDate),
//         transferredOfficeAddress: asStringOrUndef(v.transferredOfficeAddress),
//         transferredOfficeContact: asStringOrUndef(v.transferredOfficeContact),
//         /* salary */
//         salaryApplicable: ynToBool(v.salaryApplicable),
//         salaryCreditedRegularly:
//           salaryApplicable === 'yes'
//             ? ynToBool(v.salaryCreditedRegularly)
//             : undefined,
//         salaryNotPaidReason:
//           salaryApplicable === 'yes' && salaryCreditedRegularly === 'no'
//             ? asStringOrUndef(v.salaryNotPaidReason)
//             : undefined,
//         expectedSalaryPaymentDate:
//           salaryApplicable === 'yes' && salaryCreditedRegularly === 'no'
//             ? toISO(v.expectedSalaryPaymentDate)
//             : undefined,
//         /* business */
//         businessApplicable: ynToBool(v.businessApplicable),
//         businessClosedOrShiftedDate:
//           businessApplicable === 'yes'
//             ? toISO(v.businessClosedOrShiftedDate)
//             : undefined,
//         newBusinessAddress:
//           businessApplicable === 'yes'
//             ? asStringOrUndef(v.newBusinessAddress)
//             : undefined,
//         newBusinessContactNumber:
//           businessApplicable === 'yes'
//             ? asStringOrUndef(v.newBusinessContactNumber)
//             : undefined,
//         tenantStillOccupying: ynToBool(v.tenantStillOccupying),
//         tenantVacatedDate:
//           businessApplicable === 'yes' && tenantStillOccupying === 'no'
//             ? toISO(v.tenantVacatedDate)
//             : undefined,
//         tenantVacationReason:
//           businessApplicable === 'yes' && tenantStillOccupying === 'no'
//             ? asStringOrUndef(v.tenantVacationReason)
//             : undefined,
//         pensionReceivedBySpouse: ynToBool(v.pensionReceivedBySpouse),
//         loanRepaidFromPension: ynToBool(v.loanRepaidFromPension),
//         /* account position */
//         outstandingAmount: asNumber(v.outstandingAmount),
//         irregularAmount: asNumber(v.irregularAmount),
//         dateOfIrregularity: toISO(v.dateOfIrregularity),
//         iracStatus: asStringOrUndef(v.iracStatus),
//         /* security */
//         securityDetails: ynToBool(v.securityDetails),
//         vehicleMake:
//           securityDetails === 'yes'
//             ? asStringOrUndef(v.vehicleMake)
//             : undefined,
//         vehicleModel:
//           securityDetails === 'yes'
//             ? asStringOrUndef(v.vehicleModel)
//             : undefined,
//         engineNumber:
//           securityDetails === 'yes'
//             ? asStringOrUndef(v.engineNumber)
//             : undefined,
//         chassisNumber:
//           securityDetails === 'yes'
//             ? asStringOrUndef(v.chassisNumber)
//             : undefined,
//         vehicleDescriptionMatches:
//           securityDetails === 'yes'
//             ? ynToBool(v.vehicleDescriptionMatches)
//             : undefined,
//         engineChassisVerified:
//           securityDetails === 'yes'
//             ? ynToBool(v.engineChassisVerified)
//             : undefined,
//         vehiclePhotographTaken:
//           securityDetails === 'yes'
//             ? ynToBool(v.vehiclePhotographTaken)
//             : undefined,
//         vehicleConditionGood:
//           securityDetails === 'yes'
//             ? ynToBool(v.vehicleConditionGood)
//             : undefined,
//         deliveryNoteReceived:
//           securityDetails === 'yes'
//             ? ynToBool(v.deliveryNoteReceived)
//             : undefined,
//         taxInvoiceReceived:
//           securityDetails === 'yes'
//             ? ynToBool(v.taxInvoiceReceived)
//             : undefined,
//         insurancePolicyReceived:
//           securityDetails === 'yes'
//             ? ynToBool(v.insurancePolicyReceived)
//             : undefined,
//         roadTaxReceiptReceived:
//           securityDetails === 'yes'
//             ? ynToBool(v.roadTaxReceiptReceived)
//             : undefined,
//         registrationChargesReceived:
//           securityDetails === 'yes'
//             ? ynToBool(v.registrationChargesReceived)
//             : undefined,
//         vehicleRegistered:
//           securityDetails === 'yes' ? ynToBool(v.vehicleRegistered) : undefined,
//         rcReceived:
//           securityDetails === 'yes' ? ynToBool(v.rcReceived) : undefined,
//         vahanVerified:
//           securityDetails === 'yes' ? ynToBool(v.vahanVerified) : undefined,
//         /* other */
//         inspectionDate: toISO(v.inspectionDate),
//         inspectionPlace: asStringOrUndef(v.inspectionPlace),
//         inspectionPlaceName: asStringOrUndef(v.inspectionPlaceName),
//         inspectorName: asStringOrUndef(v.inspectorName),
//         inspectorDesignation: asStringOrUndef(v.inspectorDesignation),
//         inspectorBranch: asStringOrUndef(v.inspectorBranch),
//         emiMandateDate: toISO(v.emiMandateDate),
//         repaymentRegular: ynToBool(v.repaymentRegular),
//         irregularityReason:
//           repaymentRegular === 'no'
//             ? asStringOrUndef(v.irregularityReason)
//             : undefined,
//         recoverySteps:
//           repaymentRegular === 'no'
//             ? asStringOrUndef(v.recoverySteps)
//             : undefined,
//         seizureInitiated: ynToBool(v.seizureInitiated),
//         seizureStatus:
//           seizureInitiated === 'yes'
//             ? asStringOrUndef(v.seizureStatus)
//             : undefined,
//         otherDeficiencies: asStringOrUndef(v.otherDeficiencies),
//         briefRemarks: asStringOrUndef(v.briefRemarks),
//         /* fields you’re not setting explicitly but exist in API */
//         isActive: true,
//         workPlaceImages: [], // keep empty since you don't use workplace
//       },
//     })
//   }
//   const YesNoRadio = ({
//     value,
//     onChange,
//   }: {
//     value: YesNo
//     onChange: (v: YesNo) => void
//   }) => (
//     <div className='flex items-center gap-6'>
//       <label className='flex items-center gap-2'>
//         <input
//           type='radio'
//           value='yes'
//           checked={value === 'yes'}
//           onChange={() => onChange('yes')}
//         />
//         Yes
//       </label>
//       <label className='flex items-center gap-2'>
//         <input
//           type='radio'
//           value='no'
//           checked={value === 'no'}
//           onChange={() => onChange('no')}
//         />
//         No
//       </label>
//     </div>
//   )
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className='max-h-[90vh] min-w-5xl overflow-y-auto'>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
//             <DialogHeader>
//               <DialogTitle>New Retail Inspection</DialogTitle>
//               <DialogDescription>
//                 Workplace removed. Fields show/hide and become required based on
//                 toggles.
//               </DialogDescription>
//             </DialogHeader>
//             {/* Borrower Name */}
//             <FormField
//               control={form.control}
//               name='name'
//               rules={{ required: 'Borrower name is required' }}
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Borrower Name</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder='Name of borrower'
//                       {...field}
//                       readOnly={Boolean(field.value?.trim())}
//                     />
//                   </FormControl>
//                   <FormMessage>{errors.name?.message}</FormMessage>
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='createDateTime'
//               rules={{ required: 'Date of visit is required' }}
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Date & Time of Visit</FormLabel>
//                   <FormControl>
//                     <Input type='datetime-local' {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             {/* Borrower / Loan */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Borrower / Loan
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='borrowerAddress'
//                 rules={{ required: 'Borrower address is required' }}
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Borrower Address</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Borrower address' {...field} />
//                     </FormControl>
//                     <FormMessage>{errors.borrowerAddress?.message}</FormMessage>
//                   </FormItem>
//                 )}
//               />
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='mobileNumber'
//                   rules={{ required: 'Mobile number is required' }}
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Mobile Number</FormLabel>
//                       <FormControl>
//                         <Input placeholder='Mobile no' {...field} />
//                       </FormControl>
//                       <FormMessage>{errors.mobileNumber?.message}</FormMessage>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='dateOfSanction'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of Sanction</FormLabel>
//                       <FormControl>
//                         <Input type='datetime-local' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='loanAmount'
//                   rules={{ required: 'Loan amount is required' }}
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                       <FormMessage>{errors.loanAmount?.message}</FormMessage>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='emiAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>EMI Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='loanTenure'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Tenure (Months)</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='loanPurpose'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Purpose</FormLabel>
//                       <FormControl>
//                         <Input placeholder='Purpose' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <FormField
//                 control={form.control}
//                 name='followUpType'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Follow-up Type</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder='FOLLOWUP / VISIT / CALL…'
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Residence */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>Residence</legend>
//               <FormField
//                 control={form.control}
//                 name='residenceVisited'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Residence Visited?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {residenceVisited === 'yes' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='residenceAddress'
//                     rules={{
//                       required:
//                         residenceVisited === 'yes'
//                           ? 'Residence address is required'
//                           : false,
//                     }}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Address</FormLabel>
//                         <FormControl>
//                           <Input placeholder='Residence address' {...field} />
//                         </FormControl>
//                         <FormMessage>
//                           {errors.residenceAddress?.message}
//                         </FormMessage>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='residenceObservations'
//                     rules={{
//                       required:
//                         residenceVisited === 'yes'
//                           ? 'Residence observations are required'
//                           : false,
//                     }}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Observations</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Observations…' {...field} />
//                         </FormControl>
//                         <FormMessage>
//                           {errors.residenceObservations?.message}
//                         </FormMessage>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='residenceGeoLocation'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Geo Location</FormLabel>
//                         <FormControl>
//                           <Input placeholder='Latitude, Longitude' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <div className='space-y-2'>
//                     <Label className='text-sm font-medium'>
//                       Residence Images
//                     </Label>
//                     <Input
//                       type='file'
//                       multiple
//                       accept='image/*'
//                       onChange={(e) => uploadImages(e.target.files)}
//                     />
//                     {resImages.length > 0 && (
//                       <ul className='space-y-1'>
//                         {resImages.map((name, i) => (
//                           <li
//                             key={i}
//                             className='bg-muted flex items-center justify-between rounded px-3 py-1 text-sm'
//                           >
//                             <span className='max-w-50 truncate'>{name}</span>
//                             <Button
//                               type='button'
//                               size='icon'
//                               variant='ghost'
//                               onClick={() =>
//                                 setResImages((prev) =>
//                                   prev.filter((_, idx) => idx !== i)
//                                 )
//                               }
//                             >
//                               ✕
//                             </Button>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </>
//               )}
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='borrowerLocatedAtResidence'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Borrower located at residence?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='borrowerAttendedCall'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Borrower attended call?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <FormField
//                 control={form.control}
//                 name='neighbourFeedback'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Neighbour feedback</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Neighbour feedback…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='borrowerWhereaboutsFeedback'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Borrower whereabouts feedback</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Whereabouts…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='newResidenceAddress'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>New residence address (if shifted)</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='New address…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Salary */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Salary / EMI
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='salaryApplicable'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Salary applicable?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {salaryApplicable === 'yes' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='salaryCreditedRegularly'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>
//                           Salary credited regularly & EMI recovered?
//                         </FormLabel>
//                         <FormControl>
//                           <YesNoRadio
//                             value={field.value}
//                             onChange={field.onChange}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   {salaryCreditedRegularly === 'no' && (
//                     <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                       <FormField
//                         control={form.control}
//                         name='salaryNotPaidReason'
//                         rules={{
//                           required:
//                             salaryApplicable === 'yes' &&
//                             salaryCreditedRegularly === 'no'
//                               ? 'Reason is required'
//                               : false,
//                         }}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Reason for salary not paid</FormLabel>
//                             <FormControl>
//                               <Input placeholder='Reason' {...field} />
//                             </FormControl>
//                             <FormMessage>
//                               {errors.salaryNotPaidReason?.message}
//                             </FormMessage>
//                           </FormItem>
//                         )}
//                       />
//                       <FormField
//                         control={form.control}
//                         name='expectedSalaryPaymentDate'
//                         rules={{
//                           required:
//                             salaryApplicable === 'yes' &&
//                             salaryCreditedRegularly === 'no'
//                               ? 'Expected salary date is required'
//                               : false,
//                         }}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Expected salary payment date</FormLabel>
//                             <FormControl>
//                               <Input type='datetime-local' {...field} />
//                             </FormControl>
//                             <FormMessage>
//                               {errors.expectedSalaryPaymentDate?.message}
//                             </FormMessage>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//             </fieldset>
//             {/* Business */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Business / Rent / Pension
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='businessApplicable'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Business applicable?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {businessApplicable === 'yes' && (
//                 <>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='businessClosedOrShiftedDate'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Business closed / shifted date</FormLabel>
//                           <FormControl>
//                             <Input type='datetime-local' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='newBusinessContactNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>New business contact number</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Contact number' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <FormField
//                     control={form.control}
//                     name='newBusinessAddress'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>New business address</FormLabel>
//                         <FormControl>
//                           <Textarea
//                             placeholder='New business address'
//                             {...field}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='tenantStillOccupying'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Tenant still occupying?</FormLabel>
//                         <FormControl>
//                           <YesNoRadio
//                             value={field.value}
//                             onChange={field.onChange}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   {tenantStillOccupying === 'no' && (
//                     <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                       <FormField
//                         control={form.control}
//                         name='tenantVacatedDate'
//                         rules={{
//                           required:
//                             businessApplicable === 'yes' &&
//                             tenantStillOccupying === 'no'
//                               ? 'Vacated date is required'
//                               : false,
//                         }}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Tenant vacated date</FormLabel>
//                             <FormControl>
//                               <Input type='datetime-local' {...field} />
//                             </FormControl>
//                             <FormMessage>
//                               {errors.tenantVacatedDate?.message}
//                             </FormMessage>
//                           </FormItem>
//                         )}
//                       />
//                       <FormField
//                         control={form.control}
//                         name='tenantVacationReason'
//                         rules={{
//                           required:
//                             businessApplicable === 'yes' &&
//                             tenantStillOccupying === 'no'
//                               ? 'Reason is required'
//                               : false,
//                         }}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Tenant vacation reason</FormLabel>
//                             <FormControl>
//                               <Input placeholder='Reason' {...field} />
//                             </FormControl>
//                             <FormMessage>
//                               {errors.tenantVacationReason?.message}
//                             </FormMessage>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='pensionReceivedBySpouse'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Pension received by spouse?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='loanRepaidFromPension'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan repaid from pension?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </fieldset>
//             {/* Account Position */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Account Position
//               </legend>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='outstandingAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Outstanding Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='irregularAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Irregular Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='dateOfIrregularity'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of Irregularity</FormLabel>
//                       <FormControl>
//                         <Input type='datetime-local' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='iracStatus'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>IRAC Status</FormLabel>
//                       <FormControl>
//                         <Input placeholder='Standard / SMA / NPA…' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </fieldset>
//             {/* Other Observations */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Other Observations
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='repaymentRegular'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Repayment regular?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {repaymentRegular === 'no' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='irregularityReason'
//                     rules={{
//                       required:
//                         repaymentRegular === 'no'
//                           ? 'Irregularity reason is required'
//                           : false,
//                     }}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Irregularity Reason</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Reason…' {...field} />
//                         </FormControl>
//                         <FormMessage>
//                           {errors.irregularityReason?.message}
//                         </FormMessage>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='recoverySteps'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Recovery Steps</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Steps taken…' {...field} />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </>
//               )}
//               <FormField
//                 control={form.control}
//                 name='seizureInitiated'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Seizure initiated?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {seizureInitiated === 'yes' && (
//                 <FormField
//                   control={form.control}
//                   name='seizureStatus'
//                   rules={{
//                     required:
//                       seizureInitiated === 'yes'
//                         ? 'Seizure status is required'
//                         : false,
//                   }}
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Seizure Status</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder='Initiated / Pending / Completed…'
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage>{errors.seizureStatus?.message}</FormMessage>
//                     </FormItem>
//                   )}
//                 />
//               )}
//               <FormField
//                 control={form.control}
//                 name='briefRemarks'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Brief Remarks</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Remarks…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Security */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Security / Vehicle
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='securityDetails'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Security details present?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {securityDetails === 'yes' && (
//                 <>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='vehicleMake'
//                       rules={{
//                         required:
//                           securityDetails === 'yes'
//                             ? 'Vehicle make is required'
//                             : false,
//                       }}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Vehicle Make</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Make' {...field} />
//                           </FormControl>
//                           <FormMessage>
//                             {errors.vehicleMake?.message}
//                           </FormMessage>
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='vehicleModel'
//                       rules={{
//                         required:
//                           securityDetails === 'yes'
//                             ? 'Vehicle model is required'
//                             : false,
//                       }}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Vehicle Model</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Model' {...field} />
//                           </FormControl>
//                           <FormMessage>
//                             {errors.vehicleModel?.message}
//                           </FormMessage>
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='engineNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Engine Number</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Engine no' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='chassisNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Chassis Number</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Chassis no' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <div className='space-y-2'>
//                       <Label>Vehicle description matches?</Label>
//                       <FormField
//                         control={form.control}
//                         name='vehicleDescriptionMatches'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <YesNoRadio
//                                 value={field.value}
//                                 onChange={field.onChange}
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                     <div className='space-y-2'>
//                       <Label>Engine/Chassis verified?</Label>
//                       <FormField
//                         control={form.control}
//                         name='engineChassisVerified'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <YesNoRadio
//                                 value={field.value}
//                                 onChange={field.onChange}
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   </div>
//                 </>
//               )}
//             </fieldset>
//             {/* Footer */}
//             <DialogFooter>
//               <Button
//                 type='button'
//                 variant='secondary'
//                 onClick={() => setOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button type='submit' disabled={isSubmitting}>
//                 {isSubmitting ? 'Submitting…' : 'Create Inspection'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   )
// }
// export default NewPSegmentDialog
/* ------------------------------------------------------------------ */
/* components/inspection/new-psegment-dialog.tsx                    */
/* ------------------------------------------------------------------ */
// import React, { useEffect, useState } from 'react'
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import useAccountDetails from '@/hooks/use-account-details.ts'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// /* ------------------------------------------------------------------ */
// /* Helpers & Types                                                    */
// /* ------------------------------------------------------------------ */
// type YesNo = 'yes' | 'no'
// const ynToBool = (v?: YesNo) => v === 'yes'
// const nowLocal = () => {
//   // datetime-local -> YYYY-MM-DDTHH:mm
//   const d = new Date()
//   const pad = (n: number) => String(n).padStart(2, '0')
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
//     d.getHours()
//   )}:${pad(d.getMinutes())}`
// }
// const toISO = (dtLocal?: string) =>
//   dtLocal ? new Date(dtLocal).toISOString() : undefined
// const asNumber = (v?: string) => {
//   if (!v || !String(v).trim()) return undefined
//   const n = Number(v)
//   return Number.isFinite(n) ? n : undefined
// }
// const asStringOrUndef = (v?: string) => {
//   const s = (v ?? '').trim()
//   return s ? s : undefined
// }
// const joinAddress = (...parts: Array<string | null | undefined>) =>
//   parts
//     .map((p) => (p ?? '').trim())
//     .filter(Boolean)
//     .join(', ')
// const toLocalDT = (isoOrDate?: string | null) => {
//   if (!isoOrDate) return ''
//   const d = new Date(isoOrDate)
//   if (Number.isNaN(d.getTime())) return ''
//   const pad = (n: number) => String(n).padStart(2, '0')
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
//     d.getHours()
//   )}:${pad(d.getMinutes())}`
// }
// /* ------------------------------------------------------------------ */
// /* Zod Schema with Strict Validation                                  */
// /* ------------------------------------------------------------------ */
// // REGEX PATTERNS
// const MOBILE_REGEX = /^\d{10}$/
// const CURRENCY_REGEX = /^\d+(\.\d{1,2})?$/ // Matches 100, 100.5, 100.50
// const INTEGER_REGEX = /^\d+$/
// // Helper: Optional string that must match regex if provided
// const optionalRegex = (regex: RegExp, msg: string) =>
//   z
//     .string()
//     .optional()
//     .refine(
//       (val) => {
//         if (!val || val === '') return true
//         return regex.test(val)
//       },
//       { message: msg }
//     )
// // Helper: Required string matching regex
// const requiredRegex = (regex: RegExp, msg: string) =>
//   z.string().min(1, 'Required').regex(regex, msg)
// const optionalString = z.string().optional()
// const formSchema = z
//   .object({
//     /* Base */
//     name: z.string().min(1, 'Borrower name is required'),
//     createDateTime: z.string().min(1, 'Date of visit is required'),
//     followUpType: optionalString,
//     /* Borrower / Loan */
//     borrowerAddress: z.string().min(1, 'Borrower address is required'),
//     // Strict 10 digit mobile
//     mobileNumber: requiredRegex(
//       MOBILE_REGEX,
//       'Mobile number must be exactly 10 digits'
//     ),
//     // Currency: Max 2 decimal places
//     loanAmount: requiredRegex(
//       CURRENCY_REGEX,
//       'Invalid amount (max 2 decimals)'
//     ),
//     dateOfSanction: optionalString,
//     loanPurpose: optionalString,
//     // Tenure: Integers only
//     loanTenure: optionalRegex(INTEGER_REGEX, 'Tenure must be a whole number'),
//     // EMI: Currency
//     emiAmount: optionalRegex(CURRENCY_REGEX, 'Invalid amount (max 2 decimals)'),
//     /* Residence */
//     residenceVisited: z.enum(['yes', 'no']),
//     residenceAddress: optionalString,
//     residenceObservations: optionalString,
//     residenceGeoLocation: optionalString,
//     /* Inspection observations */
//     borrowerLocatedAtResidence: z.enum(['yes', 'no']),
//     neighbourFeedback: optionalString,
//     newResidenceAddress: optionalString,
//     borrowerAttendedCall: z.enum(['yes', 'no']),
//     borrowerWhereaboutsFeedback: optionalString,
//     /* Employment */
//     workingInSameOrganization: z.enum(['yes', 'no']),
//     employerAddressChanged: z.enum(['yes', 'no']),
//     newEmployerAddress: optionalString,
//     // Contact: 10 digits
//     newEmployerContactNumber: optionalRegex(
//       MOBILE_REGEX,
//       'Contact number must be 10 digits'
//     ),
//     employmentStatus: optionalString,
//     employmentStatusDate: optionalString,
//     transferredOfficeAddress: optionalString,
//     transferredOfficeContact: optionalString,
//     /* Salary */
//     salaryApplicable: z.enum(['yes', 'no']),
//     salaryCreditedRegularly: z.enum(['yes', 'no']).optional(),
//     salaryNotPaidReason: optionalString,
//     expectedSalaryPaymentDate: optionalString,
//     /* Business */
//     businessApplicable: z.enum(['yes', 'no']),
//     businessClosedOrShiftedDate: optionalString,
//     newBusinessAddress: optionalString,
//     // Contact: 10 digits
//     newBusinessContactNumber: optionalRegex(
//       MOBILE_REGEX,
//       'Contact number must be 10 digits'
//     ),
//     tenantStillOccupying: z.enum(['yes', 'no']),
//     tenantVacatedDate: optionalString,
//     tenantVacationReason: optionalString,
//     pensionReceivedBySpouse: z.enum(['yes', 'no']),
//     loanRepaidFromPension: z.enum(['yes', 'no']),
//     /* Account position */
//     outstandingAmount: optionalRegex(
//       CURRENCY_REGEX,
//       'Invalid amount (max 2 decimals)'
//     ),
//     irregularAmount: optionalRegex(
//       CURRENCY_REGEX,
//       'Invalid amount (max 2 decimals)'
//     ),
//     dateOfIrregularity: optionalString,
//     iracStatus: optionalString,
//     /* Security / Vehicle */
//     securityDetails: z.enum(['yes', 'no']),
//     vehicleMake: optionalString,
//     vehicleModel: optionalString,
//     engineNumber: optionalString,
//     chassisNumber: optionalString,
//     vehicleDescriptionMatches: z.enum(['yes', 'no']).optional(),
//     engineChassisVerified: z.enum(['yes', 'no']).optional(),
//     vehiclePhotographTaken: z.enum(['yes', 'no']).optional(),
//     vehicleConditionGood: z.enum(['yes', 'no']).optional(),
//     deliveryNoteReceived: z.enum(['yes', 'no']).optional(),
//     taxInvoiceReceived: z.enum(['yes', 'no']).optional(),
//     insurancePolicyReceived: z.enum(['yes', 'no']).optional(),
//     roadTaxReceiptReceived: z.enum(['yes', 'no']).optional(),
//     registrationChargesReceived: z.enum(['yes', 'no']).optional(),
//     vehicleRegistered: z.enum(['yes', 'no']).optional(),
//     rcReceived: z.enum(['yes', 'no']).optional(),
//     vahanVerified: z.enum(['yes', 'no']).optional(),
//     /* Other */
//     inspectionDate: optionalString,
//     inspectionPlace: optionalString,
//     inspectionPlaceName: optionalString,
//     inspectorName: optionalString,
//     inspectorDesignation: optionalString,
//     inspectorBranch: optionalString,
//     emiMandateDate: optionalString,
//     repaymentRegular: z.enum(['yes', 'no']),
//     irregularityReason: optionalString,
//     recoverySteps: optionalString,
//     seizureInitiated: z.enum(['yes', 'no']),
//     seizureStatus: optionalString,
//     otherDeficiencies: optionalString,
//     briefRemarks: optionalString,
//     inspectorEmployeeId: requiredRegex(
//       INTEGER_REGEX,
//       'Inspector employee ID must be a whole number'
//     ),
//   })
//   .superRefine((data, ctx) => {
//     // 1. Residence Conditional Validation
//     if (data.residenceVisited === 'yes') {
//       if (!data.residenceAddress?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Residence address is required',
//           path: ['residenceAddress'],
//         })
//       }
//       if (!data.residenceObservations?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Residence observations are required',
//           path: ['residenceObservations'],
//         })
//       }
//     }
//     // 2. Salary Conditional Validation
//     if (
//       data.salaryApplicable === 'yes' &&
//       data.salaryCreditedRegularly === 'no'
//     ) {
//       if (!data.salaryNotPaidReason?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Reason is required',
//           path: ['salaryNotPaidReason'],
//         })
//       }
//       if (!data.expectedSalaryPaymentDate?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Expected salary date is required',
//           path: ['expectedSalaryPaymentDate'],
//         })
//       }
//     }
//     // 3. Business / Tenant Conditional Validation
//     if (
//       data.businessApplicable === 'yes' &&
//       data.tenantStillOccupying === 'no'
//     ) {
//       if (!data.tenantVacatedDate?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Vacated date is required',
//           path: ['tenantVacatedDate'],
//         })
//       }
//       if (!data.tenantVacationReason?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Reason is required',
//           path: ['tenantVacationReason'],
//         })
//       }
//     }
//     // 4. Repayment Conditional Validation
//     if (data.repaymentRegular === 'no') {
//       if (!data.irregularityReason?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Irregularity reason is required',
//           path: ['irregularityReason'],
//         })
//       }
//     }
//     // 5. Seizure Conditional Validation
//     if (data.seizureInitiated === 'yes') {
//       if (!data.seizureStatus?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Seizure status is required',
//           path: ['seizureStatus'],
//         })
//       }
//     }
//     // 6. Security / Vehicle Conditional Validation
//     if (data.securityDetails === 'yes') {
//       if (!data.vehicleMake?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Vehicle make is required',
//           path: ['vehicleMake'],
//         })
//       }
//       if (!data.vehicleModel?.trim()) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: 'Vehicle model is required',
//           path: ['vehicleModel'],
//         })
//       }
//     }
//   })
// type FormValues = z.infer<typeof formSchema>
// /* ------------------------------------------------------------------ */
// /* Sub-components                                                     */
// /* ------------------------------------------------------------------ */
// // Moved outside to prevent re-renders losing focus/state
// const YesNoRadio = ({
//   value,
//   onChange,
// }: {
//   value: YesNo | undefined
//   onChange: (v: YesNo) => void
// }) => (
//   <div className='flex items-center gap-6'>
//     <label className='flex items-center gap-2'>
//       <input
//         type='radio'
//         value='yes'
//         checked={value === 'yes'}
//         onChange={() => onChange('yes')}
//       />
//       Yes
//     </label>
//     <label className='flex items-center gap-2'>
//       <input
//         type='radio'
//         value='no'
//         checked={value === 'no'}
//         onChange={() => onChange('no')}
//       />
//       No
//     </label>
//   </div>
// )
// /* ------------------------------------------------------------------ */
// /* Main Component                                                     */
// /* ------------------------------------------------------------------ */
// interface Props {
//   open: boolean
//   setOpen: (open: boolean) => void
//   accountId: string
//   onSuccess: () => void
// }
// const NewPSegmentDialog: React.FC<Props> = ({
//   open,
//   setOpen,
//   accountId,
//   onSuccess,
// }) => {
//   const { data: customerDetail } = useAccountDetails(accountId)
//   // Initialize form with Zod resolver
//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       name: '',
//       createDateTime: nowLocal(),
//       followUpType: '',
//       borrowerAddress: '',
//       mobileNumber: '',
//       loanAmount: '',
//       dateOfSanction: '',
//       loanPurpose: '',
//       loanTenure: '',
//       emiAmount: '',
//       residenceVisited: 'no',
//       residenceAddress: '',
//       residenceObservations: '',
//       residenceGeoLocation: '',
//       borrowerLocatedAtResidence: 'no',
//       neighbourFeedback: '',
//       newResidenceAddress: '',
//       borrowerAttendedCall: 'no',
//       borrowerWhereaboutsFeedback: '',
//       workingInSameOrganization: 'yes',
//       employerAddressChanged: 'no',
//       newEmployerAddress: '',
//       newEmployerContactNumber: '',
//       employmentStatus: '',
//       employmentStatusDate: '',
//       transferredOfficeAddress: '',
//       transferredOfficeContact: '',
//       salaryApplicable: 'no',
//       salaryCreditedRegularly: 'no',
//       salaryNotPaidReason: '',
//       expectedSalaryPaymentDate: '',
//       businessApplicable: 'no',
//       businessClosedOrShiftedDate: '',
//       newBusinessAddress: '',
//       newBusinessContactNumber: '',
//       tenantStillOccupying: 'no',
//       tenantVacatedDate: '',
//       tenantVacationReason: '',
//       pensionReceivedBySpouse: 'no',
//       loanRepaidFromPension: 'no',
//       outstandingAmount: '',
//       irregularAmount: '',
//       dateOfIrregularity: '',
//       iracStatus: '',
//       securityDetails: 'no',
//       vehicleMake: '',
//       vehicleModel: '',
//       engineNumber: '',
//       chassisNumber: '',
//       vehicleDescriptionMatches: 'no',
//       engineChassisVerified: 'no',
//       vehiclePhotographTaken: 'no',
//       vehicleConditionGood: 'no',
//       deliveryNoteReceived: 'no',
//       taxInvoiceReceived: 'no',
//       insurancePolicyReceived: 'no',
//       roadTaxReceiptReceived: 'no',
//       registrationChargesReceived: 'no',
//       vehicleRegistered: 'no',
//       rcReceived: 'no',
//       vahanVerified: 'no',
//       inspectionDate: nowLocal(),
//       inspectionPlace: '',
//       inspectionPlaceName: '',
//       inspectorName: '',
//       inspectorDesignation: '',
//       inspectorBranch: '',
//       emiMandateDate: '',
//       repaymentRegular: 'yes',
//       irregularityReason: '',
//       recoverySteps: '',
//       seizureInitiated: 'no',
//       seizureStatus: '',
//       otherDeficiencies: '',
//       briefRemarks: '',
//       inspectorEmployeeId: '',
//     },
//     mode: 'onSubmit',
//   })
//   const { watch, reset } = form
//   const {
//     formState: { isSubmitting },
//   } = form
//   useEffect(() => {
//     if (!open) return
//     if (!customerDetail) return
//     reset((prev) => ({
//       ...prev,
//       // ---- from customerDetail ----
//       name: customerDetail.custName ?? prev.name,
//       mobileNumber: customerDetail.telNo ?? prev.mobileNumber,
//       borrowerAddress:
//         joinAddress(
//           customerDetail.add1,
//           customerDetail.add2,
//           customerDetail.add3,
//           customerDetail.add4
//         ) || prev.borrowerAddress,
//       loanAmount:
//         customerDetail.loanLimit !== undefined &&
//         customerDetail.loanLimit !== null
//           ? String(customerDetail.loanLimit)
//           : prev.loanAmount,
//       loanPurpose:
//         customerDetail.acctDesc !== undefined &&
//         customerDetail.acctDesc !== null
//           ? String(customerDetail.acctDesc)
//           : prev.loanPurpose,
//       emiAmount:
//         customerDetail.instalAmt !== undefined &&
//         customerDetail.instalAmt !== null
//           ? String(customerDetail.instalAmt)
//           : prev.emiAmount,
//       outstandingAmount:
//         customerDetail.outstand !== undefined &&
//         customerDetail.outstand !== null
//           ? String(customerDetail.outstand)
//           : prev.outstandingAmount,
//       irregularAmount:
//         customerDetail.irregAmt !== undefined &&
//         customerDetail.irregAmt !== null
//           ? String(customerDetail.irregAmt)
//           : prev.irregularAmount,
//       dateOfSanction: customerDetail.sanctDt
//         ? toLocalDT(customerDetail.sanctDt)
//         : prev.dateOfSanction,
//       dateOfIrregularity: customerDetail.irrgDt
//         ? toLocalDT(customerDetail.irrgDt)
//         : prev.dateOfIrregularity,
//     }))
//   }, [open, customerDetail, reset])
//   /* toggles */
//   const residenceVisited = watch('residenceVisited')
//   const salaryApplicable = watch('salaryApplicable')
//   const salaryCreditedRegularly = watch('salaryCreditedRegularly')
//   const businessApplicable = watch('businessApplicable')
//   const tenantStillOccupying = watch('tenantStillOccupying')
//   const employerAddressChanged = watch('employerAddressChanged')
//   const repaymentRegular = watch('repaymentRegular')
//   const seizureInitiated = watch('seizureInitiated')
//   const securityDetails = watch('securityDetails')
//   /* images (residence only) */
//   const [resImages, setResImages] = useState<string[]>([])
//   const uploadResidenceMutation = $api.useMutation(
//     'post',
//     '/Psegement_inspections/uploadResidenceImages'
//   )
//   const uploadImages = async (files: FileList | null) => {
//     if (!files?.length) return
//     const fd = new FormData()
//     Array.from(files).forEach((f) => fd.append('files', f))
//     try {
//       await uploadResidenceMutation.mutateAsync({
//         body: fd as unknown as undefined,
//         params: { query: undefined as unknown as { files: string[] } },
//       })
//       setResImages((prev) => [...prev, ...Array.from(files).map((f) => f.name)])
//       toast.success(`${files.length} image(s) uploaded`)
//     } catch {
//       toast.error('Could not upload images')
//     }
//   }
//   /* create */
//   const createMutation = $api.useMutation(
//     'post',
//     '/Psegement_inspections/create',
//     {
//       onSuccess: () => {
//         onSuccess()
//         toast.success('P-Segment inspection created')
//         setOpen(false)
//       },
//       onError: () => toast.error('Could not create inspection'),
//     }
//   )
//   const onSubmit = async (v: FormValues) => {
//     await createMutation.mutateAsync({
//       params: { header: { Authorization: '' } },
//       body: {
//         accountNumber: accountId,
//         name: asStringOrUndef(v.name),
//         followUpType: asStringOrUndef(v.followUpType),
//         createDateTime: toISO(v.createDateTime),
//         /* borrower / loan */
//         borrowerAddress: asStringOrUndef(v.borrowerAddress),
//         mobileNumber: asStringOrUndef(v.mobileNumber),
//         loanAmount: asNumber(v.loanAmount),
//         dateOfSanction: toISO(v.dateOfSanction),
//         loanPurpose: asStringOrUndef(v.loanPurpose),
//         loanTenure: asNumber(v.loanTenure),
//         emiAmount: asNumber(v.emiAmount),
//         /* residence */
//         residenceVisited: v.residenceVisited,
//         residenceAddress:
//           v.residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceAddress)
//             : undefined,
//         residenceObservations:
//           v.residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceObservations)
//             : undefined,
//         residenceGeoLocation:
//           v.residenceVisited === 'yes'
//             ? asStringOrUndef(v.residenceGeoLocation)
//             : undefined,
//         residenceImages: v.residenceVisited === 'yes' ? resImages : [],
//         /* inspection observations */
//         borrowerLocatedAtResidence: ynToBool(v.borrowerLocatedAtResidence),
//         neighbourFeedback: asStringOrUndef(v.neighbourFeedback),
//         newResidenceAddress: asStringOrUndef(v.newResidenceAddress),
//         borrowerAttendedCall: ynToBool(v.borrowerAttendedCall),
//         borrowerWhereaboutsFeedback: asStringOrUndef(
//           v.borrowerWhereaboutsFeedback
//         ),
//         /* employment */
//         workingInSameOrganization: ynToBool(v.workingInSameOrganization),
//         employerAddressChanged: ynToBool(v.employerAddressChanged),
//         newEmployerAddress:
//           v.employerAddressChanged === 'yes'
//             ? asStringOrUndef(v.newEmployerAddress)
//             : undefined,
//         newEmployerContactNumber:
//           v.employerAddressChanged === 'yes'
//             ? asStringOrUndef(v.newEmployerContactNumber)
//             : undefined,
//         employmentStatus: asStringOrUndef(v.employmentStatus),
//         employmentStatusDate: toISO(v.employmentStatusDate),
//         transferredOfficeAddress: asStringOrUndef(v.transferredOfficeAddress),
//         transferredOfficeContact: asStringOrUndef(v.transferredOfficeContact),
//         /* salary */
//         salaryApplicable: ynToBool(v.salaryApplicable),
//         salaryCreditedRegularly:
//           v.salaryApplicable === 'yes'
//             ? ynToBool(v.salaryCreditedRegularly as YesNo)
//             : undefined,
//         salaryNotPaidReason:
//           v.salaryApplicable === 'yes' && v.salaryCreditedRegularly === 'no'
//             ? asStringOrUndef(v.salaryNotPaidReason)
//             : undefined,
//         expectedSalaryPaymentDate:
//           v.salaryApplicable === 'yes' && v.salaryCreditedRegularly === 'no'
//             ? toISO(v.expectedSalaryPaymentDate)
//             : undefined,
//         /* business */
//         businessApplicable: ynToBool(v.businessApplicable),
//         businessClosedOrShiftedDate:
//           v.businessApplicable === 'yes'
//             ? toISO(v.businessClosedOrShiftedDate)
//             : undefined,
//         newBusinessAddress:
//           v.businessApplicable === 'yes'
//             ? asStringOrUndef(v.newBusinessAddress)
//             : undefined,
//         newBusinessContactNumber:
//           v.businessApplicable === 'yes'
//             ? asStringOrUndef(v.newBusinessContactNumber)
//             : undefined,
//         tenantStillOccupying: ynToBool(v.tenantStillOccupying),
//         tenantVacatedDate:
//           v.businessApplicable === 'yes' && v.tenantStillOccupying === 'no'
//             ? toISO(v.tenantVacatedDate)
//             : undefined,
//         tenantVacationReason:
//           v.businessApplicable === 'yes' && v.tenantStillOccupying === 'no'
//             ? asStringOrUndef(v.tenantVacationReason)
//             : undefined,
//         pensionReceivedBySpouse: ynToBool(v.pensionReceivedBySpouse),
//         loanRepaidFromPension: ynToBool(v.loanRepaidFromPension),
//         /* account position */
//         outstandingAmount: asNumber(v.outstandingAmount),
//         irregularAmount: asNumber(v.irregularAmount),
//         dateOfIrregularity: toISO(v.dateOfIrregularity),
//         iracStatus: asStringOrUndef(v.iracStatus),
//         /* security */
//         securityDetails: ynToBool(v.securityDetails),
//         vehicleMake:
//           v.securityDetails === 'yes'
//             ? asStringOrUndef(v.vehicleMake)
//             : undefined,
//         vehicleModel:
//           v.securityDetails === 'yes'
//             ? asStringOrUndef(v.vehicleModel)
//             : undefined,
//         engineNumber:
//           v.securityDetails === 'yes'
//             ? asStringOrUndef(v.engineNumber)
//             : undefined,
//         chassisNumber:
//           v.securityDetails === 'yes'
//             ? asStringOrUndef(v.chassisNumber)
//             : undefined,
//         vehicleDescriptionMatches:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.vehicleDescriptionMatches as YesNo)
//             : undefined,
//         engineChassisVerified:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.engineChassisVerified as YesNo)
//             : undefined,
//         vehiclePhotographTaken:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.vehiclePhotographTaken as YesNo)
//             : undefined,
//         vehicleConditionGood:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.vehicleConditionGood as YesNo)
//             : undefined,
//         deliveryNoteReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.deliveryNoteReceived as YesNo)
//             : undefined,
//         taxInvoiceReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.taxInvoiceReceived as YesNo)
//             : undefined,
//         insurancePolicyReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.insurancePolicyReceived as YesNo)
//             : undefined,
//         roadTaxReceiptReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.roadTaxReceiptReceived as YesNo)
//             : undefined,
//         registrationChargesReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.registrationChargesReceived as YesNo)
//             : undefined,
//         vehicleRegistered:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.vehicleRegistered as YesNo)
//             : undefined,
//         rcReceived:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.rcReceived as YesNo)
//             : undefined,
//         vahanVerified:
//           v.securityDetails === 'yes'
//             ? ynToBool(v.vahanVerified as YesNo)
//             : undefined,
//         /* other */
//         inspectionDate: toISO(v.inspectionDate),
//         inspectionPlace: asStringOrUndef(v.inspectionPlace),
//         inspectionPlaceName: asStringOrUndef(v.inspectionPlaceName),
//         inspectorName: asStringOrUndef(v.inspectorName),
//         inspectorDesignation: asStringOrUndef(v.inspectorDesignation),
//         inspectorBranch: asStringOrUndef(v.inspectorBranch),
//         emiMandateDate: toISO(v.emiMandateDate),
//         repaymentRegular: ynToBool(v.repaymentRegular),
//         irregularityReason:
//           v.repaymentRegular === 'no'
//             ? asStringOrUndef(v.irregularityReason)
//             : undefined,
//         recoverySteps:
//           v.repaymentRegular === 'no'
//             ? asStringOrUndef(v.recoverySteps)
//             : undefined,
//         seizureInitiated: ynToBool(v.seizureInitiated),
//         seizureStatus:
//           v.seizureInitiated === 'yes'
//             ? asStringOrUndef(v.seizureStatus)
//             : undefined,
//         otherDeficiencies: asStringOrUndef(v.otherDeficiencies),
//         briefRemarks: asStringOrUndef(v.briefRemarks),
//         /* defaults */
//         isActive: true,
//         workPlaceImages: [],
//         inspectorEmployeeId: asStringOrUndef(v.inspectorEmployeeId),
//       },
//     })
//   }
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className='max-h-[90vh] min-w-5xl overflow-y-auto'>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
//             <DialogHeader>
//               <DialogTitle>New Retail Inspection</DialogTitle>
//               <DialogDescription>
//                 Workplace removed. Fields show/hide and become required based on
//                 toggles.
//               </DialogDescription>
//             </DialogHeader>
//             {/* Borrower Name */}
//             <FormField
//               control={form.control}
//               name='name'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Borrower Name</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder='Name of borrower'
//                       {...field}
//                       readOnly={Boolean(field.value?.trim())}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='createDateTime'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Date & Time of Visit</FormLabel>
//                   <FormControl>
//                     <Input type='datetime-local' {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             {/* Borrower / Loan */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Borrower / Loan
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='borrowerAddress'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Borrower Address</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Borrower address' {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='mobileNumber'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Mobile Number</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder='10-digit mobile no'
//                           type='number'
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='dateOfSanction'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of Sanction</FormLabel>
//                       <FormControl>
//                         <Input type='datetime-local' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='loanAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0.00' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='emiAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>EMI Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0.00' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='loanTenure'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Tenure (Months)</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='loanPurpose'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan Purpose</FormLabel>
//                       <FormControl>
//                         <Input placeholder='Purpose' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <FormField
//                 control={form.control}
//                 name='followUpType'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Follow-up Type</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder='FOLLOWUP / VISIT / CALL…'
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Residence */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>Residence</legend>
//               <FormField
//                 control={form.control}
//                 name='residenceVisited'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Residence Visited?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {residenceVisited === 'yes' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='residenceAddress'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Address</FormLabel>
//                         <FormControl>
//                           <Input placeholder='Residence address' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='residenceObservations'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Observations</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Observations…' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='residenceGeoLocation'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Residence Geo Location</FormLabel>
//                         <FormControl>
//                           <Input placeholder='Latitude, Longitude' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <div className='space-y-2'>
//                     <Label className='text-sm font-medium'>
//                       Residence Images
//                     </Label>
//                     <Input
//                       type='file'
//                       multiple
//                       accept='image/*'
//                       onChange={(e) => uploadImages(e.target.files)}
//                     />
//                     {resImages.length > 0 && (
//                       <ul className='space-y-1'>
//                         {resImages.map((name, i) => (
//                           <li
//                             key={i}
//                             className='bg-muted flex items-center justify-between rounded px-3 py-1 text-sm'
//                           >
//                             <span className='max-w-50 truncate'>{name}</span>
//                             <Button
//                               type='button'
//                               size='icon'
//                               variant='ghost'
//                               onClick={() =>
//                                 setResImages((prev) =>
//                                   prev.filter((_, idx) => idx !== i)
//                                 )
//                               }
//                             >
//                               ✕
//                             </Button>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </>
//               )}
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='borrowerLocatedAtResidence'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Borrower located at residence?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value as YesNo}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='borrowerAttendedCall'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Borrower attended call?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value as YesNo}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <FormField
//                 control={form.control}
//                 name='neighbourFeedback'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Neighbour feedback</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Neighbour feedback…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='borrowerWhereaboutsFeedback'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Borrower whereabouts feedback</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Whereabouts…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name='newResidenceAddress'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>New residence address (if shifted)</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='New address…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Salary */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Salary / EMI
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='salaryApplicable'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Salary applicable?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {salaryApplicable === 'yes' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='salaryCreditedRegularly'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>
//                           Salary credited regularly & EMI recovered?
//                         </FormLabel>
//                         <FormControl>
//                           <YesNoRadio
//                             value={field.value as YesNo}
//                             onChange={field.onChange}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   {salaryCreditedRegularly === 'no' && (
//                     <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                       <FormField
//                         control={form.control}
//                         name='salaryNotPaidReason'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Reason for salary not paid</FormLabel>
//                             <FormControl>
//                               <Input placeholder='Reason' {...field} />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                       <FormField
//                         control={form.control}
//                         name='expectedSalaryPaymentDate'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Expected salary payment date</FormLabel>
//                             <FormControl>
//                               <Input type='datetime-local' {...field} />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//               {/* Employment details handled if Employer Address Changed is 'yes' */}
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='employerAddressChanged'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Employer Address Changed?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value as YesNo}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               {employerAddressChanged === 'yes' && (
//                 <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                   <FormField
//                     control={form.control}
//                     name='newEmployerAddress'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>New Employer Address</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='New address...' {...field} />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='newEmployerContactNumber'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>New Employer Contact</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder='10-digit number'
//                             type='number'
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               )}
//             </fieldset>
//             {/* Business */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Business / Rent / Pension
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='businessApplicable'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Business applicable?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {businessApplicable === 'yes' && (
//                 <>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='businessClosedOrShiftedDate'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Business closed / shifted date</FormLabel>
//                           <FormControl>
//                             <Input type='datetime-local' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='newBusinessContactNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>New business contact number</FormLabel>
//                           <FormControl>
//                             <Input
//                               placeholder='10-digit number'
//                               type='number'
//                               {...field}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <FormField
//                     control={form.control}
//                     name='newBusinessAddress'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>New business address</FormLabel>
//                         <FormControl>
//                           <Textarea
//                             placeholder='New business address'
//                             {...field}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='tenantStillOccupying'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Tenant still occupying?</FormLabel>
//                         <FormControl>
//                           <YesNoRadio
//                             value={field.value as YesNo}
//                             onChange={field.onChange}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                   {tenantStillOccupying === 'no' && (
//                     <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                       <FormField
//                         control={form.control}
//                         name='tenantVacatedDate'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Tenant vacated date</FormLabel>
//                             <FormControl>
//                               <Input type='datetime-local' {...field} />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                       <FormField
//                         control={form.control}
//                         name='tenantVacationReason'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Tenant vacation reason</FormLabel>
//                             <FormControl>
//                               <Input placeholder='Reason' {...field} />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='pensionReceivedBySpouse'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Pension received by spouse?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value as YesNo}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='loanRepaidFromPension'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Loan repaid from pension?</FormLabel>
//                       <FormControl>
//                         <YesNoRadio
//                           value={field.value as YesNo}
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </fieldset>
//             {/* Account Position */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Account Position
//               </legend>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='outstandingAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Outstanding Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0.00' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='irregularAmount'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Irregular Amount</FormLabel>
//                       <FormControl>
//                         <Input type='number' placeholder='0.00' {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                 <FormField
//                   control={form.control}
//                   name='dateOfIrregularity'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of Irregularity</FormLabel>
//                       <FormControl>
//                         <Input type='datetime-local' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name='iracStatus'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>IRAC Status</FormLabel>
//                       <FormControl>
//                         <Input placeholder='Standard / SMA / NPA…' {...field} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </fieldset>
//             {/* Other Observations */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Other Observations
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='repaymentRegular'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Repayment regular?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {repaymentRegular === 'no' && (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='irregularityReason'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Irregularity Reason</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Reason…' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name='recoverySteps'
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Recovery Steps</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder='Steps taken…' {...field} />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </>
//               )}
//               <FormField
//                 control={form.control}
//                 name='seizureInitiated'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Seizure initiated?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {seizureInitiated === 'yes' && (
//                 <FormField
//                   control={form.control}
//                   name='seizureStatus'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Seizure Status</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder='Initiated / Pending / Completed…'
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               )}
//               <FormField
//                 control={form.control}
//                 name='briefRemarks'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Brief Remarks</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder='Remarks…' {...field} />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </fieldset>
//             {/* Security */}
//             <fieldset className='space-y-4 rounded-lg border p-4'>
//               <legend className='text-primary font-semibold'>
//                 Security / Vehicle
//               </legend>
//               <FormField
//                 control={form.control}
//                 name='securityDetails'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Security details present?</FormLabel>
//                     <FormControl>
//                       <YesNoRadio
//                         value={field.value as YesNo}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//               {securityDetails === 'yes' && (
//                 <>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='vehicleMake'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Vehicle Make</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Make' {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='vehicleModel'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Vehicle Model</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Model' {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <FormField
//                       control={form.control}
//                       name='engineNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Engine Number</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Engine no' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name='chassisNumber'
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Chassis Number</FormLabel>
//                           <FormControl>
//                             <Input placeholder='Chassis no' {...field} />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//                     <div className='space-y-2'>
//                       <Label>Vehicle description matches?</Label>
//                       <FormField
//                         control={form.control}
//                         name='vehicleDescriptionMatches'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <YesNoRadio
//                                 value={field.value as YesNo}
//                                 onChange={field.onChange}
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                     <div className='space-y-2'>
//                       <Label>Engine/Chassis verified?</Label>
//                       <FormField
//                         control={form.control}
//                         name='engineChassisVerified'
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <YesNoRadio
//                                 value={field.value as YesNo}
//                                 onChange={field.onChange}
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   </div>
//                 </>
//               )}
//             </fieldset>
//             <FormField
//               control={form.control}
//               name='inspectorEmployeeId'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Inspector Employee ID</FormLabel>
//                   <FormControl>
//                     <Input placeholder='Inspector Employee ID' {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             {/* Footer */}
//             <DialogFooter>
//               <Button
//                 type='button'
//                 variant='secondary'
//                 onClick={() => setOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button type='submit' disabled={isSubmitting}>
//                 {isSubmitting ? 'Submitting…' : 'Create Inspection'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   )
// }
// export default NewPSegmentDialog
/* ------------------------------------------------------------------ */
/* components/inspection/new-psegment-dialog.tsx                    */
/* ------------------------------------------------------------------ */
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import useAccountDetails from '@/hooks/use-account-details.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// /* ------------------------------------------------------------------ */
// /* Helpers & Types                                                    */
// /* ------------------------------------------------------------------ */

type YesNo = 'yes' | 'no'

const ynToBool = (v?: YesNo) => v === 'yes'

const nowLocal = () => {
  // datetime-local -> YYYY-MM-DDTHH:mm
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const toISO = (dtLocal?: string) =>
  dtLocal ? new Date(dtLocal).toISOString() : undefined

const asNumber = (v?: string) => {
  if (!v || !String(v).trim()) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const asStringOrUndef = (v?: string) => {
  const s = (v ?? '').trim()
  return s ? s : undefined
}

const joinAddress = (...parts: Array<string | null | undefined>) =>
  parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ')

const toLocalDT = (isoOrDate?: string | null) => {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

/* ------------------------------------------------------------------ */
/* Zod Schema with Strict Validation                                  */
/* ------------------------------------------------------------------ */

// REGEX PATTERNS
const MOBILE_REGEX = /^\d{10}$/
const CURRENCY_REGEX = /^-?\d+(\.\d{1,2})?$/ // Matches 100, 100.5, 100.50
const INTEGER_REGEX = /^\d+$/

// Helper: Optional string that must match regex if provided
const optionalRegex = (regex: RegExp, msg: string) =>
  z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true
        return regex.test(val)
      },
      { message: msg }
    )

// Helper: Required string matching regex
const requiredRegex = (regex: RegExp, msg: string) =>
  z.string().min(1, 'Required').regex(regex, msg)

const optionalString = z.string().optional()

const formSchema = z
  .object({
    /* Base */
    name: z.string().min(1, 'Borrower name is required'),
    createDateTime: z.string().min(1, 'Date of visit is required'),
    followUpType: optionalString,

    /* Borrower / Loan */
    borrowerAddress: z.string().min(1, 'Borrower address is required'),

    // Strict 10 digit mobile
    mobileNumber: requiredRegex(
      MOBILE_REGEX,
      'Mobile number must be exactly 10 digits'
    ),

    // Currency: Max 2 decimal places
    loanAmount: requiredRegex(
      CURRENCY_REGEX,
      'Invalid amount (max 2 decimals)'
    ),

    dateOfSanction: optionalString,
    loanPurpose: optionalString,

    // Tenure: Integers only
    loanTenure: optionalRegex(INTEGER_REGEX, 'Tenure must be a whole number'),

    // EMI: Currency
    emiAmount: optionalRegex(CURRENCY_REGEX, 'Invalid amount (max 2 decimals)'),

    /* Residence */
    residenceVisited: z.enum(['yes', 'no']),
    residenceAddress: optionalString,
    residenceObservations: optionalString,
    residenceGeoLocation: optionalString,

    /* Inspection observations */
    borrowerLocatedAtResidence: z.enum(['yes', 'no']),
    neighbourFeedback: optionalString,
    newResidenceAddress: optionalString,
    borrowerAttendedCall: z.enum(['yes', 'no']),
    borrowerWhereaboutsFeedback: optionalString,

    /* Employment */
    workingInSameOrganization: z.enum(['yes', 'no']),
    employerAddressChanged: z.enum(['yes', 'no']),
    newEmployerAddress: optionalString,

    // Contact: 10 digits
    newEmployerContactNumber: optionalRegex(
      MOBILE_REGEX,
      'Contact number must be 10 digits'
    ),

    employmentStatus: optionalString,
    employmentStatusDate: optionalString,
    transferredOfficeAddress: optionalString,
    transferredOfficeContact: optionalString,

    /* Salary */
    salaryApplicable: z.enum(['yes', 'no']),
    salaryCreditedRegularly: z.enum(['yes', 'no']).optional(),
    salaryNotPaidReason: optionalString,
    expectedSalaryPaymentDate: optionalString,

    /* Business */
    businessApplicable: z.enum(['yes', 'no']),
    businessClosedOrShiftedDate: optionalString,
    newBusinessAddress: optionalString,

    // Contact: 10 digits
    newBusinessContactNumber: optionalRegex(
      MOBILE_REGEX,
      'Contact number must be 10 digits'
    ),

    tenantStillOccupying: z.enum(['yes', 'no']),
    tenantVacatedDate: optionalString,
    tenantVacationReason: optionalString,
    pensionReceivedBySpouse: z.enum(['yes', 'no']),
    loanRepaidFromPension: z.enum(['yes', 'no']),

    /* Account position */
    outstandingAmount: optionalRegex(
      CURRENCY_REGEX,
      'Invalid amount (max 2 decimals)'
    ),
    irregularAmount: optionalRegex(
      CURRENCY_REGEX,
      'Invalid amount (max 2 decimals)'
    ),

    dateOfIrregularity: optionalString,
    iracStatus: optionalString,

    /* Security / Vehicle */
    securityDetails: z.enum(['yes', 'no']),
    vehicleMake: optionalString,
    vehicleModel: optionalString,
    engineNumber: optionalString,
    chassisNumber: optionalString,

    vehicleDescriptionMatches: z.enum(['yes', 'no']).optional(),
    engineChassisVerified: z.enum(['yes', 'no']).optional(),
    vehiclePhotographTaken: z.enum(['yes', 'no']).optional(),
    vehicleConditionGood: z.enum(['yes', 'no']).optional(),

    deliveryNoteReceived: z.enum(['yes', 'no']).optional(),
    taxInvoiceReceived: z.enum(['yes', 'no']).optional(),
    insurancePolicyReceived: z.enum(['yes', 'no']).optional(),
    roadTaxReceiptReceived: z.enum(['yes', 'no']).optional(),
    registrationChargesReceived: z.enum(['yes', 'no']).optional(),
    vehicleRegistered: z.enum(['yes', 'no']).optional(),
    rcReceived: z.enum(['yes', 'no']).optional(),
    vahanVerified: z.enum(['yes', 'no']).optional(),

    /* Other */
    inspectionDate: optionalString,
    inspectionPlace: optionalString,
    inspectionPlaceName: optionalString,
    inspectorName: optionalString,
    inspectorDesignation: optionalString,
    inspectorBranch: optionalString,

    emiMandateDate: optionalString,
    repaymentRegular: z.enum(['yes', 'no']),
    irregularityReason: optionalString,
    recoverySteps: optionalString,
    seizureInitiated: z.enum(['yes', 'no']),
    seizureStatus: optionalString,
    otherDeficiencies: optionalString,
    briefRemarks: optionalString,
    inspectorEmployeeId: z
      .string()
      .trim()
      .min(1, 'Inspector employee ID is required'),
  })
  .superRefine((data, ctx) => {
    // 1. Residence Conditional Validation
    if (data.residenceVisited === 'yes') {
      if (!data.residenceAddress?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Residence address is required',
          path: ['residenceAddress'],
        })
      }
      if (!data.residenceObservations?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Residence observations are required',
          path: ['residenceObservations'],
        })
      }
    }

    // 2. Salary Conditional Validation
    if (
      data.salaryApplicable === 'yes' &&
      data.salaryCreditedRegularly === 'no'
    ) {
      if (!data.salaryNotPaidReason?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason is required',
          path: ['salaryNotPaidReason'],
        })
      }
      if (!data.expectedSalaryPaymentDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected salary date is required',
          path: ['expectedSalaryPaymentDate'],
        })
      }
    }

    // 3. Business / Tenant Conditional Validation
    if (
      data.businessApplicable === 'yes' &&
      data.tenantStillOccupying === 'no'
    ) {
      if (!data.tenantVacatedDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vacated date is required',
          path: ['tenantVacatedDate'],
        })
      }
      if (!data.tenantVacationReason?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason is required',
          path: ['tenantVacationReason'],
        })
      }
    }

    // 4. Repayment Conditional Validation
    if (data.repaymentRegular === 'no') {
      if (!data.irregularityReason?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Irregularity reason is required',
          path: ['irregularityReason'],
        })
      }
    }

    // 5. Seizure Conditional Validation
    if (data.seizureInitiated === 'yes') {
      if (!data.seizureStatus?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seizure status is required',
          path: ['seizureStatus'],
        })
      }
    }

    // 6. Security / Vehicle Conditional Validation
    if (data.securityDetails === 'yes') {
      if (!data.vehicleMake?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vehicle make is required',
          path: ['vehicleMake'],
        })
      }
      if (!data.vehicleModel?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vehicle model is required',
          path: ['vehicleModel'],
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

// Moved outside to prevent re-renders losing focus/state
const YesNoRadio = ({
  value,
  onChange,
}: {
  value: YesNo | undefined
  onChange: (v: YesNo) => void
}) => (
  <div className='flex items-center gap-6'>
    <label className='flex items-center gap-2'>
      <input
        type='radio'
        value='yes'
        checked={value === 'yes'}
        onChange={() => onChange('yes')}
      />
      Yes
    </label>
    <label className='flex items-center gap-2'>
      <input
        type='radio'
        value='no'
        checked={value === 'no'}
        onChange={() => onChange('no')}
      />
      No
    </label>
  </div>
)

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  accountId: string
  onSuccess: () => void
}

const NewPSegmentDialog: React.FC<Props> = ({
  open,
  setOpen,
  accountId,
  onSuccess,
}) => {
  const { data: customerDetail } = useAccountDetails(accountId)

  // Initialize form with Zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      createDateTime: nowLocal(),
      followUpType: '',

      borrowerAddress: '',
      mobileNumber: '',
      loanAmount: '',
      dateOfSanction: '',
      loanPurpose: '',
      loanTenure: '',
      emiAmount: '',

      residenceVisited: 'no',
      residenceAddress: '',
      residenceObservations: '',
      residenceGeoLocation: '',

      borrowerLocatedAtResidence: 'no',
      neighbourFeedback: '',
      newResidenceAddress: '',
      borrowerAttendedCall: 'no',
      borrowerWhereaboutsFeedback: '',

      workingInSameOrganization: 'yes',
      employerAddressChanged: 'no',
      newEmployerAddress: '',
      newEmployerContactNumber: '',
      employmentStatus: '',
      employmentStatusDate: '',
      transferredOfficeAddress: '',
      transferredOfficeContact: '',

      salaryApplicable: 'no',
      salaryCreditedRegularly: 'no',
      salaryNotPaidReason: '',
      expectedSalaryPaymentDate: '',

      businessApplicable: 'no',
      businessClosedOrShiftedDate: '',
      newBusinessAddress: '',
      newBusinessContactNumber: '',
      tenantStillOccupying: 'no',
      tenantVacatedDate: '',
      tenantVacationReason: '',
      pensionReceivedBySpouse: 'no',
      loanRepaidFromPension: 'no',

      outstandingAmount: '',
      irregularAmount: '',
      dateOfIrregularity: '',
      iracStatus: '',

      securityDetails: 'no',
      vehicleMake: '',
      vehicleModel: '',
      engineNumber: '',
      chassisNumber: '',
      vehicleDescriptionMatches: 'no',
      engineChassisVerified: 'no',
      vehiclePhotographTaken: 'no',
      vehicleConditionGood: 'no',
      deliveryNoteReceived: 'no',
      taxInvoiceReceived: 'no',
      insurancePolicyReceived: 'no',
      roadTaxReceiptReceived: 'no',
      registrationChargesReceived: 'no',
      vehicleRegistered: 'no',
      rcReceived: 'no',
      vahanVerified: 'no',

      inspectionDate: nowLocal(),
      inspectionPlace: '',
      inspectionPlaceName: '',
      inspectorName: '',
      inspectorDesignation: '',
      inspectorBranch: '',

      emiMandateDate: '',
      repaymentRegular: 'yes',
      irregularityReason: '',
      recoverySteps: '',
      seizureInitiated: 'no',
      seizureStatus: '',
      otherDeficiencies: '',
      briefRemarks: '',
      inspectorEmployeeId: '',
    },
    mode: 'onSubmit',
  })

  const { watch, reset } = form
  const {
    formState: { isSubmitting },
  } = form

  useEffect(() => {
    if (!open) return
    if (!customerDetail) return

    reset((prev) => ({
      ...prev,

      // ---- from customerDetail ----
      name: customerDetail.custName ?? prev.name,
      mobileNumber: customerDetail.telNo ?? prev.mobileNumber,

      borrowerAddress:
        joinAddress(
          customerDetail.add1,
          customerDetail.add2,
          customerDetail.add3,
          customerDetail.add4
        ) || prev.borrowerAddress,

      loanAmount:
        customerDetail.loanLimit !== undefined &&
        customerDetail.loanLimit !== null
          ? String(customerDetail.loanLimit)
          : prev.loanAmount,

      loanPurpose:
        customerDetail.acctDesc !== undefined &&
        customerDetail.acctDesc !== null
          ? String(customerDetail.acctDesc)
          : prev.loanPurpose,

      emiAmount:
        customerDetail.instalAmt !== undefined &&
        customerDetail.instalAmt !== null
          ? String(customerDetail.instalAmt)
          : prev.emiAmount,

      outstandingAmount:
        customerDetail.outstand !== undefined &&
        customerDetail.outstand !== null
          ? String(customerDetail.outstand)
          : prev.outstandingAmount,

      irregularAmount:
        customerDetail.irregAmt !== undefined &&
        customerDetail.irregAmt !== null
          ? String(customerDetail.irregAmt)
          : prev.irregularAmount,

      dateOfSanction: customerDetail.sanctDt
        ? toLocalDT(customerDetail.sanctDt)
        : prev.dateOfSanction,

      dateOfIrregularity: customerDetail.irrgDt
        ? toLocalDT(customerDetail.irrgDt)
        : prev.dateOfIrregularity,
    }))
  }, [open, customerDetail, reset])

  /* toggles */
  const residenceVisited = watch('residenceVisited')
  const salaryApplicable = watch('salaryApplicable')
  const salaryCreditedRegularly = watch('salaryCreditedRegularly')
  const businessApplicable = watch('businessApplicable')
  const tenantStillOccupying = watch('tenantStillOccupying')
  const employerAddressChanged = watch('employerAddressChanged')
  const repaymentRegular = watch('repaymentRegular')
  const seizureInitiated = watch('seizureInitiated')
  const securityDetails = watch('securityDetails')

  /* images (residence only) */
  const [resImages, setResImages] = useState<string[]>([])
  const uploadResidenceMutation = $api.useMutation(
    'post',
    '/Psegement_inspections/uploadResidenceImages'
  )

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))
    try {
      await uploadResidenceMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: { query: undefined as unknown as { files: string[] } },
      })
      setResImages((prev) => [...prev, ...Array.from(files).map((f) => f.name)])
      toast.success(`${files.length} image(s) uploaded`)
    } catch {
      toast.error('Could not upload images')
    }
  }

  /* create */
  const createMutation = $api.useMutation(
    'post',
    '/Psegement_inspections/create',
    {
      onSuccess: () => {
        onSuccess()
        toast.success('P-Segment inspection created')
        setOpen(false)
      },
      onError: () => toast.error('Could not create inspection'),
    }
  )

  const onSubmit = async (v: FormValues) => {
    await createMutation.mutateAsync({
      params: { header: { Authorization: '' } },
      body: {
        accountNumber: accountId,

        name: asStringOrUndef(v.name),
        followUpType: asStringOrUndef(v.followUpType),
        createDateTime: toISO(v.createDateTime),

        /* borrower / loan */
        borrowerAddress: asStringOrUndef(v.borrowerAddress),
        mobileNumber: asStringOrUndef(v.mobileNumber),
        loanAmount: asNumber(v.loanAmount),
        dateOfSanction: toISO(v.dateOfSanction),
        loanPurpose: asStringOrUndef(v.loanPurpose),
        loanTenure: asNumber(v.loanTenure),
        emiAmount: asNumber(v.emiAmount),

        /* residence */
        residenceVisited: v.residenceVisited,
        residenceAddress:
          v.residenceVisited === 'yes'
            ? asStringOrUndef(v.residenceAddress)
            : undefined,
        residenceObservations:
          v.residenceVisited === 'yes'
            ? asStringOrUndef(v.residenceObservations)
            : undefined,
        residenceGeoLocation:
          v.residenceVisited === 'yes'
            ? asStringOrUndef(v.residenceGeoLocation)
            : undefined,
        residenceImages: v.residenceVisited === 'yes' ? resImages : [],

        /* inspection observations */
        borrowerLocatedAtResidence: ynToBool(v.borrowerLocatedAtResidence),
        neighbourFeedback: asStringOrUndef(v.neighbourFeedback),
        newResidenceAddress: asStringOrUndef(v.newResidenceAddress),
        borrowerAttendedCall: ynToBool(v.borrowerAttendedCall),
        borrowerWhereaboutsFeedback: asStringOrUndef(
          v.borrowerWhereaboutsFeedback
        ),

        /* employment */
        workingInSameOrganization: ynToBool(v.workingInSameOrganization),
        employerAddressChanged: ynToBool(v.employerAddressChanged),
        newEmployerAddress:
          v.employerAddressChanged === 'yes'
            ? asStringOrUndef(v.newEmployerAddress)
            : undefined,
        newEmployerContactNumber:
          v.employerAddressChanged === 'yes'
            ? asStringOrUndef(v.newEmployerContactNumber)
            : undefined,
        employmentStatus: asStringOrUndef(v.employmentStatus),
        employmentStatusDate: toISO(v.employmentStatusDate),
        transferredOfficeAddress: asStringOrUndef(v.transferredOfficeAddress),
        transferredOfficeContact: asStringOrUndef(v.transferredOfficeContact),

        /* salary */
        salaryApplicable: ynToBool(v.salaryApplicable),
        salaryCreditedRegularly:
          v.salaryApplicable === 'yes'
            ? ynToBool(v.salaryCreditedRegularly as YesNo)
            : undefined,
        salaryNotPaidReason:
          v.salaryApplicable === 'yes' && v.salaryCreditedRegularly === 'no'
            ? asStringOrUndef(v.salaryNotPaidReason)
            : undefined,
        expectedSalaryPaymentDate:
          v.salaryApplicable === 'yes' && v.salaryCreditedRegularly === 'no'
            ? toISO(v.expectedSalaryPaymentDate)
            : undefined,

        /* business */
        businessApplicable: ynToBool(v.businessApplicable),
        businessClosedOrShiftedDate:
          v.businessApplicable === 'yes'
            ? toISO(v.businessClosedOrShiftedDate)
            : undefined,
        newBusinessAddress:
          v.businessApplicable === 'yes'
            ? asStringOrUndef(v.newBusinessAddress)
            : undefined,
        newBusinessContactNumber:
          v.businessApplicable === 'yes'
            ? asStringOrUndef(v.newBusinessContactNumber)
            : undefined,

        tenantStillOccupying: ynToBool(v.tenantStillOccupying),
        tenantVacatedDate:
          v.businessApplicable === 'yes' && v.tenantStillOccupying === 'no'
            ? toISO(v.tenantVacatedDate)
            : undefined,
        tenantVacationReason:
          v.businessApplicable === 'yes' && v.tenantStillOccupying === 'no'
            ? asStringOrUndef(v.tenantVacationReason)
            : undefined,
        pensionReceivedBySpouse: ynToBool(v.pensionReceivedBySpouse),
        loanRepaidFromPension: ynToBool(v.loanRepaidFromPension),

        /* account position */
        outstandingAmount: asNumber(v.outstandingAmount),
        irregularAmount: asNumber(v.irregularAmount),
        dateOfIrregularity: toISO(v.dateOfIrregularity),
        iracStatus: asStringOrUndef(v.iracStatus),

        /* security */
        securityDetails: ynToBool(v.securityDetails),
        vehicleMake:
          v.securityDetails === 'yes'
            ? asStringOrUndef(v.vehicleMake)
            : undefined,
        vehicleModel:
          v.securityDetails === 'yes'
            ? asStringOrUndef(v.vehicleModel)
            : undefined,
        engineNumber:
          v.securityDetails === 'yes'
            ? asStringOrUndef(v.engineNumber)
            : undefined,
        chassisNumber:
          v.securityDetails === 'yes'
            ? asStringOrUndef(v.chassisNumber)
            : undefined,

        vehicleDescriptionMatches:
          v.securityDetails === 'yes'
            ? ynToBool(v.vehicleDescriptionMatches as YesNo)
            : undefined,
        engineChassisVerified:
          v.securityDetails === 'yes'
            ? ynToBool(v.engineChassisVerified as YesNo)
            : undefined,
        vehiclePhotographTaken:
          v.securityDetails === 'yes'
            ? ynToBool(v.vehiclePhotographTaken as YesNo)
            : undefined,
        vehicleConditionGood:
          v.securityDetails === 'yes'
            ? ynToBool(v.vehicleConditionGood as YesNo)
            : undefined,

        deliveryNoteReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.deliveryNoteReceived as YesNo)
            : undefined,
        taxInvoiceReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.taxInvoiceReceived as YesNo)
            : undefined,
        insurancePolicyReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.insurancePolicyReceived as YesNo)
            : undefined,
        roadTaxReceiptReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.roadTaxReceiptReceived as YesNo)
            : undefined,
        registrationChargesReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.registrationChargesReceived as YesNo)
            : undefined,
        vehicleRegistered:
          v.securityDetails === 'yes'
            ? ynToBool(v.vehicleRegistered as YesNo)
            : undefined,
        rcReceived:
          v.securityDetails === 'yes'
            ? ynToBool(v.rcReceived as YesNo)
            : undefined,
        vahanVerified:
          v.securityDetails === 'yes'
            ? ynToBool(v.vahanVerified as YesNo)
            : undefined,

        /* other */
        inspectionDate: toISO(v.inspectionDate),
        inspectionPlace: asStringOrUndef(v.inspectionPlace),
        inspectionPlaceName: asStringOrUndef(v.inspectionPlaceName),
        inspectorName: asStringOrUndef(v.inspectorName),
        inspectorDesignation: asStringOrUndef(v.inspectorDesignation),
        inspectorBranch: asStringOrUndef(v.inspectorBranch),

        emiMandateDate: toISO(v.emiMandateDate),
        repaymentRegular: ynToBool(v.repaymentRegular),
        irregularityReason:
          v.repaymentRegular === 'no'
            ? asStringOrUndef(v.irregularityReason)
            : undefined,
        recoverySteps:
          v.repaymentRegular === 'no'
            ? asStringOrUndef(v.recoverySteps)
            : undefined,

        seizureInitiated: ynToBool(v.seizureInitiated),
        seizureStatus:
          v.seizureInitiated === 'yes'
            ? asStringOrUndef(v.seizureStatus)
            : undefined,

        otherDeficiencies: asStringOrUndef(v.otherDeficiencies),
        briefRemarks: asStringOrUndef(v.briefRemarks),

        /* defaults */
        isActive: true,
        workPlaceImages: [],

        inspectorEmployeeId: asStringOrUndef(v.inspectorEmployeeId),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] min-w-5xl overflow-y-auto'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <DialogHeader>
              <DialogTitle>New Retail Inspection</DialogTitle>
              <DialogDescription>
                Workplace removed. Fields show/hide and become required based on
                toggles.
              </DialogDescription>
            </DialogHeader>

            {/* Borrower Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Name of borrower'
                      {...field}
                      readOnly={Boolean(field.value?.trim())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='createDateTime'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time of Visit</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Borrower / Loan */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Borrower / Loan
              </legend>

              <FormField
                control={form.control}
                name='borrowerAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Borrower Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Borrower address' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='mobileNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='10-digit mobile no'
                          type='number'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='dateOfSanction'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Sanction</FormLabel>
                      <FormControl>
                        <Input type='datetime-local' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='loanAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='emiAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMI Amount</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='loanTenure'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Tenure (Months)</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='loanPurpose'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Purpose</FormLabel>
                      <FormControl>
                        <Input placeholder='Purpose' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='followUpType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='FOLLOWUP / VISIT / CALL…'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            {/* Residence */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>Residence</legend>

              <FormField
                control={form.control}
                name='residenceVisited'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residence Visited?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {residenceVisited === 'yes' && (
                <>
                  <FormField
                    control={form.control}
                    name='residenceAddress'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residence Address</FormLabel>
                        <FormControl>
                          <Input placeholder='Residence address' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='residenceObservations'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residence Observations</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Observations…' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='residenceGeoLocation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residence Geo Location</FormLabel>
                        <FormControl>
                          <Input placeholder='Latitude, Longitude' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>
                      Residence Images
                    </Label>
                    <Input
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={(e) => uploadImages(e.target.files)}
                    />

                    {resImages.length > 0 && (
                      <ul className='space-y-1'>
                        {resImages.map((name, i) => (
                          <li
                            key={i}
                            className='bg-muted flex items-center justify-between rounded px-3 py-1 text-sm'
                          >
                            <span className='max-w-50 truncate'>{name}</span>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              onClick={() =>
                                setResImages((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                )
                              }
                            >
                              ✕
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='borrowerLocatedAtResidence'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrower located at residence?</FormLabel>
                      <FormControl>
                        <YesNoRadio
                          value={field.value as YesNo}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='borrowerAttendedCall'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrower attended call?</FormLabel>
                      <FormControl>
                        <YesNoRadio
                          value={field.value as YesNo}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='neighbourFeedback'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neighbour feedback</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Neighbour feedback…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='borrowerWhereaboutsFeedback'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Borrower whereabouts feedback</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Whereabouts…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='newResidenceAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New residence address (if shifted)</FormLabel>
                    <FormControl>
                      <Textarea placeholder='New address…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </fieldset>

            {/* Salary */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Salary / EMI
              </legend>

              <FormField
                control={form.control}
                name='salaryApplicable'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary applicable?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {salaryApplicable === 'yes' && (
                <>
                  <FormField
                    control={form.control}
                    name='salaryCreditedRegularly'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Salary credited regularly & EMI recovered?
                        </FormLabel>
                        <FormControl>
                          <YesNoRadio
                            value={field.value as YesNo}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {salaryCreditedRegularly === 'no' && (
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='salaryNotPaidReason'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for salary not paid</FormLabel>
                            <FormControl>
                              <Input placeholder='Reason' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='expectedSalaryPaymentDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected salary payment date</FormLabel>
                            <FormControl>
                              <Input type='datetime-local' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Employment details handled if Employer Address Changed is 'yes' */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='employerAddressChanged'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Address Changed?</FormLabel>
                      <FormControl>
                        <YesNoRadio
                          value={field.value as YesNo}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {employerAddressChanged === 'yes' && (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='newEmployerAddress'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Employer Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder='New address...' {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='newEmployerContactNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Employer Contact</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='10-digit number'
                            type='number'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </fieldset>

            {/* Business */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Business / Rent / Pension
              </legend>

              <FormField
                control={form.control}
                name='businessApplicable'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business applicable?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {businessApplicable === 'yes' && (
                <>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='businessClosedOrShiftedDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business closed / shifted date</FormLabel>
                          <FormControl>
                            <Input type='datetime-local' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='newBusinessContactNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New business contact number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='10-digit number'
                              type='number'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='newBusinessAddress'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New business address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='New business address'
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='tenantStillOccupying'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant still occupying?</FormLabel>
                        <FormControl>
                          <YesNoRadio
                            value={field.value as YesNo}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {tenantStillOccupying === 'no' && (
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='tenantVacatedDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant vacated date</FormLabel>
                            <FormControl>
                              <Input type='datetime-local' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='tenantVacationReason'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant vacation reason</FormLabel>
                            <FormControl>
                              <Input placeholder='Reason' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </>
              )}

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='pensionReceivedBySpouse'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pension received by spouse?</FormLabel>
                      <FormControl>
                        <YesNoRadio
                          value={field.value as YesNo}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='loanRepaidFromPension'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan repaid from pension?</FormLabel>
                      <FormControl>
                        <YesNoRadio
                          value={field.value as YesNo}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            {/* Account Position */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Account Position
              </legend>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='outstandingAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outstanding Amount</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='irregularAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Irregular Amount</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='dateOfIrregularity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Irregularity</FormLabel>
                      <FormControl>
                        <Input type='datetime-local' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='iracStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRAC Status</FormLabel>
                      <FormControl>
                        <Input placeholder='Standard / SMA / NPA…' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            {/* Other Observations */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Other Observations
              </legend>

              <FormField
                control={form.control}
                name='repaymentRegular'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repayment regular?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {repaymentRegular === 'no' && (
                <>
                  <FormField
                    control={form.control}
                    name='irregularityReason'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Irregularity Reason</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Reason…' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='recoverySteps'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recovery Steps</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Steps taken…' {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name='seizureInitiated'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seizure initiated?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {seizureInitiated === 'yes' && (
                <FormField
                  control={form.control}
                  name='seizureStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seizure Status</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Initiated / Pending / Completed…'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='briefRemarks'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Remarks…' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </fieldset>

            {/* Security */}
            <fieldset className='space-y-4 rounded-lg border p-4'>
              <legend className='text-primary font-semibold'>
                Security / Vehicle
              </legend>

              <FormField
                control={form.control}
                name='securityDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security details present?</FormLabel>
                    <FormControl>
                      <YesNoRadio
                        value={field.value as YesNo}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {securityDetails === 'yes' && (
                <>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='vehicleMake'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Make</FormLabel>
                          <FormControl>
                            <Input placeholder='Make' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='vehicleModel'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input placeholder='Model' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='engineNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engine Number</FormLabel>
                          <FormControl>
                            <Input placeholder='Engine no' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='chassisNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chassis Number</FormLabel>
                          <FormControl>
                            <Input placeholder='Chassis no' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label>Vehicle description matches?</Label>
                      <FormField
                        control={form.control}
                        name='vehicleDescriptionMatches'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <YesNoRadio
                                value={field.value as YesNo}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Engine/Chassis verified?</Label>
                      <FormField
                        control={form.control}
                        name='engineChassisVerified'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <YesNoRadio
                                value={field.value as YesNo}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </fieldset>

            <FormField
              control={form.control}
              name='inspectorEmployeeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder='Inspector Employee ID' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Create Inspection'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewPSegmentDialog
