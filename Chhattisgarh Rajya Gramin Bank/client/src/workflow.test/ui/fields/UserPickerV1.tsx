import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { FieldV1T } from '../../contract/v1/schema'
import { apiRequest } from '@/lib/api'

type UserPickerField = Extract<FieldV1T, { type: 'USER_PICKER' }>

export function UserPickerV1({
  field,
  form,
  readOnly,
}: {
  field: UserPickerField
  form: UseFormReturn<Record<string, unknown>>
  readOnly: boolean
}) {
  const [opts, setOpts] = useState<Array<{ label: string; value: string }>>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setBusy(true)
        const json = await apiRequest<unknown>(field.dataSource.url, {
          method: 'GET',
        })
        const jsonRecord =
          typeof json === 'object' && json !== null
            ? (json as Record<string, unknown>)
            : null
        // expects array
        const arr = Array.isArray(json)
          ? json
          : Array.isArray(jsonRecord?.items)
            ? jsonRecord.items
            : []
        const labelPath = field.dataSource.labelPath
        const valuePath = field.dataSource.valuePath

        setOpts(
          arr.map((x: Record<string, unknown>) => ({
            label: String(x?.[labelPath] ?? ''),
            value: String(x?.[valuePath] ?? ''),
          }))
        )
      } finally {
        setBusy(false)
      }
    })()
  }, [field.dataSource.url])

  const v = (form.getValues(field.key) as string) ?? ''

  return (
    <select
      className='w-full rounded border p-2'
      disabled={readOnly || busy}
      value={v}
      onChange={(e) =>
        form.setValue(field.key, e.target.value || undefined, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    >
      <option value=''>{busy ? 'Loading...' : 'Select...'}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
