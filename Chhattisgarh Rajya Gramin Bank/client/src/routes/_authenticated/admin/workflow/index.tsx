import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { paths, components } from '@/types/api/v1.js'
import {
  Download,
  FileUp,
  Plus,
  RefreshCw,
  Loader2,
  Workflow,
  Trash2,
  ListTree,
  Network,
  Copy,
  GitBranch,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
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
// Added Card components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import PaginatedTable, {
  type PaginatedTableColumn,
} from '@/components/paginated-table'
import {
  exportWorkflowConfiguration,
  importWorkflowConfiguration,
  type WorkflowDefinitionConfiguration,
} from '@/features/workflow/workflow-configuration-api'

export const Route = createFileRoute('/_authenticated/admin/workflow/')({
  component: RouteComponent,
})

// ── Types ────────────────────────────────────────────────────────────────────

type Data =
  paths['/api/wf/definitions']['get']['responses']['200']['content']['*/*']

type WorkflowDefinition = NonNullable<Data>[number]

type CreatePayload = components['schemas']['WorkflowDefinitionCreateRequest']

type EditPayload = {
  name: string
  isActive: boolean
}

type WorkflowGroupRow = {
  key: string
  name: string
  versionCount: number
  latestVersion: number | null
  publishedVersion: number | null
  stageTargetDefId: number | null
  versions: WorkflowDefinition[]
}

type WorkflowVersionDiffSection = {
  key:
    | 'definition'
    | 'stages'
    | 'transitions'
    | 'formSchemas'
    | 'documentTemplates'
  label: string
  changed: boolean
  details: string
  addedItems: WorkflowDiffItem[]
  removedItems: WorkflowDiffItem[]
  modifiedItems: WorkflowDiffItem[]
  unchangedCount: number
}

type WorkflowDiffFieldChange = {
  path: string
  before: string
  after: string
}

type WorkflowDiffItem = {
  key: string
  before?: unknown
  after?: unknown
  fieldChanges?: WorkflowDiffFieldChange[]
}

type WorkflowVersionDiffResult = {
  baseLabel: string
  targetLabel: string
  sections: WorkflowVersionDiffSection[]
  baseJson: string
  targetJson: string
}

type WorkflowDefinitionRuntimeMeta = {
  isPublished?: boolean | null
  hasRuntimeInstances?: boolean | null
}

const getWorkflowDefinitionRuntimeMeta = (
  workflow: WorkflowDefinition
): WorkflowDefinitionRuntimeMeta =>
  (workflow as WorkflowDefinition & WorkflowDefinitionRuntimeMeta) ?? {}

const getWorkflowImmutableReason = (
  workflow: WorkflowDefinition
): string | null => {
  const meta = getWorkflowDefinitionRuntimeMeta(workflow)
  if (workflow.isActive) return 'currently published'
  if (meta.isPublished) return 'previously published'
  if (meta.hasRuntimeInstances) return 'runtime instances exist'
  return null
}

// ── Create schema & defaults ────────────────────────────────────────────────

const createSchema = z.object({
  key: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Key is required' : 'Not a string',
    })
    .min(3, 'Key must be at least 3 characters')
    .max(64, 'Key must be at most 64 characters')
    .regex(
      /^[A-Z0-9]([A-Z0-9-_]*[A-Z0-9])?$/,
      'Use uppercase letters, numbers, dashes, underscores (must start/end with a letter/number)'
    ),
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Name is required' : 'Not a string',
    })
    .min(3, 'Name must be at least 3 characters')
    .max(120, 'Name must be at most 120 characters'),
})

const editSchema = createSchema.extend({
  isActive: z.boolean(),
})

type ImportPreviewSummary = {
  key: string
  name: string
  stages: number
  transitions: number
  formSchemas: number
  documentTemplates: number
  generatedDocuments: number
}

const buildImportPreviewSummary = (
  payload: WorkflowDefinitionConfiguration
): ImportPreviewSummary => {
  const key = String(payload.definition?.key ?? '').trim()
  const name = String(payload.definition?.name ?? '').trim() || key
  const stages = Array.isArray(payload.stages) ? payload.stages.length : 0
  const transitions = Array.isArray(payload.transitions)
    ? payload.transitions.length
    : 0
  const formSchemas = Array.isArray(payload.formSchemas)
    ? payload.formSchemas.length
    : 0
  const documentTemplates = Array.isArray(payload.documentTemplates)
    ? payload.documentTemplates.length
    : 0
  const generatedDocuments = (payload.stages ?? []).reduce(
    (count, stage) =>
      count +
      (Array.isArray(stage.generatedDocuments)
        ? stage.generatedDocuments.length
        : 0),
    0
  )

  return {
    key,
    name,
    stages,
    transitions,
    formSchemas,
    documentTemplates,
    generatedDocuments,
  }
}

const compareStrings = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base' })

