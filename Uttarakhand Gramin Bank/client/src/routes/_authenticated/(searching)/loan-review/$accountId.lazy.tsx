import { createLazyFileRoute } from '@tanstack/react-router'
import LoanReview from '@/features/loan-review/index.tsx'

export const Route = createLazyFileRoute(
  '/_authenticated/(searching)/loan-review/$accountId'
)({
  component: LoanReview,
})
