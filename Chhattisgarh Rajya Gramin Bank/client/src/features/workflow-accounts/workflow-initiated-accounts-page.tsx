import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { Download, Loader2 } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api, BASE_URL } from '@/lib/api.ts'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx'
import { Home } from '@/components/breadcrumb/common-crumbs.ts'
import { Header } from '@/components/layout/header.tsx'
import { Main } from '@/components/layout/main.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown.tsx'
import { Search } from '@/components/search.tsx'
import ServerPaginatedTable, {
  PaginatedTableColumns,
  ServerTableQuery,
} from '@/components/server-paginated-table.tsx'
import {
  AccountNoCell,
  CurrencyCell,
  TooltipCell,
} from '@/components/table/cells.ts'
import { ThemeSwitch } from '@/components/theme-switch.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { getWorkflowDefKeyByProcessCode } from '@/features/process-settings/process-setting-utils.ts'
import {
  downloadGeneratedWorkflowDocument,
  getWorkflowInstanceByBusinessV2,
  getWorkflowTaskUi,
  getWorkflowInstanceUi,
  type WorkflowTaskUi,
} from '@/features/workflow-runtime/workflow-runtime-api'

type AccountRow = components['schemas']['AccountListDto2']

type WorkflowInstanceResolution = {
  instanceId: number
  businessKey: string
  currentStage?: string
  status?: string
}

type GeneratedStageDocItem = {
  taskId: number
  stageLabel: string
  stageOrder: number
  code?: string
  label?: string
  mode?: string
  docType?: string
  templateKey?: string
  templateVersion?: number
}

