// import React, { useMemo } from 'react'
// import { z } from 'zod'
// import { useForm, Controller, useFieldArray } from 'react-hook-form'
// import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
//   SelectContent,
//   SelectItem,
//   SelectValue,
// } from '@/components/ui/select'
// import { Separator } from '@/components/ui/separator'
// import { Textarea } from '@/components/ui/textarea'

// export const Route = createFileRoute(
//   '/_authenticated/problem-loan-review/review/$accountNumber'
// )({
//   component: RouteComponent,
// })

// /* =============================
//    Problem Loan (NPA & PNPA) — API-backed Form
//    Connected to POST /problem-loan-reviews/create
// ============================= */

// const SecurityRowSchema = z.object({
//   securityType: z.string().optional(),
//   securityDescription: z.string().optional(),
//   realizableValue: z.string().optional(),
//   valuationDate: z.string().optional(),
// })

// const FormSchema = z.object({
//   // UI-only category
//   limitCategory: z.enum(['UPTO_5_LAKH']).default('UPTO_5_LAKH'),

//   // API: core loan & account details
//   borrowerName: z.string().optional(),
//   accountNo: z.string().optional(),
//   loanPurpose: z.string().optional(),
//   lastSanctionDate: z.string().optional(),
//   sanctionedLimit: z.string().optional(),
//   drawingPower: z.string().optional(),
//   outstanding: z.string().optional(),
//   overdue: z.string().optional(),
//   sanctioningAuthority: z.string().optional(),
//   borrowerProfileHistory: z.string().optional(),

//   // NPA / Provision
//   npaDate: z.string().optional(),
//   iracStatus: z.string().optional(),
//   provisionSecured: z.string().optional(),
//   provisionUnsecured: z.string().optional(),
//   adverseFeatures: z.string().optional(),
//   otherLoans: z.string().optional(),

//   // Legal / suit
//   civilSuitApprovalDate: z.string().optional(),
//   civilSuitFilingDate: z.string().optional(),
//   suitAmount: z.string().optional(),
//   suitStatus: z.string().optional(),
//   decreeStatus: z.string().optional(),
//   decreeDetails: z.string().optional(),
//   executionPetitionDate: z.string().optional(),

//   // SARFAESI & recall
//   sarfaesiActionInitiated: z.enum(['YES', 'NO']).optional(), // UI → boolean
//   demandNoticeDate: z.string().optional(),
//   recalledAmount: z.string().optional(),
//   borrowerResponse: z.string().optional(),
//   possessionNoticeDate: z.string().optional(),
//   possessionResponse: z.string().optional(),
//   physicalPossessionDate: z.string().optional(),
//   saleProposedDate: z.string().optional(),

//   // Securities
//   securities: z.array(SecurityRowSchema).default([]),

//   // Inspection & commentary
//   lastInspectionDate: z.string().optional(),
//   reasonForNPA: z.string().optional(),
//   staffAccountabilityComments: z.string().optional(),
//   currentSecurityStatus: z.string().optional(),
//   lastInspectionMeetingDate: z.string().optional(),
//   summaryOfDiscussions: z.string().optional(),
//   actionTakenOrProposed: z.string().optional(),
//   likelyTimeFrameForUpgrade: z.string().optional(),
// })

// export type FormValues = z.infer<typeof FormSchema>

// function Field({
//   label,
//   htmlFor,
//   children,
//   hint,
// }: {
//   label: string
//   htmlFor: string
//   children: React.ReactNode
//   hint?: string
// }) {
//   return (
//     <div className='grid gap-1.5'>
//       <Label htmlFor={htmlFor}>{label}</Label>
//       {children}
//       {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
//     </div>
//   )
// }

// const toNumberOrUndefined = (value?: string): number | undefined => {
//   if (!value) return undefined
//   const trimmed = value.trim()
//   if (!trimmed) return undefined
//   const n = Number(trimmed.replace(/,/g, ''))
//   if (Number.isNaN(n)) return undefined
//   return n
// }

// const toNumber = (value?: string): number => {
//   const n = Number((value || '').toString().replace(/,/g, ''))
//   return Number.isFinite(n) ? n : 0
// }

// const formatMoney = (n: number): string =>
//   new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)

// function RouteComponent() {
//   // const { accountNumber } = Route.useParams()

//   const form = useForm<FormValues>({
//     // resolver: zodResolver(FormSchema),
//     defaultValues: {
//       limitCategory: 'UPTO_5_LAKH',
//       securities: [
//         {
//           securityType: 'Land and Building',
//           securityDescription: '',
//           realizableValue: '',
//           valuationDate: '',
//         },
//         {
//           securityType: 'Plant and Machinery',
//           securityDescription: '',
//           realizableValue: '',
//           valuationDate: '',
//         },
//       ],
//     },
//   })

//   const { control } = form
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: 'securities',
//   })

//   const watch = form.watch

//   const navigate = useNavigate()

//   // Derived: totalProvision = provisionSecured + provisionUnsecured
//   const totalProvision = useMemo(() => {
//     const secured = toNumber(watch('provisionSecured'))
//     const unsecured = toNumber(watch('provisionUnsecured'))
//     return secured + unsecured
//   }, [watch('provisionSecured'), watch('provisionUnsecured')])

//   // Mutation: POST /problem-loan-reviews/create
//   const createProblemLoanReviewMutation = $api.useMutation(
//     'post',
//     '/problem-loan-reviews/create',
//     {
//       onSuccess: () => {
//         toast.success('Problem loan review created successfully!')
//         form.reset({
//           limitCategory: 'UPTO_5_LAKH',
//           securities: [
//             {
//               securityType: 'Land and Building',
//               securityDescription: '',
//               realizableValue: '',
//               valuationDate: '',
//             },
//             {
//               securityType: 'Plant and Machinery',
//               securityDescription: '',
//               realizableValue: '',
//               valuationDate: '',
//             },
//           ],
//         })
//         navigate({ to: '/problem-loan-review/eligible' })
//       },
//       onError: (error) =>
//         toastError(
//           error,
//           'Could not create problem loan review. Please try again.'
//         ),
//     }
//   )

//   const onSubmit = (values: FormValues) => {
//     const body = {
//       borrowerName: values.borrowerName || undefined,
//       accountNo: values.accountNo || undefined,
//       loanPurpose: values.loanPurpose || undefined,
//       lastSanctionDate: values.lastSanctionDate || undefined,
//       sanctionedLimit: toNumberOrUndefined(values.sanctionedLimit),
//       drawingPower: toNumberOrUndefined(values.drawingPower),
//       outstanding: toNumberOrUndefined(values.outstanding),
//       overdue: toNumberOrUndefined(values.overdue),
//       sanctioningAuthority: values.sanctioningAuthority || undefined,
//       borrowerProfileHistory: values.borrowerProfileHistory || undefined,

