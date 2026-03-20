import TermLoanReview from '@/features/term-loan-review'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/(searching)/term-loan-review/$accountId'
)({
  component: TermLoanReview,
})
