import { createFileRoute, redirect } from '@tanstack/react-router'
import GeneralError from '@/features/errors/general-error'

export const Route = createFileRoute('/(errors)/500')({
  loader: () => {
    throw redirect({ to: '/' })
  },
  component: GeneralError,
})
