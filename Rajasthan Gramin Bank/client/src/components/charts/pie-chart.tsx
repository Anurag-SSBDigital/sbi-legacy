// Added for AlertSummaryCard
import { useState } from 'react'
import { components } from '@/types/api/v1.js'
import { AlertTriangle, Bell, Info } from 'lucide-react'
// Assuming this path is correct
import {
  Cell,
  Legend,
  // Added for Donut Chart legends
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
// Removed unused Bar, BarChart, XAxis, YAxis from this specific snippet for clarity
// If used elsewhere, they should remain in the actual file.

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Added icons

// ---------- Types ----------
type DashboardCombinedData = components['schemas']['DashboardCombinedData']
type AlertCountDto = components['schemas']['AlertCountDto']

// ---------- Reusable Table Component with Pagination ----------
interface PaginatedTableProps<T extends object> {
  data: T[]
  columns: { key: keyof T; label: string }[]
  rowsPerPage?: number
  emptyMessage?: string
}

function PaginatedTable<T extends object>({
  data,
  columns,
  rowsPerPage = 5,
  emptyMessage = 'No data available',
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(data.length / rowsPerPage)
  const paginatedData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {String(row[col.key] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------- Donut Chart Card Component ----------
interface DonutChartCardProps {
  data: Record<string, number>
  title?: string
}

function DonutChartCard({
  data,
  title = 'SMA Account Distribution',
}: DonutChartCardProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }))

  const colors = [
    '#1E88E5', // Blue
    '#F4511E', // Deep Orange
    '#43A047', // Green
    '#FB8C00', // Orange
    '#8E24AA', // Purple
    '#D81B60', // Pink
    '#00ACC1', // Cyan
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={60} // Creates the donut hole
                outerRadius={100} // Adjust as needed
                dataKey='value'
                nameKey='name'
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                }) => {
                  const RADIAN = Math.PI / 180
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.7 // Adjust label position
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)
                  if (percent * 100 < 5) return null // Hide label if too small
                  return (
                    <text
                      x={x}
                      y={y}
                      fill='white'
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline='central'
                      fontSize='12px'
                      fontWeight='bold'
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  )
                }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} Accounts`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                verticalAlign='bottom'
                height={36}
                iconSize={10}
                wrapperStyle={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-[300px] flex-col items-center justify-center text-center'>
            <Info className='text-muted-foreground mb-2 h-12 w-12' />
            <p className='text-muted-foreground'>
              No data available for chart.
            </p>
            <p className='text-muted-foreground text-xs'>
              Once data is present, it will be displayed here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Beautified Alert Summary Card Component ----------
interface AlertSummaryCardProps {
  data: AlertCountDto[]
  title?: string
}

function AlertSummaryCard({
  data,
  title = 'Offline Alerts',
}: AlertSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Bell className='text-primary mr-2 h-5 w-5' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className='space-y-3'>
            {data.map((alert, i) => (
              <div
                key={i}
                className='bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors'
              >
                <div className='flex items-center'>
                  <AlertTriangle className='text-destructive mr-3 h-4 w-4' />
                  <span className='text-foreground text-sm font-medium'>
                    {alert.point}
                  </span>
                </div>
                <Badge variant='destructive' className='text-xs'>
                  {alert.count}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Bell className='text-muted-foreground mb-2 h-12 w-12' />
            <p className='text-muted-foreground text-sm'>
              No offline alerts at the moment.
            </p>
            <p className='text-muted-foreground text-xs'>
              All systems nominal or alerts cleared.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Main Dashboard Component ----------
interface DashboardProps {
  dashboardData: DashboardCombinedData
}

export default function Dashboard({ dashboardData }: DashboardProps) {
  return (
    <div className='grid gap-4 p-4 md:grid-cols-2 md:gap-6 md:p-6 lg:grid-cols-3'>
      {dashboardData.pieChart && ( // This prop name might need updating if it's now a donut chart semantically
        <DonutChartCard
          data={dashboardData.pieChart}
          title='SMA Account Distribution'
        />
      )}
      {dashboardData.offlineAlertsCount && (
        <AlertSummaryCard data={dashboardData.offlineAlertsCount} />
      )}

      {dashboardData.npaTurningTable && (
        <Card className='col-span-full'>
          <CardHeader>
            <CardTitle>NPA Turning Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <PaginatedTable
              data={dashboardData.npaTurningTable}
              columns={[
                { key: 'acctNo', label: 'Account No' },
                { key: 'custName', label: 'Customer Name' },
                { key: 'outstand', label: 'Outstanding' },
                { key: 'irregAmt', label: 'Irregular Amount' },
                { key: 'irrgDt', label: 'Irregular Date' },
                { key: 'newIrac', label: 'New IRAC' },
              ]}
              emptyMessage='No NPA turning accounts to display.'
            />
          </CardContent>
        </Card>
      )}

      {dashboardData.actionDueTable && (
        <Card className='col-span-full'>
          <CardHeader>
            <CardTitle>Action Due Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <PaginatedTable
              data={dashboardData.actionDueTable}
              columns={[
                { key: 'acctNo', label: 'Account No' },
                { key: 'custName', label: 'Customer Name' },
                { key: 'segement', label: 'Segment' },
                { key: 'outstand', label: 'Outstanding' },
                { key: 'irregAmt', label: 'Irregular Amount' },
                { key: 'irrgDt', label: 'Irregular Date' },
                { key: 'newIrac', label: 'New IRAC' },
                { key: 'branchCode', label: 'Branch Code' },
              ]}
              emptyMessage='No action due accounts to display.'
            />
          </CardContent>
        </Card>
      )}

      {dashboardData.noActionTable && (
        <Card className='col-span-full'>
          <CardHeader>
            <CardTitle>No Action Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <PaginatedTable
              data={dashboardData.noActionTable}
              columns={[
                { key: 'acctNo', label: 'Account No' },
                { key: 'custName', label: 'Customer Name' },
                { key: 'segement', label: 'Segment' },
                { key: 'outstand', label: 'Outstanding' },
                { key: 'irregAmt', label: 'Irregular Amount' },
                { key: 'irrgDt', label: 'Irregular Date' },
                { key: 'newIrac', label: 'New IRAC' },
                { key: 'branchCode', label: 'Branch Code' },
              ]}
              emptyMessage='No accounts with no action to display.'
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
