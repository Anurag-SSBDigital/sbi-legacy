import type { AuthUser } from '@/stores/authStore'

export type WorkflowUserType =
  | 'superadmin'
  | 'admin'
  | 'auditor'
  | 'advocate'
  | 'valuer'
  | 'branchmanager'
  | 'user'

export function getUserType(user: AuthUser | null): WorkflowUserType {
  if (!user) return 'user'

  const u = user as Record<string, unknown>
  if (u.superAdmin) return 'superadmin'
  if (u.admin) return 'admin'
  if (u.stockAuditor) return 'auditor'
  if (u.advocate) return 'advocate'
  if (u.valuer) return 'valuer'

  // ✅ BM detection (adjust once you confirm the real field)
  const roleText = String(
    u.roleName ?? u.designationName ?? u.designation ?? ''
  ).toLowerCase()

  if (roleText.includes('branch') && roleText.includes('manager'))
    return 'branchmanager'

  return 'user'
}
