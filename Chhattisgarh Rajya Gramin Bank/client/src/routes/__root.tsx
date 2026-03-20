import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { fetchClient, refreshTokensOnce } from '@/lib/api.ts'
import { isPasswordChangeRequired } from '@/lib/password-change-policy.ts'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  authStore: typeof useAuthStore
}>()({
  beforeLoad: async ({ context }) => {
    let token = context.authStore.getState().auth.accessToken
    if (!token) {
      const refreshed = await refreshTokensOnce()
      if (!refreshed) return null
      token = refreshed.accessToken
    }

    const { user, lastFetched } = context.authStore.getState().auth
    const now = Date.now()

    // If user exists AND fetched within last 2 minutes (120000 ms), skip
    if (user?.id && lastFetched && now - lastFetched < 120000) return true

    try {
      const res = await fetchClient.GET('/user/details', {
        params: { header: { Authorization: `Bearer ${token}` } },
      })
      if (!res.response?.ok || !res?.data?.data) {
        return true
      }

      context.authStore.setState((state) => {
        const mergedUser = { ...state.auth.user, ...res.data.data }
        return {
          ...state,
          auth: {
            ...state.auth,
            user: {
              ...mergedUser,
              forcePasswordChange: isPasswordChangeRequired(mergedUser),
            },
            lastFetched: now,
          },
        }
      })
    } catch {
      // console.error('Failed to fetch user details:', err)
    }

    return true
  },
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={3000} />
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
