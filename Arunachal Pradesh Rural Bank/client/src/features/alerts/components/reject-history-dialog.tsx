import { components } from '@/types/api/v1.js'
import { AlertTriangle, History, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
// Icons
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Shadcn Table components

// interface HistoryItem {
//   resoluationId: string // Corrected typo from 'resoluationId' if it's 'resolutionId' in actual data
//   status: string
//   resoluationDesc: string // Corrected typo
//   rejectComments?: string | null
//   createdAt: string | Date
//   // Add any other fields that might be in your history data
// }

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: components['schemas']['AlertSummaryDTO'] | null
  loading: boolean
  error: Error | null
  data: components['schemas']['ResolutionHistoryDTO'][] | undefined
}

export function HistoryDialog({
  open,
  onOpenChange,
  row,
  loading,
  error,
  data,
}: HistoryDialogProps) {
  // const getStatusColor = (status: string) => {
  //   switch (status?.toLowerCase()) {
  //     case 'rejected':
  //       return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
  //     case 'approved':
  //     case 'accepted':
  //       return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
  //     case 'pending':
  //       return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
  //     default:
  //       return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/30'
  //   }
  // }

  // const formatDate = (dateInput: string | Date) => {
  //   try {
  //     return new Date(dateInput).toLocaleString(undefined, {
  //       year: 'numeric',
  //       month: 'short',
  //       day: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit',
  //     })
  //   } catch {
  //     return 'Invalid Date'
  //   }
  // }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'>
        <DialogHeader className='border-b p-6 pb-4'>
          <DialogTitle className='flex items-center text-xl font-semibold'>
            <History className='text-primary mr-2 h-5 w-5' />
            Resolution History
          </DialogTitle>
          {row && (
            <DialogDescription className='text-muted-foreground pt-1 text-sm'>
              <strong>Resolution:</strong> {row.resolutionId}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className='flex-grow overflow-y-auto px-6 py-4'>
          {loading && (
            <div className='text-muted-foreground flex h-40 flex-col items-center justify-center'>
              <Loader2 className='text-primary mb-3 h-8 w-8 animate-spin' />
              <p className='text-lg'>Loading history...</p>
              <p className='text-sm'>Please wait a moment.</p>
            </div>
          )}

          {error && (
            <div className='text-destructive flex h-40 flex-col items-center justify-center rounded-md bg-red-50 p-6 dark:bg-red-900/20'>
              <AlertTriangle className='mb-3 h-8 w-8' />
              <p className='text-lg font-semibold'>Error Fetching History</p>
              <p className='text-center text-sm'>
                {error.message || 'An unexpected error occurred.'}
              </p>
            </div>
          )}

          {!loading && !error && (!data || data.length === 0) && (
            <div className='text-muted-foreground flex h-40 flex-col items-center justify-center rounded-md bg-gray-50 p-6 dark:bg-gray-800/20'>
              <Info className='text-primary mb-3 h-8 w-8' />
              <p className='text-lg font-semibold'>No History Found</p>
              <p className='text-sm'>
                There is no rejection or resolution history for this alert yet.
              </p>
            </div>
          )}

          {!loading && !error && data && data.length > 0 && (
            <div className='overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted/50'>
                  <TableRow>
                    <TableHead className='w-[120px] px-3 py-2.5 text-xs sm:text-sm'>
                      Action
                    </TableHead>
                    <TableHead className='w-[100px] px-3 py-2.5 text-xs sm:text-sm'>
                      Details
                    </TableHead>
                    <TableHead className='min-w-[200px] px-3 py-2.5 text-xs sm:text-sm'>
                      Timestamp
                    </TableHead>
                    <TableHead className='min-w-[200px] px-3 py-2.5 text-xs sm:text-sm'>
                      User
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow
                      key={item.timestamp}
                      className='hover:bg-muted/30 transition-colors'
                    >
                      <TableCell className='px-3 py-2.5 align-top text-xs font-medium sm:text-sm'>
                        {item.action}
                      </TableCell>
                      <TableCell className='px-3 py-2.5 align-top text-xs sm:text-sm'>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium`}
                        >
                          {item.details}
                        </span>
                      </TableCell>
                      <TableCell className='px-3 py-2.5 align-top text-xs break-words whitespace-pre-wrap sm:text-sm'>
                        {item.timestamp}
                      </TableCell>
                      <TableCell className='px-3 py-2.5 align-top text-xs break-words whitespace-pre-wrap sm:text-sm'>
                        {item.user || (
                          <span className='text-muted-foreground italic'>
                            N/A
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className='bg-background border-t p-6 pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
