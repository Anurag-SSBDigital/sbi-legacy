import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getStageUi } from '../api/workflowApi'
import type { StageUiResponseV1 } from '../contract/v1/schema'
import { ApprovalRendererV1 } from './ApprovalRendererV1'
import { FormRendererV1 } from './FormRendererV1'
import { buildValueSchemaV1 } from './buildValueSchemaV1'

export function StageScreenV1(props: {
  instanceId: number
  stageDefId: number
}) {
  const [ui, setUi] = useState<StageUiResponseV1 | null>(null)
  const [err, setErr] = useState<unknown | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getStageUi(props.instanceId, props.stageDefId)
        setUi(data)
      } catch (e) {
        setErr(e)
      }
    })()
  }, [props.instanceId, props.stageDefId])

  const valueSchema = useMemo(
    () => (ui ? buildValueSchemaV1(ui.metadata) : null),
    [ui?.metadata]
  )
  const form = useForm<Record<string, unknown>>({
    resolver: valueSchema ? zodResolver(valueSchema) : undefined,
    defaultValues: ui?.values ?? {},
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (ui) form.reset(ui.values ?? {})
  }, [ui])

  if (err)
    return (
      <div className='p-4 text-red-600'>
        Failed to load stage UI: {JSON.stringify(err)}
      </div>
    )
  if (!ui) return <div className='p-4'>Loading...</div>

  if (ui.kind === 'FORM')
    return <FormRendererV1 ui={ui} form={form} onUiReload={() => reload()} />
  return <ApprovalRendererV1 ui={ui} form={form} onUiReload={() => reload()} />

  async function reload() {
    const data = await getStageUi(props.instanceId, props.stageDefId)
    setUi(data)
  }
}
