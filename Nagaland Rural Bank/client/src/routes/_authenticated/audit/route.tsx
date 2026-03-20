import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/audit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
