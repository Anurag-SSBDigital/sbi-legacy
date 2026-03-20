import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import DynamicPage from '@/workflow.dynamic/ui/DynamicPage'

export const Route = createFileRoute(
  '/_authenticated/wf/dynamic/$bundleId/$pageId'
)({
  component: Page,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      key: z.string().optional().parse(search.key),
    }
  },
})

function Page() {
  const { bundleId, pageId } = Route.useParams()
  const search = Route.useSearch() // contains ?key=...
  return (
    <DynamicPage bundleId={bundleId} pageId={pageId} workflowKey={search.key} />
  )
}
