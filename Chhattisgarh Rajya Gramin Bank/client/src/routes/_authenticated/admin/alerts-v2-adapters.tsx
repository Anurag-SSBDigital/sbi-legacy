/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Download,
  Plus,
  RefreshCw,
  Rocket,
  TestTube2,
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
  createEwsV2Adapter,
  createEwsV2AdapterVersion,
  exportEwsV2AdapterBundle,
  importEwsV2AdapterBundle,
  listEwsV2Adapters,
  listEwsV2AdapterVersions,
  publishEwsV2AdapterVersion,
  runEwsV2Adapter,
  updateEwsV2Adapter,
  type EwsV2ImportExportBundle,
  type EwsV2ImportResult,
  type EwsV2AdapterRunResult,
} from '@/features/alerts-v2/ews-v2-rule-api'

export const Route = createFileRoute(
  '/_authenticated/admin/alerts-v2-adapters'
)({
  component: RouteComponent,
})

const parseObjectJson = (text: string) => {
  const raw = text.trim()
  if (!raw) return undefined
  const parsed = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
    throw new Error('Expected JSON object.')
  }
  return parsed as Record<string, unknown>
}

const pretty = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return String(value ?? '')
  }
}

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
    `Adapters +${result.createdAdapters ?? 0}/${result.updatedAdapters ?? 0}`,
    `Versions +${result.createdAdapterVersions ?? 0}/${result.updatedAdapterVersions ?? 0}`,
    `Warnings ${result.warnings?.length ?? 0}`,
  ].join(' • ')