//       npaDate: values.npaDate || undefined,
//       iracStatus: values.iracStatus || undefined,
//       provisionSecured: toNumberOrUndefined(values.provisionSecured),
//       provisionUnsecured: toNumberOrUndefined(values.provisionUnsecured),
//       totalProvision: totalProvision || 0,

//       adverseFeatures: values.adverseFeatures || undefined,
//       otherLoans: values.otherLoans || undefined,

//       civilSuitApprovalDate: values.civilSuitApprovalDate || undefined,
//       civilSuitFilingDate: values.civilSuitFilingDate || undefined,
//       suitAmount: toNumberOrUndefined(values.suitAmount),
//       suitStatus: values.suitStatus || undefined,
//       decreeStatus: values.decreeStatus || undefined,
//       decreeDetails: values.decreeDetails || undefined,
//       executionPetitionDate: values.executionPetitionDate || undefined,

//       sarfaesiActionInitiated:
//         values.sarfaesiActionInitiated === 'YES'
//           ? true
//           : values.sarfaesiActionInitiated === 'NO'
//             ? false
//             : undefined,

//       demandNoticeDate: values.demandNoticeDate || undefined,
//       recalledAmount: toNumberOrUndefined(values.recalledAmount),
//       borrowerResponse: values.borrowerResponse || undefined,
//       possessionNoticeDate: values.possessionNoticeDate || undefined,
//       possessionResponse: values.possessionResponse || undefined,
//       physicalPossessionDate: values.physicalPossessionDate || undefined,
//       saleProposedDate: values.saleProposedDate || undefined,

//       securities:
//         values.securities?.map((s) => ({
//           securityType: s.securityType || undefined,
//           securityDescription: s.securityDescription || undefined,
//           realizableValue: toNumberOrUndefined(s.realizableValue),
//           valuationDate: s.valuationDate || undefined,
//         })) ?? [],

//       lastInspectionDate: values.lastInspectionDate || undefined,
//       reasonForNPA: values.reasonForNPA || undefined,
//       staffAccountabilityComments:
//         values.staffAccountabilityComments || undefined,
//       currentSecurityStatus: values.currentSecurityStatus || undefined,
//       lastInspectionMeetingDate: values.lastInspectionMeetingDate || undefined,
//       summaryOfDiscussions: values.summaryOfDiscussions || undefined,
//       actionTakenOrProposed: values.actionTakenOrProposed || undefined,
//       likelyTimeFrameForUpgrade: values.likelyTimeFrameForUpgrade || undefined,
//     }

//     createProblemLoanReviewMutation.mutate({
//       params: {
//         header: {
//           // your interceptor will inject real JWT
//           Authorization: '',
//         },
//       },
//       body,
//     })
//   }

//   const isSaving = createProblemLoanReviewMutation.isPending

//   return (
//     <div className='space-y-6'>
//       <div className='flex items-center justify-between'>
//         <h1 className='text-3xl font-bold tracking-tight'>
//           Problem Loan (NPA & PNPA) Review
//         </h1>
//         <div className='flex gap-2'>
//           <Button
//             variant='outline'
//             onClick={() =>
//               form.reset({
//                 limitCategory: 'UPTO_5_LAKH',
//                 securities: [
//                   {
//                     securityType: 'Land and Building',
//                     securityDescription: '',
//                     realizableValue: '',
//                     valuationDate: '',
//                   },
//                   {
//                     securityType: 'Plant and Machinery',
//                     securityDescription: '',
//                     realizableValue: '',
//                     valuationDate: '',
//                   },
//                 ],
//               })
//             }
//             disabled={isSaving}
//           >
//             Reset
//           </Button>
//           <Button
//             onClick={form.handleSubmit(onSubmit)}
//             className='text-white'
//             disabled={isSaving}
//           >
//             {isSaving ? 'Saving…' : 'Save'}
//           </Button>
//         </div>
//       </div>

//       <p className='text-muted-foreground mt-2 text-sm'>
//         This review is connected to the Problem Loan Review service. CBS/CMS
//         fields can be wired later.
//       </p>

//       <Separator className='my-6' />

//       {/* Header / basic */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Loan Reviews</CardTitle>
//           <CardDescription>
//             Problem Loan Review for ≤ ₹5.00 Lakhs
//           </CardDescription>
//         </CardHeader>
//         <CardContent className='grid gap-4 md:grid-cols-2'>
//           <Field label='Account No.' htmlFor='accountNo' hint='Loan account'>
//             <Input
//               id='accountNo'
//               placeholder='LN9876543210'
//               {...form.register('accountNo')}
//             />
//           </Field>
//           <Field label='Sanctioning Authority' htmlFor='sanctioningAuthority'>
//             <Input
//               id='sanctioningAuthority'
//               placeholder='Zonal Credit Committee - North Zone'
//               {...form.register('sanctioningAuthority')}
//             />
//           </Field>
//         </CardContent>
//         <CardFooter className='justify-end'>
//           <Button
//             variant='secondary'
//             type='button'
//             onClick={() =>
//               document
//                 .getElementById('loan-details')
//                 ?.scrollIntoView({ behavior: 'smooth' })
//             }
//           >
//             Start Review
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* 1. Details of the Loan */}
//       <Card id='loan-details' className='mt-6'>
//         <CardHeader>
//           <CardTitle>Details of the Loan</CardTitle>
//         </CardHeader>
//         <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//           <Field
//             label='Name of the Borrower'
//             htmlFor='borrowerName'
//             hint='Fetch from CBS'
//           >
//             <Input
//               id='borrowerName'
//               placeholder='M/s Shree Textiles Pvt. Ltd.'
//               {...form.register('borrowerName')}
//             />
//           </Field>

//           <Field label='Purpose of the Loan' htmlFor='loanPurpose'>
//             <Input
//               id='loanPurpose'
//               placeholder='Working Capital Term Loan for Textile Manufacturing Unit'
//               {...form.register('loanPurpose')}
//             />
//           </Field>

//           <Field
//             label='Date of last sanction / renewal'
//             htmlFor='lastSanctionDate'
//           >
//             <Input
//               id='lastSanctionDate'
//               type='date'
//               {...form.register('lastSanctionDate')}
//             />
//           </Field>

