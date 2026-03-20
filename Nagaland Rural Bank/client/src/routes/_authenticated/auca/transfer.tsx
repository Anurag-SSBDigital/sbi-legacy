// import React, { useEffect, useState } from 'react'
// import { z } from 'zod'
// import { useForm, useWatch, useFieldArray, Controller } from 'react-hook-form'
// import { createFileRoute, useRouter } from '@tanstack/react-router'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { toastError } from '@/lib/utils'
// import { Button } from '@/components/ui/button'
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
//   CardFooter,
// } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from '@/components/ui/select'
// import { Separator } from '@/components/ui/separator'
// import { Textarea } from '@/components/ui/textarea'
// import { Header } from '@/components/layout/header'
// import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
// import { ThemeSwitch } from '@/components/theme-switch'
// // ✅ Change route if you want to replace your existing page
// export const Route = createFileRoute('/_authenticated/auca/transfer')({
//   component: RouteComponent,
// })
// /* =============================
//    Transfer to PB — Form (JSON-backed UI)
//    UI values are nested under proposal, but API payload is FLATTENED
// ============================= */
// const DebitRowSchema = z.object({
//   date: z.string().min(1, 'Required'),
//   amount: z.string().min(1, 'Required'),
//   remarks: z.string().optional(),
// })
// const FormSchema = z.object({
//   branchName: z.string().optional(),
//   branchCode: z.string().optional(),
//   proposal: z.object({
//     segment: z.string().min(1, 'Required'),
//     firmName: z.string().min(1, 'Required'),
//     borrowerName: z.string().min(1, 'Required'),
//     loanPurpose: z.string().min(1, 'Required'),
//     loanType: z.string().min(1, 'Required'),
//     schemeType: z.string().min(1, 'Required'),
//     loanSanctionDate: z.string().min(1, 'Required'),
//     limitTTT: z.string().min(1, 'Required'),
//     loanSanctionAmt: z.string().min(1, 'Required'),
//     sanctioningAuth: z.string().min(1, 'Required'),
//     recallDate: z.string().min(1, 'Required'),
//     controllingAuthorityRefNo: z.string().min(1, 'Required'),
//     transferToPbDate: z.string().min(1, 'Required'),
//     transferredAmountToPb: z.string().min(1, 'Required'),
//     recoveryMadeIncludingSubsidy: z.string().min(1, 'Required'),
//     subsequentDebitsToPb: z.array(DebitRowSchema).default([]),
//     suitFiled: z.enum(['true', 'false']).default('false'),
//     suitDate: z.string().optional(),
//     suitPresentPosition: z.string().optional(),
//     hearingDate: z.string().optional(),
//     executionDate: z.string().optional(),
//     documentPosition: z.string().min(1, 'Required'),
//     provisionDate: z.string().min(1, 'Required'),
//     provisionAsOnT1: z.string().min(1, 'Required'),
//     provisionAvailable: z.string().min(1, 'Required'),
//     outstandingAmt: z.string().min(1, 'Required'),
//     eligibleForDicgcOldScheme: z.enum(['true', 'false']).default('false'),
//     dicgcReceivableOrRetainable: z.string().min(1, 'Required'),
//     incAsOnDate: z.string().min(1, 'Required'),
//     amountHeldInIncAsOn: z.string().min(1, 'Required'),
//     additionalInterestUptoWriteoff: z.string().min(1, 'Required'),
//     unrealizedInterestAsOnDate: z.string().min(1, 'Required'),
//     unrealizedInterestPrevYearAsOn: z.string().min(1, 'Required'),
//     securityDetails: z.string().min(1, 'Required'),
//     recommendationDetails: z.string().min(1, 'Required'),
//   }),
// })
// export type FormValues = z.infer<typeof FormSchema>
// function Field(props: {
//   label: string
//   htmlFor: string
//   children: React.ReactNode
//   hint?: string
// }) {
//   const { label, htmlFor, children, hint } = props
//   return (
//     <div className='grid gap-1.5'>
//       <Label htmlFor={htmlFor}>{label}</Label>
//       {children}
//       {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
//     </div>
//   )
// }
// const toNumberOrUndefined = (value?: string): number | undefined => {
//   if (value === undefined || value === null) return undefined
//   const trimmed = String(value).trim()
//   if (!trimmed) return undefined
//   const n = Number(trimmed.replace(/,/g, ''))
//   if (Number.isNaN(n)) return undefined
//   return n
// }
// const toNumberOrZero = (value?: string): number => {
//   const n = toNumberOrUndefined(value)
//   return n ?? 0
// }
// const todayYMD = (): string => {
//   const d = new Date()
//   const year = d.getFullYear()
//   const month = String(d.getMonth() + 1).padStart(2, '0')
//   const day = String(d.getDate()).padStart(2, '0')
//   return `${year}-${month}-${day}`
// }
// function RouteComponent() {
//   const router = useRouter()
//   const search = Route.useSearch() as { acctNo?: string }
//   const acctNoFromSearch = search?.acctNo
//   const [prefillLoading, setPrefillLoading] = useState(false)
//   const form = useForm<FormValues>({
//     defaultValues: {
//       branchName: '',
//       branchCode: '',
//       proposal: {
//         segment: 'MSME',
//         firmName: '',
//         borrowerName: '',
//         loanPurpose: '',
//         loanType: '',
//         schemeType: '',
//         loanSanctionDate: '',
//         limitTTT: '',
//         loanSanctionAmt: '',
//         sanctioningAuth: '',
//         recallDate: '',
//         controllingAuthorityRefNo: '',
//         transferToPbDate: '',
//         transferredAmountToPb: '',
//         recoveryMadeIncludingSubsidy: '',
//         subsequentDebitsToPb: [],
//         suitFiled: 'false',
//         suitDate: '',
//         suitPresentPosition: '',
//         hearingDate: '',
//         executionDate: '',
//         documentPosition: '',
//         provisionDate: '',
//         provisionAsOnT1: '',
//         provisionAvailable: '',
//         outstandingAmt: '',
//         eligibleForDicgcOldScheme: 'false',
//         dicgcReceivableOrRetainable: '0',
//         incAsOnDate: '',
//         amountHeldInIncAsOn: '0',
//         additionalInterestUptoWriteoff: '0',
//         unrealizedInterestAsOnDate: '',
//         unrealizedInterestPrevYearAsOn: '0',
//         securityDetails: '',
//         recommendationDetails: '',
//       },
//     },
//   })
//   // ✅ FIX 1: useFieldArray for fast & correct add/remove re-render
//   const {
//     fields: debitFields,
//     append: appendDebit,
//     remove: removeDebit,
//   } = useFieldArray({
//     control: form.control,
//     name: 'proposal.subsequentDebitsToPb',
//   })
//   const handleReset = () => {
//     form.reset({
//       branchName: form.getValues('branchName') ?? '',
//       branchCode: form.getValues('branchCode') ?? '',
//       proposal: {
//         ...form.getValues('proposal'),
//         firmName: '',
//         borrowerName: '',
//         loanPurpose: '',
//         loanType: '',
//         schemeType: '',
//         loanSanctionDate: '',
//         limitTTT: '',
//         loanSanctionAmt: '',
//         sanctioningAuth: '',
//         recallDate: '',
//         controllingAuthorityRefNo: '',
//         transferToPbDate: '',
//         transferredAmountToPb: '',
//         recoveryMadeIncludingSubsidy: '',
//         subsequentDebitsToPb: [],
//         // keep suitFiled toggle, clear details
//         suitDate: '',
//         suitPresentPosition: '',
//         hearingDate: '',
//         executionDate: '',
//         documentPosition: '',
//         provisionDate: '',
//         provisionAsOnT1: '',
//         provisionAvailable: '',
//         outstandingAmt: '',
//         dicgcReceivableOrRetainable: '0',
//         incAsOnDate: '',
//         amountHeldInIncAsOn: '0',
//         additionalInterestUptoWriteoff: '0',
//         unrealizedInterestAsOnDate: '',
//         unrealizedInterestPrevYearAsOn: '0',
//         securityDetails: '',
//         recommendationDetails: '',
//       },
//     })
//   }
//   const addDebitRow = () => {
//     appendDebit({ date: todayYMD(), amount: '0', remarks: '' })
//   }
//   const removeDebitRow = (idx: number) => {
//     removeDebit(idx)
//   }
//   // Watch suitFiled for enable/disable + auto-clear
//   const suitFiled = useWatch({
//     control: form.control,
//     name: 'proposal.suitFiled',
//   })
//   const suitEnabled = suitFiled === 'true'
//   useEffect(() => {
//     if (!suitEnabled) {
//       form.setValue('proposal.suitDate', '', { shouldDirty: true })
//       form.setValue('proposal.suitPresentPosition', '', { shouldDirty: true })
//       form.setValue('proposal.hearingDate', '', { shouldDirty: true })
//       form.setValue('proposal.executionDate', '', { shouldDirty: true })
//     }
//   }, [suitEnabled, form])
//   // Branch info (same style as your reference)
//   const { data: branchDepartmentInfo, isLoading: branchDepartmentInfoLoading } =
//     $api.useQuery('get', '/branches/{accountNumber}/branch-department-info', {
//       params: { path: { accountNumber: acctNoFromSearch ?? '' } },
//     })
//   useEffect(() => {
//     if (!acctNoFromSearch) return
//     if (!branchDepartmentInfo) return
//     form.setValue('branchCode', branchDepartmentInfo?.branchCode ?? '', {
//       shouldDirty: false,
//     })
//     form.setValue('branchName', branchDepartmentInfo?.branchName ?? '', {
//       shouldDirty: false,
//     })
//   }, [acctNoFromSearch, branchDepartmentInfo, form])
//   // CREATE (API endpoint kept as-is)
//   const createTransferMutation = $api.useMutation(
//     'post',
//     '/auca-transfer/create',
//     {
//       onSuccess: () => {
//         toast.success('Transfer proposal created successfully!')
//         handleReset()
//         router.navigate({ to: '/auca/eligible' })
//       },
//       onError: (error) =>
//         toastError(error, 'Could not create transfer proposal.'),
//     }
//   )
//   // PREFILL (same as reference)
//   const { mutate: fetchAucaDetails } = $api.useMutation(
//     'get',
//     '/auca-transfer/AucaEligible/{acctNo}'
//   )
//   useEffect(() => {
//     if (!acctNoFromSearch) return
//     setPrefillLoading(true)
//     fetchAucaDetails(
//       { params: { path: { acctNo: acctNoFromSearch } } },
//       {
//         onSuccess: (res) => {
//           setPrefillLoading(false)
//           const body = res
//           if (!body?.data) {
//             toast.error('No details found for this account')
//             return
//           }
//           const d = body.data
//           form.reset({
//             branchName: form.getValues('branchName') ?? '',
//             branchCode: form.getValues('branchCode') ?? '',
//             proposal: {
//               ...form.getValues('proposal'),
//               borrowerName: d.custName ?? '',
//               firmName: d.custName ?? '',
//               loanPurpose: d.acctDesc ?? '',
//               loanSanctionDate: d.sanctDt ?? '',
//               limitTTT:
//                 d.loanLimit !== undefined && d.loanLimit !== null
//                   ? String(d.loanLimit)
//                   : '',
//               loanSanctionAmt:
//                 d.loanLimit !== undefined && d.loanLimit !== null
//                   ? String(d.loanLimit)
//                   : '',
//               outstandingAmt:
//                 d.outstand !== undefined && d.outstand !== null
//                   ? String(d.outstand)
//                   : '',
//             },
//           })
//         },
//         onError: () => {
//           setPrefillLoading(false)
//           toast.error('Failed to prefill details from account')
//         },
//       }
//     )
//   }, [acctNoFromSearch, fetchAucaDetails, form])
//   const onSubmit = (values: FormValues) => {
//     const p = values.proposal
//     // basic guard (prevents “Yes” but empty suit date confusion)
//     if (p.suitFiled === 'true' && !p.suitDate) {
//       toast.error('Suit Date is required when Suit Filed = Yes')
//       return
//     }
//     const subsequentDebitsToPbJson = JSON.stringify(
//       (p.subsequentDebitsToPb ?? []).map((r) => ({
//         date: r.date,
//         amount: toNumberOrZero(r.amount),
//         remarks: (r.remarks ?? '').trim(),
//       }))
//     )
//     // ✅ IMPORTANT: send FLAT body (no "proposal" wrapper) to avoid TS + schema mismatch
//     const payload = {
//       bankType: 'NRB',
//       formType: 'UTG_FORM', // change if needed
//       // proposalFor: 'TRANSFER_TO_PB', // only if your schema has it
//       branchName: values.branchName?.trim() || undefined,
//       branchCode: values.branchCode?.trim() || undefined,
//       segment: p.segment.trim(),
//       firmName: p.firmName.trim(),
//       borrowerName: p.borrowerName.trim(),
//       loanPurpose: p.loanPurpose.trim(),
//       loanType: p.loanType.trim(),
//       schemeType: p.schemeType.trim(),
//       loanSanctionDate: p.loanSanctionDate,
//       limitTTT: toNumberOrZero(p.limitTTT),
//       loanSanctionAmt: toNumberOrZero(p.loanSanctionAmt),
//       sanctioningAuth: p.sanctioningAuth.trim(),
//       recallDate: p.recallDate,
//       controllingAuthorityRefNo: p.controllingAuthorityRefNo.trim(),
//       transferToPbDate: p.transferToPbDate,
//       transferredAmountToPb: toNumberOrZero(p.transferredAmountToPb),
//       recoveryMadeIncludingSubsidy: toNumberOrZero(
//         p.recoveryMadeIncludingSubsidy
//       ),
//       subsequentDebitsToPbJson,
//       suitFiled: p.suitFiled === 'true',
//       suitDate: p.suitDate || undefined,
//       suitPresentPosition: p.suitPresentPosition?.trim() || undefined,
//       hearingDate: p.hearingDate || undefined,
//       executionDate: p.executionDate || undefined,
//       documentPosition: p.documentPosition.trim(),
//       provisionDate: p.provisionDate,
//       provisionAsOnT1: toNumberOrZero(p.provisionAsOnT1),
//       provisionAvailable: toNumberOrZero(p.provisionAvailable),
//       outstandingAmt: toNumberOrZero(p.outstandingAmt),
//       eligibleForDicgcOldScheme: p.eligibleForDicgcOldScheme === 'true',
//       dicgcReceivableOrRetainable: toNumberOrZero(
//         p.dicgcReceivableOrRetainable
//       ),
//       incAsOnDate: p.incAsOnDate,
//       amountHeldInIncAsOn: toNumberOrZero(p.amountHeldInIncAsOn),
//       additionalInterestUptoWriteoff: toNumberOrZero(
//         p.additionalInterestUptoWriteoff
//       ),
//       unrealizedInterestAsOnDate: p.unrealizedInterestAsOnDate,
//       unrealizedInterestPrevYearAsOn: toNumberOrZero(
//         p.unrealizedInterestPrevYearAsOn
//       ),
//       securityDetails: p.securityDetails.trim(),
//       recommendationDetails: p.recommendationDetails.trim(),
//     } as any
//     createTransferMutation.mutate({
//       params: {
//         header: {
//           Authorization: '',
//         },
//       },
//       body: payload,
//     })
//   }
//   const isSaving = createTransferMutation.isPending
//   return (
//     <>
//       <Header>
//         <div className='ml-auto flex items-center space-x-4'>
//           <Search />
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header>
//       <div className='p-4'>
//         <div className='flex items-center justify-between'>
//           <div>
//             <h1 className='text-3xl font-bold tracking-tight'>
//               Initiate Transfer to AUCA — Proposal
//             </h1>
//             {acctNoFromSearch && (
//               <p className='text-muted-foreground mt-1 text-xs'>
//                 Prefilling proposal for Account:{' '}
//                 <span className='font-mono font-semibold'>
//                   {acctNoFromSearch}
//                 </span>
//                 {prefillLoading ? ' (loading details...)' : null}
//               </p>
//             )}
//           </div>
//           <Button onClick={() => window.history.back()} className='text-white'>
//             Back
//           </Button>
//         </div>
//         <Separator className='my-6' />
//         <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
//           {/* Branch Info */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Branch Details</CardTitle>
//               <CardDescription>
//                 Auto-filled from account, read-only
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4 md:grid-cols-2'>
//               <Field label='Branch Code' htmlFor='branchCode'>
//                 <Input
//                   id='branchCode'
//                   disabled
//                   placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
//                   {...form.register('branchCode')}
//                 />
//               </Field>
//               <Field label='Branch Name' htmlFor='branchName'>
//                 <Input
//                   id='branchName'
//                   disabled
//                   placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
//                   {...form.register('branchName')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Proposal Basics */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Proposal Basics</CardTitle>
//               <CardDescription>Segment + borrower identity</CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4'>
//               <Field label='Segment' htmlFor='segment'>
//                 <Input
//                   id='segment'
//                   placeholder='MSME'
//                   {...form.register('proposal.segment')}
//                 />
//               </Field>
//               <div className='grid gap-4 md:grid-cols-2'>
//                 <Field label='Firm Name' htmlFor='firmName'>
//                   <Input
//                     id='firmName'
//                     placeholder='ABC TRADERS'
//                     {...form.register('proposal.firmName')}
//                   />
//                 </Field>
//                 <Field label='Borrower Name' htmlFor='borrowerName'>
//                   <Input
//                     id='borrowerName'
//                     placeholder='RAJ KUMAR'
//                     {...form.register('proposal.borrowerName')}
//                   />
//                 </Field>
//               </div>
//               <div className='grid gap-4 md:grid-cols-3'>
//                 <Field label='Loan Purpose' htmlFor='loanPurpose'>
//                   <Input
//                     id='loanPurpose'
//                     placeholder='TRADING'
//                     {...form.register('proposal.loanPurpose')}
//                   />
//                 </Field>
//                 <Field label='Loan Type' htmlFor='loanType'>
//                   <Input
//                     id='loanType'
//                     placeholder='CC'
//                     {...form.register('proposal.loanType')}
//                   />
//                 </Field>
//                 <Field label='Scheme Type' htmlFor='schemeType'>
//                   <Input
//                     id='schemeType'
//                     placeholder='MSME-CC'
//                     {...form.register('proposal.schemeType')}
//                   />
//                 </Field>
//               </div>
//               <Field label='Loan Sanction Date' htmlFor='loanSanctionDate'>
//                 <Input
//                   id='loanSanctionDate'
//                   type='date'
//                   {...form.register('proposal.loanSanctionDate')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Sanction & Limits */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Sanction & Limits</CardTitle>
//               <CardDescription>Amounts in ₹ (numbers only)</CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <Field label='Limit TTT (₹)' htmlFor='limitTTT'>
//                 <Input
//                   id='limitTTT'
//                   inputMode='decimal'
//                   placeholder='500000'
//                   {...form.register('proposal.limitTTT')}
//                 />
//               </Field>
//               <Field label='Loan Sanction Amount (₹)' htmlFor='loanSanctionAmt'>
//                 <Input
//                   id='loanSanctionAmt'
//                   inputMode='decimal'
//                   placeholder='500000'
//                   {...form.register('proposal.loanSanctionAmt')}
//                 />
//               </Field>
//               <Field label='Sanctioning Authority' htmlFor='sanctioningAuth'>
//                 <Input
//                   id='sanctioningAuth'
//                   placeholder='Shri X, Scale-II, Branch Manager'
//                   {...form.register('proposal.sanctioningAuth')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Recall & Transfer */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Recall & Transfer to PB</CardTitle>
//               <CardDescription>
//                 Recall → controlling authority → transfer
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <Field label='Recall Date' htmlFor='recallDate'>
//                 <Input
//                   id='recallDate'
//                   type='date'
//                   {...form.register('proposal.recallDate')}
//                 />
//               </Field>
//               <Field
//                 label='Controlling Authority Ref No.'
//                 htmlFor='controllingAuthorityRefNo'
//               >
//                 <Input
//                   id='controllingAuthorityRefNo'
//                   placeholder='RO/CA/2025/123'
//                   {...form.register('proposal.controllingAuthorityRefNo')}
//                 />
//               </Field>
//               <Field label='Transfer to PB Date' htmlFor='transferToPbDate'>
//                 <Input
//                   id='transferToPbDate'
//                   type='date'
//                   {...form.register('proposal.transferToPbDate')}
//                 />
//               </Field>
//               <Field
//                 label='Transferred Amount to PB (₹)'
//                 htmlFor='transferredAmountToPb'
//               >
//                 <Input
//                   id='transferredAmountToPb'
//                   inputMode='decimal'
//                   placeholder='480000'
//                   {...form.register('proposal.transferredAmountToPb')}
//                 />
//               </Field>
//               <Field
//                 label='Recovery Made incl. Subsidy (₹)'
//                 htmlFor='recoveryMadeIncludingSubsidy'
//               >
//                 <Input
//                   id='recoveryMadeIncludingSubsidy'
//                   inputMode='decimal'
//                   placeholder='25000'
//                   {...form.register('proposal.recoveryMadeIncludingSubsidy')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Subsequent Debits (TABLE STYLE) */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Subsequent Debits to PB</CardTitle>
//               <CardDescription>
//                 These entries will be saved as{' '}
//                 <span className='font-mono'>subsequentDebitsToPbJson</span>
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4'>
//               <div className='flex items-center justify-between'>
//                 <p className='text-muted-foreground text-xs'>
//                   Add date/amount/remarks entries.
//                 </p>
//                 <Button type='button' variant='secondary' onClick={addDebitRow}>
//                   Add Row
//                 </Button>
//               </div>
//               {debitFields.length === 0 ? (
//                 <div className='text-muted-foreground text-sm'>
//                   No debit rows added yet.
//                 </div>
//               ) : (
//                 <div className='overflow-auto rounded-md border'>
//                   {/* Header row */}
//                   <div className='bg-muted/40 text-muted-foreground grid min-w-[780px] grid-cols-12 gap-3 border-b px-4 py-2 text-xs font-medium'>
//                     <div className='col-span-3'>Date</div>
//                     <div className='col-span-3'>Amount (₹)</div>
//                     <div className='col-span-5'>Remarks</div>
//                     <div className='col-span-1 text-right'>Action</div>
//                   </div>
//                   {/* Body rows */}
//                   <div className='divide-y'>
//                     {debitFields.map((row, idx) => (
//                       <div
//                         key={row.id}
//                         className='grid min-w-[780px] grid-cols-12 items-center gap-3 px-4 py-3'
//                       >
//                         {/* Date */}
//                         <div className='col-span-3'>
//                           <Input
//                             type='date'
//                             className='h-9'
//                             {...form.register(
//                               `proposal.subsequentDebitsToPb.${idx}.date` as const
//                             )}
//                           />
//                         </div>
//                         {/* Amount */}
//                         <div className='col-span-3'>
//                           <Input
//                             inputMode='decimal'
//                             placeholder='0'
//                             className='h-9'
//                             {...form.register(
//                               `proposal.subsequentDebitsToPb.${idx}.amount` as const
//                             )}
//                           />
//                         </div>
//                         {/* Remarks */}
//                         <div className='col-span-5'>
//                           <Input
//                             placeholder='Legal notice charges'
//                             className='h-9'
//                             {...form.register(
//                               `proposal.subsequentDebitsToPb.${idx}.remarks` as const
//                             )}
//                           />
//                         </div>
//                         {/* Action */}
//                         <div className='col-span-1 flex justify-end'>
//                           <Button
//                             type='button'
//                             variant='outline'
//                             className='h-9 px-3'
//                             onClick={() => removeDebitRow(idx)}
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//           {/* Suit Details */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Suit / Legal Details</CardTitle>
//               <CardDescription>
//                 Enable suit and capture timeline (if applicable)
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               {/* ✅ FIX 2: Controller for shadcn Select (stable + fast) */}
//               <Controller
//                 control={form.control}
//                 name='proposal.suitFiled'
//                 render={({ field }) => (
//                   <Field label='Suit Filed' htmlFor='suitFiled'>
//                     <Select value={field.value} onValueChange={field.onChange}>
//                       <SelectTrigger id='suitFiled'>
//                         <SelectValue placeholder='Select' />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value='false'>No</SelectItem>
//                         <SelectItem value='true'>Yes</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                 )}
//               />
//               <Field
//                 label='Suit Date'
//                 htmlFor='suitDate'
//                 hint='Required only if Suit Filed = Yes'
//               >
//                 <Input
//                   id='suitDate'
//                   type='date'
//                   disabled={!suitEnabled}
//                   {...form.register('proposal.suitDate')}
//                 />
//               </Field>
//               <Field label='Hearing Date' htmlFor='hearingDate'>
//                 <Input
//                   id='hearingDate'
//                   type='date'
//                   disabled={!suitEnabled}
//                   {...form.register('proposal.hearingDate')}
//                 />
//               </Field>
//               <Field label='Execution Date' htmlFor='executionDate'>
//                 <Input
//                   id='executionDate'
//                   type='date'
//                   disabled={!suitEnabled}
//                   {...form.register('proposal.executionDate')}
//                 />
//               </Field>
//               <div className='md:col-span-2 lg:col-span-2'>
//                 <Field
//                   label='Suit Present Position'
//                   htmlFor='suitPresentPosition'
//                 >
//                   <Textarea
//                     id='suitPresentPosition'
//                     disabled={!suitEnabled}
//                     placeholder='Pending before Civil Judge'
//                     className='min-h-[90px]'
//                     {...form.register('proposal.suitPresentPosition')}
//                   />
//                 </Field>
//               </div>
//             </CardContent>
//           </Card>
//           {/* Documents & Provision */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Documents & Provision</CardTitle>
//               <CardDescription>
//                 Document position + provision snapshot
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <div className='md:col-span-2 lg:col-span-3'>
//                 <Field label='Document Position' htmlFor='documentPosition'>
//                   <Textarea
//                     id='documentPosition'
//                     placeholder='All original documents available and enforceable'
//                     className='min-h-[90px]'
//                     {...form.register('proposal.documentPosition')}
//                   />
//                 </Field>
//               </div>
//               <Field label='Provision Date' htmlFor='provisionDate'>
//                 <Input
//                   id='provisionDate'
//                   type='date'
//                   {...form.register('proposal.provisionDate')}
//                 />
//               </Field>
//               <Field label='Provision As On T1 (₹)' htmlFor='provisionAsOnT1'>
//                 <Input
//                   id='provisionAsOnT1'
//                   inputMode='decimal'
//                   placeholder='120000'
//                   {...form.register('proposal.provisionAsOnT1')}
//                 />
//               </Field>
//               <Field
//                 label='Provision Available (₹)'
//                 htmlFor='provisionAvailable'
//               >
//                 <Input
//                   id='provisionAvailable'
//                   inputMode='decimal'
//                   placeholder='120000'
//                   {...form.register('proposal.provisionAvailable')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Outstanding & DICGC */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Outstanding & DICGC</CardTitle>
//               <CardDescription>
//                 Outstanding amount and DICGC flags
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <Field label='Outstanding Amount (₹)' htmlFor='outstandingAmt'>
//                 <Input
//                   id='outstandingAmt'
//                   inputMode='decimal'
//                   placeholder='455000'
//                   {...form.register('proposal.outstandingAmt')}
//                 />
//               </Field>
//               <Controller
//                 control={form.control}
//                 name='proposal.eligibleForDicgcOldScheme'
//                 render={({ field }) => (
//                   <Field
//                     label='Eligible for DICGC Old Scheme'
//                     htmlFor='eligibleForDicgcOldScheme'
//                   >
//                     <Select value={field.value} onValueChange={field.onChange}>
//                       <SelectTrigger id='eligibleForDicgcOldScheme'>
//                         <SelectValue placeholder='Select' />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value='false'>No</SelectItem>
//                         <SelectItem value='true'>Yes</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                 )}
//               />
//               <Field
//                 label='DICGC Receivable/Retainable (₹)'
//                 htmlFor='dicgcReceivableOrRetainable'
//               >
//                 <Input
//                   id='dicgcReceivableOrRetainable'
//                   inputMode='decimal'
//                   placeholder='0'
//                   {...form.register('proposal.dicgcReceivableOrRetainable')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* INC & Interest */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>INC & Interest</CardTitle>
//               <CardDescription>
//                 INC held + additional/unrealized interest
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <Field label='INC As On Date' htmlFor='incAsOnDate'>
//                 <Input
//                   id='incAsOnDate'
//                   type='date'
//                   {...form.register('proposal.incAsOnDate')}
//                 />
//               </Field>
//               <Field
//                 label='Amount Held in INC As On (₹)'
//                 htmlFor='amountHeldInIncAsOn'
//               >
//                 <Input
//                   id='amountHeldInIncAsOn'
//                   inputMode='decimal'
//                   placeholder='5000'
//                   {...form.register('proposal.amountHeldInIncAsOn')}
//                 />
//               </Field>
//               <Field
//                 label='Additional Interest Upto Writeoff (₹)'
//                 htmlFor='additionalInterestUptoWriteoff'
//               >
//                 <Input
//                   id='additionalInterestUptoWriteoff'
//                   inputMode='decimal'
//                   placeholder='15000'
//                   {...form.register('proposal.additionalInterestUptoWriteoff')}
//                 />
//               </Field>
//               <Field
//                 label='Unrealized Interest As On Date'
//                 htmlFor='unrealizedInterestAsOnDate'
//               >
//                 <Input
//                   id='unrealizedInterestAsOnDate'
//                   type='date'
//                   {...form.register('proposal.unrealizedInterestAsOnDate')}
//                 />
//               </Field>
//               <Field
//                 label='Unrealized Interest Prev Year As On (₹)'
//                 htmlFor='unrealizedInterestPrevYearAsOn'
//               >
//                 <Input
//                   id='unrealizedInterestPrevYearAsOn'
//                   inputMode='decimal'
//                   placeholder='22000'
//                   {...form.register('proposal.unrealizedInterestPrevYearAsOn')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Security & Recommendation */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Security & Recommendation</CardTitle>
//               <CardDescription>
//                 Security notes and recommendation details
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4'>
//               <Field label='Security Details' htmlFor='securityDetails'>
//                 <Textarea
//                   id='securityDetails'
//                   placeholder='Primary: Hypothecation of stock. Collateral: Mortgage of land.'
//                   className='min-h-[110px]'
//                   {...form.register('proposal.securityDetails')}
//                 />
//               </Field>
//               <Field
//                 label='Recommendation Details'
//                 htmlFor='recommendationDetails'
//               >
//                 <Textarea
//                   id='recommendationDetails'
//                   placeholder='Write-off recommended due to no recovery prospects and prolonged NPA.'
//                   className='min-h-[140px]'
//                   {...form.register('proposal.recommendationDetails')}
//                 />
//               </Field>
//             </CardContent>
//             <CardFooter className='justify-between'>
//               <Button
//                 variant='secondary'
//                 type='button'
//                 onClick={form.handleSubmit(onSubmit)}
//                 disabled={isSaving}
//               >
//                 Submit for Recommendation
//               </Button>
//               <div className='flex gap-2'>
//                 <Button
//                   variant='outline'
//                   onClick={handleReset}
//                   disabled={isSaving}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={form.handleSubmit(onSubmit)}
//                   className='text-white'
//                   disabled={isSaving}
//                 >
//                   {isSaving ? 'Saving…' : 'Save'}
//                 </Button>
//               </div>
//             </CardFooter>
//           </Card>
//         </div>
//         <div className='text-muted-foreground mt-6 text-xs'>
//           Tip: If opened without <span className='font-mono'>acctNo</span>,
//           branch details may stay blank. Default date helper: {todayYMD()}.
//         </div>
//       </div>
//     </>
//   )
// }
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch, useFieldArray, Controller } from 'react-hook-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/auca/transfer')({
  component: RouteComponent,
})

