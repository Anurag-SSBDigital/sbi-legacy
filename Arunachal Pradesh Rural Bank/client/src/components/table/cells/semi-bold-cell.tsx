interface SemiBoldCellProps {
  value: string | undefined
}

export default function SemiBoldCell({ value }: SemiBoldCellProps) {
  return <span className='font-semibold'>{value ?? '-'}</span>
}
