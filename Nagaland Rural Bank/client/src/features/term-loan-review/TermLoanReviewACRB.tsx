/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from '@tanstack/react-router'
import {
  IconDownload,
  IconEdit,
  IconMinus,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { valueTypeCasting, toastError } from '@/lib/utils.ts'
import useAccountDetails from '@/hooks/use-account-details.ts'
import useBranchDepartmentInfo from '@/hooks/use-branch-department-info.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import PaginatedTable from '@/components/paginated-table.tsx'
import AccountNoCell from '@/components/table/cells/account-no-cell.tsx'

/* ================= Helpers ================= */
function sanitizeLettersOnly(raw) {
  let v = String(raw ?? '')
  // keep letters + spaces only
  v = v.replace(/[^a-zA-Z\s]/g, '')
  v = v.replace(/\s{2,}/g, ' ')
  return v
}
function sanitizeDecimal2(raw) {
  let v = String(raw ?? '')

  // allow blank
  if (v === '') return ''

  // keep only digits and dot
  v = v.replace(/[^0-9.]/g, '')

  // keep only the first dot
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
  }

  // if starts with ".", prefix "0"
  if (v.startsWith('.')) v = '0' + v

  // limit to 2 decimals
  const parts = v.split('.')
  if (parts.length === 2) {
    const [i, d] = parts
    v = `${i}.${(d ?? '').slice(0, 2)}`
  } else {
    v = parts[0]
  }

  return v
}

const Loader = () => (
  <div className='flex items-center justify-center py-8'>
    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
  </div>
)

function num2(val) {
  if (val === null || val === undefined || val === '') return ''
  const n = Number(val)
  if (Number.isNaN(n)) return String(val)
  return n.toString()
}

function clamp2dp(e) {
  const el = e.currentTarget
  let v = el.value ?? ''
  if (v.startsWith('.')) v = '0' + v
  const [i = '', d = ''] = v.split('.')
  if (d && d.length > 2) v = `${i}.${d.slice(0, 2)}`
  el.value = v
}

function toISODateOrNull(v) {
  if (!v) return null
  return v
}

function toInputDate(v) {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const dt = new Date(v)
  if (Number.isNaN(dt.getTime())) return ''
  return format(dt, 'yyyy-MM-dd')
}

function cleanEmptyToNull(obj) {
  return JSON.parse(JSON.stringify(obj, (_k, v) => (v === '' ? null : v)))
}

/* ================= Default Form ================= */

const BLANK_FORM = {
  bankCode: 'TGB',

  accountNumber: '',

  branch: '',
  unitName: '',
  proprietorName: '',
  businessAddress: '',
  mobileNo: '',
  loanType: '',
  loanAccountNo: '',
  loanSanctionedLimit: '',
  presentOutstanding: '',
  loanTerm: '',
  dateOfSanction: '',
  dateOfDisbursement: '',
  loanPurpose: '',
  applicableRoi: '',
  interestEarnedTillDate: '',

  bankingArrangement: '',
  crilicComment: '',
  otherBankLimitFb: '',
  otherBankLimitNfb: '',
  otherBankLimitTotal: '',
  dateOfLastReview: '',
  iracSmaStatus: '',
  centralFraudRegistry: '',

  craBasedOnBalanceSheetOn: '',
  craValidatedOn: '',
  borrowingRatingCurrent: '',
  borrowingRatingPrevious: '',
  overallScore: '',
  financialScore: '',
  craRating: '',

  presentProposalSanctionFor: '',
  presentProposalApprovalFor: '',
  presentProposalBriefProfile: '',

  creditLimits: [
    {
      facility: '',
      existing: '',
      proposed: '',
      change: '',
      presentOutstanding: '',
      overdue: '',
    },
  ],

  indebtednessRows: [
    { description: 'Fund based', existing: '', proposed: '' },
    { description: 'Non-fund based', existing: '', proposed: '' },
  ],

  financials: [
    {
      fy: '',
      netSales: '',
      netProfit: '',
      tangibleNetWorth: '',
      tolToTnw: '',
      currentRatio: '',
      dscr: '',
    },
  ],

  perfAdverseMovements: '',
  perfOverallFinancialCondition: '',
  perfSalesComment: '',
  perfSignificantVariations: '',

  synopsisSourcesOfFunds: '',
  synopsisApplicationOfFunds: '',
  synopsisAdverseComments: '',

  annualReviews: [
    {
      slNo: '1',
      accountNo: '',
      limit: '',
      dp: '',
      outstanding: '',
      irregularity: '',
      dscr: '',
      facr: '',
      iracStatus: '',
      restructuringDateSanction: '',
      restructuringDateActual: '',
    },
  ],

  salientFeatures: '',

  recommendationSanctionFor: '',
  recommendationApprovalFor: '',
  recommendationConfirmFor: '',

  appraisedByName: '',
  appraisedByPfNo: '',
  appraisedByDesignation: '',
  appraisedByMobileNo: '',
  appraisedByDate: '',
}

/* ================= Strict Validation (Zod) =================
   NOTE (intentional): We keep "requiredness" aligned with your existing
   confirm-missing flow (requiresConfirm). Therefore:
   - Fields may remain optional/blank (so your confirmMissing dialog still works).
   - However, if a user enters a value, it MUST satisfy strict format rules.
*/

const asTrimmed = (v) => (v === null || v === undefined ? '' : String(v).trim())

const optionalText = (max = 5000) =>
  z.preprocess((v) => {
    const s = asTrimmed(v)
    return s === '' ? '' : s
  }, z.string().max(max))

const dateLoose = (label: string) =>
  z.preprocess(
    (v) => asTrimmed(v),
    z
      .string()
      .refine(
        (s) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s),
        `${label} must be in YYYY-MM-DD format`
      )
  )

const decimal2Loose = (label: string) =>
  z.preprocess(
    (v) => asTrimmed(v),
    z
      .string()
      .refine(
        (s) => s === '' || /^\d+(\.\d{1,2})?$/.test(s),
        `${label} must be a valid number (max 2 decimals)`
      )
  )

const mobileLoose = z.preprocess(
  (v) => asTrimmed(v).replace(/\s+/g, ''),
  z
    .string()
    .refine(
      (s) => s === '' || /^\d{10}$/.test(s),
      'Mobile No must be exactly 10 digits'
    )
)

const creditLimitRowSchema = z
  .object({
    facility: optionalText(200),
    existing: decimal2Loose('Existing'),
    proposed: decimal2Loose('Proposed'),
    change: decimal2Loose('Change'),
    presentOutstanding: decimal2Loose('Present Outstanding'),
    overdue: decimal2Loose('Overdue'),
  })
  .superRefine((row, ctx) => {
    // If the row has any numeric value, facility must be present.
    const anyNumeric =
      asTrimmed(row.existing) !== '' ||
      asTrimmed(row.proposed) !== '' ||
      asTrimmed(row.change) !== '' ||
      asTrimmed(row.presentOutstanding) !== '' ||
      asTrimmed(row.overdue) !== ''

    if (anyNumeric && asTrimmed(row.facility) === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['facility'],
        message: 'Facility is required when amounts are provided',
      })
    }
  })

