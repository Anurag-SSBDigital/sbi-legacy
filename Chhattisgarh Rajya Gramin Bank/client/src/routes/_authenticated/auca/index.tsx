import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
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
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx'
import { Home } from '@/components/breadcrumb/common-crumbs.ts'
import { Header } from '@/components/layout/header.tsx'
import { Main } from '@/components/layout/main.tsx'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown.tsx'
import { Search } from '@/components/search.tsx'
import {
  AccountNoCell,
  CurrencyCell,
  TooltipCell,
} from '@/components/table/cells.ts'
import { ThemeSwitch } from '@/components/theme-switch.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector'

// ========= Types =========

type AucaAccountRow = {
  acctNo: string // <-- required to fix TS error
  custName?: string
  telNo?: string
  outstand?: number
  add4?: string
  newIrac?: number
}

type AucaAccountDetails = {
  acctNo: string // <-- required
  acctDesc?: string
  custNumber?: string
  telNo?: string
  segement?: string
  custName?: string
  add1?: string
  add2?: string
  add3?: string
  add4?: string
  loanLimit?: number
  intRate?: number
  theoBal?: number
  outstand?: number
  irregAmt?: number
  sanctDt?: string
  emisDue?: number
  emisPaid?: number
  emisOvrdue?: number
  newIrac?: number
  oldIrac?: number
  arrCond?: number
  currency?: string
  maintBr?: number
  instalAmt?: number
  irrgDt?: string
  unrealInt?: number
  accrInt?: number
  stress?: string
  smaCodeIncipientStress?: string
  ra?: string
  raDate?: string
  writeOffFlag?: string
  writeOffAmount?: number
  writeOffDate?: string
  branchCode?: string
  crmDone?: boolean
  actType?: string
  npaCd?: string
  pinCode?: string
  compCd?: number
  closingDt?: string
  overduePeriod?: number
  pts?: string
  area?: string
  city?: string
  district?: string
  state?: string
  secuAmt?: number
  advRec?: number
  npaDt?: string
  renewalDt?: string
  dueDt?: string
  aucaEligible?: boolean
  movedByUser?: string
  movedDate?: string
  status?: string // e.g. ELIGIBLE, MOVED_TO_PROPOSAL
}

// ========= Columns =========

const columns: PaginatedTableProps<AucaAccountRow>['columns'] = [
  {
    key: 'acctNo',
    label: 'Account No',
    render: (value) =>
      value ? <AccountNoCell value={`${value}`} /> : <span>-</span>,
  },
  {
    key: 'custName',
    label: 'Customer Name',
    render: (value) => <span className='font-semibold'>{value ?? '-'}</span>,
  },
  {
    key: 'telNo',
    label: 'Mobile No.',
    render: (value) => <TooltipCell value={String(value ?? '-')} />,
  },
  {
    key: 'outstand',
    label: 'Outstanding',
    render: (value) => <CurrencyCell value={String(value ?? 0)} />,
  },
  // {
  //   key: 'add4',
  //   label: 'City',
  //   render: (value) => <span>{value ?? '-'}</span>,
  // },
] as const

// ========= Route =========

export const Route = createFileRoute('/_authenticated/auca/')({
  component: RouteComponent,
})

