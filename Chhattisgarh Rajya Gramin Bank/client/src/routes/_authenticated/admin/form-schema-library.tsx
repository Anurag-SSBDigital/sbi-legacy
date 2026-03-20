import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Code2,
  Download,
  FileCode2,
  FileJson2,
  History,
  Network,
  RefreshCw,
  SplitSquareHorizontal,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { toastError } from '@/lib/utils.ts'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  createWorkflowFormSchemaVersion,
  deleteWorkflowFormSchemaVersion,
  getWorkflowFormSchemaUsage,
  listWorkflowFormSchemaKeys,
  listWorkflowFormSchemas,
  setWorkflowFormSchemaActive,
  type WorkflowFormSchemaCreateRequest,
  type WorkflowFormSchemaRecord,
  type WorkflowFormSchemaUsageRecord,
} from '@/features/form-designer/workflow-form-schema-api'

export const Route = createFileRoute(
  '/_authenticated/admin/form-schema-library'
)({
  component: RouteComponent,
})

const safeJsonPretty = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return '{}'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return String(value)
  }
}

const toCreatePayloadFromVersion = (
  version: WorkflowFormSchemaRecord
): WorkflowFormSchemaCreateRequest => ({
  schemaKey: String(version.schemaKey ?? '').trim(),
  name: String(version.name ?? '').trim() || undefined,
  description: version.description ?? undefined,
  schemaJson:
    typeof version.schemaJson === 'string' ? version.schemaJson : '{}',
  fields: (version.fields ?? []).map((field) => ({
    fieldKey: String(field.fieldKey ?? '').trim(),
    fieldLabel: field.fieldLabel ?? undefined,
    fieldType: String(field.fieldType ?? '').trim(),
    fieldOrder: field.fieldOrder ?? 0,
    required: Boolean(field.required),
    fieldJson: field.fieldJson ?? undefined,
  })),
})

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function RouteComponent() {
  const canCreate = useCanAccess('workflow', 'create')
  const canUpdate = useCanAccess('workflow', 'update')
  const canDelete = useCanAccess('workflow', 'delete')

  const [selectedKey, setSelectedKey] = useState<string>('')
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null
  )
  const [diffLeftId, setDiffLeftId] = useState<number | null>(null)
  const [diffRightId, setDiffRightId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [deleteTarget, setDeleteTarget] =
    useState<WorkflowFormSchemaRecord | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const keyQuery = useQuery({
    queryKey: ['wf-form-schema-keys'],
    queryFn: () => listWorkflowFormSchemaKeys(),
  })

  const filteredKeys = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return keyQuery.data ?? []
    return (keyQuery.data ?? []).filter((row) => {
      const key = String(row.schemaKey ?? '').toLowerCase()
      const name = String(row.latestName ?? '').toLowerCase()
      return key.includes(term) || name.includes(term)
    })
  }, [keyQuery.data, search])

  useEffect(() => {
    if (!selectedKey && filteredKeys.length > 0) {
      setSelectedKey(String(filteredKeys[0].schemaKey ?? ''))
    }
    if (
      selectedKey &&
      !filteredKeys.some((item) => item.schemaKey === selectedKey)
    ) {
      setSelectedKey(filteredKeys[0]?.schemaKey ?? '')
    }
  }, [filteredKeys, selectedKey])

  const versionsQuery = useQuery({
    queryKey: ['wf-form-schema-versions', selectedKey],
    queryFn: () => listWorkflowFormSchemas(selectedKey),
    enabled: Boolean(selectedKey),
  })

  const versions = useMemo(
    () =>
      [...(versionsQuery.data ?? [])].sort(
        (a, b) => Number(b.version ?? 0) - Number(a.version ?? 0)
      ),
    [versionsQuery.data]
  )

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      const firstId = Number(versions[0].id)
      if (firstId > 0) setSelectedVersionId(firstId)
    }
    if (
      selectedVersionId &&
      !versions.some((item) => Number(item.id) === Number(selectedVersionId))
    ) {
      const nextId = Number(versions[0]?.id ?? 0)
      setSelectedVersionId(nextId > 0 ? nextId : null)
    }
  }, [versions, selectedVersionId])

  useEffect(() => {
    if (!diffLeftId && versions.length > 0) {
      const left = Number(versions[0].id ?? 0)
      setDiffLeftId(left > 0 ? left : null)
    }
    if (!diffRightId && versions.length > 1) {
      const right = Number(versions[1].id ?? 0)
      setDiffRightId(right > 0 ? right : null)
    }
  }, [versions, diffLeftId, diffRightId])

  const selectedVersion = useMemo(
    () =>
      versions.find((item) => Number(item.id) === Number(selectedVersionId)),
    [versions, selectedVersionId]
  )

  const usageQuery = useQuery({
    queryKey: ['wf-form-schema-usage', selectedVersionId],
    queryFn: () => getWorkflowFormSchemaUsage(Number(selectedVersionId)),
    enabled: Number(selectedVersionId) > 0,
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setWorkflowFormSchemaActive(id, active),
  })

  const cloneMutation = useMutation({
    mutationFn: (payload: WorkflowFormSchemaCreateRequest) =>
      createWorkflowFormSchemaVersion(payload),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWorkflowFormSchemaVersion(id),
  })

  const refreshAll = async () => {
    await Promise.all([
      keyQuery.refetch(),
      versionsQuery.refetch(),
      usageQuery.refetch(),
    ])
  }

  const handleSetPublished = async (id: number, active: boolean) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update schema lifecycle.')
      return
    }
    try {
      await publishMutation.mutateAsync({ id, active })
      toast.success(
        active ? 'Schema version published.' : 'Schema version retired.'
      )
      await refreshAll()
    } catch (error) {
      toastError(error, 'Failed to update schema lifecycle.')
    }
  }

  const handleCloneVersion = async (version: WorkflowFormSchemaRecord) => {
    if (!canCreate) {
      toast.error('You do not have permission to create schema versions.')
      return
    }
    try {
      const payload = toCreatePayloadFromVersion(version)
      payload.name = `${payload.name ?? payload.schemaKey} (Clone)`
      await cloneMutation.mutateAsync(payload)
      toast.success('Cloned as a new version.')
      await refreshAll()
    } catch (error) {
      toastError(error, 'Failed to clone schema version.')
    }
  }

  const handleImportVersion = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to import schema versions.')
      return
    }
    try {
      const parsed = JSON.parse(importText) as WorkflowFormSchemaCreateRequest
      if (!parsed.schemaKey || !parsed.schemaJson) {
        throw new Error('schemaKey and schemaJson are required.')
      }
      await cloneMutation.mutateAsync(parsed)
      toast.success('Schema version imported successfully.')
      setImportOpen(false)
      setImportText('')
      await refreshAll()
    } catch (error) {
      toastError(error, 'Failed to import schema version JSON.')
    }
  }

  const openDeleteDialog = (version: WorkflowFormSchemaRecord) => {
    setDeleteTarget(version)
    setDeleteConfirmText('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return
    if (!canDelete) {
      toast.error('You do not have permission to delete schema versions.')
      return
    }
    try {
      await deleteMutation.mutateAsync(Number(deleteTarget.id))
      toast.success('Schema version deleted.')
      setDeleteTarget(null)
      setDeleteConfirmText('')
      await refreshAll()
    } catch (error) {
      toastError(error, 'Delete blocked. Retire the version if it is in use.')
    }
  }

  const diffLeft = versions.find(
    (item) => Number(item.id) === Number(diffLeftId)
  )
  const diffRight = versions.find(
    (item) => Number(item.id) === Number(diffRightId)
  )

  const canDeleteNow =
    deleteTarget &&
    deleteConfirmText.trim() ===
      `${deleteTarget.schemaKey}:v${deleteTarget.version}`.trim()

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <FileCode2 className='h-5 w-5' />
            Form Schema Library
          </h1>
          <p className='text-muted-foreground text-sm'>
            Manage versioned form schemas, publish/retire lifecycle, and usage
            mapping.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' onClick={() => void refreshAll()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button
            variant='outline'
            onClick={() => setImportOpen(true)}
            disabled={!canCreate}
          >
            <Upload className='mr-2 h-4 w-4' />
            Import Version JSON
          </Button>
          <Button asChild disabled={!canCreate}>
            <Link to='/admin/form-designer'>Open Designer</Link>
          </Button>
        </div>
      </div>

      <div className='grid items-start gap-6 xl:grid-cols-[320px_1fr]'>
        <Card className='h-full'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Schema Keys</CardTitle>
            <CardDescription>
              Version-centric inventory with usage counts.
            </CardDescription>
            <Input
              placeholder='Search key or name...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </CardHeader>
          <CardContent className='pt-0'>
            <ScrollArea className='h-[520px]'>
              <div className='space-y-2 pr-2'>
                {filteredKeys.map((row) => {
                  const key = String(row.schemaKey ?? '')
                  const selected = key === selectedKey
                  return (
                    <button
                      key={key}
                      type='button'
                      onClick={() => setSelectedKey(key)}
                      className={`w-full rounded-md border p-2 text-left transition ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <p className='truncate text-sm font-medium'>{key}</p>
                        <Badge variant='secondary'>
                          v{row.latestVersion ?? 1}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground truncate text-xs'>
                        {row.latestName ?? 'Untitled'}
                      </p>
                      <div className='text-muted-foreground mt-1 flex items-center gap-2 text-[11px]'>
                        <span>Published: {row.publishedVersions ?? 0}</span>
                        <span>Stages: {row.usedInStageCount ?? 0}</span>
                        <span>Runtime: {row.runtimeReferenceCount ?? 0}</span>
                      </div>
                    </button>
                  )
                })}
                {filteredKeys.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No schema keys found.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          {!selectedKey ? (
            <div className='animate-in fade-in-50 flex h-[520px] flex-col items-center justify-center rounded-md border border-dashed text-center'>
              <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
                <div className='bg-muted flex h-20 w-20 items-center justify-center rounded-full'>
                  <FileCode2 className='text-muted-foreground h-10 w-10' />
                </div>
                <h2 className='mt-6 text-xl font-semibold'>
                  No schema selected
                </h2>
                <p className='text-muted-foreground mt-2 text-center text-sm leading-normal'>
                  Select a schema key from the left panel to view its versions,
                  where it is used, and compare diffs.
                </p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue='timeline' className='w-full'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='timeline' className='gap-2'>
                  <History className='h-4 w-4' /> Timeline
                </TabsTrigger>
                <TabsTrigger value='usage' className='gap-2'>
                  <Network className='h-4 w-4' /> Where Used
                </TabsTrigger>
                <TabsTrigger value='diff' className='gap-2'>
                  <SplitSquareHorizontal className='h-4 w-4' /> Diff Viewer
                </TabsTrigger>
                <TabsTrigger value='json' className='gap-2'>
                  <Code2 className='h-4 w-4' /> JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value='timeline' className='mt-4 space-y-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>
                      Versions Timeline
                    </CardTitle>
                    <CardDescription>
                      Publish one version per key, retire old versions, clone
                      safely, and export/import JSON.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {versions.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        No versions available for this key.
                      </p>
                    ) : (
                      versions.map((version) => {
                        const id = Number(version.id ?? 0)
                        const isSelected = id === Number(selectedVersionId)
                        return (
                          <div
                            key={id}
                            className={`rounded-md border p-3 ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                          >
                            <div className='flex flex-wrap items-center justify-between gap-2'>
                              <button
                                type='button'
                                onClick={() => setSelectedVersionId(id)}
                                className='text-left'
                              >
                                <p className='text-sm font-semibold'>
                                  v{version.version ?? 1} •{' '}
                                  {version.name ?? version.schemaKey}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {version.updatedAt ??
                                    version.createdAt ??
                                    'n/a'}{' '}
                                  by{' '}
                                  {version.updatedBy ??
                                    version.createdBy ??
                                    'system'}
                                </p>
                              </button>
                              <div className='flex flex-wrap items-center gap-1'>
                                <Badge
                                  variant={
                                    version.isActive ? 'default' : 'secondary'
                                  }
                                >
                                  {version.isActive ? 'Published' : 'Retired'}
                                </Badge>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() =>
                                    version.schemaJson &&
                                    downloadJson(
                                      `${version.schemaKey}_v${version.version}.json`,
                                      toCreatePayloadFromVersion(version)
                                    )
                                  }
                                >
                                  <Download className='mr-1 h-3.5 w-3.5' />
                                  Export
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() =>
                                    void handleCloneVersion(version)
                                  }
                                  disabled={
                                    !canCreate || cloneMutation.isPending
                                  }
                                >
                                  Clone
                                </Button>
                                {version.isActive ? (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() =>
                                      void handleSetPublished(id, false)
                                    }
                                    disabled={
                                      !canUpdate || publishMutation.isPending
                                    }
                                  >
                                    Retire
                                  </Button>
                                ) : (
                                  <Button
                                    size='sm'
                                    onClick={() =>
                                      void handleSetPublished(id, true)
                                    }
                                    disabled={
                                      !canUpdate || publishMutation.isPending
                                    }
                                  >
                                    Publish
                                  </Button>
                                )}
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => openDeleteDialog(version)}
                                  disabled={
                                    !canDelete || deleteMutation.isPending
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='diff' className='mt-4 space-y-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>
                      Version Diff Viewer
                    </CardTitle>
                    <CardDescription>
                      Compare two versions side-by-side.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <div className='space-y-1'>
                        <Label>Left Version ID</Label>
                        <Input
                          type='number'
                          value={diffLeftId ?? ''}
                          onChange={(event) =>
                            setDiffLeftId(Number(event.target.value))
                          }
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label>Right Version ID</Label>
                        <Input
                          type='number'
                          value={diffRightId ?? ''}
                          onChange={(event) =>
                            setDiffRightId(Number(event.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div className='grid gap-2 lg:grid-cols-2'>
                      <div>
                        <p className='mb-1 text-xs font-medium'>
                          Left: {diffLeft?.schemaKey} v{diffLeft?.version}
                        </p>
                        <Textarea
                          readOnly
                          value={safeJsonPretty(diffLeft?.schemaJson)}
                          className='min-h-[260px] font-mono text-xs'
                        />
                      </div>
                      <div>
                        <p className='mb-1 text-xs font-medium'>
                          Right: {diffRight?.schemaKey} v{diffRight?.version}
                        </p>
                        <Textarea
                          readOnly
                          value={safeJsonPretty(diffRight?.schemaJson)}
                          className='min-h-[260px] font-mono text-xs'
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='usage' className='mt-4 space-y-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>Where Used</CardTitle>
                    <CardDescription>
                      Workflow + stage references and runtime snapshots/tasks
                      for selected version.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-[360px] pr-2'>
                      <div className='space-y-2'>
                        {(usageQuery.data ?? []).map(
                          (usage: WorkflowFormSchemaUsageRecord, index) => (
                            <div
                              key={`${usage.referenceType}-${usage.instanceId}-${usage.taskId}-${index}`}
                              className='rounded-md border p-2'
                            >
                              <div className='flex items-center justify-between gap-2'>
                                <Badge variant='secondary'>
                                  {usage.referenceType ?? 'UNKNOWN'}
                                </Badge>
                                {usage.workflowActive != null && (
                                  <Badge
                                    variant={
                                      usage.workflowActive
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {usage.workflowActive
                                      ? 'Workflow Active'
                                      : 'Workflow Inactive'}
                                  </Badge>
                                )}
                              </div>
                              <p className='mt-1 text-sm font-medium'>
                                {usage.workflowDefinitionName ??
                                  usage.workflowDefinitionKey ??
                                  'Workflow'}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                Stage: {usage.stageOrder ?? '-'} •{' '}
                                {usage.stageKey ?? usage.stageName ?? '-'}
                              </p>
                              {(usage.instanceId || usage.taskId) && (
                                <p className='text-muted-foreground text-xs'>
                                  Instance: {usage.instanceId ?? '-'} • Task:{' '}
                                  {usage.taskId ?? '-'}
                                </p>
                              )}
                            </div>
                          )
                        )}
                        {(usageQuery.data ?? []).length === 0 && (
                          <p className='text-muted-foreground text-sm'>
                            No usage found for this version.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='json' className='mt-4 space-y-4'>
                {selectedVersion ? (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-base'>
                        Selected Version JSON
                      </CardTitle>
                      <CardDescription>
                        Use this for quick review before publishing to workflow
                        stages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        readOnly
                        value={JSON.stringify(
                          toCreatePayloadFromVersion(selectedVersion),
                          null,
                          2
                        )}
                        className='min-h-[260px] font-mono text-xs'
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    No version selected to view JSON.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Import Schema Version JSON</DialogTitle>
          </DialogHeader>
          <div className='space-y-2'>
            <Label>Paste payload matching create schema version syntax</Label>
            <Textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              className='min-h-[280px] font-mono text-xs'
              placeholder='{"schemaKey":"example","name":"Example vNext","schemaJson":"{}","fields":[]}'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleImportVersion()}
              disabled={!importText.trim()}
            >
              <FileJson2 className='mr-2 h-4 w-4' />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Delete Schema Version</DialogTitle>
          </DialogHeader>
          <div className='space-y-2'>
            <p className='text-sm'>
              This is allowed only when the version has no stage/runtime
              references. Type{' '}
              <span className='font-mono'>
                {deleteTarget
                  ? `${deleteTarget.schemaKey}:v${deleteTarget.version}`
                  : ''}
              </span>{' '}
              to confirm.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              autoComplete='off'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              disabled={!canDeleteNow || deleteMutation.isPending}
              onClick={() => void handleConfirmDelete()}
            >
              Delete Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