/* =============================
   ✅ Updates applied:
   1) Security Details and Recommendation are separate Cards.
   2) Recommendation section uses ONLY the JSON structure:
      { branchName, branchCode, proposals: [ { ... } ] }
   3) Recommendation section: ❌ NO add/remove proposal functionality
      (always renders proposals[0] only).
   4) "Submit for Recommendation" button removed; only Cancel + Save remain.
============================= */

const DebitRowSchema = z.object({
  date: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  remarks: z.string().optional(),
})

const RecommendationProposalSchema = z.object({
  accountNumber: z.string().min(1, 'Required'),
  borrowerName: z.string().min(1, 'Required'),
  segment: z.string().min(1, 'Required'),
  loanSanctionDate: z.string().min(1, 'Required'),
  npaDate: z.string().min(1, 'Required'),

  limitTTT: z.string().min(1, 'Required'),
  loanSanctionAmt: z.string().min(1, 'Required'),

  outstandingAmt: z.string().min(1, 'Required'),
  totalRecoverableAmt: z.string().min(1, 'Required'),

  notionalInterest: z.string().min(1, 'Required'),
  securityValue: z.string().min(1, 'Required'),

  provisionAvailable: z.string().min(1, 'Required'),
  provisionShortfall: z.string().min(1, 'Required'),
  totalLoss: z.string().min(1, 'Required'),

  netAmountToTransfer: z.string().min(1, 'Required'),
  totalWriteOffAmount: z.string().min(1, 'Required'),

  writeOffId: z.string().min(1, 'Required'),
})

