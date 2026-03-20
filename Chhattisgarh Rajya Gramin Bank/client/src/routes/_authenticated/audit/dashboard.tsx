import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  ClipboardList,
  Clock,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthStore } from '@/stores/authStore'
import { $api } from '@/lib/api'
import { neverToError } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MainWrapper from '@/components/ui/main-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip } from '@/components/ui/tooltip'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table'
import {
  DateCell,
  CurrencyCell,
  StatusCell,
  SemiBoldCell,
  StockAuditActionsCell,
  AccountNoCell,
} from '@/components/table/cells'
import { DashboardResponse } from '@/features/audit/types'
import BranchSelector from '@/features/dashboard/components/branch-selector'

/* ---------- helpers ---------- */
function useIsSmall() {
  const [isSmall, setSmall] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)')
    const onChange = () => setSmall(m.matches)
    onChange()
    m.addEventListener?.('change', onChange)
    return () => m.removeEventListener?.('change', onChange)
  }, [])
  return isSmall
}

function useIsDark() {
  const [isDark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const update = () => setDark(root.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

function StatCard({
  title,
  value,
  icon: Icon,
  helper,
  tone = 'primary',
}: {
  title: string
  value: number
  // oxlint-disable-next-line no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  helper?: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const toneVar =
    tone === 'success'
      ? 'var(--color-chart-4)' // green-ish
      : tone === 'warning'
        ? 'var(--color-chart-2)' // amber-ish
        : tone === 'danger'
          ? 'var(--color-chart-1)' // red-ish
          : 'var(--color-primary)' // default

  return (
    <Card
      className='relative overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md'
      style={{
        background: `
          linear-gradient(
            180deg,
            color-mix(in oklab, ${toneVar}, transparent 96%),
            var(--color-card)
          )
        `,
      }}
    >
      {/* thin top accent */}
      <div
        className='absolute inset-x-0 top-0 h-[2px]'
        style={{
          background: `color-mix(in oklab, ${toneVar}, transparent 55%)`,
        }}
      />

      {/* subtle inner glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-30 blur-3xl'
        style={{
          background: `color-mix(in oklab, ${toneVar}, transparent 85%)`,
        }}
      />

      <CardContent className='relative p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <div className='text-xs font-medium text-[var(--color-muted-foreground)]'>
              {title}
            </div>
            <div className='mt-1 text-4xl font-semibold tracking-tight'>
              {nf0.format(value)}
            </div>
            {helper && (
              <div className='mt-1 text-xs text-[var(--color-muted-foreground)]'>
                {helper}
              </div>
            )}
          </div>

          {/* icon with soft halo */}
          <div
            className='grid h-12 w-12 place-items-center rounded-2xl border shadow-sm'
            style={{
              background: `color-mix(in oklab, ${toneVar}, transparent 92%)`,
            }}
          >
            <Icon
              className='h-6 w-6'
              style={{ color: `color-mix(in oklab, ${toneVar}, black 20%)` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const [branchId, setBranchId] = useState<string | undefined>()
  const user = useAuthStore().auth.user
  const isSmall = useIsSmall()
  const isDark = useIsDark()

  const { data, isLoading, error } = $api.useQuery(
    'get',
    '/stockAudit/dashboard',
    {
      params: {
        header: { Authorization: '' },
        query: { branchId: branchId === 'all' ? undefined : branchId },
      },
    }
  )

  const dashboardData = (data as unknown as DashboardResponse)?.data

  const allAssignments = useMemo(() => {
    if (!dashboardData?.auditorAssignments) return []
    return dashboardData.auditorAssignments.flatMap((auditor) =>
      auditor.assignments.map((a) => ({
        ...a,
        assignedAuditorUsername:
          a.assignedAuditorUsername ?? auditor.auditorUsername,
      }))
    )
  }, [dashboardData])

  const tableColumns = useMemo<
    PaginatedTableProps<(typeof allAssignments)[0]>['columns']
  >(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      {
        key: 'accountNo',
        label: 'Account No.',
        sortable: true,
        render: (v) => <AccountNoCell value={v} />,
      },
      { key: 'auditorName', label: 'Client Auditor', sortable: true },
      {
        key: 'assignedAuditorUsername',
        label: 'Assigned To',
        sortable: true,
        render: (v) => <SemiBoldCell value={v} />,
      },
      { key: 'facilityType', label: 'Facility Type', sortable: true },
      { key: 'stockLocation', label: 'Location', sortable: true },
      {
        key: 'sanctionLimit',
        label: 'Sanction Limit',
        sortable: true,
        render: (v) => <CurrencyCell value={`${v}`} />,
      },
      {
        key: 'deadline',
        label: 'Deadline',
        sortable: true,
        render: (v) => <DateCell value={`${v}`} />,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (v) => <StatusCell value={`${v}`} />,
      },
      {
        key: 'status',
        label: 'Actions',
        render: (_, row) => <StockAuditActionsCell row={row} />,
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <MainWrapper>
        <Skeleton className='mb-6 h-8 w-64' />
      </MainWrapper>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='rounded-2xl border bg-[var(--color-card)] p-8 shadow-xl'>
          <AlertTriangle className='mx-auto mb-4 h-12 w-12 opacity-70' />
          <p className='text-center text-sm text-[var(--color-muted-foreground)]'>
            {error ? neverToError(error) : 'Failed to load dashboard'}
          </p>
        </div>
      </div>
    )
  }

  const { statusCounts, auditorAssignments } = dashboardData
  const totalAudits = Object.values(statusCounts).reduce((s, v) => s + v, 0)

  const statusChartData = Object.entries(statusCounts).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(),
    value: v,
  }))

  const auditorChartData = auditorAssignments.map((a) => ({
    name: a.auditorUsername,
    assignments: a.assignmentCount,
  }))

  return (
    <MainWrapper
      extra={
        user?.branchId ? null : (
          <BranchSelector value={branchId} setValue={setBranchId} />
        )
      }
    >
      {/* 🌫️ SUBTLE BACKGROUND EFFECTS */}
      <div className='pointer-events-none fixed inset-0 -z-10 overflow-hidden'>
        <div
          className='absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px] dark:opacity-25'
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--color-primary), transparent 80%), transparent 70%)',
          }}
        />
        <div
          className='absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px] dark:opacity-25'
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--color-chart-2), transparent 82%), transparent 70%)',
          }}
        />
        <div
          className='absolute inset-0 opacity-[0.035] dark:opacity-[0.025]'
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27%3E%3Cg fill=%27%23000%27 fill-opacity=%270.35%27%3E%3Ccircle cx=%271%27 cy=%271%27 r=%271%27/%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* HEADER */}
      <header className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Stock Audit Dashboard
        </h1>
      </header>

      {/* STATS */}
      <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Audits'
          value={totalAudits}
          icon={ClipboardList}
          tone='primary'
        />

        <StatCard
          title='Completed'
          value={statusCounts.COMPLETED}
          icon={CheckCircle}
          tone='success'
        />

        <StatCard
          title='In Progress'
          value={statusCounts.STARTED}
          icon={Clock}
          tone='warning'
        />

        <StatCard
          title='Pending'
          value={statusCounts.PENDING}
          icon={AlertTriangle}
          tone='danger'
        />
      </div>

      {/* CHARTS */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='border bg-[var(--color-card)] shadow-sm lg:col-span-1'>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center gap-2'>
              <PieChartIcon className='h-5 w-5 opacity-70' />
              Audit Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey='value'
                    outerRadius={isSmall ? 88 : 104}
                  >
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className='border bg-[var(--color-card)] shadow-sm lg:col-span-2'>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center gap-2'>
              <BarChart2 className='h-5 w-5 opacity-70' />
              Assignments per Auditor
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
              <ResponsiveContainer>
                <BarChart data={auditorChartData}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke={isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}
                  />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='assignments' radius={[8, 8, 0, 0]}>
                    {auditorChartData.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}

      <PaginatedTable
        columns={tableColumns}
        data={allAssignments}
        tableTitle='All Audit Assignments'
        initialRowsPerPage={10}
        emptyMessage='No audit assignments found.'
      />
    </MainWrapper>
  )
}

