// src/features/section138/section138.routes.ts
import type { CaseStage } from '../section138.types'

export const stageToPath = (caseId: string, stage: CaseStage) => {
  switch (stage) {
    case 'STAGE_1':
      return `/section138/${caseId}/stage-1`
    case 'STAGE_2':
      return `/section138/${caseId}/stage-2`
    case 'STAGE_3':
      return `/section138/${caseId}/stage-3`
    case 'STAGE_4':
      return `/section138/${caseId}/stage-4`
    case 'STAGE_5':
      return `/section138/${caseId}/stage-5`
    default:
      return `/section138/${caseId}/stage-1`
  }
}

export const STAGES: { key: CaseStage; label: string }[] = [
  { key: 'STAGE_1', label: 'Stage 1: Cheque Presentation' },
  { key: 'STAGE_2', label: 'Stage 2: Admin Approval' },
  { key: 'STAGE_3', label: 'Stage 3: Legal Notice' },
  { key: 'STAGE_4', label: 'Stage 4: Case Filing' },
  { key: 'STAGE_5', label: 'Stage 5: Resolution' },
]
