import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Lock,
  ShieldAlert,
  FileQuestion,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { type AuthUser } from '@/stores/authStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { type WorkflowPageV1 } from '../contract/bundle.schema'
import {
  getBundle,
  getPageValues,
  patchPageValues,
} from '../store/bundle.store'
import StagePageRenderer from './StagePageRenderer'

type WorkflowUserType =
  | 'superadmin'
  | 'admin'
  | 'branchmanager'
  | 'auditor'
  | 'advocate'
  | 'valuer'
  | 'user'

interface ExtendedUser extends AuthUser {
  superAdmin?: boolean
  admin?: boolean
  stockAuditor?: boolean
  advocate?: boolean
  valuer?: boolean
  branchManager?: boolean
  roleName?: string
  designationName?: string
  designation?: string
}

export default function DynamicPage(props: {
  bundleId: string
  pageId: string
  workflowKey?: string
}) {
  const nav = useNavigate()
  const user = useAuthStore().auth.user

  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const bundle = useMemo(() => getBundle(props.bundleId), [props.bundleId])

  const userType: WorkflowUserType = useMemo(() => {
    if (!user) return 'user'
    const u = user as ExtendedUser
    if (u.superAdmin) return 'superadmin'
    if (u.admin) return 'admin'
    if (u.stockAuditor) return 'auditor'
    if (u.advocate) return 'advocate'
    if (u.valuer) return 'valuer'

    // Branch Manager detection
    if (u.branchManager) return 'branchmanager'
    const roleText = String(
      u.roleName ?? u.designationName ?? u.designation ?? ''
    ).toLowerCase()
    if (roleText.includes('branch') && roleText.includes('manager'))
      return 'branchmanager'

    return 'user'
  }, [user])

  const goTo = (pageId: string) =>
    nav({
      to: '/wf/dynamic/$bundleId/$pageId',
      params: { bundleId: props.bundleId, pageId },
      search: { key: bundle?.workflowKey },
    })

  // --- Reusable Role Badge UI ---
  const RoleBadge = ({ role }: { role: string }) => (
    <span className='bg-primary/10 text-primary ring-primary/20 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset'>
      {role}
    </span>
  )

  // --- Beautiful Error States ---
  if (!bundle) {
    return (
      <div className='bg-background animate-fadeIn flex min-h-svh items-center justify-center p-6'>
        <Card className='border-t-accent w-full max-w-md border-t-4 shadow-lg'>
          <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-2'>
            <FileQuestion className='text-accent h-6 w-6' />
            <CardTitle className='font-manrope text-accent text-xl'>
              Bundle Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground pt-4 text-sm'>
            The requested workflow bundle could not be loaded. <br />
            <span className='bg-muted text-foreground border-border mt-3 inline-block rounded border px-2 py-1 font-mono text-xs'>
              ID: {props.bundleId}
            </span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Role-based visibility ---
  const canSeePage = (p: WorkflowPageV1) => {
    if (!p.assigneeRoles || p.assigneeRoles.length === 0) return true
    return p.assigneeRoles.includes(userType)
  }

  const visiblePages = bundle.pages.filter(canSeePage)

  if (visiblePages.length === 0) {
    return (
      <div className='bg-background animate-fadeIn flex min-h-svh flex-col'>
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

        <main className='animate-fadeIn mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-4 md:p-8'>
          <Card className='border-t-accent w-full border-t-4 shadow-lg'>
            <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-2'>
              <ShieldAlert className='text-accent h-6 w-6' />
              <CardTitle className='font-manrope text-accent text-xl'>
                No Stage Assigned
              </CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground space-y-4 pt-4 text-sm'>
              <p>
                Your current role does not have any stages assigned in this
                workflow. You might need elevated permissions to proceed.
              </p>

              <div className='bg-muted/50 border-border space-y-2 rounded-md border p-4'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-foreground font-medium'>
                    Current Role:
                  </span>
                  <RoleBadge role={userType} />
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-foreground font-medium'>Workflow:</span>
                  <span className='text-foreground bg-background border-border rounded border px-2 py-0.5 font-mono'>
                    {bundle.workflowKey || props.bundleId}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const idxAll = bundle.pages.findIndex((p) => p.pageId === props.pageId)
  if (idxAll < 0) {
    return (
      <div className='bg-background animate-fadeIn flex min-h-svh items-center justify-center p-6'>
        <Card className='border-t-accent w-full max-w-md border-t-4 shadow-lg'>
          <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-2'>
            <FileQuestion className='text-accent h-6 w-6' />
            <CardTitle className='font-manrope text-accent text-xl'>
              Page Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground pt-4 text-sm'>
            The specific step you are looking for does not exist in this bundle.
            <div className='mt-4 flex items-center justify-between'>
              <span className='bg-muted text-foreground border-border inline-block rounded border px-2 py-1 font-mono text-xs'>
                ID: {props.pageId}
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => goTo(visiblePages[0].pageId)}
              >
                Go to my stage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const page = bundle.pages[idxAll]

  if (!canSeePage(page)) {
    const myFirst = visiblePages[0]
    return (
      <div className='bg-background animate-fadeIn flex min-h-svh flex-col'>
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

        <main className='animate-fadeIn mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-4 md:p-8'>
          <Card className='border-t-accent w-full border-t-4 shadow-lg'>
            <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-2'>
              <Lock className='text-accent h-6 w-6' />
              <CardTitle className='font-manrope text-accent text-xl'>
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground space-y-4 pt-4 text-sm'>
              <p>
                You do not have the required permissions to view or edit this
                specific stage.
              </p>

              <div className='bg-muted/50 border-border space-y-2 rounded-md border p-4'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-foreground font-medium'>
                    Your Role:
                  </span>
                  <RoleBadge role={userType} />
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-foreground font-medium'>
                    Requested Stage:
                  </span>
                  <span className='text-foreground font-medium'>
                    {page.title}
                  </span>
                </div>
              </div>

              <div className='flex justify-end pt-2'>
                <Button
                  type='button'
                  onClick={() => goTo(myFirst.pageId)}
                  className='gap-2'
                >
                  Go to my assigned stage
                  <ArrowRight className='h-4 w-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const idxVisible = visiblePages.findIndex((p) => p.pageId === page.pageId)
  const prev = idxVisible > 0 ? visiblePages[idxVisible - 1] : null
  const next =
    idxVisible < visiblePages.length - 1 ? visiblePages[idxVisible + 1] : null

  const values = getPageValues(props.bundleId, page.pageId)
  const progressPercentage = Math.round(
    ((idxVisible + 1) / visiblePages.length) * 100
  )

  return (
    <div className='bg-background flex min-h-svh flex-col'>
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

      <main className='animate-fadeIn max-w-9xl w-full flex-1 space-y-6 p-4 md:p-8'>
        {/* Header / Progress Section */}
        <div className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h1 className='font-manrope text-foreground text-2xl font-bold tracking-tight'>
                {bundle.workflowKey
                  ? `Workflow: ${bundle.workflowKey}`
                  : 'Active Workflow'}
              </h1>
              <div className='mt-2 flex items-center gap-3 text-sm'>
                <span className='text-muted-foreground'>
                  Step {idxVisible + 1} of {visiblePages.length} — {page.title}
                </span>
                <span className='text-muted-foreground/30'>•</span>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-xs tracking-wider uppercase'>
                    Role:
                  </span>
                  <RoleBadge role={userType} />
                </div>
              </div>
            </div>

            <div className='flex flex-col items-end gap-2'>
              <div className='text-primary text-sm font-bold'>
                {progressPercentage}% Completed
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  type='button'
                  disabled={!prev}
                  onClick={() => prev && goTo(prev.pageId)}
                  className='gap-1.5'
                >
                  <ArrowLeft className='h-3.5 w-3.5' /> Back
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  type='button'
                  disabled={!next}
                  onClick={() => next && goTo(next.pageId)}
                  className='gap-1.5'
                >
                  Next <ArrowRight className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
            <div
              className='bg-primary h-full transition-all duration-500 ease-out'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Workflow Stepper Navigation */}
        <Card className='border shadow-sm'>
          <CardContent className='p-3 sm:p-4'>
            <div className='no-scrollbar flex gap-2 overflow-x-auto pb-1'>
              {visiblePages.map((p, i) => {
                const isActive = p.pageId === page.pageId
                const isPast = i < idxVisible

                return (
                  <Button
                    key={p.pageId}
                    type='button'
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'h-10 shrink-0 rounded-full px-5 font-medium whitespace-nowrap transition-all',
                      isActive &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 ring-primary/20 ring-offset-background shadow-md ring-2 ring-offset-2',
                      isPast &&
                        !isActive &&
                        'border-primary/50 text-foreground bg-primary/5 hover:bg-primary/10',
                      !isPast &&
                        !isActive &&
                        'border-border text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => goTo(p.pageId)}
                  >
                    <span
                      className={cn(
                        'mr-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                        isActive
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-muted text-muted-foreground',
                        isPast &&
                          !isActive &&
                          'bg-primary text-primary-foreground'
                      )}
                    >
                      {i + 1}
                    </span>
                    {p.title}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className='border-t-primary border-t-4 shadow-md'>
          <CardHeader className='pb-4'>
            <CardTitle className='font-manrope text-xl'>{page.title}</CardTitle>
          </CardHeader>

          <div className='px-6 pb-6'>
            <StagePageRenderer
              stage={page.stage}
              initialValues={values}
              onSaveDraft={(patch) =>
                patchPageValues(props.bundleId, page.pageId, patch)
              }
              onSubmit={(patch) => {
                patchPageValues(props.bundleId, page.pageId, patch)

                if (next) {
                  goTo(next.pageId)
                } else {
                  alert(
                    'Submitted. The next stage is assigned to another role (local test).'
                  )
                }
              }}
            />
          </div>
        </Card>
      </main>
    </div>
  )
}
