import { createFileRoute, redirect } from '@tanstack/react-router'
import SignIn2 from '@/features/auth/sign-in/index.tsx'

interface SignInSearchParams {
  redirect: string
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn2,
  validateSearch: (search: Record<string, unknown>): SignInSearchParams => {
    return {
      redirect: search?.redirect
        ? decodeURIComponent(search.redirect as string)
        : '/',
    }
  },
  beforeLoad: ({ context }) => {
    const isLoggedIn = !!context.authStore.getState().auth.accessToken

    if (isLoggedIn) {
      throw redirect({ to: '/' })
    }
  },
})
