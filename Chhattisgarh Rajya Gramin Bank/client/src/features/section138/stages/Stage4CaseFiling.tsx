import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  Gavel,
  IndianRupee,
  CalendarSearch,
  Files,
  Trash2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import { Textarea } from '@/components/ui/textarea'
import { useSection138 } from '../Section138Provider'
import { StageShell } from '../components/StageShell'

const Schema = z.object({
  caseFiledDate: z.string().min(1, 'Case filed date is required'),
  courtName: z.string().min(1, 'Court name is required'),
  courtType: z.string().optional(),
  caseNumber: z.string().optional(),
  complaintNumber: z.string().optional(),
  filingAdvocateName: z.string().optional(),

  amountClaimed: z.coerce.number().nonnegative().optional(),
  courtFeesPaid: z.coerce.number().nonnegative().optional(),
  advocateFees: z.coerce.number().nonnegative().optional(),

  firstHearingDate: z.string().optional(),
  nextHearingDate: z.string().optional(),
  caseStatus: z
    .enum(['PENDING', 'UNDER_TRIAL', 'SETTLED', 'DISMISSED'])
    .optional(),

  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

export default function Stage4CaseFiling() {
  const { record, save, goStage } = useSection138()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      caseFiledDate: record.stage4.caseFiledDate ?? '',
      courtName: record.stage4.courtName ?? '',
      courtType: record.stage4.courtType ?? 'Judicial Magistrate',
      caseNumber: record.stage4.caseNumber ?? '',
      complaintNumber: record.stage4.complaintNumber ?? '',
      filingAdvocateName: record.stage4.filingAdvocateName ?? '',

      amountClaimed:
        record.stage4.amountClaimed ?? record.stage1.chequeAmount ?? undefined,
      courtFeesPaid: record.stage4.courtFeesPaid ?? undefined,
      advocateFees: record.stage4.advocateFees ?? undefined,

      firstHearingDate: record.stage4.firstHearingDate ?? '',
      nextHearingDate: record.stage4.nextHearingDate ?? '',
      caseStatus: record.stage4.caseStatus ?? 'PENDING',

      documents: record.stage4.documents ?? [],
      notes: '',
    },
  })

  const docs = form.watch('documents') ?? []

  const addDocs = (files: FileList | null) => {
    if (!files?.length) return
    const next = [...docs, ...Array.from(files).map((f) => f.name)]
    form.setValue('documents', Array.from(new Set(next)))
  }

  const removeDoc = (name: string) => {
    form.setValue(
      'documents',
      docs.filter((d) => d !== name)
    )
  }

  const onSave = (v: FormValues) => {
    save({ stage4: { ...record.stage4, ...v, documents: v.documents ?? [] } })
    toast.success('Stage 4 saved.')
  }

  const onNext = async () => {
    const ok = await form.trigger()
    if (!ok) return
    onSave(form.getValues())
    goStage('STAGE_5')
    navigate({
      to: '/section138/$caseId/stage-5',
      params: { caseId: record.id },
    })
  }

  return (
    <StageShell title='Case Filing' stage='STAGE_4'>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSave)}>
        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Gavel className='text-muted-foreground h-5 w-5' />
              Court Filing Particulars
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
            <FormField label='Filing Date *'>
              <Input type='date' {...form.register('caseFiledDate')} />
            </FormField>
            <FormField label='Court Name *'>
              <Input
                {...form.register('courtName')}
                placeholder='e.g., JMFC Court'
              />
            </FormField>
            <FormField label='Court Type'>
              <Input {...form.register('courtType')} />
            </FormField>
            <FormField label='Case Number'>
              <Input {...form.register('caseNumber')} />
            </FormField>
            <FormField label='Complaint No'>
              <Input {...form.register('complaintNumber')} />
            </FormField>
            <FormField label='Advocate'>
              <Input {...form.register('filingAdvocateName')} />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <CalendarSearch className='text-muted-foreground h-5 w-5' />
              Financials & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
            <FormField label='Amount Claimed'>
              <div className='relative'>
                <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                <Input
                  type='number'
                  {...form.register('amountClaimed')}
                  className='pl-8'
                />
              </div>
            </FormField>
            <FormField label='Court Fees'>
              <div className='relative'>
                <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                <Input
                  type='number'
                  {...form.register('courtFeesPaid')}
                  className='pl-8'
                />
              </div>
            </FormField>
            <FormField label='Advocate Fees'>
              <div className='relative'>
                <IndianRupee className='text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5' />
                <Input
                  type='number'
                  {...form.register('advocateFees')}
                  className='pl-8'
                />
              </div>
            </FormField>
            <FormField label='First Hearing'>
              <Input type='date' {...form.register('firstHearingDate')} />
            </FormField>
            <FormField label='Next Hearing'>
              <Input type='date' {...form.register('nextHearingDate')} />
            </FormField>
            <FormField label='Case Status'>
              <Select
                value={form.watch('caseStatus') || ''}
                onValueChange={(v) =>
                  form.setValue('caseStatus', v as FormValues['caseStatus'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='UNDER_TRIAL'>Under Trial</SelectItem>
                  <SelectItem value='SETTLED'>Settled</SelectItem>
                  <SelectItem value='DISMISSED'>Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label='Notes' className='md:col-span-3'>
              <Textarea {...form.register('notes')} className='min-h-[80px]' />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Files className='text-muted-foreground h-5 w-5' />
              Documents Upload
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 pt-6'>
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                Attach Files
              </Label>
              <Input
                type='file'
                multiple
                onChange={(e) => addDocs(e.target.files)}
                className='cursor-pointer'
              />
              <div className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-medium'>
                <Info className='h-3 w-3' /> File names will be stored locally.
              </div>
            </div>

            {docs.length > 0 ? (
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {docs.map((d) => (
                  <div
                    key={d}
                    className='bg-background flex items-center justify-between rounded-lg border p-2'
                  >
                    <div className='flex items-center gap-2 truncate'>
                      <Files className='text-muted-foreground h-3.5 w-3.5' />
                      <span className='truncate text-xs font-semibold'>
                        {d}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeDoc(d)}
                      className='text-muted-foreground hover:text-destructive h-6 w-6 rounded-full p-0'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='bg-muted/5 flex flex-col items-center justify-center rounded-lg border border-dashed p-6'>
                <Files className='text-muted-foreground/40 mb-1 h-6 w-6' />
                <span className='text-muted-foreground text-xs'>
                  No documents attached.
                </span>
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