export const Route = createFileRoute('/_authenticated/audit/dashboard')({
  component: RouteComponent,
})

// import { useEffect, useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import {
//   AlertTriangle,
//   BarChart2,
//   CheckCircle,
//   ClipboardList,
//   Clock,
//   PieChart as PieChartIcon,
// } from 'lucide-react'
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Pie,
//   PieChart,
//   Tooltip as RechartsTooltip,
//   ResponsiveContainer,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api } from '@/lib/api.ts'
// import { neverToError } from '@/lib/utils.ts'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import { Skeleton } from '@/components/ui/skeleton.tsx'
// import PaginatedTable, { PaginatedTableProps } from '@/components/paginated-table.tsx'
// import {
//   DateCell,
//   CurrencyCell,
//   StatusCell,
//   SemiBoldCell,
//   StockAuditActionsCell,
//   AccountNoCell,
// } from '@/components/table/cells.ts'
// import { DashboardResponse } from '@/features/audit/types.ts'
// import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

// /* ---------- helpers: small screens + dark mode ---------- */
// function useIsSmall() {
//   const [isSmall, setSmall] = useState(false)
//   useEffect(() => {
//     const m = window.matchMedia('(max-width: 640px)')
//     const onChange = () => setSmall(m.matches)
//     onChange()
//     m.addEventListener?.('change', onChange)
//     return () => m.removeEventListener?.('change', onChange)
//   }, [])
//   return isSmall
// }

// function useIsDark() {
//   const [isDark, setDark] = useState(false)
//   useEffect(() => {
//     const root = document.documentElement
//     const update = () => setDark(root.classList.contains('dark'))
//     update()
//     const obs = new MutationObserver(update)
//     obs.observe(root, { attributes: true, attributeFilter: ['class'] })
//     return () => obs.disconnect()
//   }, [])
//   return isDark
// }

// const cx = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')

// const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

// function StatCard({
//   title,
//   value,
//   icon: Icon,
//   helper,
// }: {
//   title: string
//   value: number
//   icon: any
//   helper?: string
// }) {
//   return (
//     <Card className='group relative overflow-hidden border bg-[var(--color-card)] shadow-sm transition hover:shadow-md'>
//       {/* top hairline */}
//       <div className='absolute inset-x-0 top-0 h-[2px] bg-black/5 dark:bg-white/10' />
//       <CardContent className='p-5'>
//         <div className='flex items-start justify-between gap-4'>
//           <div className='min-w-0'>
//             <div className='text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]'>
//               {title}
//             </div>
//             <div className='mt-1 text-4xl font-semibold tracking-tight text-[var(--color-foreground)]'>
//               {nf0.format(value)}
//             </div>
//             {helper ? (
//               <div className='mt-1 text-xs text-[var(--color-muted-foreground)]'>
//                 {helper}
//               </div>
//             ) : null}
//           </div>

//           {/* neutral icon chip (no colored bg) */}
//           <div className='grid h-12 w-12 place-items-center rounded-2xl border bg-transparent shadow-sm transition group-hover:shadow'>
//             <Icon className='h-6 w-6 text-[var(--color-foreground)]/80' />
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// function RouteComponent() {
//   const [branchId, setBranchId] = useState<string | undefined>(undefined)
//   const user = useAuthStore().auth.user
//   const isSmall = useIsSmall()
//   const isDark = useIsDark()

//   const {
//     data: apiData,
//     isLoading,
//     error,
//   } = $api.useQuery('get', '/stockAudit/dashboard', {
//     params: {
//       header: { Authorization: '' },
//       query: { branchId: branchId === 'all' ? undefined : branchId },
//     },
//   })

