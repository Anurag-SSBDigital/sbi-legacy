import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { canOpenPath } from '@/lib/canOpenPath'
import { resolveProcessRouteConfigByParam } from '@/features/process-settings/process-setting-utils.ts'
import { WorkflowAccountsPage } from '@/features/workflow-accounts/workflow-accounts-page.tsx'

export const Route = createFileRoute('/_authenticated/process/$processCode/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { processCode } = Route.useParams()
  const navigate = Route.useNavigate()
  const user = useAuthStore().auth.user
  const { data: processSettingsResponse, isLoading } = $api.useQuery(
    'get',
    '/api/process-settings/getAll',
    {}
  )

  const resolvedProcess = useMemo(
    () =>
      resolveProcessRouteConfigByParam(processSettingsResponse, processCode),
    [processCode, processSettingsResponse]
  )

  const isEnabledProcess = resolvedProcess?.showInSidebar === true
  const canAccessProcess =
    resolvedProcess != null &&
    canOpenPath(user ?? undefined, resolvedProcess.accountsPath)

  useEffect(() => {
    if (isLoading) return
    if (!resolvedProcess || !isEnabledProcess) {
      void navigate({ to: '/', replace: true })
      return
    }
    if (!canAccessProcess) {
      void navigate({ to: '/403', replace: true })
    }
  }, [canAccessProcess, isEnabledProcess, isLoading, navigate, resolvedProcess])

  if (isLoading || !resolvedProcess || !isEnabledProcess || !canAccessProcess) {
    return null
  }

  return (
    <WorkflowAccountsPage
      processCode={resolvedProcess.processCode}
      processName={resolvedProcess.processName}
    />
  )
}
