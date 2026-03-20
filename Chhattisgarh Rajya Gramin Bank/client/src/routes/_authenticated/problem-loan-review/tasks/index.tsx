import React, { useState } from 'react'
import { format } from 'date-fns'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { components } from '@/types/api/v1'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  LayoutDashboard,
  User,
} from 'lucide-react'
import { $api } from '@/lib/api'
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
import MainWrapper from '@/components/ui/main-wrapper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// --- Type Definitions ---

type UserTask = components['schemas']['UserTask']
type ActivityHistory = components['schemas']['ActivityHistory']
type UrgentItem = components['schemas']['UrgentItem']
type DashboardStats = components['schemas']['DashboardStats']

// --- Component Props Interfaces ---

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description: string
  trend?: 'critical' | 'normal'
}

interface TaskActionDialogProps {
  isOpen: boolean
  onClose: () => void
  task: UserTask | null
  onConfirm: () => void
}

interface PriorityBadgeProps {
  priority?: string
}

// --- Route Definition ---
export const Route = createFileRoute(
  '/_authenticated/problem-loan-review/tasks/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  // Filter state type: string or undefined
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(
    undefined
  )
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const navigate = useNavigate()

  // 1. Fetch Dashboard Stats
  const { data: dashboard, isLoading: dashboardLoading } = $api.useQuery(
    'get',
    '/api/problemloanreview/user/dashboard',
    {
      params: { header: { Authorization: '' } },
    }
  )

  // 2. Fetch Tasks (Wired to filter state)
  const { data: tasksData, isLoading: tasksLoading } = $api.useQuery(
    'get',
    '/api/problemloanreview/user/tasks',
    {
      params: {
        query: {
          status: undefined,
          priority: priorityFilter,
        },
        header: { Authorization: '' },
      },
    }
  )

  const handleProcessTask = (task: UserTask) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleConfirmAction = () => {
    setIsDialogOpen(false)

    if (selectedTask?.taskId) {
      navigate({
        to: '/problem-loan-review/tasks/$taskId',
        params: { taskId: selectedTask.taskId.toString() },
      })
    }
  }

  if (dashboardLoading || tasksLoading) {
    return <DashboardSkeleton />
  }

  // Explicitly cast or access properties safely
  const stats: DashboardStats | undefined = dashboard?.stats
  const taskList: UserTask[] = tasksData?.tasks || []
  const urgentItems: UrgentItem[] = dashboard?.urgentItems || []
  const recentActivities: ActivityHistory[] = dashboard?.recentActivities || []

  return (
    <MainWrapper>
      <div className='bg-muted/10 flex h-full flex-col space-y-2 p-2'>
        {/* Page Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>
              Problem Loan Review Tasks
            </h2>
            <p className='text-muted-foreground'>
              Manage your assigned cases, overdue items, and daily workflow.
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <Calendar className='mr-2 h-4 w-4' />
              {format(new Date(), 'MMM dd, yyyy')}
            </Button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className='mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Tasks'
            value={stats?.totalTasks || 0}
            icon={<LayoutDashboard className='text-muted-foreground h-4 w-4' />}
            description='Assigned to you'
          />
          <StatCard
            title='Overdue'
            value={stats?.overdueTasks || 0}
            icon={<AlertCircle className='text-destructive h-4 w-4' />}
            description='Requires immediate attention'
            trend='critical'
          />
          <StatCard
            title='High Priority'
            value={stats?.highPriorityTasks || 0}
            icon={<Clock className='h-4 w-4 text-orange-500' />}
            description='Tasks with low SLA'
          />
          <StatCard
            title='Completed Today'
            value={stats?.completedToday || 0}
            icon={<CheckCircle2 className='h-4 w-4 text-green-500' />}
            description='Keep up the momentum'
          />
        </div>

        {/* Main Content: Task List & Urgent Items */}
        <div className='mt-4 grid gap-6 md:grid-cols-7 lg:grid-cols-7'>
          {/* Left Column: Task Table (Span 5) */}
          <Card className='md:col-span-5'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>
                  You have {tasksData?.totalCount} active tasks remaining.
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                {/* Filter Dropdown */}
                <Select
                  value={priorityFilter}
                  onValueChange={(v: string) =>
                    setPriorityFilter(v === 'ALL' ? undefined : v)
                  }
                >
                  <SelectTrigger className='w-[140px]'>
                    <Filter className='mr-2 h-4 w-4' />
                    <SelectValue placeholder='Filter Priority' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>All Priorities</SelectItem>
                    <SelectItem value='High'>High</SelectItem>
                    <SelectItem value='Medium'>Medium</SelectItem>
                    <SelectItem value='Low'>Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Details</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>SLA / Due</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-muted-foreground h-24 text-center'
                      >
                        No tasks found for the current criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    taskList.map((task) => (
                      <TableRow key={task.taskId} className='group'>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span className='font-medium'>
                              {task.customerName}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              Acct: {task.accountNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <span className='text-sm'>{task.stageName}</span>
                            <span className='text-muted-foreground max-w-[150px] truncate text-xs'>
                              {task.taskDescription}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span
                              className={`text-sm font-medium ${task.overdue ? `text-destructive` : ``}`}
                            >
                              {task.daysRemaining} days left
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {task.dueDate
                                ? format(new Date(task.dueDate), 'MMM dd')
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            variant={task.overdue ? 'destructive' : 'default'}
                            onClick={() => handleProcessTask(task)}
                          >
                            Process
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right Column: Urgent & Recent (Span 2) */}
          <div className='flex flex-col gap-4 md:col-span-2'>
            {/* Urgent Items */}
            <Card className='border-l-destructive/80 border-l-4'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-destructive flex items-center gap-2 text-lg'>
                  <AlertCircle className='h-5 w-5' />
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4'>
                {urgentItems.length > 0 ? (
                  urgentItems.map((item, idx) => (
                    <div
                      key={item.taskId || idx}
                      className='flex items-start justify-between border-b pb-2 last:border-0 last:pb-0'
                    >
                      <div className='space-y-1'>
                        <p className='text-sm leading-none font-medium'>
                          {item.customerName}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {item.stageName}
                        </p>
                      </div>
                      <div className='text-destructive text-xs font-bold'>
                        Overdue
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    No urgent items pending.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentActivities.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className='flex items-start gap-3'>
                      <div className='bg-primary/10 mt-1 rounded-full p-1'>
                        <User className='text-primary h-3 w-3' />
                      </div>
                      <div className='space-y-1'>
                        <p className='text-sm leading-none font-medium'>
                          {activity.description}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {activity.activityDate
                            ? format(new Date(activity.activityDate), 'h:mm a')
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Completion Dialog */}
        <TaskActionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          task={selectedTask}
          onConfirm={handleConfirmAction}
        />
      </div>
    </MainWrapper>
  )
}

// --- Helper Components ---

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${trend === `critical` && Number(value) > 0 ? `text-destructive` : ``}`}
        >
          {value}
        </div>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </CardContent>
    </Card>
  )
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  // Defines valid variants for the Badge component
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  let className = ''

  switch (priority?.toLowerCase()) {
    case 'high':
      variant = 'destructive'
      break
    case 'medium':
      className =
        'bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200'
      variant = 'outline'
      break
    case 'low':
      variant = 'secondary'
      break
    default:
      variant = 'outline'
  }

  return (
    <Badge variant={variant} className={className}>
      {priority || 'Normal'}
    </Badge>
  )
}

function TaskActionDialog({
  isOpen,
  onClose,
  task,
  onConfirm,
}: TaskActionDialogProps) {
  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Process Task</DialogTitle>
          <DialogDescription>
            Complete the actions required for this Problem Loan Review stage.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <span className='text-right text-sm font-medium'>Customer</span>
            <span className='col-span-3 text-sm'>{task.customerName}</span>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <span className='text-right text-sm font-medium'>Task</span>
            <span className='col-span-3 text-sm'>{task.taskDescription}</span>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <span className='text-right text-sm font-medium'>Required</span>
            <div className='col-span-3 flex flex-wrap gap-2'>
              {task.requiredActions?.map((action, i) => (
                <Badge key={i} variant='outline'>
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{task.stageName}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6 p-8'>
      <div className='flex justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-8 w-24' />
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-32 w-full' />
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-7'>
        <Skeleton className='h-[400px] md:col-span-5' />
        <div className='space-y-4 md:col-span-2'>
          <Skeleton className='h-[180px]' />
          <Skeleton className='h-[200px]' />
        </div>
      </div>
    </div>
  )
}
