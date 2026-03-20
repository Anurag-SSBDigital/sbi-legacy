import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore.ts'
import { fetchClient } from '@/lib/api.ts'

const PROFILE_PICTURE_QUERY_KEY = 'profile-picture'

const buildProfilePictureQueryKey = (
  username: string,
  profilePic: string,
  refreshKey?: string | number
) =>
  [
    PROFILE_PICTURE_QUERY_KEY,
    username,
    profilePic,
    refreshKey === undefined ? '' : String(refreshKey),
  ] as const

export function useProfilePicture(
  username?: string,
  profilePic?: string | null,
  refreshKey?: string | number
): string {
  const token = useAuthStore((s) => s.auth.accessToken)
  const [avatarUrl, setAvatarUrl] = useState('')
  const normalizedUsername = username?.trim() ?? ''
  const normalizedProfilePic = profilePic?.trim() ?? ''
  const shouldFetchAvatar =
    normalizedUsername.length > 0 &&
    normalizedProfilePic.length > 0 &&
    token.length > 0

  const queryKey = useMemo(
    () =>
      buildProfilePictureQueryKey(
        normalizedUsername,
        normalizedProfilePic,
        refreshKey
      ),
    [normalizedProfilePic, normalizedUsername, refreshKey]
  )

  const avatarQuery = useQuery<Blob | null>({
    queryKey,
    enabled: shouldFetchAvatar,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const { data, response } = await fetchClient.GET('/user/profilePic', {
        params: {
          query: { username: normalizedUsername },
        },
        parseAs: 'blob',
        signal,
      })

      if (response.status === 404) {
        return null
      }
      if (!response.ok) {
        throw new Error(
          `Failed to fetch profile picture. HTTP ${response.status}`
        )
      }
      if (!(data instanceof Blob) || data.size === 0) {
        return null
      }
      return data
    },
  })

  useEffect(() => {
    if (!shouldFetchAvatar) {
      setAvatarUrl('')
      return
    }
    let objectUrl: string | null = null
    if (avatarQuery.data instanceof Blob) {
      objectUrl = URL.createObjectURL(avatarQuery.data)
      setAvatarUrl(objectUrl)
    } else {
      setAvatarUrl('')
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [avatarQuery.data, shouldFetchAvatar])

  return avatarUrl
}

export const profilePictureQueryKeys = {
  byUser: (username: string) => [PROFILE_PICTURE_QUERY_KEY, username] as const,
}
