import { useMemo, useState, useEffect } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/authStore'
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Main } from '@/components/layout/main'
import PaginatedTable from '@/components/paginated-table'

import SecurityDetailsSection from '@/features/security/SecurityDetailsSection'
import { extractArray, inList, isRecord } from '@/features/security/security-helpers'

export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/legal'
)({
  component: RouteComponent,
})

/* ---------------- Types ---------------- */

type EventRow = {
  id?: number
  eventType: string
  advocateName: string
  dueDate: string
  status: string
  createdAt: string

  // ✅ for edit auto-select
  advocateId?: string
  securityId?: number
}

type AdvocateOption = { id?: string | number; name: string }

type SecurityRow = {
  id?: number
  collateralNo: string
  ownerName: string
}

/* ---------------- Helpers ---------------- */

function getNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function getString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function normalize(v: unknown): string {
  return String(v ?? '').trim()
}

function normalizeLower(v: unknown): string {
  return normalize(v).toLowerCase()
}

function toAdvocatesList(data: unknown): AdvocateOption[] {
  return extractArray(data)
    .map((x) => {
      if (isRecord(x)) {
        const rawId = (x).id
        const rawName = ((x).name as unknown) ?? ((x).advocateName as unknown)
        const id =
          typeof rawId === 'string' || typeof rawId === 'number' ? rawId : undefined
        const name = typeof rawName === 'string' ? rawName : ''
        return { id, name }
      }
      return { id: undefined, name: '' }
    })
    .filter((a) => a.name)
}

/* ---------------- Component ---------------- */

