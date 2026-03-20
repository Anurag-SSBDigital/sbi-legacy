interface DateCellProps {
  value: string | undefined
}

export default function DateCell({ value }: DateCellProps) {
  return value
    ? new Date(`${value}`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
}
