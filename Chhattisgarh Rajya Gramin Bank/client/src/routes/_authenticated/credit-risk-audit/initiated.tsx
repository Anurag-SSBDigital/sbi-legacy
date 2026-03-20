import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/credit-risk-audit/initiated'
)({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode/initiated',
      params: { processCode: 'cr-audit' },
    })
  },
})
