// src/features/section138/Section138Provider.tsx
import React, { createContext, useContext, useMemo, useState } from 'react'
import type { CaseStage, Section138CaseRecord } from './section138.types'
import { getCaseById, patchCase, setCurrentStage } from './section138.storage'

type Ctx = {
  record: Section138CaseRecord
  save: (patch: Partial<Section138CaseRecord>) => void
  goStage: (stage: CaseStage) => void
  closeCase: () => void
  refresh: () => void
}

const Section138Ctx = createContext<Ctx | null>(null)

export const useSection138 = () => {
  const ctx = useContext(Section138Ctx)
  if (!ctx) throw new Error('useSection138 must be used within Section138Provider')
  return ctx
}

export const Section138Provider: React.FC<{
  caseId: string
  children: React.ReactNode
}> = ({ caseId, children }) => {
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const record = getCaseById(caseId)
  if (!record) throw new Error(`Section138 case not found: ${caseId}`)

  const save = (patch: Partial<Section138CaseRecord>) => {
    patchCase(caseId, patch)
    refresh()
  }

  const goStage = (stage: CaseStage) => {
    setCurrentStage(caseId, stage)
    refresh()
  }

  const closeCase = () => {
    patchCase(caseId, { overallStatus: 'CLOSED' })
    refresh()
  }

  const value = useMemo<Ctx>(
    () => ({ record, save, goStage, closeCase, refresh }),
    // record is refreshed by rerender (tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record.id, record.updatedAt]
  )

  return <Section138Ctx.Provider value={value}>{children}</Section138Ctx.Provider>
}