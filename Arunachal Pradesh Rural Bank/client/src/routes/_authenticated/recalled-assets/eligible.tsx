import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { useAuthStore } from '@/stores/authStore'
import { $api, BASE_URL } from '@/lib/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import PaginatedTable, { PaginatedTableProps } from '@/components/paginated-table'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { AccountNoCell, CurrencyCell } from '@/components/table/cells'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/recalled-assets/eligible')({
  component: RouteComponent,
})

/* -----------------------------
   Small runtime type guards
------------------------------ */
type WithData<T> = { data: T }
const hasData = <T,>(v: unknown): v is WithData<T> =>
  typeof v === 'object' && v !== null && 'data' in v

/* -----------------------------
   Stage-wise summary response (same pattern as OTS)
------------------------------ */
type RaDocument = {
  documentId: number | null
  documentType: string | null
  documentName: string | null
  url: string
  uploadedBy: string | null
  uploadedAt: string | null
  comment: string | null
  stageDefId: number
  stageKey: string
}

type RaVisit = {
  enteredAt: string | null
  enteredBy: string | null
  entryTrigger: string | null
  entryNotes: string | null
  exitedAt: string | null
  exitedBy: string | null
  exitTrigger: string | null
  exitNotes: string | null
}

type RaAction = {
  at: string | null
  trigger: string | null
  changedBy: string | null
  fromStageKey: string | null
  toStageKey: string | null
  notes: string | null
}

type RaTask = {
  taskId: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | string
  createdAt: string | null
  dueAt: string | null
  actedBy: string | null
  actedAt: string | null
  stageDefId: number
  stageKey: string
  stageName: string
}

type RaStage = {
  stageDefId: number
  stageOrder: number
  stageKey: string
  stageName: string
  assignmentType: string
  roleId: string | null
  username: string | null
  departmentId: string | null
  branchId: string | null
  slaDays: number | null
  requiresDocuments: boolean
  current: boolean
  visits: RaVisit[]
  actions: RaAction[]
  documents: RaDocument[]
  tasks: RaTask[]
}

type RaHistoryItem = {
  at: string | null
  type: string | null
  stageKey: string | null
  stageName: string | null
  details: string | null
}

type RaStageWiseSummaryResponse = {
  accountNumber: string
  instanceId: number
  workflowDefKey: string
  instanceStatus: string
  currentStageKey: string | null
  currentStageName: string | null
  instanceCreatedAt: string | null
  instanceCompletedAt: string | null
  stages: RaStage[]
  history: RaHistoryItem[]
}

