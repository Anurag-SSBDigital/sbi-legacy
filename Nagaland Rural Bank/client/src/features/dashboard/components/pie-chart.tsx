'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ChartDataItem {
  name: string
  value: number
  color: string
}

interface DynamicBarChartProps {
  title?: string
  description?: string
  data: ChartDataItem[]
  sort?: 'desc' | 'asc' | 'none'
  showPercent?: boolean
}

export function DynamicPieChart({
  title = 'Category Breakdown',
  description = 'Interactive Account Status Distribution',
  data,
  sort = 'desc',
  showPercent = true,
}: DynamicBarChartProps) {
  // --- Dark mode detection so Recharts primitives can adapt ---
  const [isDark, setIsDark] = React.useState(false)
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const rows = React.useMemo(() => {
    const filtered = Array.isArray(data)
      ? data.filter((d) => Number.isFinite(d.value))
      : []
    if (sort === 'none') return filtered
    return [...filtered].sort((a, b) =>
      sort === 'asc' ? a.value - b.value : b.value - a.value
    )
  }, [data, sort])

  const total = React.useMemo(
    () => rows.reduce((s, r) => s + (r.value || 0), 0),
    [rows]
  )

  if (!rows.length || total === 0) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className='grid h-[280px] flex-1 place-items-center'>
          <p className='text-muted-foreground text-sm'>No data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = rows.map((r) => ({
    ...r,
    percent: total ? (r.value / total) * 100 : 0,
  }))

  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between gap-3 text-xl'>
          <div className='min-w-0'>
            <CardTitle className='truncate'>{title}</CardTitle>
            {description ? (
              <CardDescription className='mt-1 truncate text-sm'>
                {description}
              </CardDescription>
            ) : null}
          </div>
          {/* light unchanged; dark adds subtle contrast */}
          <div className='text-muted-foreground shrink-0 rounded-full border bg-white px-3 py-1 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white/80'>
            Total:{' '}
            <span className='text-foreground font-medium tabular-nums dark:text-white'>
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex-1 pb-4'>
        <div
          className='w-full'
          style={{ height: Math.max(260, 40 + chartData.length * 36) }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              layout='vertical'
              margin={{ top: 8, right: 28, bottom: 8, left: 16 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
              />
              <XAxis
                type='number'
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: isDark
                    ? 'rgba(255,255,255,0.8)'
                    : 'rgba(17,24,39,0.88)',
                }}
              />
              <YAxis
                type='category'
                dataKey='name'
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.9)',
                }}
              />

              {/* Custom tooltip so dark mode looks great without changing light */}
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]
                  const raw = p.value as number | string
                  const num = typeof raw === 'number' ? raw : Number(raw)
                  const pct = (p.payload?.percent ?? 0) as number

                  return (
                    <div className='min-w-[180px] rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/30'>
                      <div className='flex items-center justify-between gap-6'>
                        <span className='max-w-[120px] truncate font-medium'>
                          {String(p.payload?.name ?? '')}
                        </span>
                        <span className='tabular-nums'>
                          {Number.isFinite(num)
                            ? num.toLocaleString()
                            : String(raw ?? '')}
                          {showPercent ? (
                            <span className='text-muted-foreground ml-1'>
                              ({pct.toFixed(1)}%)
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />

              <defs>
                {chartData.map((item, i) => (
                  <linearGradient
                    id={`gradient-${i}`}
                    key={i}
                    x1='0'
                    y1='0'
                    x2='1'
                    y2='0'
                  >
                    <stop
                      offset='0%'
                      stopColor={item.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset='100%'
                      stopColor={item.color}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>

              <Bar dataKey='value' radius={[6, 6, 6, 6]}>
                {chartData.map((_entry, idx) => (
                  <Cell key={`bar-${idx}`} fill={`url(#gradient-${idx})`} />
                ))}

                <LabelList
                  dataKey={showPercent ? 'percent' : 'value'}
                  position='right'
                  formatter={(val: number) =>
                    showPercent
                      ? `${val.toFixed(1)}%`
                      : `${val.toLocaleString?.() ?? val}`
                  }
                  className='fill-foreground text-[11px]'
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend cards — light unchanged; dark gets softer surfaces & borders */}
        <div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3'>
          {chartData.map((item) => (
            <div
              key={item.name}
              className='flex items-center justify-between rounded-lg border bg-gray-50 p-2 hover:bg-gray-100 dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <span
                  className='h-3.5 w-3.5 shrink-0 rounded-sm'
                  style={{ backgroundColor: item.color }}
                />
                <span className='truncate text-sm'>{item.name}</span>
              </div>
              <div className='text-sm tabular-nums'>
                {item.value.toLocaleString()}
                {showPercent ? (
                  <span className='text-muted-foreground ml-1 text-[11px]'>
                    ({item.percent.toFixed(1)}%)
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}