//           <Field
//             label='Sanctioned Limit (₹)'
//             htmlFor='sanctionedLimit'
//             hint='Fetch from CBS'
//           >
//             <Input
//               id='sanctionedLimit'
//               inputMode='decimal'
//               placeholder='15000000'
//               {...form.register('sanctionedLimit')}
//             />
//           </Field>

//           <Field
//             label='Drawing Power (₹)'
//             htmlFor='drawingPower'
//             hint='Fetch from CBS'
//           >
//             <Input
//               id='drawingPower'
//               inputMode='decimal'
//               placeholder='12000000'
//               {...form.register('drawingPower')}
//             />
//           </Field>

//           <Field
//             label='Outstanding (₹)'
//             htmlFor='outstanding'
//             hint='As on review date'
//           >
//             <Input
//               id='outstanding'
//               inputMode='decimal'
//               placeholder='13850000'
//               {...form.register('outstanding')}
//             />
//           </Field>

//           <Field label='Overdue (₹)' htmlFor='overdue'>
//             <Input
//               id='overdue'
//               inputMode='decimal'
//               placeholder='1850000'
//               {...form.register('overdue')}
//             />
//           </Field>

//           <Field
//             label='Borrower Profile / History'
//             htmlFor='borrowerProfileHistory'
//           >
//             <Textarea
//               id='borrowerProfileHistory'
//               placeholder='Long-standing borrower since 2015...'
//               {...form.register('borrowerProfileHistory')}
//             />
//           </Field>
//         </CardContent>
//       </Card>

//       {/* 3. NPA & Provision Details */}
//       <Card className='mt-6'>
//         <CardHeader>
//           <CardTitle>NPA & Provision Details</CardTitle>
//         </CardHeader>
//         <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//           <Field label='Date of NPA' htmlFor='npaDate' hint='Fetch from CBS'>
//             <Input id='npaDate' type='date' {...form.register('npaDate')} />
//           </Field>

//           <Field label='IRAC Status' htmlFor='iracStatus' hint='Fetch from CBS'>
//             <Input
//               id='iracStatus'
//               placeholder='Doubtful - Category I'
//               {...form.register('iracStatus')}
//             />
//           </Field>

//           <Field
//             label='Provision (Secured Portion) (₹)'
//             htmlFor='provisionSecured'
//           >
//             <Input
//               id='provisionSecured'
//               inputMode='decimal'
//               placeholder='3500000'
//               {...form.register('provisionSecured')}
//             />
//           </Field>

//           <Field
//             label='Provision (Unsecured Portion) (₹)'
//             htmlFor='provisionUnsecured'
//           >
//             <Input
//               id='provisionUnsecured'
//               inputMode='decimal'
//               placeholder='1200000'
//               {...form.register('provisionUnsecured')}
//             />
//           </Field>

//           <Field
//             label='Total Provision (₹)'
//             htmlFor='totalProvisionDisplay'
//             hint='Secured + Unsecured'
//           >
//             <Input
//               id='totalProvisionDisplay'
//               value={formatMoney(totalProvision)}
//               readOnly
//               disabled
//             />
//           </Field>

//           <div className='grid gap-4 md:col-span-2'>
//             <Field
//               label='Adverse features observed in running of the account'
//               htmlFor='adverseFeatures'
//             >
//               <Textarea
//                 id='adverseFeatures'
//                 placeholder='Decline in turnover, delays in stock audit...'
//                 {...form.register('adverseFeatures')}
//               />
//             </Field>

//             <Field label='Other Loans with us / others' htmlFor='otherLoans'>
//               <Textarea
//                 id='otherLoans'
//                 placeholder='Term Loan of Rs. 2.5 crore with Bank of Baroda...'
//                 {...form.register('otherLoans')}
//               />
//             </Field>
//           </div>
//         </CardContent>
//       </Card>

//       {/* 4. Details of Action Initiated for Recovery */}
//       <Card className='mt-6'>
//         <CardHeader>
//           <CardTitle>Action Initiated for Recovery</CardTitle>
//         </CardHeader>
//         <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//           <Field
//             label='Civil Suit Approval Date'
//             htmlFor='civilSuitApprovalDate'
//           >
//             <Input
//               id='civilSuitApprovalDate'
//               type='date'
//               {...form.register('civilSuitApprovalDate')}
//             />
//           </Field>

//           <Field label='Civil Suit Filing Date' htmlFor='civilSuitFilingDate'>
//             <Input
//               id='civilSuitFilingDate'
//               type='date'
//               {...form.register('civilSuitFilingDate')}
//             />
//           </Field>

//           <Field label='Suit Amount (₹)' htmlFor='suitAmount'>
//             <Input
//               id='suitAmount'
//               inputMode='decimal'
//               placeholder='14200000'
//               {...form.register('suitAmount')}
//             />
//           </Field>

//           <Field label='Suit Status' htmlFor='suitStatus'>
//             <Input
//               id='suitStatus'
//               placeholder='Pending in DRT Ahmedabad'
//               {...form.register('suitStatus')}
//             />
//           </Field>

//           <Field label='Decree Status' htmlFor='decreeStatus'>
//             <Input
//               id='decreeStatus'
//               placeholder='Awaited'
//               {...form.register('decreeStatus')}
//             />
//           </Field>

//           <Field label='Decree Details' htmlFor='decreeDetails'>
//             <Textarea
//               id='decreeDetails'
//               placeholder='Hearing completed, awaiting DRT order.'
//               {...form.register('decreeDetails')}
//             />
//           </Field>

//           <Field
//             label='Execution Petition Date'
//             htmlFor='executionPetitionDate'
//           >
//             <Input
//               id='executionPetitionDate'
//               type='date'
//               {...form.register('executionPetitionDate')}
//             />
//           </Field>

//           <Field
//             label='SARFAESI Action Initiated?'
//             htmlFor='sarfaesiActionInitiated'
//           >
//             <Controller
//               control={control}
//               name='sarfaesiActionInitiated'
//               render={({ field }) => (
//                 <Select
//                   value={field.value ?? 'NO'}
//                   onValueChange={field.onChange}
//                 >
//                   <SelectTrigger id='sarfaesiActionInitiated'>
//                     <SelectValue placeholder='Select' />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value='YES'>Yes</SelectItem>
//                     <SelectItem value='NO'>No</SelectItem>
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//           </Field>

//           <Field label='Demand Notice Date' htmlFor='demandNoticeDate'>
//             <Input
//               id='demandNoticeDate'
//               type='date'
//               {...form.register('demandNoticeDate')}
//             />
//           </Field>

//           <Field label='Recalled Amount (₹)' htmlFor='recalledAmount'>
//             <Input
//               id='recalledAmount'
//               inputMode='decimal'
//               placeholder='14200000'
//               {...form.register('recalledAmount')}
//             />
//           </Field>

