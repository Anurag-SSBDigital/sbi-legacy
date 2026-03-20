import {
  StageMetadataV1Schema,
  StageUiResponseV1Schema,
  type StageUiResponseV1,
} from '../contract/v1/schema'
import { apiRequest } from '@/lib/api'

const META_KEY = (stageDefId: number) => `wf_meta_v1:${stageDefId}`
const VALUES_KEY = (instanceId: number, stageDefId: number) =>
  `wf_values_v1:${instanceId}:${stageDefId}`
const DOCS_KEY = (instanceId: number, stageDefId: number) =>
  `wf_docs_v1:${instanceId}:${stageDefId}`

function makeTaskId(instanceId: number, stageDefId: number) {
  return Number(`${instanceId}${String(stageDefId).padStart(3, '0')}`)
}

export function saveStageMetadataLocal(stageDefId: number, metaJson: unknown) {
  const meta = StageMetadataV1Schema.parse(metaJson)
  localStorage.setItem(META_KEY(stageDefId), JSON.stringify(meta))
  return meta
}

export async function loadStageMetadataLocal(
  stageDefId: number
): Promise<unknown | null> {
  // 1) localStorage
  const raw = localStorage.getItem(META_KEY(stageDefId))
  if (raw) return JSON.parse(raw)

  // 2) fallback: fetch from public folder
  // put file in: client/public/wf-schemas/{stageDefId}.json
  try {
    return await apiRequest(`/wf-schemas/${stageDefId}.json`, {
      method: 'GET',
    })
  } catch {
    return null
  }
}

export function getStageValuesLocal(
  instanceId: number,
  stageDefId: number
): Record<string, unknown> {
  const raw = localStorage.getItem(VALUES_KEY(instanceId, stageDefId))
  return raw ? JSON.parse(raw) : {}
}

export function patchStageValuesLocal(
  instanceId: number,
  stageDefId: number,
  patch: Record<string, unknown>
) {
  const cur = getStageValuesLocal(instanceId, stageDefId)
  const next = { ...cur, ...(patch ?? {}) }
  localStorage.setItem(VALUES_KEY(instanceId, stageDefId), JSON.stringify(next))
  return { ok: true as const }
}

export function getStageDocsLocal(instanceId: number, stageDefId: number) {
  const raw = localStorage.getItem(DOCS_KEY(instanceId, stageDefId))
  return raw ? JSON.parse(raw) : []
}

export function addStageDocumentLocal(
  instanceId: number,
  stageDefId: number,
  docType: string,
  url: string,
  fileName?: string
) {
  const docs = getStageDocsLocal(instanceId, stageDefId)
  const next = [
    ...docs,
    {
      id: Date.now(),
      docType,
      url,
      fileName: fileName ?? url,
      uploadedAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(DOCS_KEY(instanceId, stageDefId), JSON.stringify(next))
  return { ok: true as const }
}

export async function uploadFileLocal(
  file: File
): Promise<{ url: string; fileName?: string }> {
  const url = URL.createObjectURL(file)
  return { url, fileName: file.name }
}

export async function getStageUiLocal(
  instanceId: number,
  stageDefId: number
): Promise<StageUiResponseV1> {
  const metaJson = await loadStageMetadataLocal(stageDefId)
  if (!metaJson) {
    throw {
      ok: false,
      error: {
        code: 'NO_SCHEMA',
        message: `No StageMetadataV1 found for stageDefId=${stageDefId}. Add JSON to localStorage key ${META_KEY(
          stageDefId
        )} OR create public/wf-schemas/${stageDefId}.json`,
      },
    }
  }

  const metadata = StageMetadataV1Schema.parse(metaJson)
  const values = getStageValuesLocal(instanceId, stageDefId)
  const documents = getStageDocsLocal(instanceId, stageDefId)

  const stageName =
    metadata.kind === 'FORM' ? metadata.form!.title : metadata.approval!.title

  const ui: StageUiResponseV1 = {
    schemaVersion: 1,
    instanceId,
    stageDefId,
    stageKey:
      metadata.kind === 'FORM'
        ? metadata.form!.formKey
        : `APPROVAL_${stageDefId}`,
    stageName,
    kind: metadata.kind,
    metadata,
    values,
    permissions: {
      canEdit: true,
      canSaveDraft:
        metadata.kind === 'FORM' && metadata.form!.mode !== 'SUBMIT_ONLY',
      canSubmit: true,
      actions:
        metadata.kind === 'FORM'
          ? ['SUBMIT']
          : metadata.approval!.actions.map((a) => a.key),
      taskId: makeTaskId(instanceId, stageDefId),
    },
    documents,
  }

  return StageUiResponseV1Schema.parse(ui)
}

export function postTaskActionLocal(
  taskId: number,
  payload: {
    action: string
    comment?: string
    values?: Record<string, unknown>
  }
) {
  // For local testing: just return ok (you can extend later)
  return { ok: true, nextTaskId: taskId, ...payload }
}
