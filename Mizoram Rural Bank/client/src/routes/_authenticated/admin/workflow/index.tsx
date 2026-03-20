import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { paths, components } from '@/types/api/v1.js'
import {
  Plus,
  RefreshCw,
  Loader2,
  Workflow,
  // Added for title
  ListTree,
  // Added for action button
  Network, // Added for empty state
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import PaginatedTable, {
  type PaginatedTableColumn,
} from '@/components/paginated-table'

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
      /^[a-z0-9]([a-z0-9-_]*[a-z0-9])?$/,
      'Use lowercase letters, numbers, dashes, underscores (must start/end with a letter/number)'
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

// ── Page Component ─────────────────────────────────────────────────────────

function RouteComponent() {
  const { data, isLoading, isError, error, refetch } = $api.useQuery(
    'get',
    '/api/wf/definitions'
  )

  const createMutation = $api.useMutation('post', '/api/wf/definitions')

  const editMutation = $api.useMutation('put', '/api/wf/definitions/{defId}')
  // request body
  // name?: string;
  // isActive?: boolean;
  //
  //

  const handleEditWorkflow = async (id: number, payload: EditPayload) => {
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

  const columns = useMemo<PaginatedTableColumn<WorkflowDefinition>[]>(() => {
    return [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'key', label: 'Key', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'version', label: 'Version', sortable: true },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        render: (val) => (
          <Badge variant={val ? 'default' : 'secondary'}>
            {val ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'isActive', // ⬅️ make this unique
        label: 'Actions',
        render: (_, row) => (
          <div className='flex gap-2'>
            <Button asChild variant='outline' size='sm'>
              <Link
                to='/admin/workflow/$defId/stages'
                params={{ defId: Number(row.id) }}
              >
                <ListTree className='mr-2 h-4 w-4' />
                Stages
              </Link>
            </Button>

            <EditWorkflowDialog
              workflow={row}
              onEdit={(values) => handleEditWorkflow(Number(row.id), values)}
              isEditing={editMutation.isPending}
            />
          </div>
        ),
      },
    ]
  }, [editMutation.isPending])

  const handleCreateWorkflow = async (payload: CreatePayload) => {
    try {
      await createMutation.mutateAsync({
        body: payload,
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

  const rows = (data ?? []) as WorkflowDefinition[]

  // ── Main Content ───────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Header row: Title + actions */}
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
          <Workflow className='h-6 w-6' />
          Workflow Definitions
        </h1>
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <CreateWorkflowDialog
            onCreate={handleCreateWorkflow}
            isCreating={createMutation.isPending}
          />
        </div>
      </div>

      {/* Table wrapped in Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Workflows</CardTitle>
          <CardDescription>
            Manage all workflow definitions and their stages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <PaginatedTable<WorkflowDefinition>
              data={rows}
              columns={columns}
              // Actions are now part of the columns array, so `renderActions` is removed
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
              <div className='mt-6'>
                <CreateWorkflowDialog
                  onCreate={handleCreateWorkflow}
                  isCreating={createMutation.isPending}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Create Dialog Component ────────────────────────────────────────────────

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
      await onCreate(values)
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
            reference workflows in code and must be lowercase and URL‑safe.
          </DialogDescription>
        </DialogHeader>

        <form className='grid gap-4 py-2' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <Label htmlFor='key'>Key</Label>
            <Input
              id='key'
              placeholder='e.g. account_closure'
              autoComplete='off'
              {...register('key')}
            />
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



type EditDialogProps = {
  workflow: WorkflowDefinition
  onEdit: (payload: EditPayload) => Promise<void>
  isEditing?: boolean
}

function EditWorkflowDialog({ workflow, onEdit, isEditing }: EditDialogProps) {
  const [open, setOpen] = useState(false)

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
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit workflow</DialogTitle>
          <DialogDescription>
            Update the display name and activation status for this workflow
            definition.
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
            <Input id='edit-name' autoComplete='off' {...register('name')} />
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
                  disabled={submitting}
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
            <Button type='submit' disabled={submitting}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
