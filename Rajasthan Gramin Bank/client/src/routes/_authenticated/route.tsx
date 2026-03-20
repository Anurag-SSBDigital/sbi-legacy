import Cookies from 'js-cookie'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: ({ context, matches, location }) => {
    const auth = context.authStore.getState().auth

    const isLoggedIn = !!auth.accessToken

    if (!isLoggedIn || !auth.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: encodeURIComponent(location.href),
        },
      })
    }

    if (!canOpenPath(auth.user, matches[matches.length - 1].fullPath)) {
      throw redirect({ to: '/403', replace: true })
    }

    if (
      auth.user?.stockAuditor &&
      !location.pathname.startsWith('/stock-audit')
    ) {
      throw redirect({
        to: '/stock-audit/assigned-audits',
        search: { tab: 'PENDING' },
      })
    }

    if (auth.user?.advocate && !location.pathname.startsWith('/advocate')) {
      throw redirect({
        to: '/advocate',
      })
    }
  },
})

function RouteComponent() {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          <Outlet />
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
