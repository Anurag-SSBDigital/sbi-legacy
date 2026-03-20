import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vehicle-act/initiated')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode/initiated',
      params: { processCode: 'vehicle-act' },
    })
  },
})