function RouteComponent() {
  const navigate = useNavigate()
  const [loading] = useState(false)

  const { accountId } = Route.useParams()
  const accountNo = accountId as string

  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [isEditEvent, setIsEditEvent] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)

  const [eventType, setEventType] = useState('')
  const [customEventType, setCustomEventType] = useState('')
  const [selectedSecurity, setSelectedSecurity] = useState('') // collateralNo
  const [selectedAdvocate, setSelectedAdvocate] = useState('') // advocate id
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    const user = useAuthStore.getState().auth.user
    if (!user) navigate({ to: '/' })
  }, [navigate])

  /* ---------------- Security list (for Select) ---------------- */
  const { data: securityListData } = $api.useQuery(
    'get',
    '/legal/security-details/account/{accountNo}',
    { params: { path: { accountNo } } }
  )

  const securityRows: SecurityRow[] = useMemo(() => {
    const arr = (securityListData as { data?: unknown } | undefined)?.data
    if (!Array.isArray(arr)) return []
    return arr
      .map((item: unknown) => {
        if (!isRecord(item)) {
          return { id: undefined, collateralNo: '', ownerName: '' }
        }
        const id = getNumber(item.id)
        return {
          id,
          collateralNo: String(item.collateralNumber ?? ''),
          ownerName: String(item.ownerName ?? ''),
        }
      })
      .filter((s) => s.collateralNo)
  }, [securityListData])

  /* ---------------- Lookups ---------------- */
  const { data: eventTypeResp, isLoading: isEventTypeLoading } = $api.useQuery(
    'get',
    '/legal-eventType/all',
    {}
  )

  const eventTypeOptions = useMemo<string[]>(() => {
    return extractArray(eventTypeResp)
      .map((x) =>
        isRecord(x) && typeof x.eventType === 'string' ? String(x.eventType) : null
      )
      .filter((x): x is string => !!x)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [eventTypeResp])

  const { data: advocateDropdownData, isLoading: isAdvocateLoading } = $api.useQuery(
    'get',
    '/advocate/dropdown',
    {}
  )

  const advocates: AdvocateOption[] = useMemo(
    () => toAdvocatesList(advocateDropdownData),
    [advocateDropdownData]
  )

  /* ---------------- Events list ---------------- */
  const { data: eventListData, refetch: refetchEvents } = $api.useQuery(
    'get',
    `/legal/events/by-account/{accountNo}`,
    { params: { path: { accountNo }, header: { Authorization: '' } } }
  )

  const transformedEventData: EventRow[] = Array.isArray(
    (eventListData as { data?: unknown } | undefined)?.data
  )
    ? ((eventListData as { data?: unknown[] }).data ?? []).map((item: unknown) => {
      if (!isRecord(item)) {
        return {
          id: undefined,
          eventType: '',
          advocateName: '-',
          dueDate: '-',
          status: '-',
          createdAt: '-',
          advocateId: undefined,
          securityId: undefined,
        }
      }

      const event = isRecord(item.event) ? item.event : undefined
      const assignment = isRecord(item.assignment) ? item.assignment : undefined
      const advocateDetails = isRecord(item.advocateDetails) ? item.advocateDetails : undefined

      const advocateName =
        getString(advocateDetails?.advocateName) ||
        getString(assignment?.advocateUsername) ||
        '-'

      const createdAt = getString(event?.createdAt)?.split('T')[0] ?? '-'
      const id = getNumber(event?.id)

      // ✅ ids for auto-select on edit (adjust keys if backend differs)
      const securityId =
        getNumber(assignment?.securityId) ??
        getNumber(item.securityId) ??
        getNumber(event?.securityId)

      const advocateId =
        getString(assignment?.advocateId) ||
        (getNumber(assignment?.advocateId) !== undefined
          ? String(getNumber(assignment?.advocateId))
          : undefined) ||
        getString(advocateDetails?.id) ||
        (getNumber(advocateDetails?.id) !== undefined
          ? String(getNumber(advocateDetails?.id))
          : undefined)

      return {
        id,
        eventType: String(event?.eventType ?? ''),
        advocateName: String(advocateName),
        dueDate: String(assignment?.dueDate ?? '-') || '-',
        status: String(assignment?.status ?? '-') || '-',
        createdAt: String(createdAt) || '-',
        advocateId,
        securityId,
      }
    })
    : []

  /* ---------------- Mutations ---------------- */
  const assignLegalEventMutation = $api.useMutation('post', '/legal/events/create-and-assign', {
    onSuccess: () => {
      toast.success('Event assigned successfully.')
      setEventDialogOpen(false)
      setIsEditEvent(false)
      setEditEventId(null)
      setEventType('')
      setCustomEventType('')
      setSelectedAdvocate('')
      setSelectedSecurity('')
      setDueDate('')
      refetchEvents()
    },
    onError: () => toast.error('Failed to assign event.'),
  })

  const updateEventMutation = $api.useMutation('put', '/legal/events/{id}/update', {
    onSuccess: () => {
      toast.success('Event updated successfully.')
      setEventDialogOpen(false)
      setIsEditEvent(false)
      setEditEventId(null)
      setEventType('')
      setCustomEventType('')
      setSelectedAdvocate('')
      setSelectedSecurity('')
      setDueDate('')
      refetchEvents()
    },
    onError: () => toast.error('Failed to update event.'),
  })

  /* ---------------- Edit handler with auto-select ---------------- */
  const handleEditEvent = (row: EventRow) => {
    // event type prefill (with "Other" support)
    const apiEvent = row?.eventType ?? ''
    const isKnown = inList(apiEvent, eventTypeOptions)
    setEventType(isKnown ? apiEvent : 'Other')
    setCustomEventType(isKnown ? '' : apiEvent)

    // ✅ advocate auto-select (prefer id; fallback by name)
    const optionIdSet = new Set(advocates.map((a) => normalize(a.id)))
    const rowAdvId = normalize(row.advocateId)

    let advocateValue = ''
    if (rowAdvId && optionIdSet.has(rowAdvId)) {
      advocateValue = rowAdvId
    } else {
      const matched = advocates.find(
        (a) => normalizeLower(a.name) === normalizeLower(row.advocateName)
      )
      const matchedId = normalize(matched?.id)
      if (matchedId && optionIdSet.has(matchedId)) advocateValue = matchedId
    }
    setSelectedAdvocate(advocateValue)

    // ✅ security auto-select (select uses collateralNo value, so map securityId -> collateralNo)
    if (typeof row.securityId === 'number') {
      const sec = securityRows.find((s) => s.id === row.securityId)
      setSelectedSecurity(sec?.collateralNo ?? '')
    } else {
      setSelectedSecurity('')
    }

    setDueDate(row?.dueDate && row.dueDate !== '-' ? row.dueDate : '')

    if (typeof row?.id === 'number') setEditEventId(String(row.id))
    setIsEditEvent(true)
    setEventDialogOpen(true)
  }

  /* ---------------- Submit ---------------- */
  const handleSubmitEvent = () => {
    const token = sessionStorage.getItem('token') || ''
    const finalEventType =
      eventType === 'Other' && customEventType ? customEventType.trim() : eventType

    const selectedSecurityData = securityRows.find((s) => s.collateralNo === selectedSecurity)
    const selectedAdvocateData = advocates.find(
      (adv) => normalize(adv.id) === normalize(selectedAdvocate)
    )

    if (
      typeof selectedSecurityData?.id !== 'number' ||
      !selectedAdvocateData?.id ||
      !dueDate ||
      !finalEventType
    ) {
      toast.error('Please fill all required fields')
      return
    }

    const payload = {
      eventType: finalEventType,
      accountNo,
      securityId: selectedSecurityData.id,
      advocateId: String(selectedAdvocateData.id ?? ''),
      dueDate,
    }

    if (isEditEvent && editEventId) {
      updateEventMutation.mutate({
        body: payload,
        params: {
          path: { id: Number(editEventId) },
          header: { Authorization: `Bearer ${token}` },
        },
      })
    } else {
      assignLegalEventMutation.mutate({
        body: payload,
        params: { header: { Authorization: `Bearer ${token}` } },
      })
    }
  }

  /* ---------------- Download ---------------- */
  const downloadDocumentsMutation = $api.useMutation(
    'get',
    '/legal/events/{eventId}/download-documents'
  )

  const handleDownload = async (eventId: number | string) => {
    const idNum = typeof eventId === 'number' ? eventId : Number.parseInt(eventId, 10)
    if (!Number.isFinite(idNum)) {
      toast.error('Invalid event id')
      return
    }

    const filename = `event-${idNum}.zip`

    try {
      const result = await downloadDocumentsMutation.mutateAsync({
        params: { path: { eventId: idNum } },
        parseAs: 'blob',
      })

      if (result instanceof Blob) {
        const url = window.URL.createObjectURL(result)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success('Download started.')
        return
      }

      if (typeof result === 'string') {
        const link = document.createElement('a')
        link.href = result
        link.download = filename
        link.target = '_blank'
        link.rel = 'noreferrer'
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success('Download started.')
        return
      }

      throw new Error('Unexpected download response type')
    } catch (error) {
      toastError(error, 'Failed to download document.')
    }
  }

  /* ---------------- Render ---------------- */
  return (
    <>
      <LoadingBar progress={loading ? 50 : 100} color='#2563eb' height={3} />

      <Main className='px-4 py-2'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Legal Event Recording
          </h1>
        </div>

        {/* Shared Security Section */}
        <SecurityDetailsSection
          accountNo={accountNo}
          title='Security Details'
          onChanged={() => {
            // optional hook (if you want to refetch lists later)
          }}
        />

        {/* Event Section */}
        <div className='mt-10 mb-4 flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight text-primary dark:text-gray-100'>
            Event Table
          </h2>
          <Button
            onClick={() => {
              setIsEditEvent(false)
              setEditEventId(null)
              setEventType('')
              setCustomEventType('')
              setSelectedAdvocate('')
              setSelectedSecurity('')
              setDueDate('')
              setEventDialogOpen(true)
            }}
          >
            Add Event
          </Button>
        </div>

        <PaginatedTable
          data={transformedEventData}
          columns={[
            { key: 'eventType', label: 'Event Type' },
            { key: 'advocateName', label: 'Advocate' },
            { key: 'dueDate', label: 'Due Date' },
            {
              key: 'status',
              label: 'Status',
              render: (value) => {
                const colorClass =
                  value === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : value === 'PENDING'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                return (
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
                  >
                    {String(value ?? '-')}
                  </span>
                )
              },
            },
            { key: 'createdAt', label: 'Created On' },
            {
              key: 'eventType',
              label: 'Actions',
              render: (_, row) => {
                const r = row as EventRow
                return (
                  <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={() => handleEditEvent(r)}>
                      Edit
                    </Button>
                    {r.status === 'COMPLETED' && r.id !== undefined && (
                      <Button size='sm' onClick={() => handleDownload(r.id!)}>
                        Download
                      </Button>
                    )}
                  </div>
                )
              },
            },
          ]}
          emptyMessage='No legal events recorded for this account.'
        />

        {/* ✅ Beautified Dialog (same style as your valuer one) */}
        <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
          <DialogContent className='p-0 sm:max-w-xl overflow-hidden'>
            {/* Header */}
            <div className='relative border-b bg-gradient-to-br from-background via-muted/30 to-background px-6 py-5'>
              <div className='pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl' />
              <DialogHeader className='relative space-y-1'>
                <DialogTitle className='text-xl font-semibold tracking-tight'>
                  {isEditEvent ? 'Edit Legal Event' : 'Add Legal Event'}
                </DialogTitle>
                <p className='text-sm text-muted-foreground'>
                  Choose event type, assign advocate, link security, and set due date.
                </p>
              </DialogHeader>
            </div>

            {/* Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmitEvent()
              }}
              className='px-6 py-5'
            >
              <div className='space-y-5'>
                {/* Event Type */}
                <div className='rounded-xl border bg-card p-4 shadow-sm'>
                  <label className='text-sm font-medium text-foreground'>
                    Event Type <span className='text-destructive'>*</span>
                  </label>

                  <Select
                    value={eventType}
                    onValueChange={(v) => {
                      setEventType(v)
                      if (v !== 'Other') setCustomEventType('')
                    }}
                    disabled={isEventTypeLoading}
                  >
                    <SelectTrigger className='mt-2 w-full'>
                      <SelectValue
                        placeholder={isEventTypeLoading ? 'Loading…' : 'Select Event Type'}
                      />
                    </SelectTrigger>
                    <SelectContent className='max-h-72'>
                      {eventTypeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {eventType === 'Other' && (
                    <div className='mt-3 space-y-2'>
                      <Input
                        type='text'
                        placeholder='Type event name'
                        value={customEventType}
                        onChange={(e) => setCustomEventType(e.target.value)}
                      />
                      <p className='text-xs text-muted-foreground'>
                        This will be saved as the event type for this record.
                      </p>
                    </div>
                  )}
                </div>

                {/* Two-column row */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {/* Due Date */}
                  <div className='rounded-xl border bg-card p-4 shadow-sm'>
                    <label className='text-sm font-medium text-foreground'>
                      Due Date <span className='text-destructive'>*</span>
                    </label>
                    <Input
                      className='mt-2'
                      type='date'
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Pick the expected completion date.
                    </p>
                  </div>

                  {/* Advocate */}
                  <div className='rounded-xl border bg-card p-4 shadow-sm'>
                    <label className='text-sm font-medium text-foreground'>
                      Select Advocate <span className='text-destructive'>*</span>
                    </label>
                    <Select
                      value={selectedAdvocate}
                      onValueChange={setSelectedAdvocate}
                      disabled={isAdvocateLoading}
                    >
                      <SelectTrigger className='mt-2 w-full'>
                        <SelectValue
                          placeholder={isAdvocateLoading ? 'Loading advocates…' : 'Select Advocate'}
                        />
                      </SelectTrigger>
                      <SelectContent className='max-h-64'>
                        {advocates.map((adv) => (
                          <SelectItem key={String(adv.id ?? '')} value={normalize(adv.id)}>
                            <div className='flex w-full items-center justify-between gap-3'>
                              <span className='font-medium'>{adv.name}</span>
                              {adv.id ? (
                                <span className='truncate text-xs text-muted-foreground'>
                                  {String(adv.id)}
                                </span>
                              ) : null}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Security */}
                <div className='rounded-xl border bg-card p-4 shadow-sm'>
                  <div className='flex items-center justify-between gap-3'>
                    <label className='text-sm font-medium text-foreground'>
                      Select Security <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-xs text-muted-foreground'>
                      {securityRows.length ? `${securityRows.length} available` : 'No securities'}
                    </span>
                  </div>

                  <Select value={selectedSecurity} onValueChange={setSelectedSecurity}>
                    <SelectTrigger className='mt-2 w-full'>
                      <SelectValue placeholder='Select Security' />
                    </SelectTrigger>
                    <SelectContent className='max-h-72'>
                      {securityRows.map((sec) => (
                        <SelectItem key={String(sec.id ?? '')} value={sec.collateralNo}>
                          <div className='flex w-full items-center justify-between gap-3'>
                            <span className='font-medium'>{sec.collateralNo}</span>
                            <span className='truncate text-xs text-muted-foreground'>
                              {sec.ownerName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className='mt-3 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
                    Tip: Choose the collateral number to link this event with the correct security.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className='mt-6 border-t bg-muted/10 px-6 py-4 -mx-6 -mb-5 flex flex-col gap-2 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setEventDialogOpen(false)}
                  className='sm:min-w-[110px]'
                >
                  Cancel
                </Button>
                <Button type='submit' className='sm:min-w-[160px] shadow-sm'>
                  {isEditEvent ? 'Update Event' : 'Save Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}
