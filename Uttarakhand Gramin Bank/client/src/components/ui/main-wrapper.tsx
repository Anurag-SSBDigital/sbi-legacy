import { ReactNode } from 'react'
import { Header } from '../layout/header.tsx'
import { Main } from '../layout/main.tsx'
import { ProfileDropdown } from '../profile-dropdown.tsx'
import { Search } from '../search.tsx'
import { ThemeSwitch } from '../theme-switch.tsx'

interface MainWrapperProps {
  children: ReactNode
  extra?: ReactNode
}

export default function MainWrapper({ children, extra }: MainWrapperProps) {
  return (
    <>
      <Header>
        {extra}
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>{children}</Main>
    </>
  )
}
