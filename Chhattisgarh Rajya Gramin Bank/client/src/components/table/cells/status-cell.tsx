interface StatusCellProps {
  value: 'COMPLETED' | 'PENDING' | string
}

export default function StatusCell({ value }: StatusCellProps) {
  const colorClass =
    value === 'COMPLETED'
      ? 'bg-green-100 text-green-800'
      : value === 'PENDING'
        ? 'bg-orange-100 text-orange-800'
        : 'bg-gray-100 text-gray-800'

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
    >
      {`${value}`}
    </span>
  )
}
