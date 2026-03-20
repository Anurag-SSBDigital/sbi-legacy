// src/lib/route-permissions.ts
import { LinkProps } from '@tanstack/react-router'
import type { ModuleActions, ModuleName } from '@/lib/permissions'

export interface RoutePermission {
  path: LinkProps['to']
  module: ModuleName
  action: ModuleActions<ModuleName>
  roleOnly?: 'auditor' | 'advocate'
}

export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  /* pure role-based pages --------------------------------------- */
  {
    path: '/stock-audit/assigned-audits',
    roleOnly: 'auditor',
    module: 'stock_audit',
    action: 'view',
  },
  { path: '/advocate', roleOnly: 'advocate', module: 'users', action: 'view' },

  /* admin “Masters” --------------------------------------------- */
  { path: '/admin/departements', module: 'departments', action: 'view' },
  { path: '/admin/branches', module: 'branches', action: 'view' },
  { path: '/admin/users', module: 'users', action: 'view' },
  { path: '/admin/roles', module: 'roles', action: 'view' },
  { path: '/admin/roles/create', module: 'roles', action: 'create' },
  { path: '/admin/roles/$roleId/edit', module: 'roles', action: 'update' },
  { path: '/admin/auditors', module: 'auditors', action: 'view' },
  { path: '/admin/advocates', module: 'advocates', action: 'view' },
  { path: '/admin/workflow', module: 'workflow', action: 'view' },
  {
    path: '/admin/alerts/ews' as '/admin/alerts/$alertType',
    module: 'alert-master',
    action: 'view',
  },
  {
    path: '/admin/alerts/frm' as '/admin/alerts/$alertType',
    module: 'alert-master',
    action: 'view',
  },
  {
    path: '/admin/data-ingetion',
    module: 'data-ingestion',
    action: 'view',
  },

  /* search dashboards ------------------------------------------- */
  { path: '/inspections', module: 'inspections_search', action: 'view' },
  { path: '/notices', module: 'notices_search', action: 'view' },
  { path: '/loan-review', module: 'loan_review', action: 'review' },
  { path: '/loan-review/summary', module: 'summary', action: 'view' },

  /* stock-audit -------------------------------------------------- */
  { path: '/audit/dashboard', module: 'stock_audit', action: 'view' },
  { path: '/audit', module: 'stock_audit', action: 'view' },

  /* alerts ------------------------------------------------------- */
  {
    path: '/alerts/ews' as '/alerts/$alertType',
    module: 'ews_alert',
    action: 'view',
  },
  // {
  //   path: '/alerts/frm' as '/alerts/$alertType',
  //   module: 'frm_alert',
  //   action: 'view',
  // },
  {
    path: '/alerts/ews/dashboard' as '/alerts/$alertType/dashboard',
    module: 'ews_alert',
    action: 'view',
  },
  // {
  //   path: '/alerts/frm/dashboard' as '/alerts/$alertType/dashboard',
  //   module: 'frm_alert',
  //   action: 'view',
  // },
  // {
  //   path: '/alerts/money-mule',
  //c   module: 'money_mule',
  //   action: 'view',
  // },
  // {
  //   path: '/alerts/account-velocity',
  //   module: 'account_velocity',
  //   action: 'view',
  // },
] as const
