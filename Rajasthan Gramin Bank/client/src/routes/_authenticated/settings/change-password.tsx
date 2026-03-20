import { createFileRoute } from '@tanstack/react-router'
import ChangePassword from '@/features/settings/change-password/index.tsx'

export const Route = createFileRoute(
  '/_authenticated/settings/change-password'
)({
  component: ChangePassword,
})
