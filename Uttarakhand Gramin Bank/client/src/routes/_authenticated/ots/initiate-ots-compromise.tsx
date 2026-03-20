import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
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
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

/** ============================
 *  Search schema (for Link search={{ acctNo }})
 * ============================ */
const SearchSchema = z.object({
  acctNo: z.string().optional(),
})

export const Route = createFileRoute(
  '/_authenticated/ots/initiate-ots-compromise'
)({
  component: RouteComponent,
  validateSearch: (search) => SearchSchema.parse(search),
})

/* =============================
   Annexure-III — OTS / Compromise Form (wired to /otsproposal/create)
============================= */

const FormSchema = z.object({
  // UI only
  selectedAccount: z.string().optional(),

  // Annexure-III fields
  regionalOffice: z.string().optional(), // 1
  branchName: z.string().optional(), // 2
  branchCode: z.string().optional(), // (supporting)
  borrowerName: z.string().optional(), // 3
  loanAccountNo: z.string().optional(), // 4
  activityPurpose: z.string().optional(), // 5

  originalSanctionLimit: z.string().optional(), // 6
  sanctionDate: z.string().optional(), // 7
  npaDate: z.string().optional(), // 8

  assetCategoryT1: z.string().optional(), // 9
  provisionT1: z.string().optional(), // 10
  assetCategoryToday: z.string().optional(), // 11

  outstandingT1: z.string().optional(), // 12
  notionalInterestToDate: z.string().optional(), // 13
  legalCharges: z.string().optional(), // 14

  remissionPercent: z.string().optional(), // 16 (%)
  otsOfferedAmount: z.string().optional(), // 17

  otsPaid25Amount: z.string().optional(), // 19
  otsPaid25Date: z.string().optional(), // 19 date

  otsDue75Amount: z.string().optional(), // 20
  otsDue75Date: z.string().optional(), // 20 date

  totalCreditsSinceSanction: z.string().optional(), // 21
  securityParticulars: z.string().optional(), // 22

  branchManagerUndertaking: z.enum(['YES', 'NO']).optional(), // 23
  staffLapses: z.string().optional(), // 23

  // Recommendation block
  circularNumber: z.string().optional(),
  otsAmountOfferedInWords: z.string().optional(),
  approvedCasesRegister: z.string().optional(),

  // Signatures / recommended by
  date: z.string().optional(),
  fieldOfficerNames: z.string().optional(),
  branchManagerName: z.string().optional(),

  // ROCC approval block
  tgbRoccBusinessManager: z.string().optional(),
  tgbRoccOperationsManager: z.string().optional(),
  tgbRoccRecoveryManager: z.string().optional(),
  tgbRoccRegionalManager: z.string().optional(),
  chairmanRocc: z.string().optional(),

  approvingAuthority: z.string().optional(),
})

export type FormValues = z.infer<typeof FormSchema>

type OtsAccountDetails = {
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
  newIrac?: number | string | null
  oldIrac?: string | null
  arrCond?: string | null
  currency?: string
  maintBr?: number
  instalAmt?: number
  irrgDt?: string
  unrealInt?: number | null
  accrInt?: number | null
  stress?: string | null
  smaCodeIncipientStress?: string | null
  ra?: string | null
  raDate?: string | null
  writeOffFlag?: string | null
  writeOffAmount?: number | null
  writeOffDate?: string | null
  branchCode?: string
  crmDone?: string | null
  actType?: string
  npaCd?: string
  pinCode?: string
  compCd?: number
  closingDt?: string
  overduePeriod?: number
  pts?: string
  area?: string
  city?: string
  district?: string
  state?: string
  secuAmt?: number
  advRec?: number
  npaDt?: string
  renewalDt?: string | null
  dueDt?: string | null
  otsEligible?: boolean
  movedByUser?: string | null
  movedDate?: string | null
}

type OtsAccountDetailsResponse = {
  status?: string
  message?: string
  data?: OtsAccountDetails
}

type BranchDeptInfo = {
  accountNo?: string
  branchCode?: string
  branchId?: string
  branchName?: string
  departmentId?: string
  departmentName?: string
}

