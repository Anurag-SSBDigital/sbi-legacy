import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, createLazyFileRoute } from '@tanstack/react-router'
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
import { extractArray, isRecord } from '@/features/security/security-helpers'

export const Route = createLazyFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/valuer'
)({
  component: RouteComponent,
})

const FIXED_EVENT_TYPE = 'Valuation Event'

type EventRow = {
  id?: number
  eventType: string
  valuerName: string
  dueDate: string
  status: string
  createdAt: string
  // ✅ store id for edit prefill (email in your dropdown)
  valuerId?: string
  securityId?: number
}

type ValuerOption = { id?: string | number; name: string }

type SecurityApiRow = {
  id?: number
  collateralNumber?: string
  ownerName?: string
}

function toValuersList(data: unknown): ValuerOption[] {
  return extractArray(data)
    .map((x) => {
      if (isRecord(x)) {
        const rawId = (x as Record<string, unknown>).id
        const rawName =
          ((x as Record<string, unknown>).name as unknown) ??
          ((x as Record<string, unknown>).valuerName as unknown)

        const id =
          typeof rawId === 'string' || typeof rawId === 'number'
            ? rawId
            : undefined
        const name = typeof rawName === 'string' ? rawName : ''
        return { id, name }
      }
      return { id: undefined, name: '' }
    })
    .filter((a) => a.name)
}

const normalize = (v: unknown) => String(v ?? '').trim()
const normalizeLower = (v: unknown) => normalize(v).toLowerCase()

