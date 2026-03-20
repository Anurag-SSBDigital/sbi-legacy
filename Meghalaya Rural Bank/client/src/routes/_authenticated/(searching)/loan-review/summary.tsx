import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Select, { MultiValue } from 'react-select'
import LoadingBar from 'react-top-loading-bar'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import { AccountNoCell, CurrencyCell } from '@/components/table/cells.ts'
import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

// --- Route ----
export const Route = createFileRoute(
  '/_authenticated/(searching)/loan-review/summary'
)({
  component: RouteComponent,
})

/** API DTO (mirrors Java EligibleCustomerDTO) */
type EligibleCustomer = {
  acctNo: string
  custName: string
  branchCode: string
  loanLimit: number
  sanctDt: string // 'YYYY-MM-DD'
  closingDt: string // 'YYYY-MM-DD'
  reviewDone: boolean
  latestReviewDate: string | null
  createdBy: string | null
  updatedBy: string | null
}

type BranchOption = { value: string; label: string }

// Build columns with branch name mapping
function makeColumns(
  codeToName: Record<string, string | undefined>,
  tab: string
): PaginatedTableProps<EligibleCustomer>['columns'] {
  const baseCols: PaginatedTableProps<EligibleCustomer>['columns'] = [
    {
      key: 'acctNo',
      label: 'Account No',
      render: (value) =>
        value ? <AccountNoCell value={String(value)} /> : '-',
    },
    {
      key: 'custName',
      label: 'Customer Name',
      render: (value) => <span className='font-semibold'>{value}</span>,
    },
    {
      key: 'branchCode',
      label: 'Branch',
      render: (value) => (
        <span>{codeToName[String(value)] || String(value) || '-'}</span>
      ),
    },
    {
      key: 'loanLimit',
      label: 'Loan Limit',
      render: (value) => <CurrencyCell value={String(value ?? 0)} />,
    },
    {
      key: 'sanctDt',
      label: 'Opening Date',
      render: (value) => <span>{formatDate(value)}</span>,
    },
  ]

  if (tab === 'reviewed') {
    baseCols.push({
      key: 'latestReviewDate',
      label: 'Latest Review',
      render: (value) => <span>{value ? formatDate(value) : '-'}</span>,
    })
  }

  return baseCols
}

