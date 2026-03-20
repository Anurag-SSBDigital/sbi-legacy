const ACCESS_TOKEN_KEY = 'token'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'
const tokenMemoryStore = new Map<string, string>()

type TokenShimWindow = Window & {
  __ewsTokenSessionShimInstalled?: boolean
}

export const getAccessToken = (): string =>
  tokenMemoryStore.get(ACCESS_TOKEN_KEY) ?? ''

export const setAccessToken = (token: string): void => {
  if (!token) {
    tokenMemoryStore.delete(ACCESS_TOKEN_KEY)
    return
  }
  tokenMemoryStore.set(ACCESS_TOKEN_KEY, token)
}

export const clearAccessToken = (): void => {
  tokenMemoryStore.delete(ACCESS_TOKEN_KEY)
}

export const installTokenSessionShim = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  const shimWindow = window as TokenShimWindow
  if (shimWindow.__ewsTokenSessionShimInstalled) {
    return
  }
  shimWindow.__ewsTokenSessionShimInstalled = true

  const rawGetItem = Storage.prototype.getItem
  const rawSetItem = Storage.prototype.setItem
  const rawRemoveItem = Storage.prototype.removeItem
  const rawClear = Storage.prototype.clear

  Storage.prototype.getItem = function patchedGetItem(
    key: string
  ): string | null {
    if (this === window.sessionStorage && key === ACCESS_TOKEN_KEY) {
      const token = tokenMemoryStore.get(ACCESS_TOKEN_KEY)
      return token ?? null
    }
    if (this === window.sessionStorage && key === LEGACY_REFRESH_TOKEN_KEY) {
      return null
    }
    return rawGetItem.call(this, key)
  }

  Storage.prototype.setItem = function patchedSetItem(
    key: string,
    value: string
  ): void {
    if (this === window.sessionStorage && key === ACCESS_TOKEN_KEY) {
      if (!value) {
        tokenMemoryStore.delete(ACCESS_TOKEN_KEY)
        return
      }
      tokenMemoryStore.set(ACCESS_TOKEN_KEY, value)
      return
    }
    if (this === window.sessionStorage && key === LEGACY_REFRESH_TOKEN_KEY) {
      return
    }
    rawSetItem.call(this, key, value)
  }

  Storage.prototype.removeItem = function patchedRemoveItem(key: string): void {
    if (this === window.sessionStorage && key === ACCESS_TOKEN_KEY) {
      tokenMemoryStore.delete(ACCESS_TOKEN_KEY)
      return
    }
    if (this === window.sessionStorage && key === LEGACY_REFRESH_TOKEN_KEY) {
      return
    }
    rawRemoveItem.call(this, key)
  }

  Storage.prototype.clear = function patchedClear(): void {
    if (this === window.sessionStorage) {
      tokenMemoryStore.clear()
    }
    rawClear.call(this)
  }

  window.sessionStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
}

installTokenSessionShim()
