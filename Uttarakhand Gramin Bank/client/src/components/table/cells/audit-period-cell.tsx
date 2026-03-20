interface AuditPeriodCellProps {
  from: string
  to: string
}

export default function AuditPeriodCell({ from, to }: AuditPeriodCellProps) {
  return (
    <span>
      {from} to {to}
    </span>
  )
}
