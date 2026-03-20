import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Save,
  RotateCcw,
  ClipboardList,
  Building2,
  User,
  AlertTriangle,
  PenTool,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import useAccountDetails from '@/hooks/use-account-details'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import YesNoNAField from '../components/YesNoNAField'
import { CREDIT_AUDIT_CHECKLIST } from '../creditAudit.constants'
import { CreditAuditFormSchema } from '../creditAudit.schema'
import { creditAuditStore, makeId } from '../creditAudit.storage'
import type {
  CreditAuditFormValues,
  CreditAuditStoredRecord,
} from '../creditAudit.types'

function stripMeta(r: CreditAuditStoredRecord): CreditAuditFormValues {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, accountId, createdAt, updatedAt, ...values } = r
  return values
}

export default function CreditAuditFormPage(props: {
  accountId: string
  auditId?: string
  mode: 'create' | 'edit'
}) {
  const { accountId, auditId, mode } = props

  const { data: acct, isLoading: acctLoading } = useAccountDetails(
    accountId,
    true
  )
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const existing = useMemo(() => {
    if (!auditId) return undefined
    return creditAuditStore.get(accountId, auditId)
  }, [accountId, auditId])

  const defaultValues: CreditAuditFormValues = useMemo(() => {
    return {
      reportDate: '',
      branchName: '',
      branchCode: '',
      borrowerName: '',
      constitution: 'PROPRIETORSHIP',
      yearOfIncorporation: '1900',
      proprietorPartners: '',
      registeredOfficeAddress: '',
      factoryUnitGodownAddress: '',
      accountNumbers: accountId,
      industryActivity: '',
      bankingWithUsSince: '1900',
      proposalType: 'EXISTING',
      proposalComment: '',
      totalExposureFB: '',
      totalExposureNFB: '',
      borrowerBrief: '',
      operationalPerformanceComment: '',
      checklist: CREDIT_AUDIT_CHECKLIST.map((q) => ({
        id: q.id,
        response: 'NA' as const,
        remark: '',
      })),
      problemLoanReview: '',
      problemLoanHandling: '',
      recoveryActions: '',
      anyOtherActionProposed: '',
      auditorName: '',
      auditorSignatureDate: '',
      auditorSealRef: '',
    }
  }, [accountId])

  type CreditAuditFormInput = z.input<typeof CreditAuditFormSchema>

  const form = useForm<CreditAuditFormInput, unknown, CreditAuditFormValues>({
    resolver: zodResolver(CreditAuditFormSchema),
    defaultValues: existing ? stripMeta(existing) : defaultValues,
    mode: 'onBlur',
  })

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = form

  const checklistFA = useFieldArray({ control, name: 'checklist' })

  useEffect(() => {
    if (checklistFA.fields.length === CREDIT_AUDIT_CHECKLIST.length) return
    reset(existing ? stripMeta(existing) : defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!acct || mode !== 'create') return
    if (acct.branchName) setValue('branchName', acct.branchName)
    if (acct.custName) setValue('borrowerName', acct.custName)
    if (accountId) setValue('accountNumbers', accountId)
  }, [acct, mode, accountId, setValue])

  const onSubmit = async (values: CreditAuditFormValues) => {
    const nowIso = new Date().toISOString()
    const record: CreditAuditStoredRecord = {
      id: existing?.id ?? makeId(),
      accountId,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      ...values,
    }

    creditAuditStore.upsert(accountId, record)
    toast.success(
      mode === 'create' ? 'Credit Audit created' : 'Credit Audit updated'
    )
  }

  return (
    <>
      <Header>
        <BranchSelector
          value={branchId}
          setValue={setBranchId}
          deptValue={deptId}
          deptSetValue={setDeptId}
        />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='px-4 py-4 md:px-8'>
        <AppBreadcrumb
          className='mb-4'
          crumbs={[Home]}
          currentPage={{ type: 'label', label: 'Credit Audit Report' }}
        />

        {/* Centralized Container matching the ESR max-w-5xl */}
        <div className='animate-fadeIn max-w-9xl mx-auto space-y-6 pb-28'>
          <Card className='border-t-accent border-t-4 shadow-sm'>
            <CardHeader className='flex flex-col gap-1.5 py-5'>
              <CardTitle className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold'>
                <ClipboardList className='text-primary h-6 w-6' />
                Credit Audit Report
                <span className='text-muted-foreground ml-1 text-lg font-medium'>
                  — {accountId}
                </span>
              </CardTitle>
              <div className='text-secondary-foreground text-sm font-medium'>
                {acctLoading
                  ? 'Loading account details...'
                  : acct
                    ? `Borrower: ${acct.custName ?? '-'}`
                    : ''}
              </div>
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
            {/* 1. Header / Basic Details */}
            <Card className='border-border shadow-sm'>
              <CardHeader className='bg-muted/20 border-border border-b py-5'>
                <CardTitle className='font-manrope flex items-center gap-2 text-lg'>
                  <Building2 className='text-accent h-5 w-5' />
                  Header / Basic Details
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                {/* STRICT 2-COLUMN GRID */}
                <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Report Date <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      type='date'
                      {...register('reportDate')}
                      className='mt-1.5'
                    />
                    {errors.reportDate?.message && (
                      <div className='text-destructive mt-1.5 text-xs font-medium'>
                        {errors.reportDate.message}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Branch Name <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      {...register('branchName')}
                      disabled
                      className='mt-1.5'
                    />
                    {errors.branchName?.message && (
                      <div className='text-destructive mt-1.5 text-xs font-medium'>
                        {errors.branchName.message}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Branch Code <span className='text-destructive'>*</span>
                    </Label>
                    <Input {...register('branchCode')} className='mt-1.5' />
                    {errors.branchCode?.message && (
                      <div className='text-destructive mt-1.5 text-xs font-medium'>
                        {errors.branchCode.message}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Profile of the Account - Chunked logically */}
            <Card className='border-border shadow-sm'>
              <CardHeader className='bg-muted/20 border-border border-b py-5'>
                <CardTitle className='font-manrope flex items-center gap-2 text-lg'>
                  <User className='text-accent h-5 w-5' />
                  Profile of the Account
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-8 p-6'>
                <div className='space-y-4'>
                  <h3 className='text-primary text-sm font-bold tracking-wider uppercase'>
                    Borrower Details
                  </h3>
                  <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Name of the Borrower{' '}
                        <span className='text-destructive'>*</span>
                      </Label>
                      <Input {...register('borrowerName')} className='mt-1.5' />
                      {errors.borrowerName?.message && (
                        <div className='text-destructive mt-1.5 text-xs font-medium'>
                          {errors.borrowerName.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Constitution <span className='text-destructive'>*</span>
                      </Label>
                      <Controller
                        control={control}
                        name='constitution'
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className='mt-1.5 w-full'>
                              <SelectValue placeholder='Select' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='PROPRIETORSHIP'>
                                Proprietorship
                              </SelectItem>
                              <SelectItem value='PARTNERSHIP'>
                                Partnership
                              </SelectItem>
                              <SelectItem value='COMPANY'>Company</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.constitution?.message && (
                        <div className='text-destructive mt-1.5 text-xs font-medium'>
                          {errors.constitution.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor='year-input'
                        className='text-secondary-foreground'
                      >
                        Year of Incorporation
                      </Label>
                      <Input
                        id='year-input'
                        type='number'
                        min='1900'
                        max={new Date().getFullYear()}
                        placeholder='YYYY'
                        {...register('yearOfIncorporation', {
                          valueAsNumber: true,
                        })}
                        className='focus-visible:ring-ring mt-1.5 transition-shadow focus-visible:ring-2'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Name of Proprietor / Partners
                      </Label>
                      <Input
                        {...register('proprietorPartners')}
                        className='mt-1.5'
                      />
                    </div>
                  </div>
                </div>

                <Separator className='bg-border' />

                <div className='space-y-4'>
                  <h3 className='text-primary text-sm font-bold tracking-wider uppercase'>
                    Addresses
                  </h3>
                  <div className='grid grid-cols-1 gap-5 md:grid-cols-1'>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Address of Registered Office{' '}
                        <span className='text-destructive'>*</span>
                      </Label>
                      {/* Standardized Textarea to perfectly match Input height */}
                      <Textarea
                        {...register('registeredOfficeAddress')}
                        className='mt-1.5 h-10 min-h-[80px] py-2'
                      />
                      {errors.registeredOfficeAddress?.message && (
                        <div className='text-destructive mt-1.5 text-xs font-medium'>
                          {errors.registeredOfficeAddress.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Address of Factory / Unit (If any)
                      </Label>
                      <Textarea
                        {...register('factoryUnitGodownAddress')}
                        className='mt-1.5 h-10 min-h-[80px] py-2'
                      />
                    </div>
                  </div>
                </div>

                <Separator className='bg-border' />

                <div className='space-y-4'>
                  <h3 className='text-primary text-sm font-bold tracking-wider uppercase'>
                    Account & Industry
                  </h3>
                  <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Account No.(s){' '}
                        <span className='text-destructive'>*</span>
                      </Label>
                      <Input
                        {...register('accountNumbers')}
                        className='mt-1.5'
                      />
                      {errors.accountNumbers?.message && (
                        <div className='text-destructive mt-1.5 text-xs font-medium'>
                          {errors.accountNumbers.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Industry / Activity
                      </Label>
                      <Input
                        {...register('industryActivity')}
                        className='mt-1.5'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Banking with us since
                      </Label>
                      <Input
                        id='year-input'
                        type='number'
                        min='1900'
                        max={new Date().getFullYear()}
                        placeholder='YYYY'
                        {...register('bankingWithUsSince', {
                          valueAsNumber: true,
                        })}
                        className='mt-1.5'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Existing / New / Takeover{' '}
                        <span className='text-destructive'>*</span>
                      </Label>
                      <Controller
                        control={control}
                        name='proposalType'
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className='mt-1.5 w-full'>
                              <SelectValue placeholder='Select' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='EXISTING'>Existing</SelectItem>
                              <SelectItem value='NEW'>New</SelectItem>
                              <SelectItem value='TAKEOVER'>Takeover</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.proposalType?.message && (
                        <div className='text-destructive mt-1.5 text-xs font-medium'>
                          {errors.proposalType.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className='bg-border' />

                <div className='space-y-4'>
                  <h3 className='text-primary text-sm font-bold tracking-wider uppercase'>
                    Financials & Comments
                  </h3>
                  <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Total Exposure — FB (Rs. in lakh)
                      </Label>
                      <Input
                        {...register('totalExposureFB')}
                        inputMode='decimal'
                        className='mt-1.5'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Total Exposure — NFB (Rs. in lakh)
                      </Label>
                      <Input
                        {...register('totalExposureNFB')}
                        inputMode='decimal'
                        className='mt-1.5'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Proposal Comment
                      </Label>
                      <Textarea
                        {...register('proposalComment')}
                        className='mt-1.5 h-10 min-h-[40px] py-2'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Borrower — Brief
                      </Label>
                      <Textarea
                        {...register('borrowerBrief')}
                        className='mt-1.5 h-10 min-h-[40px] py-2'
                      />
                    </div>
                    <div>
                      <Label className='text-secondary-foreground'>
                        Operational Performance (Comments)
                      </Label>
                      <Textarea
                        {...register('operationalPerformanceComment')}
                        className='mt-1.5 h-10 min-h-[40px] py-2'
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Checklist */}
            {/* 3. Checklist - Redesigned for High-Density Scanning */}
            <Card className='border-border overflow-hidden shadow-sm'>
              <CardHeader className='bg-muted/20 border-border flex flex-row items-center justify-between border-b px-6 py-4'>
                <CardTitle className='font-manrope flex items-center gap-2 text-lg'>
                  <ShieldCheck className='text-accent h-5 w-5' />
                  Credit Audit Checklist (1–41)
                </CardTitle>
                <div className='text-muted-foreground bg-background border-border hidden rounded-full border px-3 py-1 text-xs font-bold sm:block'>
                  {checklistFA.fields.length} Items
                </div>
              </CardHeader>

              {/* Removed padding to let the rows touch the edges of the card */}
              <CardContent className='p-0'>
                <div className='divide-border divide-y'>
                  {checklistFA.fields.map((f, idx) => {
                    const q = CREDIT_AUDIT_CHECKLIST[idx]
                    const rowErr = errors.checklist?.[idx]

                    return (
                      <div
                        key={f.id}
                        className='hover:bg-muted/5 group flex flex-col gap-4 p-4 transition-colors sm:p-5 lg:flex-row lg:items-start'
                      >
                        {/* Question Text (Left Side) */}
                        <div className='flex flex-1 gap-3'>
                          <span className='text-muted-foreground w-5 shrink-0 pt-0.5 text-sm font-bold'>
                            {q.id}.
                          </span>
                          <span className='text-foreground text-sm leading-relaxed font-medium'>
                            {q.label}
                          </span>
                        </div>

                        {/* Controls (Right Side) */}
                        <div className='flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-[500px]'>
                          {/* Response Field */}
                          <div className='w-full shrink-0 sm:w-36'>
                            <Controller
                              control={control}
                              name={`checklist.${idx}.response` as const}
                              render={({ field }) => (
                                <YesNoNAField
                                  // Passing empty label to save space, assuming your component handles it gracefully
                                  label=''
                                  value={field.value}
                                  onChange={field.onChange}
                                  error={
                                    rowErr?.response?.message as
                                      | string
                                      | undefined
                                  }
                                />
                              )}
                            />
                          </div>

                          {/* Remark Field */}
                          <div className='flex-1'>
                            <Textarea
                              {...register(`checklist.${idx}.remark` as const)}
                              placeholder='Auditor remark (Required if NO)...'
                              className='bg-background focus-visible:ring-ring h-10 min-h-[40px] resize-y py-2 text-sm transition-shadow'
                            />
                            {rowErr?.remark?.message && (
                              <div className='text-destructive mt-1.5 text-xs font-medium'>
                                {rowErr.remark.message as string}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 4. Problem loan management */}
            <Card className='border-border shadow-sm'>
              <CardHeader className='bg-muted/20 border-border border-b py-5'>
                <CardTitle className='font-manrope flex items-center gap-2 text-lg'>
                  <AlertTriangle className='text-accent h-5 w-5' />
                  Problem Loan Management
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Problem Loan Review
                    </Label>
                    <Textarea
                      {...register('problemLoanReview')}
                      className='mt-1.5 h-10 min-h-[40px] py-2'
                    />
                  </div>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Problem Loan Handling
                    </Label>
                    <Textarea
                      {...register('problemLoanHandling')}
                      className='mt-1.5 h-10 min-h-[40px] py-2'
                    />
                  </div>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Actions for Recovery
                    </Label>
                    <Textarea
                      {...register('recoveryActions')}
                      className='mt-1.5 h-10 min-h-[40px] py-2'
                    />
                  </div>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Any other Action Proposed
                    </Label>
                    <Textarea
                      {...register('anyOtherActionProposed')}
                      className='mt-1.5 h-10 min-h-[40px] py-2'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Sign-off */}
            <Card className='border-border shadow-sm'>
              <CardHeader className='bg-muted/20 border-border border-b py-5'>
                <CardTitle className='font-manrope flex items-center gap-2 text-lg'>
                  <PenTool className='text-accent h-5 w-5' />
                  Auditor Sign-off
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                  <div>
                    <Label className='text-secondary-foreground'>
                      Auditor Name <span className='text-destructive'>*</span>
                    </Label>
                    <Input {...register('auditorName')} className='mt-1.5' />
                    {errors.auditorName?.message && (
                      <div className='text-destructive mt-1.5 text-xs font-medium'>
                        {errors.auditorName.message}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className='text-secondary-foreground'>
                      Signature Date <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      type='date'
                      {...register('auditorSignatureDate')}
                      className='mt-1.5'
                    />
                    {errors.auditorSignatureDate?.message && (
                      <div className='text-destructive mt-1.5 text-xs font-medium'>
                        {errors.auditorSignatureDate.message}
                      </div>
                    )}
                  </div>

                  {/* <div>
                    <Label className='text-secondary-foreground'>
                      Seal / Reference
                    </Label>
                    <Input {...register('auditorSealRef')} className='mt-1.5' />
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* 6. Fixed action bar */}
            <div className='border-border bg-background/85 fixed right-0 bottom-0 left-0 z-40 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all'>
              <div className='mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4'>
                <div className='text-muted-foreground hidden text-sm font-medium sm:block'>
                  {mode === 'create'
                    ? 'Creating new record'
                    : 'Editing existing record'}
                </div>

                <div className='flex w-full items-center gap-3 sm:w-auto'>
                  <Button
                    type='button'
                    variant='outline'
                    className='bg-background flex-1 gap-2 shadow-sm sm:flex-none'
                    onClick={() =>
                      reset(existing ? stripMeta(existing) : defaultValues)
                    }
                    disabled={isSubmitting}
                  >
                    <RotateCcw className='h-4 w-4' />
                    Reset
                  </Button>

                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='bg-primary text-primary-foreground flex-1 gap-2 shadow-sm transition-all hover:brightness-105 sm:flex-none'
                  >
                    <Save className='h-4 w-4' />
                    {isSubmitting
                      ? 'Saving...'
                      : mode === 'create'
                        ? 'Create Report'
                        : 'Update Report'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Main>
    </>
  )
}