const indebtednessRowSchema = z.object({
  description: optionalText(200),
  existing: decimal2Loose('Existing'),
  proposed: decimal2Loose('Proposed'),
})

const fyLoose = z.preprocess(
  (v) => asTrimmed(v),
  z.string().refine(
    (s) =>
      s === '' ||
      /^\d{4}-\d{2}-\d{2}$/.test(s) || // YYYY-MM-DD
      /^\d{4}-\d{2}$/.test(s) || // YYYY-MM
      /^FY ?\d{4}(-\d{2})?$/.test(s), // FY 2023-24 / FY2023
    'Enter FY as YYYY-MM-DD / YYYY-MM / FY 2023-24'
  )
)

const financialRowSchema = z.object({
  fy: fyLoose,
  netSales: decimal2Loose('Net Sales'),
  netProfit: decimal2Loose('Net Profit'),
  tangibleNetWorth: decimal2Loose('Tangible Net Worth'),
  tolToTnw: decimal2Loose('TOL/TNW'),
  currentRatio: decimal2Loose('Current Ratio'),
  dscr: decimal2Loose('DSCR'),
})

const annualReviewRowSchema = z.object({
  slNo: z.preprocess(
    (v) => asTrimmed(v),
    z
      .string()
      .refine((s) => s === '' || /^\d+$/.test(s), 'Sl No must be numeric')
  ),
  accountNo: optionalText(50),
  limit: decimal2Loose('Limit'),
  dp: decimal2Loose('DP'),
  outstanding: decimal2Loose('Outstanding'),
  irregularity: optionalText(1000),
  dscr: decimal2Loose('DSCR'),
  facr: decimal2Loose('FACR'),
  iracStatus: optionalText(200),
  restructuringDateSanction: dateLoose('Dt of Restructuring (Sanction)'),
  restructuringDateActual: dateLoose('Dt of Restructuring (Actual)'),
})

const termLoanReviewSchema = z
  .object({
    // IMPORTANT: id exists in edit payloads (dtoToForm). Keep it to avoid schema failure.
    id: z.any().optional(),

    bankCode: optionalText(20),

    accountNumber: optionalText(50),

    branch: optionalText(200),
    unitName: optionalText(500),
    proprietorName: optionalText(500),
    businessAddress: optionalText(2000),
    mobileNo: mobileLoose,

    loanType: optionalText(200),
    loanAccountNo: optionalText(50),
    loanSanctionedLimit: decimal2Loose('Loan Sanctioned Limit (L)'),
    presentOutstanding: decimal2Loose('Present Outstanding (L)'),
    loanTerm: optionalText(200),

    dateOfSanction: dateLoose('Date of Sanction'),
    dateOfDisbursement: dateLoose('Date of Disbursement'),
    loanPurpose: optionalText(2000),

    applicableRoi: decimal2Loose('Applicable Rate of Interest (%)').superRefine(
      (s, ctx) => {
        if (asTrimmed(s) === '') return
        const n = Number(s)
        if (Number.isNaN(n)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Applicable Rate of Interest (%) is invalid',
          })
          return
        }
        if (n < 0 || n > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Applicable Rate of Interest (%) must be between 0 and 100',
          })
        }
      }
    ),

    interestEarnedTillDate: decimal2Loose(
      'Income / Interest earned till date (L)'
    ),

    bankingArrangement: optionalText(200),
    crilicComment: optionalText(5000),

    otherBankLimitFb: decimal2Loose('Limit with Other Bank – FB (L)'),
    otherBankLimitNfb: decimal2Loose('Limit with Other Bank – NFB (L)'),
    otherBankLimitTotal: decimal2Loose('Total Limit with Other Bank (L)'),

    dateOfLastReview: dateLoose('Date of Last Review / Renewal'),
    iracSmaStatus: optionalText(200),
    centralFraudRegistry: optionalText(500),

    craBasedOnBalanceSheetOn: dateLoose('CRA based on Balance Sheet on'),
    craValidatedOn: dateLoose('Validated on'),
    borrowingRatingCurrent: optionalText(200),
    borrowingRatingPrevious: optionalText(200),
    overallScore: decimal2Loose('Overall Score'),
    financialScore: decimal2Loose('Financial Score / Min Score'),
    craRating: optionalText(200),

    presentProposalSanctionFor: optionalText(5000),
    presentProposalApprovalFor: optionalText(5000),
    presentProposalBriefProfile: optionalText(10000),

    creditLimits: z.array(creditLimitRowSchema).min(1),
    indebtednessRows: z.array(indebtednessRowSchema).min(2),
    financials: z.array(financialRowSchema).min(1),
    annualReviews: z.array(annualReviewRowSchema).min(1),

    perfAdverseMovements: optionalText(5000),
    perfOverallFinancialCondition: optionalText(5000),
    perfSalesComment: optionalText(5000),
    perfSignificantVariations: optionalText(5000),

    synopsisSourcesOfFunds: optionalText(10000),
    synopsisApplicationOfFunds: optionalText(10000),
    synopsisAdverseComments: optionalText(5000),

    salientFeatures: optionalText(10000),

    recommendationSanctionFor: optionalText(10000),
    recommendationApprovalFor: optionalText(10000),
    recommendationConfirmFor: optionalText(10000),

    appraisedByName: optionalText(500),
    appraisedByPfNo: optionalText(100),
    appraisedByDesignation: optionalText(200),
    appraisedByMobileNo: z.preprocess(
      (v) => asTrimmed(v).replace(/\s+/g, ''),
      z
        .string()
        .refine(
          (s) => s === '' || /^\d{10}$/.test(s),
          'Appraised By Mobile No must be exactly 10 digits'
        )
    ),
    appraisedByDate: dateLoose('Appraised By Date'),
  })
  .strict()
  .superRefine((d, ctx) => {
    // Cross-field arithmetic check ONLY when all three are present (non-empty).
    const fbS = asTrimmed(d.otherBankLimitFb)
    const nfbS = asTrimmed(d.otherBankLimitNfb)
    const totalS = asTrimmed(d.otherBankLimitTotal)

    if (fbS !== '' && nfbS !== '' && totalS !== '') {
      const fb = Number(fbS)
      const nfb = Number(nfbS)
      const total = Number(totalS)
      if (!Number.isNaN(fb) && !Number.isNaN(nfb) && !Number.isNaN(total)) {
        const sum = fb + nfb
        if (Math.abs(sum - total) > 0.01) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['otherBankLimitTotal'],
            message: `Total must equal FB + NFB (expected ${sum.toFixed(2)})`,
          })
        }
      }
    }
  })

/* ================= DTO <-> Form mapping ================= */

