import { Badge } from '@/components/ui/badge.tsx'

const toINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function CurrencyCell({
  value,
}: {
  value: string | number | undefined
}) {
  return <Badge variant='secondary'>{toINR.format(Number(value ?? 0))}</Badge>
}
