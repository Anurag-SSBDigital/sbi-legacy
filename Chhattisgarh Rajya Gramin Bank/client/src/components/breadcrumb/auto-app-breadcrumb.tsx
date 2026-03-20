import { useMemo, type ComponentProps } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { canOpenPath } from '@/lib/canOpenPath.ts'
import { AppBreadcrumb } from './app-breadcrumb.tsx'
import { Home } from './common-crumbs.ts'
import { Crumb, CrumbItem, CurrentPage } from './types.ts'

type BreadcrumbModel = {
  crumbs: Crumb[]
  currentPage: CurrentPage
}

const SUMMARY_ROOTS = ['standard', 'sma', 'npa'] as const

const SUMMARY_ITEMS = [
  { label: 'Standard Accounts', to: '/standard/summary' },
  { label: 'SMA Accounts', to: '/sma/summary' },
  { label: 'NPA Accounts', to: '/npa/summary' },
] as const

const SUMMARY_INDEX: Record<(typeof SUMMARY_ROOTS)[number], number> = {
  standard: 0,
  sma: 1,
  npa: 2,
}

const ACRONYMS = new Set([
  'acrb',
  'auca',
  'crgb',
  'dmr',
  'esr',
  'ews',
  'frm',
  'id',
  'mrb',
  'npa',
  'ots',
  'rgb',
  'sma',
  'smtp',
  'ugb',
  'v2',
])

const TOKEN_LABELS: Record<string, string> = {
  admin: 'Administration',
  alerts: 'Alerts',
  appearance: 'Appearance',
  'alert-workflow': 'Alert Workflow',
  approvals: 'Approvals',
  auca: 'AUCA',
  branches: 'Branches',
  create: 'Create',
  dashboard: 'Dashboard',
  data: 'Data',
  'data-ingetion': 'Data Ingestion',
  departements: 'Departments',
  display: 'Display',
  'dmr-alert': 'DMR Alert',
  event: 'Event Type',
  form: 'Form',
  'form-designer': 'Form Designer',
  'form-schema-library': 'Form Schema Library',
  help: 'Help',
  inspections: 'Inspections',
  initiated: 'Initiated',
  legal: 'Legal',
  my: 'My',
  notices: 'Notices',
  notifications: 'Notifications',
  ots: 'OTS',
  'page-builder': 'Page Builder',
  proforma: 'Proforma',
  'problem-loan-review': 'Problem Loan Review',
  process: 'Process',
  proposal: 'Proposal',
  'recalled-assets': 'Recalled Assets',
  report: 'Report',
  review: 'Review',
  roles: 'Roles',
  sarfaesi: 'SARFAESI',
  search: 'Search',
  security: 'Security Type',
  settings: 'Settings',
  'smtp-mail-conf': 'SMTP Mail Configuration',
  stages: 'Stages',
  summary: 'Summary',
  tasks: 'Tasks',
  transfer: 'Transfer',
  users: 'Users',
  valuer: 'Valuer',
  workflow: 'Workflow',
  'workflow-document-templates': 'Workflow Document Templates',
  'workflow-runtime': 'Workflow Runtime',
}