function dtoToForm(dto, fallbackAcctNo) {
  const facilityPositions = Array.isArray(dto?.facilityPositions)
    ? dto.facilityPositions
    : []
  const financialRecords = Array.isArray(dto?.financials) ? dto.financials : []

  const creditLimits =
    facilityPositions.length > 0
      ? facilityPositions.map((p) => ({
          facility: p?.facilityOrScheme ?? '',
          existing: p?.limitLacs ?? '',
          proposed: '',
          change: '',
          presentOutstanding: p?.outstandingLacs ?? '',
          overdue: p?.irregularityLacs ?? '',
        }))
      : BLANK_FORM.creditLimits

  const indebtednessRows = [
    {
      description: 'Fund based',
      existing: dto?.indebtedness?.existingFundBased ?? '',
      proposed: dto?.indebtedness?.proposedFundBased ?? '',
    },
    {
      description: 'Non-fund based',
      existing: dto?.indebtedness?.existingNonFundBased ?? '',
      proposed: dto?.indebtedness?.proposedNonFundBased ?? '',
    },
  ]

  const dscrFromIndicators = dto?.financialIndicators?.indicatorDscr ?? ''

  const financials =
    financialRecords.length > 0
      ? financialRecords.map((r) => ({
          fy: r?.asOnDate ?? '',
          netSales: r?.netSales ?? '',
          netProfit: r?.pat ?? r?.pbt ?? '',
          tangibleNetWorth: r?.tnw ?? '',
          tolToTnw: r?.tolToTnw ?? '',
          currentRatio: r?.currentRatio ?? '',
          dscr: dscrFromIndicators ?? '',
        }))
      : BLANK_FORM.financials

  const acct =
    dto?.genericAccountNo ?? dto?.accountNumber ?? fallbackAcctNo ?? ''

  return {
    ...BLANK_FORM,
    id: dto?.id ?? undefined,
    bankCode: dto?.bankCode ?? 'APRB',

    accountNumber: acct,
    loanAccountNo: acct,

    branch: dto?.branch ?? '',
    unitName: dto?.borrowerName ?? '',
    proprietorName: dto?.proprietorName ?? '',
    businessAddress: dto?.businessAddress ?? dto?.borrowerAddress ?? '',
    mobileNo: dto?.phone ?? '',

    loanType: dto?.facilityOrScheme ?? '',
    loanSanctionedLimit: dto?.genericSanctionAmountLacs ?? '',
    presentOutstanding: dto?.outstandingAsOnDateLacs ?? '',
    loanTerm: dto?.loanTerm ?? '',

    dateOfSanction: toInputDate(dto?.genericSanctionDate ?? ''),
    dateOfDisbursement: toInputDate(
      dto?.dateOfDisbursement ?? dto?.firstDisbursementDate ?? ''
    ),
    loanPurpose: dto?.purposeOfLoan ?? '',
    applicableRoi: dto?.interestRateAsPerSanction ?? '',
    interestEarnedTillDate: dto?.incomeOrInterestEarnedTillDate ?? '',

    bankingArrangement: dto?.bankingArrangement ?? '',
    crilicComment: dto?.crilicComments ?? '',
    dateOfLastReview: toInputDate(dto?.lastReviewDate ?? ''),
    iracSmaStatus: dto?.smaStatusSummary ?? dto?.iracStatus ?? '',

    craBasedOnBalanceSheetOn: toInputDate(dto?.craBasedOnBalanceSheetOn ?? ''),
    craValidatedOn: toInputDate(dto?.creditRating?.craValidatedOn ?? ''),
    borrowingRatingCurrent: dto?.creditRating?.borrowingRatingCurrent ?? '',
    borrowingRatingPrevious: dto?.creditRating?.borrowingRatingPrevious ?? '',
    overallScore: dto?.creditRating?.overallScore ?? '',
    financialScore: dto?.creditRating?.financialScore ?? '',
    craRating: dto?.craRating ?? dto?.creditRating?.finalCraRatingByBank ?? '',

    presentProposalSanctionFor: dto?.branchManagerRecommendation ?? '',
    presentProposalApprovalFor: dto?.seniorManagerRecommendation ?? '',
    presentProposalBriefProfile: dto?.reviewingAuthorityRemarks ?? '',

    creditLimits,
    indebtednessRows,
    financials,

    perfAdverseMovements:
      dto?.financialIndicators?.indicatorCommentsAdverse ?? '',
    perfOverallFinancialCondition:
      dto?.financialIndicators?.indicatorCommentsOverall ?? '',
    perfSalesComment: '',
    perfSignificantVariations: dto?.irregularityReason ?? '',

    synopsisSourcesOfFunds: '',
    synopsisApplicationOfFunds: '',
    synopsisAdverseComments: '',

    annualReviews: BLANK_FORM.annualReviews,

    salientFeatures: dto?.salientFeatures ?? '',

    recommendationSanctionFor: dto?.aprbSanctionFor ?? '',
    recommendationApprovalFor: dto?.aprbApprovalFor ?? '',
    recommendationConfirmFor: dto?.aprbConfirmFor ?? '',

    appraisedByName: '',
    appraisedByPfNo: '',
    appraisedByDesignation: '',
    appraisedByMobileNo: '',
    appraisedByDate: '',
  }
}

