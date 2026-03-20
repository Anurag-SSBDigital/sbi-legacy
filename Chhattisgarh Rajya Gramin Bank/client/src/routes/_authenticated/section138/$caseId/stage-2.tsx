import { createFileRoute } from '@tanstack/react-router'
import Stage2AdminApproval from '@/features/section138/stages/Stage2AdminApproval'

export const Route = createFileRoute('/_authenticated/section138/$caseId/stage-2')({
  component: Stage2AdminApproval,
})