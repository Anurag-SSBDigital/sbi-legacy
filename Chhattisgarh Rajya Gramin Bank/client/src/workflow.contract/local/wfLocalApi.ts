import {
  StageMetadataV1Schema,
  StageUiResponseV1Schema,
} from '@/workflow.test/contract/v1/schema'
import { useAuthStore } from '@/stores/authStore'

// ----------------------
// Local "tables"
// ----------------------
type StageDef = {
  stageDefId: number
  stageKey: string
  stageName: string
  stageType: 'FORM' | 'APPROVAL'
  metadata_json: unknown // StageMetadataV1
  orderNo: number // 1..N
  assigneeRole: string // "superadmin" | "admin" | "branchmanager" | ...
}

type Instance = {
  instanceId: number
  stageDefIds: number[] // ordered
  currentStageDefId: number
}

type Task = {
  taskId: number
  instanceId: number
  stageDefId: number
  assigneeRole: string
  status: 'OPEN' | 'DONE'
}

const K_STAGE_DEFS = 'ls_wf_stage_defs_v1'
const K_INSTANCES = 'ls_wf_instances_v1'
const K_TASKS = 'ls_wf_tasks_v1'
const K_STAGE_DETAIL = (instanceId: number, stageDefId: number) =>
  `ls_wf_stage_detail_v1:${instanceId}:${stageDefId}` // object map {fieldKey: jsonValue}
const K_DOCS = (instanceId: number, stageDefId: number) =>
  `ls_wf_docs_v1:${instanceId}:${stageDefId}` // array docs

