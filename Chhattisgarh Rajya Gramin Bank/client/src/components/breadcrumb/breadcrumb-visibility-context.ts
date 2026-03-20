import { createContext, useContext } from 'react'

export const SuppressNestedBreadcrumbsContext = createContext(false)

export function useSuppressNestedBreadcrumbs() {
  return useContext(SuppressNestedBreadcrumbsContext)
}
