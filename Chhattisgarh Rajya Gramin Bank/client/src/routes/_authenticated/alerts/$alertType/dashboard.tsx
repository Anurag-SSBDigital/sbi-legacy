import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { paths } from '@/types/api/v1'
import {
  AlertTriangle,
  AreaChart,
  BarChart2,
  CheckCircle,
  Clock,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { useAuthStore } from '@/stores/authStore'
import { $api } from '@/lib/api'
import { neverToError } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MainWrapper from '@/components/ui/main-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import BranchSelector from '@/features/dashboard/components/branch-selector'

// ─── Type Definitions ────────────────────────────────────────────────────────
type TAlertResolutionDashboard = NonNullable<
  paths['/alert/resolutions/dashboard']['get']['responses']['200']['content']['*/*']['data']
>

// ─── Small helpers ───────────────────────────────────────────────────────────
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

// ─── Stat Card (same look as Stock Audit dashboard) ─────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  helper,
  tone = 'primary',
}: {
  title: string
  value: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  helper?: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const toneVar =
    tone === 'success'
      ? 'var(--color-chart-4)'
      : tone === 'warning'
        ? 'var(--color-chart-2)'
        : tone === 'danger'
          ? 'var(--color-chart-1)'
          : 'var(--color-primary)'

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

// ─── Main Dashboard Component ────────────────────────────────────────────────
function RouteComponent() {
  const { alertType } = Route.useParams()
  const user = useAuthStore((state) => state.auth.user)

  const [branchId, setBranchId] = useState<string | undefined>(
    (user?.branchId as unknown as string) || undefined
  )
  const isSmall = useIsSmall()
  const isDark = useIsDark()

  const {
    data: apiData,
    isLoading,
    error,
  } = $api.useQuery('get', '/alert/resolutions/dashboard', {
    params: {
      query: {
        type: alertType === 'ews' ? 'EWS' : 'FRM',
        ...(branchId === 'All' || !branchId ? {} : { branchId }),
      },
      header: { Authorization: '' },
    },
  })

  const dashboardData = apiData?.data as TAlertResolutionDashboard | undefined

  const { barChartData, statusChartData } = useMemo(() => {
    if (!dashboardData) return { barChartData: [], statusChartData: [] }

    const barData = (dashboardData.masterCounts ?? [])
      .slice()
      .sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
      .slice(0, 7)

    const statusData = Object.entries(dashboardData.statusCounts ?? {})
      .filter(([key]) => key.toUpperCase() !== 'TOTAL')
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        value: Number(value ?? 0),
      }))

    return { barChartData: barData, statusChartData: statusData }
  }, [dashboardData])

  if (isLoading) return <LoadingState />
  if (error || !dashboardData) return <ErrorState error={error} />

  const totalAlerts = Number(dashboardData.totalAlerts ?? 0)
  const pending =
    Number(
      dashboardData.statusCounts?.[
        'PENDING_APPROVAL' as keyof NonNullable<
          typeof dashboardData
        >['statusCounts']
      ] ?? 0
    ) || 0
  const approved =
    Number(
      dashboardData.statusCounts?.[
        'APPROVED' as keyof NonNullable<typeof dashboardData>['statusCounts']
      ] ?? 0
    ) || 0

  const COLORS = {
    card: 'var(--color-card)',
    c1: 'var(--color-chart-1)',
    c2: 'var(--color-chart-2)',
    c3: 'var(--color-chart-3)',
    c4: 'var(--color-chart-4)',
    c5: 'var(--color-chart-5)',
    primary: 'var(--color-primary)',
  }

  const pieOuterRadius = isSmall ? 88 : 100
  const pieHeight = isSmall ? 260 : 300

  return (
    <MainWrapper
      extra={
        user?.isSuperAdmin || user?.superAdmin || user?.departmentId ? (
          <BranchSelector value={branchId} setValue={setBranchId} />
        ) : null
      }
    >
      {/* 🌫️ SUBTLE BACKGROUND EFFECTS (same vibe as Stock Audit) */}
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

      {/* Header */}
      <header className='mb-8'>
        <h1
          className='bg-clip-text text-3xl font-extrabold tracking-tight text-transparent'
          style={{
            backgroundImage:
              'linear-gradient(90deg,var(--color-primary), var(--color-chart-2))',
          }}
        >
          {alertType.toUpperCase()} Alerts Dashboard
        </h1>
      </header>

      {/* KPI Cards (NOW SAME LOOKING) */}
      <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <StatCard
          title='Total Alerts'
          value={totalAlerts}
          icon={AreaChart}
          tone='primary'
        />
        <StatCard
          title='Pending Approval'
          value={pending}
          icon={Clock}
          tone='warning'
        />
        <StatCard
          title='Resolved'
          value={approved}
          icon={CheckCircle}
          tone='success'
        />
      </div>

      {/* Charts Section */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
        {/* Pie */}
        <Card className='border bg-[var(--color-card)] shadow-sm lg:col-span-2'>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <PieChartIcon className='h-5 w-5 opacity-70' />
              Alert Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <div style={{ width: '100%', height: pieHeight }}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey='value'
                    nameKey='name'
                    outerRadius={pieOuterRadius}
                    stroke={COLORS.card}
                    strokeWidth={2}
                  >
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Legend iconType='circle' />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Triggers list (your current beautiful bar-card list) */}
        <Card className='border bg-[var(--color-card)] shadow-sm lg:col-span-3'>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <BarChart2 className='h-5 w-5 opacity-70' />
              Top Alert Triggers
            </CardTitle>
          </CardHeader>

          <CardContent className='flex flex-col pt-4'>
            {!Array.isArray(barChartData) || barChartData.length === 0 ? (
              <div className='grid h-40 place-items-center text-sm text-[var(--color-muted-foreground)]'>
                No data
              </div>
            ) : (
              (() => {
                type TriggerRow = { masterDescription: string; count: number }

                const isTriggerRow = (o: unknown): o is TriggerRow => {
                  if (o == null || typeof o !== 'object') return false
                  const obj = o as Record<string, unknown>
                  return (
                    typeof obj.masterDescription === 'string' &&
                    typeof obj.count === 'number'
                  )
                }

                const raw = barChartData.filter(isTriggerRow)

                const PALETTE: readonly string[] = [
                  'var(--color-chart-1)',
                  'var(--color-chart-2)',
                  'var(--color-chart-3)',
                  'var(--color-chart-4)',
                  'var(--color-chart-5)',
                  'var(--color-primary)',
                ]

                const max = raw.reduce<number>(
                  (m, r) => (r.count > m ? r.count : m),
                  1
                )

                const items: TriggerRow[] = [...raw]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)

                return (
                  <div className='space-y-3'>
                    {items.map((d, i) => {
                      const count = d.count
                      const pct = Math.max(
                        0,
                        Math.min(100, (count / max) * 100)
                      )
                      const color: string = PALETTE[i % PALETTE.length]

                      return (
                        <div
                          key={`${d.masterDescription}-${i}`}
                          className='group relative overflow-hidden rounded-xl border bg-[var(--color-card)] p-3 shadow-sm transition hover:shadow-md'
                        >
                          <div
                            aria-hidden
                            className='pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-15 blur-2xl'
                            style={{ background: color }}
                          />
                          <div className='flex items-center justify-between gap-3'>
                            <div className='flex min-w-0 items-center gap-3'>
                              <span
                                className='grid h-7 w-7 place-items-center rounded-lg text-xs font-bold'
                                style={{
                                  background: `color-mix(in oklab, ${color}, white 85%)`,
                                  color,
                                }}
                                title={`Rank #${i + 1}`}
                              >
                                {i + 1}
                              </span>
                              <div className='min-w-0'>
                                <div
                                  className='truncate text-sm font-medium'
                                  title={d.masterDescription}
                                >
                                  {d.masterDescription}
                                </div>
                                <div className='text-[11px] text-[var(--color-muted-foreground)]'>
                                  {count.toLocaleString('en-IN')} alerts
                                </div>
                              </div>
                            </div>

                            <span
                              className='shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold'
                              style={{
                                background: `color-mix(in oklab, ${color}, white 88%)`,
                                color,
                                border: `1px solid color-mix(in oklab, ${color}, black 10%)`,
                              }}
                            >
                              #{i + 1}
                            </span>
                          </div>

                          <div className='mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800'>
                            <div
                              className='h-full rounded-full transition-[width] duration-500'
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color}, white 20%))`,
                                filter:
                                  'drop-shadow(0 2px 6px rgba(0,0,0,.15))',
                              }}
                              aria-label={`Contribution ${Math.round(pct)}%`}
                              role='img'
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* optional: if you want later, we can add table/cards below */}
      <div className='text-xs text-[var(--color-muted-foreground)]'>
        {/* keep space for future sections */}
      </div>

      {/* grid line style consistent */}
      <style>
        {`
          :root {
            --recharts-grid: ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'};
          }
        `}
      </style>
    </MainWrapper>
  )
}

// ─── UI State Components ─────────────────────────────────────────────────────
const LoadingState = () => (
  <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
    <header className='mb-8'>
      <Skeleton className='h-8 w-72 rounded-md' />
      <Skeleton className='mt-2 h-4 w-96 rounded-md' />
    </header>
    <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className='h-[108px] w-full rounded-2xl' />
      ))}
    </div>
    <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
      <Skeleton className='h-[300px] w-full rounded-2xl lg:col-span-2' />
      <Skeleton className='h-[300px] w-full rounded-2xl lg:col-span-3' />
    </div>
    <Skeleton className='h-16 w-full rounded-2xl' />
  </MainWrapper>
)

const ErrorState = ({ error }: { error?: Error | null }) => (
  <div className='flex min-h-[60vh] items-center justify-center bg-[var(--color-destructive)]/10 p-4 dark:bg-[var(--color-destructive)]/15'>
    <div className='rounded-2xl border bg-[var(--color-card)] p-8 text-center shadow-xl dark:bg-neutral-900 dark:text-neutral-100'>
      <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-[var(--color-primary)]' />
      <h2 className='mb-2 text-2xl font-semibold text-[var(--color-primary)]'>
        Oops! Something went wrong.
      </h2>
      <p className='text-[var(--color-muted-foreground)]'>
        We couldn&apos;t load the dashboard data. Please try again later.
      </p>
      {error && (
        <p className='mt-2 text-sm text-[var(--color-muted-foreground)]'>
          Error: {neverToError(error)}
        </p>
      )}
    </div>
  </div>
)

// ─── Route Definition ────────────────────────────────────────────────────────
export const Route = createFileRoute(
  '/_authenticated/alerts/$alertType/dashboard'
)({
  component: RouteComponent,
})

// import { useEffect, useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { paths } from '@/types/api/v1'
// import {
//   AlertTriangle,
//   AreaChart,
//   BarChart2,
//   CheckCircle,
//   Clock,
//   PieChart as PieChartIcon,
// } from 'lucide-react'
// import {
//   Cell,
//   Legend,
//   Pie,
//   PieChart,
//   ResponsiveContainer,
//   Tooltip as RechartsTooltip,
// } from 'recharts'
// import { useAuthStore } from '@/stores/authStore'
// import { $api } from '@/lib/api'
// import { neverToError } from '@/lib/utils'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import BranchSelector from '@/features/dashboard/components/branch-selector'

// // ─── Type Definitions ────────────────────────────────────────────────────────
// type TAlertResolutionDashboard = NonNullable<
//   paths['/alert/resolutions/dashboard']['get']['responses']['200']['content']['*/*']['data']
// >

// // ─── Small helpers (no layout impact) ────────────────────────────────────────
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

// const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

// // ─── Main Dashboard Component ────────────────────────────────────────────────
// function RouteComponent() {
//   const { alertType } = Route.useParams()
//   const user = useAuthStore((state) => state.auth.user)
//   const [branchId, setBranchId] = useState<string | undefined>(
//     (user?.branchId as unknown as string) || undefined
//   )
//   const isSmall = useIsSmall()

//   const {
//     data: apiData,
//     isLoading,
//     error,
//   } = $api.useQuery('get', '/alert/resolutions/dashboard', {
//     params: {
//       query: {
//         type: alertType === 'ews' ? 'EWS' : 'FRM',
//         ...(branchId === 'All' || !branchId ? {} : { branchId }),
//       },
//       header: { Authorization: '' },
//     },
//   })

//   const dashboardData = apiData?.data as TAlertResolutionDashboard | undefined

//   const { barChartData, statusChartData } = useMemo(() => {
//     if (!dashboardData) return { barChartData: [], statusChartData: [] }

//     const barData = (dashboardData.masterCounts ?? [])
//       .slice()
//       .sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
//       .slice(0, 7)

//     const statusData = Object.entries(dashboardData.statusCounts ?? {})
//       .filter(([key]) => key.toUpperCase() !== 'TOTAL')
//       .map(([name, value]) => ({
//         name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
//         value: Number(value ?? 0),
//       }))

//     return { barChartData: barData, statusChartData: statusData }
//   }, [dashboardData])

//   if (isLoading) return <LoadingState />
//   if (error || !dashboardData) return <ErrorState error={error} />

//   // ─── Theme-aware colors (pure CSS vars; safe for Recharts) ─────────────────
//   const COLORS = {
//     primary: 'var(--color-primary)',
//     card: 'var(--color-card)',
//     fg: 'var(--color-foreground)',
//     mutedFg: 'var(--color-muted-foreground)',
//     c1: 'var(--color-chart-1)', // russet
//     c2: 'var(--color-chart-2)', // ochre
//     c3: 'var(--color-chart-3)', // deep clay
//     c4: 'var(--color-chart-4)', // sage
//     c5: 'var(--color-chart-5)', // denim
//   }

//   const KPI_CONFIG = {
//     TOTAL: {
//       title: 'Total Alerts',
//       icon: AreaChart,
//       chipBg: 'bg-[var(--color-primary)]/10',
//       chipIcon: 'text-[var(--color-primary)]',
//     },
//     PENDING_APPROVAL: {
//       title: 'Pending Approval',
//       icon: Clock,
//       chipBg: 'bg-[var(--color-chart-2)]/15',
//       chipIcon: 'text-[var(--color-chart-2)]',
//     },
//     APPROVED: {
//       title: 'Resolved',
//       icon: CheckCircle,
//       chipBg: 'bg-[var(--color-chart-4)]/15',
//       chipIcon: 'text-[var(--color-chart-4)]',
//     },
//   }

//   const CHART_COLORS = {
//     STATUS: {
//       Pending_approval: COLORS.c2,
//       Approved: COLORS.c4,
//       Resolved: COLORS.c4,
//       Pending: COLORS.c2,
//       Overdue: COLORS.c1,
//     } as Record<string, string>,
//     BAR: [
//       COLORS.c1,
//       COLORS.c2,
//       COLORS.c3,
//       COLORS.c4,
//       COLORS.c5,
//       COLORS.primary,
//       COLORS.c2,
//     ],
//   }

//   // Mobile-friendly sizes
//   const pieOuterRadius = isSmall ? 88 : 100
//   const pieHeight = isSmall ? 260 : 300

//   return (
//     <MainWrapper
//       extra={
//         user?.isSuperAdmin || user?.superAdmin || user?.departmentId ? (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         ) : null
//       }
//     >
//       {/* Header */}
//       <header className='mb-6'>
//         <h1
//           className='bg-clip-text text-3xl font-extrabold tracking-tight text-transparent'
//           style={{
//             backgroundImage:
//               'linear-gradient(90deg,var(--color-primary), var(--color-chart-2))',
//           }}
//         >
//           {alertType.toUpperCase()} Alerts Dashboard
//         </h1>
//         {/* <p className='mt-1 text-sm text-[var(--color-muted-foreground)]'>
//           An overview of alert resolutions and triggers.
//         </p> */}
//       </header>

//       {/* KPI Cards */}
//       <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
//         {Object.entries(KPI_CONFIG).map(([key, cfg]) => {
//           const value =
//             key === 'TOTAL'
//               ? Number(dashboardData.totalAlerts ?? 0)
//               : Number(
//                 dashboardData?.statusCounts?.[
//                 key as keyof NonNullable<
//                   typeof dashboardData
//                 >['statusCounts']
//                 ] ?? 0
//               )
//           const Icon = cfg.icon
//           return (
//             <Card
//               key={cfg.title}
//               className='border bg-[var(--color-card)] shadow-sm'
//             >
//               <CardContent className='flex items-center gap-4 p-4'>
//                 <div
//                   className={`rounded-xl p-3 ring-1 ring-black/5 dark:ring-white/10 ${cfg.chipBg}`}
//                 >
//                   <Icon className={`h-6 w-6 ${cfg.chipIcon}`} />
//                 </div>
//                 <div>
//                   <div className='text-sm font-medium text-[var(--color-muted-foreground)]'>
//                     {cfg.title}
//                   </div>
//                   <div className='text-3xl font-semibold text-[var(--color-foreground)]'>
//                     {nf0.format(value)}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )
//         })}
//       </div>

//       {/* Charts Section */}
//       <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
//         {/* Pie: status distribution */}
//         <Card className='lg:col-span-2'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <PieChartIcon className='h-5 w-5 text-[var(--color-primary)]' />
//               Alert Status Distribution
//             </CardTitle>
//           </CardHeader>
//           <CardContent className='h-[300px]'>
//             <div style={{ width: '100%', height: pieHeight }}>
//               <ResponsiveContainer width='100%' height='100%'>
//                 <PieChart>
//                   <Pie
//                     data={statusChartData}
//                     dataKey='value'
//                     nameKey='name'
//                     outerRadius={pieOuterRadius}
//                     stroke={COLORS.card}
//                     strokeWidth={2}
//                   >
//                     {statusChartData.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={CHART_COLORS.STATUS[entry.name] ?? COLORS.c1}
//                         style={{
//                           filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.10))',
//                         }}
//                       />
//                     ))}
//                   </Pie>

//                   <RechartsTooltip
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className='min-w-[140px] rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100'>
//                           <div className='flex items-center justify-between gap-4'>
//                             <span className='font-medium'>
//                               {String(p.name ?? '')}
//                             </span>
//                             <span className='tabular-nums'>
//                               {nf0.format(val)} Alerts
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

//         <Card className='lg:col-span-3'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <BarChart2 className='h-5 w-5 text-[var(--color-primary)]' />
//               Top Alert Triggers
//             </CardTitle>
//           </CardHeader>

//           <CardContent className='flex flex-col'>
//             {!Array.isArray(barChartData) || barChartData.length === 0 ? (
//               <div className='grid h-40 place-items-center text-sm text-[var(--color-muted-foreground)]'>
//                 No data
//               </div>
//             ) : (
//               (() => {
//                 type TriggerRow = { masterDescription: string; count: number }

//                 const isTriggerRow = (o: unknown): o is TriggerRow => {
//                   if (o == null || typeof o !== 'object') return false
//                   const obj = o as Record<string, unknown>
//                   return (
//                     typeof obj.masterDescription === 'string' &&
//                     typeof obj.count === 'number'
//                   )
//                 }

//                 const raw = barChartData.filter(isTriggerRow)

//                 const PALETTE: readonly string[] = [
//                   'var(--color-chart-1)',
//                   'var(--color-chart-2)',
//                   'var(--color-chart-3)',
//                   'var(--color-chart-4)',
//                   'var(--color-chart-5)',
//                   'var(--color-primary)',
//                 ]

//                 const max = raw.reduce<number>(
//                   (m, r) => (r.count > m ? r.count : m),
//                   1
//                 )

//                 const items: TriggerRow[] = [...raw]
//                   .sort((a, b) => b.count - a.count)
//                   .slice(0, 10)

//                 return (
//                   <div className='space-y-3'>
//                     {items.map((d, i) => {
//                       const count = d.count
//                       const pct = Math.max(
//                         0,
//                         Math.min(100, (count / max) * 100)
//                       )
//                       const color: string = PALETTE[i % PALETTE.length]

//                       return (
//                         <div
//                           key={`${d.masterDescription}-${i}`}
//                           className='group relative overflow-hidden rounded-xl border bg-[var(--color-card)] p-3 shadow-sm transition hover:shadow-md'
//                         >
//                           {/* glow */}
//                           <div
//                             aria-hidden
//                             className='pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-15 blur-2xl'
//                             style={{ background: color }}
//                           />
//                           <div className='flex items-center justify-between gap-3'>
//                             <div className='flex min-w-0 items-center gap-3'>
//                               <span
//                                 className='grid h-7 w-7 place-items-center rounded-lg text-xs font-bold'
//                                 style={{
//                                   background: `color-mix(in oklab, ${color}, white 85%)`,
//                                   color,
//                                 }}
//                                 title={`Rank #${i + 1}`}
//                               >
//                                 {i + 1}
//                               </span>
//                               <div className='min-w-0'>
//                                 <div
//                                   className='truncate text-sm font-medium'
//                                   title={d.masterDescription}
//                                 >
//                                   {d.masterDescription}
//                                 </div>
//                                 <div className='text-[11px] text-[var(--color-muted-foreground)]'>
//                                   {count.toLocaleString('en-IN')} alerts
//                                 </div>
//                               </div>
//                             </div>

//                             <span
//                               className='shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold'
//                               style={{
//                                 background: `color-mix(in oklab, ${color}, white 88%)`,
//                                 color,
//                                 border: `1px solid color-mix(in oklab, ${color}, black 10%)`,
//                               }}
//                             >
//                               #{i + 1}
//                             </span>
//                           </div>

//                           <div className='mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800'>
//                             <div
//                               className='h-full rounded-full transition-[width] duration-500'
//                               style={{
//                                 width: `${pct}%`,
//                                 background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color}, white 20%))`,
//                                 filter:
//                                   'drop-shadow(0 2px 6px rgba(0,0,0,.15))',
//                               }}
//                               aria-label={`Contribution ${Math.round(pct)}%`}
//                               role='img'
//                             />
//                           </div>
//                         </div>
//                       )
//                     })}
//                   </div>
//                 )
//               })()
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </MainWrapper>
//   )
// }

// // ─── UI State Components ─────────────────────────────────────────────────────
// const LoadingState = () => (
//   <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
//     <header className='mb-8'>
//       <Skeleton className='h-8 w-72 rounded-md' />
//       <Skeleton className='mt-2 h-4 w-96 rounded-md' />
//     </header>
//     <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
//       {Array.from({ length: 3 }).map((_, i) => (
//         <div
//           key={i}
//           className='flex items-center gap-4 rounded-xl bg-[var(--color-card)]/60 p-6 shadow-sm'
//         >
//           <Skeleton className='h-12 w-12 rounded-xl' />
//           <div className='space-y-2'>
//             <Skeleton className='h-4 w-24' />
//             <Skeleton className='h-6 w-16' />
//           </div>
//         </div>
//       ))}
//     </div>
//     <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
//       <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-2' />
//       <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-3' />
//     </div>
//     <div className='rounded-xl bg-[var(--color-card)]/60 p-4 shadow'>
//       <Skeleton className='h-10 w-full' />
//       <Skeleton className='mt-2 h-10 w-full' />
//       <Skeleton className='mt-2 h-10 w-full' />
//     </div>
//   </MainWrapper>
// )

// const ErrorState = ({ error }: { error?: Error | null }) => (
//   <div className='flex min-h-[60vh] items-center justify-center bg-[var(--color-destructive)]/10 p-4 dark:bg-[var(--color-destructive)]/15'>
//     <div className='rounded-xl bg-[var(--color-card)] p-8 text-center shadow-xl dark:bg-neutral-900 dark:text-neutral-100'>
//       <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-[var(--color-primary)]' />
//       <h2 className='mb-2 text-2xl font-semibold text-[var(--color-primary)]'>
//         Oops! Something went wrong.
//       </h2>
//       <p className='text-[var(--color-muted-foreground)]'>
//         We couldn&apos;t load the dashboard data. Please try again later.
//       </p>
//       {error && (
//         <p className='mt-2 text-sm text-[var(--color-muted-foreground)]'>
//           Error: {neverToError(error)}
//         </p>
//       )}
//     </div>
//   </div>
// )

// // ─── Route Definition (must match file path) ─────────────────────────────────
// export const Route = createFileRoute(
//   '/_authenticated/alerts/$alertType/dashboard'
// )({
//   component: RouteComponent,
// })

// // src/features/alerts/AlertsDashboard.tsx
// import { useEffect, useMemo, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { paths } from '@/types/api/v1'
// import {
//   AlertTriangle,
//   AreaChart,
//   BarChart2,
//   CheckCircle,
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
//   ResponsiveContainer,
//   Tooltip as RechartsTooltip,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import { useAuthStore } from '@/stores/authStore'
// import { $api } from '@/lib/api'
// import { neverToError } from '@/lib/utils'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import MainWrapper from '@/components/ui/main-wrapper'
// import { Skeleton } from '@/components/ui/skeleton'
// import BranchSelector from '@/features/dashboard/components/branch-selector'

// // ─── Type Definitions ────────────────────────────────────────────────────────
// type TAlertResolutionDashboard = NonNullable<
//   paths['/alert/resolutions/dashboard']['get']['responses']['200']['content']['*/*']['data']
// >

// // ─── Small helpers (no layout impact) ────────────────────────────────────────
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

// // ─── Main Dashboard Component ────────────────────────────────────────────────
// function RouteComponent() {
//   const { alertType } = Route.useParams()
//   const user = useAuthStore((state) => state.auth.user)
//   const [branchId, setBranchId] = useState(user?.branchId)
//   const isSmall = useIsSmall()
//   const isDark = useIsDark()

//   const {
//     data: apiData,
//     isLoading,
//     error,
//   } = $api.useQuery('get', '/alert/resolutions/dashboard', {
//     params: {
//       query: {
//         type: alertType === 'ews' ? 'EWS' : 'FRM',
//         ...(branchId === 'All' || !branchId ? {} : { branchId }),
//       },
//       header: { Authorization: '' },
//     },
//   })

//   const dashboardData = apiData?.data as TAlertResolutionDashboard

//   const { barChartData, statusChartData } = useMemo(() => {
//     if (!dashboardData) return { barChartData: [], statusChartData: [] }

//     const barData = (dashboardData.masterCounts ?? [])
//       .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
//       .slice(0, 7)

//     const statusData = Object.entries(dashboardData.statusCounts ?? {})
//       .filter(([key]) => key !== 'TOTAL')
//       .map(([name, value]) => ({
//         name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
//         value,
//       }))

//     return { barChartData: barData, statusChartData: statusData }
//   }, [dashboardData])

//   if (isLoading) return <LoadingState />
//   if (error || !dashboardData) return <ErrorState error={error} />

//   // ─── Constants & Configurations ────────────────────────────────────────────
//   const KPI_CONFIG = {
//     TOTAL: {
//       title: 'Total Alerts',
//       icon: AreaChart,
//       color: 'text-indigo-500',
//       bgColor: 'bg-indigo-50',
//     },
//     PENDING_APPROVAL: {
//       title: 'Pending Approval',
//       icon: Clock,
//       color: 'text-yellow-500',
//       bgColor: 'bg-yellow-50',
//     },
//     APPROVED: {
//       title: 'Resolved',
//       icon: CheckCircle,
//       color: 'text-green-500',
//       bgColor: 'bg-green-50',
//     },
//   }

//   const CHART_COLORS = {
//     STATUS: {
//       Pending_approval: '#FBBF24',
//       Approved: '#34D399',
//       Resolved: '#34D399', // green-400
//       Pending: '#FBBF24', // amber-400
//       Overdue: '#F87171', // red-400
//     } as Record<string, string>,
//     BAR: [
//       '#60A5FA',
//       '#F472B6',
//       '#A78BFA',
//       '#FCD34D',
//       '#818CF8',
//       '#FB923C',
//       '#4ADE80',
//     ],
//   }

//   // Mobile-friendly chart sizes (desktop untouched)
//   const pieOuterRadius = isSmall ? 88 : 100
//   const barSize = isSmall ? 24 : 40
//   // const xTickFont = isSmall ? 11 : 12
//   const yTickFont = isSmall ? 11 : 12
//   const pieHeight = isSmall ? 260 : 300
//   const barHeight = isSmall ? 260 : 300

//   return (
//     <MainWrapper
//       extra={
//         user?.isSuperAdmin || user?.superAdmin || user?.departmentId ? (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         ) : null
//       }
//     >
//       {/* Header */}
//       <header className='mb-8'>
//         <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-white'>
//           {alertType.toUpperCase()} Alerts Dashboard
//         </h1>
//         <p className='text-muted-foreground mt-1'>
//           An overview of alert resolutions and triggers.
//         </p>
//       </header>

//       {/* KPI Cards (light unchanged; dark gets subtle surfaces) */}
//       <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
//         {Object.entries(KPI_CONFIG).map(([key, config]) => {
//           const value =
//             key === 'TOTAL'
//               ? dashboardData.totalAlerts
//               : dashboardData?.statusCounts
//                 ? dashboardData.statusCounts[
//                 key as keyof typeof dashboardData.statusCounts
//                 ]
//                 : 0
//           return (
//             <Card
//               key={config.title}
//               className={`${config.bgColor} dark:border-white/10 dark:bg-white/5`}
//             >
//               <CardContent className='flex items-center space-x-4 p-6'>
//                 <div
//                   className={`rounded-full bg-white p-3 ${config.color} dark:bg-white/10`}
//                 >
//                   <config.icon className='h-7 w-7' />
//                 </div>
//                 <div>
//                   <p className='text-sm font-medium text-gray-500 dark:text-gray-300'>
//                     {config.title}
//                   </p>
//                   <p className='text-3xl font-semibold dark:text-white'>
//                     {value}
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>
//           )
//         })}
//       </div>

//       {/* Charts Section */}
//       <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
//         {/* Pie: status distribution */}
//         <Card className='lg:col-span-2'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <PieChartIcon className='h-5 w-5 text-indigo-600' />
//               Alert Status Distribution
//             </CardTitle>
//           </CardHeader>
//           <CardContent className='h-[300px]'>
//             <div style={{ width: '100%', height: pieHeight }}>
//               <ResponsiveContainer width='100%' height='100%'>
//                 <PieChart>
//                   <Pie
//                     data={statusChartData}
//                     dataKey='value'
//                     outerRadius={pieOuterRadius}
//                   >
//                     {statusChartData.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={CHART_COLORS.STATUS[entry.name] ?? '#888888'}
//                       />
//                     ))}
//                   </Pie>

//                   {/* Dark-friendly tooltip (light unchanged) */}
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
//                               {val.toLocaleString()} Alerts
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

//         {/* Bar: top triggers */}
//         <Card className='lg:col-span-3'>
//           <CardHeader>
//             <CardTitle className='flex items-center gap-2 text-base font-semibold'>
//               <BarChart2 className='h-5 w-5 text-indigo-600' />
//               Top Alert Triggers
//             </CardTitle>
//           </CardHeader>
//           <CardContent className='flex flex-col'>
//             <div style={{ width: '100%', height: barHeight }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart
//                   data={barChartData}
//                   margin={{
//                     top: 5,
//                     right: 20,
//                     left: 0,
//                     bottom: isSmall ? 70 : 65,
//                   }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     vertical={false}
//                     stroke={isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6"}
//                   />

//                   <XAxis
//                     dataKey="masterDescription"
//                     interval={0}
//                     height={isSmall ? 62 : 70}
//                     tick={(props) => {
//                       const { x, y, payload } = props
//                       const label = String(payload?.value ?? "")
//                       const chunkSize = isSmall ? 10 : 14
//                       const lines = label.match(new RegExp(`.{1,${chunkSize}}`, "g")) || []
//                       return (
//                         <g transform={`translate(${x},${y})`}>
//                           {lines.map((line, i) => (
//                             <text
//                               key={i}
//                               x={0}
//                               y={i * 12}
//                               dy={isSmall ? 12 : 14}
//                               textAnchor="end"
//                               fontSize={isSmall ? 10 : 11}
//                               fill={isDark ? "rgba(255,255,255,0.85)" : "#111827"}
//                             >
//                               {line}
//                             </text>
//                           ))}
//                         </g>
//                       )
//                     }}
//                   />

//                   <YAxis
//                     tick={{
//                       fontSize: yTickFont,
//                       fill: isDark ? "rgba(255,255,255,0.85)" : "#111827",
//                     }}
//                   />

//                   <RechartsTooltip
//                     cursor={{
//                       fill: isDark ? "rgba(255,255,255,0.06)" : "rgba(239,246,255,0.5)",
//                     }}
//                     content={({ active, payload }) => {
//                       if (!active || !payload?.length) return null
//                       const p = payload[0]
//                       const val = Number(p.value) || 0
//                       return (
//                         <div className="min-w-[140px] rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/30">
//                           <div className="flex items-center justify-between gap-4">
//                             <span className="font-medium">
//                               {String(p.payload?.masterDescription ?? "")}
//                             </span>
//                             <span className="tabular-nums">{val.toLocaleString()}</span>
//                           </div>
//                         </div>
//                       )
//                     }}
//                   />

//                   <Legend />

//                   <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]} barSize={barSize}>
//                     {barChartData.map((_entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={CHART_COLORS.BAR[index % CHART_COLORS.BAR.length]}
//                       />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>

//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </MainWrapper>
//   )
// }

// // ─── UI State Components ─────────────────────────────────────────────────────
// const LoadingState = () => (
//   <MainWrapper extra={<Skeleton className='h-10 w-48 rounded-lg' />}>
//     <header className='mb-8'>
//       <Skeleton className='h-8 w-72 rounded-md' />
//       <Skeleton className='mt-2 h-4 w-96 rounded-md' />
//     </header>
//     <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
//       {Array.from({ length: 3 }).map((_, i) => (
//         <div
//           key={i}
//           className='flex items-center space-x-4 rounded-xl bg-gray-50 p-6 shadow-sm dark:bg-white/5'
//         >
//           <Skeleton className='h-12 w-12 rounded-full' />
//           <div className='space-y-2'>
//             <Skeleton className='h-4 w-24' />
//             <Skeleton className='h-6 w-16' />
//           </div>
//         </div>
//       ))}
//     </div>
//     <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5'>
//       <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-2' />
//       <Skeleton className='h-[300px] w-full rounded-xl lg:col-span-3' />
//     </div>
//     <div className='rounded-xl bg-white p-4 shadow dark:bg-white/5'>
//       <Skeleton className='h-10 w-full' />
//       <Skeleton className='mt-2 h-10 w-full' />
//       <Skeleton className='mt-2 h-10 w-full' />
//     </div>
//   </MainWrapper>
// )

// const ErrorState = ({ error }: { error?: Error | null }) => (
//   <div className='flex min-h-[60vh] items-center justify-center bg-red-50 p-4 dark:bg-red-950/10'>
//     <div className='rounded-lg bg-white p-8 text-center shadow-xl dark:bg-neutral-900 dark:text-neutral-100'>
//       <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-red-500' />
//       <h2 className='mb-2 text-2xl font-semibold text-red-700 dark:text-red-400'>
//         Oops! Something went wrong.
//       </h2>
//       <p className='text-gray-600 dark:text-gray-300'>
//         We couldn&apos;t load the dashboard data. Please try again later.
//       </p>
//       {error && (
//         <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//           Error: {neverToError(error)}
//         </p>
//       )}
//     </div>
//   </div>
// )

// // ─── Route Definition ────────────────────────────────────────────────────────
// export const Route = createFileRoute(
//   '/_authenticated/alerts/$alertType/dashboard'
// )({
//   component: RouteComponent,
// })
