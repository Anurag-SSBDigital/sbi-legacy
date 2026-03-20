import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { redirect, createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'
import {
  AlertDescriptionCell,
  SeverityLevelCell,
  YesNoCell,
} from '@/components/table/cells.ts'

/* =============================
   Export helpers (strictly typed)
============================= */
function fileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toTitleCase(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

function buildRowsAndHeaders<T extends Record<string, unknown>>(
  rows: readonly T[]
): { headers: string[]; headerLabels: string[]; matrix: string[][] } {
  const keySet = new Set<string>()
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => keySet.add(k))
  })
  const headers = Array.from(keySet)

  const idIdx = headers.indexOf('alertId')
  if (idIdx > 0) {
    headers.splice(idIdx, 1)
    headers.unshift('alertId')
  }

  const headerLabels = headers.map(toTitleCase)

  const matrix: string[][] = rows.map((row) =>
    headers.map((h) => {
      const val = row[h as keyof T]
      if (val == null) return ''
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }
      return String(val)
    })
  )

  return { headers, headerLabels, matrix }
}

function exportCSV<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'alerts.csv'
) {
  const { headerLabels, matrix } = buildRowsAndHeaders(rows)
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

  const lines = [
    headerLabels.map(escape).join(','),
    ...matrix.map((r) => r.map(escape).join(',')),
  ]
  const csv = '\uFEFF' + lines.join('\n')
  fileDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

async function exportExcel<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'alerts.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)
    const mutableRows: T[] = Array.from(rows)
    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alerts')
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    fileDownload(
      new Blob([wbout], { type: 'application/octet-stream' }),
      filename
    )
  } catch {
    exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
  }
}
/* ============================= */

// Define the Zod schema for form validation
const alertSchema = z.object({
  alertId: z.number(),
  alertName: z.string().min(1, 'Alert name is required.'),
  alertDescription: z.string().min(1, 'Description is required.'),
  isActive: z.boolean(),
  thresholdValue: z.number().nullable(),
  thresholdPercentage: z.number().nullable(),
  lookbackPeriodDays: z.optional(
    z.coerce.number().int().positive('Must be a positive number.')
  ),
  evaluationFrequencyDays: z.optional(
    z.coerce.number().int().positive('Must be a positive number.')
  ),
  severityLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  ruleLogic: z.string().min(1, 'Rule logic is required.'),
  droolsRuleName: z.string(),
  scheduleType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
})

type AlertFormData = z.infer<typeof alertSchema>
type Alert = components['schemas']['EWSAlertMaster']

// Route Definition
export const Route = createFileRoute(
  '/_authenticated/admin/alerts/$alertType/'
)({
  component: RouteComponent,
  beforeLoad: (ctx) => {
    if (ctx.params.alertType !== 'ews' && ctx.params.alertType !== 'frm') {
      throw redirect({
        to: '/admin/alerts/$alertType',
        params: { alertType: 'ews' },
      })
    }
  },
})