//   const dashboardData = (apiData as unknown as DashboardResponse)?.data

//   // Flatten assignments (and make sure column key matches)
//   const allAssignments = useMemo(() => {
//     if (!dashboardData?.auditorAssignments) return []
//     return dashboardData.auditorAssignments.flatMap((auditor) =>
//       auditor.assignments.map((assignment) => ({
//         ...assignment,
//         // keep both keys so your table render won't be blank
//         auditorUsername: auditor.auditorUsername,
//         assignedAuditorUsername:
//           (assignment as any).assignedAuditorUsername ?? auditor.auditorUsername,
//       }))
//     )
//   }, [dashboardData])

//   const tableColumns = useMemo<
//     PaginatedTableProps<(typeof allAssignments)[0]>['columns']
//   >(
//     () => [
//       { key: 'id', label: 'ID', sortable: true },
//       {
//         key: 'accountNo',
//         label: 'Account No.',
//         sortable: true,
//         render: (value) => <AccountNoCell value={value} />,
//       },
//       { key: 'auditorName', label: 'Client Auditor', sortable: true },
//       {
//         key: 'assignedAuditorUsername',
//         label: 'Assigned To',
//         sortable: true,
//         render: (value) => <SemiBoldCell value={value} />,
//       },
//       { key: 'facilityType', label: 'Facility Type', sortable: true },
//       { key: 'stockLocation', label: 'Location', sortable: true },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         sortable: true,
//         render: (value) => <CurrencyCell value={`${value}`} />,
//       },
//       {
//         key: 'deadline',
//         label: 'Deadline',
//         sortable: true,
//         render: (value) => <DateCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Status',
//         sortable: true,
//         render: (value) => <StatusCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Actions',
//         render: (_, row) => <StockAuditActionsCell row={row} />,
//       },
//     ],
//     []
//   )

//   if (isLoading) {
//     return (
//       <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
//         <header className='mb-8'>
//           <Skeleton className='h-8 w-72 rounded-md' />
//           <Skeleton className='mt-2 h-4 w-96 rounded-md' />
//         </header>

//         <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div
//               key={i}
//               className='rounded-2xl border bg-[var(--color-card)] p-6 shadow-sm'
//             >
//               <div className='flex items-center gap-4'>
//                 <Skeleton className='h-12 w-12 rounded-2xl' />
//                 <div className='space-y-2'>
//                   <Skeleton className='h-4 w-28' />
//                   <Skeleton className='h-7 w-20' />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//           <Skeleton className='h-[320px] w-full rounded-2xl lg:col-span-1' />
//           <Skeleton className='h-[320px] w-full rounded-2xl lg:col-span-2' />
//         </div>

//         <div className='space-y-2'>
//           <Skeleton className='h-6 w-64' />
//           <div className='space-y-2 rounded-2xl border bg-[var(--color-card)] p-4 shadow-sm'>
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//           </div>
//         </div>
//       </MainWrapper>
//     )
//   }

//   if (error || !dashboardData) {
//     return (
//       <div className='flex min-h-[60vh] items-center justify-center p-4'>
//         <div className='max-w-xl rounded-2xl border bg-[var(--color-card)] p-8 text-center shadow-xl dark:border-white/10 dark:text-neutral-100'>
//           <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-[var(--color-foreground)]/80' />
//           <h2 className='mb-2 text-2xl font-semibold text-[var(--color-foreground)]'>
//             Something went wrong
//           </h2>
//           <p className='text-[var(--color-muted-foreground)]'>
//             We couldn&apos;t load the audit dashboard data. Please try again later.
//           </p>
//           {error && (
//             <p className='mt-2 text-sm text-[var(--color-muted-foreground)]'>
//               Error: {neverToError(error)}
//             </p>
//           )}
//         </div>
//       </div>
//     )
//   }

//   // Destructure
//   const { statusCounts, auditorAssignments } = dashboardData

//   const totalAudits = Object.values(statusCounts).reduce(
//     (sum, count) => sum + count,
//     0
//   )

//   // Charts data
//   const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
//     name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
//     value,
//   }))

//   const auditorChartData = auditorAssignments.map((auditor) => ({
//     name: auditor.auditorUsername,
//     assignments: auditor.assignmentCount,
//   }))

//   // NOTE: you asked "without adding colors in bg"
//   // We'll use CSS vars for chart fills (not card backgrounds).
//   const STATUS_COLORS: Record<string, string> = {
//     Completed: 'var(--color-chart-4)',
//     Started: 'var(--color-chart-2)',
//     Pending: 'var(--color-chart-1)',
//   }

//   const pieOuterRadius = isSmall ? 88 : 104
//   const barSize = isSmall ? 24 : 40
//   const xTickFont = isSmall ? 11 : 12
//   const yTickFont = isSmall ? 11 : 12

//   return (
//     <MainWrapper
//       extra={
//         user?.branchId ? null : (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         )
//       }
//     >
//       {/* Header */}
//       <header className='mb-8'>
//         <div className='flex flex-col gap-2'>
//           <h1 className='text-3xl font-bold tracking-tight text-[var(--color-foreground)]'>
//             Stock Audit Dashboard
//           </h1>
//           <p className='text-sm text-[var(--color-muted-foreground)]'>
//             Status overview, auditor workload, and assignment list.
//           </p>
//         </div>
//       </header>

//       {/* Summary Cards (no colored background) */}
//       <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//         <StatCard
//           title='Total Audits'
//           value={totalAudits}
//           icon={ClipboardList}
//           helper='All audits in scope'
//         />
//         <StatCard
//           title='Completed'
//           value={statusCounts.COMPLETED}
//           icon={CheckCircle}
//           helper='Closed successfully'
//         />
//         <StatCard
//           title='In Progress'
//           value={statusCounts.STARTED}
//           icon={Clock}
//           helper='Work ongoing'
//         />
//         <StatCard
//           title='Pending'
//           value={statusCounts.PENDING}
//           icon={AlertTriangle}
//           helper='Not started yet'
//         />
//       </div>

