import type { UseFormReturn } from 'react-hook-form'
import { patchStageValues, postTaskAction } from '../api/workflowApi'
import { evalCondition, type ConditionV1T } from '../contract/v1/condition'
import type { StageUiResponseV1 } from '../contract/v1/schema'
import { getVisibleFieldKeys, pick } from '../contract/v1/utils'
import { FieldRendererV1 } from './FieldRendererV1'

export function FormRendererV1({
  ui,
  form,
  onUiReload,
}: {
  ui: StageUiResponseV1
  form: UseFormReturn<Record<string, unknown>>
  onUiReload: () => Promise<void>
}) {
  const meta = ui.metadata
  const schema = meta.form!
  const values = form.watch()

  async function saveDraft() {
    const keys = getVisibleFieldKeys(meta, values)
    const payload = pick(values, keys)
    try {
      await patchStageValues(ui.instanceId, ui.stageDefId, payload)
      await onUiReload()
    } catch (e) {
      applyServerErrors(e)
    }
  }

  async function submit() {
    const ok = await form.trigger()
    if (!ok) return

    const keys = getVisibleFieldKeys(meta, values)
    const payload = pick(values, keys)

    const taskId = ui.permissions.taskId
    if (!taskId) {
      alert('Missing taskId in permissions. Add it in /ui response.')
      return
    }

    try {
      await postTaskAction(taskId, {
        action: 'SUBMIT',
        comment: 'Submitted',
        values: payload,
      })
      await onUiReload()
    } catch (e) {
      applyServerErrors(e)
    }
  }

  function applyServerErrors(e: unknown) {
    const fieldErrors = (
      e as { error?: { fieldErrors?: Record<string, unknown> } }
    )?.error?.fieldErrors
    if (fieldErrors && typeof fieldErrors === 'object') {
      for (const [k, msg] of Object.entries(fieldErrors)) {
        form.setError(k as never, { type: 'server', message: String(msg) })
      }
    }
  }

  return (
    <div className='space-y-6 p-4'>
      <div>
        <div className='text-xl font-semibold'>{schema.title}</div>
        {schema.subtitle ? (
          <div className='text-muted-foreground text-sm'>{schema.subtitle}</div>
        ) : null}
      </div>

      {schema.sections.map((section) => {
        const sectionVisible = evalCondition(
          section.visibleIf as ConditionV1T,
          values
        )
        if (!sectionVisible) return null

        return (
          <div key={section.key} className='space-y-4 rounded-lg border p-4'>
            <div>
              <div className='font-medium'>{section.title}</div>
              {section.description ? (
                <div className='text-muted-foreground text-sm'>
                  {section.description}
                </div>
              ) : null}
            </div>

            <div className='space-y-4'>
              {section.fields.map((f) => (
                <FieldRendererV1
                  key={f.key}
                  ui={ui}
                  form={form}
                  field={f}
                  allValues={values}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div className='flex justify-end gap-2'>
        {ui.permissions.canSaveDraft ? (
          <button
            className='rounded border px-3 py-2'
            type='button'
            onClick={saveDraft}
          >
            {meta.ui?.saveDraftLabel ?? 'Save Draft'}
          </button>
        ) : null}

        {ui.permissions.canSubmit ? (
          <button
            className='rounded border bg-black px-3 py-2 text-white'
            type='button'
            onClick={submit}
          >
            {meta.ui?.submitLabel ?? 'Submit'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
