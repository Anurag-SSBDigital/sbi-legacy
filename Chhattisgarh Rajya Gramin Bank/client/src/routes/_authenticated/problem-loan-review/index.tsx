import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { components } from '@/types/api/v1.d.ts'
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

const columns: PaginatedTableProps<
  components['schemas']['AccountListDto2']
>['columns'] = [
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
  // {
  //   key: 'newIrac',
  //   label: 'IRAC Code',
  //   render: (value) => <span>{value ?? '-'}</span>,
  // },
] as const

export const Route = createFileRoute('/_authenticated/problem-loan-review/')({
  component: RouteComponent,
})

function RouteComponent() {
  const canMarkEligible = useCanAccess('problem_loan_review', 'mark_eligible')

  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<
    components['schemas']['ProblemLoanReviewEligibleAccount'] | null
  >(null)

  // ProblemLoanReviewEligibleAccount: {
  //           /** Format: int64 */
  //           id?: number;
  //           accountNumber?: string;
  //           borrowerName?: string;
  //           fatherHusbandName?: string;
  //           branchCode?: string;
  //           branchName?: string;
  //           /** Format: date */
  //           loanSanctionDate?: string;
  //           /** Format: double */
  //           sanctionedLimit?: number;
  //           drawingPower?: number;
  //           /** Format: double */
  //           outstandingAmount?: number;
  //           overdueAmount?: number;
  //           loanPurpose?: string;
  //           sanctioningAuthority?: string;
  //           /** Format: date */
  //           npaDate?: string;
  //           iracStatus?: string;
  //           provisionSecured?: number;
  //           provisionUnsecured?: number;
  //           totalProvision?: number;
  //           adverseFeatures?: string;
  //           otherLoans?: string;
  //           reasonForNPA?: string;
  //           borrowerProfileHistory?: string;
  //           sarfaesiActionInitiated?: boolean;
  //           civilSuitFiled?: boolean;
  //           suitStatus?: string;
  //           legalStatus?: string;
  //           securities?: components["schemas"]["AvailableSecurity"][];
  //           currentSecurityStatus?: string;
  //           totalSecurityValue?: number;
  //           /** Format: date */
  //           lastInspectionDate?: string;
  //           /** Format: date */
  //           lastInspectionMeetingDate?: string;
  //           summaryOfDiscussions?: string;
  //           staffAccountabilityComments?: string;
  //           actionTakenOrProposed?: string;
  //           likelyTimeFrameForUpgrade?: string;
  //           reviewEligible?: boolean;
  //           movedByUser?: string;
  //           /** Format: date-time */
  //           movedDate?: string;
  //           status?: string;
  //           reviewCreated?: boolean;
  //           workflowInitiated?: boolean;
  //           address?: string;
  //           phoneNumber?: string;
  //           email?: string;
  //           accountType?: string;
  //           loanProduct?: string;
  //           interestRate?: number;
  //           /** Format: int32 */
  //           overduePeriod?: number;
  //           recoveryOfficer?: string;
  //           riskRating?: string;
  //           workflowInstanceId?: string;
  //           currentWorkflowStage?: string;
  //           /** Format: date-time */
  //           workflowStartDate?: string;
  //           /** Format: date-time */
  //           workflowCompletionDate?: string;
  //           reviewPriority?: string;
  //           /** Format: date */
  //           nextReviewDate?: string;
  //           remarks?: string;
  //       };

  //             AvailableSecurity: {
  //           securityType?: string;
  //           securityDescription?: string;
  //           realizableValue?: number;
  //           /** Format: date */
  //           valuationDate?: string;
  //       };

  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isMarkingEligible, setIsMarkingEligible] = useState(false)

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  // ===== List API =====
  const {
    data: listResponse,
    isLoading,
    error,
    refetch,
  } = $api.useQuery('get', '/problem-loan-reviews/accountlist', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
      },
      query: {
        // backend expects branchId as string; "null" means all
        branchId: !branchId || branchId === 'all' ? 'null' : branchId,
        page: 0,
        size: 1000000000, // fetch all
      },
    },
  })

  const accounts = useMemo(() => {
    if (!listResponse?.data) return []
    const data = listResponse.data
    return data.content ?? []
  }, [listResponse])

  const outstandingStats = useMemo(() => {
    const values =
      accounts
        ?.map((d) => Number(d.outstand))
        .filter((val) => !isNaN(val) && isFinite(val)) ?? []
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const total = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : 0
    return { min, max, total, count: values.length }
  }, [accounts])

  const filteredData = useMemo(() => {
    if (!query) return accounts
    const q = query.toLowerCase()
    return accounts.filter((row) =>
      [row.acctNo, row.custName, row.telNo, row.add4, row.newIrac, row.outstand]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    )
  }, [accounts, query])

  // ===== Mutations =====
  const { mutate: fetchAccountDetails } = $api.useMutation(
    'get',
    '/problem-loan-reviews/eligible-account/{acctNo}'
  )

  const { mutate: markEligible } = $api.useMutation(
    'post',
    '/problem-loan-reviews/eligible-account'
  )

  const handleViewDetails = (acctNo?: string) => {
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

          // ✅ use the body directly; your mutation returns { status, message, data }
          const body = res

          if (body.data) {
            setSelectedAccount(body.data)
            setDetailsDialogOpen(true)
          } else {
            toast.error('Invalid response for account details')
          }
        },
        onError: () => {
          setIsDetailsLoading(false)
          toast.error('Failed to fetch account details')
        },
      }
    )
  }

  const handleMarkEligible = () => {
    if (!canMarkEligible) {
      toast.error('You do not have permission to mark review eligibility.')
      return
    }

    if (!selectedAccount) return
    setIsMarkingEligible(true)

    markEligible(
      {
        body: {
          ...selectedAccount,
        },
        params: {
          header: {
            Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
          },
        },
      },
      {
        onSuccess: () => {
          setIsMarkingEligible(false)
          toast.success('Account marked as Problem Loan Review eligible')

          // 🔁 refresh the table data
          refetch()

          // 🔒 close dialog & clear state
          setDetailsDialogOpen(false)
          setSelectedAccount(null)
        },
        onError: () => {
          setIsMarkingEligible(false)
          toast.error('Failed to mark account as Problem Loan Review eligible')
        },
      }
    )
  }

  const progress = isLoading || isDetailsLoading || isMarkingEligible ? 70 : 100

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
            label: 'Problem Loan Review Accounts',
          }}
        />

        {isLoading ? (
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
        ) : error ? (
          <div className='py-10 text-center text-red-500'>
            Error fetching data: {String((error as Error).message)}
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No Problem Loan Review accounts available for this branch.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  Problem Loan Review Accounts ({filteredData.length} accounts)
                </CardTitle>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Total records: {accounts.length} | Total outstanding (sum):{' '}
                  {outstandingStats.total.toFixed(2)} | Min:{' '}
                  {outstandingStats.min.toFixed(2)} | Max:{' '}
                  {outstandingStats.max.toFixed(2)}
                </p>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='searchAccounts' className='sr-only'>
                  Search Problem Loan Review accounts
                </Label>
                <Input
                  id='searchAccounts'
                  placeholder='Search by account, name, mobile...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className='max-w-sm border-gray-300 focus:border-blue-500'
                  aria-label='Search Problem Loan Review accounts'
                />
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <PaginatedTable
                frameless
                showSearch={false}
                data={filteredData}
                columns={columns}
                emptyMessage='No Problem Loan Review accounts to show.'
                renderActions={(row) =>
                  row.acctNo ? (
                    <Button
                      variant='outline'
                      className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                      onClick={() => handleViewDetails(row.acctNo)}
                    >
                      View
                    </Button>
                  ) : null
                }
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
                <span>Problem Loan Review Account Details</span>
                {selectedAccount && (
                  <span className='inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'>
                    <span className='h-2 w-2 rounded-full bg-amber-500' />
                    IRAC: {selectedAccount.iracStatus ?? '-'}
                  </span>
                )}
              </DialogTitle>

              {selectedAccount && (
                <p className='text-muted-foreground text-xs'>
                  {selectedAccount.borrowerName ?? '—'} · Acct No:{' '}
                  <span className='font-mono font-semibold'>
                    {selectedAccount.accountNumber ?? '—'}
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
                      {selectedAccount.outstandingAmount !== undefined
                        ? selectedAccount?.outstandingAmount?.toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )
                        : '-'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Overdue Amount
                    </span>
                    <span className='font-mono text-base font-semibold'>
                      {selectedAccount.overdueAmount !== undefined
                        ? selectedAccount?.overdueAmount?.toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )
                        : '-'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Sanctioned Limit
                    </span>
                    <span className='font-mono text-base font-semibold'>
                      {selectedAccount.sanctionedLimit !== undefined
                        ? selectedAccount?.sanctionedLimit?.toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )
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
                        selectedAccount.reviewEligible
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                      }`}
                    >
                      {selectedAccount.reviewEligible
                        ? 'Review Eligible'
                        : 'Not Review Eligible'}
                    </span>
                  </h3>

                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Account No'
                      value={selectedAccount.accountNumber}
                    />
                    <DetailRow
                      label='Account Type'
                      value={selectedAccount.accountType}
                    />

                    <DetailRow
                      label='Borrower Name'
                      value={selectedAccount.borrowerName}
                    />
                    <DetailRow
                      label='Father/Husband Name'
                      value={selectedAccount.fatherHusbandName}
                    />

                    <DetailRow
                      label='Phone'
                      value={selectedAccount.phoneNumber}
                    />
                    <DetailRow label='Email' value={selectedAccount.email} />

                    <DetailRow
                      label='Branch Code'
                      value={selectedAccount.branchCode}
                    />
                    <DetailRow
                      label='Branch Name'
                      value={selectedAccount.branchName}
                    />

                    <DetailRow
                      label='Loan Product'
                      value={selectedAccount.loanProduct}
                    />
                    <DetailRow
                      label='Risk Rating'
                      value={selectedAccount.riskRating}
                    />

                    <DetailRow label='Status' value={selectedAccount.status} />
                    <DetailRow
                      label='Review Priority'
                      value={selectedAccount.reviewPriority}
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
                      label='Address'
                      value={selectedAccount.address}
                    />
                  </div>
                </section>

                {/* Loan details */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Loan & NPA Details
                  </h3>

                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Loan Sanction Date'
                      value={selectedAccount.loanSanctionDate}
                    />
                    <DetailRow
                      label='Sanctioning Authority'
                      value={selectedAccount.sanctioningAuthority}
                    />

                    <DetailRow
                      label='Sanctioned Limit'
                      value={selectedAccount.sanctionedLimit}
                    />
                    <DetailRow
                      label='Drawing Power'
                      value={selectedAccount.drawingPower}
                    />

                    <DetailRow
                      label='Outstanding Amount'
                      value={selectedAccount.outstandingAmount}
                    />
                    <DetailRow
                      label='Overdue Amount'
                      value={selectedAccount.overdueAmount}
                    />

                    <DetailRow
                      label='Loan Purpose'
                      value={selectedAccount.loanPurpose}
                    />
                    <DetailRow
                      label='Interest Rate (%)'
                      value={selectedAccount.interestRate}
                    />

                    <DetailRow
                      label='NPA Date'
                      value={selectedAccount.npaDate}
                    />
                    <DetailRow
                      label='IRAC Status'
                      value={selectedAccount.iracStatus}
                    />

                    <DetailRow
                      label='Overdue Period (days/months)'
                      value={selectedAccount.overduePeriod}
                    />
                    <DetailRow
                      label='Next Review Date'
                      value={selectedAccount.nextReviewDate}
                    />
                  </div>
                </section>
                {/* Security & system info */}
                <section className='bg-background/60 space-y-3 rounded-xl border p-4 shadow-sm'>
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Security & Workflow Info
                  </h3>

                  <div className='bg-muted/40 grid gap-2 rounded-lg p-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Current Security Status'
                      value={selectedAccount.currentSecurityStatus}
                    />
                    <DetailRow
                      label='Total Security Value'
                      value={selectedAccount.totalSecurityValue}
                    />

                    <DetailRow
                      label='Provision Secured'
                      value={selectedAccount.provisionSecured}
                    />
                    <DetailRow
                      label='Provision Unsecured'
                      value={selectedAccount.provisionUnsecured}
                    />

                    <DetailRow
                      label='Total Provision'
                      value={selectedAccount.totalProvision}
                    />
                    <DetailRow
                      label='Recovery Officer'
                      value={selectedAccount.recoveryOfficer}
                    />

                    <DetailRow
                      label='Review Created'
                      value={selectedAccount.reviewCreated ? 'Yes' : 'NO'}
                    />
                    <DetailRow
                      label='Workflow Initiated'
                      value={selectedAccount.workflowInitiated ? 'Yes' : 'NO'}
                    />

                    <DetailRow
                      label='Workflow Instance ID'
                      value={selectedAccount.workflowInstanceId}
                    />
                    <DetailRow
                      label='Current Workflow Stage'
                      value={selectedAccount.currentWorkflowStage}
                    />

                    <DetailRow
                      label='Workflow Start Date'
                      value={selectedAccount.workflowStartDate}
                    />
                    <DetailRow
                      label='Workflow Completion Date'
                      value={selectedAccount.workflowCompletionDate}
                    />

                    <DetailRow
                      label='Moved By'
                      value={selectedAccount.movedByUser}
                    />
                    <DetailRow
                      label='Moved Date'
                      value={selectedAccount.movedDate}
                    />
                  </div>

                  {/* Optional: securities list */}
                  {selectedAccount.securities &&
                    selectedAccount.securities.length > 0 && (
                      <div className='bg-muted/30 mt-3 rounded-lg border p-3'>
                        <div className='text-muted-foreground mb-2 text-xs font-semibold uppercase'>
                          Securities ({selectedAccount.securities.length})
                        </div>
                        <div className='space-y-2'>
                          {selectedAccount.securities.map((s, idx) => (
                            <div
                              key={idx}
                              className='bg-background/60 rounded-md p-3 text-xs'
                            >
                              <div className='grid gap-2 sm:grid-cols-2'>
                                <DetailRow
                                  label='Type'
                                  value={s.securityType}
                                />
                                <DetailRow
                                  label='Realisable Value'
                                  value={s.realizableValue}
                                />
                                <DetailRow
                                  label='Valuation Date'
                                  value={s.valuationDate}
                                />
                                <DetailRow
                                  label='Description'
                                  value={s.securityDescription}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                className='min-w-[160px] text-white'
              >
                {isMarkingEligible
                  ? 'Marking…'
                  : 'Mark as Problem Loan Review Eligible'}
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
  value: string | number | undefined
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {label}
      </span>
      <span className='text-foreground text-sm font-semibold'>
        {value !== undefined && value !== '' ? String(value) : '-'}
      </span>
    </div>
  )
}
