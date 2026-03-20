// src/routes/_authenticated/admin/roles/create.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api'
import RoleForm, { RolePayload } from '@/features/roles/RoleForm'

export const Route = createFileRoute('/_authenticated/admin/roles/create')({
  component: CreateRolePage,
})

function CreateRolePage() {
  const navigate = useNavigate()
  const createRole = $api.useMutation('post', '/roles/create')

  const user = useAuthStore()?.auth?.user

  const handleSubmit = async (payload: RolePayload) => {
    await createRole.mutateAsync({
      body: payload,
      params: {
        header: { Authorization: 'Bearer ' + sessionStorage.getItem('token') },
      },
    })
    navigate({ to: '/admin/roles' })
  }

  if (!user) return null

  return (
    <>
      <header className='bg-background border-b px-4 py-3'>
        <h1 className='text-2xl font-semibold'>Create Role</h1>
        <p className='text-muted-foreground text-sm'>
          Define a new role, its scope, and fine-grained permissions.
        </p>
      </header>
      <div className='mx-auto w-full max-w-5xl px-4 py-10 sm:px-6'>
        <RoleForm onSubmit={handleSubmit} currentUser={user} />
      </div>
    </>
  )
}