function RouteComponent() {
  const navigate = useNavigate()
  const [loading] = useState(false)

  const { accountId } = Route.useParams()
  const accountNo = accountId as string

  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [isEditEvent, setIsEditEvent] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)

  const [selectedSecurity, setSelectedSecurity] = useState('') // collateralNo
  const [selectedValuer, setSelectedValuer] = useState('') // valuer id (email)
  const [dueDate, setDueDate] = useState('')

  // ✅ keep the "row being edited" so we can prefill after dropdowns load
  const [editingRow, setEditingRow] = useState<EventRow | null>(null)

  useEffect(() => {
    const user = useAuthStore.getState().auth.user
    if (!user) navigate({ to: '/' })
  }, [navigate])

  /* ---------------- Security list needed for event "Select Security" ---------------- */
  const { data: securityListData } = $api.useQuery(
    'get',
    '/legal/security-details/account/{accountNo}',
    { params: { path: { accountNo } } }
  )

  const securityRows = useMemo(() => {
    if (!isRecord(securityListData)) return []

    const data = securityListData.data
    if (!Array.isArray(data)) return []

    return data
      .filter((x): x is SecurityApiRow => isRecord(x))
      .map((x) => {
        const rawId = x.id

        const id =
          typeof rawId === 'number'
            ? rawId
            : typeof rawId === 'string'
              ? Number(rawId)
              : undefined

        return {
          id,
          collateralNo: String(x.collateralNumber ?? ''),
          ownerName: String(x.ownerName ?? ''),
        }
      })
  }, [securityListData])

  /* ---------------- Valuer dropdown ---------------- */
  const { data: valuerDropdownData, isLoading: isValuerLoading } =
    $api.useQuery('get', '/api/valuers/dropdown', {})

  const valuers: ValuerOption[] = useMemo(
    () => toValuersList(valuerDropdownData),
    [valuerDropdownData]
  )

  /* ---------------- Events ---------------- */
  const { data: eventListData, refetch: refetchEvents } = $api.useQuery(
    'get',
    `/valuer/events/by-account/{accountNo}`,
    {
      params: { path: { accountNo }, header: { Authorization: '' } },
    }
  )

  const transformedEventData: EventRow[] = Array.isArray(eventListData?.data)
    ? eventListData.data.map((item: unknown) => {
        if (!isRecord(item)) {
          return {
            id: undefined,
            eventType: '',
            valuerName: '-',
            dueDate: '-',
            status: '-',
            createdAt: '-',
            valuerId: undefined,
            securityId: undefined,
          }
        }

        const event = isRecord(item.event) ? item.event : undefined
        const assignment = isRecord(item.assignment)
          ? item.assignment
          : undefined
        const valuerDetails = isRecord(item.valuerDetails)
          ? item.valuerDetails
          : undefined

        const valuerName =
          getString(valuerDetails?.valuerName) ||
          getString(assignment?.valuerUsername) || // often email in many systems
          '-'

        const createdAt = getString(event?.createdAt)?.split('T')[0] ?? '-'
        const id = getNumber(event?.id)

        // ✅ securityId
        const securityId =
          getNumber(assignment?.securityId) ??
          getNumber(item.securityId) ??
          getNumber(event?.securityId)

        /**
         * ✅ valuerId must match dropdown "id" value.
         * Your dropdown returns: { id: "john123@gmail.com", name: "john joshi" }
         * So valuerId must be that EMAIL string.
         */
        const valuerId =
          normalize(getString(assignment?.valuerId)) ||
          normalize(getString(assignment?.valuerUsername)) || // very likely email
          normalize(getString(valuerDetails?.id)) ||
          undefined

        return {
          id,
          eventType: String(event?.eventType ?? ''),
          valuerName: String(valuerName),
          dueDate: String(assignment?.dueDate ?? '-') || '-',
          status: String(assignment?.status ?? '-') || '-',
          createdAt: String(createdAt) || '-',
          valuerId: valuerId ? String(valuerId) : undefined,
          securityId,
        }
      })
    : []

  /* ---------------- Mutations ---------------- */
  const assignValuerEventMutation = $api.useMutation(
    'post',
    '/valuer/events/create-and-assign',
    {
      onSuccess: () => {
        toast.success('Event assigned successfully.')
        setEventDialogOpen(false)
        setIsEditEvent(false)
        setEditEventId(null)
        setSelectedValuer('')
        setSelectedSecurity('')
        setDueDate('')
        setEditingRow(null)
        refetchEvents()
      },
      onError: () => toast.error('Failed to assign event.'),
    }
  )

  const updateEventMutation = $api.useMutation(
    'put',
    '/valuer/events/{id}/update',
    {
      onSuccess: () => {
        toast.success('Event updated successfully.')
        setEventDialogOpen(false)
        setIsEditEvent(false)
        setEditEventId(null)
        setSelectedValuer('')
        setSelectedSecurity('')
        setDueDate('')
        setEditingRow(null)
        refetchEvents()
      },
      onError: () => toast.error('Failed to update event.'),
    }
  )

  /**
   * ✅ Computes correct select value for valuer:
   * - Prefer row.valuerId (email) if it exists in dropdown
   * - else fallback: match by name, then pick that option id (email)
   */
  const computeValuerSelectValue = useCallback(
    (row: EventRow) => {
      const optionIdSet = new Set(valuers.map((v) => normalize(v.id)))
      const rowValuerId = normalize(row.valuerId)

      if (rowValuerId && optionIdSet.has(rowValuerId)) return rowValuerId

      const matched = valuers.find(
        (v) => normalizeLower(v.name) === normalizeLower(row.valuerName)
      )
      const matchedId = normalize(matched?.id)
      if (matchedId && optionIdSet.has(matchedId)) return matchedId

      return ''
    },
    [valuers]
  )

  /**
   * ✅ Computes correct select value for security:
   * our <Select value> is collateralNo, but row has securityId
   */
  const computeSecuritySelectValue = useCallback(
    (row: EventRow) => {
      if (typeof row.securityId !== 'number') return ''
      const sec = securityRows.find((s) => s.id === row.securityId)
      return sec?.collateralNo ?? ''
    },
    [securityRows]
  )

  const handleEditEvent = (row: EventRow) => {
    setEditingRow(row)

    setSelectedValuer(computeValuerSelectValue(row))
    setSelectedSecurity(computeSecuritySelectValue(row))
    setDueDate(row?.dueDate && row.dueDate !== '-' ? row.dueDate : '')

    if (typeof row?.id === 'number') setEditEventId(String(row.id))
    setIsEditEvent(true)
    setEventDialogOpen(true)
  }

  /**
   * ✅ IMPORTANT: When you open edit dialog before dropdown/security lists finish loading,
   * the selected value won't appear (because options aren't there yet).
   * This effect re-applies the selections once valuers/securityRows are ready.
   */
  useEffect(() => {
    if (!eventDialogOpen || !isEditEvent || !editingRow) return

    // re-apply once options arrive
    const v = computeValuerSelectValue(editingRow)
    const s = computeSecuritySelectValue(editingRow)

    if (v && v !== selectedValuer) setSelectedValuer(v)
    if (s && s !== selectedSecurity) setSelectedSecurity(s)
  }, [
    eventDialogOpen,
    isEditEvent,
    editingRow,
    valuers,
    securityRows,
    computeValuerSelectValue,
    computeSecuritySelectValue,
    selectedValuer,
    selectedSecurity,
  ])

  const handleSubmitEvent = () => {
    const token = sessionStorage.getItem('token') || ''
    const selectedSecurityData = securityRows.find(
      (s) => s.collateralNo === selectedSecurity
    )
    const selectedValuerData = valuers.find(
      (v) => normalize(v.id) === normalize(selectedValuer)
    )

    if (
      typeof selectedSecurityData?.id !== 'number' ||
      !selectedValuerData?.id ||
      !dueDate ||
      !FIXED_EVENT_TYPE
    ) {
      toast.error('Please fill all required fields')
      return
    }

    const payload = {
      eventType: FIXED_EVENT_TYPE,
      accountNo,
      securityId: selectedSecurityData.id,
      valuerId: String(selectedValuerData.id ?? ''), // ✅ email
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
      assignValuerEventMutation.mutate({
        body: payload,
        params: { header: { Authorization: `Bearer ${token}` } },
      })
    }
  }

  /* ---------------- Download ---------------- */
  const downloadValuerDocumentsMutation = $api.useMutation(
    'get',
    '/valuer/events/{eventId}/download-documents'
  )

  const handleDownload = async (eventId: number | string) => {
    const eventIdNum = typeof eventId === 'number' ? eventId : Number(eventId)
    if (!Number.isFinite(eventIdNum)) {
      toast.error('Invalid event id')
      return
    }

    const filename = `event-${eventIdNum}.zip`

    try {
      const result = (await downloadValuerDocumentsMutation.mutateAsync({
        params: { path: { eventId: eventIdNum } },
      })) as unknown

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

      throw new Error('Unexpected download response')
    } catch (error) {
      toastError(error, 'Failed to download document.')
    }
  }

  return (
    <>
      <LoadingBar progress={loading ? 50 : 100} color='#2563eb' height={3} />

      <Main className='px-4 py-2'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Valuer Event Recording
          </h1>
        </div>

        {/* ✅ Shared Security Section */}
        <SecurityDetailsSection
          accountNo={accountNo}
          title='Security Details'
        />

        {/* Event Section */}
        <div className='mt-10 mb-4 flex items-center justify-between'>
          <h2 className='text-primary text-2xl font-bold tracking-tight dark:text-gray-100'>
            Event Table
          </h2>
          <Button
            onClick={() => {
              setIsEditEvent(false)
              setEditEventId(null)
              setSelectedValuer('')
              setSelectedSecurity('')
              setDueDate('')
              setEditingRow(null)
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
            { key: 'valuerName', label: 'Valuer' },
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
                    {String(value ?? '')}
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
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleEditEvent(r)}
                    >
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
          emptyMessage='No valuer events recorded for this account.'
        />

        <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
          <DialogContent className='overflow-hidden p-0 sm:max-w-xl'>
            {/* Header */}
            <div className='from-background via-muted/30 to-background relative border-b bg-gradient-to-br px-6 py-5'>
              {/* subtle glow */}
              <div className='bg-primary/10 pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl' />

              <DialogHeader className='relative space-y-1'>
                <DialogTitle className='text-xl font-semibold tracking-tight'>
                  {isEditEvent ? 'Edit Valuer Event' : 'Add Valuer Event'}
                </DialogTitle>
                <p className='text-muted-foreground text-sm'>
                  Assign a valuer and link the event to a security with a due
                  date.
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
                {/* Event Type (read only) */}
                <div className='bg-muted/20 rounded-xl border p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <label className='text-foreground text-sm font-medium'>
                      Event Type
                    </label>
                    <span className='bg-background text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]'>
                      Fixed
                    </span>
                  </div>
                  <div className='mt-2'>
                    <Input
                      value={FIXED_EVENT_TYPE}
                      readOnly
                      className='bg-background/60 font-medium'
                    />
                  </div>
                </div>

                {/* Two-column row */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {/* Due Date */}
                  <div className='bg-card rounded-xl border p-4 shadow-sm'>
                    <label className='text-foreground text-sm font-medium'>
                      Due Date
                    </label>
                    <Input
                      type='date'
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className='mt-2'
                    />
                    <p className='text-muted-foreground mt-2 text-xs'>
                      Pick the expected completion date.
                    </p>
                  </div>

                  {/* Valuer */}
                  <div className='bg-card rounded-xl border p-4 shadow-sm'>
                    <label className='text-foreground text-sm font-medium'>
                      Select Valuer <span className='text-destructive'>*</span>
                    </label>

                    <Select
                      value={selectedValuer}
                      onValueChange={setSelectedValuer}
                      disabled={isValuerLoading}
                    >
                      <SelectTrigger className='mt-2 w-full'>
                        <SelectValue
                          placeholder={
                            isValuerLoading
                              ? 'Loading valuers…'
                              : 'Select Valuer'
                          }
                        />
                      </SelectTrigger>

                      <SelectContent className='max-h-64'>
                        {valuers.map((v) => (
                          <SelectItem
                            key={String(v.id ?? '')}
                            value={normalize(v.id)}
                          >
                            <div className='flex w-full items-center justify-between gap-3'>
                              <span className='font-medium'>{v.name}</span>
                              {v.id ? (
                                <span className='text-muted-foreground truncate text-xs'>
                                  {String(v.id)}
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
                <div className='bg-card rounded-xl border p-4 shadow-sm'>
                  <div className='flex items-center justify-between gap-3'>
                    <label className='text-foreground text-sm font-medium'>
                      Select Security{' '}
                      <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-muted-foreground text-xs'>
                      {securityRows.length
                        ? `${securityRows.length} available`
                        : 'No securities'}
                    </span>
                  </div>

                  <Select
                    value={selectedSecurity}
                    onValueChange={setSelectedSecurity}
                  >
                    <SelectTrigger className='mt-2 w-full'>
                      <SelectValue placeholder='Select Security' />
                    </SelectTrigger>

                    <SelectContent className='max-h-72'>
                      {securityRows
                        .filter((sec) => sec.collateralNo)
                        .map((sec) => (
                          <SelectItem
                            key={String(sec.id ?? '')}
                            value={sec.collateralNo}
                          >
                            <div className='flex w-full items-center justify-between gap-3'>
                              <span className='font-medium'>
                                {sec.collateralNo}
                              </span>
                              <span className='text-muted-foreground truncate text-xs'>
                                {sec.ownerName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className='bg-muted/20 text-muted-foreground mt-3 rounded-lg border px-3 py-2 text-xs'>
                    Tip: Choose the collateral number to link this event with
                    the correct security.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className='bg-muted/10 -mx-6 mt-6 -mb-5 flex flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setEventDialogOpen(false)}
                  className='sm:min-w-[110px]'
                >
                  Cancel
                </Button>
                <Button type='submit' className='shadow-sm sm:min-w-[160px]'>
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
