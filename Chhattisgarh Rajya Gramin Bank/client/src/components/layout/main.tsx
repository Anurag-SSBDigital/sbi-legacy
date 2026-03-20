import React from 'react'
import { cn } from '@/lib/utils'
import { AutoAppBreadcrumb } from '@/components/breadcrumb/auto-app-breadcrumb.tsx'
import { SuppressNestedBreadcrumbsProvider } from '@/components/breadcrumb/breadcrumb-visibility-provider.tsx'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        'px-4 py-2.5',
        fixed && 'fixed-main flex grow flex-col overflow-hidden'
      )}
      {...props}
    >
      <AutoAppBreadcrumb className='p-2 pb-3' />
      <SuppressNestedBreadcrumbsProvider>
        {props.children}
      </SuppressNestedBreadcrumbsProvider>
    </main>
  )
}

Main.displayName = 'Main'
