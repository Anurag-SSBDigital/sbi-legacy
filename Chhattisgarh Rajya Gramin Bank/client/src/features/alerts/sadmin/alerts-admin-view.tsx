import { useCallback, useEffect, useMemo, useState } from 'react'
import { components } from '@/types/api/v1.js'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
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
// import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'
import ServerPaginatedTable, {
  PaginatedTableColumns,
} from '@/components/server-paginated-table.tsx'
import {
  AccountNoCell,
  SeverityLevelCell,
  StatusPillCell,
  TooltipCell,
} from '@/components/table/cells.ts'
import { StatusPillProps } from '@/components/table/cells/status-pill-cell.tsx'
import { AlertRowActionsMenu } from '@/features/alerts/table/actions.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'
import ViewButton from '../../../components/ui/view-button.js'
import { AlertDetailsDialog } from '../branch/alert-detail-dialog.tsx'
import { AcceptDialog } from '../components/accept-dialog.tsx'
import { RejectDialog } from '../components/reject-dialog.tsx'
import { HistoryDialog } from '../components/reject-history-dialog.tsx'

// ─────────────────────────────────────────────────────────────────────────

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

const stageLabel = (s: string) => {
  switch (s) {
    case 'pendingApproval':
      return 'Pending Approval'
    case 'approvedByMe':
      return 'Approved by Me'
    case 'rejectedByMe':
      return 'Rejected by Me'
    case 'allAlerts':
      return 'All Alerts'
    default:
      return s
  }
}

type Tabs = 'pendingApproval' | 'approvedByMe' | 'rejectedByMe' | 'allAlerts'

