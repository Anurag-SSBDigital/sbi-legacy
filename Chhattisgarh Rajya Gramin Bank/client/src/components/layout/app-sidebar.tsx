// import React from 'react'
// import Logo from '@/assets/logo copy.png'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { BASE_URL } from '@/lib/api.ts'
// import { cn } from '@/lib/utils.ts'
// import { useRouteAccess } from '@/hooks/use-route-access.tsx'
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuItem,
//   SidebarRail,
// } from '@/components/ui/sidebar'
// import { NavGroup } from '@/components/layout/nav-group'
// import { NavUser } from '@/components/layout/nav-user'
// import { sidebarData } from './data/sidebar-data'
// import { NavItem, RouteUserAccess } from './types.ts'
// export function AppSidebar({
//   ...props
// }: React.ComponentProps<typeof Sidebar & { collapsed: boolean }>) {
//   const user = useAuthStore().auth.user
//   const canOpenPath = useRouteAccess
//   const userType: RouteUserAccess = user?.superAdmin
//     ? 'superadmin'
//     : user?.admin
//       ? 'admin'
//       : user?.stockAuditor
//         ? 'auditor'
//         : user?.advocate
//           ? 'advocate'
//           : user?.valuer
//             ? 'valuer'
//             : 'user'
//   function filterItems(items?: NavItem[]): NavItem[] {
//     if (!items) return []
//     return items
//       .filter((it) =>
//         it.url
//           ? canOpenPath(it.url)
//           : it.items && filterItems(it.items).length > 0
//       )
//       .map((it) =>
//         it.items ? { ...it, items: filterItems(it.items) } : it
//       ) as NavItem[]
//   }
//   return (
//     <Sidebar
//       collapsible='icon'
//       variant='floating'
//       {...props}
//       // className={cn(
//       //   props.className,
//       //   'relative overflow-hidden rounded-2xl border border-[color:var(--color-border)]',
//       //   'bg-[color-mix(in_oklab,var(--color-card),white_4%)] dark:bg-[color-mix(in_oklab,var(--color-card),black_6%)]',
//       //   'shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)]'
//       // )}
//     >
//       <SidebarHeader
//         className={cn(
//           'border-b border-[color:var(--color-border)]',
//           'rounded-t-lg bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary),transparent_60%),color-mix(in_oklab,var(--color-accent),transparent_90%))]',
//           'shadow-[inset_0_-1px_0_0_color-mix(in_oklab,var(--color-foreground),transparent_80%)]'
//         )}
//       >
//         <SidebarMenu>
//           <SidebarMenuItem>
//             {/* <div className='flex items-center gap-2 overflow-hidden'>
//               <img
//                 src={Logo}
//                 title='CRGB EWS-CMS'
//                 className='mx-1 h-6 w-6 shrink-0 object-contain'
//               />
//               <span
//                 className={cn(
//                   'max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap',
//                   'text-[18px] leading-none font-extrabold tracking-tight',
//                   'bg-clip-text text-transparent',
//                   'bg-[linear-gradient(90deg,var(--color-primary))]'
//                 )}
//               >
//                 CRGB EWS-CMS
//               </span>
//             </div> */}
//             <div className='group flex items-center gap-4 overflow-hidden'>
//               {/* Logo container */}
//               <span
//                 className={cn(
//                   'relative grid shrink-0 place-items-center rounded-xl',
//                   // size control
//                   'h-10 w-10',
//                   'group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8',
//                   // visual style
//                   'ring-1 ring-white/40 dark:ring-white/10',
//                   'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary),white_12%),color-mix(in_oklab,var(--color-primary),black_8%))]',
//                   'shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
//                 )}
//               >
//                 <img
//                   src={Logo}
//                   title='CRGB EWS-CMS'
//                   className={cn(
//                     'block object-contain',
//                     // logo perfectly centered
//                     'h-8 w-8',
//                     'group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6'
//                   )}
//                 />
//                 {/* subtle inner ring */}
//                 <span
//                   aria-hidden
//                   className='pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[color-mix(in_oklab,var(--color-foreground),transparent_88%)]'
//                 />
//               </span>
//               {/* Text block */}
//               <div
//                 className={cn(
//                   'flex min-w-0 flex-col justify-center leading-tight',
//                   // hide text cleanly in collapsed mode
//                   'group-data-[collapsible=icon]:opacity-0',
//                   'group-data-[collapsible=icon]:w-0',
//                   'group-data-[collapsible=icon]:overflow-hidden',
//                   'transition-all duration-200'
//                 )}
//               >
//                 <div
//                   className={cn(
//                     'max-w-[170px] truncate',
//                     'text-[17px] font-extrabold tracking-tight',
//                     'bg-clip-text text-transparent',
//                     'bg-[linear-gradient(90deg,var(--color-primary),color-mix(in_oklab,var(--color-primary),var(--color-accent)_45%),var(--color-chart-2))]'
//                   )}
//                 >
//                   CRGB EWS-CMS
//                 </div>
//                 <div className='mx-1 max-w-[170px] truncate text-[11px]'>
//                   Early Warning & CMS
//                 </div>
//               </div>
//             </div>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>
//       <SidebarContent>
//         {sidebarData.navGroups
//           .filter((g) => !g.userAccess || g.userAccess.includes(userType))
//           .map((g) => {
//             const visibleItems = filterItems(g.items)
//             if (visibleItems.length === 0) return null
//             return <NavGroup key={g.title} {...g} items={visibleItems} />
//           })}
//       </SidebarContent>
//       <SidebarFooter
//         className={cn(
//           'border-t border-[color:var(--color-border)] px-2 py-2',
//           'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card),transparent_0%),color-mix(in_oklab,var(--color-card),transparent_8%))]'
//         )}
//       >
//         <NavUser
//           user={{
//             name: user?.fullName ?? user?.username ?? '',
//             email: user?.departmentName ?? '',
//             branch: user?.branchName,
//             avatar: `${BASE_URL}/user/profilePic?username=${user?.username}`,
//           }}
//         />
//       </SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   )
// }
// // import React from 'react'
// // import Logo from '@/assets/logo copy.png'
// // import { useAuthStore } from '@/stores/authStore.ts'
// // import { BASE_URL } from '@/lib/api.ts'
// // import { cn } from '@/lib/utils.ts'
// // import { useRouteAccess } from '@/hooks/use-route-access.tsx'
// // import {
// //   Sidebar,
// //   SidebarContent,
// //   SidebarFooter,
// //   SidebarHeader,
// //   SidebarMenu,
// //   SidebarMenuItem,
// //   SidebarRail,
// // } from '@/components/ui/sidebar'
// // import { NavGroup } from '@/components/layout/nav-group'
// // import { NavUser } from '@/components/layout/nav-user'
// // import { sidebarData } from './data/sidebar-data'
// // import { NavItem, RouteUserAccess } from './types.ts'
// // type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
// //   collapsed: boolean
// // }
// // export function AppSidebar({ collapsed, ...sidebarProps }: AppSidebarProps) {
// //   const user = useAuthStore().auth.user
// //   const canOpenPath = useRouteAccess
// //   const userType: RouteUserAccess = user?.superAdmin
// //     ? 'superadmin'
// //     : user?.admin
// //       ? 'admin'
// //       : user?.stockAuditor
// //         ? 'auditor'
// //         : user?.advocate
// //           ? 'advocate'
// //           : user?.valuer
// //             ? 'valuer'
// //             : 'user'
// //   function filterItems(items?: NavItem[]): NavItem[] {
// //     if (!items) return []
// //     return items
// //       .filter((it) =>
// //         it.url
// //           ? canOpenPath(it.url)
// //           : it.items && filterItems(it.items).length > 0
// //       )
// //       .map((it) =>
// //         it.items ? { ...it, items: filterItems(it.items) } : it
// //       ) as NavItem[]
// //   }
// //   return (
// //     <Sidebar
// //       collapsible='icon'
// //       variant='floating'
// //       {...sidebarProps}
// //       className={cn(
// //         'border-r border-[color:var(--color-border)]',
// //         'bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--color-background),var(--color-primary)_6%),_color-mix(in_oklab,var(--color-background),black_4%))]',
// //         'backdrop-blur-sm',
// //         sidebarProps.className
// //       )}
// //     >
// //       {/* BRAND HEADER */}
// //       <SidebarHeader
// //         className={cn(
// //           'relative border-b border-[color:var(--color-border)]',
// //           'rounded-t-lg py-3',
// //           'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary),transparent_10%),color-mix(in_oklab,var(--color-accent),transparent_20%))]',
// //           'shadow-[0_10px_30px_color-mix(in_oklab,var(--color-primary),transparent_82%)]',
// //           'overflow-hidden'
// //         )}
// //       >
// //         {/* soft glow accent */}
// //         <div className='pointer-events-none absolute inset-0 opacity-40 mix-blend-screen'>
// //           <div className='absolute -right-6 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent),white_10%),transparent_70%)]' />
// //           <div className='absolute -left-10 -bottom-16 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-primary),white_8%),transparent_70%)]' />
// //         </div>
// //         <SidebarMenu>
// //           <SidebarMenuItem>
// //             <div
// //               className={cn(
// //                 'relative z-[1] flex items-center gap-3 rounded-l',
// //                 'bg-[color-mix(in_oklab,var(--color-card),transparent_10%)]/80',
// //                 // 'border border-[color-mix(in_oklab,var(--color-border),transparent_20%)]',
// //                 'backdrop-blur-md',
// //                 'transition-all duration-300',
// //                 'hover:border-[color-mix(in_oklab,var(--color-primary),transparent_30%)] hover:shadow-lg hover:shadow-[color-mix(in_oklab,var(--color-primary),transparent_80%)]'
// //               )}
// //             >
// //               <img
// //                 src={Logo}
// //                 title='CRGB EWS-CMS'
// //                 className=' h-8 w-8 shrink-0 bg-white/70 p-0.5 object-contain shadow-sm'
// //               />
// //               <div className='flex min-w-0 flex-col'>
// //                 <span
// //                   className={cn(
// //                     'max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap',
// //                     'text-[20px] leading-none font-extrabold tracking-tight',
// //                     'bg-clip-text text-transparent',
// //                     'bg-[linear-gradient(90deg,var(--color-primary))]'
// //                   )}
// //                 >
// //                   CRGB EWS-CMS
// //                 </span>
// //               </div>
// //             </div>
// //           </SidebarMenuItem>
// //         </SidebarMenu>
// //       </SidebarHeader>
// //       {/* NAV CONTENT */}
// //       <SidebarContent
// //         className={cn(
// //           'py-3',
// //           'space-y-2',
// //           'bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--color-background),black_2%),color-mix(in_oklab,var(--color-background),black_6%))]'
// //         )}
// //       >
// //         {sidebarData.navGroups
// //           .filter((g) => !g.userAccess || g.userAccess.includes(userType))
// //           .map((g) => {
// //             const visibleItems = filterItems(g.items)
// //             if (visibleItems.length === 0) return null
// //             return (
// //               <div
// //                 key={g.title}
// //                 className={cn(
// //                   'rounded-xl border border-[color-mix(in_oklab,var(--color-border),transparent_30%)]',
// //                   'bg-[color-mix(in_oklab,var(--color-card),transparent_6%)]/90',
// //                   'shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
// //                 )}
// //               >
// //                 <NavGroup {...g} items={visibleItems} />
// //               </div>
// //             )
// //           })}
// //       </SidebarContent>
// //       {/* USER FOOTER */}
// //       <SidebarFooter
// //         className={cn(
// //           'border-t border-[color:var(--color-border)] pb-2 pt-2.5',
// //           'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card),transparent_0%),color-mix(in_oklab,var(--color-card),black_6%))]',
// //           'backdrop-blur-sm'
// //         )}
// //       >
// //         <div
// //           className={cn(
// //             'rounded-xl border border-[color-mix(in_oklab,var(--color-border),transparent_25%)]',
// //             'bg-[color-mix(in_oklab,var(--color-background),black_4%)]/90',
// //             'shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
// //             'py-1.5'
// //           )}
// //         >
// //           <NavUser
// //             user={{
// //               name: user?.fullName ?? user?.username ?? '',
// //               email: user?.departmentName ?? '',
// //               branch: user?.branchName,
// //               avatar: `${BASE_URL}/user/profilePic?username=${user?.username}`,
// //             }}
// //           />
// //         </div>
// //       </SidebarFooter>
// //       <SidebarRail />
// //     </Sidebar>
// //   )
// // }
import React, { useMemo } from 'react'
import { IconChecklist, IconListDetails } from '@tabler/icons-react'
import { WorkflowIcon } from 'lucide-react'
import Logo from '@/assets/logo copy.png'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { isPublicSurface } from '@/lib/app-surface'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { cn } from '@/lib/utils.ts'
import { useProfilePicture } from '@/hooks/use-profile-picture.ts'
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
import {
  buildGenericProcessRouteConfigs,
  DEFAULT_PROCESS_SIDEBAR_SECTION,
} from '@/features/process-settings/process-setting-utils.ts'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { NavItem, RouteUserAccess } from './types.ts'

