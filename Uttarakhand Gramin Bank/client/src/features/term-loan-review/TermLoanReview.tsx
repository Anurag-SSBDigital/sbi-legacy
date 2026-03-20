// ------------------------------------------------------------------
// components/tgb-loan-review-form.tsx
// BankCode: TGB  (Schema = A)
// Uses SAME APIs as reference:
//  - GET    /term-loan-review/get?bankCode=TGB&acctNo=...
//  - POST   /term-loan-review/create/review?bankCode=TGB
//  - PUT    /term-loan-review/update/review/{reviewId}?bankCode=TGB
//  - DELETE /term-loan-review/delete/review/{reviewId}?bankCode=TGB
// ------------------------------------------------------------------
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useFieldArray, useForm, type FieldPathByValue } from 'react-hook-form'
import { useParams } from '@tanstack/react-router'
import { type components } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Download, Edit, Eye, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { $api, fetchClient } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import useAccountDetails, {
  type AccountDetail,
} from '@/hooks/use-account-details.ts'
import useBranchDepartmentInfo from '@/hooks/use-branch-department-info.ts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

/* ------------------------------------------------------------------

 * Types for your JSON payload (Problem Loan Review / similar)

 * ------------------------------------------------------------------ */

export type ISODateString = `${number}-${number}-${number}`

export type CersaiType = 'SI' | string

export type SmaStatus = 'NONE' | string

export interface RootPayload {
  id: number

  bankCode: string

  reviewDate: ISODateString

  branch: string

  regionalOffice: string

  borrowerName: string

  borrowerAddress: string

  guarantorNames: string[]

  guarantorAddresses: string[]

  cibilScore: number

  lastReviewDate: ISODateString

  groupCompany: string

  commercialProdStartDate: ISODateString

  industryOrActivity: string

  riskRating: string

  iracStatus: string

  termLoanPositions: TermLoanPosition[]

  interestRateAsPerSanction: number

  otherFacilitiesConduct: string

  installmentsPaid: number

  securityInfo: SecurityInfo

  assetInsuranceValidUpto: ISODateString

  revivalDueDate: ISODateString

  revivalDoneDate: ISODateString

  presentNetWorth: number

  lastAuditRemarks: string

  lastAuditCompliance: string

  branchManagerRecommendation: string

  seniorManagerRecommendation: string

  reviewingAuthorityRemarks: string

  rbo: string

  oldCardRatePct: number

  newCardRatePct: number

  proposedRatePct: number

  constitution: string

  proprietorName: string

  businessAddress: string

  phone: string

  facilityOrScheme: string

  genericAccountNo: string

  genericSanctionDate: ISODateString

  genericSanctionAmountLacs: number

  reviewDueDate: ISODateString

  craRating: string

  smaStatusSummary: string

  facilityPositions: FacilityPosition[]

  sanctionCompliances: SanctionCompliance[]

  irregularityReason: string

  unitActionPlan: string

  financials: FinancialRow[]

  cibilCheckedOn: ISODateString

  cibilCheckRef: string

  inspectionDate: ISODateString

  inspectionRemarks: string

  assetCreatedAsPerLoanPurpose: boolean

  documentationAsPerBankNorms: boolean

  documentationDeviationReason: string

  otherConditions: string[]

  reviewValidUpto: ISODateString

  reviewCharges: number

  finalRateOfInterestPct: number

  finalCraRating: string

  createdAt: ISODateString

  updatedAt: ISODateString

  createdBy: string

  updatedBy: string

  indebtednessList: IndebtednessRow[]

  creditRatings: CreditRatingRow[]

  financialIndicators: FinancialIndicatorRow[]

  balanceSheets: BalanceSheetRow[]

  accountNumber: string

  dateOfDisbursement: ISODateString

  purposeOfLoan: string

  incomeOrInterestEarnedTillDate: number

  bankingArrangement: string

  crilicComments: string

  salientFeatures: string

  tgbSanctionFor: string

  tgbApprovalFor: string

  tgbConfirmFor: string
}

export interface TermLoanPosition {
  id: number

  termLoanAccountNo: string

  originalSanctionDate: ISODateString

  sanctionedLimit: number

  theoreticalBalance: number

  outstanding: number

  overdues: number

  overdueReason: string

  rephasementDetails: string
}

export interface SecurityInfo {
  primarySecurity: string

  collateralSecurity: string

  properties: SecurityProperty[]

  hypothecationCreated: boolean

  equitableMortgageCreated: boolean

  emDate: ISODateString

  emBranch: string

  cersaiRegistered: boolean

  cersaiType: CersaiType

  cersaiNotRegisteredReason: string

  insuranceNotDoneReason: string

  otherObservations: string

  allAssetsInsured: boolean

  insuranceCompany: string

  insuredValue: number

  insuranceValidUpto: ISODateString

  cgtmseCovered: boolean

  cgpanNo: string

  lastCgtmseFeeRemittance: ISODateString
}

export interface SecurityProperty {
  description: string

  realizableValue: number

  lastValuationDate: ISODateString
}

export interface FacilityPosition {
  facilityOrScheme: string

  limitLacs: number

  dpLacs: number

  outstandingLacs: number

  irregularityLacs: number
}

export interface SanctionCompliance {
  particular: string

  roi: number

  repaymentSchedule: string

  installmentLacs: number

  outstandingLacs: number

  smaStatus: SmaStatus

  commentIfCBSdiffersFromSanction: string
}

export interface FinancialRow {
  id: number

  asOnDate: ISODateString

  netSales: number

  pbt: number

  pat: number

  cashAccrual: number

  tnw: number

  tolToTnw: number

  currentRatio: number

  remark: string
}

export interface IndebtednessRow {
  id: number

  existingFundBased: number

  existingNonFundBased: number

  proposedFundBased: number

  proposedNonFundBased: number
}

export interface CreditRatingRow {
  id: number

  craValidatedOn: ISODateString

  borrowingRatingCurrent: string

  borrowingRatingPrevious: string

  overallScore: number

  financialScore: number

  finalCraRatingByBank: string
}

export interface FinancialIndicatorRow {
  id: number

  indicatorCommentsAdverse: string

  indicatorCommentsOverall: string

  indicatorSales: number

  indicatorNp: number

  indicatorTnw: number

  indicatorTolToTnw: number

  indicatorCurrentRatio: number

  indicatorDscr: number
}

export interface BalanceSheetRow {
  id: number

  bsShareCapitalPrev: number

  bsShareCapitalLast: number

  bsReservesPrev: number

  bsReservesLast: number

  bsSecuredLoansShortPrev: number

  bsSecuredLoansShortLast: number

  bsSecuredLoansLongPrev: number

  bsSecuredLoansLongLast: number

  bsUnsecuredLoansPrev: number

  bsUnsecuredLoansLast: number

  bsSundryCreditorsPrev: number

  bsSundryCreditorsLast: number

  bsStatutoryLiabilityPrev: number

  bsStatutoryLiabilityLast: number

  bsShareApplicationWorkPrev: number

  bsShareApplicationWorkLast: number

  bsDeferredTaxPrev: number

  bsDeferredTaxLast: number

  bsSourcesTotalPrev: number

  bsSourcesTotalLast: number

  bsFixedAssetsGrossPrev: number

  bsFixedAssetsGrossLast: number

  bsDepreciationPrev: number

  bsDepreciationLast: number

  bsNetBlockPrev: number

  bsNetBlockLast: number

  bsCapitalWipPrev: number

  bsCapitalWipLast: number

  bsInvestmentsPrev: number

  bsInvestmentsLast: number

  bsInventoriesPrev: number

  bsInventoriesLast: number

  bsDebtorsPrev: number

  bsDebtorsLast: number

  bsCashBankPrev: number

  bsCashBankLast: number

  bsLoansAdvancesSubsidiaryPrev: number

