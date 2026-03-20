import { APP_SURFACE } from '@/lib/app-surface'

const firstNonEmpty = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue
    }
    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
}

export const API_BASE_URL =
  APP_SURFACE === 'public'
    ? firstNonEmpty(
        import.meta.env.VITE_APP_API_URL_PUBLIC as string | undefined,
        import.meta.env.VITE_APP_API_URL as string | undefined
      )
    : firstNonEmpty(
        import.meta.env.VITE_APP_API_URL_INTERNAL as string | undefined,
        import.meta.env.VITE_APP_API_URL as string | undefined
      )

export const BASE_PATH =
  (import.meta.env.VITE_BASE_PATH as string | undefined)?.replace(/\/$/, '') ||
  ''