type DynamicProcessNavEntry = {
  section: string
  item: NavItem
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar & { collapsed: boolean }>) {
  const user = useAuthStore().auth.user
  const avatarUrl = useProfilePicture(
    user?.username ?? undefined,
    user?.profilePic
  )

  const { data: processSettingsResponse } = $api.useQuery(
    'get',
    '/api/process-settings/getAll',
    {},
    { enabled: !isPublicSurface }
  )

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

  const dynamicProcessEntries = useMemo<DynamicProcessNavEntry[]>(
    () => {
      if (isPublicSurface) {
        return []
      }

      return buildGenericProcessRouteConfigs(processSettingsResponse)
        .filter((process) => process.showInSidebar)
        .filter((process) =>
          canOpenPath(user ?? undefined, process.accountsPath) ||
          canOpenPath(user ?? undefined, process.initiatedPath)
        )
        .map((process) => {
          return {
            section: process.sidebarSection || DEFAULT_PROCESS_SIDEBAR_SECTION,
            item: {
              title: process.processName,
              icon: WorkflowIcon,
              items: [
                {
                  title: 'Accounts',
                  url: process.accountsPath,
                  icon: IconListDetails,
                },
                {
                  title: 'Initiated',
                  url: process.initiatedPath,
                  icon: IconChecklist,
                },
              ],
            } as unknown as NavItem,
          }
        })
    },
    [processSettingsResponse, user]
  )

  const dynamicNavGroups = useMemo(() => {
    const groupedDynamicItems = new Map<string, NavItem[]>()
    dynamicProcessEntries.forEach(({ section, item }) => {
      const sectionKey = section.trim() || DEFAULT_PROCESS_SIDEBAR_SECTION
      const existing = groupedDynamicItems.get(sectionKey) ?? []
      existing.push(item)
      groupedDynamicItems.set(sectionKey, existing)
    })

    const mergedGroups = sidebarData.navGroups.map((group) => {
      const sectionItems = groupedDynamicItems.get(group.title) ?? []
      if (sectionItems.length === 0) return group

      const mergedItems: NavItem[] = [...group.items]
      const existingUrls = new Set<string>()

      mergedItems.forEach((item) => {
        if ('url' in item && item.url) {
          existingUrls.add(String(item.url))
          return
        }
        item.items?.forEach((sub) => existingUrls.add(String(sub.url)))
      })

      sectionItems.forEach((item) => {
        const urls =
          'url' in item && item.url
            ? [String(item.url)]
            : (item.items ?? []).map((sub) => String(sub.url))

        if (urls.every((url) => !existingUrls.has(url))) {
          mergedItems.push(item)
          urls.forEach((url) => existingUrls.add(url))
        }
      })

      groupedDynamicItems.delete(group.title)
      return { ...group, items: mergedItems }
    })

    const additionalDynamicGroups: typeof mergedGroups = []
    groupedDynamicItems.forEach((items, section) => {
      if (items.length === 0) return
      additionalDynamicGroups.push({
        title: section,
        userAccess: ['admin', 'superadmin', 'user'],
        items,
      })
    })

    if (additionalDynamicGroups.length > 0) {
      const settingsGroupIndex = mergedGroups.findIndex(
        (group) => group.title.trim().toUpperCase() === 'SETTINGS'
      )
      const insertAt =
        settingsGroupIndex >= 0 ? settingsGroupIndex : mergedGroups.length
      mergedGroups.splice(insertAt, 0, ...additionalDynamicGroups)
    }

    return mergedGroups
  }, [dynamicProcessEntries])

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
              {/* Logo container */}
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
                  title='CRGB EWS-CMS'
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

              {/* Text block */}
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
                  CRGB EWS-CMS
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
        {dynamicNavGroups
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
