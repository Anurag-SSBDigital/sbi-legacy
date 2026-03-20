import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vehicle-act/')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode',
      params: { processCode: 'vehicle-act' },
    })
  },
})
