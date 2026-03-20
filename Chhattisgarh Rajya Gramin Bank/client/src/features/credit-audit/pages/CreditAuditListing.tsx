import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  User,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import useAccountDetails from '@/hooks/use-account-details'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { creditAuditStore } from '../creditAudit.storage'

export default function CreditAuditListingPage({
  accountId,
}: {
  accountId: string
}) {
  const nav = useNavigate()

  const { data: acct, isLoading } = useAccountDetails(accountId, true)
  const rows = useMemo(() => creditAuditStore.list(accountId), [accountId])

  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const handleDelete = (id: string) => {
    creditAuditStore.remove(accountId, id)
    toast.success('Report deleted successfully')
    nav({
      to: '/creditAudit/listing',
      search: (prev: Record<string, unknown>) => ({ ...prev, accountId }),
    } as never)
  }

  return (
    <>
      <Header>
        <BranchSelector
          value={branchId}
          setValue={setBranchId}
          deptValue={deptId}
          deptSetValue={setDeptId}
        />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main container strictly contained and animated */}
      <div className='animate-fadeIn max-w-9xl space-y-6 px-4 py-8'>
        <Card className='border-border border-t-accent overflow-hidden border-t-4 shadow-sm'>
          {/* Unified Responsive Header */}
          <CardHeader className='bg-muted/10 border-border flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center'>
            <div className='space-y-1.5'>
              <CardTitle className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold'>
                <ClipboardList className='text-primary h-6 w-6' />
                Credit Audit Reports
                <span className='text-muted-foreground ml-1 text-lg font-medium'>
                  — {accountId}
                </span>
              </CardTitle>

              <div className='text-secondary-foreground text-sm font-medium'>
                {isLoading
                  ? 'Loading account details...'
                  : acct
                    ? `Borrower: ${acct.custName ?? '-'} • Branch: ${acct.branchName ?? '-'}`
                    : 'Account details unavailable'}
              </div>
            </div>

            <Button
              className='bg-primary text-primary-foreground group w-full gap-2 shadow-sm transition-all duration-200 hover:brightness-105 sm:w-auto'
              onClick={() =>
                nav({
                  to: '/creditAudit/form',
                  search: { accountId, mode: 'create' },
                } as never)
              }
            >
              <Plus className='h-4 w-4 transition-transform duration-300 group-hover:rotate-90' />
              New Report
            </Button>
          </CardHeader>

          <CardContent className='p-6'>
            {rows.length === 0 ? (
              /* Enhanced Empty State */
              <div className='border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center'>
                <FileText className='text-muted-foreground mb-4 h-12 w-12 opacity-40' />
                <p className='text-foreground text-base font-bold'>
                  No reports found.
                </p>
                <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
                  There are currently no credit audit reports for this account.
                  Click the button above to create one.
                </p>
              </div>
            ) : (
              /* Enhanced List View */
              <div className='divide-border border-border bg-card divide-y overflow-hidden rounded-xl border shadow-sm'>
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className='hover:bg-muted/30 flex flex-col justify-between gap-4 p-5 transition-colors sm:flex-row sm:items-center'
                  >
                    <div className='space-y-2'>
                      <div className='text-foreground flex items-center gap-2 text-base font-bold'>
                        <User className='text-accent h-4 w-4' />
                        {r.borrowerName || 'Unnamed Borrower'}
                      </div>
                      <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
                        <span className='flex items-center gap-1.5'>
                          <Calendar className='h-3.5 w-3.5' />
                          Date:{' '}
                          <span className='text-foreground font-medium'>
                            {r.reportDate || '-'}
                          </span>
                        </span>
                        <span className='text-border hidden sm:inline'>•</span>
                        <span>
                          Updated:{' '}
                          {new Date(r.updatedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons stack on mobile, inline on desktop */}
                    <div className='mt-2 flex w-full items-center gap-2 sm:mt-0 sm:w-auto'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='hover:bg-accent hover:text-accent-foreground hover:border-accent flex-1 gap-1.5 transition-colors sm:flex-none'
                        onClick={() =>
                          nav({
                            to: '/creditAudit/form',
                            search: { accountId, mode: 'edit', auditId: r.id },
                          } as never)
                        }
                      >
                        <Pencil className='h-3.5 w-3.5' />
                        Edit
                      </Button>

                      <Button
                        variant='destructive'
                        size='sm'
                        className='flex-1 gap-1.5 transition-all hover:brightness-110 sm:flex-none'
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
