import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  buildSaveDraftPayload,
  buildActionPayload,
} from '@/workflow.dynamic/utils/payload'
import {
  evalCondition,
  type ConditionV1T,
} from '@/workflow.test/contract/v1/condition'
import type { StageMetadataV1 } from '@/workflow.test/contract/v1/schema'
import type {
  StageUiResponseV1,
  FieldV1T,
} from '@/workflow.test/contract/v1/schema'
import { FieldRendererV1 } from '@/workflow.test/ui/FieldRendererV1'
import { buildValueSchemaV1 } from '@/workflow.test/ui/buildValueSchemaV1'
import { Save, Send, FileText, CheckSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
// --- UI Components ---
import { Button } from '@/components/ui/button'

export default function StagePageRenderer(props: {
  stage: StageMetadataV1
  initialValues: Record<string, unknown>
  onSaveDraft: (valuesPatch: Record<string, unknown>) => void
  onSubmit: (valuesPatch: Record<string, unknown>) => void
}) {
  const valueSchema = useMemo(
    () => buildValueSchemaV1(props.stage),
    [props.stage]
  )

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(valueSchema),
    defaultValues: props.initialValues ?? {},
    mode: 'onSubmit',
  })

  useEffect(() => {
    form.reset(props.initialValues ?? {})
  }, [props.initialValues])

  const values = form.watch()

  async function saveDraft() {
    const values = form.getValues()
    const payload = buildSaveDraftPayload(props.stage, values)

    props.onSaveDraft(payload.values)
    // optional for testing
  }

  async function submit() {
    const ok = await form.trigger()
    if (!ok) return

    const values = form.getValues()
    const payload = buildActionPayload(props.stage, 'SUBMIT', values)

    props.onSubmit(payload.values)
    // optional for testing
  }

  // ==========================================
  // FORM STAGE RENDERER
  // ==========================================
  if (props.stage.kind === 'FORM') {
    const schema = props.stage.form!
    return (
      <div className='animate-fadeIn space-y-8'>
        {/* Form Header */}
        <div className='border-border border-b pb-4'>
          <h2 className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold'>
            <FileText className='text-primary h-6 w-6' />
            {schema.title}
          </h2>
          {schema.subtitle && (
            <p className='text-muted-foreground mt-1 text-sm'>
              {schema.subtitle}
            </p>
          )}
        </div>

        {/* Form Sections */}
        <div className='space-y-6'>
          {schema.sections.map((section) => {
            const visible = evalCondition(
              section.visibleIf as ConditionV1T,
              values
            )
            if (!visible) return null

            return (
              <section
                key={section.key}
                className='border-border bg-card space-y-5 rounded-xl border p-5 shadow-sm transition-all hover:shadow-md sm:p-6'
              >
                <div className='border-border/50 border-b pb-3'>
                  <h3 className='font-manrope text-foreground text-lg font-semibold'>
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {section.description}
                    </p>
                  )}
                </div>

                <div className='space-y-5'>
                  {section.fields.map((f) => (
                    <div key={f.key} className='w-full'>
                      <FieldRendererV1
                        ui={
                          {
                            schemaVersion: 1,
                            instanceId: 0,
                            stageDefId: 0,
                            stageKey: 'MOCK',
                            stageName: 'MOCK',
                            kind: 'FORM',
                            metadata: props.stage,
                            values: props.initialValues,
                            permissions: {
                              canEdit: true,
                              canSaveDraft: true,
                              canSubmit: true,
                              actions: ['SUBMIT'],
                            },
                            documents: [],
                          } as StageUiResponseV1
                        }
                        form={form}
                        field={f as FieldV1T}
                        allValues={values}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Form Action Bar */}
        <div className='border-border bg-muted/20 flex flex-col-reverse items-center justify-end gap-3 rounded-lg border p-4 sm:flex-row'>
          <Button
            variant='outline'
            type='button'
            onClick={saveDraft}
            className='hover:bg-secondary w-full gap-2 sm:w-auto'
          >
            <Save className='text-muted-foreground h-4 w-4' />
            {props.stage.ui?.saveDraftLabel ?? 'Save Draft'}
          </Button>

          <Button
            type='button'
            onClick={submit}
            className='bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 shadow-md sm:w-auto'
          >
            {props.stage.ui?.submitLabel ?? 'Submit & Continue'}
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  // ==========================================
  // APPROVAL STAGE RENDERER
  // ==========================================
  const appr = props.stage.approval!
  return (
    <div className='animate-fadeIn flex flex-col items-center justify-center space-y-6 py-12'>
      {/* Centered Approval Card */}
      <div className='border-border bg-card w-full max-w-lg rounded-2xl border p-8 text-center shadow-lg'>
        <div className='bg-accent/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          <CheckSquare className='text-accent h-8 w-8' />
        </div>

        <h2 className='font-manrope text-foreground text-2xl font-bold'>
          {appr.title}
        </h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Please review the details of this workflow stage and select an action
          below to proceed.
        </p>

        {/* Dynamic Action Buttons */}
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          {appr.actions.map((a, index) => {
            // Give the primary/first action a solid brand color, and others outline
            const isPrimary = index === 0
            return (
              <Button
                key={a.key}
                variant={isPrimary ? 'default' : 'outline'}
                type='button'
                onClick={submit}
                className={cn(
                  'min-w-[120px] gap-2',
                  isPrimary &&
                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                )}
              >
                {a.label}
                {isPrimary && <ChevronRight className='h-4 w-4' />}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
