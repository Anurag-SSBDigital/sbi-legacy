import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admin/alert-workflow/$alertType'
)({
  beforeLoad: (ctx) => {
    if (ctx.params.alertType !== 'EWS' && ctx.params.alertType !== 'FRM') {
      throw redirect({ to: '/404' })
    }
  },
  component: () => <Outlet />,
})
