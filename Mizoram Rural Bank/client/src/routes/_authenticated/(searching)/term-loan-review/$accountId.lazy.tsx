import { createLazyFileRoute } from '@tanstack/react-router'
import TermLoanReview from '@/features/term-loan-review'

export const Route = createLazyFileRoute(
  '/_authenticated/(searching)/term-loan-review/$accountId'
)({
  component: TermLoanReview,
})
