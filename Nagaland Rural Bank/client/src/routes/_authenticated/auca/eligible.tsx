import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { $api, BASE_URL, fetchClient } from '@/lib/api'
import { toastError } from '@/lib/utils.ts'
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
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import {
  AccountNoCell,
  CurrencyCell,
  TooltipCell,
} from '@/components/table/cells'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/auca/eligible')({
  component: RouteComponent,
})

/* -----------------------------
   Small runtime helpers/guards
------------------------------ */
type WithData<T> = { data: T }
const hasData = <T,>(v: unknown): v is WithData<T> =>
  typeof v === 'object' && v !== null && 'data' in v

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function pickBlob(res: unknown): Blob | null {
  if (typeof Blob !== 'undefined' && res instanceof Blob) return res
  if (isRecord(res) && typeof Blob !== 'undefined' && res.data instanceof Blob)
    return res.data
  return null
}

/* -----------------------------
   ✅ AUCA Stage-wise summary response
   (Keeping SAME structure as your OTS response pattern)
------------------------------ */
type AucaDocument = {
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

type AucaVisit = {
  enteredAt: string | null
  enteredBy: string | null
  entryTrigger: string | null
  entryNotes: string | null
  exitedAt: string | null
  exitedBy: string | null
  exitTrigger: string | null
  exitNotes: string | null
}

type AucaAction = {
  at: string | null
  trigger: string | null
  changedBy: string | null
  fromStageKey: string | null
  toStageKey: string | null
  notes: string | null
}

type AucaTask = {
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

type AucaStage = {
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
  visits: AucaVisit[]
  actions: AucaAction[]
  documents: AucaDocument[]
  tasks: AucaTask[]
}

type AucaHistoryItem = {
  at: string | null
  type: string | null
  stageKey: string | null
  stageName: string | null
  details: string | null
}

type AucaStageWiseSummaryResponse = {
  accountNumber: string
  instanceId: number
  workflowDefKey: string
  instanceStatus: string
  currentStageKey: string | null
  currentStageName: string | null
  instanceCreatedAt: string | null
  instanceCompletedAt: string | null
  stages: AucaStage[]
  history: AucaHistoryItem[]
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

const deriveStageStatus = (
  stage: AucaStage
): 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' => {
  if (stage.current) return 'IN_PROGRESS'
  const hasCompletedTask = stage.tasks?.some(
    (t) => String(t.status).toUpperCase() === 'COMPLETED'
  )
  const hasExit = stage.visits?.some((v) => !!v.exitedAt)
  if (hasCompletedTask || hasExit) return 'COMPLETED'
  return 'PENDING'
}

/* -----------------------------
   Shallow mutation typing
------------------------------ */
type ShallowMutationResult = {
  mutate: (input: unknown) => void
  mutateAsync: (input: unknown) => Promise<unknown>
  isPending?: boolean
}
const useMutationShallow = $api.useMutation as unknown as (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  opts?: unknown
) => ShallowMutationResult

function RouteComponent() {
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  const [selectedAccountNumber, setSelectedAccountNumber] = useState<
    string | null
  >(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const {
    data: listResponse,
    isLoading,
    error,
    refetch: refetchList,
  } = $api.useQuery('get', '/auca-transfer/AucaAccountList')

  const initiateAucaMutation = $api.useMutation(
    'post',
    '/api/auca/{accountNumber}/initiate'
  )

  const downloadAnnexureAMutation = useMutationShallow(
    'get',
    '/auca-transfer/nrb/pdf/recommendation/{accountNumber}'
  )
  const downloadAnnexureBMutation = useMutationShallow(
    'get',
    '/auca-transfer/nrb/pdf/annexure-ii/{accountNumber}'
  )

  // ===== Summary Report download (AUCA) using fetchClient =====
  const [downloadingSummary, setDownloadingSummary] = useState(false)

  async function downloadSummaryReportViaClient(args: {
    accountNumber: string
  }) {
    const { accountNumber } = args

    const res = await fetchClient.GET(
      '/api/auca/{accountNumber}/combined-report.pdf',
      {
        params: {
          path: { accountNumber: String(accountNumber) }, 
        },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Failed with status ${status ?? 'unknown'}`)
    }

    const blob = res.data as Blob

    // filename from header if backend sends it
    const cd = res.response.headers.get('content-disposition') ?? ''
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd)
    const filenameFromHeader = decodeURIComponent(
      match?.[1] || match?.[2] || ''
    )

    const fallbackName = `AUCA-${accountNumber}-Summary-Report.pdf`
    const filename = filenameFromHeader || fallbackName

    const objectUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  const handleDownloadSummaryReport = async () => {
    if (!selectedAccountNumber) return
    try {
      setDownloadingSummary(true)
      await downloadSummaryReportViaClient({
        accountNumber: selectedAccountNumber,
      })
      toast.success('Summary report downloaded')
    } catch (e) {
      toastError(e, 'Failed to download summary report')
    } finally {
      setDownloadingSummary(false)
    }
  }

  const handleDownloadAnnexureA = async (accountNumber: string) => {
    try {
      const res = await downloadAnnexureAMutation.mutateAsync({
        params: {
          path: { accountNumber },
          header: { Authorization: '', Accept: '*/*' },
        },
        parseAs: 'blob',
      } as unknown)

      const blob = pickBlob(res)
      if (!blob) {
        toast.error('Failed to download recommendation.')
        return
      }

      const filename = `Recommendation-${accountNumber}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Recommendation download started.')
    } catch (err) {
      toastError(err, 'Failed to download recommendation.')
    }
  }

  const handleDownloadAnnexureB = async (accountNumber: string) => {
    try {
      const res = await downloadAnnexureBMutation.mutateAsync({
        params: {
          path: { accountNumber },
          header: { Authorization: '', Accept: '*/*' },
        },
        parseAs: 'blob',
      } as unknown)

      const blob = pickBlob(res)
      if (!blob) {
        toast.error('Failed to download Annexure B.')
        return
      }

      const filename = `Annexure-B-${accountNumber}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Annexure B download started.')
    } catch (err) {
      toastError(err, 'Failed to download Annexure B.')
    }
  }

  const initiateMutation = (accountNumber: string) =>
    initiateAucaMutation.mutate(
      { params: { header: { Authorization: '' }, path: { accountNumber } } },
      { onSuccess: () => refetchList() }
    )

  const { data: accountData, isLoading: accountDataLoading } = $api.useQuery(
    'get',
    '/auca-transfer/AucaEligible/{acctNo}',
    { params: { path: { acctNo: selectedAccountNumber ?? '' } } },
    { enabled: !!selectedAccountNumber }
  )

  const { data: status, isLoading: statusLoading } = $api.useQuery(
    'get',
    '/api/auca/{accountNumber}/status',
    { params: { path: { accountNumber: selectedAccountNumber ?? '' } } },
    { enabled: !!selectedAccountNumber }
  )

  // ✅ NEW: AUCA Stage-wise summary API (same pattern as OTS)
  const { data: stageWiseSummary, isLoading: stageWiseLoading } = $api.useQuery(
    'get',
    '/api/auca/{accountNumber}/stage-wise-summary',
    {
      params: {
        path: { accountNumber: selectedAccountNumber ?? '' },
        header: { Authorization: '' },
      },
    },
    { enabled: !!selectedAccountNumber }
  )

  const accountDetails = accountData?.data
  const statusData = status
  const loadingDetails = accountDataLoading || statusLoading || stageWiseLoading

  const stageSummary: AucaStageWiseSummaryResponse | null = useMemo(() => {
    if (!stageWiseSummary) return null
    if (hasData<AucaStageWiseSummaryResponse>(stageWiseSummary))
      return stageWiseSummary.data
    return stageWiseSummary as unknown as AucaStageWiseSummaryResponse
  }, [stageWiseSummary])

  const stages: AucaStage[] = stageSummary?.stages ?? []
  const history: AucaHistoryItem[] = stageSummary?.history ?? []

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
      accounts
        ?.map((d) => Number(d.outstand))
        .filter((val) => !isNaN(val) && isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total, count: values.length }
  }, [accounts])

  const filteredData = useMemo(() => {
    if (!query) return accounts
    const q = query.toLowerCase()
    return accounts.filter((row) =>
      [
        row.acctNo,
        row.custName,
        row.telNo,
        row.city ?? row.add4,
        row.newIrac,
        row.outstand,
        row.branchCode,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accounts, query])

  const progress = isLoading ? 70 : 100

  const columns: PaginatedTableProps<(typeof filteredData)[0]>['columns'] = [
    {
      key: 'acctNo',
      label: 'Account No',
      render: (value) =>
        value ? <AccountNoCell value={`${value}`} /> : <span>-</span>,
    },
    {
      key: 'custName',
      label: 'Customer Name',
      render: (value) => <span className='font-semibold'>{value ?? '-'}</span>,
    },
    {
      key: 'telNo',
      label: 'Mobile No.',
      render: (value) => <TooltipCell value={String(value ?? '-')} />,
    },
    {
      key: 'outstand',
      label: 'Outstanding',
      render: (value) => <CurrencyCell value={String(value ?? 0)} />,
    },
    // {
    //   key: 'city',
    //   label: 'City',
    //   render: (_value, row) => <span>{row.city ?? row.add4 ?? '-'}</span>,
    // },
  ] as const

  return (
    <>
      <Header>
        {isBranchDropdownVisible && (
          <div className='text-muted-foreground text-xs'>
            {/* (Branch filter not applied on eligible list) */}
          </div>
        )}
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <LoadingBar progress={progress} color='#2998ff' height={3} />

      <Main className='px-4 py-2'>
        <AppBreadcrumb
          className='p-2'
          crumbs={[Home]}
          currentPage={{ type: 'label', label: 'Auca Eligible Accounts' }}
        />

        {isLoading ? (
          <Card className='col-span-full space-y-4 p-6 shadow-lg'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='flex space-x-4'>
              <Skeleton className='h-10 w-1/4 rounded-md' />
            </div>
            <div className='mt-4 space-y-3'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center space-x-6'
                  aria-hidden='true'
                >
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
            Error fetching eligible Auca accounts:{' '}
            {String((error as Error).message)}
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No AUCA eligible accounts available.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  AUCA Eligible Accounts ({filteredData.length} accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total eligible records: {accounts.length} | Total outstanding
                  (sum): {outstandingStats.total.toFixed(2)} | Min:{' '}
                  {outstandingStats.min.toFixed(2)} | Max:{' '}
                  {outstandingStats.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='searchEligible' className='sr-only'>
                  Search eligible AUCA accounts
                </Label>
                <Input
                  id='searchEligible'
                  placeholder='Search by account, name, mobile...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='max-w-sm border-gray-300 focus:border-blue-500'
                  aria-label='Search eligible AUCA accounts'
                />
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable
                frameless
                showSearch={false}
                data={filteredData}
                columns={columns}
                emptyMessage='No AUCA eligible accounts to show.'
                renderActions={(row) => {
                  if (!row.acctNo) return null

                  const baseButtonClass =
                    'border-[var(--primary)] text-xs text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                  const completed =
                    row.transferInitiated === true && row.initiated === true

                  return (
                    <div className='flex flex-row justify-end gap-1'>
                      {completed && (
                        <Badge className='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                          Initiated
                        </Badge>
                      )}

                      {!row.transferInitiated && (
                        <Link
                          to='/auca/transfer'
                          search={{ acctNo: row.acctNo }}
                        >
                          <Button
                            type='button'
                            variant='outline'
                            className={baseButtonClass}
                          >
                            Transfer
                          </Button>
                        </Link>
                      )}

                      {row.transferInitiated && (
                        <Button
                          type='button'
                          variant='outline'
                          className={baseButtonClass}
                          disabled={!!downloadAnnexureAMutation.isPending}
                          onClick={() =>
                            handleDownloadAnnexureA(String(row.acctNo))
                          }
                        >
                          {downloadAnnexureAMutation.isPending
                            ? 'Downloading…'
                            : 'Download Recommendation'}
                        </Button>
                      )}

                      {row.status === 'AUCA_TRANSFER_COMPLETED' && (
                        <Button
                          type='button'
                          variant='outline'
                          className={baseButtonClass}
                          disabled={!!downloadAnnexureBMutation.isPending}
                          onClick={() =>
                            handleDownloadAnnexureB(String(row.acctNo))
                          }
                        >
                          {downloadAnnexureBMutation.isPending
                            ? 'Downloading…'
                            : 'Download Annexure B'}
                        </Button>
                      )}

                      {row.transferInitiated && !row.initiated && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() =>
                            handleInitiateClick(String(row.acctNo))
                          }
                          className={baseButtonClass}
                        >
                          Initiate Auca
                        </Button>
                      )}

                      <Button
                        type='button'
                        variant='outline'
                        className='text-xs'
                        onClick={() =>
                          handleOpenDetails(String(row.acctNo as string))
                        }
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

      {/* Confirm Initiate AUCA */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will initiate the AUCA process for account{' '}
              <span className='font-semibold'>{selectedAccount}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ SARFAESI-style Details Dialog + Stage history (same as OTS) */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className='bg-background/95 flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop-blur sm:w-[calc(100vw-2rem)] sm:max-w-6xl'>
          {/* Header */}
          <DialogHeader className='from-background to-background/70 relative border-b bg-gradient-to-b p-5 sm:p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='flex flex-wrap items-center gap-2'>
                  <span className='text-base font-semibold tracking-tight sm:text-lg'>
                    Account Details
                  </span>
                  <span className='text-muted-foreground'>–</span>
                  <span className='inline-flex items-center gap-2'>
                    <span className='bg-muted/40 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold sm:text-sm'>
                      {accountDetails?.acctNo ?? selectedAccountNumber ?? '-'}
                    </span>
                    {accountDetails?.custName && (
                      <span className='text-muted-foreground hidden max-w-[28rem] truncate text-sm font-medium sm:inline'>
                        {accountDetails.custName}
                      </span>
                    )}
                  </span>
                </DialogTitle>

                {accountDetails?.custName && (
                  <p className='text-muted-foreground truncate text-xs font-medium sm:hidden'>
                    {accountDetails.custName}
                  </p>
                )}

                <DialogDescription className='text-xs sm:text-sm'>
                  Combined view of core account information, AUCA process
                  status, and stage-wise history for quick review.
                </DialogDescription>
              </div>

              <div className='flex flex-col items-center gap-2'>
                {stageSummary?.instanceStatus && (
                  <Badge variant='outline' className='text-[0.7rem]'>
                    Instance: {stageSummary.instanceStatus}
                  </Badge>
                )}
                {selectedAccountNumber && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='text-[0.7rem]'
                    onClick={handleDownloadSummaryReport}
                    disabled={downloadingSummary}
                  >
                    <DownloadIcon />
                    {downloadingSummary ? 'Downloading...' : 'Summary Report'}
                  </Button>
                )}
              </div>
            </div>

            <div className='via-border pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent' />
          </DialogHeader>

          {/* Body scroll */}
          <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6'>
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
                  <div className='from-muted/40 to-background rounded-xl border bg-gradient-to-b p-4 shadow-sm md:col-span-2'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-semibold tracking-tight'>
                        Account overview
                      </h3>
                      <span className='text-muted-foreground text-[0.7rem]'>
                        Core snapshot
                      </span>
                    </div>

                    {accountDetails ? (
                      <div className='grid gap-3 text-xs sm:grid-cols-2'>
                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>Borrower</p>
                          <p className='mt-1 font-medium'>
                            {accountDetails.custName || '-'}
                          </p>
                          <p className='text-muted-foreground mt-1'>
                            CIF: {accountDetails.custNumber || '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>Branch</p>
                          <p className='mt-1 font-medium'>
                            {accountDetails.branchCode || '-'}
                          </p>
                          <p className='text-muted-foreground mt-1'>
                            City: {accountDetails.city || '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>
                            Outstanding / Limit
                          </p>
                          <p className='mt-1 text-sm font-semibold'>
                            {accountDetails.outstand?.toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            }) ?? '-'}{' '}
                            {accountDetails.currency || ''}
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Limit:{' '}
                            {accountDetails.loanLimit?.toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            }) ?? '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>NPA / IRAC</p>
                          <p className='mt-1 font-medium'>
                            IRAC: {accountDetails.newIrac ?? '-'}
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            NPA Date: {accountDetails.npaDt ?? '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3 sm:col-span-2'>
                          <div className='grid gap-3 sm:grid-cols-3'>
                            <div>
                              <p className='text-muted-foreground'>Sanction</p>
                              <p className='mt-1'>
                                {accountDetails.sanctDt ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Renewal</p>
                              <p className='mt-1'>
                                {accountDetails.renewalDt ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Due date</p>
                              <p className='mt-1'>
                                {accountDetails.dueDt ?? '-'}
                              </p>
                            </div>
                          </div>

                          <div className='mt-3 border-t pt-3'>
                            <p className='text-muted-foreground'>Address</p>
                            <p className='mt-1 text-xs'>
                              {[
                                accountDetails.add1,
                                accountDetails.add2,
                                accountDetails.add3,
                              ]
                                .filter(Boolean)
                                .join(', ') || '-'}
                            </p>
                            <p className='mt-1 text-xs'>
                              {accountDetails.city
                                ? `${accountDetails.city}, ${accountDetails.state ?? ''}`
                                : (accountDetails.state ?? '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-xs'>
                        No detailed account data available.
                      </p>
                    )}
                  </div>

                  {/* AUCA status */}
                  <div className='from-muted/40 to-background rounded-xl border bg-gradient-to-b p-4 shadow-sm'>
                    <div className='mb-3 flex items-center justify-between gap-2'>
                      <h3 className='text-sm font-semibold tracking-tight'>
                        AUCA status
                      </h3>
                      {typeof statusData?.overdue === 'boolean' && (
                        <Badge
                          className={processStatusBadgeClass(
                            statusData.overdue
                          )}
                        >
                          {statusData.overdue ? 'Overdue' : 'On track'}
                        </Badge>
                      )}
                    </div>

                    {statusData ? (
                      <div className='space-y-3 text-xs'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline' className='text-[0.7rem]'>
                            Stage:{' '}
                            {statusData.currentStage ||
                              stageSummary?.currentStageName ||
                              'Not yet initiated'}
                          </Badge>
                          {statusData.status && (
                            <Badge variant='outline' className='text-[0.7rem]'>
                              Status: {statusData.status}
                            </Badge>
                          )}
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-[0.7rem]'>
                          <div className='bg-background/60 rounded-lg border p-2'>
                            <p className='text-muted-foreground'>
                              Instance created
                            </p>
                            <p className='mt-0.5'>
                              {fmtDT(stageSummary?.instanceCreatedAt)}
                            </p>
                          </div>
                          <div className='bg-background/60 rounded-lg border p-2'>
                            <p className='text-muted-foreground'>
                              Instance completed
                            </p>
                            <p className='mt-0.5'>
                              {fmtDT(stageSummary?.instanceCompletedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-xs'>
                        AUCA process not yet initiated for this account.
                      </p>
                    )}
                  </div>
                </div>

                <Separator className='opacity-60' />

                {/* Stage history */}
                <div className='space-y-3'>
                  <div>
                    <h3 className='text-sm font-semibold tracking-tight'>
                      Stage history
                    </h3>
                    <p className='text-muted-foreground text-[0.75rem]'>
                      Timeline of each AUCA stage with visits, tasks, actions &
                      documents.
                    </p>
                  </div>

                  {Array.isArray(stages) && stages.length > 0 ? (
                    <div className='max-h-96 space-y-3 overflow-y-auto pr-1 text-xs'>
                      {stages
                        .slice()
                        .sort(
                          (a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0)
                        )
                        .map((stage) => {
                          const status = deriveStageStatus(stage)

                          const lastVisit =
                            stage.visits?.[stage.visits.length - 1]
                          const start = lastVisit?.enteredAt ?? null
                          const end = lastVisit?.exitedAt ?? null
                          const duration = end
                            ? formatDuration(start, end)
                            : stage.current
                              ? formatDuration(start, new Date().toISOString())
                              : '-'

                          const lastTask = stage.tasks?.[stage.tasks.length - 1]
                          const actedBy =
                            lastTask?.actedBy ??
                            lastVisit?.exitedBy ??
                            lastVisit?.enteredBy ??
                            null
                          const lastAction =
                            stage.actions?.[stage.actions.length - 1]

                          return (
                            <div
                              key={stage.stageKey}
                              className='from-background to-muted/40 hover:bg-muted/40 rounded-xl border bg-gradient-to-b p-3 shadow-sm transition'
                            >
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <div className='min-w-0'>
                                  <p className='truncate text-xs font-semibold'>
                                    {stage.stageOrder}.{' '}
                                    {stage.stageName ??
                                      stage.stageKey ??
                                      'Stage'}
                                  </p>
                                  <p className='text-muted-foreground text-[0.7rem]'>
                                    {actedBy
                                      ? `Last handled by ${actedBy}`
                                      : stage.current
                                        ? 'In progress'
                                        : 'Not started'}
                                  </p>
                                </div>

                                <div className='flex items-center gap-2'>
                                  {stage.current && (
                                    <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
                                      Current
                                    </Badge>
                                  )}
                                  <Badge
                                    variant='outline'
                                    className={stageStatusBadgeClass(status)}
                                  >
                                    {status}
                                  </Badge>
                                </div>
                              </div>

                              <div className='mt-3 grid gap-2 text-[0.7rem] sm:grid-cols-3'>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>Start</p>
                                  <p className='mt-0.5'>{fmtDT(start)}</p>
                                </div>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>End</p>
                                  <p className='mt-0.5'>{fmtDT(end)}</p>
                                </div>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>
                                    Duration
                                  </p>
                                  <p className='mt-0.5'>{duration}</p>
                                </div>
                              </div>

                              <div className='mt-3 grid gap-2 text-[0.7rem] sm:grid-cols-3'>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>
                                    SLA (days)
                                  </p>
                                  <p className='mt-0.5'>
                                    {stage.slaDays ?? '-'}
                                  </p>
                                </div>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>Task</p>
                                  <p className='mt-0.5'>
                                    {lastTask
                                      ? `${lastTask.status} (Due: ${fmtDT(lastTask.dueAt)})`
                                      : '-'}
                                  </p>
                                </div>
                                <div className='bg-background/60 rounded-lg border p-2'>
                                  <p className='text-muted-foreground'>
                                    Last action
                                  </p>
                                  <p className='mt-0.5'>
                                    {lastAction?.trigger
                                      ? `${lastAction.trigger} by ${lastAction.changedBy ?? '-'}`
                                      : '-'}
                                  </p>
                                </div>
                              </div>

                              <div className='mt-3 flex flex-wrap gap-3 text-[0.7rem]'>
                                <span className='text-muted-foreground'>
                                  Visits:{' '}
                                  <span className='font-medium'>
                                    {stage.visits?.length ?? 0}
                                  </span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Actions:{' '}
                                  <span className='font-medium'>
                                    {stage.actions?.length ?? 0}
                                  </span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Documents:{' '}
                                  <span className='font-medium'>
                                    {stage.documents?.length ?? 0}
                                  </span>
                                </span>
                                <span className='text-muted-foreground'>
                                  Tasks:{' '}
                                  <span className='font-medium'>
                                    {stage.tasks?.length ?? 0}
                                  </span>
                                </span>
                              </div>

                              {/* Documents list */}
                              {Array.isArray(stage.documents) &&
                                stage.documents.length > 0 && (
                                  <div className='bg-background/60 mt-3 rounded-lg border p-3'>
                                    <p className='text-[0.75rem] font-medium'>
                                      Documents
                                    </p>
                                    <div className='mt-2 space-y-2'>
                                      {stage.documents.map((d, idx) => (
                                        <div
                                          key={`${stage.stageKey}-${idx}`}
                                          className='flex items-center justify-between gap-3'
                                        >
                                          <div className='min-w-0'>
                                            <p className='truncate text-[0.7rem] font-medium'>
                                              {d.documentName ??
                                                d.documentType ??
                                                'Document'}
                                            </p>
                                            <p className='text-muted-foreground text-[0.65rem]'>
                                              {d.uploadedAt
                                                ? `Uploaded: ${fmtDT(d.uploadedAt)}`
                                                : '—'}
                                            </p>
                                          </div>
                                          <Button
                                            type='button'
                                            variant='outline'
                                            size='sm'
                                            className='text-[0.7rem]'
                                            onClick={() =>
                                              window.open(
                                                `${BASE_URL}/${d.url}`,
                                                '_blank',
                                                'noopener,noreferrer'
                                              )
                                            }
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
                      No stage history available yet.
                    </p>
                  )}
                </div>

                {/* Instance timeline */}
                <div className='space-y-3'>
                  <div>
                    <h3 className='text-sm font-semibold tracking-tight'>
                      Instance timeline
                    </h3>
                    <p className='text-muted-foreground text-[0.75rem]'>
                      Events recorded for this workflow instance.
                    </p>
                  </div>

                  {Array.isArray(history) && history.length > 0 ? (
                    <div className='from-background to-muted/40 rounded-xl border bg-gradient-to-b p-3 shadow-sm'>
                      <div className='space-y-2 text-[0.75rem]'>
                        {history
                          .slice()
                          .sort(
                            (a, b) => (safeMs(a.at) ?? 0) - (safeMs(b.at) ?? 0)
                          )
                          .map((h, idx) => (
                            <div
                              key={idx}
                              className='flex items-start justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0'
                            >
                              <div className='min-w-0'>
                                <p className='truncate font-medium'>
                                  {h.stageName ?? h.stageKey ?? 'Stage change'}
                                </p>
                                <p className='text-muted-foreground'>
                                  {h.details ?? '-'}
                                </p>
                              </div>
                              <span className='text-muted-foreground shrink-0'>
                                {fmtDT(h.at)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-xs'>
                      No timeline events yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='bg-background/70 border-t px-5 py-4 sm:px-6'>
            <div className='ml-auto flex justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
