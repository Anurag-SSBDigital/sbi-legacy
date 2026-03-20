// src/routes/_authenticated/admin/roles/$roleId/edit.tsx
import { useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api'
import { PERMISSION_SECTIONS } from '@/lib/permissions.ts'
import RoleForm, { RolePayload } from '@/features/roles/RoleForm'

type PermissionSection = Record<string, readonly string[]>

// const normalizeModule = (mod: string) => mod.replace(/-/g, '_')

const FLAT_PERMISSIONS: PermissionSection = Object.values(
  PERMISSION_SECTIONS
).reduce<PermissionSection>((acc, section) => ({ ...acc, ...section }), {})

export const Route = createFileRoute(
  '/_authenticated/admin/roles/$roleId/edit'
)({
  component: EditRolePage,
})

function EditRolePage() {
  const { roleId } = Route.useParams()
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.auth.user)

  const {
    data: roleRes,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/roles/getById/{roleId}', {
    cache: 'no-cache',
    params: { path: { roleId } },
  })

  const initialPermissions = useMemo<Record<string, string[]>>(() => {
    // start with all modules empty
    const base: Record<string, string[]> = Object.fromEntries(
      Object.keys(FLAT_PERMISSIONS).map((m) => [m, [] as string[]])
    )

    const fp = roleRes?.data?.formattedPermissions
    if (fp) {
      Object.entries(fp).forEach(([action, modules]) => {
        modules.forEach((mod) => {
          if (base[mod]) {
            if (!base[mod].includes(action)) base[mod].push(action)
          }
        })
      })
    }
    return base
  }, [roleRes])

  // useEffect(() => {
  //   refetch()
  // }, [])

  const updateRole = $api.useMutation('put', '/roles/update/{roleId}')

  if (isLoading) return <p className='p-8'>Loading…</p>

  const handleSubmit = async (payload: RolePayload) => {
    await updateRole.mutateAsync({
      body: payload,
      params: { path: { roleId }, header: { Authorization: '' } },
    })
    refetch()
    navigate({ to: '/admin/roles' })
  }

  if (!user) return null

  const commonType = roleRes?.data?.commonType as
    | 'Department'
    | 'Branch'
    | undefined

  const roleLevel =
    roleRes?.data?.isCommon && commonType
      ? commonType
      : roleRes?.data?.parentDepartmentId
        ? 'Department'
        : roleRes?.data?.parentBranchId
          ? 'Branch'
          : undefined

  return (
    <>
      <header className='bg-background border-b px-4 py-3'>
        <h1 className='text-2xl font-semibold'>Edit Role</h1>
        <p className='text-muted-foreground text-sm'>
          {roleRes?.data?.roleName}
        </p>
      </header>
      <div className='mx-auto w-full max-w-5xl px-4 py-10 sm:px-6'>
        <RoleForm
          key={roleRes?.data?.id}
          initialData={{
            roleName: roleRes?.data?.roleName ?? '',
            roleLevel,
            parentDepartmentId: roleRes?.data?.parentDepartmentId ?? '',
            parentBranchId: roleRes?.data?.parentBranchId ?? '',
            createdBy: roleRes?.data?.createdBy ?? '',
            isAdmin: roleRes?.data?.isAdmin ?? false,
            permissions: initialPermissions,
            iscommon: roleRes?.data?.isCommon ?? false,
            commonType: commonType,
          }}
          onSubmit={handleSubmit}
          currentUser={user}
        />
      </div>
    </>
  )
}
