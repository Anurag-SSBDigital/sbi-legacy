import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { RuleWorkspaceCreateVersionPage } from './alerts-v2-rules.$ruleId'

export const Route = createFileRoute(
  '/_authenticated/admin/alerts-v2-rules/$ruleId/create-version'
)({
  component: RouteComponent,
  validateSearch: z.object({
    editVersionNo: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .catch(undefined),
    readOnly: z.coerce.boolean().optional().catch(undefined),
  }).parse,
})

function RouteComponent() {
  const search = Route.useSearch()
  return (
    <RuleWorkspaceCreateVersionPage
      editVersionNo={search.editVersionNo ?? null}
      readOnly={Boolean(search.readOnly)}
    />
  )
}