type GeneratedStageDocGroup = {
  stageLabel: string
  stageOrder: number
  items: GeneratedStageDocItem[]
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// const safeJsonStringify = (value: unknown) => {
//   try {
//     return JSON.stringify(value ?? {}, null, 2)
//   } catch {
//     return '{}'
//   }
// }

const resolveWorkflowDocumentUrl = (url?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = (BASE_URL ?? '').trim().replace(/\/+$/, '')
  if (!base) return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const statusVariant = (status?: string) => {
  const normalized = (status ?? '').toUpperCase()
  if (normalized === 'CURRENT' || normalized === 'RUNNING') return 'default'
  if (normalized === 'COMPLETED' || normalized === 'APPROVED')
    return 'secondary'
  if (
    normalized === 'REJECTED' ||
    normalized === 'EXPIRED' ||
    normalized === 'FAILED'
  ) {
    return 'destructive'
  }
  return 'outline'
}

const columns: PaginatedTableColumns<AccountRow>[] = [
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
  {
    key: 'add4',
    label: 'City',
    render: (value) => <span>{value ?? '-'}</span>,
  },
  {
    key: 'newIrac',
    label: 'IRAC Code',
    render: (value) => <span>{value ?? '-'}</span>,
  },
] as const

export type WorkflowInitiatedAccountsPageProps = {
  processCode: string
  processName: string
}

type ReadableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadableValue[]
  | { [key: string]: ReadableValue }

const toReadableLabel = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatReadableValue = (value: ReadableValue): string => {
  if (value === null || value === undefined || value === '') return '—'

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '—'
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '—'

    const parsedDate = new Date(trimmed)
    if (
      !Number.isNaN(parsedDate.getTime()) &&
      /(\d{4}-\d{2}-\d{2}|T\d{2}:\d{2})/.test(trimmed)
    ) {
      return formatDateTime(trimmed)
    }

    return trimmed
  }

  return String(value)
}

function ReadableFields({
  data,
  level = 0,
}: {
  data: ReadableValue
  level?: number
}) {
  if (
    data === null ||
    data === undefined ||
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return <p className='text-sm'>{formatReadableValue(data)}</p>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className='text-muted-foreground text-sm'>No values</p>
    }

    return (
      <div className='space-y-2'>
        {data.map((item, index) => {
          const isPrimitive =
            item === null ||
            item === undefined ||
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'

          return (
            <div key={index} className='bg-muted/20 rounded-md border p-3'>
              {isPrimitive ? (
                <div className='text-sm'>{formatReadableValue(item)}</div>
              ) : (
                <>
                  <p className='text-muted-foreground mb-2 text-xs font-medium'>
                    Item {index + 1}
                  </p>
                  <ReadableFields data={item} level={level + 1} />
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const entries = Object.entries(data)
  if (entries.length === 0) {
    return <p className='text-muted-foreground text-sm'>No values available</p>
  }

  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {entries.map(([key, value]) => {
        const isNestedObject =
          value !== null && typeof value === 'object' && !Array.isArray(value)

        const isArray = Array.isArray(value)

        return (
          <div
            key={key}
            className={isNestedObject || isArray ? 'md:col-span-2' : ''}
          >
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground mb-1 text-xs font-medium'>
                {toReadableLabel(key)}
              </p>

              {isNestedObject || isArray ? (
                <ReadableFields data={value} level={level + 1} />
              ) : (
                <p className='text-sm font-medium break-words'>
                  {formatReadableValue(value)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function WorkflowInitiatedAccountsPage({
  processCode,
  processName,
}: WorkflowInitiatedAccountsPageProps) {
  const navigate = useNavigate()
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [selectedWorkflowAccount, setSelectedWorkflowAccount] =
    useState<AccountRow | null>(null)
  const [downloadingDocKey, setDownloadingDocKey] = useState<string | null>(
    null
  )

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const effectiveBranchId =
    !branchId || branchId === 'all' ? 'null' : String(branchId)
  const params = useMemo(
    () => ({
      header: {
        Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
      },
      query: {
        processCode,
        branchId: effectiveBranchId,
        page: pageIndex,
        size: pageSize,
      },
    }),
    [effectiveBranchId, pageIndex, pageSize, processCode]
  )

  const selectedAccountNo = useMemo(() => {
    const raw = selectedWorkflowAccount?.acctNo
    return raw != null && String(raw).trim() ? String(raw).trim() : ''
  }, [selectedWorkflowAccount])

  const {
    data: listResponse,
    isLoading,
    isFetching,
    error,
    refetch: refetchInitiatedAccounts,
  } = $api.useQuery(
    'get',
    '/workflow/initiatedaccountlist',
    { params },
    {
      placeholderData: (previousData) => previousData,
    }
  )

  const {
    data: processSettingsResponse,
    isLoading: isProcessSettingsLoading,
    error: processSettingsError,
  } = $api.useQuery('get', '/api/process-settings/getAll', {})

  const workflowDefKey = useMemo(
    () =>
      getWorkflowDefKeyByProcessCode(
        processSettingsResponse as unknown,
        processCode
      ),
    [processCode, processSettingsResponse]
  )

  const workflowInstanceQuery = useQuery({
    queryKey: [
      processCode,
      'workflow-instance',
      selectedAccountNo,
      workflowDefKey ?? null,
    ],
    enabled:
      workflowDialogOpen &&
      Boolean(selectedAccountNo) &&
      Boolean(workflowDefKey),
    retry: false,
    queryFn: async (): Promise<WorkflowInstanceResolution> => {
      if (!workflowDefKey) {
        throw new Error(
          `${processName} workflow is not configured. Set Workflow Definition Key in Process Settings.`
        )
      }

      const businessKey = `${workflowDefKey}-${selectedAccountNo}`
      const summary = await getWorkflowInstanceByBusinessV2(businessKey)
      if (summary?.instanceId) {
        return {
          instanceId: summary.instanceId,
          businessKey,
          currentStage: summary.currentStage,
          status: summary.status,
        }
      }

      throw new Error(
        `No running workflow instance found for account ${selectedAccountNo}`
      )
    },
  })

  const workflowUiQuery = useQuery({
    queryKey: [
      processCode,
      'workflow-ui',
      workflowInstanceQuery.data?.instanceId ?? null,
    ],
    enabled:
      workflowDialogOpen && Boolean(workflowInstanceQuery.data?.instanceId),
    retry: false,
    queryFn: () =>
      getWorkflowInstanceUi(workflowInstanceQuery.data!.instanceId),
  })

  useEffect(() => {
    setPageIndex(0)
  }, [effectiveBranchId, processCode])

  useEffect(() => {
    if (!workflowDialogOpen) {
      setSelectedWorkflowAccount(null)
      setDownloadingDocKey(null)
    }
  }, [workflowDialogOpen])

  const queryRows = useMemo(
    () => (listResponse?.data?.content ?? []) as AccountRow[],
    [listResponse]
  )
  const accounts = queryRows
  const totalRows = Number(listResponse?.data?.totalElements ?? 0)

  const outstandingStats = useMemo(() => {
    const values =
      accounts
        .map((d) => Number(d.outstand))
        .filter((val) => !Number.isNaN(val) && Number.isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total }
  }, [accounts])

  const workflowUi: WorkflowTaskUi | undefined = workflowUiQuery.data
  const workflowProgress = workflowUi?.progress ?? []
  const stageOrderByStageDefId = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of workflowProgress) {
      const stageDefId = Number(item.stageDefId)
      if (!Number.isFinite(stageDefId) || stageDefId <= 0) continue
      const stageOrder = Number(item.stageOrder)
      map.set(
        stageDefId,
        Number.isFinite(stageOrder) ? stageOrder : Number.MAX_SAFE_INTEGER
      )
    }
    return map
  }, [workflowProgress])
  const workflowHistory = useMemo(
    () =>
      [...(workflowUi?.history ?? [])].sort((a, b) => {
        const aTime = a.at ? new Date(a.at).getTime() : 0
        const bTime = b.at ? new Date(b.at).getTime() : 0
        return bTime - aTime
      }),
    [workflowUi?.history]
  )
  const previousStageSnapshots = useMemo(
    () =>
      [...(workflowUi?.previousStages ?? [])].sort((a, b) => {
        const orderA = a.stageOrder ?? Number.MAX_SAFE_INTEGER
        const orderB = b.stageOrder ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      }),
    [workflowUi?.previousStages]
  )
  const generatedDocTaskIds = useMemo(() => {
    const ids = new Set<number>()
    const currentTaskId = Number(workflowUi?.taskId)
    if (Number.isFinite(currentTaskId) && currentTaskId > 0) {
      ids.add(currentTaskId)
    }
    for (const entry of workflowUi?.history ?? []) {
      const taskId = Number(entry.taskId)
      if (!Number.isFinite(taskId) || taskId <= 0) continue
      ids.add(taskId)
    }
    return Array.from(ids).sort((a, b) => a - b)
  }, [workflowUi?.history, workflowUi?.taskId])

  const allStageTaskUiQuery = useQuery({
    queryKey: [
      processCode,
      'workflow-generated-docs-all-stage-task-ui',
      workflowUi?.instanceId ?? null,
      generatedDocTaskIds.join(','),
    ],
    enabled:
      workflowDialogOpen &&
      Boolean(workflowUi?.instanceId) &&
      generatedDocTaskIds.length > 0,
    retry: false,
    queryFn: async () => {
      const responses = await Promise.all(
        generatedDocTaskIds.map(async (taskId) => {
          try {
            return await getWorkflowTaskUi(taskId)
          } catch {
            return null
          }
        })
      )
      return responses.filter((item): item is WorkflowTaskUi =>
        Boolean(item && Number(item.taskId) > 0)
      )
    },
  })

  const generatedDocumentGroups = useMemo<GeneratedStageDocGroup[]>(() => {
    const sourceTaskUis = allStageTaskUiQuery.data ?? []
    if (sourceTaskUis.length === 0) return []

    const groupsByStage = new Map<
      string,
      {
        stageLabel: string
        stageOrder: number
        items: GeneratedStageDocItem[]
        seenDocKeys: Set<string>
      }
    >()

    for (const taskUi of sourceTaskUis) {
      const docs = taskUi.generatedDocuments ?? []
      if (docs.length === 0) continue

      const taskId = Number(taskUi.taskId)
      if (!Number.isFinite(taskId) || taskId <= 0) continue

      const stageDefId = Number(taskUi.stageDefId)
      const stageOrder = Number.isFinite(stageDefId)
        ? (stageOrderByStageDefId.get(stageDefId) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER
      const stageName = taskUi.stageName || taskUi.stageKey || 'Stage'
      const stageLabel =
        stageOrder !== Number.MAX_SAFE_INTEGER
          ? `${stageOrder}. ${stageName}`
          : stageName
      const groupKey = `${stageDefId || 'unknown'}::${stageName}`
      const existingGroup = groupsByStage.get(groupKey)
      const group = existingGroup ?? {
        stageLabel,
        stageOrder,
        items: [] as GeneratedStageDocItem[],
        seenDocKeys: new Set<string>(),
      }
      if (!existingGroup) {
        groupsByStage.set(groupKey, group)
      }

      for (const doc of docs) {
        const normalizedCode = String(doc.code ?? '')
          .trim()
          .toUpperCase()
        const docIdentity = `${normalizedCode}::${String(doc.templateKey ?? '')}::${String(doc.templateVersion ?? '')}`
        if (group.seenDocKeys.has(docIdentity)) continue
        group.seenDocKeys.add(docIdentity)
        group.items.push({
          taskId,
          stageLabel,
          stageOrder,
          code: doc.code,
          label: doc.label,
          mode: doc.mode,
          docType: doc.docType,
          templateKey: doc.templateKey,
          templateVersion: doc.templateVersion,
        })
      }
    }

    return Array.from(groupsByStage.values())
      .map((group) => ({
        stageLabel: group.stageLabel,
        stageOrder: group.stageOrder,
        items: [...group.items].sort((left, right) =>
          String(left.label || left.code || '').localeCompare(
            String(right.label || right.code || '')
          )
        ),
      }))
      .sort((left, right) => {
        if (left.stageOrder === right.stageOrder) {
          return left.stageLabel.localeCompare(right.stageLabel)
        }
        return left.stageOrder - right.stageOrder
      })
  }, [allStageTaskUiQuery.data, stageOrderByStageDefId])

  const isWorkflowLoading =
    isProcessSettingsLoading ||
    workflowInstanceQuery.isLoading ||
    workflowUiQuery.isLoading

  const handleRefresh = async () => {
    const result = await refetchInitiatedAccounts()
    if (result.error) {
      toast.error(`Failed to refresh ${processName} initiated accounts`)
      return
    }
    toast.success(`${processName} initiated accounts refreshed`)
  }

  const handleOpenWorkflow = (row: AccountRow) => {
    if (!row.acctNo) {
      toast.error('Account number is missing for this row.')
      return
    }
    if (processSettingsError) {
      toast.error('Failed to load Process Settings. Please try again.')
      return
    }
    if (!workflowDefKey) {
      toast.error(
        `${processName} workflow is not configured. Set Workflow Definition Key in Process Settings.`
      )
      return
    }
    setSelectedWorkflowAccount(row)
    setWorkflowDialogOpen(true)
  }

  const handleOpenTask = () => {
    if (!workflowUi?.taskId) {
      toast.error('No workflow task found for this instance.')
      return
    }
    navigate({
      to: '/workflow/tasks/$taskId',
      params: { taskId: String(workflowUi.taskId) },
    })
    setWorkflowDialogOpen(false)
  }

  const handleDownloadGeneratedDoc = async (
    taskId?: number,
    docCode?: string
  ) => {
    if (!taskId || !docCode) return
    const key = `${taskId}:${docCode}`
    setDownloadingDocKey(key)
    try {
      const { blob, fileName } = await downloadGeneratedWorkflowDocument({
        taskId,
        docCode,
      })
      downloadBlob(blob, fileName)
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to download document'
      )
    } finally {
      setDownloadingDocKey(null)
    }
  }

  const progress =
    isLoading || isFetching || isProcessSettingsLoading || isWorkflowLoading
      ? 70
      : 100

  return (
    <>
      <Header>
        {isBranchDropdownVisible && (
          <BranchSelector value={branchId} setValue={setBranchId} />
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
          currentPage={{
            type: 'label',
            label: `${processName} Initiated Accounts`,
          }}
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
            Error fetching initiated accounts:{' '}
            {String((error as Error).message)}
          </div>
        ) : totalRows === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No initiated accounts available for this branch.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  {processName} Initiated Accounts ({totalRows} accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total records: {totalRows} | Current page: {accounts.length} |
                  Total outstanding (sum): {outstandingStats.total.toFixed(2)} |
                  Min: {outstandingStats.min.toFixed(2)} | Max:{' '}
                  {outstandingStats.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleRefresh}
                  disabled={isFetching}
                >
                  {isFetching ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <ServerPaginatedTable
                key={`${processCode}-${effectiveBranchId}`}
                frameless
                showSearch={false}
                rows={accounts}
                total={totalRows}
                columns={columns}
                rowKey='acctNo'
                initialRowsPerPage={pageSize}
                onQueryChange={(query: ServerTableQuery) => {
                  const nextPageIndex = Math.max(0, query.page - 1)
                  const nextPageSize = query.pageSize
                  if (nextPageIndex !== pageIndex) setPageIndex(nextPageIndex)
                  if (nextPageSize !== pageSize) setPageSize(nextPageSize)
                }}
                emptyMessage='No initiated accounts to show.'
                renderActions={(row) =>
                  row.acctNo ? (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => handleOpenWorkflow(row)}
                    >
                      View Workflow
                    </Button>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        )}
      </Main>

      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-6xl'>
          <DialogHeader>
            <DialogTitle>
              Workflow Details
              {selectedAccountNo ? ` - ${selectedAccountNo}` : ''}
            </DialogTitle>
            <DialogDescription>
              Review workflow progress, stage submissions, uploaded documents,
              and generated report downloads for this account.
            </DialogDescription>
          </DialogHeader>

          {isWorkflowLoading ? (
            <div className='space-y-3 py-2'>
              <Skeleton className='h-5 w-1/3 rounded-md' />
              <Skeleton className='h-24 w-full rounded-md' />
              <Skeleton className='h-24 w-full rounded-md' />
            </div>
          ) : processSettingsError ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
              Failed to load Process Settings. Unable to resolve workflow key.
            </div>
          ) : !workflowDefKey ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
              Workflow key is missing in Process Settings. Configure
              <span className='font-medium'> Workflow Definition Key</span> for
              process code {processCode}.
            </div>
          ) : workflowInstanceQuery.error ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
              {workflowInstanceQuery.error instanceof Error
                ? workflowInstanceQuery.error.message
                : 'Failed to resolve workflow instance for this account.'}
            </div>
          ) : workflowUiQuery.error ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
              {workflowUiQuery.error instanceof Error
                ? workflowUiQuery.error.message
                : 'Failed to load workflow UI data for this instance.'}
            </div>
          ) : !workflowUi ? (
            <div className='text-muted-foreground rounded-md border p-3 text-sm'>
              Workflow UI details are not available.
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='bg-muted/20 grid gap-2 rounded-md border p-3 text-sm md:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <p className='text-muted-foreground text-xs'>Business Key</p>
                  <p className='font-medium'>
                    {workflowInstanceQuery.data?.businessKey || '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Instance ID</p>
                  <p className='font-medium'>{workflowUi.instanceId}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Current Stage</p>
                  <p className='font-medium'>
                    {workflowUi.stageName || workflowUi.stageKey || '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Task ID</p>
                  <p className='font-medium'>{workflowUi.taskId ?? '—'}</p>
                </div>
              </div>

              <Tabs defaultValue='overview' className='w-full'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='submissions'>Submissions</TabsTrigger>
                  <TabsTrigger value='documents'>Documents</TabsTrigger>
                  <TabsTrigger value='generated'>Generated</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='space-y-4 pt-4'>
                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>Workflow Progress</h3>
                    <div className='rounded-md border'>
                      {workflowProgress.length === 0 ? (
                        <p className='text-muted-foreground p-3 text-sm'>
                          No progress entries yet.
                        </p>
                      ) : (
                        <ul className='divide-y'>
                          {workflowProgress.map((item, index) => (
                            <li
                              key={`${item.stageDefId ?? index}-${item.stageName ?? ''}`}
                              className='flex flex-wrap items-center justify-between gap-2 p-3 text-sm'
                            >
                              <div>
                                <p className='font-medium'>
                                  {item.stageOrder != null
                                    ? `${item.stageOrder}. `
                                    : ''}
                                  {item.stageName || item.stageKey || 'Stage'}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  Acted by {item.actedBy || '—'} at{' '}
                                  {formatDateTime(item.actedAt)}
                                </p>
                              </div>
                              <Badge variant={statusVariant(item.status)}>
                                {item.status || 'PENDING'}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>

                  <Separator />

                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>Action History</h3>
                    <div className='rounded-md border'>
                      {workflowHistory.length === 0 ? (
                        <p className='text-muted-foreground p-3 text-sm'>
                          No history found.
                        </p>
                      ) : (
                        <ul className='divide-y'>
                          {workflowHistory.slice(0, 20).map((entry, index) => (
                            <li
                              key={`${entry.taskId ?? index}-${entry.at ?? ''}`}
                              className='space-y-1 p-3 text-sm'
                            >
                              <div className='flex items-center justify-between gap-2'>
                                <p className='font-medium'>
                                  {entry.stageName || 'Stage'}
                                </p>
                                <Badge variant='outline'>
                                  {entry.action || 'ACTION'}
                                </Badge>
                              </div>
                              <p className='text-muted-foreground text-xs'>
                                By {entry.actorUserId || '—'} at{' '}
                                {formatDateTime(entry.at)}
                              </p>
                              {entry.comments && (
                                <p className='text-xs'>{entry.comments}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value='submissions' className='space-y-3 pt-4'>
                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>
                      Current Stage Values
                    </h3>
                    <div className='bg-muted/20 rounded-md border p-3'>
                      <ReadableFields
                        data={(workflowUi.values ?? {}) as ReadableValue}
                      />
                    </div>
                  </section>

                  <Separator />

                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>
                      Previous Stage Submissions
                    </h3>
                    {previousStageSnapshots.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        No previous stage submissions found.
                      </p>
                    ) : (
                      <div className='space-y-2'>
                        {previousStageSnapshots.map((stage, index) => (
                          <details
                            key={`${stage.stageDefId ?? index}-${stage.stageName ?? ''}`}
                            className='rounded-md border p-3'
                          >
                            <summary className='flex cursor-pointer list-none items-center justify-between gap-2'>
                              <span className='text-sm font-medium'>
                                {stage.stageOrder != null
                                  ? `${stage.stageOrder}. `
                                  : ''}
                                {stage.stageName || stage.stageKey || 'Stage'}
                              </span>
                              <Badge variant={statusVariant(stage.status)}>
                                {stage.status || 'PENDING'}
                              </Badge>
                            </summary>
                            <div className='mt-3 space-y-3'>
                              <p className='text-muted-foreground text-xs'>
                                Acted by {stage.actedBy || '—'} at{' '}
                                {formatDateTime(stage.actedAt)}
                              </p>
                              <div>
                                <p className='mb-1 text-xs font-medium'>
                                  Values
                                </p>
                                <div className='bg-muted/20 rounded-md border p-3'>
                                  <ReadableFields
                                    data={(stage.values ?? {}) as ReadableValue}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className='mb-1 text-xs font-medium'>
                                  Documents
                                </p>
                                {(stage.documents ?? []).length === 0 ? (
                                  <p className='text-muted-foreground text-xs'>
                                    No documents uploaded.
                                  </p>
                                ) : (
                                  <ul className='space-y-1 text-xs'>
                                    {(stage.documents ?? []).map(
                                      (doc, docIndex) => {
                                        const url = resolveWorkflowDocumentUrl(
                                          doc.url
                                        )
                                        return (
                                          <li
                                            key={`${doc.id ?? docIndex}-${url}`}
                                            className='break-all'
                                          >
                                            <span className='font-medium'>
                                              {doc.docType || 'DOC'}
                                            </span>{' '}
                                            -{' '}
                                            {url ? (
                                              <a
                                                href={url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='text-primary underline'
                                              >
                                                {url}
                                              </a>
                                            ) : (
                                              '—'
                                            )}
                                          </li>
                                        )
                                      }
                                    )}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value='documents' className='space-y-3 pt-4'>
                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>
                      Current Stage Documents
                    </h3>
                    {(workflowUi.documents ?? []).length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        No current-stage documents uploaded.
                      </p>
                    ) : (
                      <ul className='space-y-1 rounded-md border p-3 text-xs'>
                        {(workflowUi.documents ?? []).map((doc, index) => {
                          const url = resolveWorkflowDocumentUrl(doc.url)
                          return (
                            <li
                              key={`${doc.id ?? index}-${doc.url ?? ''}`}
                              className='break-all'
                            >
                              <span className='font-medium'>
                                {doc.docType || 'DOC'}
                              </span>{' '}
                              -{' '}
                              {url ? (
                                <a
                                  href={url}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-primary underline'
                                >
                                  {url}
                                </a>
                              ) : (
                                '—'
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>

                  <Separator />

                  <section className='space-y-2'>
                    <h3 className='text-sm font-semibold'>
                      Previous Stage Documents
                    </h3>
                    {previousStageSnapshots.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        No previous stage records found.
                      </p>
                    ) : (
                      <div className='space-y-2'>
                        {previousStageSnapshots.map((stage, index) => (
                          <div
                            key={`${stage.stageDefId ?? index}-${stage.stageName ?? ''}`}
                            className='rounded-md border p-3'
                          >
                            <p className='mb-2 text-xs font-medium'>
                              {stage.stageOrder != null
                                ? `${stage.stageOrder}. `
                                : ''}
                              {stage.stageName || stage.stageKey || 'Stage'}
                            </p>
                            {(stage.documents ?? []).length === 0 ? (
                              <p className='text-muted-foreground text-xs'>
                                No documents uploaded.
                              </p>
                            ) : (
                              <ul className='space-y-1 text-xs'>
                                {(stage.documents ?? []).map(
                                  (doc, docIndex) => {
                                    const url = resolveWorkflowDocumentUrl(
                                      doc.url
                                    )
                                    return (
                                      <li
                                        key={`${doc.id ?? docIndex}-${url}`}
                                        className='break-all'
                                      >
                                        <span className='font-medium'>
                                          {doc.docType || 'DOC'}
                                        </span>{' '}
                                        -{' '}
                                        {url ? (
                                          <a
                                            href={url}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='text-primary underline'
                                          >
                                            {url}
                                          </a>
                                        ) : (
                                          '—'
                                        )}
                                      </li>
                                    )
                                  }
                                )}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value='generated' className='space-y-2 pt-4'>
                  <h3 className='text-sm font-semibold'>Generated Documents</h3>
                  {allStageTaskUiQuery.isLoading ? (
                    <div className='space-y-2 rounded-md border p-3'>
                      <Skeleton className='h-6 w-1/3 rounded-md' />
                      <Skeleton className='h-20 w-full rounded-md' />
                    </div>
                  ) : allStageTaskUiQuery.error ? (
                    <p className='text-sm text-red-600'>
                      Failed to load generated documents for all stages.
                    </p>
                  ) : generatedDocumentGroups.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      No generated documents configured for this workflow.
                    </p>
                  ) : (
                    <div className='space-y-3'>
                      {generatedDocumentGroups.map((group, groupIndex) => (
                        <div
                          key={`${group.stageLabel}-${groupIndex}`}
                          className='space-y-2 rounded-md border p-3'
                        >
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            {group.stageLabel}
                          </p>
                          {group.items.map((doc, index) => {
                            const docKey = `${doc.taskId}:${doc.code ?? index}`
                            const isDownloading = downloadingDocKey === docKey
                            return (
                              <div
                                key={`${doc.code ?? index}-${doc.templateKey ?? ''}-${doc.taskId}`}
                                className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm'
                              >
                                <div>
                                  <p className='font-medium'>
                                    {doc.label ||
                                      doc.code ||
                                      'Generated Document'}
                                  </p>
                                  <p className='text-muted-foreground text-xs'>
                                    Code: {doc.code || '—'} | Template:{' '}
                                    {doc.templateKey || '—'} v
                                    {doc.templateVersion ?? '—'} | Mode:{' '}
                                    {doc.mode || '—'} | Task: {doc.taskId}
                                  </p>
                                </div>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    handleDownloadGeneratedDoc(
                                      doc.taskId,
                                      doc.code
                                    )
                                  }
                                  disabled={!doc.code || isDownloading}
                                >
                                  {isDownloading ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  ) : (
                                    <Download className='mr-2 h-4 w-4' />
                                  )}
                                  Download
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setWorkflowDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type='button'
              onClick={handleOpenTask}
              disabled={!workflowUi?.taskId}
            >
              Open Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
