import { createFileRoute, redirect } from '@tanstack/react-router'
import Dashboard from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  loader: () => ({ crumb: 'Home' }),
  component: Dashboard,
  beforeLoad: ({ context }) => {
    const user = context.authStore.getState().auth.user

    const isStockAuditor = user?.stockAuditor
    if (isStockAuditor) {
      throw redirect({
        to: '/stock-audit/assigned-audits',
        search: { tab: 'PENDING' },
      })
    }

    const isAdvocate = user?.advocate
    if (isAdvocate) {
      throw redirect({
        to: '/advocate',
      })
    }

    const isValuer = user?.valuer
    if (isValuer) {
      throw redirect({
        to: '/valuer',
      })
    }
  },
})
