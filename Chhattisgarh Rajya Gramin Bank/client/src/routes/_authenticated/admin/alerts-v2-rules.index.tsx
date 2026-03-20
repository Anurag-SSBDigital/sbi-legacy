import { createFileRoute } from '@tanstack/react-router'
import { AlertsV2RulesListPage } from './alerts-v2-rules'

export const Route = createFileRoute('/_authenticated/admin/alerts-v2-rules/')({
  component: AlertsV2RulesListPage,
})