//           <Field label='Borrower Response' htmlFor='borrowerResponse'>
//             <Textarea
//               id='borrowerResponse'
//               placeholder='Borrower requested 3 months for OTS proposal submission...'
//               {...form.register('borrowerResponse')}
//             />
//           </Field>

//           <Field label='Possession Notice Date' htmlFor='possessionNoticeDate'>
//             <Input
//               id='possessionNoticeDate'
//               type='date'
//               {...form.register('possessionNoticeDate')}
//             />
//           </Field>

//           <Field
//             label='Response to Possession Notice'
//             htmlFor='possessionResponse'
//           >
//             <Textarea
//               id='possessionResponse'
//               placeholder='Borrower filed representation under Section 13(3A)...'
//               {...form.register('possessionResponse')}
//             />
//           </Field>

//           <Field
//             label='Physical Possession Date'
//             htmlFor='physicalPossessionDate'
//           >
//             <Input
//               id='physicalPossessionDate'
//               type='date'
//               {...form.register('physicalPossessionDate')}
//             />
//           </Field>

//           <Field label='Sale Proposed Date' htmlFor='saleProposedDate'>
//             <Input
//               id='saleProposedDate'
//               type='date'
//               {...form.register('saleProposedDate')}
//             />
//           </Field>
//         </CardContent>
//       </Card>

//       {/* 5. Details of Security Available */}
//       <Card className='mt-6'>
//         <CardHeader>
//           <CardTitle>Security Available</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className='grid gap-4'>
//             {fields.map((field, idx) => (
//               <div
//                 key={field.id}
//                 className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-6'
//               >
//                 <Field
//                   label='Security Type'
//                   htmlFor={`securities.${idx}.securityType`}
//                 >
//                   <Input
//                     id={`securities.${idx}.securityType`}
//                     placeholder={
//                       idx === 0
//                         ? 'Land and Building'
//                         : idx === 1
//                           ? 'Plant and Machinery'
//                           : 'Type'
//                     }
//                     {...form.register(
//                       `securities.${idx}.securityType` as const
//                     )}
//                   />
//                 </Field>

//                 <Field
//                   label='Description'
//                   htmlFor={`securities.${idx}.securityDescription`}
//                 >
//                   <Input
//                     id={`securities.${idx}.securityDescription`}
//                     {...form.register(
//                       `securities.${idx}.securityDescription` as const
//                     )}
//                   />
//                 </Field>

//                 <Field
//                   label='Realizable Value (₹)'
//                   htmlFor={`securities.${idx}.realizableValue`}
//                 >
//                   <Input
//                     id={`securities.${idx}.realizableValue`}
//                     inputMode='decimal'
//                     {...form.register(
//                       `securities.${idx}.realizableValue` as const
//                     )}
//                   />
//                 </Field>

//                 <Field
//                   label='Valuation Date'
//                   htmlFor={`securities.${idx}.valuationDate`}
//                 >
//                   <Input
//                     id={`securities.${idx}.valuationDate`}
//                     type='date'
//                     {...form.register(
//                       `securities.${idx}.valuationDate` as const
//                     )}
//                   />
//                 </Field>

//                 <Button
//                   type='button'
//                   variant='outline'
//                   onClick={() => remove(idx)}
//                 >
//                   Remove
//                 </Button>
//               </div>
//             ))}
//             <div>
//               <Button
//                 type='button'
//                 variant='secondary'
//                 onClick={() =>
//                   append({
//                     securityType: '',
//                     securityDescription: '',
//                     realizableValue: '',
//                     valuationDate: '',
//                   })
//                 }
//               >
//                 Add Security
//               </Button>
//             </div>
//           </div>
//         </CardContent>

//         <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//           <Field
//             label='Last Inspection Date'
//             htmlFor='lastInspectionDate'
//             hint='Branch inspection / review'
//           >
//             <Input
//               id='lastInspectionDate'
//               type='date'
//               {...form.register('lastInspectionDate')}
//             />
//           </Field>

//           <Field label='Reason for account becoming NPA' htmlFor='reasonForNPA'>
//             <Textarea
//               id='reasonForNPA'
//               placeholder='Reduced cash inflow due to loss of export contracts...'
//               {...form.register('reasonForNPA')}
//             />
//           </Field>
//         </CardContent>
//       </Card>

//       {/* Commentary Position */}
//       <Card className='mt-6'>
//         <CardHeader>
//           <CardTitle>Commentary Position</CardTitle>
//         </CardHeader>
//         <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
//           <Field
//             label='Comments on Staff Accountability (if any)'
//             htmlFor='staffAccountabilityComments'
//           >
//             <Textarea
//               id='staffAccountabilityComments'
//               placeholder='No staff lapses observed; credit monitoring adequate...'
//               {...form.register('staffAccountabilityComments')}
//             />
//           </Field>

//           <Field
//             label='Current Security Status'
//             htmlFor='currentSecurityStatus'
//           >
//             <Textarea
//               id='currentSecurityStatus'
//               placeholder='Physical possession with the bank, valuation completed, e-auction under process.'
//               {...form.register('currentSecurityStatus')}
//             />
//           </Field>

//           <Field
//             label='Last Inspection / Meeting Date'
//             htmlFor='lastInspectionMeetingDate'
//           >
//             <Input
//               id='lastInspectionMeetingDate'
//               type='date'
//               {...form.register('lastInspectionMeetingDate')}
//             />
//           </Field>

//           <Field
//             label='Summary of discussions with borrower/guarantor'
//             htmlFor='summaryOfDiscussions'
//           >
//             <Textarea
//               id='summaryOfDiscussions'
//               placeholder='Discussed ongoing SARFAESI action, pending DRT hearing...'
//               {...form.register('summaryOfDiscussions')}
//             />
//           </Field>

//           <Field
//             label='Action taken / proposed'
//             htmlFor='actionTakenOrProposed'
//           >
//             <Textarea
//               id='actionTakenOrProposed'
//               placeholder='Initiate fresh e-auction, update insurance...'
//               {...form.register('actionTakenOrProposed')}
//             />
//           </Field>

