interface TooltipCellProps {
  value: string
  maxLength?: number
}

export default function TooltipCell({
  value,
  maxLength = 180,
}: TooltipCellProps) {
  return (
    <span
      className='inline-block truncate text-left'
      style={{ maxWidth: maxLength }}
      title={value}
    >
      {value}
    </span>
  )
}
