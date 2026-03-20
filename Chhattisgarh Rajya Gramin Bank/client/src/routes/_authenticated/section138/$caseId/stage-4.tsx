import { createFileRoute } from '@tanstack/react-router'
import Stage4CaseFiling from '@/features/section138/stages/Stage4CaseFiling'

export const Route = createFileRoute('/_authenticated/section138/$caseId/stage-4')({
  component: Stage4CaseFiling,
})