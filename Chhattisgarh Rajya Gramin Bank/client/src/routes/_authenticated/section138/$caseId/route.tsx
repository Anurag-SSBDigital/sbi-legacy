import { useState } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { Section138Provider } from '@/features/section138/Section138Provider'

export const Route = createFileRoute('/_authenticated/section138/$caseId')({
  component: CaseLayout,
})

function CaseLayout() {
  const { caseId } = Route.useParams()
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  return (
    <Section138Provider caseId={caseId}>
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
        <div className='p-4 md:p-6'>
          <Outlet />
        </div>
      </Main>
    </Section138Provider>
  )
}