const FormSchema = z.object({
  branchName: z.string().optional(),
  branchCode: z.string().optional(),

  // PB-transfer form group (kept as earlier)
  proposal: z.object({
    segment: z.string().min(1, 'Required'),

    firmName: z.string().min(1, 'Required'),
    borrowerName: z.string().min(1, 'Required'),

    loanPurpose: z.string().min(1, 'Required'),
    loanType: z.string().min(1, 'Required'),
    schemeType: z.string().min(1, 'Required'),

    loanSanctionDate: z.string().min(1, 'Required'),
    limitTTT: z.string().min(1, 'Required'),
    loanSanctionAmt: z.string().min(1, 'Required'),

    sanctioningAuth: z.string().min(1, 'Required'),

    recallDate: z.string().min(1, 'Required'),
    controllingAuthorityRefNo: z.string().min(1, 'Required'),
    transferToPbDate: z.string().min(1, 'Required'),
    transferredAmountToPb: z.string().min(1, 'Required'),

    recoveryMadeIncludingSubsidy: z.string().min(1, 'Required'),

    subsequentDebitsToPb: z.array(DebitRowSchema).default([]),

    suitFiled: z.enum(['true', 'false']).default('false'),
    suitDate: z.string().optional(),
    suitPresentPosition: z.string().optional(),
    hearingDate: z.string().optional(),
    executionDate: z.string().optional(),

    documentPosition: z.string().min(1, 'Required'),

    provisionDate: z.string().min(1, 'Required'),
    provisionAsOnT1: z.string().min(1, 'Required'),
    provisionAvailable: z.string().min(1, 'Required'),

    outstandingAmt: z.string().min(1, 'Required'),

    eligibleForDicgcOldScheme: z.enum(['true', 'false']).default('false'),
    dicgcReceivableOrRetainable: z.string().min(1, 'Required'),

    incAsOnDate: z.string().min(1, 'Required'),
    amountHeldInIncAsOn: z.string().min(1, 'Required'),

    additionalInterestUptoWriteoff: z.string().min(1, 'Required'),

    unrealizedInterestAsOnDate: z.string().min(1, 'Required'),
    unrealizedInterestPrevYearAsOn: z.string().min(1, 'Required'),

    // Security (separate card)
    securityDetails: z.string().min(1, 'Required'),
  }),

  // Recommendation JSON section (ONLY these fields)
  recommendation: z.object({
    proposals: z.array(RecommendationProposalSchema).default([]),
  }),
})

