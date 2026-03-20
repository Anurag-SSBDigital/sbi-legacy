import { createFileRoute } from '@tanstack/react-router'
import Stage1ChequePresentation from '@/features/section138/stages/Stage1ChequePresentation'

export const Route = createFileRoute('/_authenticated/section138/$caseId/stage-1')({
  component: Stage1ChequePresentation,
})