const normalizeForDiff = (payload: WorkflowDefinitionConfiguration) => {
  const normalized = {
    definition: {
      key: payload.definition?.key ?? null,
      name: payload.definition?.name ?? null,
      version: payload.definition?.version ?? null,
      isActive: payload.definition?.isActive ?? null,
    },
    formSchemas: (payload.formSchemas ?? [])
      .map((schema) => ({
        schemaKey: schema.schemaKey ?? null,
        version: schema.version ?? null,
        name: schema.name ?? null,
        description: schema.description ?? null,
        schemaJson: schema.schemaJson ?? null,
        isActive: schema.isActive ?? null,
        fields: (schema.fields ?? [])
          .map((field) => ({
            fieldKey: field.fieldKey ?? null,
            fieldLabel: field.fieldLabel ?? null,
            fieldType: field.fieldType ?? null,
            fieldOrder: field.fieldOrder ?? null,
            required: field.required ?? null,
            fieldJson: field.fieldJson ?? null,
          }))
          .sort((a, b) => {
            const orderA = typeof a.fieldOrder === 'number' ? a.fieldOrder : 0
            const orderB = typeof b.fieldOrder === 'number' ? b.fieldOrder : 0
            if (orderA !== orderB) return orderA - orderB
            return compareStrings(
              String(a.fieldKey ?? ''),
              String(b.fieldKey ?? '')
            )
          }),
      }))
      .sort((a, b) => {
        const keyCompare = compareStrings(
          String(a.schemaKey ?? ''),
          String(b.schemaKey ?? '')
        )
        if (keyCompare !== 0) return keyCompare
        return Number(a.version ?? 0) - Number(b.version ?? 0)
      }),
    documentTemplates: (payload.documentTemplates ?? [])
      .map((template) => ({
        templateKey: template.templateKey ?? null,
        version: template.version ?? null,
        name: template.name ?? null,
        description: template.description ?? null,
        defaultLocale: template.defaultLocale ?? null,
        templateJson: template.templateJson ?? null,
        isActive: template.isActive ?? null,
      }))
      .sort((a, b) => {
        const keyCompare = compareStrings(
          String(a.templateKey ?? ''),
          String(b.templateKey ?? '')
        )
        if (keyCompare !== 0) return keyCompare
        return Number(a.version ?? 0) - Number(b.version ?? 0)
      }),
    stages: (payload.stages ?? [])
      .map((stage) => ({
        stageOrder: stage.stageOrder ?? null,
        key: stage.key ?? null,
        name: stage.name ?? null,
        assignmentType: stage.assignmentType ?? null,
        roleId: stage.roleId ?? null,
        username: stage.username ?? null,
        departmentId: stage.departmentId ?? null,
        branchId: stage.branchId ?? null,
        stageType: stage.stageType ?? null,
        entryConditionSpEL: stage.entryConditionSpEL ?? null,
        metadataJson: stage.metadataJson ?? null,
        requiresDocuments: stage.requiresDocuments ?? null,
        slaDays: stage.slaDays ?? null,
        skippable: stage.skippable ?? null,
        enabled: stage.enabled ?? null,
        formSchemaKey: stage.formSchemaKey ?? null,
        formSchemaVersion: stage.formSchemaVersion ?? null,
        generatedDocuments: (stage.generatedDocuments ?? [])
          .map((document) => ({
            code: document.code ?? null,
            label: document.label ?? null,
            mode: document.mode ?? null,
            docType: document.docType ?? null,
            fileNamePattern: document.fileNamePattern ?? null,
            templateKey: document.templateKey ?? null,
            templateVersion: document.templateVersion ?? null,
            enabled: document.enabled ?? null,
          }))
          .sort((a, b) =>
            compareStrings(String(a.code ?? ''), String(b.code ?? ''))
          ),
      }))
      .sort((a, b) => {
        const orderA = typeof a.stageOrder === 'number' ? a.stageOrder : 0
        const orderB = typeof b.stageOrder === 'number' ? b.stageOrder : 0
        if (orderA !== orderB) return orderA - orderB
        return compareStrings(String(a.key ?? ''), String(b.key ?? ''))
      }),
    transitions: (payload.transitions ?? [])
      .map((transition) => ({
        fromStageKey: transition.fromStageKey ?? null,
        toStageKey: transition.toStageKey ?? null,
        trigger: transition.trigger ?? null,
        conditionSpEL: transition.conditionSpEL ?? null,
        priority: transition.priority ?? null,
        autoTransition: transition.autoTransition ?? null,
      }))
      .sort((a, b) => {
        const fromCompare = compareStrings(
          String(a.fromStageKey ?? ''),
          String(b.fromStageKey ?? '')
        )
        if (fromCompare !== 0) return fromCompare
        const toCompare = compareStrings(
          String(a.toStageKey ?? ''),
          String(b.toStageKey ?? '')
        )
        if (toCompare !== 0) return toCompare
        const triggerCompare = compareStrings(
          String(a.trigger ?? ''),
          String(b.trigger ?? '')
        )
        if (triggerCompare !== 0) return triggerCompare
        return Number(a.priority ?? 0) - Number(b.priority ?? 0)
      }),
  }

  return normalized
}

const toDiffDisplayValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const toPrettyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? 'undefined'
  } catch {
    return String(value)
  }
}

const collectFieldChanges = (
  before: unknown,
  after: unknown,
  currentPath = ''
): WorkflowDiffFieldChange[] => {
  if (JSON.stringify(before) === JSON.stringify(after)) return []

  const pathLabel = currentPath || '(root)'
  const beforeIsObject =
    typeof before === 'object' && before !== null && !Array.isArray(before)
  const afterIsObject =
    typeof after === 'object' && after !== null && !Array.isArray(after)
  const beforeIsArray = Array.isArray(before)
  const afterIsArray = Array.isArray(after)

  if (beforeIsArray && afterIsArray) {
    const beforeArray = before as unknown[]
    const afterArray = after as unknown[]
    const maxLength = Math.max(beforeArray.length, afterArray.length)
    const output: WorkflowDiffFieldChange[] = []
    for (let index = 0; index < maxLength; index += 1) {
      const childPath = `${pathLabel}[${index}]`
      output.push(
        ...collectFieldChanges(beforeArray[index], afterArray[index], childPath)
      )
    }
    return output
  }

  if (beforeIsObject && afterIsObject) {
    const beforeObject = before as Record<string, unknown>
    const afterObject = after as Record<string, unknown>
    const keys = Array.from(
      new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)])
    ).sort(compareStrings)

    const output: WorkflowDiffFieldChange[] = []
    for (const key of keys) {
      const childPath = currentPath ? `${currentPath}.${key}` : key
      output.push(
        ...collectFieldChanges(beforeObject[key], afterObject[key], childPath)
      )
    }
    return output
  }

  return [
    {
      path: pathLabel,
      before: toDiffDisplayValue(before),
      after: toDiffDisplayValue(after),
    },
  ]
}

const buildCollectionDiff = <T,>(
  baseItems: T[],
  targetItems: T[],
  keyFn: (item: T) => string
) => {
  const baseMap = new Map<string, T>()
  const targetMap = new Map<string, T>()

  for (const item of baseItems) {
    const key = keyFn(item)
    baseMap.set(key, item)
  }
  for (const item of targetItems) {
    const key = keyFn(item)
    targetMap.set(key, item)
  }

  const addedItems: WorkflowDiffItem[] = []
  const removedItems: WorkflowDiffItem[] = []
  const modifiedItems: WorkflowDiffItem[] = []
  let unchangedCount = 0

  for (const [key, targetItem] of targetMap.entries()) {
    if (!baseMap.has(key)) {
      addedItems.push({ key, after: targetItem })
      continue
    }

    const baseItem = baseMap.get(key)
    if (JSON.stringify(baseItem) === JSON.stringify(targetItem)) {
      unchangedCount += 1
      continue
    }

    modifiedItems.push({
      key,
      before: baseItem,
      after: targetItem,
      fieldChanges: collectFieldChanges(baseItem, targetItem),
    })
  }

  for (const [key, baseItem] of baseMap.entries()) {
    if (!targetMap.has(key)) {
      removedItems.push({ key, before: baseItem })
    }
  }

  const sortItems = (left: WorkflowDiffItem, right: WorkflowDiffItem) =>
    compareStrings(left.key, right.key)

  addedItems.sort(sortItems)
  removedItems.sort(sortItems)
  modifiedItems.sort(sortItems)

  return {
    addedItems,
    removedItems,
    modifiedItems,
    unchangedCount,
  }
}

const formatDiffDetails = (diff: {
  addedItems: WorkflowDiffItem[]
  removedItems: WorkflowDiffItem[]
  modifiedItems: WorkflowDiffItem[]
  unchangedCount: number
}) =>
  `Added ${diff.addedItems.length}, Removed ${diff.removedItems.length}, Modified ${diff.modifiedItems.length}, Unchanged ${diff.unchangedCount}`

