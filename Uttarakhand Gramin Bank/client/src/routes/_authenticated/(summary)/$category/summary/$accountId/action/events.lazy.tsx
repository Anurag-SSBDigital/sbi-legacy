/* ------------------------------------------------------------------ */
/* Event History — list & create events for an account                */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import { DateCell, ReportCell } from '@/components/table/cells.ts'
import NewEventDialog from '@/features/events/new-event-history-dialog.tsx'

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */
export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/events'
)({
  component: EventHistoryPage,
})

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function EventHistoryPage() {
  const { accountId } = Route.useParams()

  /* ------- fetch account holder name ------- */
  const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
    'get',
    '/account/getName',
    {
      params: { query: { acctNo: accountId } },
      onError: () => toast.error('Could not fetch account holder name'),
    }
  )

  /* ------------- fetch events --------------- */
  const {
    data: eventsRes,
    isLoading: eventsLoading,
    refetch,
  } = $api.useQuery('get', '/Events/history/{accountNumber}', {
    params: { path: { accountNumber: accountId } },
  })

  const events = eventsRes?.data ?? []
  const [dialogOpen, setDialogOpen] = useState(false)

  /* ------------- table columns -------------- */
  const columns = useMemo<
    PaginatedTableProps<components['schemas']['EventDto']>['columns']
  >(
    () => [
      {
        key: 'createDateTime',
        label: 'Date',
        sortable: true,
        render: (v) => <DateCell value={v} />,
      },
      { key: 'eventType', label: 'Event Type', sortable: true },
      { key: 'summary', label: 'Summary' },
      {
        key: 'report',
        label: 'Report',
        render: (url) => <ReportCell url={url} />,
      },
    ],
    []
  )

  const loading = nameLoading || eventsLoading

  /* ------------- UI ------------------------ */
  return (
    <>
      <div className='space-y-6'>
        <header className='text-center'>
          {loading ? (
            <Skeleton className='mx-auto h-6 w-72' />
          ) : (
            <h2 className='text-2xl font-semibold tracking-tight'>
              Event History — {nameRes?.data ?? ''} ({accountId})
            </h2>
          )}
        </header>

        <Card>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Event Records</CardTitle>

            <Button
              size='sm'
              className='gap-2'
              onClick={() => setDialogOpen(true)}
            >
              <CalendarPlus className='h-4 w-4' />
              <span className='hidden sm:inline'>New Event</span>
            </Button>
          </CardHeader>

          <CardContent>
            <PaginatedTable
              data={events}
              columns={columns}
              initialRowsPerPage={10}
              showSearch
              frameless
              emptyMessage='No event records found'
            />
          </CardContent>
        </Card>
      </div>

      {/* dialog */}
      <NewEventDialog
        open={dialogOpen}
        setOpen={(o) => {
          setDialogOpen(o)
          if (!o) refetch()
        }}
        accountId={accountId}
      />
    </>
  )
}

export default EventHistoryPage
