'use client'

import { useState, useMemo, useCallback } from 'react'
import { DialogClose } from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { Eye, X } from 'lucide-react'
import { $api } from '@/lib/api.ts'
import { iracToCategory } from '@/lib/helpers.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PaginatedTable from '@/components/paginated-table.tsx'
import { AccountNoCell, CurrencyCell } from '@/components/table/cells.ts'
import { DonutChartCard } from './donut-chart.tsx'
import { DynamicPieChart } from './pie-chart.tsx'

// -------- Types from your API schema --------
type DashboardCombinedData = components['schemas']['DashboardCombinedData']

interface DashboardProps {
  dashboardData: DashboardCombinedData
  /** Optional: prefix API base URL like https://api.example.com (not used when calling $api) */
  apiBaseUrl?: string
  branchId?: string
}

// ---- Local types & helpers ----
type Category = 'SMA0' | 'SMA1' | 'SMA2' | 'STANDARD' | 'NPA'

interface AccountRow {
  acctNo?: string
  custName?: string
  segement?: string
  segment?: string
  outstand?: string | number
  irregAmt?: string | number
  irrgDt?: string
  newIrac?: string | number
  branchCode?: string
  [k: string]: unknown
}

const endpointMap: Record<Category, string> = {
  SMA0: '/account/SMA0_Accounts',
  SMA1: '/account/SMA1_Accounts',
  SMA2: '/account/SMA2_Accounts',
  STANDARD: '/account/StandardAccounts',
  NPA: '/account/NPA_Accounts',
}

function iracLabelToCategory(label: string): Category | null {
  const s = label.trim().toLowerCase()
  if (['sma0', 'sma-0', 'sma 0'].includes(s)) return 'SMA0'
  if (['sma1', 'sma-1', 'sma 1'].includes(s)) return 'SMA1'
  if (['sma2', 'sma-2', 'sma 2'].includes(s)) return 'SMA2'
  if (['standard', 'std', 'standard accounts'].includes(s)) return 'STANDARD'
  if (['npa', 'npa accounts'].includes(s)) return 'NPA'
  return null
}

function normalizeAccountResponse(data: unknown): AccountRow[] {
  if (Array.isArray(data)) return data as AccountRow[]
  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: AccountRow[] }).data
  }
  return []
}

