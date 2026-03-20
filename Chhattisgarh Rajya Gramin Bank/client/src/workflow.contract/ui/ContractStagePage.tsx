import { useEffect, useMemo, useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  buildSaveDraftPayload,
  buildActionPayload,
} from '@/workflow.dynamic/utils/payload'
// your payload builder
import {
  getStageUi,
  patchStageValues,
  postTaskAction,
} from '@/workflow.test/api/workflowApi'
import type {
  StageUiResponseV1,
  SectionV1T,
  FieldV1T,
} from '@/workflow.test/contract/v1/schema'
import { FieldRendererV1 } from '@/workflow.test/ui/FieldRendererV1'
import { buildValueSchemaV1 } from '@/workflow.test/ui/buildValueSchemaV1'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function ContractStagePage(props: {
  instanceId: number
  stageDefId: number
}) {
  const nav = useNavigate()
  const [ui, setUi] = useState<StageUiResponseV1 | null>(null)
  const [err, setErr] = useState<unknown | null>(null)

  useEffect(() => {
    reload()
    async function reload() {
      try {
        const data = await getStageUi(props.instanceId, props.stageDefId)
        setUi(data)
      } catch (e) {
        setErr(e)
      }
    }
  }, [props.instanceId, props.stageDefId])

  const schema = useMemo(
    () => (ui ? buildValueSchemaV1(ui.metadata) : null),
    [ui?.metadata]
  )
  const form = useForm<Record<string, unknown>>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: ui?.values ?? {},
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (ui) form.reset(ui.values ?? {})
  }, [ui])

  if (err) return <div className='p-6 text-red-600'>{JSON.stringify(err)}</div>
  if (!ui) return <div className='p-6'>Loading...</div>

  const values = form.watch()
  const canEdit = !!ui.permissions?.canEdit
  const taskId = ui.permissions?.taskId as number | undefined

  async function saveDraft() {
    if (!ui) return
    const payload = buildSaveDraftPayload(ui.metadata, form.getValues())
    await patchStageValues(props.instanceId, props.stageDefId, payload.values)
    const fresh = await getStageUi(props.instanceId, props.stageDefId)
    setUi(fresh)
  }

  async function act(action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'SEND_BACK') {
    if (!ui) return
    const ok = await form.trigger()
    if (!ok) return

    if (!taskId) {
      alert('No taskId in permissions (local adapter should provide it).')
      return
    }

    const payload = buildActionPayload(
      ui.metadata,
      action,
      form.getValues(),
      undefined
    )
    const res = await postTaskAction(taskId, payload)

    // if backend/local returns nextTaskId, you can navigate to next stage
    // easiest for local: navigate to instance current stage by reloading sidebar task link.
    if (res?.toStageKey) {
      // Try to infer next stageDefId: just reload /ui using current instance + next stage def in local adapter.
      // simplest: redirect to stageDefId+1 if you used sequential IDs (21->22->23)
      nav({
        to: '/wf/instances/$instanceId/stages/$stageDefId',
        params: {
          instanceId: String(props.instanceId),
          stageDefId: String(props.stageDefId + 1),
        },
      })
    } else {
      alert('Workflow completed.')
    }
  }

  // UI shell
  return (
    <div className='space-y-4 p-6'>
      <Card>
        <CardHeader className='space-y-2'>
          <CardTitle>{ui.stageName}</CardTitle>
          <div className='text-muted-foreground text-sm'>
            stageKey: <span className='font-mono'>{ui.stageKey}</span> •
            instanceId: <span className='font-mono'>{ui.instanceId}</span>
          </div>
          <Separator />
          <div className='flex justify-end gap-2'>
            {ui.permissions?.canSaveDraft ? (
              <Button
                variant='outline'
                type='button'
                onClick={saveDraft}
                disabled={!canEdit}
              >
                {ui.metadata?.ui?.saveDraftLabel ?? 'Save Draft'}
              </Button>
            ) : null}
            {ui.permissions?.actions?.includes('SUBMIT') ? (
              <Button type='button' onClick={() => act('SUBMIT')}>
                {ui.metadata?.ui?.submitLabel ?? 'Submit'}
              </Button>
            ) : null}
            {ui.permissions?.actions?.includes('APPROVE') ? (
              <Button type='button' onClick={() => act('APPROVE')}>
                Approve
              </Button>
            ) : null}
            {ui.permissions?.actions?.includes('REJECT') ? (
              <Button
                variant='destructive'
                type='button'
                onClick={() => act('REJECT')}
              >
                Reject
              </Button>
            ) : null}
            {ui.permissions?.actions?.includes('SEND_BACK') ? (
              <Button
                variant='outline'
                type='button'
                onClick={() => act('SEND_BACK')}
              >
                Send Back
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {/* Render based on metadata.kind */}
      {ui.metadata.kind === 'FORM' ? (
        <Card>
          <CardContent className='space-y-6 pt-6'>
            {ui.metadata.form!.sections.map((section: SectionV1T) => (
              <div key={section.key} className='space-y-3'>
                <div>
                  <div className='font-medium'>{section.title}</div>
                  {section.description ? (
                    <div className='text-muted-foreground text-sm'>
                      {section.description}
                    </div>
                  ) : null}
                </div>
                <div
                  className={cn(
                    ui.metadata.ui?.layout === 'TWO_COLUMN'
                      ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                      : 'space-y-4'
                  )}
                >
                  {section.fields.map((f: FieldV1T) => (
                    <div
                      key={f.key}
                      className={cn(
                        ui.metadata.ui?.layout === 'TWO_COLUMN' &&
                          ['TEXTAREA', 'TABLE', 'FILE'].includes(f.type)
                          ? 'md:col-span-2'
                          : ''
                      )}
                    >
                      <FieldRendererV1
                        ui={ui}
                        form={
                          form as unknown as UseFormReturn<
                            Record<string, unknown>
                          >
                        }
                        field={f}
                        allValues={values}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-muted-foreground text-sm'>
              Approval stage. Use the action buttons above.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
