import { z } from 'zod'
import { evalCondition, type ConditionV1T } from '../contract/v1/condition'
import type { StageMetadataV1 } from '../contract/v1/schema'
import type { FieldV1T } from '../contract/v1/schema'
import { getAllFields } from '../contract/v1/utils'

function isEmpty(v: unknown) {
  return (
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0)
  )
}

function isDateString(v: unknown) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

export function buildValueSchemaV1(meta: StageMetadataV1) {
  const base = z.record(z.string(), z.unknown())

  return base.superRefine((values, ctx) => {
    const fields = getAllFields(meta)

    for (const f of fields as FieldV1T[]) {
      const visible = evalCondition(f.visibleIf as ConditionV1T, values)
      if (!visible) continue

      const v = values[f.key]

      // REQUIRED (special handling for YES_NO = must be true)
      if (f.required) {
        if (f.type === 'YES_NO') {
          if (v !== true)
            ctx.addIssue({
              code: 'custom',
              path: [f.key],
              message: `${f.label} is required`,
            })
        } else if (f.type !== 'FILE' && isEmpty(v)) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: `${f.label} is required`,
          })
        }
      }

      // Validations
      if (Array.isArray(f.validations)) {
        for (const rule of f.validations) {
          if (rule.rule === 'REQUIRED_IF') {
            if (
              evalCondition(rule.condition as ConditionV1T, values) &&
              isEmpty(v)
            ) {
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
            }
          } else if (rule.rule === 'REGEX' && typeof v === 'string') {
            if (!new RegExp(rule.pattern).test(v))
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
          } else if (rule.rule === 'MIN' && typeof v === 'number') {
            if (v < rule.value)
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
          } else if (rule.rule === 'MAX' && typeof v === 'number') {
            if (v > rule.value)
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
          } else if (rule.rule === 'MIN_LEN' && typeof v === 'string') {
            if (v.length < rule.value)
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
          } else if (rule.rule === 'MAX_LEN' && typeof v === 'string') {
            if (v.length > rule.value)
              ctx.addIssue({
                code: 'custom',
                path: [f.key],
                message: rule.message,
              })
          }
        }
      }

      // Basic type checks
      if (!isEmpty(v)) {
        if (f.type === 'DATE' && !isDateString(v)) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: 'Invalid date format (YYYY-MM-DD)',
          })
        }
        if (
          (f.type === 'NUMBER' || f.type === 'CURRENCY') &&
          typeof v !== 'number'
        ) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: 'Must be a number',
          })
        }
        if (f.type === 'TABLE' && !Array.isArray(v)) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: 'Invalid table value',
          })
        }
      }

      // Table minRows/maxRows
      if (f.type === 'TABLE' && Array.isArray(v)) {
        if (typeof f.minRows === 'number' && v.length < f.minRows) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: `${f.label} requires at least ${f.minRows} rows`,
          })
        }
        if (typeof f.maxRows === 'number' && v.length > f.maxRows) {
          ctx.addIssue({
            code: 'custom',
            path: [f.key],
            message: `${f.label} allows at most ${f.maxRows} rows`,
          })
        }
      }
    }
  })
}