/* -----------------------------
   UI helpers (same as OTS)
------------------------------ */
const stageStatusBadgeClass = (stageStatus?: string) => {
  const s = (stageStatus ?? '').toUpperCase()
  if (s === 'COMPLETED')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (s === 'IN_PROGRESS')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  if (s === 'PENDING')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

const processStatusBadgeClass = (overdue?: boolean) =>
  overdue
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'

const fmtDT = (s?: string | null) => {
  if (!s) return '-'
  return s.replace('T', ' ').slice(0, 19)
}

const safeMs = (iso?: string | null) => {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

const formatDuration = (startIso?: string | null, endIso?: string | null) => {
  const a = safeMs(startIso)
  const b = safeMs(endIso)
  if (a == null || b == null || b < a) return '-'
  const diff = b - a
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const remM = mins % 60
  if (hrs <= 0) return `${remM}m`
  return `${hrs}h ${remM}m`
}

const deriveStageStatus = (stage: RaStage): 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' => {
  if (stage.current) return 'IN_PROGRESS'
  const hasCompletedTask = stage.tasks?.some((t) => String(t.status).toUpperCase() === 'COMPLETED')
  const hasExit = stage.visits?.some((v) => !!v.exitedAt)
  if (hasCompletedTask || hasExit) return 'COMPLETED'
  return 'PENDING'
}

function RouteComponent() {
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  const [selectedAccountNumber, setSelectedAccountNumber] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const {
    data: listResponse,
    isLoading,
    error,
    refetch: refetchList,
  } = $api.useQuery('get', '/RecalledAssets/EligibleAccounts')

  const initiateRecalledAssetMutation = $api.useMutation('post', '/api/recalledassets/{accountNumber}/initiate')

  const initiateMutation = (accountNumber: string) =>
    initiateRecalledAssetMutation.mutate(
      { params: { header: { Authorization: '' }, path: { accountNumber } } },
      { onSuccess: () => refetchList() }
    )

  const { data: accountData, isLoading: accountDataLoading } = $api.useQuery(
    'get',
    '/RecalledAssets/RecalledAssetsAccount/{acctNo}',
    { params: { path: { acctNo: selectedAccountNumber ?? '' } } },
    { enabled: !!selectedAccountNumber }
  )

  const { data: status, isLoading: statusLoading } = $api.useQuery(
    'get',
    '/api/recalledassets/{accountNumber}/status',
    { params: { path: { accountNumber: selectedAccountNumber ?? '' } } },
    { enabled: !!selectedAccountNumber }
  )

  // ✅ NEW: Stage-wise summary
  const { data: stageWiseSummary, isLoading: stageWiseLoading } = $api.useQuery(
    'get',
    '/api/recalledassets/{accountNumber}/stage-wise-summary',
    {
      params: {
        path: { accountNumber: selectedAccountNumber ?? '' },
      },
    },
    { enabled: !!selectedAccountNumber }
  )

  const accountDetails = accountData?.data
  const statusData = status
  const loadingDetails = accountDataLoading || statusLoading || stageWiseLoading

  const stageSummary: RaStageWiseSummaryResponse | null = useMemo(() => {
    if (!stageWiseSummary) return null
    if (hasData<RaStageWiseSummaryResponse>(stageWiseSummary)) return stageWiseSummary.data
    return stageWiseSummary as unknown as RaStageWiseSummaryResponse
  }, [stageWiseSummary])

  const stages: RaStage[] = stageSummary?.stages ?? []
  const history: RaHistoryItem[] = stageSummary?.history ?? []

  const handleInitiateClick = (acctNo: string) => {
    setSelectedAccount(acctNo)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (selectedAccount) {
      initiateMutation(selectedAccount)
      setConfirmOpen(false)
      setSelectedAccount(null)
    }
  }

  const handleOpenDetails = (acctNo: string) => {
    setSelectedAccountNumber(acctNo)
    setDetailsDialogOpen(true)
  }

  const accounts = useMemo(() => {
    if (!listResponse?.data) return []
    return listResponse.data ?? []
  }, [listResponse])

  const outstandingStats = useMemo(() => {
    const values =
      accounts?.map((d) => Number(d.outstandingAmount)).filter((val) => !isNaN(val) && isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total, count: values.length }
  }, [accounts])

  const filteredData = useMemo(() => {
    if (!query) return accounts
    const q = query.toLowerCase()
    return accounts.filter((row) =>
      [row.accountNumber, row.borrowerName, row.iracStatus, row.outstandingAmount, row.branchCode]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accounts, query])

  const progress = isLoading ? 70 : 100

  const columns: PaginatedTableProps<(typeof filteredData)[0]>['columns'] = [
    {
      key: 'accountNumber',
      label: 'Account No',
      render: (value) => (value ? <AccountNoCell value={`${value}`} /> : <span>-</span>),
    },
    {
      key: 'borrowerName',
      label: 'Customer Name',
      render: (value) => <span className='font-semibold'>{value ?? '-'}</span>,
    },
    {
      key: 'outstandingAmount',
      label: 'Outstanding',
      render: (value) => <CurrencyCell value={String(value ?? 0)} />,
    },
    {
      key: 'iracStatus',
      label: 'IRAC Status',
      render: (value) => <span>{value ?? '-'}</span>,
    },
  ] as const

  return (
    <>
      <Header>
        {isBranchDropdownVisible && (
          <div className='text-muted-foreground text-xs'>{/* (Branch filter not applied on eligible list) */}</div>
        )}
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <LoadingBar progress={progress} color='#2998ff' height={3} />

      <Main className='px-4 py-2'>
        <AppBreadcrumb className='p-2' crumbs={[Home]} currentPage={{ type: 'label', label: 'Recalled Asset Eligible Accounts' }} />

        {isLoading ? (
          <Card className='col-span-full space-y-4 p-6 shadow-lg'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='flex space-x-4'>
              <Skeleton className='h-10 w-1/4 rounded-md' />
            </div>
            <div className='mt-4 space-y-3'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='flex items-center space-x-6' aria-hidden='true'>
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/12 rounded-md' />
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <div className='py-10 text-center text-red-500'>
            Error fetching eligible Recalled Asset accounts: {String((error as Error).message)}
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className='py-10 text-center text-gray-500'>No Recalled Asset eligible accounts available.</div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  Recalled Asset Eligible Accounts ({filteredData.length} accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total eligible records: {accounts.length} | Total outstanding (sum): {outstandingStats.total.toFixed(2)} | Min:{' '}
                  {outstandingStats.min.toFixed(2)} | Max: {outstandingStats.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='searchEligible' className='sr-only'>
                  Search eligible Recalled Asset accounts
                </Label>
                <Input
                  id='searchEligible'
                  placeholder='Search by account, name, mobile...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='max-w-sm border-gray-300 focus:border-blue-500'
                  aria-label='Search eligible Recalled Asset accounts'
                />
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable
                frameless
                showSearch={false}
                data={filteredData}
                columns={columns}
                emptyMessage='No Recalled Asset eligible accounts to show.'
                renderActions={(row) => {
                  if (!row.accountNumber) return null

                  const baseButtonClass =
                    'border-[var(--primary)] text-xs text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                  const completed = row.proposalCreated === true && row.workflowInitiated === true

                  return (
                    <div className='flex flex-row justify-end gap-1'>
                      {completed && (
                        <Badge className='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                          Initiated
                        </Badge>
                      )}

                      {!row.proposalCreated && (
                        <Link to='/recalled-assets/proposal/$accountNumber' params={{ accountNumber: row.accountNumber }}>
                          <Button type='button' variant='outline' className={baseButtonClass}>
                            Transfer
                          </Button>
                        </Link>
                      )}

                      {row.proposalCreated && !row.workflowInitiated && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => handleInitiateClick(String(row.accountNumber))}
                          className={baseButtonClass}
                        >
                          Initiate
                        </Button>
                      )}

                      <Button
                        type='button'
                        variant='outline'
                        className='text-xs'
                        onClick={() => handleOpenDetails(String(row.accountNumber as string))}
                      >
                        View
                      </Button>
                    </div>
                  )
                }}
              />
            </CardContent>
          </Card>
        )}
      </Main>

      {/* Confirm Initiate Recalled Asset */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will initiate the Recalled Asset process for account <span className='font-semibold'>{selectedAccount}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ SARFAESI-style Details Dialog + Stage history */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent
          className="
            w-[calc(100vw-1rem)]
            sm:w-[calc(100vw-2rem)]
            max-w-5xl sm:max-w-6xl
            max-h-[92vh]
            p-0
            overflow-hidden
            flex flex-col
            border bg-background/95
            shadow-2xl
            backdrop-blur
            rounded-2xl
          "
        >
          {/* Header */}
          <DialogHeader className="relative border-b bg-gradient-to-b from-background to-background/70 p-5 sm:p-6">
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='flex flex-wrap items-center gap-2'>
                  <span className='text-base sm:text-lg font-semibold tracking-tight'>Account Details</span>
                  <span className='text-muted-foreground'>–</span>
                  <span className='inline-flex items-center gap-2'>
                    <span className='rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-xs sm:text-sm font-semibold'>
                      {accountDetails?.accountNumber ?? selectedAccountNumber ?? '-'}
                    </span>
                    {accountDetails?.borrowerName && (
                      <span className='hidden sm:inline text-muted-foreground text-sm font-medium truncate max-w-[28rem]'>
                        {accountDetails.borrowerName}
                      </span>
                    )}
                  </span>
                </DialogTitle>

                {accountDetails?.borrowerName && (
                  <p className='sm:hidden text-muted-foreground text-xs font-medium truncate'>{accountDetails.borrowerName}</p>
                )}

                <DialogDescription className='text-xs sm:text-sm'>
                  Combined view of core account information, process status, and stage-wise history for quick review.
                </DialogDescription>
              </div>

              {stageSummary?.instanceStatus && (
                <Badge variant='outline' className='text-[0.7rem]'>
                  Instance: {stageSummary.instanceStatus}
                </Badge>
              )}
            </div>

            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent' />
          </DialogHeader>

          {/* Body */}
          <div className='flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6'>
            {loadingDetails ? (
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='space-y-3 md:col-span-2'>
                    <Skeleton className='h-6 w-1/3' />
                    <Skeleton className='h-5 w-2/3' />
                    <Skeleton className='h-24 w-full' />
                  </div>
                  <div className='space-y-3'>
                    <Skeleton className='h-6 w-1/2' />
                    <Skeleton className='h-20 w-full' />
                  </div>
                </div>
                <Separator />
                <Skeleton className='h-6 w-1/4' />
                <Skeleton className='h-40 w-full' />
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Top cards */}
                <div className='grid gap-4 md:grid-cols-3'>
                  {/* Account overview */}
                  <div className='rounded-xl border bg-gradient-to-b from-muted/40 to-background p-4 md:col-span-2 shadow-sm'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-semibold tracking-tight'>Account overview</h3>
                      <span className='text-[0.7rem] text-muted-foreground'>Core snapshot</span>
                    </div>

                    {accountDetails ? (
                      <div className='grid gap-3 text-xs sm:grid-cols-2'>
                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>Borrower</p>
                          <p className='mt-1 font-medium'>{accountDetails.borrowerName || '-'}</p>
                          <p className='text-muted-foreground mt-1'>Account: {accountDetails.accountNumber || '-'}</p>
                        </div>

                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>Branch</p>
                          <p className='mt-1 font-medium'>{accountDetails.branchCode || '-'}</p>
                          <p className='text-muted-foreground mt-1 text-xs'>{accountDetails.branchName || '-'}</p>
                        </div>

                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>Outstanding / Sanction</p>
                          <p className='mt-1 text-sm font-semibold'>
                            {(accountDetails.outstandingAmount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Sanction:{' '}
                            {(accountDetails.loanSanctionAmount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>NPA / IRAC</p>
                          <p className='mt-1 font-medium'>IRAC: {accountDetails.iracStatus ?? '-'}</p>
                          <p className='text-muted-foreground mt-1 text-xs'>NPA Date: {accountDetails.npaDate ?? '-'}</p>
                        </div>

                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>Sanction details</p>
                          <p className='mt-1 text-xs'>Sanction Date: {accountDetails.loanSanctionDate ?? '-'}</p>
                          <p className='mt-1 text-xs'>Proposal For: {accountDetails.proposalFor ?? '-'}</p>
                          <p className='mt-1 text-xs'>Authority: {accountDetails.sanctioningAuthority ?? '-'}</p>
                        </div>

                        <div className='rounded-lg border bg-background/60 p-3'>
                          <p className='text-muted-foreground'>Contact</p>
                          <p className='mt-1 text-xs'>Address: {accountDetails.address ?? '-'}</p>
                          <p className='mt-1 text-xs'>Phone: {accountDetails.phoneNumber ?? '-'}</p>
                          <p className='mt-1 text-xs'>Email: {accountDetails.email ?? '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-xs'>No detailed account data available.</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className='rounded-xl border bg-gradient-to-b from-muted/40 to-background p-4 shadow-sm'>
                    <div className='mb-3 flex items-center justify-between gap-2'>
                      <h3 className='text-sm font-semibold tracking-tight'>Recalled Asset status</h3>
                      {typeof statusData?.overdue === 'boolean' && (
                        <Badge className={processStatusBadgeClass(statusData.overdue)}>
                          {statusData.overdue ? 'Overdue' : 'On track'}
                        </Badge>
                      )}
                    </div>

                    {statusData ? (
                      <div className='space-y-3 text-xs'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline' className='text-[0.7rem]'>
                            Stage: {statusData.currentStage || stageSummary?.currentStageName || 'Not yet initiated'}
                          </Badge>
                          {statusData.status && (
                            <Badge variant='outline' className='text-[0.7rem]'>
                              Status: {statusData.status}
                            </Badge>
                          )}
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-[0.7rem]'>
                          <div className='rounded-lg border bg-background/60 p-2'>
                            <p className='text-muted-foreground'>Instance created</p>
                            <p className='mt-0.5'>{fmtDT(stageSummary?.instanceCreatedAt)}</p>
                          </div>
                          <div className='rounded-lg border bg-background/60 p-2'>
                            <p className='text-muted-foreground'>Instance completed</p>
                            <p className='mt-0.5'>{fmtDT(stageSummary?.instanceCompletedAt)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-xs'>Process not yet initiated for this account.</p>
                    )}
                  </div>
                </div>

                <Separator className='opacity-60' />

                {/* Stage history */}
                <div className='space-y-3'>
                  <div>
                    <h3 className='text-sm font-semibold tracking-tight'>Stage history</h3>
                    <p className='text-muted-foreground text-[0.75rem]'>
                      Timeline of each stage with visits, tasks, actions & documents.
                    </p>
                  </div>

                  {Array.isArray(stages) && stages.length > 0 ? (
                    <div className='max-h-96 space-y-3 overflow-y-auto pr-1 text-xs'>
                      {stages
                        .slice()
                        .sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
                        .map((stage) => {
                          const status = deriveStageStatus(stage)
                          const lastVisit = stage.visits?.[stage.visits.length - 1]
                          const start = lastVisit?.enteredAt ?? null
                          const end = lastVisit?.exitedAt ?? null
                          const duration = end
                            ? formatDuration(start, end)
                            : stage.current
                              ? formatDuration(start, new Date().toISOString())
                              : '-'

                          const lastTask = stage.tasks?.[stage.tasks.length - 1]
                          const actedBy = lastTask?.actedBy ?? lastVisit?.exitedBy ?? lastVisit?.enteredBy ?? null
                          const lastAction = stage.actions?.[stage.actions.length - 1]

                          return (
                            <div
                              key={stage.stageKey}
                              className='rounded-xl border bg-gradient-to-b from-background to-muted/40 p-3 shadow-sm hover:bg-muted/40 transition'
                            >
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <div className='min-w-0'>
                                  <p className='text-xs font-semibold truncate'>
                                    {stage.stageOrder}. {stage.stageName ?? stage.stageKey ?? 'Stage'}
                                  </p>
                                  <p className='text-muted-foreground text-[0.7rem]'>
                                    {actedBy ? `Last handled by ${actedBy}` : stage.current ? 'In progress' : 'Not started'}
                                  </p>
                                </div>

                                <div className='flex items-center gap-2'>
                                  {stage.current && (
                                    <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
                                      Current
                                    </Badge>
                                  )}
                                  <Badge variant='outline' className={stageStatusBadgeClass(status)}>
                                    {status}
                                  </Badge>
                                </div>
                              </div>

                              <div className='mt-3 grid gap-2 text-[0.7rem] sm:grid-cols-3'>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>Start</p>
                                  <p className='mt-0.5'>{fmtDT(start)}</p>
                                </div>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>End</p>
                                  <p className='mt-0.5'>{fmtDT(end)}</p>
                                </div>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>Duration</p>
                                  <p className='mt-0.5'>{duration}</p>
                                </div>
                              </div>

                              <div className='mt-3 grid gap-2 text-[0.7rem] sm:grid-cols-3'>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>SLA (days)</p>
                                  <p className='mt-0.5'>{stage.slaDays ?? '-'}</p>
                                </div>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>Task</p>
                                  <p className='mt-0.5'>
                                    {lastTask ? `${lastTask.status} (Due: ${fmtDT(lastTask.dueAt)})` : '-'}
                                  </p>
                                </div>
                                <div className='rounded-lg border bg-background/60 p-2'>
                                  <p className='text-muted-foreground'>Last action</p>
                                  <p className='mt-0.5'>
                                    {lastAction?.trigger ? `${lastAction.trigger} by ${lastAction.changedBy ?? '-'}` : '-'}
                                  </p>
                                </div>
                              </div>

                              <div className='mt-3 flex flex-wrap gap-3 text-[0.7rem]'>
                                <span className='text-muted-foreground'>
                                  Visits: <span className='font-medium'>{stage.visits?.length ?? 0}</span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Actions: <span className='font-medium'>{stage.actions?.length ?? 0}</span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Documents: <span className='font-medium'>{stage.documents?.length ?? 0}</span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Tasks: <span className='font-medium'>{stage.tasks?.length ?? 0}</span>
                                </span>
                              </div>

                              {/* Documents list */}
                              {Array.isArray(stage.documents) && stage.documents.length > 0 && (
                                <div className='mt-3 rounded-lg border bg-background/60 p-3'>
                                  <p className='text-[0.75rem] font-medium'>Documents</p>
                                  <div className='mt-2 space-y-2'>
                                    {stage.documents.map((d, idx) => (
                                      <div key={`${stage.stageKey}-${idx}`} className='flex items-center justify-between gap-3'>
                                        <div className='min-w-0'>
                                          <p className='text-[0.7rem] font-medium truncate'>
                                            {d.documentName ?? d.documentType ?? 'Document'}
                                          </p>
                                          <p className='text-muted-foreground text-[0.65rem]'>
                                            {d.uploadedAt ? `Uploaded: ${fmtDT(d.uploadedAt)}` : '—'}
                                          </p>
                                        </div>
                                        <Button
                                          type='button'
                                          variant='outline'
                                          size='sm'
                                          className='text-[0.7rem]'
                                          onClick={() => window.open(`${BASE_URL}/${d.url}`, '_blank', 'noopener,noreferrer')}
                                        >
                                          Download
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-xs'>
                      No stage history available yet. Once initiated and stages progress, you’ll see a timeline here.
                    </p>
                  )}
                </div>

                {/* Instance timeline */}
                <div className='space-y-3'>
                  <div>
                    <h3 className='text-sm font-semibold tracking-tight'>Instance timeline</h3>
                    <p className='text-muted-foreground text-[0.75rem]'>Events recorded for this workflow instance.</p>
                  </div>

                  {Array.isArray(history) && history.length > 0 ? (
                    <div className='rounded-xl border bg-gradient-to-b from-background to-muted/40 p-3 shadow-sm'>
                      <div className='space-y-2 text-[0.75rem]'>
                        {history
                          .slice()
                          .sort((a, b) => (safeMs(a.at) ?? 0) - (safeMs(b.at) ?? 0))
                          .map((h, idx) => (
                            <div
                              key={idx}
                              className='flex items-start justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0'
                            >
                              <div className='min-w-0'>
                                <p className='font-medium truncate'>{h.stageName ?? h.stageKey ?? 'Stage change'}</p>
                                <p className='text-muted-foreground'>{h.details ?? '-'}</p>
                              </div>
                              <span className='shrink-0 text-muted-foreground'>{fmtDT(h.at)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-xs'>No timeline events yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='border-t bg-background/70 px-5 py-4 sm:px-6'>
            <div className='ml-auto flex justify-end gap-2'>
              <Button variant='outline' size='sm' onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
