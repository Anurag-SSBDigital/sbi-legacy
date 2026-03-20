import { paths } from '@/types/api/v1.js'
import createFetchClient, { Middleware } from 'openapi-fetch'
import createClient from 'openapi-react-query'
import { useAuthStore } from '@/stores/authStore.ts'
import type { AuthUser } from '@/stores/authStore.ts'
import { isPasswordChangeRequired } from '@/lib/password-change-policy.ts'
import { API_BASE_URL, BASE_PATH } from '@/lib/runtime-config'

const BASE_URL = API_BASE_URL
const AUTH_RETRY_HEADER = 'x-auth-retried'

const fetchClient = createFetchClient<paths>({
  baseUrl: API_BASE_URL,
})

type RefreshAuthPayload = {
  token?: string
  forcePasswordChange?: boolean
  [key: string]: unknown
}

type RefreshResponse = { data?: RefreshAuthPayload }

type CsrfResponse = {
  data?: {
    token?: string
  }
}

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

let inFlightRefresh: Promise<{ accessToken: string } | null> | null = null
let inFlightCsrfToken: Promise<string | null> | null = null
let isNavigatingToSignIn = false

const navigateToSignIn = () => {
  if (typeof window === 'undefined' || isNavigatingToSignIn) {
    return
  }

  const signInPath = `${BASE_PATH}/sign-in`
  if (window.location.pathname === signInPath) {
    return
  }

  isNavigatingToSignIn = true
  const redirectTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.replace(
    `${signInPath}?redirect=${encodeURIComponent(redirectTarget)}`
  )
}

const resetAuthState = (redirectToSignIn = false) => {
  useAuthStore.getState().auth.reset()
  if (redirectToSignIn) {
    navigateToSignIn()
  }
}

const readCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const cookiePrefix = `${encodeURIComponent(name)}=`
  for (const segment of document.cookie.split(';')) {
    const cookie = segment.trim()
    if (cookie.startsWith(cookiePrefix)) {
      return decodeURIComponent(cookie.slice(cookiePrefix.length))
    }
  }

  return null
}

const fetchCsrfToken = async (): Promise<string | null> => {
  const response = await fetch(`${BASE_URL}/user/csrf`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    return readCookieValue(CSRF_COOKIE_NAME)
  }

  try {
    const payload = (await response.json()) as CsrfResponse
    const bodyToken = payload?.data?.token?.trim()
    if (bodyToken) {
      return bodyToken
    }
  } catch {
    // Fall back to cookie token.
  }

  return readCookieValue(CSRF_COOKIE_NAME)
}

const ensureCsrfToken = async (
  forceRefresh = false
): Promise<string | null> => {
  if (!forceRefresh) {
    const existingToken = readCookieValue(CSRF_COOKIE_NAME)
    if (existingToken) {
      return existingToken
    }
  }

  if (!inFlightCsrfToken) {
    inFlightCsrfToken = fetchCsrfToken().finally(() => {
      inFlightCsrfToken = null
    })
  }

  return inFlightCsrfToken
}

const callRefreshEndpoint = async (
  csrfToken: string | null
): Promise<Response> => {
  const headers = new Headers()
  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken)
  }

  return fetch(`${BASE_URL}/user/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers,
  })
}

const refreshTokens = async (): Promise<{ accessToken: string } | null> => {
  try {
    let csrfToken = await ensureCsrfToken()
    let response = await callRefreshEndpoint(csrfToken)

    if (response.status === 403) {
      csrfToken = await ensureCsrfToken(true)
      response = await callRefreshEndpoint(csrfToken)
    }

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as RefreshResponse
    const nextAccessToken = payload?.data?.token ?? ''
    if (!nextAccessToken) {
      return null
    }

    const auth = useAuthStore.getState().auth
    if (payload?.data) {
      const mergedUser = {
        ...(auth.user ?? {}),
        ...payload.data,
      } as AuthUser
      mergedUser.forcePasswordChange = isPasswordChangeRequired(mergedUser)
      auth.setUser(mergedUser)
    }
    auth.setAccessToken(nextAccessToken)
    return { accessToken: nextAccessToken }
  } catch {
    return null
  }
}

export const refreshTokensOnce = async (): Promise<{
  accessToken: string
} | null> => {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshTokens().finally(() => {
      inFlightRefresh = null
    })
  }
  return inFlightRefresh
}

const authMiddleWare: Middleware = {
  async onRequest({ request }) {
    const token = useAuthStore.getState().auth.accessToken
    const requestUrl = new URL(request.url)
    const requestHeaders = new Headers(request.headers)
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
    if (requestUrl.pathname.endsWith('/user/logout')) {
      const csrfToken = await ensureCsrfToken()
      if (csrfToken) {
        requestHeaders.set(CSRF_HEADER_NAME, csrfToken)
      }
    }
    return new Request(request, {
      headers: requestHeaders,
      credentials: 'include',
    })
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) {
      return response
    }

    const requestUrl = new URL(request.url)
    const isAuthEndpoint =
      requestUrl.pathname.endsWith('/user/authenticate') ||
      requestUrl.pathname.endsWith('/user/refresh')
    const alreadyRetried = request.headers.get(AUTH_RETRY_HEADER) === '1'
    if (isAuthEndpoint || alreadyRetried) {
      const shouldRedirect =
        alreadyRetried || requestUrl.pathname.endsWith('/user/refresh')
      resetAuthState(shouldRedirect)
      return response
    }

    const refreshed = await refreshTokensOnce()
    if (!refreshed) {
      resetAuthState(true)
      return response
    }

    const retryHeaders = new Headers(request.headers)
    retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`)
    retryHeaders.set(AUTH_RETRY_HEADER, '1')

    const retryRequest = new Request(request, {
      headers: retryHeaders,
      credentials: 'include',
    })
    return fetch(retryRequest)
  },
}

fetchClient.use(authMiddleWare)

const $api = createClient(fetchClient)

type ApiRequestError = Error & {
  status: number
  data: unknown
}

export async function apiRequest<TResponse = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, init)
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as ApiRequestError
    error.status = response.status
    error.data = payload
    throw error
  }

  return payload as TResponse
}

export { fetchClient, $api, BASE_URL }