//       {/* Charts */}
//       <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//         {/* Pie */}
//         <Card className='lg:col-span-1 overflow-hidden border bg-[var(--color-card)] shadow-sm'>
//           <CardHeader className='border-b'>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <div className='grid h-9 w-9 place-items-center rounded-xl border bg-transparent shadow-sm'>
//                 <PieChartIcon className='h-5 w-5 text-[var(--color-foreground)]/80' />
//               </div>
//               Audit Status Distribution
//             </CardTitle>
//           </CardHeader>
//           <CardContent className='pt-4'>
//             <p className='mb-4 text-sm text-[var(--color-muted-foreground)]'>
//               Breakdown of all audits by current status.
//             </p>

//             <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie
//                     data={statusChartData}
//                     cx='50%'
//                     cy='50%'
//                     labelLine={false}
//                     outerRadius={pieOuterRadius}
//                     stroke='var(--color-card)'
//                     strokeWidth={2}
//                     dataKey='value'
//                   >
//                     {statusChartData.map((entry, index) => (
//                       <Cell
//                         key={`cell-status-${index}`}
//                         fill={STATUS_COLORS[entry.name] ?? 'var(--color-chart-3)'}
//                         style={{ filter: 'drop-shadow(0 1px 5px rgba(0,0,0,.12))' }}
//                       />
//                     ))}
//                   </Pie>

//                   <RechartsTooltip
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className='min-w-[140px] rounded-xl border bg-white px-3 py-2 text-sm shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100'>
//                           <div className='flex items-center justify-between gap-4'>
//                             <span className='font-medium'>{String(p.name ?? '')}</span>
//                             <span className='tabular-nums'>{val.toLocaleString()} Audits</span>
//                           </div>
//                         </div>
//                       )
//                     }}
//                   />
//                   <Legend iconType='circle' />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Bar */}
//         <Card className='lg:col-span-2 overflow-hidden border bg-[var(--color-card)] shadow-sm'>
//           <CardHeader className='border-b'>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <div className='grid h-9 w-9 place-items-center rounded-xl border bg-transparent shadow-sm'>
//                 <BarChart2 className='h-5 w-5 text-[var(--color-foreground)]/80' />
//               </div>
//               Assignments per Auditor
//             </CardTitle>
//           </CardHeader>

//           <CardContent className='pt-4'>
//             <p className='mb-4 text-sm text-[var(--color-muted-foreground)]'>
//               Number of active assignments for each auditor.
//             </p>

//             <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
//               <ResponsiveContainer>
//                 <BarChart
//                   data={auditorChartData}
//                   margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray='3 3'
//                     vertical={false}
//                     stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
//                   />
//                   <XAxis
//                     dataKey='name'
//                     tick={{
//                       fontSize: xTickFont,
//                       fill: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.78)',
//                     }}
//                     interval={0}
//                     tickMargin={8}
//                     angle={isSmall ? -25 : 0}
//                     height={isSmall ? 52 : 30}
//                   />
//                   <YAxis
//                     tick={{
//                       fontSize: yTickFont,
//                       fill: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.78)',
//                     }}
//                   />

//                   <RechartsTooltip
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className='min-w-[140px] rounded-xl border bg-white px-3 py-2 text-sm shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100'>
//                           <div className='flex items-center justify-between gap-4'>
//                             <span className='font-medium'>
//                               {String((p.payload as any)?.name ?? '')}
//                             </span>
//                             <span className='tabular-nums'>{val.toLocaleString()}</span>
//                           </div>
//                         </div>
//                       )
//                     }}
//                   />
//                   <Legend />

//                   <Bar
//                     dataKey='assignments'
//                     radius={[10, 10, 0, 0]}
//                     barSize={barSize}
//                     name='Assignments'
//                   >
//                     {auditorChartData.map((_r, index) => (
//                       <Cell
//                         key={`cell-auditor-${index}`}
//                         fill={`var(--chart-${(index % 5) + 1})`}
//                         style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.10))' }}
//                       />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Table */}
//       <div className='col-span-full'>
//         <Card className='overflow-hidden border bg-[var(--color-card)] shadow-sm'>
//           <CardHeader className='border-b'>
//             <CardTitle className='text-base font-semibold'>
//               All Audit Assignments
//             </CardTitle>
//           </CardHeader>
//           <CardContent className='pt-4'>
//             <PaginatedTable
//               columns={tableColumns}
//               tableTitle=''
//               data={allAssignments}
//               initialRowsPerPage={10}
//               emptyMessage='No audit assignments found.'
//             />
//           </CardContent>
//         </Card>
//       </div>
//     </MainWrapper>
//   )
// }

// export const Route = createFileRoute('/_authenticated/audit/dashboard')({
//   component: RouteComponent,
// })

// import { useEffect, useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import {
//   AlertTriangle,
//   BarChart2,
//   CheckCircle,
//   ClipboardList,
//   Clock,
//   PieChart as PieChartIcon,
// } from 'lucide-react'
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Pie,
//   PieChart,
//   Tooltip as RechartsTooltip,
//   ResponsiveContainer,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api } from '@/lib/api.ts'
// import { neverToError } from '@/lib/utils.ts'
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card.tsx'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import { Skeleton } from '@/components/ui/skeleton.tsx'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import {
//   DateCell,
//   CurrencyCell,
//   StatusCell,
//   SemiBoldCell,
//   StockAuditActionsCell,
//   AccountNoCell,
// } from '@/components/table/cells.ts'
// import { DashboardResponse } from '@/features/audit/types.ts'
// import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

