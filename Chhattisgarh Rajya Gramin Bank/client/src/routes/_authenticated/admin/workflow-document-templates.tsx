import { createFileRoute } from '@tanstack/react-router'
import WorkflowDocumentTemplateDesigner from '@/features/form-designer/workflow-document-template-designer'

export const Route = createFileRoute(
  '/_authenticated/admin/workflow-document-templates'
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <WorkflowDocumentTemplateDesigner />
}
