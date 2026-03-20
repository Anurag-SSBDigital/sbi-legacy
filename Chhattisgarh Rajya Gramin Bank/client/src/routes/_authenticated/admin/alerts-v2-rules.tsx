import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Download,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Upload,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { toastError } from '@/lib/utils'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createEwsV2Rule,
  exportEwsV2EngineBundle,
  exportEwsV2RuleBundle,
  importEwsV2EngineBundle,
  importEwsV2RuleBundle,
  listAlertSeverities,
  listEwsV2RunAllLogs,
  listEwsV2Rules,
  revalidateAllEwsV2Rules,
  runAllEwsV2Rules,
  updateEwsV2Rule,
  type EwsV2ImportExportBundle,
  type EwsV2ImportResult,
  type EwsV2ManualRunAllLog,
  type EwsV2RevalidateRulesResult,
  type EwsV2RunAllResult,
} from '@/features/alerts-v2/ews-v2-rule-api'

export const Route = createFileRoute('/_authenticated/admin/alerts-v2-rules')({
  component: RouteComponent,
  validateSearch: z.object({
    q: z.string().optional(),
    active: z.string().optional(),
    published: z.string().optional(),
    health: z.string().optional(),
    severity: z.string().optional(),
    category: z.string().optional(),
    autoRun: z.string().optional(),
    dedupe: z.string().optional(),
  }).parse,
})

