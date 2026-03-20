import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Mail, FileWarning, CircleDollarSign, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

const optionalNumber = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}, z.number().nonnegative().optional())

const BaseSchema = z.object({
  noticeDate: z.string().min(1, 'Notice date is required'),
  dispatchMode: z.enum(['REGD_AD', 'UPC', 'BY_HAND']),
  noticeRefNo: z.string().optional(),

  dishonourDate: z.string().min(1, 'Dishonour date is required'),
  dishonourReason: z.string().min(1, 'Dishonour reason is required'),
  chequeReturnMemoDate: z.string().optional(),

  paymentReceivedWithin15Days: z.boolean(),
  paymentDate: z.string().optional(),
  paymentAmount: optionalNumber,
  paymentRemarks: z.string().optional(),
})

type FormValues = z.infer<typeof BaseSchema>

const Schema = BaseSchema.superRefine((v, ctx) => {
  if (v.paymentReceivedWithin15Days) {
    if (!v.paymentDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentDate'],
        message: 'Required',
      })
    }
    if (!v.paymentAmount || v.paymentAmount <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentAmount'],
        message: 'Must be > 0',
      })
    }
  }
})

export default function Stage3LegalNotice() {
  const { record, save, goStage, closeCase } = useSection138()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      noticeDate: record.stage3.noticeDate ?? '',
      dispatchMode: record.stage3.dispatchMode ?? 'REGD_AD',
      noticeRefNo: record.stage3.noticeRefNo ?? '',

      dishonourDate:
        record.stage3.dishonourDate ?? record.stage1.dateOfReturn ?? '',
      dishonourReason:
        record.stage3.dishonourReason ?? record.stage1.returnReason ?? '',
      chequeReturnMemoDate: record.stage3.chequeReturnMemoDate ?? '',

      paymentReceivedWithin15Days:
        record.stage3.paymentReceivedWithin15Days ?? false,
      paymentDate: record.stage3.paymentDate ?? '',
      paymentAmount: record.stage3.paymentAmount ?? undefined,
      paymentRemarks: record.stage3.paymentRemarks ?? '',
    },
  })

  const paid = form.watch('paymentReceivedWithin15Days')

  const onSave = (v: FormValues) => {
    save({ stage3: { ...record.stage3, ...v } })
    toast.success('Stage 3 saved.')
  }

  const onNext = async () => {
    const ok = await form.trigger()
    if (!ok) return
    const v = form.getValues()
    onSave(v)

    if (v.paymentReceivedWithin15Days) {
      save({
        stage5: {
          ...record.stage5,
          decisionType: 'COMPOUNDED',
          settlementAmount: v.paymentAmount,
          amountRecovered: v.paymentAmount,
          recoveryDate: v.paymentDate,
          caseClosedDate: v.paymentDate,
          closureRemarks:
            record.stage5.closureRemarks ?? 'Settled within 15 days.',
        },
      })
      goStage('STAGE_5')
      closeCase()
      navigate({
        to: '/section138/$caseId/stage-5',
        params: { caseId: record.id },
      })
      return
    }

    goStage('STAGE_4')
    navigate({
      to: '/section138/$caseId/stage-4',
      params: { caseId: record.id },
    })
  }

  return (
    <StageShell title='Legal Notice' stage='STAGE_3'>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSave)}>
        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Mail className='text-muted-foreground h-5 w-5' />
              Notice Dispatch Details
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
            <FormField label='Notice Date *'>
              <Input type='date' {...form.register('noticeDate')} />
            </FormField>
            <FormField label='Dispatch Mode *'>
              <Select
                value={form.watch('dispatchMode')}
                onValueChange={(v) =>
                  form.setValue('dispatchMode', v as FormValues['dispatchMode'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select mode' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='REGD_AD'>Registered AD</SelectItem>
                  <SelectItem value='UPC'>UPC</SelectItem>
                  <SelectItem value='BY_HAND'>By Hand</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label='Reference Number'>
              <Input
                {...form.register('noticeRefNo')}
                placeholder='e.g. L/123/2024'
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <FileWarning className='h-5 w-5 text-amber-500' />
              Dishonour Particulars
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
            <FormField label='Dishonour Date *'>
              <Input type='date' {...form.register('dishonourDate')} />
            </FormField>
            <FormField label='Reason *'>
              <Input {...form.register('dishonourReason')} />
            </FormField>
            <FormField label='Memo Date'>
              <Input type='date' {...form.register('chequeReturnMemoDate')} />
            </FormField>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'shadow-sm transition-colors',
            paid && 'border-emerald-200'
          )}
        >
          <CardHeader
            className={cn(
              'bg-muted/20 border-b',
              paid && 'bg-emerald-50/50 dark:bg-emerald-950/20'
            )}
          >
            <CardTitle className='flex items-center gap-2 text-lg'>
              <CircleDollarSign
                className={cn(
                  'h-5 w-5',
                  paid ? 'text-emerald-600' : 'text-muted-foreground'
                )}
              />
              15-Day Payment Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6 pt-6'>
            <div className='bg-background flex items-center gap-3 rounded-lg border p-4'>
              <Checkbox
                id='paid-within-15'
                checked={paid}
                onCheckedChange={(v) =>
                  form.setValue('paymentReceivedWithin15Days', !!v)
                }
              />
              <Label
                htmlFor='paid-within-15'
                className='cursor-pointer text-base font-bold'
              >
                Payment received within 15 days
              </Label>
            </div>

            {paid && (
              <div className='bg-muted/10 grid grid-cols-1 gap-6 rounded-lg border border-dashed p-4 md:grid-cols-3'>
                <FormField label='Payment Date *'>
                  <Input type='date' {...form.register('paymentDate')} />
                </FormField>
                <FormField label='Amount *'>
                  <div className='relative'>
                    <span className='text-muted-foreground absolute top-2.5 left-3 text-xs font-semibold'>
                      ₹
                    </span>
                    <Input
                      type='number'
                      {...form.register('paymentAmount')}
                      className='pl-6'
                    />
                  </div>
                </FormField>
                <FormField label='Remarks'>
                  <Input
                    {...form.register('paymentRemarks')}
                    placeholder='NEFT/Cash...'
                  />
                </FormField>
                <div className='flex items-center gap-2 text-xs font-medium text-emerald-700 md:col-span-3'>
                  <CheckCircle2 className='h-3.5 w-3.5' />
                  Case will be marked as Compounded and Closed.
                </div>
              </div>
            )}
            {!paid && (
              <div className='rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs font-medium text-amber-700'>
                If payment is not received within 15 days, proceed to court case
                filing.
              </div>
            )}
          </CardContent>
        </Card>

        <div className='flex items-center justify-end gap-3 border-t pt-6'>
          <Button type='submit' variant='outline' className='px-8'>
            Save
          </Button>
          <Button type='button' onClick={onNext} className='px-8 text-white'>
            Save & Continue
          </Button>
        </div>
      </form>
    </StageShell>
  )
}

function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className='text-muted-foreground ml-0.5 text-[10px] font-bold tracking-wider uppercase'>
        {label}
      </Label>
      {children}
    </div>
  )
}
