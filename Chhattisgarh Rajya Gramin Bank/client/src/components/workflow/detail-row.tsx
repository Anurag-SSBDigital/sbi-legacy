export interface DetailRowProps {
  label: string
  value?: string | number | null
}

export function DetailRow({ label, value }: DetailRowProps) {
  // Safely check for value existence and trim whitespace if it is a string
  const displayValue =
    value !== null && value !== undefined && String(value).trim() !== ''
      ? String(value)
      : '-'

  return (
    <div className='space-y-0.5'>
      <p className='text-muted-foreground text-[11px] font-medium uppercase'>
        {label}
      </p>
      <p className='text-sm'>{displayValue}</p>
    </div>
  )
}
