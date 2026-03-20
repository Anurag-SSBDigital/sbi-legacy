import { evalCondition, type ConditionV1T } from './condition'
import type { StageMetadataV1, FieldV1T } from './schema'

export function getAllFields(meta: StageMetadataV1): FieldV1T[] {
  if (meta.kind === 'FORM') return meta.form!.sections.flatMap((s) => s.fields)
  return meta.approval!.fields ?? []
}

export function getVisibleFieldKeys(
  meta: StageMetadataV1,
  values: Record<string, unknown>
): string[] {
  const fields = getAllFields(meta)
  const keys: string[] = []
  for (const f of fields) {
    const visible = evalCondition(f.visibleIf as ConditionV1T, values)
    if (visible) keys.push(f.key)
  }
  return keys
}

export function pick(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k] = obj[k]
  return out
}
