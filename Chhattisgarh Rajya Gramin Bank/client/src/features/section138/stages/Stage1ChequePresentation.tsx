import { useEffect } from 'react'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Activity, User, CreditCard, ClipboardCheck } from 'lucide-react'
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
import { useSection138 } from '../Section138Provider'
import { StageShell } from '../components/StageShell'

const BaseSchema = z.object({
  acctNo: z.string().min(1, 'Account number is required'),
  borrowerName: z.string().optional(),
  borrowerMobile: z.string().optional(),
  borrowerAddress: z.string().optional(),

  chequeNumber: z.string().min(1, 'Cheque number is required'),
  chequeDate: z.string().min(1, 'Cheque date is required'),
  chequeAmount: z.coerce.number().positive('Cheque amount must be > 0'),
  drawnOnBankName: z.string().optional(),
  bankBranchName: z.string().optional(),
  accountType: z.string().optional(),
  dateOfPresentation: z.string().min(1, 'Presentation date is required'),

  presentationStatus: z.enum(['PRESENTED', 'RETURNED']),
  dateOfReturn: z.string().optional(),
  returnReason: z.string().optional(),
})

type FormValues = z.infer<typeof BaseSchema>

const Schema = BaseSchema.superRefine((val, ctx) => {
  if (val.presentationStatus === 'RETURNED') {
    if (!val.dateOfReturn)
      ctx.addIssue({
        code: 'custom',
        path: ['dateOfReturn'],
        message: 'Return date is required',
      })
    if (!val.returnReason)
      ctx.addIssue({
        code: 'custom',
        path: ['returnReason'],
        message: 'Return reason is required',
      })
  }
})

