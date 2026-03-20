import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { fetchClient } from '@/lib/api.ts'
import { useProfilePicture } from '@/hooks/use-profile-picture.ts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ProfileDropdown() {
  const user = useAuthStore()
  const avatarUrl = useProfilePicture(
    user.auth?.user?.username ?? undefined,
    user.auth?.user?.profilePic
  )

  const reset = useAuthStore((s) => s.auth.reset)
  const resetAccessToken = useAuthStore((s) => s.auth.resetAccessToken)

  const navigate = useNavigate()

  const logout = async () => {
    try {
      await fetchClient.POST('/user/logout')
    } catch {
      // Always clear local auth state, even if logout request fails.
    } finally {
      reset()
      resetAccessToken()
      navigate({
        to: '/sign-in',
        search: {
          redirect: '/',
        },
      })
    }
  }

  const hideGroup = user?.auth?.user?.stockAuditor || user?.auth?.user?.advocate

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatarUrl} alt='profile' />
            <AvatarFallback>
              {(user?.auth?.user?.fullName ?? user?.auth?.user?.username)
                ?.split(' ')
                ?.map((a) => a.charAt(0).toUpperCase())
                ?.join('')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            {user?.auth?.user?.fullName && (
              <p className='text-sm leading-none font-medium'>
                {user?.auth?.user?.fullName}
              </p>
            )}
            {user.auth?.user?.username && (
              <p className='text-muted-foreground text-xs leading-none'>
                {user.auth?.user?.username}
              </p>
            )}
            {user.auth?.user?.departmentName && (
              <p className='text-muted-foreground text-xs leading-none'>
                {user.auth?.user?.departmentName}
              </p>
            )}

            {user.auth?.user?.branchName && (
              <p className='text-muted-foreground text-xs leading-none'>
                {user.auth?.user?.branchName} Branch
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        {!hideGroup && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to='/settings'>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to='/settings'>Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
