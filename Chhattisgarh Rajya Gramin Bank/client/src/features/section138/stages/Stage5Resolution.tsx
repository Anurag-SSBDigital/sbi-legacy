import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { useSection138 } from '../Section138Provider'
import { StageShell } from '../components/StageShell'

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

const Schema = BaseSchema

export default function Stage5Resolution() {
  const { record, save, closeCase } = useSection138()

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
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

  const onSave = (v: FormValues) => {
    save({ stage5: { ...record.stage5, ...v } })
    toast.success('Stage 5 saved.')
  }

  const onClose = async () => {
    const v = form.getValues()

    // minimal closure rules
    if (!v.caseClosedDate) {
      toast.error('Case Closed Date is required to close the case.')
      return
    }
    if (!v.decisionType) {
      toast.error('Decision Type is required to close the case.')
      return
    }

    onSave(v)
    closeCase()
    toast.success('Case closed successfully.')
  }

  return (
    <StageShell title='Stage 5: Case Resolution & Closure' stage='STAGE_5'>
      <form className='space-y-4' onSubmit={form.handleSubmit(onSave)}>
        <Card>
          <CardHeader>
            <CardTitle>Judgment / Order Details</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Judgment Date</Label>
              <Input type='date' {...form.register('judgmentDate')} />
            </div>

            <div className='space-y-2'>
              <Label>Decision Type *</Label>
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
            </div>

            <div className='space-y-2 md:col-span-3'>
              <Label>Final Order Summary</Label>
              <Textarea
                {...form.register('finalOrderSummary')}
                placeholder='Order summary / key directions...'
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery / Settlement</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='space-y-2'>
              <Label>Settlement Amount</Label>
              <Input type='number' {...form.register('settlementAmount')} />
            </div>
            <div className='space-y-2'>
              <Label>Amount Recovered</Label>
              <Input type='number' {...form.register('amountRecovered')} />
            </div>
            <div className='space-y-2'>
              <Label>Recovery Date</Label>
              <Input type='date' {...form.register('recoveryDate')} />
            </div>
            <div className='space-y-2'>
              <Label>Balance Outstanding</Label>
              <Input type='number' {...form.register('balanceOutstanding')} />
            </div>

            <div className='flex items-center gap-2 md:col-span-4'>
              <Checkbox
                checked={form.watch('accountUpdatedInCore')}
                onCheckedChange={(v) =>
                  form.setValue('accountUpdatedInCore', !!v)
                }
              />
              <Label className='cursor-pointer'>
                Account updated in Core System
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closure</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Case Closed Date *</Label>
              <Input type='date' {...form.register('caseClosedDate')} />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>Closure Remarks</Label>
              <Textarea
                {...form.register('closureRemarks')}
                placeholder='Closure notes...'
              />
            </div>

            <div className='flex items-center justify-end gap-2 md:col-span-2'>
              <Button type='submit' variant='outline'>
                Save
              </Button>
              <Button
                type='button'
                onClick={onClose}
                disabled={record.overallStatus === 'CLOSED'}
              >
                Close Case
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </StageShell>
  )
}