function readJson<T>(k: string, fallback: T): T {
  const raw = localStorage.getItem(k)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
function writeJson(k: string, v: unknown) {
  localStorage.setItem(k, JSON.stringify(v))
}

function getUserType(): string {
  const user = useAuthStore.getState().auth.user as Record<string, unknown>
  if (!user) return 'user'
  if (user.superAdmin) return 'superadmin'
  if (user.admin) return 'admin'
  if (user.stockAuditor) return 'auditor'
  if (user.advocate) return 'advocate'
  if (user.valuer) return 'valuer'

  // adjust once you confirm real BM field:
  if (user.branchManager) return 'branchmanager'
  const roleText = String(
    user.roleName ?? user.designationName ?? user.designation ?? ''
  ).toLowerCase()
  if (roleText.includes('branch') && roleText.includes('manager'))
    return 'branchmanager'

  return 'user'
}

function listStageDefs(): StageDef[] {
  return readJson<StageDef[]>(K_STAGE_DEFS, [])
}
function listInstances(): Instance[] {
  return readJson<Instance[]>(K_INSTANCES, [])
}
function listTasks(): Task[] {
  return readJson<Task[]>(K_TASKS, [])
}

function getStageDef(stageDefId: number): StageDef | undefined {
  return listStageDefs().find((s) => s.stageDefId === stageDefId)
}
function getInstance(instanceId: number): Instance | undefined {
  return listInstances().find((i) => i.instanceId === instanceId)
}
function findOpenTask(
  instanceId: number,
  stageDefId: number
): Task | undefined {
  return listTasks().find(
    (t) =>
      t.instanceId === instanceId &&
      t.stageDefId === stageDefId &&
      t.status === 'OPEN'
  )
}
function nextTaskId(): number {
  return Date.now()
}

// ----------------------
// Builder helper: create local instance/stages/tasks from a 3-stage JSON
// You will call this from your Builder page.
// ----------------------
export function localCreateWorkflowFromStages(input: {
  instanceId: number
  stages: Array<{
    stageDefId: number
    stageKey: string
    stageName: string
    assigneeRole: string
    metadata: unknown // StageMetadataV1 JSON
  }>
}) {
  const stages: StageDef[] = input.stages.map((s, idx) => {
    const meta = StageMetadataV1Schema.parse(s.metadata)
    const kind = meta.kind
    return {
      stageDefId: s.stageDefId,
      stageKey: s.stageKey,
      stageName: s.stageName,
      stageType: kind,
      metadata_json: meta,
      orderNo: idx + 1,
      assigneeRole: s.assigneeRole,
    }
  })

  // persist stage defs (overwrite by stageDefId)
  const existing = listStageDefs().filter(
    (x) => !stages.some((s) => s.stageDefId === x.stageDefId)
  )
  writeJson(K_STAGE_DEFS, [...existing, ...stages])

  const instance: Instance = {
    instanceId: input.instanceId,
    stageDefIds: stages.map((s) => s.stageDefId),
    currentStageDefId: stages[0].stageDefId,
  }
  const others = listInstances().filter(
    (i) => i.instanceId !== input.instanceId
  )
  writeJson(K_INSTANCES, [instance, ...others])

  // create first task
  const first = stages[0]
  const t: Task = {
    taskId: nextTaskId(),
    instanceId: input.instanceId,
    stageDefId: first.stageDefId,
    assigneeRole: first.assigneeRole,
    status: 'OPEN',
  }
  const tasks = listTasks().filter(
    (x) =>
      !(
        x.instanceId === t.instanceId &&
        x.stageDefId === t.stageDefId &&
        x.status === 'OPEN'
      )
  )
  writeJson(K_TASKS, [t, ...tasks])

  return {
    ok: true,
    instanceId: instance.instanceId,
    firstStageDefId: first.stageDefId,
    firstTaskId: t.taskId,
  }
}

// ----------------------
// Contract API: GET /ui
// ----------------------
export function localGetStageUi(instanceId: number, stageDefId: number) {
  const stageDef = getStageDef(stageDefId)
  const inst = getInstance(instanceId)

  if (!stageDef || !inst) {
    throw {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Instance or Stage not found' },
    }
  }

  const metadata = StageMetadataV1Schema.parse(stageDef.metadata_json)
  const values = readJson<Record<string, unknown>>(
    K_STAGE_DETAIL(instanceId, stageDefId),
    {}
  )
  const documents = readJson<unknown[]>(K_DOCS(instanceId, stageDefId), [])

  const userType = getUserType()
  const openTask = findOpenTask(instanceId, stageDefId)

  // permissions are the source of truth
  const isAssignee = !!openTask && openTask.assigneeRole === userType

  const permissions = {
    canEdit: isAssignee && metadata.kind === 'FORM',
    canSaveDraft: isAssignee && metadata.kind === 'FORM',
    canSubmit: isAssignee,
    actions:
      metadata.kind === 'FORM'
        ? isAssignee
          ? ['SUBMIT']
          : []
        : isAssignee
          ? ['APPROVE', 'REJECT', 'SEND_BACK']
          : [],
    taskId: openTask?.taskId,
  }

  const ui = {
    schemaVersion: 1,
    instanceId,
    stageDefId,
    stageKey: stageDef.stageKey,
    stageName: stageDef.stageName,
    kind: metadata.kind,
    metadata,
    values,
    permissions,
    documents,
  }

  return StageUiResponseV1Schema.parse(ui)
}

// ----------------------
// Contract API: PATCH /values
// ----------------------
export function localPatchStageValues(
  instanceId: number,
  stageDefId: number,
  payload: { values: Record<string, unknown> }
) {
  const cur = readJson<Record<string, unknown>>(
    K_STAGE_DETAIL(instanceId, stageDefId),
    {}
  )
  const next = { ...cur, ...(payload.values ?? {}) }
  writeJson(K_STAGE_DETAIL(instanceId, stageDefId), next)
  return { ok: true as const }
}

export async function localUploadFile(file: File) {
  return {
    url: URL.createObjectURL(file), // mock URL
    fileName: file.name,
  }
}

export async function localAddStageDocument(
  instanceId: number,
  stageDefId: number,
  docType: string,
  url: string,
  fileName: string
) {
  const k = K_DOCS(instanceId, stageDefId)
  const cur = readJson<unknown[]>(k, [])
  const next = [
    ...cur,
    {
      id: Date.now(),
      docType,
      url,
      fileName,
      createdAt: new Date().toISOString(),
    },
  ]
  writeJson(k, next)
  return { ok: true as const }
}

// ----------------------
// Contract API: POST /tasks/{taskId}/action
// ----------------------
export function localPostTaskAction(
  taskId: number,
  payload: {
    action: string
    comment?: string
    values?: Record<string, unknown>
  }
) {
  const tasks = listTasks()
  const t = tasks.find((x) => x.taskId === taskId && x.status === 'OPEN')
  if (!t)
    throw {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Task not found or already done' },
    }

  const userType = getUserType()
  if (t.assigneeRole !== userType) {
    throw { ok: false, error: { code: 'FORBIDDEN', message: 'Not your task' } }
  }

  // upsert values if provided
  if (payload.values) {
    localPatchStageValues(t.instanceId, t.stageDefId, {
      values: payload.values,
    })
  }

  // close current task
  const nextTasks = tasks.map((x) =>
    x.taskId === taskId ? { ...x, status: 'DONE' as const } : x
  )
  writeJson(K_TASKS, nextTasks)

  const inst = getInstance(t.instanceId)
  if (!inst)
    throw {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Instance not found' },
    }

  // compute next stage
  const idx = inst.stageDefIds.indexOf(t.stageDefId)
  const nextStageDefId =
    idx >= 0 && idx < inst.stageDefIds.length - 1
      ? inst.stageDefIds[idx + 1]
      : null

  if (!nextStageDefId) {
    // workflow finished
    return {
      ok: true,
      instanceId: t.instanceId,
      fromStageKey: getStageDef(t.stageDefId)?.stageKey ?? '',
      toStageKey: '',
      nextTaskId: null,
    }
  }

  const nextStage = getStageDef(nextStageDefId)!

  // update instance current stage
  const instances = listInstances().map((i) =>
    i.instanceId === inst.instanceId
      ? { ...i, currentStageDefId: nextStageDefId }
      : i
  )
  writeJson(K_INSTANCES, instances)

  // create next task for the assignee role of next stage
  const nt: Task = {
    taskId: nextTaskId(),
    instanceId: t.instanceId,
    stageDefId: nextStageDefId,
    assigneeRole: nextStage.assigneeRole,
    status: 'OPEN',
  }
  writeJson(K_TASKS, [nt, ...listTasks()])

  return {
    ok: true,
    instanceId: t.instanceId,
    fromStageKey: getStageDef(t.stageDefId)?.stageKey ?? '',
    toStageKey: nextStage.stageKey,
    nextTaskId: nt.taskId,
  }
}

// ----------------------
// Optional: list "My Tasks" for sidebar
// ----------------------
export function localListMyOpenTasks(): Array<{
  taskId: number
  instanceId: number
  stageDefId: number
  title: string
}> {
  const userType = getUserType()
  return listTasks()
    .filter((t) => t.status === 'OPEN' && t.assigneeRole === userType)
    .map((t) => {
      const sd = getStageDef(t.stageDefId)
      return {
        taskId: t.taskId,
        instanceId: t.instanceId,
        stageDefId: t.stageDefId,
        title: sd ? sd.stageName : `Stage ${t.stageDefId}`,
      }
    })
}
