// import React, { useEffect, useState } from 'react'
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
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
// import { Separator } from '@/components/ui/separator'
// import { Textarea } from '@/components/ui/textarea'
// import { Header } from '@/components/layout/header'
// import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
// import { ThemeSwitch } from '@/components/theme-switch'
// export const Route = createFileRoute('/_authenticated/auca/transfer')({
//   component: RouteComponent,
// })
// /* =============================
//    AUCA Transfer — API-backed Form
//    Target payload schema:
//    {
//      accountNumber, borrowerName, loanPurpose, loanSanctionDate, npaDate,
//      limit, outstanding, accruedInterestAmount, includingAccruedInterest,
//      securityValue, recommendationDetails
//    }
// ============================= */
// const FormSchema = z.object({
//   accountNumber: z.string().min(1, 'Required'),
//   borrowerName: z.string().min(1, 'Required'),
//   loanPurpose: z.string().min(1, 'Required'),
//   // ✅ NEW (read-only)
//   branchCode: z.string().optional(),
//   branchName: z.string().optional(),
//   regionalOffice: z.string().optional(), // departmentName
//   loanSanctionDate: z.string().min(1, 'Required'),
//   npaDate: z.string().min(1, 'Required'),
//   limit: z.string().min(1, 'Required'),
//   outstanding: z.string().min(1, 'Required'),
//   accruedInterestAmount: z.string().optional(),
//   includingAccruedInterest: z.string().optional(),
//   securityValue: z.string().optional(),
//   recommendationDetails: z.string().min(1, 'Required'),
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
// // type AucaEligibleDetails = Partial<{
// //   accountNumber: string
// //   borrowerName: string
// //   loanPurpose: string
// //   loanSanctionDate: string
// //   npaDate: string
// //   limit: number
// //   outstanding: number
// //   accruedInterestAmount: number
// //   includingAccruedInterest: number
// //   securityValue: number
// //   recommendationDetails: string
// // }>
// function RouteComponent() {
//   const router = useRouter()
//   const search = Route.useSearch() as { acctNo?: string }
//   const acctNoFromSearch = search?.acctNo
//   const [prefillLoading, setPrefillLoading] = useState(false)
//   const form = useForm<FormValues>({
//     defaultValues: {
//       accountNumber: acctNoFromSearch ?? '',
//       borrowerName: '',
//       loanPurpose: '',
//       // ✅ NEW
//       branchCode: '',
//       branchName: '',
//       regionalOffice: '',
//       loanSanctionDate: '',
//       npaDate: '',
//       limit: '',
//       outstanding: '',
//       accruedInterestAmount: '0',
//       includingAccruedInterest: '',
//       securityValue: '0',
//       recommendationDetails: '',
//     },
//   })
//   const handleReset = () => {
//     form.reset({
//       accountNumber: acctNoFromSearch ?? '',
//       borrowerName: '',
//       loanPurpose: '',
//       // ✅ NEW
//       branchCode: form.getValues('branchCode') ?? '',
//       branchName: form.getValues('branchName') ?? '',
//       regionalOffice: form.getValues('regionalOffice') ?? '',
//       loanSanctionDate: '',
//       npaDate: '',
//       limit: '',
//       outstanding: '',
//       accruedInterestAmount: '0',
//       includingAccruedInterest: '',
//       securityValue: '0',
//       recommendationDetails: '',
//     })
//   }
//   const { data: branchDepartmentInfo, isLoading: branchDepartmentInfoLoading } =
//     $api.useQuery('get', '/branches/{accountNumber}/branch-department-info', {
//       params: { path: { accountNumber: acctNoFromSearch ?? '' } },
//     })
//   useEffect(() => {
//     if (!acctNoFromSearch) return
//     if (!branchDepartmentInfo) return
//     const info = branchDepartmentInfo
//     form.setValue('branchCode', info?.branchCode ?? '', { shouldDirty: false })
//     form.setValue('branchName', info?.branchName ?? '', { shouldDirty: false })
//     form.setValue('regionalOffice', info?.departmentName ?? '', {
//       shouldDirty: false,
//     })
//   }, [acctNoFromSearch, branchDepartmentInfo, form])
//   // ---- POST create (keep your existing endpoint)
//   const createAucaTransferMutation = $api.useMutation(
//     'post',
//     '/auca-transfer/create',
//     {
//       onSuccess: () => {
//         toast.success('AUCA transfer proposal created successfully!')
//         handleReset()
//         router.navigate({ to: '/auca/eligible' })
//       },
//       onError: (error) =>
//         toastError(error, 'Could not create AUCA transfer proposal.'),
//     }
//   )
//   // ---- GET prefill (keep your existing endpoint; map whatever it returns)
//   const { mutate: fetchAucaDetails } = $api.useMutation(
//     'get',
//     '/auca-transfer/AucaEligible/{acctNo}'
//   )
//   // Prefill from acctNo (if provided via search)
//   useEffect(() => {
//     if (!acctNoFromSearch) return
//     setPrefillLoading(true)
//     fetchAucaDetails(
//       {
//         params: {
//           path: {
//             acctNo: acctNoFromSearch,
//           },
//         },
//       },
//       {
//         onSuccess: (res) => {
//           setPrefillLoading(false)
//           const body = res
//           if (!body.data) {
//             toast.error('No AUCA details found for this account')
//             return
//           }
//           const d = body.data
//           // Derive includingAccruedInterest if server didn’t send it
//           const limitStr =
//             d.loanLimit !== undefined && d.loanLimit !== null
//               ? String(d.loanLimit)
//               : ''
//           const outstandingStr =
//             d.outstand !== undefined && d.outstand !== null
//               ? String(d.outstand)
//               : ''
//           // const accruedStr =
//           //   d.accruedInterestAmount !== undefined &&
//           //   d.accruedInterestAmount !== null
//           //     ? String(d.accruedInterestAmount)
//           //     : '0'
//           // const includingDerived =
//           //   d.includingAccruedInterest !== undefined &&
//           //   d.includingAccruedInterest !== null
//           //     ? String(d.includingAccruedInterest)
//           //     : String(
//           //         toNumberOrZero(outstandingStr) + toNumberOrZero(accruedStr)
//           //       )
//           form.reset({
//             accountNumber: d.acctNo ?? acctNoFromSearch ?? '',
//             borrowerName: d.custName ?? '',
//             loanPurpose: d.acctDesc ?? '',
//             // ✅ NEW: keep the branch/RO values already set from branchDepartmentInfo
//             branchCode: form.getValues('branchCode') ?? '',
//             branchName: form.getValues('branchName') ?? '',
//             regionalOffice: form.getValues('regionalOffice') ?? '',
//             loanSanctionDate: d.sanctDt ?? '',
//             npaDate: d.npaDt ?? '',
//             limit: limitStr,
//             outstanding: outstandingStr,
//             securityValue:
//               d.secuAmt !== undefined && d.secuAmt !== null
//                 ? String(d.secuAmt)
//                 : '0',
//             recommendationDetails:
//               form.getValues('recommendationDetails') ?? '',
//           })
//         },
//         onError: () => {
//           setPrefillLoading(false)
//           toast.error('Failed to prefill AUCA details from account')
//         },
//       }
//     )
//   }, [acctNoFromSearch, fetchAucaDetails, form])
//   const onSubmit = (values: FormValues) => {
//     const outstanding = toNumberOrZero(values.outstanding)
//     const accrued = toNumberOrZero(values.accruedInterestAmount)
//     const including =
//       toNumberOrUndefined(values.includingAccruedInterest) ??
//       outstanding + accrued
//     createAucaTransferMutation.mutate({
//       params: {
//         header: {
//           Authorization: '',
//         },
//       },
//       body: {
//         bankType: 'TGB',
//         accountNumber: values.accountNumber.trim(),
//         borrowerName: values.borrowerName.trim(),
//         loanPurpose: values.loanPurpose.trim(),
//         branchCode: values.branchCode?.trim() || undefined,
//         branchName: values.branchName?.trim() || undefined,
//         regionalOffice: values.regionalOffice?.trim() || undefined,
//         loanSanctionDate: values.loanSanctionDate,
//         npaDate: values.npaDate,
//         loanSanctionAmt: toNumberOrZero(values.limit),
//         outstandingAmt: outstanding,
//         accruedInterestAmount: accrued,
//         includingUnappliedInterest: including,
//         securityValue: toNumberOrZero(values.securityValue),
//         tgbConfirmationStatement: values.recommendationDetails.trim(),
//       },
//     })
//   }
//   const isSaving = createAucaTransferMutation.isPending
//   // Keep includingAccruedInterest live-updated as outstanding/accrued changes
//   const outstandingWatch = form.watch('outstanding')
//   const accruedWatch = form.watch('accruedInterestAmount')
//   useEffect(() => {
//     const next = String(
//       toNumberOrZero(outstandingWatch) + toNumberOrZero(accruedWatch)
//     )
//     // setValue without marking dirty too aggressively
//     form.setValue('includingAccruedInterest', next, {
//       shouldDirty: false,
//       shouldTouch: false,
//       shouldValidate: false,
//     })
//   }, [outstandingWatch, accruedWatch, form])
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
//           {/* Account & Borrower */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Account & Borrower</CardTitle>
//               <CardDescription>
//                 Basic account and borrower details
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4'>
//               <Field label='Account Number' htmlFor='accountNumber'>
//                 <Input
//                   id='accountNumber'
//                   placeholder='LN9876543210'
//                   {...form.register('accountNumber')}
//                 />
//               </Field>
//               {/* ✅ NEW: Branch / RO */}
//               <div className='grid gap-4 md:grid-cols-3'>
//                 <Field label='Branch Code' htmlFor='branchCode'>
//                   <Input
//                     id='branchCode'
//                     disabled
//                     placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
//                     {...form.register('branchCode')}
//                   />
//                 </Field>
//                 <Field label='Branch Name' htmlFor='branchName'>
//                   <Input
//                     id='branchName'
//                     disabled
//                     placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
//                     {...form.register('branchName')}
//                   />
//                 </Field>
//                 <Field label='Regional Office' htmlFor='regionalOffice'>
//                   <Input
//                     id='regionalOffice'
//                     disabled
//                     placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
//                     {...form.register('regionalOffice')}
//                   />
//                 </Field>
//               </div>
//               <Field label='Borrower Name' htmlFor='borrowerName'>
//                 <Input
//                   id='borrowerName'
//                   placeholder='M/s Shree Textiles Pvt. Ltd.'
//                   {...form.register('borrowerName')}
//                 />
//               </Field>
//               <Field label='Loan Purpose' htmlFor='loanPurpose'>
//                 <Textarea
//                   id='loanPurpose'
//                   placeholder='Working Capital Term Loan for Textile Manufacturing Unit'
//                   {...form.register('loanPurpose')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Key Dates */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Key Dates</CardTitle>
//               <CardDescription>Sanction and NPA dates</CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4 md:grid-cols-2'>
//               <Field label='Loan Sanction Date' htmlFor='loanSanctionDate'>
//                 <Input
//                   id='loanSanctionDate'
//                   type='date'
//                   {...form.register('loanSanctionDate')}
//                 />
//               </Field>
//               <Field label='NPA Date' htmlFor='npaDate'>
//                 <Input id='npaDate' type='date' {...form.register('npaDate')} />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Limits & Outstanding */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Limits & Outstanding</CardTitle>
//               <CardDescription>Amounts in ₹ (numbers only)</CardDescription>
//             </CardHeader>
//             <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
//               <Field label='Limit (₹)' htmlFor='limit'>
//                 <Input
//                   id='limit'
//                   inputMode='decimal'
//                   placeholder='15000000'
//                   {...form.register('limit')}
//                 />
//               </Field>
//               <Field label='Outstanding (₹)' htmlFor='outstanding'>
//                 <Input
//                   id='outstanding'
//                   inputMode='decimal'
//                   placeholder='13850000'
//                   {...form.register('outstanding')}
//                 />
//               </Field>
//               <Field
//                 label='Accrued Interest Amount (₹)'
//                 htmlFor='accruedInterestAmount'
//                 hint='If unknown, keep 0'
//               >
//                 <Input
//                   id='accruedInterestAmount'
//                   inputMode='decimal'
//                   placeholder='0'
//                   {...form.register('accruedInterestAmount')}
//                 />
//               </Field>
//               <Field
//                 label='Including Accrued Interest (₹)'
//                 htmlFor='includingAccruedInterest'
//                 hint='Auto-calculated = Outstanding + Accrued Interest'
//               >
//                 <Input
//                   id='includingAccruedInterest'
//                   inputMode='decimal'
//                   disabled
//                   {...form.register('includingAccruedInterest')}
//                 />
//               </Field>
//               <Field
//                 label='Security Value (₹)'
//                 htmlFor='securityValue'
//                 hint='If negligible/unknown, keep 0'
//               >
//                 <Input
//                   id='securityValue'
//                   inputMode='decimal'
//                   placeholder='0'
//                   {...form.register('securityValue')}
//                 />
//               </Field>
//             </CardContent>
//           </Card>
//           {/* Recommendation */}
//           <Card className='xl:col-span-2'>
//             <CardHeader>
//               <CardTitle>Recommendation Details</CardTitle>
//               <CardDescription>
//                 Write the recommendation/justification
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='grid gap-4'>
//               <Field
//                 label='Recommendation Details'
//                 htmlFor='recommendationDetails'
//               >
//                 <Textarea
//                   id='recommendationDetails'
//                   placeholder='Write-off recommended due to non-recoverability and negligible recovery prospects.'
//                   className='min-h-[140px]'
//                   {...form.register('recommendationDetails')}
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
//         {/* tiny helper for dev/testing */}
//         <div className='text-muted-foreground mt-6 text-xs'>
//           Tip: If opened without acctNo, you can still manually enter Account
//           Number. Default date helper: {todayYMD()}.
//         </div>
//       </div>
//     </>
//   )
// }
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
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
   NEW Transfer Page — JSON-backed Form
   UI + API pattern kept same as your reference transfer page.
   Payload fields based on the JSON you shared.
