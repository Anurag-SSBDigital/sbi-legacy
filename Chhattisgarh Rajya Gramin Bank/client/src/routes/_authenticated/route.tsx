import Cookies from 'js-cookie'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { isExternalRoleUser, isPublicSurface } from '@/lib/app-surface'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { isPasswordChangeRequired } from '@/lib/password-change-policy.ts'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
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

    const requiresPasswordChange = isPasswordChangeRequired(auth.user)
    const isChangePasswordRoute = location.pathname.startsWith('/settings/change-password')
    const isSettingsRoute = location.pathname.startsWith('/settings')
    if (requiresPasswordChange && !isChangePasswordRoute) {
      throw redirect({ to: '/settings/change-password', replace: true })
    }

    if (isPublicSurface && !isExternalRoleUser(auth.user)) {
      throw redirect({ to: '/403', replace: true })
    }

    if (!canOpenPath(auth.user, location.pathname)) {
      throw redirect({ to: '/403', replace: true })
    }

    if (
      auth.user?.stockAuditor &&
      !location.pathname.startsWith('/stock-audit') &&
      !isSettingsRoute
    ) {
      throw redirect({
        to: '/stock-audit/assigned-audits',
        search: { tab: 'PENDING' },
      })
    }

    if (
      auth.user?.advocate &&
      !location.pathname.startsWith('/advocate') &&
      !isSettingsRoute
    ) {
      throw redirect({
        to: '/advocate',
      })
    }

    if (
      auth.user?.valuer &&
      !location.pathname.startsWith('/valuer') &&
      !isSettingsRoute
    ) {
      throw redirect({
        to: '/valuer',
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
