// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useEffect } from 'react'
import {
  useForm,
  Controller,
  useFieldArray,
} from 'react-hook-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils.ts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

/* ================================================================
   ROUTE
   ================================================================ */

export const Route = createFileRoute(
  '/_authenticated/stock-audit/$accountId/report/$assignmentIdRGB'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { accountId, assignmentIdRGB } = Route.useParams()
  const navigate = useNavigate()

  // Borrower details for auto-fill (acctNo, name, address)
  const {
    data: borrowerDetail,
    isLoading: isLoadingBorrower,
  } = $api.useQuery('get', '/account/getAccountDetail', {
    params: { query: { acctNm: accountId, assignId: Number(assignmentIdRGB) } },
  })

  const form = useForm({
    mode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: {
      bankCode: 'RGB',

      // I. Basic header – Annexure II A
      branchVisitDate: '',
      unitVisitDate: '',
      reportSubmissionDate: '',
      accountNo: '',
      accountName: '',
      caFirmName: '',
      constitution: '',
      inspectorName: '',
      branchName: '',
      branchAccompanyingPerson: '',
      branchCategory: '',
      borrowerContactPerson: '',
      officeAddress: '',
      factoryAddress: '',
      auditDuration: '',
      lastSanctionDate: '',
      lastSanctionAuthority: '',
      assetClassificationDate: '',
      assetClassificationStatus: '',
      shortRenewalValidityPeriod: '',
      natureOfActivity: '',
      bankingArrangement: '',
      lastConsortiumMeetingDate: '',

      // II. Position of Account – Annexure II B
      facilities: [],
      totalFundBasedLimit: '',
      totalNonFundBasedLimit: '',
      totalOverallLimit: '',

      // III. Terms & Conditions / Documentation
      tcComplied: 'YES',
      tcNonComplianceDetails: '',
      docsProper: 'YES',
      docsImproperDetails: '',
      docsDate: '',
      lastDebitBalanceConfirmationDate: '',
      docsVettedByLegal: 'YES',
      docsVettingDetails: '',
      stampAdequate: 'YES',
      stampDetails: '',
      docsVettingDate: '',
      chargeCreated: 'YES',
      chargeCreationDetails: '',
      chargeRegistrationDetails: '',
      rocCharges: [],
      docsIrregularities: '',

      // IV. Operations / Performance
      opRegularlyOperated: 'YES',
      opSalesRoutedThroughAccount: 'YES',
      opCashWithdrawalsAllowed: 'NO',
      opCashWithdrawalReasons: '',
      opDiversionTransactions: '',
      opChequeReturnCount: '',
      opAvgDailyBalancePeriod: '',
      opAvgDailyDebitBalance: '',
      opAvgDailyCreditBalance: '',
      opUtilizationAbove90: 'YES',
      opUtilizationRemarks: '',
      opSummationsInLineWithProjections: 'YES',
      opSummationsRemarks: '',
      opInterestServicedWithin10Days: 'YES',
      opOverdrawnCount: '',
      opExcessAllowedPattern: '',
      opOverdrawalReasons: '',
      opExcessReportedToHO: 'YES',
      opExcessConfirmed: 'YES',
      opExcessConfirmationAction: '',
      opCcAdjustedInTime: 'YES',
      opCcAdjustmentDetails: '',
      opExtensionGrantedForOverdueCC: 'NO',
      opExtensionDetails: '',
      opPcAdjustedFromExportProceeds: 'YES',
      opBillRealisationAsPerTenor: 'YES',
      opOverdueBillsDetails: '',
      opBillsReturnedUnpaidDetails: '',
      opEcgCoverageObtained: 'YES',
      opEcgCoverageDetails: '',
      opLcDevolvementExists: 'NO',
      opLcDevolvementDetails: '',
      opGuaranteesInvokedDetails: '',
      opGuaranteesExpiredOutstanding: '',
      opInterestServicedRegularly: 'YES',
      opInterestServicedUptoDate: '',
      opCriticalAmountDue: '',
      opRelationshipProfitabilityComments: '',

      // V. Submission of Statements
      ssStockStatementsRegular: 'YES',
      ssLastStockStatementDate: '',
      ssDpCalculated: 'YES',
      ssDpRegisterMaintainedRemarks: '',
      ssFfrReceivedRegularly: 'YES',
      ssFfrScrutinized: 'YES',
      ssFfrMatchBooks: 'YES',
      ssFfrRemarks: '',
      ssMmrSubmittedRegularly: 'YES',
      ssMmrLastSubmittedDate: '',

      // V. Insurance
      insurancePolicies: [],
      insuranceCoverageComments: '',

      // VI. Unit Visit & Capacity / Stock & DP
      unitContactPerson: '',
      unitContactDesignation: '',
      unitNameBoardDisplayed: 'YES',
      unitHypothecationBoardDisplayed: 'YES',

      productionCapacity: [
        { capacityType: 'LICENSED', lastYear: '', currentYear: '' },
        { capacityType: 'INSTALLED', lastYear: '', currentYear: '' },
        { capacityType: 'ACTUAL', lastYear: '', currentYear: '' },
      ],

      valuationMethodRawMaterial: '',
      valuationMethodWip: '',
      valuationMethodFinishedGoods: '',
      inventoryDiscrepanciesComments: '',

      hypothecatedStockDate: '',
      hypothecatedStockPosition: '',
      stockStatementDate: '',
      stockStatementValue: '',

      reconRawMaterial: '',
      reconStockInProcess: '',
      reconFinishedGoods: '',
      reconStoresSpares: '',
      reconTotal: '',
      reconPurchasesAfterStockStmt: '',
      reconSalesAfterStockStmt: '',
      reconClosingStock: '',

      drawingPowerStocksValue: '',
      unpaidStocksValue: '',
      obsoleteStocksValue: '',
      totalEligibleStockForDp: '',
      dpMarginPercent: '',
      drawingPowerCalculated: '',

      // VII. Book Debts Verification
      bdAgewisePartywiseVerified: 'YES',
      bdRoutingThroughAccount: 'YES',
      bdAverageRealisationPeriod: '',
      bdRealisationPeriodComparisonComments: '',
      bdQualityComments: '',
      bdBooksVsPhysicalStockMatch: 'YES',
      bdStockDifferenceComments: '',
      bdInventoryHoldingLevelsAdhered: 'YES',
      bdInventoryHoldingComments: '',
      bdFinishedGoodsIncludesOldObsolete: 'NO',
      bdFinishedGoodsComments: '',
      bdStockingPatternAppropriate: 'YES',
      bdStockingPatternComments: '',
      bdInternalControlOnStocksAdequate: 'YES',
      bdInternalControlComments: '',
      bdProperBooksMaintained: 'YES',
      bdStockRegisterMaintained: 'YES',
      bdBooksMaintenanceComments: '',

      // VIII. Other Features & Observations
      ofStatutoryComplianceComments: '',
      ofPollutionControlCompliance: '',
      ofLockoutStrikeDetails: '',
      ofSafetySecurityMeasures: '',
      ofBranchInspectionDetails: '',
      ofPreviousInspectionIrregularities: '',
      ofSundryDebtorsVsStockStmtComments: '',
      ofBorrowerBankingWithOthers: 'NO',
      ofOtherBanksDetails: '',
      ofRelationshipContinuanceConcern: '',
      ofOverallObservation: '',
      ofRiskMitigationSuggestions: '',
      ofOperationalEfficiencySuggestions: '',

      // IX. Enclosures & certificate
      enclosures: '',
      place: '',
      reportDate: '',
    },
  })

  // Prefill from borrower details
  useEffect(() => {
    const cust = borrowerDetail?.customer
    if (cust) {
      const addressLines = [cust.add1, cust.add2, cust.add3, cust.add4]
        .filter(Boolean)
        .join('\n')

      form.setValue('accountNo', cust.acctNo ?? '')
      form.setValue('accountName', cust.custName ?? '')
      if (!form.getValues('officeAddress')) {
        form.setValue('officeAddress', addressLines)
      }
      if (!form.getValues('factoryAddress')) {
        form.setValue('factoryAddress', addressLines)
      }
      if (!form.getValues('branchName')) {
        form.setValue('branchName', cust.branchName ?? '')
      }
    }
  }, [borrowerDetail, form])

  const submitReportMutation = $api.useMutation(
    'post',
    '/api/rgb/stock-audit/create',
    {
      onSuccess: () => {
        toast.success('Stock Audit Report (RGB) submitted successfully')
        navigate({
          to: '/stock-audit/assigned-audits',
          search: { tab: 'COMPLETED' },
        })
        setTimeout(() => {
          window.location.reload()
        }, 0)
      },
      onError: (error) => toastError(error),
    }
  )

  const onSubmit = (data) => {
    submitReportMutation.mutate({
      body: {
        ...data,
        bankCode: 'RGB',
        accountId,
        assignmentId: Number(assignmentIdRGB),
      },
    })
  }

  if (isLoadingBorrower) {
    return <StockAuditFormSkeleton />
  }

  const { control } = form

  return (
    <MainWrapper>
      <div className='relative mx-auto w-full max-w-7xl px-6 pb-20'>
        {/* Header */}
        <header className='from-primary/20 via-primary/10 ring-border mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight'>
              Stock Audit Report
            </h1>
          </div>

          <button
            type='button'
            onClick={() => window.history.back()}
            className='rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground'
          >
            Go Back
          </button>
        </header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-10 overflow-visible'
          >
            {/* ===================== I. Basic Details – Annexure II A ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  I. Basic Details of Borrower & Facility (Annexure II A)
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='branchVisitDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Visit at Branch</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='unitVisitDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Visit at Unit</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='reportSubmissionDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Submission of Report</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='accountNo'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder='Auto-filled (if available)' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='accountName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the Account</FormLabel>
                        <FormControl>
                          <Input placeholder='Borrower / Firm Name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='caFirmName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the CA Firm / Stock Auditor</FormLabel>
                        <FormControl>
                          <Input placeholder='Audit Firm Name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='constitution'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Constitution</FormLabel>
                        <FormControl>
                          <select
                            className='border-input bg-background text-foreground ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value=''>Select</option>
                            <option value='Proprietorship'>Proprietorship</option>
                            <option value='Partnership'>Partnership</option>
                            <option value='Private Limited'>Private Limited</option>
                            <option value='Public Limited'>Public Limited</option>
                            <option value='LLP'>LLP</option>
                            <option value='Trust'>Trust</option>
                            <option value='Society'>Society</option>
                            <option value='Others'>Others</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='inspectorName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of Person who Inspected the Account</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='branchName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the Branch</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='branchAccompanyingPerson'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Person from Branch who Accompanied Stock Auditor
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='branchCategory'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category of Branch</FormLabel>
                        <FormControl>
                          <select
                            className='border-input bg-background text-foreground ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value=''>Select</option>
                            <option value='Rural'>Rural</option>
                            <option value='Semi Urban'>Semi Urban</option>
                            <option value='Urban'>Urban</option>
                            <option value='Metro'>Metro</option>
                            <option value='Others'>Others</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='borrowerContactPerson'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name of Person Contacted at Borrower&apos;s Site
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='officeAddress'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address – Office</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='factoryAddress'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address – Factory / Unit</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='auditDuration'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration of Audit</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. 10.01.2025 to 12.01.2025' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='lastSanctionDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Last Sanction</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='lastSanctionAuthority'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authority of Last Sanction</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='assetClassificationDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Classification as on (Date)</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='assetClassificationStatus'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Classification Status</FormLabel>
                        <FormControl>
                          <Input placeholder='Standard / SMA / NPA etc.' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='shortRenewalValidityPeriod'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>If Short Renewal – Validity Period</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. upto 30.06.2025' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='natureOfActivity'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nature of Activity</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bankingArrangement'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banking Arrangement</FormLabel>
                        <FormControl>
                          <Input placeholder='Sole / Consortium / Multiple etc.' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='lastConsortiumMeetingDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Last Consortium Meeting</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ===================== II. Position of Account – Annexure II B ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b flex flex-col gap-1'>
                <CardTitle className='text-xl'>
                  II. Position of Account as on (Rs. in Lacs) – Annexure II B
                </CardTitle>
                <p className='text-xs text-muted-foreground'>
                  Capture Fund Based / Non-Fund Based facilities with limits, securities, DP, outstanding, overdues & ROI.
                </p>
              </CardHeader>
              <CardContent className='space-y-4 pt-6'>
                <EditableTable
                  control={control}
                  title='Facilities'
                  name='facilities'
                  columns={[
                    {
                      key: 'category',
                      header: 'Category',
                      type: 'select',
                      options: [
                        { value: 'FUND_BASED', label: 'Fund Based' },
                        { value: 'NON_FUND_BASED', label: 'Non Fund Based' },
                      ],
                    },
                    {
                      key: 'facilityName',
                      header: 'Nature of Facility',
                      type: 'text',
                      placeholder:
                        'Working Capital / Export Credit / Term Loan / Guarantee etc.',
                    },
                    {
                      key: 'limitSanctioned',
                      header: 'Limit Sanctioned',
                      type: 'number',
                    },
                    {
                      key: 'valueOfSecurities',
                      header: 'Value of Securities',
                      type: 'number',
                    },
                    {
                      key: 'margin',
                      header: 'Margin (%)',
                      type: 'number',
                    },
                    {
                      key: 'drawingPower',
                      header: 'Drawing Power',
                      type: 'number',
                    },
                    {
                      key: 'outstanding',
                      header: 'O/s as on Date',
                      type: 'number',
                    },
                    {
                      key: 'overdue',
                      header: 'Overdue',
                      type: 'number',
                    },
                    {
                      key: 'rateOfInterest',
                      header: 'Rate of Interest (%)',
                      type: 'number',
                    },
                  ]}
                  emptyRow={{
                    category: 'FUND_BASED',
                    facilityName: '',
                    limitSanctioned: '',
                    valueOfSecurities: '',
                    margin: '',
                    drawingPower: '',
                    outstanding: '',
                    overdue: '',
                    rateOfInterest: '',
                  }}
                />

                <div className='grid grid-cols-1 gap-4 pt-2 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='totalFundBasedLimit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Fund Based Limits</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='totalNonFundBasedLimit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Non-Fund Based Limits</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='totalOverallLimit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total FB + NFB Limits</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ===================== III. Inspection at Branch – T&C / Documentation ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  III. Inspection at Branch – Terms & Conditions / Documentation (Annexure II C – A & Docs)
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                {/* Terms & Conditions */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='tcComplied'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Terms & Conditions of Sanction are Complied
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='tcNonComplianceDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          If NOT, Terms & Conditions Yet to be Complied
                        </FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Documentation */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='docsProper'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Whether Proper Documentation Obtained</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='docsImproperDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>If NOT, Give Details of Deficiencies</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='docsDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Documents</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='lastDebitBalanceConfirmationDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Last Debit Balance Confirmation</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='docsVettedByLegal'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Documents Vetted by Advocate / Legal Dept as per Norms
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='docsVettingDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details / Comments on Vetting</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='stampAdequate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Adequate Stamps Affixed (Docs / Equitable Mortgage etc.)
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='stampDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>If NOT, Give Details</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='docsVettingDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Vetting / Verification of Documents</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='chargeCreated'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Charge on Assets / Property Created
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='chargeCreationDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details of Charge Creation</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='chargeRegistrationDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Details of Registration of Charge (including modification /
                          enhancement)
                        </FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ROC Charges table */}
                <EditableTable
                  control={control}
                  title='ROC Charge Registration Details'
                  name='rocCharges'
                  columns={[
                    {
                      key: 'dateOfRegistration',
                      header: 'Date of Registration of Charge',
                      type: 'date',
                    },
                    {
                      key: 'dateOfCertificate',
                      header: 'Date of Certificate',
                      type: 'date',
                    },
                    {
                      key: 'valueOfCharge',
                      header: 'Value of Charge (Rs. in Lacs)',
                      type: 'number',
                    },
                  ]}
                  emptyRow={{
                    dateOfRegistration: '',
                    dateOfCertificate: '',
                    valueOfCharge: '',
                  }}
                />

                <FormField
                  control={control}
                  name='docsIrregularities'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Any Other Irregularities Observed in Documentation
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ===================== IV. Operations / Performance ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  IV. Operations / Performance of the Account at Branch
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opRegularlyOperated'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Account is Regularly / Actively Operated
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opSalesRoutedThroughAccount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Whether Sales are Routed through the Account</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opCashWithdrawalsAllowed'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Whether Cash Withdrawals are Regularly Allowed</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opCashWithdrawalReasons'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reasons for Allowing Cash Withdrawals (if any)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='opDiversionTransactions'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Any Transaction Indicating Diversion of Funds (Based on Random
                        Checking)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
                  <FormField
                    control={control}
                    name='opChequeReturnCount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Cheques Returned for Financial Reasons</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opAvgDailyBalancePeriod'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Daily Balance – Period</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. last 6 months' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opAvgDailyDebitBalance'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Daily Debit Balance (Rs.)</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opAvgDailyCreditBalance'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg Daily Credit Balance (Rs.)</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opUtilizationAbove90'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Utilization of Limit is More than 90%
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opSummationsInLineWithProjections'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Credit / Debit Summations in Tune with Sales Projections?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opInterestServicedWithin10Days'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Serviced within 10 days of Due Date?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opUtilizationRemarks'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Remarks on Utilisation Pattern / Summations vs Projections
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opOverdrawnCount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Times Account Remained Overdrawn</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opExcessAllowedPattern'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Excesses Allowed – Continuously / Occasionally / Rarely
                        </FormLabel>
                        <FormControl>
                          <select
                            className='border-input bg-background text-foreground ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value=''>Select</option>
                            <option value='CONTINUOUSLY'>Continuously</option>
                            <option value='OCCASIONALLY'>Occasionally</option>
                            <option value='RARELY'>Rarely</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opExcessReportedToHO'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Excesses Reported to Higher Authority
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opOverdrawalReasons'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reasons for Overdrawals / Excesses</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opExcessConfirmed'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Excesses Have Been Confirmed by Competent Authority
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opCcAdjustedInTime'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Whether CC is Adjusted in Time</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opExtensionGrantedForOverdueCC'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          In Case of Overdue CCs, Extension of Time Granted?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opCcAdjustmentDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        If CC Not Adjusted / Extension Granted – Give Details
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opPcAdjustedFromExportProceeds'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether PC is Adjusted by Application out of Export Proceeds
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opBillRealisationAsPerTenor'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Bills (Foreign / Inland) Realized as per Tenor / Terms
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opEcgCoverageObtained'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Buyer-wise ECGC Coverage Obtained as per Sanction Terms
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opOverdueBillsDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of Overdue Bills – Inland / Foreign</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='opBillsReturnedUnpaidDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of Bills Returned Unpaid</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='opEcgCoverageDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments on ECGC Coverage / Exceptions</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='opLcDevolvementExists'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any Devolvement of LCs?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opInterestServicedRegularly'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Whether Interest is Being Serviced Regularly</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opInterestServicedUptoDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date up to which Interest is Serviced</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opLcDevolvementDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        No. of LCs Devolved, Amount, Dates, Reasons & Recovery Steps
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='opGuaranteesInvokedDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Guarantees Invoked – Number, Date, Amount, Reasons & Recovery
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='opGuaranteesExpiredOutstanding'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          No. of Guarantees Expired but Still Outstanding
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='opCriticalAmountDue'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Critical Amount of Interest / Charges Due</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='opRelationshipProfitabilityComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Profitability of Relationship – Auditor&apos;s Comments
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ===================== V. Submission of Statements & Insurance ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  V. Submission of Statements & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                {/* Submission of Statements */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='ssStockStatementsRegular'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Statements Received Regularly?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ssLastStockStatementDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Last Stock Statement</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ssDpCalculated'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DP Being Calculated / DP Register Maintained?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='ssDpRegisterMaintainedRemarks'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks on DP Calculation / Register</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
                  <FormField
                    control={control}
                    name='ssFfrReceivedRegularly'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FFR Statements Received Regularly?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ssFfrScrutinized'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FFR Statements Scrutinized?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ssFfrMatchBooks'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          FFR Information Corresponds with Party&apos;s Books?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ssMmrSubmittedRegularly'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Monthly Monitoring Report Submitted Regularly?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='ssFfrRemarks'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks on FFR / MMR</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='ssMmrLastSubmittedDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date When MMR Last Submitted</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Insurance */}
                <EditableTable
                  control={control}
                  title='Insurance Details'
                  name='insurancePolicies'
                  columns={[
                    {
                      key: 'policyNo',
                      header: 'Policy No.',
                      type: 'text',
                    },
                    {
                      key: 'insuranceCompany',
                      header: 'Insurance Company',
                      type: 'text',
                    },
                    {
                      key: 'sumInsured',
                      header: 'Sum Insured (Rs. in Lacs)',
                      type: 'number',
                    },
                    {
                      key: 'coverageDetails',
                      header: 'Coverage / Assets Covered',
                      type: 'text',
                    },
                    {
                      key: 'validityFrom',
                      header: 'Validity From',
                      type: 'date',
                    },
                    {
                      key: 'validityTo',
                      header: 'Validity To',
                      type: 'date',
                    },
                  ]}
                  emptyRow={{
                    policyNo: '',
                    insuranceCompany: '',
                    sumInsured: '',
                    coverageDetails: '',
                    validityFrom: '',
                    validityTo: '',
                  }}
                />

                <FormField
                  control={control}
                  name='insuranceCoverageComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comments on Insurance Adequacy & Discrepancies (Address, Goods,
                        Inadequacy, etc.)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ===================== VI. Unit Visit, Capacity, Stock & DP ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  VI. Unit Visit, Production Capacity, Stock & Drawing Power
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='unitContactPerson'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name of Person Contacted at Unit (with Designation)
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='unitContactDesignation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation at Unit</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='unitNameBoardDisplayed'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party&apos;s Name Board Prominently Displayed?</FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='unitHypothecationBoardDisplayed'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Notice of Hypothecation of Stocks to Bank Displayed?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Production Capacity table */}
                <EditableTable
                  control={control}
                  title='Production Capacity – Last Year vs This Year'
                  name='productionCapacity'
                  columns={[
                    {
                      key: 'capacityType',
                      header: 'Capacity Type',
                      type: 'select',
                      options: [
                        { value: 'LICENSED', label: 'Licensed Capacity' },
                        { value: 'INSTALLED', label: 'Installed Capacity' },
                        { value: 'ACTUAL', label: 'Actual Capacity Utilized' },
                      ],
                    },
                    {
                      key: 'lastYear',
                      header: 'Last Year',
                      type: 'text',
                    },
                    {
                      key: 'currentYear',
                      header: 'This Year',
                      type: 'text',
                    },
                  ]}
                  emptyRow={{
                    capacityType: 'LICENSED',
                    lastYear: '',
                    currentYear: '',
                  }}
                />

                {/* Method of Valuation of Stock */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='valuationMethodRawMaterial'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method of Valuation – Raw Materials</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Cost or NRV, whichever is lower'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='valuationMethodWip'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method of Valuation – Stock in Process</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='valuationMethodFinishedGoods'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method of Valuation – Finished Goods</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='inventoryDiscrepanciesComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comments on Discrepancies in Inventories & Impact of Change in
                        Valuation Method (if any)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stock Position & Statement */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='hypothecatedStockDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date as on which Hypothecated Stock Position is Reported
                        </FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='hypothecatedStockPosition'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Stock Position of Hypothecated Stock (Summary as on above date)
                        </FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='stockStatementDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date of Stock Statement (for which Physical Stock Reconciled)
                        </FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='stockStatementValue'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Value of Stock as per Stock Statement (Rs. in Lacs)
                        </FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* VI.1 Physical Inventory & Reconciliation */}
                <Card className='border border-dashed'>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      VI.1 Physical Inventory & Reconciliation (Rs. in Lacs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4 pt-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                      <FormField
                        control={control}
                        name='reconRawMaterial'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Raw Material</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconStockInProcess'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock in Process</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconFinishedGoods'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Finished Goods</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconStoresSpares'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stores & Spares</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                      <FormField
                        control={control}
                        name='reconTotal'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total (A+B+C+D)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconPurchasesAfterStockStmt'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Add Purchases (Between Stock Statement & Inspection)
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconSalesAfterStockStmt'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Less Sales (Between Stock Statement & Inspection)
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='reconClosingStock'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closing Stock (Physical)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* VI.2 Drawing Power – Stocks */}
                <Card className='border border-dashed'>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      VI.2 Drawing Power – Stocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4 pt-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <FormField
                        control={control}
                        name='drawingPowerStocksValue'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Value of Stocks as per Reconciliation (Ref. Closing Stock)
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='unpaidStocksValue'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Less Unpaid Stocks (including DA / LC / under Bills)
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='obsoleteStocksValue'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Less Obsolete / Non-Salable Stocks & Stores
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <FormField
                        control={control}
                        name='totalEligibleStockForDp'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Total Value of Stock Available for Drawing Power
                            </FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='dpMarginPercent'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Less Margin (%)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name='drawingPowerCalculated'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Drawing Power (Stocks)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.01' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* ===================== VII. Verification of Book Debts ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  VII. Verification of Book Debts
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='bdAgewisePartywiseVerified'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Age-wise & Party-wise Breakup Verified with Invoices / Sales
                          Register?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdRoutingThroughAccount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Receivables are Routed through the Account?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdAverageRealisationPeriod'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Time for Realisation of Book Debts</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. 60 days' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='bdRealisationPeriodComparisonComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comparison with Past Trend / Trade Trend & Reasons for Variation
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='bdQualityComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Observation on Quality of Book Debts</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='bdBooksVsPhysicalStockMatch'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Value of Stocks as per Books Matches Actual Inventory Holdings?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdInventoryHoldingLevelsAdhered'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Accepted Inventory Holding Levels Adhered to?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdFinishedGoodsIncludesOldObsolete'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Finished Goods Include Returned / Old / Obsolete / Non-salable
                          Items?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='bdStockDifferenceComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Differences between Books and Physical Stocks – Analysis / Impact
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='bdInventoryHoldingComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reasons for Non-adherence to Inventory Holding Levels (if any)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='bdFinishedGoodsComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comments on Inclusion of Old Batches / Non-salable Stock & DP
                        Acceptability
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='bdStockingPatternAppropriate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Company is Following the Correct Stocking Pattern?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdInternalControlOnStocksAdequate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Proper Internal Control Exists for Verification of Stocks?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='bdProperBooksMaintained'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Proper Books of Account Maintained (including Stock Register)?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='bdStockRegisterMaintained'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Register Maintained?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='bdBooksMaintenanceComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments on Books of Accounts / Internal Controls</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ===================== VIII. Other Features & Overall Observations ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  VIII. Other Features, Statutory Compliance & Overall Observations
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <FormField
                  control={control}
                  name='ofStatutoryComplianceComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Compliance to Statutory Obligations (Excise, VAT / GST, Power,
                        Labour etc.) – Comparative Comments
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofPollutionControlCompliance'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance to Pollution Control Norms</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofLockoutStrikeDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Whether Factory has been Closed due to Lockout / Strike – Details
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofSafetySecurityMeasures'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Safety & Security Measures, Storage of Goods, Accessibility
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofBranchInspectionDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Whether Branch Officers Conducted Inspection Regularly – Dates /
                        Irregularities / Deviations
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofPreviousInspectionIrregularities'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Irregularities in Last RBI / Statutory / Internal / Concurrent Audit
                        re: Stocks & Book Debts – Action Taken
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofSundryDebtorsVsStockStmtComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Value of Sundry Debtors as per Books vs Stock Statement (31st
                        March etc.) – Differences & Comments
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='ofBorrowerBankingWithOthers'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Whether Borrower is Banking with Other Banks / FIs?
                        </FormLabel>
                        <FormControl>
                          <YesNoNaSelect field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='ofOtherBanksDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details of Other Banks / Facilities (if any)</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name='ofRelationshipContinuanceConcern'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reasons, if any, Indicating Continuation of Relationship may not
                        be Beneficial – Comments
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofOverallObservation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Detailed Comments – Overall Observations in the Account
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofRiskMitigationSuggestions'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suggestions for Risk Mitigation for the Bank</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='ofOperationalEfficiencySuggestions'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suggestions to Improve Operational Efficiency</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ===================== IX. Enclosures & Certification ===================== */}
            <Card className='bg-card/50 ring-border rounded-2xl border shadow-xl ring-1'>
              <CardHeader className='border-b'>
                <CardTitle className='text-xl'>
                  IX. Enclosures & Certification
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <FormField
                  control={control}
                  name='enclosures'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enclosures (List of Annexures / Statements)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder='e.g. Age-wise Debtors statement, Stock summary, Insurance policies, ROC charge printout, etc.'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <FormField
                    control={control}
                    name='place'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='reportDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex flex-col justify-end text-sm text-muted-foreground'>
                    <span className='font-medium'>
                      Seal & Signature of Stock Auditor / CA Firm
                    </span>
                    <span className='text-xs'>
                      (Captured outside this form as physical / digital signature)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===================== Sticky Actions ===================== */}
            <div className='supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-6 border-t bg-background/80 px-6 py-4 backdrop-blur'>
              <div className='mx-auto flex w-full max-w-7xl flex-col-reverse items-stretch justify-end gap-3 sm:flex-row'>
                <Button
                  type='button'
                  variant='outline'
                  className='w-full sm:w-auto'
                  onClick={() => form.reset()}
                  disabled={submitReportMutation.isPending}
                >
                  Reset Form
                </Button>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  disabled={submitReportMutation.isPending}
                >
                  {submitReportMutation.isPending
                    ? 'Submitting…'
                    : 'Submit Stock Audit Report'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </MainWrapper>
  )
}