============================= */

const LimitRowSchema = z.object({
  rowOrder: z.string().optional(),
  limitOriginalSanction: z.string().optional(),
  limitAtTransferToAuca: z.string().optional(),
  sanctionedByDesignation: z.string().optional(),
})

const SecurityRowSchema = z.object({
  rowOrder: z.string().optional(),
  securityType: z.string().optional(),
  description: z.string().optional(),
  marketValueOriginalSanction: z.string().optional(),
  marketValueCallingUp: z.string().optional(),
  presentMarketValue: z.string().optional(),
  estimatedRealizableValue: z.string().optional(),
  valuationReportDate: z.string().optional(),
})

const GuaranteeRowSchema = z.object({
  rowOrder: z.string().optional(),
  guarantorName: z.string().optional(),
  originalNetMeansTnw: z.string().optional(),
  originalOpinionReportDate: z.string().optional(),
  latestNetMeansTnw: z.string().optional(),
  latestOpinionReportDate: z.string().optional(),
})

const AuditIrregularityRowSchema = z.object({
  rowOrder: z.string().optional(),
  natureOfAuditReport: z.string().optional(),
  reportDate: z.string().optional(),
  auditorsObservations: z.string().optional(),
  branchComments: z.string().optional(),
})

const StaffAccountabilityRowSchema = z.object({
  rowOrder: z.string().optional(),
  currentStatus: z.string().optional(),
  preliminaryInvestigationAllotmentDate: z.string().optional(),
  allottedToNameDesignationPosting: z.string().optional(),
  preliminaryInvestigationReportSubmissionDate: z.string().optional(),
  competentAuthorityViewDate: z.string().optional(),
  deficienciesLapses: z.string().optional(),
  disciplinaryActionInitiated: z.string().optional(),
  presentStatusOfDisciplinaryAction: z.string().optional(),
})