const triggerJsonDownload = (fileName: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

const importSummary = (result: EwsV2ImportResult) =>
  [
    `Rules +${result.createdRules ?? 0}/${result.updatedRules ?? 0}`,
    `Adapters +${result.createdAdapters ?? 0}/${result.updatedAdapters ?? 0}`,
    `Config +${result.createdConfigDefinitions ?? 0}/${result.updatedConfigDefinitions ?? 0}`,
    `Warnings ${result.warnings?.length ?? 0}`,
  ].join(' • ')

const FILTER_ALL = '__ALL__'

function RouteComponent() {
  return <Outlet />
}

export function AlertsV2RulesListPage() {
  return <RulesListPage />
}

function RulesListPage() {
  const navigate = Route.useNavigate()
  const searchParams = Route.useSearch()
  const canView = useCanAccess('ews_alert', 'view')
  const canCreate = useCanAccess('ews_alert', 'create')
  const canUpdate = useCanAccess('ews_alert', 'update')

  const search = searchParams.q ?? ''
  const activeFilter = searchParams.active ?? FILTER_ALL
  const publishedFilter = searchParams.published ?? FILTER_ALL
  const healthFilter = searchParams.health ?? FILTER_ALL
  const severityFilter = searchParams.severity ?? FILTER_ALL
  const categoryFilter = searchParams.category ?? FILTER_ALL
  const autoRunFilter = searchParams.autoRun ?? FILTER_ALL
  const dedupeFilter = searchParams.dedupe ?? FILTER_ALL
  const [createRuleOpen, setCreateRuleOpen] = useState(false)
  const [importEngineOpen, setImportEngineOpen] = useState(false)
  const [importRuleOpen, setImportRuleOpen] = useState(false)
  const [revalidateDialogOpen, setRevalidateDialogOpen] = useState(false)
  const [runAllDialogOpen, setRunAllDialogOpen] = useState(false)
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([])
  const [runAllDryRun, setRunAllDryRun] = useState(false)
  const [runAllDate, setRunAllDate] = useState('')
  const [runAllConfirmText, setRunAllConfirmText] = useState('')
  const [runAllResult, setRunAllResult] = useState<EwsV2RunAllResult | null>(
    null
  )
  const [selectedRunAllLog, setSelectedRunAllLog] =
    useState<EwsV2ManualRunAllLog | null>(null)
  const [runAllLogDetailsOpen, setRunAllLogDetailsOpen] = useState(false)
  const [revalidateReport, setRevalidateReport] =
    useState<EwsV2RevalidateRulesResult | null>(null)

  const [newRuleKey, setNewRuleKey] = useState('')
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleSeverityKey, setNewRuleSeverityKey] = useState('MEDIUM')
  const [newRuleDedupeMode, setNewRuleDedupeMode] = useState<
    'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
  >('PERIOD')
  const [newRuleDedupeWindowDays, setNewRuleDedupeWindowDays] = useState('30')
  const [newRuleAutoRun, setNewRuleAutoRun] = useState(false)
  const [newRuleCron, setNewRuleCron] = useState('0 30 6 * * *')
  const [importEngineJson, setImportEngineJson] = useState('')
  const [importRuleJson, setImportRuleJson] = useState('')

  const rulesQuery = useQuery({
    queryKey: ['ews-v2-rules'],
    queryFn: listEwsV2Rules,
    enabled: canView,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

  const severityQuery = useQuery({
    queryKey: ['alerts-v2-severities'],
    queryFn: () => listAlertSeverities(false),
    enabled: canView,
    staleTime: 60 * 1000,
  })

  const runAllLogsQuery = useQuery({
    queryKey: ['ews-v2-run-all-logs'],
    queryFn: () => listEwsV2RunAllLogs(100),
    enabled: canView,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

  const severityOptions = useMemo(
    () => (severityQuery.data ?? []).map((item) => item.severityKey),
    [severityQuery.data]
  )

  const severityFilterOptions = useMemo(() => {
    const values = new Set<string>(severityOptions)
    for (const rule of rulesQuery.data ?? []) {
      if (rule.alertSeverityKey) values.add(rule.alertSeverityKey)
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [rulesQuery.data, severityOptions])

  const categoryOptions = useMemo(() => {
    const values = new Set<string>()
    for (const rule of rulesQuery.data ?? []) {
      if (rule.category?.trim()) values.add(rule.category.trim())
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [rulesQuery.data])

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (rulesQuery.data ?? []).filter((rule) => {
      const matchesSearch = !term
        ? true
        : `${rule.ruleKey} ${rule.ruleName} ${rule.category ?? ''} ${rule.alertSeverityKey ?? ''} ${rule.healthStatus ?? ''} ${rule.healthMessage ?? ''} ${rule.dedupeMode ?? ''}`
            .toLowerCase()
            .includes(term)
      if (!matchesSearch) return false

      if (activeFilter !== FILTER_ALL) {
        if (activeFilter === 'ACTIVE' && !rule.active) return false
        if (activeFilter === 'INACTIVE' && rule.active) return false
      }

      if (publishedFilter !== FILTER_ALL) {
        const isPublished = (rule.publishedVersionNo ?? 0) > 0
        if (publishedFilter === 'PUBLISHED' && !isPublished) return false
        if (publishedFilter === 'UNPUBLISHED' && isPublished) return false
      }

      if (healthFilter !== FILTER_ALL) {
        const normalizedHealth = rule.healthStatus ?? 'UNKNOWN'
        if (normalizedHealth !== healthFilter) return false
      }

      if (
        severityFilter !== FILTER_ALL &&
        (rule.alertSeverityKey ?? '') !== severityFilter
      ) {
        return false
      }

      if (
        categoryFilter !== FILTER_ALL &&
        (rule.category ?? '') !== categoryFilter
      ) {
        return false
      }

      if (autoRunFilter !== FILTER_ALL) {
        const autoRunEnabled = Boolean(rule.autoRunEnabled)
        if (autoRunFilter === 'ENABLED' && !autoRunEnabled) return false
        if (autoRunFilter === 'DISABLED' && autoRunEnabled) return false
      }

      if (dedupeFilter !== FILTER_ALL) {
        const normalizedDedupe = rule.dedupeMode ?? 'NONE'
        if (normalizedDedupe !== dedupeFilter) return false
      }

      return true
    })
  }, [
    activeFilter,
    autoRunFilter,
    categoryFilter,
    dedupeFilter,
    healthFilter,
    publishedFilter,
    rulesQuery.data,
    search,
    severityFilter,
  ])

  const filteredRuleIds = useMemo(
    () => filteredRules.map((rule) => Number(rule.id)),
    [filteredRules]
  )
  const allFilteredSelected =
    filteredRuleIds.length > 0 &&
    filteredRuleIds.every((id) => selectedRuleIds.includes(id))
  const someFilteredSelected =
    !allFilteredSelected &&
    filteredRuleIds.some((id) => selectedRuleIds.includes(id))
  const filteredSelectionState: boolean | 'indeterminate' = allFilteredSelected
    ? true
    : someFilteredSelected
      ? 'indeterminate'
      : false

  useEffect(() => {
    const valid = new Set(
      (rulesQuery.data ?? []).map((rule) => Number(rule.id))
    )
    setSelectedRuleIds((prev) => prev.filter((id) => valid.has(id)))
  }, [rulesQuery.data])

  const setUrlFilters = (
    patch: Partial<{
      q: string
      active: string
      published: string
      health: string
      severity: string
      category: string
      autoRun: string
      dedupe: string
    }>
  ) => {
    navigate({
      search: (prev) => {
        const next = { ...prev, ...patch }
        return {
          ...next,
          q: next.q ? next.q : undefined,
          active:
            next.active && next.active !== FILTER_ALL ? next.active : undefined,
          published:
            next.published && next.published !== FILTER_ALL
              ? next.published
              : undefined,
          health:
            next.health && next.health !== FILTER_ALL ? next.health : undefined,
          severity:
            next.severity && next.severity !== FILTER_ALL
              ? next.severity
              : undefined,
          category:
            next.category && next.category !== FILTER_ALL
              ? next.category
              : undefined,
          autoRun:
            next.autoRun && next.autoRun !== FILTER_ALL
              ? next.autoRun
              : undefined,
          dedupe:
            next.dedupe && next.dedupe !== FILTER_ALL ? next.dedupe : undefined,
        }
      },
      replace: true,
    })
  }

  const resetFilters = () => {
    setUrlFilters({
      q: '',
      active: FILTER_ALL,
      published: FILTER_ALL,
      health: FILTER_ALL,
      severity: FILTER_ALL,
      category: FILTER_ALL,
      autoRun: FILTER_ALL,
      dedupe: FILTER_ALL,
    })
  }

  const toggleRuleSelection = (ruleId: number, selected: boolean) => {
    setSelectedRuleIds((prev) => {
      if (selected) {
        return prev.includes(ruleId) ? prev : [...prev, ruleId]
      }
      return prev.filter((id) => id !== ruleId)
    })
  }

  const toggleAllFilteredSelection = (selected: boolean) => {
    setSelectedRuleIds((prev) => {
      if (selected) {
        return Array.from(new Set([...prev, ...filteredRuleIds]))
      }
      const filteredSet = new Set(filteredRuleIds)
      return prev.filter((id) => !filteredSet.has(id))
    })
  }

  const openRunAllLogDetails = (log: EwsV2ManualRunAllLog) => {
    setSelectedRunAllLog(log)
    setRunAllLogDetailsOpen(true)
  }

  const createRuleMutation = useMutation({
    mutationFn: () =>
      createEwsV2Rule({
        ruleKey: newRuleKey.trim().toUpperCase(),
        ruleName: newRuleName.trim(),
        alertSeverityKey: newRuleSeverityKey || undefined,
        dedupeMode: newRuleDedupeMode,
        dedupeWindowDays:
          newRuleDedupeMode === 'WINDOW'
            ? Number(newRuleDedupeWindowDays || 0)
            : undefined,
        autoRunEnabled: newRuleAutoRun,
        cronExpression: newRuleAutoRun
          ? newRuleCron.trim() || undefined
          : undefined,
        cronTimezone: newRuleAutoRun ? 'Asia/Kolkata' : undefined,
      }),
    onSuccess: async (rule) => {
      toast.success('Rule created.')
      setCreateRuleOpen(false)
      setNewRuleKey('')
      setNewRuleName('')
      setNewRuleSeverityKey('MEDIUM')
      setNewRuleDedupeMode('PERIOD')
      setNewRuleDedupeWindowDays('30')
      setNewRuleAutoRun(false)
      setNewRuleCron('0 30 6 * * *')
      await rulesQuery.refetch()
      navigate({
        to: '/admin/alerts-v2-rules/$ruleId',
        params: { ruleId: String(rule.id) },
      })
    },
    onError: (error) => toastError(error, 'Could not create rule.'),
  })

  const exportEngineMutation = useMutation({
    mutationFn: () => exportEwsV2EngineBundle(),
    onSuccess: (bundle) => {
      triggerJsonDownload(
        `ews-v2-engine-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        bundle
      )
      toast.success('Engine configuration exported.')
    },
    onError: (error) =>
      toastError(error, 'Could not export engine configuration.'),
  })

  const revalidateAllMutation = useMutation({
    mutationFn: () =>
      revalidateAllEwsV2Rules({
        disableAutoRunOnBroken: true,
      }),
    onSuccess: async (result) => {
      setRevalidateReport(result)
      setRevalidateDialogOpen(true)
      toast.success(
        `Revalidation done. Broken: ${result.brokenRules ?? 0}, Degraded: ${result.degradedRules ?? 0}.`
      )
      await rulesQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not revalidate rules.'),
  })

  const runAllMutation = useMutation({
    mutationFn: () =>
      runAllEwsV2Rules({
        dryRun: runAllDryRun,
        runDate: runAllDate.trim() || undefined,
      }),
    onSuccess: async (result) => {
      setRunAllResult(result)
      setRunAllConfirmText('')
      toast.success(
        `Run-all completed. Succeeded: ${result.succeededRules ?? 0}, Failed: ${result.failedRules ?? 0}.`
      )
      await Promise.all([rulesQuery.refetch(), runAllLogsQuery.refetch()])
    },
    onError: (error) => toastError(error, 'Could not run all alerts.'),
  })

  const toggleRuleActiveMutation = useMutation({
    mutationFn: ({ ruleId, active }: { ruleId: number; active: boolean }) =>
      updateEwsV2Rule(ruleId, { active }),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.active
          ? 'Rule enabled successfully.'
          : 'Rule disabled successfully.'
      )
      await rulesQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update rule status.'),
  })

  const bulkActiveMutation = useMutation({
    mutationFn: async ({
      ruleIds,
      active,
    }: {
      ruleIds: number[]
      active: boolean
    }) => {
      const settled = await Promise.allSettled(
        ruleIds.map((ruleId) => updateEwsV2Rule(ruleId, { active }))
      )
      const failed = settled.filter((item) => item.status === 'rejected').length
      return {
        total: ruleIds.length,
        failed,
        updated: ruleIds.length - failed,
      }
    },
    onSuccess: async (result, variables) => {
      if (result.failed === 0) {
        toast.success(
          `${variables.active ? 'Enabled' : 'Disabled'} ${result.updated} rule(s).`
        )
      } else {
        toast.warning(
          `${variables.active ? 'Enable' : 'Disable'} completed with partial failures. Updated: ${result.updated}, Failed: ${result.failed}.`
        )
      }
      await rulesQuery.refetch()
    },
    onError: (error) =>
      toastError(error, 'Could not apply bulk status update.'),
  })

  const importEngineMutation = useMutation({
    mutationFn: () =>
      importEwsV2EngineBundle(
        JSON.parse(importEngineJson) as EwsV2ImportExportBundle
      ),
    onSuccess: async (result) => {
      toast.success(`Engine import completed. ${importSummary(result)}`)
      setImportEngineOpen(false)
      setImportEngineJson('')
      await Promise.all([rulesQuery.refetch(), severityQuery.refetch()])
    },
    onError: (error) =>
      toastError(error, 'Could not import engine configuration.'),
  })

  const exportRuleMutation = useMutation({
    mutationFn: (ruleId: number) => exportEwsV2RuleBundle(ruleId),
    onSuccess: (bundle, ruleId) => {
      const selected = (rulesQuery.data ?? []).find(
        (rule) => rule.id === ruleId
      )
      const key = selected?.ruleKey || `rule-${ruleId}`
      triggerJsonDownload(
        `ews-v2-rule-${key}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        bundle
      )
      toast.success('Rule configuration exported.')
    },
    onError: (error) =>
      toastError(error, 'Could not export rule configuration.'),
  })

  const importRuleMutation = useMutation({
    mutationFn: () =>
      importEwsV2RuleBundle(
        JSON.parse(importRuleJson) as EwsV2ImportExportBundle
      ),
    onSuccess: async (result) => {
      toast.success(`Rule import completed. ${importSummary(result)}`)
      setImportRuleOpen(false)
      setImportRuleJson('')
      await Promise.all([rulesQuery.refetch(), severityQuery.refetch()])
    },
    onError: (error) =>
      toastError(error, 'Could not import rule configuration.'),
  })

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EWS Rules</CardTitle>
          <CardDescription>
            You do not have access to this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalRules = rulesQuery.data?.length ?? 0
  const activeRules = (rulesQuery.data ?? []).filter(
    (rule) => rule.active
  ).length
  const publishedRules = (rulesQuery.data ?? []).filter(
    (rule) => (rule.publishedVersionNo ?? 0) > 0
  ).length
  const healthyRules = (rulesQuery.data ?? []).filter(
    (rule) => rule.healthStatus === 'HEALTHY'
  ).length
  const degradedRules = (rulesQuery.data ?? []).filter(
    (rule) => rule.healthStatus === 'DEGRADED'
  ).length
  const brokenRules = (rulesQuery.data ?? []).filter(
    (rule) => rule.healthStatus === 'BROKEN'
  ).length

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>EWS Rules</h1>
          <p className='text-muted-foreground text-sm'>
            Listing and navigation for rule workspaces.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={exportEngineMutation.isPending}
            onClick={() => exportEngineMutation.mutate()}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Engine
          </Button>
          <Button variant='outline' onClick={() => setImportEngineOpen(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Import Engine
          </Button>
          <Button variant='outline' onClick={() => setImportRuleOpen(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Import Rule
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/admin/alerts-v2-config' })}
          >
            <Settings2 className='mr-2 h-4 w-4' />
            Config / Thresholds
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/admin/alerts-v2-adapters' })}
          >
            <Wrench className='mr-2 h-4 w-4' />
            Adapters
          </Button>
          <Button variant='outline' onClick={() => void rulesQuery.refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button
            variant='outline'
            disabled={!canUpdate || revalidateAllMutation.isPending}
            onClick={() => revalidateAllMutation.mutate()}
          >
            <Wrench className='mr-2 h-4 w-4' />
            {revalidateAllMutation.isPending
              ? 'Revalidating...'
              : 'Revalidate All'}
          </Button>
          <Button
            disabled={!canUpdate || runAllMutation.isPending}
            onClick={() => setRunAllDialogOpen(true)}
          >
            <Play className='mr-2 h-4 w-4' />
            Run All Alerts
          </Button>
          <Button disabled={!canCreate} onClick={() => setCreateRuleOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Rule
          </Button>
        </div>
      </div>

      <div className='grid gap-3 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Rules</CardDescription>
            <CardTitle className='text-2xl'>{totalRules}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active Rules</CardDescription>
            <CardTitle className='text-2xl'>{activeRules}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Published Rules</CardDescription>
            <CardTitle className='text-2xl'>{publishedRules}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline'>Healthy: {healthyRules}</Badge>
        <Badge variant='secondary'>Degraded: {degradedRules}</Badge>
        <Badge variant='destructive'>Broken: {brokenRules}</Badge>
        <span className='text-muted-foreground text-xs'>
          Auto-refresh every 30s
        </span>
      </div>

      {selectedRuleIds.length ? (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Bulk Actions</CardTitle>
            <CardDescription>
              Selected {selectedRuleIds.length} rule(s)
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              disabled={!canUpdate || bulkActiveMutation.isPending}
              onClick={() =>
                bulkActiveMutation.mutate({
                  ruleIds: selectedRuleIds,
                  active: true,
                })
              }
            >
              Enable Selected
            </Button>
            <Button
              variant='outline'
              disabled={!canUpdate || bulkActiveMutation.isPending}
              onClick={() =>
                bulkActiveMutation.mutate({
                  ruleIds: selectedRuleIds,
                  active: false,
                })
              }
            >
              Disable Selected
            </Button>
            <Button
              variant='ghost'
              disabled={bulkActiveMutation.isPending}
              onClick={() => setSelectedRuleIds([])}
            >
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Rules</CardTitle>
          <div className='space-y-3'>
            <div className='max-w-md space-y-1'>
              <Label className='text-muted-foreground text-xs'>Search</Label>
              <Input
                value={search}
                onChange={(e) => setUrlFilters({ q: e.target.value })}
                placeholder='Search by key, name, category, severity, health'
              />
            </div>

            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>Status</Label>
                <Select
                  value={activeFilter}
                  onValueChange={(value) => setUrlFilters({ active: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    <SelectItem value='ACTIVE'>Active</SelectItem>
                    <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>
                  Published
                </Label>
                <Select
                  value={publishedFilter}
                  onValueChange={(value) => setUrlFilters({ published: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    <SelectItem value='PUBLISHED'>Published</SelectItem>
                    <SelectItem value='UNPUBLISHED'>Unpublished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>Health</Label>
                <Select
                  value={healthFilter}
                  onValueChange={(value) => setUrlFilters({ health: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    <SelectItem value='HEALTHY'>Healthy</SelectItem>
                    <SelectItem value='DEGRADED'>Degraded</SelectItem>
                    <SelectItem value='BROKEN'>Broken</SelectItem>
                    <SelectItem value='UNKNOWN'>Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>
                  Severity
                </Label>
                <Select
                  value={severityFilter}
                  onValueChange={(value) => setUrlFilters({ severity: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    {severityFilterOptions.map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>
                  Category
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setUrlFilters({ category: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    {categoryOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>
                  Auto-run
                </Label>
                <Select
                  value={autoRunFilter}
                  onValueChange={(value) => setUrlFilters({ autoRun: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    <SelectItem value='ENABLED'>Enabled</SelectItem>
                    <SelectItem value='DISABLED'>Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs'>Dedupe</Label>
                <Select
                  value={dedupeFilter}
                  onValueChange={(value) => setUrlFilters({ dedupe: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>All</SelectItem>
                    <SelectItem value='PERIOD'>PERIOD</SelectItem>
                    <SelectItem value='DAY'>DAY</SelectItem>
                    <SelectItem value='WINDOW'>WINDOW</SelectItem>
                    <SelectItem value='NONE'>NONE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex flex-wrap items-center gap-3'>
                <p className='text-muted-foreground text-xs'>
                  Showing {filteredRules.length} of {totalRules} rules
                </p>
                {filteredRules.length ? (
                  <label className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <Checkbox
                      checked={filteredSelectionState}
                      onCheckedChange={(checked) =>
                        toggleAllFilteredSelection(checked === true)
                      }
                    />
                    Select all shown
                  </label>
                ) : null}
              </div>
              <div className='flex items-center gap-2'>
                {selectedRuleIds.length ? (
                  <span className='text-muted-foreground text-xs'>
                    Selected {selectedRuleIds.length}
                  </span>
                ) : null}
                <Button variant='ghost' size='sm' onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          {rulesQuery.isFetching ? (
            <p className='text-sm'>Loading rules...</p>
          ) : null}
          {!rulesQuery.isFetching && !filteredRules.length ? (
            <p className='text-muted-foreground text-sm'>No rules found.</p>
          ) : null}
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className='bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
            >
              <div className='flex min-w-0 flex-1 items-start gap-3'>
                <Checkbox
                  checked={selectedRuleIds.includes(Number(rule.id))}
                  onCheckedChange={(checked) =>
                    toggleRuleSelection(Number(rule.id), checked === true)
                  }
                  className='mt-1'
                />
                <div className='min-w-0 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-mono text-sm font-semibold'>
                      {rule.ruleKey}
                    </p>
                    <Badge variant={rule.active ? 'default' : 'outline'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant='outline'>
                      Published v{rule.publishedVersionNo ?? '-'}
                    </Badge>
                    {rule.healthStatus ? (
                      <Badge
                        variant={
                          rule.healthStatus === 'BROKEN'
                            ? 'destructive'
                            : rule.healthStatus === 'DEGRADED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {rule.healthStatus}
                      </Badge>
                    ) : null}
                  </div>
                  <p className='text-sm font-medium'>{rule.ruleName}</p>
                  <p className='text-muted-foreground text-xs'>
                    Severity: {rule.alertSeverityKey ?? '-'} • Category:{' '}
                    {rule.category ?? '-'}
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  variant='outline'
                  disabled={exportRuleMutation.isPending}
                  onClick={() => exportRuleMutation.mutate(rule.id)}
                >
                  <Download className='mr-2 h-4 w-4' />
                  Export Rule
                </Button>
                <Button
                  variant='outline'
                  disabled={
                    !canUpdate ||
                    toggleRuleActiveMutation.isPending ||
                    bulkActiveMutation.isPending
                  }
                  onClick={() =>
                    toggleRuleActiveMutation.mutate({
                      ruleId: Number(rule.id),
                      active: !rule.active,
                    })
                  }
                >
                  {rule.active ? 'Disable' : 'Enable'}
                </Button>
                {(rule.publishedVersionNo ?? 0) > 0 ? (
                  <Button
                    variant='outline'
                    onClick={() =>
                      navigate({
                        to: '/admin/alerts-v2-rules/$ruleId/create-version',
                        params: { ruleId: String(rule.id) },
                        search: {
                          editVersionNo: Number(rule.publishedVersionNo),
                          readOnly: true,
                        },
                      })
                    }
                  >
                    View Published
                  </Button>
                ) : null}
                <Button
                  onClick={() =>
                    navigate({
                      to: '/admin/alerts-v2-rules/$ruleId',
                      params: { ruleId: String(rule.id) },
                    })
                  }
                >
                  Open Workspace
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div>
              <CardTitle className='text-base'>Manual Run-All Log</CardTitle>
              <CardDescription>
                Persistent history of manually triggered run-all executions.
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              disabled={runAllLogsQuery.isFetching}
              onClick={() => void runAllLogsQuery.refetch()}
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          {runAllLogsQuery.isFetching ? (
            <p className='text-muted-foreground text-sm'>
              Loading log entries...
            </p>
          ) : null}
          {!runAllLogsQuery.isFetching &&
          !(runAllLogsQuery.data ?? []).length ? (
            <p className='text-muted-foreground text-sm'>
              No manual run-all logs yet.
            </p>
          ) : null}
          {(runAllLogsQuery.data ?? []).slice(0, 20).map((entry) => (
            <div
              key={entry.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>
                  Log #{entry.id} • {entry.dryRun ? 'Dry Run' : 'Execution'}
                </p>
                <p className='text-muted-foreground truncate text-xs'>
                  {entry.runDate ?? '-'} • {entry.status ?? '-'} • succeeded{' '}
                  {entry.succeededRules ?? 0} / failed {entry.failedRules ?? 0}
                  {' • '}triggered by {entry.triggeredBy || '-'}
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openRunAllLogDetails(entry)}
              >
                View Details
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={runAllDialogOpen}
        onOpenChange={(open) => {
          setRunAllDialogOpen(open)
          if (!open) {
            setRunAllConfirmText('')
          }
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Run All Alerts</DialogTitle>
            <DialogDescription>
              Manually run all active and published EWS rules. Use dry run to
              preview without creating hits.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='space-y-2 rounded-md border p-3'>
                <div className='flex items-center justify-between gap-3'>
                  <Label className='text-sm font-medium'>Dry Run</Label>
                  <Switch
                    checked={runAllDryRun}
                    onCheckedChange={setRunAllDryRun}
                  />
                </div>
                <p className='text-muted-foreground text-xs'>
                  {runAllDryRun
                    ? 'Dry run is ON: evaluates rules and returns preview metrics only.'
                    : 'Dry run is OFF: real execution will create/update alert hits.'}
                </p>
              </div>

              <div className='space-y-2 rounded-md border p-3'>
                <Label className='text-sm font-medium'>
                  Run Date (optional)
                </Label>
                <Input
                  type='date'
                  value={runAllDate}
                  onChange={(e) => setRunAllDate(e.target.value)}
                />
                <p className='text-muted-foreground text-xs'>
                  Leave empty to use today.
                </p>
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-1'>
              <LabeledField label='Confirm'>
                <Input
                  value={runAllConfirmText}
                  onChange={(e) => setRunAllConfirmText(e.target.value)}
                  placeholder='Type RUN to confirm'
                />
              </LabeledField>
            </div>

            {runAllResult ? (
              <div className='space-y-3 rounded-md border p-3'>
                <p className='text-sm font-medium'>Latest Run-All Summary</p>
                <div className='grid gap-2 sm:grid-cols-4'>
                  <div className='rounded-md border p-2 text-xs'>
                    <p className='text-muted-foreground'>Total Rules</p>
                    <p className='text-sm font-semibold'>
                      {runAllResult.totalRules ?? 0}
                    </p>
                  </div>
                  <div className='rounded-md border p-2 text-xs'>
                    <p className='text-muted-foreground'>Attempted</p>
                    <p className='text-sm font-semibold'>
                      {runAllResult.attemptedRules ?? 0}
                    </p>
                  </div>
                  <div className='rounded-md border p-2 text-xs'>
                    <p className='text-muted-foreground'>Succeeded</p>
                    <p className='text-sm font-semibold'>
                      {runAllResult.succeededRules ?? 0}
                    </p>
                  </div>
                  <div className='rounded-md border p-2 text-xs'>
                    <p className='text-muted-foreground'>Failed</p>
                    <p className='text-sm font-semibold'>
                      {runAllResult.failedRules ?? 0}
                    </p>
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-xs'>
                    Per-rule results ({runAllResult.results?.length ?? 0})
                  </p>
                  <ScrollArea className='h-64 rounded-md border'>
                    <div className='space-y-1 p-2'>
                      {(runAllResult.results ?? []).map((item, index) => (
                        <div
                          key={`run-all-result-${index}`}
                          className='space-y-1 rounded border px-2 py-1 text-[11px]'
                        >
                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <div className='min-w-0'>
                              <p className='truncate'>
                                {item.ruleKey || `Rule ${item.ruleId ?? '-'}`} •
                                v{item.versionNo ?? '-'} • {item.status ?? '-'}
                              </p>
                              <p className='text-muted-foreground truncate'>
                                #{item.runId ?? '-'} • rows{' '}
                                {item.totalRows ?? 0} • created{' '}
                                {item.createdHits ?? 0} • duplicates{' '}
                                {item.duplicateHits ?? 0}
                              </p>
                            </div>
                            {item.errorMessage ? (
                              <Badge variant='destructive'>Error</Badge>
                            ) : (
                              <Badge variant='outline'>OK</Badge>
                            )}
                          </div>
                          {item.errorMessage ? (
                            <p className='text-destructive truncate'>
                              {item.errorMessage}
                            </p>
                          ) : null}
                          {item.previewRows?.length ? (
                            <details className='rounded border p-2'>
                              <summary className='cursor-pointer text-xs font-medium'>
                                Preview Rows ({item.previewRows.length})
                              </summary>
                              <textarea
                                readOnly
                                className='bg-muted/30 mt-2 h-28 w-full rounded border p-2 font-mono text-[10px]'
                                value={JSON.stringify(
                                  item.previewRows,
                                  null,
                                  2
                                )}
                              />
                            </details>
                          ) : null}
                        </div>
                      ))}
                      {!(runAllResult.results ?? []).length ? (
                        <p className='text-muted-foreground text-xs'>
                          No per-rule results returned.
                        </p>
                      ) : null}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              disabled={runAllMutation.isPending}
              onClick={() => setRunAllDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              disabled={
                runAllMutation.isPending ||
                runAllConfirmText.trim().toUpperCase() !== 'RUN'
              }
              onClick={() => runAllMutation.mutate()}
            >
              {runAllMutation.isPending
                ? runAllDryRun
                  ? 'Running Dry Run...'
                  : 'Running...'
                : runAllDryRun
                  ? 'Dry Run All'
                  : 'Run All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={runAllLogDetailsOpen}
        onOpenChange={(open) => {
          setRunAllLogDetailsOpen(open)
          if (!open) {
            setSelectedRunAllLog(null)
          }
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Run-All Log Details</DialogTitle>
            <DialogDescription>
              Detailed results for manual run-all log entry.
            </DialogDescription>
          </DialogHeader>
          {selectedRunAllLog ? (
            <div className='space-y-4'>
              <div className='grid gap-2 sm:grid-cols-4'>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Log ID</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.id}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Mode</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.dryRun ? 'Dry Run' : 'Execution'}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Run Date</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.runDate ?? '-'}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Status</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.status ?? '-'}
                  </p>
                </div>
              </div>
              <div className='grid gap-2 sm:grid-cols-4'>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Total</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.totalRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Attempted</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.attemptedRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Succeeded</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.succeededRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-2 text-xs'>
                  <p className='text-muted-foreground'>Failed</p>
                  <p className='text-sm font-semibold'>
                    {selectedRunAllLog.failedRules ?? 0}
                  </p>
                </div>
              </div>
              {selectedRunAllLog.errorMessage ? (
                <div className='rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700'>
                  {selectedRunAllLog.errorMessage}
                </div>
              ) : null}
              <div className='space-y-2'>
                <p className='text-sm font-medium'>
                  Per-rule results ({selectedRunAllLog.results?.length ?? 0})
                </p>
                <ScrollArea className='h-[50vh] rounded-md border'>
                  <div className='space-y-1 p-2'>
                    {(selectedRunAllLog.results ?? []).map((item, index) => (
                      <div
                        key={`run-all-log-result-${selectedRunAllLog.id}-${index}`}
                        className='space-y-1 rounded border px-2 py-1 text-[11px]'
                      >
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <div className='min-w-0'>
                            <p className='truncate'>
                              {item.ruleKey || `Rule ${item.ruleId ?? '-'}`} • v
                              {item.versionNo ?? '-'} • {item.status ?? '-'}
                            </p>
                            <p className='text-muted-foreground truncate'>
                              #{item.runId ?? '-'} • rows {item.totalRows ?? 0}{' '}
                              • created {item.createdHits ?? 0} • duplicates{' '}
                              {item.duplicateHits ?? 0}
                            </p>
                          </div>
                          {item.errorMessage ? (
                            <Badge variant='destructive'>Error</Badge>
                          ) : (
                            <Badge variant='outline'>OK</Badge>
                          )}
                        </div>
                        {item.errorMessage ? (
                          <p className='text-destructive truncate'>
                            {item.errorMessage}
                          </p>
                        ) : null}
                        {item.previewRows?.length ? (
                          <details className='rounded border p-2'>
                            <summary className='cursor-pointer text-xs font-medium'>
                              Preview Rows ({item.previewRows.length})
                            </summary>
                            <textarea
                              readOnly
                              className='bg-muted/30 mt-2 h-28 w-full rounded border p-2 font-mono text-[10px]'
                              value={JSON.stringify(item.previewRows, null, 2)}
                            />
                          </details>
                        ) : null}
                      </div>
                    ))}
                    {!(selectedRunAllLog.results ?? []).length ? (
                      <p className='text-muted-foreground text-xs'>
                        No per-rule results stored for this log.
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>No log selected.</p>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setRunAllLogDetailsOpen(false)
                setSelectedRunAllLog(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revalidateDialogOpen}
        onOpenChange={setRevalidateDialogOpen}
      >
        <DialogContent className='max-h-[90vh] max-w-6xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Revalidate All Rules Report</DialogTitle>
            <DialogDescription>
              Guardrail validation report for all published rules.
            </DialogDescription>
          </DialogHeader>
          {revalidateReport ? (
            <div className='space-y-4'>
              <div className='grid gap-2 sm:grid-cols-5'>
                <div className='rounded-md border p-3 text-xs'>
                  <p className='text-muted-foreground'>Published</p>
                  <p className='text-sm font-semibold'>
                    {revalidateReport.totalPublishedRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-3 text-xs'>
                  <p className='text-muted-foreground'>Healthy</p>
                  <p className='text-sm font-semibold'>
                    {revalidateReport.healthyRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-3 text-xs'>
                  <p className='text-muted-foreground'>Degraded</p>
                  <p className='text-sm font-semibold'>
                    {revalidateReport.degradedRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-3 text-xs'>
                  <p className='text-muted-foreground'>Broken</p>
                  <p className='text-sm font-semibold'>
                    {revalidateReport.brokenRules ?? 0}
                  </p>
                </div>
                <div className='rounded-md border p-3 text-xs'>
                  <p className='text-muted-foreground'>Auto-run Disabled</p>
                  <p className='text-sm font-semibold'>
                    {revalidateReport.autoRunDisabledRules ?? 0}
                  </p>
                </div>
              </div>
              <p className='text-muted-foreground text-xs'>
                Checked:{' '}
                {revalidateReport.checkedAt
                  ? new Date(revalidateReport.checkedAt).toLocaleString('en-IN')
                  : '-'}
              </p>

              {!(revalidateReport.brokenRuleReports ?? []).length ? (
                <p className='text-muted-foreground text-sm'>
                  No degraded or broken rule details returned.
                </p>
              ) : (
                <ScrollArea className='h-[48vh] rounded-md border p-3'>
                  <div className='space-y-3'>
                    {(revalidateReport.brokenRuleReports ?? []).map((item) => (
                      <div
                        key={`${item.ruleId}-${item.versionNo}`}
                        className='space-y-2 rounded-md border p-3'
                      >
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-sm font-semibold'>
                            {item.ruleKey} • v{item.versionNo ?? '-'}
                          </p>
                          <Badge
                            variant={
                              item.healthStatus === 'BROKEN'
                                ? 'destructive'
                                : item.healthStatus === 'DEGRADED'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {item.healthStatus ?? 'UNKNOWN'}
                          </Badge>
                          <Badge variant='outline'>
                            Errors: {item.errorCount ?? 0}
                          </Badge>
                          <Badge variant='outline'>
                            Warnings: {item.warningCount ?? 0}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground text-xs'>
                          {item.ruleName} • Active: {item.active ? 'Yes' : 'No'}{' '}
                          • Auto-run: {item.autoRunEnabled ? 'Yes' : 'No'}
                        </p>
                        <p className='text-xs whitespace-pre-wrap'>
                          {item.healthMessage || '-'}
                        </p>
                        {(item.errors ?? []).length ? (
                          <div className='space-y-1'>
                            {(item.errors ?? []).map((issue, idx) => (
                              <p
                                key={`${item.ruleId}-e-${idx}`}
                                className='text-destructive text-xs'
                              >
                                [{issue.code || 'ERROR'}] {issue.message || '-'}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {(item.warnings ?? []).length ? (
                          <div className='space-y-1'>
                            {(item.warnings ?? []).map((issue, idx) => (
                              <p
                                key={`${item.ruleId}-w-${idx}`}
                                className='text-muted-foreground text-xs'
                              >
                                [{issue.code || 'WARN'}] {issue.message || '-'}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>
              No report available.
            </p>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRevalidateDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importEngineOpen} onOpenChange={setImportEngineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Engine Configuration</DialogTitle>
            <DialogDescription>
              Import full EWS engine package (rules, adapters, config,
              questions).
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <LabeledField label='Load JSON File'>
              <Input
                type='file'
                accept='application/json,.json'
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void file
                    .text()
                    .then((text) => setImportEngineJson(text))
                    .catch(() =>
                      toast.error('Could not read selected JSON file.')
                    )
                }}
              />
            </LabeledField>
            <LabeledField label='Import JSON'>
              <Textarea
                value={importEngineJson}
                onChange={(e) => setImportEngineJson(e.target.value)}
                className='h-36 font-mono text-xs'
                placeholder='Paste export JSON here'
              />
            </LabeledField>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setImportEngineOpen(false)}
              disabled={importEngineMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={
                importEngineMutation.isPending || !importEngineJson.trim()
              }
              onClick={() => importEngineMutation.mutate()}
            >
              Import Engine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importRuleOpen} onOpenChange={setImportRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Rule Configuration</DialogTitle>
            <DialogDescription>
              Import a single rule bundle including dependencies from a JSON
              export.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <LabeledField label='Load JSON File'>
              <Input
                type='file'
                accept='application/json,.json'
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void file
                    .text()
                    .then((text) => setImportRuleJson(text))
                    .catch(() =>
                      toast.error('Could not read selected JSON file.')
                    )
                }}
              />
            </LabeledField>
            <LabeledField label='Import JSON'>
              <Textarea
                value={importRuleJson}
                onChange={(e) => setImportRuleJson(e.target.value)}
                className='h-36 font-mono text-xs'
                placeholder='Paste rule export JSON here'
              />
            </LabeledField>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setImportRuleOpen(false)}
              disabled={importRuleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={importRuleMutation.isPending || !importRuleJson.trim()}
              onClick={() => importRuleMutation.mutate()}
            >
              Import Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Rule</DialogTitle>
            <DialogDescription>
              Create a rule definition, then continue in the workspace to
              configure versions and execution.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <LabeledField label='Rule Key'>
              <Input
                value={newRuleKey}
                onChange={(e) =>
                  setNewRuleKey(
                    e.target.value.toUpperCase().replace(/\s+/g, '_')
                  )
                }
                placeholder='HIGH_CREDIT_TURNOVER'
              />
            </LabeledField>
            <LabeledField label='Rule Name'>
              <Input
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder='High Credit Turnover'
              />
            </LabeledField>
            <div className='grid gap-3 md:grid-cols-2'>
              <LabeledField label='Severity'>
                <Select
                  value={newRuleSeverityKey}
                  onValueChange={setNewRuleSeverityKey}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select severity' />
                  </SelectTrigger>
                  <SelectContent>
                    {(severityOptions.length
                      ? severityOptions
                      : ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledField>
              <LabeledField label='Dedupe Mode'>
                <Select
                  value={newRuleDedupeMode}
                  onValueChange={(value) =>
                    setNewRuleDedupeMode(
                      value as 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PERIOD'>PERIOD</SelectItem>
                    <SelectItem value='DAY'>DAY</SelectItem>
                    <SelectItem value='WINDOW'>WINDOW</SelectItem>
                    <SelectItem value='NONE'>NONE</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
            {newRuleDedupeMode === 'WINDOW' ? (
              <LabeledField label='Dedupe Window Days'>
                <Input
                  value={newRuleDedupeWindowDays}
                  onChange={(e) => setNewRuleDedupeWindowDays(e.target.value)}
                  type='number'
                  min={1}
                />
              </LabeledField>
            ) : null}
            <div className='rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-medium'>Enable Auto-run</Label>
                <Switch
                  checked={newRuleAutoRun}
                  onCheckedChange={setNewRuleAutoRun}
                />
              </div>
              {newRuleAutoRun ? (
                <div className='mt-3 space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Cron Expression
                  </Label>
                  <Input
                    value={newRuleCron}
                    onChange={(e) => setNewRuleCron(e.target.value)}
                    placeholder='0 30 6 * * *'
                  />
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                createRuleMutation.isPending ||
                !newRuleKey.trim() ||
                !newRuleName.trim()
              }
              onClick={() => createRuleMutation.mutate()}
            >
              Create and Open Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LabeledField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-xs'>{label}</Label>
      {children}
    </div>
  )
}