// /* ---------- helpers: detect dark + small screens (no layout impact) ---------- */
// function useIsSmall() {
//   const [isSmall, setSmall] = useState(false)
//   useEffect(() => {
//     const m = window.matchMedia('(max-width: 640px)')
//     const onChange = () => setSmall(m.matches)
//     onChange()
//     m.addEventListener?.('change', onChange)
//     return () => m.removeEventListener?.('change', onChange)
//   }, [])
//   return isSmall
// }

// function useIsDark() {
//   const [isDark, setDark] = useState(false)
//   useEffect(() => {
//     const root = document.documentElement
//     const update = () => setDark(root.classList.contains('dark'))
//     update()
//     const obs = new MutationObserver(update)
//     obs.observe(root, { attributes: true, attributeFilter: ['class'] })
//     return () => obs.disconnect()
//   }, [])
//   return isDark
// }

// function RouteComponent() {
//   const [branchId, setBranchId] = useState<string | undefined>(undefined)
//   const user = useAuthStore().auth.user
//   const isSmall = useIsSmall()
//   const isDark = useIsDark()

//   const {
//     data: apiData,
//     isLoading,
//     error,
//   } = $api.useQuery('get', '/stockAudit/dashboard', {
//     params: {
//       header: { Authorization: '' },
//       query: { branchId: branchId === 'all' ? undefined : branchId },
//     },
//   })

//   const dashboardData = (apiData as unknown as DashboardResponse)?.data

//   // Flatten assignments with auditorUsername
//   const allAssignments = useMemo(() => {
//     if (!dashboardData?.auditorAssignments) return []
//     return dashboardData.auditorAssignments.flatMap((auditor) =>
//       auditor.assignments.map((assignment) => ({
//         ...assignment,
//         auditorUsername: auditor.auditorUsername,
//       }))
//     )
//   }, [dashboardData])

//   const tableColumns = useMemo<
//     PaginatedTableProps<(typeof allAssignments)[0]>['columns']
//   >(
//     () => [
//       { key: 'id', label: 'ID', sortable: true },
//       {
//         key: 'accountNo', label: 'Account No.', sortable: true,
//         render: (value) => <AccountNoCell value={value} />,
//       },
//       { key: 'auditorName', label: 'Client Auditor', sortable: true },
//       {
//         key: 'assignedAuditorUsername',
//         label: 'Assigned To',
//         sortable: true,
//         render: (value) => <SemiBoldCell value={value} />,
//       },
//       { key: 'facilityType', label: 'Facility Type', sortable: true },
//       { key: 'stockLocation', label: 'Location', sortable: true },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         sortable: true,
//         render: (value) => <CurrencyCell value={`${value}`} />,
//       },
//       {
//         key: 'deadline',
//         label: 'Deadline',
//         sortable: true,
//         render: (value) => <DateCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Status',
//         sortable: true,
//         render: (value) => <StatusCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Actions',
//         render: (_, row) => <StockAuditActionsCell row={row} />,
//       },
//     ],
//     []
//   )

//   if (isLoading) {
//     return (
//       <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
//         <header className='mb-8'>
//           <Skeleton className='h-8 w-72 rounded-md' />
//         </header>

//         {/* Summary Skeletons */}
//         <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div
//               key={i}
//               className='flex items-center space-x-4 rounded-xl bg-gray-50 p-6 shadow dark:bg-white/5'
//             >
//               <Skeleton className='h-10 w-10 rounded-full' />
//               <div className='space-y-2'>
//                 <Skeleton className='h-4 w-24' />
//                 <Skeleton className='h-6 w-16' />
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Charts Skeleton */}
//         <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//           <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-1' />
//           <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-2' />
//         </div>

//         {/* Table Skeleton */}
//         <div className='space-y-2'>
//           <Skeleton className='h-6 w-64' />
//           <div className='space-y-2 rounded-xl bg-white p-4 shadow dark:bg-white/5'>
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//           </div>
//         </div>

//         <footer className='mt-12 text-center text-sm text-gray-500'>
//           <Skeleton className='mx-auto h-4 w-56' />
//         </footer>
//       </MainWrapper>
//     )
//   }

//   if (error || !dashboardData) {
//     return (
//       <div className='flex min-h-[60vh] items-center justify-center bg-red-50 p-4 dark:bg-red-950/10'>
//         <div className='rounded-lg bg-white p-8 text-center shadow-xl dark:bg-neutral-900 dark:text-neutral-100'>
//           <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-red-500' />
//           <h2 className='mb-2 text-2xl font-semibold text-red-700 dark:text-red-400'>
//             Oops! Something went wrong.
//           </h2>
//           <p className='text-gray-600 dark:text-gray-300'>
//             We couldn&apos;t load the audit dashboard data. Please try again
//             later.
//           </p>
//           {error && (
//             <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//               Error: {neverToError(error)}
//             </p>
//           )}
//         </div>
//       </div>
//     )
//   }

//   // Destructure data
//   const { statusCounts, auditorAssignments } = dashboardData
//   const totalAudits = Object.values(statusCounts).reduce(
//     (sum, count) => sum + count,
//     0
//   )

//   // Prepare chart data
//   const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
//     name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
//     value,
//   }))
//   const auditorChartData = auditorAssignments.map((auditor) => ({
//     name: auditor.auditorUsername,
//     assignments: auditor.assignmentCount,
//   }))

//   const STATUS_COLORS: Record<string, string> = {
//     Completed: '#34D399', // green-400
//     Started: '#FBBF24', // amber-400
//     Pending: '#F87171', // red-400
//   }

//   const AUDITOR_COLORS = [
//     '#60A5FA',
//     '#F472B6',
//     '#A78BFA',
//     '#FCD34D',
//     '#818CF8',
//     '#FB923C',
//   ]

//   // Mobile-friendly sizes (keeps desktop unchanged)
//   const pieOuterRadius = isSmall ? 88 : 100
//   const barSize = isSmall ? 24 : 40
//   const xTickFont = isSmall ? 11 : 12
//   const yTickFont = isSmall ? 11 : 12