  bsLoansAdvancesSubsidiaryLast: number

  bsLoansAdvancesSupplierPrev: number

  bsLoansAdvancesSupplierLast: number

  bsLoansAdvancesOthersPrev: number

  bsLoansAdvancesOthersLast: number

  bsOtherMiscPrev: number

  bsOtherMiscLast: number

  bsLessCurrentLiabilitiesPrev: number

  bsLessCurrentLiabilitiesLast: number

  bsLessProvisionsPrev: number

  bsLessProvisionsLast: number

  bsNetCurrentAssetsPrev: number

  bsNetCurrentAssetsLast: number

  bsMiscExpensesPrev: number

  bsMiscExpensesLast: number

  bsApplicationTotalPrev: number

  bsApplicationTotalLast: number
}

type ReviewHistoryItem = components['schemas']['TermLoanReviewRequestDTO']

type BranchDepartmentInfo = {
  accountNo?: string
  branchCode?: string
  branchId?: string
  branchName?: string
  departmentId?: string
  departmentName?: string
}

const emptyDate = '' as ISODateString
const today = format(new Date(), 'yyyy-MM-dd') as ISODateString

const dateSchema = z
  .string()
  .refine((val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Date must be YYYY-MM-DD',
  }) as z.ZodType<ISODateString>

const numberSchema = z.coerce.number()
const stringSchema = z.string()

const termLoanPositionSchema = z.object({
  id: numberSchema,
  termLoanAccountNo: stringSchema,
  originalSanctionDate: dateSchema,
  sanctionedLimit: numberSchema,
  theoreticalBalance: numberSchema,
  outstanding: numberSchema,
  overdues: numberSchema,
  overdueReason: stringSchema,
  rephasementDetails: stringSchema,
})

const securityPropertySchema = z.object({
  description: stringSchema,
  realizableValue: numberSchema,
  lastValuationDate: dateSchema,
})

const securityInfoSchema = z.object({
  primarySecurity: stringSchema,
  collateralSecurity: stringSchema,
  properties: z.array(securityPropertySchema),
  hypothecationCreated: z.boolean(),
  equitableMortgageCreated: z.boolean(),
  emDate: dateSchema,
  emBranch: stringSchema,
  cersaiRegistered: z.boolean(),
  cersaiType: stringSchema,
  cersaiNotRegisteredReason: stringSchema,
  insuranceNotDoneReason: stringSchema,
  otherObservations: stringSchema,
  allAssetsInsured: z.boolean(),
  insuranceCompany: stringSchema,
  insuredValue: numberSchema,
  insuranceValidUpto: dateSchema,
  cgtmseCovered: z.boolean(),
  cgpanNo: stringSchema,
  lastCgtmseFeeRemittance: dateSchema,
})

const facilityPositionSchema = z.object({
  facilityOrScheme: stringSchema,
  limitLacs: numberSchema,
  dpLacs: numberSchema,
  outstandingLacs: numberSchema,
  irregularityLacs: numberSchema,
})

const sanctionComplianceSchema = z.object({
  particular: stringSchema,
  roi: numberSchema,
  repaymentSchedule: stringSchema,
  installmentLacs: numberSchema,
  outstandingLacs: numberSchema,
  smaStatus: stringSchema,
  commentIfCBSdiffersFromSanction: stringSchema,
})

const financialRowSchema = z.object({
  id: numberSchema,
  asOnDate: dateSchema,
  netSales: numberSchema,
  pbt: numberSchema,
  pat: numberSchema,
  cashAccrual: numberSchema,
  tnw: numberSchema,
  tolToTnw: numberSchema,
  currentRatio: numberSchema,
  remark: stringSchema,
})

const indebtednessRowSchema = z.object({
  id: numberSchema,
  existingFundBased: numberSchema,
  existingNonFundBased: numberSchema,
  proposedFundBased: numberSchema,
  proposedNonFundBased: numberSchema,
})

const creditRatingRowSchema = z.object({
  id: numberSchema,
  craValidatedOn: dateSchema,
  borrowingRatingCurrent: stringSchema,
  borrowingRatingPrevious: stringSchema,
  overallScore: numberSchema,
  financialScore: numberSchema,
  finalCraRatingByBank: stringSchema,
})

const financialIndicatorRowSchema = z.object({
  id: numberSchema,
  indicatorCommentsAdverse: stringSchema,
  indicatorCommentsOverall: stringSchema,
  indicatorSales: numberSchema,
  indicatorNp: numberSchema,
  indicatorTnw: numberSchema,
  indicatorTolToTnw: numberSchema,
  indicatorCurrentRatio: numberSchema,
  indicatorDscr: numberSchema,
})

const balanceSheetRowSchema = z.object({
  id: numberSchema,
  bsShareCapitalPrev: numberSchema,
  bsShareCapitalLast: numberSchema,
  bsReservesPrev: numberSchema,
  bsReservesLast: numberSchema,
  bsSecuredLoansShortPrev: numberSchema,
  bsSecuredLoansShortLast: numberSchema,
  bsSecuredLoansLongPrev: numberSchema,
  bsSecuredLoansLongLast: numberSchema,
  bsUnsecuredLoansPrev: numberSchema,
  bsUnsecuredLoansLast: numberSchema,
  bsSundryCreditorsPrev: numberSchema,
  bsSundryCreditorsLast: numberSchema,
  bsStatutoryLiabilityPrev: numberSchema,
  bsStatutoryLiabilityLast: numberSchema,
  bsShareApplicationWorkPrev: numberSchema,
  bsShareApplicationWorkLast: numberSchema,
  bsDeferredTaxPrev: numberSchema,
  bsDeferredTaxLast: numberSchema,
  bsSourcesTotalPrev: numberSchema,
  bsSourcesTotalLast: numberSchema,
  bsFixedAssetsGrossPrev: numberSchema,
  bsFixedAssetsGrossLast: numberSchema,
  bsDepreciationPrev: numberSchema,
  bsDepreciationLast: numberSchema,
  bsNetBlockPrev: numberSchema,
  bsNetBlockLast: numberSchema,
  bsCapitalWipPrev: numberSchema,
  bsCapitalWipLast: numberSchema,
  bsInvestmentsPrev: numberSchema,
  bsInvestmentsLast: numberSchema,
  bsInventoriesPrev: numberSchema,
  bsInventoriesLast: numberSchema,
  bsDebtorsPrev: numberSchema,
  bsDebtorsLast: numberSchema,
  bsCashBankPrev: numberSchema,
  bsCashBankLast: numberSchema,
  bsLoansAdvancesSubsidiaryPrev: numberSchema,
  bsLoansAdvancesSubsidiaryLast: numberSchema,
  bsLoansAdvancesSupplierPrev: numberSchema,
  bsLoansAdvancesSupplierLast: numberSchema,
  bsLoansAdvancesOthersPrev: numberSchema,
  bsLoansAdvancesOthersLast: numberSchema,
  bsOtherMiscPrev: numberSchema,
  bsOtherMiscLast: numberSchema,
  bsLessCurrentLiabilitiesPrev: numberSchema,
  bsLessCurrentLiabilitiesLast: numberSchema,
  bsLessProvisionsPrev: numberSchema,
  bsLessProvisionsLast: numberSchema,
  bsNetCurrentAssetsPrev: numberSchema,
  bsNetCurrentAssetsLast: numberSchema,
  bsMiscExpensesPrev: numberSchema,
  bsMiscExpensesLast: numberSchema,
  bsApplicationTotalPrev: numberSchema,
  bsApplicationTotalLast: numberSchema,
})

