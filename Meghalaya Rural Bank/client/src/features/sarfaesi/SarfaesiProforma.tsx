import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import type { components } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

// ───────────────────────────────────────────────────────────────
// Types from OpenAPI
// ───────────────────────────────────────────────────────────────

type SarfaesiProformaData = components['schemas']['SarfaesiProformaData']
type SarfaesiAccountIdentification =
  components['schemas']['SarfaesiAccountIdentification']
type SarfaesiBorrowerGuarantorDetails =
  components['schemas']['SarfaesiBorrowerGuarantorDetails']
type SarfaesiSecurityDetails = components['schemas']['SarfaesiSecurityDetails']
type ApiResponseSarfaesiProformaData =
  components['schemas']['ApiResponseSarfaesiProformaData']

// ───────────────────────────────────────────────────────────────
// Zod Schemas (Zod v4)
// ───────────────────────────────────────────────────────────────

const optionalNumber = () =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    if (typeof val === 'string') {
      const n = Number(val)
      return Number.isNaN(n) ? val : n
    }
    return val
  }, z.number().nonnegative().optional())

const accountIdentificationSchema: z.ZodType<SarfaesiAccountIdentification> =
  z.object({
    id: z.number().int().optional(),

    accountNumber: z.string().min(1, 'Account number is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    cifNumber: z.string().min(1, 'CIF number is required'),
    branchName: z.string().min(1, 'Branch name is required'),
    branchCode: z.string().min(1, 'Branch code is required'),
    regionalOffice: z.string().optional(),
    fgmoHeadOffice: z.string().optional(),
    state: z.string().optional(),

    dateOfSanction: z.string().optional(),
    dateOfNpa: z.string().optional(),
    assetClassification: z.string().optional(),

    outstandingBalance: optionalNumber(),
    interestUpTo: optionalNumber(),
    totalDues: optionalNumber(),

    dateOfLastCredit: z.string().optional(),
    purposeOfLoan: z.string().optional(),
    categoryOfLoan: z.string().optional(),
    typeOfIndustry: z.string().optional(),

    createdTime: z.string().optional(),
    updatedTime: z.string().optional(),
    updatedBy: z.string().optional(),
    createdBy: z.string().optional(),
  })

const borrowerGuarantorSchema: z.ZodType<SarfaesiBorrowerGuarantorDetails> =
  z.object({
    id: z.number().int().optional(),

    borrowerAddress: z.string().min(1, 'Borrower address is required'),
    emailId: z
      .string()
      .email('Invalid email address')
      .or(z.literal(''))
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    contactNumber: z
      .string()
      .min(10, 'Contact number must be at least 10 digits')
      .optional(),

    guarantorNames: z.string().optional(),
    guarantorCifs: z.string().optional(),
    guarantorAddresses: z.string().optional(),

    createdTime: z.string().optional(),
    updatedTime: z.string().optional(),
    updatedBy: z.string().optional(),
    createdBy: z.string().optional(),
  })

const securityDetailsSchema: z.ZodType<SarfaesiSecurityDetails> = z.object({
  id: z.number().int().optional(),

  natureOfSecurity: z.string().min(1, 'Nature of security is required'),
  numberOfSecurities: optionalNumber()
    .transform((val) => (typeof val === 'number' ? Math.trunc(val) : undefined))
    .optional(),
  securityDescription: z.string().optional(),
  locationOfProperty: z.string().optional(),
  stateDistrictOfProperty: z.string().optional(),
  valuerName: z.string().optional(),
  valuationDate: z.string().optional(),

  fairMarketValue: optionalNumber(),
  realizableValue: optionalNumber(),

  chargeCreationDate: z.string().optional(),
  chargeType: z.string().optional(),
  cersaiRegistrationNo: z.string().optional(),
  insuranceDetails: z.string().optional(),
  encumbranceStatus: z.string().optional(),
})

const sarfaesiProformaFormSchema: z.ZodType<SarfaesiProformaData> = z.object({
  accountIdentification: accountIdentificationSchema,
  borrowerGuarantor: borrowerGuarantorSchema,
  securityDetails: z
    .array(securityDetailsSchema)
    .min(1, 'At least one security detail is required'),
})

type SarfaesiProformaFormValues = z.infer<typeof sarfaesiProformaFormSchema>

interface SarfaesiProformaFormProps {
  acctNo?: string
  onSubmit?: (values: SarfaesiProformaFormValues) => void
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

const hasText = (v: unknown) =>
  typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined

const roClass = (readOnly?: boolean) =>
  cn(
    readOnly &&
      'bg-muted/40 text-muted-foreground cursor-not-allowed pointer-events-none'
  )

// ───────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────

export default function SarfaesiProformaForm({
  acctNo,
  onSubmit: onSubmitFromProps,
}: SarfaesiProformaFormProps) {
  const createPerformaMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/create/performa'
  )

  const { data: customer } = $api.useQuery('get', '/account/getAccountDetail', {
    params: { query: { acctNm: acctNo } },
    enabled: !!acctNo,
  })

  const { data: branchDeptInfo } = $api.useQuery(
    'get',
    '/branches/{accountNumber}/branch-department-info',
    {
      params: { path: { accountNumber: acctNo ?? '' } },
    },
    {
      enabled: !!acctNo,
    }
  )

  const form = useForm<SarfaesiProformaFormValues>({
    resolver: standardSchemaResolver(sarfaesiProformaFormSchema),
    mode: 'onBlur',
    defaultValues: {
      accountIdentification: {
        accountNumber: '',
        customerName: '',
        cifNumber: '',
        branchName: '',
        branchCode: '',
        regionalOffice: '',
        fgmoHeadOffice: '',
        state: '',
        dateOfSanction: '',
        dateOfNpa: '',
        assetClassification: '',
        outstandingBalance: undefined,
        interestUpTo: undefined,
        totalDues: undefined,
        dateOfLastCredit: '',
        purposeOfLoan: '',
        categoryOfLoan: '',
        typeOfIndustry: '',
      },
      borrowerGuarantor: {
        borrowerAddress: '',
        emailId: '',
        contactNumber: '',
        guarantorNames: '',
        guarantorCifs: '',
        guarantorAddresses: '',
      },
      securityDetails: [
        {
          natureOfSecurity: '',
          numberOfSecurities: undefined,
          securityDescription: '',
          locationOfProperty: '',
          stateDistrictOfProperty: '',
          valuerName: '',
          valuationDate: '',
          fairMarketValue: undefined,
          realizableValue: undefined,
          chargeCreationDate: '',
          chargeType: '',
          cersaiRegistrationNo: '',
          insuranceDetails: '',
          encumbranceStatus: '',
        },
      ],
    },
  })

  const navigate = useNavigate()

  const apiCustomer = customer?.customer

  /**
   * Decide which fields should be read-only/disabled:
   * - If API gives a value -> lock it
   * - If API missing -> allow user to edit
   * - For branchDeptInfo prefills -> lock only if it actually provided a value
   */
  const locks = useMemo(() => {
    const outstand =
      typeof apiCustomer?.outstand === 'number'
        ? Math.abs(apiCustomer.outstand)
        : undefined

    return {
      // Account identification
      accountNumber: hasText(apiCustomer?.acctNo),
      customerName: hasText(apiCustomer?.custName),
      cifNumber: hasText(apiCustomer?.custNumber), // editable if API missing
      branchName: hasText(apiCustomer?.branchName),
      branchCode: hasText(apiCustomer?.branchCode),
      state: hasText(apiCustomer?.state),

      dateOfSanction: hasText(apiCustomer?.sanctDt),
      dateOfNpa: hasText(apiCustomer?.npaDt),
      assetClassification: hasText(apiCustomer?.npaCd),

      outstandingBalance: typeof outstand === 'number',
      totalDues: typeof outstand === 'number',

      purposeOfLoan: hasText(apiCustomer?.acctDesc),
      categoryOfLoan: hasText(apiCustomer?.actType),

      // Borrower & guarantor
      borrowerAddress: (() => {
        // lock if we can construct any meaningful address from API
        const parts = [
          apiCustomer?.add1,
          apiCustomer?.add2,
          apiCustomer?.add3,
          apiCustomer?.add4,
          apiCustomer?.area,
          apiCustomer?.city,
          apiCustomer?.district,
          apiCustomer?.state,
          apiCustomer?.pinCode,
        ]
        return parts.some((p) => hasText(p))
      })(),

      contactNumber: hasText(apiCustomer?.telNo),

      // Prefill from branch-department-info (your code maps it to regionalOffice)
      regionalOffice: hasText(branchDeptInfo?.departmentName),
    }
  }, [apiCustomer, branchDeptInfo])

  // Prefill from customer API
  useEffect(() => {
    if (!apiCustomer) return

    const parts = [
      apiCustomer.add1,
      apiCustomer.add2,
      apiCustomer.add3,
      apiCustomer.add4,
      apiCustomer.area,
      apiCustomer.city,
      apiCustomer.district,
      apiCustomer.state,
      apiCustomer.pinCode,
    ]
    const address = parts.filter(Boolean).join(', ')

    const current = form.getValues()
    const outstand =
      typeof apiCustomer.outstand === 'number'
        ? Math.abs(apiCustomer.outstand)
        : undefined

    form.reset({
      ...current,
      accountIdentification: {
        ...current?.accountIdentification,

        accountNumber:
          apiCustomer.acctNo ?? current?.accountIdentification?.accountNumber,
        customerName:
          apiCustomer.custName ?? current?.accountIdentification?.customerName,
        cifNumber:
          apiCustomer.custNumber ?? current?.accountIdentification?.cifNumber,

        branchName:
          apiCustomer.branchName ?? current?.accountIdentification?.branchName,
        branchCode:
          apiCustomer.branchCode ?? current?.accountIdentification?.branchCode,
        state: apiCustomer.state ?? current?.accountIdentification?.state,
        interestUpTo:
          apiCustomer.intRate ?? current?.accountIdentification?.interestUpTo,

        dateOfSanction:
          apiCustomer.sanctDt ?? current?.accountIdentification?.dateOfSanction,
        dateOfNpa:
          apiCustomer.npaDt ?? current?.accountIdentification?.dateOfNpa,

        assetClassification:
          apiCustomer.npaCd ??
          current?.accountIdentification?.assetClassification,

        outstandingBalance:
          typeof outstand === 'number'
            ? outstand
            : current?.accountIdentification?.outstandingBalance,

        totalDues:
          typeof outstand === 'number'
            ? outstand
            : current?.accountIdentification?.totalDues,

        purposeOfLoan:
          apiCustomer.acctDesc ?? current?.accountIdentification?.purposeOfLoan,
        categoryOfLoan:
          apiCustomer.actType ?? current?.accountIdentification?.categoryOfLoan,

        // keep others as user-enterable
        // interestUpTo: current?.accountIdentification?.interestUpTo,
        dateOfLastCredit: current?.accountIdentification?.dateOfLastCredit,
        typeOfIndustry: current?.accountIdentification?.typeOfIndustry,
        regionalOffice: current?.accountIdentification?.regionalOffice,
        fgmoHeadOffice: current?.accountIdentification?.fgmoHeadOffice,
      },
      borrowerGuarantor: {
        ...current.borrowerGuarantor,
        borrowerAddress: address || current?.borrowerGuarantor?.borrowerAddress,
        contactNumber:
          apiCustomer.telNo ?? current?.borrowerGuarantor?.contactNumber,
        emailId: current?.borrowerGuarantor?.emailId,
      },
      // securityDetails untouched
    })
  }, [apiCustomer, form])

  // Prefill regionalOffice from branchDeptInfo (only if user hasn't typed)
  useEffect(() => {
    if (!branchDeptInfo?.departmentName) return

    const alreadyDirty =
      !!form.formState.dirtyFields?.accountIdentification?.regionalOffice
    if (alreadyDirty) return

    const currentVal = form.getValues('accountIdentification.regionalOffice')
    if (currentVal && currentVal.trim().length > 0) return

    form.setValue(
      'accountIdentification.regionalOffice',
      branchDeptInfo.departmentName,
      { shouldDirty: false, shouldTouch: false, shouldValidate: false }
    )
  }, [branchDeptInfo, form])

  const {
    fields: securityDetailsFields,
    append: appendSecurityDetail,
    remove: removeSecurityDetail,
  } = useFieldArray({
    control: form.control,
    name: 'securityDetails',
  })

  const isSubmitting =
    createPerformaMutation.isPending || form.formState.isSubmitting

  const defaultOnSubmit = (values: SarfaesiProformaFormValues) => {
    createPerformaMutation.mutate(
      {
        body: values,
        params: { header: { Authorization: '' } },
      },
      {
        onSuccess: (result) => {
          const typed = result as unknown as {
            body?: ApiResponseSarfaesiProformaData
          }
          toast.success(
            typed?.body?.message ?? 'SARFAESI proforma created successfully'
          )
          form.reset()
          navigate({ to: '/sarfaesi/eligible' })
        },
        onError: (error) => {
          const err = error as { message?: string }
          toast.error(err.message ?? 'Failed to create SARFAESI proforma')
        },
      }
    )
  }

  const onSubmit = onSubmitFromProps ?? defaultOnSubmit

  return (
    <div className='flex h-full flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            SARFAESI Proforma
          </h1>
          <p className='text-muted-foreground text-sm'>
            Capture account, borrower, and security details to generate a
            SARFAESI proforma.
          </p>
        </div>
        <Badge variant='outline' className='tracking-wide uppercase'>
          Draft Entry
        </Badge>
      </div>

      <Separator />

      {/* Form */}
      <ScrollArea className='h-[calc(100vh-12rem)] pr-1'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8 pb-10'
          >
            {/* Section: Account Identification */}
            <Card className='border-muted/60 shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg'>
                  Account Identification
                </CardTitle>
                <CardDescription>
                  Basic details of the account and facility.
                </CardDescription>
              </CardHeader>

              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.accountNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter account number'
                            {...field}
                            readOnly={locks.accountNumber}
                            className={roClass(locks.accountNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.customerName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter customer name'
                            {...field}
                            readOnly={locks.customerName}
                            className={roClass(locks.customerName)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.cifNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CIF Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter CIF number'
                            {...field}
                            readOnly={locks.cifNumber}
                            className={roClass(locks.cifNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.branchName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter branch name'
                            {...field}
                            readOnly={locks.branchName}
                            className={roClass(locks.branchName)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.branchCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter branch code'
                            {...field}
                            readOnly={locks.branchCode}
                            className={roClass(locks.branchCode)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.state'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter state'
                            {...field}
                            readOnly={locks.state}
                            className={roClass(locks.state)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.regionalOffice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regional Office</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter regional office'
                            {...field}
                            readOnly={locks.regionalOffice}
                            className={roClass(locks.regionalOffice)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.fgmoHeadOffice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FGMO / Head Office</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter FGMO / Head office'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.assetClassification'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Classification</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., NPA, Sub-standard'
                            {...field}
                            readOnly={locks.assetClassification}
                            className={roClass(locks.assetClassification)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.dateOfSanction'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Sanction</FormLabel>
                        <FormControl>
                          <Input
                            type='date'
                            {...field}
                            readOnly={locks.dateOfSanction}
                            className={roClass(locks.dateOfSanction)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.dateOfNpa'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of NPA</FormLabel>
                        <FormControl>
                          <Input
                            type='date'
                            {...field}
                            readOnly={locks.dateOfNpa}
                            className={roClass(locks.dateOfNpa)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.dateOfLastCredit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Last Credit</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.outstandingBalance'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outstanding Balance</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            {...field}
                            readOnly={locks.outstandingBalance}
                            className={roClass(locks.outstandingBalance)}
                          />
                        </FormControl>
                        <FormDescription>
                          As on the reference date.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.interestUpTo'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest (up to)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.totalDues'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Dues</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            {...field}
                            readOnly={locks.totalDues}
                            className={roClass(locks.totalDues)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='accountIdentification.purposeOfLoan'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Loan</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder='Describe the purpose of the loan'
                          {...field}
                          readOnly={locks.purposeOfLoan}
                          className={cn(roClass(locks.purposeOfLoan))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='accountIdentification.categoryOfLoan'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category of Loan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Term loan, Cash credit'
                            {...field}
                            readOnly={locks.categoryOfLoan}
                            className={roClass(locks.categoryOfLoan)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='accountIdentification.typeOfIndustry'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Industry</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Manufacturing, Services'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section: Borrower & Guarantor */}
            <Card className='border-muted/60 shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg'>
                  Borrower &amp; Guarantor Details
                </CardTitle>
                <CardDescription>
                  Contact and identification details of borrower and guarantors.
                </CardDescription>
              </CardHeader>

              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='borrowerGuarantor.borrowerAddress'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrower Address</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder='Enter full postal address of the borrower'
                          {...field}
                          readOnly={locks.borrowerAddress}
                          className={cn(roClass(locks.borrowerAddress))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='borrowerGuarantor.emailId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email ID</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='name@example.com'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='borrowerGuarantor.contactNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter contact number'
                            {...field}
                            readOnly={locks.contactNumber}
                            className={roClass(locks.contactNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className='my-2' />

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='borrowerGuarantor.guarantorNames'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guarantor Name(s)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Enter guarantor names (comma separated, if multiple)'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='borrowerGuarantor.guarantorCifs'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guarantor CIF(s)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Enter guarantor CIFs (comma separated)'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='borrowerGuarantor.guarantorAddresses'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guarantor Address(es)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Enter guarantor addresses'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section: Security Details (Dynamic List) */}
            <Card className='border-muted/60 shadow-sm'>
              <CardHeader className='flex flex-row items-center justify-between gap-3 pb-4'>
                <div>
                  <CardTitle className='text-lg'>Security Details</CardTitle>
                  <CardDescription>
                    Provide details of all primary and collateral securities.
                  </CardDescription>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    appendSecurityDetail({
                      natureOfSecurity: '',
                      numberOfSecurities: undefined,
                      securityDescription: '',
                      locationOfProperty: '',
                      stateDistrictOfProperty: '',
                      valuerName: '',
                      valuationDate: '',
                      fairMarketValue: undefined,
                      realizableValue: undefined,
                      chargeCreationDate: '',
                      chargeType: '',
                      cersaiRegistrationNo: '',
                      insuranceDetails: '',
                      encumbranceStatus: '',
                    })
                  }
                >
                  Add Security
                </Button>
              </CardHeader>

              <CardContent className='space-y-6'>
                {securityDetailsFields.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    No securities added yet. Click &quot;Add Security&quot; to
                    create one.
                  </p>
                ) : (
                  securityDetailsFields.map((field, index) => (
                    <div
                      key={field.id}
                      className={cn(
                        'bg-muted/30 space-y-4 rounded-lg border border-dashed p-4'
                      )}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className='rounded-full px-3 text-xs'
                          >
                            Security #{index + 1}
                          </Badge>
                          <span className='text-muted-foreground text-xs'>
                            Provide details of this specific security.
                          </span>
                        </div>

                        {securityDetailsFields.length > 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive text-xs'
                            onClick={() => removeSecurityDetail(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.natureOfSecurity`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Nature of Security</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g., Mortgage, Hypothecation'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.numberOfSecurities`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Number of Securities</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.locationOfProperty`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Location of Property</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='City / Area'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`securityDetails.${index}.securityDescription`}
                        render={({ field: fieldControl }) => (
                          <FormItem>
                            <FormLabel>Security Description</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder='Describe the property / asset offered as security'
                                {...fieldControl}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.stateDistrictOfProperty`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>State / District</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='State / District'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.valuerName`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Valuer Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Registered valuer's name"
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.valuationDate`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Valuation Date</FormLabel>
                              <FormControl>
                                <Input type='date' {...fieldControl} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.fairMarketValue`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Fair Market Value</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='0.00'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.realizableValue`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Realizable Value</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='0.00'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.chargeCreationDate`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Charge Creation Date</FormLabel>
                              <FormControl>
                                <Input type='date' {...fieldControl} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid gap-4 md:grid-cols-3'>
                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.chargeType`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Charge Type</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g., First charge, Second charge'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.cersaiRegistrationNo`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>CERSAI Registration No.</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='CERSAI registration number'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`securityDetails.${index}.encumbranceStatus`}
                          render={({ field: fieldControl }) => (
                            <FormItem>
                              <FormLabel>Encumbrance Status</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g., Free from encumbrance'
                                  {...fieldControl}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`securityDetails.${index}.insuranceDetails`}
                        render={({ field: fieldControl }) => (
                          <FormItem>
                            <FormLabel>Insurance Details</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={2}
                                placeholder='Policy number, insurer, sum insured, expiry date, etc.'
                                {...fieldControl}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end'>
              <Button
                type='button'
                variant='outline'
                disabled={isSubmitting}
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Proforma'}
              </Button>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </div>
  )
}
