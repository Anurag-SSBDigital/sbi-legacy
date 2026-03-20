import { createFileRoute } from '@tanstack/react-router'
import Stage3LegalNotice from '@/features/section138/stages/Stage3LegalNotice'

export const Route = createFileRoute('/_authenticated/section138/$caseId/stage-3')({
  component: Stage3LegalNotice,
})