const formSchema: z.ZodType<RootPayload> = z.object({
  id: numberSchema,
  bankCode: z.literal('TGB'),
  reviewDate: dateSchema,
  branch: stringSchema,
  regionalOffice: stringSchema,
  borrowerName: stringSchema,
  borrowerAddress: stringSchema,
  guarantorNames: z.array(stringSchema),
  guarantorAddresses: z.array(stringSchema),
  cibilScore: numberSchema,
  lastReviewDate: dateSchema,
  groupCompany: stringSchema,
  commercialProdStartDate: dateSchema,
  industryOrActivity: stringSchema,
  riskRating: stringSchema,
  iracStatus: stringSchema,
  termLoanPositions: z.array(termLoanPositionSchema),
  interestRateAsPerSanction: numberSchema,
  otherFacilitiesConduct: stringSchema,
  installmentsPaid: numberSchema,
  securityInfo: securityInfoSchema,
  assetInsuranceValidUpto: dateSchema,
  revivalDueDate: dateSchema,
  revivalDoneDate: dateSchema,
  presentNetWorth: numberSchema,
  lastAuditRemarks: stringSchema,
  lastAuditCompliance: stringSchema,
  branchManagerRecommendation: stringSchema,
  seniorManagerRecommendation: stringSchema,
  reviewingAuthorityRemarks: stringSchema,
  rbo: stringSchema,
  oldCardRatePct: numberSchema,
  newCardRatePct: numberSchema,
  proposedRatePct: numberSchema,
  constitution: stringSchema,
  proprietorName: stringSchema,
  businessAddress: stringSchema,
  phone: stringSchema,
  facilityOrScheme: stringSchema,
  genericAccountNo: stringSchema,
  genericSanctionDate: dateSchema,
  genericSanctionAmountLacs: numberSchema,
  reviewDueDate: dateSchema,
  craRating: stringSchema,
  smaStatusSummary: stringSchema,
  facilityPositions: z.array(facilityPositionSchema),
  sanctionCompliances: z.array(sanctionComplianceSchema),
  irregularityReason: stringSchema,
  unitActionPlan: stringSchema,
  financials: z.array(financialRowSchema),
  cibilCheckedOn: dateSchema,
  cibilCheckRef: stringSchema,
  inspectionDate: dateSchema,
  inspectionRemarks: stringSchema,
  assetCreatedAsPerLoanPurpose: z.boolean(),
  documentationAsPerBankNorms: z.boolean(),
  documentationDeviationReason: stringSchema,
  otherConditions: z.array(stringSchema),
  reviewValidUpto: dateSchema,
  reviewCharges: numberSchema,
  finalRateOfInterestPct: numberSchema,
  finalCraRating: stringSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  createdBy: stringSchema,
  updatedBy: stringSchema,
  indebtednessList: z.array(indebtednessRowSchema),
  creditRatings: z.array(creditRatingRowSchema),
  financialIndicators: z.array(financialIndicatorRowSchema),
  balanceSheets: z.array(balanceSheetRowSchema),
  accountNumber: stringSchema,
  dateOfDisbursement: dateSchema,
  purposeOfLoan: stringSchema,
  incomeOrInterestEarnedTillDate: numberSchema,
  bankingArrangement: stringSchema,
  crilicComments: stringSchema,
  salientFeatures: stringSchema,
  tgbSanctionFor: stringSchema,
  tgbApprovalFor: stringSchema,
  tgbConfirmFor: stringSchema,
})

type FormValues = RootPayload

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
}

const FormSection = ({ title, description, children }: SectionProps) => (
  <section className='bg-card/70 rounded-2xl border p-6 shadow-sm'>
    <div className='mb-4 space-y-1'>
      <h3 className='text-base font-semibold tracking-tight'>{title}</h3>
      {description ? (
        <p className='text-muted-foreground text-sm'>{description}</p>
      ) : null}
    </div>
    {children}
  </section>
)

const asStringPath = (path: string) =>
  path as FieldPathByValue<FormValues, string>

const asNumberPath = (path: string) =>
  path as FieldPathByValue<FormValues, number>

const blankTermLoanPosition: TermLoanPosition = {
  id: 0,
  termLoanAccountNo: '',
  originalSanctionDate: emptyDate,
  sanctionedLimit: 0,
  theoreticalBalance: 0,
  outstanding: 0,
  overdues: 0,
  overdueReason: '',
  rephasementDetails: '',
}

const blankSecurityProperty: SecurityProperty = {
  description: '',
  realizableValue: 0,
  lastValuationDate: emptyDate,
}

const blankFacilityPosition: FacilityPosition = {
  facilityOrScheme: '',
  limitLacs: 0,
  dpLacs: 0,
  outstandingLacs: 0,
  irregularityLacs: 0,
}

const blankSanctionCompliance: SanctionCompliance = {
  particular: '',
  roi: 0,
  repaymentSchedule: '',
  installmentLacs: 0,
  outstandingLacs: 0,
  smaStatus: 'NONE',
  commentIfCBSdiffersFromSanction: '',
}

const blankFinancialRow: FinancialRow = {
  id: 0,
  asOnDate: emptyDate,
  netSales: 0,
  pbt: 0,
  pat: 0,
  cashAccrual: 0,
  tnw: 0,
  tolToTnw: 0,
  currentRatio: 0,
  remark: '',
}

const blankIndebtednessRow: IndebtednessRow = {
  id: 0,
  existingFundBased: 0,
  existingNonFundBased: 0,
  proposedFundBased: 0,
  proposedNonFundBased: 0,
}

const blankCreditRatingRow: CreditRatingRow = {
  id: 0,
  craValidatedOn: emptyDate,
  borrowingRatingCurrent: '',
  borrowingRatingPrevious: '',
  overallScore: 0,
  financialScore: 0,
  finalCraRatingByBank: '',
}

const blankFinancialIndicatorRow: FinancialIndicatorRow = {
  id: 0,
  indicatorCommentsAdverse: '',
  indicatorCommentsOverall: '',
  indicatorSales: 0,
  indicatorNp: 0,
  indicatorTnw: 0,
  indicatorTolToTnw: 0,
  indicatorCurrentRatio: 0,
  indicatorDscr: 0,
}

const blankBalanceSheetRow: BalanceSheetRow = {
  id: 0,
  bsShareCapitalPrev: 0,
  bsShareCapitalLast: 0,
  bsReservesPrev: 0,
  bsReservesLast: 0,
  bsSecuredLoansShortPrev: 0,
  bsSecuredLoansShortLast: 0,
  bsSecuredLoansLongPrev: 0,
  bsSecuredLoansLongLast: 0,
  bsUnsecuredLoansPrev: 0,
  bsUnsecuredLoansLast: 0,
  bsSundryCreditorsPrev: 0,
  bsSundryCreditorsLast: 0,
  bsStatutoryLiabilityPrev: 0,
  bsStatutoryLiabilityLast: 0,
  bsShareApplicationWorkPrev: 0,
  bsShareApplicationWorkLast: 0,
  bsDeferredTaxPrev: 0,
  bsDeferredTaxLast: 0,
  bsSourcesTotalPrev: 0,
  bsSourcesTotalLast: 0,
  bsFixedAssetsGrossPrev: 0,
  bsFixedAssetsGrossLast: 0,
  bsDepreciationPrev: 0,
  bsDepreciationLast: 0,
  bsNetBlockPrev: 0,
  bsNetBlockLast: 0,
  bsCapitalWipPrev: 0,
  bsCapitalWipLast: 0,
  bsInvestmentsPrev: 0,
  bsInvestmentsLast: 0,
  bsInventoriesPrev: 0,
  bsInventoriesLast: 0,
  bsDebtorsPrev: 0,
  bsDebtorsLast: 0,
  bsCashBankPrev: 0,
  bsCashBankLast: 0,
  bsLoansAdvancesSubsidiaryPrev: 0,
  bsLoansAdvancesSubsidiaryLast: 0,
  bsLoansAdvancesSupplierPrev: 0,
  bsLoansAdvancesSupplierLast: 0,
  bsLoansAdvancesOthersPrev: 0,
  bsLoansAdvancesOthersLast: 0,
  bsOtherMiscPrev: 0,
  bsOtherMiscLast: 0,
  bsLessCurrentLiabilitiesPrev: 0,
  bsLessCurrentLiabilitiesLast: 0,
  bsLessProvisionsPrev: 0,
  bsLessProvisionsLast: 0,
  bsNetCurrentAssetsPrev: 0,
  bsNetCurrentAssetsLast: 0,
  bsMiscExpensesPrev: 0,
  bsMiscExpensesLast: 0,
  bsApplicationTotalPrev: 0,
  bsApplicationTotalLast: 0,
}

