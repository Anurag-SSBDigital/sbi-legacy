import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/section-138/initiated')({
  beforeLoad: () => {
    throw redirect({
      to: '/process/$processCode/initiated',
      params: { processCode: '138' },
    })
  },
})
