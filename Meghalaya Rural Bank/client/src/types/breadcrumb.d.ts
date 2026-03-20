import { RouteMatch } from '@tanstack/react-router'

export type CrumbOption = { label: string; to: string }
export type BreadcrumbMeta =
  | string
  | { label: string; to?: string; options?: CrumbOption[] }
  | ((match: RouteMatch) => BreadcrumbMeta)
