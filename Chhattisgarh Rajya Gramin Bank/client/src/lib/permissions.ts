import { useMemo } from 'react'
import { $api } from './api'

export type PermissionSection = Record<string, readonly string[]>
export type PermissionSections = Record<string, PermissionSection>

const PERMISSION_CATALOG_CACHE_KEY = 'permission-catalog-cache-v3'

export const getFlatPermissions = (
  sections: PermissionSections
): PermissionSection =>
  Object.values(sections).reduce((acc, section) => ({ ...acc, ...section }), {})

export const usePermissionSections = () => {
  const cachedSections = useMemo(() => readCachedPermissionSections(), [])
  const query = $api.useQuery(
    'get',
    '/permissions/catalog',
    {},
    {
      enabled: hasAccessToken(),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  )

  const sections = useMemo(() => {
    const fromApi = normalizeSections(query.data?.data)
    if (Object.keys(fromApi).length > 0) {
      writeCachedPermissionSections(fromApi)
      return fromApi
    }
    return cachedSections
  }, [query.data, cachedSections])

  return {
    data: sections,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

function hasAccessToken(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!sessionStorage.getItem('token')
}

function readCachedPermissionSections(): PermissionSections {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = sessionStorage.getItem(PERMISSION_CATALOG_CACHE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return normalizeSections(JSON.parse(raw) as unknown)
  } catch {
    return {}
  }
}

function writeCachedPermissionSections(sections: PermissionSections): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(PERMISSION_CATALOG_CACHE_KEY, JSON.stringify(sections))
}

function normalizeSections(input: unknown): PermissionSections {
  if (!input || typeof input !== 'object') {
    return {}
  }

  const normalized: PermissionSections = {}
  const sectionEntries = Object.entries(input as Record<string, unknown>)

  for (const [sectionName, modulesRaw] of sectionEntries) {
    if (!modulesRaw || typeof modulesRaw !== 'object') {
      continue
    }

    const section: PermissionSection = {}
    const moduleEntries = Object.entries(modulesRaw as Record<string, unknown>)
    for (const [moduleName, actionsRaw] of moduleEntries) {
      if (!Array.isArray(actionsRaw)) {
        continue
      }

      const actions = [
        ...new Set(
          actionsRaw
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        ),
      ]
      if (actions.length > 0) {
        section[moduleName] = actions
      }
    }

    if (Object.keys(section).length > 0) {
      normalized[sectionName] = section
    }
  }

  return normalized
}

export type ModuleName = string
export type ModuleActions<M extends ModuleName = ModuleName> =
  M extends ModuleName ? string : never
export type PermissionMap = Record<string, string[] | undefined>