/* ================================================================
   Skeleton while loading borrower details
   ================================================================ */

const TitleSkeleton = () => <Skeleton className='h-6 w-48' />

const LabeledFieldSkeleton = ({ full }: { full?: boolean }) => (
  <div className={full ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
    <Skeleton className='h-4 w-32' />
    <Skeleton className='h-10 w-full' />
  </div>
)

const StockAuditFormSkeleton = () => {
  return (
    <MainWrapper>
      <div className='mx-auto w-full max-w-7xl space-y-10 px-6'>
        <Skeleton className='h-8 w-64' />
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className='shadow-lg'>
            <CardHeader>
              <CardTitle>
                <TitleSkeleton />
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {Array.from({ length: 6 }).map((__, i) => (
                <LabeledFieldSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        ))}
        <div className='flex flex-col-reverse justify-end gap-4 sm:flex-row'>
          <Skeleton className='h-10 flex-1 sm:w-40 sm:flex-none' />
          <Skeleton className='h-10 flex-1 sm:w-40 sm:flex-none' />
        </div>
      </div>
    </MainWrapper>
  )
}

/* ================================================================
   Generic Yes/No/NA select
   ================================================================ */

function YesNoNaSelect({ field }) {
  return (
    <select
      name={field.name}
      value={field.value ?? 'YES'}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      className='border-input bg-background text-foreground ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    >
      <option value='YES'>YES</option>
      <option value='NO'>NO</option>
      <option value='NA'>N/A</option>
    </select>
  )
}

/* ================================================================
   Generic EditableTable
   ================================================================ */


function EditableTable({ control, title, name, columns, emptyRow }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  const handleAdd = () => append(emptyRow)

  return (
    <Card className='bg-card/40'>
      <CardHeader className='flex items-center justify-between border-b'>
        <CardTitle className='text-base'>{title}</CardTitle>
        <Button
          size='sm'
          variant='outline'
          type='button'
          className='gap-1'
          onClick={handleAdd}
        >
          <Plus className='h-4 w-4' /> Add Row
        </Button>
      </CardHeader>
      <CardContent className='pt-4'>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.header}</TableHead>
              ))}
              <TableHead className='w-10 text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className='py-6 text-center text-xs text-muted-foreground'
                >
                  No rows added. Click &quot;Add Row&quot; to begin.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((row, rowIndex) => (
                <TableRow key={row.id}>
                  {columns.map((column) => {
                    const fieldName = `${name}.${rowIndex}.${column.key}`

                    return (
                      <TableCell key={column.key}>
                        <Controller
                          control={control}
                          name={fieldName}
                          render={({ field }) => {
                            if (column.type === 'select' && column.options) {
                              return (
                                <select
                                  name={field.name}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  onBlur={field.onBlur}
                                  className='border-input bg-background text-foreground ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                  <option value=''>Select</option>
                                  {column.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )
                            }

                            const inputType =
                              column.type === 'number'
                                ? 'number'
                                : column.type === 'date'
                                  ? 'date'
                                  : 'text'

                            const value =
                              field.value === undefined || field.value === null
                                ? ''
                                : field.value

                            return (
                              <Input
                                name={field.name}
                                value={value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                placeholder={column.placeholder}
                                type={inputType}
                                className='h-9 text-xs'
                              />
                            )
                          }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-center'>
                    <Button
                      size='icon'
                      variant='ghost'
                      type='button'
                      onClick={() => remove(rowIndex)}
                    >
                      <Trash className='h-4 w-4 text-destructive' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
