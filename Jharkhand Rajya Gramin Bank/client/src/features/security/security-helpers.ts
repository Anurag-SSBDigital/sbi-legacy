/* src/features/security/security-helpers.ts */

export type SecurityDetail = {
  id?: string

  collateralNumber: string
  addressDetailsOfSecurity: string
  securityType: string
  customSecurityType: string

  collateralDescription: string
  marketValue: number
  realizableValue: number
  valuationDate: string
}

export type SecurityRow = {
  id?: number

  // (these might still come from API; we keep optional for safety)
  ownerName?: string
  lastInvestigationDate?: string

  collateralNo: string
  address: string
  securityType: string

  collateralDescription: string
  marketValue: number
  realizableValue: number
  valuationDate: string
}

/* ---------------- small safe helpers ---------------- */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function getUnknown(obj: unknown, key: string): unknown {
  if (!isRecord(obj)) return undefined
  return obj[key]
}

function getString(obj: unknown, key: string): string | undefined {
  const v = getUnknown(obj, key)
  return typeof v === 'string' ? v : undefined
}

function getNumber(obj: unknown, key: string): number | undefined {
  const v = getUnknown(obj, key)
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/* ---------------- generic API list extractor ---------------- */
export function extractArray(data: unknown): unknown[] {
  // supports shapes:
  // 1) { data: [] }
  // 2) { data: { content: [] } }
  // 3) [] directly
  if (Array.isArray(data)) return data

  if (isRecord(data)) {
    const d = data['data']
    if (Array.isArray(d)) return d

    if (isRecord(d)) {
      const content = d['content']
      if (Array.isArray(content)) return content
    }
  }

  return []
}

export function inList(
  value: string | undefined | null,
  list: readonly string[]
) {
  if (!value) return false
  return list.some((opt) => opt.toLowerCase() === value.toLowerCase())
}

export function toSecurityRows(apiData: unknown): SecurityRow[] {
  const arr = extractArray(apiData)

  return arr.map((item: unknown) => ({
    id: getNumber(item, 'id'),

    ownerName: getString(item, 'ownerName'),
    lastInvestigationDate: getString(item, 'lastTitleInvestigationDate'),

    collateralNo: getString(item, 'collateralNumber') ?? '',
    address: getString(item, 'addressDetailsOfSecurity') ?? '',
    securityType: getString(item, 'securityType') ?? '',

    collateralDescription: getString(item, 'collateralDescription') ?? '',
    marketValue: getNumber(item, 'marketValue') ?? 0,
    realizableValue: getNumber(item, 'realizableValue') ?? 0,
    valuationDate: getString(item, 'valuationDate') ?? '',
  }))
}
