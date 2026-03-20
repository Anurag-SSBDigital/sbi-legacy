import { paths } from '@/types/api/v1.js'
import { create } from 'zustand'
import { PermissionMap } from '@/lib/permissions.ts'
import {
  clearAccessToken,
  getAccessToken as readAccessToken,
  setAccessToken as storeAccessToken,
} from '@/lib/token-vault'

export type AuthUser =
  paths['/user/authenticate']['post']['responses']['200']['content']['*/*']['data'] &
    paths['/user/details']['get']['responses']['200']['content']['*/*']['data'] & {
      permissions?: PermissionMap | undefined | null
      forcePasswordChange?: boolean | null
      status?: string | null
    }

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    lastFetched: number | null
    setLastFetched: (timestamp: number) => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const initToken = readAccessToken()
  const initUserToken = sessionStorage.getItem('user')
  const initUser = initUserToken ? JSON.parse(initUserToken) : null

  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          sessionStorage.setItem('user', JSON.stringify(user))
          return { ...state, auth: { ...state.auth, user } }
        }),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          storeAccessToken(accessToken)
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          clearAccessToken()
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          clearAccessToken()
          sessionStorage.removeItem('user')
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              accessToken: '',
              lastFetched: null,
            },
          }
        }),
      lastFetched: null,
      setLastFetched: (timestamp) =>
        set((state) => ({
          ...state,
          auth: { ...state.auth, lastFetched: timestamp },
        })),
    },
  }
})

export const useAuthStatus: () => boolean = () =>
  !!useAuthStore().auth.accessToken

export const useBranchId = () => useAuthStore().auth.user?.branchId
