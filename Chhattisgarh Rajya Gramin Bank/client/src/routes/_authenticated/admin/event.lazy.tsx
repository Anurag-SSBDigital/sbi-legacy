import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  EditActionCell,
  DeleteActionCell,
  SemiBoldCell,
} from '@/components/table/cells.ts'
import { EventFormDialog } from '@/features/event/EventFormDialog'
import { useCanAccess } from '@/components/hooks/use-can-access'

export const Route = createLazyFileRoute('/_authenticated/admin/event')({
  component: RouteComponent,
})

// function normalizeList(data: any): EventForm[] {
//   const raw = Array.isArray(data?.data)
//     ? data.data
//     : Array.isArray(data?.data?.content)
//     ? data.data.content
//     : Array.isArray(data)
//     ? data
//     : []
//   return raw.map((d: any) => ({
//     id: d.id,
//     eventType: d.eventType ?? '',
//   }))
// }

export type EventForm = {
  id?: number
  eventType: string
}

// ---- helpers (type guards) ----
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
function isEventFormLike(
  v: unknown
): v is { id?: unknown; eventType?: unknown } {
  return isRecord(v)
}
function extractArray(data: unknown): unknown[] {
  // handles: { data: [] } | { data: { content: [] } } | [] | anything else
  if (isRecord(data)) {
    const d = data.data
    if (Array.isArray(d)) return d
    if (isRecord(d) && Array.isArray(d.content)) return d.content
  }
  if (Array.isArray(data)) return data
  return []
}

// ---- eslint-clean normalizer ----
function normalizeList(data: unknown): EventForm[] {
  return extractArray(data)
    .filter(isEventFormLike)
    .map((d) => ({
      id: typeof d.id === 'number' ? d.id : undefined,
      eventType: typeof d.eventType === 'string' ? d.eventType : '',
    }))
}

function RouteComponent() {
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventForm | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const canCreate = useCanAccess('event', 'create')
  const canEdit = useCanAccess('event', 'update')
  const canDelete = useCanAccess('event', 'delete')

  // --- API hooks (your endpoints) ---
  const createEventMutation = $api.useMutation(
    'post',
    '/legal-eventType/create',
    {
      onSuccess: () => {
        toast.success('Event created successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not create event. Please try again.'),
    }
  )

  const updateEventMutation = $api.useMutation(
    'put',
    '/legal-eventType/update/{id}',
    {
      onSuccess: () => {
        toast.success('Event updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(error, 'Could not update event. Please try again.'),
    }
  )

  const {
    data: eventResp,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/legal-eventType/all', {})

  const deleteEventMutation = $api.useMutation(
    'delete',
    '/legal-eventType/delete/{id}'
  )

  // Normalize + sort A→Z
  const tableData = useMemo<EventForm[]>(() => {
    return normalizeList(eventResp).sort((a, b) =>
      (a.eventType || '').localeCompare(b.eventType || '', undefined, {
        sensitivity: 'base',
      })
    )
  }, [eventResp])

  // --- Handlers ---
  const handleEdit = (row: EventForm) => {
    setEditingEvent({ id: row.id, eventType: row.eventType })
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setFormOpen(true)
  }

  const nameExists = (name: string, ignoreId?: number | null) => {
    const n = name.trim().toLowerCase()
    return tableData.some(
      (x) =>
        x.eventType.trim().toLowerCase() === n &&
        (ignoreId ? x.id !== ignoreId : true)
    )
  }

  const handleFormSubmit = async (values: EventForm) => {
    const eventType = values.eventType.trim()
    const isEdit = editingEvent?.id != null

    if (!eventType) {
      toast.error('Event Type is required')
      return
    }
    if (nameExists(eventType, editingEvent?.id ?? null)) {
      toast.error('Event Type already exists')
      return
    }

    if (isEdit && editingEvent?.id) {
      updateEventMutation.mutate({
        body: { eventType },
        params: {
          path: { id: editingEvent.id },
          header: { Authorization: '' },
        },
      })
    } else {
      createEventMutation.mutate({
        body: { eventType },
        params: { header: { Authorization: '' } },
      })
    }
  }

  const handleDelete = (id: number) => {
    setDeletingId(id)
    deleteEventMutation.mutate(
      { params: { path: { id } } },
      {
        onSuccess: () => {
          toast.success('Event deleted')
          setDeletingId(null)
          refetch()
        },
        onError: () => {
          toast.error('Could not delete event')
          setDeletingId(null)
        },
      }
    )
  }

  const isSubmitting =
    createEventMutation.isPending || updateEventMutation.isPending

  return (
    <>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Event Types
        </h1>
        {canCreate && (
          <Button size='sm' onClick={handleCreate}>
            New Event
          </Button>
        )}
      </div>

      {tableData.length ? (
        <PaginatedTable
          data={tableData}
          renderActions={(row) => {
            const r = row as EventForm
            const rowDeleting =
              deletingId === r.id && deleteEventMutation.isPending
            return (
              <div className='flex flex-row gap-2'>
                {canEdit && (
                  <EditActionCell
                    // onClick={() => handleEdit(r)}
                    // disabled={rowDeleting || isSubmitting}
                    onClick={() => {
                      if (rowDeleting || isSubmitting) return
                      handleEdit(r)
                    }}
                  />
                )}
                {canDelete && (
                  <DeleteActionCell
                    title={`Delete "${r.eventType}"?`}
                    onConfirm={() => r.id && handleDelete(r.id)}
                    isConfirming={rowDeleting || isSubmitting}
                  />
                )}
              </div>
            )
          }}
          columns={[
            {
              key: 'eventType',
              label: 'Event Type',
              render: (value) => <SemiBoldCell value={value || ''} />,
            },
          ]}
          emptyMessage='No event types found.'
        />
      ) : (
        !isLoading && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
            <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
              No Event Types Found
            </h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              Get started by creating a new event type.
            </p>
            {canCreate && (
              <Button className='mt-4' onClick={handleCreate}>
                New Event
              </Button>
            )}
          </div>
        )
      )}

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingEvent}
      />
    </>
  )
}