const defaultValues: FormValues = {
  id: 0,
  bankCode: 'TGB',
  reviewDate: today,
  branch: '',
  regionalOffice: '',
  borrowerName: '',
  borrowerAddress: '',
  guarantorNames: [],
  guarantorAddresses: [],
  cibilScore: 0,
  lastReviewDate: emptyDate,
  groupCompany: '',
  commercialProdStartDate: emptyDate,
  industryOrActivity: '',
  riskRating: '',
  iracStatus: '',
  termLoanPositions: [],
  interestRateAsPerSanction: 0,
  otherFacilitiesConduct: '',
  installmentsPaid: 0,
  securityInfo: {
    primarySecurity: '',
    collateralSecurity: '',
    properties: [],
    hypothecationCreated: false,
    equitableMortgageCreated: false,
    emDate: emptyDate,
    emBranch: '',
    cersaiRegistered: false,
    cersaiType: '',
    cersaiNotRegisteredReason: '',
    insuranceNotDoneReason: '',
    otherObservations: '',
    allAssetsInsured: false,
    insuranceCompany: '',
    insuredValue: 0,
    insuranceValidUpto: emptyDate,
    cgtmseCovered: false,
    cgpanNo: '',
    lastCgtmseFeeRemittance: emptyDate,
  },
  assetInsuranceValidUpto: emptyDate,
  revivalDueDate: emptyDate,
  revivalDoneDate: emptyDate,
  presentNetWorth: 0,
  lastAuditRemarks: '',
  lastAuditCompliance: '',
  branchManagerRecommendation: '',
  seniorManagerRecommendation: '',
  reviewingAuthorityRemarks: '',
  rbo: '',
  oldCardRatePct: 0,
  newCardRatePct: 0,
  proposedRatePct: 0,
  constitution: '',
  proprietorName: '',
  businessAddress: '',
  phone: '',
  facilityOrScheme: '',
  genericAccountNo: '',
  genericSanctionDate: emptyDate,
  genericSanctionAmountLacs: 0,
  reviewDueDate: emptyDate,
  craRating: '',
  smaStatusSummary: '',
  facilityPositions: [],
  sanctionCompliances: [],
  irregularityReason: '',
  unitActionPlan: '',
  financials: [],
  cibilCheckedOn: emptyDate,
  cibilCheckRef: '',
  inspectionDate: emptyDate,
  inspectionRemarks: '',
  assetCreatedAsPerLoanPurpose: false,
  documentationAsPerBankNorms: false,
  documentationDeviationReason: '',
  otherConditions: [],
  reviewValidUpto: emptyDate,
  reviewCharges: 0,
  finalRateOfInterestPct: 0,
  finalCraRating: '',
  createdAt: emptyDate,
  updatedAt: emptyDate,
  createdBy: '',
  updatedBy: '',
  indebtednessList: [],
  creditRatings: [],
  financialIndicators: [],
  balanceSheets: [],
  accountNumber: '',
  dateOfDisbursement: emptyDate,
  purposeOfLoan: '',
  incomeOrInterestEarnedTillDate: 0,
  bankingArrangement: '',
  crilicComments: '',
  salientFeatures: '',
  tgbSanctionFor: '',
  tgbApprovalFor: '',
  tgbConfirmFor: '',
}

const balanceSheetLines: {
  label: string
  prev: keyof BalanceSheetRow
  last: keyof BalanceSheetRow
}[] = [
  {
    label: 'Share Capital',
    prev: 'bsShareCapitalPrev',
    last: 'bsShareCapitalLast',
  },
  {
    label: 'Reserves & Surplus',
    prev: 'bsReservesPrev',
    last: 'bsReservesLast',
  },
  {
    label: 'Secured Loans (Short Term)',
    prev: 'bsSecuredLoansShortPrev',
    last: 'bsSecuredLoansShortLast',
  },
  {
    label: 'Secured Loans (Long Term)',
    prev: 'bsSecuredLoansLongPrev',
    last: 'bsSecuredLoansLongLast',
  },
  {
    label: 'Unsecured Loans',
    prev: 'bsUnsecuredLoansPrev',
    last: 'bsUnsecuredLoansLast',
  },
  {
    label: 'Sundry Creditors',
    prev: 'bsSundryCreditorsPrev',
    last: 'bsSundryCreditorsLast',
  },
  {
    label: 'Statutory Liability',
    prev: 'bsStatutoryLiabilityPrev',
    last: 'bsStatutoryLiabilityLast',
  },
  {
    label: 'Share Application Money / Work',
    prev: 'bsShareApplicationWorkPrev',
    last: 'bsShareApplicationWorkLast',
  },
  {
    label: 'Deferred Tax',
    prev: 'bsDeferredTaxPrev',
    last: 'bsDeferredTaxLast',
  },
  {
    label: 'Sources Total',
    prev: 'bsSourcesTotalPrev',
    last: 'bsSourcesTotalLast',
  },
  {
    label: 'Fixed Assets (Gross)',
    prev: 'bsFixedAssetsGrossPrev',
    last: 'bsFixedAssetsGrossLast',
  },
  {
    label: 'Depreciation',
    prev: 'bsDepreciationPrev',
    last: 'bsDepreciationLast',
  },
  { label: 'Net Block', prev: 'bsNetBlockPrev', last: 'bsNetBlockLast' },
  { label: 'Capital WIP', prev: 'bsCapitalWipPrev', last: 'bsCapitalWipLast' },
  {
    label: 'Investments',
    prev: 'bsInvestmentsPrev',
    last: 'bsInvestmentsLast',
  },
  {
    label: 'Inventories',
    prev: 'bsInventoriesPrev',
    last: 'bsInventoriesLast',
  },
  { label: 'Debtors', prev: 'bsDebtorsPrev', last: 'bsDebtorsLast' },
  { label: 'Cash & Bank', prev: 'bsCashBankPrev', last: 'bsCashBankLast' },
  {
    label: 'Loans & Advances (Subsidiary)',
    prev: 'bsLoansAdvancesSubsidiaryPrev',
    last: 'bsLoansAdvancesSubsidiaryLast',
  },
  {
    label: 'Loans & Advances (Supplier)',
    prev: 'bsLoansAdvancesSupplierPrev',
    last: 'bsLoansAdvancesSupplierLast',
  },
  {
    label: 'Loans & Advances (Others)',
    prev: 'bsLoansAdvancesOthersPrev',
    last: 'bsLoansAdvancesOthersLast',
  },
  { label: 'Other Misc', prev: 'bsOtherMiscPrev', last: 'bsOtherMiscLast' },
  {
    label: 'Less: Current Liabilities',
    prev: 'bsLessCurrentLiabilitiesPrev',
    last: 'bsLessCurrentLiabilitiesLast',
  },
  {
    label: 'Less: Provisions',
    prev: 'bsLessProvisionsPrev',
    last: 'bsLessProvisionsLast',
  },
  {
    label: 'Net Current Assets',
    prev: 'bsNetCurrentAssetsPrev',
    last: 'bsNetCurrentAssetsLast',
  },
  {
    label: 'Misc Expenses',
    prev: 'bsMiscExpensesPrev',
    last: 'bsMiscExpensesLast',
  },
  {
    label: 'Application Total',
    prev: 'bsApplicationTotalPrev',
    last: 'bsApplicationTotalLast',
  },
]

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const joinList = (value: string[]) => value.join(', ')

