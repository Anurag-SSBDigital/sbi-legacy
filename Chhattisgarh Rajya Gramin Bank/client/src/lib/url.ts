import { API_BASE_URL } from '@/lib/runtime-config'

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i

export function resolveApiUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return undefined

  if (ABSOLUTE_URL_PATTERN.test(trimmedUrl) || trimmedUrl.startsWith('//')) {
    return trimmedUrl
  }

  if (!API_BASE_URL) {
    return trimmedUrl
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, '')
  const path = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`

  return `${baseUrl}${path}`
}
