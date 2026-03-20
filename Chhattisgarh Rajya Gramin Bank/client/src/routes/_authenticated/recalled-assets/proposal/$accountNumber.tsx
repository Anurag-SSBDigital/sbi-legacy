import * as React from 'react'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import type { components } from '@/types/api/v1.d.ts'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  ArrowLeft,
  Banknote,
  FileText,
  History,
  Info,
  Save,
  User,
  ShieldAlert,
  Search,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api, fetchClient } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// ---- Route ----
export const Route = createFileRoute(
  '/_authenticated/recalled-assets/proposal/$accountNumber'
)({
  component: RouteComponent,
  validateSearch: z.object({ id: z.number().optional() }),
  loaderDeps: ({ search: { id } }) => ({ id }),
  loader: async ({ params, deps }) => {
    const accountDataRes = await fetchClient.GET(
      '/RecalledAssets/RecalledAssetsAccount/{acctNo}',
      {
        params: { path: { acctNo: params.accountNumber } },
      }
    )

    const existingData = deps.id
      ? (
          await fetchClient.GET('/RecalledAssets/{id}', {
            params: { path: { id: Number(deps.id) } },
          })
        ).data?.data
      : undefined

    return { accountData: accountDataRes.data?.data, existingData }
  },
})

// ---- Schema ----
const recalledAssetsProposalSchema = z.object({
  proposalFor: z
    .string()
    .trim()
    .min(1, 'Required')
    .optional()
    .or(z.literal('')),
  sanctioningAuth: z
    .string()
    .trim()
    .min(1, 'Required')
    .optional()
    .or(z.literal('')),
  borrowerName: z.string().trim().optional().or(z.literal('')),
  fatherHusbandName: z.string().trim().optional().or(z.literal('')),
  accountNumber: z.string().trim().min(1, 'Account number is required'),

  loanSanctionDate: z.string().trim().optional().or(z.literal('')),
  loanSanctionAmt: z.coerce.number().optional(),

  npaDate: z.string().trim().optional().or(z.literal('')),
  outstandingAmt: z.coerce.number().optional(),

  transferToDoubtfulDate: z.string().trim().optional().or(z.literal('')),
  systemDate: z.string().trim().optional().or(z.literal('')),

  provisionAsOnT1: z.coerce.number().optional(),
  securityDetails: z.string().trim().optional().or(z.literal('')),
  guarantorDetails: z.string().trim().optional().or(z.literal('')),
  recoveryByAssetSale: z.boolean().optional(),

  lastCollectionDate: z.string().trim().optional().or(z.literal('')),
  lastCollectionAmt: z.coerce.number().optional(),
  totalRecoveryAmt: z.coerce.number().optional(),

  inspectionCount: z.coerce.number().int().optional(),
  lastInspectionDate: z.string().trim().optional().or(z.literal('')),
  inspectingOfficer: z.string().trim().optional().or(z.literal('')),

  uncollectedInterest: z.coerce.number().optional(),
  currentBalance: z.coerce.number().optional(),
  updatedInterestReceivable: z.coerce.number().optional(),
  totalRecoverableAmt: z.coerce.number().optional(),
  creditableToRaAccount: z.coerce.number().optional(),
  iracStatus: z.string().trim().optional().or(z.literal('')),
})

type RecalledAssetsProposalForm = z.infer<typeof recalledAssetsProposalSchema>

