import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button.tsx'

interface ActionCellProps<T> {
  row: Row<T>
  onEdit?: (row: Row<T>) => void
  onDelete?: (row: Row<T>) => void
}

export default function ActionCell<T>({
  row,
  onEdit,
  onDelete,
}: ActionCellProps<T>) {
  return (
    <div className='space-x-2'>
      {onEdit && <Button onClick={() => onEdit(row)}>Edit</Button>}
      {onDelete && <Button onClick={() => onDelete(row)}>Delete</Button>}
    </div>
  )
}
