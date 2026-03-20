import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/alerts/$alertType')({
  component: RouteComponent,
  beforeLoad: (ctx) => {
    if (ctx.params.alertType !== 'ews' && ctx.params.alertType !== 'frm') {
      throw redirect({ to: '/404' })
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
