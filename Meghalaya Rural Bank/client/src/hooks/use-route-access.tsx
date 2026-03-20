// src/hooks/useRouteAccess.tsx
import { useAuthStore } from '@/stores/authStore.ts'
import { canOpenPath } from '@/lib/canOpenPath'

export const useRouteAccess = (pathname: string): boolean => {
  const user = useAuthStore((s) => s.auth.user)
  return user ? canOpenPath(user, pathname) : false
}
