import React, { useMemo, useState } from 'react'
import { addStageDocument, uploadFile } from '../../api/workflowApi'
import type { StageUiResponseV1, FieldV1T } from '../../contract/v1/schema'

type FileField = Extract<FieldV1T, { type: 'FILE' }>

export function FileFieldV1({
  ui,
  field,
  readOnly,
}: {
  ui: StageUiResponseV1
  field: FileField
  readOnly: boolean
}) {
  const [busy, setBusy] = useState(false)
  const docs = useMemo(
    () => (ui.documents ?? []).filter((d) => d.docType === field.docType),
    [ui.documents, field.docType]
  )

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      const up = await uploadFile(file)
      await addStageDocument(
        ui.instanceId,
        ui.stageDefId,
        field.docType,
        up.url,
        up.fileName ?? file.name
      )
      // NOTE: stage reload is done by parent (/ui reload). Here we just reset input.
      e.target.value = ''
      alert('Uploaded. Reload stage to see updated list.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <input
          type='file'
          disabled={
            readOnly ||
            busy ||
            !!(field.maxFiles && docs.length >= field.maxFiles)
          }
          accept={
            Array.isArray(field.accept) ? field.accept.join(',') : undefined
          }
          onChange={onPick}
        />
        {busy ? <span className='text-xs'>Uploading...</span> : null}
      </div>

      <div className='space-y-1'>
        {docs.length === 0 ? (
          <div className='text-muted-foreground text-xs'>No files uploaded</div>
        ) : null}
        {docs.map((d) => (
          <div
            key={d.id}
            className='flex items-center justify-between rounded border p-2 text-xs'
          >
            <span>{d.fileName ?? d.url}</span>
            <a
              className='underline'
              href={d.url}
              target='_blank'
              rel='noreferrer'
            >
              View
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
