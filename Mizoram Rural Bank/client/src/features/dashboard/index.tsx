import { useState } from 'react'
import { $api } from '@/lib/api.ts'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from './components/branch-selector.tsx'
import DashboardComponent from './components/dashboard-component.tsx'

export default function Dashboard() {
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const normalize = (v?: string) => (v && v !== 'all' ? v : undefined)

  const selectedId = normalize(branchId) ?? normalize(deptId)

  const { data } = $api.useQuery('get', '/dashboard/data', {
    params: {
      query: { id: selectedId },
      header: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
    },
  })

  return (
    <>
      {/* ===== Top Heading ===== */}
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

      {/* ===== Main ===== */}
      <Main>
        <h1 className='text-4xl font-bold'>Dashboard</h1>

        {data?.data ? (
          <DashboardComponent
            dashboardData={data?.data}
            branchId={branchId ?? deptId}
          />
        ) : null}
      </Main>
    </>
  )
}
