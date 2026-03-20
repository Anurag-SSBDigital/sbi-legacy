import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useLocation } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import JSZip from 'jszip'
import { ChevronRight, DownloadIcon, Eye } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { $api, BASE_URL, fetchClient } from '@/lib/api'
import { toastError } from '@/lib/utils'
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
  DialogTrigger,
  DialogClose,
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
  type PaginatedTableProps,
} from '@/components/paginated-table'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import {
  AccountNoCell,
  CurrencyCell,
  TooltipCell,
} from '@/components/table/cells'
import { ThemeSwitch } from '@/components/theme-switch'

/* =========================================
    Types
  ========================================= */

type SarfaesiEligibleAccountRow = {
  id?: number
  acctNo?: string | null
  custName?: string | null
  telNo?: string | null
  outstand?: number | null
  add1?: string | null
  add2?: string | null
  add3?: string | null
  add4?: string | null
  newIrac?: number | string | null
  branchCode?: string | null
  city?: string | null
  sarfaesiEligible?: boolean | null
  sarfaesiStatus?: string | null

  approvalDone?: boolean | null
  performaCompleted?: boolean | null
  initiationDone?: boolean | null
}

type SarfaesiEligibleListApiResponse =
  components['schemas']['ApiResponsePageResponseSarfaesiEligibleAccountStatusDTO']

/* =========================================
    Stage-wise summary helpers (NO any)
  ========================================= */

type WithData<T> = { data: T }
const hasData = <T,>(v: unknown): v is WithData<T> =>
  typeof v === 'object' && v !== null && 'data' in v

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
  stage: RaStage
): 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' => {
  if (stage.current) return 'IN_PROGRESS'
  const hasCompletedTask = stage.tasks?.some(
    (t) => String(t.status).toUpperCase() === 'COMPLETED'
  )
  const hasExit = stage.visits?.some((v) => !!v.exitedAt)
  if (hasCompletedTask || hasExit) return 'COMPLETED'
  return 'PENDING'
}

/** ✅ skip any stageKey that contains APPROVAL */
const shouldSkipStageKey = (stageKey?: string | null) => {
  const s = String(stageKey ?? '').toUpperCase()
  return s.includes('APPROVAL')
}

/** Content-Disposition filename parser */
const parseFilenameFromContentDisposition = (cd: string) => {
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd ?? '')
  const raw = match?.[1] || match?.[2] || ''
  try {
    return raw ? decodeURIComponent(raw) : ''
  } catch {
    return raw
  }
}

/** Download helper */
const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const objectUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(objectUrl)
}

/* =========================================
    Columns
  ========================================= */