type BranchDeptInfoResponse = BranchDeptInfo

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

function RowField({
  no,
  label,
  htmlFor,
  children,
  rightNote,
}: {
  no: string
  label: string
  htmlFor: string
  children: React.ReactNode
  rightNote?: string
}) {
  return (
    <div className='grid grid-cols-12 items-start gap-3'>
      <div className='text-muted-foreground col-span-12 pt-2 text-sm md:col-span-1'>
        {no}
      </div>
      <div className='col-span-12 pt-2 md:col-span-4'>
        <Label htmlFor={htmlFor}>{label}</Label>
        {rightNote ? (
          <div className='text-muted-foreground mt-1 text-xs'>{rightNote}</div>
        ) : null}
      </div>
      <div className='col-span-12 md:col-span-7'>{children}</div>
    </div>
  )
}

function toNumber(v?: string): number {
  const n = Number((v || '').toString().replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function toNumberOrUndefined(v?: string): number | undefined {
  if (!v) return undefined
  const trimmed = v.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(n)) return undefined
  return n
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(n)
}

function normalizeDateOnly(v?: string | null): string {
  if (!v) return ''
  const s = v.trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)
  return s
}

function RouteComponent() {
  const { acctNo } = Route.useSearch()
  const router = useRouter()

  const [accountDetails, setAccountDetails] =
    useState<OtsAccountDetails | null>(null)

  const [branchDeptInfo, setBranchDeptInfo] = useState<BranchDeptInfo | null>(
    null
  )

  const form = useForm<FormValues>({
    defaultValues: {
      branchManagerUndertaking: 'NO',
    },
  })

  const watch = form.watch

  // ✅ Lock only fields that are actually prefilled (CBS OR branch API)
  const lockPrefilled = !!accountDetails || !!branchDeptInfo

  // ===== Derived values =====
  const totalDues = useMemo(() => {
    const vOutstanding = toNumber(watch('outstandingT1'))
    const vInterest = toNumber(watch('notionalInterestToDate'))
    const vLegal = toNumber(watch('legalCharges'))
    return vOutstanding + vInterest + vLegal
  }, [
    watch('outstandingT1'),
    watch('notionalInterestToDate'),
    watch('legalCharges'),
  ])

  const totalLoss = useMemo(() => {
    const dues = totalDues
    const otsAmount = toNumber(watch('otsOfferedAmount'))
    return Math.max(dues - otsAmount, 0)
  }, [totalDues, watch('otsOfferedAmount')])

  const remissionAmount = useMemo(() => {
    const pct = toNumber(watch('remissionPercent'))
    if (!pct) return 0
    return (totalDues * pct) / 100
  }, [totalDues, watch('remissionPercent')])

  // ===== Mutation for /otsproposal/create =====
  const createOTSMutation = $api.useMutation('post', '/otsproposal/create', {
    onSuccess: () => {
      toast.success('OTS proposal created successfully!')

      setAccountDetails(null)
      setBranchDeptInfo(null)
      form.reset({
        branchManagerUndertaking: 'NO',
      })

      router.navigate({ to: '/ots/eligible' })
    },
    onError: (error) =>
      toastError(error, 'Could not create OTS proposal. Please try again.'),
  })

  // ===== Prefill from OTS account API =====
  const { mutate: fetchAccountDetails } = $api.useMutation(
    'get',
    '/otsproposal/OtsAccount/{acctNo}'
  )

  // ✅ Branch/Dept info API (same style as your recalled-assets flow)
  // If your backend route name differs, update it here.
  const { mutate: fetchBranchDeptInfo } = $api.useMutation(
    'get',
    '/branches/{accountNumber}/branch-department-info'
  )

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

      const current = form.getValues(name) as unknown
      const currentStr = typeof current === 'string' ? current : ''
      if (currentStr && currentStr.trim().length > 0) return

      form.setValue(name, v, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    },
    [form]
  )

  useEffect(() => {
    if (!acctNo) return

    // 1) Fetch CBS/OTS account details
    fetchAccountDetails(
      {
        params: { path: { acctNo } },
      },
      {
        onSuccess: (res) => {
          const body = res as OtsAccountDetailsResponse
          if (!body?.data) {
            toast.error('Could not load OTS account details for prefill')
            return
          }

          const d = body.data
          setAccountDetails(d)

          // Reset full form (best effort) — but keep branchName/regionalOffice to be set by branch API
          form.reset({
            branchManagerUndertaking: 'NO',
            selectedAccount: d.acctNo ?? acctNo,

            // 1-5
            regionalOffice: '', // will be filled from branch dept API (departmentName best-effort)
            branchName: '', // will be filled from branch dept API (branchName)
            branchCode: d.branchCode ?? '',
            borrowerName: d.custName ?? '',
            loanAccountNo: d.acctNo ?? '',
            activityPurpose: d.acctDesc ?? '',

            // 6-8
            originalSanctionLimit:
              d.loanLimit !== undefined ? String(d.loanLimit) : '',
            sanctionDate: normalizeDateOnly(d.sanctDt),
            npaDate: normalizeDateOnly(d.npaDt),

            // 9-11
            assetCategoryT1: d.npaCd ?? '',
            provisionT1: '',
            assetCategoryToday: d.npaCd ?? '',

            // 12-14 (abs because many CBS sends negative outstanding)
            outstandingT1:
              d.outstand !== undefined ? String(Math.abs(d.outstand)) : '',
            notionalInterestToDate:
              d.unrealInt !== null && d.unrealInt !== undefined
                ? String(d.unrealInt)
                : d.accrInt !== null && d.accrInt !== undefined
                  ? String(d.accrInt)
                  : '',
            legalCharges: '',

            // rest empty (manual)
            remissionPercent: '',
            otsOfferedAmount: '',
            otsPaid25Amount: '',
            otsPaid25Date: '',
            otsDue75Amount: '',
            otsDue75Date: '',
            totalCreditsSinceSanction:
              d.advRec !== undefined ? String(d.advRec) : '',
            securityParticulars: '',
            staffLapses: '',

            circularNumber: '',
            otsAmountOfferedInWords: '',
            approvedCasesRegister: '',
            approvingAuthority: '',

            date: '',
            fieldOfficerNames: '',
            branchManagerName: '',

            tgbRoccBusinessManager: '',
            tgbRoccOperationsManager: '',
            tgbRoccRecoveryManager: '',
            tgbRoccRegionalManager: '',
            chairmanRocc: '',
          })

          // If CBS already gave branchCode, we can also try to set it safely
          setIfBlankAndNotDirty('branchCode', d.branchCode ?? '')
        },
        onError: () => {
          toast.error('Failed to fetch OTS account details for prefill')
        },
      }
    )

    // 2) Fetch Branch/Dept info (fills branchName + “regionalOffice” best-effort)
    fetchBranchDeptInfo(
      {
        params: {
          path: { accountNumber: acctNo },
        },
      },
      {
        onSuccess: (res) => {
          const info = res as BranchDeptInfoResponse
          setBranchDeptInfo(info ?? null)

          // ✅ Fill branch fields
          setIfBlankAndNotDirty('branchName', info?.branchName ?? '')
          setIfBlankAndNotDirty('branchCode', info?.branchCode ?? '')

          /**
           * ✅ Regional office:
           * Your sample response has departmentName, not RO name.
           * Best-effort mapping:
           * - regionalOffice = departmentName (until you provide real RO field / endpoint)
           */
          setIfBlankAndNotDirty('regionalOffice', info?.departmentName ?? '')
        },
        onError: () => {
          // don't block; form can still work with CBS data
        },
      }
    )
  }, [
    acctNo,
    fetchAccountDetails,
    fetchBranchDeptInfo,
    form,
    setIfBlankAndNotDirty,
  ])

  const onSubmit = (values: FormValues) => {
    const totalDuesNumber = totalDues || 0
    const totalLossNumber = totalLoss || 0

    createOTSMutation.mutate({
      params: { header: { Authorization: '' } },
      body: {
        bankFormat: 'TGB',
        regionalOffice: values.regionalOffice || undefined,
        branchName: values.branchName || undefined,
        branchCode: values.branchCode || undefined,
        borrowerName: values.borrowerName || undefined,
        loanAccountNo: values.loanAccountNo || undefined,
        activityPurpose: values.activityPurpose || undefined,

        originalSanctionLimit: toNumberOrUndefined(
          values.originalSanctionLimit
        ),
        sanctionDate: values.sanctionDate || undefined,
        npaDate: values.npaDate || undefined,

        assetCategoryT1: values.assetCategoryT1 || undefined,
        tgbAssetCategory2024: values.assetCategoryT1 || undefined,
        provisionT1: toNumberOrUndefined(values.provisionT1),
        tgbProvision2024: toNumberOrUndefined(values.provisionT1),
        assetCategoryToday: values.assetCategoryToday || undefined,

        outstandingT1: toNumberOrUndefined(values.outstandingT1),
        notionalInterestToDate: toNumberOrUndefined(
          values.notionalInterestToDate
        ),
        legalCharges: toNumberOrUndefined(values.legalCharges),

        totalDues: totalDuesNumber,
        remissionPercent: toNumberOrUndefined(values.remissionPercent),
        otsOfferedAmount: toNumberOrUndefined(values.otsOfferedAmount),
        totalLoss: totalLossNumber,

        otsPaid25Amount: toNumberOrUndefined(values.otsPaid25Amount),
        otsPaid25Date: values.otsPaid25Date || undefined,
        otsDue75Amount: toNumberOrUndefined(values.otsDue75Amount),
        otsDue75Date: values.otsDue75Date || undefined,

        totalCreditsSinceSanction: toNumberOrUndefined(
          values.totalCreditsSinceSanction
        ),
        securityParticulars: values.securityParticulars || undefined,

        branchManagerUndertaking:
          values.branchManagerUndertaking === 'YES'
            ? true
            : values.branchManagerUndertaking === 'NO'
              ? false
              : undefined,

        staffLapses: values.staffLapses || undefined,

        circularNumber: values.circularNumber || undefined,
        otsAmountOfferedInWords: values.otsAmountOfferedInWords || undefined,
        approvedCasesRegister: values.approvedCasesRegister || undefined,
        approvingAuthority: values.approvingAuthority || undefined,

        totalDuesAmount: totalDuesNumber,
        totalLossAmount: totalLossNumber,

        tgbRoccBusinessManager: values.tgbRoccBusinessManager || undefined,
        tgbRoccOperationsManager: values.tgbRoccOperationsManager || undefined,
        tgbRoccRecoveryManager: values.tgbRoccRecoveryManager || undefined,
        tgbRoccRegionalManager: values.tgbRoccRegionalManager || undefined,
        // chairmanRocc: values.chairmanRocc || undefined,
      },
    })
  }

  const isSaving = createOTSMutation.isPending

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
              Annexure-III — Settlement of dues under OTS
            </h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              Format for settlement of dues under OTS (fields prefilled from CBS
              where available).
            </p>
          </div>
          <Button onClick={() => window.history.back()} className='text-white'>
            Back
          </Button>
        </div>

        <Separator className='my-6' />

        <Card>
          <CardHeader>
            <CardTitle>Annexure-III</CardTitle>
            <CardDescription>
              Fill the proposal details below. Computed fields are auto-filled.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-5'>
            <RowField
              no='1'
              label='Regional Office'
              htmlFor='regionalOffice'
              rightNote='(prefilled best-effort from Branch Dept API)'
            >
              <Input
                id='regionalOffice'
                placeholder='Regional Office'
                {...form.register('regionalOffice')}
                readOnly={lockPrefilled}
              />
            </RowField>

            <RowField no='2' label='Branch' htmlFor='branchName'>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <Input
                  id='branchName'
                  placeholder='Branch Name'
                  {...form.register('branchName')}
                  readOnly={lockPrefilled}
                />
                <Input
                  id='branchCode'
                  placeholder='Branch Code'
                  {...form.register('branchCode')}
                  readOnly={lockPrefilled}
                />
              </div>
            </RowField>

            <RowField
              no='3'
              label='Name of the Borrower'
              htmlFor='borrowerName'
            >
              <Input
                id='borrowerName'
                placeholder='Borrower Name'
                {...form.register('borrowerName')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='4'
              label='Loan account number'
              htmlFor='loanAccountNo'
            >
              <Input
                id='loanAccountNo'
                placeholder='Loan Account Number'
                {...form.register('loanAccountNo')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='5'
              label='Activity / Purpose'
              htmlFor='activityPurpose'
            >
              <Input
                id='activityPurpose'
                placeholder='Activity / Purpose'
                {...form.register('activityPurpose')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='6'
              label='Original Limit (₹)'
              htmlFor='originalSanctionLimit'
            >
              <Input
                id='originalSanctionLimit'
                inputMode='decimal'
                placeholder='0'
                {...form.register('originalSanctionLimit')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField no='7' label='Date of Sanction' htmlFor='sanctionDate'>
              <Input
                id='sanctionDate'
                type='date'
                {...form.register('sanctionDate')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField no='8' label='Date of NPA' htmlFor='npaDate'>
              <Input
                id='npaDate'
                type='date'
                {...form.register('npaDate')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='9'
              label='Asset category as on today'
              htmlFor='assetCategoryT1'
            >
              <Input
                id='assetCategoryT1'
                placeholder='DA-1 / DA-2 / DA-3 / Loss / AUCA / Writtenoff ...'
                {...form.register('assetCategoryT1')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='10'
              label='Provision made as on today (₹)'
              htmlFor='provisionT1'
            >
              <Input
                id='provisionT1'
                inputMode='decimal'
                placeholder='0'
                {...form.register('provisionT1')}
              />
            </RowField>

            <RowField
              no='11'
              label='Asset Category of the account as on date of Application'
              htmlFor='assetCategoryToday'
            >
              <Input
                id='assetCategoryToday'
                placeholder='DA-1 / DA-2 / DA-3 / Loss / AUCA / Writtenoff / ...'
                {...form.register('assetCategoryToday')}
              />
            </RowField>

            <RowField
              no='12'
              label='Present outstanding as on the Date of Application (₹)'
              htmlFor='outstandingT1'
            >
              <Input
                id='outstandingT1'
                inputMode='decimal'
                placeholder='0'
                {...form.register('outstandingT1')}
                readOnly={!!accountDetails}
              />
            </RowField>

            <RowField
              no='13'
              label='Notional interest up to the date of application (₹)'
              htmlFor='notionalInterestToDate'
            >
              <Input
                id='notionalInterestToDate'
                inputMode='decimal'
                placeholder='0'
                {...form.register('notionalInterestToDate')}
              />
            </RowField>

            <RowField
              no='14'
              label='Legal / Other Charges (₹)'
              htmlFor='legalCharges'
            >
              <Input
                id='legalCharges'
                inputMode='decimal'
                placeholder='0'
                {...form.register('legalCharges')}
              />
            </RowField>

            <RowField
              no='15'
              label='TOTAL DUES (12 + 13 + 14) (₹)'
              htmlFor='totalDuesDisplay'
            >
              <Input
                id='totalDuesDisplay'
                value={formatMoney(totalDues)}
                readOnly
                disabled
              />
            </RowField>

            <RowField
              no='16'
              label='% of remission and amount eligible for OTS (₹)'
              htmlFor='remissionPercent'
            >
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <Input
                  id='remissionPercent'
                  inputMode='decimal'
                  placeholder='%'
                  {...form.register('remissionPercent')}
                />
                <Input
                  id='remissionAmountDisplay'
                  value={formatMoney(remissionAmount)}
                  readOnly
                  disabled
                />
              </div>
            </RowField>

            <RowField
              no='17'
              label='OTS amount offered (₹)'
              htmlFor='otsOfferedAmount'
            >
              <Input
                id='otsOfferedAmount'
                inputMode='decimal'
                placeholder='0'
                {...form.register('otsOfferedAmount')}
              />
            </RowField>

            <RowField
              no='18'
              label='Total Loss (15 - 17) (₹)'
              htmlFor='totalLossDisplay'
            >
              <Input
                id='totalLossDisplay'
                value={formatMoney(totalLoss)}
                readOnly
                disabled
              />
            </RowField>

            <RowField
              no='19'
              label='25% of OTS offer amount paid on (date) — Amount (₹)'
              htmlFor='otsPaid25Amount'
            >
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <Input
                  id='otsPaid25Amount'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('otsPaid25Amount')}
                />
                <Input
                  id='otsPaid25Date'
                  type='date'
                  {...form.register('otsPaid25Date')}
                />
              </div>
            </RowField>

            <RowField
              no='20'
              label='75% of remaining OTS offer amount to be paid on (date) — Amount (₹)'
              htmlFor='otsDue75Amount'
            >
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <Input
                  id='otsDue75Amount'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('otsDue75Amount')}
                />
                <Input
                  id='otsDue75Date'
                  type='date'
                  {...form.register('otsDue75Date')}
                />
              </div>
            </RowField>

            <RowField
              no='21'
              label='Total credits in the account since sanction (₹)'
              htmlFor='totalCreditsSinceSanction'
            >
              <Input
                id='totalCreditsSinceSanction'
                inputMode='decimal'
                placeholder='0'
                {...form.register('totalCreditsSinceSanction')}
              />
            </RowField>

            <RowField
              no='22'
              label='Security Particulars'
              htmlFor='securityParticulars'
            >
              <Textarea
                id='securityParticulars'
                placeholder='Security particulars...'
                {...form.register('securityParticulars')}
              />
            </RowField>

            <RowField
              no='23'
              label='Undertaking given by the Branch Manager (Yes/No)'
              htmlFor='branchManagerUndertaking'
            >
              <Controller
                control={form.control}
                name='branchManagerUndertaking'
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'NO'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id='branchManagerUndertaking'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='YES'>Yes</SelectItem>
                      <SelectItem value='NO'>No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </RowField>

            <RowField no='23' label='Staff lapses if any' htmlFor='staffLapses'>
              <Textarea
                id='staffLapses'
                placeholder='Staff lapses (if any)...'
                {...form.register('staffLapses')}
              />
            </RowField>
          </CardContent>
        </Card>

        {/* Specific recommendations */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>
              Specific recommendations for considering the proposal
            </CardTitle>
            <CardDescription>
              Auto-narrative uses your entered values + computed dues/loss.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Field label='Circular No. (…/2024-25)' htmlFor='circularNumber'>
                <Input
                  id='circularNumber'
                  placeholder='Circular No. /2024-25'
                  {...form.register('circularNumber')}
                />
              </Field>

              <Field
                label='Approved Cases Register'
                htmlFor='approvedCasesRegister'
              >
                <Input
                  id='approvedCasesRegister'
                  placeholder='Register reference'
                  {...form.register('approvedCasesRegister')}
                />
              </Field>

              <Field
                label='OTS Amount Offered (in words)'
                htmlFor='otsAmountOfferedInWords'
              >
                <Input
                  id='otsAmountOfferedInWords'
                  placeholder='Rupees ... only'
                  {...form.register('otsAmountOfferedInWords')}
                />
              </Field>

              <Field label='Approving Authority' htmlFor='approvingAuthority'>
                <Input
                  id='approvingAuthority'
                  placeholder='Approving Authority'
                  {...form.register('approvingAuthority')}
                />
              </Field>
            </div>

            <Separator />

            <div className='rounded-md border p-4'>
              <p className='text-sm leading-6'>
                In view of the foregoing, we confirm that the applicant is
                eligible for relief in terms of our circular No.{' '}
                <strong>{form.watch('circularNumber') || '________'}</strong>{' '}
                and recommend for acceptance of the OTS offer of ₹{' '}
                <strong>
                  {formatMoney(toNumber(form.watch('otsOfferedAmount')))}
                </strong>{' '}
                (Rupees:{' '}
                <em>
                  {form.watch('otsAmountOfferedInWords') ||
                    '__________________'}
                </em>{' '}
                only) towards full and final settlement of dues to be paid by
                the borrower amounting to ₹{' '}
                <strong>{formatMoney(totalDues)}</strong> to the Bank resulting
                in Loss of ₹ <strong>{formatMoney(totalLoss)}</strong>. We note
                to record the particulars of approved cases in a separate
                register as advised in the circular (
                <strong>
                  {form.watch('approvedCasesRegister') || '________'}
                </strong>
                ).
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Field label='Date' htmlFor='date'>
                <Input id='date' type='date' {...form.register('date')} />
              </Field>

              <Field
                label='Recommended by — Field Officer(s)'
                htmlFor='fieldOfficerNames'
              >
                <Input
                  id='fieldOfficerNames'
                  placeholder='Name(s)'
                  {...form.register('fieldOfficerNames')}
                />
              </Field>

              <Field label='Branch Manager — Name' htmlFor='branchManagerName'>
                <Input
                  id='branchManagerName'
                  placeholder='Name'
                  {...form.register('branchManagerName')}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ROCC approval */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>ROCC Approval</CardTitle>
            <CardDescription>
              Scrutinised / verified the above proposal which is in conformity
              of the extant instructions…
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='rounded-md border p-4 text-sm leading-6'>
              Scrutinised / verified the above proposal which is in conformity
              of the extant instructions issued by Head Office vide circular No.
              /2024-25, we confirm that the proposal has been thoroughly
              scrutinised and there are no staff lapses in sanction,
              documentation and monitoring of the above loan(s). Approval for
              OTS accorded for ₹_________ resulting in loss of ₹_________.
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Field
                label='Chief/Sr. Manager (Business)'
                htmlFor='tgbRoccBusinessManager'
              >
                <Input
                  id='tgbRoccBusinessManager'
                  placeholder='Name'
                  {...form.register('tgbRoccBusinessManager')}
                />
              </Field>

              <Field
                label='Chief/Sr. Manager (Operations)'
                htmlFor='tgbRoccOperationsManager'
              >
                <Input
                  id='tgbRoccOperationsManager'
                  placeholder='Name'
                  {...form.register('tgbRoccOperationsManager')}
                />
              </Field>

              <Field
                label='Recovery Manager (Desk Officer)'
                htmlFor='tgbRoccRecoveryManager'
              >
                <Input
                  id='tgbRoccRecoveryManager'
                  placeholder='Name'
                  {...form.register('tgbRoccRecoveryManager')}
                />
              </Field>

              <Field label='Regional Manager' htmlFor='tgbRoccRegionalManager'>
                <Input
                  id='tgbRoccRegionalManager'
                  placeholder='Name'
                  {...form.register('tgbRoccRegionalManager')}
                />
              </Field>

              {/* <Field label='Chairman - ROCC' htmlFor='chairmanRocc'>
                <Input
                  id='chairmanRocc'
                  placeholder='Name'
                  {...form.register('chairmanRocc')}
                />
              </Field> */}
            </div>
          </CardContent>

          <CardFooter className='justify-end'>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  if (accountDetails || branchDeptInfo) {
                    form.reset({
                      ...form.getValues(),
                      branchManagerUndertaking: 'NO',
                      provisionT1: '',
                      legalCharges: '',
                      remissionPercent: '',
                      otsOfferedAmount: '',
                      otsPaid25Amount: '',
                      otsPaid25Date: '',
                      otsDue75Amount: '',
                      otsDue75Date: '',
                      securityParticulars: '',
                      staffLapses: '',
                      circularNumber: '',
                      otsAmountOfferedInWords: '',
                      approvedCasesRegister: '',
                      approvingAuthority: '',
                      date: '',
                      fieldOfficerNames: '',
                      branchManagerName: '',
                      tgbRoccBusinessManager: '',
                      tgbRoccOperationsManager: '',
                      tgbRoccRecoveryManager: '',
                      tgbRoccRegionalManager: '',
                      chairmanRocc: '',
                    })
                  } else {
                    form.reset({ branchManagerUndertaking: 'NO' })
                  }
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                onClick={form.handleSubmit(onSubmit)}
                className='text-white'
                disabled={isSaving}
              >
                {isSaving ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
//
