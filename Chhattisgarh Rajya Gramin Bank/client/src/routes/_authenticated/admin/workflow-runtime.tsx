import { createFileRoute } from '@tanstack/react-router'
import WorkflowRuntimePage from '@/features/workflow-runtime/workflow-runtime-page'

export const Route = createFileRoute('/_authenticated/admin/workflow-runtime')({
  component: RouteComponent,
})

function RouteComponent() {
  return <WorkflowRuntimePage />
}
