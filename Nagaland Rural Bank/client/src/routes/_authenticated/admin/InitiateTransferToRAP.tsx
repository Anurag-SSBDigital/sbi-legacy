import React from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils'

// ============================
// Route
// ============================

export const Route = createFileRoute(
  '/_authenticated/admin/InitiateTransferToRAP'
)({
  component: RouteComponent,
})

// ============================
// Helpers
// ============================

function Field(props: {
  label: string
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  const { label, htmlFor, children, hint } = props
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

const toNumberOrUndefined = (value?: string): number | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
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

// ============================
// Form Schema & Types
// ============================

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

  // form-level value; mapped to boolean | undefined for API
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

// ============================
// Component
// ============================

function RouteComponent() {
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

  const createRecalledAssetMutation = $api.useMutation(
    'post',
    '/RecalledAssets/create',
    {
      onSuccess: () => {
        toast.success('Recalled assets proposal created successfully!')
        handleReset()
      },
      onError: (error) =>
        toastError(
          error,
          'Could not create Recalled Assets proposal. Please try again.'
        ),
    }
  )

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

    createRecalledAssetMutation.mutate({
      params: {
        header: {
          // Your auth interceptor should overwrite this with real JWT
          Authorization: '',
        },
      },
      body,
    })
  }

  const isSaving = createRecalledAssetMutation.isPending

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Initiate Transfer to Recalled Assets — Proposal
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Reset
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="text-white"
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        This form uses exactly the Recalled Assets DTO keys from your backend.
      </p>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Proposal */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal</CardTitle>
            <CardDescription>Top-level proposal details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Proposal for" htmlFor="proposalFor">
              <Input
                id="proposalFor"
                placeholder="Error culpa deserun"
                {...form.register('proposalFor')}
              />
            </Field>
            <Field label="Sanctioning Authority" htmlFor="sanctioningAuth">
              <Input
                id="sanctioningAuth"
                placeholder="Nostrud fugit liber"
                {...form.register('sanctioningAuth')}
              />
            </Field>
            <Field
              label="System Date"
              htmlFor="systemDate"
              hint="Proposal/system date"
            >
              <Input
                id="systemDate"
                type="date"
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
          <CardContent className="grid gap-4">
            <Field label="Borrower Name" htmlFor="borrowerName">
              <Input
                id="borrowerName"
                placeholder="Amela Glass"
                {...form.register('borrowerName')}
              />
            </Field>
            <Field label="Father/Husband Name" htmlFor="fatherHusbandName">
              <Input
                id="fatherHusbandName"
                placeholder="Sarah Beasley"
                {...form.register('fatherHusbandName')}
              />
            </Field>
            <Field label="Account Number" htmlFor="accountNumber">
              <Input
                id="accountNumber"
                placeholder="191"
                {...form.register('accountNumber')}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Loan Sanction Date" htmlFor="loanSanctionDate">
                <Input
                  id="loanSanctionDate"
                  type="date"
                  {...form.register('loanSanctionDate')}
                />
              </Field>
              <Field
                label="Loan Sanction Amount (₹)"
                htmlFor="loanSanctionAmt"
              >
                <Input
                  id="loanSanctionAmt"
                  inputMode="decimal"
                  placeholder="Leave blank for null"
                  {...form.register('loanSanctionAmt')}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* NPA & Provisioning */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>NPA / Provisioning</CardTitle>
            <CardDescription>Lifecycle dates and balances</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Field label="NPA Date" htmlFor="npaDate">
              <Input
                id="npaDate"
                type="date"
                {...form.register('npaDate')}
              />
            </Field>
            <Field label="Outstanding Amount (₹)" htmlFor="outstandingAmt">
              <Input
                id="outstandingAmt"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('outstandingAmt')}
              />
            </Field>
            <Field
              label="Transfer to Doubtful Date"
              htmlFor="transferToDoubtfulDate"
            >
              <Input
                id="transferToDoubtfulDate"
                type="date"
                {...form.register('transferToDoubtfulDate')}
              />
            </Field>
            <Field
              label="Provision as on T-1 (₹)"
              htmlFor="provisionAsOnT1"
            >
              <Input
                id="provisionAsOnT1"
                inputMode="decimal"
                placeholder="Leave blank for null"
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
          <CardContent className="grid gap-4">
            <Field label="Security Details" htmlFor="securityDetails">
              <Textarea
                id="securityDetails"
                placeholder="Vitae qui unde occae"
                {...form.register('securityDetails')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guarantor Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Guarantor Details" htmlFor="guarantorDetails">
              <Textarea
                id="guarantorDetails"
                placeholder="Velit vero et repre"
                {...form.register('guarantorDetails')}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Recovery & Collections */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recovery & Collections</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Recovery by Asset Sale?"
              htmlFor="recoveryByAssetSale"
            >
              <Controller
                control={form.control}
                name="recoveryByAssetSale"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="recoveryByAssetSale">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Last Collection Date"
              htmlFor="lastCollectionDate"
            >
              <Input
                id="lastCollectionDate"
                type="date"
                {...form.register('lastCollectionDate')}
              />
            </Field>
            <Field
              label="Last Collection Amount (₹)"
              htmlFor="lastCollectionAmt"
            >
              <Input
                id="lastCollectionAmt"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('lastCollectionAmt')}
              />
            </Field>
            <Field
              label="Total Recovery Amount (₹)"
              htmlFor="totalRecoveryAmt"
            >
              <Input
                id="totalRecoveryAmt"
                inputMode="decimal"
                placeholder="Leave blank for null"
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
          <CardContent className="grid gap-4">
            <Field label="Inspection Count" htmlFor="inspectionCount">
              <Input
                id="inspectionCount"
                inputMode="numeric"
                placeholder="Leave blank for null"
                {...form.register('inspectionCount')}
              />
            </Field>
            <Field
              label="Last Inspection Date"
              htmlFor="lastInspectionDate"
            >
              <Input
                id="lastInspectionDate"
                type="date"
                {...form.register('lastInspectionDate')}
              />
            </Field>
            <Field
              label="Inspecting Officer"
              htmlFor="inspectingOfficer"
            >
              <Input
                id="inspectingOfficer"
                placeholder="Lorem voluptas tenet"
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
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field
              label="Uncollected Interest (₹)"
              htmlFor="uncollectedInterest"
            >
              <Input
                id="uncollectedInterest"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('uncollectedInterest')}
              />
            </Field>
            <Field label="Current Balance (₹)" htmlFor="currentBalance">
              <Input
                id="currentBalance"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('currentBalance')}
              />
            </Field>
            <Field
              label="Updated Interest Receivable (₹)"
              htmlFor="updatedInterestReceivable"
            >
              <Input
                id="updatedInterestReceivable"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('updatedInterestReceivable')}
              />
            </Field>
            <Field
              label="Total Recoverable Amount (₹)"
              htmlFor="totalRecoverableAmt"
            >
              <Input
                id="totalRecoverableAmt"
                inputMode="decimal"
                placeholder="Leave blank for null"
                {...form.register('totalRecoverableAmt')}
              />
            </Field>
            <Field
              label="Creditable to RA Account (₹)"
              htmlFor="creditableToRaAccount"
            >
              <Input
                id="creditableToRaAccount"
                inputMode="decimal"
                placeholder="Leave blank for null"
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
            <Field label="IRAC Status" htmlFor="iracStatus">
              <Input
                id="iracStatus"
                placeholder="Dolore molestiae ius"
                {...form.register('iracStatus')}
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="text-white"
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

