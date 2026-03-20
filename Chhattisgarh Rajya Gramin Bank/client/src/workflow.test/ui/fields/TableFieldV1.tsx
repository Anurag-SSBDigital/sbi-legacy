import type { UseFormReturn } from 'react-hook-form'
import type { FieldV1T } from '../../contract/v1/schema'

type TableField = Extract<FieldV1T, { type: 'TABLE' }>
type Column = TableField['columns'][number]

export function TableFieldV1({
  field,
  form,
  readOnly,
}: {
  field: TableField
  form: UseFormReturn<Record<string, unknown>>
  readOnly: boolean
}) {
  const value = (form.getValues(field.key) ?? []) as Array<
    Record<string, unknown>
  > // cast to unknown for safer access
  const cols = field.columns

  function addRow() {
    const next = [...value, {}]
    form.setValue(field.key, next, { shouldDirty: true, shouldValidate: true })
  }

  function removeRow(idx: number) {
    const next = value.filter((_, i) => i !== idx)
    form.setValue(field.key, next, { shouldDirty: true, shouldValidate: true })
  }

  function setCell(idx: number, colKey: string, v: unknown) {
    const next = value.map((r, i) => (i === idx ? { ...r, [colKey]: v } : r))
    form.setValue(field.key, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className='rounded border'>
      <div className='overflow-auto'>
        <table className='min-w-full text-sm'>
          <thead>
            <tr className='border-b'>
              {cols.map((c) => (
                <th key={c.key} className='p-2 text-left'>
                  {c.label}
                </th>
              ))}
              <th className='w-24 p-2'>Action</th>
            </tr>
          </thead>
          <tbody>
            {value.length === 0 ? (
              <tr>
                <td
                  className='text-muted-foreground p-2'
                  colSpan={cols.length + 1}
                >
                  No rows
                </td>
              </tr>
            ) : null}

            {value.map((row, idx) => (
              <tr key={idx} className='border-b'>
                {cols.map((c) => (
                  <td key={c.key} className='p-2'>
                    {renderCell(c, row[c.key], (nv: unknown) =>
                      setCell(idx, c.key, nv)
                    )}
                  </td>
                ))}
                <td className='p-2'>
                  <button
                    className='rounded border px-2 py-1'
                    type='button'
                    disabled={readOnly}
                    onClick={() => removeRow(idx)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-end p-2'>
        <button
          className='rounded border px-2 py-1'
          type='button'
          disabled={readOnly}
          onClick={addRow}
        >
          Add Row
        </button>
      </div>
    </div>
  )

  function renderCell(col: Column, v: unknown, onChange: (v: unknown) => void) {
    if (col.type === 'SELECT') {
      return (
        <select
          className='w-full rounded border p-1'
          disabled={readOnly}
          value={(v as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value=''>Select...</option>
          {col.type === 'SELECT' &&
            col.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        </select>
      )
    }

    if (col.type === 'YES_NO') {
      return (
        <select
          className='w-full rounded border p-1'
          disabled={readOnly}
          value={v === true ? 'true' : v === false ? 'false' : ''}
          onChange={(e) => {
            const x = e.target.value
            onChange(x === '' ? undefined : x === 'true')
          }}
        >
          <option value=''>Select...</option>
          <option value='true'>Yes</option>
          <option value='false'>No</option>
        </select>
      )
    }

    const inputType =
      col.type === 'DATE'
        ? 'date'
        : col.type === 'NUMBER' || col.type === 'CURRENCY'
          ? 'number'
          : 'text'

    return (
      <input
        className='w-full rounded border p-1'
        type={inputType}
        disabled={readOnly}
        value={(v as string | number | undefined) ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (inputType === 'number')
            onChange(raw === '' ? undefined : Number(raw))
          else onChange(raw === '' ? undefined : raw)
        }}
      />
    )
  }
}
