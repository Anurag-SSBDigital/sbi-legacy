import {
  localGetStageUi,
  localPatchStageValues,
  localPostTaskAction,
  localUploadFile,
  localAddStageDocument,
} from '@/workflow.contract/local/wfLocalApi'
import type { StageUiResponseV1 } from '../contract/v1/schema'

export async function getStageUi(
  instanceId: number,
  stageDefId: number
): Promise<StageUiResponseV1> {
  return localGetStageUi(instanceId, stageDefId)
}

export async function patchStageValues(
  instanceId: number,
  stageDefId: number,
  values: Record<string, unknown>
) {
  return localPatchStageValues(instanceId, stageDefId, { values })
}

export async function postTaskAction(
  taskId: number,
  payload: {
    action: string
    comment?: string
    values?: Record<string, unknown>
  }
) {
  return localPostTaskAction(taskId, payload)
}

export async function uploadFile(file: File) {
  return localUploadFile(file)
}

export async function addStageDocument(
  instanceId: number,
  stageDefId: number,
  docType: string,
  url: string,
  fileName: string
) {
  return localAddStageDocument(instanceId, stageDefId, docType, url, fileName)
}
