import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { paths, components } from '@/types/api/v1.js'
import {
  CheckCircle,
  FileWarning,
  Pencil,
  Plus,
  Loader2,
  ArrowRight,
  GitBranch,
  Info,
} from 'lucide-react'
import { $api } from '@/lib/api'
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

type TransitionDto = components['schemas']['WorkflowTransitionDto']
type TransitionCreate = components['schemas']['WorkflowTransitionCreateRequest']

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

  // Stages
  const { data: stages = [] } = $api.useSuspenseQuery(
    'get',
    '/api/wf/definitions/{defId}/stages',
    {
      params: { path: { defId: Number(defId) } },
    }
  )

  // Workflow metadata
  const { data: workflow } = $api.useQuery(
    'get',
    '/api/wf/definitions/{defId}',
    { params: { path: { defId: Number(defId) } } }
  )

  const editStageMutation = $api.useMutation(
    'put',
    '/api/wf/definitions/stages/{stageId}'
  )

  // Create stage
  const createStageMutation = $api.useMutation(
    'post',
    '/api/wf/definitions/{defId}/stages'
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

  // Edit dialog state
  const [open, setOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) setEditingStage(null)
  }

  const handleAddClick = () => {
    setEditingStage(null)
    setOpen(true)
  }

  const handleEditClick = (stage: Stage) => {
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
    await createTransitionMutation.mutateAsync({
      params: { path: { defId: Number(defId) } },
      body: payload,
    })
    invalidateTransitions()
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

          <Button size='sm' className='mt-1 gap-1' onClick={handleAddClick}>
            <Plus className='h-4 w-4' /> Add Stage
          </Button>
        </div>
      </header>

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
          onSubmit={(form) => {
            if (editingStage) {
              editStageMutation.mutate(
                {
                  params: {
                    path: { stageId: Number(form.id) },
                    header: { Authorization: '' },
                  },
                  body: form as typeof form & { username: string },
                },
                {
                  onSuccess: () => {
                    invalidateStages()
                    handleOpenChange(false)
                  },
                }
              )

              setOpen(false)
              setEditingStage(null)
            } else {
              createStageMutation.mutate(
                {
                  params: {
                    path: { defId: Number(defId) },
                    header: { Authorization: '' },
                  },
                  body: form as typeof form & { username: string },
                },
                {
                  onSuccess: () => {
                    invalidateStages()
                    handleOpenChange(false)
                  },
                }
              )
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
            <Button size='sm' className='gap-1' onClick={handleAddClick}>
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
                onToggleEnabled={(enabled) =>
                  enabledMutation.mutate(
                    {
                      params: { path: { stageId: Number(stage.id) } },
                      body: { enabled },
                    },
                    {
                      onSuccess: invalidateStages,
                    }
                  )
                }
                toggling={enabledMutation.isPending}
                roles={roles}
              />
            ))}

            <TransitionsSection
              stages={stages}
              transitions={transitions as TransitionDto[] | undefined}
              loading={transitionsLoading}
              creating={createTransitionMutation.isPending}
              onCreate={handleCreateTransition}
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
  onToggleEnabled,
  toggling,
  roles,
}: {
  stage: Stage
  isLast: boolean
  onEdit: () => void
  onToggleEnabled: (next: boolean) => void
  toggling?: boolean
  roles: { id: string; roleName: string }[]
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
            </CardDescription>
          </div>

          <div className='flex items-center gap-3'>
            <div className='bg-background flex items-center gap-2 rounded-full border px-2 py-1'>
              <span className='text-muted-foreground text-xs'>
                {stage.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={!!stage.enabled}
                onCheckedChange={(v) => onToggleEnabled(v)}
                disabled={toggling}
                aria-label={stage.enabled ? 'Disable stage' : 'Enable stage'}
              />
              {toggling && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
            </div>

            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={onEdit}
              aria-label='Edit stage'
            >
              <Pencil className='h-4 w-4' />
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
  onCreate,
}: {
  stages: Stage[]
  transitions?: TransitionDto[]
  loading: boolean
  creating?: boolean
  onCreate: (payload: TransitionCreate) => Promise<void> | void
}) {
  const [fromStageId, setFromStageId] = useState('')
  const [toStageId, setToStageId] = useState('')
  const [trigger, setTrigger] = useState<TransitionTrigger | ''>('')

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

  const notEnoughStages = stages.length < 2

  const canCreate =
    !!fromStageId &&
    !!toStageId &&
    fromStageId !== toStageId &&
    !!trigger && // trigger is mandatory
    !notEnoughStages

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canCreate || !trigger) return

    const payload: TransitionCreate = {
      fromStageId: Number(fromStageId),
      toStageId: Number(toStageId),
      // Only allowed values from TRANSITION_TRIGGERS
      trigger,
    }

    await onCreate(payload)

    setFromStageId('')
    setToStageId('')
    setTrigger('')
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
                        `#${t.toStageId}`}
                    </Badge>
                    {t.trigger && (
                      <Badge
                        variant='secondary'
                        className='h-5 rounded-full px-2 text-[11px]'
                      >
                        Trigger: {t.trigger}
                      </Badge>
                    )}
                  </div>
                  {typeof t.autoTransition === 'boolean' && (
                    <span className='text-muted-foreground text-[11px]'>
                      {t.autoTransition ? 'Auto' : 'Manual'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Create transition form */}
        <form
          className='grid gap-3 text-xs md:grid-cols-[2fr,2fr,1.5fr,auto]'
          onSubmit={handleSubmit}
        >
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
              disabled={notEnoughStages}
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
              To stage
            </Label>
            <Select
              value={toStageId}
              onValueChange={(value) => setToStageId(value)}
              disabled={notEnoughStages}
            >
              <SelectTrigger id='toStage' className='h-8 text-xs'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
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
              disabled={notEnoughStages}
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

          <div className='flex items-end'>
            <Button
              type='submit'
              size='sm'
              className='w-full md:w-auto'
              disabled={!canCreate || creating}
            >
              {creating && (
                <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
              )}
              Add transition
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
