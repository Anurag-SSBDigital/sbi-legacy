import type { ModuleActions, ModuleName } from '@/lib/permissions'

export interface RoutePermission {
  path: string
  module: ModuleName
  action: ModuleActions<ModuleName>
  roleOnly?: 'auditor' | 'advocate' | 'valuer'
  authenticatedOnly?: boolean
}

export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  { path: '/', module: 'workflow_tasks', action: 'view', authenticatedOnly: true },
  {
    path: '/settings',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/settings/account',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/settings/appearance',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/settings/change-password',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/settings/display',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/settings/notifications',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
  {
    path: '/stock-audit/assigned-audits',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/descriptions/$assignmentId',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentId',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentIdACRB',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentIdCRGB',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentIdMRB',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentIdRGB',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/stock-audit/$accountId/report/$assignmentIdUGB',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  {
    path: '/advocate',
    roleOnly: 'advocate',
    module: 'advocates',
    action: 'view',
  },
  {
    path: '/valuer',
    roleOnly: 'valuer',
    module: 'valuers',
    action: 'view',
  },
] as const
