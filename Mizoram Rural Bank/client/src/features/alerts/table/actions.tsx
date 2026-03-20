/* ---------------------------------------------- */
/* components/table/row-actions-menu.tsx          */
/* ---------------------------------------------- */
import { components } from '@/types/api/v1.js'
import { MoreHorizontal } from 'lucide-react'
import { BASE_URL } from '@/lib/api.ts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RowActionsMenuProps {
  row: components['schemas']['AlertSummaryDTO']
  onAccept?: () => void
  onReject?: () => void
  onDocumentView: () => void
  onHistoryView?: () => void
}

export function AlertRowActionsMenu({
  row,
  onAccept,
  onReject,
  onDocumentView,
  onHistoryView,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost' className='h-8 w-8'>
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Open row actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-48'>
        {onAccept && row.status === 'PENDING_APPROVAL' && (
          <DropdownMenuItem onSelect={() => onAccept()}>
            Accept
          </DropdownMenuItem>
        )}

        {onReject && row.status === 'PENDING_APPROVAL' && (
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onSelect={() => onReject()}
          >
            Reject
          </DropdownMenuItem>
        )}

        {(onAccept || onAccept) && <DropdownMenuSeparator />}
        <a
          href={`${BASE_URL}/alert/resolutions/${row.resolutionId}/documents/download`}
          download
        >
          <DropdownMenuItem onSelect={() => onDocumentView()}>
            View Documents
          </DropdownMenuItem>
        </a>

        {onHistoryView && (
          <DropdownMenuItem onSelect={() => onHistoryView()}>
            Resolution History
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