//   // ─── Render Dashboard ──────────────────────────────────────────────────────

//   return (
//     <MainWrapper
//       extra={
//         user?.branchId ? null : (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         )
//       }
//     >
//       {/* Header */}
//       <header className='mb-8'>
//         <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-white'>
//           Stock Audit Dashboard
//         </h1>
//       </header>

//       {/* Summary Cards */}
//       <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//         {[
//           {
//             title: 'Total Audits',
//             value: totalAudits,
//             icon: ClipboardList,
//             color: 'text-indigo-500',
//             bgColor: 'bg-indigo-50',
//           },
//           {
//             title: 'Completed',
//             value: statusCounts.COMPLETED,
//             icon: CheckCircle,
//             color: 'text-green-500',
//             bgColor: 'bg-green-50',
//           },
//           {
//             title: 'In Progress',
//             value: statusCounts.STARTED,
//             icon: Clock,
//             color: 'text-yellow-500',
//             bgColor: 'bg-yellow-50',
//           },
//           {
//             title: 'Pending',
//             value: statusCounts.PENDING,
//             icon: AlertTriangle,
//             color: 'text-red-500',
//             bgColor: 'bg-red-50',
//           },
//         ].map((stat) => (
//           <Card
//             key={stat.title}
//             className={`${stat.bgColor} dark:border-white/10 dark:bg-white/5`}
//           >
//             <CardContent className='flex items-center space-x-4 p-6'>
//               <div
//                 className={`rounded-full bg-white p-3 ${stat.color} dark:bg-white/10`}
//               >
//                 <stat.icon className='h-7 w-7' />
//               </div>
//               <div>
//                 <p className='text-sm font-medium text-gray-500 dark:text-gray-300'>
//                   {stat.title}
//                 </p>
//                 <p
//                   className={`text-3xl font-semibold ${stat.color} dark:text-white`}
//                 >
//                   {stat.value}
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Charts Section */}
//       <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//         {/* Status Distribution Pie Chart Card */}
//         <Card className='lg:col-span-1'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <PieChartIcon className='h-5 w-5 text-indigo-600' />
//               Audit Status Distribution
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className='mb-4 text-sm text-gray-500 dark:text-gray-300'>
//               Breakdown of all audits by current status.
//             </p>
//             <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie
//                     data={statusChartData}
//                     cx='50%'
//                     cy='50%'
//                     labelLine={false}
//                     outerRadius={pieOuterRadius}
//                     fill='#8884d8'
//                     dataKey='value'
//                   >
//                     {statusChartData.map((entry, index) => (
//                       <Cell
//                         key={`cell-status-${index}`}
//                         fill={STATUS_COLORS[entry.name] ?? '#888888'}
//                       />
//                     ))}
//                   </Pie>

//                   {/* Dark-friendly tooltip */}
//                   <RechartsTooltip
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className='min-w-[140px] rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/30'>
//                           <div className='flex items-center justify-between gap-4'>
//                             <span className='font-medium'>
//                               {String(p.name ?? '')}
//                             </span>
//                             <span className='tabular-nums'>
//                               {val.toLocaleString()} Audits
//                             </span>
//                           </div>
//                         </div>
//                       )
//                     }}
//                   />
//                   <Legend iconType='circle' />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Assignments per Auditor Bar Chart Card */}
//         <Card className='lg:col-span-2'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <BarChart2 className='h-5 w-5 text-indigo-600' />
//               Assignments per Auditor
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className='mb-4 text-sm text-gray-500 dark:text-gray-300'>
//               Number of active assignments for each auditor.
//             </p>
//             <div style={{ width: '100%', height: isSmall ? 260 : 300 }}>
//               <ResponsiveContainer>
//                 <BarChart
//                   data={auditorChartData}
//                   margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray='3 3'
//                     vertical={false}
//                     stroke={isDark ? 'rgba(255,255,255,0.12)' : '#f3f4f6'}
//                   />
//                   <XAxis
//                     dataKey='name'
//                     tick={{
//                       fontSize: xTickFont,
//                       fill: isDark ? 'rgba(255,255,255,0.85)' : '#111827',
//                     }}
//                     interval={0}
//                     tickMargin={8}
//                     angle={isSmall ? -25 : 0}
//                     height={isSmall ? 50 : 30}
//                   />
//                   <YAxis
//                     tick={{
//                       fontSize: yTickFont,
//                       fill: isDark ? 'rgba(255,255,255,0.85)' : '#111827',
//                     }}
//                   />

//                   {/* Dark-friendly tooltip */}
//                   <RechartsTooltip
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className='min-w-[140px] rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/30'>
//                           <div className='flex items-center justify-between gap-4'>
//                             <span className='font-medium'>
//                               {String(p.payload?.name ?? '')}
//                             </span>
//                             <span className='tabular-nums'>
//                               {val.toLocaleString()}
//                             </span>
//                           </div>
//                         </div>
//                       )
//                     }}
//                   />
//                   <Legend />

//                   <Bar
//                     dataKey='assignments'
//                     radius={[6, 6, 0, 0]}
//                     barSize={barSize}
//                     name='Assignments'
//                   >
//                     {auditorChartData.map((_r, index) => (
//                       <Cell
//                         key={`cell-auditor-${index}`}
//                         fill={`var(--chart-${(index % AUDITOR_COLORS.length) + 1})`}
//                       />
//                     ))}
//                   </Bar>

