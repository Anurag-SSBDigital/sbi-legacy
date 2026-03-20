import { createFileRoute } from '@tanstack/react-router'
import UltraFormDesigner from '@/features/form-designer/ultra-form-designer'

export const Route = createFileRoute('/_authenticated/admin/form-designer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UltraFormDesigner />
}