const columns: PaginatedTableProps<SarfaesiEligibleAccountRow>['columns'] = [
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

/* =========================================
    Route
  ========================================= */

export const Route = createFileRoute('/_authenticated/sarfaesi/eligible')({
  component: RouteComponent,
})

function RouteComponent() {
  const location = useLocation()
  const [query, setQuery] = useState('')

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const [selectedAccountNumber, setSelectedAccountNumber] = useState<
    string | null
  >(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  /** ========= download progress for ZIP ========= */
  const [downloadingSummary, setDownloadingSummary] = useState(false)
  const [downloadingStageKey, setDownloadingStageKey] = useState<string | null>(
    null
  )
  const [downloadingProposalAcctNo, setDownloadingProposalAcctNo] = useState<
    string | null
  >(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    done: number
    total: number
    label: string
  } | null>(null)

  async function downloadPdfViaClient(args: {
    accountNumber: string
    stageKey: string
    stageName?: string
  }) {
    const { accountNumber, stageKey, stageName } = args

    const res = await fetchClient.POST(
      '/api/sarfaesi/pdf/generate/{accountNumber}/{stageKey}',
      {
        params: {
          path: {
            accountNumber: String(accountNumber),
            stageKey: String(stageKey),
          },
        },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Failed with status ${status ?? 'unknown'}`)
    }

    const blob = res.data as Blob

    const cd = res.response.headers.get('content-disposition') ?? ''
    const filenameFromHeader = parseFilenameFromContentDisposition(cd)

    const fallbackName = `${accountNumber}-${stageKey}${
      stageName ? `-${String(stageName).replace(/\s+/g, '_')}` : ''
    }.pdf`

    const filename = filenameFromHeader || fallbackName

    downloadBlobAsFile(blob, filename)
  }

  async function downloadProposalCumControlPdf(args: {
    accountNumber: string
  }) {
    const { accountNumber } = args

    const res = await fetchClient.GET(
      '/api/sarfaesi/pdf/{accountNo}/proposal-cum-control-pdf',
      {
        params: { path: { accountNo: String(accountNumber) } },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Failed with status ${status ?? 'unknown'}`)
    }

    const blob = res.data as Blob

    const cd = res.response.headers.get('content-disposition') ?? ''
    const filenameFromHeader = parseFilenameFromContentDisposition(cd)

    const fallbackName = `Sarfaesi-${accountNumber}-Proposal-Cum-Control.pdf`
    const filename = filenameFromHeader || fallbackName

    downloadBlobAsFile(blob, filename)
  }

  const handleDownloadProposalCumControl = async (accountNumber: string) => {
    if (!accountNumber) return
    try {
      setDownloadingProposalAcctNo(accountNumber)
      await downloadProposalCumControlPdf({ accountNumber })
      toast.success('Proposal Cum Control PDF downloaded')
    } catch (e) {
      toastError(e, 'Failed to download Proposal Cum Control PDF')
    } finally {
      setDownloadingProposalAcctNo(null)
    }
  }

  async function downloadSummaryReport(args: { accountNumber: string }) {
    const { accountNumber } = args

    // ✅ uses your existing fetchClient (recommended) so auth/headers stay consistent
    const res = await fetchClient.GET(
      '/api/sarfaesi/{acctNo}/combined-report.pdf',
      {
        params: { path: { acctNo: String(accountNumber) } },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Failed with status ${status ?? 'unknown'}`)
    }

    const blob = res.data as Blob

    const cd = res.response.headers.get('content-disposition') ?? ''
    const filenameFromHeader = parseFilenameFromContentDisposition(cd)

    const fallbackName = `Sarfaesi-${accountNumber}-Summary-Report.pdf`
    const filename = filenameFromHeader || fallbackName

    downloadBlobAsFile(blob, filename)
  }

  /** ========= Blob fetchers for ZIP ========= */

  async function fetchStagePdfBlob(args: {
    accountNumber: string
    stageKey: string
  }) {
    const { accountNumber, stageKey } = args

    const res = await fetchClient.POST(
      '/api/sarfaesi/pdf/generate/{accountNumber}/{stageKey}',
      {
        params: {
          path: {
            accountNumber: String(accountNumber),
            stageKey: String(stageKey),
          },
        },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(
        `Stage PDF failed (${stageKey}) status ${status ?? 'unknown'}`
      )
    }

    const cd = res.response.headers.get('content-disposition') ?? ''
    const filenameFromHeader = parseFilenameFromContentDisposition(cd)

    return { blob: res.data as Blob, filenameFromHeader }
  }

  async function fetchSummaryPdfBlob(args: { accountNumber: string }) {
    const { accountNumber } = args

    const res = await fetchClient.GET(
      '/api/sarfaesi/{acctNo}/combined-report.pdf',
      {
        params: { path: { acctNo: String(accountNumber) } },
        parseAs: 'blob',
      }
    )

    if (!res.response?.ok || !res.data) {
      const status = res.response?.status
      throw new Error(`Summary PDF failed status ${status ?? 'unknown'}`)
    }

    const cd = res.response.headers.get('content-disposition') ?? ''
    const filenameFromHeader = parseFilenameFromContentDisposition(cd)

    return { blob: res.data as Blob, filenameFromHeader }
  }

  async function downloadAllReportsAsZip(args: {
    accountNumber: string
    stages: RaStage[]
  }) {
    const { accountNumber, stages } = args
    if (!accountNumber) throw new Error('Missing accountNumber')

    const completedStages = (stages ?? [])
      .slice()
      .sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
      .filter((s) => deriveStageStatus(s) === 'COMPLETED')
      .filter((s) => !shouldSkipStageKey(s.stageKey)) // ✅ skip APPROVAL
      .filter((s) => !!s.stageKey)

    const totalItems = 1 + completedStages.length // summary + eligible stages
    const zip = new JSZip()

    setDownloadProgress({
      done: 0,
      total: totalItems,
      label: 'Fetching summary…',
    })
    const summary = await fetchSummaryPdfBlob({ accountNumber })
    const summaryName =
      summary.filenameFromHeader ||
      `Sarfaesi-${accountNumber}-Summary-Report.pdf`
    zip.file(`00-SUMMARY/${summaryName}`, summary.blob)
    setDownloadProgress({ done: 1, total: totalItems, label: 'Summary added' })

    // Sequential fetch (safer for backend)
    for (let i = 0; i < completedStages.length; i++) {
      const s = completedStages[i]
      const stageKey = String(s.stageKey)
      const stageOrder = String(s.stageOrder ?? i + 1).padStart(2, '0')

      const stageNameSafe = String(s.stageName ?? stageKey)
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')

      setDownloadProgress({
        done: 1 + i,
        total: totalItems,
        label: `Fetching ${stageOrder}-${stageNameSafe}…`,
      })

      try {
        const { blob, filenameFromHeader } = await fetchStagePdfBlob({
          accountNumber,
          stageKey,
        })

        const fallback = `${accountNumber}-${stageKey}-${stageNameSafe}.pdf`
        const fileName = filenameFromHeader || fallback

        zip.file(`01-STAGES/${stageOrder}-${fileName}`, blob)
      } catch (e) {
        // Don’t kill whole ZIP for one failure
        toastError(e, `Failed stage: ${s.stageName ?? s.stageKey}`)
      }

      setDownloadProgress({
        done: 1 + i + 1,
        total: totalItems,
        label: `Added ${stageOrder}-${stageNameSafe}`,
      })
    }

    setDownloadProgress({
      done: totalItems,
      total: totalItems,
      label: 'Generating ZIP…',
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const zipName = `Sarfaesi-${accountNumber}-Reports.zip`
    downloadBlobAsFile(zipBlob, zipName)
  }

  const handleDownloadSummaryReport = async () => {
    if (!selectedAccountNumber) return
    try {
      setDownloadingSummary(true)
      await downloadSummaryReport({ accountNumber: selectedAccountNumber })
      toast.success('Summary report downloaded')
    } catch (e) {
      toastError(e, 'Failed to download summary report')
    } finally {
      setDownloadingSummary(false)
    }
  }

  const handleDownloadStagePdf = async (
    stageKey: string,
    stageName?: string
  ) => {
    if (!selectedAccountNumber) return
    try {
      setDownloadingStageKey(stageKey)
      await downloadPdfViaClient({
        accountNumber: selectedAccountNumber,
        stageKey,
        stageName,
      })
      toast.success('PDF downloaded')
    } catch (e) {
      toastError(e, 'Failed to download PDF')
    } finally {
      setDownloadingStageKey(null)
    }
  }

  const handleDownloadAllZip = async (stages: RaStage[]) => {
    if (!selectedAccountNumber) return
    try {
      setDownloadingAll(true)
      await downloadAllReportsAsZip({
        accountNumber: selectedAccountNumber,
        stages,
      })
      toast.success('ZIP downloaded')
    } catch (e) {
      toastError(e, 'Failed to download ZIP')
    } finally {
      setDownloadingAll(false)
      setDownloadProgress(null)
    }
  }

  // ===== List API =====
  const {
    data: listResponse,
    isLoading,
    isFetching,
    error,
    refetch: refetchList,
  } = $api.useQuery('get', '/sarfaesi/eligible-accounts', {
    params: {
      query: { branchId: 'null', page: 0, size: 1000000000 },
      header: { Authorization: '' },
    },
  })

  useEffect(() => {
    refetchList?.()
  }, [location.href, refetchList])

  // ===== Account details =====
  const { data: accountDetails, isLoading: accountDetailsLoading } =
    $api.useQuery(
      'get',
      '/sarfaesi/SarfaesiAccount/{acctNo}',
      { params: { path: { acctNo: String(selectedAccountNumber) } } },
      { enabled: !!selectedAccountNumber }
    )

  // ✅ ONLY stage-wise-summary (old stage-summary removed)
  const { data: stageWiseSummary, isLoading: stageWiseLoading } = $api.useQuery(
    'get',
    '/api/sarfaesi/{accountNumber}/stage-wise-summary',
    { params: { path: { accountNumber: String(selectedAccountNumber) } } },
    { enabled: !!selectedAccountNumber }
  )

  const { data: status, isLoading: statusLoading } = $api.useQuery(
    'get',
    '/api/sarfaesi/{accountNumber}/status',
    { params: { path: { accountNumber: String(selectedAccountNumber) } } },
    { enabled: !!selectedAccountNumber }
  )

  // ===== Extract rows from API shape =====
  const { accounts, totalCount } = useMemo(() => {
    if (!listResponse?.data) {
      return { accounts: [] as SarfaesiEligibleAccountRow[], totalCount: 0 }
    }

    const body = listResponse as SarfaesiEligibleListApiResponse
    const inner = body.data
    const wrappedRows = inner?.content ?? []

    const flattened: SarfaesiEligibleAccountRow[] = wrappedRows
      .map((item) => {
        const acc = item.account ?? {}
        return {
          ...acc,
          approvalDone: item.approvalDone ?? null,
          performaCompleted: item.performaCompleted ?? null,
          initiationDone: item.initiationDone ?? null,
        }
      })
      .filter((row) => row.acctNo)

    const total = inner?.totalElements ?? flattened.length
    return { accounts: flattened, totalCount: total }
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
        row.sarfaesiStatus,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accounts, query])

  const progress = isLoading || isFetching ? 70 : 100

  const initiateSarfaesiMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/{accountNumber}/initiate',
    {
      onSuccess: (res) => {
        toast.success(res?.message ?? 'Sarfaesi initiated successfully')
        refetchList?.()
      },
      onError: (err) => {
        toastError(err, 'Failed to initiate Sarfaesi')
      },
    }
  )

  const initiateSarfaesi = (accountNumber: string) => {
    initiateSarfaesiMutation.mutate({
      params: { path: { accountNumber }, header: { Authorization: '' } },
    })
  }

  const accountData = accountDetails?.data
  const statusData = status
  const loadingDetails =
    accountDetailsLoading || stageWiseLoading || statusLoading

  const selectedRow = useMemo(
    () => accounts.find((row) => row.acctNo === selectedAccountNumber) ?? null,
    [accounts, selectedAccountNumber]
  )

  const handleOpenDetails = (accountNumber: string) => {
    setSelectedAccountNumber(accountNumber)
    setDetailsDialogOpen(true)
  }

  const stageSummary: RaStageWiseSummaryResponse | null = useMemo(() => {
    if (!stageWiseSummary) return null
    if (hasData<RaStageWiseSummaryResponse>(stageWiseSummary))
      return stageWiseSummary.data
    return stageWiseSummary as unknown as RaStageWiseSummaryResponse
  }, [stageWiseSummary])

  const stages: RaStage[] = stageSummary?.stages ?? []
  const history: RaHistoryItem[] = stageSummary?.history ?? []

  return (
    <>
      <Header>
        {isBranchDropdownVisible && (
          <div className='text-muted-foreground text-xs'>
            {/* branch filter not applied */}
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
          currentPage={{ type: 'label', label: 'SARFAESI Eligible Accounts' }}
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
            Error fetching eligible SARFAESI accounts:{' '}
            {String((error as Error).message)}
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No SARFAESI eligible accounts available.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  SARFAESI Eligible Accounts ({filteredData.length} accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total eligible (server): {totalCount} | Fetched:{' '}
                  {accounts.length} | Total outstanding:{' '}
                  {outstandingStats.total.toFixed(2)} | Min:{' '}
                  {outstandingStats.min.toFixed(2)} | Max:{' '}
                  {outstandingStats.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='searchEligible' className='sr-only'>
                  Search eligible SARFAESI accounts
                </Label>
                <Input
                  id='searchEligible'
                  placeholder='Search by account, name, mobile...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='max-w-sm border-gray-300 focus:border-blue-500'
                  aria-label='Search eligible SARFAESI accounts'
                />
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable<SarfaesiEligibleAccountRow>
                frameless
                showSearch={false}
                data={filteredData}
                columns={columns}
                emptyMessage='No SARFAESI eligible accounts to show.'
                renderActions={(row) => {
                  if (!row.acctNo) return null

                  const approvalDone = row.approvalDone === true
                  const performaCompleted = row.performaCompleted === true
                  const initiationDone = row.initiationDone === true

                  const baseButtonClass =
                    'inline-flex items-center gap-1.5 border-[var(--primary)] text-xs font-medium ' +
                    'text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white ' +
                    'dark:text-white'

                  const viewButton = (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='inline-flex items-center gap-1.5 text-xs font-medium'
                      onClick={() => handleOpenDetails(String(row.acctNo))}
                    >
                      <Eye className='h-3 w-3' />
                      <span>View</span>
                    </Button>
                  )

                  const proposalPdfButton =
                    approvalDone && performaCompleted ? (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className={baseButtonClass}
                        onClick={() =>
                          handleDownloadProposalCumControl(String(row.acctNo))
                        }
                        disabled={
                          downloadingProposalAcctNo === String(row.acctNo) ||
                          downloadingAll ||
                          downloadingSummary
                        }
                        title='Download Proposal Cum Control PDF'
                      >
                        <DownloadIcon className='h-3 w-3' />
                        <span>
                          {downloadingProposalAcctNo === String(row.acctNo)
                            ? 'Downloading...'
                            : 'Proposal Cum Control'}
                        </span>
                      </Button>
                    ) : null

                  if (!approvalDone) {
                    return (
                      <div className='flex flex-row justify-end gap-1'>
                        <Link
                          to='/sarfaesi/sarfaesi-approval-initiation'
                          search={{ acctNo: row.acctNo as string }}
                        >
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className={baseButtonClass}
                          >
                            <span>Initiate Approval</span>
                            <ChevronRight className='h-3 w-3' />
                          </Button>
                        </Link>
                        {viewButton}
                      </div>
                    )
                  }

                  if (approvalDone && !performaCompleted) {
                    return (
                      <div className='flex flex-row justify-end gap-1'>
                        <Link
                          to='/sarfaesi/proforma'
                          search={{ acctNo: String(row.acctNo) }}
                        >
                          <Button
                            variant='outline'
                            size='sm'
                            className={baseButtonClass}
                          >
                            <span>Proforma</span>
                            <ChevronRight className='h-3 w-3' />
                          </Button>
                        </Link>
                        {viewButton}
                      </div>
                    )
                  }

                  if (approvalDone && performaCompleted && !initiationDone) {
                    return (
                      <div className='flex flex-row justify-end gap-1'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              className={baseButtonClass}
                            >
                              <span>Initiate SARFAESI</span>
                              <ChevronRight className='h-3 w-3' />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className='max-w-md'>
                            <DialogHeader>
                              <DialogTitle>Initiate SARFAESI?</DialogTitle>
                              <DialogDescription>
                                You are about to initiate SARFAESI for account{' '}
                                <span className='font-semibold'>
                                  {row.acctNo}
                                </span>
                                {row.custName && (
                                  <>
                                    {' '}
                                    (borrower:{' '}
                                    <span className='font-semibold'>
                                      {row.custName}
                                    </span>
                                    )
                                  </>
                                )}
                                .
                              </DialogDescription>
                            </DialogHeader>

                            <DialogFooter className='flex justify-end gap-2'>
                              <DialogClose asChild>
                                <Button variant='outline' size='sm'>
                                  Cancel
                                </Button>
                              </DialogClose>

                              <DialogClose asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className={baseButtonClass}
                                  onClick={() =>
                                    initiateSarfaesi(String(row.acctNo))
                                  }
                                  disabled={initiateSarfaesiMutation.isPending}
                                >
                                  <span>
                                    {initiateSarfaesiMutation.isPending
                                      ? 'Initiating...'
                                      : 'Confirm & Initiate'}
                                  </span>
                                  <ChevronRight className='h-3 w-3' />
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {viewButton}
                      </div>
                    )
                  }

                  return (
                    <div className='flex flex-row justify-end gap-2'>
                      <Badge className='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                        Initiated
                      </Badge>
                      {proposalPdfButton}
                      {viewButton}
                    </div>
                  )
                }}
              />
            </CardContent>
          </Card>
        )}
      </Main>

      {/* ========= Details Dialog (Stage-wise summary) ========= */}
      <Dialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          setDetailsDialogOpen(open)
        }}
      >
        <DialogContent className='bg-background/95 flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop-blur sm:w-[calc(100vw-2rem)] sm:max-w-6xl'>
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
                      {selectedRow?.acctNo ?? selectedAccountNumber ?? '-'}
                    </span>
                    {selectedRow?.custName && (
                      <span className='text-muted-foreground hidden max-w-[28rem] truncate text-sm font-medium sm:inline'>
                        {selectedRow.custName}
                      </span>
                    )}
                  </span>
                </DialogTitle>

                {selectedRow?.custName && (
                  <p className='text-muted-foreground truncate text-xs font-medium sm:hidden'>
                    {selectedRow.custName}
                  </p>
                )}

                <DialogDescription className='text-xs sm:text-sm'>
                  Combined view of core account information, SARFAESI process
                  status, and stage-wise history.
                </DialogDescription>
              </div>

              <div className='flex flex-col gap-2'>
                {stageSummary?.instanceStatus && (
                  <Badge variant='outline' className='text-[0.7rem]'>
                    Instance: {stageSummary.instanceStatus}
                  </Badge>
                )}

                {/* ZIP progress mini indicator */}
                {downloadProgress && (
                  <div className='bg-background/60 rounded-lg border px-2 py-1 text-[0.7rem]'>
                    <div className='text-muted-foreground'>
                      {downloadProgress.label}
                    </div>
                    <div className='mt-0.5 font-medium'>
                      {downloadProgress.done}/{downloadProgress.total}
                    </div>
                  </div>
                )}

                {selectedAccountNumber && (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='text-[0.7rem]'
                      onClick={handleDownloadSummaryReport}
                      disabled={downloadingSummary || downloadingAll}
                    >
                      <DownloadIcon />
                      {downloadingSummary ? 'Downloading…' : 'Summary Report'}
                    </Button>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='text-[0.7rem]'
                      onClick={() => handleDownloadAllZip(stages)}
                      disabled={
                        downloadingAll ||
                        downloadingSummary ||
                        !selectedAccountNumber
                      }
                      title='Downloads Summary + all COMPLETED stage PDFs (skips APPROVAL stages) as one ZIP'
                    >
                      <DownloadIcon />
                      {downloadingAll ? 'Preparing ZIP…' : 'Download All (ZIP)'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className='via-border pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent' />
          </DialogHeader>

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

                    {accountData ? (
                      <div className='grid gap-3 text-xs sm:grid-cols-2'>
                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>Borrower</p>
                          <p className='mt-1 font-medium'>
                            {accountData.custName || '-'}
                          </p>
                          <p className='text-muted-foreground mt-1'>
                            CIF: {accountData.custNumber || '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>Branch</p>
                          <p className='mt-1 font-medium'>
                            {accountData.branchCode || '-'}
                          </p>
                          <p className='text-muted-foreground mt-1'>
                            City: {accountData.city || '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>
                            Outstanding / Limit
                          </p>
                          <p className='mt-1 text-sm font-semibold'>
                            {accountData.outstand?.toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            }) ?? '-'}{' '}
                            {accountData.currency || ''}
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Limit:{' '}
                            {accountData.loanLimit?.toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            }) ?? '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3'>
                          <p className='text-muted-foreground'>NPA / IRAC</p>
                          <p className='mt-1 font-medium'>
                            IRAC: {accountData.newIrac ?? '-'}
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            NPA Date: {accountData.npaDt ?? '-'}
                          </p>
                        </div>

                        <div className='bg-background/60 rounded-lg border p-3 sm:col-span-2'>
                          <div className='grid gap-3 sm:grid-cols-3'>
                            <div>
                              <p className='text-muted-foreground'>Sanction</p>
                              <p className='mt-1'>
                                {accountData.sanctDt ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Renewal</p>
                              <p className='mt-1'>
                                {accountData.renewalDt ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Due date</p>
                              <p className='mt-1'>{accountData.dueDt ?? '-'}</p>
                            </div>
                          </div>

                          <div className='mt-3 border-t pt-3'>
                            <p className='text-muted-foreground'>Address</p>
                            <p className='mt-1 text-xs'>
                              {[
                                accountData.add1,
                                accountData.add2,
                                accountData.add3,
                              ]
                                .filter(Boolean)
                                .join(', ') || '-'}
                            </p>
                            <p className='mt-1 text-xs'>
                              {accountData.city
                                ? `${accountData.city}, ${accountData.state ?? ''}`
                                : (accountData.state ?? '')}
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

                  {/* SARFAESI status */}
                  <div className='from-muted/40 to-background rounded-xl border bg-gradient-to-b p-4 shadow-sm'>
                    <div className='mb-3 flex items-center justify-between gap-2'>
                      <h3 className='text-sm font-semibold tracking-tight'>
                        SARFAESI status
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
                        SARFAESI process not yet initiated for this account.
                      </p>
                    )}
                  </div>
                </div>

                <Separator className='opacity-60' />

                {/* Stage history (stage-wise) */}
                <div className='space-y-3'>
                  <div>
                    <h3 className='text-sm font-semibold tracking-tight'>
                      Stage history
                    </h3>
                    <p className='text-muted-foreground text-[0.75rem]'>
                      Timeline of each stage with visits, tasks, actions &
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

                          const isApprovalSkipped = shouldSkipStageKey(
                            stage.stageKey
                          )

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
                                  {status === 'COMPLETED' &&
                                    !isApprovalSkipped && (
                                      <Button
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        className='text-[0.7rem]'
                                        onClick={() =>
                                          handleDownloadStagePdf(
                                            stage.stageKey,
                                            stage.stageName
                                          )
                                        }
                                        disabled={
                                          downloadingStageKey ===
                                            stage.stageKey || downloadingAll
                                        }
                                      >
                                        {downloadingStageKey === stage.stageKey
                                          ? 'Downloading...'
                                          : 'Download PDF'}
                                      </Button>
                                    )}

                                  {status === 'COMPLETED' &&
                                    isApprovalSkipped && (
                                      <Badge
                                        variant='outline'
                                        className='text-[0.7rem]'
                                      >
                                        APPROVAL stage (skipped)
                                      </Badge>
                                    )}

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

                              {/* Documents */}
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
                                            disabled={downloadingAll}
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
              <DialogClose asChild>
                <Button variant='outline' size='sm' disabled={downloadingAll}>
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
