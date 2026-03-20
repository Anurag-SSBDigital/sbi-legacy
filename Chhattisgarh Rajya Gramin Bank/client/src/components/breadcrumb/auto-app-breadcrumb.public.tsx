import { useMemo, type ComponentProps } from 'react'
import { useLocation } from '@tanstack/react-router'
import { AppBreadcrumb } from './app-breadcrumb.tsx'
import { Home } from './common-crumbs.ts'
import { type Crumb, type CurrentPage } from './types.ts'

type BreadcrumbModel = {
  crumbs: Crumb[]
  currentPage: CurrentPage
}

const SETTINGS_LABELS: Record<string, string> = {
  '/settings': 'Profile',
  '/settings/account': 'Profile',
  '/settings/appearance': 'Appearance',
  '/settings/change-password': 'Change Password',
  '/settings/display': 'Display',
  '/settings/notifications': 'Notifications',
}

const normalizePath = (pathname: string): string => {
  const noQuery = pathname.split('?')[0]
  if (!noQuery || noQuery === '/') return '/'
  return noQuery.endsWith('/') ? noQuery.slice(0, -1) : noQuery
}

const startCase = (value: string): string => {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

const buildPublicBreadcrumbModel = (pathname: string): BreadcrumbModel | null => {
  const normalizedPath = normalizePath(pathname)
  if (normalizedPath === '/' || normalizedPath === '/403' || normalizedPath === '/500') {
    return null
  }

  if (normalizedPath === '/advocate') {
    return {
      crumbs: [Home],
      currentPage: { type: 'label', label: 'Assigned Events' },
    }
  }

  if (normalizedPath === '/valuer') {
    return {
      crumbs: [Home],
      currentPage: { type: 'label', label: 'Assigned Events' },
    }
  }

  if (normalizedPath === '/stock-audit/assigned-audits') {
    return {
      crumbs: [Home],
      currentPage: { type: 'label', label: 'Assigned Audits' },
    }
  }

  const stockDescriptionsMatch = normalizedPath.match(
    /^\/stock-audit\/([^/]+)\/descriptions\/([^/]+)$/
  )
  if (stockDescriptionsMatch) {
    const accountId = stockDescriptionsMatch[1]
    return {
      crumbs: [
        Home,
        {
          type: 'link',
          item: {
            label: 'Assigned Audits',
            to: '/stock-audit/assigned-audits',
          },
        },
        {
          type: 'label',
          label: `Account ${accountId}`,
        },
      ],
      currentPage: { type: 'label', label: 'Descriptions' },
    }
  }

  const stockReportMatch = normalizedPath.match(/^\/stock-audit\/([^/]+)\/report\/([^/]+)$/)
  if (stockReportMatch) {
    const accountId = stockReportMatch[1]
    return {
      crumbs: [
        Home,
        {
          type: 'link',
          item: {
            label: 'Assigned Audits',
            to: '/stock-audit/assigned-audits',
          },
        },
        {
          type: 'label',
          label: `Account ${accountId}`,
        },
      ],
      currentPage: { type: 'label', label: 'Report' },
    }
  }

  if (normalizedPath.startsWith('/settings')) {
    const settingsLabel = SETTINGS_LABELS[normalizedPath] ?? 'Settings'
    if (normalizedPath === '/settings') {
      return {
        crumbs: [Home],
        currentPage: { type: 'label', label: settingsLabel },
      }
    }

    return {
      crumbs: [
        Home,
        {
          type: 'link',
          item: {
            label: 'Settings',
            to: '/settings',
          },
        },
      ],
      currentPage: { type: 'label', label: settingsLabel },
    }
  }

  const segments = normalizedPath.split('/').filter(Boolean)
  const fallbackLabel = segments.length
    ? startCase(segments[segments.length - 1] ?? '')
    : 'Page'

  return {
    crumbs: [Home],
    currentPage: { type: 'label', label: fallbackLabel },
  }
}

type AutoAppBreadcrumbProps = Omit<
  ComponentProps<typeof AppBreadcrumb>,
  'crumbs' | 'currentPage'
>

export function AutoAppBreadcrumb(props: AutoAppBreadcrumbProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const model = useMemo(() => buildPublicBreadcrumbModel(pathname), [pathname])

  if (!model) {
    return null
  }

  return (
    <AppBreadcrumb
      {...props}
      suppressIfGlobal={false}
      crumbs={model.crumbs}
      currentPage={model.currentPage}
    />
  )
}
