// routes/_authenticated/admin/_layout.tsx
import { useMemo } from 'react'
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatches,
} from '@tanstack/react-router'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { capitalizeFirstWord } from '@/lib/utils.ts'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx'
import { Crumb, CurrentPage } from '@/components/breadcrumb/types.ts'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context, location }) => {
    const auth = context.authStore.getState().auth.user

    if (!auth) {
      throw redirect({ to: '/' })
    }

    const canAccess = canOpenPath(auth, location.pathname)

    if (!canAccess) {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const _matches = useMatches()

  const match = _matches[_matches.length - 1]

  const [crumbs, action] = useMemo(() => {
    const pathSegments = match.id.replace(/^\/|\/$/g, '').split('/')

    const action = capitalizeFirstWord(
      pathSegments[pathSegments.length - 1] == ''
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1]
    )

    let actionCrumb: CurrentPage = { type: 'label', label: action }

    let crumbs: Crumb[] = [{ type: 'link', item: { to: '/', label: 'Home' } }]

    switch (match.fullPath) {
      case '/admin/roles/create':
      case '/admin/roles/$roleId/edit':
        crumbs = [
          ...crumbs,
          {
            type: 'link' as const,
            item: { to: '/admin/roles', label: 'Roles' },
          },
        ]
        break
      case '/admin/alerts/$alertType':
        actionCrumb = {
          type: 'label',
          label: `${action.toUpperCase()} Alert Master`,
        }
        break
      case '/admin/alert-workflow/$alertType/$workflowId/stages':
        crumbs = [
          ...crumbs,
          {
            label: `Workflow (${match.params.workflowId})`,
            type: 'dropdown' as const,
            selectedIndex: match.params.alertType === 'EWS' ? 0 : 1,
            items: [
              {
                to: `/admin/workflow?alertType=EWS`,
                label: 'EWS (Legacy)',
              },
              // {
              //   to: `/admin/workflow?alertType=FRM`,
              //   label: 'FRM',
              // },
            ],
          },
        ]
        actionCrumb = {
          type: 'label',
          label: `${action}`,
        }
        break
    }
    return [crumbs, actionCrumb]
  }, [match.fullPath, match.id])

  return (
    <MainWrapper>
      <AppBreadcrumb crumbs={crumbs} currentPage={action} />
      <div className='pt-2'>
        <Outlet />
      </div>
    </MainWrapper>
  )
}
