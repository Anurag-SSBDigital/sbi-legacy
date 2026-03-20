import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import LoadingBar from 'react-top-loading-bar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx';
import { Home } from '@/components/breadcrumb/common-crumbs.ts';
import { Header } from '@/components/layout/header.tsx';
import { Main } from '@/components/layout/main.tsx';
import { ProfileDropdown } from '@/components/profile-dropdown.tsx';
import { Search } from '@/components/search.tsx';
import type { PaginatedTableColumns, ServerTableQuery } from '@/components/server-paginated-table.tsx';
import ServerPaginatedTable from '@/components/server-paginated-table.tsx';
import { ThemeSwitch } from '@/components/theme-switch.tsx';
import BranchSelector from '@/features/dashboard/components/branch-selector';
import { getWorkflowDefKeyByProcessCode } from '@/features/process-settings/process-setting-utils.ts';


export interface WorkflowAccountListProps<T extends Record<string, unknown>> {
  title: string
  processCode: string
  accounts: T[]
  totalRows: number
  pageIndex: number
  pageSize: number
  columns: PaginatedTableColumns<T>[]
  isLoading: boolean

  processSettingsResponse: unknown
  isProcessSettingsLoading: boolean
  processSettingsError: unknown

  branchId?: string
  setBranchId?: (val: string | undefined) => void
  isBranchDropdownVisible: boolean

  statsKey?: keyof T
  identifierKey: keyof T
  workflowDefKeyOverride?: string

  onPaginationChange: (pagination: {
    pageIndex: number
    pageSize: number
  }) => void
  onRefresh: () => Promise<void> | void
  isRefreshing: boolean
  onStartWorkflow: (accountNo: string, defKey: string) => Promise<void>
  isStarting: boolean
  canInitiate?: boolean

  renderDialogDetails: (accountNo: string) => ReactNode
}

export function WorkflowAccountList<T extends Record<string, unknown>>({
  title,
  processCode,
  accounts,
  totalRows,
  pageSize,
  columns,
  isLoading,
  processSettingsResponse,
  isProcessSettingsLoading,
  processSettingsError,
  branchId,
  setBranchId,
  isBranchDropdownVisible,
  statsKey,
  identifierKey,
  workflowDefKeyOverride,
  onPaginationChange,
  onRefresh,
  isRefreshing,
  onStartWorkflow,
  isStarting,
  canInitiate = true,
  renderDialogDetails,
}: WorkflowAccountListProps<T>) {
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false)
  const [selectedAccountNo, setSelectedAccountNo] = useState('')

  const derivedWorkflowDefKey = useMemo(
    () => getWorkflowDefKeyByProcessCode(processSettingsResponse, processCode),
    [processSettingsResponse, processCode]
  )

  const workflowDefKey = workflowDefKeyOverride ?? derivedWorkflowDefKey

  const outstandingStats = useMemo(() => {
    if (!statsKey) {
      return { min: 0, max: 0, total: 0 }
    }

    const values = accounts
      .map((row) => Number(row[statsKey]))
      .filter((value) => Number.isFinite(value))

    if (values.length === 0) {
      return { min: 0, max: 0, total: 0 }
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      total: values.reduce((sum, value) => sum + value, 0),
    }
  }, [accounts, statsKey])

  const handleOpenInitiate = (accountNo: string) => {
    setSelectedAccountNo(accountNo)
    setInitiateDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setInitiateDialogOpen(false)
    setSelectedAccountNo('')
  }

  const handleStart = async (): Promise<void> => {
    if (!selectedAccountNo) {
      toast.error('Account number is missing.')
      return
    }

    if (!workflowDefKey) {
      toast.error('Workflow definition key is missing.')
      return
    }

    try {
      await onStartWorkflow(selectedAccountNo, workflowDefKey)
      await Promise.resolve(onRefresh())

      toast.success(`Workflow initiated for account ${selectedAccountNo}.`)
      handleCloseDialog()
    } catch {
      toast.error('Failed to initiate workflow.')
    }
  }

  const progress =
    isLoading || isProcessSettingsLoading || isRefreshing || isStarting
      ? 70
      : 100

  return (
    <>
      <Header>
        {isBranchDropdownVisible && setBranchId ? (
          <BranchSelector value={branchId} setValue={setBranchId} />
        ) : null}

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
            label: title,
          }}
        />

        {isLoading ? (
          <Card className='col-span-full space-y-4 p-6 shadow-lg'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <Skeleton className='h-10 w-1/4 rounded-md' />
            <div className='mt-4 space-y-3'>
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className='h-6 w-full rounded-md' />
              ))}
            </div>
          </Card>
        ) : totalRows === 0 ? (
          <div className='py-10 text-center text-gray-500'>
            No accounts available for this branch.
          </div>
        ) : (
          <Card className='col-span-full shadow-lg'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  {title} ({totalRows} accounts)
                </CardTitle>

                {statsKey ? (
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    Total records: {totalRows} | Current page: {accounts.length}{' '}
                    | Total (sum): {outstandingStats.total.toFixed(2)} | Min:{' '}
                    {outstandingStats.min.toFixed(2)} | Max:{' '}
                    {outstandingStats.max.toFixed(2)}
                  </p>
                ) : null}
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isRefreshing || isStarting}
                  onClick={() => {
                    void Promise.resolve(onRefresh())
                  }}
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className='px-6'>
              <ServerPaginatedTable
                key={`${processCode}-${branchId ?? 'all'}`}
                frameless
                showSearch={false}
                rows={accounts}
                total={totalRows}
                columns={columns}
                rowKey={identifierKey}
                initialRowsPerPage={pageSize}
                onQueryChange={(query: ServerTableQuery) => {
                  onPaginationChange({
                    pageIndex: Math.max(0, query.page - 1),
                    pageSize: query.pageSize,
                  })
                }}
                emptyMessage='No accounts to show.'
                renderActions={(row) => {
                  if (!canInitiate) {
                    return null
                  }

                  const idValue = row[identifierKey]

                  return idValue ? (
                    <Button
                      type='button'
                      variant='outline'
                      disabled={isStarting}
                      onClick={() => handleOpenInitiate(String(idValue))}
                    >
                      Initiate
                    </Button>
                  ) : null
                }}
              />
            </CardContent>
          </Card>
        )}

        <Dialog
          open={initiateDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setInitiateDialogOpen(true)
              return
            }

            handleCloseDialog()
          }}
        >
          <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle>Confirm {processCode} Initiation</DialogTitle>
            </DialogHeader>

            <div className='space-y-3'>
              {renderDialogDetails(selectedAccountNo)}

              {processSettingsError ? (
                <p className='rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  Failed to load Process Settings. Unable to resolve workflow
                  key.
                </p>
              ) : !isProcessSettingsLoading && !workflowDefKey ? (
                <p className='rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  Workflow key is missing in Process Settings. Configure
                  <span className='font-medium'> Workflow Definition Key </span>
                  for process code {processCode}.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleCloseDialog}
                disabled={isStarting}
              >
                Cancel
              </Button>

              <Button
                type='button'
                disabled={
                  isStarting ||
                  isProcessSettingsLoading ||
                  Boolean(processSettingsError) ||
                  !selectedAccountNo ||
                  !workflowDefKey
                }
                onClick={() => {
                  void handleStart()
                }}
              >
                {isStarting ? 'Starting…' : 'Start'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}