const buildVersionDiff = (
  baseConfig: WorkflowDefinitionConfiguration,
  targetConfig: WorkflowDefinitionConfiguration,
  baseLabel: string,
  targetLabel: string
): WorkflowVersionDiffResult => {
  const baseNormalized = normalizeForDiff(baseConfig)
  const targetNormalized = normalizeForDiff(targetConfig)

  const definitionChanged =
    JSON.stringify(baseNormalized.definition) !==
    JSON.stringify(targetNormalized.definition)
  const definitionChanges = collectFieldChanges(
    baseNormalized.definition,
    targetNormalized.definition
  )

  const stageDiff = buildCollectionDiff(
    baseNormalized.stages,
    targetNormalized.stages,
    (stage) => String(stage.key ?? '')
  )

  const transitionDiff = buildCollectionDiff(
    baseNormalized.transitions,
    targetNormalized.transitions,
    (transition) =>
      `${String(transition.fromStageKey ?? '')}|${String(
        transition.toStageKey ?? ''
      )}|${String(transition.trigger ?? '')}`
  )

  const schemaDiff = buildCollectionDiff(
    baseNormalized.formSchemas,
    targetNormalized.formSchemas,
    (schema) =>
      `${String(schema.schemaKey ?? '')}@${String(schema.version ?? '')}`
  )

  const templateDiff = buildCollectionDiff(
    baseNormalized.documentTemplates,
    targetNormalized.documentTemplates,
    (template) =>
      `${String(template.templateKey ?? '')}@${String(template.version ?? '')}`
  )

  const sections: WorkflowVersionDiffSection[] = [
    {
      key: 'definition',
      label: 'Definition',
      changed: definitionChanged,
      details: definitionChanged
        ? 'Definition metadata changed.'
        : 'No definition-level change.',
      addedItems: [],
      removedItems: [],
      modifiedItems: definitionChanged
        ? [
            {
              key: 'definition',
              before: baseNormalized.definition,
              after: targetNormalized.definition,
              fieldChanges: definitionChanges,
            },
          ]
        : [],
      unchangedCount: definitionChanged ? 0 : 1,
    },
    {
      key: 'stages',
      label: 'Stages',
      changed:
        stageDiff.addedItems.length > 0 ||
        stageDiff.removedItems.length > 0 ||
        stageDiff.modifiedItems.length > 0,
      details: formatDiffDetails(stageDiff),
      addedItems: stageDiff.addedItems,
      removedItems: stageDiff.removedItems,
      modifiedItems: stageDiff.modifiedItems,
      unchangedCount: stageDiff.unchangedCount,
    },
    {
      key: 'transitions',
      label: 'Transitions',
      changed:
        transitionDiff.addedItems.length > 0 ||
        transitionDiff.removedItems.length > 0 ||
        transitionDiff.modifiedItems.length > 0,
      details: formatDiffDetails(transitionDiff),
      addedItems: transitionDiff.addedItems,
      removedItems: transitionDiff.removedItems,
      modifiedItems: transitionDiff.modifiedItems,
      unchangedCount: transitionDiff.unchangedCount,
    },
    {
      key: 'formSchemas',
      label: 'Form Schemas',
      changed:
        schemaDiff.addedItems.length > 0 ||
        schemaDiff.removedItems.length > 0 ||
        schemaDiff.modifiedItems.length > 0,
      details: formatDiffDetails(schemaDiff),
      addedItems: schemaDiff.addedItems,
      removedItems: schemaDiff.removedItems,
      modifiedItems: schemaDiff.modifiedItems,
      unchangedCount: schemaDiff.unchangedCount,
    },
    {
      key: 'documentTemplates',
      label: 'Document Templates',
      changed:
        templateDiff.addedItems.length > 0 ||
        templateDiff.removedItems.length > 0 ||
        templateDiff.modifiedItems.length > 0,
      details: formatDiffDetails(templateDiff),
      addedItems: templateDiff.addedItems,
      removedItems: templateDiff.removedItems,
      modifiedItems: templateDiff.modifiedItems,
      unchangedCount: templateDiff.unchangedCount,
    },
  ]

  return {
    baseLabel,
    targetLabel,
    sections,
    baseJson: JSON.stringify(baseNormalized, null, 2),
    targetJson: JSON.stringify(targetNormalized, null, 2),
  }
}

// ── Page Component ─────────────────────────────────────────────────────────