//                   {/* (kept) gradients — not directly used, but harmless to retain */}
//                   <defs>
//                     {AUDITOR_COLORS.map((color, index) => (
//                       <linearGradient
//                         id={`color-${index}`}
//                         key={index}
//                         x1='0'
//                         y1='0'
//                         x2='0'
//                         y2='1'
//                       >
//                         <stop offset='0%' stopColor={color} stopOpacity={0.8} />
//                         <stop
//                           offset='100%'
//                           stopColor={color}
//                           stopOpacity={0.4}
//                         />
//                       </linearGradient>
//                     ))}
//                   </defs>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Detailed Assignments Table */}
//       <div className='col-span-full'>
//             <PaginatedTable
//               columns={tableColumns}
//               tableTitle='All Audit Assignments'
//               data={allAssignments}
//               initialRowsPerPage={10}
//               emptyMessage='No audit assignments found.'
//             />
//       </div>
//     </MainWrapper>
//   )
// }

// export const Route = createFileRoute('/_authenticated/audit/dashboard')({
//   component: RouteComponent,
// })

// import { useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import {
//   AlertTriangle,
//   BarChart2,
//   CheckCircle,
//   ClipboardList,
//   Clock,
//   PieChart as PieChartIcon,
// } from 'lucide-react'
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Pie,
//   PieChart,
//   Tooltip as RechartsTooltip,
//   ResponsiveContainer,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api } from '@/lib/api.ts'
// import { neverToError } from '@/lib/utils.ts'
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card.tsx'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import { Skeleton } from '@/components/ui/skeleton.tsx'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import {
//   DateCell,
//   CurrencyCell,
//   StatusCell,
//   SemiBoldCell,
//   StockAuditActionsCell,
// } from '@/components/table/cells.ts'
// import { DashboardResponse } from '@/features/audit/types.ts'
// import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

// function RouteComponent() {
//   const [branchId, setBranchId] = useState<string | undefined>(undefined)
//   const user = useAuthStore().auth.user

//   const {
//     data: apiData,
//     isLoading,
//     error,
//   } = $api.useQuery('get', '/stockAudit/dashboard', {
//     params: {
//       header: { Authorization: '' },
//       query: { branchId: branchId === 'all' ? undefined : branchId },
//     },
//   })

//   const dashboardData = (apiData as unknown as DashboardResponse)?.data

//   // Flatten assignments with auditorUsername
//   const allAssignments = useMemo(() => {
//     if (!dashboardData?.auditorAssignments) return []
//     return dashboardData.auditorAssignments.flatMap((auditor) =>
//       auditor.assignments.map((assignment) => ({
//         ...assignment,
//         auditorUsername: auditor.auditorUsername,
//       }))
//     )
//   }, [dashboardData])

//   const tableColumns = useMemo<
//     PaginatedTableProps<(typeof allAssignments)[0]>['columns']
//   >(
//     () => [
//       { key: 'id', label: 'ID', sortable: true },
//       { key: 'accountNo', label: 'Account No.', sortable: true },
//       { key: 'auditorName', label: 'Client Auditor', sortable: true },
//       {
//         key: 'assignedAuditorUsername',
//         label: 'Assigned To',
//         sortable: true,
//         render: (value) => <SemiBoldCell value={value} />,
//       },
//       {
//         key: 'facilityType',
//         label: 'Facility Type',
//         sortable: true,
//       },
//       {
//         key: 'stockLocation',
//         label: 'Location',
//         sortable: true,
//       },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         sortable: true,
//         render: (value) => <CurrencyCell value={`${value}`} />,
//       },
//       {
//         key: 'deadline',
//         label: 'Deadline',
//         sortable: true,
//         render: (value) => <DateCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Status',
//         sortable: true,
//         render: (value) => <StatusCell value={`${value}`} />,
//       },
//       {
//         key: 'status',
//         label: 'Actions',
//         render: (_, row) => <StockAuditActionsCell row={row} />,
//       },
//     ],
//     []
//   )

//   if (isLoading) {
//     return (
//       <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
//         <header className='mb-8'>
//           <Skeleton className='h-8 w-72 rounded-md' />
//         </header>

//         {/* Summary Skeletons */}
//         <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div
//               key={i}
//               className='flex items-center space-x-4 rounded-xl bg-gray-50 p-6 shadow'
//             >
//               <Skeleton className='h-10 w-10 rounded-full' />
//               <div className='space-y-2'>
//                 <Skeleton className='h-4 w-24' />
//                 <Skeleton className='h-6 w-16' />
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Charts Skeleton */}
//         <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//           <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-1' />
//           <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-2' />
//         </div>

//         {/* Table Skeleton */}
//         <div className='space-y-2'>
//           <Skeleton className='h-6 w-64' />
//           <div className='space-y-2 rounded-xl bg-white p-4 shadow'>
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//             <Skeleton className='h-10 w-full' />
//           </div>
//         </div>

//         <footer className='mt-12 text-center text-sm text-gray-500'>
//           <Skeleton className='mx-auto h-4 w-56' />
//         </footer>
//       </MainWrapper>
//     )
//   }

//   if (error || !dashboardData) {
//     return (
//       <div className='flex h-screen items-center justify-center bg-red-50 p-4'>
//         <div className='rounded-lg bg-white p-8 text-center shadow-xl'>
//           <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-red-500' />
//           <h2 className='mb-2 text-2xl font-semibold text-red-700'>
//             Oops! Something went wrong.
//           </h2>
//           <p className='text-gray-600'>
//             We couldn't load the audit dashboard data. Please try again later.
//           </p>
//           {error && (
//             <p className='mt-2 text-sm text-gray-500'>
//               Error: {neverToError(error)}
//             </p>
//           )}
//         </div>
//       </div>
//     )
//   }

//   // Destructure data
//   const { statusCounts, auditorAssignments } = dashboardData
//   const totalAudits = Object.values(statusCounts).reduce(
//     (sum, count) => sum + count,
//     0
//   )

//   // Prepare chart data
//   const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
//     name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
//     value,
//   }))
//   const auditorChartData = auditorAssignments.map((auditor) => ({
//     name: auditor.auditorUsername,
//     assignments: auditor.assignmentCount,
//   }))

