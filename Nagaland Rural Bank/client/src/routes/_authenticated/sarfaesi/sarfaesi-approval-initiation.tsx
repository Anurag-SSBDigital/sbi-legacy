import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils'
import useBranchDepartmentInfo from '@/hooks/use-branch-department-info.ts'
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

/* =============================
   Route definition with search params
   We accept acctNo, custName, branchCode, address, outstand, city
============================= */
export const Route = createFileRoute(
  '/_authenticated/sarfaesi/sarfaesi-approval-initiation'
)({
  component: RouteComponent,
  validateSearch: z.object({ acctNo: z.string() }).parse,
})

/* =============================
   SARFAESI Approval — API-backed Initiation Form
   Connected to POST /sarfaesi/approvals/create
============================= */

const PersonRowSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  netWorth: z.string().optional(), // UI string → number in payload
})

const DocumentRowSchema = z.object({
  name: z.string().optional(),
  dateOfExecution: z.string().optional(),
})

const TangibleSecurityRowSchema = z.object({
  details: z.string().optional(),
  chargeType: z.string().optional(),
  expectedMarketValue: z.string().optional(), // UI string → number
})

const EnforcedSecurityRowSchema = z.object({
  details: z.string().optional(),
  chargeType: z.string().optional(),
  ownedBy: z.string().optional(),
  expectedMarketValue: z.string().optional(),
  shareOfCharge: z.string().optional(),
})

const FormSchema = z.object({
  // NEW: link to the SARFAESI account
  acctNo: z.string(),

  // Branch & Borrower
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  region: z.string().optional(),

  borrowerName: z.string().optional(),
  borrowerAddress: z.string().optional(),
  constitution: z.string().optional(),

  // Persons
  personDetails: z.array(PersonRowSchema).default([]),

  // Sanction / Facility
  sanctionDate: z.string().optional(),
  sanctionAmount: z.string().optional(),
  facility: z.string().optional(),
  bankingRelationship: z.string().optional(),
  sharePercentage: z.string().optional(),
  activityName: z.string().optional(),
  activityStatus: z.string().optional(),

  // Account status
  npaDate: z.string().optional(),
  presentAssetCategory: z.string().optional(),
  accountStatus: z.string().optional(),
  rehabilitationStatus: z.string().optional(),
  bifrStatus: z.string().optional(),
  suitStatus: z.string().optional(),

  outstandingDues: z.string().optional(),
  totalDues: z.string().optional(),
  taxDuesDetails: z.string().optional(),

  // Documents & limitation
  documentDetails: z.array(DocumentRowSchema).default([]),
  limitationComments: z.string().optional(),

  // Securities
  tangibleSecurities: z.array(TangibleSecurityRowSchema).default([]),
  enforcedSecurities: z.array(EnforcedSecurityRowSchema).default([]),

  marketabilityComments: z.string().optional(),

  // Consent / inter-creditor
  consentRequired: z.enum(['YES', 'NO']).optional(),
  consentBankName: z.string().optional(),
  interCreditorComments: z.string().optional(),

  // Recovery & accountability
  recoveryEfforts: z.string().optional(),
  staffAccountabilityStatus: z.string().optional(),
  branchCategory: z.string().optional(),
  incumbentCadre: z.string().optional(),
  remarks: z.string().optional(),
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
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(n)) return undefined
  return n
}