// -------- Small dialog to show fetched rows --------
function AccountDetailsDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  rows: AccountRow[]
  loading?: boolean
  error?: string | null
}) {
  const { open, onOpenChange, title, rows, loading, error } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-6xl overflow-hidden p-0'>
        <div className='flex max-h-[95vh] flex-col'>
          <DialogHeader className='bg-background/80 sticky top-0 z-10 border-b px-4 py-2 backdrop-blur'>
            <div className='flex items-center justify-between'>
              <DialogTitle>{title}</DialogTitle>
              <DialogClose
                aria-label='Close'
                className='text-muted-foreground hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md border'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className='flex-1 overflow-auto px-2 pt-2 pb-2'>
            {loading ? (
              <div className='text-muted-foreground py-8 text-center text-sm'>
                Loading…
              </div>
            ) : error ? (
              <div className='py-8 text-center text-sm text-red-600'>
                {error}
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <PaginatedTable
                  tableTitle=''
                  data={rows}
                  renderActions={(row) => {
                    const iracNum = toIracNumber(row.newIrac)
                    return iracNum !== undefined && row.acctNo ? (
                      <Link
                        to='/$category/summary/$accountId'
                        params={{
                          category: iracToCategory(iracNum),
                          accountId: row.acctNo,
                        }}
                      >
                        <Button variant='outline'>
                          <Eye className='h-4 w-4' /> View
                        </Button>
                      </Link>
                    ) : null
                  }}
                  columns={[
                    {
                      key: 'acctNo',
                      label: 'Account No',
                      render: (v) => <AccountNoCell value={v as string} />,
                    },
                    { key: 'custName', label: 'Customer Name' },
                    {
                      key: 'outstand',
                      label: 'Outstanding',
                      render: (v) => <CurrencyCell value={String(v ?? '')} />,
                    },
                  ]}
                  emptyMessage='No accounts found for this category.'
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -------- Main Dashboard --------
export default function Dashboard({ dashboardData, branchId }: DashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState<string>('Accounts')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )

  // Keep a stable path for the hook; we toggle with `enabled`
  const activePath = useMemo(
    () => (selectedCategory ? endpointMap[selectedCategory] : endpointMap.SMA0),
    [selectedCategory]
  )

  // Use your $api.useQuery wrapper (NOT tanstack directly)
  const {
    data: accountsRaw,
    isLoading: accountsLoading,
    error: accountsError,
  } = $api.useQuery(
    'get',
    activePath as '/account/SMA0_Accounts',
    {
      // If your API expects auth header here, pass it as in your other components:
      params: {
        header: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        query: { id: branchId },
      },
    },
    {
      enabled: dialogOpen && !!selectedCategory,
      // You can also set staleTime/keepPreviousData here if your wrapper forwards them
      // staleTime: 5 * 60 * 1000,
      // keepPreviousData: true,
    }
  )

  const dialogRows = useMemo(
    () => normalizeAccountResponse(accountsRaw),
    [accountsRaw]
  )

  const handleDonutSelect = useCallback((label: string) => {
    const cat = iracLabelToCategory(label)
    if (!cat) return
    setDialogTitle(`Accounts: ${label}`)
    setSelectedCategory(cat)
    setDialogOpen(true)
  }, [])

  return (
    <>
      <div className='p-8'>
        {/* Pie Chart: Responsive on all screens */}
        {dashboardData.pieChart && (
          <div className='w-full'>
            <DonutChartCard
              data={dashboardData.pieChart}
              title='Account Distribution'
              onSelectCategory={handleDonutSelect}
            />
          </div>
        )}

        {/* Interactive Chart */}
        <div className='mt-4 mb-4 w-full'>
          <DynamicPieChart
            title='Account Distribution'
            data={[
              {
                name: 'Action Pending Accounts',
                value: (dashboardData.noActionTable || []).length,
                color: 'var(--chart-1)',
              },
              {
                name: 'Action Due Accounts',
                value: (dashboardData.actionDueTable || []).length,
                color: 'var(--chart-2)',
              },
              {
                name: 'Turning NPA Accounts',
                value: (dashboardData.npaTurningTable || []).length,
                color: 'var(--chart-3)',
              },
            ]}
          />
        </div>

        {dashboardData.actionDueTable &&
          dashboardData.actionDueTable.length > 0 && (
            <div className='col-span-1 md:col-span-2'>
              <PaginatedTable<AccountRow>
                tableTitle='Actions Due Account'
                data={dashboardData.actionDueTable as AccountRow[]}
                renderActions={(row: AccountRow) => {
                  const iracNum = toIracNumber(row.newIrac)
                  return iracNum !== undefined && row.acctNo ? (
                    <Link
                      to='/$category/summary/$accountId'
                      params={{
                        category: iracToCategory(iracNum),
                        accountId: row.acctNo,
                      }}
                    >
                      <Button variant='outline'>
                        <Eye className='h-4 w-4' /> View
                      </Button>
                    </Link>
                  ) : null
                }}
                columns={[
                  {
                    key: 'acctNo',
                    label: 'Account No',
                    render: (v) => <AccountNoCell value={v as string} />,
                  },
                  { key: 'custName', label: 'Customer Name' },
                  { key: 'segement', label: 'Segment' },
                  {
                    key: 'outstand',
                    label: 'Outstanding',
                    render: (value) => <CurrencyCell value={String(value)} />,
                  },
                ]}
                emptyMessage='No action due accounts to display.'
              />
            </div>
          )}

        {dashboardData.noActionTable &&
          dashboardData.noActionTable.length > 0 && (
            <div className='col-span-1 md:col-span-2'>
              <PaginatedTable<AccountRow>
                tableTitle='No Action Accounts'
                data={dashboardData.noActionTable as AccountRow[]}
                columns={[
                  {
                    key: 'acctNo',
                    label: 'Account No',
                    render: (v) => <AccountNoCell value={v as string} />,
                  },
                  { key: 'custName', label: 'Customer Name' },
                  { key: 'segement', label: 'Segment' },
                  {
                    key: 'outstand',
                    label: 'Outstanding',
                    render: (value) => <CurrencyCell value={String(value)} />,
                  },
                ]}
                renderActions={(row: AccountRow) => {
                  const iracNum = toIracNumber(row.newIrac)
                  return iracNum !== undefined && row.acctNo ? (
                    <Link
                      to='/$category/summary/$accountId'
                      params={{
                        category: iracToCategory(iracNum),
                        accountId: row.acctNo,
                      }}
                    >
                      <Button variant='outline'>
                        <Eye className='h-4 w-4' /> View
                      </Button>
                    </Link>
                  ) : null
                }}
                emptyMessage='No accounts with no action to display.'
              />
            </div>
          )}

        {dashboardData.npaTurningTable &&
          dashboardData.npaTurningTable.length > 0 && (
            <div className='col-span-1 md:col-span-2'>
              <PaginatedTable<AccountRow>
                tableTitle='NPA Turning Accounts'
                data={dashboardData.npaTurningTable as AccountRow[]}
                columns={[
                  {
                    key: 'acctNo',
                    label: 'Account No',
                    render: (v) => <AccountNoCell value={v as string} />,
                  },
                  { key: 'custName', label: 'Customer Name' },
                  {
                    key: 'outstand',
                    label: 'Outstanding',
                    render: (value) => <CurrencyCell value={String(value)} />,
                  },
                ]}
                emptyMessage='No NPA turning accounts to display.'
                renderActions={(row: AccountRow) => {
                  const iracNum = toIracNumber(row.newIrac)
                  return iracNum !== undefined && row.acctNo ? (
                    <Link
                      to='/$category/summary/$accountId'
                      params={{
                        category: iracToCategory(iracNum),
                        accountId: row.acctNo,
                      }}
                    >
                      <Button variant='outline'>
                        <Eye className='h-4 w-4' /> View
                      </Button>
                    </Link>
                  ) : null
                }}
              />
            </div>
          )}
      </div>

      <AccountDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        rows={dialogRows}
        loading={accountsLoading}
        error={
          accountsError
            ? ((accountsError as unknown as Error)?.message ?? 'Error')
            : null
        }
      />
    </>
  )
}

function toIracNumber(
  v: string | number | undefined | null
): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    const n = Number(v.trim())
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}
