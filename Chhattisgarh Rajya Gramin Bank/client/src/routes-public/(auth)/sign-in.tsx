import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  isExternalRoleUser,
  isPublicSurface,
  isPathAllowedInCurrentSurface,
} from '@/lib/app-surface'
import SignIn2 from '@/features/auth/sign-in/index.tsx'

interface SignInSearchParams {
  redirect: string
}

const sanitizeRedirect = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '/'
  }

  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    decoded = value
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return '/'
  }
  return decoded
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn2,
  validateSearch: (search: Record<string, unknown>): SignInSearchParams => {
    return {
      redirect: sanitizeRedirect(search?.redirect),
    }
  },
  beforeLoad: ({ context }) => {
    const auth = context.authStore.getState().auth
    const isLoggedIn = !!auth.accessToken

    if (isLoggedIn) {
      if (auth.user?.stockAuditor) {
        throw redirect({
          to: '/stock-audit/assigned-audits',
          search: { tab: 'PENDING' },
        })
      }
      if (auth.user?.advocate) {
        throw redirect({ to: '/advocate' })
      }
      if (auth.user?.valuer) {
        throw redirect({ to: '/valuer' })
      }
      if (isPublicSurface && !isExternalRoleUser(auth.user)) {
        throw redirect({ to: '/403' })
      }
      if (isPathAllowedInCurrentSurface('/')) {
        throw redirect({ to: '/' })
      }
      throw redirect({ to: '/403' })
    }
  },
})
