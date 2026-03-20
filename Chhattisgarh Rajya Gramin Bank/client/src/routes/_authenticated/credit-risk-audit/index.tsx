import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/credit-risk-audit/')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode',
      params: { processCode: 'cr-audit' },
    })
  },
})