function formToDto(d, accountId) {
  const genericAcctNo = accountId ?? d?.loanAccountNo ?? d?.accountNumber

  const facilityPositions = (d?.creditLimits ?? []).map((r) => ({
    facilityOrScheme: r?.facility || undefined,
    limitLacs: r?.existing === '' ? undefined : Number(r?.existing),
    dpLacs: undefined,
    outstandingLacs:
      r?.presentOutstanding === '' ? undefined : Number(r?.presentOutstanding),
    irregularityLacs: r?.overdue === '' ? undefined : Number(r?.overdue),
  }))

  const indebtedness = {
    existingFundBased:
      d?.indebtednessRows?.[0]?.existing === ''
        ? undefined
        : Number(d?.indebtednessRows?.[0]?.existing),
    proposedFundBased:
      d?.indebtednessRows?.[0]?.proposed === ''
        ? undefined
        : Number(d?.indebtednessRows?.[0]?.proposed),
    existingNonFundBased:
      d?.indebtednessRows?.[1]?.existing === ''
        ? undefined
        : Number(d?.indebtednessRows?.[1]?.existing),
    proposedNonFundBased:
      d?.indebtednessRows?.[1]?.proposed === ''
        ? undefined
        : Number(d?.indebtednessRows?.[1]?.proposed),
  }

  const financials = (d?.financials ?? []).map((r) => ({
    asOnDate: r?.fy || undefined,
    netSales: r?.netSales === '' ? undefined : Number(r?.netSales),
    pbt: undefined,
    pat: r?.netProfit === '' ? undefined : Number(r?.netProfit),
    cashAccrual: undefined,
    tnw: r?.tangibleNetWorth === '' ? undefined : Number(r?.tangibleNetWorth),
    tolToTnw: r?.tolToTnw === '' ? undefined : Number(r?.tolToTnw),
    currentRatio: r?.currentRatio === '' ? undefined : Number(r?.currentRatio),
    remark: undefined,
  }))

  const dto = {
    id: d?.id ?? undefined,
    bankCode: d?.bankCode ?? 'APRB',

    genericAccountNo: genericAcctNo || undefined,
    accountNumber: d?.accountNumber || genericAcctNo || undefined,

    branch: d?.branch || undefined,
    borrowerName: d?.unitName || undefined,
    proprietorName: d?.proprietorName || undefined,
    businessAddress: d?.businessAddress || undefined,
    phone: d?.mobileNo || undefined,

    facilityOrScheme: d?.loanType || undefined,
    genericSanctionDate: toISODateOrNull(d?.dateOfSanction) ?? undefined,
    genericSanctionAmountLacs:
      d?.loanSanctionedLimit === ''
        ? undefined
        : Number(d?.loanSanctionedLimit),

    outstandingAsOnDateLacs:
      d?.presentOutstanding === '' ? undefined : Number(d?.presentOutstanding),

    loanTerm: d?.loanTerm || undefined,
    dateOfDisbursement: toISODateOrNull(d?.dateOfDisbursement) ?? undefined,
    purposeOfLoan: d?.loanPurpose || undefined,
    interestRateAsPerSanction:
      d?.applicableRoi === '' ? undefined : Number(d?.applicableRoi),
    incomeOrInterestEarnedTillDate:
      d?.interestEarnedTillDate === ''
        ? undefined
        : Number(d?.interestEarnedTillDate),

    bankingArrangement: d?.bankingArrangement || undefined,
    crilicComments: d?.crilicComment || undefined,

    lastReviewDate: toISODateOrNull(d?.dateOfLastReview) ?? undefined,
    iracStatus: d?.iracSmaStatus || undefined,

    craRating: d?.craRating || undefined,
    creditRating: {
      craValidatedOn: toISODateOrNull(d?.craValidatedOn) ?? undefined,
      borrowingRatingCurrent: d?.borrowingRatingCurrent || undefined,
      borrowingRatingPrevious: d?.borrowingRatingPrevious || undefined,
      overallScore:
        d?.overallScore === '' ? undefined : Number(d?.overallScore),
      financialScore:
        d?.financialScore === '' ? undefined : Number(d?.financialScore),
      finalCraRatingByBank: d?.craRating || undefined,
    },

    facilityPositions,
    indebtedness,
    financialIndicators: {
      indicatorCommentsAdverse: d?.perfAdverseMovements || undefined,
      indicatorCommentsOverall: d?.perfOverallFinancialCondition || undefined,
      indicatorDscr:
        d?.financials?.[0]?.dscr === ''
          ? undefined
          : Number(d?.financials?.[0]?.dscr),
    },

    salientFeatures: d?.salientFeatures || undefined,
    aprbSanctionFor: d?.recommendationSanctionFor || undefined,
    aprbApprovalFor: d?.recommendationApprovalFor || undefined,
    aprbConfirmFor: d?.recommendationConfirmFor || undefined,
  }

  return cleanEmptyToNull(dto)
}

/* ================= Component ================= */

