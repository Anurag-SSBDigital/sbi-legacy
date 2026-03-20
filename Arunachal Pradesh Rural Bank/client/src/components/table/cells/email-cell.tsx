interface EmailCellProps {
  value: string
}

export default function EmailCell({ value }: EmailCellProps) {
  return (
    <a href={`mailto:${value}`} className='text-blue-600 hover:underline'>
      {value}
    </a>
  )
}
