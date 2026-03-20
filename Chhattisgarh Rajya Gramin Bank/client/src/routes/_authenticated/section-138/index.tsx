import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/section-138/')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode',
      params: { processCode: '138' },
    })
  },
})
