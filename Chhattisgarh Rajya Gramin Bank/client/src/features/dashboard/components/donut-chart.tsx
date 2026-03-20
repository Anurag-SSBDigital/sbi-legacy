'use client'

import * as React from 'react'
import { Pie, PieChart, Sector, Label } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
} from '@/components/ui/chart'

interface DonutChartCardProps {
  data: Record<string, number>
  title?: string
  description?: string
  onSelectCategory?: (label: string) => void
  /** 'sm' | 'md' | 'lg' (default 'md') controls chart & legend sizing */
  size?: 'sm' | 'md' | 'lg'
}

export function DonutChartCard({
  data,
  title = 'SMA Account Distribution',
  description = 'Interactive Account Category Distribution',
  onSelectCategory,
  size = 'md',
}: DonutChartCardProps) {
  const chartId = 'interactive-donut-modern'

  const entries = React.useMemo(
    () => Object.entries(data ?? {}).filter(([, v]) => Number.isFinite(v)),
    [data]
  )

  const total = React.useMemo(
    () => entries.reduce((s, [, v]) => s + (v || 0), 0),
    [entries]
  )

  const chartData = React.useMemo(
    () =>
      entries.map(([label, value], index) => ({
        label,
        value,
        percent: total ? (value / total) * 100 : 0,
        fill: `var(--chart-${(index % 12) + 1})`,
      })),
    [entries, total]
  )

  const chartConfig = React.useMemo(() => {
    return Object.fromEntries(
      entries.map(([key], index) => [
        key,
        { label: key, color: `hsl(var(--chart-${(index % 12) + 1}))` },
      ])
    )
  }, [entries]) satisfies ChartConfig

  const [activeKey, setActiveKey] = React.useState(
    chartData.length > 0 ? chartData[0].label : ''
  )

  React.useEffect(() => {
    if (!chartData.length) {
      setActiveKey('')
      return
    }
    const exists = chartData.some((d) => d.label === activeKey)
    if (!exists) setActiveKey(chartData[0].label)
  }, [chartData, activeKey])

  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.label === activeKey),
    [activeKey, chartData]
  )

  if (!chartData.length || total === 0) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='space-y-1'>
          <CardTitle className='tracking-tight'>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className='flex h-[320px] flex-1 items-center justify-center'>
          <div className='space-y-3 text-center'>
            {/* light stays same; dark just deepens the tones */}
            <div className='mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5'>
              <div className='h-10 w-10 rounded-full bg-white shadow-inner dark:bg-white/10 dark:shadow-none' />
            </div>
            <p className='text-muted-foreground text-sm'>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Chart max width (container cap) — keep light layout the same;
  // we add an inline style so Tailwind doesn't strip the dynamic class.
  const chartMax = size === 'lg' ? 420 : size === 'sm' ? 200 : 380

  // Donut radii — unchanged (preserves layout)
  const innerRadius = size === 'lg' ? 160 : size === 'sm' ? 60 : 120
  const outerRadius = size === 'lg' ? 220 : size === 'sm' ? 80 : 160

  // Halo effect — unchanged
  const haloOuter = outerRadius + (size === 'lg' ? 36 : size === 'sm' ? 18 : 24)
  const haloInner = outerRadius + (size === 'lg' ? 20 : size === 'sm' ? 10 : 14)

  return (
    <Card data-chart={chartId} className='flex flex-col'>
      <ChartStyle id={chartId} config={chartConfig} />

      {/* Header */}
      <CardHeader className='gap-3 pb-2'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <CardTitle
              className={cn('truncate', size === 'lg' ? 'text-2xl' : 'text-xl')}
            >
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className='truncate'>
                {description}
              </CardDescription>
            ) : null}
          </div>

          {/* Total pill — light unchanged; dark adds subtle contrast */}
          <div className='text-muted-foreground shrink-0 rounded-full border bg-white px-3 py-1 text-xs md:text-sm dark:border-white/10 dark:bg-white/10 dark:text-white/80'>
            Total:{' '}
            <span className='text-foreground font-medium tabular-nums dark:text-white'>
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent
        className={cn(
          'grid items-center gap-6',
          size === 'lg' ? 'md:grid-cols-12' : 'md:grid-cols-11'
        )}
      >
        {/* Chart column */}
        <div
          className={cn(
            size === 'lg' ? 'md:col-span-6' : 'md:col-span-5',
            'flex justify-center'
          )}
        >
          <ChartContainer
            id={chartId}
            config={chartConfig}
            className={cn(
              'mx-auto aspect-square w-full',
              `max-w-[${chartMax}px]`
            )}
            style={{ maxWidth: chartMax }} // keeps layout; ensures cap works
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]
                  const raw = p.value as number | string
                  const num = typeof raw === 'number' ? raw : Number(raw)
                  const pct =
                    Number.isFinite(num) && total > 0
                      ? ` (${((num / total) * 100).toFixed(1)}%)`
                      : ''

                  return (
                    <div className='min-w-[180px] rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/30'>
                      <div className='flex items-center justify-between gap-6'>
                        <span className='font-medium'>
                          {String(p.name ?? '')}
                        </span>
                        <span className='tabular-nums'>
                          {Number.isFinite(num)
                            ? num.toLocaleString()
                            : String(raw ?? '')}
                          <span className='text-muted-foreground'>{pct}</span>
                        </span>
                      </div>
                    </div>
                  )
                }}
              />

              <Pie
                data={chartData}
                dataKey='value'
                nameKey='label'
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                strokeWidth={6}
                activeIndex={activeIndex}
                isAnimationActive
                animationDuration={3000}
                onClick={(_, index) => {
                  const label = chartData[index]?.label
                  if (label) {
                    setActiveKey(label)
                    onSelectCategory?.(label)
                  }
                }}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    {/* slice highlight */}
                    <Sector {...props} outerRadius={outerRadius + 8} />
                    {/* soft outer halo */}
                    <Sector
                      {...props}
                      outerRadius={haloOuter}
                      innerRadius={haloInner}
                      opacity={0.18}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      const active = chartData[activeIndex]
                      const cx = Number(viewBox.cx)
                      const cy = Number(viewBox.cy)
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor='middle'
                          dominantBaseline='middle'
                        >
                          <tspan
                            x={cx}
                            y={cy - 2}
                            className={cn(
                              'fill-foreground font-semibold tabular-nums',
                              size === 'lg'
                                ? 'text-4xl'
                                : size === 'sm'
                                  ? 'text-2xl'
                                  : 'text-3xl'
                            )}
                          >
                            {active?.value.toLocaleString()}
                          </tspan>
                          <tspan
                            x={cx}
                            y={cy + (size === 'lg' ? 20 : 18)}
                            className='fill-muted-foreground text-xs'
                          >
                            {active?.label}
                          </tspan>
                          <tspan
                            x={cx}
                            y={cy + (size === 'lg' ? 36 : 32)}
                            className='fill-muted-foreground text-[11px]'
                          >
                            {total > 0
                              ? `${active?.percent.toFixed(1)}% of total`
                              : ''}
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Legend column */}
        <div className={cn(size === 'lg' ? 'md:col-span-6' : 'md:col-span-6')}>
          <ul
            className={cn(
              'grid gap-2.5',
              size === 'lg' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            )}
          >
            {chartData.map((d, i) => {
              const isActive = d.label === activeKey
              const barPct = Math.max(4, Math.min(100, d.percent)) // min bar visibility
              return (
                <li key={d.label}>
                  <button
                    type='button'
                    onClick={() => {
                      setActiveKey(d.label)
                      onSelectCategory?.(d.label)
                    }}
                    className={cn(
                      // light: unchanged
                      'w-full rounded-xl border bg-gray-50 p-3 text-left transition hover:bg-gray-100',
                      'border-gray-100',
                      // dark: improved contrast & focus
                      'dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]',
                      'focus-visible:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none dark:ring-offset-0',
                      isActive &&
                        'border-foreground/30 ring-foreground/20 dark:ring-foreground/30 ring-2 ring-offset-1'
                    )}
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className='h-3.5 w-3.5 shrink-0 rounded-sm'
                        style={{
                          backgroundColor: `var(--chart-${(i % 12) + 1})`,
                        }}
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='truncate text-sm font-medium'>
                            {d.label}
                          </span>
                          <span className='shrink-0 text-sm tabular-nums'>
                            {d.value.toLocaleString()}
                            <span className='text-muted-foreground ml-1 text-[11px]'>
                              ({d.percent.toFixed(1)}%)
                            </span>
                          </span>
                        </div>

                        {/* mini progress bar */}
                        <div className='mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/15'>
                          <div
                            className='h-1.5 rounded-full'
                            style={{
                              width: `${barPct}%`,
                              backgroundColor: `var(--chart-${(i % 12) + 1})`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
