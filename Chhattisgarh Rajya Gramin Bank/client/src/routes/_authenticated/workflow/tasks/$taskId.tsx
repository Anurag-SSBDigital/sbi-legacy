import { createFileRoute } from '@tanstack/react-router'
import WorkflowRuntimePage from '@/features/workflow-runtime/workflow-runtime-page'

export const Route = createFileRoute('/_authenticated/workflow/tasks/$taskId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { taskId } = Route.useParams()
  const parsedTaskId = Number(taskId)
  return (
    <WorkflowRuntimePage
      mode='task-only'
      initialTaskId={Number.isFinite(parsedTaskId) ? parsedTaskId : null}
    />
  )
}
