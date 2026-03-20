import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.tsx'

interface ConfirmDeleteDialogProps {
  /** Button (or icon) that opens the dialog */
  children: React.ReactNode
  /** Heading shown in the dialog */
  title: string
  /** Extra text under the title */
  description?: string
  /** Called when the user clicks **Delete**  */
  onConfirm: () => void
  /** Disable Confirm button + swap text while async delete runs */
  isConfirming?: boolean
  tooltip?: string
}

export default function ConfirmDeleteDialog({
  children,
  title,
  description = 'This action cannot be undone.',
  onConfirm,
  tooltip,
  isConfirming = false,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        </TooltipTrigger>
        {tooltip ? <TooltipContent side='top'>{tooltip}</TooltipContent> : null}
      </Tooltip>

      {/* modal */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
