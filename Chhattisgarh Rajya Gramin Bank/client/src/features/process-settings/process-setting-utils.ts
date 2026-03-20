function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  if (isRecord(data)) {
    if (Array.isArray(data.data)) return data.data
    if (isRecord(data.data) && Array.isArray(data.data.content)) {
      return data.data.content
    }
  }

  return []
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeProcessCodeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export type ProcessSettingLike = {
  id?: string
  processCode?: string
  processName?: string
  wfDefKey?: string
  active?: boolean
  showInSidebar?: boolean
  sidebarSection?: string
}

export type GenericProcessRouteConfig = {
  processCode: string
  processName: string
  routeCode: string
  showInSidebar: boolean
  sidebarSection: string
  processPermissionModule: string
  accountsPath: `/process/${string}`
  initiatedPath: `/process/${string}/initiated`
}

export const DEFAULT_PROCESS_SIDEBAR_SECTION = 'CREDIT & RECOVERY'

export function toProcessPermissionModuleKey(
  processCodeOrRouteToken: string
): string {
  const token = normalizeProcessCodeToken(processCodeOrRouteToken)
  return token ? `process_${token}` : ''
}

const EXCLUDED_GENERIC_PROCESS_CODES = new Set(['STANDARD', 'SMA', 'NPA'])

export function isProcessEligibleForGenericPages(processCode: string): boolean {
  const normalized = normalizeString(processCode).toUpperCase()
  if (!normalized) return false
  return !EXCLUDED_GENERIC_PROCESS_CODES.has(normalized)
}

function normalizeActive(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return true
}

function normalizeShowInSidebar(value: unknown): boolean {
  return value === true
}

function normalizeSidebarSection(value: unknown): string {
  const section = normalizeString(value)
  return section || DEFAULT_PROCESS_SIDEBAR_SECTION
}

function toProcessRouteCode(processCode: string): string {
  const normalized = processCode.trim().toLowerCase()
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || normalized
}

function normalizeProcessRouteToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeProcessSettings(data: unknown): ProcessSettingLike[] {
  const byCode = new Map<string, ProcessSettingLike>()

  for (const item of extractArray(data)) {
    if (!isRecord(item)) continue

    const processCode = normalizeString(item.processCode).toUpperCase()
    if (!processCode) continue

    const next: ProcessSettingLike = {
      id: normalizeString(item.id) || undefined,
      processCode,
      processName: normalizeString(item.processName) || processCode,
      wfDefKey: normalizeString(item.wfDefKey) || undefined,
      active: normalizeActive(item.active),
      showInSidebar: normalizeShowInSidebar(item.showInSidebar),
      sidebarSection: normalizeSidebarSection(item.sidebarSection),
    }

    const existing = byCode.get(processCode)
    if (!existing || (next.active && !existing.active)) {
      byCode.set(processCode, next)
    }
  }

  return [...byCode.values()].sort((a, b) =>
    (a.processName ?? '').localeCompare(b.processName ?? '')
  )
}

export function buildGenericProcessRouteConfigs(
  data: unknown
): GenericProcessRouteConfig[] {
  return normalizeProcessSettings(data)
    .filter((setting) => setting.active !== false)
    .filter((setting) => Boolean(setting.processCode))
    .filter((setting) =>
      isProcessEligibleForGenericPages(setting.processCode as string)
    )
    .map((setting) => {
      const processCode = setting.processCode as string
      const processName = setting.processName || processCode
      const routeCode = toProcessRouteCode(processCode)
      return {
        processCode,
        processName,
        routeCode,
        showInSidebar: setting.showInSidebar === true,
        sidebarSection: normalizeSidebarSection(setting.sidebarSection),
        processPermissionModule: toProcessPermissionModuleKey(processCode),
        accountsPath: `/process/${routeCode}`,
        initiatedPath: `/process/${routeCode}/initiated`,
      }
    })
}

export function resolveProcessRouteConfigByParam(
  data: unknown,
  processCodeParam: string
): GenericProcessRouteConfig | undefined {
  const targetToken = normalizeProcessRouteToken(processCodeParam)
  if (!targetToken) return undefined

  return buildGenericProcessRouteConfigs(data).find((process) => {
    const codeToken = normalizeProcessRouteToken(process.processCode)
    return process.routeCode === targetToken || codeToken === targetToken
  })
}

export function getWorkflowDefKeyByProcessCode(
  data: unknown,
  processCode: string
): string | undefined {
  const targetCode = normalizeString(processCode).toUpperCase()
  if (!targetCode) return undefined

  let fallbackWfDefKey: string | undefined

  for (const item of extractArray(data)) {
    if (!isRecord(item)) continue

    const code = normalizeString(item.processCode).toUpperCase()
    if (code !== targetCode) continue

    const wfDefKey = normalizeString(item.wfDefKey)
    if (!wfDefKey) continue

    if (item.active === true) return wfDefKey
    if (!fallbackWfDefKey) fallbackWfDefKey = wfDefKey
  }

  return fallbackWfDefKey
}
