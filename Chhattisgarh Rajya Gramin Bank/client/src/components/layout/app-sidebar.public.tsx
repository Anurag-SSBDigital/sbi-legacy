import React from 'react'
import Logo from '@/assets/logo copy.png'
import { useProfilePicture } from '@/hooks/use-profile-picture.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { cn } from '@/lib/utils.ts'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { NavItem, RouteUserAccess } from '@/components/layout/types.ts'

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar & { collapsed: boolean }>) {
  const user = useAuthStore().auth.user
  const avatarUrl = useProfilePicture(user?.username ?? undefined, user?.profilePic)

  const userType: RouteUserAccess = user?.superAdmin
    ? 'superadmin'
    : user?.admin
      ? 'admin'
      : user?.stockAuditor
        ? 'auditor'
        : user?.advocate
          ? 'advocate'
          : user?.valuer
            ? 'valuer'
            : 'user'

  function filterItems(items?: NavItem[]): NavItem[] {
    if (!items) return []
    return items
      .filter((it) =>
        it.url
          ? canOpenPath(user ?? undefined, String(it.url))
          : it.items && filterItems(it.items).length > 0
      )
      .map((it) =>
        it.items ? { ...it, items: filterItems(it.items) } : it
      ) as NavItem[]
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader
        className={cn(
          'border-b border-[color:var(--color-border)]',
          'rounded-t-lg bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary),transparent_60%),color-mix(in_oklab,var(--color-accent),transparent_90%))]',
          'shadow-[inset_0_-1px_0_0_color-mix(in_oklab,var(--color-foreground),transparent_80%)]'
        )}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <div className='group flex items-center gap-4 overflow-hidden'>
              <span
                className={cn(
                  'relative grid shrink-0 place-items-center rounded-xl',
                  'h-10 w-10',
                  'group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8',
                  'ring-1 ring-white/40 dark:ring-white/10',
                  'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary),white_12%),color-mix(in_oklab,var(--color-primary),black_8%))]',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                )}
              >
                <img
                  src={Logo}
                  title='TGB EWS-CMS'
                  className={cn(
                    'block object-contain',
                    'h-8 w-8',
                    'group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6'
                  )}
                />
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[color-mix(in_oklab,var(--color-foreground),transparent_88%)]'
                />
              </span>

              <div
                className={cn(
                  'flex min-w-0 flex-col justify-center leading-tight',
                  'group-data-[collapsible=icon]:opacity-0',
                  'group-data-[collapsible=icon]:w-0',
                  'group-data-[collapsible=icon]:overflow-hidden',
                  'transition-all duration-200'
                )}
              >
                <div
                  className={cn(
                    'max-w-[170px] truncate',
                    'text-[17px] font-extrabold tracking-tight',
                    'bg-clip-text text-transparent',
                    'bg-[linear-gradient(90deg,var(--color-primary),color-mix(in_oklab,var(--color-primary),var(--color-accent)_45%),var(--color-chart-2))]'
                  )}
                >
                  TGB EWS-CMS
                </div>

                <div className='mx-1 max-w-[170px] truncate text-[11px]'>
                  Early Warning & CMS
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sidebarData.navGroups
          .filter((g) => !g.userAccess || g.userAccess.includes(userType))
          .map((g) => {
            const visibleItems = filterItems(g.items)
            if (visibleItems.length === 0) return null
            return <NavGroup key={g.title} {...g} items={visibleItems} />
          })}
      </SidebarContent>

      <SidebarFooter
        className={cn(
          'border-t border-[color:var(--color-border)] px-2 py-2',
          'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card),transparent_0%),color-mix(in_oklab,var(--color-card),transparent_8%))]'
        )}
      >
        <NavUser
          user={{
            name: user?.fullName ?? user?.username ?? '',
            email: user?.departmentName ?? '',
            branch: user?.branchName,
            avatar: avatarUrl,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