function RouteComponent() {
  const canCreate = useCanAccess('workflow', 'create')
  const canUpdate = useCanAccess('workflow', 'update')
  const canDelete = useCanAccess('workflow', 'delete')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importPayload, setImportPayload] =
    useState<WorkflowDefinitionConfiguration | null>(null)
  const [importPreview, setImportPreview] =
    useState<ImportPreviewSummary | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [exportingDefId, setExportingDefId] = useState<number | null>(null)
  const [cloningDefId, setCloningDefId] = useState<number | null>(null)
  const [publishingDefId, setPublishingDefId] = useState<number | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading, isError, error, refetch } = $api.useQuery(
    'get',
    '/api/wf/definitions'
  )

  const createMutation = $api.useMutation('post', '/api/wf/definitions')

  const editMutation = $api.useMutation('put', '/api/wf/definitions/{defId}')
  const deleteMutation = $api.useMutation(
    'delete',
    '/api/wf/definitions/{defId}'
  )
  const cloneVersionMutation = $api.useMutation(
    'post',
    '/api/wf/definitions/{defId}/clone-version'
  )
  const publishVersionMutation = $api.useMutation(
    'post',
    '/api/wf/definitions/{defId}/publish'
  )
  const [deletingDefId, setDeletingDefId] = useState<number | null>(null)
  const [versionsTargetKey, setVersionsTargetKey] = useState<string | null>(
    null
  )

  const handleEditWorkflow = async (
    workflow: WorkflowDefinition,
    payload: EditPayload
  ) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update workflows.')
      return
    }

    const immutableReason = getWorkflowImmutableReason(workflow)
    if (immutableReason) {
      toast.error(
        `This workflow version is immutable (${immutableReason}). Clone a new version to make changes.`
      )
      return
    }

    const id = Number(workflow.id)
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('Cannot update this workflow: invalid definition ID.')
      return
    }

    try {
      await editMutation.mutateAsync({
        params: {
          path: { defId: id },
          header: { Authorization: '' },
        },
        body: {
          name: payload.name,
          isActive: payload.isActive,
        },
      })
      toast.success('Workflow updated successfully')
      refetch()
    } catch (err) {
      toastError(err)
      throw err
    }
  }

  const handleDeleteWorkflow = async (workflow: WorkflowDefinition) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete workflows.')
      return
    }

    const immutableReason = getWorkflowImmutableReason(workflow)
    if (immutableReason) {
      toast.error(
        `Cannot delete immutable workflow version (${immutableReason}).`
      )
      return
    }

    const defId = Number(workflow.id)
    if (!Number.isFinite(defId) || defId <= 0) {
      toast.error('Cannot delete this workflow: invalid definition ID.')
      return
    }

    setDeletingDefId(defId)
    try {
      await deleteMutation.mutateAsync({
        params: { path: { defId } },
      })
      toast.success(
        `Workflow ${String(workflow.key ?? workflow.name ?? defId)} deleted successfully.`
      )
      refetch()
    } catch (err) {
      toastError(err, 'Failed to delete workflow definition.')
      throw err
    } finally {
      setDeletingDefId(null)
    }
  }

  const handleCloneVersion = async (workflow: WorkflowDefinition) => {
    if (!canUpdate) {
      toast.error('You do not have permission to clone workflow versions.')
      return
    }

    const defId = Number(workflow.id)
    if (!Number.isFinite(defId) || defId <= 0) {
      toast.error('Cannot clone this workflow: invalid definition ID.')
      return
    }

    setCloningDefId(defId)
    try {
      const created = await cloneVersionMutation.mutateAsync({
        params: {
          path: { defId },
          header: { Authorization: '' },
        },
      })
      toast.success(
        `Created ${created.key ?? workflow.key} v${created.version ?? '?'}.`
      )
      refetch()
    } catch (err) {
      toastError(err, 'Failed to clone workflow version.')
      throw err
    } finally {
      setCloningDefId(null)
    }
  }

  const handlePublishVersion = async (workflow: WorkflowDefinition) => {
    if (!canUpdate) {
      toast.error('You do not have permission to publish workflow versions.')
      return
    }

    const defId = Number(workflow.id)
    if (!Number.isFinite(defId) || defId <= 0) {
      toast.error('Cannot publish this workflow: invalid definition ID.')
      return
    }

    setPublishingDefId(defId)
    try {
      const published = await publishVersionMutation.mutateAsync({
        params: {
          path: { defId },
          header: { Authorization: '' },
        },
      })
      toast.success(
        `Published ${published.key ?? workflow.key} v${published.version ?? '?'}.`
      )
      refetch()
    } catch (err) {
      toastError(err, 'Failed to publish workflow version.')
      throw err
    } finally {
      setPublishingDefId(null)
    }
  }

  const resetImportState = () => {
    setImportPayload(null)
    setImportPreview(null)
    setImportFileName('')
    setImportError(null)
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ''
    }
  }

  const handleImportDialogChange = (open: boolean) => {
    setImportDialogOpen(open)
    if (!open && !isImporting) {
      resetImportState()
    }
  }

  const handleImportFileSelected = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      resetImportState()
      return
    }

    setImportError(null)
    setImportFileName(file.name)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as WorkflowDefinitionConfiguration

      const summary = buildImportPreviewSummary(parsed)
      if (!summary.key) {
        throw new Error('Invalid configuration: definition.key is required.')
      }
      if (summary.stages <= 0) {
        throw new Error(
          'Invalid configuration: at least one stage is required.'
        )
      }

      setImportPayload(parsed)
      setImportPreview(summary)
    } catch (err) {
      setImportPayload(null)
      setImportPreview(null)
      setImportError(err instanceof Error ? err.message : 'Invalid JSON file.')
    }
  }

  const handleImportConfiguration = async () => {
    if (!canCreate) {
      toast.error(
        'You do not have permission to import workflow configurations.'
      )
      return
    }
    if (!importPayload || !importPreview) {
      toast.error('Select a valid configuration file before importing.')
      return
    }

    setIsImporting(true)
    try {
      const imported = await importWorkflowConfiguration(importPayload)
      toast.success(
        `Configuration imported successfully as workflow ${
          imported.key ?? importPreview.key
        }.`
      )
      setImportDialogOpen(false)
      resetImportState()
      refetch()
    } catch (err) {
      toastError(err, 'Failed to import workflow configuration.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExportConfiguration = async (workflow: WorkflowDefinition) => {
    const defId = Number(workflow.id)
    if (!Number.isFinite(defId) || defId <= 0) {
      toast.error('Cannot export this workflow: invalid definition ID.')
      return
    }

    setExportingDefId(defId)
    try {
      const payload = await exportWorkflowConfiguration(defId)
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const key = String(workflow.key ?? `workflow_${defId}`)
      const safeKey = key.replace(/[^a-z0-9-_]/gi, '_')
      anchor.href = downloadUrl
      anchor.download = `${safeKey}_configuration.json`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
      toast.success(`Exported workflow configuration for ${key}.`)
    } catch (err) {
      toastError(err, 'Failed to export workflow configuration.')
    } finally {
      setExportingDefId(null)
    }
  }

  const importStageLabels = useMemo(
    () =>
      (importPayload?.stages ?? [])
        .map((stage) => String(stage.key ?? stage.name ?? '').trim())
        .filter(Boolean),
    [importPayload]
  )

  const rows = useMemo<WorkflowGroupRow[]>(() => {
    const source = (data ?? []) as WorkflowDefinition[]
    const byKey = new Map<string, WorkflowDefinition[]>()

    for (const definition of source) {
      const key = String(definition.key ?? '').trim()
      if (!key) continue
      const bucket = byKey.get(key)
      if (bucket) {
        bucket.push(definition)
      } else {
        byKey.set(key, [definition])
      }
    }

    const grouped: WorkflowGroupRow[] = []
    for (const [key, versionsRaw] of byKey.entries()) {
      const versions = [...versionsRaw].sort(
        (a, b) => (Number(b.version ?? 0) || 0) - (Number(a.version ?? 0) || 0)
      )
      const latest = versions[0]
      const published = versions.find((version) => Boolean(version.isActive))
      const latestDraft = versions.find((version) => !version.isActive)
      const stageTarget = latestDraft ?? published ?? latest

      grouped.push({
        key,
        name:
          String(latest?.name ?? '').trim() ||
          String(published?.name ?? '').trim() ||
          'Unnamed workflow',
        versionCount: versions.length,
        latestVersion:
          typeof latest?.version === 'number' ? latest.version : null,
        publishedVersion:
          typeof published?.version === 'number' ? published.version : null,
        stageTargetDefId:
          typeof stageTarget?.id === 'number' ? Number(stageTarget.id) : null,
        versions,
      })
    }

    return grouped.sort((a, b) => a.key.localeCompare(b.key))
  }, [data])

  const columns = useMemo<PaginatedTableColumn<WorkflowGroupRow>[]>(() => {
    return [
      {
        key: 'key',
        label: 'Workflow',
        sortable: true,
        render: (_value, row) => (
          <div className='space-y-0.5'>
            <div className='font-mono text-sm font-medium'>{row.key}</div>
            <div className='text-muted-foreground text-xs'>{row.name}</div>
          </div>
        ),
      },
      {
        key: 'versionCount',
        label: 'Versions',
        sortable: true,
        render: (value) => <span className='font-medium'>{value}</span>,
      },
      {
        key: 'publishedVersion',
        label: 'Published',
        sortable: true,
        render: (value) =>
          value == null ? (
            <Badge variant='secondary'>None</Badge>
          ) : (
            <Badge variant='default'>v{value}</Badge>
          ),
      },
      {
        key: 'latestVersion',
        label: 'Latest',
        sortable: true,
        render: (value) => (
          <span className='font-medium'>
            {value == null ? '—' : `v${value}`}
          </span>
        ),
      },
    ]
  }, [])

  const renderActions = (row: WorkflowGroupRow) => (
    <div className='flex items-center justify-end gap-2'>
      {canUpdate && row.stageTargetDefId != null && (
        <Button asChild size='sm' variant='default'>
          <Link
            to='/admin/workflow/$defId/stages'
            params={{ defId: row.stageTargetDefId }}
          >
            <ListTree className='mr-2 h-4 w-4' />
            Stages
          </Link>
        </Button>
      )}
      {(canUpdate || canDelete) && (
        <Button
          size='sm'
          variant='outline'
          onClick={() => setVersionsTargetKey(row.key)}
        >
          <GitBranch className='mr-2 h-4 w-4' />
          Manage Versions
        </Button>
      )}
    </div>
  )

  const handleCreateWorkflow = async (payload: CreatePayload) => {
    if (!canCreate) {
      toast.error('You do not have permission to create workflows.')
      return
    }

    try {
      const normalizedPayload = {
        ...payload,
        key: String(payload.key ?? '').toUpperCase(),
      } satisfies CreatePayload

      await createMutation.mutateAsync({
        body: normalizedPayload,
        params: { header: { Authorization: '' } },
      })
      toast.success('Workflow created successfully')
      refetch()
    } catch (err) {
      toastError(err)
      throw err // Re-throw to let the dialog handle its submitting state
    }
  }

  // ── Loading State ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <section className='space-y-4'>
        {/* Page Header Skeleton */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-64' />
          <div className='flex gap-2'>
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-40' />
          </div>
        </div>
        {/* Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-1/3' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[300px] w-full' />
          </CardContent>
        </Card>
      </section>
    )
  }

  // ── Error State ───────────────────────────────────────────────────

  if (isError) {
    return (
      <div className='bg-destructive/10 text-destructive flex items-center justify-between rounded-lg border p-4'>
        <div>
          <div className='font-semibold'>
            Failed to load workflow definitions
          </div>
          <div className='text-sm opacity-80'>{String(error)}</div>
        </div>
        <Button variant='outline' onClick={() => refetch()}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry
        </Button>
      </div>
    )
  }

  const totalVersions = rows.reduce((sum, row) => sum + row.versionCount, 0)
  const workflowKeyCount = rows.length
  const publishedWorkflowCount = rows.filter(
    (row) => row.publishedVersion != null
  ).length
  const draftVersionCount = Math.max(0, totalVersions - publishedWorkflowCount)
  const versionsTarget = versionsTargetKey
    ? (rows.find((row) => row.key === versionsTargetKey) ?? null)
    : null

  // ── Main Content ───────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Header row: Title + actions */}
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <div className='space-y-1'>
          <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
            <Workflow className='h-6 w-6' />
            Workflow Definitions
          </h1>
          <p className='text-muted-foreground text-sm'>
            One row represents one workflow key. Version-level operations are
            available through Manage Versions.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          {canCreate && (
            <Dialog
              open={importDialogOpen}
              onOpenChange={handleImportDialogChange}
            >
              <DialogTrigger asChild>
                <Button size='sm' variant='outline'>
                  <FileUp className='mr-2 h-4 w-4' />
                  Import Config
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Import Workflow Configuration</DialogTitle>
                  <DialogDescription>
                    Upload a JSON configuration exported from another workflow.
                    This will create a new workflow definition with stages,
                    transitions, form schema versions, and document template
                    versions.
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-1'>
                  <div className='space-y-2'>
                    <Label htmlFor='workflow-config-file'>
                      Configuration File
                    </Label>
                    <Input
                      ref={importFileInputRef}
                      id='workflow-config-file'
                      type='file'
                      accept='.json,application/json'
                      onChange={handleImportFileSelected}
                      disabled={isImporting}
                    />
                    {importFileName ? (
                      <p className='text-muted-foreground text-xs'>
                        Selected: {importFileName}
                      </p>
                    ) : (
                      <p className='text-muted-foreground text-xs'>
                        Expected file type: JSON exported via &quot;Export
                        Config&quot;.
                      </p>
                    )}
                    {importError && (
                      <p className='text-destructive text-xs'>{importError}</p>
                    )}
                  </div>

                  {importPreview && (
                    <div className='space-y-3 rounded-md border p-3 text-sm'>
                      <div>
                        <p className='font-medium'>Import Preview</p>
                        <p className='text-muted-foreground text-xs'>
                          Review this summary before creating the imported
                          workflow.
                        </p>
                      </div>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Workflow Key
                          </p>
                          <p className='font-mono text-sm'>
                            {importPreview.key}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Workflow Name
                          </p>
                          <p>{importPreview.name}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Stages
                          </p>
                          <p>{importPreview.stages}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Transitions
                          </p>
                          <p>{importPreview.transitions}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Form Schemas
                          </p>
                          <p>{importPreview.formSchemas}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Document Templates
                          </p>
                          <p>{importPreview.documentTemplates}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>
                            Generated Docs
                          </p>
                          <p>{importPreview.generatedDocuments}</p>
                        </div>
                      </div>
                      {importStageLabels.length > 0 && (
                        <div>
                          <p className='text-muted-foreground mb-1 text-xs'>
                            Stage Keys
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {importStageLabels.slice(0, 12).map((label) => (
                              <Badge key={label} variant='secondary'>
                                {label}
                              </Badge>
                            ))}
                            {importStageLabels.length > 12 && (
                              <Badge variant='secondary'>
                                +{importStageLabels.length - 12} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setImportDialogOpen(false)}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={handleImportConfiguration}
                    disabled={!importPayload || isImporting}
                  >
                    {isImporting && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Import Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canCreate && (
            <CreateWorkflowDialog
              onCreate={handleCreateWorkflow}
              isCreating={createMutation.isPending}
            />
          )}
        </div>
      </div>

      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Versions</CardDescription>
            <CardTitle className='text-2xl'>{totalVersions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Workflow Keys</CardDescription>
            <CardTitle className='text-2xl'>{workflowKeyCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Published Workflows</CardDescription>
            <CardTitle className='text-2xl'>{publishedWorkflowCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Draft Versions</CardDescription>
            <CardTitle className='text-2xl'>{draftVersionCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table wrapped in Card */}
      <Card>
        <CardHeader>
          <CardTitle>Definitions And Versions</CardTitle>
          <CardDescription>
            Keep the main table workflow-focused. Open Manage Versions to
            publish, clone, export, edit, or delete specific versions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <PaginatedTable<WorkflowGroupRow>
              data={rows}
              columns={columns}
              renderActions={renderActions}
              emptyMessage='No workflow definitions found.'
              initialRowsPerPage={10}
            />
          ) : (
            // ⬇️⬇️ This is the "Blank Slate" / Empty State ⬇️⬇️
            <div className='flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center'>
              <div className='mb-4 rounded-full bg-gray-100 p-3'>
                <Network className='h-10 w-10 text-gray-500' />
              </div>
              <h2 className='text-xl font-semibold'>No workflows found</h2>
              <p className='text-muted-foreground mt-2 max-w-xs'>
                Get started by creating a new workflow definition.
              </p>
              {canCreate && (
                <div className='mt-6'>
                  <CreateWorkflowDialog
                    onCreate={handleCreateWorkflow}
                    isCreating={createMutation.isPending}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {versionsTarget && (
        <WorkflowVersionsDialog
          workflow={versionsTarget}
          canUpdate={canUpdate}
          canDelete={canDelete}
          cloningDefId={cloningDefId}
          publishingDefId={publishingDefId}
          exportingDefId={exportingDefId}
          deletingDefId={deletingDefId}
          createPending={createMutation.isPending}
          editPending={editMutation.isPending}
          deletePending={deleteMutation.isPending}
          onClone={handleCloneVersion}
          onPublish={handlePublishVersion}
          onExport={handleExportConfiguration}
          onEdit={handleEditWorkflow}
          onDelete={handleDeleteWorkflow}
          open
          onOpenChange={(open) => {
            if (!open) setVersionsTargetKey(null)
          }}
        />
      )}
    </div>
  )
}

// ── Create Dialog Component ────────────────────────────────────────────────

type WorkflowVersionsDialogProps = {
  workflow: WorkflowGroupRow
  canUpdate: boolean
  canDelete: boolean
  cloningDefId: number | null
  publishingDefId: number | null
  exportingDefId: number | null
  deletingDefId: number | null
  createPending: boolean
  editPending: boolean
  deletePending: boolean
  onClone: (workflow: WorkflowDefinition) => Promise<void>
  onPublish: (workflow: WorkflowDefinition) => Promise<void>
  onExport: (workflow: WorkflowDefinition) => Promise<void>
  onEdit: (workflow: WorkflowDefinition, payload: EditPayload) => Promise<void>
  onDelete: (workflow: WorkflowDefinition) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

function WorkflowVersionsDialog({
  workflow,
  canUpdate,
  canDelete,
  cloningDefId,
  publishingDefId,
  exportingDefId,
  deletingDefId,
  createPending,
  editPending,
  deletePending,
  onClone,
  onPublish,
  onExport,
  onEdit,
  onDelete,
  open,
  onOpenChange,
}: WorkflowVersionsDialogProps) {
  const versions = workflow.versions
  const [compareBaseId, setCompareBaseId] = useState('')
  const [compareTargetId, setCompareTargetId] = useState('')
  const [isDiffLoading, setIsDiffLoading] = useState(false)
  const [diffError, setDiffError] = useState<string | null>(null)
  const [diffResult, setDiffResult] =
    useState<WorkflowVersionDiffResult | null>(null)
  const [isFullDiffOpen, setIsFullDiffOpen] = useState(false)

  const comparableVersions = useMemo(
    () =>
      versions
        .map((version) => ({
          version,
          id: Number(version.id),
        }))
        .filter((item) => Number.isFinite(item.id) && item.id > 0),
    [versions]
  )

  useEffect(() => {
    const target = comparableVersions[0]
    const base = comparableVersions[1] ?? comparableVersions[0]

    setCompareTargetId(target ? String(target.id) : '')
    setCompareBaseId(base ? String(base.id) : '')
    setDiffResult(null)
    setDiffError(null)
    setIsFullDiffOpen(false)
  }, [workflow.key, comparableVersions])

  const selectedBase = comparableVersions.find(
    (item) => String(item.id) === compareBaseId
  )?.version
  const selectedTarget = comparableVersions.find(
    (item) => String(item.id) === compareTargetId
  )?.version

  const runDiff = async () => {
    if (!selectedBase || !selectedTarget) {
      toast.error('Select both base and target versions to compare.')
      return
    }
    if (Number(selectedBase.id) === Number(selectedTarget.id)) {
      toast.error('Base and target must be different versions.')
      return
    }

    const baseId = Number(selectedBase.id)
    const targetId = Number(selectedTarget.id)

    setIsDiffLoading(true)
    setDiffError(null)
    try {
      const [baseConfig, targetConfig] = await Promise.all([
        exportWorkflowConfiguration(baseId),
        exportWorkflowConfiguration(targetId),
      ])

      const baseLabel = `v${selectedBase.version ?? '—'} (ID: ${baseId})`
      const targetLabel = `v${selectedTarget.version ?? '—'} (ID: ${targetId})`
      setDiffResult(
        buildVersionDiff(baseConfig, targetConfig, baseLabel, targetLabel)
      )
      setIsFullDiffOpen(true)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate diff.'
      setDiffError(message)
      setDiffResult(null)
    } finally {
      setIsDiffLoading(false)
    }
  }

  const changedSectionCount = diffResult
    ? diffResult.sections.filter((section) => section.changed).length
    : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <GitBranch className='h-4 w-4' />
              Manage Versions: {workflow.key}
            </DialogTitle>
            <DialogDescription>
              One workflow entry can have multiple versions. Manage each version
              here without cluttering the main table.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='text-muted-foreground flex flex-wrap items-center gap-4 text-xs'>
              <span>Total versions: {workflow.versionCount}</span>
              <span>
                Published:{' '}
                {workflow.publishedVersion == null
                  ? 'None'
                  : `v${workflow.publishedVersion}`}
              </span>
              <span>
                Latest:{' '}
                {workflow.latestVersion == null
                  ? '—'
                  : `v${workflow.latestVersion}`}
              </span>
            </div>

            <div className='space-y-3 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium'>Version Diff Viewer</p>
                  <p className='text-muted-foreground text-xs'>
                    Compare two versions before publishing or deleting.
                  </p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={runDiff}
                  disabled={
                    isDiffLoading ||
                    !compareBaseId ||
                    !compareTargetId ||
                    compareBaseId === compareTargetId
                  }
                >
                  {isDiffLoading && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Generate Diff
                </Button>
              </div>

              <div className='grid gap-3 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Base Version</Label>
                  <Select
                    value={compareBaseId}
                    onValueChange={setCompareBaseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select base version' />
                    </SelectTrigger>
                    <SelectContent>
                      {comparableVersions.map((item) => (
                        <SelectItem
                          key={`base-${item.id}`}
                          value={String(item.id)}
                        >
                          v{item.version.version ?? '—'} (ID: {item.id})
                          {item.version.isActive ? ' • Published' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Target Version</Label>
                  <Select
                    value={compareTargetId}
                    onValueChange={setCompareTargetId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select target version' />
                    </SelectTrigger>
                    <SelectContent>
                      {comparableVersions.map((item) => (
                        <SelectItem
                          key={`target-${item.id}`}
                          value={String(item.id)}
                        >
                          v{item.version.version ?? '—'} (ID: {item.id})
                          {item.version.isActive ? ' • Published' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {compareBaseId === compareTargetId && compareBaseId && (
                <p className='text-destructive text-xs'>
                  Select two different versions for comparison.
                </p>
              )}

              {diffError && (
                <p className='text-destructive text-xs'>{diffError}</p>
              )}

              {diffResult && (
                <div className='space-y-3 rounded-md border p-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-medium'>
                        Comparing {diffResult.baseLabel} →{' '}
                        {diffResult.targetLabel}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {changedSectionCount} section
                        {changedSectionCount === 1 ? '' : 's'} changed
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='default'
                      size='sm'
                      onClick={() => setIsFullDiffOpen(true)}
                    >
                      Open Full-Screen Diff Viewer
                    </Button>
                  </div>

                  <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                    {diffResult.sections.map((section) => (
                      <div
                        key={section.key}
                        className='flex items-start justify-between rounded-md border p-2'
                      >
                        <div>
                          <p className='text-sm font-medium'>{section.label}</p>
                          <p className='text-muted-foreground text-xs'>
                            {section.details}
                          </p>
                        </div>
                        <Badge
                          variant={section.changed ? 'default' : 'secondary'}
                        >
                          {section.changed ? 'Changed' : 'No Change'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
              {versions.map((version) => {
                const defId = Number(version.id)
                const hasValidId = Number.isFinite(defId) && defId > 0
                const immutableReason = getWorkflowImmutableReason(version)
                const isImmutable = immutableReason !== null

                return (
                  <div
                    key={String(version.id)}
                    className='flex flex-col gap-3 rounded-md border p-3'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>
                            Version {version.version ?? '—'}
                          </span>
                          <Badge
                            variant={version.isActive ? 'default' : 'secondary'}
                          >
                            {version.isActive ? 'Published' : 'Draft'}
                          </Badge>
                          {isImmutable && !version.isActive && (
                            <Badge variant='secondary'>Immutable</Badge>
                          )}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          Definition ID: {hasValidId ? defId : '—'} | Name:{' '}
                          {version.name || 'Unnamed workflow'}
                          {isImmutable && immutableReason
                            ? ` | ${immutableReason}`
                            : ''}
                        </div>
                      </div>

                      <div className='flex flex-wrap items-center gap-2'>
                        {canUpdate && hasValidId && (
                          <Button asChild size='sm' variant='outline'>
                            <Link
                              to='/admin/workflow/$defId/stages'
                              params={{ defId }}
                            >
                              <ListTree className='mr-2 h-4 w-4' />
                              Stages
                            </Link>
                          </Button>
                        )}

                        {canUpdate && hasValidId && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              onClone(version).catch(() => undefined)
                            }}
                            disabled={
                              cloningDefId !== null ||
                              publishingDefId !== null ||
                              exportingDefId !== null ||
                              deletePending
                            }
                          >
                            {cloningDefId === defId ? (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <Copy className='mr-2 h-4 w-4' />
                            )}
                            Clone
                          </Button>
                        )}

                        {canUpdate && hasValidId && !version.isActive && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              onPublish(version).catch(() => undefined)
                            }}
                            disabled={
                              publishingDefId !== null ||
                              cloningDefId !== null ||
                              exportingDefId !== null ||
                              deletePending
                            }
                          >
                            {publishingDefId === defId ? (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <Workflow className='mr-2 h-4 w-4' />
                            )}
                            Publish
                          </Button>
                        )}

                        {canUpdate && hasValidId && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              onExport(version).catch(() => undefined)
                            }}
                            disabled={
                              exportingDefId !== null ||
                              editPending ||
                              createPending
                            }
                          >
                            {exportingDefId === defId ? (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <Download className='mr-2 h-4 w-4' />
                            )}
                            Export
                          </Button>
                        )}

                        {canUpdate && hasValidId && (
                          <EditWorkflowDialog
                            workflow={version}
                            onEdit={(payload) => onEdit(version, payload)}
                            isEditing={editPending}
                            disabled={isImmutable}
                            disabledReason={
                              immutableReason
                                ? `This workflow version is immutable (${immutableReason}). Clone a new version to modify.`
                                : undefined
                            }
                          />
                        )}

                        {canDelete && hasValidId && (
                          <DeleteWorkflowDialog
                            workflow={version}
                            onDelete={() => onDelete(version)}
                            isDeleting={deletingDefId === defId}
                            disabled={
                              deletingDefId !== null ||
                              cloningDefId !== null ||
                              publishingDefId !== null ||
                              editPending ||
                              createPending ||
                              deletePending ||
                              isImmutable
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {diffResult && (
        <WorkflowDiffViewerDialog
          open={isFullDiffOpen}
          onOpenChange={setIsFullDiffOpen}
          diffResult={diffResult}
        />
      )}
    </>
  )
}

type WorkflowDiffViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  diffResult: WorkflowVersionDiffResult
}

type WorkflowDiffItemsPanelProps = {
  title: string
  items: WorkflowDiffItem[]
  tone: 'added' | 'removed' | 'modified'
}

function WorkflowDiffItemsPanel({
  title,
  items,
  tone,
}: WorkflowDiffItemsPanelProps) {
  const toneClass =
    tone === 'added'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'removed'
        ? 'border-rose-200 bg-rose-50'
        : 'border-amber-200 bg-amber-50'

  const emptyLabel =
    tone === 'added'
      ? 'No added entries.'
      : tone === 'removed'
        ? 'No removed entries.'
        : 'No modified entries.'

  return (
    <div className='rounded-md border p-3'>
      <div className='mb-2 flex items-center justify-between'>
        <p className='text-sm font-semibold'>{title}</p>
        <Badge variant='secondary'>{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <p className='text-muted-foreground text-xs'>{emptyLabel}</p>
      ) : (
        <div className='max-h-[44vh] space-y-2 overflow-auto pr-1'>
          {items.map((item) => (
            <details key={`${title}-${item.key}`} className='rounded-md border'>
              <summary className='cursor-pointer px-3 py-2 text-sm font-medium'>
                {item.key}
                {tone === 'modified' &&
                  item.fieldChanges &&
                  item.fieldChanges.length > 0 &&
                  ` (${item.fieldChanges.length} field change${
                    item.fieldChanges.length === 1 ? '' : 's'
                  })`}
              </summary>
              <div className='space-y-3 border-t px-3 py-3'>
                {tone === 'modified' &&
                  item.fieldChanges &&
                  item.fieldChanges.length > 0 && (
                    <div className='space-y-2'>
                      <p className='text-xs font-semibold'>Changed Fields</p>
                      <div className='space-y-1'>
                        {item.fieldChanges.map((change) => (
                          <div
                            key={`${item.key}-${change.path}`}
                            className='rounded border p-2 text-xs'
                          >
                            <p className='font-medium'>{change.path}</p>
                            <p className='text-muted-foreground truncate'>
                              Before: {change.before}
                            </p>
                            <p className='text-muted-foreground truncate'>
                              After: {change.after}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className='grid gap-2 lg:grid-cols-2'>
                  {item.before !== undefined && (
                    <div className={`rounded border p-2 ${toneClass}`}>
                      <p className='mb-1 text-xs font-semibold'>Before</p>
                      <pre className='max-h-[220px] overflow-auto text-[11px] leading-5 whitespace-pre-wrap'>
                        {toPrettyJson(item.before)}
                      </pre>
                    </div>
                  )}
                  {item.after !== undefined && (
                    <div className={`rounded border p-2 ${toneClass}`}>
                      <p className='mb-1 text-xs font-semibold'>After</p>
                      <pre className='max-h-[220px] overflow-auto text-[11px] leading-5 whitespace-pre-wrap'>
                        {toPrettyJson(item.after)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkflowDiffViewerDialog({
  open,
  onOpenChange,
  diffResult,
}: WorkflowDiffViewerDialogProps) {
  const changedSectionCount = diffResult.sections.filter(
    (section) => section.changed
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-[95vh] w-[98vw] max-w-[98vw] overflow-hidden p-0'>
        <div className='flex h-full flex-col'>
          <DialogHeader className='border-b px-6 py-4'>
            <DialogTitle>Full Diff Viewer</DialogTitle>
            <DialogDescription>
              Comparing {diffResult.baseLabel} → {diffResult.targetLabel}.{' '}
              {changedSectionCount} section
              {changedSectionCount === 1 ? '' : 's'} changed.
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 space-y-4 overflow-auto px-6 py-4'>
            {diffResult.sections.map((section) => (
              <section
                key={section.key}
                className='space-y-3 rounded-md border p-3'
              >
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-semibold'>{section.label}</p>
                    <p className='text-muted-foreground text-xs'>
                      {section.details}
                    </p>
                  </div>
                  <Badge variant={section.changed ? 'default' : 'secondary'}>
                    {section.changed ? 'Changed' : 'No Change'}
                  </Badge>
                </div>

                <div className='grid gap-3 xl:grid-cols-3'>
                  <WorkflowDiffItemsPanel
                    title='Added'
                    items={section.addedItems}
                    tone='added'
                  />
                  <WorkflowDiffItemsPanel
                    title='Removed'
                    items={section.removedItems}
                    tone='removed'
                  />
                  <WorkflowDiffItemsPanel
                    title='Modified'
                    items={section.modifiedItems}
                    tone='modified'
                  />
                </div>
              </section>
            ))}

            <section className='space-y-2 rounded-md border p-3'>
              <p className='text-sm font-semibold'>Normalized JSON Snapshot</p>
              <p className='text-muted-foreground text-xs'>
                Full normalized payloads used for diffing.
              </p>
              <div className='grid gap-3 xl:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-xs font-medium'>{diffResult.baseLabel}</p>
                  <pre className='bg-muted max-h-[360px] overflow-auto rounded-md p-2 text-[11px] leading-5'>
                    {diffResult.baseJson}
                  </pre>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs font-medium'>
                    {diffResult.targetLabel}
                  </p>
                  <pre className='bg-muted max-h-[360px] overflow-auto rounded-md p-2 text-[11px] leading-5'>
                    {diffResult.targetJson}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type CreateDialogProps = {
  onCreate: (payload: CreatePayload) => Promise<void>
  isCreating?: boolean
}

function CreateWorkflowDialog({ onCreate, isCreating }: CreateDialogProps) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { key: '', name: '' },
    mode: 'onChange',
  })

  const submitting = isSubmitting || !!isCreating

  const onSubmit = async (values: z.infer<typeof createSchema>) => {
    try {
      await onCreate({
        ...values,
        key: String(values.key ?? '').toUpperCase(),
      })
      reset({ key: '', name: '' })
      setOpen(false)
    } catch {
      // Error is already toasted by handleCreateWorkflow
      // We just need to catch it here so the form doesn't reset/close on failure
    }
  }

  // Reset form when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !submitting) {
      reset({ key: '', name: '' })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='mr-2 h-4 w-4' />
          Create Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create workflow</DialogTitle>
          <DialogDescription>
            Provide a unique key and a human‑friendly name. Keys are used to
            reference workflows in code and must be uppercase and URL‑safe.
          </DialogDescription>
        </DialogHeader>

        <form className='grid gap-4 py-2' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <Label htmlFor='key'>Key</Label>
            {(() => {
              const keyField = register('key')
              return (
                <Input
                  id='key'
                  placeholder='e.g. ACCOUNT_CLOSURE'
                  autoComplete='off'
                  {...keyField}
                  onChange={(event) => {
                    event.target.value = event.target.value.toUpperCase()
                    keyField.onChange(event)
                  }}
                />
              )
            })()}
            {errors.key && (
              <p className='text-destructive text-sm'>{errors.key.message}</p>
            )}
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              placeholder='e.g. Account Closure Workflow'
              autoComplete='off'
              {...register('name')}
            />
            {errors.name && (
              <p className='text-destructive text-sm'>{errors.name.message}</p>
            )}
          </div>

          <DialogFooter className='mt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type DeleteDialogProps = {
  workflow: WorkflowDefinition
  onDelete: () => Promise<void>
  isDeleting?: boolean
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

function DeleteWorkflowDialog({
  workflow,
  onDelete,
  isDeleting,
  disabled,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: DeleteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const workflowKey = String(workflow.key ?? '').trim()
  const requiredText = workflowKey || `workflow-${workflow.id}`
  const canConfirm = confirmationText.trim() === requiredText && !isDeleting

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isDeleting) {
      setConfirmationText('')
    }
    setOpen(isOpen)
  }

  const handleDelete = async () => {
    if (!canConfirm) return
    try {
      await onDelete()
      setOpen(false)
      setConfirmationText('')
    } catch {
      // error already handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size='sm' variant='destructive' disabled={disabled}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Delete workflow definition</DialogTitle>
          <DialogDescription>
            This deletes version <b>{workflow.version ?? 1}</b> of{' '}
            <b>{workflow.name ?? workflow.key ?? workflow.id}</b> and cascades
            related stages, transitions, instances, tasks, submissions,
            documents, variables, and logs. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-2 py-1'>
          <Label htmlFor={`delete-workflow-${workflow.id}`}>
            Type <span className='font-mono'>{requiredText}</span> to confirm
          </Label>
          <Input
            id={`delete-workflow-${workflow.id}`}
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={requiredText}
            autoComplete='off'
            disabled={!!isDeleting}
          />
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={!!isDeleting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={!canConfirm}
          >
            {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Delete Cascadingly
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type EditDialogProps = {
  workflow: WorkflowDefinition
  onEdit: (payload: EditPayload) => Promise<void>
  isEditing?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  disabled?: boolean
  disabledReason?: string
}

function EditWorkflowDialog({
  workflow,
  onEdit,
  isEditing,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
  disabled,
  disabledReason,
}: EditDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      key: workflow.key ?? '',
      name: workflow.name ?? '',
      isActive: workflow.isActive ?? false,
    },
    mode: 'onChange',
  })

  const submitting = isSubmitting || !!isEditing

  const onSubmit = async (values: z.infer<typeof editSchema>) => {
    if (disabled) return
    try {
      await onEdit({
        name: values.name.trim(),
        isActive: values.isActive,
      })
      setOpen(false)
    } catch {
      // error already handled in handleEditWorkflow
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !submitting) {
      reset({
        key: workflow.key ?? '',
        name: workflow.name ?? '',
        isActive: workflow.isActive ?? false,
      })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size='sm' variant='outline' disabled={disabled}>
            Edit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit workflow</DialogTitle>
          <DialogDescription>
            Update the display name and activation status for this workflow
            definition.
            {disabledReason ? ` ${disabledReason}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form className='grid gap-4 py-2' onSubmit={handleSubmit(onSubmit)}>
          {/* Key is shown read-only so it can’t be changed */}
          <div className='grid gap-2'>
            <Label htmlFor='edit-key'>Key</Label>
            <Input id='edit-key' value={workflow.key} disabled readOnly />
            <p className='text-muted-foreground text-xs'>
              Keys are immutable and used for programmatic references.
            </p>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='edit-name'>Name</Label>
            <Input
              id='edit-name'
              autoComplete='off'
              disabled={submitting || disabled}
              {...register('name')}
            />
            {errors.name && (
              <p className='text-destructive text-sm'>{errors.name.message}</p>
            )}
          </div>

          <div className='flex items-center justify-between rounded-md border px-3 py-2'>
            <div>
              <Label htmlFor='edit-is-active'>Status</Label>
              <p className='text-muted-foreground text-xs'>
                Toggle to activate or deactivate this workflow.
              </p>
            </div>
            <Controller
              name='isActive'
              control={control}
              render={({ field }) => (
                <Switch
                  id='edit-is-active'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={submitting || disabled}
                />
              )}
            />
          </div>

          <DialogFooter className='mt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting || disabled}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