function RouteComponent() {
  const canView = useCanAccess('ews_alert', 'view')
  const canCreate = useCanAccess('ews_alert', 'create')
  const canUpdate = useCanAccess('ews_alert', 'update')

  const [search, setSearch] = useState('')
  const [selectedAdapterId, setSelectedAdapterId] = useState<number | null>(
    null
  )

  const [createAdapterOpen, setCreateAdapterOpen] = useState(false)
  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [importAdapterOpen, setImportAdapterOpen] = useState(false)
  const [importAdapterJson, setImportAdapterJson] = useState('')

  const [newAdapterKey, setNewAdapterKey] = useState('')
  const [newAdapterName, setNewAdapterName] = useState('')
  const [newAdapterDescription, setNewAdapterDescription] = useState('')

  const [editAdapterName, setEditAdapterName] = useState('')
  const [editAdapterDescription, setEditAdapterDescription] = useState('')
  const [editAdapterActive, setEditAdapterActive] = useState(true)

  const [versionMethod, setVersionMethod] = useState<
    'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  >('GET')
  const [versionEndpointUrl, setVersionEndpointUrl] = useState('')
  const [versionHeaders, setVersionHeaders] = useState('{}')
  const [versionQueryParams, setVersionQueryParams] = useState('{}')
  const [versionRequestBody, setVersionRequestBody] = useState('')
  const [versionAuthType, setVersionAuthType] = useState<
    'NONE' | 'BEARER' | 'BASIC' | 'API_KEY_HEADER' | 'API_KEY_QUERY'
  >('NONE')
  const [versionAuthConfig, setVersionAuthConfig] = useState('{}')
  const [versionResponsePath, setVersionResponsePath] = useState('')
  const [versionRowMapping, setVersionRowMapping] = useState('{}')
  const [versionNotes, setVersionNotes] = useState('')

  const [testVersionNo, setTestVersionNo] = useState('published')
  const [testParams, setTestParams] = useState('{}')
  const [testResult, setTestResult] = useState<EwsV2AdapterRunResult | null>(
    null
  )

  const adaptersQuery = useQuery({
    queryKey: ['ews-v2-adapters'],
    queryFn: listEwsV2Adapters,
    enabled: canView,
  })

  const filteredAdapters = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return adaptersQuery.data ?? []
    return (adaptersQuery.data ?? []).filter((adapter) =>
      `${adapter.adapterKey} ${adapter.adapterName} ${adapter.description ?? ''}`
        .toLowerCase()
        .includes(term)
    )
  }, [adaptersQuery.data, search])

  useEffect(() => {
    if (!selectedAdapterId && filteredAdapters.length) {
      setSelectedAdapterId(filteredAdapters[0].id)
      return
    }
    if (
      selectedAdapterId &&
      !filteredAdapters.some((adapter) => adapter.id === selectedAdapterId)
    ) {
      setSelectedAdapterId(filteredAdapters[0]?.id ?? null)
    }
  }, [filteredAdapters, selectedAdapterId])

  const selectedAdapter = useMemo(
    () =>
      (adaptersQuery.data ?? []).find(
        (adapter) => adapter.id === selectedAdapterId
      ) ?? null,
    [adaptersQuery.data, selectedAdapterId]
  )

  useEffect(() => {
    if (!selectedAdapter) return
    setEditAdapterName(selectedAdapter.adapterName ?? '')
    setEditAdapterDescription(selectedAdapter.description ?? '')
    setEditAdapterActive(Boolean(selectedAdapter.active))
    setTestResult(null)
  }, [selectedAdapter])

  const versionsQuery = useQuery({
    queryKey: ['ews-v2-adapter-versions', selectedAdapterId],
    queryFn: () => listEwsV2AdapterVersions(Number(selectedAdapterId)),
    enabled: Number(selectedAdapterId) > 0,
  })

  const createAdapterMutation = useMutation({
    mutationFn: () =>
      createEwsV2Adapter({
        adapterKey: newAdapterKey.trim().toUpperCase(),
        adapterName: newAdapterName.trim(),
        description: newAdapterDescription.trim() || undefined,
      }),
    onSuccess: async (adapter) => {
      toast.success('Adapter created.')
      setCreateAdapterOpen(false)
      setNewAdapterKey('')
      setNewAdapterName('')
      setNewAdapterDescription('')
      await adaptersQuery.refetch()
      setSelectedAdapterId(adapter.id)
    },
    onError: (error) => toastError(error, 'Could not create adapter.'),
  })

  const updateAdapterMutation = useMutation({
    mutationFn: () => {
      if (!selectedAdapterId) throw new Error('Select an adapter first.')
      return updateEwsV2Adapter(selectedAdapterId, {
        adapterName: editAdapterName.trim() || undefined,
        description: editAdapterDescription.trim() || undefined,
        active: editAdapterActive,
      })
    },
    onSuccess: async () => {
      toast.success('Adapter updated.')
      await adaptersQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update adapter.'),
  })

  const createVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedAdapterId) throw new Error('Select an adapter first.')
      return createEwsV2AdapterVersion(selectedAdapterId, {
        httpMethod: versionMethod,
        endpointUrl: versionEndpointUrl.trim(),
        headers: parseObjectJson(versionHeaders) as
          | Record<string, string>
          | undefined,
        queryParams: parseObjectJson(versionQueryParams) as
          | Record<string, string>
          | undefined,
        requestBodyTemplate: versionRequestBody.trim() || undefined,
        authType: versionAuthType,
        authConfig: parseObjectJson(versionAuthConfig),
        responsePath: versionResponsePath.trim() || undefined,
        rowMapping: parseObjectJson(versionRowMapping) as
          | Record<string, string>
          | undefined,
        notes: versionNotes.trim() || undefined,
      })
    },
    onSuccess: async () => {
      toast.success('Adapter version created.')
      setCreateVersionOpen(false)
      setVersionMethod('GET')
      setVersionEndpointUrl('')
      setVersionHeaders('{}')
      setVersionQueryParams('{}')
      setVersionRequestBody('')
      setVersionAuthType('NONE')
      setVersionAuthConfig('{}')
      setVersionResponsePath('')
      setVersionRowMapping('{}')
      setVersionNotes('')
      await versionsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not create adapter version.'),
  })

  const publishVersionMutation = useMutation({
    mutationFn: (versionNo: number) => {
      if (!selectedAdapterId) throw new Error('Select an adapter first.')
      return publishEwsV2AdapterVersion(selectedAdapterId, versionNo)
    },
    onSuccess: async () => {
      toast.success('Adapter version published.')
      await Promise.all([adaptersQuery.refetch(), versionsQuery.refetch()])
    },
    onError: (error) => toastError(error, 'Could not publish adapter version.'),
  })

  const testMutation = useMutation({
    mutationFn: () => {
      if (!selectedAdapter?.adapterKey) {
        throw new Error('Select an adapter first.')
      }
      return runEwsV2Adapter(selectedAdapter.adapterKey, {
        versionNo:
          testVersionNo === 'published' ? undefined : Number(testVersionNo),
        params: parseObjectJson(testParams),
      })
    },
    onSuccess: (result) => {
      setTestResult(result)
      toast.success('Adapter test run completed.')
    },
    onError: (error) => toastError(error, 'Could not run adapter test.'),
  })

  const exportAdapterMutation = useMutation({
    mutationFn: () => {
      if (!selectedAdapterId) {
        throw new Error('Select an adapter first.')
      }
      return exportEwsV2AdapterBundle(selectedAdapterId)
    },
    onSuccess: (bundle) => {
      const key =
        selectedAdapter?.adapterKey || `adapter-${selectedAdapterId ?? 'x'}`
      triggerJsonDownload(
        `ews-v2-adapter-${key}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        bundle
      )
      toast.success('Adapter configuration exported.')
    },
    onError: (error) =>
      toastError(error, 'Could not export adapter configuration.'),
  })

  const importAdapterMutation = useMutation({
    mutationFn: () =>
      importEwsV2AdapterBundle(
        JSON.parse(importAdapterJson) as EwsV2ImportExportBundle
      ),
    onSuccess: async (result) => {
      toast.success(`Adapter import completed. ${importSummary(result)}`)
      setImportAdapterOpen(false)
      setImportAdapterJson('')
      await Promise.all([adaptersQuery.refetch(), versionsQuery.refetch()])
    },
    onError: (error) =>
      toastError(error, 'Could not import adapter configuration.'),
  })

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EWS Adapters</CardTitle>
          <CardDescription>
            You do not have access to this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-semibold'>EWS Adapters</h1>
          <p className='text-muted-foreground text-sm'>
            Manage API adapters, version them, publish, and test payload
            mapping.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={!selectedAdapterId || exportAdapterMutation.isPending}
            onClick={() => exportAdapterMutation.mutate()}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Selected
          </Button>
          <Button variant='outline' onClick={() => setImportAdapterOpen(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Import Adapter
          </Button>
          <Button
            variant='outline'
            onClick={() => void adaptersQuery.refetch()}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button
            disabled={!canCreate}
            onClick={() => setCreateAdapterOpen(true)}
          >
            <Plus className='mr-2 h-4 w-4' />
            New Adapter
          </Button>
          <Button
            variant='outline'
            disabled={!canCreate || !selectedAdapterId}
            onClick={() => setCreateVersionOpen(true)}
          >
            <Plus className='mr-2 h-4 w-4' />
            New Version
          </Button>
        </div>
      </div>

      <div className='grid items-start gap-4 xl:grid-cols-[320px_1fr]'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Adapters</CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search adapters...'
            />
          </CardHeader>
          <CardContent className='pt-0'>
            <ScrollArea className='h-[740px]'>
              <div className='space-y-2 pr-2'>
                {filteredAdapters.map((adapter) => (
                  <button
                    key={adapter.id}
                    type='button'
                    onClick={() => setSelectedAdapterId(adapter.id)}
                    className={`w-full rounded-md border p-2 text-left ${
                      selectedAdapterId === adapter.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <p className='truncate text-sm font-medium'>
                        {adapter.adapterKey}
                      </p>
                      <Badge variant={adapter.active ? 'default' : 'outline'}>
                        {adapter.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className='truncate text-xs'>{adapter.adapterName}</p>
                    <p className='text-muted-foreground text-[11px]'>
                      Published v{adapter.publishedVersionNo ?? '-'}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedAdapter
                  ? `${selectedAdapter.adapterName} (${selectedAdapter.adapterKey})`
                  : 'Select an adapter'}
              </CardTitle>
              <CardDescription>
                Adapter metadata and publish state.
              </CardDescription>
            </CardHeader>
            {selectedAdapter ? (
              <CardContent className='space-y-3'>
                <div className='grid gap-2 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Adapter Key</Label>
                    <Input value={selectedAdapter.adapterKey} readOnly />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Published Version</Label>
                    <Input
                      value={
                        selectedAdapter.publishedVersionNo
                          ? `v${selectedAdapter.publishedVersionNo}`
                          : '-'
                      }
                      readOnly
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Adapter Name</Label>
                    <Input
                      value={editAdapterName}
                      onChange={(e) => setEditAdapterName(e.target.value)}
                    />
                  </div>
                  <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                    <Label className='text-xs'>Active</Label>
                    <Switch
                      checked={editAdapterActive}
                      onCheckedChange={setEditAdapterActive}
                    />
                  </div>
                  <div className='space-y-1 md:col-span-2'>
                    <Label className='text-xs'>Description</Label>
                    <Textarea
                      value={editAdapterDescription}
                      onChange={(e) =>
                        setEditAdapterDescription(e.target.value)
                      }
                      className='h-20'
                    />
                  </div>
                </div>
                <Button
                  disabled={!canUpdate || updateAdapterMutation.isPending}
                  onClick={() => updateAdapterMutation.mutate()}
                >
                  <Wrench className='mr-2 h-4 w-4' />
                  Save Adapter
                </Button>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Versions</CardTitle>
              <CardDescription>
                Publish one version at a time for stable execution.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {(versionsQuery.data ?? []).map((version) => (
                <div key={version.id} className='rounded-md border p-2 text-xs'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <p>
                        <b>v{version.versionNo}</b> • {version.status}
                      </p>
                      <p className='text-muted-foreground'>
                        {version.httpMethod} {version.endpointUrl}
                      </p>
                      <p className='text-muted-foreground'>
                        auth: {version.authType || 'NONE'} • responsePath:{' '}
                        {version.responsePath || '(root)'}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      disabled={
                        !canUpdate ||
                        version.status === 'PUBLISHED' ||
                        publishVersionMutation.isPending
                      }
                      onClick={() =>
                        publishVersionMutation.mutate(version.versionNo)
                      }
                    >
                      <Rocket className='mr-1 h-4 w-4' />
                      Publish
                    </Button>
                  </div>
                </div>
              ))}
              {!versionsQuery.isFetching &&
              !(versionsQuery.data ?? []).length ? (
                <p className='text-muted-foreground text-sm'>
                  No versions yet.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Test Adapter</CardTitle>
              <CardDescription>
                Run adapter on-demand and inspect mapped rows.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='grid gap-2 md:grid-cols-2'>
                <div className='space-y-1'>
                  <Label className='text-xs'>Version</Label>
                  <Select
                    value={testVersionNo}
                    onValueChange={setTestVersionNo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='published'>Published</SelectItem>
                      {(versionsQuery.data ?? []).map((version) => (
                        <SelectItem
                          key={version.id}
                          value={String(version.versionNo)}
                        >
                          v{version.versionNo} ({version.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Runtime Params JSON</Label>
                <Textarea
                  value={testParams}
                  onChange={(e) => setTestParams(e.target.value)}
                  className='h-24 font-mono text-xs'
                  placeholder='{"accountNo":"1234567890"}'
                />
              </div>
              <Button
                variant='outline'
                disabled={!selectedAdapter || testMutation.isPending}
                onClick={() => testMutation.mutate()}
              >
                <TestTube2 className='mr-2 h-4 w-4' />
                Run Test
              </Button>

              {testResult ? (
                <div className='space-y-2 rounded-md border p-2 text-xs'>
                  <p>
                    adapter: <b>{testResult.adapterKey}</b> • version:{' '}
                    <b>{testResult.versionNo}</b> • rows:{' '}
                    <b>{testResult.totalRows ?? 0}</b>
                  </p>
                  <Textarea
                    readOnly
                    value={pretty(testResult.previewRows)}
                    className='h-56 font-mono text-xs'
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={importAdapterOpen} onOpenChange={setImportAdapterOpen}>
        <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Import Adapter Configuration</DialogTitle>
            <DialogDescription>
              Import a single adapter package with all of its versions.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>Load JSON File</Label>
              <Input
                type='file'
                accept='application/json,.json'
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void file
                    .text()
                    .then((text) => setImportAdapterJson(text))
                    .catch(() =>
                      toast.error('Could not read selected JSON file.')
                    )
                }}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Import JSON</Label>
              <Textarea
                value={importAdapterJson}
                onChange={(e) => setImportAdapterJson(e.target.value)}
                className='h-64 font-mono text-xs'
                placeholder='Paste adapter export JSON here'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setImportAdapterOpen(false)}
              disabled={importAdapterMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={
                importAdapterMutation.isPending || !importAdapterJson.trim()
              }
              onClick={() => importAdapterMutation.mutate()}
            >
              Import Adapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createAdapterOpen} onOpenChange={setCreateAdapterOpen}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Adapter</DialogTitle>
            <DialogDescription>
              Define a stable adapter key and friendly name.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Input
              value={newAdapterKey}
              onChange={(e) =>
                setNewAdapterKey(
                  e.target.value.toUpperCase().replace(/\s+/g, '_')
                )
              }
              placeholder='Adapter Key'
            />
            <Input
              value={newAdapterName}
              onChange={(e) => setNewAdapterName(e.target.value)}
              placeholder='Adapter Name'
            />
            <Textarea
              value={newAdapterDescription}
              onChange={(e) => setNewAdapterDescription(e.target.value)}
              className='h-20'
              placeholder='Description'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setCreateAdapterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={createAdapterMutation.isPending}
              onClick={() => createAdapterMutation.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createVersionOpen} onOpenChange={setCreateVersionOpen}>
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Adapter Version</DialogTitle>
            <DialogDescription>
              Configure request, auth, response path, and row mapping.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2 md:grid-cols-2'>
            <div className='space-y-1'>
              <Label className='text-xs'>HTTP Method</Label>
              <Select
                value={versionMethod}
                onValueChange={(value) =>
                  setVersionMethod(
                    value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GET'>GET</SelectItem>
                  <SelectItem value='POST'>POST</SelectItem>
                  <SelectItem value='PUT'>PUT</SelectItem>
                  <SelectItem value='PATCH'>PATCH</SelectItem>
                  <SelectItem value='DELETE'>DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Auth Type</Label>
              <Select
                value={versionAuthType}
                onValueChange={(value) =>
                  setVersionAuthType(
                    value as
                      | 'NONE'
                      | 'BEARER'
                      | 'BASIC'
                      | 'API_KEY_HEADER'
                      | 'API_KEY_QUERY'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='NONE'>NONE</SelectItem>
                  <SelectItem value='BEARER'>BEARER</SelectItem>
                  <SelectItem value='BASIC'>BASIC</SelectItem>
                  <SelectItem value='API_KEY_HEADER'>API_KEY_HEADER</SelectItem>
                  <SelectItem value='API_KEY_QUERY'>API_KEY_QUERY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1 md:col-span-2'>
              <Label className='text-xs'>Endpoint URL</Label>
              <Input
                value={versionEndpointUrl}
                onChange={(e) => setVersionEndpointUrl(e.target.value)}
                placeholder='https://example.com/api/path'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Response Path</Label>
              <Input
                value={versionResponsePath}
                onChange={(e) => setVersionResponsePath(e.target.value)}
                placeholder='data.items'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Notes</Label>
              <Input
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder='Notes'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Headers JSON</Label>
              <Textarea
                value={versionHeaders}
                onChange={(e) => setVersionHeaders(e.target.value)}
                className='h-24 font-mono text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Query Params JSON</Label>
              <Textarea
                value={versionQueryParams}
                onChange={(e) => setVersionQueryParams(e.target.value)}
                className='h-24 font-mono text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Auth Config JSON</Label>
              <Textarea
                value={versionAuthConfig}
                onChange={(e) => setVersionAuthConfig(e.target.value)}
                className='h-24 font-mono text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Row Mapping JSON</Label>
              <Textarea
                value={versionRowMapping}
                onChange={(e) => setVersionRowMapping(e.target.value)}
                className='h-24 font-mono text-xs'
              />
            </div>
            <div className='space-y-1 md:col-span-2'>
              <Label className='text-xs'>Request Body Template</Label>
              <Textarea
                value={versionRequestBody}
                onChange={(e) => setVersionRequestBody(e.target.value)}
                className='h-28 font-mono text-xs'
                placeholder='{"accountNo":"{{accountNo}}"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setCreateVersionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={createVersionMutation.isPending}
              onClick={() => createVersionMutation.mutate()}
            >
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
