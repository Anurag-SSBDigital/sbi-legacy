import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { paths, components } from '@/types/api/v1.js'
import {
  CheckCircle,
  FileWarning,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  ArrowRight,
  GitBranch,
  Info,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import StageDialog, {
  StageFormType,
} from '@/features/workflow/stages/StageDiaog'

// ─────────────────────────────────────────────────────────────────────────────
// Types (updated to NEW API shapes)
// ─────────────────────────────────────────────────────────────────────────────

export type Stage =
  | NonNullable<
      paths['/api/wf/definitions/{defId}/stages']['get']['responses']['200']['content']['*/*']
    >[number]
  | components['schemas']['WorkflowStageDefinitionDto']

type StageWithFormSchema = Stage & {
  formSchemaId?: number
  formSchemaKey?: string
  formSchemaVersion?: number
  generatedDocuments?: Array<{
    id?: number
    code?: string
    label?: string
    mode?: string
    docType?: string
    fileNamePattern?: string
    templateId?: number
    templateKey?: string
    templateVersion?: number
    enabled?: boolean
  }>
}

type StageCreateRequest = components['schemas']['WorkflowStageDefinitionDto']
type StageUpdateRequest =
  components['schemas']['WorkflowStageDefinitionUpdateRequest']
type StageGeneratedDocumentPayload =
  components['schemas']['WorkflowStageGeneratedDocumentDto']

type TransitionDto = components['schemas']['WorkflowTransitionDto'] & {
  conditionSpEL?: string
  priority?: number
}
type TransitionCreate =
  components['schemas']['WorkflowTransitionCreateRequest'] & {
    conditionSpEL?: string
    autoTransition?: boolean
    priority?: number
  }

type User = {
  id?: string
  username?: string
  fullName?: string
  branchId?: string | null
  departmentId?: string | null
}

const TRANSITION_TRIGGERS = [
  'APPROVE',
  'REJECT',
  'SEND_BACK',
  'TIMEOUT',
] as const

type TransitionTrigger = (typeof TRANSITION_TRIGGERS)[number]

const TRANSITION_TRIGGER_COLOR: Record<TransitionTrigger, string> = {
  APPROVE: '#16a34a',
  REJECT: '#dc2626',
  SEND_BACK: '#d97706',
  TIMEOUT: '#7c3aed',
}

const TRANSITION_TRIGGER_DASH: Record<TransitionTrigger, string> = {
  APPROVE: '',
  REJECT: '7 4',
  SEND_BACK: '3 3',
  TIMEOUT: '10 4 2 4',
}

const getTransitionStroke = (trigger?: string | null) => {
  if (!trigger) return '#6b7280'
  if (trigger in TRANSITION_TRIGGER_COLOR) {
    return TRANSITION_TRIGGER_COLOR[trigger as TransitionTrigger]
  }
  return '#6b7280'
}

const getTransitionDash = (trigger?: string | null) => {
  if (!trigger) return ''
  if (trigger in TRANSITION_TRIGGER_DASH) {
    return TRANSITION_TRIGGER_DASH[trigger as TransitionTrigger]
  }
  return ''
}

const GRAPH_ZOOM_MIN = 0.7
const GRAPH_ZOOM_MAX = 1.4
const GRAPH_ZOOM_STEP = 0.1

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback

  const maybeError = error as {
    message?: unknown
    response?: { data?: { message?: unknown } }
  }

  const responseMessage = maybeError.response?.data?.message
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage
  }

  if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
    return maybeError.message
  }

  return fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Route definition
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute(
  '/_authenticated/admin/workflow/$defId/stages'
)({
  component: RouteComponent,
  params: {
    parse: z.object({
      defId: z.coerce.number().int().positive(),
    }).parse,
  },
})