// Simple display formatter for the header
function formatCurrencyDisplay(amount?: number | null) {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---- Helpers ----
function toISODateInputValue(v?: string | null) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function numToInput(v?: number | null) {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function mapAccountDataToFormDefaults(
  a?: components['schemas']['RecalledAssetsEligibleAccount'],
  accountNumberParam?: string
): Partial<RecalledAssetsProposalForm> {
  if (!a) {
    return {
      accountNumber: accountNumberParam ?? '',
      recoveryByAssetSale: false,
    }
  }

  return {
    accountNumber: accountNumberParam ?? a.accountNumber ?? '',
    borrowerName: a.borrowerName ?? '',
    fatherHusbandName: a.fatherHusbandName ?? '',
    loanSanctionDate: toISODateInputValue(a.loanSanctionDate),
    loanSanctionAmt: numToInput(a.loanSanctionAmount), // <-- NOTE: Amount field name in accountData
    npaDate: toISODateInputValue(a.npaDate),
    outstandingAmt: numToInput(a.outstandingAmount),
    currentBalance: numToInput(a.currentBalance),
    provisionAsOnT1: numToInput(a.provisionAmount),
    securityDetails: a.securityDetails ?? '',
    guarantorDetails: a.guarantorDetails ?? '',
    iracStatus: a.iracStatus ?? '',
    transferToDoubtfulDate: toISODateInputValue(a.transferToDoubtfulDate),
    lastCollectionDate: toISODateInputValue(a.lastCollectionDate),
    lastCollectionAmt: numToInput(a.lastCollectionAmount),
    totalRecoveryAmt: numToInput(a.totalRecoveryAmount),

    // keep your defaults
    recoveryByAssetSale: !!a.recoveryByAssetSale,
  }
}

// Helper component for Currency Inputs
const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => {
  return (
    <div className='relative'>
      <span className='text-muted-foreground absolute top-2.5 left-3'>₹</span>
      <Input ref={ref} {...props} className='pl-7' />
    </div>
  )
})
CurrencyInput.displayName = 'CurrencyInput'

function RouteComponent() {
  const { accountNumber } = Route.useParams()
  const existingId = Route.useSearch().id
  const isEdit = typeof existingId === 'number' && Number.isFinite(existingId)
  const canCreateProposal = useCanAccess('recalled_assets', 'create_proposal')
  const canUpdateProposal = useCanAccess('recalled_assets', 'update_proposal')

  const { accountData, existingData } = Route.useLoaderData()

  const createMutation = $api.useMutation('post', '/RecalledAssets/create')
  const updateMutation = $api.useMutation('put', '/RecalledAssets/update/{id}')

  const form = useForm<RecalledAssetsProposalForm>({
    resolver: standardSchemaResolver(recalledAssetsProposalSchema),
    defaultValues: {
      accountNumber: accountNumber ?? '',
      recoveryByAssetSale: false,
    },
    mode: 'onSubmit',
  })

  React.useEffect(() => {
    if (!isEdit) {
      form.reset({
        accountNumber: accountNumber ?? '',
        recoveryByAssetSale: false,
      })
      return
    }

    const dto = existingData
    if (!dto) return

    form.reset({
      accountNumber: accountNumber ?? dto.accountNumber ?? '',
      proposalFor: dto.proposalFor ?? '',
      sanctioningAuth: dto.sanctioningAuth ?? '',
      borrowerName: dto.borrowerName ?? '',
      fatherHusbandName: dto.fatherHusbandName ?? '',
      loanSanctionDate: toISODateInputValue(dto.loanSanctionDate),
      loanSanctionAmt: numToInput(dto.loanSanctionAmt),
      npaDate: toISODateInputValue(dto.npaDate),
      outstandingAmt: numToInput(dto.outstandingAmt),
      transferToDoubtfulDate: toISODateInputValue(dto.transferToDoubtfulDate),
      systemDate: toISODateInputValue(dto.systemDate),
      provisionAsOnT1: numToInput(dto.provisionAsOnT1),
      securityDetails: dto.securityDetails ?? '',
      guarantorDetails: dto.guarantorDetails ?? '',
      recoveryByAssetSale: !!dto.recoveryByAssetSale,
      lastCollectionDate: toISODateInputValue(dto.lastCollectionDate),
      lastCollectionAmt: numToInput(dto.lastCollectionAmt),
      totalRecoveryAmt: numToInput(dto.totalRecoveryAmt),
      inspectionCount:
        typeof dto.inspectionCount === 'number'
          ? dto.inspectionCount
          : undefined,
      lastInspectionDate: toISODateInputValue(dto.lastInspectionDate),
      inspectingOfficer: dto.inspectingOfficer ?? '',
      uncollectedInterest: numToInput(dto.uncollectedInterest),
      currentBalance: numToInput(dto.currentBalance),
      updatedInterestReceivable: numToInput(dto.updatedInterestReceivable),
      totalRecoverableAmt: numToInput(dto.totalRecoverableAmt),
      creditableToRaAccount: numToInput(dto.creditableToRaAccount),
      iracStatus: dto.iracStatus ?? '',
    })
  }, [isEdit, existingData, accountNumber, form])

  React.useEffect(() => {
    if (isEdit) return
    if (!accountData) return

    const defaults = mapAccountDataToFormDefaults(accountData, accountNumber)

    // If user has not touched the form → clean reset
    if (!form.formState.isDirty) {
      form.reset(
        {
          ...form.getValues(),
          ...defaults,
        },
        { keepTouched: true }
      )
      return
    }

    // If user already typed → fill ONLY empty fields
    ;(Object.keys(defaults) as Array<keyof RecalledAssetsProposalForm>).forEach(
      (key) => {
        const current = form.getValues(key)
        const next = defaults[key]

        const isEmpty =
          current === undefined ||
          current === null ||
          (typeof current === 'string' && current.trim() === '')

        if (isEmpty && next !== undefined) {
          form.setValue(key, next, {
            shouldDirty: false,
            shouldTouch: false,
          })
        }
      }
    )
  }, [isEdit, accountData, accountNumber, form])

  const router = useRouter()

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && !canUpdateProposal) {
      toast.error('You do not have permission to update proposals.')
      return
    }

    if (!isEdit && !canCreateProposal) {
      toast.error('You do not have permission to create proposals.')
      return
    }

    const payload: RecalledAssetsProposalForm & { id?: number } = {
      ...values,
      accountNumber: accountNumber ?? values.accountNumber,
    }

    try {
      if (isEdit) {
        const id = Number(existingId)
        await updateMutation.mutateAsync({
          params: { header: { Authorization: '' }, path: { id } },
          body: { ...payload, id },
        })
        toast.success('Proposal updated successfully')
        router.navigate({ to: '/recalled-assets/eligible' })
      } else {
        await createMutation.mutateAsync({
          params: { header: { Authorization: '' } },
          body: payload,
        })
        toast.success('Proposal created successfully')
        router.navigate({ to: '/recalled-assets/eligible' })
      }
    } catch (e: unknown) {
      toastError(
        e,
        isEdit ? 'Failed to update proposal' : 'Failed to create proposal'
      )
    }
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const canSubmit = isEdit ? canUpdateProposal : canCreateProposal

  return (
    <MainWrapper>
      <div className='bg-muted/30 flex min-h-screen flex-col pb-10'>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 shadow-sm backdrop-blur'>
              {/* Left Side: Back + Context Info */}
              <div className='flex items-center gap-4'>
                {/* Back Button */}
                <Link
                  to='/recalled-assets/eligible'
                  className='text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors'
                  title='Back to Eligible Accounts'
                >
                  <ArrowLeft className='h-4 w-4' />
                  <span className='sr-only'>Back</span>
                </Link>

                {/* Vertical Separator */}
                <div className='bg-border h-8 w-[1px]' />

                {/* Page Title (Hidden on small screens to save space for Account Info) */}
                <div className='hidden items-center gap-2 lg:flex'>
                  <div className='bg-primary/10 rounded-md p-2'>
                    <FileText className='text-primary h-4 w-4' />
                  </div>
                  <div className='flex flex-col'>
                    <h1 className='text-sm leading-none font-semibold tracking-tight'>
                      {isEdit ? 'Edit Proposal' : 'New Proposal'}
                    </h1>
                    {isEdit && (
                      <span className='text-muted-foreground text-[10px]'>
                        ID: {existingId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vertical Separator (Desktop only) */}
                <div className='bg-border hidden h-8 w-[1px] lg:block' />

                {/* Account Context */}
                <div className='flex flex-col justify-center'>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-sm font-bold tracking-tight'>
                      {accountNumber}
                    </span>
                    {accountData?.borrowerName && (
                      <>
                        <span className='text-muted-foreground'>/</span>
                        <span className='text-foreground/80 max-w-[150px] truncate text-sm font-medium sm:max-w-[300px]'>
                          {accountData.borrowerName}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Sub-row: Financial Context */}
                  {accountData && (
                    <div className='text-muted-foreground flex items-center gap-3 text-[11px]'>
                      <span className='flex items-center gap-1'>
                        Branch:{' '}
                        <span className='text-foreground'>
                          {accountData.branchCode ?? 'N/A'}
                        </span>
                      </span>
                      <span className='bg-border h-3 w-[1px]' />
                      <span className='flex items-center gap-1'>
                        O/S:{' '}
                        <span className='text-destructive font-medium'>
                          {formatCurrencyDisplay(accountData.outstandingAmount)}
                        </span>
                      </span>
                      {accountData.npaDate && (
                        <>
                          <span className='bg-border h-3 w-[1px]' />
                          <span className='flex items-center gap-1'>
                            NPA:{' '}
                            <span className='text-foreground'>
                              {toISODateInputValue(accountData.npaDate)}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  <RotateCcw className='mr-2 h-4 w-4' />
                  Reset
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={isSubmitting || !canSubmit}
                >
                  <Save className='mr-2 h-4 w-4' />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </header>

            <div className='p-6'>
              {/* This hidden input ensures accountNumber is submitted if needed, though we merge it in onSubmit */}
              <input type='hidden' {...form.register('accountNumber')} />

              <div className='grid gap-6 xl:grid-cols-3'>
                {/* --- Left Column (2/3 width) --- */}
                <div className='space-y-6 xl:col-span-2'>
                  {/* 1. Borrower & Basic Info */}
                  <Card>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2'>
                        <div className='bg-primary/10 rounded-lg p-2'>
                          <User className='text-primary h-5 w-5' />
                        </div>
                        <div>
                          <CardTitle className='text-base'>
                            Borrower Information
                          </CardTitle>
                          <CardDescription>
                            Personal details and sanctioning info
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='borrowerName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Borrower Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder='Full Legal Name'
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='fatherHusbandName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father/Husband Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator className='my-2 md:col-span-2' />
                      <FormField
                        control={form.control}
                        name='proposalFor'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proposal Type</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder='e.g. Settlement' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='sanctioningAuth'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sanctioning Authority</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* 2. Financial Overview */}
                  <Card>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2'>
                        <div className='rounded-lg bg-green-500/10 p-2'>
                          <Banknote className='h-5 w-5 text-green-600' />
                        </div>
                        <div>
                          <CardTitle className='text-base'>
                            Financial Details
                          </CardTitle>
                          <CardDescription>
                            Loan amounts, outstanding balance, and provisions
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {/* Row 1: Sanction */}
                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name='loanSanctionDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sanction Date</FormLabel>
                              <FormControl>
                                <Input {...field} type='date' />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='loanSanctionAmt'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sanction Amount</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='outstandingAmt'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outstanding Amount</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Row 2: Balances */}
                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name='currentBalance'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Balance</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='uncollectedInterest'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Uncollected Interest</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='updatedInterestReceivable'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Updated Int. Receivable</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 3: Recovery Totals */}
                      <div className='bg-muted/30 grid gap-4 rounded-md p-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name='totalRecoverableAmt'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Recoverable</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='creditableToRaAccount'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Creditable to RA</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='provisionAsOnT1'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provision (T1)</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  inputMode='decimal'
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. Security & Guarantor */}
                  <Card>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2'>
                        <div className='rounded-lg bg-blue-500/10 p-2'>
                          <ShieldAlert className='h-5 w-5 text-blue-600' />
                        </div>
                        <CardTitle className='text-base'>
                          Security & Guarantees
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-6'>
                      <FormField
                        control={form.control}
                        name='securityDetails'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Details</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder='Description of collateral/security...'
                                className='resize-none'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='guarantorDetails'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor Details</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder='Names and details of guarantors...'
                                className='resize-none'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* --- Right Column (1/3 width) --- */}
                <div className='space-y-6'>
                  {/* 4. Status & Dates */}
                  <Card className='border-l-4 border-l-amber-500'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2'>
                        <Info className='h-5 w-5 text-amber-600' />
                        <CardTitle className='text-base'>
                          Status & Critical Dates
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4'>
                      <FormField
                        control={form.control}
                        name='iracStatus'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IRAC Status</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder='e.g. NPA' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className='grid grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='npaDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                NPA Date
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type='date' className='h-9' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='transferToDoubtfulDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Doubtful Date
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type='date' className='h-9' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='systemDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                System Date
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type='date' className='h-9' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 5. Collections & Inspection */}
                  <Card>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2'>
                        <History className='text-muted-foreground h-5 w-5' />
                        <CardTitle className='text-base'>
                          History & Recovery
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='recoveryByAssetSale'
                        render={({ field }) => (
                          <FormItem className='bg-muted/20 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                            <div className='space-y-0.5'>
                              <FormLabel>Asset Sale</FormLabel>
                              <FormDescription className='text-xs'>
                                Is recovery via sale?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className='grid grid-cols-2 gap-3'>
                        <FormField
                          control={form.control}
                          name='lastCollectionDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Last Coll. Date
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type='date' className='h-9' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='lastCollectionAmt'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Last Coll. Amt
                              </FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...field}
                                  type='number'
                                  className='h-9'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name='totalRecoveryAmt'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Recovery So Far</FormLabel>
                            <FormControl>
                              <CurrencyInput {...field} type='number' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className='space-y-3'>
                        <h4 className='flex items-center gap-2 text-sm font-medium'>
                          <Search className='h-3 w-3' /> Inspection
                        </h4>
                        <div className='grid grid-cols-2 gap-3'>
                          <FormField
                            control={form.control}
                            name='inspectionCount'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-xs'>Count</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type='number'
                                    className='h-9'
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='lastInspectionDate'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-xs'>
                                  Last Date
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type='date'
                                    className='h-9'
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name='inspectingOfficer'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Officer Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='Name'
                                  className='h-9'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metadata (Readonly) */}
                  <Card className='bg-muted/10 border-dashed'>
                    <CardContent className='text-muted-foreground space-y-2 pt-6 text-xs'>
                      <div className='flex justify-between'>
                        <span>Created By:</span>
                        <span className='font-medium'>
                          {existingData?.createdBy || '-'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Updated By:</span>
                        <span className='font-medium'>
                          {existingData?.updatedBy || '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </MainWrapper>
  )
}
