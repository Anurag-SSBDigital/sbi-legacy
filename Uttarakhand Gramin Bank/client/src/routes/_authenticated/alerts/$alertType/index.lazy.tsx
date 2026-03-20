import { lazy, Suspense } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'

// Lazy imports (split into separate chunks)
const BranchAlertsView = lazy(
  () => import('@/features/alerts/branch/alerts-branch-view')
)
const AlertsAdminView = lazy(
  () => import('@/features/alerts/sadmin/alerts-admin-view')
)

type AlertKind = 'EWS' | 'FRM'

export const Route = createLazyFileRoute('/_authenticated/alerts/$alertType/')({
  component: RouteComponent,
})

function RouteComponent() {
  const user = useAuthStore((s) => s.auth.user)
  const { alertType } = Route.useParams()

  // Normalize and validate the param
  const type = (alertType || '').toLowerCase()
  const ALERT: AlertKind | null =
    type === 'ews' ? 'EWS' : null

  const isChecker = useCanAccess(
    type === 'ews' ? 'ews_alert' : 'ews_alert',
    'checker'
  )

  if (!ALERT) return <Invalid message='Unknown alert type.' />

  const isBranchUser = Boolean(user?.branchId)
  const isCoreAdmin = Boolean(user?.isSuperAdmin)
  const canSeeAdminView =
    isCoreAdmin || Boolean(user?.departmentId) || isChecker

  const View = canSeeAdminView
    ? AlertsAdminView
    : isBranchUser
      ? BranchAlertsView
      : null

  if (!View)
    return <Invalid message='You are not authorized to view these alerts.' />

  return (
    <Suspense
      fallback={
        <MainWrapper>
          <div className='flex w-full items-center justify-center'>
            Loading alerts…
          </div>
        </MainWrapper>
      }
    >
      <View alertType={ALERT} />
    </Suspense>
  )
}

function Invalid({ message = 'Invalid User' }: { message?: string }) {
  return (
    <MainWrapper>
      <div className='flex w-full items-center justify-center'>{message}</div>
    </MainWrapper>
  )
}