export default function ACRBTermLoanReviewForm() {
  const { accountId } = useParams({
    from: '/_authenticated/(searching)/term-loan-review/$accountId',
  })

  const [editingId, setEditingId] = useState(null)
  const [openDeleteId, setOpenDeleteId] = useState(null)
  const [confirmMissing, setConfirmMissing] = useState(null)
  const [message, setMessage] = useState('')
  const [lockedPaths, setLockedPaths] = useState({})

  // prevents auto-prefill immediately after successful save/update (so form truly clears)
  const skipAutoPrefillOnceRef = useRef(false)
  // ensures the prefill effect doesn't race on the same click as Edit
  const editingClickRef = useRef(false)

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(termLoanReviewSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      ...BLANK_FORM,
      accountNumber: accountId ?? '',
      loanAccountNo: accountId ?? '',
    },
  })

  const isLocked = (path) => lockedPaths[path] === true

  /* ================= Query: History ================= */
  const {
    data: historyResp,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = $api.useQuery('get', '/term-loan-review/get', {
    params: {
      query: { bankCode: 'APRB', acctNo: accountId ?? '' },
    },
  })

  const { data: accountDetails } = useAccountDetails(accountId)
  const { data: branchDetails } = useBranchDepartmentInfo(accountId)

  /* ================= Field Arrays ================= */
  const creditFA = useFieldArray({ control, name: 'creditLimits' })
  const indebtedFA = useFieldArray({ control, name: 'indebtednessRows' })
  const financialFA = useFieldArray({ control, name: 'financials' })
  const annualFA = useFieldArray({ control, name: 'annualReviews' })

  const creditLimitFields = creditFA.fields
  const creditLimitAppend = creditFA.append
  const creditLimitRemove = creditFA.remove
  const creditLimitReplace = creditFA.replace

  const indebtednessFields = indebtedFA.fields
  const indebtednessAppend = indebtedFA.append
  const indebtednessRemove = indebtedFA.remove
  const indebtednessReplace = indebtedFA.replace

  const financialFields = financialFA.fields
  const financialAppend = financialFA.append
  const financialRemove = financialFA.remove
  const financialReplace = financialFA.replace

  const annualReviewFields = annualFA.fields
  const annualReviewAppend = annualFA.append
  const annualReviewRemove = annualFA.remove
  const annualReviewReplace = annualFA.replace

  /* ================= Auto Prefill (only for NEW, not edit) ================= */
  useEffect(() => {
    if (editingId) return
    if (editingClickRef.current) return
    if (!accountDetails && !branchDetails) return

    // skip once after successful update/create to keep form totally blank
    if (skipAutoPrefillOnceRef.current) {
      skipAutoPrefillOnceRef.current = false
      return
    }

    const addrParts = [
      accountDetails?.add1,
      accountDetails?.add2,
      accountDetails?.add3,
      accountDetails?.add4,
    ]
      .map((x) => (x ?? '').trim())
      .filter(Boolean)

    const businessAddress = addrParts.join(', ')

    const pre = {
      branch: branchDetails?.branchName ?? accountDetails?.branchName ?? '',
      unitName: accountDetails?.custName ?? '',
      businessAddress,
      mobileNo: accountDetails?.telNo ?? '',
      loanType: accountDetails?.actType ?? '',
      loanAccountNo: accountId ?? '',
      loanSanctionedLimit: accountDetails?.loanLimit ?? '',
      presentOutstanding: accountDetails?.outstand ?? '',
      applicableRoi: accountDetails?.intRate ?? '',
      dateOfSanction: toInputDate(accountDetails?.sanctDt ?? ''),
    }

    const nextLocks = {}

    const setIfEmpty = (path, value) => {
      if (value === '' || value === null || value === undefined) return
      const cur = getValues(path)
      const empty = cur === '' || cur === null || cur === undefined
      if (!empty) return

      setValue(path, value, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
      nextLocks[path] = true
    }

    setIfEmpty('branch', pre.branch)
    setIfEmpty('unitName', pre.unitName)
    setIfEmpty('businessAddress', pre.businessAddress)
    setIfEmpty('mobileNo', pre.mobileNo)
    setIfEmpty('loanType', pre.loanType)
    setIfEmpty('loanAccountNo', pre.loanAccountNo)
    setIfEmpty('loanSanctionedLimit', pre.loanSanctionedLimit)
    setIfEmpty('presentOutstanding', pre.presentOutstanding)
    setIfEmpty('applicableRoi', pre.applicableRoi)
    setIfEmpty('dateOfSanction', pre.dateOfSanction)

    setIfEmpty('creditLimits.0.facility', pre.loanType)
    setIfEmpty('creditLimits.0.existing', pre.loanSanctionedLimit)
    setIfEmpty('creditLimits.0.presentOutstanding', pre.presentOutstanding)
    setIfEmpty('annualReviews.0.accountNo', pre.loanAccountNo)

    if (Object.keys(nextLocks).length) {
      setLockedPaths((prev) => ({ ...prev, ...nextLocks }))
    }
  }, [accountDetails, branchDetails, accountId, editingId, getValues, setValue])

  /* ================= History list =================
     IMPORTANT FIX:
     We keep original DTO in the row itself so Edit never depends on stale closures.
  */
  const history = useMemo(() => {
    const raw = historyResp?.data ?? []
    return raw.map((dto) => {
      const loanAcct = dto?.genericAccountNo ?? dto?.accountNumber ?? ''
      return {
        _dto: dto,
        id: dto?.id ?? loanAcct,
        loanAccountNo: loanAcct,
        accountNumber: dto?.accountNumber ?? loanAcct,
        unitName: dto?.borrowerName ?? '',
        branch: dto?.branch ?? '',
        dateOfLastReview: dto?.lastReviewDate ?? null,
      }
    })
  }, [historyResp?.data])

  /* ================= Mutations ================= */
  const createMutation = $api.useMutation(
    'post',
    '/term-loan-review/create/review',
    {
      onSuccess: async () => {
        toast.success('Saved')
        await refetchHistory()

        // clear everything
        skipAutoPrefillOnceRef.current = true
        setLockedPaths({})
        setConfirmMissing(null)
        setMessage('')
        setEditingId(null)
        editingClickRef.current = false

        reset({
          ...BLANK_FORM,
          accountNumber: accountId ?? '',
          loanAccountNo: accountId ?? '',
        })
        creditLimitReplace(BLANK_FORM.creditLimits)
        indebtednessReplace(BLANK_FORM.indebtednessRows)
        financialReplace(BLANK_FORM.financials)
        annualReviewReplace(BLANK_FORM.annualReviews)
      },
      onError: (error) => toastError(error, 'Submit failed'),
    }
  )

  const updateMutation = $api.useMutation(
    'put',
    '/term-loan-review/update/review/{reviewId}',
    {
      onSuccess: async () => {
        toast.success('Updated')
        await refetchHistory()

        // clear everything + exit edit mode
        skipAutoPrefillOnceRef.current = true
        setLockedPaths({})
        setConfirmMissing(null)
        setMessage('')
        setEditingId(null)
        editingClickRef.current = false

        reset({
          ...BLANK_FORM,
          accountNumber: accountId ?? '',
          loanAccountNo: accountId ?? '',
        })
        creditLimitReplace(BLANK_FORM.creditLimits)
        indebtednessReplace(BLANK_FORM.indebtednessRows)
        financialReplace(BLANK_FORM.financials)
        annualReviewReplace(BLANK_FORM.annualReviews)
      },
      onError: (error) => toastError(error, 'Update failed'),
    }
  )

  const deleteMutation = $api.useMutation(
    'delete',
    '/term-loan-review/delete/review/{reviewId}'
  )

  /* ================= Actions ================= */

  function onEditRow(row) {
    const dto = row?._dto
    if (!dto?.id) {
      toast.error('Could not load record')
      return
    }

    // IMPORTANT FIX:
    // 1) stop auto-prefill race
    // 2) unlock fields for edit
    editingClickRef.current = true
    setLockedPaths({})
    setConfirmMissing(null)
    setMessage('')

    const next = dtoToForm(dto, accountId ?? '')

    setEditingId(String(dto.id))

    // reset + replace arrays (field-array-safe)
    reset(next)
    creditLimitReplace(next.creditLimits ?? BLANK_FORM.creditLimits)
    indebtednessReplace(next.indebtednessRows ?? BLANK_FORM.indebtednessRows)
    financialReplace(next.financials ?? BLANK_FORM.financials)
    annualReviewReplace(next.annualReviews ?? BLANK_FORM.annualReviews)

    toast.info('Loaded into form below')
    // allow prefill again only after you exit edit mode
    setTimeout(() => {
      editingClickRef.current = false
    }, 0)
  }

  function onDownload(id, type) {
    const url = `${import.meta.env.VITE_APP_API_URL}/term-loan-review/download/${type}/${id}`
    window.open(url, '_blank')
  }

  async function onDelete() {
    if (!openDeleteId) return
    deleteMutation.mutate(
      {
        params: {
          path: { reviewId: Number(openDeleteId) },
          query: { bankCode: 'APRB' },
        },
      },
      {
        onSuccess: async () => {
          toast.success('Deleted')
          setOpenDeleteId(null)
          await refetchHistory()
        },
        onError: (error) => toastError(error, 'Delete failed'),
      }
    )
  }

  function requiresConfirm(d) {
    const missing = []
    if (!d?.branch || !d?.unitName)
      missing.push('Basic Details (Branch / Unit Name)')
    if (!d?.loanAccountNo) missing.push('Loan Account No')
    if (!d?.creditLimits?.[0]?.facility) missing.push('Credit Limits')
    if (!d?.annualReviews?.[0]?.accountNo)
      missing.push('Annual Review of Term Loans')
    if (!d?.salientFeatures) missing.push('Salient Features & Justification')
    if (!d?.recommendationSanctionFor) missing.push('Recommendation Section')

    if (missing.length) {
      setMessage(`Proceed without completing: ${missing.join(', ')}?`)
      return true
    }
    return false
  }

  function submit(d) {
    if (!confirmMissing) {
      if (requiresConfirm(d)) {
        setConfirmMissing(d)
        return
      }
    }
    setConfirmMissing(null)

    const dto = formToDto(d, accountId)

    if (editingId) {
      updateMutation.mutate({
        body: dto,
        params: {
          path: { reviewId: Number(editingId) },
          query: { bankCode: 'APRB' }, // ✅ safe if backend expects it
        },
      })
    } else {
      createMutation.mutate({
        body: dto,
        params: {
          query: { bankCode: 'APRB' }, // ✅ safe if backend expects it
        },
      })
    }
  }

  const Section = ({ title, children }) => (
    <Card className='mb-6 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-primary text-xl font-semibold'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )

  const columns = useMemo(
    () => [
      {
        key: 'loanAccountNo',
        label: 'Loan A/c No',
        render: (v) => <AccountNoCell value={v ?? ''} />,
      },
      { key: 'unitName', label: 'Name of Unit' },
      { key: 'branch', label: 'Branch' },
      {
        key: 'dateOfLastReview',
        label: 'Last Review Date',
        render: (v) => (v ? format(new Date(v), 'dd-MM-yyyy') : '—'),
      },
      {
        key: 'id',
        label: 'Actions',
        render: (_, row) => (
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => onEditRow(row)}>
              <IconEdit />
            </Button>
            {/* <Button
              variant='outline'
              onClick={() => onDownload(String(row.id), 'pdf')}
            >
              <IconDownload />
            </Button> */}
            <Button
              variant='destructive'
              onClick={() => setOpenDeleteId(String(row.id))}
            >
              <IconTrash />
            </Button>
          </div>
        ),
      },
    ],
    [historyResp?.data, editingId]
  )

  const pageLoading = isSubmitting || isHistoryLoading

  return (
    <div className='min-h-screen dark:bg-gray-900'>
      {pageLoading ? (
        <Loader />
      ) : (
        <>
          <h1 className='mb-6 text-3xl font-bold text-gray-900 dark:text-white'>
            Term Loan Review
          </h1>

          {/* HISTORY */}
          <div className='mb-6'>
            <PaginatedTable
              data={history}
              columns={columns}
              initialRowsPerPage={10}
              emptyMessage='No Data'
              tableTitle='History'
              showSearch
            />
          </div>

          {/* BASIC DETAILS */}
          <Section title='1. Basic Details'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              {[
                ['accountNumber', 'Account Number'],
                ['branch', 'Branch'],
                ['unitName', 'Name of the Unit'],
                ['proprietorName', 'Name of Proprietor'],
                ['businessAddress', 'Business Address', 'textarea'],
                ['mobileNo', 'Mobile No'],
                ['loanType', 'Loan Type'],
                ['loanAccountNo', 'Loan Account No'],
                ['loanSanctionedLimit', 'Loan Sanctioned Limit (L)', 'number'],
                ['presentOutstanding', 'Present Outstanding (L)', 'number'],
                ['loanTerm', 'Loan Term'],
                ['dateOfSanction', 'Date of Sanction', 'date'],
                ['dateOfDisbursement', 'Date of Disbursement', 'date'],
                ['loanPurpose', 'Purpose of the Loan', 'textarea'],
                ['applicableRoi', 'Applicable Rate of Interest (%)', 'number'],
                [
                  'interestEarnedTillDate',
                  'Income / Interest earned till date (L)',
                  'number',
                ],
              ].map(([name, label, type]) => (
                <div
                  key={name}
                  className={
                    name === 'businessAddress' || name === 'loanPurpose'
                      ? 'md:col-span-3'
                      : 'md:col-span-1'
                  }
                >
                  <Label className='text-gray-700'>{label}</Label>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => {
                      const locked = isLocked(name)
                      if (name === 'accountNumber') {
                        return (
                          <Input
                            {...field}
                            value={valueTypeCasting(field.value)}
                            readOnly
                            className='mt-1 cursor-not-allowed bg-gray-100 text-gray-700'
                          />
                        )
                      }

                      if (type === 'textarea') {
                        return (
                          <Textarea
                            {...field}
                            value={valueTypeCasting(field.value)}
                            className='mt-1'
                            disabled={locked}
                          />
                        )
                      }
                      if (type === 'number') {
                        return (
                          <Input
                            {...field}
                            inputMode='decimal'
                            noInput={clamp2dp}
                            value={valueTypeCasting(field.value)}
                            className='mt-1'
                            disabled={locked}
                          />
                        )
                      }
                      if (type === 'date') {
                        return (
                          <Input
                            {...field}
                            type='date'
                            value={num2(field.value)}
                            className='mt-1'
                            disabled={locked}
                          />
                        )
                      }
                      return (
                        <Input
                          {...field}
                          value={num2(field.value)}
                          className='mt-1'
                          disabled={locked}
                        />
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* BANKING ARRANGEMENT & REGULATORY */}
          <Section title='Banking Arrangement & Regulatory Checks'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <div>
                <Label>Banking Arrangement (Sole / Multiple)</Label>
                <Controller
                  name='bankingArrangement'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      placeholder='Sole / Multiple'
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Limit with Other Bank – FB (L)</Label>
                <Controller
                  name='otherBankLimitFb'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      value={valueTypeCasting(field.value)}
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Limit with Other Bank – NFB (L)</Label>
                <Controller
                  name='otherBankLimitNfb'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      value={valueTypeCasting(field.value)}
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Total Limit with Other Bank (L)</Label>
                <Controller
                  name='otherBankLimitTotal'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Date of Last Review / Renewal</Label>
                <Controller
                  name='dateOfLastReview'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type='date'
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>IRAC / SMA Status</Label>
                <Controller
                  name='iracSmaStatus'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div className='md:col-span-3'>
                <Label>Comments on CRILIC report (if any)</Label>
                <Controller
                  name='crilicComment'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* INTERNAL CREDIT RATING SUMMARY */}
          <Section title='Internal Credit Rating Summary / CRA'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <div>
                <Label>CRA based on Balance Sheet on</Label>
                <Controller
                  name='craBasedOnBalanceSheetOn'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type='date'
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Validated on</Label>
                <Controller
                  name='craValidatedOn'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type='date'
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Borrowing Rating (Current)</Label>
                <Controller
                  name='borrowingRatingCurrent'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Borrowing Rating (Previous)</Label>
                <Controller
                  name='borrowingRatingPrevious'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Overall Score</Label>
                <Controller
                  name='overallScore'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Financial Score / Min Score</Label>
                <Controller
                  name='financialScore'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      inputMode='decimal'
                      value={valueTypeCasting(field.value)}
                      onChange={(e) =>
                        field.onChange(sanitizeDecimal2(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        field.onChange(
                          sanitizeDecimal2(e.clipboardData.getData('text'))
                        )
                      }}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>CRA Rating based on above score</Label>
                <Controller
                  name='craRating'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* PRESENT PROPOSAL */}
          <Section title='2. Present Proposal'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <Label>Sanction for</Label>
                <Controller
                  name='presentProposalSanctionFor'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div>
                <Label>Approval for</Label>
                <Controller
                  name='presentProposalApprovalFor'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                    />
                  )}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>
                  Brief Profile of Unit / Directors / Proprietor / Partners
                </Label>
                <Controller
                  name='presentProposalBriefProfile'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={4}
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* CREDIT LIMITS */}
          <Section title='3. Credit Limits (Existing and Proposed) – Rs. in Lakh'>
            <div className='overflow-x-auto'>
              <Table className='min-w-full'>
                <TableHeader>
                  <TableRow className='bg-gray-100 dark:bg-gray-900'>
                    {[
                      'Facility',
                      'Existing',
                      'Proposed',
                      'Change',
                      'Present Outstanding',
                      'Overdue, if any',
                      'Action',
                    ].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditLimitFields.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Controller
                          name={`creditLimits.${i}.facility`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={valueTypeCasting(field.value)}
                              placeholder='CC / OD / TL / LC / BG / etc.'
                            />
                          )}
                        />
                      </TableCell>

                      {[
                        'existing',
                        'proposed',
                        'change',
                        'presentOutstanding',
                        'overdue',
                      ].map((k) => (
                        <TableCell key={k}>
                          <Controller
                            name={`creditLimits.${i}.${k}`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                inputMode='decimal'
                                value={valueTypeCasting(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    sanitizeDecimal2(e.target.value)
                                  )
                                }
                                onPaste={(e) => {
                                  e.preventDefault()
                                  field.onChange(
                                    sanitizeDecimal2(
                                      e.clipboardData.getData('text')
                                    )
                                  )
                                }}
                                placeholder='0.00'
                              />
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell className='w-20'>
                        {i > 0 && (
                          <Button
                            variant='outline'
                            onClick={() => creditLimitRemove(i)}
                            className='text-red-600'
                          >
                            <IconMinus className='h-4 w-4' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                className='mt-2'
                onClick={() =>
                  creditLimitAppend({
                    facility: '',
                    existing: '',
                    proposed: '',
                    change: '',
                    presentOutstanding: '',
                    overdue: '',
                  })
                }
              >
                <IconPlus className='h-4 w-4' /> Add Facility
              </Button>
            </div>
          </Section>

          {/* INDEBTEDNESS */}
          <Section title='4. Indebtedness – Rs. in Lakh'>
            <div className='overflow-x-auto'>
              <Table className='min-w-full'>
                <TableHeader>
                  <TableRow className='bg-gray-100 dark:bg-gray-900'>
                    <TableHead>Description</TableHead>
                    <TableHead>Existing</TableHead>
                    <TableHead>Proposed</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indebtednessFields.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Controller
                          name={`indebtednessRows.${i}.description`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      {['existing', 'proposed'].map((k) => (
                        <TableCell key={k}>
                          <Controller
                            name={`indebtednessRows.${i}.${k}`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                inputMode='decimal'
                                value={valueTypeCasting(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    sanitizeDecimal2(e.target.value)
                                  )
                                }
                                onPaste={(e) => {
                                  e.preventDefault()
                                  field.onChange(
                                    sanitizeDecimal2(
                                      e.clipboardData.getData('text')
                                    )
                                  )
                                }}
                              />
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell className='w-20'>
                        {i > 1 && (
                          <Button
                            variant='outline'
                            onClick={() => indebtednessRemove(i)}
                            className='text-red-600'
                          >
                            <IconMinus className='h-4 w-4' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                className='mt-2'
                onClick={() =>
                  indebtednessAppend({
                    description: '',
                    existing: '',
                    proposed: '',
                  })
                }
              >
                <IconPlus className='h-4 w-4' /> Add Row
              </Button>
            </div>
          </Section>

          {/* PERFORMANCE & FINANCIAL INDICATORS */}
          <Section title='5. Performance and Financial Indicators (MSME Loans)'>
            <div className='overflow-x-auto'>
              <Table className='min-w-full'>
                <TableHeader>
                  <TableRow className='bg-gray-100 dark:bg-gray-900'>
                    {[
                      'FY',
                      'Net Sales',
                      'Net Profit',
                      'Tangible Net Worth',
                      'TOL/TNW',
                      'Current Ratio',
                      'DSCR (for TL)',
                      'Action',
                    ].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialFields.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Controller
                          name={`financials.${i}.fy`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={valueTypeCasting(field.value)}
                              placeholder='YYYY-MM-DD / FY label'
                            />
                          )}
                        />
                      </TableCell>

                      {[
                        'netSales',
                        'netProfit',
                        'tangibleNetWorth',
                        'tolToTnw',
                        'currentRatio',
                        'dscr',
                      ].map((k) => (
                        <TableCell key={k}>
                          <Controller
                            name={`financials.${i}.${k}`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                inputMode='decimal'
                                value={valueTypeCasting(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    sanitizeDecimal2(e.target.value)
                                  )
                                }
                                onPaste={(e) => {
                                  e.preventDefault()
                                  field.onChange(
                                    sanitizeDecimal2(
                                      e.clipboardData.getData('text')
                                    )
                                  )
                                }}
                              />
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell className='w-20'>
                        {i > 0 && (
                          <Button
                            variant='outline'
                            onClick={() => financialRemove(i)}
                            className='text-red-600'
                          >
                            <IconMinus className='h-4 w-4' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                className='mt-2'
                onClick={() =>
                  financialAppend({
                    fy: '',
                    netSales: '',
                    netProfit: '',
                    tangibleNetWorth: '',
                    tolToTnw: '',
                    currentRatio: '',
                    dscr: '',
                  })
                }
              >
                <IconPlus className='h-4 w-4' /> Add FY Row
              </Button>
            </div>

            <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label>
                  (a) Comments only on adverse movements in the above (max 5-6
                  lines)
                </Label>
                <Controller
                  name='perfAdverseMovements'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={3}
                    />
                  )}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>
                  (b) Overall financial condition (sales, profitability, TNW,
                  TOL/TNW, current ratio)
                </Label>
                <Controller
                  name='perfOverallFinancialCondition'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={3}
                    />
                  )}
                />
              </div>

              <div>
                <Label>(c) Sales</Label>
                <Controller
                  name='perfSalesComment'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>

              <div>
                <Label>
                  (d) Comments on significant variations in financial indicators
                </Label>
                <Controller
                  name='perfSignificantVariations'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* SYNOPSIS OF BALANCE SHEET */}
          <Section title='5(e). Synopsis of Balance Sheet'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <Label>Synopsis – Sources of Funds (Prev & Last Yr)</Label>
                <Controller
                  name='synopsisSourcesOfFunds'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={5}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Synopsis – Application of Funds (Prev & Last Yr)</Label>
                <Controller
                  name='synopsisApplicationOfFunds'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={5}
                    />
                  )}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>
                  Comments only on adverse movements in the above (max 5-6
                  lines)
                </Label>
                <Controller
                  name='synopsisAdverseComments'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={3}
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* ANNUAL REVIEW OF TERM LOANS */}
          <Section title='6. Annual Review of Term Loans – Rs. in Lakh'>
            <div className='w-full overflow-x-auto'>
              <Table className='min-w-400'>
                <TableHeader>
                  <TableRow className='bg-gray-100 dark:bg-gray-900'>
                    <TableHead className='min-w-17.5'>Sl No</TableHead>
                    <TableHead className='min-w-45'>A/c No</TableHead>
                    <TableHead className='min-w-35'>Limit</TableHead>
                    <TableHead className='min-w-35'>DP</TableHead>
                    <TableHead className='min-w-40'>Outstanding</TableHead>
                    <TableHead className='min-w-55'>
                      Irregularity (if any)
                    </TableHead>
                    <TableHead className='min-w-32.5'>DSCR</TableHead>
                    <TableHead className='min-w-32.5'>FACR</TableHead>
                    <TableHead className='min-w-40'>IRAC Status</TableHead>
                    <TableHead className='min-w-52.5'>
                      Dt of Restructuring (Sanction)
                    </TableHead>
                    <TableHead className='min-w-52.5'>
                      Dt of Restructuring (Actual)
                    </TableHead>
                    <TableHead className='min-w-27.5'>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {annualReviewFields.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell className='min-w-17.5'>
                        <Controller
                          name={`annualReviews.${i}.slNo`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              value={valueTypeCasting(
                                field.value ?? String(i + 1)
                              )}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell className='min-w-45'>
                        <Controller
                          name={`annualReviews.${i}.accountNo`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      {['limit', 'dp', 'outstanding'].map((k) => (
                        <TableCell
                          key={k}
                          className={
                            k === 'outstanding' ? 'min-w-40' : 'min-w-35'
                          }
                        >
                          <Controller
                            name={`annualReviews.${i}.${k}`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                inputMode='decimal'
                                value={valueTypeCasting(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    sanitizeDecimal2(e.target.value)
                                  )
                                }
                                onPaste={(e) => {
                                  e.preventDefault()
                                  field.onChange(
                                    sanitizeDecimal2(
                                      e.clipboardData.getData('text')
                                    )
                                  )
                                }}
                              />
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell className='min-w-55'>
                        <Controller
                          name={`annualReviews.${i}.irregularity`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      {['dscr', 'facr'].map((k) => (
                        <TableCell key={k} className='min-w-32.5'>
                          <Controller
                            name={`annualReviews.${i}.${k}`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                inputMode='decimal'
                                value={valueTypeCasting(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    sanitizeDecimal2(e.target.value)
                                  )
                                }
                                onPaste={(e) => {
                                  e.preventDefault()
                                  field.onChange(
                                    sanitizeDecimal2(
                                      e.clipboardData.getData('text')
                                    )
                                  )
                                }}
                              />
                            )}
                          />
                        </TableCell>
                      ))}

                      <TableCell className='min-w-40'>
                        <Controller
                          name={`annualReviews.${i}.iracStatus`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell className='min-w-52.5'>
                        <Controller
                          name={`annualReviews.${i}.restructuringDateSanction`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              type='date'
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell className='min-w-52.5'>
                        <Controller
                          name={`annualReviews.${i}.restructuringDateActual`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className='w-full'
                              type='date'
                              value={valueTypeCasting(field.value)}
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell className='min-w-27.5'>
                        {i > 0 && (
                          <Button
                            variant='outline'
                            onClick={() => annualReviewRemove(i)}
                            className='text-red-600'
                          >
                            <IconMinus className='h-4 w-4' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              className='mt-2'
              onClick={() =>
                annualReviewAppend({
                  slNo: String(annualReviewFields.length + 1),
                  accountNo: '',
                  limit: '',
                  dp: '',
                  outstanding: '',
                  irregularity: '',
                  dscr: '',
                  facr: '',
                  iracStatus: '',
                  restructuringDateSanction: '',
                  restructuringDateActual: '',
                })
              }
            >
              <IconPlus className='h-4 w-4' /> Add Term Loan
            </Button>
          </Section>

          {/* SALIENT FEATURES */}
          <Section title='7. Salient Features and Justification for the Proposal'>
            <Label>Salient Features & Justification</Label>
            <Controller
              name='salientFeatures'
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={valueTypeCasting(field.value)}
                  className='mt-1'
                  rows={5}
                />
              )}
            />
          </Section>

          {/* RECOMMENDATION / APPROVAL */}
          <Section title='8. Recommended for Sanction / Approval / Confirmation'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <Label>Sanction for</Label>
                <Controller
                  name='recommendationSanctionFor'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Approval for</Label>
                <Controller
                  name='recommendationApprovalFor'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>Confirm for</Label>
                <Controller
                  name='recommendationConfirmFor'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={valueTypeCasting(field.value)}
                      className='mt-1'
                      rows={2}
                    />
                  )}
                />
              </div>
            </div>

            <div className='mt-6 border-t pt-4'>
              <Label className='font-semibold'>
                Appraised / Recommended By
              </Label>
              <div className='mt-2 grid grid-cols-1 gap-4 md:grid-cols-3'>
                {[
                  ['appraisedByName', 'Name', 'text'],
                  ['appraisedByPfNo', 'PF No.', 'text'],
                  ['appraisedByDesignation', 'Designation', 'text'],
                  ['appraisedByMobileNo', 'Mobile No.', 'text'],
                  ['appraisedByDate', 'Date', 'date'],
                ].map(([name, label, t]) => (
                  <div key={name}>
                    <Label>{label}</Label>
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={t === 'date' ? 'date' : undefined}
                          value={valueTypeCasting(field.value)}
                          className='mt-1'
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ACTIONS */}
          <div className='mt-6 flex justify-end gap-4'>
            {editingId && (
              <Button
                variant='outline'
                onClick={() => {
                  editingClickRef.current = false
                  setEditingId(null)
                  setConfirmMissing(null)
                  setMessage('')
                  setLockedPaths({})

                  skipAutoPrefillOnceRef.current = true // keep blank on cancel too (as you requested)
                  reset({
                    ...BLANK_FORM,
                    accountNumber: accountId ?? '',
                    loanAccountNo: accountId ?? '',
                  })
                  creditLimitReplace(BLANK_FORM.creditLimits)
                  indebtednessReplace(BLANK_FORM.indebtednessRows)
                  financialReplace(BLANK_FORM.financials)
                  annualReviewReplace(BLANK_FORM.annualReviews)
                }}
                className='border-gray-300 text-gray-700 hover:bg-gray-100'
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit(submit, () =>
                toast.error(
                  'Validation failed. Please correct the invalid values (number/date/mobile formats).'
                )
              )}
              className='px-6 py-2'
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Update' : 'Submit'}
            </Button>
          </div>
        </>
      )}

      {/* Confirm Missing */}
      <Dialog
        open={!!confirmMissing}
        onOpenChange={(o) => !o && setConfirmMissing(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogTitle className='text-lg font-semibold text-gray-900'>
            Missing Sections
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            {message}
          </DialogDescription>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => setConfirmMissing(null)}
              className='mr-2'
            >
              Cancel
            </Button>
            <Button onClick={() => submit(confirmMissing)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!openDeleteId}
        onOpenChange={(o) => !o && setOpenDeleteId(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogTitle className='text-lg font-semibold text-gray-900'>
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            This action cannot be undone.
          </DialogDescription>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => setOpenDeleteId(null)}
              className='mr-2'
            >
              No, Cancel
            </Button>
            <Button onClick={onDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
