import { type ReactNode } from 'react'
import { SuppressNestedBreadcrumbsContext } from './breadcrumb-visibility-context.ts'

type SuppressNestedBreadcrumbsProviderProps = {
  value?: boolean
  children: ReactNode
}

export function SuppressNestedBreadcrumbsProvider({
  value = true,
  children,
}: SuppressNestedBreadcrumbsProviderProps) {
  return (
    <SuppressNestedBreadcrumbsContext.Provider value={value}>
      {children}
    </SuppressNestedBreadcrumbsContext.Provider>
  )
}
