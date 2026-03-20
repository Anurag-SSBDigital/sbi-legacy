// src/features/section138/section138.storage.ts
import type { CaseStage, Section138CaseRecord } from './section138.types'

const KEY = 'section138_cases_v1'
const nowIso = () => new Date().toISOString()

export const makeCaseId = () =>
  `S138-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`

const readAll = (): Section138CaseRecord[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as Section138CaseRecord[]
  } catch {
    return []
  }
}

const writeAll = (rows: Section138CaseRecord[]) => {
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export const createCase = (seed?: Partial<Section138CaseRecord>) => {
  const id = seed?.id ?? makeCaseId()

  const record: Section138CaseRecord = {
    id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    overallStatus: 'DRAFT',
    currentStage: 'STAGE_1',
    stage1: seed?.stage1 ?? {},
    stage2: seed?.stage2 ?? {},
    stage3: seed?.stage3 ?? {},
    stage4: seed?.stage4 ?? {},
    stage5: seed?.stage5 ?? {},
    ...seed,
  }

  const all = readAll()
  writeAll([record, ...all])
  return record
}

export const getCaseById = (id: string) => readAll().find((r) => r.id === id)

export const patchCase = (id: string, patch: Partial<Section138CaseRecord>) => {
  const all = readAll()
  const next = all.map((r) =>
    r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r
  )
  writeAll(next)
  return next.find((r) => r.id === id)
}

export const setCurrentStage = (id: string, stage: CaseStage) =>
  patchCase(id, { currentStage: stage, overallStatus: 'IN_PROGRESS' })
