import { IconFileDownload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'

interface DownloadReportButtonProps {
  onClick?: () => void
  asChild?: boolean
}

export default function DownloadReportButton({
  onClick,
  asChild,
}: DownloadReportButtonProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild={asChild}
            onClick={onClick}
            variant='outline'
            size='icon'
            aria-label='Download Report'
          >
            <IconFileDownload className='h-4 w-4' />
          </Button>
        </TooltipTrigger>

        <TooltipContent side='top' align='center'>
          Download Report
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
