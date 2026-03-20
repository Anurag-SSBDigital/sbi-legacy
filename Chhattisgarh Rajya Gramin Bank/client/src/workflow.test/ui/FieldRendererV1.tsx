import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { AlertCircle, Calendar, ChevronDown } from 'lucide-react'
// UI Imports
import { cn } from '@/lib/utils'
import { evalCondition, type ConditionV1T } from '../contract/v1/condition'
import type { StageUiResponseV1, FieldV1T } from '../contract/v1/schema'
import { FileFieldV1 } from './fields/FileFieldV1'
import { TableFieldV1 } from './fields/TableFieldV1'
import { UserPickerV1 } from './fields/UserPickerV1'

export function FieldRendererV1({
  ui,
  form,
  field,
  allValues,
}: {
  ui: StageUiResponseV1
  form: UseFormReturn<Record<string, unknown>>
  field: FieldV1T
  allValues: Record<string, unknown>
}) {
  const visible = evalCondition(field.visibleIf as ConditionV1T, allValues)
  const enabled = evalCondition(field.enabledIf as ConditionV1T, allValues)
  const readOnly = !!field.readOnly || !enabled || !ui.permissions.canEdit

  // Critical: hidden fields must not block submit
  useEffect(() => {
    if (!visible) {
      form.clearErrors(field.key)
      form.unregister(field.key)
      form.setValue(field.key, undefined, {
        shouldDirty: true,
        shouldValidate: false,
      })
    }
  }, [visible, field.key, form])

  if (!visible) return null

  const errors = form.formState.errors as Record<string, { message?: string }>
  const err = errors[field.key]?.message

  // Shared Input Styles
  const baseInputClass = cn(
    'flex w-full rounded-md border bg-background px-3 py-2 text-sm transition-all outline-none',
    'placeholder:text-muted-foreground/50',
    'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
    readOnly && 'cursor-not-allowed bg-muted/50 opacity-60',
    err
      ? 'border-destructive ring-destructive/20 focus:border-destructive focus:ring-destructive/20'
      : 'border-input'
  )

  return (
    <div className='w-full space-y-1.5 pt-1'>
      {/* Label */}
      <label className='font-manrope text-foreground text-sm font-semibold'>
        {field.label}{' '}
        {field.required ? <span className='text-accent ml-0.5'>*</span> : null}
      </label>

      {/* Help Text */}
      {field.helpText ? (
        <div className='text-muted-foreground pb-1 text-xs'>
          {field.helpText}
        </div>
      ) : null}

      {/* Input Renderer */}
      {renderInput()}

      {/* Error Message */}
      {err ? (
        <div className='text-destructive animate-fadeIn mt-1.5 flex items-center gap-1.5 text-xs font-medium'>
          <AlertCircle className='h-3.5 w-3.5' />
          {err}
        </div>
      ) : null}
    </div>
  )

  function renderInput() {
    switch (field.type) {
      case 'TEXT':
        return (
          <input
            className={cn(baseInputClass, 'h-10')}
            placeholder={field.placeholder}
            readOnly={readOnly}
            {...form.register(field.key)}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            className={cn(baseInputClass, 'min-h-[100px] resize-y py-3')}
            placeholder={field.placeholder}
            readOnly={readOnly}
            rows={4}
            {...form.register(field.key)}
          />
        )

      case 'NUMBER':
        return (
          <input
            className={cn(baseInputClass, 'h-10')}
            placeholder={field.placeholder}
            readOnly={readOnly}
            type='number'
            step={field.step ?? 'any'}
            value={(form.getValues(field.key) as number | undefined) ?? ''}
            onChange={(e) => {
              if (readOnly) return
              const v = e.target.value
              form.setValue(field.key, v === '' ? undefined : Number(v), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
          />
        )
      case 'CURRENCY':
        return (
          <input
            className={cn(baseInputClass, 'h-10')}
            placeholder={field.placeholder}
            readOnly={readOnly}
            type='number'
            value={(form.getValues(field.key) as number | undefined) ?? ''}
            onChange={(e) => {
              if (readOnly) return
              const v = e.target.value
              form.setValue(field.key, v === '' ? undefined : Number(v), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
          />
        )

      case 'DATE':
        return (
          <div className='relative'>
            <input
              className={cn(
                baseInputClass,
                'h-10 [&::-webkit-calendar-picker-indicator]:opacity-0',
                readOnly && 'pointer-events-none'
              )}
              readOnly={readOnly}
              type='date'
              value={(form.getValues(field.key) as string | undefined) ?? ''}
              onChange={(e) => {
                if (readOnly) return
                form.setValue(field.key, e.target.value || undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
            <Calendar className='text-muted-foreground pointer-events-none absolute top-2.5 right-3 h-5 w-5 opacity-50' />
          </div>
        )

      case 'YES_NO':
        return (
          <div className='mt-1 grid gap-3 sm:grid-cols-2'>
            {[
              { label: field.trueLabel ?? 'Yes', value: true },
              { label: field.falseLabel ?? 'No', value: false },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={cn(
                  'border-border bg-card hover:bg-muted/30 relative flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 shadow-sm transition-all',
                  'has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-md',
                  readOnly && 'hover:bg-card cursor-not-allowed opacity-60'
                )}
              >
                <input
                  type='radio'
                  disabled={readOnly}
                  checked={form.getValues(field.key) === opt.value}
                  onChange={() =>
                    form.setValue(field.key, opt.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className='peer sr-only'
                />
                <div className='border-primary/50 bg-background peer-checked:border-primary peer-focus-visible:ring-primary/50 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2'>
                  <div className='bg-primary h-2 w-2 rounded-full opacity-0 transition-opacity peer-checked:opacity-100' />
                </div>
                <span className='font-manrope text-foreground text-sm font-medium'>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )

      case 'SELECT':
        return (
          <div className='relative'>
            <select
              className={cn(
                baseInputClass,
                'h-10 cursor-pointer appearance-none pr-10'
              )}
              disabled={readOnly}
              value={(form.getValues(field.key) as string | undefined) ?? ''}
              onChange={(e) =>
                form.setValue(field.key, e.target.value || undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value='' disabled>
                Select...
              </option>
              {field.type === 'SELECT' &&
                field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </select>
            <ChevronDown className='text-muted-foreground pointer-events-none absolute top-3 right-3 h-4 w-4 opacity-70' />
          </div>
        )

      case 'RADIO':
        return (
          <div className='mt-1 grid gap-3 sm:grid-cols-2'>
            {field.type === 'RADIO' &&
              field.options?.map((o) => (
                <label
                  key={o.value}
                  className={cn(
                    'border-border bg-card hover:bg-muted/30 relative flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 shadow-sm transition-all',
                    'has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-md',
                    readOnly && 'hover:bg-card cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type='radio'
                    disabled={readOnly}
                    checked={form.getValues(field.key) === o.value}
                    onChange={() =>
                      form.setValue(field.key, o.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className='peer sr-only'
                  />
                  <div className='border-primary/50 bg-background peer-checked:border-primary peer-focus-visible:ring-primary/50 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2'>
                    <div className='bg-primary h-2 w-2 rounded-full opacity-0 transition-opacity peer-checked:opacity-100' />
                  </div>
                  <span className='font-manrope text-foreground text-sm font-medium'>
                    {o.label}
                  </span>
                </label>
              ))}
          </div>
        )

      // Advanced Pickers / External components (left untouched internally, but wrapped nicely)
      case 'USER_PICKER':
        return <UserPickerV1 field={field} form={form} readOnly={readOnly} />

      case 'TABLE':
        return (
          <div
            className={cn(
              'border-border overflow-hidden rounded-md border',
              readOnly && 'opacity-80'
            )}
          >
            <TableFieldV1 field={field} form={form} readOnly={readOnly} />
          </div>
        )

      case 'FILE':
        return (
          <div
            className={cn(
              'border-primary/30 bg-primary/5 rounded-md border border-dashed p-4',
              readOnly && 'border-border bg-muted/20 opacity-80'
            )}
          >
            <FileFieldV1 ui={ui} field={field} readOnly={readOnly} />
          </div>
        )

      default:
        return (
          <div className='text-destructive bg-destructive/10 border-destructive/20 rounded border p-3 text-sm'>
            Unsupported field type
          </div>
        )
    }
  }
}