//   const STATUS_COLORS: Record<string, string> = {
//     Completed: '#34D399', // green-400
//     Started: '#FBBF24', // amber-400
//     Pending: '#F87171', // red-400
//   }

//   const AUDITOR_COLORS = [
//     '#60A5FA',
//     '#F472B6',
//     '#A78BFA',
//     '#FCD34D',
//     '#818CF8',
//     '#FB923C',
//   ]

//   // ─── Render Dashboard ──────────────────────────────────────────────────────

//   return (
//     <MainWrapper
//       extra={
//         user?.branchId ? null : (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         )
//       }
//     >
//       {/* Header */}
//       <header className='mb-8'>
//         <h1 className='text-3xl font-bold tracking-tight text-gray-800'>
//           Stock Audit Dashboard
//         </h1>
//       </header>

//       {/* Summary Cards */}
//       <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
//         {[
//           {
//             title: 'Total Audits',
//             value: totalAudits,
//             icon: ClipboardList,
//             color: 'text-indigo-500',
//             bgColor: 'bg-indigo-50',
//           },
//           {
//             title: 'Completed',
//             value: statusCounts.COMPLETED,
//             icon: CheckCircle,
//             color: 'text-green-500',
//             bgColor: 'bg-green-50',
//           },
//           {
//             title: 'In Progress',
//             value: statusCounts.STARTED,
//             icon: Clock,
//             color: 'text-yellow-500',
//             bgColor: 'bg-yellow-50',
//           },
//           {
//             title: 'Pending',
//             value: statusCounts.PENDING,
//             icon: AlertTriangle,
//             color: 'text-red-500',
//             bgColor: 'bg-red-50',
//           },
//         ].map((stat) => (
//           <Card key={stat.title} className={`${stat.bgColor}`}>
//             <CardContent className='flex items-center space-x-4 p-6'>
//               <div className={`rounded-full bg-white p-3 ${stat.color}`}>
//                 <stat.icon className='h-7 w-7' />
//               </div>
//               <div>
//                 <p className='text-sm font-medium text-gray-500'>
//                   {stat.title}
//                 </p>
//                 <p
//                   className={`text-3xl font-semibold ${stat.color.replace('text-', 'text-')}`}
//                 >
//                   {stat.value}
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Charts Section */}
//       <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
//         {/* Status Distribution Pie Chart Card */}
//         <Card className='lg:col-span-1'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <PieChartIcon className='h-5 w-5 text-indigo-600' />
//               Audit Status Distribution
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className='mb-4 text-sm text-gray-500'>
//               Breakdown of all audits by current status.
//             </p>
//             <div style={{ width: '100%', height: 300 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie
//                     data={statusChartData}
//                     cx='50%'
//                     cy='50%'
//                     labelLine={false}
//                     outerRadius={100}
//                     fill='#8884d8'
//                     dataKey='value'
//                   >
//                     {statusChartData.map((entry, index) => (
//                       <Cell
//                         key={`cell-status-${index}`}
//                         fill={STATUS_COLORS[entry.name] ?? '#888888'}
//                       />
//                     ))}
//                   </Pie>
//                   <RechartsTooltip
//                     formatter={(value, name) => [`${value} Audits`, name]}
//                   />
//                   <Legend iconType='circle' />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Assignments per Auditor Bar Chart Card */}
//         <Card className='lg:col-span-2'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <BarChart2 className='h-5 w-5 text-indigo-600' />
//               Assignments per Auditor
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className='mb-4 text-sm text-gray-500'>
//               Number of active assignments for each auditor.
//             </p>
//             <div style={{ width: '100%', height: 300 }}>
//               <ResponsiveContainer>
//                 <BarChart
//                   data={auditorChartData}
//                   margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray='3 3'
//                     vertical={false}
//                     stroke='#f3f4f6'
//                   />
//                   <XAxis dataKey='name' tick={{ fontSize: 12 }} />
//                   <YAxis tick={{ fontSize: 12 }} />
//                   <RechartsTooltip
//                     contentStyle={{
//                       backgroundColor: '#ffffff',
//                       borderRadius: 8,
//                       border: '1px solid #e5e7eb',
//                       boxShadow: '0 0 10px rgba(0,0,0,0.05)',
//                     }}
//                     formatter={(value: number) => [`${value}`, 'Assignments']}
//                   />
//                   <Legend />
//                   <Bar
//                     dataKey='assignments'
//                     radius={[6, 6, 0, 0]}
//                     barSize={40}
//                     name='Assignments'
//                   >
//                     {auditorChartData.map((_, index) => (
//                       <Cell
//                         key={`cell-auditor-${index}`}
//                         fill={`var(--chart-${(index % AUDITOR_COLORS.length) + 1})`}
//                       />
//                     ))}
//                   </Bar>
//                   <defs>
//                     {AUDITOR_COLORS.map((color, index) => (
//                       <linearGradient
//                         id={`color-${index}`}
//                         key={index}
//                         x1='0'
//                         y1='0'
//                         x2='0'
//                         y2='1'
//                       >
//                         <stop offset='0%' stopColor={color} stopOpacity={0.8} />
//                         <stop
//                           offset='100%'
//                           stopColor={color}
//                           stopOpacity={0.4}
//                         />
//                       </linearGradient>
//                     ))}
//                   </defs>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Detailed Assignments Table */}
//       <div className='col-span-full'>
//         <Card>
//           <CardHeader>
//             <CardTitle className='text-base font-semibold'>
//               All Audit Assignments
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <PaginatedTable
//               columns={tableColumns}
//               data={allAssignments}
//               initialRowsPerPage={10}
//               emptyMessage='No audit assignments found.'
//             />
//           </CardContent>
//         </Card>
//       </div>
//     </MainWrapper>
//   )
// }

// export const Route = createFileRoute('/_authenticated/audit/dashboard')({
//   component: RouteComponent,
// })
