/* ------------------------------------------------------------------ */
/* routes/_authenticated/(stock-audit)/assignment/$assignmentId/questionnaire.tsx */
/* ------------------------------------------------------------------ */
import React, { useEffect } from 'react'
import { z } from 'zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Check, X as Cross, Loader2, MinusCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
/* --- shadcn/ui ---------------------------------------------------- */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MainWrapper from '@/components/ui/main-wrapper'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator.tsx'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

/* ------------------------------------------------------------------ */
/* Route Definition                                                   */
/* ------------------------------------------------------------------ */
export const Route = createFileRoute(
  '/_authenticated/stock-audit/$accountId/descriptions/$assignmentId'
)({
  component: StockAuditQuestionnairePage,
})

/* ------------------------------------------------------------------ */
/* Types & Validation Schema                                          */
/* ------------------------------------------------------------------ */
// type Question = {
//   id: number
//   questionNo: number
//   questionText: string
// }

const AnswerEnum = z.enum(['yes', 'no', 'na'])

const ResponseSchema = z.object({
  assignmentId: z.coerce.number().int(),
  responses: z
    .array(
      z.object({
        questionNo: z.number().int(),
        answer: AnswerEnum,
        remarks: z.string().trim().optional(),
      })
    )
    .superRefine((responses, ctx) => {
      responses.forEach((r, index) => {
        if (r.answer === 'yes' && (!r.remarks || r.remarks.length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Remarks are mandatory for YES',
            path: [index, 'remarks'],
          })
        }
      })
    }),
})

export type FormValues = z.infer<typeof ResponseSchema>

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function StockAuditQuestionnairePage() {
  const navigate = useNavigate()
  const { assignmentId } = Route.useParams()

  /* ------------------ Fetch questions ---------------------------- */
  const {
    data: questions,
    isLoading: qLoading,
    error: qError,
    refetch,
  } = $api.useQuery('get', '/stockAuditor/questionnaire')

  /* ------------------ Mutation for submit ------------------------ */
  const submitMutation = $api.useMutation(
    'post',
    '/stockAudit/submitResponses',
    {
      onSuccess: () => {
        toast.success('Responses saved successfully ✅')

        // 1) Navigate to Assigned Audits (STARTED tab)
        navigate({
          to: '/stock-audit/assigned-audits',
          search: { tab: 'STARTED' },
        })

        // 2) Hard refresh the page AFTER navigation
        setTimeout(() => {
          window.location.reload()
        }, 0)
      },
      onError: (err) => {
        toast.error((err as Error)?.message || 'Something went wrong')
      },
    }
  )

  /* ------------------ Form setup -------------------------------- */
  const defaultValues = React.useMemo<FormValues>(
    () => ({
      assignmentId: Number(assignmentId),
      responses:
        questions
          ?.filter((q) => q.questionNo !== undefined || q.questionNo !== null)
          ?.map((q) => ({
            questionNo: q.questionNo as number,
            answer: 'na',
            remarks: '',
          })) ?? [],
    }),
    [assignmentId, questions]
  )

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(ResponseSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  /* Update form once questions arrive */
  useEffect(() => {
    if (questions) {
      reset(defaultValues)
    }
  }, [questions, reset, defaultValues])

  /* FieldArray (makes life easier) */
  const { fields } = useFieldArray({
    control,
    name: 'responses',
  })

  /* ------------------ Submit handler ----------------------------- */
  const onSubmit = handleSubmit(async (values) => {
    await submitMutation.mutateAsync({
      body: values,
      params: { header: { Authorization: '' } },
    })
  })

  /* ------------------ UI ----------------------------------------- */
  if (qLoading) {
    return (
      <MainWrapper>
        <header className='from-primary/20 via-primary/10 ring-border mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight'>
              Stock Audit Questionnaire
            </h1>
          </div>

          <button
            type='button'
            onClick={() => window.history.back()}
            className='border-border bg-background hover:bg-muted hover:text-foreground rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors'
          >
            Go Back
          </button>
        </header>
        <Separator className='my-4 w-full' />
        <Skeleton className='h-40 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
      </MainWrapper>
    )
  }

  if (qError || !questions) {
    return (
      <MainWrapper>
        <header className='from-primary/20 via-primary/10 ring-border mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight'>
              Stock Audit Questionnaire
            </h1>
          </div>

          <button
            type='button'
            onClick={() => window.history.back()}
            className='border-border bg-background hover:bg-muted hover:text-foreground rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors'
          >
            Go Back
          </button>
        </header>
        <Separator className='my-4 w-full' />
        <p className='text-destructive mb-4'>{`${(qError as unknown as Error)?.message || 'Failed to load questions.'}`}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </MainWrapper>
    )
  }

  return (
    <MainWrapper>
      {/* <div className='text-2xl font-semibold'>Stock Audit Questionnaire</div> */}
      <header className='from-primary/20 via-primary/10 ring-border mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Stock Audit Questionnaire
          </h1>
        </div>

        <button
          type='button'
          onClick={() => window.history.back()}
          className='border-border bg-background hover:bg-muted hover:text-foreground rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors'
        >
          Go Back
        </button>
      </header>
      <Separator className='my-4 w-full' />
      <form onSubmit={onSubmit} className='space-y-6 pb-24'>
        {fields.map((field, idx) => (
          <Card key={field.id} className='shadow-sm'>
            <CardHeader>
              <CardTitle className='flex gap-2 text-base font-medium'>
                <span className='text-muted-foreground font-semibold'>
                  {idx + 1}.
                </span>
                {questions[idx]?.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8'>
              {/* Radio options */}
              <Controller
                control={control}
                name={`responses.${idx}.answer`}
                render={({ field }) => (
                  <RadioGroup
                    className='flex flex-row items-center gap-6'
                    {...field}
                    onValueChange={field.onChange}
                  >
                    <LabelledItem value='yes' icon={Check} label='Yes' />
                    <LabelledItem value='no' icon={Cross} label='No' />
                    <LabelledItem value='na' icon={MinusCircle} label='N/A' />
                  </RadioGroup>
                )}
              />

              {/* Remarks textarea (conditionally required) */}
              <Controller
                control={control}
                name={`responses.${idx}.remarks`}
                render={({ field, fieldState }) => (
                  <div className='flex-1'>
                    <Textarea
                      placeholder='Enter remarks (required if Yes)'
                      {...field}
                      className={
                        fieldState.invalid ? 'border-destructive' : undefined
                      }
                    />
                    {fieldState.error && (
                      <p className='text-destructive mt-1 text-sm'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        ))}

        {/* Sticky footer actions */}
        <div className='bg-background fixed right-0 bottom-0 left-0 flex justify-end gap-4 border-t p-4 shadow-inner'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => reset(defaultValues)}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting || submitMutation.isPending}
          >
            {isSubmitting || submitMutation.isPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            Save Responses
          </Button>
        </div>
      </form>
    </MainWrapper>
  )
}

/* ------------------------------------------------------------------ */
/* Helper Components                                                  */
/* ------------------------------------------------------------------ */
interface LabelledItemProps {
  value: 'yes' | 'no' | 'na'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

function LabelledItem({ value, label, icon: Icon }: LabelledItemProps) {
  return (
    <div className='flex items-center space-x-2'>
      <RadioGroupItem value={value} id={value} />
      <label
        htmlFor={value}
        className='flex cursor-pointer items-center gap-1 select-none'
      >
        <Icon className='h-4 w-4' />
        {label}
      </label>
    </div>
  )
}