const FormSchema = z.object({
  // header/core
  accountNumber: z.string().min(1, 'Required'),
  segment: z.string().min(1, 'Required'),
  branchName: z.string().optional(), // fallback
  mrbBranchName: z.string().optional(),

  firmName: z.string().optional(),
  borrowerName: z.string().min(1, 'Required'),

  // dates (canonical)
  loanSanctionDate: z.string().min(1, 'Required'),
  npaDate: z.string().min(1, 'Required'),
  transferToPbDate: z.string().optional(),

  // dates (mrb mirror)
  mrbSanctionDate: z.string().optional(),
  mrbNpaDate: z.string().optional(),
  mrbTransferToPbDate: z.string().optional(),

  // amounts (canonical)
  outstandingAmt: z.string().min(1, 'Required'),
  accruedInterestAmount: z.string().optional(),
  provisionAsOnT1: z.string().optional(),
  securityValue: z.string().optional(), // optional display use

  // amounts (mrb mirror / derived)
  mrbTotalOutstanding: z.string().optional(),
  mrbAccruedInterestContractual: z.string().optional(),
  mrbTotalDues: z.string().optional(),
  mrbOutstandingInPb: z.string().optional(),
  mrbLegalOtherExpensesDebited: z.string().optional(),
  mrbBgsLcsOutstandingNetMargin: z.string().optional(),
  mrbRealizableValueSecurities: z.string().optional(),
  mrbRetainableAmountClaim: z.string().optional(),
  mrbEstimatedNetLoss: z.string().optional(),
  mrbProvisionsHeldAsOn: z.string().optional(),
  mrbProvisionsHeldDate: z.string().optional(),
  netAmountToTransfer: z.string().optional(),

  // arrays
  mrbLimitDetails: z.array(LimitRowSchema).optional(),
  mrbSecurityDetails: z.array(SecurityRowSchema).optional(),
  mrbGuaranteeDetails: z.array(GuaranteeRowSchema).optional(),
  mrbAuditIrregularities: z.array(AuditIrregularityRowSchema).optional(),
  mrbStaffAccountability: z.array(StaffAccountabilityRowSchema).optional(),

  // documentation & insurance
  mrbDocumentDateOrSanctionDate: z.string().optional(),
  mrbLastRevivalLetterDate: z.string().optional(),
  mrbDocumentationDeficiencies: z.string().optional(),

  mrbInsurancePolicyDate: z.string().optional(),
  mrbInsurancePolicyAmount: z.string().optional(),
  mrbInsuranceAssetsCovered: z.string().optional(),
  mrbInsuranceExpiryDate: z.string().optional(),

  mrbLastSearchReportDate: z.string().optional(),

  // legal positions
  mrbLegalNonLegalCasePosition: z.string().optional(),
  mrbSuitFiledPosition: z.string().optional(),
  mrbSarfaesiActionPosition: z.string().optional(),
  mrbLitigationsAgainstBank: z.string().optional(),

  // narrative
  mrbBriefHistory: z.string().optional(),
  mrbJustificationsForTransfer: z.string().optional(),
  mrbRecommendationsText: z.string().optional(),
})

export type FormValues = z.infer<typeof FormSchema>

interface AucaLimitDetail {
  rowOrder?: string | number
  limitOriginalSanction?: string | number
  limitAtTransferToAuca?: string | number
  sanctionedByDesignation?: string
}

interface AucaSecurityDetail {
  rowOrder?: string | number
  securityType?: string
  description?: string
  marketValueOriginalSanction?: string | number
  marketValueCallingUp?: string | number
  presentMarketValue?: string | number
  estimatedRealizableValue?: string | number
  valuationReportDate?: string
}

interface AucaGuaranteeDetail {
  rowOrder?: string | number
  guarantorName?: string
  originalNetMeansTnw?: string | number
  originalOpinionReportDate?: string
  latestNetMeansTnw?: string | number
  latestOpinionReportDate?: string
}

interface AucaAuditIrregularity {
  rowOrder?: string | number
  natureOfAuditReport?: string
  reportDate?: string
  auditorsObservations?: string
  branchComments?: string
}

interface AucaStaffAccountability {
  rowOrder?: string | number
  currentStatus?: string
  preliminaryInvestigationAllotmentDate?: string
  allottedToNameDesignationPosting?: string
  preliminaryInvestigationReportSubmissionDate?: string
  competentAuthorityViewDate?: string
  deficienciesLapses?: string
  disciplinaryActionInitiated?: string
  presentStatusOfDisciplinaryAction?: string
}

interface AucaFetchResponseData {
  mrbBranchName?: string
  branchName?: string
  loanSanctionDate?: string
  mrbSanctionDate?: string
  sanctDt?: string
  npaDate?: string
  mrbNpaDate?: string
  npaDt?: string
  transferToPbDate?: string
  mrbTransferToPbDate?: string
  outstandingAmt?: string | number
  mrbTotalOutstanding?: string | number
  outstand?: string | number
  accruedInterestAmount?: string | number
  mrbAccruedInterestContractual?: string | number
  mrbTotalDues?: string | number
  mrbOutstandingInPb?: string | number
  mrbLegalOtherExpensesDebited?: string | number
  mrbBgsLcsOutstandingNetMargin?: string | number
  mrbRealizableValueSecurities?: string | number
  mrbRetainableAmountClaim?: string | number
  mrbEstimatedNetLoss?: string | number
  mrbProvisionsHeldAsOn?: string | number
  provisionAsOnT1?: string | number
  mrbProvisionsHeldDate?: string
  netAmountToTransfer?: string | number
  mrbDocumentDateOrSanctionDate?: string
  mrbLastRevivalLetterDate?: string
  mrbDocumentationDeficiencies?: string
  mrbInsurancePolicyDate?: string
  mrbInsurancePolicyAmount?: string | number
  mrbInsuranceAssetsCovered?: string
  mrbInsuranceExpiryDate?: string
  mrbLastSearchReportDate?: string
  mrbLegalNonLegalCasePosition?: string
  mrbSuitFiledPosition?: string
  mrbSarfaesiActionPosition?: string
  mrbLitigationsAgainstBank?: string
  mrbBriefHistory?: string
  mrbJustificationsForTransfer?: string
  mrbRecommendationsText?: string
  mrbLimitDetails?: AucaLimitDetail[]
  mrbSecurityDetails?: AucaSecurityDetail[]
  mrbGuaranteeDetails?: AucaGuaranteeDetail[]
  mrbAuditIrregularities?: AucaAuditIrregularity[]
  mrbStaffAccountability?: AucaStaffAccountability[]
  acctNo?: string

  accountNumber?: string
  custName?: string
  borrowerName?: string
  firmName?: string
  segment?: string
}

interface AucaFetchResponse {
  data?: AucaFetchResponseData
}

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

const thClass =
  'border-b bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground'
const tdClass = 'border-b px-3 py-2 align-top'
const tableWrapClass = 'overflow-auto rounded-md border'