//           <Field
//             label='Likely timeframe for upgradation'
//             htmlFor='likelyTimeFrameForUpgrade'
//           >
//             <Input
//               id='likelyTimeFrameForUpgrade'
//               placeholder='Account expected to be upgraded post asset sale and partial recovery by FY 2025-26.'
//               {...form.register('likelyTimeFrameForUpgrade')}
//             />
//           </Field>
//         </CardContent>
//         <CardFooter className='justify-between'>
//           <Button
//             variant='secondary'
//             type='button'
//             onClick={form.handleSubmit(onSubmit)}
//             disabled={isSaving}
//           >
//             Submit for Recommendation
//           </Button>
//           <div className='flex gap-2'>
//             <Button
//               variant='outline'
//               onClick={() =>
//                 form.reset({
//                   limitCategory: 'UPTO_5_LAKH',
//                   securities: [
//                     {
//                       securityType: 'Land and Building',
//                       securityDescription: '',
//                       realizableValue: '',
//                       valuationDate: '',
//                     },
//                     {
//                       securityType: 'Plant and Machinery',
//                       securityDescription: '',
//                       realizableValue: '',
//                       valuationDate: '',
//                     },
//                   ],
//                 })
//               }
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={form.handleSubmit(onSubmit)}
//               className='text-white'
//               disabled={isSaving}
//             >
//               {isSaving ? 'Saving…' : 'Save'}
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>
//     </div>
//   )
// }














import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Search } from '@/components/search'

export const Route = createFileRoute(
  '/_authenticated/problem-loan-review/review/$accountNumber'
)({
  component: RouteComponent,
})

/* =============================
   Problem Loan (NPA & PNPA) — API-backed Form
   Prefill: GET /account/getAccountDetail?acctNm=<accountNumber>
   Submit : POST /problem-loan-reviews/create
============================= */

const SecurityRowSchema = z.object({
  securityType: z.string().optional(),
  securityDescription: z.string().optional(),
  realizableValue: z.string().optional(),
  valuationDate: z.string().optional(),
})

const FormSchema = z.object({
  limitCategory: z.enum(['UPTO_5_LAKH']).default('UPTO_5_LAKH'),

  borrowerName: z.string().optional(),
  accountNo: z.string().optional(),
  loanPurpose: z.string().optional(),
  lastSanctionDate: z.string().optional(),
  sanctionedLimit: z.string().optional(),
  drawingPower: z.string().optional(),
  outstanding: z.string().optional(),
  overdue: z.string().optional(),
  sanctioningAuthority: z.string().optional(),
  borrowerProfileHistory: z.string().optional(),

  npaDate: z.string().optional(),
  iracStatus: z.string().optional(),
  provisionSecured: z.string().optional(),
  provisionUnsecured: z.string().optional(),
  adverseFeatures: z.string().optional(),
  otherLoans: z.string().optional(),

  civilSuitApprovalDate: z.string().optional(),
  civilSuitFilingDate: z.string().optional(),
  suitAmount: z.string().optional(),
  suitStatus: z.string().optional(),
  decreeStatus: z.string().optional(),
  decreeDetails: z.string().optional(),
  executionPetitionDate: z.string().optional(),

  sarfaesiActionInitiated: z.enum(['YES', 'NO']).optional(),
  demandNoticeDate: z.string().optional(),
  recalledAmount: z.string().optional(),
  borrowerResponse: z.string().optional(),
  possessionNoticeDate: z.string().optional(),
  possessionResponse: z.string().optional(),
  physicalPossessionDate: z.string().optional(),
  saleProposedDate: z.string().optional(),

  securities: z.array(SecurityRowSchema).default([]),

  lastInspectionDate: z.string().optional(),
  reasonForNPA: z.string().optional(),
  staffAccountabilityComments: z.string().optional(),
  currentSecurityStatus: z.string().optional(),
  lastInspectionMeetingDate: z.string().optional(),
  summaryOfDiscussions: z.string().optional(),
  actionTakenOrProposed: z.string().optional(),
  likelyTimeFrameForUpgrade: z.string().optional(),
})

export type FormValues = z.infer<typeof FormSchema>

/** ===== Account detail API types (same shape you shared earlier) ===== */
type AccountCustomer = {
  acctNo?: string
  acctDesc?: string
  custNumber?: string
  telNo?: string
  segement?: string
  custName?: string
  add1?: string | null
  add2?: string | null
  add3?: string | null
  add4?: string | null
  loanLimit?: number
  intRate?: number
  theoBal?: number
  outstand?: number
  irregAmt?: number
  sanctDt?: string
  emisDue?: number
  emisPaid?: number
  emisOvrdue?: number
  currency?: string
  maintBr?: number
  instalAmt?: number
  irrgDtString?: string | null
  branchCode?: string
}

type AccountDetailResponse = {
  status?: string
  message?: string
  customer?: AccountCustomer
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
    </div>
  )
}

function toNumberOrUndefined(value?: string): number | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(n)) return undefined
  return n
}