function RouteComponent() {
  const { defId } = Route.useParams()
  const queryClient = useQueryClient()
  const canCreate = useCanAccess('workflow', 'create')
  const canUpdate = useCanAccess('workflow', 'update')

  // Stages
  const { data: stagesResponse = [] } = $api.useSuspenseQuery(
    'get',
    '/api/wf/definitions/{defId}/stages',
    {
      params: { path: { defId: Number(defId) } },
    }
  )
  const stages = stagesResponse as StageWithFormSchema[]

  // Workflow metadata
  const { data: workflow } = $api.useQuery(
    'get',
    '/api/wf/definitions/{defId}',
    { params: { path: { defId: Number(defId) } } }
  )
  const workflowMeta = workflow as
    | (typeof workflow & {
        isPublished?: boolean | null
        hasRuntimeInstances?: boolean | null
      })
    | undefined
  const isPublishedVersion = Boolean(workflow?.isActive)
  const isPreviouslyPublishedVersion = Boolean(workflowMeta?.isPublished)
  const hasRuntimeInstances = Boolean(workflowMeta?.hasRuntimeInstances)
  const isImmutableVersion =
    isPublishedVersion || isPreviouslyPublishedVersion || hasRuntimeInstances
  const immutableReason = isPublishedVersion
    ? 'currently published'
    : isPreviouslyPublishedVersion
      ? 'previously published'
      : hasRuntimeInstances
        ? 'runtime instances exist'
        : null
  const immutableToastMessage =
    immutableReason == null
      ? 'This workflow version is immutable. Clone a new version to make changes.'
      : `This workflow version is immutable (${immutableReason}). Clone a new version to make changes.`

  const editStageMutation = $api.useMutation(
    'put',
    '/api/wf/definitions/stages/{stageId}'
  )

  // Create stage
  const createStageMutation = $api.useMutation(
    'post',
    '/api/wf/definitions/{defId}/stages'
  )
  //delete stage
  const deleteStageMutation = $api.useMutation(
    'delete',
    '/api/wf/definitions/stages/{stageId}'
  )

  // Enable/disable stage
  const enabledMutation = $api.useMutation(
    'patch',
    '/api/wf/definitions/stages/{stageId}/enabled'
  )

  // Roles
  const { data: rolesResp } = $api.useQuery('get', '/roles/getAllRoles', {
    params: { header: { Authorization: '' } },
    staleTime: 5 * 60 * 1000,
  }) as { data?: { data?: { id: string; roleName: string }[] } }
  const roles = rolesResp?.data ?? []

  // Users
  const { data: usersResponse } = $api.useQuery('get', '/user/get/AllUsers', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
      },
    },
  }) as { data: { data?: User[] } | undefined }
  const filteredUsers = usersResponse?.data ?? []

  // Transitions
  const { data: transitions, isLoading: transitionsLoading } = $api.useQuery(
    'get',
    '/api/wf/definitions/{defId}/transitions',
    { params: { path: { defId } } }
  )

  const createTransitionMutation = $api.useMutation(
    'post',
    '/api/wf/definitions/{defId}/transitions'
  )

  const updateTransitionMutation = $api.useMutation(
    'put',
    '/api/wf/definitions/transitions/{transitionId}'
  )

  const deleteTransitionMutation = $api.useMutation(
    'delete',
    '/api/wf/definitions/transitions/{transitionId}'
  )

  // Edit dialog state
  const [open, setOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<StageWithFormSchema | null>(
    null
  )

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) setEditingStage(null)
  }
  const handleDeleteStage = async (stage: StageWithFormSchema) => {
    if (!canUpdate) {
      toast.error('You do not have permission to delete stages.')
      return
    }

    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    const stageId = Number(stage.id)
    if (!Number.isFinite(stageId) || stageId <= 0) {
      toast.error('Invalid stage ID. Unable to delete this stage.')
      return
    }

    const confirmed = window.confirm(
      `Delete stage "${stage.name ?? 'Unnamed Stage'}"? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await deleteStageMutation.mutateAsync({
        params: {
          path: { stageId },
        },
      })

      await invalidateStages()
      toast.success('Stage deleted successfully.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to delete stage. Please try again.')
      )
    }
  }
  const handleAddClick = () => {
    if (!canCreate) {
      toast.error('You do not have permission to add stages.')
      return
    }
    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    setEditingStage(null)
    setOpen(true)
  }

  const handleEditClick = (stage: StageWithFormSchema) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit stages.')
      return
    }
    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    setEditingStage(stage)
    setOpen(true)
  }

  // Order options
  const orderOptions = useMemo(() => {
    const max = (stages?.length ?? 0) + (editingStage ? 0 : 1)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [stages, editingStage])

  const invalidateStages = () =>
    queryClient.invalidateQueries({
      queryKey: ['get', '/api/wf/definitions/{defId}/stages'],
    })

  const invalidateTransitions = () =>
    queryClient.invalidateQueries({
      queryKey: ['get', '/api/wf/definitions/{defId}/transitions'],
    })

  const handleCreateTransition = async (payload: TransitionCreate) => {
    if (!canUpdate) {
      toast.error('You do not have permission to create transitions.')
      return
    }
    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    try {
      await createTransitionMutation.mutateAsync({
        params: { path: { defId: Number(defId) } },
        body: payload,
      })
      invalidateTransitions()
      toast.success('Transition created successfully.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to create transition. Please try again.'
        )
      )
      throw error
    }
  }

  const handleUpdateTransition = async (
    transitionId: number,
    payload: TransitionCreate
  ) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit transitions.')
      return
    }
    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    try {
      await updateTransitionMutation.mutateAsync({
        params: {
          path: { transitionId },
        },
        body: payload,
      })
      invalidateTransitions()
      toast.success('Transition updated successfully.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to update transition. Please try again.'
        )
      )
      throw error
    }
  }

  const handleDeleteTransition = async (transitionId: number) => {
    if (!canUpdate) {
      toast.error('You do not have permission to delete transitions.')
      return
    }
    if (isImmutableVersion) {
      toast.error(immutableToastMessage)
      return
    }

    try {
      await deleteTransitionMutation.mutateAsync({
        params: {
          path: { transitionId },
        },
      })
      invalidateTransitions()
      toast.success('Transition removed successfully.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to remove transition. Please try again.'
        )
      )
      throw error
    }
  }

  // Quick stats for header
  const totalStages = stages.length
  const activeStages = stages.filter((s) => s.enabled).length
  const totalTransitions = (transitions ?? []).length

  // ───────────────────────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className='container space-y-4 pt-4 pb-8'>
      {/* Header */}
      <header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
        <div className='space-y-1.5'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase'>
            <GitBranch className='h-4 w-4' />
            Workflow configuration
          </div>
          <h1 className='text-2xl font-semibold tracking-tight text-balance'>
            {workflow?.name || 'Workflow Stages'}
          </h1>
          <p className='text-muted-foreground text-sm'>
            Configure review and approval stages, and define how items move
            between them.
          </p>

          <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
            {workflow?.key && (
              <span className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5'>
                <span className='font-medium'>Key</span>
                <code className='bg-background rounded px-1 py-0.5 text-[10px]'>
                  {workflow.key}
                </code>
              </span>
            )}
            {typeof workflow?.version === 'number' && (
              <span className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5'>
                <span className='font-medium'>Version</span>
                <span>{workflow.version}</span>
              </span>
            )}
            <span className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5'>
              <span className='font-medium'>Status</span>
              <Badge
                variant={workflow?.isActive ? 'default' : 'secondary'}
                className='h-5 rounded-full px-2 text-[11px]'
              >
                {workflow?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </span>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div className='bg-muted/40 grid gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Stages</span>
              <span className='font-semibold'>{totalStages}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Active</span>
              <span className='font-semibold'>{activeStages}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Transitions</span>
              <span className='font-semibold'>{totalTransitions}</span>
            </div>
          </div>

          <Button
            size='sm'
            className='mt-1 gap-1'
            onClick={handleAddClick}
            disabled={!canCreate || isImmutableVersion}
          >
            <Plus className='h-4 w-4' /> Add Stage
          </Button>
        </div>
      </header>

      {isImmutableVersion && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertTitle>Immutable Version</AlertTitle>
          <AlertDescription>
            This workflow version is immutable
            {immutableReason ? ` (${immutableReason})` : ''}. Clone a new
            version from the workflow list to make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Mini timeline chips for quick orientation */}
      {stages.length > 0 && (
        <div className='bg-muted/30 rounded-lg border px-3 py-2'>
          <div className='text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase'>
            <Info className='h-3 w-3' />
            Stage order
          </div>
          <div className='flex flex-wrap gap-1.5'>
            {stages.map((stage) => (
              <div
                key={String(stage.id)}
                className='bg-background inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs'
              >
                <span className='bg-muted inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold'>
                  {stage.stageOrder}
                </span>
                <span className='max-w-[140px] truncate'>{stage.name}</span>
                {!stage.enabled && (
                  <span className='text-muted-foreground text-[10px] font-medium'>
                    (off)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <StageDialog
          key={editingStage?.id ?? 'new'}
          initialData={(editingStage as unknown as StageFormType) ?? undefined}
          isEditMode={!!editingStage}
          orderOptions={orderOptions}
          users={filteredUsers}
          onInvalidSubmit={() =>
            toast.error('Please fix validation errors before saving.')
          }
          onSubmit={async (form) => {
            if (createStageMutation.isPending || editStageMutation.isPending)
              return

            const normalizedGeneratedDocuments: StageGeneratedDocumentPayload[] =
              (form.generatedDocuments ?? [])
                .map((doc) => ({
                  id: doc.id,
                  code: doc.code?.trim(),
                  label: doc.label?.trim() || undefined,
                  mode: doc.mode ?? 'ON_DEMAND',
                  docType: doc.docType?.trim() || undefined,
                  fileNamePattern: doc.fileNamePattern?.trim() || undefined,
                  templateId:
                    doc.templateId && Number(doc.templateId) > 0
                      ? Number(doc.templateId)
                      : undefined,
                  templateKey: doc.templateKey?.trim() || undefined,
                  templateVersion:
                    doc.templateVersion && Number(doc.templateVersion) > 0
                      ? Number(doc.templateVersion)
                      : undefined,
                  enabled: doc.enabled ?? true,
                }))
                .filter((doc) => Boolean(doc.code))

            const basePayload: StageUpdateRequest = {
              stageOrder: form.stageOrder,
              key: form.key?.trim(),
              name: form.name?.trim(),
              assignmentType: form.assignmentType,
              roleId: form.roleId ?? undefined,
              username: form.username ?? undefined,
              departmentId: form.departmentId ?? undefined,
              branchId: form.branchId ?? undefined,
              requiresDocuments: form.requiresDocuments ?? false,
              slaDays: form.slaDays,
              skippable: form.skippable ?? false,
              enabled: form.enabled ?? true,
              metadataJson: form.metadataJson?.trim() || undefined,
              stageType: form.stageType,
              formSchemaId:
                form.formSchemaId && Number(form.formSchemaId) > 0
                  ? Number(form.formSchemaId)
                  : undefined,
              generatedDocuments: normalizedGeneratedDocuments,
            }

            if (editingStage) {
              if (!canUpdate) {
                toast.error('You do not have permission to edit stages.')
                return
              }

              if (isImmutableVersion) {
                toast.error(immutableToastMessage)
                return
              }

              const stageId = Number(editingStage.id ?? form.id)
              if (!Number.isFinite(stageId) || stageId <= 0) {
                toast.error(
                  'Unable to determine stage ID for update. Reopen the dialog and try again.'
                )
                return
              }

              const existingSchemaId =
                editingStage.formSchemaId &&
                Number(editingStage.formSchemaId) > 0
                  ? Number(editingStage.formSchemaId)
                  : undefined

              const bodyForUpdate: StageUpdateRequest = {
                ...basePayload,
                formSchemaId:
                  existingSchemaId && !basePayload.formSchemaId
                    ? 0
                    : basePayload.formSchemaId,
              }

              try {
                await editStageMutation.mutateAsync({
                  params: {
                    path: { stageId },
                    header: { Authorization: '' },
                  },
                  body: bodyForUpdate,
                })

                await invalidateStages()
                handleOpenChange(false)
                toast.success('Stage changes saved successfully.')
              } catch (error) {
                toast.error(
                  getApiErrorMessage(
                    error,
                    'Failed to save stage changes. Please try again.'
                  )
                )
                throw error
              }

              return
            }

            if (!canCreate) {
              toast.error('You do not have permission to add stages.')
              return
            }

            if (isImmutableVersion) {
              toast.error(immutableToastMessage)
              return
            }

            try {
              await createStageMutation.mutateAsync({
                params: {
                  path: { defId: Number(defId) },
                  header: { Authorization: '' },
                },
                body: basePayload as StageCreateRequest,
              })

              await invalidateStages()
              handleOpenChange(false)
              toast.success('Stage created successfully.')
            } catch (error) {
              toast.error(
                getApiErrorMessage(
                  error,
                  'Failed to create stage. Please try again.'
                )
              )
              throw error
            }
          }}
        />
      </Dialog>

      {/* Content */}
      {!stages || stages.length === 0 ? (
        <Alert>
          <FileWarning className='h-4 w-4' />
          <AlertTitle>No stages defined</AlertTitle>
          <AlertDescription className='text-sm'>
            Start by adding the first stage in this workflow. You can later
            define transitions between stages.
          </AlertDescription>
          <div className='pt-3'>
            <Button
              size='sm'
              className='gap-1'
              onClick={handleAddClick}
              disabled={!canCreate || isImmutableVersion}
            >
              <Plus className='h-4 w-4' /> Add Stage
            </Button>
          </div>
        </Alert>
      ) : (
        <div>
          <div className='flex flex-col gap-6'>
            {stages.map((stage: Stage, index: number) => (
              <StageCard
                key={String(stage.id)}
                stage={stage}
                isLast={index === stages.length - 1}
                onEdit={() => handleEditClick(stage)}
                onDelete={() => handleDeleteStage(stage)}
                onToggleEnabled={(enabled) => {
                  if (isImmutableVersion) {
                    toast.error(immutableToastMessage)
                    return
                  }
                  enabledMutation.mutate(
                    {
                      params: { path: { stageId: Number(stage.id) } },
                      body: { enabled },
                    },
                    {
                      onSuccess: invalidateStages,
                    }
                  )
                }}
                toggling={enabledMutation.isPending}
                deleting={deleteStageMutation.isPending}
                roles={roles}
                canUpdate={canUpdate && !isImmutableVersion}
              />
            ))}

            <TransitionsSection
              stages={stages}
              transitions={transitions as TransitionDto[] | undefined}
              loading={transitionsLoading}
              creating={createTransitionMutation.isPending}
              updating={updateTransitionMutation.isPending}
              deleting={deleteTransitionMutation.isPending}
              onCreate={handleCreateTransition}
              onUpdate={handleUpdateTransition}
              onDelete={handleDeleteTransition}
              canCreateTransition={canUpdate && !isImmutableVersion}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function StageCard({
  stage,
  isLast,
  onEdit,
  onDelete,
  onToggleEnabled,
  toggling,
  deleting,
  roles,
  canUpdate,
}: {
  stage: StageWithFormSchema
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleEnabled: (next: boolean) => void
  toggling?: boolean
  deleting?: boolean
  roles: { id: string; roleName: string }[]
  canUpdate: boolean
}) {
  const roleName = stage.roleId
    ? roles.find((r) => r.id === stage.roleId)?.roleName
    : undefined

  // const safeDate = (d?: string | number | Date) =>
  //   d ? new Date(d).toLocaleString() : '—'

  return (
    <div className='flex items-start gap-4 sm:gap-5'>
      {/* Timeline marker */}
      <div className='flex flex-col items-center pt-1'>
        <Avatar className='h-9 w-9 text-xs'>
          <AvatarFallback>{stage.stageOrder}</AvatarFallback>
        </Avatar>
        {!isLast && <div className='bg-border mt-1 h-16 w-px' />}
      </div>

      <Card className='border-border/70 w-full shadow-sm transition-shadow hover:shadow-md'>
        <CardHeader className='bg-muted/40 flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <CardTitle className='text-base font-semibold'>
                {stage.name}
              </CardTitle>
              {typeof stage.key === 'string' && (
                <code className='bg-background rounded px-1.5 py-0.5 text-[10px]'>
                  {stage.key}
                </code>
              )}
            </div>
            <CardDescription className='flex flex-wrap items-center gap-2 text-xs'>
              <Badge variant='secondary' className='h-5 rounded-full px-2'>
                {stage.assignmentType || 'Unassigned'}
              </Badge>
              {typeof stage.slaDays === 'number' && (
                <span className='bg-background text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px]'>
                  SLA: {stage.slaDays} day
                  {stage.slaDays === 1 ? '' : 's'}
                </span>
              )}
              {stage.requiresDocuments && (
                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
                  <CheckCircle className='h-3 w-3' />
                  Docs required
                </span>
              )}
              {stage.skippable && (
                <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'>
                  Skippable
                </span>
              )}
              {stage.formSchemaKey && (
                <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'>
                  Schema: {stage.formSchemaKey} v{stage.formSchemaVersion ?? 1}
                </span>
              )}
            </CardDescription>
          </div>

          <div className='flex items-center gap-2'>
            <div className='bg-background flex items-center gap-2 rounded-full border px-2 py-1'>
              <span className='text-muted-foreground text-xs'>
                {stage.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={!!stage.enabled}
                onCheckedChange={(v) => onToggleEnabled(v)}
                disabled={!canUpdate || toggling || deleting}
                aria-label={stage.enabled ? 'Disable stage' : 'Enable stage'}
              />
              {toggling && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
            </div>

            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={onEdit}
              disabled={!canUpdate || deleting}
              aria-label='Edit stage'
            >
              <Pencil className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 text-red-600 hover:text-red-700'
              onClick={onDelete}
              disabled={!canUpdate || deleting || toggling}
              aria-label='Delete stage'
            >
              {deleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-3 p-3'>
          {/* Main details */}
          <div className='grid gap-3 text-xs sm:grid-cols-3 lg:grid-cols-4'>
            <InfoItem label='Role' value={roleName} />
            <InfoItem label='Username' value={stage.username} />
            <InfoItem label='Department' value={stage.departmentId} />
            <InfoItem label='Branch' value={stage.branchId} />
            <InfoItem
              label='Form Schema'
              value={
                stage.formSchemaKey
                  ? `${stage.formSchemaKey} v${stage.formSchemaVersion ?? 1}`
                  : 'None'
              }
            />
          </div>

          <Separator />

          {/* Meta */}
          {/* <div className='text-muted-foreground grid gap-3 text-xs sm:grid-cols-2'>
            <InfoItem label='Created At' value={safeDate(stage.createdAt)} />
            <InfoItem label='Updated At' value={safeDate(stage.updatedAt)} />
          </div> */}
        </CardContent>
      </Card>
    </div>
  )
}

function TransitionsSection({
  stages,
  transitions,
  loading,
  creating,
  updating,
  deleting,
  onCreate,
  onUpdate,
  onDelete,
  canCreateTransition,
}: {
  stages: Stage[]
  transitions?: TransitionDto[]
  loading: boolean
  creating?: boolean
  updating?: boolean
  deleting?: boolean
  onCreate: (payload: TransitionCreate) => Promise<void> | void
  onUpdate: (
    transitionId: number,
    payload: TransitionCreate
  ) => Promise<void> | void
  onDelete: (transitionId: number) => Promise<void> | void
  canCreateTransition: boolean
}) {
  const [fromStageId, setFromStageId] = useState('')
  const [toStageId, setToStageId] = useState('')
  const [trigger, setTrigger] = useState<TransitionTrigger | ''>('')
  const [conditionSpEL, setConditionSpEL] = useState('')
  const [priority, setPriority] = useState('100')
  const [autoTransition, setAutoTransition] = useState(false)
  const [editingTransitionId, setEditingTransitionId] = useState<number | null>(
    null
  )
  const [graphZoom, setGraphZoom] = useState(1)
  const [graphTriggerFilter, setGraphTriggerFilter] = useState<
    'ALL' | TransitionTrigger
  >('ALL')

  const stageNameMap = useMemo(
    () =>
      new Map(
        stages.map((s) => [
          String(s.id),
          s.name ??
            `Stage ${typeof s.stageOrder === 'number' ? s.stageOrder : s.id}`,
        ])
      ),
    [stages]
  )

  const sortedStages = useMemo(
    () =>
      [...stages].sort((a, b) => {
        const orderA =
          typeof a.stageOrder === 'number'
            ? a.stageOrder
            : Number.MAX_SAFE_INTEGER
        const orderB =
          typeof b.stageOrder === 'number'
            ? b.stageOrder
            : Number.MAX_SAFE_INTEGER
        return orderA - orderB
      }),
    [stages]
  )

  const stageLayout = useMemo(() => {
    const nodeWidth = 180
    const nodeHeight = 84
    const gap = 220
    const marginX = nodeWidth / 2 + 40
    const topLaneY = 120
    const bottomLaneY = 260
    const map = new Map<
      string,
      {
        x: number
        y: number
        nodeWidth: number
        nodeHeight: number
      }
    >()

    sortedStages.forEach((stage, index) => {
      map.set(String(stage.id), {
        x: marginX + index * gap,
        y: index % 2 === 0 ? topLaneY : bottomLaneY,
        nodeWidth,
        nodeHeight,
      })
    })

    const endX = marginX + sortedStages.length * gap
    const endY = sortedStages.length % 2 === 0 ? topLaneY : bottomLaneY
    map.set('__end__', {
      x: endX,
      y: endY,
      nodeWidth: 140,
      nodeHeight: 64,
    })

    const canvasWidth = Math.max(760, endX + marginX + 80)
    const canvasHeight = 390

    return {
      map,
      canvasWidth,
      canvasHeight,
    }
  }, [sortedStages])

  const transitionVisuals = useMemo(() => {
    const safeTransitions = transitions ?? []
    const getTriggerRank = (trigger?: string | null) => {
      switch (trigger) {
        case 'APPROVE':
          return 0
        case 'REJECT':
          return 1
        case 'SEND_BACK':
          return 2
        case 'TIMEOUT':
          return 3
        default:
          return 4
      }
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value))

    const transitionRows = safeTransitions
      .map((transition, index) => {
        const fromId = transition.fromStageId
          ? String(transition.fromStageId)
          : undefined
        if (!fromId) return null

        const toId =
          transition.toStageId && Number(transition.toStageId) > 0
            ? String(transition.toStageId)
            : '__end__'

        const uniqueKey = String(
          transition.id ??
            `${fromId}->${toId}:${transition.trigger ?? 'DEFAULT'}:${transition.priority ?? 100}:${index}`
        )

        return {
          transition,
          fromId,
          toId,
          uniqueKey,
        }
      })
      .filter(Boolean) as Array<{
      transition: TransitionDto
      fromId: string
      toId: string
      uniqueKey: string
    }>

    const sortRows = (
      left: {
        transition: TransitionDto
        toId: string
        fromId: string
        uniqueKey: string
      },
      right: {
        transition: TransitionDto
        toId: string
        fromId: string
        uniqueKey: string
      }
    ) => {
      const triggerDiff =
        getTriggerRank(left.transition.trigger) -
        getTriggerRank(right.transition.trigger)
      if (triggerDiff !== 0) return triggerDiff

      const leftPriority =
        typeof left.transition.priority === 'number'
          ? left.transition.priority
          : 100
      const rightPriority =
        typeof right.transition.priority === 'number'
          ? right.transition.priority
          : 100
      if (leftPriority !== rightPriority) return leftPriority - rightPriority

      const targetDiff = left.toId.localeCompare(right.toId)
      if (targetDiff !== 0) return targetDiff

      return left.uniqueKey.localeCompare(right.uniqueKey)
    }

    const pairBuckets = new Map<string, typeof transitionRows>()
    const outgoingBuckets = new Map<string, typeof transitionRows>()
    const incomingBuckets = new Map<string, typeof transitionRows>()

    transitionRows.forEach((row) => {
      const pairKey = `${row.fromId}->${row.toId}`

      const pairList = pairBuckets.get(pairKey) ?? []
      pairList.push(row)
      pairBuckets.set(pairKey, pairList)

      const outgoingList = outgoingBuckets.get(row.fromId) ?? []
      outgoingList.push(row)
      outgoingBuckets.set(row.fromId, outgoingList)

      const incomingList = incomingBuckets.get(row.toId) ?? []
      incomingList.push(row)
      incomingBuckets.set(row.toId, incomingList)
    })

    pairBuckets.forEach((rows) => rows.sort(sortRows))
    outgoingBuckets.forEach((rows) => rows.sort(sortRows))
    incomingBuckets.forEach((rows) => rows.sort(sortRows))

    return transitionRows
      .map((row) => {
        const { transition, fromId, toId, uniqueKey } = row
        const fromNode = stageLayout.map.get(fromId)
        const toNode = stageLayout.map.get(toId)
        if (!fromNode || !toNode) return null

        const pairRows = pairBuckets.get(`${fromId}->${toId}`) ?? [row]
        const outgoingRows = outgoingBuckets.get(fromId) ?? [row]
        const incomingRows = incomingBuckets.get(toId) ?? [row]

        const pairIndex = pairRows.findIndex(
          (item) => item.uniqueKey === uniqueKey
        )
        const outgoingIndex = outgoingRows.findIndex(
          (item) => item.uniqueKey === uniqueKey
        )
        const incomingIndex = incomingRows.findIndex(
          (item) => item.uniqueKey === uniqueKey
        )

        const safePairIndex = pairIndex < 0 ? 0 : pairIndex
        const safeOutgoingIndex = outgoingIndex < 0 ? 0 : outgoingIndex
        const safeIncomingIndex = incomingIndex < 0 ? 0 : incomingIndex

        const pairLane = (safePairIndex - (pairRows.length - 1) / 2) * 12
        const sourcePort =
          (safeOutgoingIndex - (outgoingRows.length - 1) / 2) * 11
        const targetPort =
          (safeIncomingIndex - (incomingRows.length - 1) / 2) * 11

        const triggerBand = (getTriggerRank(transition.trigger) - 1.5) * 10
        const sourceLimit = fromNode.nodeHeight / 2 - 10
        const targetLimit = toNode.nodeHeight / 2 - 10
        const sourceOffset = clamp(
          sourcePort + triggerBand * 0.8 + pairLane * 0.5,
          -sourceLimit,
          sourceLimit
        )
        const targetOffset = clamp(
          targetPort + triggerBand * 0.6 - pairLane * 0.4,
          -targetLimit,
          targetLimit
        )

        const startX = fromNode.x + fromNode.nodeWidth / 2
        const endX = toNode.x - toNode.nodeWidth / 2
        const startY = fromNode.y + sourceOffset
        const endY = toNode.y + targetOffset

        const isBackward = endX < startX
        const dx = Math.abs(endX - startX)
        const dy = Math.abs(endY - startY)
        const control = Math.max(44, Math.min(120, dx * 0.24))
        const laneBend =
          pairLane * 0.95 +
          triggerBand * 0.65 +
          (sourceOffset - targetOffset) * 0.12

        let path = ''
        let labelY = (startY + endY) / 2

        if (!isBackward) {
          const midX = (startX + endX) / 2
          const laneY = (startY + endY) / 2 + laneBend
          const firstHandleX = Math.min(midX - 18, startX + control)
          const secondHandleX = Math.max(midX + 18, endX - control)

          path = `M ${startX} ${startY} C ${firstHandleX} ${startY}, ${midX - 24} ${laneY}, ${midX} ${laneY} C ${midX + 24} ${laneY}, ${secondHandleX} ${endY}, ${endX} ${endY}`
          labelY = laneY + (laneY >= (startY + endY) / 2 ? 11 : -11)
        } else {
          const backwardReach = Math.max(72, Math.min(170, dx * 0.38 + 62))
          const arc = 46 + Math.min(30, dy * 0.35) + Math.abs(laneBend) * 0.25
          const bowDirection = startY <= endY ? -1 : 1
          const c1X = startX + backwardReach
          const c2X = endX - backwardReach
          const c1Y = startY + bowDirection * arc + laneBend * 0.4
          const c2Y = endY + bowDirection * arc + laneBend * 0.4
          path = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`
          labelY = (c1Y + c2Y) / 2 + bowDirection * 10
        }

        return {
          transition,
          fromId,
          toId,
          path,
          labelX: (startX + endX) / 2 + pairLane * 0.2,
          labelY,
          stroke: getTransitionStroke(transition.trigger),
          dash: getTransitionDash(transition.trigger),
        }
      })
      .filter(Boolean) as Array<{
      transition: TransitionDto
      fromId: string
      toId: string
      path: string
      labelX: number
      labelY: number
      stroke: string
      dash: string
    }>
  }, [stageLayout.map, transitions])

  const filteredTransitionVisuals = useMemo(
    () =>
      transitionVisuals.filter(
        ({ transition }) =>
          graphTriggerFilter === 'ALL' ||
          transition.trigger === graphTriggerFilter
      ),
    [graphTriggerFilter, transitionVisuals]
  )

  const stageTransitionSummary = useMemo(() => {
    const summary = new Map<string, { incoming: number; outgoing: number }>()
    stages.forEach((stage) => {
      summary.set(String(stage.id), { incoming: 0, outgoing: 0 })
    })
    ;(transitions ?? []).forEach((transition) => {
      const from = transition.fromStageId
        ? String(transition.fromStageId)
        : null
      const to =
        transition.toStageId && Number(transition.toStageId) > 0
          ? String(transition.toStageId)
          : null

      if (from && summary.has(from)) {
        const row = summary.get(from)!
        row.outgoing += 1
      }
      if (to && summary.has(to)) {
        const row = summary.get(to)!
        row.incoming += 1
      }
    })
    return summary
  }, [stages, transitions])

  const notEnoughStages = stages.length < 2

  const effectiveToStageId = toStageId === '__end__' ? '' : toStageId
  const parsedPriority = Number(priority)
  const normalizedPriority = Number.isFinite(parsedPriority)
    ? Math.max(0, Math.trunc(parsedPriority))
    : 100
  const normalizedCondition = conditionSpEL.trim()
  const isMutating = Boolean(creating || updating || deleting)
  const isEditing = editingTransitionId !== null

  const canCreate =
    canCreateTransition &&
    !!fromStageId &&
    !!trigger &&
    (!effectiveToStageId || fromStageId !== effectiveToStageId) &&
    Number.isFinite(parsedPriority) &&
    !notEnoughStages &&
    !isMutating

  const resetForm = () => {
    setFromStageId('')
    setToStageId('')
    setTrigger('')
    setConditionSpEL('')
    setPriority('100')
    setAutoTransition(false)
    setEditingTransitionId(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canCreate || !trigger) return

    const payload: TransitionCreate = {
      fromStageId: Number(fromStageId),
      toStageId: effectiveToStageId ? Number(effectiveToStageId) : undefined,
      // Only allowed values from TRANSITION_TRIGGERS
      trigger,
      conditionSpEL: normalizedCondition || undefined,
      priority: normalizedPriority,
      autoTransition,
    }

    try {
      if (isEditing && editingTransitionId) {
        await onUpdate(editingTransitionId, payload)
        resetForm()
        return
      }

      await onCreate(payload)
      resetForm()
    } catch {
      // toast is handled by parent mutation handlers
    }
  }

  const handleEditTransition = (transition: TransitionDto) => {
    if (!canCreateTransition) return
    if (!transition.id || !transition.fromStageId) return

    setEditingTransitionId(Number(transition.id))
    setFromStageId(String(transition.fromStageId))
    setToStageId(
      transition.toStageId && Number(transition.toStageId) > 0
        ? String(transition.toStageId)
        : '__end__'
    )
    setTrigger(
      TRANSITION_TRIGGERS.includes(transition.trigger as TransitionTrigger)
        ? (transition.trigger as TransitionTrigger)
        : ''
    )
    setConditionSpEL(transition.conditionSpEL ?? '')
    setPriority(String(transition.priority ?? 100))
    setAutoTransition(Boolean(transition.autoTransition))
  }

  const handleDeleteTransition = async (transition: TransitionDto) => {
    if (!canCreateTransition) return
    if (!transition.id) return
    if (!window.confirm('Delete this transition? This cannot be undone.')) {
      return
    }

    try {
      await onDelete(Number(transition.id))
      if (
        editingTransitionId &&
        Number(transition.id) === editingTransitionId
      ) {
        resetForm()
      }
    } catch {
      // toast is handled by parent mutation handler
    }
  }

  return (
    <Card className='bg-muted/20 border-dashed'>
      <CardHeader className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
        <div>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ArrowRight className='h-4 w-4' />
            Stage transitions
          </CardTitle>
          <CardDescription className='text-xs'>
            Define how items progress from one stage to another.
          </CardDescription>
        </div>
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          <GitBranch className='h-3.5 w-3.5' />
          {transitions?.length ?? 0} transitions configured
        </div>
      </CardHeader>

      <CardContent className='space-y-4 p-3'>
        {notEnoughStages && (
          <Alert className='border-amber-300 bg-amber-50 text-xs text-amber-900 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100'>
            <AlertTitle className='flex items-center gap-1 text-xs'>
              <Info className='h-3.5 w-3.5' />
              Add more stages
            </AlertTitle>
            <AlertDescription className='text-xs'>
              You need at least two stages to configure transitions.
            </AlertDescription>
          </Alert>
        )}

        {/* Visual mapping */}
        <div className='space-y-3'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-muted-foreground text-xs font-semibold uppercase'>
                Visual map
              </p>
              <p className='text-muted-foreground text-[10px]'>
                Read-only view of current stages and routing paths.
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Select
                value={graphTriggerFilter}
                onValueChange={(value: 'ALL' | TransitionTrigger) =>
                  setGraphTriggerFilter(value)
                }
              >
                <SelectTrigger className='h-8 w-[140px] text-xs'>
                  <SelectValue placeholder='Filter trigger' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>All triggers</SelectItem>
                  {TRANSITION_TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {trigger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className='flex items-center gap-1 rounded-md border px-1.5 py-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() =>
                    setGraphZoom((prev) =>
                      Math.max(
                        GRAPH_ZOOM_MIN,
                        Number((prev - GRAPH_ZOOM_STEP).toFixed(2))
                      )
                    )
                  }
                  aria-label='Zoom out map'
                >
                  <ZoomOut className='h-3.5 w-3.5' />
                </Button>
                <span className='w-10 text-center text-[10px] font-medium'>
                  {Math.round(graphZoom * 100)}%
                </span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() =>
                    setGraphZoom((prev) =>
                      Math.min(
                        GRAPH_ZOOM_MAX,
                        Number((prev + GRAPH_ZOOM_STEP).toFixed(2))
                      )
                    )
                  }
                  aria-label='Zoom in map'
                >
                  <ZoomIn className='h-3.5 w-3.5' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => setGraphZoom(1)}
                  aria-label='Reset map zoom'
                >
                  <RotateCcw className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          </div>
          <div className='bg-background rounded-md border p-2'>
            <div className='bg-muted/20 overflow-auto rounded-md border'>
              <div
                style={{
                  width: stageLayout.canvasWidth * graphZoom,
                  minHeight: stageLayout.canvasHeight * graphZoom,
                }}
              >
                <div
                  className='relative'
                  style={{
                    width: stageLayout.canvasWidth,
                    height: stageLayout.canvasHeight,
                    transform: `scale(${graphZoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <svg
                    className='absolute inset-0 h-full w-full'
                    viewBox={`0 0 ${stageLayout.canvasWidth} ${stageLayout.canvasHeight}`}
                    preserveAspectRatio='xMinYMin meet'
                    aria-label='Workflow transition map'
                  >
                    <defs>
                      <marker
                        id='stage-transition-arrow'
                        viewBox='0 0 10 10'
                        refX='9'
                        refY='5'
                        markerWidth='6'
                        markerHeight='6'
                        orient='auto-start-reverse'
                      >
                        <path d='M 0 0 L 10 5 L 0 10 z' fill='#6b7280' />
                      </marker>
                    </defs>

                    {filteredTransitionVisuals.map(
                      ({ transition, path, labelX, labelY, stroke, dash }) => {
                        const isEditingCurrent =
                          editingTransitionId !== null &&
                          Number(transition.id) === editingTransitionId
                        return (
                          <g key={String(transition.id)}>
                            <path
                              d={path}
                              stroke={stroke}
                              strokeWidth={isEditingCurrent ? 3 : 2}
                              strokeDasharray={dash || undefined}
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              fill='none'
                              markerEnd='url(#stage-transition-arrow)'
                              opacity={isEditingCurrent ? 1 : 0.78}
                            />
                            <text
                              x={labelX}
                              y={Math.max(16, labelY)}
                              textAnchor='middle'
                              fontSize='10'
                              fill='#4b5563'
                            >
                              {transition.trigger || 'DEFAULT'}
                            </text>
                          </g>
                        )
                      }
                    )}
                  </svg>

                  {sortedStages.map((stage) => {
                    const stageNode = stageLayout.map.get(String(stage.id))
                    if (!stageNode) return null
                    const summary = stageTransitionSummary.get(String(stage.id))
                    return (
                      <div
                        key={String(stage.id)}
                        className='bg-card absolute rounded-md border p-2 shadow-sm'
                        style={{
                          left: stageNode.x,
                          top: stageNode.y,
                          width: stageNode.nodeWidth,
                          minHeight: stageNode.nodeHeight,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <p className='text-muted-foreground text-[10px] uppercase'>
                          Stage {stage.stageOrder ?? '—'}
                        </p>
                        <p className='truncate text-xs font-semibold'>
                          {stage.name || 'Unnamed stage'}
                        </p>
                        <p className='text-muted-foreground mt-1 truncate text-[10px]'>
                          {stage.assignmentType || 'UNASSIGNED'}
                        </p>
                        <p className='text-muted-foreground mt-1 text-[10px]'>
                          In: {summary?.incoming ?? 0} | Out:{' '}
                          {summary?.outgoing ?? 0}
                        </p>
                      </div>
                    )
                  })}

                  {(() => {
                    const endNode = stageLayout.map.get('__end__')
                    if (!endNode) return null
                    return (
                      <div
                        className='bg-muted absolute flex items-center justify-center rounded-md border border-dashed text-[11px] font-medium'
                        style={{
                          left: endNode.x,
                          top: endNode.y,
                          width: endNode.nodeWidth,
                          height: endNode.nodeHeight,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        END
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-[10px]'>
            {TRANSITION_TRIGGERS.map((trigger) => (
              <span
                key={trigger}
                className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5'
              >
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: TRANSITION_TRIGGER_COLOR[trigger] }}
                />
                {trigger}
              </span>
            ))}
          </div>
        </div>

        {/* Existing transitions */}
        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs font-semibold uppercase'>
            Existing transitions
          </p>
          {loading ? (
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              Loading transitions…
            </div>
          ) : !transitions || transitions.length === 0 ? (
            <p className='text-muted-foreground text-xs'>
              No transitions defined yet. Use the form below to add one.
            </p>
          ) : (
            <div className='space-y-1.5'>
              {transitions.map((t) => (
                <div
                  key={t.id}
                  className='bg-background flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs'
                >
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='h-5 rounded-full px-2'>
                      {t.fromStageName ||
                        stageNameMap.get(String(t.fromStageId)) ||
                        `#${t.fromStageId}`}
                    </Badge>
                    <ArrowRight className='h-3 w-3' />
                    <Badge variant='outline' className='h-5 rounded-full px-2'>
                      {t.toStageName ||
                        stageNameMap.get(String(t.toStageId)) ||
                        (t.toStageId ? `#${t.toStageId}` : 'End of Workflow')}
                    </Badge>
                    {t.trigger && (
                      <Badge
                        variant='secondary'
                        className='h-5 rounded-full px-2 text-[11px]'
                      >
                        Trigger: {t.trigger}
                      </Badge>
                    )}
                    <Badge
                      variant='secondary'
                      className='h-5 rounded-full px-2 text-[11px]'
                    >
                      Priority:{' '}
                      {typeof t.priority === 'number' ? t.priority : 100}
                    </Badge>
                    {t.conditionSpEL && t.conditionSpEL.trim() && (
                      <code className='bg-muted max-w-[360px] truncate rounded px-1.5 py-0.5 text-[11px]'>
                        if {t.conditionSpEL}
                      </code>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {typeof t.autoTransition === 'boolean' && (
                      <span className='text-muted-foreground text-[11px]'>
                        {t.autoTransition ? 'Auto' : 'Manual'}
                      </span>
                    )}
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7'
                      disabled={!canCreateTransition || isMutating || !t.id}
                      onClick={() => handleEditTransition(t)}
                      aria-label='Edit transition'
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-red-600 hover:text-red-700'
                      disabled={!canCreateTransition || isMutating || !t.id}
                      onClick={() => void handleDeleteTransition(t)}
                      aria-label='Delete transition'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Create transition form */}
        <form className='space-y-3 text-xs' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-muted-foreground text-[11px] font-medium uppercase'>
              {isEditing
                ? `Editing transition #${editingTransitionId}`
                : 'Create new transition'}
            </p>
            {isEditing && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={resetForm}
                disabled={isMutating}
              >
                Cancel edit
              </Button>
            )}
          </div>

          <div className='grid gap-3 md:grid-cols-3'>
            <div className='space-y-1'>
              <Label
                htmlFor='fromStage'
                className='text-muted-foreground text-[11px] font-medium'
              >
                From stage
              </Label>
              <Select
                value={fromStageId}
                onValueChange={(value) => setFromStageId(value)}
                disabled={notEnoughStages || !canCreateTransition || isMutating}
              >
                <SelectTrigger id='fromStage' className='h-8 text-xs'>
                  <SelectValue placeholder='Select' />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={String(stage.id)} value={String(stage.id)}>
                      {stage.stageOrder
                        ? `${stage.stageOrder}. ${stage.name}`
                        : stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label
                htmlFor='toStage'
                className='text-muted-foreground text-[11px] font-medium'
              >
                To stage{' '}
                <span className='text-[10px] font-normal opacity-70'>
                  (Optional)
                </span>
              </Label>
              <Select
                value={toStageId}
                onValueChange={(value) => setToStageId(value)}
                disabled={notEnoughStages || !canCreateTransition || isMutating}
              >
                <SelectTrigger id='toStage' className='h-8 text-xs'>
                  <SelectValue placeholder='End of Workflow' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__end__'>End of Workflow</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem
                      key={String(stage.id)}
                      value={String(stage.id)}
                      disabled={String(stage.id) === fromStageId}
                    >
                      {stage.stageOrder
                        ? `${stage.stageOrder}. ${stage.name}`
                        : stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label
                htmlFor='trigger'
                className='text-muted-foreground text-[11px] font-medium'
              >
                Trigger
              </Label>
              <Select
                value={trigger}
                onValueChange={(value: TransitionTrigger) => setTrigger(value)}
                disabled={notEnoughStages || !canCreateTransition || isMutating}
              >
                <SelectTrigger id='trigger' className='h-8 text-xs'>
                  <SelectValue placeholder='Select trigger' />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-[10px]'>
                Required. Allowed values: APPROVE, REJECT, SEND_BACK, TIMEOUT.
              </p>
            </div>
          </div>

          <div className='grid gap-3 md:grid-cols-[160px,1fr]'>
            <div className='space-y-1'>
              <Label
                htmlFor='priority'
                className='text-muted-foreground text-[11px] font-medium'
              >
                Priority
              </Label>
              <Input
                id='priority'
                type='number'
                min={0}
                step={1}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                placeholder='100'
                disabled={!canCreateTransition || isMutating}
                className='h-8 text-xs'
              />
              <p className='text-muted-foreground text-[10px]'>
                Lower number runs first. Default is 100.
              </p>
            </div>

            <div className='space-y-1'>
              <Label
                htmlFor='conditionSpEL'
                className='text-muted-foreground text-[11px] font-medium'
              >
                Condition (SpEL)
              </Label>
              <Textarea
                id='conditionSpEL'
                value={conditionSpEL}
                onChange={(event) => setConditionSpEL(event.target.value)}
                placeholder="#form['loanAmount'] > 500000 and #variables['accountNo'] != null"
                disabled={!canCreateTransition || isMutating}
                className='min-h-[70px] text-xs'
              />
              <p className='text-muted-foreground text-[10px]'>
                Optional. Leave blank to make this transition a fallback for the
                selected trigger.
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <label className='inline-flex items-center gap-2 text-xs'>
              <Switch
                checked={autoTransition}
                onCheckedChange={setAutoTransition}
                disabled={!canCreateTransition || isMutating}
                aria-label='Auto transition'
              />
              <span className='text-muted-foreground'>Auto transition</span>
            </label>

            <Button
              type='submit'
              size='sm'
              className='w-full sm:w-auto'
              disabled={!canCreateTransition || isMutating}
            >
              {isMutating && (
                <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
              )}
              {isEditing ? 'Save transition' : 'Add transition'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className='space-y-0.5'>
      <p className='text-muted-foreground text-[11px] font-medium uppercase'>
        {label}
      </p>
      <p className='text-xs'>{value ?? 'N/A'}</p>
    </div>
  )
}