export type FormValues = z.infer<typeof FormSchema>

function Field(props: {
  label: string
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  const { label, htmlFor, children, hint } = props
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
    </div>
  )
}

const toNumberOrUndefined = (value?: string): number | undefined => {
  if (value === undefined || value === null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(n)) return undefined
  return n
}

const toNumberOrZero = (value?: string): number => {
  const n = toNumberOrUndefined(value)
  return n ?? 0
}

const todayYMD = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function RouteComponent() {
  const router = useRouter()
  const search = Route.useSearch() as { acctNo?: string }
  const acctNoFromSearch = search?.acctNo

  const [prefillLoading, setPrefillLoading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      branchName: '',
      branchCode: '',
      proposal: {
        segment: 'MSME',

        firmName: '',
        borrowerName: '',

        loanPurpose: '',
        loanType: '',
        schemeType: '',

        loanSanctionDate: '',
        limitTTT: '',
        loanSanctionAmt: '',

        sanctioningAuth: '',

        recallDate: '',
        controllingAuthorityRefNo: '',
        transferToPbDate: '',
        transferredAmountToPb: '',

        recoveryMadeIncludingSubsidy: '',

        subsequentDebitsToPb: [],

        suitFiled: 'false',
        suitDate: '',
        suitPresentPosition: '',
        hearingDate: '',
        executionDate: '',

        documentPosition: '',

        provisionDate: '',
        provisionAsOnT1: '',
        provisionAvailable: '',

        outstandingAmt: '',

        eligibleForDicgcOldScheme: 'false',
        dicgcReceivableOrRetainable: '0',

        incAsOnDate: '',
        amountHeldInIncAsOn: '0',

        additionalInterestUptoWriteoff: '0',

        unrealizedInterestAsOnDate: '',
        unrealizedInterestPrevYearAsOn: '0',

        securityDetails: '',
      },

      // ✅ Always keep exactly ONE proposal in recommendation.proposals[0]
      recommendation: {
        proposals: [
          {
            accountNumber: acctNoFromSearch ?? '',
            borrowerName: '',
            segment: 'AGRI',
            loanSanctionDate: '',
            npaDate: '',

            limitTTT: '',
            loanSanctionAmt: '',

            outstandingAmt: '',
            totalRecoverableAmt: '',

            notionalInterest: '0',
            securityValue: '0',

            provisionAvailable: '',
            provisionShortfall: '0',
            totalLoss: '',

            netAmountToTransfer: '',
            totalWriteOffAmount: '',

            writeOffId: '',
          },
        ],
      },
    },
  })

  // ✅ useFieldArray ONLY for Subsequent Debits (fast + correct)
  const {
    fields: debitFields,
    append: appendDebit,
    remove: removeDebit,
  } = useFieldArray({
    control: form.control,
    name: 'proposal.subsequentDebitsToPb',
  })

  const handleReset = () => {
    form.reset({
      branchName: form.getValues('branchName') ?? '',
      branchCode: form.getValues('branchCode') ?? '',
      proposal: {
        ...form.getValues('proposal'),
        firmName: '',
        borrowerName: '',
        loanPurpose: '',
        loanType: '',
        schemeType: '',
        loanSanctionDate: '',
        limitTTT: '',
        loanSanctionAmt: '',
        sanctioningAuth: '',
        recallDate: '',
        controllingAuthorityRefNo: '',
        transferToPbDate: '',
        transferredAmountToPb: '',
        recoveryMadeIncludingSubsidy: '',
        subsequentDebitsToPb: [],
        suitDate: '',
        suitPresentPosition: '',
        hearingDate: '',
        executionDate: '',
        documentPosition: '',
        provisionDate: '',
        provisionAsOnT1: '',
        provisionAvailable: '',
        outstandingAmt: '',
        dicgcReceivableOrRetainable: '0',
        incAsOnDate: '',
        amountHeldInIncAsOn: '0',
        additionalInterestUptoWriteoff: '0',
        unrealizedInterestAsOnDate: '',
        unrealizedInterestPrevYearAsOn: '0',
        securityDetails: '',
      },
      recommendation: {
        proposals: [
          {
            accountNumber: acctNoFromSearch ?? '',
            borrowerName: '',
            segment: 'AGRI',
            loanSanctionDate: '',
            npaDate: '',

            limitTTT: '',
            loanSanctionAmt: '',

            outstandingAmt: '',
            totalRecoverableAmt: '',

            notionalInterest: '0',
            securityValue: '0',

            provisionAvailable: '',
            provisionShortfall: '0',
            totalLoss: '',

            netAmountToTransfer: '',
            totalWriteOffAmount: '',

            writeOffId: '',
          },
        ],
      },
    })
  }

  const addDebitRow = () =>
    appendDebit({ date: todayYMD(), amount: '0', remarks: '' })
  const removeDebitRow = (idx: number) => removeDebit(idx)

  // Suit enable/disable + auto-clear
  const suitFiled = useWatch({
    control: form.control,
    name: 'proposal.suitFiled',
  })
  const suitEnabled = suitFiled === 'true'
  useEffect(() => {
    if (!suitEnabled) {
      form.setValue('proposal.suitDate', '', { shouldDirty: true })
      form.setValue('proposal.suitPresentPosition', '', { shouldDirty: true })
      form.setValue('proposal.hearingDate', '', { shouldDirty: true })
      form.setValue('proposal.executionDate', '', { shouldDirty: true })
    }
  }, [suitEnabled, form])

  // Branch info (as reference)
  const { data: branchDepartmentInfo, isLoading: branchDepartmentInfoLoading } =
    $api.useQuery('get', '/branches/{accountNumber}/branch-department-info', {
      params: { path: { accountNumber: acctNoFromSearch ?? '' } },
    })

  useEffect(() => {
    if (!acctNoFromSearch) return
    if (!branchDepartmentInfo) return

    form.setValue('branchCode', branchDepartmentInfo?.branchCode ?? '', {
      shouldDirty: false,
    })
    form.setValue('branchName', branchDepartmentInfo?.branchName ?? '', {
      shouldDirty: false,
    })
  }, [acctNoFromSearch, branchDepartmentInfo, form])

  // CREATE (API preserved)
  const createTransferMutation = $api.useMutation(
    'post',
    '/auca-transfer/create',
    {
      onSuccess: () => {
        toast.success('Transfer proposal created successfully!')
        handleReset()
        router.navigate({ to: '/auca/eligible' })
      },
      onError: (error) =>
        toastError(error, 'Could not create transfer proposal.'),
    }
  )

  // PREFILL (as reference)
  const { mutate: fetchAucaDetails } = $api.useMutation(
    'get',
    '/auca-transfer/AucaEligible/{acctNo}'
  )

  useEffect(() => {
    if (!acctNoFromSearch) return
    setPrefillLoading(true)

    fetchAucaDetails(
      { params: { path: { acctNo: acctNoFromSearch } } },
      {
        onSuccess: (res) => {
          setPrefillLoading(false)
          const body = res
          if (!body?.data) {
            toast.error('No details found for this account')
            return
          }

          const d = body.data

          // PB-transfer mapping
          form.setValue('proposal.borrowerName', d.custName ?? '', {
            shouldDirty: false,
          })
          form.setValue('proposal.firmName', d.custName ?? '', {
            shouldDirty: false,
          })
          form.setValue('proposal.loanPurpose', d.acctDesc ?? '', {
            shouldDirty: false,
          })
          form.setValue('proposal.loanSanctionDate', d.sanctDt ?? '', {
            shouldDirty: false,
          })

          const limitStr =
            d.loanLimit !== undefined && d.loanLimit !== null
              ? String(d.loanLimit)
              : ''
          const outstandStr =
            d.outstand !== undefined && d.outstand !== null
              ? String(d.outstand)
              : ''
          const secStr =
            d.secuAmt !== undefined && d.secuAmt !== null
              ? String(d.secuAmt)
              : '0'

          form.setValue('proposal.limitTTT', limitStr, { shouldDirty: false })
          form.setValue('proposal.loanSanctionAmt', limitStr, {
            shouldDirty: false,
          })
          form.setValue('proposal.outstandingAmt', outstandStr, {
            shouldDirty: false,
          })

          // ✅ Recommendation always at index 0 (no add/remove)
          // Ensure proposals array exists with one element
          form.setValue(
            'recommendation.proposals',
            [
              {
                accountNumber: d.acctNo ?? acctNoFromSearch ?? '',
                borrowerName: d.custName ?? '',
                segment: 'AGRI',
                loanSanctionDate: d.sanctDt ?? '',
                npaDate: d.npaDt ?? '',

                limitTTT: limitStr,
                loanSanctionAmt: limitStr,

                outstandingAmt: outstandStr,
                totalRecoverableAmt: outstandStr, // safe default

                notionalInterest: '0',
                securityValue: secStr,

                provisionAvailable: outstandStr,
                provisionShortfall: '0',
                totalLoss: outstandStr,

                netAmountToTransfer: outstandStr,
                totalWriteOffAmount: outstandStr,

                writeOffId: '',
              },
            ],
            { shouldDirty: false }
          )
        },
        onError: () => {
          setPrefillLoading(false)
          toast.error('Failed to prefill details from account')
        },
      }
    )
  }, [acctNoFromSearch, fetchAucaDetails, form])

  const onSubmit = (values: FormValues) => {
    const p = values.proposal

    if (p.suitFiled === 'true' && !p.suitDate) {
      toast.error('Suit Date is required when Suit Filed = Yes')
      return
    }

    const subsequentDebitsToPbJson = JSON.stringify(
      (p.subsequentDebitsToPb ?? []).map((r) => ({
        date: r.date,
        amount: toNumberOrZero(r.amount),
        remarks: (r.remarks ?? '').trim(),
      }))
    )

    // ✅ PB Transfer payload (flat body)
    const payload = {
      bankType: 'NRGB',
      formType: 'UTG_FORM',

      branchName: values.branchName?.trim() || undefined,
      branchCode: values.branchCode?.trim() || undefined,

      segment: p.segment.trim(),
      firmName: p.firmName.trim(),
      borrowerName: p.borrowerName.trim(),

      loanPurpose: p.loanPurpose.trim(),
      loanType: p.loanType.trim(),
      schemeType: p.schemeType.trim(),

      loanSanctionDate: p.loanSanctionDate,
      limitTTT: toNumberOrZero(p.limitTTT),
      loanSanctionAmt: toNumberOrZero(p.loanSanctionAmt),

      sanctioningAuth: p.sanctioningAuth.trim(),

      recallDate: p.recallDate,
      controllingAuthorityRefNo: p.controllingAuthorityRefNo.trim(),
      transferToPbDate: p.transferToPbDate,
      transferredAmountToPb: toNumberOrZero(p.transferredAmountToPb),

      recoveryMadeIncludingSubsidy: toNumberOrZero(
        p.recoveryMadeIncludingSubsidy
      ),

      subsequentDebitsToPbJson,

      suitFiled: p.suitFiled === 'true',
      suitDate: p.suitDate || undefined,
      suitPresentPosition: p.suitPresentPosition?.trim() || undefined,
      hearingDate: p.hearingDate || undefined,
      executionDate: p.executionDate || undefined,

      documentPosition: p.documentPosition.trim(),

      provisionDate: p.provisionDate,
      provisionAsOnT1: toNumberOrZero(p.provisionAsOnT1),
      provisionAvailable: toNumberOrZero(p.provisionAvailable),

      outstandingAmt: toNumberOrZero(p.outstandingAmt),

      eligibleForDicgcOldScheme: p.eligibleForDicgcOldScheme === 'true',
      dicgcReceivableOrRetainable: toNumberOrZero(
        p.dicgcReceivableOrRetainable
      ),

      incAsOnDate: p.incAsOnDate,
      amountHeldInIncAsOn: toNumberOrZero(p.amountHeldInIncAsOn),

      additionalInterestUptoWriteoff: toNumberOrZero(
        p.additionalInterestUptoWriteoff
      ),

      unrealizedInterestAsOnDate: p.unrealizedInterestAsOnDate,
      unrealizedInterestPrevYearAsOn: toNumberOrZero(
        p.unrealizedInterestPrevYearAsOn
      ),

      securityDetails: p.securityDetails.trim(),
    } as never

    createTransferMutation.mutate({
      params: { header: { Authorization: '' } },
      body: payload,
    })
  }

  const isSaving = createTransferMutation.isPending

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Initiate Transfer to AUCA — Proposal
            </h1>
            {acctNoFromSearch && (
              <p className='text-muted-foreground mt-1 text-xs'>
                Prefilling proposal for Account:{' '}
                <span className='font-mono font-semibold'>
                  {acctNoFromSearch}
                </span>
                {prefillLoading ? ' (loading details...)' : null}
              </p>
            )}
          </div>

          <Button onClick={() => window.history.back()} className='text-white'>
            Back
          </Button>
        </div>

        <Separator className='my-6' />

        <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
          {/* Branch Info */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Details</CardTitle>
              <CardDescription>
                Auto-filled from account, read-only
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Field label='Branch Code' htmlFor='branchCode'>
                <Input
                  id='branchCode'
                  disabled
                  placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
                  {...form.register('branchCode')}
                />
              </Field>
              <Field label='Branch Name' htmlFor='branchName'>
                <Input
                  id='branchName'
                  disabled
                  placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
                  {...form.register('branchName')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Proposal Basics */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Basics</CardTitle>
              <CardDescription>Segment + borrower identity</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Segment' htmlFor='segment'>
                <Input
                  id='segment'
                  placeholder='MSME'
                  {...form.register('proposal.segment')}
                />
              </Field>

              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Firm Name' htmlFor='firmName'>
                  <Input
                    id='firmName'
                    placeholder='ABC TRADERS'
                    {...form.register('proposal.firmName')}
                  />
                </Field>

                <Field label='Borrower Name' htmlFor='borrowerName'>
                  <Input
                    id='borrowerName'
                    placeholder='RAJ KUMAR'
                    {...form.register('proposal.borrowerName')}
                  />
                </Field>
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <Field label='Loan Purpose' htmlFor='loanPurpose'>
                  <Input
                    id='loanPurpose'
                    placeholder='TRADING'
                    {...form.register('proposal.loanPurpose')}
                  />
                </Field>
                <Field label='Loan Type' htmlFor='loanType'>
                  <Input
                    id='loanType'
                    placeholder='CC'
                    {...form.register('proposal.loanType')}
                  />
                </Field>
                <Field label='Scheme Type' htmlFor='schemeType'>
                  <Input
                    id='schemeType'
                    placeholder='MSME-CC'
                    {...form.register('proposal.schemeType')}
                  />
                </Field>
              </div>

              <Field label='Loan Sanction Date' htmlFor='loanSanctionDate'>
                <Input
                  id='loanSanctionDate'
                  type='date'
                  {...form.register('proposal.loanSanctionDate')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Sanction & Limits */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Sanction & Limits</CardTitle>
              <CardDescription>Amounts in ₹ (numbers only)</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Field label='Limit TTT (₹)' htmlFor='limitTTT'>
                <Input
                  id='limitTTT'
                  inputMode='decimal'
                  placeholder='500000'
                  {...form.register('proposal.limitTTT')}
                />
              </Field>

              <Field label='Loan Sanction Amount (₹)' htmlFor='loanSanctionAmt'>
                <Input
                  id='loanSanctionAmt'
                  inputMode='decimal'
                  placeholder='500000'
                  {...form.register('proposal.loanSanctionAmt')}
                />
              </Field>

              <Field label='Sanctioning Authority' htmlFor='sanctioningAuth'>
                <Input
                  id='sanctioningAuth'
                  placeholder='Shri X, Scale-II, Branch Manager'
                  {...form.register('proposal.sanctioningAuth')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Recall & Transfer */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Recall & Transfer to PB</CardTitle>
              <CardDescription>
                Recall → controlling authority → transfer
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Field label='Recall Date' htmlFor='recallDate'>
                <Input
                  id='recallDate'
                  type='date'
                  {...form.register('proposal.recallDate')}
                />
              </Field>

              <Field
                label='Controlling Authority Ref No.'
                htmlFor='controllingAuthorityRefNo'
              >
                <Input
                  id='controllingAuthorityRefNo'
                  placeholder='RO/CA/2025/123'
                  {...form.register('proposal.controllingAuthorityRefNo')}
                />
              </Field>

              <Field label='Transfer to PB Date' htmlFor='transferToPbDate'>
                <Input
                  id='transferToPbDate'
                  type='date'
                  {...form.register('proposal.transferToPbDate')}
                />
              </Field>

              <Field
                label='Transferred Amount to PB (₹)'
                htmlFor='transferredAmountToPb'
              >
                <Input
                  id='transferredAmountToPb'
                  inputMode='decimal'
                  placeholder='480000'
                  {...form.register('proposal.transferredAmountToPb')}
                />
              </Field>

              <Field
                label='Recovery Made incl. Subsidy (₹)'
                htmlFor='recoveryMadeIncludingSubsidy'
              >
                <Input
                  id='recoveryMadeIncludingSubsidy'
                  inputMode='decimal'
                  placeholder='25000'
                  {...form.register('proposal.recoveryMadeIncludingSubsidy')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Subsequent Debits (TABLE STYLE) */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Subsequent Debits to PB</CardTitle>
              <CardDescription>
                These entries will be saved as{' '}
                <span className='font-mono'>subsequentDebitsToPbJson</span>
              </CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4'>
              <div className='flex items-center justify-between'>
                <p className='text-muted-foreground text-xs'>
                  Add date/amount/remarks entries.
                </p>
                <Button type='button' variant='secondary' onClick={addDebitRow}>
                  Add Row
                </Button>
              </div>

              {debitFields.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No debit rows added yet.
                </div>
              ) : (
                <div className='overflow-auto rounded-md border'>
                  <div className='bg-muted/40 text-muted-foreground grid min-w-[780px] grid-cols-12 gap-3 border-b px-4 py-2 text-xs font-medium'>
                    <div className='col-span-3'>Date</div>
                    <div className='col-span-3'>Amount (₹)</div>
                    <div className='col-span-5'>Remarks</div>
                    <div className='col-span-1 text-right'>Action</div>
                  </div>

                  <div className='divide-y'>
                    {debitFields.map((row, idx) => (
                      <div
                        key={row.id}
                        className='grid min-w-[780px] grid-cols-12 items-center gap-3 px-4 py-3'
                      >
                        <div className='col-span-3'>
                          <Input
                            type='date'
                            className='h-9'
                            {...form.register(
                              `proposal.subsequentDebitsToPb.${idx}.date` as const
                            )}
                          />
                        </div>

                        <div className='col-span-3'>
                          <Input
                            inputMode='decimal'
                            placeholder='0'
                            className='h-9'
                            {...form.register(
                              `proposal.subsequentDebitsToPb.${idx}.amount` as const
                            )}
                          />
                        </div>

                        <div className='col-span-5'>
                          <Input
                            placeholder='Legal notice charges'
                            className='h-9'
                            {...form.register(
                              `proposal.subsequentDebitsToPb.${idx}.remarks` as const
                            )}
                          />
                        </div>

                        <div className='col-span-1 flex justify-end'>
                          <Button
                            type='button'
                            variant='outline'
                            className='h-9 px-3'
                            onClick={() => removeDebitRow(idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suit Details */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Suit / Legal Details</CardTitle>
              <CardDescription>
                Enable suit and capture timeline (if applicable)
              </CardDescription>
            </CardHeader>

            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Controller
                control={form.control}
                name='proposal.suitFiled'
                render={({ field }) => (
                  <Field label='Suit Filed' htmlFor='suitFiled'>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='suitFiled'>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='false'>No</SelectItem>
                        <SelectItem value='true'>Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Field
                label='Suit Date'
                htmlFor='suitDate'
                hint='Required only if Suit Filed = Yes'
              >
                <Input
                  id='suitDate'
                  type='date'
                  disabled={!suitEnabled}
                  {...form.register('proposal.suitDate')}
                />
              </Field>

              <Field label='Hearing Date' htmlFor='hearingDate'>
                <Input
                  id='hearingDate'
                  type='date'
                  disabled={!suitEnabled}
                  {...form.register('proposal.hearingDate')}
                />
              </Field>

              <Field label='Execution Date' htmlFor='executionDate'>
                <Input
                  id='executionDate'
                  type='date'
                  disabled={!suitEnabled}
                  {...form.register('proposal.executionDate')}
                />
              </Field>

              <div className='md:col-span-2 lg:col-span-2'>
                <Field
                  label='Suit Present Position'
                  htmlFor='suitPresentPosition'
                >
                  <Textarea
                    id='suitPresentPosition'
                    disabled={!suitEnabled}
                    placeholder='Pending before Civil Judge'
                    className='min-h-[90px]'
                    {...form.register('proposal.suitPresentPosition')}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Documents & Provision */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Documents & Provision</CardTitle>
              <CardDescription>
                Document position + provision snapshot
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <div className='md:col-span-2 lg:col-span-3'>
                <Field label='Document Position' htmlFor='documentPosition'>
                  <Textarea
                    id='documentPosition'
                    placeholder='All original documents available and enforceable'
                    className='min-h-[90px]'
                    {...form.register('proposal.documentPosition')}
                  />
                </Field>
              </div>

              <Field label='Provision Date' htmlFor='provisionDate'>
                <Input
                  id='provisionDate'
                  type='date'
                  {...form.register('proposal.provisionDate')}
                />
              </Field>

              <Field label='Provision As On T1 (₹)' htmlFor='provisionAsOnT1'>
                <Input
                  id='provisionAsOnT1'
                  inputMode='decimal'
                  placeholder='120000'
                  {...form.register('proposal.provisionAsOnT1')}
                />
              </Field>

              <Field
                label='Provision Available (₹)'
                htmlFor='provisionAvailable'
              >
                <Input
                  id='provisionAvailable'
                  inputMode='decimal'
                  placeholder='120000'
                  {...form.register('proposal.provisionAvailable')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Outstanding & DICGC */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Outstanding & DICGC</CardTitle>
              <CardDescription>
                Outstanding amount and DICGC flags
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Field label='Outstanding Amount (₹)' htmlFor='outstandingAmt'>
                <Input
                  id='outstandingAmt'
                  inputMode='decimal'
                  placeholder='455000'
                  {...form.register('proposal.outstandingAmt')}
                />
              </Field>

              <Controller
                control={form.control}
                name='proposal.eligibleForDicgcOldScheme'
                render={({ field }) => (
                  <Field
                    label='Eligible for DICGC Old Scheme'
                    htmlFor='eligibleForDicgcOldScheme'
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='eligibleForDicgcOldScheme'>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='false'>No</SelectItem>
                        <SelectItem value='true'>Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Field
                label='DICGC Receivable/Retainable (₹)'
                htmlFor='dicgcReceivableOrRetainable'
              >
                <Input
                  id='dicgcReceivableOrRetainable'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('proposal.dicgcReceivableOrRetainable')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* INC & Interest */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>INC & Interest</CardTitle>
              <CardDescription>
                INC held + additional/unrealized interest
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Field label='INC As On Date' htmlFor='incAsOnDate'>
                <Input
                  id='incAsOnDate'
                  type='date'
                  {...form.register('proposal.incAsOnDate')}
                />
              </Field>

              <Field
                label='Amount Held in INC As On (₹)'
                htmlFor='amountHeldInIncAsOn'
              >
                <Input
                  id='amountHeldInIncAsOn'
                  inputMode='decimal'
                  placeholder='5000'
                  {...form.register('proposal.amountHeldInIncAsOn')}
                />
              </Field>

              <Field
                label='Additional Interest Upto Writeoff (₹)'
                htmlFor='additionalInterestUptoWriteoff'
              >
                <Input
                  id='additionalInterestUptoWriteoff'
                  inputMode='decimal'
                  placeholder='15000'
                  {...form.register('proposal.additionalInterestUptoWriteoff')}
                />
              </Field>

              <Field
                label='Unrealized Interest As On Date'
                htmlFor='unrealizedInterestAsOnDate'
              >
                <Input
                  id='unrealizedInterestAsOnDate'
                  type='date'
                  {...form.register('proposal.unrealizedInterestAsOnDate')}
                />
              </Field>

              <Field
                label='Unrealized Interest Prev Year As On (₹)'
                htmlFor='unrealizedInterestPrevYearAsOn'
              >
                <Input
                  id='unrealizedInterestPrevYearAsOn'
                  inputMode='decimal'
                  placeholder='22000'
                  {...form.register('proposal.unrealizedInterestPrevYearAsOn')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ✅ Security Details (SEPARATE) */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Security Details</CardTitle>
              <CardDescription>
                Enter detailed security/collateral notes
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Security Details' htmlFor='securityDetails'>
                <Textarea
                  id='securityDetails'
                  placeholder='Primary: Hypothecation of stock. Collateral: Mortgage of land.'
                  className='min-h-[120px]'
                  {...form.register('proposal.securityDetails')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ✅ Recommendation (JSON) — NO add/remove */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
              {/* <CardDescription>
                Fill this section exactly as the recommendation JSON
              </CardDescription> */}
            </CardHeader>

            <CardContent className='grid gap-4'>
              <div className='rounded-md border p-4'>
                {/* <div className='text-sm font-semibold'>Proposal</div> */}

                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  <Field label='Account Number' htmlFor='rec_accountNumber_0'>
                    <Input
                      id='rec_accountNumber_0'
                      placeholder='123456789012'
                      {...form.register(
                        'recommendation.proposals.0.accountNumber'
                      )}
                    />
                  </Field>

                  <Field label='Borrower Name' htmlFor='rec_borrowerName_0'>
                    <Input
                      id='rec_borrowerName_0'
                      placeholder='BORROWER NAME'
                      {...form.register(
                        'recommendation.proposals.0.borrowerName'
                      )}
                    />
                  </Field>

                  <Field label='Segment' htmlFor='rec_segment_0'>
                    <Input
                      id='rec_segment_0'
                      placeholder='AGRI'
                      {...form.register('recommendation.proposals.0.segment')}
                    />
                  </Field>

                  <Field
                    label='Loan Sanction Date'
                    htmlFor='rec_loanSanctionDate_0'
                  >
                    <Input
                      id='rec_loanSanctionDate_0'
                      type='date'
                      {...form.register(
                        'recommendation.proposals.0.loanSanctionDate'
                      )}
                    />
                  </Field>

                  <Field label='NPA Date' htmlFor='rec_npaDate_0'>
                    <Input
                      id='rec_npaDate_0'
                      type='date'
                      {...form.register('recommendation.proposals.0.npaDate')}
                    />
                  </Field>

                  <Field label='Write Off ID' htmlFor='rec_writeOffId_0'>
                    <Input
                      id='rec_writeOffId_0'
                      placeholder='WO-2025-0001'
                      {...form.register(
                        'recommendation.proposals.0.writeOffId'
                      )}
                    />
                  </Field>
                </div>

                <Separator className='my-4' />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  <Field label='Limit TTT (₹)' htmlFor='rec_limitTTT_0'>
                    <Input
                      id='rec_limitTTT_0'
                      inputMode='decimal'
                      placeholder='250000'
                      {...form.register('recommendation.proposals.0.limitTTT')}
                    />
                  </Field>

                  <Field
                    label='Loan Sanction Amt (₹)'
                    htmlFor='rec_loanSanctionAmt_0'
                  >
                    <Input
                      id='rec_loanSanctionAmt_0'
                      inputMode='decimal'
                      placeholder='250000'
                      {...form.register(
                        'recommendation.proposals.0.loanSanctionAmt'
                      )}
                    />
                  </Field>

                  <Field
                    label='Outstanding Amt (₹)'
                    htmlFor='rec_outstandingAmt_0'
                  >
                    <Input
                      id='rec_outstandingAmt_0'
                      inputMode='decimal'
                      placeholder='175432.50'
                      {...form.register(
                        'recommendation.proposals.0.outstandingAmt'
                      )}
                    />
                  </Field>

                  <Field
                    label='Total Recoverable Amt (₹)'
                    htmlFor='rec_totalRecoverableAmt_0'
                  >
                    <Input
                      id='rec_totalRecoverableAmt_0'
                      inputMode='decimal'
                      placeholder='180000'
                      {...form.register(
                        'recommendation.proposals.0.totalRecoverableAmt'
                      )}
                    />
                  </Field>

                  <Field
                    label='Notional Interest (₹)'
                    htmlFor='rec_notionalInterest_0'
                  >
                    <Input
                      id='rec_notionalInterest_0'
                      inputMode='decimal'
                      placeholder='12345.67'
                      {...form.register(
                        'recommendation.proposals.0.notionalInterest'
                      )}
                    />
                  </Field>

                  <Field
                    label='Security Value (₹)'
                    htmlFor='rec_securityValue_0'
                  >
                    <Input
                      id='rec_securityValue_0'
                      inputMode='decimal'
                      placeholder='50000'
                      {...form.register(
                        'recommendation.proposals.0.securityValue'
                      )}
                    />
                  </Field>
                </div>

                <Separator className='my-4' />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  <Field
                    label='Provision Available (₹)'
                    htmlFor='rec_provisionAvailable_0'
                  >
                    <Input
                      id='rec_provisionAvailable_0'
                      inputMode='decimal'
                      placeholder='175432.50'
                      {...form.register(
                        'recommendation.proposals.0.provisionAvailable'
                      )}
                    />
                  </Field>

                  <Field
                    label='Provision Shortfall (₹)'
                    htmlFor='rec_provisionShortfall_0'
                  >
                    <Input
                      id='rec_provisionShortfall_0'
                      inputMode='decimal'
                      placeholder='0'
                      {...form.register(
                        'recommendation.proposals.0.provisionShortfall'
                      )}
                    />
                  </Field>

                  <Field label='Total Loss (₹)' htmlFor='rec_totalLoss_0'>
                    <Input
                      id='rec_totalLoss_0'
                      inputMode='decimal'
                      placeholder='175432.50'
                      {...form.register('recommendation.proposals.0.totalLoss')}
                    />
                  </Field>

                  <Field
                    label='Net Amount To Transfer (₹)'
                    htmlFor='rec_netAmountToTransfer_0'
                  >
                    <Input
                      id='rec_netAmountToTransfer_0'
                      inputMode='decimal'
                      placeholder='175432.50'
                      {...form.register(
                        'recommendation.proposals.0.netAmountToTransfer'
                      )}
                    />
                  </Field>

                  <Field
                    label='Total Write Off Amount (₹)'
                    htmlFor='rec_totalWriteOffAmount_0'
                  >
                    <Input
                      id='rec_totalWriteOffAmount_0'
                      inputMode='decimal'
                      placeholder='175432.50'
                      {...form.register(
                        'recommendation.proposals.0.totalWriteOffAmount'
                      )}
                    />
                  </Field>
                </div>
              </div>
            </CardContent>

            <CardFooter className='justify-end'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  className='text-white'
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className='text-muted-foreground mt-6 text-xs'>
          Tip: If opened without <span className='font-mono'>acctNo</span>,
          branch details may stay blank. Default date helper: {todayYMD()}.
        </div>
      </div>
    </>
  )
}