const PATH_LABEL_OVERRIDES: Record<string, string> = {
  '/admin': 'Administration',
  '/admin/alert-workflow': 'Alert Workflow',
  '/admin/alerts-v2-adapters': 'EWS Adapters',
  '/admin/alerts-v2-config': 'EWS Config / Thresholds',
  '/admin/alerts-v2-question-masters': 'Question Masters',
  '/admin/alerts-v2-rules': 'EWS Rules',
  '/admin/document-template-library': 'Document Template Library',
  '/admin/form-designer': 'Form Designer',
  '/admin/form-schema-library': 'Form Schema Library',
  '/admin/process-settings': 'Process Settings',
  '/admin/roles': 'Roles',
  '/admin/smtp-mail-conf': 'SMTP Mail Configuration',
  '/admin/workflow': 'Workflow Definitions',
  '/admin/workflow-document-templates': 'Workflow Document Templates',
  '/alerts/dmr': 'DMR Alerts',
  '/alerts/dmr-alert': 'DMR Alerts',
  '/alerts/ews': 'EWS Alerts',
  '/alerts/ews/dashboard': 'EWS Dashboard',
  '/audit': 'Stock Audit Accounts',
  '/audit/dashboard': 'Stock Audit Dashboard',
  '/auca': 'AUCA Accounts',
  '/auca/eligible': 'AUCA Eligible Accounts',
  '/auca/tasks': 'AUCA Tasks',
  '/auca/transfer': 'AUCA Transfer',
  '/help-center': 'Help Center',
  '/loan-review': 'Loan Review',
  '/loan-review/summary': 'Loan Review Summary',
  '/npa/summary': 'NPA Accounts',
  '/ots': 'OTS Accounts',
  '/ots/eligible': 'OTS Eligible Accounts',
  '/ots/tasks': 'OTS Tasks',
  '/problem-loan-review': 'Problem Loan Review',
  '/problem-loan-review/eligible': 'Problem Loan Review Eligible Accounts',
  '/problem-loan-review/tasks': 'Problem Loan Review Tasks',
  '/recalled-assets': 'Recalled Assets',
  '/recalled-assets/eligible': 'Recalled Asset Eligible Accounts',
  '/recalled-assets/tasks': 'Recalled Asset Tasks',
  '/sarfaesi': 'SARFAESI Accounts',
  '/sarfaesi/eligible': 'SARFAESI Eligible Accounts',
  '/sarfaesi/tasks': 'SARFAESI Tasks',
  '/settings': 'Settings',
  '/settings/account': 'Profile',
  '/settings/change-password': 'Change Password',
  '/settings/display': 'Display',
  '/settings/notifications': 'Notifications',
  '/sma/summary': 'SMA Accounts',
  '/standard/summary': 'Standard Accounts',
  '/term-loan-review': 'Term Loan Review',
  '/term-loan-review/summary': 'Term Loan Review Summary',
  '/valuer': 'Assigned Events',
  '/advocate': 'Assigned Events',
  '/vehicle-act': 'Vehicle Act',
  '/vehicle-act/initiated': 'Vehicle Act Initiated',
  '/section-138': 'Section 138',
  '/section-138/initiated': 'Section 138 Initiated',
  '/esr': 'ESR',
  '/esr/initiated': 'ESR Initiated',
  '/credit-risk-audit': 'Credit Risk Audit',
  '/workflow/tasks': 'My Tasks',
}

const LINKABLE_CRUMB_PATHS = new Set<string>([
  '/admin',
  '/admin/alert-workflow',
  '/admin/roles',
  '/admin/workflow',
  '/alerts/dmr',
  '/alerts/ews',
  '/audit',
  '/auca',
  '/auca/tasks',
  '/loan-review',
  '/npa/summary',
  '/ots',
  '/ots/tasks',
  '/problem-loan-review',
  '/problem-loan-review/tasks',
  '/recalled-assets',
  '/recalled-assets/tasks',
  '/sarfaesi',
  '/sarfaesi/tasks',
  '/settings',
  '/sma/summary',
  '/standard/summary',
  '/term-loan-review',
  '/workflow/tasks',
])

