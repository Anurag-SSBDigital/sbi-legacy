// src/lib/canOpenPath.ts
import type { AuthUser } from '@/stores/authStore'
import { ROUTE_PERMISSIONS } from '@/lib/route-permissions'

// adjust import

export const canOpenPath = (
  user: AuthUser | undefined,
  pathname: string
): boolean => {
  /* 1 ▸ unauthenticated */
  if (!user) return false

  /* 2 ▸ super/admin shortcut */
  if (user.superAdmin) return true

  /* 3 ▸ locate matching rule (exact or prefix) */
  const rule = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.path || pathname.startsWith(r.path + '/')
  )
  if (!rule) return true // public route (flip to false if you prefer)

  /* 4 ▸ role-only pages */
  if (rule.roleOnly === 'auditor') return !!user.stockAuditor
  if (rule.roleOnly === 'advocate') return !!user.advocate

  /* 5 ▸ granular permission */
  const granted = user.permissions?.[rule.module] ?? []
  return granted.includes('view')
}