// Main Page Component
function RouteComponent() {
  const { alertType } = Route.useParams()
  const getAllPath = `/${alertType}-alert-master/getAll`
  const updatePath = `/${alertType}-alert-master/update/{alertId}`

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  // State for filters
  const [alertNameFilter, setAlertNameFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')

  const { data, isLoading, error, refetch } = $api.useQuery(
    'get',
    getAllPath as '/ews-alert-master/getAll'
  )
  const updateMutation = $api.useMutation(
    'put',
    updatePath as `/ews-alert-master/update/{alertId}`,
    {
      onSuccess: (res) => {
        refetch()
        setIsDialogOpen(false)
        toast.success(
          `Alert ${res?.data?.alertId} - ${res?.data?.alertName} updated.`
        )
      },
      onError: (error: unknown) => {
        toastError(error)
      },
    }
  )

  const handleEditClick = (alert: Alert) => {
    setSelectedAlert(alert)
    setIsDialogOpen(true)
  }

  // Compute filtered data (typed)
  const filteredData = useMemo<Alert[]>(() => {
    let result: Alert[] = (data?.data as Alert[] | undefined) ?? []

    if (alertNameFilter) {
      result = result.filter((alert) =>
        alert?.alertName?.toLowerCase()?.includes(alertNameFilter.toLowerCase())
      )
    }

    if (severityFilter && severityFilter !== 'ALL') {
      result = result.filter((alert) => alert.severityLevel === severityFilter)
    }

    if (isActiveFilter && isActiveFilter !== 'ALL') {
      const isActive = isActiveFilter === 'true'
      result = result.filter((alert) => alert.isActive === isActive)
    }

    return result
  }, [data, alertNameFilter, severityFilter, isActiveFilter])

  // Export handlers (export exactly what's currently visible)
  const handleExportCSV = () => {
    if (!filteredData.length) {
      toast.info('No data to export.')
      return
    }
    exportCSV<Alert>(filteredData, `${alertType}-alerts.csv`)
  }

  const handleExportExcel = async () => {
    if (!filteredData.length) {
      toast.info('No data to export.')
      return
    }
    await exportExcel<Alert>(filteredData, `${alertType}-alerts.xlsx`)
  }

  const columns = useMemo<PaginatedTableColumn<Alert>[]>(
    () => [
      { key: 'alertId', label: 'Alert Id', sortable: true },
      { key: 'alertName', label: 'Alert Name', sortable: true },
      {
        key: 'alertDescription',
        label: 'Description',
        render: (value) => <AlertDescriptionCell value={String(value)} />,
      },
      {
        key: 'severityLevel',
        label: 'Severity',
        sortable: true,
        render: (value) => (
          <SeverityLevelCell value={value as 'HIGH' | 'MEDIUM' | 'LOW'} />
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        render: (value) => <YesNoCell value={value} />,
      },
    ],
    []
  )

  if (isLoading) return <MainWrapper>Loading alerts...</MainWrapper>
  if (error) return <MainWrapper>Error fetching alerts.</MainWrapper>

  return (
    <>
      <PaginatedTable
        data={filteredData}
        columns={columns}
        tableTitle={`${alertType.toUpperCase()} Alert Management`}
        tableActions={() => (
          <div className='flex w-full items-center space-x-4'>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Severity' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All</SelectItem>
                <SelectItem value='HIGH'>High</SelectItem>
                <SelectItem value='MEDIUM'>Medium</SelectItem>
                <SelectItem value='LOW'>Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All</SelectItem>
                <SelectItem value='true'>Active</SelectItem>
                <SelectItem value='false'>Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              onClick={() => {
                setAlertNameFilter('')
                setSeverityFilter('')
                setIsActiveFilter('')
              }}
            >
              Clear Filters
            </Button>

            {/* NEW: Export buttons aligned to the right */}
            <div className='ml-auto flex items-center gap-2'>
              <Button variant='outline' onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button variant='outline' onClick={handleExportExcel}>
                Export Excel
              </Button>
            </div>
          </div>
        )}
        renderActions={(alert) => (
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleEditClick(alert)}
          >
            Edit
          </Button>
        )}
      />
      {selectedAlert && (
        <EditAlertDialog
          key={selectedAlert.alertId}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          alert={selectedAlert}
          updateMutation={updateMutation}
        />
      )}
    </>
  )
}

interface EditAlertDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  alert: Alert
  updateMutation: ReturnType<typeof $api.useMutation>
}

