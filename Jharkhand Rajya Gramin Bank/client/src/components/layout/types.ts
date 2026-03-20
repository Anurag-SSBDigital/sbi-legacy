import { LinkProps } from '@tanstack/react-router'

// interface User {
//   name: string
//   email: string
//   avatar: string
// }

// interface Team {
//   name: string
//   logo: React.ElementType
//   plan: string
// }

export type RouteUserAccess =
  | 'superadmin'
  | 'admin'
  | 'auditor'
  | 'user'
  | 'advocate'
  | 'valuer'

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
  userAccess?: RouteUserAccess[]
}

type NavLink = BaseNavItem & {
  url: LinkProps['to']
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

interface NavGroup {
  title: string
  items: NavItem[]
  userAccess?: RouteUserAccess[]
}

interface SidebarData {
  // user: User
  // teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
