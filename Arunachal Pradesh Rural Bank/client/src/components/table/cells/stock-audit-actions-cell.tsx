import { MoreVertical } from 'lucide-react'
import { BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StockAuditActionsCellProps {
  row: {
    id?: string | number | undefined
    accountNo?: string | number | undefined
  }
}

export default function StockAuditActionsCell({
  row,
}: StockAuditActionsCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost' className='h-8 w-8'>
          <MoreVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuItem asChild>
          <a
            // href={`${BASE_URL}/stockAudit/fullReportPdf/${row.id}`}
            href={`${BASE_URL}/api/stock-audit/pdf/assignment/${row.id ?? 0}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            Audit Report
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`${BASE_URL}/stockAudit/generatePdf/${row.id}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            Assignment Letter
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