function EditAlertDialog({
  isOpen,
  onOpenChange,
  alert,
  updateMutation,
}: EditAlertDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const isView = mode === 'view'

  const form = useForm<AlertFormData>({
    resolver: standardSchemaResolver(alertSchema),
    defaultValues: {
      alertId: alert.alertId ?? 0,
      alertName: alert.alertName ?? '',
      alertDescription: alert.alertDescription ?? '',
      isActive: alert.isActive ?? false,
      thresholdValue: alert.thresholdValue ?? null,
      thresholdPercentage: alert.thresholdPercentage ?? null,
      lookbackPeriodDays: alert.lookbackPeriodDays ?? undefined,
      evaluationFrequencyDays: alert.evaluationFrequencyDays ?? undefined,
      severityLevel:
        (alert.severityLevel as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
      ruleLogic: alert.ruleLogic ?? '',
      droolsRuleName: alert.droolsRuleName ?? '',
      scheduleType:
        (alert.scheduleType as 'MONTHLY' | 'QUARTERLY' | 'YEARLY') ?? 'MONTHLY',
    },
  })

  // Reset when alert changes / dialog opens
  useEffect(() => {
    form.reset({
      alertId: alert.alertId ?? 0,
      alertName: alert.alertName ?? '',
      alertDescription: alert.alertDescription ?? '',
      isActive: alert.isActive ?? false,
      thresholdValue: alert.thresholdValue ?? null,
      thresholdPercentage: alert.thresholdPercentage ?? null,
      lookbackPeriodDays: alert.lookbackPeriodDays ?? undefined,
      evaluationFrequencyDays: alert.evaluationFrequencyDays ?? undefined,
      severityLevel:
        (alert.severityLevel as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
      ruleLogic: alert.ruleLogic ?? '',
      droolsRuleName: alert.droolsRuleName ?? '',
      scheduleType:
        (alert.scheduleType as 'MONTHLY' | 'QUARTERLY' | 'YEARLY') ?? 'MONTHLY',
    })
    setMode('view')
  }, [alert, form])

  useEffect(() => {
    if (!isOpen) {
      setMode('view')
      form.reset()
    }
  }, [isOpen, form])

  const onSubmit = async (formData: AlertFormData) => {
    const body = {
      ...alert,
      ...formData,
      // Rule logic is view-only: keep server value (and prevent accidental edits)
      ruleLogic: alert.ruleLogic,
    }

    await updateMutation.mutateAsync({
      body,
      params: { path: { alertId: body.alertId } },
    })
  }

  const cancelEdit = () => {
    form.reset({
      alertId: alert.alertId ?? 0,
      alertName: alert.alertName ?? '',
      alertDescription: alert.alertDescription ?? '',
      isActive: alert.isActive ?? false,
      thresholdValue: alert.thresholdValue ?? null,
      thresholdPercentage: alert.thresholdPercentage ?? null,
      lookbackPeriodDays: alert.lookbackPeriodDays ?? undefined,
      evaluationFrequencyDays: alert.evaluationFrequencyDays ?? undefined,
      severityLevel:
        (alert.severityLevel as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
      ruleLogic: alert.ruleLogic ?? '',
      droolsRuleName: alert.droolsRuleName ?? '',
      scheduleType:
        (alert.scheduleType as 'MONTHLY' | 'QUARTERLY' | 'YEARLY') ?? 'MONTHLY',
    })
    setMode('view')
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) cancelEdit()
      }}
    >
      <DialogContent className='min-w-5xl p-0'>
        {/* Sticky header */}
        <div className='bg-background/95 sticky top-0 z-10 rounded-2xl border-b px-6 py-4 backdrop-blur'>
          <DialogHeader>
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0'>
                <DialogTitle className='truncate'>
                  {isView ? 'View Alert' : 'Edit Alert'}: {alert.alertName}
                </DialogTitle>
                <DialogDescription className='mt-1'>
                  Alert ID <span className='font-medium'>{alert.alertId}</span>{' '}
                  • Severity{' '}
                  <span className='font-medium'>{alert.severityLevel}</span> •
                  Status{' '}
                  <span className='font-medium'>
                    {alert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </DialogDescription>
              </div>

              <div className='flex shrink-0 items-center gap-2'>
                {isView ? (
                  <Button
                    type='button'
                    onClick={() => setMode('edit')}
                    disabled={updateMutation.isPending}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5'>
              {/* Section: Basic */}
              <section className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    Basic details
                  </h3>
                  {isView && (
                    <span className='text-muted-foreground text-xs'>
                      Read-only mode
                    </span>
                  )}
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='alertName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isView} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='severityLevel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isView}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select severity' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='HIGH'>High</SelectItem>
                            <SelectItem value='MEDIUM'>Medium</SelectItem>
                            <SelectItem value='LOW'>Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='alertDescription'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} disabled={isView} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Section: Threshold */}
              <section className='bg-muted/20 space-y-4 rounded-lg border p-4'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  Thresholds
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='thresholdValue'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Value</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            disabled={isView}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : +e.target.value
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='thresholdPercentage'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            disabled={isView}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? null : +e.target.value
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Section: Scheduling */}
              <section className='space-y-4'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  Evaluation & schedule
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='scheduleType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isView}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select schedule' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='MONTHLY'>Monthly</SelectItem>
                            <SelectItem value='QUARTERLY'>Quarterly</SelectItem>
                            <SelectItem value='YEARLY'>Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='lookbackPeriodDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lookback (Days)</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} disabled={isView} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='evaluationFrequencyDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency (Days)</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} disabled={isView} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Section: Rule (VIEW ONLY) */}
              <section className='bg-muted/30 space-y-3 rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    Rule logic
                  </h3>
                </div>

                {/* Keep as form field for consistency, but disabled ALWAYS */}
                <FormField
                  control={form.control}
                  name='ruleLogic'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='sr-only'>Rule Logic</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          disabled
                          className='font-mono text-xs leading-relaxed'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Section: System fields */}
              <section className='space-y-4'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  System
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='isActive'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Active</FormLabel>
                        <div className='flex items-center space-x-2 pt-2'>
                          <FormControl>
                            <Switch
                              id='isActive'
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isView}
                            />
                          </FormControl>
                          <Label htmlFor='isActive'>
                            {field.value ? 'Enabled' : 'Disabled'}
                          </Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </div>

            {/* Sticky footer */}
            <DialogFooter className='gap-2 sm:gap-0'>
              <div className='bg-background/95 sticky bottom-0 z-10 rounded-2xl border-t px-6 py-4 backdrop-blur'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  {isView ? 'Close' : 'Close'}
                </Button>

                {!isView && (
                  <Button type='submit' disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
