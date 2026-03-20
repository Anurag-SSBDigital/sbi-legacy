import { useEffect } from 'react'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, ShieldCheck, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useAccountDetails from '@/hooks/use-account-details'
import useBranchDepartmentInfo from '@/hooks/use-branch-department-info'
import useBranchOptions from '@/hooks/use-branch-dropdown'
import useDepartmentOptions from '@/hooks/use-department-dropdown'
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

const Schema = z.object({
  irregularityDate: z.string().optional(),
  overdueAmount: z.coerce.number().nonnegative().optional(),
  defaultFrom: z.string().optional(),
  defaultTo: z.string().optional(),
  reasonForDefault: z.string().optional(),

  reminderCallsMade: z.boolean(),
  writtenNoticeIssued: z.boolean(),
  personalVisitConducted: z.boolean(),
  recoveryRemarks: z.string().optional(),

  recommendedFor138: z.boolean(),
  recommendationRemarks: z.string().optional(),

  departmentId: z.string().optional(),
  branchId: z.string().optional(),

  preparedBy: z.string().optional(),
  verifiedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  approvalDate: z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

export default function Stage2AdminApproval() {
  const { record, save, goStage } = useSection138()
  const navigate = useNavigate()

  const acctNo = record.stage1.acctNo ?? ''
  const { data: account } = useAccountDetails(acctNo, !!acctNo)
  const { data: branchDeptInfo } = useBranchDepartmentInfo(acctNo, !!acctNo)

  const deptIdFromApi =
    (branchDeptInfo as { data?: { departmentId?: string } | null })?.data
      ?.departmentId ?? undefined
  const branchIdFromApi =
    (branchDeptInfo as { data?: { branchId?: string } | null })?.data
      ?.branchId ?? undefined

  const deptOptions = useDepartmentOptions(true)
  const deptIdForBranchDropdown =
    record.stage2.departmentId ?? deptIdFromApi ?? null
  const branchOptions = useBranchOptions(deptIdForBranchDropdown, true)

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      irregularityDate: record.stage2.irregularityDate ?? '',
      overdueAmount: record.stage2.overdueAmount ?? undefined,
      defaultFrom: record.stage2.defaultFrom ?? '',
      defaultTo: record.stage2.defaultTo ?? '',
      reasonForDefault: record.stage2.reasonForDefault ?? '',

      reminderCallsMade: record.stage2.reminderCallsMade ?? false,
      writtenNoticeIssued: record.stage2.writtenNoticeIssued ?? false,
      personalVisitConducted: record.stage2.personalVisitConducted ?? false,
      recoveryRemarks: record.stage2.recoveryRemarks ?? '',

      recommendedFor138: record.stage2.recommendedFor138 ?? false,
      recommendationRemarks: record.stage2.recommendationRemarks ?? '',

      departmentId: record.stage2.departmentId ?? deptIdFromApi ?? '',
      branchId: record.stage2.branchId ?? branchIdFromApi ?? '',

      preparedBy: record.stage2.preparedBy ?? '',
      verifiedBy: record.stage2.verifiedBy ?? '',
      approvedBy: record.stage2.approvedBy ?? '',
      approvalDate: record.stage2.approvalDate ?? '',
    },
  })

  useEffect(() => {
    if (!account) return
    const cur = form.getValues()
    form.reset({
      ...cur,
      irregularityDate:
        cur.irregularityDate ||
        record.stage2.irregularityDate ||
        account.irrgDt ||
        '',
      overdueAmount:
        cur.overdueAmount ??
        record.stage2.overdueAmount ??
        account.irregAmt ??
        undefined,
    })
  }, [account?.acctNo])

  const departmentId = form.watch('departmentId')
  useEffect(() => {
    if (!departmentId) return
    form.setValue('branchId', '')
  }, [departmentId])

  const onSave = (v: FormValues) => {
    save({ stage2: { ...record.stage2, ...v } })
    toast.success('Stage 2 saved.')
  }

  const onNext = async () => {
    const ok = await form.trigger()
    if (!ok) return
    onSave(form.getValues())
    goStage('STAGE_3')
    navigate({
      to: '/section138/$caseId/stage-3',
      params: { caseId: record.id },
    })
  }

  return (
    <StageShell title='Administrative Approval' stage='STAGE_2'>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSave)}>
        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <AlertCircle className='h-5 w-5 text-amber-500' />
              Irregularity / Default Details
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
            <FormField label='Date Irregular'>
              <Input type='date' {...form.register('irregularityDate')} />
            </FormField>
            <FormField label='Overdue Amount'>
              <div className='relative'>
                <span className='text-muted-foreground absolute top-2.5 left-3 text-xs font-semibold'>
                  ₹
                </span>
                <Input
                  type='number'
                  {...form.register('overdueAmount')}
                  className='pl-6'
                />
              </div>
            </FormField>
            <FormField label='Reason for Default'>
              <Input
                {...form.register('reasonForDefault')}
                placeholder='e.g. Failure in business'
              />
            </FormField>
            <FormField label='Default Period From'>
              <Input type='date' {...form.register('defaultFrom')} />
            </FormField>
            <FormField label='Default Period To'>
              <Input type='date' {...form.register('defaultTo')} />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <CheckCircle className='h-5 w-5 text-emerald-500' />
              Recovery Actions Taken
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6 pt-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <CheckboxField
                label='Reminder Calls Made'
                checked={form.watch('reminderCallsMade')}
                onCheckedChange={(v) => form.setValue('reminderCallsMade', v)}
              />
              <CheckboxField
                label='Written Notice Issued'
                checked={form.watch('writtenNoticeIssued')}
                onCheckedChange={(v) => form.setValue('writtenNoticeIssued', v)}
              />
              <CheckboxField
                label='Personal Visit Conducted'
                checked={form.watch('personalVisitConducted')}
                onCheckedChange={(v) =>
                  form.setValue('personalVisitConducted', v)
                }
              />
            </div>
            <FormField label='Recovery Remarks'>
              <Textarea
                {...form.register('recoveryRemarks')}
                className='min-h-[100px]'
                placeholder='Details of visits...'
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <ShieldCheck className='text-primary h-5 w-5' />
              Recommendation & Routing
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-2'>
            <div className='bg-muted/20 flex items-center gap-3 rounded-lg border p-4 md:col-span-2'>
              <Checkbox
                id='recommend-138'
                checked={form.watch('recommendedFor138')}
                onCheckedChange={(v) => form.setValue('recommendedFor138', !!v)}
              />
              <Label
                htmlFor='recommend-138'
                className='cursor-pointer text-sm font-bold'
              >
                Recommended for Section 138 Action
              </Label>
            </div>
            <FormField label='Recommendation Remarks' className='md:col-span-2'>
              <Textarea
                {...form.register('recommendationRemarks')}
                placeholder='Justification...'
              />
            </FormField>
            <FormField label='Department'>
              <Select
                value={form.watch('departmentId') || ''}
                onValueChange={(v) => form.setValue('departmentId', v)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      deptOptions.isLoading ? 'Loading…' : 'Select Department'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(deptOptions.data ?? []).map(
                    (o: { id: string; name: string }) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label='Branch'>
              <Select
                value={form.watch('branchId') || ''}
                onValueChange={(v) => form.setValue('branchId', v)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      branchOptions.isLoading ? 'Loading…' : 'Select Branch'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(branchOptions.data ?? []).map(
                    (o: { id: string; name: string }) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='bg-muted/20 border-b'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Briefcase className='text-muted-foreground h-5 w-5' />
              Approval Authority
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-4'>
            <FormField label='Prepared By'>
              <Input {...form.register('preparedBy')} />
            </FormField>
            <FormField label='Verified By'>
              <Input {...form.register('verifiedBy')} />
            </FormField>
            <FormField label='Approved By'>
              <Input {...form.register('approvedBy')} />
            </FormField>
            <FormField label='Date'>
              <Input type='date' {...form.register('approvalDate')} />
            </FormField>
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

function CheckboxField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className='bg-background flex items-center gap-3 rounded-lg border p-3'>
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(!!v)}
      />
      <Label className='cursor-pointer text-sm font-medium'>{label}</Label>
    </div>
  )
}