function RouteComponent() {
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selectedTab, setSelectedTab] = useState<string>('eligible')

  const [minLimit, setMinLimit] = useState('')
  const [maxLimit, setMaxLimit] = useState('')
  const [selectedBranches, setSelectedBranches] = useState<
    MultiValue<BranchOption>
  >([])

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  // get branches (id -> name)
  const { data: branchData, isLoading: branchDataLoading } = $api.useQuery(
    'get',
    '/branches/get',
    { params: { header: { Authorization: '' } } }
  )
  // branchData?: { id: string; name: string }[]

  const { data, isLoading, isError, error } = $api.useQuery(
    'get',
    '/loan-review/customers/eligible',
    {
      params: {
        query: { branchId: branchId === 'all' ? undefined : branchId },
        header: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
        },
      },
    }
  ) as unknown as {
    data: EligibleCustomer[]
    isLoading: boolean
    isError: boolean
    error: boolean
  }

  // code -> name map
  const branchNameByCode = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    ;(
      branchData?.data as unknown as {
        branchCode: string
        branchName: string
      }[]
    )?.forEach(
      (b: { branchCode: string; branchName: string }) =>
        (map[b.branchCode] = b.branchName)
    )
    return map
  }, [branchData])

  // options for multi-select (use available payload branches, show names)
  const branchOptions = useMemo<BranchOption[]>(() => {
    const set = new Set<string>()
    data?.forEach((d) => d.branchCode && set.add(d.branchCode))
    return Array.from(set)
      .sort()
      .map((code) => ({ value: code, label: branchNameByCode[code] ?? code }))
  }, [data, branchNameByCode])

  // stats for placeholders
  const limitStats = useMemo(() => {
    const vals = (data ?? [])
      .map((d) => Number(d.loanLimit))
      .filter((n) => Number.isFinite(n))
    const min = vals.length ? Math.min(...vals) : 0
    const max = vals.length ? Math.max(...vals) : 0
    return { min, max }
  }, [data])

  // base filtering (search + limits + branch multiselect)
  const filtered = useMemo(() => {
    let rows = data ? [...data] : []

    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter((r) =>
        [r.acctNo, r.custName, r.branchCode].join(' ').toLowerCase().includes(q)
      )
    }

    if (minLimit) {
      const min = Number(minLimit)
      if (!Number.isNaN(min))
        rows = rows.filter((r) => Number(r.loanLimit) >= min)
    }
    if (maxLimit) {
      const max = Number(maxLimit)
      if (!Number.isNaN(max))
        rows = rows.filter((r) => Number(r.loanLimit) <= max)
    }

    if (selectedBranches.length > 0) {
      const set = new Set(selectedBranches.map((b) => b.value))
      rows = rows.filter((r) => r.branchCode && set.has(r.branchCode))
    }

    return rows
  }, [data, query, minLimit, maxLimit, selectedBranches])

  // split into tabs
  const eligibleRows = useMemo(
    () => filtered.filter((r) => !r.reviewDone),
    [filtered]
  )
  const reviewedRows = useMemo(
    () => filtered.filter((r) => r.reviewDone),
    [filtered]
  )

  const columns = useMemo(
    () => makeColumns(branchNameByCode, selectedTab),
    [branchNameByCode, selectedTab]
  )

  const handleApplyFilters = () => {
    const min = Number(minLimit)
    const max = Number(maxLimit)
    if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      alert('Minimum limit cannot be greater than maximum limit.')
      return
    }
    setFiltersOpen(false)
  }

  return (
    <MainWrapper
      extra={
        isBranchDropdownVisible ? (
          <BranchSelector value={branchId} setValue={setBranchId} />
        ) : null
      }
    >
      <LoadingBar progress={isLoading ? 70 : 100} color='#2998ff' height={3} />

      {isLoading ? (
        <Card className='col-span-full space-y-4 p-6 shadow-lg'>
          <Skeleton className='h-8 w-1/3 rounded-md' />
          <div className='flex gap-3'>
            <Skeleton className='h-10 w-1/3 rounded-md' />
            <Skeleton className='h-10 w-24 rounded-md' />
          </div>
          <div className='mt-4 space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center gap-6'>
                <Skeleton className='h-6 w-1/6 rounded-md' />
                <Skeleton className='h-6 w-1/6 rounded-md' />
                <Skeleton className='h-6 w-1/6 rounded-md' />
                <Skeleton className='h-6 w-1/6 rounded-md' />
                <Skeleton className='h-6 w-1/12 rounded-md' />
              </div>
            ))}
          </div>
        </Card>
      ) : isError ? (
        <div className='py-10 text-center text-red-500'>
          Error fetching data: {(error as unknown as Error)?.message}
        </div>
      ) : !data || data.length === 0 ? (
        <div className='py-10 text-center text-gray-500'>
          No eligible customers for this branch.
        </div>
      ) : (
        <Card className='col-span-full shadow-lg'>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
            <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
              Loan Review
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Search by account, name, branch...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='max-w-sm border-gray-300 focus:border-blue-500'
                aria-label='Search eligible customers'
              />
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    className='border-gray-300 hover:bg-gray-100'
                  >
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-xl'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                      Filter Eligible Customers
                    </DialogTitle>
                  </DialogHeader>

                  <div className='grid gap-6 py-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='branch-multiselect'>Branches</Label>
                      <Select
                        id='branch-multiselect'
                        isMulti
                        options={branchOptions}
                        value={selectedBranches}
                        onChange={(opts) => setSelectedBranches(opts || [])}
                        placeholder={
                          branchDataLoading
                            ? 'Loading branches...'
                            : 'Select branches...'
                        }
                        className='basic-multi-select'
                        classNamePrefix='select'
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: 'hsl(var(--input))',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            '&:hover': { borderColor: 'hsl(var(--ring))' },
                          }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>

                    <div className='grid gap-1'>
                      <Label htmlFor='minLimit' className='text-gray-700'>
                        Min Loan Limit{' '}
                        <span className='text-xs text-gray-500'>
                          (min: {limitStats.min})
                        </span>
                      </Label>
                      <Input
                        id='minLimit'
                        type='number'
                        value={minLimit}
                        onChange={(e) => setMinLimit(e.target.value)}
                        placeholder={`${limitStats.min}`}
                        className='border-gray-300 focus:border-blue-500'
                      />
                    </div>

                    <div className='grid gap-1'>
                      <Label htmlFor='maxLimit' className='text-gray-700'>
                        Max Loan Limit{' '}
                        <span className='text-xs text-gray-500'>
                          (max: {limitStats.max})
                        </span>
                      </Label>
                      <Input
                        id='maxLimit'
                        type='number'
                        value={maxLimit}
                        onChange={(e) => setMaxLimit(e.target.value)}
                        placeholder={`${limitStats.max}`}
                        className='border-gray-300 focus:border-blue-500'
                      />
                    </div>
                  </div>

                  <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
                    <Button
                      variant='ghost'
                      onClick={() => {
                        setSelectedBranches([])
                        setMinLimit('')
                        setMaxLimit('')
                      }}
                      className='text-gray-500 hover:text-gray-700'
                    >
                      Clear Filters
                    </Button>
                    <Button onClick={handleApplyFilters} className='text-white'>
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className='px-6'>
            <Tabs
              defaultValue='eligible'
              value={selectedTab}
              onValueChange={setSelectedTab}
            >
              <TabsList className='mb-4'>
                <TabsTrigger value='eligible'>
                  Eligible for Review ({eligibleRows.length})
                </TabsTrigger>
                <TabsTrigger value='reviewed'>
                  Reviewed ({reviewedRows.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='eligible'>
                <PaginatedTable
                  frameless
                  showSearch={false}
                  data={eligibleRows}
                  columns={columns}
                  emptyMessage='No eligible customers to show.'
                  renderActions={(row) =>
                    row.acctNo ? (
                      <Link
                        to='/loan-review/$accountId'
                        params={{ accountId: row.acctNo }}
                      >
                        <Button
                          variant='outline'
                          className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                        >
                          Review
                        </Button>
                      </Link>
                    ) : null
                  }
                />
              </TabsContent>

              <TabsContent value='reviewed'>
                <PaginatedTable
                  frameless
                  showSearch={false}
                  data={reviewedRows}
                  columns={columns}
                  emptyMessage='No reviewed customers to show.'
                  renderActions={(row) =>
                    row.acctNo ? (
                      <Link
                        to='/loan-review/$accountId'
                        params={{ accountId: row.acctNo }}
                      >
                        <Button
                          variant='outline'
                          className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                        >
                          Open
                        </Button>
                      </Link>
                    ) : null
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </MainWrapper>
  )
}

/** Helpers */
function formatDate(d?: string | null) {
  if (!d) return '-'
  try {
    const [y, m, day] = d.split('-').map((x) => parseInt(x, 10))
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1))
    return dt.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}