const ADMIN_PAGE_DROPDOWN_ITEMS: readonly CrumbItem[] = [
  { label: 'Departments', to: '/admin/departements' },
  { label: 'Branches', to: '/admin/branches' },
  { label: 'Roles', to: '/admin/roles' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Auditors', to: '/admin/auditors' },
  { label: 'Advocates', to: '/admin/advocates' },
  { label: 'Valuers', to: '/admin/valuers' },
  { label: 'Workflow Definitions', to: '/admin/workflow' },
  { label: 'Alert Workflow', to: '/admin/alert-workflow' },
  { label: 'Process Settings', to: '/admin/process-settings' },
  { label: 'Form Designer', to: '/admin/form-designer' },
  { label: 'Form Schema Library', to: '/admin/form-schema-library' },
  {
    label: 'Workflow Document Templates',
    to: '/admin/workflow-document-templates',
  },
  {
    label: 'Document Template Library',
    to: '/admin/document-template-library',
  },
  { label: 'EWS Rules', to: '/admin/alerts-v2-rules' },
  { label: 'EWS Config / Thresholds', to: '/admin/alerts-v2-config' },
  { label: 'EWS Adapters', to: '/admin/alerts-v2-adapters' },
  { label: 'Question Masters', to: '/admin/alerts-v2-question-masters' },
  { label: 'Security Type', to: '/admin/security' },
  { label: 'Event Type', to: '/admin/event' },
  { label: 'SMTP Mail Configuration', to: '/admin/smtp-mail-conf' },
  { label: 'Workflow Runtime', to: '/admin/workflow-runtime' },
]

function normalizePath(pathname: string): string {
  const noQuery = pathname.split('?')[0]
  if (!noQuery || noQuery === '/') return '/'
  return noQuery.endsWith('/') ? noQuery.slice(0, -1) : noQuery
}

function isSummaryCategory(
  segment?: string
): segment is (typeof SUMMARY_ROOTS)[number] {
  return (
    !!segment &&
    SUMMARY_ROOTS.includes(segment as (typeof SUMMARY_ROOTS)[number])
  )
}

function startCase(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase()
      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase()
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function isLikelyIdentifier(segment: string): boolean {
  return /^[0-9]+$/.test(segment) || /^[0-9a-f]{8,}$/i.test(segment)
}

function resolvePathLabel(
  path: string,
  segments: string[],
  index: number
): string {
  const exactLabel = PATH_LABEL_OVERRIDES[path]
  if (exactLabel) return exactLabel

  const segment = segments[index]
  const previous = segments[index - 1]

  if (segments[0] === 'process' && index === 1) {
    return `${startCase(segment)} Accounts`
  }

  if (segments[0] === 'alerts' && index === 1) {
    return `${segment.toUpperCase()} Alerts`
  }

  if (previous === 'tasks') {
    return `Task ${segment}`
  }

  if (previous === 'summary') {
    return `Account ${segment}`
  }

  if (previous === 'review' || previous === 'proposal') {
    return `Account ${segment}`
  }

  if (previous === 'report') {
    return `Assignment ${segment}`
  }

  if (previous === 'roles' && segment !== 'create') {
    return 'Role'
  }

  if (previous === 'alerts-v2-rules' && segment !== 'create-version') {
    return `Rule ${segment}`
  }

  if (previous === 'workflow' && segments[0] === 'admin') {
    return `Workflow ${segment}`
  }

  const tokenLabel = TOKEN_LABELS[segment]
  if (tokenLabel) return tokenLabel

  return startCase(segment)
}

function isLinkablePath(
  path: string,
  segments: string[],
  index: number
): boolean {
  if (LINKABLE_CRUMB_PATHS.has(path)) return true

  if (segments[0] === 'process' && index === 1) return true
  if (segments[0] === 'alerts' && index === 1) return true
  if (segments[0] === 'admin' && segments[1] === 'alerts' && index === 2) {
    return true
  }

  return false
}

function buildSummaryBreadcrumb(
  category: (typeof SUMMARY_ROOTS)[number],
  segments: string[]
): BreadcrumbModel {
  const summaryIndex = SUMMARY_INDEX[category]
  const basePath = `/${category}/summary`
  const crumbs: Crumb[] = [Home]

  const dropdownCurrent: CurrentPage = {
    type: 'dropdown',
    selectedIndex: summaryIndex,
    items: [...SUMMARY_ITEMS],
  }

  if (segments.length === 2) {
    return { crumbs, currentPage: dropdownCurrent }
  }

  crumbs.push({
    type: 'dropdown',
    label: 'Summary',
    selectedIndex: summaryIndex,
    items: [...SUMMARY_ITEMS],
  })

  const accountId = segments[2]
  crumbs.push({
    type: 'link',
    item: {
      label: `Account ${accountId}`,
      to: `${basePath}/${accountId}`,
    },
  })

  if (segments.length === 3) {
    return {
      crumbs,
      currentPage: {
        type: 'label',
        label: `Account ${accountId}`,
      },
    }
  }

  if (segments[3] === 'action') {
    if (segments.length === 4) {
      return {
        crumbs,
        currentPage: {
          type: 'label',
          label: 'Actions',
        },
      }
    }

    crumbs.push({
      type: 'link',
      item: {
        label: 'Actions',
        to: `${basePath}/${accountId}/action`,
      },
    })

    const finalSegment = segments[segments.length - 1]
    return {
      crumbs,
      currentPage: {
        type: 'label',
        label: resolvePathLabel(
          `${basePath}/${accountId}/action/${finalSegment}`,
          segments,
          segments.length - 1
        ),
      },
    }
  }

  return {
    crumbs,
    currentPage: {
      type: 'label',
      label: resolvePathLabel(
        `${basePath}/${segments.slice(2).join('/')}`,
        segments,
        segments.length - 1
      ),
    },
  }
}

type BuildBreadcrumbOptions = {
  adminPageItems?: readonly CrumbItem[]
}

function buildGenericBreadcrumb(
  pathname: string,
  segments: string[],
  options: BuildBreadcrumbOptions = {}
): BreadcrumbModel {
  const crumbs: Crumb[] = [Home]

  let pathSoFar = ''
  const penultimateIndex = segments.length - 2

  for (let index = 0; index <= penultimateIndex; index += 1) {
    const segment = segments[index]
    if (!segment) continue

    if (
      isLikelyIdentifier(segment) &&
      !(
        (segments[0] === 'process' && index === 1) ||
        (segments[0] === 'alerts' && index === 1)
      )
    ) {
      continue
    }

    pathSoFar = `${pathSoFar}/${segment}`
    const label = resolvePathLabel(pathSoFar, segments, index)

    if (pathSoFar === '/admin') {
      crumbs.push({
        type: 'label',
        label,
      })
      continue
    }

    if (!isLinkablePath(pathSoFar, segments, index)) {
      continue
    }

    crumbs.push({
      type: 'link',
      item: {
        label,
        to: pathSoFar,
      },
    })
  }

  const currentIndex = segments.length - 1
  const currentPath = pathname
  const adminDropdownItems = options.adminPageItems ?? []

  if (
    segments[0] === 'admin' &&
    segments.length === 2 &&
    adminDropdownItems.length > 0
  ) {
    const selectedIndex = adminDropdownItems.findIndex(
      (item) => normalizePath(item.to) === pathname
    )

    if (selectedIndex >= 0) {
      return {
        crumbs,
        currentPage: {
          type: 'dropdown',
          items: [...adminDropdownItems],
          selectedIndex,
        },
      }
    }
  }

  const currentPage: CurrentPage = {
    type: 'label',
    label: resolvePathLabel(currentPath, segments, currentIndex),
  }

  return { crumbs, currentPage }
}

function buildBreadcrumbModel(
  pathname: string,
  options: BuildBreadcrumbOptions = {}
): BreadcrumbModel | null {
  const normalizedPath = normalizePath(pathname)
  if (normalizedPath === '/') {
    return null
  }

  const segments = normalizedPath.slice(1).split('/').filter(Boolean)
  if (segments.length === 0) {
    return null
  }

  if (
    segments.length >= 2 &&
    isSummaryCategory(segments[0]) &&
    segments[1] === 'summary'
  ) {
    return buildSummaryBreadcrumb(segments[0], segments)
  }

  return buildGenericBreadcrumb(normalizedPath, segments, options)
}

type AutoAppBreadcrumbProps = Omit<
  ComponentProps<typeof AppBreadcrumb>,
  'crumbs' | 'currentPage'
>

export function AutoAppBreadcrumb(props: AutoAppBreadcrumbProps) {
  const user = useAuthStore((state) => state.auth.user)
  const pathname = useLocation({ select: (location) => location.pathname })
  const adminPageItems = useMemo(() => {
    if (!user) {
      return [] as CrumbItem[]
    }
    return ADMIN_PAGE_DROPDOWN_ITEMS.filter((item) =>
      canOpenPath(user, item.to)
    )
  }, [user])
  const model = useMemo(
    () => buildBreadcrumbModel(pathname, { adminPageItems }),
    [pathname, adminPageItems]
  )

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
