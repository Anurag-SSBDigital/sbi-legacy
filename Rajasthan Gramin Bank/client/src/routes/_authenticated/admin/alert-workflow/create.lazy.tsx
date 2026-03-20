import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/admin/alert-workflow/create'
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/alerts/alert-workflow/create"!</div>
}
