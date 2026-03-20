import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/cases'
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/npa/summary/cases/$accountId"!</div>
}
