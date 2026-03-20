import { createFileRoute } from '@tanstack/react-router'
import { RuleWorkspacePage } from './alerts-v2-rules.$ruleId'

export const Route = createFileRoute(
  '/_authenticated/admin/alerts-v2-rules/$ruleId/'
)({
  component: RuleWorkspacePage,
})