function RouteComponent() {
  const search = Route.useSearch()

  const { data: customer } = $api.useQuery('get', '/account/getAccountDetail', {
    params: { query: { acctNm: search.acctNo } },
  })

  const { data: branchDepartmentInfo } = useBranchDepartmentInfo(search.acctNo)
  // const branchDepartmentInfo: { accountNo?: string | undefined; branchCode?: string | undefined; branchId?: string | undefined; branchName?: string | undefined; departmentId?: string | undefined; departmentName?: string | undefined; } | undefined

  const customerDetails = customer?.customer

  const form = useForm<FormValues>({
    defaultValues: {
      acctNo: '',
      personDetails: [{ name: '', relationship: '', netWorth: '' }],
      documentDetails: [{ name: '', dateOfExecution: '' }],
      tangibleSecurities: [
        { details: '', chargeType: '', expectedMarketValue: '' },
      ],
      enforcedSecurities: [
        {
          details: '',
          chargeType: '',
          ownedBy: '',
          expectedMarketValue: '',
          shareOfCharge: '',
        },
      ],
      consentRequired: 'NO',
    },
  })

  const { control } = form

  const personFA = useFieldArray({ control, name: 'personDetails' })
  const documentsFA = useFieldArray({ control, name: 'documentDetails' })
  const tangibleFA = useFieldArray({ control, name: 'tangibleSecurities' })
  const enforcedFA = useFieldArray({ control, name: 'enforcedSecurities' })

  // ===== Prefill from SARFAESI Eligible list search params =====
  useEffect(() => {
    if (!search) return

    if (search.acctNo) {
      form.setValue('acctNo', search.acctNo)
    }
    if (customerDetails?.custName) {
      form.setValue('borrowerName', customerDetails?.custName)
    }
    if (customerDetails?.address) {
      form.setValue('borrowerAddress', customerDetails?.address)
    }
    if (customerDetails?.branchCode) {
      form.setValue('branchCode', customerDetails?.branchCode)
    }
    if (customerDetails?.branchName) {
      form.setValue('branchName', customerDetails?.branchName)
    }

    if (
      typeof customerDetails?.outstand !== 'undefined' &&
      customerDetails?.outstand !== null
    ) {
      form.setValue('outstandingDues', String(customerDetails?.outstand))
    }

    const addr = [
      customerDetails?.add1,
      customerDetails?.add2,
      customerDetails?.add3,
      customerDetails?.add4,
    ]
      .filter(Boolean)
      .join(' ')

    if (addr) {
      form.setValue('borrowerAddress', addr)
    }
  }, [customerDetails, form])

  useEffect(() => {
    if (!branchDepartmentInfo) return

    // only set if value not already present (so customerDetails/search can still win)
    const currentBranchCode = form.getValues('branchCode')
    const currentBranchName = form.getValues('branchName')

    if (!currentBranchCode && branchDepartmentInfo.branchCode) {
      form.setValue('branchCode', branchDepartmentInfo.branchCode, {
        shouldDirty: false,
      })
    }

    if (!currentBranchName && branchDepartmentInfo.branchName) {
      form.setValue('branchName', branchDepartmentInfo.branchName, {
        shouldDirty: false,
      })
    }
  }, [branchDepartmentInfo, form])

  const branchLocked =
    Boolean(branchDepartmentInfo?.branchCode) ||
    Boolean(branchDepartmentInfo?.branchName)

  const handleReset = () => {
    form.reset({
      acctNo: search.acctNo ?? '',
      branchCode: customerDetails?.branchCode ?? '',
      borrowerName: customerDetails?.custName ?? '',
      borrowerAddress: customerDetails?.address ?? '',
      outstandingDues:
        typeof customerDetails?.outstand !== 'undefined' &&
        customerDetails?.outstand !== null
          ? String(customerDetails?.outstand)
          : '',
      personDetails: [{ name: '', relationship: '', netWorth: '' }],
      documentDetails: [{ name: '', dateOfExecution: '' }],
      tangibleSecurities: [
        { details: '', chargeType: '', expectedMarketValue: '' },
      ],
      enforcedSecurities: [
        {
          details: '',
          chargeType: '',
          ownedBy: '',
          expectedMarketValue: '',
          shareOfCharge: '',
        },
      ],
      consentRequired: 'NO',
    })
  }

  const navigate = useNavigate()

  const createSarfaesiApprovalMutation = $api.useMutation(
    'post',
    '/sarfaesi/approvals/create',
    {
      onSuccess: () => {
        toast.success('SARFAESI approval initiation submitted successfully!')
        handleReset()
        navigate({ to: '/sarfaesi/eligible' })
      },
      onError: (error) =>
        toastError(
          error,
          'Could not create SARFAESI approval. Please try again.'
        ),
    }
  )

  const onSubmit = (values: FormValues) => {
    const body = {
      acctNo: values.acctNo || undefined,
      accountNo: values.acctNo || undefined,

      branchName: values.branchName || undefined,
      branchCode: values.branchCode || undefined,
      region: values.region || undefined,

      borrowerName: values.borrowerName || undefined,
      borrowerAddress: values.borrowerAddress || undefined,
      constitution: values.constitution || undefined,

      personDetails:
        values.personDetails?.map((p) => ({
          name: p.name || undefined,
          relationship: p.relationship || undefined,
          netWorth: toNumberOrUndefined(p.netWorth),
        })) ?? [],

      sanctionDate: values.sanctionDate || undefined,
      sanctionAmount: toNumberOrUndefined(values.sanctionAmount),
      facility: values.facility || undefined,
      bankingRelationship: values.bankingRelationship || undefined,
      sharePercentage: toNumberOrUndefined(values.sharePercentage),
      activityName: values.activityName || undefined,
      activityStatus: values.activityStatus || undefined,

      npaDate: values.npaDate || undefined,
      presentAssetCategory: values.presentAssetCategory || undefined,
      accountStatus: values.accountStatus || undefined,
      rehabilitationStatus: values.rehabilitationStatus || undefined,
      bifrStatus: values.bifrStatus || undefined,
      suitStatus: values.suitStatus || undefined,

      outstandingDues: toNumberOrUndefined(values.outstandingDues),
      totalDues: toNumberOrUndefined(values.totalDues),
      taxDuesDetails: values.taxDuesDetails || undefined,

      documentDetails:
        values.documentDetails?.map((d) => ({
          name: d.name || undefined,
          dateOfExecution: d.dateOfExecution || undefined,
        })) ?? [],

      limitationComments: values.limitationComments || undefined,

      tangibleSecurities:
        values.tangibleSecurities?.map((t) => ({
          details: t.details || undefined,
          chargeType: t.chargeType || undefined,
          expectedMarketValue: toNumberOrUndefined(t.expectedMarketValue),
        })) ?? [],

      enforcedSecurities:
        values.enforcedSecurities?.map((e) => ({
          details: e.details || undefined,
          chargeType: e.chargeType || undefined,
          ownedBy: e.ownedBy || undefined,
          expectedMarketValue: toNumberOrUndefined(e.expectedMarketValue),
          shareOfCharge: toNumberOrUndefined(e.shareOfCharge),
        })) ?? [],

      marketabilityComments: values.marketabilityComments || undefined,

      consentRequired:
        values.consentRequired === 'YES'
          ? true
          : values.consentRequired === 'NO'
            ? false
            : undefined,

      consentBankName: values.consentBankName || undefined,
      interCreditorComments: values.interCreditorComments || undefined,

      recoveryEfforts: values.recoveryEfforts || undefined,
      staffAccountabilityStatus: values.staffAccountabilityStatus || undefined,
      branchCategory: values.branchCategory || undefined,
      incumbentCadre: values.incumbentCadre || undefined,
      remarks: values.remarks || undefined,
    }

    createSarfaesiApprovalMutation.mutate({
      params: {
        header: {
          // real token will be injected by your interceptor
          Authorization: '',
        },
      },
      body,
    })
  }

  const isSaving = createSarfaesiApprovalMutation.isPending

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
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              SARFAESI Approval — Initiation
            </h1>
            {search.acctNo && (
              <p className='text-muted-foreground mt-1 text-sm'>
                For Account:{' '}
                <span className='font-mono font-semibold'>{search.acctNo}</span>{' '}
                {customerDetails?.custName && (
                  <>
                    · Borrower:{' '}
                    <span className='font-semibold'>
                      {customerDetails?.custName}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
          <Button onClick={() => window.history.back()} className='text-white'>
            Back
          </Button>
        </div>

        <Separator className='my-6' />

        {/* Branch & Borrower */}
        <Card>
          <CardHeader>
            <CardTitle>Branch & Borrower</CardTitle>
            <CardDescription>
              These fields are prefilled from the SARFAESI Eligible Accounts
              list where available.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field
              label='Account Number'
              htmlFor='acctNo'
              hint='Prefilled from SARFAESI Eligible Accounts'
            >
              <Input
                id='acctNo'
                placeholder='0016XXXXXXXXXX'
                disabled
                {...form.register('acctNo')}
              />
            </Field>
            <Field
              label='Branch Code'
              htmlFor='branchCode'
              hint='Prefilled where available'
            >
              <Input
                id='branchCode'
                placeholder='001'
                disabled={branchLocked}
                {...form.register('branchCode')}
              />

              <Input
                id='branchName'
                placeholder='Ahmedabad Main Branch'
                disabled={branchLocked}
                {...form.register('branchName')}
              />
            </Field>
            <Field label='Region' htmlFor='region' hint='Fetch Region Name'>
              <Input
                id='region'
                placeholder='West Zone'
                {...form.register('region')}
              />
            </Field>
            <Field
              label='Borrower Name'
              htmlFor='borrowerName'
              hint='Prefilled where available'
            >
              <Input
                id='borrowerName'
                placeholder='Madhav Textiles Pvt. Ltd.'
                disabled
                {...form.register('borrowerName')}
              />
            </Field>
            <Field
              label='Address'
              htmlFor='borrowerAddress'
              hint='Prefilled from account address where available'
            >
              <Textarea
                id='borrowerAddress'
                placeholder='Plot No. 45, GIDC Industrial Estate, Ahmedabad, Gujarat'
                disabled
                {...form.register('borrowerAddress')}
              />
            </Field>
            <Field
              label='Constitution'
              htmlFor='constitution'
              hint='Fetch Constitution'
            >
              <Input
                id='constitution'
                placeholder='Private Limited Company'
                {...form.register('constitution')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Proprietors / Directors / Members */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Promoters / Directors / Partners</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {personFA.fields.map((f, idx) => (
              <div
                key={f.id}
                className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-12'
              >
                <div className='md:col-span-5'>
                  <Field
                    label='Name'
                    htmlFor={`personDetails.${idx}.name`}
                    hint='Promoter / Director / Partner'
                  >
                    <Input
                      id={`personDetails.${idx}.name`}
                      {...form.register(`personDetails.${idx}.name` as const)}
                    />
                  </Field>
                </div>
                <div className='md:col-span-3'>
                  <Field
                    label='Relationship'
                    htmlFor={`personDetails.${idx}.relationship`}
                  >
                    <Input
                      id={`personDetails.${idx}.relationship`}
                      placeholder='Director / Partner'
                      {...form.register(
                        `personDetails.${idx}.relationship` as const
                      )}
                    />
                  </Field>
                </div>
                <div className='md:col-span-3'>
                  <Field
                    label='Net Worth (₹)'
                    htmlFor={`personDetails.${idx}.netWorth`}
                  >
                    <Input
                      id={`personDetails.${idx}.netWorth`}
                      inputMode='decimal'
                      placeholder='8500000'
                      {...form.register(
                        `personDetails.${idx}.netWorth` as const
                      )}
                    />
                  </Field>
                </div>
                <div className='md:col-span-1'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => personFA.remove(idx)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button
                type='button'
                variant='secondary'
                onClick={() =>
                  personFA.append({
                    name: '',
                    relationship: '',
                    netWorth: '',
                  })
                }
              >
                Add Person
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sanction / Facility */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Sanction / Facility</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='Sanction Date' htmlFor='sanctionDate'>
              <Input
                id='sanctionDate'
                type='date'
                {...form.register('sanctionDate')}
              />
            </Field>
            <Field label='Sanction Amount (₹)' htmlFor='sanctionAmount'>
              <Input
                id='sanctionAmount'
                inputMode='decimal'
                placeholder='25000000'
                {...form.register('sanctionAmount')}
              />
            </Field>
            <Field label='Facility' htmlFor='facility' hint='Fetch from CBS'>
              <Input
                id='facility'
                placeholder='Cash Credit'
                {...form.register('facility')}
              />
            </Field>
            <Field label='Banking Relationship' htmlFor='bankingRelationship'>
              <Input
                id='bankingRelationship'
                placeholder='More than 5 years'
                {...form.register('bankingRelationship')}
              />
            </Field>
            <Field
              label='Share Percentage (%)'
              htmlFor='sharePercentage'
              hint='If consortium / multiple banking'
            >
              <Input
                id='sharePercentage'
                inputMode='decimal'
                placeholder='100'
                {...form.register('sharePercentage')}
              />
            </Field>
            <Field label='Name of Activity' htmlFor='activityName'>
              <Input
                id='activityName'
                placeholder='Textile Manufacturing'
                {...form.register('activityName')}
              />
            </Field>
            <Field label='Status of Activity' htmlFor='activityStatus'>
              <Input
                id='activityStatus'
                placeholder='Operational'
                {...form.register('activityStatus')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='NPA Date' htmlFor='npaDate' hint='Fetch from CBS'>
              <Input id='npaDate' type='date' {...form.register('npaDate')} />
            </Field>
            <Field
              label='Present Asset Category'
              htmlFor='presentAssetCategory'
              hint='Fetch from CBS'
            >
              <Input
                id='presentAssetCategory'
                placeholder='NPA Doubtful'
                {...form.register('presentAssetCategory')}
              />
            </Field>
            <Field label='Account Status' htmlFor='accountStatus'>
              <Input
                id='accountStatus'
                placeholder='Active'
                {...form.register('accountStatus')}
              />
            </Field>
            <Field label='Rehabilitation Status' htmlFor='rehabilitationStatus'>
              <Input
                id='rehabilitationStatus'
                placeholder='Under Consideration'
                {...form.register('rehabilitationStatus')}
              />
            </Field>
            <Field label='BIFR Status' htmlFor='bifrStatus'>
              <Input
                id='bifrStatus'
                placeholder='Not Applicable'
                {...form.register('bifrStatus')}
              />
            </Field>
            <Field label='Suit Status' htmlFor='suitStatus'>
              <Input
                id='suitStatus'
                placeholder='No Legal Action'
                {...form.register('suitStatus')}
              />
            </Field>
            <Field label='Outstanding Dues (₹)' htmlFor='outstandingDues'>
              <Input
                id='outstandingDues'
                inputMode='decimal'
                placeholder='17500000'
                {...form.register('outstandingDues')}
              />
            </Field>
            <Field label='Total Dues (₹)' htmlFor='totalDues'>
              <Input
                id='totalDues'
                inputMode='decimal'
                placeholder='18550000'
                {...form.register('totalDues')}
              />
            </Field>
            <Field label='Tax / GST Dues Details' htmlFor='taxDuesDetails'>
              <Textarea
                id='taxDuesDetails'
                placeholder='No GST overdue'
                {...form.register('taxDuesDetails')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {documentsFA.fields.map((f, idx) => (
              <div
                key={f.id}
                className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-6'
              >
                <Field label='Name' htmlFor={`documentDetails.${idx}.name`}>
                  <Input
                    id={`documentDetails.${idx}.name`}
                    placeholder={
                      idx === 0 ? 'Loan Agreement' : 'Hypothecation Deed'
                    }
                    {...form.register(`documentDetails.${idx}.name` as const)}
                  />
                </Field>
                <Field
                  label='Date of Execution'
                  htmlFor={`documentDetails.${idx}.dateOfExecution`}
                >
                  <Input
                    id={`documentDetails.${idx}.dateOfExecution`}
                    type='date'
                    {...form.register(
                      `documentDetails.${idx}.dateOfExecution` as const
                    )}
                  />
                </Field>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => documentsFA.remove(idx)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Button
                type='button'
                variant='secondary'
                onClick={() =>
                  documentsFA.append({ name: '', dateOfExecution: '' })
                }
              >
                Add Document
              </Button>
            </div>
          </CardContent>
          <CardContent>
            <Field
              label='Limitation & Legal Action Comments'
              htmlFor='limitationComments'
            >
              <Textarea
                id='limitationComments'
                placeholder='Limitation period valid till August 2026'
                {...form.register('limitationComments')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Tangible Securities */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Tangible Securities Available</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {tangibleFA.fields.map((f, idx) => (
              <div
                key={f.id}
                className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-7'
              >
                <Field
                  label='Details'
                  htmlFor={`tangibleSecurities.${idx}.details`}
                >
                  <Input
                    id={`tangibleSecurities.${idx}.details`}
                    placeholder={
                      idx === 0 ? 'Factory Land & Building' : 'Security'
                    }
                    {...form.register(
                      `tangibleSecurities.${idx}.details` as const
                    )}
                  />
                </Field>
                <Field
                  label='Charge Type'
                  htmlFor={`tangibleSecurities.${idx}.chargeType`}
                >
                  <Input
                    id={`tangibleSecurities.${idx}.chargeType`}
                    placeholder='Equitable Mortgage'
                    {...form.register(
                      `tangibleSecurities.${idx}.chargeType` as const
                    )}
                  />
                </Field>
                <Field
                  label='Expected Market Value (₹)'
                  htmlFor={`tangibleSecurities.${idx}.expectedMarketValue`}
                >
                  <Input
                    id={`tangibleSecurities.${idx}.expectedMarketValue`}
                    inputMode='decimal'
                    placeholder={idx === 0 ? '30000000' : ''}
                    {...form.register(
                      `tangibleSecurities.${idx}.expectedMarketValue` as const
                    )}
                  />
                </Field>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => tangibleFA.remove(idx)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Button
                type='button'
                variant='secondary'
                onClick={() =>
                  tangibleFA.append({
                    details: '',
                    chargeType: '',
                    expectedMarketValue: '',
                  })
                }
              >
                Add Tangible Security
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Securities to be Enforced */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Securities Proposed to be Enforced</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {enforcedFA.fields.map((f, idx) => (
              <div
                key={f.id}
                className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-10'
              >
                <Field
                  label='Details'
                  htmlFor={`enforcedSecurities.${idx}.details`}
                >
                  <Input
                    id={`enforcedSecurities.${idx}.details`}
                    placeholder={idx === 0 ? 'Plant and Machinery' : 'Security'}
                    {...form.register(
                      `enforcedSecurities.${idx}.details` as const
                    )}
                  />
                </Field>
                <Field
                  label='Charge Type'
                  htmlFor={`enforcedSecurities.${idx}.chargeType`}
                >
                  <Input
                    id={`enforcedSecurities.${idx}.chargeType`}
                    placeholder='Hypothecation'
                    {...form.register(
                      `enforcedSecurities.${idx}.chargeType` as const
                    )}
                  />
                </Field>
                <Field
                  label='Owned By'
                  htmlFor={`enforcedSecurities.${idx}.ownedBy`}
                >
                  <Input
                    id={`enforcedSecurities.${idx}.ownedBy`}
                    placeholder='Borrower'
                    {...form.register(
                      `enforcedSecurities.${idx}.ownedBy` as const
                    )}
                  />
                </Field>
                <Field
                  label='Expected Market Value (₹)'
                  htmlFor={`enforcedSecurities.${idx}.expectedMarketValue`}
                >
                  <Input
                    id={`enforcedSecurities.${idx}.expectedMarketValue`}
                    inputMode='decimal'
                    placeholder={idx === 0 ? '12000000' : ''}
                    {...form.register(
                      `enforcedSecurities.${idx}.expectedMarketValue` as const
                    )}
                  />
                </Field>
                <Field
                  label='Share of Charge (%)'
                  htmlFor={`enforcedSecurities.${idx}.shareOfCharge`}
                >
                  <Input
                    id={`enforcedSecurities.${idx}.shareOfCharge`}
                    inputMode='decimal'
                    placeholder='100'
                    {...form.register(
                      `enforcedSecurities.${idx}.shareOfCharge` as const
                    )}
                  />
                </Field>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => enforcedFA.remove(idx)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Button
                type='button'
                variant='secondary'
                onClick={() =>
                  enforcedFA.append({
                    details: '',
                    chargeType: '',
                    ownedBy: '',
                    expectedMarketValue: '',
                    shareOfCharge: '',
                  })
                }
              >
                Add Enforced Security
              </Button>
            </div>
          </CardContent>

          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field
              label='Comments on Marketability / Saleability'
              htmlFor='marketabilityComments'
            >
              <Textarea
                id='marketabilityComments'
                placeholder='Property is located in a well-developed industrial area with good resale potential'
                {...form.register('marketabilityComments')}
              />
            </Field>
            <Field
              label='Is consent of other lenders required?'
              htmlFor='consentRequired'
            >
              <Controller
                control={control}
                name='consentRequired'
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'NO'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id='consentRequired'>
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
            <Field
              label='If giving consent to another bank, name the bank'
              htmlFor='consentBankName'
            >
              <Input
                id='consentBankName'
                placeholder='Bank Name'
                {...form.register('consentBankName')}
              />
            </Field>
            <Field
              label='Inter-Creditor Cooperation — Comments'
              htmlFor='interCreditorComments'
            >
              <Textarea
                id='interCreditorComments'
                placeholder='No consortium or multiple banking arrangements'
                {...form.register('interCreditorComments')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Recovery & Accountability */}
        <Card className='mt-6 mb-10'>
          <CardHeader>
            <CardTitle>Recovery & Accountability</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Field label='Recovery Efforts' htmlFor='recoveryEfforts'>
              <Textarea
                id='recoveryEfforts'
                placeholder='Notice issued under SARFAESI Act, follow-up in progress'
                {...form.register('recoveryEfforts')}
              />
            </Field>
            <Field
              label='Staff Accountability Status'
              htmlFor='staffAccountabilityStatus'
            >
              <Input
                id='staffAccountabilityStatus'
                placeholder='No lapses observed'
                {...form.register('staffAccountabilityStatus')}
              />
            </Field>
            <Field label='Branch Category' htmlFor='branchCategory'>
              <Input
                id='branchCategory'
                placeholder='Urban'
                {...form.register('branchCategory')}
              />
            </Field>
            <Field label='Present Incumbent Cadre' htmlFor='incumbentCadre'>
              <Input
                id='incumbentCadre'
                placeholder='Senior Manager'
                {...form.register('incumbentCadre')}
              />
            </Field>
            <Field label='Remarks' htmlFor='remarks'>
              <Textarea
                id='remarks'
                placeholder='Borrower has shown willingness for restructuring'
                {...form.register('remarks')}
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
    </>
  )
}
