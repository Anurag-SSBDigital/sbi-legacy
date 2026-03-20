import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useForm,
  Controller,
  type FieldPath,
} from 'react-hook-form'
import { toast } from 'sonner'

import MainWrapper from '@/components/ui/main-wrapper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { JSX } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { $api } from '@/lib/api.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>

interface YesNoNaSelectProps {
  name: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

function YesNoNaSelect({
  name,
  value,
  onChange,
  onBlur,
}: YesNoNaSelectProps) {
  return (
    <select
      name={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">Select</option>
      <option value="YES">YES</option>
      <option value="NO">NO</option>
      <option value="NA">N/A</option>
    </select>
  )
}

function StockAuditFormSkeleton(): JSX.Element {
  return (
    <MainWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {[0, 1, 2, 3].map((sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2, 3].map((rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-1 gap-3 md:grid-cols-2"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </MainWrapper>
  )
}

function RouteComponent(): JSX.Element {
  const { accountId, assignmentIdMRB } = Route.useParams()
  const navigate = useNavigate()

  // ---- API mutation for saving MRB stock audit report ----
  const saveMrbReportMutation = $api.useMutation(
    'post',
    // keeping same pattern as your previous code so TS types stay valid
    '/api/mrb/stock-audits',
    {
      onSuccess: () => {
        toast.success('Stock audit report (MRB format) saved successfully.')
        navigate({
          to: '/stock-audit/assigned-audits',
          search: { tab: 'COMPLETED' },
        })
        setTimeout(() => {
          window.location.reload()
        }, 0)
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('Error saving MRB report', err)
        toast.error('Failed to save MRB stock audit report.')
      },
    }
  )

  const form = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: {
      // 1. GENERAL INFORMATION
      borrowerName: '',
      borrowerConstitution: '',
      borrowerIdOrLoanAccountNumber: '',
      branchName: '',
      sanctionDateAndAuthority: '',
      facilityType: '',
      fundNonFundLimitType: '',
      limitAmountSanctioned: '',
      natureOfBusiness: '',
      auditVisitDates: '',

      // 2. DOCUMENTS VERIFIED (booleans)
      docSanctionLetter: false,
      docLatestStockStatement: false,
      docLatestTrialBalance: false,
      docLastAuditedFinancials: false,
      docPreviousStockAuditReports: false,
      docInternalConcurrentStatutoryReports: false,
      docInsurancePoliciesWithBankClause: false,
      docGstEsicPfPropertyTaxChallans: false,
      docRocOrConstitutionDocuments: false,

      // 3. STOCK & DEBTORS VERIFICATION
      stockMatchWithBooks: '',
      stockDiscrepancyRemarks: '',
      obsoleteStockIdentified: '',
      obsoleteStockSegregatedWrittenOff: '',
      insuranceInsured: '',
      insuranceBankClausePresent: '',
      insuranceValidityAndRiskCoverage: '',
      stockRegisterMaintained: '',
      stockRegisterUpToDate: '',
      debtorsAgingSubmitted: '',
      overdueDebtorsDetails: '',
      recoveryMeasuresTaken: '',
      diversionToSisterConcerns: '',
      valuationMethodConsistentWithPolicy: '',
      valuationWorkingProvided: '',
      salesThroughBankAccount: '',
      collateralsDescription: '',
      collateralsValuationReportDate: '',
      collateralsLegalSearchReportDate: '',
      cersaiChargesRegistered: '',

      // 4. COMPLIANCE & OPERATIONS CHECK
      stockStatementsSubmittedTimely: '',
      stockStatementsDelayReasons: '',
      dpAsPerBankCalculation: '',
      dpAsPerAuditor: '',
      dpDifferenceAndReasons: '',
      dpRegisterMaintained: '',
      dpRegisterUpToDate: '',
      overdrawingObserved: '',
      overdrawingInstancesCount: '',
      lastBranchVisitDate: '',
      branchVisitObservations: '',
      bankBoardDisplayedAtPremises: '',
      otherBankFacilitiesDeclared: '',

      // 5. AUDIT OBSERVATIONS & IRREGULARITIES (checkbox list)
      obsStockStatementsNotSubmittedTimely: false,
      obsObsoleteStockNotExcludedFromDp: false,
      obsUnderOrNoInsurance: false,
      obsDebtorsAgingIncorrect: false,
      obsThirdPartyInventoryIncluded: false,
      obsDiversionOfFundsNoticed: false,
      obsNonComplianceWithSanctionTerms: false,
      obsDiscrepancyBetweenBooksAndFinancials: false,
      obsMisstatementInInsuranceCoverage: false,
      obsSisterConcernDuesShownAsReceivables: false,
      obsDisputesWithDebtorsPending: false,

      // 6. CONCLUSION & RECOMMENDATIONS
      overallRiskPerception: '',
      sanctionTermsCompliance: '',
      correctiveActionsSuggested: '',
      potentialNpaRisk: '',
      suggestedNextAuditFrequency: '',
      discussionHeldWithBorrower: '',

      // 7. AUDITOR’S DECLARATION
      caFirmName: '',
      caFirmRegistrationNumber: '',
      auditorName: '',
      auditorDeclarationDate: '',
      auditorSignatureAndSealNote: '',
    },
  })

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      // map to backend expected shape as much as possible
      bankFormat: 'MRB' as const,
      accountNo: accountId,
      assignmentId: assignmentIdMRB,
    }

    try {
      await saveMrbReportMutation.mutateAsync({
        body: payload,
        params: {
          query: {
            assignmentId: 0
          },
          header: undefined,
          path: undefined,
          cookie: undefined
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Submit failed', err)
    }
  }

  const isLoading = false
  if (isLoading) {
    return <StockAuditFormSkeleton />
  }

  return (
    <MainWrapper>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 pb-32"
        >
          {/* Header */}
          <header className="from-primary/20 via-primary/10 ring-border mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1">
            <div>
              <h1 className="text-xl font-semibold">
                Annual Stock Audit
              </h1>
              <p className="text-xs text-muted-foreground">
                Account ID: {accountId} · Assignment ID: {assignmentIdMRB}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              Go Back
            </button>
          </header>

          {/* 1. GENERAL INFORMATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                1. General Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Basic details of the borrower and facility as per MRB stock audit format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="borrowerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of Borrower</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="borrowerConstitution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Borrower&apos;s Constitution (Proprietorship / Partnership / Company)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="borrowerIdOrLoanAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrower ID / Loan Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of Branch</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="sanctionDateAndAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Sanction &amp; Sanctioning Authority</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 15-03-2024 – GM (Credit)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="facilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Facility (CC / OD / BG / etc.)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="fundNonFundLimitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fund-based / Non-fund-based Limit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fund-based CC limit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="limitAmountSanctioned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit Amount Sanctioned (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="natureOfBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature of Business</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="auditVisitDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date(s) of Audit Visit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10-07-2025 to 12-07-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. DOCUMENTS VERIFIED */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                2. Documents Verified
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tick the documents verified during the stock audit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  name: 'docSanctionLetter',
                  label: 'Sanction Letter',
                },
                {
                  name: 'docLatestStockStatement',
                  label: 'Latest Stock Statement',
                },
                {
                  name: 'docLatestTrialBalance',
                  label: 'Latest Trial Balance / Provisional Balance Sheet',
                },
                {
                  name: 'docLastAuditedFinancials',
                  label: 'Last Audited Financials',
                },
                {
                  name: 'docPreviousStockAuditReports',
                  label: 'Previous Stock Audit Reports (last 2 years)',
                },
                {
                  name: 'docInternalConcurrentStatutoryReports',
                  label: 'Internal / Concurrent / Statutory Audit Reports',
                },
                {
                  name: 'docInsurancePoliciesWithBankClause',
                  label: 'Insurance Policies with Bank Clause',
                },
                {
                  name: 'docGstEsicPfPropertyTaxChallans',
                  label: 'GST Returns, ESI, PF, Property Tax Challans',
                },
                {
                  name: 'docRocOrConstitutionDocuments',
                  label: 'ROC Documents / Constitution Documents (if any)',
                },
              ].map((item) => (
                <Controller
                  key={item.name}
                  control={control}
                  name={item.name as FieldPath<FormValues>}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <label
                        htmlFor={field.name}
                        className="text-sm text-foreground"
                      >
                        {item.label}
                      </label>
                    </div>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          {/* 3. STOCK & DEBTORS VERIFICATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                3. Stock &amp; Debtors Verification
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                As per Annexure-A – MRB stock audit format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stock Statement vs Physical Stock */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Stock Statement vs Physical Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 md:grid-cols-[1fr,2fr]">
                  <FormField
                    control={control}
                    name="stockMatchWithBooks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match with books</FormLabel>
                        <FormControl>
                          <YesNoNaSelect
                            name={field.name}
                            value={field.value as string | undefined}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="stockDiscrepancyRemarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discrepancy (if any)</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Obsolete / Non-moving Stock */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="obsoleteStockIdentified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obsolete / Non-moving stock identified?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="obsoleteStockSegregatedWrittenOff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segregated and written-off?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Insurance Coverage */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Insurance Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={control}
                      name="insuranceInsured"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insured?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="insuranceBankClausePresent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank clause present?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={control}
                    name="insuranceValidityAndRiskCoverage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity and risk coverage</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Stock Register Maintenance */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="stockRegisterMaintained"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock register maintained?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="stockRegisterUpToDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock register up-to-date?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Book Debts Analysis */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Book Debts Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={control}
                      name="debtorsAgingSubmitted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Debtor aging submitted?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="recoveryMeasuresTaken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recovery measures in place?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="diversionToSisterConcerns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diversion to sister concerns?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={control}
                    name="overdueDebtorsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overdue debtors – details</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Valuation Method */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="valuationMethodConsistentWithPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valuation method consistent with accounting policy?
                      </FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="valuationWorkingProvided"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working for valuation provided?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sales through Bank Account */}
              <FormField
                control={control}
                name="salesThroughBankAccount"
                render={({ field }) => (
                  <FormItem className="md:max-w-xs">
                    <FormLabel>Sales through bank account</FormLabel>
                    <FormControl>
                      <select
                        name={field.name}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        <option value="ENTIRELY">Entirely</option>
                        <option value="PARTIALLY">Partially</option>
                        <option value="NOT_AT_ALL">Not at all</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collaterals */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Collaterals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <FormField
                    control={control}
                    name="collateralsDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={control}
                      name="collateralsValuationReportDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation report date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="collateralsLegalSearchReportDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal search report date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="cersaiChargesRegistered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CERSAI charges registered?</FormLabel>
                          <FormControl>
                            <YesNoNaSelect
                              name={field.name}
                              value={field.value as string | undefined}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
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

          {/* 4. COMPLIANCE & OPERATIONS CHECK */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                4. Compliance &amp; Operations Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="stockStatementsSubmittedTimely"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timely submission of stock statements?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="stockStatementsDelayReasons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>If no, reasons</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Drawing Power (DP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={control}
                      name="dpAsPerBankCalculation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>As per Bank calculation (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="dpAsPerAuditor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>As per Auditor (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={control}
                    name="dpDifferenceAndReasons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difference &amp; reasons</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={control}
                  name="dpRegisterMaintained"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DP register maintained?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="dpRegisterUpToDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DP register up-to-date?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="overdrawingObserved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overdrawing observed?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="overdrawingInstancesCount"
                render={({ field }) => (
                  <FormItem className="md:max-w-xs">
                    <FormLabel>Number of instances (if any)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Visit Reports by Branch Officials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={control}
                      name="lastBranchVisitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last visit date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="branchVisitObservations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observations</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="bankBoardDisplayedAtPremises"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank board displayed at premises?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="otherBankFacilitiesDeclared"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other bank relationships / facilities</FormLabel>
                      <FormControl>
                        <select
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select</option>
                          <option value="DECLARED">Declared</option>
                          <option value="NOT_DECLARED">Not declared</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 5. AUDIT OBSERVATIONS & IRREGULARITIES */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                5. Audit Observations &amp; Irregularities
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tick all observations applicable to the account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  name: 'obsStockStatementsNotSubmittedTimely',
                  label: 'Stock Statements not submitted timely.',
                },
                {
                  name: 'obsObsoleteStockNotExcludedFromDp',
                  label: 'Obsolete stock not excluded from DP calculation.',
                },
                {
                  name: 'obsUnderOrNoInsurance',
                  label: 'Under/No Insurance / Policy without Bank Clause.',
                },
                {
                  name: 'obsDebtorsAgingIncorrect',
                  label: 'Debtors aging incorrect / overdue debtors included in DP.',
                },
                {
                  name: 'obsThirdPartyInventoryIncluded',
                  label: 'Inventory of third parties included.',
                },
                {
                  name: 'obsDiversionOfFundsNoticed',
                  label: 'Diversion of funds noticed.',
                },
                {
                  name: 'obsNonComplianceWithSanctionTerms',
                  label: 'Non-compliance with sanction terms.',
                },
                {
                  name: 'obsDiscrepancyBetweenBooksAndFinancials',
                  label: 'Discrepancy in stock between books and financials.',
                },
                {
                  name: 'obsMisstatementInInsuranceCoverage',
                  label: 'Material misstatement in Insurance location/coverage.',
                },
                {
                  name: 'obsSisterConcernDuesShownAsReceivables',
                  label: 'Sister concern dues improperly shown as receivables.',
                },
                {
                  name: 'obsDisputesWithDebtorsPending',
                  label: 'Disputes/litigation pending with debtors.',
                },
              ].map((item) => (
                <Controller
                  key={item.name}
                  control={control}
                  name={item.name as FieldPath<FormValues>}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <label
                        htmlFor={field.name}
                        className="text-sm text-foreground"
                      >
                        {item.label}
                      </label>
                    </div>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          {/* 6. CONCLUSION & RECOMMENDATIONS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                6. Conclusion &amp; Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={control}
                  name="overallRiskPerception"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall risk perception</FormLabel>
                      <FormControl>
                        <select
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select</option>
                          <option value="HIGH">High</option>
                          <option value="MODERATE">Moderate</option>
                          <option value="LOW">Low</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="sanctionTermsCompliance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance with sanction terms</FormLabel>
                      <FormControl>
                        <select
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select</option>
                          <option value="SATISFACTORY">Satisfactory</option>
                          <option value="NEEDS_IMPROVEMENT">Needs improvement</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="potentialNpaRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Potential of account turning NPA
                      </FormLabel>
                      <FormControl>
                        <select
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select</option>
                          <option value="YES">Yes</option>
                          <option value="NO">No</option>
                          <option value="MONITOR_CLOSELY">Monitor closely</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="correctiveActionsSuggested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrective actions suggested</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="suggestedNextAuditFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suggested frequency of next audit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Half-yearly / Annually"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="discussionHeldWithBorrower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discussion held with borrower?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. AUDITOR’S DECLARATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                7. Auditor&apos;s Declaration
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                As per declaration block in MRB format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="caFirmName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of the CA Firm</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="caFirmRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration No.</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="auditorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auditor&apos;s Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="auditorDeclarationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="auditorSignatureAndSealNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signature &amp; Seal (notes / reference)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="(Physical signature & seal to be affixed on printed report)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || saveMrbReportMutation.isPending}
            >
              {isSubmitting || saveMrbReportMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </MainWrapper>
  )
}

export const Route = createFileRoute(
  '/_authenticated/stock-audit/$accountId/report/$assignmentIdMRB',
)({
  component: RouteComponent,
})
