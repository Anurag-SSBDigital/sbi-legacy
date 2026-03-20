import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import {
  FileCheck,
  ArrowRight,
  User,
  Building2,
  AlertCircle,
  FileText,
  Calendar,
  IndianRupee,
} from 'lucide-react'
import { toast } from 'sonner'
import useAccountDetails from '@/hooks/use-account-details'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'

// Basic validation schema matching your standard
const acctSchema = z.string().trim().min(5, 'Enter a valid account number')

export default function CreditAuditFetchPage() {
  const nav = useNavigate()
  const [accountId, setAccountId] = useState('')
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const trimmed = useMemo(() => accountId.trim(), [accountId])
  const acctNo = accountId.trim();

  const acctValid = useMemo(() => {
    return acctSchema.safeParse(trimmed).success
  }, [trimmed])

  // ✅ Hook only fires with a valid format to save API calls
  const {
    data: acct,
    isLoading,
    isError,
  } = useAccountDetails(acctValid ? trimmed : '___', true)

  const canGo = acctValid && !!acct

  const handleOpenListing = () => {
    if (!acct) {
      toast.error('Account not found or details not available')
      return
    }
    nav({
      // force route literal to bypass union until route-tree updates
      to: '/creditAudit/listing' as unknown as never,
      search: ((prev: unknown) => ({
        ...(prev as object),
        accountId: trimmed,
      })) as unknown as never,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canGo && !isLoading) {
      handleOpenListing()
    }
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

      <div className='animate-fadeIn max-w-9xl space-y-6 px-4 pt-8 pb-12'>
        <Card className='border-border overflow-hidden shadow-md'>
          <CardHeader className='bg-muted/20 border-border border-b py-6'>
            <CardTitle className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold'>
              <FileCheck className='text-accent h-6 w-6' />{' '}
              {/* Saffron accent */}
              Credit Audit Fetch
            </CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Enter a valid loan account number to view or initiate its Credit
              Audit Report.
            </p>
          </CardHeader>

          <CardContent className='space-y-6 p-6 md:p-8'>
            {/* Input & Action Area - Right Aligned with Zero Layout Shift */}
            <div className='flex w-full flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-end'>
              <div className='relative w-full space-y-2 sm:w-80'>
                <Label
                  htmlFor='audit-lookup-input'
                  className='text-secondary-foreground font-semibold'
                >
                  Account Number
                </Label>
                <Input
                  id='audit-lookup-input'
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Enter loan account number...'
                  inputMode='numeric'
                  className='focus-visible:ring-ring bg-background h-11 w-full text-base transition-shadow focus-visible:ring-2'
                />

                {/* Absolute error message pinned to the input */}
                {!acctValid && trimmed.length > 0 && (
                  <div className='text-destructive animate-fadeIn absolute top-full left-0 mt-1.5 flex items-center gap-1 text-xs font-medium whitespace-nowrap'>
                    <AlertCircle className='h-3.5 w-3.5' />
                    Enter a valid account number (min 5 chars)
                  </div>
                )}
              </div>

              <div className='mt-2 w-full sm:mt-0 sm:w-auto'>
                <Button
                  className='bg-primary text-primary-foreground group h-11 w-full gap-2 px-6 shadow-sm transition-all hover:brightness-105 sm:w-auto'
                  onClick={handleOpenListing}
                  disabled={!canGo || isLoading}
                >
                  {isLoading ? 'Checking...' : 'Open Listing'}
                  {!isLoading && (
                    <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  )}
                </Button>
              </div>
            </div>

            {/* Preview Panel - Rigid Height ensures no jumping */}
            <div className='border-border bg-muted/10 relative flex h-[220px] flex-col justify-center overflow-hidden rounded-xl border p-6 sm:h-[160px]'>
              {/* Subtle decorative edge */}
              <div className='bg-primary/20 absolute top-0 bottom-0 left-0 w-1'></div>

              <div className='text-muted-foreground absolute top-4 left-6 flex items-center gap-2 text-sm font-bold tracking-wider uppercase'>
                <FileText className='h-4 w-4' />
                Borrower Preview
              </div>

              <div className='w-full pt-6'>
                {isLoading ? (
                  <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-5 w-48' />
                    </div>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-5 w-32' />
                    </div>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='hidden h-5 w-24 sm:block' />
                    </div>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='hidden h-5 w-24 sm:block' />
                    </div>
                  </div>
                ) : isError ? (
                  <div className='text-destructive bg-destructive/10 border-destructive/20 animate-fadeIn flex items-center gap-2 rounded-md border p-3 text-sm font-medium'>
                    <AlertCircle className='h-4 w-4 flex-shrink-0' />
                    Failed to fetch details. Verify the account number.
                  </div>
                ) : acct ? (
                  <div className='animate-fadeIn grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
                    <div className='space-y-1'>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <User className='h-3.5 w-3.5' /> Borrower Name
                      </div>
                      <div className='text-foreground truncate text-sm font-bold'>
                        {acct.custName}
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <Building2 className='h-3.5 w-3.5' /> Branch
                      </div>
                      <div className='text-foreground truncate text-sm font-bold'>
                        {acct.branchName ?? acct.branchCode}
                      </div>
                    </div>
                    <div className='hidden space-y-1 sm:block'>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <Calendar className='h-3.5 w-3.5' /> Sanction Date
                      </div>
                      <div className='text-foreground text-sm font-bold'>
                        {acct.sanctDt?.slice(0, 10) ?? '-'}
                      </div>
                    </div>
                    <div className='hidden space-y-1 sm:block'>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <IndianRupee className='h-3.5 w-3.5' /> Loan Limit
                      </div>
                      <div className='text-primary text-sm font-bold'>
                        {acct.loanLimit ?? '-'}
                      </div>
                    </div>
                  </div>
                ) : acctNo.length > 0 && acctValid ? (
                  <div className='text-muted-foreground animate-fadeIn text-center text-sm font-medium'>
                    No account details found for{' '}
                    <span className='text-foreground font-bold'>{acctNo}</span>.
                  </div>
                ) : (
                  <div className='text-muted-foreground text-center text-sm opacity-70'>
                    Enter an account number above to preview borrower details.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
