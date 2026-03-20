// src/hooks/useCanAccess.ts
import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore.ts'
import type { ModuleActions, ModuleName } from '@/lib/permissions'

/* ---- overloads give the compiler context for [] ---- */

export function useCanAccess<M extends ModuleName>(
  module: M,
  action: ModuleActions<M> // single action
): boolean

export function useCanAccess<M extends ModuleName>(
  module: M,
  actions: readonly ModuleActions<M>[] // zero or more actions
): boolean

/* ---- implementation ---- */

export function useCanAccess<M extends ModuleName>(
  module: M,
  access: ModuleActions<M> | readonly ModuleActions<M>[]
) {
  const user = useAuthStore((s) => s.auth.user)

  return useMemo(() => {
    if (!user) return false
    if (user.isSuperAdmin || user.superAdmin) return true

    const wanted = Array.isArray(access) ? access : [access]
    const granted = (user.permissions?.[module] ?? []) as string[]

    return wanted.every((p) => granted.includes(p))
  }, [user, module, access])
}

export function usePermissions<M extends ModuleName>(
  module: M,
  actions: readonly ModuleActions<M>[]
): boolean[] {
  const user = useAuthStore((s) => s.auth.user)

  return useMemo(() => {
    if (!user) return actions.map(() => false)

    if (user.isSuperAdmin || user.superAdmin) return actions.map(() => true)

    const granted = (user.permissions?.[module] ?? []) as string[]

    return actions.map((act) => granted.includes(act as string))
  }, [user, module, actions])
}
