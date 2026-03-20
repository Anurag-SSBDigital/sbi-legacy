import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as EditRoute } from '@/routes/_authenticated/esr/$accountId/$esrId/edit'
// ✅ Import Route objects (typed)
import { Route as NewRoute } from '@/routes/_authenticated/esr/$accountId/new'
import { FileText, Plus, Pencil, Trash2, Calendar, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs.ts'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { esrStore } from '../esr.storage'
import type { ESRRecord } from '../esr.types'

export default function ESRListing({ accountId }: { accountId: string }) {
  const nav = useNavigate()
  const [tick, setTick] = useState(0)
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const rows = useMemo(() => esrStore.list(accountId), [accountId, tick])

  const onDelete = (id: string) => {
    esrStore.remove(accountId, id)
    toast.success('ESR deleted')
    setTick((x) => x + 1)
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

      <Main className='px-4 py-2'>
        <AppBreadcrumb
          className='p-2'
          crumbs={[Home]}
          currentPage={{
            type: 'label',
            label: 'Early Sanction Review',
          }}
        />

        <Card className='border-border animate-fadeIn col-span-full space-y-4 border shadow-lg py-10     shadow-sm'>
          {/* Responsive header: stacks on mobile, spreads on desktop */}
          <CardHeader className='flex flex-col justify-between gap-4 pb-4 sm:flex-row sm:items-center'>
            <CardTitle className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold'>
              <FileText className='text-accent h-5 w-5' />{' '}
              {/* Saffron accent icon */}
              ESR Records
              <span className='text-muted-foreground ml-1 text-lg font-medium'>
                — {accountId}
              </span>
            </CardTitle>

            <Button
              size='sm'
              // Uses your primary green and hover effects
              className='bg-primary text-primary-foreground group w-full gap-2 transition-all duration-200 hover:brightness-105 sm:w-auto'
              onClick={() =>
                nav({
                  to: NewRoute.to,
                  params: { accountId },
                })
              }
            >
              {/* Subtle spin animation on hover */}
              <Plus className='h-4 w-4 transition-transform duration-300 group-hover:rotate-90' />
              New ESR
            </Button>
          </CardHeader>

          <CardContent>
            {rows.length === 0 ? (
              /* Enhanced Empty State */
              <div className='border-border bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-12 text-center'>
                <FileText className='text-muted-foreground mb-3 h-10 w-10 opacity-40' />
                <p className='text-foreground text-sm font-semibold'>
                  No ESR records found.
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Get started by creating a new ESR record for this account.
                </p>
              </div>
            ) : (
              /* Enhanced List View */
              <div className='divide-border border-border bg-card divide-y overflow-hidden rounded-lg border'>
                {rows.map((r: ESRRecord) => (
                  <div
                    key={r.id}
                    // Added a subtle hover state to make rows feel interactive
                    className='hover:bg-muted/30 flex flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center'
                  >
                    <div className='space-y-1.5'>
                      <div className='text-foreground flex flex-wrap items-center gap-2 text-sm font-semibold'>
                        <span className='flex items-center gap-1.5'>
                          <Calendar className='text-secondary-foreground h-3.5 w-3.5' />
                          {r.reviewDate || 'No Date'}
                        </span>
                        <span className='text-muted-foreground hidden sm:inline'>
                          •
                        </span>
                        <span className='text-primary flex items-center gap-1.5'>
                          <Package className='h-3.5 w-3.5' />
                          {r.productType}
                        </span>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        Updated: {new Date(r.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Action buttons: stretch to fill mobile, hug content on desktop */}
                    <div className='mt-2 flex w-full items-center gap-2 self-start sm:mt-0 sm:w-auto sm:self-auto'>
                      <Button
                        variant='outline'
                        size='sm'
                        // On hover, uses your Saffron accent
                        className='hover:bg-accent hover:text-accent-foreground hover:border-accent flex-1 gap-1.5 transition-colors sm:flex-none'
                        onClick={() =>
                          nav({
                            to: EditRoute.to,
                            params: { accountId, esrId: r.id },
                          })
                        }
                      >
                        <Pencil className='h-3.5 w-3.5' />
                        Edit
                      </Button>

                      <Button
                        variant='destructive'
                        size='sm'
                        className='flex-1 gap-1.5 transition-all duration-200 hover:brightness-110 sm:flex-none'
                        onClick={() => onDelete(r.id)}
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
      </Main>
    </>
  )
}