function RouteComponent() {
  const canMarkEligible = useCanAccess('auca', 'mark_eligible')

  const [branchId, setBranchId] = useState<string | undefined>(undefined)

  const [queryAbove] = useState('')
  const [queryBelow, setQueryBelow] = useState('')

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] =
    useState<AucaAccountDetails | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isMarkingEligible, setIsMarkingEligible] = useState(false)

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const authHeader = {
    Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
  }

  // ===== List API: Above 5 Lakh =====
  const {
    data: listResponseAbove,
    isLoading: isLoadingAbove,
    error: errorAbove,
    refetch: refetchAbove,
  } = $api.useQuery('get', '/auca-transfer/accountlist/above5lac', {
    params: {
      header: authHeader,
      query: {
        branchId: !branchId || branchId === 'all' ? 'null' : branchId,
        page: 0,
        size: 1000000000, // fetch all
      },
    },
  })

  // ===== List API: Below 5 Lakh =====
  const {
    data: listResponseBelow,
    isLoading: isLoadingBelow,
    error: errorBelow,
    refetch: refetchBelow,
  } = $api.useQuery('get', '/auca-transfer/accountlist/below5lac', {
    params: {
      header: authHeader,
      query: {
        branchId: !branchId || branchId === 'all' ? 'null' : branchId,
        page: 0,
        size: 1000000000, // fetch all
      },
    },
  })

  const { accountsAbove, totalCountAbove } = useMemo(() => {
    if (!listResponseAbove) {
      return { accountsAbove: [] as AucaAccountRow[], totalCountAbove: 0 }
    }

    const body = listResponseAbove as {
      status?: string
      message?: string
      data?: {
        content?: AucaAccountRow[]
        currentPage?: number
        pageSize?: number
        totalElements?: number
        totalPages?: number
        last?: boolean
      }
    }

    const inner = body.data
    const rows = inner?.content ?? []
    const total = inner?.totalElements ?? rows.length

    return { accountsAbove: rows, totalCountAbove: total }
  }, [listResponseAbove])

  const { accountsBelow, totalCountBelow } = useMemo(() => {
    if (!listResponseBelow) {
      return { accountsBelow: [] as AucaAccountRow[], totalCountBelow: 0 }
    }

    const body = listResponseBelow as {
      status?: string
      message?: string
      data?: {
        content?: AucaAccountRow[]
        currentPage?: number
        pageSize?: number
        totalElements?: number
        totalPages?: number
        last?: boolean
      }
    }

    const inner = body.data
    const rows = inner?.content ?? []
    const total = inner?.totalElements ?? rows.length

    return { accountsBelow: rows, totalCountBelow: total }
  }, [listResponseBelow])

  const outstandingStatsAbove = useMemo(() => {
    const values =
      accountsAbove
        ?.map((d) => Number(d.outstand))
        .filter((val) => !isNaN(val) && isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total, count: values.length }
  }, [accountsAbove])

  const outstandingStatsBelow = useMemo(() => {
    const values =
      accountsBelow
        ?.map((d) => Number(d.outstand))
        .filter((val) => !isNaN(val) && isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total, count: values.length }
  }, [accountsBelow])

  const filteredAbove = useMemo(() => {
    if (!queryAbove) return accountsAbove
    const q = queryAbove.toLowerCase()
    return accountsAbove.filter((row) =>
      [row.acctNo, row.custName, row.telNo, row.add4, row.newIrac, row.outstand]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accountsAbove, queryAbove])

  const filteredBelow = useMemo(() => {
    if (!queryBelow) return accountsBelow
    const q = queryBelow.toLowerCase()
    return accountsBelow.filter((row) =>
      [row.acctNo, row.custName, row.telNo, row.add4, row.newIrac, row.outstand]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accountsBelow, queryBelow])

  // ===== Mutations =====
  const { mutate: fetchAccountDetails } = $api.useMutation(
    'get',
    '/auca-transfer/AucaEligible/{acctNo}'
  )

  const { mutate: markEligible } = $api.useMutation(
    'post',
    '/auca-transfer/EligibleAccount'
  )

  const { mutate: updateStatus } = $api.useMutation(
    'patch',
    '/auca-transfer/update-status/{acctNo}'
  )

  const handleViewDetails = (acctNo: string) => {
    if (!acctNo) return
    setSelectedAccount(null)
    setIsDetailsLoading(true)

    fetchAccountDetails(
      {
        params: {
          path: { acctNo },
        },
      },
      {
        onSuccess: (res) => {
          setIsDetailsLoading(false)

          const body = res as {
            status?: string
            message?: string
            data?: AucaAccountDetails
          }

          if (body.data) {
            setSelectedAccount(body.data)
            setDetailsDialogOpen(true)
          } else {
            toast.error('Invalid response for AUCA account details')
          }
        },
        onError: () => {
          setIsDetailsLoading(false)
          toast.error('Failed to fetch AUCA account details')
        },
      }
    )
  }

  const handleMarkEligible = () => {
    if (!canMarkEligible) {
      toast.error('You do not have permission to mark AUCA eligibility.')
      return
    }

    if (!selectedAccount?.acctNo) {
      toast.error('No account selected')
      return
    }

    setIsMarkingEligible(true)

    // Step 1: POST /auca-transfer/EligibleAccount
    markEligible(
      {
        body: {
          ...selectedAccount,
        },
        params: {
          header: authHeader,
        },
      },
      {
        onSuccess: () => {
          // Step 2: PATCH /auca-transfer/update-status/{acctNo}
          updateStatus(
            {
              params: {
                path: {
                  acctNo: selectedAccount.acctNo,
                },
                header: authHeader,
              },
            },
            {
              onSuccess: () => {
                setIsMarkingEligible(false)
                toast.success(
                  'Account marked as AUCA eligible and status updated.'
                )
                // refresh both lists (account might move out)
                refetchAbove()
                refetchBelow()
                setDetailsDialogOpen(false)
                setSelectedAccount(null)
              },
              onError: () => {
                setIsMarkingEligible(false)
                toast.error(
                  'Eligible status saved but failed to update status.'
                )
              },
            }
          )
        },
        onError: () => {
          setIsMarkingEligible(false)
          toast.error('Failed to mark account as AUCA eligible')
        },
      }
    )
  }

  const progress =
    isLoadingAbove || isLoadingBelow || isDetailsLoading || isMarkingEligible
      ? 70
      : 100

  return (
    <>
      <Header>
        {isBranchDropdownVisible && (
          <BranchSelector value={branchId} setValue={setBranchId} />
        )}
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <LoadingBar progress={progress} color='#2998ff' height={3} />

      <Main className='px-4 py-2'>
        <AppBreadcrumb
          className='p-2'
          crumbs={[Home]}
          currentPage={{
            type: 'label',
            label: 'AUCA Accounts',
          }}
        />

        {/* ========== ABOVE 5 LAKH TABLE ========== */}
        {isLoadingAbove ? (
          <Card className='col-span-full mb-6 space-y-4 p-6 shadow-lg'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='flex space-x-4'>
              <Skeleton className='h-10 w-1/4 rounded-md' />
            </div>
            <div className='mt-4 space-y-3'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center space-x-6'
                  aria-hidden='true'
                >
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/12 rounded-md' />
                </div>
              ))}
            </div>
          </Card>
        ) : errorAbove ? (
          <div className='mb-6 py-10 text-center text-red-500'>
            Error fetching AUCA accounts (Above ₹5 Lakh):{' '}
            {String((errorAbove as Error).message)}
          </div>
        ) : !accountsAbove || accountsAbove.length === 0 ? (
          <div className='mb-6 py-10 text-center text-gray-500'>
            No AUCA accounts above ₹5 Lakh available for this branch.
          </div>
        ) : (
          <Card className='col-span-full mb-6 shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  AUCA Accounts — Above ₹5 Lakh ({filteredAbove.length}{' '}
                  accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total records (server): {totalCountAbove} | Fetched:{' '}
                  {accountsAbove.length} | Total outstanding (sum):{' '}
                  {outstandingStatsAbove.total.toFixed(2)} | Min:{' '}
                  {outstandingStatsAbove.min.toFixed(2)} | Max:{' '}
                  {outstandingStatsAbove.max.toFixed(2)}
                </p>
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable<AucaAccountRow>
                frameless
                showSearch={false}
                data={filteredAbove}
                columns={columns}
                emptyMessage='No AUCA accounts to show.'
                renderActions={(row) => (
                  <Button
                    variant='outline'
                    className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                    onClick={() => handleViewDetails(row.acctNo)}
                  >
                    View
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* ========== BELOW 5 LAKH TABLE ========== */}
        {isLoadingBelow ? (
          <Card className='col-span-full space-y-4 p-6 shadow-lg'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='flex space-x-4'>
              <Skeleton className='h-10 w-1/4 rounded-md' />
            </div>
            <div className='mt-4 space-y-3'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center space-x-6'
                  aria-hidden='true'
                >
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/6 rounded-md' />
                  <Skeleton className='h-6 w-1/12 rounded-md' />
                </div>
              ))}
            </div>
          </Card>
        ) : errorBelow ? (
          <div className='py-10 text-center text-red-500'>
            Error fetching AUCA accounts (Below ₹5 Lakh):{' '}
            {String((errorBelow as Error).message)}
          </div>
        ) : !accountsBelow || accountsBelow.length === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No AUCA accounts below ₹5 Lakh available for this branch.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  AUCA Accounts — Below ₹5 Lakh ({filteredBelow.length}{' '}
                  accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total records (server): {totalCountBelow} | Fetched:{' '}
                  {accountsBelow.length} | Total outstanding (sum):{' '}
                  {outstandingStatsBelow.total.toFixed(2)} | Min:{' '}
                  {outstandingStatsBelow.min.toFixed(2)} | Max:{' '}
                  {outstandingStatsBelow.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='searchAccountsBelow' className='sr-only'>
                  Search AUCA accounts below 5 Lakh
                </Label>
                <Input
                  id='searchAccountsBelow'
                  placeholder='Search by account, name, mobile...'
                  value={queryBelow}
                  onChange={(e) => setQueryBelow(e.target.value)}
                  className='max-w-sm border-gray-300 focus:border-blue-500'
                  aria-label='Search AUCA accounts below 5 Lakh'
                />
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable<AucaAccountRow>
                frameless
                showSearch={false}
                data={filteredBelow}
                columns={columns}
                emptyMessage='No AUCA accounts to show.'
                renderActions={(row) => (
                  <Button
                    variant='outline'
                    className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                    onClick={() => handleViewDetails(row.acctNo)}
                  >
                    View
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Details dialog */}
        <Dialog
          open={detailsDialogOpen}
          onOpenChange={(open) => {
            setDetailsDialogOpen(open)
            if (!open) setSelectedAccount(null)
          }}
        >
          <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-4xl'>
            <DialogHeader className='space-y-1'>
              <DialogTitle className='flex items-center justify-between gap-3 text-lg font-semibold'>
                <span>AUCA Account Details</span>

                {selectedAccount && (
                  <span className='inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'>
                    <span className='h-2 w-2 rounded-full bg-amber-500' />
                    IRAC: {selectedAccount.newIrac ?? '-'} · Status:{' '}
                    {selectedAccount.status ?? '—'}
                  </span>
                )}
              </DialogTitle>

              {selectedAccount && (
                <p className='text-muted-foreground text-xs'>
                  {selectedAccount.custName ?? '—'} · Acct No:{' '}
                  <span className='font-mono font-semibold'>
                    {selectedAccount.acctNo ?? '—'}
                  </span>{' '}
                  · Branch: {selectedAccount.branchCode ?? '—'}
                </p>
              )}
            </DialogHeader>

            {isDetailsLoading && !selectedAccount ? (
              <div className='mt-4 space-y-3'>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className='h-6 w-full rounded-md' />
                ))}
              </div>
            ) : !selectedAccount ? (
              <div className='border-muted-foreground/30 bg-muted/40 text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm'>
                Select an account to view details.
              </div>
            ) : (
              <div className='mt-4 space-y-6 text-sm'>
                {/* Top summary stats */}
                <div className='bg-muted/40 grid gap-3 rounded-xl border p-4 sm:grid-cols-3'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Outstanding
                    </span>
                    <span className='font-mono text-base font-semibold'>
                      {selectedAccount.outstand !== undefined
                        ? selectedAccount.outstand.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Irregular Amount
                    </span>
                    <span className='font-mono text-base font-semibold'>
                      {selectedAccount.irregAmt !== undefined
                        ? selectedAccount.irregAmt.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Loan Limit
                    </span>
                    <span className='font-mono text-base font-semibold'>
                      {selectedAccount.loanLimit !== undefined
                        ? selectedAccount.loanLimit.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Customer & account info */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wide uppercase'>
                    Customer & Account
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        selectedAccount.aucaEligible
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                      }`}
                    >
                      {selectedAccount.aucaEligible
                        ? 'AUCA Eligible Marked'
                        : 'AUCA Eligible Not Marked'}
                    </span>
                  </h3>

                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Account No'
                      value={selectedAccount.acctNo}
                    />
                    <DetailRow
                      label='Account Description'
                      value={selectedAccount.acctDesc}
                    />
                    <DetailRow
                      label='Customer Name'
                      value={selectedAccount.custName}
                    />
                    <DetailRow
                      label='Customer Number'
                      value={selectedAccount.custNumber}
                    />
                    <DetailRow
                      label='Mobile No.'
                      value={selectedAccount.telNo}
                    />
                    <DetailRow
                      label='Segment'
                      value={selectedAccount.segement}
                    />
                  </div>
                </section>

                {/* Address */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Address
                  </h3>
                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Address Line 1'
                      value={selectedAccount.add1}
                    />
                    <DetailRow
                      label='Address Line 2'
                      value={selectedAccount.add2}
                    />
                    <DetailRow
                      label='Address Line 3'
                      value={selectedAccount.add3}
                    />
                    <DetailRow label='Area' value={selectedAccount.area} />
                    <DetailRow label='City' value={selectedAccount.city} />
                    <DetailRow
                      label='District'
                      value={selectedAccount.district}
                    />
                    <DetailRow label='State' value={selectedAccount.state} />
                    <DetailRow label='PIN' value={selectedAccount.pinCode} />
                  </div>
                </section>

                {/* Loan details */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Loan & NPA Details
                  </h3>
                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Loan Limit'
                      value={selectedAccount.loanLimit}
                    />
                    <DetailRow
                      label='Interest Rate (%)'
                      value={selectedAccount.intRate}
                    />
                    <DetailRow
                      label='Installment Amount'
                      value={selectedAccount.instalAmt}
                    />
                    <DetailRow
                      label='Currency'
                      value={selectedAccount.currency}
                    />
                    <DetailRow label='NPA Code' value={selectedAccount.npaCd} />
                    <DetailRow
                      label='New IRAC Code'
                      value={selectedAccount.newIrac}
                    />
                    <DetailRow label='NPA Date' value={selectedAccount.npaDt} />
                    <DetailRow
                      label='Sanction Date'
                      value={selectedAccount.sanctDt}
                    />
                    <DetailRow
                      label='Closing Date'
                      value={selectedAccount.closingDt}
                    />
                    <DetailRow
                      label='Overdue Period (months)'
                      value={selectedAccount.overduePeriod}
                    />
                  </div>
                </section>

                {/* Security & system info */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Security & System Info
                  </h3>
                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Branch Code'
                      value={selectedAccount.branchCode}
                    />
                    <DetailRow
                      label='Company Code'
                      value={selectedAccount.compCd}
                    />
                    <DetailRow
                      label='Security Amount'
                      value={selectedAccount.secuAmt}
                    />
                    <DetailRow
                      label='Advance Received'
                      value={selectedAccount.advRec}
                    />
                    <DetailRow
                      label='Account Type'
                      value={selectedAccount.actType}
                    />
                    <DetailRow label='PTS' value={selectedAccount.pts} />
                    <DetailRow
                      label='Moved By'
                      value={selectedAccount.movedByUser}
                    />
                    <DetailRow
                      label='Moved Date'
                      value={selectedAccount.movedDate}
                    />
                  </div>
                </section>
              </div>
            )}

            <DialogFooter className='mt-6 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setDetailsDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                type='button'
                onClick={handleMarkEligible}
                disabled={
                  !selectedAccount || isMarkingEligible || !canMarkEligible
                }
                className='min-w-[200px] text-white'
              >
                {isMarkingEligible
                  ? 'Marking…'
                  : 'Mark as AUCA Eligible & Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {label}
      </span>
      <span className='text-foreground text-sm font-semibold'>
        {value !== undefined && value !== null && value !== ''
          ? String(value)
          : '-'}
      </span>
    </div>
  )
}