function toNumber(value?: string): number {
  const n = Number((value || '').toString().replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function normalizeDateOnly(v?: string | null): string {
  if (!v) return ''
  const s = v.trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)
  return s
}

const defaultSecurities: FormValues['securities'] = [
  {
    securityType: 'Land and Building',
    securityDescription: '',
    realizableValue: '',
    valuationDate: '',
  },
  {
    securityType: 'Plant and Machinery',
    securityDescription: '',
    realizableValue: '',
    valuationDate: '',
  },
]

function RouteComponent() {
  const { accountNumber } = Route.useParams()
  const navigate = useNavigate()

  const [accountDetails, setAccountDetails] = useState<AccountCustomer | null>(
    null
  )

  const form = useForm<FormValues>({
    defaultValues: {
      limitCategory: 'UPTO_5_LAKH',
      securities: defaultSecurities,
      sarfaesiActionInitiated: 'NO',
    },
  })

  const { control } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'securities',
  })

  // ✅ Lock only fields that are actually prefilled
  const lockPrefilled = !!accountDetails

  // Derived: totalProvision = provisionSecured + provisionUnsecured
  const totalProvision = useMemo(() => {
    const secured = toNumber(form.watch('provisionSecured'))
    const unsecured = toNumber(form.watch('provisionUnsecured'))
    return secured + unsecured
  }, [form.watch('provisionSecured'), form.watch('provisionUnsecured')])

  // ===== Mutation: submit =====
  const createProblemLoanReviewMutation = $api.useMutation(
    'post',
    '/problem-loan-reviews/create',
    {
      onSuccess: () => {
        toast.success('Problem loan review created successfully!')
        setAccountDetails(null)
        form.reset({
          limitCategory: 'UPTO_5_LAKH',
          securities: defaultSecurities,
          sarfaesiActionInitiated: 'NO',
        })
        navigate({ to: '/problem-loan-review/eligible' })
      },
      onError: (error) =>
        toastError(
          error,
          'Could not create problem loan review. Please try again.'
        ),
    }
  )

  // ===== Prefill API call (same style as your OTS page) =====
  const { mutate: fetchAccountDetails, isPending: isPrefilling } =
    $api.useMutation('get', '/account/getAccountDetail')

  /**
   * ✅ helper: setValue without overriding user edits
   */
  const setIfBlankAndNotDirty = React.useCallback(
    (name: keyof FormValues, value?: string) => {
      if (value === undefined || value === null) return
      const v = String(value)
      if (!v.trim()) return

      const state = form.getFieldState(name)
      if (state.isDirty) return

      const current = form.getValues(name)
      if (current && current.length > 0) return

      form.setValue(name, v, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    },
    [form]
  )

  useEffect(() => {
    if (!accountNumber) return

    fetchAccountDetails(
      {
        params: {
          query: { acctNm: accountNumber },
        },
      },
      {
        onSuccess: (res) => {
          // Your API might return:
          // 1) { status, message, customer: {...} }
          // 2) { body: { ...same... } }
          const raw = res as unknown as { body?: AccountDetailResponse } & AccountDetailResponse
          const body = raw.body ?? raw
          const customer = body.customer

          if (!customer) {
            toast.error(body.message || 'Could not load account details for prefill')
            return
          }

          setAccountDetails(customer)

          // ✅ Full reset like OTS (best approach for prefill)
          form.reset({
            limitCategory: 'UPTO_5_LAKH',
            securities: defaultSecurities,
            sarfaesiActionInitiated: 'NO',

            accountNo: customer.acctNo ?? accountNumber,
            borrowerName: customer.custName ?? '',
            loanPurpose: customer.acctDesc ?? '',
            lastSanctionDate: normalizeDateOnly(customer.sanctDt),

            sanctionedLimit:
              customer.loanLimit !== undefined ? String(customer.loanLimit) : '',
            // if your account API later gives drawing power, map it here
            drawingPower: '',

            outstanding:
              customer.outstand !== undefined
                ? String(Math.abs(customer.outstand))
                : '',
            overdue:
              customer.irregAmt !== undefined ? String(customer.irregAmt) : '',

            // rest remain manual
            sanctioningAuthority: '',
            borrowerProfileHistory: '',
            npaDate: '',
            iracStatus: '',
            provisionSecured: '',
            provisionUnsecured: '',
            adverseFeatures: '',
            otherLoans: '',
            civilSuitApprovalDate: '',
            civilSuitFilingDate: '',
            suitAmount: '',
            suitStatus: '',
            decreeStatus: '',
            decreeDetails: '',
            executionPetitionDate: '',
            demandNoticeDate: '',
            recalledAmount: '',
            borrowerResponse: '',
            possessionNoticeDate: '',
            possessionResponse: '',
            physicalPossessionDate: '',
            saleProposedDate: '',
            lastInspectionDate: '',
            reasonForNPA: '',
            staffAccountabilityComments: '',
            currentSecurityStatus: '',
            lastInspectionMeetingDate: '',
            summaryOfDiscussions: '',
            actionTakenOrProposed: '',
            likelyTimeFrameForUpgrade: '',
          })

          // ✅ If you want “don’t overwrite if user already typed”, enable these:
          // (useful if you ever change reset() to partial setValue)
          setIfBlankAndNotDirty('accountNo', customer.acctNo ?? accountNumber)
          setIfBlankAndNotDirty('borrowerName', customer.custName ?? '')
          setIfBlankAndNotDirty('loanPurpose', customer.acctDesc ?? '')
          setIfBlankAndNotDirty('lastSanctionDate', normalizeDateOnly(customer.sanctDt))
          setIfBlankAndNotDirty(
            'sanctionedLimit',
            customer.loanLimit !== undefined ? String(customer.loanLimit) : ''
          )
          setIfBlankAndNotDirty(
            'outstanding',
            customer.outstand !== undefined
              ? String(Math.abs(customer.outstand))
              : ''
          )
          setIfBlankAndNotDirty(
            'overdue',
            customer.irregAmt !== undefined ? String(customer.irregAmt) : ''
          )
        },
        onError: () => {
          toast.error('Failed to fetch account details for prefill')
        },
      }
    )
  }, [accountNumber, fetchAccountDetails, form, setIfBlankAndNotDirty])

  const onSubmit = (values: FormValues) => {
    const body = {
      borrowerName: values.borrowerName || undefined,
      accountNo: values.accountNo || undefined,
      loanPurpose: values.loanPurpose || undefined,
      lastSanctionDate: values.lastSanctionDate || undefined,
      sanctionedLimit: toNumberOrUndefined(values.sanctionedLimit),
      drawingPower: toNumberOrUndefined(values.drawingPower),
      outstanding: toNumberOrUndefined(values.outstanding),
      overdue: toNumberOrUndefined(values.overdue),
      sanctioningAuthority: values.sanctioningAuthority || undefined,
      borrowerProfileHistory: values.borrowerProfileHistory || undefined,

      npaDate: values.npaDate || undefined,
      iracStatus: values.iracStatus || undefined,
      provisionSecured: toNumberOrUndefined(values.provisionSecured),
      provisionUnsecured: toNumberOrUndefined(values.provisionUnsecured),
      totalProvision: totalProvision || 0,

      adverseFeatures: values.adverseFeatures || undefined,
      otherLoans: values.otherLoans || undefined,

      civilSuitApprovalDate: values.civilSuitApprovalDate || undefined,
      civilSuitFilingDate: values.civilSuitFilingDate || undefined,
      suitAmount: toNumberOrUndefined(values.suitAmount),
      suitStatus: values.suitStatus || undefined,
      decreeStatus: values.decreeStatus || undefined,
      decreeDetails: values.decreeDetails || undefined,
      executionPetitionDate: values.executionPetitionDate || undefined,

      sarfaesiActionInitiated:
        values.sarfaesiActionInitiated === 'YES'
          ? true
          : values.sarfaesiActionInitiated === 'NO'
            ? false
            : undefined,

      demandNoticeDate: values.demandNoticeDate || undefined,
      recalledAmount: toNumberOrUndefined(values.recalledAmount),
      borrowerResponse: values.borrowerResponse || undefined,
      possessionNoticeDate: values.possessionNoticeDate || undefined,
      possessionResponse: values.possessionResponse || undefined,
      physicalPossessionDate: values.physicalPossessionDate || undefined,
      saleProposedDate: values.saleProposedDate || undefined,

      securities:
        values.securities?.map((s) => ({
          securityType: s.securityType || undefined,
          securityDescription: s.securityDescription || undefined,
          realizableValue: toNumberOrUndefined(s.realizableValue),
          valuationDate: s.valuationDate || undefined,
        })) ?? [],

      lastInspectionDate: values.lastInspectionDate || undefined,
      reasonForNPA: values.reasonForNPA || undefined,
      staffAccountabilityComments:
        values.staffAccountabilityComments || undefined,
      currentSecurityStatus: values.currentSecurityStatus || undefined,
      lastInspectionMeetingDate: values.lastInspectionMeetingDate || undefined,
      summaryOfDiscussions: values.summaryOfDiscussions || undefined,
      actionTakenOrProposed: values.actionTakenOrProposed || undefined,
      likelyTimeFrameForUpgrade: values.likelyTimeFrameForUpgrade || undefined,
    }

    createProblemLoanReviewMutation.mutate({
      params: { header: { Authorization: '' } },
      body,
    })
  }

  const isSaving = createProblemLoanReviewMutation.isPending

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
        {isPrefilling ? (
          <div className='text-muted-foreground text-sm'>
            Loading account details…
          </div>
        ) : null}

        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Problem Loan (NPA & PNPA) Review
          </h1>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() =>
                form.reset({
                  limitCategory: 'UPTO_5_LAKH',
                  securities: defaultSecurities,
                  sarfaesiActionInitiated: 'NO',
                })
              }
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              className='text-white'
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        <p className='text-muted-foreground mt-2 text-sm'>
          This review is connected to the Problem Loan Review service. CBS/CMS
          fields can be wired later.
        </p>

        <Separator className='my-6' />

        {/* Header / basic */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Reviews</CardTitle>
            <CardDescription>
              Problem Loan Review for ≤ ₹5.00 Lakhs
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <Field label='Account No.' htmlFor='accountNo' hint='Loan account'>
              <Input
                id='accountNo'
                placeholder='00161430000169'
                {...form.register('accountNo')}
                readOnly={lockPrefilled}
              />
            </Field>
            <Field label='Sanctioning Authority' htmlFor='sanctioningAuthority'>
              <Input
                id='sanctioningAuthority'
                placeholder='Zonal Credit Committee - North Zone'
                {...form.register('sanctioningAuthority')}
              />
            </Field>
          </CardContent>
          <CardFooter className='justify-end'>
            <Button
              variant='secondary'
              type='button'
              onClick={() =>
                document
                  .getElementById('loan-details')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Start Review
            </Button>
          </CardFooter>
        </Card>

        {/* 1. Details of the Loan */}
        <Card id='loan-details' className='mt-6'>
          <CardHeader>
            <CardTitle>Details of the Loan</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field
              label='Name of the Borrower'
              htmlFor='borrowerName'
              hint='Prefilled from Account API'
            >
              <Input
                id='borrowerName'
                placeholder='Borrower name'
                {...form.register('borrowerName')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field label='Purpose of the Loan' htmlFor='loanPurpose'>
              <Input
                id='loanPurpose'
                placeholder='Purpose'
                {...form.register('loanPurpose')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field
              label='Date of last sanction / renewal'
              htmlFor='lastSanctionDate'
            >
              <Input
                id='lastSanctionDate'
                type='date'
                {...form.register('lastSanctionDate')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field label='Sanctioned Limit (₹)' htmlFor='sanctionedLimit'>
              <Input
                id='sanctionedLimit'
                inputMode='decimal'
                placeholder='0'
                {...form.register('sanctionedLimit')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field label='Drawing Power (₹)' htmlFor='drawingPower'>
              <Input
                id='drawingPower'
                inputMode='decimal'
                placeholder='0'
                {...form.register('drawingPower')}
              />
            </Field>

            <Field label='Outstanding (₹)' htmlFor='outstanding' hint='As on review date'>
              <Input
                id='outstanding'
                inputMode='decimal'
                placeholder='0'
                {...form.register('outstanding')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field label='Overdue (₹)' htmlFor='overdue'>
              <Input
                id='overdue'
                inputMode='decimal'
                placeholder='0'
                {...form.register('overdue')}
                readOnly={lockPrefilled}
              />
            </Field>

            <Field label='Borrower Profile / History' htmlFor='borrowerProfileHistory'>
              <Textarea
                id='borrowerProfileHistory'
                placeholder='...'
                {...form.register('borrowerProfileHistory')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* 3. NPA & Provision Details */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>NPA & Provision Details</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='Date of NPA' htmlFor='npaDate'>
              <Input id='npaDate' type='date' {...form.register('npaDate')} />
            </Field>

            <Field label='IRAC Status' htmlFor='iracStatus'>
              <Input
                id='iracStatus'
                placeholder='IRAC'
                {...form.register('iracStatus')}
              />
            </Field>

            <Field label='Provision (Secured Portion) (₹)' htmlFor='provisionSecured'>
              <Input
                id='provisionSecured'
                inputMode='decimal'
                placeholder='0'
                {...form.register('provisionSecured')}
              />
            </Field>

            <Field label='Provision (Unsecured Portion) (₹)' htmlFor='provisionUnsecured'>
              <Input
                id='provisionUnsecured'
                inputMode='decimal'
                placeholder='0'
                {...form.register('provisionUnsecured')}
              />
            </Field>

            <Field label='Total Provision (₹)' htmlFor='totalProvisionDisplay' hint='Secured + Unsecured'>
              <Input
                id='totalProvisionDisplay'
                value={formatMoney(totalProvision)}
                readOnly
                disabled
              />
            </Field>

            <div className='grid gap-4 md:col-span-2'>
              <Field label='Adverse features observed in running of the account' htmlFor='adverseFeatures'>
                <Textarea
                  id='adverseFeatures'
                  placeholder='...'
                  {...form.register('adverseFeatures')}
                />
              </Field>

              <Field label='Other Loans with us / others' htmlFor='otherLoans'>
                <Textarea
                  id='otherLoans'
                  placeholder='...'
                  {...form.register('otherLoans')}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* 4. Details of Action Initiated for Recovery */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Action Initiated for Recovery</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='Civil Suit Approval Date' htmlFor='civilSuitApprovalDate'>
              <Input
                id='civilSuitApprovalDate'
                type='date'
                {...form.register('civilSuitApprovalDate')}
              />
            </Field>

            <Field label='Civil Suit Filing Date' htmlFor='civilSuitFilingDate'>
              <Input
                id='civilSuitFilingDate'
                type='date'
                {...form.register('civilSuitFilingDate')}
              />
            </Field>

            <Field label='Suit Amount (₹)' htmlFor='suitAmount'>
              <Input
                id='suitAmount'
                inputMode='decimal'
                placeholder='0'
                {...form.register('suitAmount')}
              />
            </Field>

            <Field label='Suit Status' htmlFor='suitStatus'>
              <Input
                id='suitStatus'
                placeholder='...'
                {...form.register('suitStatus')}
              />
            </Field>

            <Field label='Decree Status' htmlFor='decreeStatus'>
              <Input
                id='decreeStatus'
                placeholder='...'
                {...form.register('decreeStatus')}
              />
            </Field>

            <Field label='Decree Details' htmlFor='decreeDetails'>
              <Textarea
                id='decreeDetails'
                placeholder='...'
                {...form.register('decreeDetails')}
              />
            </Field>

            <Field label='Execution Petition Date' htmlFor='executionPetitionDate'>
              <Input
                id='executionPetitionDate'
                type='date'
                {...form.register('executionPetitionDate')}
              />
            </Field>

            <Field label='SARFAESI Action Initiated?' htmlFor='sarfaesiActionInitiated'>
              <Controller
                control={control}
                name='sarfaesiActionInitiated'
                render={({ field }) => (
                  <Select value={field.value ?? 'NO'} onValueChange={field.onChange}>
                    <SelectTrigger id='sarfaesiActionInitiated'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='YES'>Yes</SelectItem>
                      <SelectItem value='NO'>No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label='Demand Notice Date' htmlFor='demandNoticeDate'>
              <Input
                id='demandNoticeDate'
                type='date'
                {...form.register('demandNoticeDate')}
              />
            </Field>

            <Field label='Recalled Amount (₹)' htmlFor='recalledAmount'>
              <Input
                id='recalledAmount'
                inputMode='decimal'
                placeholder='0'
                {...form.register('recalledAmount')}
              />
            </Field>

            <Field label='Borrower Response' htmlFor='borrowerResponse'>
              <Textarea
                id='borrowerResponse'
                placeholder='...'
                {...form.register('borrowerResponse')}
              />
            </Field>

            <Field label='Possession Notice Date' htmlFor='possessionNoticeDate'>
              <Input
                id='possessionNoticeDate'
                type='date'
                {...form.register('possessionNoticeDate')}
              />
            </Field>

            <Field label='Response to Possession Notice' htmlFor='possessionResponse'>
              <Textarea
                id='possessionResponse'
                placeholder='...'
                {...form.register('possessionResponse')}
              />
            </Field>

            <Field label='Physical Possession Date' htmlFor='physicalPossessionDate'>
              <Input
                id='physicalPossessionDate'
                type='date'
                {...form.register('physicalPossessionDate')}
              />
            </Field>

            <Field label='Sale Proposed Date' htmlFor='saleProposedDate'>
              <Input
                id='saleProposedDate'
                type='date'
                {...form.register('saleProposedDate')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* 5. Details of Security Available */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Security Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-6'
                >
                  <Field label='Security Type' htmlFor={`securities.${idx}.securityType`}>
                    <Input
                      id={`securities.${idx}.securityType`}
                      placeholder={
                        idx === 0
                          ? 'Land and Building'
                          : idx === 1
                            ? 'Plant and Machinery'
                            : 'Type'
                      }
                      {...form.register(`securities.${idx}.securityType` as const)}
                    />
                  </Field>

                  <Field label='Description' htmlFor={`securities.${idx}.securityDescription`}>
                    <Input
                      id={`securities.${idx}.securityDescription`}
                      {...form.register(`securities.${idx}.securityDescription` as const)}
                    />
                  </Field>

                  <Field label='Realizable Value (₹)' htmlFor={`securities.${idx}.realizableValue`}>
                    <Input
                      id={`securities.${idx}.realizableValue`}
                      inputMode='decimal'
                      {...form.register(`securities.${idx}.realizableValue` as const)}
                    />
                  </Field>

                  <Field label='Valuation Date' htmlFor={`securities.${idx}.valuationDate`}>
                    <Input
                      id={`securities.${idx}.valuationDate`}
                      type='date'
                      {...form.register(`securities.${idx}.valuationDate` as const)}
                    />
                  </Field>

                  <Button type='button' variant='outline' onClick={() => remove(idx)}>
                    Remove
                  </Button>
                </div>
              ))}

              <div>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() =>
                    append({
                      securityType: '',
                      securityDescription: '',
                      realizableValue: '',
                      valuationDate: '',
                    })
                  }
                >
                  Add Security
                </Button>
              </div>
            </div>
          </CardContent>

          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field
              label='Last Inspection Date'
              htmlFor='lastInspectionDate'
              hint='Branch inspection / review'
            >
              <Input
                id='lastInspectionDate'
                type='date'
                {...form.register('lastInspectionDate')}
              />
            </Field>

            <Field label='Reason for account becoming NPA' htmlFor='reasonForNPA'>
              <Textarea
                id='reasonForNPA'
                placeholder='...'
                {...form.register('reasonForNPA')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Commentary Position */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Commentary Position</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='Comments on Staff Accountability (if any)' htmlFor='staffAccountabilityComments'>
              <Textarea
                id='staffAccountabilityComments'
                placeholder='...'
                {...form.register('staffAccountabilityComments')}
              />
            </Field>

            <Field label='Current Security Status' htmlFor='currentSecurityStatus'>
              <Textarea
                id='currentSecurityStatus'
                placeholder='...'
                {...form.register('currentSecurityStatus')}
              />
            </Field>

            <Field label='Last Inspection / Meeting Date' htmlFor='lastInspectionMeetingDate'>
              <Input
                id='lastInspectionMeetingDate'
                type='date'
                {...form.register('lastInspectionMeetingDate')}
              />
            </Field>

            <Field label='Summary of discussions with borrower/guarantor' htmlFor='summaryOfDiscussions'>
              <Textarea
                id='summaryOfDiscussions'
                placeholder='...'
                {...form.register('summaryOfDiscussions')}
              />
            </Field>

            <Field label='Action taken / proposed' htmlFor='actionTakenOrProposed'>
              <Textarea
                id='actionTakenOrProposed'
                placeholder='...'
                {...form.register('actionTakenOrProposed')}
              />
            </Field>

            <Field label='Likely timeframe for upgradation' htmlFor='likelyTimeFrameForUpgrade'>
              <Input
                id='likelyTimeFrameForUpgrade'
                placeholder='...'
                {...form.register('likelyTimeFrameForUpgrade')}
              />
            </Field>
          </CardContent>

          <CardFooter className='justify-between'>
            <Button
              variant='secondary'
              type='button'
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              Submit for Recommendation
            </Button>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() =>
                  form.reset({
                    limitCategory: 'UPTO_5_LAKH',
                    securities: defaultSecurities,
                    sarfaesiActionInitiated: 'NO',
                  })
                }
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
    </>
  )
}
