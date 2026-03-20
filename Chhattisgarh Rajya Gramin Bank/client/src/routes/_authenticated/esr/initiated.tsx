import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/esr/initiated')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode/initiated',
      params: { processCode: 'esr' },
    })
  },
})
