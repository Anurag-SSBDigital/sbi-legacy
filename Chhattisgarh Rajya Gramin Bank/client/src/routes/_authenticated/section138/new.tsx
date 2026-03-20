import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Loader2,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import useAccountDetails from '@/hooks/use-account-details'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { createCase } from '@/features/section138/section138.storage'

export const Route = createFileRoute('/_authenticated/section138/new')({
  component: NewSection138Case,
})

function NewSection138Case() {
  const [acctNo, setAcctNo] = useState('')
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)
  const navigate = useNavigate()

  const {
    data: account,
    isLoading,
    isError,
  } = useAccountDetails(acctNo, acctNo.length >= 10)

  const onCreate = () => {
    if (!acctNo.trim()) {
      toast.error('Account number is required.')
      return
    }
    const record = createCase({ stage1: { acctNo: acctNo.trim() } })
    navigate({
      to: '/section138/$caseId/stage-1',
      params: { caseId: record.id },
    })
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
      <Main>
        <div className='bg-muted/20 min-h-[calc(100vh-64px)] p-4 md:p-6'>
          <div className='max-w-9xl space-y-6'>
            <AppBreadcrumb
              crumbs={[Home]}
              currentPage={{ type: 'label', label: 'New Case' }}
            />

            <Card className='shadow-sm'>
              <CardHeader className='bg-muted/40 border-b'>
                <CardTitle className='text-xl font-bold tracking-tight'>
                  Initiate Section 138 Action
                </CardTitle>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Enter the borrower's loan account number to begin the legal
                  workflow.
                </p>
              </CardHeader>
              <CardContent className='pt-8 pb-10'>
                <div className='mx-auto max-w-md space-y-8'>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='account-number'
                        className='text-muted-foreground ml-0.5 text-[10px] font-bold tracking-wider uppercase'
                      >
                        Loan Account Number
                      </Label>
                      <div className='relative'>
                        <Input
                          id='account-number'
                          value={acctNo}
                          onChange={(e) => setAcctNo(e.target.value)}
                          placeholder='Enter 10+ digits...'
                          className='h-12 text-lg font-medium transition-all focus:ring-2'
                        />
                        {isLoading && (
                          <div className='absolute top-3 right-3'>
                            <Loader2 className='text-primary h-6 w-6 animate-spin' />
                          </div>
                        )}
                        {account && !isLoading && (
                          <div className='absolute top-3 right-3'>
                            <CheckCircle2 className='h-6 w-6 text-emerald-500' />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Preview Card */}
                    {account && (
                      <div className='animate-in fade-in slide-in-from-top-2 bg-muted/30 rounded-xl border p-5 shadow-sm duration-300'>
                        <div className='mb-4 flex items-center justify-between border-b pb-3'>
                          <div className='flex items-center gap-3'>
                            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full shadow-inner'>
                              <User className='text-primary h-5 w-5' />
                            </div>
                            <div>
                              <div className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                                Borrower Name
                              </div>
                              <div className='text-base leading-tight font-bold'>
                                {account.custName}
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                              Customer ID
                            </div>
                            <div className='font-mono text-xs font-bold'>
                              {account.custNumber}
                            </div>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                          <div className='space-y-1'>
                            <div className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase'>
                              <MapPin className='h-3 w-3' /> Branch
                            </div>
                            <div className='text-xs font-semibold'>
                              {account.branchName || 'N/A'}
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase'>
                              <CreditCard className='h-3 w-3' /> Outstanding
                            </div>
                            <div className='text-primary text-xs font-bold'>
                              ₹{' '}
                              {Number(account.outstand || 0).toLocaleString(
                                'en-IN'
                              )}
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase'>
                              Segment
                            </div>
                            <div className='text-xs font-semibold'>
                              {account.segement || 'General'}
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase'>
                              Account Type
                            </div>
                            <div
                              className='truncate text-xs font-semibold'
                              title={account.acctDesc}
                            >
                              {account.acctDesc}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isError && acctNo.length >= 10 && (
                      <div className='border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        Unable to find account details.
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={onCreate}
                    className='shadow-primary/20 h-12 w-full text-white shadow-lg'
                    disabled={!account || isLoading}
                  >
                    Create & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
