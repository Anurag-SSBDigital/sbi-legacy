import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import {
  Trophy,
  CreditCard,
  Archive,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useSection138 } from '@/features/section138/Section138Provider'
import { StageShell } from '@/features/section138/components/StageShell'

const BaseSchema = z.object({
  judgmentDate: z.string().optional(),
  decisionType: z
    .enum(['CONVICTED', 'ACQUITTED', 'COMPOUNDED', 'WITHDRAWN'])
    .optional(),
  finalOrderSummary: z.string().optional(),

  settlementAmount: z.coerce.number().nonnegative().optional(),
  amountRecovered: z.coerce.number().nonnegative().optional(),
  recoveryDate: z.string().optional(),
  balanceOutstanding: z.coerce.number().nonnegative().optional(),

  caseClosedDate: z.string().optional(),
  closureRemarks: z.string().optional(),
  accountUpdatedInCore: z.boolean(),
})

type FormValues = z.infer<typeof BaseSchema>

export const Route = createFileRoute(
  '/_authenticated/section138/$caseId/stage-5'
)({
  component: Stage5,
})

function Stage5() {
  const { record, save, closeCase } = useSection138()

  const form = useForm<FormValues>({
    resolver: zodResolver(BaseSchema) as Resolver<FormValues>,
    defaultValues: {
      judgmentDate: record.stage5.judgmentDate ?? '',
      decisionType: record.stage5.decisionType ?? undefined,
      finalOrderSummary: record.stage5.finalOrderSummary ?? '',

      settlementAmount: record.stage5.settlementAmount ?? undefined,
      amountRecovered: record.stage5.amountRecovered ?? undefined,
      recoveryDate: record.stage5.recoveryDate ?? '',
      balanceOutstanding: record.stage5.balanceOutstanding ?? undefined,

      caseClosedDate: record.stage5.caseClosedDate ?? '',
      closureRemarks: record.stage5.closureRemarks ?? '',
      accountUpdatedInCore: record.stage5.accountUpdatedInCore ?? false,
    },
  })

  const isClosed = record.overallStatus === 'CLOSED'

  const onSave = (v: FormValues) => {
    save({ stage5: { ...record.stage5, ...v } })
    toast.success('Stage 5 saved.')
  }

  const onClose = async () => {
    const v = form.getValues()
    if (!v.caseClosedDate || !v.decisionType) {
      toast.error('Closed Date and Decision Type are required.')
      return
    }
    onSave(v)
    closeCase()
    toast.success('Case closed successfully.')
  }

  return (
    <StageShell title='Resolution & Closure' stage='STAGE_5'>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSave)}>
        {isClosed && (
          <div className='flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4'>
            <CheckCircle2 className='h-5 w-5 text-emerald-600' />
            <div>
              <div className='text-sm font-bold text-emerald-900'>
                Case is Closed
              </div>
              <div className='text-xs text-emerald-700'>
                This case has been successfully resolved.
              </div>
            </div>
          </div>
        )}

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Trophy className='h-5 w-5 text-amber-500' />
              Court Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-2'>
            <FormField label='Judgment Date'>
              <Input type='date' {...form.register('judgmentDate')} />
            </FormField>
            <FormField label='Decision Type'>
              <Select
                value={form.watch('decisionType') || ''}
                onValueChange={(v) =>
                  form.setValue('decisionType', v as FormValues['decisionType'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select decision type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CONVICTED'>Convicted</SelectItem>
                  <SelectItem value='ACQUITTED'>Acquitted</SelectItem>
                  <SelectItem value='COMPOUNDED'>Compounded</SelectItem>
                  <SelectItem value='WITHDRAWN'>Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label='Order Summary' className='md:col-span-2'>
              <Textarea
                {...form.register('finalOrderSummary')}
                className='min-h-[80px]'
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <CreditCard className='text-muted-foreground h-5 w-5' />
              Recovery Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6 pt-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
              <FormField label='Settled Amount'>
                <div className='relative'>
                  <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                  <Input
                    type='number'
                    {...form.register('settlementAmount')}
                    className='pl-8'
                  />
                </div>
              </FormField>
              <FormField label='Amt Recovered'>
                <div className='relative'>
                  <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                  <Input
                    type='number'
                    {...form.register('amountRecovered')}
                    className='pl-8'
                  />
                </div>
              </FormField>
              <FormField label='Date'>
                <Input type='date' {...form.register('recoveryDate')} />
              </FormField>
              <FormField label='Balance'>
                <div className='relative'>
                  <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                  <Input
                    type='number'
                    {...form.register('balanceOutstanding')}
                    className='pl-8'
                  />
                </div>
              </FormField>
            </div>
            <div className='bg-muted/20 flex items-center gap-3 rounded-lg border p-4'>
              <Checkbox
                id='cbs-updated'
                checked={form.watch('accountUpdatedInCore')}
                onCheckedChange={(v) =>
                  form.setValue('accountUpdatedInCore', !!v)
                }
              />
              <Label
                htmlFor='cbs-updated'
                className='cursor-pointer text-sm font-bold'
              >
                Account updated in CBS
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Archive className='text-muted-foreground h-5 w-5' />
              Final Closure
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-2'>
            <FormField label='Closed Date *'>
              <Input type='date' {...form.register('caseClosedDate')} />
            </FormField>
            <FormField label='Remarks' className='md:col-span-2'>
              <Textarea {...form.register('closureRemarks')} />
            </FormField>
            <div className='flex items-center justify-end gap-3 border-t pt-6 md:col-span-2'>
              <Button type='submit' variant='outline' className='px-6'>
                Save Progress
              </Button>
              <Button
                type='button'
                onClick={onClose}
                disabled={isClosed}
                className='px-8 text-white'
              >
                {isClosed ? 'Case Closed' : 'Finalize & Close Case'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
