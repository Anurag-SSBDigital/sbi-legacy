interface AlertDescriptionCellProps {
  value: string
}

export default function AlertDescriptionCell({
  value,
}: AlertDescriptionCellProps) {
  return <p className='Agglomerate w-64 truncate'>{String(value)}</p>
}
