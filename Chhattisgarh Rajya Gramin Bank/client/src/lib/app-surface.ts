import type { AuthUser } from '@/stores/authStore'

export type AppSurface = 'internal' | 'public'

const rawSurface = String(import.meta.env.VITE_APP_SURFACE ?? 'internal')
  .trim()
  .toLowerCase()

export const APP_SURFACE: AppSurface =
  rawSurface === 'public' ? 'public' : 'internal'

export const isPublicSurface = APP_SURFACE === 'public'

const normalizePathname = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    return '/'
  }

  const withoutHash = trimmed.split('#', 1)[0] ?? trimmed
  const withoutQuery = withoutHash.split('?', 1)[0] ?? withoutHash
  const withLeadingSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`

  if (withLeadingSlash === '/') {
    return '/'
  }

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash
}

const PUBLIC_ROUTE_PREFIXES = ['/settings', '/stock-audit', '/advocate', '/valuer']
const PUBLIC_ROUTE_EXACT = new Set(['/403', '/500'])

export const isPathAllowedInCurrentSurface = (pathname: string): boolean => {
  if (!isPublicSurface) {
    return true
  }

  const normalized = normalizePathname(pathname)
  if (PUBLIC_ROUTE_EXACT.has(normalized)) {
    return true
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  )
}

export const isExternalRoleUser = (
  user: AuthUser | null | undefined
): boolean => {
  return Boolean(user?.stockAuditor || user?.advocate || user?.valuer)
}
