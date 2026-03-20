interface AccountNoDisplayCellProps {
  value: string
}

export default function AccountNoDisplayCell({
  value,
}: AccountNoDisplayCellProps) {
  return (
    <span className='font-mono text-blue-600 dark:text-blue-400'>{value}</span>
  )
}
