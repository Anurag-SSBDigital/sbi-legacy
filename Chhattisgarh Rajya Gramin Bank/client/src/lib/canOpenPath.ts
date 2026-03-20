// src/lib/canOpenPath.ts
import type { AuthUser } from '@/stores/authStore'
import { isPathAllowedInCurrentSurface } from '@/lib/app-surface'
import type { ModuleActions, ModuleName } from '@/lib/permissions'
import { ROUTE_PERMISSIONS } from '@/lib/route-permissions'
import { toProcessPermissionModuleKey } from '@/features/process-settings/process-setting-utils'

const normalizePath = (value: string): string => {
  if (!value) return '/'
  const trimmed = value.trim()
  if (trimmed === '/') return '/'
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

const matchRoutePath = (pathname: string, routePath: string): boolean => {
  const path = normalizePath(pathname)
  const rule = normalizePath(routePath)

  const pathSegments = path.split('/').filter(Boolean)
  const ruleSegments = rule.split('/').filter(Boolean)

  if (pathSegments.length < ruleSegments.length) return false

  for (let i = 0; i < ruleSegments.length; i += 1) {
    const ruleSegment = ruleSegments[i]
    if (ruleSegment.startsWith('$')) continue
    if (pathSegments[i] !== ruleSegment) return false
  }

  return true
}

const matchGenericProcessPath = (
  pathname: string
): { processCodeToken: string } | null => {
  const normalized = normalizePath(pathname)
  const match = normalized.match(/^\/process\/([^/]+)(?:\/initiated)?$/)
  if (!match?.[1]) {
    return null
  }
  return { processCodeToken: match[1] }
}

const hasPermission = (
  user: AuthUser,
  moduleName: string,
  action: string
): boolean => {
  const granted = (user.permissions?.[moduleName] ?? []) as string[]
  return granted.includes(action)
}

const hasPermissionAny = (
  user: AuthUser,
  moduleName: string,
  actions: readonly string[]
): boolean => {
  return actions.some((action) => hasPermission(user, moduleName, action))
}

export const canOpenPath = (
  user: AuthUser | undefined,
  pathname: string
): boolean => {
  /* 1 ▸ unauthenticated */
  if (!user) return false

  if (!isPathAllowedInCurrentSurface(pathname)) {
    return false
  }

  const dynamicProcessRoute = matchGenericProcessPath(pathname)
  if (dynamicProcessRoute) {
    const processModule = toProcessPermissionModuleKey(
      dynamicProcessRoute.processCodeToken
    )
    if (!processModule) {
      return false
    }
    const needsInitiatedView = normalizePath(pathname).endsWith('/initiated')
    if (needsInitiatedView) {
      return hasPermissionAny(user, processModule, ['initiated_view'])
    }
    return hasPermissionAny(user, processModule, ['accounts_view', 'initiate'])
  }

  /* 3 ▸ locate best matching rule (supports dynamic segments like $id) */
  const candidates = ROUTE_PERMISSIONS.filter((r) =>
    matchRoutePath(pathname, r.path)
  )
  const rule = candidates.sort((a, b) => b.path.length - a.path.length)[0]

  if (!rule) return false
  if (rule.authenticatedOnly) return true

  /* 4 ▸ role-only pages */
  if (rule.roleOnly === 'auditor') return !!user.stockAuditor
  if (rule.roleOnly === 'advocate') return !!user.advocate
  if (rule.roleOnly === 'valuer') return !!user.valuer

  /* 5 ▸ granular permission */
  const granted = (user.permissions?.[rule.module] ??
    []) as ModuleActions<ModuleName>[]
  return granted.includes(rule.action)
}
