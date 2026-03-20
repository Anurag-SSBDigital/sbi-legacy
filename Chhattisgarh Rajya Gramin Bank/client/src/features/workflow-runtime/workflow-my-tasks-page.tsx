import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, RefreshCw, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import MainWrapper from '@/components/ui/main-wrapper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  listMyWorkflowTasks,
  type WorkflowTaskCard,
  type WorkflowTaskStatus,
} from './workflow-runtime-api'

const TASK_STATUSES: WorkflowTaskStatus[] = [
  'PENDING',
  'COMPLETED',
  'REJECTED',
  'SENT_BACK',
  'EXPIRED',
]

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

export default function WorkflowMyTasksPage() {
  const navigate = useNavigate()
  const [taskStatus, setTaskStatus] = useState<WorkflowTaskStatus>('PENDING')

  const tasksQuery = useQuery({
    queryKey: ['workflow-runtime', 'my-tasks', taskStatus],
    queryFn: () =>
      listMyWorkflowTasks({
        status: taskStatus,
        page: 0,
        size: 100,
      }),
    staleTime: 10 * 1000,
  })

  const handleOpenTask = (task: WorkflowTaskCard) => {
    const taskId = String(task.taskId)
    navigate({ to: '/workflow/tasks/$taskId', params: { taskId } })
  }

  return (
    <MainWrapper>
      <div className='space-y-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Workflow My Tasks
            </h1>
            <p className='text-muted-foreground text-sm'>
              Open a task and complete it on a dedicated task page.
            </p>
          </div>
          <Button
            variant='outline'
            onClick={() => tasksQuery.refetch()}
            disabled={tasksQuery.isFetching}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <ClipboardList className='h-4 w-4' />
                  My Workflow Tasks
                </CardTitle>
                <CardDescription>
                  Filter your queue and open any task in dedicated completion
                  UI.
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Select
                  value={taskStatus}
                  onValueChange={(next) =>
                    setTaskStatus(next as WorkflowTaskStatus)
                  }
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant='outline'>
                  {(tasksQuery.data?.content ?? []).length} task(s)
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksQuery.isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground text-center'
                      >
                        Loading tasks...
                      </TableCell>
                    </TableRow>
                  ) : (tasksQuery.data?.content?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground text-center'
                      >
                        No tasks found for selected status.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (tasksQuery.data?.content ?? []).map((task) => (
                      <TableRow key={task.taskId}>
                        <TableCell className='font-medium'>
                          {task.taskId}
                        </TableCell>
                        <TableCell className='max-w-[220px] truncate'>
                          {task.accountDetails?.displayName || '—'}
                        </TableCell>
                        <TableCell className='max-w-[280px] truncate'>
                          {task.accountDetails?.displayAccount || '—'}
                        </TableCell>
                        <TableCell>{task.stageName}</TableCell>
                        <TableCell>{formatDateTime(task.dueAt)}</TableCell>
                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            onClick={() => handleOpenTask(task)}
                          >
                            Open Task
                            <ArrowRight className='ml-2 h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainWrapper>
  )
}
