import { createFileRoute } from '@tanstack/react-router'
import WorkflowMyTasksPage from '@/features/workflow-runtime/workflow-my-tasks-page'

export const Route = createFileRoute('/_authenticated/workflow/tasks/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <WorkflowMyTasksPage />
}
