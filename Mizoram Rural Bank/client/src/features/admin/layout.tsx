import { ReactNode } from 'react'
import LoadingBar from 'react-top-loading-bar'
import { Header } from '@/components/layout/header.tsx'
import { Main } from '@/components/layout/main.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown.tsx'
import { Search } from '@/components/search.tsx'
import { ThemeSwitch } from '@/components/theme-switch.tsx'

interface AdminListCreateLayoutProps {
  title: string
  topRightComponent: ReactNode
  isLoading: boolean
}

export default function AdminListCreateLayout({
  title,
  topRightComponent,
  isLoading = false,
}: AdminListCreateLayoutProps) {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='px-4 py-2'>
        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}
        <div className='mb-8 flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            {title}
          </h1>
          {topRightComponent}
        </div>
      </Main>
    </>
  )
}
