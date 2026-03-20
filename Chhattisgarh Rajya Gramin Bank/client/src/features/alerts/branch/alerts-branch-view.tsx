import { useMemo, useState, useCallback } from 'react'
import { components } from '@/types/api/v1.js'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import {
  AccountNoCell,
  DateTimeCell,
  SeverityLevelCell,
} from '@/components/table/cells.ts'
import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'
import { ResolutionDialog } from '../resolution/ResolutionDialog.tsx'
import { AlertDetailsDialog } from './alert-detail-dialog.tsx'

/* ───────────────────────────────────────────────────────────────────────── */

type Row = components['schemas']['AlertSummaryDTO'] & {
  masterDescriptionId?: number | null
  ruleRunId?: number | null
  ruleVersionNo?: number | null
  periodStart?: string | null
  periodEnd?: string | null
  severityKey?: string | null
  sourceAlertDate?: string | null
  evidenceCount?: number | null
}

const fmtDateOnly = (d?: string | number | null) =>
  d ? new Date(d).toLocaleDateString('en-IN') : '—'

const toBlob = (payload: unknown): Blob | null => {
  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data?: unknown }).data
      : payload

  if (data instanceof Blob) {
    return data
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'application/pdf' })
  }
  if (data instanceof Uint8Array) {
    const bytes = new Uint8Array(data)
    return new Blob([bytes], { type: 'application/pdf' })
  }
  return null
}

