// src/lib/permissions.ts
export const PERMISSION_SECTIONS = {
  Masters: {
    departments: ['view', 'create', 'update', 'delete'],
    branches: ['view', 'create', 'update', 'delete'],
    roles: ['view', 'create', 'update', 'delete'],
    users: ['view', 'create', 'update', 'delete', 'assign_role'],
    auditors: ['view', 'create', 'update', 'delete'],
    valuers: ['view', 'create', 'update', 'delete'],
    advocates: ['view', 'create', 'update', 'delete'],
    event: ['view', 'create', 'update', 'delete'],
    security: ['view', 'create', 'update', 'delete'],
    workflow: ['view'],
    'alert-master': ['view'],
    'data-ingestion': ['view'],
  },
  Accounts: {
    standard_accounts: ['view'],
    sma_accounts: ['view'],
    npa_accounts: ['view'],
  },
  'Account Actions': {
    inspection: ['view', 'create', 'delete'],
    interview: ['view', 'create', 'delete'],
    notice: ['view', 'create', 'delete'],
    stock_audit_action: ['view', 'create', 'delete'],
    legal: ['view', 'create', 'edit', 'delete'],
    valuer: ['view', 'create', 'edit', 'delete'],
    statutory_auditors: ['view', 'create', 'delete'],
    generate_report: ['view'],
  },
  Searching: {
    inspections_search: ['view'],
    notices_search: ['view'],
  },
  'Loan Review': { summary: ['view'], loan_review: ['view', 'review'] },
  'Stock Audit': {
    stock_audit: ['view', 'assign'],
  },
  Alerts: {
    // frm_alert: ['view', 'resolve', 'checker'],
    ews_alert: ['view', 'resolve', 'checker'],
    // money_mule: ['view'],
    // account_velocity: ['view'],
    // dmr: ['view'],
  },
} as const

type Sections = typeof PERMISSION_SECTIONS

/** All module names */
export type ModuleName = {
  [S in keyof Sections]: keyof Sections[S]
}[keyof Sections]

/** Utility to pull the element type out of a tuple/readonly-array */
type Elem<T> = T extends readonly (infer U)[] ? U : never

/** Allowed actions for a given module */
export type ModuleActions<M extends ModuleName> = {
  [S in keyof Sections]: M extends keyof Sections[S] // does this section have the module?
    ? Elem<Sections[S][M]> // yes → union of its actions
    : never // no  → ignore
}[keyof Sections]

/** Shape of the permissions blob on your user object */
export type PermissionMap = {
  [M in ModuleName]?: ModuleActions<M>[]
}
