import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
   AUCA Transfer — API-backed Form
   Target payload schema:
   {
     accountNumber, borrowerName, loanPurpose, loanSanctionDate, npaDate,
     limit, outstanding, accruedInterestAmount, includingAccruedInterest,
     securityValue, recommendationDetails
   }
============================= */

const FormSchema = z.object({
  accountNumber: z.string().min(1, 'Required'),
  borrowerName: z.string().min(1, 'Required'),
  loanPurpose: z.string().min(1, 'Required'),

  // ✅ NEW (read-only)
  branchCode: z.string().optional(),
  branchName: z.string().optional(),
  regionalOffice: z.string().optional(), // departmentName

  loanSanctionDate: z.string().min(1, 'Required'),
  npaDate: z.string().min(1, 'Required'),

  limit: z.string().min(1, 'Required'),
  outstanding: z.string().min(1, 'Required'),
  accruedInterestAmount: z.string().optional(),
  includingAccruedInterest: z.string().optional(),
  securityValue: z.string().optional(),

  recommendationDetails: z.string().min(1, 'Required'),
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

// type AucaEligibleDetails = Partial<{
//   accountNumber: string
//   borrowerName: string
//   loanPurpose: string
//   loanSanctionDate: string
//   npaDate: string
//   limit: number
//   outstanding: number
//   accruedInterestAmount: number
//   includingAccruedInterest: number
//   securityValue: number
//   recommendationDetails: string
// }>

function RouteComponent() {
  const router = useRouter()
  const search = Route.useSearch() as { acctNo?: string }
  const acctNoFromSearch = search?.acctNo

  const [prefillLoading, setPrefillLoading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      accountNumber: acctNoFromSearch ?? '',
      borrowerName: '',
      loanPurpose: '',

      // ✅ NEW
      branchCode: '',
      branchName: '',
      regionalOffice: '',

      loanSanctionDate: '',
      npaDate: '',

      limit: '',
      outstanding: '',
      accruedInterestAmount: '0',
      includingAccruedInterest: '',
      securityValue: '0',

      recommendationDetails: '',
    },
  })

  const handleReset = () => {
    form.reset({
      accountNumber: acctNoFromSearch ?? '',
      borrowerName: '',
      loanPurpose: '',

      // ✅ NEW
      branchCode: form.getValues('branchCode') ?? '',
      branchName: form.getValues('branchName') ?? '',
      regionalOffice: form.getValues('regionalOffice') ?? '',

      loanSanctionDate: '',
      npaDate: '',

      limit: '',
      outstanding: '',
      accruedInterestAmount: '0',
      includingAccruedInterest: '',
      securityValue: '0',

      recommendationDetails: '',
    })
  }

  const { data: branchDepartmentInfo, isLoading: branchDepartmentInfoLoading } =
    $api.useQuery('get', '/branches/{accountNumber}/branch-department-info', {
      params: { path: { accountNumber: acctNoFromSearch ?? '' } },
    })

  useEffect(() => {
    if (!acctNoFromSearch) return
    if (!branchDepartmentInfo) return

    const info = branchDepartmentInfo

    form.setValue('branchCode', info?.branchCode ?? '', { shouldDirty: false })
    form.setValue('branchName', info?.branchName ?? '', { shouldDirty: false })
    form.setValue('regionalOffice', info?.departmentName ?? '', {
      shouldDirty: false,
    })
  }, [acctNoFromSearch, branchDepartmentInfo, form])

  // ---- POST create (keep your existing endpoint)
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
        toastError(error, 'Could not create AUCA transfer proposal.'),
    }
  )

  // ---- GET prefill (keep your existing endpoint; map whatever it returns)
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

          const body = res

          if (!body.data) {
            toast.error('No AUCA details found for this account')
            return
          }

          const d = body.data

          // Derive includingAccruedInterest if server didn’t send it
          const limitStr =
            d.loanLimit !== undefined && d.loanLimit !== null
              ? String(d.loanLimit)
              : ''
          const outstandingStr =
            d.outstand !== undefined && d.outstand !== null
              ? String(d.outstand)
              : ''
          // const accruedStr =
          //   d.accruedInterestAmount !== undefined &&
          //   d.accruedInterestAmount !== null
          //     ? String(d.accruedInterestAmount)
          //     : '0'

          // const includingDerived =
          //   d.includingAccruedInterest !== undefined &&
          //   d.includingAccruedInterest !== null
          //     ? String(d.includingAccruedInterest)
          //     : String(
          //         toNumberOrZero(outstandingStr) + toNumberOrZero(accruedStr)
          //       )

          form.reset({
            accountNumber: d.acctNo ?? acctNoFromSearch ?? '',
            borrowerName: d.custName ?? '',
            loanPurpose: d.acctDesc ?? '',

            // ✅ NEW: keep the branch/RO values already set from branchDepartmentInfo
            branchCode: form.getValues('branchCode') ?? '',
            branchName: form.getValues('branchName') ?? '',
            regionalOffice: form.getValues('regionalOffice') ?? '',

            loanSanctionDate: d.sanctDt ?? '',
            npaDate: d.npaDt ?? '',

            limit: limitStr,
            outstanding: outstandingStr,

            securityValue:
              d.secuAmt !== undefined && d.secuAmt !== null
                ? String(d.secuAmt)
                : '0',

            recommendationDetails:
              form.getValues('recommendationDetails') ?? '',
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
    const outstanding = toNumberOrZero(values.outstanding)
    const accrued = toNumberOrZero(values.accruedInterestAmount)
    const including =
      toNumberOrUndefined(values.includingAccruedInterest) ??
      outstanding + accrued

    createAucaTransferMutation.mutate({
      params: {
        header: {
          Authorization: '',
        },
      },
      body: {
        bankType: 'TGB',
        accountNumber: values.accountNumber.trim(),
        borrowerName: values.borrowerName.trim(),
        loanPurpose: values.loanPurpose.trim(),

        branchCode: values.branchCode?.trim() || undefined,
        branchName: values.branchName?.trim() || undefined,
        regionalOffice: values.regionalOffice?.trim() || undefined,

        loanSanctionDate: values.loanSanctionDate,
        npaDate: values.npaDate,

        loanSanctionAmt: toNumberOrZero(values.limit),
        outstandingAmt: outstanding,
        accruedInterestAmount: accrued,
        includingUnappliedInterest: including,

        securityValue: toNumberOrZero(values.securityValue),
        tgbConfirmationStatement: values.recommendationDetails.trim(),
      },
    })
  }

  const isSaving = createAucaTransferMutation.isPending

  // Keep includingAccruedInterest live-updated as outstanding/accrued changes
  const outstandingWatch = form.watch('outstanding')
  const accruedWatch = form.watch('accruedInterestAmount')
  useEffect(() => {
    const next = String(
      toNumberOrZero(outstandingWatch) + toNumberOrZero(accruedWatch)
    )
    // setValue without marking dirty too aggressively
    form.setValue('includingAccruedInterest', next, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })
  }, [outstandingWatch, accruedWatch, form])

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
          {/* Account & Borrower */}
          <Card>
            <CardHeader>
              <CardTitle>Account & Borrower</CardTitle>
              <CardDescription>
                Basic account and borrower details
              </CardDescription>
            </CardHeader>

            <CardContent className='grid gap-4'>
              <Field label='Account Number' htmlFor='accountNumber'>
                <Input
                  id='accountNumber'
                  placeholder='LN9876543210'
                  {...form.register('accountNumber')}
                />
              </Field>

              {/* ✅ NEW: Branch / RO */}
              <div className='grid gap-4 md:grid-cols-3'>
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

                <Field label='Regional Office' htmlFor='regionalOffice'>
                  <Input
                    id='regionalOffice'
                    disabled
                    placeholder={branchDepartmentInfoLoading ? 'Loading…' : '—'}
                    {...form.register('regionalOffice')}
                  />
                </Field>
              </div>

              <Field label='Borrower Name' htmlFor='borrowerName'>
                <Input
                  id='borrowerName'
                  placeholder='M/s Shree Textiles Pvt. Ltd.'
                  {...form.register('borrowerName')}
                />
              </Field>

              <Field label='Loan Purpose' htmlFor='loanPurpose'>
                <Textarea
                  id='loanPurpose'
                  placeholder='Working Capital Term Loan for Textile Manufacturing Unit'
                  {...form.register('loanPurpose')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Key Dates</CardTitle>
              <CardDescription>Sanction and NPA dates</CardDescription>
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
            </CardContent>
          </Card>

          {/* Limits & Outstanding */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Limits & Outstanding</CardTitle>
              <CardDescription>Amounts in ₹ (numbers only)</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Field label='Limit (₹)' htmlFor='limit'>
                <Input
                  id='limit'
                  inputMode='decimal'
                  placeholder='15000000'
                  {...form.register('limit')}
                />
              </Field>

              <Field label='Outstanding (₹)' htmlFor='outstanding'>
                <Input
                  id='outstanding'
                  inputMode='decimal'
                  placeholder='13850000'
                  {...form.register('outstanding')}
                />
              </Field>

              <Field
                label='Accrued Interest Amount (₹)'
                htmlFor='accruedInterestAmount'
                hint='If unknown, keep 0'
              >
                <Input
                  id='accruedInterestAmount'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('accruedInterestAmount')}
                />
              </Field>

              <Field
                label='Including Accrued Interest (₹)'
                htmlFor='includingAccruedInterest'
                hint='Auto-calculated = Outstanding + Accrued Interest'
              >
                <Input
                  id='includingAccruedInterest'
                  inputMode='decimal'
                  disabled
                  {...form.register('includingAccruedInterest')}
                />
              </Field>

              <Field
                label='Security Value (₹)'
                htmlFor='securityValue'
                hint='If negligible/unknown, keep 0'
              >
                <Input
                  id='securityValue'
                  inputMode='decimal'
                  placeholder='0'
                  {...form.register('securityValue')}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card className='xl:col-span-2'>
            <CardHeader>
              <CardTitle>Recommendation Details</CardTitle>
              <CardDescription>
                Write the recommendation/justification
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <Field
                label='Recommendation Details'
                htmlFor='recommendationDetails'
              >
                <Textarea
                  id='recommendationDetails'
                  placeholder='Write-off recommended due to non-recoverability and negligible recovery prospects.'
                  className='min-h-[140px]'
                  {...form.register('recommendationDetails')}
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

        {/* tiny helper for dev/testing */}
        <div className='text-muted-foreground mt-6 text-xs'>
          Tip: If opened without acctNo, you can still manually enter Account
          Number. Default date helper: {todayYMD()}.
        </div>
      </div>
    </>
  )
}
