import {
  evalCondition,
  type ConditionV1T,
} from '@/workflow.test/contract/v1/condition'
import type {
  FieldV1T,
  StageMetadataV1,
  SectionV1T,
} from '@/workflow.test/contract/v1/schema'

// Flatten fields from StageMetadataV1
function getAllFields(meta: StageMetadataV1): FieldV1T[] {
  if (meta.kind === 'FORM')
    return meta.form!.sections.flatMap((s: SectionV1T) => s.fields)
  return (meta.approval!.fields as FieldV1T[]) ?? []
}

function buildVisibleValues(
  meta: StageMetadataV1,
  values: Record<string, unknown>
) {
  const out: Record<string, unknown> = {}
  const fields = getAllFields(meta)

  for (const f of fields) {
    const visible = evalCondition(f.visibleIf as ConditionV1T, values)
    if (!visible) continue

    // FILE is not stored in wf_stage_detail-style values
    if (f.type === 'FILE') continue

    if (values[f.key] !== undefined) out[f.key] = values[f.key]
  }
  return out
}

export function buildSaveDraftPayload(
  meta: StageMetadataV1,
  values: Record<string, unknown>
) {
  return { values: buildVisibleValues(meta, values) }
}

export function buildActionPayload(
  meta: StageMetadataV1,
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'SEND_BACK',
  values: Record<string, unknown>,
  comment?: string
) {
  return {
    action,
    comment: comment?.trim() || undefined,
    values: buildVisibleValues(meta, values),
  }
}
