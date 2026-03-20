import { createFileRoute, redirect } from '@tanstack/react-router'
import NotFoundError from '@/features/errors/not-found-error'

export const Route = createFileRoute('/(errors)/404')({
  loader: () => {
    throw redirect({ to: '/' })
  },
  component: NotFoundError,
})
