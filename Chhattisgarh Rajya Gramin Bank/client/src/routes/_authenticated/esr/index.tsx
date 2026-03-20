import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/esr/')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode',
      params: { processCode: 'esr' },
    })
  },
})
