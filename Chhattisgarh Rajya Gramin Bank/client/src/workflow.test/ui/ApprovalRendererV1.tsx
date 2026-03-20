import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { postTaskAction } from '../api/workflowApi'
import type { StageUiResponseV1 } from '../contract/v1/schema'
import { getVisibleFieldKeys, pick } from '../contract/v1/utils'
import { FieldRendererV1 } from './FieldRendererV1'

export function ApprovalRendererV1({
  ui,
  form,
  onUiReload,
}: {
  ui: StageUiResponseV1
  form: UseFormReturn<Record<string, unknown>>
  onUiReload: () => Promise<void>
}) {
  const schema = ui.metadata.approval!
  const values = form.watch()
  const [comment, setComment] = useState('')

  async function doAction(actionKey: string, requiresComment?: boolean) {
    const ok = await form.trigger() // validate optional fields
    if (!ok) return

    if (requiresComment && !comment.trim()) {
      alert('Comment is required.')
      return
    }

    const taskId = ui.permissions.taskId
    if (!taskId) {
      alert('Missing taskId in permissions. Add it in /ui response.')
      return
    }

    const keys = getVisibleFieldKeys(ui.metadata, values)
    const payload = pick(values, keys)

    try {
      await postTaskAction(taskId, {
        action: actionKey,
        comment: comment.trim(),
        values: payload,
      })
      await onUiReload()
    } catch (e) {
      const fieldErrors = (
        e as { error?: { fieldErrors?: Record<string, unknown> } }
      )?.error?.fieldErrors
      if (fieldErrors && typeof fieldErrors === 'object') {
        for (const [k, msg] of Object.entries(fieldErrors)) {
          form.setError(k as never, { type: 'server', message: String(msg) })
        }
      }
    }
  }

  return (
    <div className='space-y-6 p-4'>
      <div className='text-xl font-semibold'>{schema.title}</div>

      {schema.fields?.length ? (
        <div className='space-y-4 rounded-lg border p-4'>
          {schema.fields.map((f) => (
            <FieldRendererV1
              key={f.key}
              ui={ui}
              form={form}
              field={f}
              allValues={values}
            />
          ))}
        </div>
      ) : null}

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Comment</label>
        <textarea
          className='w-full rounded border p-2'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Optional (or required based on action)'
        />
      </div>

      <div className='flex justify-end gap-2'>
        {schema.actions.map((a) => (
          <button
            key={a.key}
            className='rounded border px-3 py-2'
            type='button'
            onClick={() => doAction(a.key, a.requiresComment)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
