import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  IconArrowRightDashed,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from '@tabler/icons-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { useSearch } from '@/context/search-context'
import { useTheme } from '@/context/theme-context'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { NavItem, RouteUserAccess } from './layout/types.ts'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  const user = useAuthStore().auth.user

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
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pr-1'>
          <CommandEmpty>No results found.</CommandEmpty>

          {sidebarData.navGroups
            .filter((g) => !g.userAccess || g.userAccess.includes(userType))
            .map((group) => {
              const visibleItems = filterItems(group.items)
              if (visibleItems.length === 0) return null

              return (
                <CommandGroup key={group.title} heading={group.title}>
                  {visibleItems.map((navItem, i) => {
                    if (navItem.url)
                      return (
                        <CommandItem
                          key={`${navItem.url}-${i}`}
                          value={navItem.title}
                          onSelect={() => {
                            runCommand(() => navigate({ to: navItem.url }))
                          }}
                        >
                          <div className='mr-2 flex h-4 w-4 items-center justify-center'>
                            <IconArrowRightDashed className='text-muted-foreground/80 size-2' />
                          </div>
                          {navItem.title}
                        </CommandItem>
                      )

                    return navItem.items?.map((subItem, i) => (
                      <CommandItem
                        key={`${subItem.url}-${i}`}
                        value={subItem.title}
                        onSelect={() => {
                          runCommand(() => navigate({ to: subItem.url }))
                        }}
                      >
                        <div className='mr-2 flex h-4 w-4 items-center justify-center'>
                          <IconArrowRightDashed className='text-muted-foreground/80 size-2' />
                        </div>
                        {subItem.title}
                      </CommandItem>
                    ))
                  })}
                </CommandGroup>
              )
            })}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <IconSun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <IconMoon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <IconDeviceLaptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