function RouteComponent() {
  const router = useRouter()
  const search = Route.useSearch() as { acctNo?: string }
  const acctNoFromSearch = search?.acctNo

  const [prefillLoading, setPrefillLoading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      accountNumber: acctNoFromSearch ?? '',
      segment: 'MSME',
      branchName: '',
      mrbBranchName: '',

      firmName: '',
      borrowerName: '',

      loanSanctionDate: '',
      npaDate: '',
      transferToPbDate: '',

      mrbSanctionDate: '',
      mrbNpaDate: '',
      mrbTransferToPbDate: '',

      outstandingAmt: '',
      accruedInterestAmount: '0',
      provisionAsOnT1: '0',
      securityValue: '0',

      mrbTotalOutstanding: '',
      mrbAccruedInterestContractual: '',
      mrbTotalDues: '',
      mrbOutstandingInPb: '0',
      mrbLegalOtherExpensesDebited: '0',
      mrbBgsLcsOutstandingNetMargin: '0',
      mrbRealizableValueSecurities: '0',
      mrbRetainableAmountClaim: '0',
      mrbEstimatedNetLoss: '',
      mrbProvisionsHeldAsOn: '0',
      mrbProvisionsHeldDate: '',
      netAmountToTransfer: '',

      mrbLimitDetails: [{ rowOrder: '1', sanctionedByDesignation: 'BM' }],
      mrbSecurityDetails: [{ rowOrder: '1', securityType: 'PRIMARY' }],
      mrbGuaranteeDetails: [{ rowOrder: '1' }],
      mrbAuditIrregularities: [{ rowOrder: '1' }],
      mrbStaffAccountability: [{ rowOrder: '1' }],

      mrbDocumentDateOrSanctionDate: '',
      mrbLastRevivalLetterDate: '',
      mrbDocumentationDeficiencies: '',

      mrbInsurancePolicyDate: '',
      mrbInsurancePolicyAmount: '0',
      mrbInsuranceAssetsCovered: '',
      mrbInsuranceExpiryDate: '',

      mrbLastSearchReportDate: '',

      mrbLegalNonLegalCasePosition: '',
      mrbSuitFiledPosition: '',
      mrbSarfaesiActionPosition: '',
      mrbLitigationsAgainstBank: '',

      mrbBriefHistory: '',
      mrbJustificationsForTransfer: '',
      mrbRecommendationsText: '',
    },
  })

  // ====== arrays
  const limitFA = useFieldArray({
    control: form.control,
    name: 'mrbLimitDetails',
  })
  const securityFA = useFieldArray({
    control: form.control,
    name: 'mrbSecurityDetails',
  })
  const guaranteeFA = useFieldArray({
    control: form.control,
    name: 'mrbGuaranteeDetails',
  })
  const auditFA = useFieldArray({
    control: form.control,
    name: 'mrbAuditIrregularities',
  })
  const staffFA = useFieldArray({
    control: form.control,
    name: 'mrbStaffAccountability',
  })

  // ---- Branch/Department (kept exactly like your reference pattern)
  const { data: branchDepartmentInfo, isLoading: branchDepartmentInfoLoading } =
    $api.useQuery('get', '/branches/{accountNumber}/branch-department-info', {
      params: { path: { accountNumber: acctNoFromSearch ?? '' } },
    })

  useEffect(() => {
    if (!acctNoFromSearch) return
    if (!branchDepartmentInfo) return

    // keep both branchName + mrbBranchName populated consistently
    const nextBranchName = branchDepartmentInfo?.branchName ?? ''
    form.setValue('branchName', nextBranchName, { shouldDirty: false })
    form.setValue('mrbBranchName', nextBranchName, { shouldDirty: false })
  }, [acctNoFromSearch, branchDepartmentInfo, form])

  const handleReset = () => {
    const keepBranchName = form.getValues('branchName') ?? ''
    const keepMrbBranchName = form.getValues('mrbBranchName') ?? ''
    const keepSegment = form.getValues('segment') ?? 'MSME'

    form.reset({
      ...form.getValues(),
      accountNumber: acctNoFromSearch ?? form.getValues('accountNumber') ?? '',
      segment: keepSegment,
      branchName: keepBranchName,
      mrbBranchName: keepMrbBranchName,

      firmName: '',
      borrowerName: '',

      loanSanctionDate: '',
      npaDate: '',
      transferToPbDate: '',

      mrbSanctionDate: '',
      mrbNpaDate: '',
      mrbTransferToPbDate: '',

      outstandingAmt: '',
      accruedInterestAmount: '0',
      provisionAsOnT1: '0',
      securityValue: '0',

      mrbTotalOutstanding: '',
      mrbAccruedInterestContractual: '',
      mrbTotalDues: '',
      mrbOutstandingInPb: '0',
      mrbLegalOtherExpensesDebited: '0',
      mrbBgsLcsOutstandingNetMargin: '0',
      mrbRealizableValueSecurities: '0',
      mrbRetainableAmountClaim: '0',
      mrbEstimatedNetLoss: '',
      mrbProvisionsHeldAsOn: '0',
      mrbProvisionsHeldDate: '',
      netAmountToTransfer: '',

      mrbLimitDetails: [{ rowOrder: '1', sanctionedByDesignation: 'BM' }],
      mrbSecurityDetails: [{ rowOrder: '1', securityType: 'PRIMARY' }],
      mrbGuaranteeDetails: [{ rowOrder: '1' }],
      mrbAuditIrregularities: [{ rowOrder: '1' }],
      mrbStaffAccountability: [{ rowOrder: '1' }],

      mrbDocumentDateOrSanctionDate: '',
      mrbLastRevivalLetterDate: '',
      mrbDocumentationDeficiencies: '',

      mrbInsurancePolicyDate: '',
      mrbInsurancePolicyAmount: '0',
      mrbInsuranceAssetsCovered: '',
      mrbInsuranceExpiryDate: '',

      mrbLastSearchReportDate: '',

      mrbLegalNonLegalCasePosition: '',
      mrbSuitFiledPosition: '',
      mrbSarfaesiActionPosition: '',
      mrbLitigationsAgainstBank: '',

      mrbBriefHistory: '',
      mrbJustificationsForTransfer: '',
      mrbRecommendationsText: '',
    })
  }

  // ---- POST create (same endpoint style as your reference)
  const createAucaTransferMutation = $api.useMutation(
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

  // ---- GET prefill (same style as your reference)
  const { mutate: fetchAucaDetails } = $api.useMutation(
    'get',
    '/auca-transfer/AucaEligible/{acctNo}'
  )

  // Prefill if acctNo is present in search params
  useEffect(() => {
    if (!acctNoFromSearch) return

    setPrefillLoading(true)

    fetchAucaDetails(
      { params: { path: { acctNo: acctNoFromSearch } } },
      {
        onSuccess: (res) => {
          setPrefillLoading(false)
          const body = res as AucaFetchResponse

          if (!body?.data) {
            toast.error('No transfer details found for this account')
            return
          }

          const d = body.data as AucaFetchResponseData

          const branchFallback =
            d.mrbBranchName ??
            d.branchName ??
            form.getValues('branchName') ??
            ''
          const sanction =
            d.loanSanctionDate ?? d.mrbSanctionDate ?? d.sanctDt ?? ''
          const npa = d.npaDate ?? d.mrbNpaDate ?? d.npaDt ?? ''
          const transferPb = d.transferToPbDate ?? d.mrbTransferToPbDate ?? ''

          const outstandingStr = String(
            d.outstandingAmt ?? d.mrbTotalOutstanding ?? d.outstand ?? ''
          )
          const accruedStr = String(
            d.accruedInterestAmount ?? d.mrbAccruedInterestContractual ?? '0'
          )
          const totalDuesDerived = String(
            toNumberOrZero(outstandingStr) + toNumberOrZero(accruedStr)
          )

          const limitDetails = Array.isArray(d.mrbLimitDetails)
            ? d.mrbLimitDetails.map((r: AucaLimitDetail, idx: number) => ({
                rowOrder: String(r.rowOrder ?? idx + 1),
                limitOriginalSanction:
                  r.limitOriginalSanction !== undefined
                    ? String(r.limitOriginalSanction)
                    : '',
                limitAtTransferToAuca:
                  r.limitAtTransferToAuca !== undefined
                    ? String(r.limitAtTransferToAuca)
                    : '',
                sanctionedByDesignation: r.sanctionedByDesignation ?? '',
              }))
            : [{ rowOrder: '1', sanctionedByDesignation: 'BM' }]

          const securityDetails = Array.isArray(d.mrbSecurityDetails)
            ? d.mrbSecurityDetails.map(
                (r: AucaSecurityDetail, idx: number) => ({
                  rowOrder: String(r.rowOrder ?? idx + 1),
                  securityType: r.securityType ?? '',
                  description: r.description ?? '',
                  marketValueOriginalSanction:
                    r.marketValueOriginalSanction !== undefined
                      ? String(r.marketValueOriginalSanction)
                      : '',
                  marketValueCallingUp:
                    r.marketValueCallingUp !== undefined
                      ? String(r.marketValueCallingUp)
                      : '',
                  presentMarketValue:
                    r.presentMarketValue !== undefined
                      ? String(r.presentMarketValue)
                      : '',
                  estimatedRealizableValue:
                    r.estimatedRealizableValue !== undefined
                      ? String(r.estimatedRealizableValue)
                      : '',
                  valuationReportDate: r.valuationReportDate ?? '',
                })
              )
            : [{ rowOrder: '1', securityType: 'PRIMARY' }]

          const guaranteeDetails = Array.isArray(d.mrbGuaranteeDetails)
            ? d.mrbGuaranteeDetails.map(
                (r: AucaGuaranteeDetail, idx: number) => ({
                  rowOrder: String(r.rowOrder ?? idx + 1),
                  guarantorName: r.guarantorName ?? '',
                  originalNetMeansTnw:
                    r.originalNetMeansTnw !== undefined
                      ? String(r.originalNetMeansTnw)
                      : '',
                  originalOpinionReportDate: r.originalOpinionReportDate ?? '',
                  latestNetMeansTnw:
                    r.latestNetMeansTnw !== undefined
                      ? String(r.latestNetMeansTnw)
                      : '',
                  latestOpinionReportDate: r.latestOpinionReportDate ?? '',
                })
              )
            : [{ rowOrder: '1' }]

          const auditIrregularities = Array.isArray(d.mrbAuditIrregularities)
            ? (d.mrbAuditIrregularities as AucaAuditIrregularity[]).map(
                (r: AucaAuditIrregularity, idx: number) => ({
                  rowOrder: String(r.rowOrder ?? idx + 1),
                  natureOfAuditReport: r.natureOfAuditReport ?? '',
                  reportDate: r.reportDate ?? '',
                  auditorsObservations: r.auditorsObservations ?? '',
                  branchComments: r.branchComments ?? '',
                })
              )
            : [{ rowOrder: '1' }]

          const staffAccountability = Array.isArray(d.mrbStaffAccountability)
            ? (d.mrbStaffAccountability as AucaStaffAccountability[]).map(
                (r: AucaStaffAccountability, idx: number) => ({
                  rowOrder: String(r.rowOrder ?? idx + 1),
                  currentStatus: r.currentStatus ?? '',
                  preliminaryInvestigationAllotmentDate:
                    r.preliminaryInvestigationAllotmentDate ?? '',
                  allottedToNameDesignationPosting:
                    r.allottedToNameDesignationPosting ?? '',
                  preliminaryInvestigationReportSubmissionDate:
                    r.preliminaryInvestigationReportSubmissionDate ?? '',
                  competentAuthorityViewDate:
                    r.competentAuthorityViewDate ?? '',
                  deficienciesLapses: r.deficienciesLapses ?? '',
                  disciplinaryActionInitiated:
                    r.disciplinaryActionInitiated ?? '',
                  presentStatusOfDisciplinaryAction:
                    r.presentStatusOfDisciplinaryAction ?? '',
                })
              )
            : [{ rowOrder: '1' }]

          form.reset({
            accountNumber: d.accountNumber ?? d.acctNo ?? acctNoFromSearch,
            segment: d.segment ?? 'MSME',
            branchName: branchFallback,
            mrbBranchName: branchFallback,

            firmName: d.firmName ?? '',
            borrowerName: d.borrowerName ?? d.custName ?? '',

            loanSanctionDate: sanction,
            npaDate: npa,
            transferToPbDate: transferPb,

            mrbSanctionDate: d.mrbSanctionDate ?? sanction,
            mrbNpaDate: d.mrbNpaDate ?? npa,
            mrbTransferToPbDate: d.mrbTransferToPbDate ?? transferPb,

            outstandingAmt: outstandingStr,
            accruedInterestAmount: accruedStr,

            mrbTotalOutstanding:
              d.mrbTotalOutstanding !== undefined
                ? String(d.mrbTotalOutstanding)
                : outstandingStr,
            mrbAccruedInterestContractual:
              d.mrbAccruedInterestContractual !== undefined
                ? String(d.mrbAccruedInterestContractual)
                : accruedStr,

            mrbTotalDues:
              d.mrbTotalDues !== undefined
                ? String(d.mrbTotalDues)
                : totalDuesDerived,

            mrbOutstandingInPb:
              d.mrbOutstandingInPb !== undefined
                ? String(d.mrbOutstandingInPb)
                : '0',
            mrbLegalOtherExpensesDebited:
              d.mrbLegalOtherExpensesDebited !== undefined
                ? String(d.mrbLegalOtherExpensesDebited)
                : '0',
            mrbBgsLcsOutstandingNetMargin:
              d.mrbBgsLcsOutstandingNetMargin !== undefined
                ? String(d.mrbBgsLcsOutstandingNetMargin)
                : '0',
            mrbRealizableValueSecurities:
              d.mrbRealizableValueSecurities !== undefined
                ? String(d.mrbRealizableValueSecurities)
                : '0',
            mrbRetainableAmountClaim:
              d.mrbRetainableAmountClaim !== undefined
                ? String(d.mrbRetainableAmountClaim)
                : '0',
            mrbEstimatedNetLoss:
              d.mrbEstimatedNetLoss !== undefined
                ? String(d.mrbEstimatedNetLoss)
                : '',
            mrbProvisionsHeldAsOn:
              d.mrbProvisionsHeldAsOn !== undefined
                ? String(d.mrbProvisionsHeldAsOn)
                : '0',
            provisionAsOnT1:
              d.provisionAsOnT1 !== undefined ? String(d.provisionAsOnT1) : '0',
            mrbProvisionsHeldDate: d.mrbProvisionsHeldDate ?? '',
            securityValue:
              d.mrbRealizableValueSecurities !== undefined
                ? String(d.mrbRealizableValueSecurities)
                : '0',

            netAmountToTransfer:
              d.netAmountToTransfer !== undefined
                ? String(d.netAmountToTransfer)
                : String(toNumberOrZero(outstandingStr)),

            mrbLimitDetails: limitDetails,
            mrbSecurityDetails: securityDetails,
            mrbGuaranteeDetails: guaranteeDetails,
            mrbAuditIrregularities: auditIrregularities,
            mrbStaffAccountability: staffAccountability,

            mrbDocumentDateOrSanctionDate:
              d.mrbDocumentDateOrSanctionDate ?? sanction,
            mrbLastRevivalLetterDate: d.mrbLastRevivalLetterDate ?? '',
            mrbDocumentationDeficiencies: d.mrbDocumentationDeficiencies ?? '',

            mrbInsurancePolicyDate: d.mrbInsurancePolicyDate ?? '',
            mrbInsurancePolicyAmount:
              d.mrbInsurancePolicyAmount !== undefined
                ? String(d.mrbInsurancePolicyAmount)
                : '0',
            mrbInsuranceAssetsCovered: d.mrbInsuranceAssetsCovered ?? '',
            mrbInsuranceExpiryDate: d.mrbInsuranceExpiryDate ?? '',

            mrbLastSearchReportDate: d.mrbLastSearchReportDate ?? '',

            mrbLegalNonLegalCasePosition: d.mrbLegalNonLegalCasePosition ?? '',
            mrbSuitFiledPosition: d.mrbSuitFiledPosition ?? '',
            mrbSarfaesiActionPosition: d.mrbSarfaesiActionPosition ?? '',
            mrbLitigationsAgainstBank: d.mrbLitigationsAgainstBank ?? '',

            mrbBriefHistory: d.mrbBriefHistory ?? '',
            mrbJustificationsForTransfer: d.mrbJustificationsForTransfer ?? '',
            mrbRecommendationsText: d.mrbRecommendationsText ?? '',
          })
        },
        onError: () => {
          setPrefillLoading(false)
          toast.error('Failed to prefill transfer details from account')
        },
      }
    )
  }, [acctNoFromSearch, fetchAucaDetails, form])

  // ====== live derived: keep mrbTotalDues = outstanding + accrued
  const outstandingWatch = form.watch('outstandingAmt')
  const accruedWatch = form.watch('accruedInterestAmount')

  useEffect(() => {
    const next = String(
      toNumberOrZero(outstandingWatch) + toNumberOrZero(accruedWatch)
    )
    form.setValue('mrbTotalDues', next, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })

    // keep mirrors aligned
    form.setValue(
      'mrbTotalOutstanding',
      String(toNumberOrZero(outstandingWatch)),
      {
        shouldDirty: false,
      }
    )
    form.setValue(
      'mrbAccruedInterestContractual',
      String(toNumberOrZero(accruedWatch)),
      {
        shouldDirty: false,
      }
    )

    // default netAmountToTransfer = outstanding unless user has explicitly filled it
    const currentNet = form.getValues('netAmountToTransfer')
    if (!String(currentNet ?? '').trim()) {
      form.setValue(
        'netAmountToTransfer',
        String(toNumberOrZero(outstandingWatch)),
        {
          shouldDirty: false,
        }
      )
    }
  }, [outstandingWatch, accruedWatch, form])

  const onSubmit = (values: FormValues) => {
    // keep mirrors consistent in payload
    const payload = {
      bankType: 'MRB',

      accountNumber: values.accountNumber.trim(),
      segment: values.segment.trim(),

      mrbBranchName:
        (values.mrbBranchName ?? values.branchName ?? '').trim() || undefined,
      branchName:
        (values.branchName ?? values.mrbBranchName ?? '').trim() || undefined,

      firmName: values.firmName?.trim() || undefined,
      borrowerName: values.borrowerName.trim(),

      mrbSanctionDate: values.mrbSanctionDate ?? values.loanSanctionDate,
      loanSanctionDate: values.loanSanctionDate,

      mrbNpaDate: values.mrbNpaDate ?? values.npaDate,
      npaDate: values.npaDate,

      mrbTransferToPbDate:
        values.mrbTransferToPbDate ?? values.transferToPbDate,
      transferToPbDate: values.transferToPbDate || undefined,

      mrbTotalOutstanding: toNumberOrZero(
        values.mrbTotalOutstanding ?? values.outstandingAmt
      ),
      outstandingAmt: toNumberOrZero(values.outstandingAmt),

      mrbAccruedInterestContractual: toNumberOrZero(
        values.mrbAccruedInterestContractual ?? values.accruedInterestAmount
      ),
      accruedInterestAmount: toNumberOrZero(values.accruedInterestAmount),

      mrbTotalDues: toNumberOrZero(values.mrbTotalDues),

      mrbOutstandingInPb: toNumberOrZero(values.mrbOutstandingInPb),
      mrbLegalOtherExpensesDebited: toNumberOrZero(
        values.mrbLegalOtherExpensesDebited
      ),
      mrbBgsLcsOutstandingNetMargin: toNumberOrZero(
        values.mrbBgsLcsOutstandingNetMargin
      ),
      mrbRealizableValueSecurities: toNumberOrZero(
        values.mrbRealizableValueSecurities
      ),
      mrbRetainableAmountClaim: toNumberOrZero(values.mrbRetainableAmountClaim),
      mrbEstimatedNetLoss: toNumberOrUndefined(values.mrbEstimatedNetLoss),

      mrbProvisionsHeldAsOn: toNumberOrZero(values.mrbProvisionsHeldAsOn),
      provisionAsOnT1: toNumberOrZero(values.provisionAsOnT1),
      mrbProvisionsHeldDate: values.mrbProvisionsHeldDate || undefined,

      mrbLimitDetails: (values.mrbLimitDetails ?? []).map((r, idx) => ({
        rowOrder: Number(r.rowOrder ?? idx + 1),
        limitOriginalSanction: toNumberOrZero(r.limitOriginalSanction),
        limitAtTransferToAuca: toNumberOrZero(r.limitAtTransferToAuca),
        sanctionedByDesignation: r.sanctionedByDesignation?.trim() || undefined,
      })),

      mrbSecurityDetails: (values.mrbSecurityDetails ?? []).map((r, idx) => ({
        rowOrder: Number(r.rowOrder ?? idx + 1),
        securityType: r.securityType?.trim() || undefined,
        description: r.description?.trim() || undefined,
        marketValueOriginalSanction: toNumberOrZero(
          r.marketValueOriginalSanction
        ),
        marketValueCallingUp: toNumberOrZero(r.marketValueCallingUp),
        presentMarketValue: toNumberOrZero(r.presentMarketValue),
        estimatedRealizableValue: toNumberOrZero(r.estimatedRealizableValue),
        valuationReportDate: r.valuationReportDate || undefined,
      })),

      mrbGuaranteeDetails: (values.mrbGuaranteeDetails ?? []).map((r, idx) => ({
        rowOrder: Number(r.rowOrder ?? idx + 1),
        guarantorName: r.guarantorName?.trim() || undefined,
        originalNetMeansTnw: toNumberOrZero(r.originalNetMeansTnw),
        originalOpinionReportDate: r.originalOpinionReportDate || undefined,
        latestNetMeansTnw: toNumberOrZero(r.latestNetMeansTnw),
        latestOpinionReportDate: r.latestOpinionReportDate || undefined,
      })),

      mrbDocumentDateOrSanctionDate:
        values.mrbDocumentDateOrSanctionDate || undefined,
      mrbLastRevivalLetterDate: values.mrbLastRevivalLetterDate || undefined,
      mrbDocumentationDeficiencies:
        values.mrbDocumentationDeficiencies?.trim() || undefined,

      mrbInsurancePolicyDate: values.mrbInsurancePolicyDate || undefined,
      mrbInsurancePolicyAmount: toNumberOrZero(values.mrbInsurancePolicyAmount),
      mrbInsuranceAssetsCovered:
        values.mrbInsuranceAssetsCovered?.trim() || undefined,
      mrbInsuranceExpiryDate: values.mrbInsuranceExpiryDate || undefined,

      mrbLastSearchReportDate: values.mrbLastSearchReportDate || undefined,

      mrbAuditIrregularities: (values.mrbAuditIrregularities ?? []).map(
        (r, idx) => ({
          rowOrder: Number(r.rowOrder ?? idx + 1),
          natureOfAuditReport: r.natureOfAuditReport?.trim() || undefined,
          reportDate: r.reportDate || undefined,
          auditorsObservations: r.auditorsObservations?.trim() || undefined,
          branchComments: r.branchComments?.trim() || undefined,
        })
      ),

      mrbLegalNonLegalCasePosition:
        values.mrbLegalNonLegalCasePosition?.trim() || undefined,
      mrbSuitFiledPosition: values.mrbSuitFiledPosition?.trim() || undefined,
      mrbSarfaesiActionPosition:
        values.mrbSarfaesiActionPosition?.trim() || undefined,
      mrbLitigationsAgainstBank:
        values.mrbLitigationsAgainstBank?.trim() || undefined,

      mrbStaffAccountability: (values.mrbStaffAccountability ?? []).map(
        (r, idx) => ({
          rowOrder: Number(r.rowOrder ?? idx + 1),
          currentStatus: r.currentStatus?.trim() || undefined,
          preliminaryInvestigationAllotmentDate:
            r.preliminaryInvestigationAllotmentDate || undefined,
          allottedToNameDesignationPosting:
            r.allottedToNameDesignationPosting?.trim() || undefined,
          preliminaryInvestigationReportSubmissionDate:
            r.preliminaryInvestigationReportSubmissionDate || undefined,
          competentAuthorityViewDate: r.competentAuthorityViewDate || undefined,
          deficienciesLapses: r.deficienciesLapses?.trim() || undefined,
          disciplinaryActionInitiated:
            r.disciplinaryActionInitiated?.trim() || undefined,
          presentStatusOfDisciplinaryAction:
            r.presentStatusOfDisciplinaryAction?.trim() || undefined,
        })
      ),

      mrbBriefHistory: values.mrbBriefHistory?.trim() || undefined,
      mrbJustificationsForTransfer:
        values.mrbJustificationsForTransfer?.trim() || undefined,
      mrbRecommendationsText:
        values.mrbRecommendationsText?.trim() || undefined,

      netAmountToTransfer: toNumberOrZero(values.netAmountToTransfer),
    }

    createAucaTransferMutation.mutate({
      params: {
        header: {
          Authorization: '',
        },
      },
      body: payload as never,
    })
  }

  const isSaving = createAucaTransferMutation.isPending

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
          {/* ====== Core */}
          <Card>
            <CardHeader>
              <CardTitle>Account / Branch / Segment</CardTitle>
              <CardDescription>Basic identifiers</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Account Number' htmlFor='accountNumber'>
                  <Input
                    id='accountNumber'
                    placeholder='123456789012'
                    {...form.register('accountNumber')}
                  />
                </Field>

                <Field
                  label='Segment'
                  htmlFor='segment'
                  // hint='Example: MSME / AGRI / RETAIL'
                >
                  <Input
                    id='segment'
                    placeholder='MSME'
                    {...form.register('segment')}
                  />
                </Field>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Branch Name' htmlFor='branchName'>
                  <Input
                    id='branchName'
                    placeholder={
                      branchDepartmentInfoLoading ? 'Loading…' : 'Main Branch'
                    }
                    {...form.register('branchName')}
                  />
                </Field>

                <Field
                  label='MRB Branch Name'
                  htmlFor='mrbBranchName'
                  // hint='Keep same as Branch Name (auto-filled where possible)'
                >
                  <Input
                    id='mrbBranchName'
                    placeholder='Main Branch'
                    {...form.register('mrbBranchName')}
                  />
                </Field>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Firm Name' htmlFor='firmName'>
                  <Input
                    id='firmName'
                    placeholder='ABC Traders'
                    {...form.register('firmName')}
                  />
                </Field>

                <Field label='Borrower Name' htmlFor='borrowerName'>
                  <Input
                    id='borrowerName'
                    placeholder='Raj Kumar'
                    {...form.register('borrowerName')}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* ====== Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Key Dates</CardTitle>
              <CardDescription>Sanction / NPA / Transfer dates</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Field label='Loan Sanction Date' htmlFor='loanSanctionDate'>
                <Input
                  id='loanSanctionDate'
                  type='date'
                  {...form.register('loanSanctionDate')}
                />
              </Field>

              <Field label='NPA Date' htmlFor='npaDate'>
                <Input id='npaDate' type='date' {...form.register('npaDate')} />
              </Field>

              <Field label='Transfer to PB Date' htmlFor='transferToPbDate'>
                <Input
                  id='transferToPbDate'
                  type='date'
                  {...form.register('transferToPbDate')}
                />
              </Field>

              <Field
                label='Provisions Held Date'
                htmlFor='mrbProvisionsHeldDate'
              >
                <Input
                  id='mrbProvisionsHeldDate'
                  type='date'
                  {...form.register('mrbProvisionsHeldDate')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ====== Amounts */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Outstanding / Dues / Provisions</CardTitle>
              <CardDescription>Amounts in ₹ (numbers only)</CardDescription>
            </CardHeader>

            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Field label='Outstanding (₹)' htmlFor='outstandingAmt'>
                <Input
                  id='outstandingAmt'
                  inputMode='decimal'
                  placeholder='125000'
                  {...form.register('outstandingAmt')}
                />
              </Field>

              <Field
                label='Accrued Interest (₹)'
                htmlFor='accruedInterestAmount'
                // hint='If unknown, keep 0'
              >
                <Input
                  id='accruedInterestAmount'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('accruedInterestAmount')}
                />
              </Field>

              <Field
                label='Total Dues (₹)'
                htmlFor='mrbTotalDues'
                // hint='Auto = Outstanding + Accrued Interest'
              >
                <Input
                  id='mrbTotalDues'
                  inputMode='decimal'
                  disabled
                  {...form.register('mrbTotalDues')}
                />
              </Field>

              <Field
                label='Net Amount To Transfer (₹)'
                htmlFor='netAmountToTransfer'
                // hint='Defaults to Outstanding'
              >
                <Input
                  id='netAmountToTransfer'
                  inputMode='decimal'
                  placeholder='125000'
                  {...form.register('netAmountToTransfer')}
                />
              </Field>

              <Field label='Provision As On T1 (₹)' htmlFor='provisionAsOnT1'>
                <Input
                  id='provisionAsOnT1'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('provisionAsOnT1')}
                />
              </Field>

              <Field
                label='Provisions Held As On (₹)'
                htmlFor='mrbProvisionsHeldAsOn'
              >
                <Input
                  id='mrbProvisionsHeldAsOn'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbProvisionsHeldAsOn')}
                />
              </Field>

              <Field
                label='Realizable Value of Securities (₹)'
                htmlFor='mrbRealizableValueSecurities'
              >
                <Input
                  id='mrbRealizableValueSecurities'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbRealizableValueSecurities')}
                />
              </Field>

              <Field
                label='Estimated Net Loss (₹)'
                htmlFor='mrbEstimatedNetLoss'
              >
                <Input
                  id='mrbEstimatedNetLoss'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbEstimatedNetLoss')}
                />
              </Field>

              <Field label='Outstanding in PB (₹)' htmlFor='mrbOutstandingInPb'>
                <Input
                  id='mrbOutstandingInPb'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbOutstandingInPb')}
                />
              </Field>

              <Field
                label='Legal/Other Expenses Debited (₹)'
                htmlFor='mrbLegalOtherExpensesDebited'
              >
                <Input
                  id='mrbLegalOtherExpensesDebited'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbLegalOtherExpensesDebited')}
                />
              </Field>

              <Field
                label='BGs/LCs Outstanding Net Margin (₹)'
                htmlFor='mrbBgsLcsOutstandingNetMargin'
              >
                <Input
                  id='mrbBgsLcsOutstandingNetMargin'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbBgsLcsOutstandingNetMargin')}
                />
              </Field>

              <Field
                label='Retainable Amount Claim (₹)'
                htmlFor='mrbRetainableAmountClaim'
              >
                <Input
                  id='mrbRetainableAmountClaim'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('mrbRetainableAmountClaim')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ====== Limit Details */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Limit Details</CardTitle>
              <CardDescription>mrbLimitDetails</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-3'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    limitFA.append({
                      rowOrder: String((limitFA.fields?.length ?? 0) + 1),
                      sanctionedByDesignation: '',
                    })
                  }
                >
                  Add Row
                </Button>
              </div>

              <div className={tableWrapClass}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr>
                      <th className={thClass}>#</th>
                      <th className={thClass}>Original Sanction (₹)</th>
                      <th className={thClass}>At Transfer to AUCA (₹)</th>
                      <th className={thClass}>Sanctioned By (Designation)</th>
                      <th className={thClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {limitFA.fields.map((f, idx) => (
                      <tr key={f.id}>
                        <td className={tdClass}>
                          <Input
                            disabled
                            value={String(idx + 1)}
                            className='h-9 w-16'
                            readOnly
                          />
                          <input
                            type='hidden'
                            {...form.register(
                              `mrbLimitDetails.${idx}.rowOrder` as const
                            )}
                            value={String(idx + 1)}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            placeholder='200000'
                            {...form.register(
                              `mrbLimitDetails.${idx}.limitOriginalSanction` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            placeholder='150000'
                            {...form.register(
                              `mrbLimitDetails.${idx}.limitAtTransferToAuca` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            placeholder='BM'
                            {...form.register(
                              `mrbLimitDetails.${idx}.sanctionedByDesignation` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => limitFA.remove(idx)}
                            disabled={limitFA.fields.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ====== Security Details */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Security Details</CardTitle>
              <CardDescription>mrbSecurityDetails</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-3'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    securityFA.append({
                      rowOrder: String((securityFA.fields?.length ?? 0) + 1),
                      securityType: 'PRIMARY',
                    })
                  }
                >
                  Add Row
                </Button>
              </div>

              <div className={tableWrapClass}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr>
                      <th className={thClass}>#</th>
                      <th className={thClass}>Type</th>
                      <th className={thClass}>Description</th>
                      <th className={thClass}>MV @ Original Sanction (₹)</th>
                      <th className={thClass}>MV @ Calling Up (₹)</th>
                      <th className={thClass}>Present MV (₹)</th>
                      <th className={thClass}>Est. Realizable (₹)</th>
                      <th className={thClass}>Valuation Report Date</th>
                      <th className={thClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityFA.fields.map((f, idx) => (
                      <tr key={f.id}>
                        <td className={tdClass}>
                          <Input
                            disabled
                            value={String(idx + 1)}
                            className='h-9 w-16'
                            readOnly
                          />
                          <input
                            type='hidden'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.rowOrder` as const
                            )}
                            value={String(idx + 1)}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 w-[140px]'
                            placeholder='PRIMARY / COLLATERAL'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.securityType` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[240px]'
                            placeholder='Hypothecation of Stock'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.description` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.marketValueOriginalSanction` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.marketValueCallingUp` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.presentMarketValue` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.estimatedRealizableValue` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 w-32'
                            type='date'
                            {...form.register(
                              `mrbSecurityDetails.${idx}.valuationReportDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => securityFA.remove(idx)}
                            disabled={securityFA.fields.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ====== Guarantee Details */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Guarantee Details</CardTitle>
              <CardDescription>mrbGuaranteeDetails</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-3'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    guaranteeFA.append({
                      rowOrder: String((guaranteeFA.fields?.length ?? 0) + 1),
                    })
                  }
                >
                  Add Row
                </Button>
              </div>

              <div className={tableWrapClass}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr>
                      <th className={thClass}>#</th>
                      <th className={thClass}>Guarantor Name</th>
                      <th className={thClass}>Original TNW (₹)</th>
                      <th className={thClass}>Original Report Date</th>
                      <th className={thClass}>Latest TNW (₹)</th>
                      <th className={thClass}>Latest Report Date</th>
                      <th className={thClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {guaranteeFA.fields.map((f, idx) => (
                      <tr key={f.id}>
                        <td className={tdClass}>
                          <Input
                            disabled
                            value={String(idx + 1)}
                            className='h-9 w-16'
                            readOnly
                          />
                          <input
                            type='hidden'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.rowOrder` as const
                            )}
                            value={String(idx + 1)}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[220px]'
                            placeholder='Suresh Sharma'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.guarantorName` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.originalNetMeansTnw` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            type='date'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.originalOpinionReportDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            inputMode='decimal'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.latestNetMeansTnw` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            type='date'
                            {...form.register(
                              `mrbGuaranteeDetails.${idx}.latestOpinionReportDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => guaranteeFA.remove(idx)}
                            disabled={guaranteeFA.fields.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ====== Documentation & Insurance */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Documentation & Insurance</CardTitle>
              <CardDescription>Core dates and deficiencies</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Field
                label='Document Date / Sanction Date'
                htmlFor='mrbDocumentDateOrSanctionDate'
              >
                <Input
                  id='mrbDocumentDateOrSanctionDate'
                  type='date'
                  {...form.register('mrbDocumentDateOrSanctionDate')}
                />
              </Field>

              <Field
                label='Last Revival Letter Date'
                htmlFor='mrbLastRevivalLetterDate'
              >
                <Input
                  id='mrbLastRevivalLetterDate'
                  type='date'
                  {...form.register('mrbLastRevivalLetterDate')}
                />
              </Field>

              <Field
                label='Documentation Deficiencies'
                htmlFor='mrbDocumentationDeficiencies'
              >
                <Textarea
                  id='mrbDocumentationDeficiencies'
                  placeholder='NA'
                  className='min-h-[90px]'
                  {...form.register('mrbDocumentationDeficiencies')}
                />
              </Field>

              <div className='grid gap-4'>
                <Field
                  label='Insurance Policy Date'
                  htmlFor='mrbInsurancePolicyDate'
                >
                  <Input
                    id='mrbInsurancePolicyDate'
                    type='date'
                    {...form.register('mrbInsurancePolicyDate')}
                  />
                </Field>

                <Field
                  label='Insurance Policy Amount (₹)'
                  htmlFor='mrbInsurancePolicyAmount'
                >
                  <Input
                    id='mrbInsurancePolicyAmount'
                    inputMode='decimal'
                    placeholder='100000'
                    {...form.register('mrbInsurancePolicyAmount')}
                  />
                </Field>

                <Field
                  label='Insurance Assets Covered'
                  htmlFor='mrbInsuranceAssetsCovered'
                >
                  <Input
                    id='mrbInsuranceAssetsCovered'
                    placeholder='Stock + Machinery'
                    {...form.register('mrbInsuranceAssetsCovered')}
                  />
                </Field>

                <Field
                  label='Insurance Expiry Date'
                  htmlFor='mrbInsuranceExpiryDate'
                >
                  <Input
                    id='mrbInsuranceExpiryDate'
                    type='date'
                    {...form.register('mrbInsuranceExpiryDate')}
                  />
                </Field>
              </div>

              <Field
                label='Last Search Report Date'
                htmlFor='mrbLastSearchReportDate'
              >
                <Input
                  id='mrbLastSearchReportDate'
                  type='date'
                  {...form.register('mrbLastSearchReportDate')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ====== Audit Irregularities */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Audit Irregularities</CardTitle>
              <CardDescription>mrbAuditIrregularities</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-3'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    auditFA.append({
                      rowOrder: String((auditFA.fields?.length ?? 0) + 1),
                    })
                  }
                >
                  Add Row
                </Button>
              </div>

              <div className={tableWrapClass}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr>
                      <th className={thClass}>#</th>
                      <th className={thClass}>Nature</th>
                      <th className={thClass}>Report Date</th>
                      <th className={thClass}>Observations</th>
                      <th className={thClass}>Branch Comments</th>
                      <th className={thClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditFA.fields.map((f, idx) => (
                      <tr key={f.id}>
                        <td className={tdClass}>
                          <Input
                            disabled
                            value={String(idx + 1)}
                            className='h-9 w-16'
                            readOnly
                          />
                          <input
                            type='hidden'
                            {...form.register(
                              `mrbAuditIrregularities.${idx}.rowOrder` as const
                            )}
                            value={String(idx + 1)}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[160px]'
                            placeholder='Credit Audit'
                            {...form.register(
                              `mrbAuditIrregularities.${idx}.natureOfAuditReport` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9'
                            type='date'
                            {...form.register(
                              `mrbAuditIrregularities.${idx}.reportDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[240px]'
                            placeholder='Irregular stock statements.'
                            {...form.register(
                              `mrbAuditIrregularities.${idx}.auditorsObservations` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[240px]'
                            placeholder='Borrower advised, follow-up pending.'
                            {...form.register(
                              `mrbAuditIrregularities.${idx}.branchComments` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => auditFA.remove(idx)}
                            disabled={auditFA.fields.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ====== Legal Positions */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Legal / Recovery Position</CardTitle>
              <CardDescription>
                Current legal and recovery action status
              </CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Field
                label='Legal / Non-Legal Case Position'
                htmlFor='mrbLegalNonLegalCasePosition'
              >
                <Textarea
                  id='mrbLegalNonLegalCasePosition'
                  className='min-h-[90px]'
                  placeholder='No legal case filed as on date.'
                  {...form.register('mrbLegalNonLegalCasePosition')}
                />
              </Field>

              <Field label='Suit Filed Position' htmlFor='mrbSuitFiledPosition'>
                <Textarea
                  id='mrbSuitFiledPosition'
                  className='min-h-[90px]'
                  placeholder='NA'
                  {...form.register('mrbSuitFiledPosition')}
                />
              </Field>

              <Field
                label='SARFAESI Action Position'
                htmlFor='mrbSarfaesiActionPosition'
              >
                <Textarea
                  id='mrbSarfaesiActionPosition'
                  className='min-h-[90px]'
                  placeholder='13(2) issued on ...'
                  {...form.register('mrbSarfaesiActionPosition')}
                />
              </Field>

              <Field
                label='Litigations Against Bank'
                htmlFor='mrbLitigationsAgainstBank'
              >
                <Textarea
                  id='mrbLitigationsAgainstBank'
                  className='min-h-[90px]'
                  placeholder='Nil'
                  {...form.register('mrbLitigationsAgainstBank')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* ====== Staff Accountability */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Staff Accountability</CardTitle>
              <CardDescription>mrbStaffAccountability</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-3'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    staffFA.append({
                      rowOrder: String((staffFA.fields?.length ?? 0) + 1),
                    })
                  }
                >
                  Add Row
                </Button>
              </div>

              <div className={tableWrapClass}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr>
                      <th className={thClass}>#</th>
                      <th className={thClass}>Current Status</th>
                      <th className={thClass}>Allotment Date</th>
                      <th className={thClass}>Allotted To</th>
                      <th className={thClass}>Report Submission Date</th>
                      <th className={thClass}>Authority View Date</th>
                      <th className={thClass}>Deficiencies / Lapses</th>
                      <th className={thClass}>Disciplinary Action</th>
                      <th className={thClass}>Present Status</th>
                      <th className={thClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffFA.fields.map((f, idx) => (
                      <tr key={f.id}>
                        <td className={tdClass}>
                          <Input
                            disabled
                            value={String(idx + 1)}
                            className='h-9 w-16'
                            readOnly
                          />
                          <input
                            type='hidden'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.rowOrder` as const
                            )}
                            value={String(idx + 1)}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[220px]'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.currentStatus` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 w-32'
                            type='date'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.preliminaryInvestigationAllotmentDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[220px]'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.allottedToNameDesignationPosting` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 w-32'
                            type='date'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.preliminaryInvestigationReportSubmissionDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 w-32'
                            type='date'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.competentAuthorityViewDate` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[220px]'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.deficienciesLapses` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[180px]'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.disciplinaryActionInitiated` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Input
                            className='h-9 min-w-[160px]'
                            {...form.register(
                              `mrbStaffAccountability.${idx}.presentStatusOfDisciplinaryAction` as const
                            )}
                          />
                        </td>
                        <td className={tdClass}>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => staffFA.remove(idx)}
                            disabled={staffFA.fields.length <= 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ====== Narrative */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>History / Justification / Recommendation</CardTitle>
              <CardDescription>Free-text narrative fields</CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4'>
              <Field label='Brief History' htmlFor='mrbBriefHistory'>
                <Textarea
                  id='mrbBriefHistory'
                  className='min-h-[110px]'
                  placeholder='Account turned NPA due to business slowdown.'
                  {...form.register('mrbBriefHistory')}
                />
              </Field>

              <Field
                label='Justifications for Transfer'
                htmlFor='mrbJustificationsForTransfer'
              >
                <Textarea
                  id='mrbJustificationsForTransfer'
                  className='min-h-[110px]'
                  placeholder='Low recovery prospects, settle AUCA transfer.'
                  {...form.register('mrbJustificationsForTransfer')}
                />
              </Field>

              <Field
                label='Recommendations Text'
                htmlFor='mrbRecommendationsText'
              >
                <Textarea
                  id='mrbRecommendationsText'
                  className='min-h-[110px]'
                  placeholder='Recommended for transfer to AUCA.'
                  {...form.register('mrbRecommendationsText')}
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
                Submit
              </Button>
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
          Tip: If opened without acctNo, you can manually enter Account Number.
          Default date helper: {todayYMD()}.
        </div>
      </div>
    </>
  )
}
