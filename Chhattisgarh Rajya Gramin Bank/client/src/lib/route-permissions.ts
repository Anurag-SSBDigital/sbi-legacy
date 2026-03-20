import type { ModuleActions, ModuleName } from '@/lib/permissions'

export interface RoutePermission {
  path: string
  module: ModuleName
  action: ModuleActions<ModuleName>
  roleOnly?: 'auditor' | 'advocate' | 'valuer'
  authenticatedOnly?: boolean
}

export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  /* authenticated pages without module gate */
  {
    path: '/',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },
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
    path: '/help-center',
    module: 'workflow_tasks',
    action: 'view',
    authenticatedOnly: true,
  },

  /* role work */
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

  /* admin: masters */
  { path: '/admin/roles/$roleId/edit', module: 'roles', action: 'update' },
  { path: '/admin/roles/create', module: 'roles', action: 'create' },
  { path: '/admin/roles', module: 'roles', action: 'view' },
  { path: '/admin/departements', module: 'departments', action: 'view' },
  { path: '/admin/branches', module: 'branches', action: 'view' },
  { path: '/admin/users', module: 'users', action: 'view' },
  { path: '/admin/auditors', module: 'auditors', action: 'view' },
  { path: '/admin/advocates', module: 'advocates', action: 'view' },
  { path: '/admin/valuers', module: 'valuers', action: 'view' },
  {
    path: '/admin/workflow/$defId/stages',
    module: 'workflow',
    action: 'update',
  },
  { path: '/admin/workflow', module: 'workflow', action: 'view' },
  { path: '/admin/form-designer', module: 'workflow', action: 'view' },
  { path: '/admin/form-schema-library', module: 'workflow', action: 'view' },
  {
    path: '/admin/workflow-document-templates',
    module: 'workflow',
    action: 'view',
  },
  {
    path: '/admin/document-template-library',
    module: 'workflow',
    action: 'view',
  },
  { path: '/admin/workflow-runtime', module: 'workflow', action: 'view' },
  {
    path: '/process/$processCode/initiated',
    module: 'workflow_tasks',
    action: 'view',
  },
  { path: '/process/$processCode', module: 'workflow_tasks', action: 'view' },
  { path: '/workflow/tasks', module: 'workflow_tasks', action: 'view' },
  { path: '/workflow/tasks/$taskId', module: 'workflow_tasks', action: 'view' },
  {
    path: '/admin/alert-workflow/$alertType/$workflowId/stages',
    module: 'alert_workflow',
    action: 'update',
  },
  {
    path: '/admin/alert-workflow',
    module: 'alert_workflow',
    action: 'view',
  },
  {
    path: '/admin/alerts/$alertType',
    module: 'ews_alert',
    action: 'view',
  },
  {
    path: '/admin/alerts-v2-rules',
    module: 'ews_alert',
    action: 'view',
  },
  {
    path: '/admin/alerts-v2-config',
    module: 'ews_alert',
    action: 'view',
  },
  {
    path: '/admin/alerts-v2-adapters',
    module: 'ews_alert',
    action: 'view',
  },
  {
    path: '/admin/alerts-v2-question-masters',
    module: 'ews_alert',
    action: 'view',
  },
  { path: '/admin/security', module: 'security', action: 'view' },
  { path: '/admin/event', module: 'event', action: 'view' },
  {
    path: '/admin/process-settings',
    module: 'process_settings',
    action: 'view',
  },
  {
    path: '/admin/smtp-mail-conf',
    module: 'smtp_mail_conf',
    action: 'view',
  },
  { path: '/admin/data-ingetion', module: 'data-ingestion', action: 'view' },

  /* account summary */
  { path: '/standard/summary', module: 'standard_accounts', action: 'view' },
  { path: '/sma/summary', module: 'sma_accounts', action: 'view' },
  { path: '/npa/summary', module: 'npa_accounts', action: 'view' },

  /* credit and recovery */
  {
    path: '/sarfaesi/sarfaesi-approval-initiation',
    module: 'sarfaesi',
    action: 'initiate',
  },
  { path: '/sarfaesi/tasks/$taskId', module: 'sarfaesi', action: 'view' },
  { path: '/sarfaesi/tasks', module: 'sarfaesi', action: 'view' },
  { path: '/sarfaesi/eligible', module: 'sarfaesi', action: 'view' },
  { path: '/sarfaesi', module: 'sarfaesi', action: 'view' },

  {
    path: '/ots/initiate-ots-compromise',
    module: 'ots',
    action: 'create_proposal',
  },
  { path: '/ots/tasks/$taskId', module: 'ots', action: 'view' },
  { path: '/ots/tasks', module: 'ots', action: 'view' },
  { path: '/ots/eligible', module: 'ots', action: 'view' },
  { path: '/ots', module: 'ots', action: 'view' },

  { path: '/auca/transfer', module: 'auca', action: 'create_transfer' },
  { path: '/auca/tasks/$taskId', module: 'auca', action: 'view' },
  { path: '/auca/tasks', module: 'auca', action: 'view' },
  { path: '/auca/eligible', module: 'auca', action: 'view' },
  { path: '/auca', module: 'auca', action: 'view' },

  {
    path: '/recalled-assets/proposal/$accountNumber',
    module: 'recalled_assets',
    action: 'view',
  },
  {
    path: '/recalled-assets/tasks/$taskId',
    module: 'recalled_assets',
    action: 'view',
  },
  { path: '/recalled-assets/tasks', module: 'recalled_assets', action: 'view' },
  {
    path: '/recalled-assets/eligible',
    module: 'recalled_assets',
    action: 'view',
  },
  { path: '/recalled-assets', module: 'recalled_assets', action: 'view' },

  {
    path: '/problem-loan-review/review/$accountNumber',
    module: 'problem_loan_review',
    action: 'view',
  },
  {
    path: '/problem-loan-review/tasks/$taskId',
    module: 'problem_loan_review',
    action: 'view',
  },
  {
    path: '/problem-loan-review/tasks',
    module: 'problem_loan_review',
    action: 'view',
  },
  {
    path: '/problem-loan-review/eligible',
    module: 'problem_loan_review',
    action: 'view',
  },
  {
    path: '/problem-loan-review',
    module: 'problem_loan_review',
    action: 'view',
  },

  {
    path: '/term-loan-review/$accountId',
    module: 'term_loan_review',
    action: 'view',
  },
  {
    path: '/term-loan-review/summary',
    module: 'term_loan_review',
    action: 'view',
  },
  { path: '/term-loan-review', module: 'term_loan_review', action: 'view' },

  /* stock audit */
  { path: '/audit/dashboard', module: 'stock_audit', action: 'view' },
  { path: '/audit', module: 'stock_audit', action: 'view' },

  /* alerts */
  { path: '/alerts/ews/dashboard', module: 'ews_alert', action: 'view' },
  { path: '/alerts/ews', module: 'ews_alert', action: 'view' },

  /* search */
  { path: '/inspections', module: 'inspections_search', action: 'view' },
  { path: '/notices', module: 'notices_search', action: 'view' },
] as const
