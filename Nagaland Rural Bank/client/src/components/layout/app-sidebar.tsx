import Logo from '@/assets/logo.png'
import { useAuthStore } from '@/stores/authStore.ts'
import { BASE_URL } from '@/lib/api.ts'
import { cn } from '@/lib/utils.ts'
import { useRouteAccess } from '@/hooks/use-route-access.tsx'
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
import { sidebarData } from './data/sidebar-data'
import { NavItem, RouteUserAccess } from './types.ts'

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar & { collapsed: boolean }>) {
  const user = useAuthStore().auth.user

  const canOpenPath = useRouteAccess

  const userType: RouteUserAccess = user?.superAdmin
    ? 'superadmin'
    : user?.admin
      ? 'admin'
      : user?.stockAuditor
        ? 'auditor'
        : user?.advocate
          ? 'advocate'
          : 'user'

  function filterItems(items?: NavItem[]): NavItem[] {
    if (!items) return []
    return items
      .filter((it) =>
        it.url
          ? canOpenPath(it.url)
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
                  // size control
                  'h-10 w-10',
                  'group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8',
                  // visual style
                  'ring-1 ring-white/40 dark:ring-white/10',
                  'bg-[color-mix(in_oklab,var(--color-primary),white_55%)]',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                )}
              >
                <img
                  src={Logo}
                  title='JRGB EWS-CMS'
                  className={cn(
                    'block h-7 w-7 object-cover object-left',
                    'scale-110'
                  )}
                />

                {/* subtle inner ring */}
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[color-mix(in_oklab,var(--color-foreground),transparent_88%)]'
                />
              </span>
              <div
                className={cn(
                  'flex min-w-0 flex-col justify-center leading-tight',
                  // hide text cleanly in collapsed mode
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
                  NRGB EWS-CMS
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
            avatar: `${BASE_URL}/user/profilePic?username=${user?.username}`,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
