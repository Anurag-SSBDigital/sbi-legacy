import React, { useEffect, useState } from 'react'
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

export const Route = createFileRoute(
  '/_authenticated/recalled-assets/transfer'
)({
  component: RouteComponent,
})

/* =============================
   Initiate Transfer to AUCA — API-backed Form
   Connected to:
   - GET  /auca-transfer/AucaEligible/{acctNo}  (for prefill)
   - POST /auca-transfer/create                 (for proposal)
============================= */

const FormSchema = z.object({
  proposalFor: z.string().min(1, 'Required'),
  sanctioningAuth: z.string().min(1, 'Required'),

  borrowerName: z.string().optional(),
  fatherHusbandName: z.string().optional(),
  accountNumber: z.string().optional(),

  loanSanctionDate: z.string().optional(),
  loanSanctionAmt: z.string().optional(),

  npaDate: z.string().optional(),
  outstandingAmt: z.string().optional(),

  transferToDoubtfulDate: z.string().optional(),
  systemDate: z.string().optional(),

  provisionAsOnT1: z.string().optional(),

  securityDetails: z.string().optional(),
  guarantorDetails: z.string().optional(),

  // YES/NO/blank in UI → boolean | undefined in payload
  recoveryByAssetSale: z.enum(['YES', 'NO', '']).default(''),

  lastCollectionDate: z.string().optional(),
  lastCollectionAmt: z.string().optional(),
  totalRecoveryAmt: z.string().optional(),

  inspectionCount: z.string().optional(),
  lastInspectionDate: z.string().optional(),
  inspectingOfficer: z.string().optional(),

  uncollectedInterest: z.string().optional(),
  currentBalance: z.string().optional(),
  updatedInterestReceivable: z.string().optional(),
  totalRecoverableAmt: z.string().optional(),
  creditableToRaAccount: z.string().optional(),

  iracStatus: z.string().optional(),
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

const todayYMD = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type AucaEligibleDetails = {
  acctNo?: string
  custName?: string
  npaDt?: string
  outstand?: number
  acctDesc?: string
  newIrac?: number
}

function RouteComponent() {
  const router = useRouter()
  const search = Route.useSearch() as { acctNo?: string }
  const acctNoFromSearch = search?.acctNo

  const [prefillLoading, setPrefillLoading] = useState(false)

  const form = useForm<FormValues>({
    // resolver: zodResolver(FormSchema),
    defaultValues: {
      proposalFor: '',
      sanctioningAuth: '',
      recoveryByAssetSale: '',
      systemDate: todayYMD(),
    },
  })

  const handleReset = () => {
    form.reset({
      proposalFor: '',
      sanctioningAuth: '',
      recoveryByAssetSale: '',
      systemDate: todayYMD(),
    })
  }

  const createAucaTransferMutation = $api.useMutation(
    'post',
    '/auca-transfer/create',
    {
      onSuccess: () => {
        toast.success('AUCA transfer proposal created successfully!')
        handleReset()
        router.navigate({ to: '/auca/eligible' })
      },
      onError: (error) =>
        toastError(
          error,
          'Could not create AUCA transfer proposal. Please try again.'
        ),
    }
  )

  const { mutate: fetchAucaDetails } = $api.useMutation(
    'get',
    '/auca-transfer/AucaEligible/{acctNo}'
  )

  // Prefill from acctNo (if provided via search)
  useEffect(() => {
    if (!acctNoFromSearch) return

    setPrefillLoading(true)

    fetchAucaDetails(
      {
        params: {
          path: {
            acctNo: acctNoFromSearch,
          },
        },
      },
      {
        onSuccess: (res) => {
          setPrefillLoading(false)
          const body = res as {
            status?: string
            message?: string
            data?: AucaEligibleDetails
          }

          if (!body.data) {
            toast.error('No AUCA details found for this account')
            return
          }

          const d = body.data

          form.reset({
            proposalFor: 'Transfer of NPA account to AUCA as per bank policy',
            sanctioningAuth: 'General Manager – Recovery / AUCA Cell',
            recoveryByAssetSale: '',
            systemDate: todayYMD(),

            borrowerName: d.custName ?? '',
            fatherHusbandName: '',
            accountNumber: d.acctNo ?? '',

            loanSanctionDate: '',
            loanSanctionAmt: '',

            npaDate: d.npaDt ?? '',
            outstandingAmt:
              d.outstand !== undefined && d.outstand !== null
                ? String(d.outstand)
                : '',

            transferToDoubtfulDate: '',
            provisionAsOnT1: '',

            securityDetails: '',
            guarantorDetails: '',

            lastCollectionDate: '',
            lastCollectionAmt: '',
            totalRecoveryAmt: '',

            inspectionCount: '',
            lastInspectionDate: '',
            inspectingOfficer: '',

            uncollectedInterest: '',
            currentBalance:
              d.outstand !== undefined && d.outstand !== null
                ? String(d.outstand)
                : '',
            updatedInterestReceivable: '',
            totalRecoverableAmt: '',
            creditableToRaAccount: '',

            iracStatus:
              d.newIrac !== undefined && d.newIrac !== null
                ? `IRAC Code: ${d.newIrac}`
                : '',
          })
        },
        onError: () => {
          setPrefillLoading(false)
          toast.error('Failed to prefill AUCA details from account')
        },
      }
    )
  }, [acctNoFromSearch, fetchAucaDetails, form])

  const onSubmit = (values: FormValues) => {
    const body = {
      proposalFor: values.proposalFor,
      sanctioningAuth: values.sanctioningAuth,

      borrowerName: values.borrowerName || undefined,
      fatherHusbandName: values.fatherHusbandName || undefined,
      accountNumber: values.accountNumber || undefined,

      loanSanctionDate: values.loanSanctionDate || undefined,
      loanSanctionAmt: toNumberOrUndefined(values.loanSanctionAmt),

      npaDate: values.npaDate || undefined,
      outstandingAmt: toNumberOrUndefined(values.outstandingAmt),

      transferToDoubtfulDate: values.transferToDoubtfulDate || undefined,
      systemDate:
        values.systemDate && values.systemDate.trim().length > 0
          ? values.systemDate
          : todayYMD(),

      provisionAsOnT1: toNumberOrUndefined(values.provisionAsOnT1),

      securityDetails: values.securityDetails || undefined,
      guarantorDetails: values.guarantorDetails || undefined,

      recoveryByAssetSale:
        values.recoveryByAssetSale === 'YES'
          ? true
          : values.recoveryByAssetSale === 'NO'
            ? false
            : undefined,

      lastCollectionDate: values.lastCollectionDate || undefined,
      lastCollectionAmt: toNumberOrUndefined(values.lastCollectionAmt),
      totalRecoveryAmt: toNumberOrUndefined(values.totalRecoveryAmt),

      inspectionCount: toNumberOrUndefined(values.inspectionCount),
      lastInspectionDate: values.lastInspectionDate || undefined,
      inspectingOfficer: values.inspectingOfficer || undefined,

      uncollectedInterest: toNumberOrUndefined(values.uncollectedInterest),
      currentBalance: toNumberOrUndefined(values.currentBalance),
      updatedInterestReceivable: toNumberOrUndefined(
        values.updatedInterestReceivable
      ),
      totalRecoverableAmt: toNumberOrUndefined(values.totalRecoverableAmt),
      creditableToRaAccount: toNumberOrUndefined(values.creditableToRaAccount),

      iracStatus: values.iracStatus || undefined,
    }

    createAucaTransferMutation.mutate({
      params: {
        header: {
          // real token will be injected by your interceptor
          Authorization: '',
        },
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      body,
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
          {/* Proposal */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal</CardTitle>
              <CardDescription>Top-level proposal details</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Proposal for' htmlFor='proposalFor'>
                <Input
                  id='proposalFor'
                  placeholder='Approval for transfer to AUCA'
                  {...form.register('proposalFor')}
                />
              </Field>
              <Field label='Sanctioning Authority' htmlFor='sanctioningAuth'>
                <Input
                  id='sanctioningAuth'
                  placeholder='General Manager – Recovery Department'
                  {...form.register('sanctioningAuth')}
                />
              </Field>
              <Field
                label='System Date'
                htmlFor='systemDate'
                hint='Proposal/system date'
              >
                <Input
                  id='systemDate'
                  type='date'
                  disabled
                  {...form.register('systemDate')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Borrower & Account */}
          <Card>
            <CardHeader>
              <CardTitle>Borrower & Account</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Borrower Name' htmlFor='borrowerName'>
                <Input
                  id='borrowerName'
                  placeholder='Mr. Rajesh Kumar Patel'
                  {...form.register('borrowerName')}
                />
              </Field>
              <Field label='Father / Husband Name' htmlFor='fatherHusbandName'>
                <Input
                  id='fatherHusbandName'
                  placeholder='Late Shri Rameshbhai Patel'
                  {...form.register('fatherHusbandName')}
                />
              </Field>
              <Field label='Account Number' htmlFor='accountNumber'>
                <Input
                  id='accountNumber'
                  placeholder='CC9876543210'
                  {...form.register('accountNumber')}
                />
              </Field>
              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Loan Sanction Date' htmlFor='loanSanctionDate'>
                  <Input
                    id='loanSanctionDate'
                    type='date'
                    {...form.register('loanSanctionDate')}
                  />
                </Field>
                <Field
                  label='Loan Sanction Amount (₹)'
                  htmlFor='loanSanctionAmt'
                >
                  <Input
                    id='loanSanctionAmt'
                    inputMode='decimal'
                    placeholder='2500000'
                    {...form.register('loanSanctionAmt')}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* NPA & Provisioning */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>NPA / Provisioning</CardTitle>
              <CardDescription>
                Key lifecycle dates and provisioning as on T-1
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2'>
              <Field label='NPA Date' htmlFor='npaDate'>
                <Input id='npaDate' type='date' {...form.register('npaDate')} />
              </Field>
              <Field label='Outstanding Amount (₹)' htmlFor='outstandingAmt'>
                <Input
                  id='outstandingAmt'
                  inputMode='decimal'
                  placeholder='2285000'
                  {...form.register('outstandingAmt')}
                />
              </Field>
              <Field
                label='Transfer to Doubtful Date'
                htmlFor='transferToDoubtfulDate'
              >
                <Input
                  id='transferToDoubtfulDate'
                  type='date'
                  {...form.register('transferToDoubtfulDate')}
                />
              </Field>
              <Field label='Provision as on T-1 (₹)' htmlFor='provisionAsOnT1'>
                <Input
                  id='provisionAsOnT1'
                  inputMode='decimal'
                  placeholder='912000'
                  {...form.register('provisionAsOnT1')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Security & Guarantor */}
          <Card>
            <CardHeader>
              <CardTitle>Security Details</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Security Details' htmlFor='securityDetails'>
                <Textarea
                  id='securityDetails'
                  placeholder='Residential house at Chandkheda, Ahmedabad valued at ₹18 lakh and gold ornaments worth ₹2 lakh pledged.'
                  {...form.register('securityDetails')}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guarantor Details</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Guarantor Details' htmlFor='guarantorDetails'>
                <Textarea
                  id='guarantorDetails'
                  placeholder='Mr. Hitesh Patel (CIF1234590), Ahmedabad; personal guarantee supported by Form A.'
                  {...form.register('guarantorDetails')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Recovery & Collections */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Recovery & Collections</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Field
                label='Recovery by Asset Sale?'
                htmlFor='recoveryByAssetSale'
              >
                <Controller
                  control={form.control}
                  name='recoveryByAssetSale'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='recoveryByAssetSale'>
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
              <Field label='Last Collection Date' htmlFor='lastCollectionDate'>
                <Input
                  id='lastCollectionDate'
                  type='date'
                  {...form.register('lastCollectionDate')}
                />
              </Field>
              <Field
                label='Last Collection Amount (₹)'
                htmlFor='lastCollectionAmt'
              >
                <Input
                  id='lastCollectionAmt'
                  inputMode='decimal'
                  placeholder='25000'
                  {...form.register('lastCollectionAmt')}
                />
              </Field>
              <Field
                label='Total Recovery Amount (₹)'
                htmlFor='totalRecoveryAmt'
              >
                <Input
                  id='totalRecoveryAmt'
                  inputMode='decimal'
                  placeholder='275000'
                  {...form.register('totalRecoveryAmt')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Inspections */}
          <Card>
            <CardHeader>
              <CardTitle>Inspections</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field label='Inspection Count' htmlFor='inspectionCount'>
                <Input
                  id='inspectionCount'
                  inputMode='numeric'
                  placeholder='4'
                  {...form.register('inspectionCount')}
                />
              </Field>
              <Field label='Last Inspection Date' htmlFor='lastInspectionDate'>
                <Input
                  id='lastInspectionDate'
                  type='date'
                  {...form.register('lastInspectionDate')}
                />
              </Field>
              <Field label='Inspecting Officer' htmlFor='inspectingOfficer'>
                <Input
                  id='inspectingOfficer'
                  placeholder='Ms. Pooja Sharma, Chief Manager (Recovery)'
                  {...form.register('inspectingOfficer')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Field
                label='Uncollected Interest (₹)'
                htmlFor='uncollectedInterest'
              >
                <Input
                  id='uncollectedInterest'
                  inputMode='decimal'
                  placeholder='184000'
                  {...form.register('uncollectedInterest')}
                />
              </Field>
              <Field label='Current Balance (₹)' htmlFor='currentBalance'>
                <Input
                  id='currentBalance'
                  inputMode='decimal'
                  placeholder='2285000'
                  {...form.register('currentBalance')}
                />
              </Field>
              <Field
                label='Updated Interest Receivable (₹)'
                htmlFor='updatedInterestReceivable'
              >
                <Input
                  id='updatedInterestReceivable'
                  inputMode='decimal'
                  placeholder='215000'
                  {...form.register('updatedInterestReceivable')}
                />
              </Field>
              <Field
                label='Total Recoverable Amount (₹)'
                htmlFor='totalRecoverableAmt'
              >
                <Input
                  id='totalRecoverableAmt'
                  inputMode='decimal'
                  placeholder='2500000'
                  {...form.register('totalRecoverableAmt')}
                />
              </Field>
              <Field
                label='Creditable to RA Account (₹)'
                htmlFor='creditableToRaAccount'
              >
                <Input
                  id='creditableToRaAccount'
                  inputMode='decimal'
                  placeholder='450000'
                  {...form.register('creditableToRaAccount')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* IRAC */}
          <Card>
            <CardHeader>
              <CardTitle>IRAC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label='IRAC Status' htmlFor='iracStatus'>
                <Input
                  id='iracStatus'
                  placeholder='Doubtful – Category II'
                  {...form.register('iracStatus')}
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
      </div>
    </>
  )
}