export default function BranchAlertsView({
  alertType = 'EWS',
}: {
  alertType: 'EWS' | 'FRM'
}) {
  const [branch, setBranch] = useState<string | undefined>(undefined)
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)

  const user = useAuthStore((s) => s.auth.user)

  const [reportOpen, setReportOpen] = useState(false)
  const [selectedStages, setSelectedStages] = useState<string[]>([]) // statuses here
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [selectedDesc, setSelectedDesc] = useState<string>('')

  const { mutateAsync: downloadReport, isPending: isDownloading } =
    $api.useMutation(
      'get',
      '/alert/resolutions/{alertType}/branch/getAlerts/report'
    )

  const validateDateRange = useCallback(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      if (from > to) {
        toast.error('"From Date" cannot be after "To Date".')
        return false
      }
    }
    return true
  }, [fromDate, toDate])

  const handleDownloadReport = useCallback(async () => {
    if (!validateDateRange()) {
      return
    }
    const includeAll = selectedStages.includes('ALL')
    const selectedStatuses = includeAll
      ? undefined
      : selectedStages.length > 0
        ? selectedStages
        : undefined

    try {
      const report = await downloadReport({
        params: {
          path: { alertType },
          query: {
            status: selectedStatuses,
            masterDescription:
              selectedDesc && selectedDesc !== 'All' ? selectedDesc : undefined,
            branchId: branch,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          },
          header: { Authorization: '' },
        },
        parseAs: 'blob',
      })

      const blob = toBlob(report)
      if (!blob) {
        throw new Error('Failed to generate report.')
      }

      const fileName = `alerts_report_${alertType}_${branch ?? 'branch'}_${selectedStages.join('_') || 'all'}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to generate report.'
      )
    }
  }, [
    downloadReport,
    validateDateRange,
    selectedStages,
    selectedDesc,
    branch,
    fromDate,
    toDate,
    alertType,
  ])

  const stageLabel = (s: string) => {
    switch (s) {
      case 'PENDING':
        return 'Pending'
      case 'PENDING_APPROVAL':
        return 'Pending Approval'
      case 'APPROVED':
        return 'Approved'
      case 'REJECTED':
        return 'Rejected'
      case 'ALL':
        return 'All Statuses'
      default:
        return s
    }
  }

  const handleStageChange = (stage: string) => {
    setSelectedStages((prev) => {
      if (stage === 'ALL') {
        return prev.includes('ALL') ? [] : ['ALL']
      } else {
        let next = prev.includes(stage)
          ? prev.filter((s) => s !== stage)
          : [...prev, stage]
        next = next.filter((s) => s !== 'ALL')
        return next
      }
    })
  }

  const canResolve = useCanAccess(
    alertType === 'EWS' ? 'ews_alert' : 'ews_alert',
    'resolve'
  )

  const { data, isLoading, refetch } = $api.useQuery(
    'get',
    '/alert/resolutions/{alertType}/branch/getAlerts',
    {
      params: {
        path: { alertType },
        query: {
          status: [],
        },
        header: { Authorization: '' },
      },
    }
  )

  const masterDescOptions = useMemo(() => {
    const src = (data?.data ?? []) as Row[]
    const vals = src
      .map((r) => (r.masterDescription ?? r.alertReason ?? '').trim())
      .filter(Boolean)
    const uniq = Array.from(new Set(vals))
    uniq.sort((a, b) => a.localeCompare(b))
    return uniq
  }, [data?.data])

  const filterByDescription = useCallback(
    (rows: Row[] | undefined) => {
      const list = rows ?? []
      if (!selectedDesc || selectedDesc === 'All') return list
      return list.filter(
        (r) =>
          (r.masterDescription ?? r.alertReason ?? '').trim() === selectedDesc
      )
    },
    [selectedDesc]
  )

  const tabs = useMemo(() => {
    const temp: Record<
      'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED',
      Row[]
    > = {
      PENDING: [],
      PENDING_APPROVAL: [],
      APPROVED: [],
      REJECTED: [],
    }

    for (const alert of data?.data ?? []) {
      if (alert.status) temp[alert.status].push(alert)
    }

    return [
      {
        key: 'PENDING',
        label: 'Pending',
        data: temp.PENDING ?? [],
      },
      {
        key: 'PENDING_APPROVAL',
        label: 'Pending Approval',
        data: temp.PENDING_APPROVAL ?? [],
      },
      {
        key: 'APPROVED',
        label: 'Approved',
        data: temp.APPROVED ?? [],
      },
      {
        key: 'REJECTED',
        label: 'Rejected',
        data: temp.REJECTED ?? [],
      },
    ] as const
  }, [data])

  const { data: alertDetails, isLoading: alertDetailsLoading } = $api.useQuery(
    'get',
    '/alert/resolutions/getDetails/{alertType}/{alertId}',
    {
      params: {
        path: { alertType, alertId: selectedAlertId as number },
        header: { Authorization: '' },
      },
    },
    {
      enabled: !!selectedAlertId,
    }
  )

  const columns = useMemo<
    PaginatedTableProps<(typeof tabs)[number]['data'][number]>['columns']
  >(() => {
    const baseColumns: PaginatedTableProps<
      (typeof tabs)[number]['data'][number]
    >['columns'] = [
      {
        key: 'accountNo',
        label: 'Account Number',
        render: (value) => <AccountNoCell value={String(value)} />,
      },
      {
        key: 'alertDate',
        label: 'Date',
        render: (value) => <DateTimeCell value={String(value)} />,
      },
      { key: 'alertReason', label: 'Reason' },
      { key: 'customerName', label: 'Customer Name' },
      {
        key: 'severityLevel',
        label: 'Severity Level',
        render: (value: unknown) => (
          <SeverityLevelCell value={value as 'HIGH' | 'MEDIUM' | 'LOW'} />
        ),
      },
    ]

    if (alertType !== 'EWS') {
      return baseColumns
    }

    return [
      ...baseColumns,
      {
        key: 'ruleVersionNo',
        label: 'Rule Ver.',
      },
      {
        key: 'ruleRunId',
        label: 'Run Id',
      },
      {
        key: 'periodStart',
        label: 'Run Period',
        render: (_value, row) =>
          row.periodStart && row.periodEnd
            ? `${fmtDateOnly(row.periodStart)} to ${fmtDateOnly(row.periodEnd)}`
            : '—',
      },
      {
        key: 'severityKey',
        label: 'Raw Severity',
      },
    ]
  }, [alertType, tabs])

  const masterDescFilter = (
    <div className='ml-auto flex items-center gap-2'>
      <Label htmlFor='desc' className='text-muted-foreground text-xs'>
        Master Description
      </Label>
      <Select value={selectedDesc} onValueChange={(v) => setSelectedDesc(v)}>
        <SelectTrigger id='desc' className='w-80'>
          <SelectValue placeholder='All descriptions' />
        </SelectTrigger>
        <SelectContent align='end' className='max-h-80'>
          <SelectItem value='All'>All descriptions</SelectItem>
          {masterDescOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <MainWrapper
      extra={
        user?.branchId ? null : (
          <BranchSelector value={branch} setValue={setBranch} />
        )
      }
    >
      <div className='flex items-end justify-between'>
        <h1 className='text-2xl font-bold'>{alertType} Alerts</h1>
        <Dialog
          open={reportOpen}
          onOpenChange={(open) => {
            setReportOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button>Generate Report</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle>Generate Alerts Report</DialogTitle>
            </DialogHeader>

            <div className='space-y-5'>
              <p className='text-muted-foreground text-sm'>
                Choose statuses (leave blank for all) and an optional date
                range, then download the report.
              </p>

              {/* Statuses (multi-select) */}
              <div>
                <Label className='mb-2 block'>Statuses</Label>
                <div className='grid grid-cols-2 gap-y-2'>
                  <label className='flex items-center space-x-2'>
                    <Checkbox
                      id='PENDING'
                      checked={selectedStages.includes('PENDING')}
                      onCheckedChange={() => handleStageChange('PENDING')}
                    />
                    <span>Pending</span>
                  </label>

                  <label className='flex items-center space-x-2'>
                    <Checkbox
                      id='PENDING_APPROVAL'
                      checked={selectedStages.includes('PENDING_APPROVAL')}
                      onCheckedChange={() =>
                        handleStageChange('PENDING_APPROVAL')
                      }
                    />
                    <span>Pending Approval</span>
                  </label>

                  <label className='flex items-center space-x-2'>
                    <Checkbox
                      id='APPROVED'
                      checked={selectedStages.includes('APPROVED')}
                      onCheckedChange={() => handleStageChange('APPROVED')}
                    />
                    <span>Approved</span>
                  </label>

                  <label className='flex items-center space-x-2'>
                    <Checkbox
                      id='REJECTED'
                      checked={selectedStages.includes('REJECTED')}
                      onCheckedChange={() => handleStageChange('REJECTED')}
                    />
                    <span>Rejected</span>
                  </label>

                  <label className='col-span-2 flex items-center space-x-2'>
                    <Checkbox
                      id='ALL'
                      checked={selectedStages.includes('ALL')}
                      onCheckedChange={() => handleStageChange('ALL')}
                    />
                    <span>All Statuses</span>
                  </label>
                </div>

                {selectedStages.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {selectedStages.map((s) => (
                      <span
                        key={s}
                        className='rounded-full border px-2 py-0.5 text-xs'
                        title={stageLabel(s)}
                      >
                        {stageLabel(s)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Date range */}
              <div>
                <Label className='mb-2 block'>Date Range (optional)</Label>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label
                      htmlFor='fromDate'
                      className='text-muted-foreground text-xs'
                    >
                      From
                    </Label>
                    <Input
                      id='fromDate'
                      type='date'
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor='toDate'
                      className='text-muted-foreground text-xs'
                    >
                      To
                    </Label>
                    <Input
                      id='toDate'
                      type='date'
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Leave blank to include all dates.
                </p>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-3'>
                <Button onClick={handleDownloadReport} disabled={isDownloading}>
                  {isDownloading ? 'Generating…' : 'Download PDF'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* ──────────────────────────────────────────────────────────────────── */}

      <Separator className='my-2 lg:my-4' />

      {isLoading ? (
        <LoadingBar />
      ) : (
        <Tabs defaultValue={tabs[0].key} className='w-full'>
          <TabsList className='mb-4'>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label} ({filterByDescription(tab.data).length}){' '}
                {/* NEW: filtered count */}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <PaginatedTable
                data={filterByDescription(tab.data)} // NEW: filtered rows
                columns={columns}
                tableActions={masterDescFilter}
                tableTitle={`${tab.label} Resolutions`}
                showSearch
                emptyMessage={`No ${tab.label.toLowerCase()} audits found.`}
                initialRowsPerPage={5}
                renderActions={(row) => (
                  <div className='flex flex-row gap-1'>
                    {canResolve &&
                      (row.status === 'PENDING' ||
                        row.status === 'REJECTED') && (
                        <ResolutionDialog row={row} onSuccess={refetch} />
                      )}
                    <Button
                      variant='outline'
                      onClick={() => setSelectedAlertId(row.alertId ?? null)}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {selectedAlertId && (
        <AlertDetailsDialog
          account={alertDetails?.data}
          loading={alertDetailsLoading}
          onClose={() => setSelectedAlertId(null)}
          alertType={alertType}
        />
      )}
    </MainWrapper>
  )
}
