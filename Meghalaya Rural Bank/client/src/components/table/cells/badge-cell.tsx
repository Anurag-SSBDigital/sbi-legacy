import { Badge } from '@/components/ui/badge.tsx'

interface BadgeCellProps {
  value: string
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | null
    | undefined
}

export default function BadgeCell({ value, variant }: BadgeCellProps) {
  return <Badge variant={variant}>{value}</Badge>
}
