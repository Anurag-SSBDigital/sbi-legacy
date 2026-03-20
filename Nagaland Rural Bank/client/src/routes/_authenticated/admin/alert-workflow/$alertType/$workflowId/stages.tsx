import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { paths } from '@/types/api/v1.js'
import { CheckCircle, FileWarning, Pencil, Plus, XCircle } from 'lucide-react'
// Added Pencil
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
// Removed DialogTrigger
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import StageDialog, {
  StageFormType,
} from '@/features/alerts/alert-workflow/stages/StageDiaog'

interface User {
  id?: string
  username?: string
  fullName?: string
  branchId?: string | null
  departmentId?: string | null
}

type Stage =
  paths['/AlertWorkflows/{workflowId}/stages/get']['get']['responses']['200']['content']['*/*'][0]

// -----------------------------------------------------------------------------
// Route definition
// -----------------------------------------------------------------------------
export const Route = createFileRoute(
  '/_authenticated/admin/alert-workflow/$alertType/$workflowId/stages'
)({
  component: RouteComponent,

  params: {
    parse: z.object({
      alertType: z.enum(['EWS', 'FRM']),
      workflowId: z.coerce.number().int().positive(),
    }).parse,
  },
})

function RouteComponent() {
  const { workflowId, alertType } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: stages = [] } = $api.useSuspenseQuery(
    'get',
    '/AlertWorkflows/{workflowId}/stages/get',
    {
      params: { path: { workflowId: Number(workflowId) } },
    }
  )

  const { data: workflows } = $api.useQuery(
    'get',
    '/AlertWorkflows/{alertType}/get',
    {
      params: { path: { alertType }, header: { Authorization: '' } },
    }
  )

  const createStageMutation = $api.useMutation(
    'post',
    '/AlertWorkflows/{workflowId}/stages/create'
  )

  const updateStageMutation = $api.useMutation(
    'put',
    '/AlertWorkflows/update/stages/{stageId}/details'
  )

  const { data: rolesResp } = $api.useQuery('get', '/roles/getAllRoles', {
    params: { header: { Authorization: '' } },
    staleTime: 5 * 60 * 1000,
  })
  const roles = rolesResp?.data ?? []

  const workflow = workflows?.find((wf) => String(wf.id) === String(workflowId))

  // ---------------------------------------------------------------------------
  // Dialog and Edit State Management
  // ---------------------------------------------------------------------------
  const [open, setOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)

  // Reset editing state when dialog closes
  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setEditingStage(null)
    }
  }

  // Handler to open the dialog for adding a new stage
  const handleAddClick = () => {
    setEditingStage(null)
    setOpen(true)
  }

  // Handler to open the dialog for editing an existing stage
  const handleEditClick = (stage: Stage) => {
    setEditingStage(stage)
    setOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Options – order, roles, users
  // ---------------------------------------------------------------------------
  const orderOptions = useMemo(() => {
    // In edit mode, the length is the same. In add mode, it's +1.
    const max = (stages?.length ?? 0) + (editingStage ? 0 : 1)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [stages, editingStage])

  const { data: usersResponse } = $api.useQuery('get', '/user/get/AllUsers', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
      },
    },
  }) as { data: { data?: User[] } | undefined }

  const filteredUsers = usersResponse?.data ?? []

  return (
    <>
      <div className='container space-y-6'>
        {/* Header with action button */}
        <header className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='v1-semibold text-2xl tracking-tight'>
              {workflow?.name || 'Alert Workflow'}
            </h1>
            {workflow?.description && (
              <p className='text-muted-foreground max-w-prose'>
                {workflow.description}
              </p>
            )}
          </div>

          {/* Top‑right add button */}
          <Button size='sm' className='gap-1' onClick={handleAddClick}>
            <Plus className='h-4 w-4' /> Add Stage
          </Button>
        </header>

        {/* Centralized Dialog for both Add and Edit */}
        {
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <StageDialog
              initialData={
                (editingStage as unknown as StageFormType) ?? undefined
              }
              isEditMode={!!editingStage} // Prop to control form behavior
              orderOptions={orderOptions}
              users={filteredUsers}
              onSubmit={(data) => {
                if (editingStage) {
                  // UPDATE logic
                  updateStageMutation.mutate(
                    {
                      params: {
                        path: { stageId: Number(editingStage.id) },
                        header: { Authorization: '' },
                      },
                      body: data as typeof data & { username: string },
                    },
                    {
                      onSuccess: () => {
                        queryClient.invalidateQueries({
                          queryKey: [
                            'get',
                            '/AlertWorkflows/{workflowId}/stages/get',
                          ],
                        })
                        handleOpenChange(false) // Close and reset dialog
                      },
                    }
                  )
                } else {
                  // CREATE logic
                  createStageMutation.mutate(
                    {
                      params: {
                        path: { workflowId: Number(workflowId) },
                        header: { Authorization: '' },
                      },
                      body: data as typeof data & { username: string },
                    },
                    {
                      onSuccess: () => {
                        queryClient.invalidateQueries({
                          queryKey: [
                            'get',
                            '/AlertWorkflows/{workflowId}/stages/get',
                          ],
                        })
                        handleOpenChange(false) // Close and reset dialog
                      },
                    }
                  )
                }
              }}
            />
          </Dialog>
        }

        {/* Body */}
        {!stages || stages.length === 0 ? (
          <Alert>
            <FileWarning className='h-4 w-4' />
            <AlertTitle>No stages defined</AlertTitle>
            <AlertDescription>
              This workflow does not have any stages yet. Please add a stage to
              get started.
            </AlertDescription>
            <div className='pt-4'>
              <Button size='sm' className='gap-1' onClick={handleAddClick}>
                <Plus className='h-4 w-4' /> Add Stage
              </Button>
            </div>
          </Alert>
        ) : (
          <ScrollArea className='h-[calc(100vh-12rem)] pr-4'>
            <div className='flex flex-col gap-8'>
              {stages.map((stage, index) => (
                <div key={stage.id} className='flex items-start gap-6'>
                  <div className='flex flex-col items-center'>
                    <Avatar>
                      <AvatarFallback>{stage.stageOrder}</AvatarFallback>
                    </Avatar>
                    {index < stages.length - 1 && (
                      <div className='bg-border h-20 w-px' />
                    )}
                  </div>

                  <Card className='w-full'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <CardTitle>{stage.name}</CardTitle>
                          <CardDescription>
                            <Badge variant='secondary'>{stage.stageType}</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='gap-1'
                          onClick={() => handleEditClick(stage)}
                        >
                          <Pencil className='h-4 w-4' /> Edit
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <InfoItem
                          label='Role'
                          value={
                            roles.find((r) => r.id === stage.roleId)?.roleName
                          }
                        />
                        <InfoItem label='Username' value={stage.username} />
                        <InfoItem
                          label='Time Limit'
                          value={`${stage.timeLimitDays} day${stage.timeLimitDays === 1 ? `` : `s`}`}
                        />
                        <InfoItem
                          label='Requires Documents'
                          value={
                            <div className='flex items-center gap-2'>
                              {stage.requiresDocuments ? (
                                <CheckCircle className='h-5 w-5 text-green-500' />
                              ) : (
                                <XCircle className='h-5 w-5 text-red-500' />
                              )}
                              <span>
                                {stage.requiresDocuments ? 'Yes' : 'No'}
                              </span>
                            </div>
                          }
                        />
                      </div>

                      <Separator />

                      <div className='text-muted-foreground grid grid-cols-2 gap-4 text-sm'>
                        <InfoItem
                          label='Created At'
                          value={new Date(stage.createdAt!).toLocaleString()}
                        />
                        <InfoItem
                          label='Updated At'
                          value={new Date(stage.updatedAt!).toLocaleString()}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  )
}

// -----------------------------------------------------------------------------
// Helper components
// -----------------------------------------------------------------------------
function InfoItem({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className='space-y-1'>
      <p className='text-muted-foreground text-xs font-medium uppercase'>
        {label}
      </p>
      <p className='text-sm'>{value || 'N/A'}</p>
    </div>
  )
}
