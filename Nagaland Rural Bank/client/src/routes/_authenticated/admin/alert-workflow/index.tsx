import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Link, createFileRoute } from '@tanstack/react-router'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
/* 👉 NEW ─ shadcn/ui Dialog imports */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'

/* ------------------------------------------------------------------
 * Types
 * ----------------------------------------------------------------*/
type AlertType = 'EWS' | 'FRM'

type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW'

interface FormValues {
  alertType: AlertType
  name: string
  description: string
  severityLevel: SeverityLevel
}

/* ------------------------------------------------------------------
 * Route
 * ----------------------------------------------------------------*/
export const Route = createFileRoute('/_authenticated/admin/alert-workflow/')({
  component: RouteComponent,
  validateSearch: z.object({
    alertType: z.enum(['EWS', 'FRM']).catch('EWS'),
    q: z.string().optional().catch(''),
    sort: z
      .enum(['name-asc', 'name-desc', 'createdAt-asc', 'createdAt-desc'])
      .catch('name-asc'),
  }).parse,
})

function RouteComponent() {
  /* --------------------------------------------------------------
   * local state (non-form)
   * ------------------------------------------------------------*/
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const alertType: AlertType = search.alertType
  const searchTerm = search.q ?? ''
  const sortOrder = search.sort
  const [openCreate, setOpenCreate] = useState(false)
  const [confirmWorkflowId, setConfirmWorkflowId] = useState<number | null>(
    null
  )

  /* --------------------------------------------------------------
   * react-hook-form for the create-workflow dialog
   * ------------------------------------------------------------*/
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      alertType,
      name: '',
      description: '',
      severityLevel: 'LOW',
    },
  })

  useEffect(() => {
    setValue('alertType', alertType)
  }, [alertType, setValue])

  /* --------------------------------------------------------------
   * queries & mutations
   * ------------------------------------------------------------*/
  const {
    data: workflows,
    isLoading,
    error,
    refetch,
  } = $api.useQuery('get', '/AlertWorkflows/{alertType}/get', {
    params: { path: { alertType }, header: { Authorization: '' } },
  })

  const createWorkflowMutation = $api.useMutation(
    'post',
    '/AlertWorkflows/create',
    {
      onSuccess() {
        refetch()
        reset()
        setOpenCreate(false)
      },
      onError(err) {
        toastError(err)
      },
    }
  )

  const activateWorkflowMutation = $api.useMutation(
    'put',
    '/AlertWorkflows/{workflowId}/activate',
    {
      onSuccess() {
        refetch()
        setConfirmWorkflowId(null)
      },
    }
  )

  /* --------------------------------------------------------------
   * helpers
   * ------------------------------------------------------------*/
  const filteredAndSorted = useMemo(() => {
    if (!workflows) return []

    const filtered = workflows.filter((w) => {
      const q = searchTerm.toLowerCase()
      return (
        w.name?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.alertType?.toLowerCase().includes(q)
      )
    })

    const [key, order] = sortOrder.split('-')
    const sorted = [...filtered].sort((a, b) => {
      const valA = a[key as keyof typeof a]
      const valB = b[key as keyof typeof b]
      if (valA == null || valB == null) return 0

      let cmp = 0
      if (typeof valA === 'string' && typeof valB === 'string')
        cmp = valA.localeCompare(valB)
      else if (typeof valA === 'number' && typeof valB === 'number')
        cmp = valA - valB
      else if (
        (valA as unknown) instanceof Date &&
        (valB as unknown) instanceof Date
      )
        cmp =
          (valA as unknown as Date).getTime() -
          (valB as unknown as Date).getTime()

      return order === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [workflows, searchTerm, sortOrder])

  const selectedWorkflow = useMemo(
    () => workflows?.find((w) => w.id === confirmWorkflowId) ?? null,
    [workflows, confirmWorkflowId]
  )

  /* --------------------------------------------------------------
   * form submit handler
   * ------------------------------------------------------------*/
  const onSubmit = handleSubmit((values) => {
    createWorkflowMutation.mutate({
      body: {
        alertType: values.alertType,
        name: values.name.trim(),
        severityLevel: values.severityLevel,
        description: values.description.trim() || undefined,
        active: false,
      },
      params: { header: { Authorization: '' } },
    })
  })

  /* --------------------------------------------------------------
   * loading & error states
   * ------------------------------------------------------------*/
  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950'>
        <div className='text-gray-500 dark:text-gray-400'>
          Loading workflows…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-red-50 dark:bg-red-950'>
        <div className='text-red-600 dark:text-red-300'>
          Error fetching data. Please try again later.
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------------
   * main render
   * ------------------------------------------------------------*/
  return (
    <>
      <div className='min-h-screen w-full'>
        <div className='mx-auto max-w-7xl'>
          {/* ---------- Header ---------- */}
          <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
                Alert Workflows
              </h1>
              <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
                Browse, search, and manage your alert configurations.
              </p>
            </div>

            {/* Create Workflow button */}
            <Dialog
              open={openCreate}
              onOpenChange={(open) => {
                setOpenCreate(open)
                if (!open) reset() // clear form when closing
              }}
            >
              <DialogTrigger asChild>
                <Button size='sm'>Create Workflow</Button>
              </DialogTrigger>

              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>New Workflow</DialogTitle>
                  <DialogDescription>
                    Fill in the details and submit to create a new workflow.
                  </DialogDescription>
                </DialogHeader>

                {/* ---------------- Form (react-hook-form) ---------------- */}
                <form onSubmit={onSubmit} className='space-y-4'>
                  {/* Alert Type */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium' htmlFor='alert-type'>
                      Alert Type
                    </label>
                    <Select
                      value={watch('alertType')}
                      onValueChange={(val: AlertType) =>
                        setValue('alertType', val)
                      }
                    >
                      <SelectTrigger id='alert-type'>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='EWS'>EWS</SelectItem>
                        {/* <SelectItem value='FRM'>FRM</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Name */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium' htmlFor='wf-name'>
                      Name
                    </label>
                    <Input
                      id='wf-name'
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && (
                      <p className='text-sm text-red-600'>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium' htmlFor='wf-desc'>
                      Description (optional)
                    </label>
                    <Input id='wf-desc' {...register('description')} />
                  </div>

                  <div className='space-y-2'>
                    <label
                      className='text-sm font-medium'
                      htmlFor='severity-level'
                    >
                      Severity Level
                    </label>
                    <Select
                      value={watch('severityLevel')}
                      onValueChange={(val: SeverityLevel) =>
                        setValue('severityLevel', val)
                      }
                    >
                      <SelectTrigger id='severity-level'>
                        <SelectValue placeholder='Select severity' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='HIGH'>High</SelectItem>
                        <SelectItem value='MEDIUM'>Medium</SelectItem>
                        <SelectItem value='LOW'>Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.severityLevel && (
                      <p className='text-sm text-red-600'>
                        {errors.severityLevel.message}
                      </p>
                    )}
                  </div>

                  <DialogFooter className='pt-4'>
                    <Button
                      type='submit'
                      disabled={
                        isSubmitting || createWorkflowMutation.isPending
                      }
                    >
                      {createWorkflowMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          {/* ---------- Controls ---------- */}
          <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <ToggleGroup
                type='single'
                value={alertType}
                onValueChange={(v: AlertType) => {
                  if (v)
                    navigate({ search: (prev) => ({ ...prev, alertType: v }) })
                }}
              >
                <ToggleGroupItem value='EWS'>EWS</ToggleGroupItem>
                {/* <ToggleGroupItem value='FRM'>FRM</ToggleGroupItem> */}
              </ToggleGroup>

              <div className='relative w-full sm:max-w-xs'>
                <svg
                  className='absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <circle cx='11' cy='11' r='8' />
                  <line x1='21' y1='21' x2='16.65' y2='16.65' />
                </svg>
                <Input
                  placeholder='Search workflows…'
                  className='pl-10'
                  value={searchTerm}
                  onChange={(e) =>
                    navigate({
                      search: (prev) => ({ ...prev, q: e.target.value }),
                    })
                  }
                />
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <label
                htmlFor='sort-select'
                className='text-sm font-medium text-gray-700 dark:text-gray-300'
              >
                Sort by:
              </label>
              <Select
                value={sortOrder}
                onValueChange={(val) =>
                  navigate({
                    search: (prev) => ({ ...prev, sort: val as 'name-asc' }),
                  })
                }
              >
                <SelectTrigger id='sort-select' className='w-36'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name-asc'>Name (A-Z)</SelectItem>
                  <SelectItem value='name-desc'>Name (Z-A)</SelectItem>
                  <SelectItem value='createdAt-desc'>Newest</SelectItem>
                  <SelectItem value='createdAt-asc'>Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ---------- Workflow Grid ---------- */}
          {filteredAndSorted.length ? (
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredAndSorted.map((item) => (
                <Card
                  key={item.id}
                  className='flex flex-col justify-between rounded-xl shadow-md transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800'
                >
                  {/* top section */}
                  <div>
                    <CardHeader className='pb-4'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <CardTitle className='text-primary text-xl font-semibold tracking-tight'>
                            {item.name}
                          </CardTitle>
                          <CardDescription className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                            Type:{' '}
                            <span className='font-semibold'>
                              {item.alertType}
                            </span>
                          </CardDescription>
                        </div>

                        {/* Active badge or activation switch */}
                        {item.isActive ? (
                          <Badge className='h-fit shrink-0 rounded-full bg-green-500 px-3 py-1 font-medium text-white'>
                            Active
                          </Badge>
                        ) : (
                          <div className='flex flex-col items-center gap-1'>
                            <Switch
                              checked={false}
                              disabled={activateWorkflowMutation.isPending}
                              onCheckedChange={() =>
                                setConfirmWorkflowId(Number(item.id))
                              }
                              className='relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors focus:outline-none data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300'
                            >
                              <span className='pointer-events-none inline-block h-5 w-5 translate-x-1 transform rounded-full bg-white shadow ring-0 transition-transform data-[state=checked]:translate-x-5' />
                            </Switch>
                            <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                              Inactive
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className='pb-4'>
                      <p className='mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
                        {item.description || 'No description provided'}
                      </p>
                      <div className='space-y-1 text-xs text-gray-500 dark:text-gray-400'>
                        <p className='flex items-center gap-2'>
                          <span className='font-medium'>Severity:</span>
                          <Badge
                            className={
                              item.severityLevel === 'HIGH'
                                ? 'bg-red-500 text-white'
                                : item.severityLevel === 'MEDIUM'
                                  ? 'bg-yellow-500 text-white'
                                  : item.severityLevel === 'LOW'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-500 text-white'
                            }
                          >
                            {item.severityLevel || 'Not specified'}
                          </Badge>
                        </p>
                        <p>
                          <span className='font-medium'>Created:</span>{' '}
                          {new Date(item.createdAt || '').toLocaleDateString()}
                        </p>
                        <p>
                          <span className='font-medium'>Last Updated:</span>{' '}
                          {new Date(item.updatedAt || '').toLocaleDateString()}
                        </p>
                        <p>
                          <span className='font-medium'>By:</span>{' '}
                          {item.createdBy}
                        </p>
                      </div>
                    </CardContent>
                  </div>

                  {/* footer */}
                  <CardFooter className='flex justify-end pt-4'>
                    <Link
                      to='/admin/alert-workflow/$alertType/$workflowId/stages'
                      params={{ workflowId: item.id ?? 0, alertType }}
                    >
                      <Button
                        variant='outline'
                        className='hover:bg-primary dark:hover:bg-primary transition-colors duration-200 hover:text-white dark:hover:text-white'
                      >
                        View Stages
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-24 text-center dark:border-gray-700'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-gray-50'>
                No Workflows Found
              </h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------
       * Confirm Activate Dialog (global)
       * ----------------------------------------------------------*/}
      <Dialog
        open={confirmWorkflowId !== null}
        onOpenChange={(open) => !open && setConfirmWorkflowId(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Activate Workflow</DialogTitle>
            <DialogDescription>
              {selectedWorkflow ? (
                <>
                  Are you sure you want to activate{' '}
                  <strong>{selectedWorkflow.name}</strong> (
                  {selectedWorkflow.alertType})?
                </>
              ) : (
                'Are you sure you want to activate this workflow?'
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmWorkflowId(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={activateWorkflowMutation.isPending}
              onClick={() =>
                activateWorkflowMutation.mutate({
                  params: {
                    path: { workflowId: Number(confirmWorkflowId) },
                    header: { Authorization: '' },
                  },
                })
              }
            >
              {activateWorkflowMutation.isPending ? 'Activating…' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