export default function Stage1ChequePresentation() {
  const { record, save, goStage } = useSection138()
  const navigate = useNavigate()

  const acctNo = record.stage1.acctNo ?? ''
  const { data: account, isLoading } = useAccountDetails(acctNo, !!acctNo)

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      acctNo: record.stage1.acctNo ?? '',
      borrowerName: record.stage1.borrowerName ?? '',
      borrowerMobile: record.stage1.borrowerMobile ?? '',
      borrowerAddress: record.stage1.borrowerAddress ?? '',

      chequeNumber: record.stage1.chequeNumber ?? '',
      chequeDate: record.stage1.chequeDate ?? '',
      chequeAmount: record.stage1.chequeAmount ?? undefined,
      drawnOnBankName: record.stage1.drawnOnBankName ?? '',
      bankBranchName: record.stage1.bankBranchName ?? '',
      accountType: record.stage1.accountType ?? '',
      dateOfPresentation: record.stage1.dateOfPresentation ?? '',

      presentationStatus: record.stage1.presentationStatus ?? 'PRESENTED',
      dateOfReturn: record.stage1.dateOfReturn ?? '',
      returnReason: record.stage1.returnReason ?? '',
    },
  })

  useEffect(() => {
    if (!account) return
    const current = form.getValues()
    const addr = [account.add1, account.add2, account.add3, account.add4]
      .filter(Boolean)
      .join(', ')

    form.reset({
      ...current,
      borrowerName:
        current.borrowerName ||
        record.stage1.borrowerName ||
        account.custName ||
        '',
      borrowerMobile:
        current.borrowerMobile ||
        record.stage1.borrowerMobile ||
        account.telNo ||
        '',
      borrowerAddress:
        current.borrowerAddress || record.stage1.borrowerAddress || addr || '',
      accountType:
        current.accountType ||
        record.stage1.accountType ||
        account.actType ||
        '',
    })
  }, [account?.acctNo])

  const status = form.watch('presentationStatus')

  const onSave = (v: FormValues) => {
    save({
      stage1: {
        ...record.stage1,
        ...v,
        branchName:
          record.stage1.branchName ?? account?.branchName ?? undefined,
      },
    })
    toast.success('Stage 1 saved.')
  }

  const onNext = async () => {
    const ok = await form.trigger()
    if (!ok) return
    onSave(form.getValues())
    goStage('STAGE_2')
    navigate({
      to: '/section138/$caseId/stage-2',
      params: { caseId: record.id },
    })
  }

  return (
    <StageShell title='Cheque Presentation' stage='STAGE_1'>
      <div className='space-y-6'>
        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/40 border-b pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Activity className='text-primary h-5 w-5' />
              CBS Account Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 p-4 md:grid-cols-3'>
            <SnapshotField
              label='Customer Name'
              value={account?.custName}
              loading={isLoading}
            />
            <SnapshotField
              label='Outstanding'
              value={
                account?.outstand != null
                  ? `₹ ${Number(account.outstand).toLocaleString('en-IN')}`
                  : undefined
              }
              loading={isLoading}
            />
            <SnapshotField
              label='Branch'
              value={account?.branchName}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <form className='space-y-6' onSubmit={form.handleSubmit(onSave)}>
          <Card className='shadow-sm'>
            <CardHeader className='bg-muted/20 border-b'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <User className='text-muted-foreground h-5 w-5' />
                Borrower & Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-2'>
              <FormField label='Account Number *'>
                <Input
                  {...form.register('acctNo')}
                  placeholder='Account number'
                />
              </FormField>
              <FormField label='Borrower Name'>
                <Input
                  {...form.register('borrowerName')}
                  placeholder='Full name'
                />
              </FormField>
              <FormField label='Borrower Mobile'>
                <Input
                  {...form.register('borrowerMobile')}
                  placeholder='Mobile'
                />
              </FormField>
              <FormField label='Borrower Address'>
                <Input
                  {...form.register('borrowerAddress')}
                  placeholder='Address'
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className='shadow-sm'>
            <CardHeader className='bg-muted/20 border-b'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <CreditCard className='text-muted-foreground h-5 w-5' />
                Cheque Particulars
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
              <FormField label='Cheque Number *'>
                <Input {...form.register('chequeNumber')} />
              </FormField>
              <FormField label='Cheque Date *'>
                <Input type='date' {...form.register('chequeDate')} />
              </FormField>
              <FormField label='Cheque Amount *'>
                <div className='relative'>
                  <span className='text-muted-foreground absolute top-2.5 left-3 text-xs font-semibold'>
                    ₹
                  </span>
                  <Input
                    type='number'
                    {...form.register('chequeAmount')}
                    className='pl-6'
                  />
                </div>
              </FormField>
              <FormField label='Drawn On Bank'>
                <Input {...form.register('drawnOnBankName')} />
              </FormField>
              <FormField label='Bank Branch'>
                <Input {...form.register('bankBranchName')} />
              </FormField>
              <FormField label='Account Type'>
                <Input {...form.register('accountType')} />
              </FormField>
              <FormField label='Date of Presentation *'>
                <Input type='date' {...form.register('dateOfPresentation')} />
              </FormField>
            </CardContent>
          </Card>

          <Card className='shadow-sm'>
            <CardHeader className='bg-muted/20 border-b'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <ClipboardCheck className='text-muted-foreground h-5 w-5' />
                Presentation Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
              <FormField label='Status *'>
                <Select
                  value={form.watch('presentationStatus')}
                  onValueChange={(v) =>
                    form.setValue(
                      'presentationStatus',
                      v as FormValues['presentationStatus']
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PRESENTED'>
                      Presented Successfully
                    </SelectItem>
                    <SelectItem value='RETURNED'>Returned / Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {status === 'RETURNED' && (
                <>
                  <FormField label='Date of Return *'>
                    <Input type='date' {...form.register('dateOfReturn')} />
                  </FormField>
                  <FormField label='Return Reason *'>
                    <Input {...form.register('returnReason')} />
                  </FormField>
                </>
              )}
            </CardContent>
          </Card>

          <div className='flex items-center justify-end gap-3 border-t pt-6'>
            <Button type='submit' variant='outline' className='px-8'>
              Save
            </Button>
            <Button type='button' onClick={onNext} className='px-8 text-white'>
              Save & Next
            </Button>
          </div>
        </form>
      </div>
    </StageShell>
  )
}

function SnapshotField({
  label,
  value,
  loading,
}: {
  label: string
  value?: string | number | null
  loading?: boolean
}) {
  return (
    <div className='bg-background flex flex-col gap-0.5 rounded-lg border border-dashed p-3'>
      <div className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
        {label}
      </div>
      <div className='text-sm font-semibold'>
        {loading
          ? 'Loading…'
          : value !== null && value !== undefined
            ? String(value)
            : '-'}
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-muted-foreground ml-0.5 text-[10px] font-bold tracking-wider uppercase'>
        {label}
      </Label>
      {children}
    </div>
  )
}