const safeStringArray = (value: string[] | undefined | null) =>
  Array.isArray(value) ? value : []

const mergeRows = <T,>(rows: Partial<T>[] | undefined | null, blank: T) =>
  Array.isArray(rows) ? rows.map((row) => ({ ...blank, ...row })) : []

const toISODate = (value?: string | null): ISODateString => {
  if (!value) return emptyDate
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value as ISODateString
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return emptyDate
  return format(parsed, 'yyyy-MM-dd') as ISODateString
}

const buildAddress = (details?: AccountDetail) =>
  [details?.add1, details?.add2, details?.add3, details?.add4]
    .filter((part): part is string => Boolean(part))
    .join(', ')

const displayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '-' : value

export default function TGBLoanReviewForm() {
  const { accountId } = useParams({
    from: '/_authenticated/(searching)/term-loan-review/$accountId',
  }) as { accountId: string }

  const [editMode, setEditMode] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const {
    data: historyResp,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = $api.useQuery('get', '/term-loan-review/get', {
    params: {
      query: { bankCode: 'TGB', acctNo: accountId ?? '' },
    },
  })

  const { data: branchInfoRaw } = useBranchDepartmentInfo(accountId)
  const { data: customer } = useAccountDetails(accountId)
  const branchInfo = branchInfoRaw as BranchDepartmentInfo | undefined

  const createMutation = $api.useMutation(
    'post',
    '/term-loan-review/create/review'
  )

  const updateMutation = $api.useMutation(
    'put',
    '/term-loan-review/update/review/{reviewId}'
  )

  const deleteMutation = $api.useMutation(
    'delete',
    '/term-loan-review/delete/review/{reviewId}'
  )

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues,
  })

  const termLoanPositions = useFieldArray({
    control: form.control,
    name: 'termLoanPositions',
  })

  const securityProperties = useFieldArray({
    control: form.control,
    name: 'securityInfo.properties',
  })

  const facilityPositions = useFieldArray({
    control: form.control,
    name: 'facilityPositions',
  })

  const sanctionCompliances = useFieldArray({
    control: form.control,
    name: 'sanctionCompliances',
  })

  const financials = useFieldArray({
    control: form.control,
    name: 'financials',
  })

  const indebtednessList = useFieldArray({
    control: form.control,
    name: 'indebtednessList',
  })

  const creditRatings = useFieldArray({
    control: form.control,
    name: 'creditRatings',
  })

  const financialIndicators = useFieldArray({
    control: form.control,
    name: 'financialIndicators',
  })

  const balanceSheets = useFieldArray({
    control: form.control,
    name: 'balanceSheets',
  })

  const prefilledValues = useMemo<FormValues>(() => {
    const address = buildAddress(customer)
    const sanctionDate = toISODate(customer?.sanctDt)
    const disbursementDate = toISODate(customer?.sanctDt)
    const prefilledTermLoan =
      customer && customer.acctNo
        ? [
            {
              ...blankTermLoanPosition,
              termLoanAccountNo: customer.acctNo,
              originalSanctionDate: sanctionDate,
              sanctionedLimit: customer.loanLimit ?? 0,
              theoreticalBalance: customer.theoBal ?? 0,
              outstanding: customer.outstand ?? 0,
              overdues: customer.irregAmt ?? 0,
            },
          ]
        : []

    return {
      ...defaultValues,
      bankCode: 'TGB',
      accountNumber: accountId ?? '',
      borrowerName: customer?.custName ?? '',
      borrowerAddress: address,
      branch: branchInfo?.branchName ?? customer?.branchName ?? '',
      regionalOffice: branchInfo?.departmentName ?? '',
      phone: customer?.telNo ?? '',
      businessAddress: address,
      facilityOrScheme: customer?.acctDesc ?? '',
      interestRateAsPerSanction: customer?.intRate ?? 0,
      installmentsPaid: customer?.emisPaid ?? 0,
      genericAccountNo: accountId ?? customer?.acctNo ?? '',
      genericSanctionDate: sanctionDate,
      genericSanctionAmountLacs: customer?.loanLimit ?? 0,
      termLoanPositions: prefilledTermLoan,
      dateOfDisbursement: disbursementDate,
    }
  }, [accountId, branchInfo?.branchName, branchInfo?.departmentName, customer])

  useEffect(() => {
    if (editMode || viewOnly) return
    form.reset(prefilledValues)
  }, [editMode, viewOnly, form, prefilledValues])

  const mapReviewToForm = (review: ReviewHistoryItem): FormValues => {
    const securityInfo = {
      ...defaultValues.securityInfo,
      ...(review.securityInfo as Partial<SecurityInfo> | undefined),
      properties: mergeRows(
        review.securityInfo?.properties as
          | Partial<SecurityProperty>[]
          | undefined,
        blankSecurityProperty
      ),
    }

    return {
      ...defaultValues,
      ...(review as Partial<FormValues>),
      bankCode: 'TGB',
      accountNumber: review.accountNumber ?? accountId ?? '',
      genericAccountNo: review.accountNumber ?? accountId ?? '',
      guarantorNames: safeStringArray(review.guarantorNames),
      guarantorAddresses: safeStringArray(review.guarantorAddresses),
      termLoanPositions: mergeRows(
        review.termLoanPositions as Partial<TermLoanPosition>[] | undefined,
        blankTermLoanPosition
      ),
      securityInfo,
      facilityPositions: mergeRows(
        review.facilityPositions as Partial<FacilityPosition>[] | undefined,
        blankFacilityPosition
      ),
      sanctionCompliances: mergeRows(
        review.sanctionCompliances as Partial<SanctionCompliance>[] | undefined,
        blankSanctionCompliance
      ),
      financials: mergeRows(
        review.financials as Partial<FinancialRow>[] | undefined,
        blankFinancialRow
      ),
      otherConditions: safeStringArray(review.otherConditions),
      indebtednessList: mergeRows(
        review.indebtednessList as Partial<IndebtednessRow>[] | undefined,
        blankIndebtednessRow
      ),
      creditRatings: mergeRows(
        review.creditRatings as Partial<CreditRatingRow>[] | undefined,
        blankCreditRatingRow
      ),
      financialIndicators: mergeRows(
        (review.financialIndicatorsList as
          | Partial<FinancialIndicatorRow>[]
          | undefined) ??
          (review as { financialIndicators?: Partial<FinancialIndicatorRow>[] })
            .financialIndicators,
        blankFinancialIndicatorRow
      ),
      balanceSheets: mergeRows(
        review.balanceSheets as Partial<BalanceSheetRow>[] | undefined,
        blankBalanceSheetRow
      ),
    }
  }

  const handleEdit = (review: ReviewHistoryItem) => {
    setEditMode(true)
    setViewOnly(false)
    setSelectedReviewId(review.id ?? null)
    form.reset(mapReviewToForm(review))
  }

  const handleView = (review: ReviewHistoryItem) => {
    setEditMode(false)
    setViewOnly(true)
    setSelectedReviewId(review.id ?? null)
    form.reset(mapReviewToForm(review))
  }

  const downloadReportViaClient = async (args: {
    reviewId: number
    bankCode: string
    accountNumber?: string | null
  }) => {
    const { reviewId, bankCode, accountNumber } = args

    const res = await fetchClient.GET('/term-loan-review/{id}/report', {
      params: {
        path: { id: Number(reviewId) },
        query: { bankCode },
      },
      parseAs: 'blob',
    })

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Failed with status ${status ?? 'unknown'}`)
    }

    const blob = res.data as Blob
    const cd = res.response.headers.get('content-disposition') ?? ''
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd)
    const filenameFromHeader = decodeURIComponent(
      match?.[1] || match?.[2] || ''
    )
    const safeAccount = accountNumber?.toString().trim()
    const fallbackName = safeAccount
      ? `${bankCode}-TermLoanReview-${safeAccount}.pdf`
      : `${bankCode}-TermLoanReview-${reviewId}.pdf`
    const filename = filenameFromHeader || fallbackName

    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  const handleDownloadReport = async (review: ReviewHistoryItem) => {
    const reviewId = review.id
    if (!reviewId) {
      toast.error('Review ID is missing.')
      return
    }

    try {
      setDownloadingId(reviewId)
      await downloadReportViaClient({
        reviewId,
        bankCode: 'TGB',
        accountNumber: review.accountNumber ?? accountId,
      })
      toast.success('Report downloaded.')
    } catch (error) {
      toastError(error, 'Failed to download report')
    } finally {
      setDownloadingId((current) => (current === reviewId ? null : current))
    }
  }

  const handleReset = () => {
    setEditMode(false)
    setViewOnly(false)
    setSelectedReviewId(null)
    form.reset(prefilledValues)
  }

  const onSubmit = async (values: FormValues) => {
    const {
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      createdBy: _createdBy,
      updatedBy: _updatedBy,
      ...rest
    } = values
    const payload = {
      ...rest,
      bankCode: 'TGB',
      genericAccountNo: rest.accountNumber ?? accountId ?? '',
    }

    try {
      if (editMode) {
        if (selectedReviewId === null) {
          toast.error('Select a review to update.')
          return
        }
        await updateMutation.mutateAsync({
          params: {
            // query: { bankCode: 'TGB' },
            path: { reviewId: selectedReviewId },
          },
          body: payload,
        })
        toast.success('Review updated successfully.')
      } else {
        await createMutation.mutateAsync({
          // params: { query: { bankCode: 'TGB' } },
          body: payload,
        })
        toast.success('Review submitted successfully.')
      }
      refetchHistory()
      handleReset()
    } catch (error) {
      toastError(error, editMode ? 'Update failed' : 'Submission failed')
    }
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteMutation.mutateAsync({
        params: { query: { bankCode: 'TGB' }, path: { reviewId: deleteId } },
      })
      toast.success('Review deleted successfully.')
      refetchHistory()
      if (selectedReviewId === deleteId) handleReset()
    } catch (error) {
      toastError(error, 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const modeLabel = viewOnly ? 'View Only' : editMode ? 'Editing' : 'New Review'
  const modeVariant = viewOnly ? 'secondary' : editMode ? 'outline' : 'default'
  const historyRows: ReviewHistoryItem[] = historyResp?.data ?? []

  return (
    <div className='space-y-8 p-4 md:p-6'>
      <Card className='border-muted/60 from-muted/40 via-background to-background bg-gradient-to-br'>
        <CardHeader className='border-muted/40 border-b'>
          <CardTitle className='text-lg'>Review History</CardTitle>
          <CardDescription>
            Past reviews for Account: {accountId}
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          {isHistoryLoading ? (
            <div className='flex items-center justify-center p-6'>
              <Loader2 className='h-5 w-5 animate-spin' />
            </div>
          ) : (
            <div className='bg-background/80 overflow-hidden rounded-xl border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Review ID</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>IRAC Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.length ? (
                    historyRows.map((review, index) => {
                      const reviewId = review.id ?? null
                      const isDownloading =
                        reviewId !== null && reviewId === downloadingId
                      return (
                        <TableRow key={reviewId ?? index}>
                          <TableCell>
                            {displayValue(review.reviewDate)}
                          </TableCell>
                          <TableCell>{displayValue(reviewId)}</TableCell>
                          <TableCell>
                            {displayValue(review.borrowerName)}
                          </TableCell>
                          <TableCell>
                            {displayValue(review.iracStatus)}
                          </TableCell>

                          <TableCell className='space-x-2 text-right'>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              disabled={!reviewId}
                              onClick={() => handleView(review)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              disabled={!reviewId}
                              onClick={() => handleEdit(review)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              disabled={!reviewId || isDownloading}
                              onClick={() => handleDownloadReport(review)}
                              title='Download report'
                            >
                              {isDownloading ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Download className='h-4 w-4' />
                              )}
                            </Button>
                            <Button
                              type='button'
                              size='icon'
                              variant='destructive'
                              disabled={!reviewId}
                              onClick={() => setDeleteId(reviewId)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        No history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='border-muted/60 from-background via-muted/20 to-background bg-gradient-to-br'>
        <CardHeader className='border-muted/40 border-b'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='space-y-1'>
              <CardTitle className='text-xl'>Term Loan Review</CardTitle>
              <CardDescription>
                {selectedReviewId
                  ? `Review ID: ${selectedReviewId}`
                  : `Account: ${accountId}`}
              </CardDescription>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={modeVariant}>{modeLabel}</Badge>
              {(editMode || viewOnly) && (
                <Button type='button' variant='outline' onClick={handleReset}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create New
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-10'>
              <FormField
                control={form.control}
                name='id'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='bankCode'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='genericAccountNo'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <fieldset disabled={viewOnly} className='space-y-8'>
                <FormSection
                  title='Review Overview'
                  description='Core identifiers, branch context, and review timing.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='accountNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='branch'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='regionalOffice'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regional Office</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='rbo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RBO</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='reviewDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='reviewDueDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Due Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='reviewValidUpto'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Valid Upto</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='reviewCharges'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Charges</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='facilityOrScheme'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facility / Scheme</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='genericSanctionDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sanction Date</FormLabel>
                          <FormControl>
                            <Input type='date' readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='genericSanctionAmountLacs'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sanction Amount (Lacs)</FormLabel>
                          <FormControl>
                            <Input type='number' readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='interestRateAsPerSanction'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='oldCardRatePct'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Old Card Rate (%)</FormLabel>
                          <FormControl>
                            <Input type='number' step='0.01' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='newCardRatePct'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Card Rate (%)</FormLabel>
                          <FormControl>
                            <Input type='number' step='0.01' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='proposedRatePct'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposed Rate (%)</FormLabel>
                          <FormControl>
                            <Input type='number' step='0.01' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='finalRateOfInterestPct'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Final ROI (%)</FormLabel>
                          <FormControl>
                            <Input type='number' step='0.01' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='finalCraRating'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Final CRA Rating</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='craRating'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRA Rating</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='smaStatusSummary'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMA Status Summary</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title='Borrower & Business'
                  description='Borrower identity, guarantors, and business context.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='borrowerName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Borrower Name</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='constitution'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Constitution</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='borrowerAddress'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Borrower Address</FormLabel>
                        <FormControl>
                          <Textarea rows={3} readOnly {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='proprietorName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proprietor Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='phone'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='businessAddress'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea rows={3} readOnly {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='groupCompany'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Company</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='industryOrActivity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry / Activity</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='guarantorNames'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Guarantor Names</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Comma separated'
                            value={joinList(safeStringArray(field.value))}
                            onChange={(event) =>
                              field.onChange(splitList(event.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='guarantorAddresses'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Guarantor Addresses</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Comma separated'
                            value={joinList(safeStringArray(field.value))}
                            onChange={(event) =>
                              field.onChange(splitList(event.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title='Loan & Disbursement'
                  description='Purpose, disbursement, and repayment tracking.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='dateOfDisbursement'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Disbursement</FormLabel>
                          <FormControl>
                            <Input type='date' readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='purposeOfLoan'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose of Loan</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='incomeOrInterestEarnedTillDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Income / Interest Earned</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='installmentsPaid'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Installments Paid</FormLabel>
                          <FormControl>
                            <Input type='number' readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='otherFacilitiesConduct'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Facilities Conduct</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='bankingArrangement'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banking Arrangement</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='crilicComments'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>CRILC Comments</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='salientFeatures'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Salient Features</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title='Term Loan Positions'
                  description='Track each term loan account and current status.'
                >
                  <div className='space-y-4'>
                    {termLoanPositions.fields.length === 0 ? (
                      <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                        No term loan positions added yet.
                      </div>
                    ) : (
                      termLoanPositions.fields.map((item, index) => (
                        <div
                          key={item.id}
                          className='bg-muted/20 relative rounded-lg border p-4'
                        >
                          {!viewOnly && (
                            <Button
                              type='button'
                              variant='destructive'
                              size='icon'
                              className='absolute top-4 right-4'
                              onClick={() => termLoanPositions.remove(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}

                          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `termLoanPositions.${index}.termLoanAccountNo`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account No</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `termLoanPositions.${index}.originalSanctionDate`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sanction Date</FormLabel>
                                  <FormControl>
                                    <Input type='date' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asNumberPath(
                                `termLoanPositions.${index}.sanctionedLimit`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sanctioned Limit</FormLabel>
                                  <FormControl>
                                    <Input type='number' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name={asNumberPath(
                                `termLoanPositions.${index}.theoreticalBalance`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Theoretical Balance</FormLabel>
                                  <FormControl>
                                    <Input type='number' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asNumberPath(
                                `termLoanPositions.${index}.outstanding`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Outstanding</FormLabel>
                                  <FormControl>
                                    <Input type='number' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asNumberPath(
                                `termLoanPositions.${index}.overdues`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Overdues</FormLabel>
                                  <FormControl>
                                    <Input type='number' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `termLoanPositions.${index}.overdueReason`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Overdue Reason</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `termLoanPositions.${index}.rephasementDetails`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rephasement Details</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}

                    {!viewOnly && (
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() =>
                          termLoanPositions.append({
                            ...blankTermLoanPosition,
                          })
                        }
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Add Term Loan Position
                      </Button>
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title='Security & Insurance'
                  description='Collateral, mortgage, and insurance coverage.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='securityInfo.primarySecurity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Security</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.collateralSecurity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collateral Security</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='securityInfo.hypothecationCreated'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div>
                            <FormLabel>Hypothecation Created</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.equitableMortgageCreated'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div>
                            <FormLabel>Equitable Mortgage</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.cersaiRegistered'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div>
                            <FormLabel>CERSAI Registered</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='securityInfo.emDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equitable Mortgage Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.emBranch'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EM Branch</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.cersaiType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CERSAI Type</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='securityInfo.cersaiNotRegisteredReason'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CERSAI Not Registered Reason</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.insuranceNotDoneReason'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Not Done Reason</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='securityInfo.otherObservations'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Observations</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.insuranceCompany'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Company</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='securityInfo.insuredValue'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insured Value</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.insuranceValidUpto'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Valid Upto</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='assetInsuranceValidUpto'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Insurance Valid Upto</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='securityInfo.allAssetsInsured'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div>
                            <FormLabel>All Assets Insured</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.cgtmseCovered'
                      render={({ field }) => (
                        <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div>
                            <FormLabel>CGTMSE Covered</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='securityInfo.cgpanNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CGPAN No</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='securityInfo.lastCgtmseFeeRemittance'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last CGTMSE Fee Remittance</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='revivalDueDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revival Due Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='revivalDoneDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revival Done Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>
                        Security Properties
                      </p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            securityProperties.append({
                              ...blankSecurityProperty,
                            })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Property
                        </Button>
                      )}
                    </div>

                    {securityProperties.fields.length === 0 ? (
                      <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                        No properties added yet.
                      </div>
                    ) : (
                      securityProperties.fields.map((item, index) => (
                        <div
                          key={item.id}
                          className='bg-muted/20 relative rounded-lg border p-4'
                        >
                          {!viewOnly && (
                            <Button
                              type='button'
                              variant='destructive'
                              size='icon'
                              className='absolute top-4 right-4'
                              onClick={() => securityProperties.remove(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `securityInfo.properties.${index}.description`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asNumberPath(
                                `securityInfo.properties.${index}.realizableValue`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Realizable Value</FormLabel>
                                  <FormControl>
                                    <Input type='number' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={asStringPath(
                                `securityInfo.properties.${index}.lastValuationDate`
                              )}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Valuation Date</FormLabel>
                                  <FormControl>
                                    <Input type='date' {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title='Facilities & Compliance'
                  description='Facility positions and sanction compliance status.'
                >
                  <div className='space-y-6'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-semibold'>
                          Facility Positions
                        </p>
                        {!viewOnly && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              facilityPositions.append({
                                ...blankFacilityPosition,
                              })
                            }
                          >
                            <Plus className='mr-2 h-4 w-4' />
                            Add Facility
                          </Button>
                        )}
                      </div>
                      <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Facility</TableHead>
                              <TableHead>Limit (Lacs)</TableHead>
                              <TableHead>DP (Lacs)</TableHead>
                              <TableHead>Outstanding (Lacs)</TableHead>
                              <TableHead>Irregularity (Lacs)</TableHead>
                              <TableHead className='text-right'>
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facilityPositions.fields.length ? (
                              facilityPositions.fields.map((row, index) => (
                                <TableRow key={row.id}>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asStringPath(
                                        `facilityPositions.${index}.facilityOrScheme`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `facilityPositions.${index}.limitLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `facilityPositions.${index}.dpLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `facilityPositions.${index}.outstandingLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `facilityPositions.${index}.irregularityLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className='text-right'>
                                    {!viewOnly && (
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        onClick={() =>
                                          facilityPositions.remove(index)
                                        }
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className='text-muted-foreground text-center text-sm'
                                >
                                  No facility positions added.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-semibold'>
                          Sanction Compliances
                        </p>
                        {!viewOnly && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              sanctionCompliances.append({
                                ...blankSanctionCompliance,
                              })
                            }
                          >
                            <Plus className='mr-2 h-4 w-4' />
                            Add Compliance
                          </Button>
                        )}
                      </div>
                      <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Particular</TableHead>
                              <TableHead>ROI</TableHead>
                              <TableHead>Repayment Schedule</TableHead>
                              <TableHead>Installment (Lacs)</TableHead>
                              <TableHead>Outstanding (Lacs)</TableHead>
                              <TableHead>SMA Status</TableHead>
                              <TableHead>CBS Diff Comment</TableHead>
                              <TableHead className='text-right'>
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sanctionCompliances.fields.length ? (
                              sanctionCompliances.fields.map((row, index) => (
                                <TableRow key={row.id}>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asStringPath(
                                        `sanctionCompliances.${index}.particular`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `sanctionCompliances.${index}.roi`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input
                                            type='number'
                                            step='0.01'
                                            {...field}
                                          />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asStringPath(
                                        `sanctionCompliances.${index}.repaymentSchedule`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `sanctionCompliances.${index}.installmentLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asNumberPath(
                                        `sanctionCompliances.${index}.outstandingLacs`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asStringPath(
                                        `sanctionCompliances.${index}.smaStatus`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={asStringPath(
                                        `sanctionCompliances.${index}.commentIfCBSdiffersFromSanction`
                                      )}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className='text-right'>
                                    {!viewOnly && (
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        onClick={() =>
                                          sanctionCompliances.remove(index)
                                        }
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className='text-muted-foreground text-center text-sm'
                                >
                                  No sanction compliances added.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='irregularityReason'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Irregularity Reason</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='unitActionPlan'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Action Plan</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name='otherConditions'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              placeholder='Comma separated'
                              value={joinList(safeStringArray(field.value))}
                              onChange={(event) =>
                                field.onChange(splitList(event.target.value))
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <FormField
                        control={form.control}
                        name='assetCreatedAsPerLoanPurpose'
                        render={({ field }) => (
                          <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  field.onChange(checked === true)
                                }
                              />
                            </FormControl>
                            <div>
                              <FormLabel>
                                Assets Created as per Loan Purpose
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='documentationAsPerBankNorms'
                        render={({ field }) => (
                          <FormItem className='flex items-start gap-3 rounded-md border p-3'>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  field.onChange(checked === true)
                                }
                              />
                            </FormControl>
                            <div>
                              <FormLabel>
                                Documentation as per Bank Norms
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='documentationDeviationReason'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deviation Reason</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title='Financials & Ratings'
                  description='Financial performance, indebtedness, and rating history.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='cibilScore'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CIBIL Score</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='lastReviewDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Review Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='commercialProdStartDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial Production Start</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='riskRating'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Rating</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='presentNetWorth'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Present Net Worth</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='cibilCheckedOn'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CIBIL Checked On</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cibilCheckRef'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CIBIL Check Ref</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='inspectionDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inspection Date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='inspectionRemarks'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Inspection Remarks</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>Financials</p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            financials.append({ ...blankFinancialRow })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Row
                        </Button>
                      )}
                    </div>
                    <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Net Sales</TableHead>
                            <TableHead>PBT</TableHead>
                            <TableHead>PAT</TableHead>
                            <TableHead>Cash Accrual</TableHead>
                            <TableHead>TNW</TableHead>
                            <TableHead>TOL/TNW</TableHead>
                            <TableHead>Current Ratio</TableHead>
                            <TableHead>Remark</TableHead>
                            <TableHead className='text-right'>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financials.fields.length ? (
                            financials.fields.map((row, index) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `financials.${index}.asOnDate`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='date' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.netSales`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.pbt`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.pat`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.cashAccrual`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.tnw`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.tolToTnw`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financials.${index}.currentRatio`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `financials.${index}.remark`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className='text-right'>
                                  {!viewOnly && (
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => financials.remove(index)}
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={10}
                                className='text-muted-foreground text-center text-sm'
                              >
                                No financial rows added.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>Indebtedness</p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            indebtednessList.append({
                              ...blankIndebtednessRow,
                            })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Row
                        </Button>
                      )}
                    </div>
                    <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Existing Fund Based</TableHead>
                            <TableHead>Existing Non-Fund Based</TableHead>
                            <TableHead>Proposed Fund Based</TableHead>
                            <TableHead>Proposed Non-Fund Based</TableHead>
                            <TableHead className='text-right'>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {indebtednessList.fields.length ? (
                            indebtednessList.fields.map((row, index) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `indebtednessList.${index}.existingFundBased`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `indebtednessList.${index}.existingNonFundBased`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `indebtednessList.${index}.proposedFundBased`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `indebtednessList.${index}.proposedNonFundBased`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className='text-right'>
                                  {!viewOnly && (
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      onClick={() =>
                                        indebtednessList.remove(index)
                                      }
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className='text-muted-foreground text-center text-sm'
                              >
                                No indebtedness rows added.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>Credit Ratings</p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            creditRatings.append({
                              ...blankCreditRatingRow,
                            })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Rating
                        </Button>
                      )}
                    </div>
                    <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Validated On</TableHead>
                            <TableHead>Borrowing Rating Current</TableHead>
                            <TableHead>Borrowing Rating Previous</TableHead>
                            <TableHead>Overall Score</TableHead>
                            <TableHead>Financial Score</TableHead>
                            <TableHead>Final CRA Rating</TableHead>
                            <TableHead className='text-right'>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditRatings.fields.length ? (
                            creditRatings.fields.map((row, index) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `creditRatings.${index}.craValidatedOn`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='date' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `creditRatings.${index}.borrowingRatingCurrent`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `creditRatings.${index}.borrowingRatingPrevious`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `creditRatings.${index}.overallScore`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `creditRatings.${index}.financialScore`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `creditRatings.${index}.finalCraRatingByBank`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className='text-right'>
                                  {!viewOnly && (
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      onClick={() =>
                                        creditRatings.remove(index)
                                      }
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className='text-muted-foreground text-center text-sm'
                              >
                                No credit ratings added.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className='mt-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>
                        Financial Indicators
                      </p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            financialIndicators.append({
                              ...blankFinancialIndicatorRow,
                            })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Indicator
                        </Button>
                      )}
                    </div>
                    <div className='bg-background/80 overflow-x-auto rounded-xl border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Adverse Comments</TableHead>
                            <TableHead>Overall Comments</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>NP</TableHead>
                            <TableHead>TNW</TableHead>
                            <TableHead>TOL/TNW</TableHead>
                            <TableHead>Current Ratio</TableHead>
                            <TableHead>DSCR</TableHead>
                            <TableHead className='text-right'>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialIndicators.fields.length ? (
                            financialIndicators.fields.map((row, index) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `financialIndicators.${index}.indicatorCommentsAdverse`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asStringPath(
                                      `financialIndicators.${index}.indicatorCommentsOverall`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorSales`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorNp`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorTnw`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorTolToTnw`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorCurrentRatio`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={asNumberPath(
                                      `financialIndicators.${index}.indicatorDscr`
                                    )}
                                    render={({ field }) => (
                                      <FormControl>
                                        <Input type='number' {...field} />
                                      </FormControl>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className='text-right'>
                                  {!viewOnly && (
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      onClick={() =>
                                        financialIndicators.remove(index)
                                      }
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className='text-muted-foreground text-center text-sm'
                              >
                                No financial indicators added.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title='Balance Sheets'
                  description='Review line items for recent balance sheets.'
                >
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold'>Balance Sheets</p>
                      {!viewOnly && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            balanceSheets.append({
                              ...blankBalanceSheetRow,
                            })
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add Balance Sheet
                        </Button>
                      )}
                    </div>

                    {balanceSheets.fields.length === 0 ? (
                      <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                        No balance sheet entries added.
                      </div>
                    ) : (
                      balanceSheets.fields.map((row, index) => (
                        <div
                          key={row.id}
                          className='bg-muted/20 relative rounded-lg border p-4'
                        >
                          {!viewOnly && (
                            <Button
                              type='button'
                              variant='destructive'
                              size='icon'
                              className='absolute top-4 right-4'
                              onClick={() => balanceSheets.remove(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}

                          <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr]'>
                            <div className='text-muted-foreground text-xs font-semibold'>
                              Line Item
                            </div>
                            <div className='text-muted-foreground text-xs font-semibold'>
                              Previous Year
                            </div>
                            <div className='text-muted-foreground text-xs font-semibold'>
                              Last Year
                            </div>
                          </div>

                          <div className='mt-3 space-y-3'>
                            {balanceSheetLines.map((line) => {
                              const prevName =
                                `balanceSheets.${index}.${line.prev}` as FieldPathByValue<
                                  FormValues,
                                  number
                                >
                              const lastName =
                                `balanceSheets.${index}.${line.last}` as FieldPathByValue<
                                  FormValues,
                                  number
                                >
                              return (
                                <div
                                  key={line.label}
                                  className='grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_1fr_1fr]'
                                >
                                  <div className='text-muted-foreground text-sm'>
                                    {line.label}
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={prevName}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={lastName}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type='number' {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title='Audit & Recommendations'
                  description='Audit remarks and managerial recommendations.'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='lastAuditRemarks'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Audit Remarks</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='lastAuditCompliance'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Audit Compliance</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='branchManagerRecommendation'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Manager Recommendation</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='seniorManagerRecommendation'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senior Manager Recommendation</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='reviewingAuthorityRemarks'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>Reviewing Authority Remarks</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='tgbSanctionFor'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TGB Sanction For</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='tgbApprovalFor'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TGB Approval For</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='tgbConfirmFor'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TGB Confirm For</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </fieldset>

              {!viewOnly && (
                <div className='bg-background/90 flex items-center justify-end gap-3 rounded-xl border p-4 shadow-sm backdrop-blur'>
                  {editMode && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleReset}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type='submit' disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {editMode ? 'Update Review' : 'Submit Review'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this
              review?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