export default function AlertsAdminView({
  alertType,
  canViewAllAlerts = true,
}: {
  alertType: 'EWS' | 'FRM'
  canViewAllAlerts?: boolean
}) {
  const [branch, setBranch] = useState<string | undefined>(undefined)
  const [selectedTab, setSelectedTab] = useState<Tabs>('pendingApproval')
  const [viewingRow, setViewingRow] = useState<Row | null>(null)
  const [rejectingRow, setRejectingRow] = useState<Row | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [acceptingRow, setAcceptingRow] = useState<Row | null>(null)
  const [acceptComment, setAcceptComment] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [selectedMasterId, setSelectedMasterId] = useState<number | undefined>(
    undefined
  )
  const [selectedSeverity, setSelectedSeverity] = useState<
    'HIGH' | 'MEDIUM' | 'LOW' | undefined
  >(undefined)
  const [selectedAlertDate, setSelectedAlertDate] = useState<
    string | undefined
  >(undefined)

  const { mutateAsync: downloadReport, isPending: isDownloading } =
    $api.useMutation('get', '/alert/resolutions/getAll/report')

  // Fetch master dropdown
  const { data: masterDropdown } = $api.useQuery(
    'get',
    // '/alert/resolutions/dropdown/alertMaster',
    '/alert/resolutions/dropdown/alertMasterList',
    {
      params: { query: { type: alertType } },
    }
  )
  const masterOptions = useMemo(
    () => masterDropdown?.data ?? [],
    [masterDropdown]
  )

  // Only enforce if the user is NOT allowed to view all alerts
  useEffect(() => {
    if (!canViewAllAlerts) {
      setSelectedStages((prev) => prev.filter((s) => s !== 'allAlerts'))
      if (selectedTab === 'allAlerts') setSelectedTab('pendingApproval')
    }
  }, [selectedTab, canViewAllAlerts])

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
    const stagesForRequest =
      selectedStages.length > 0
        ? selectedStages
        : canViewAllAlerts
          ? ['allAlerts']
          : ['pendingApproval', 'approvedByMe', 'rejectedByMe']

    try {
      const report = await downloadReport({
        params: {
          query: {
            type: alertType,
            branchId: branch,
            masterDescriptionId: selectedMasterId,
            severityLevel: selectedSeverity,
            alertDate: selectedAlertDate,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            stages: stagesForRequest,
            size: 100000,
          },
          header: { Authorization: '' },
        },
        parseAs: 'blob',
      })

      const blob = toBlob(report)
      if (!blob) {
        throw new Error('Failed to generate report.')
      }

      const fileName = `alerts_report_${alertType}_${selectedStages.join('_') || 'all'}.pdf`
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
    canViewAllAlerts,
    alertType,
    branch,
    selectedMasterId,
    selectedSeverity,
    selectedAlertDate,
    fromDate,
    toDate,
  ])

  const { data, isLoading, refetch } = $api.useQuery(
    'get',
    '/alert/resolutions/get/stageWise/{alertType}',
    {
      params: { header: { Authorization: '' }, path: { alertType } },
    }
  )

  // State for allAlerts query params
  const [allAlertsQuery, setAllAlertsQuery] = useState({
    page: 0,
    size: 10,
    branchId: branch,
    masterDescriptionId: selectedMasterId,
    severityLevel: selectedSeverity,
    alertDate: selectedAlertDate,
  })

  useEffect(() => {
    setAllAlertsQuery((prev) => ({
      ...prev,
      page: 0,
      branchId: branch ?? undefined,
      masterDescriptionId: selectedMasterId,
      severityLevel: selectedSeverity,
      alertDate: selectedAlertDate,
    }))
  }, [branch, selectedMasterId, selectedSeverity, selectedAlertDate])

  // Paginated all alerts
  const {
    data: allAlerts,
    isLoading: allAlertsLoading,
    error: allAlertsError,
    refetch: refetchAllAlerts,
  } = $api.useQuery(
    'get',
    '/alert/resolutions/getAll',
    {
      params: {
        query: {
          type: alertType,
          ...allAlertsQuery,
        },
        header: { Authorization: '' },
      },
    },
    { retry: false, enabled: canViewAllAlerts }
  )

  const acceptMutation = $api.useMutation(
    'post',
    '/alert/resolutions/{resolutionId}/approve',
    {
      onSuccess: (res) => {
        toast.success(res.message)
        refetch()
        refetchAllAlerts()
        setAcceptingRow(null)
        setAcceptComment('')
      },
      onError: (err) => {
        toastError(err)
      },
    }
  )

  const rejectMutation = $api.useMutation(
    'post',
    '/alert/resolutions/{resolutionId}/reject',
    {
      onSuccess: (res) => {
        toast.success(res.message)
        refetch()
        refetchAllAlerts()
        setRejectingRow(null)
        setRejectComment('')
      },
      onError: (err) => {
        toastError(err)
      },
    }
  )

  const [historyRow, setHistoryRow] = useState<Row | null>(null)

  const {
    data: historyResponse,
    isLoading: historyLoading,
    error: historyError,
  } = $api.useQuery(
    'get',
    '/alert/resolutions/{resolutionId}/history',
    {
      params: {
        path: {
          resolutionId: historyRow?.resolutionId ?? 0,
        },
      },
    },
    {
      enabled: !!historyRow,
      retry: false,
    }
  )

  const handleSubmitAccept = () => {
    if (acceptingRow && acceptingRow.resolutionId) {
      acceptMutation.mutate({
        params: {
          path: { resolutionId: acceptingRow.resolutionId },
          header: { Authorization: '' },
          query: { comments: acceptComment },
        },
      })
    } else {
      toast.error('Comment is required for acceptance.')
    }
  }

  const handleSubmitReject = () => {
    if (rejectingRow && rejectingRow.resolutionId && rejectComment) {
      rejectMutation.mutate({
        params: {
          query: { comments: rejectComment },
          header: { Authorization: '' },
          path: { resolutionId: rejectingRow.resolutionId },
        },
      })
    } else {
      toast.error('Comment is required for rejection.')
    }
  }

  const handleStageChange = (stage: string) => {
    setSelectedStages((prev) => {
      if (stage === 'allAlerts') {
        return prev.includes('allAlerts') ? [] : ['allAlerts']
      } else {
        let newStages = prev.includes(stage)
          ? prev.filter((s) => s !== stage)
          : [...prev, stage]
        newStages = newStages.filter((s) => s !== 'allAlerts')
        return newStages
      }
    })
  }

  const filterAlerts = useCallback(
    (rows: Row[] | undefined) => {
      let list = rows ?? []
      if (selectedMasterId !== undefined) {
        list = list.filter((r) => r.masterDescriptionId === selectedMasterId)
      }
      if (selectedSeverity) {
        list = list.filter((r) => r.severityLevel === selectedSeverity)
      }
      if (selectedAlertDate) {
        list = list.filter(
          (r) => r.alertDate?.split('T')[0] === selectedAlertDate
        )
      }
      return list
    },
    [selectedMasterId, selectedSeverity, selectedAlertDate]
  )

  // Extract common columns for reuse
  const commonColumns = useMemo<PaginatedTableColumn<Row>[]>(() => {
    const baseColumns: PaginatedTableColumn<Row>[] = [
      { key: 'alertId', label: 'Alert Id' },
      {
        key: 'accountNo',
        label: 'Account No',
        render: (value: unknown) => <AccountNoCell value={String(value)} />,
      },
      {
        key: 'customerName',
        label: 'Customer Name',
        render: (value: unknown) => (
          <TooltipCell value={value as string} maxLength={150} />
        ),
      },
      {
        key: 'masterDescription',
        label: 'Alert Description',
        render: (value: unknown) => (
          <TooltipCell value={value as string} maxLength={150} />
        ),
      },
      {
        key: 'severityLevel',
        label: 'Severity Level',
        render: (value: unknown) => (
          <SeverityLevelCell value={value as 'HIGH' | 'MEDIUM' | 'LOW'} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (value: unknown) => (
          <StatusPillCell
            status={`${value}` as unknown as StatusPillProps['status']}
          />
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
        render: (_value: unknown, row: Row) =>
          row.periodStart && row.periodEnd
            ? `${fmtDateOnly(row.periodStart)} to ${fmtDateOnly(row.periodEnd)}`
            : '—',
      },
      {
        key: 'severityKey',
        label: 'Raw Severity',
      },
    ]
  }, [alertType])

  const serverColumns = useMemo<PaginatedTableColumns<Row>[]>(() => {
    const baseColumns: PaginatedTableColumns<Row>[] = [
      { key: 'alertId', label: 'Alert Id', sortable: false },
      {
        key: 'accountNo',
        label: 'Account No',
        sortable: false,
        render: (value: unknown) => <AccountNoCell value={String(value)} />,
      },
      {
        key: 'customerName',
        label: 'Customer Name',
        sortable: false,
        render: (value: unknown) => (
          <TooltipCell value={value as string} maxLength={150} />
        ),
      },
      {
        key: 'masterDescription',
        label: 'Alert Description',
        sortable: false,
        render: (value: unknown) => (
          <TooltipCell value={value as string} maxLength={150} />
        ),
      },
      {
        key: 'severityLevel',
        label: 'Severity Level',
        sortable: false,
        render: (value: unknown) => (
          <SeverityLevelCell value={value as 'HIGH' | 'MEDIUM' | 'LOW'} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (value: unknown) => (
          <StatusPillCell
            status={`${value}` as unknown as StatusPillProps['status']}
          />
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
        sortable: false,
      },
      {
        key: 'ruleRunId',
        label: 'Run Id',
        sortable: false,
      },
      {
        key: 'periodStart',
        label: 'Run Period',
        sortable: false,
        render: (_value, row) =>
          row.periodStart && row.periodEnd
            ? `${fmtDateOnly(row.periodStart)} to ${fmtDateOnly(row.periodEnd)}`
            : '—',
      },
      {
        key: 'severityKey',
        label: 'Raw Severity',
        sortable: false,
      },
    ]
  }, [alertType])

  const filtersUI = (
    <div className='ml-auto flex items-end gap-4'>
      <div className='flex items-center gap-2'>
        <Label htmlFor='desc' className='text-muted-foreground text-xs'>
          Master Description
        </Label>
        <Select
          value={selectedMasterId ? String(selectedMasterId) : 'All'}
          onValueChange={(v) =>
            setSelectedMasterId(v === 'All' ? undefined : Number(v))
          }
        >
          <SelectTrigger id='desc' className='w-80'>
            <SelectValue placeholder='All descriptions' />
          </SelectTrigger>
          <SelectContent align='end' className='max-h-80'>
            <SelectItem value='All'>All descriptions</SelectItem>
            {masterOptions.map((opt) => (
              <SelectItem key={opt.alertId} value={String(opt.alertId)}>
                {opt.alertId}. {opt.alertDescription}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor='severity' className='text-muted-foreground text-xs'>
          Severity
        </Label>
        <Select
          value={selectedSeverity ?? 'All'}
          onValueChange={(v) =>
            setSelectedSeverity(
              v === 'All' ? undefined : (v as 'HIGH' | 'MEDIUM' | 'LOW')
            )
          }
        >
          <SelectTrigger id='severity' className='w-32'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All</SelectItem>
            <SelectItem value='HIGH'>High</SelectItem>
            <SelectItem value='MEDIUM'>Medium</SelectItem>
            <SelectItem value='LOW'>Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col'>
        <Label htmlFor='alertDate' className='text-muted-foreground text-xs'>
          Alert Date
        </Label>
        <Input
          id='alertDate'
          type='date'
          className='w-40'
          value={selectedAlertDate ?? ''}
          onChange={(e) => setSelectedAlertDate(e.target.value || undefined)}
        />
      </div>
    </div>
  )

  return (
    <MainWrapper
      extra={
        <div className='flex w-full items-center gap-3'>
          <BranchSelector value={branch} setValue={setBranch} />
        </div>
      }
    >
      {isLoading ? (
        <LoadingBar />
      ) : (
        <>
          <div className='mb-4 flex justify-end'>
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
                  {/* Helper note */}
                  <p className='text-muted-foreground text-sm'>
                    Choose stages (leave blank for all) and an optional date
                    range, then download the report.
                  </p>

                  {/* Stages */}
                  <div>
                    <Label className='mb-2 block'>Stages (multi-select)</Label>
                    <div className='grid grid-cols-2 gap-y-2'>
                      <label className='flex items-center space-x-2'>
                        <Checkbox
                          id='pendingApproval'
                          checked={selectedStages.includes('pendingApproval')}
                          onCheckedChange={() =>
                            handleStageChange('pendingApproval')
                          }
                        />
                        <span>Pending Approval</span>
                      </label>

                      <label className='flex items-center space-x-2'>
                        <Checkbox
                          id='approvedByMe'
                          checked={selectedStages.includes('approvedByMe')}
                          onCheckedChange={() =>
                            handleStageChange('approvedByMe')
                          }
                        />
                        <span>Approved by Me</span>
                      </label>

                      <label className='flex items-center space-x-2'>
                        <Checkbox
                          id='rejectedByMe'
                          checked={selectedStages.includes('rejectedByMe')}
                          onCheckedChange={() =>
                            handleStageChange('rejectedByMe')
                          }
                        />
                        <span>Rejected by Me</span>
                      </label>

                      <label className='flex items-center space-x-2'>
                        <Checkbox
                          id='allAlerts'
                          checked={selectedStages.includes('allAlerts')}
                          onCheckedChange={() => handleStageChange('allAlerts')}
                        />
                        <span>All Alerts</span>
                      </label>
                    </div>

                    {/* Chips summary */}
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

                  {/* Dates row */}
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
                    <Button
                      onClick={handleDownloadReport}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'Generating…' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs
            value={selectedTab}
            onValueChange={(s) => setSelectedTab(s as Tabs)}
          >
            <TabsList>
              <TabsTrigger value='pendingApproval'>
                Pending Approval
              </TabsTrigger>
              <TabsTrigger value='approvedByMe'>Approved by Me</TabsTrigger>
              <TabsTrigger value='rejectedByMe'>Rejected by Me</TabsTrigger>
              {canViewAllAlerts && (
                <TabsTrigger value='allAlerts'>All Alerts</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='pendingApproval'>
              <PaginatedTable
                tableTitle={`${alertType} Alerts - Pending Approval`}
                data={filterAlerts(data?.data?.pendingApproval ?? [])}
                tableActions={filtersUI}
                columns={commonColumns}
                renderActions={(row) => (
                  <div className='flex items-center space-x-2'>
                    <ViewButton onClick={() => setViewingRow(row)} />
                    <AlertRowActionsMenu
                      row={row}
                      onAccept={() => setAcceptingRow(row)}
                      onReject={() => setRejectingRow(row)}
                      onDocumentView={() => {}}
                    />
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value='approvedByMe'>
              <PaginatedTable
                tableTitle={`${alertType} Alerts - Approved by Me`}
                data={filterAlerts(data?.data?.approvedByMe ?? [])}
                tableActions={filtersUI}
                columns={commonColumns}
                renderActions={(row) => (
                  <div className='flex items-center space-x-2'>
                    <ViewButton onClick={() => setViewingRow(row)} />
                    <AlertRowActionsMenu
                      row={row}
                      onAccept={() => setAcceptingRow(row)}
                      onReject={() => setRejectingRow(row)}
                      onDocumentView={() => {}}
                      // onHistoryView={() => setHistoryRow(row)}
                    />
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value='rejectedByMe'>
              <PaginatedTable
                tableTitle={`${alertType} Alerts - Rejected by Me`}
                data={filterAlerts(data?.data?.rejectedByMe ?? [])}
                tableActions={filtersUI}
                columns={commonColumns}
                renderActions={(row) => (
                  <div className='flex items-center space-x-2'>
                    <ViewButton onClick={() => setViewingRow(row)} />
                    <AlertRowActionsMenu
                      row={row}
                      onAccept={() => setAcceptingRow(row)}
                      onReject={() => setRejectingRow(row)}
                      onDocumentView={() => {}}
                      // onHistoryView={() => setHistoryRow(row)}
                    />
                  </div>
                )}
              />
            </TabsContent>

            {canViewAllAlerts && (
              <TabsContent value='allAlerts'>
                <ServerPaginatedTable
                  tableTitle={`${alertType} Alerts - All Alerts`}
                  rows={allAlerts?.data?.content ?? []}
                  total={allAlerts?.data?.totalElements ?? 0}
                  columns={serverColumns}
                  loading={allAlertsLoading}
                  error={
                    ((allAlertsError as unknown as unknown) instanceof Error &&
                      (allAlertsError as unknown as Error)?.message) ||
                    undefined
                  }
                  tableActions={filtersUI}
                  showSearch={false}
                  onQueryChange={(q) =>
                    setAllAlertsQuery((prev) => ({
                      ...prev,
                      page: q.page - 1,
                      size: q.pageSize,
                    }))
                  }
                  renderActions={(row) => (
                    <div className='flex items-center space-x-2'>
                      <ViewButton onClick={() => setViewingRow(row)} />
                      <AlertRowActionsMenu
                        row={row}
                        onDocumentView={() => {}}
                      />
                    </div>
                  )}
                />
              </TabsContent>
            )}
          </Tabs>

          <AcceptDialog
            open={!!acceptingRow}
            onOpenChange={(open) => {
              if (!open) {
                setAcceptingRow(null)
                setAcceptComment('')
              }
            }}
            row={acceptingRow}
            comment={acceptComment}
            onCommentChange={setAcceptComment}
            onSubmit={handleSubmitAccept}
            isLoading={acceptMutation.isPending}
          />

          <RejectDialog
            open={!!rejectingRow}
            onOpenChange={(open) => {
              if (!open) {
                setRejectingRow(null)
                setRejectComment('')
              }
            }}
            row={rejectingRow}
            comment={rejectComment}
            onCommentChange={setRejectComment}
            onSubmit={handleSubmitReject}
            isLoading={rejectMutation.isPending}
          />

          <HistoryDialog
            open={!!historyRow}
            onOpenChange={(open) => !open && setHistoryRow(null)}
            row={historyRow}
            loading={historyLoading}
            error={historyError}
            data={historyResponse?.data}
          />

          {viewingRow && (
            <AlertDetailsDialog
              account={viewingRow}
              loading={false}
              onClose={() => setViewingRow(null)}
              alertType={alertType}
            />
          )}
        </>
      )}
    </MainWrapper>
  )
}

// const AlertsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
//   const Row = ({ idx }: { idx: number }) => (
//     <div
//       key={idx}
//       className='grid grid-cols-7 items-center gap-4 border-b px-4 py-3'
//     >
//       {/* Alert Id */}
//       <Skeleton className='h-4 w-16' />
//       {/* Account No */}
//       <Skeleton className='h-4 w-28' />
//       {/* Customer Name */}
//       <Skeleton className='h-4 w-40' />
//       {/* Alert Description */}
//       <Skeleton className='h-4 w-full' />
//       {/* Severity */}
//       <Skeleton className='h-6 w-20 rounded-full' />
//       {/* Status */}
//       <Skeleton className='h-6 w-24 rounded-full' />
//       {/* Actions */}
//       <div className='flex justify-end gap-2'>
//         <Skeleton className='h-8 w-8 rounded-md' />
//         <Skeleton className='h-8 w-8 rounded-md' />
//       </div>
//     </div>
//   )

//   return (
//     <div className='rounded-md border' aria-busy='true' aria-live='polite'>
//       {/* Table header / toolbar placeholder */}
//       <div className='flex items-center justify-between gap-4 p-4'>
//         <Skeleton className='h-6 w-64' />
//         <div className='flex gap-2'>
//           <Skeleton className='h-9 w-28' />
//           <Skeleton className='h-9 w-28' />
//         </div>
//       </div>

//       {/* Header row placeholder */}
//       <div className='bg-muted/30 grid grid-cols-7 gap-4 border-y px-4 py-2'>
//         <Skeleton className='h-4 w-20' />
//         <Skeleton className='h-4 w-24' />
//         <Skeleton className='h-4 w-32' />
//         <Skeleton className='h-4 w-48' />
//         <Skeleton className='h-4 w-16' />
//         <Skeleton className='h-4 w-20' />
//         <Skeleton className='h-4 w-24 justify-self-end' />
//       </div>

//       {/* Rows */}
//       {Array.from({ length: rows }).map((_, i) => (
//         <Row idx={i} key={i} />
//       ))}

//       {/* Pagination/footer placeholder */}
//       <div className='flex items-center justify-between gap-4 p-3'>
//         <Skeleton className='h-4 w-40' />
//         <div className='flex gap-2'>
//           <Skeleton className='h-8 w-8' />
//           <Skeleton className='h-8 w-8' />
//           <Skeleton className='h-8 w-8' />
//         </div>
//       </div>
//     </div>
//   )
// }
