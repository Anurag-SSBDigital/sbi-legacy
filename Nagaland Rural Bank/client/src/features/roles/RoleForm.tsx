// src/features/roles/RoleForm.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthUser } from '@/stores/authStore.ts'
/* stores / services / helpers */
import { $api } from '@/lib/api'
import { PERMISSION_SECTIONS } from '@/lib/permissions'
import { toastError } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
/* ShadCN UI */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

/* ─── Types ─────────────────────────────────────────────────────── */
export type RolePayload = {
  roleName: string
  roleLevel: 'Department' | 'Branch' | undefined
  /** NEW: true for a Common Role (no parent binding) */
  iscommon: boolean
  /** NEW: mirrors roleLevel when iscommon === true */
  commonType: 'Department' | 'Branch' | undefined
  parentDepartmentId: string | undefined
  parentBranchId: string | undefined
  createdBy: string
  isAdmin: boolean
  permissions: Record<string, string[]>
}

/* ─── Helpers ───────────────────────────────────────────────────── */
const authHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
})

function prunePermissions(p: RolePayload): RolePayload {
  const pruned: Record<string, string[]> = {}

  for (const [mod, perms] of Object.entries(p.permissions))
    if (perms?.length) pruned[mod] = [...new Set(perms)]
  return { ...p, permissions: pruned }
}

/* ─── Types shared by the helpers ──────────────────────────────── */
type PermissionSection = Record<string, readonly string[]>
type PermissionSections = Record<string, PermissionSection>

/* ─── Flatten all permissions (keeps correct value types) ─────── */
const FLAT_PERMISSIONS: PermissionSection = Object.values(
  PERMISSION_SECTIONS
).reduce<PermissionSection>((acc, section) => ({ ...acc, ...section }), {})

/* ─── Component ─────────────────────────────────────────────────── */
interface Props {
  /** undefined → create  |  object → edit */
  initialData?: RolePayload
  /** page injects mutation logic */
  onSubmit: (p: RolePayload) => Promise<void>
  /** current user (needed for default values / guards) */
  currentUser: AuthUser
}

export default function RoleForm({
  initialData,
  onSubmit,
  currentUser,
}: Props) {
  const isEdit = !!initialData
  const [confirm, setConfirm] = useState<RolePayload | null>(null)

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.superAdmin
  const isBranchUser = !!currentUser?.branchId
  const isDepartmentUser = !!currentUser?.departmentId && !isBranchUser

  /* ── dropdown look-ups ───────────────────────────────────────── */
  const { data: depRes, isLoading: depLoading } = $api.useQuery(
    'get',
    '/departments/get/dropdown',
    { params: { header: authHeader() } }
  )
  const departments = useMemo(() => depRes?.data ?? [], [depRes])

  const { data: brRes, isLoading: brLoading } = $api.useQuery(
    'get',
    '/branches/get/dropdown',
    { params: { header: authHeader() } }
  )
  const branches = useMemo(() => brRes?.data ?? [], [brRes])

  /* ── form ────────────────────────────────────────────────────── */
  const methods = useForm<RolePayload>({
    defaultValues: initialData ?? {
      roleName: '',
      roleLevel: isBranchUser ? 'Branch' : undefined,
      iscommon: false,
      commonType: undefined,
      parentDepartmentId: isDepartmentUser
        ? (currentUser.departmentId ?? '')
        : '',
      parentBranchId: isBranchUser ? (currentUser.branchId ?? '') : '',
      createdBy: currentUser.id,
      isAdmin: false,
      permissions: Object.fromEntries(
        Object.keys(FLAT_PERMISSIONS).map((m) => [m, []])
      ),
    },
  })

  const {
    watch,
    setValue,
    handleSubmit,
    control,
    formState,
    getValues,
    reset,
  } = methods

  // ✅ When initialData arrives/changes, push it into the form
  const firstHydrateDone = useRef(false)
  useEffect(() => {
    if (!initialData) return
    reset(initialData, { keepDirty: false, keepTouched: false })
    firstHydrateDone.current = true
  }, [initialData, reset])

  const roleLevel = watch('roleLevel')
  const isAdminChecked = watch('isAdmin')
  const currentPerms = watch('permissions')
  const iscommon = watch('iscommon')

  /* ── dynamic section filtering ───────────────────────────────── */
  /* ─── Memo that returns a *fully-typed* permission map ─────────── */
  const filteredPermissionSections = useMemo<PermissionSections>(() => {
    if (!roleLevel) return {}

    /* split “Masters” from the rest */
    const { Masters, Alerts, ...others } = PERMISSION_SECTIONS

    /* pick only the master-modules a user at this level can see */
    let mastersSubset: PermissionSection = {}
    let alertsSubset: PermissionSection = {}
    if (roleLevel === 'Department') {
      mastersSubset = {
        departments: Masters.departments,
        auditors: Masters.auditors,
        advocates: Masters.advocates,
        roles: Masters.roles,
        users: Masters.users,
        'data-ingestion': Masters['data-ingestion'],
      }
      alertsSubset = {
        ...Alerts,
        ews_alert: [Alerts.ews_alert[0]],
        // frm_alert: [Alerts.frm_alert[0]],
      }
    }
    if (roleLevel === 'Branch') {
      mastersSubset = {
        roles: Masters.roles,
        users: Masters.users,
      }
      alertsSubset = Alerts
    }

    /* return a *typed* object → downstream is never `unknown` */
    return { Masters: mastersSubset, ...others, Alerts: alertsSubset }
  }, [roleLevel])

  /* Clear opposite parent field when level toggles */
  useEffect(() => {
    if (roleLevel === 'Department') setValue('parentBranchId', undefined)
    if (roleLevel === 'Branch') setValue('parentDepartmentId', undefined)

    // Keep commonType in sync when iscommon is ON
    if (iscommon) setValue('commonType', roleLevel)
  }, [roleLevel, setValue, iscommon])

  // When iscommon toggles:
  useEffect(() => {
    if (iscommon) {
      // mirror roleLevel → commonType
      setValue('commonType', roleLevel)
      // hide parent fields: set undefined
      setValue('parentDepartmentId', undefined, { shouldDirty: true })
      setValue('parentBranchId', undefined, { shouldDirty: true })
    } else {
      // turn OFF: clear commonType
      setValue('commonType', undefined)
      // restore sensible defaults based on user scope if empty
      if (
        roleLevel === 'Department' &&
        !getValues('parentDepartmentId') &&
        (isDepartmentUser || isSuperAdmin)
      ) {
        setValue(
          'parentDepartmentId',
          isDepartmentUser ? (currentUser.departmentId ?? undefined) : undefined
        )
      }
      if (
        roleLevel === 'Branch' &&
        !getValues('parentBranchId') &&
        (isBranchUser || isSuperAdmin)
      ) {
        setValue(
          'parentBranchId',
          isBranchUser ? (currentUser.branchId ?? undefined) : undefined
        )
      }
    }
  }, [
    iscommon,
    roleLevel,
    setValue,
    getValues,
    isDepartmentUser,
    isBranchUser,
    isSuperAdmin,
    currentUser,
  ])

  // Build a flat map of currently visible modules->actions
  const sectionFlat = useMemo(() => {
    return Object.values(filteredPermissionSections).reduce<
      Record<string, readonly string[]>
    >((a, s) => ({ ...a, ...s }), {})
  }, [filteredPermissionSections])

  // Grant all when Admin is turned ON (or visible set changes while ON)
  useEffect(() => {
    if (!isAdminChecked) return
    const updated = { ...getValues('permissions') }
    Object.entries(sectionFlat).forEach(([mod, acts]) => {
      updated[mod] = [...(acts as string[])]
    })
    setValue('permissions', updated, { shouldDirty: true })
  }, [isAdminChecked, sectionFlat, getValues, setValue])

  // Clear once when Admin goes OFF (user intent)
  const prevAdmin = useRef(isAdminChecked)
  useEffect(() => {
    if (prevAdmin.current && !isAdminChecked) {
      const updated = { ...getValues('permissions') }
      Object.keys(updated).forEach((m) => (updated[m] = []))
      setValue('permissions', updated, { shouldDirty: true })
    }
    prevAdmin.current = isAdminChecked
  }, [isAdminChecked, getValues, setValue])

  /* ── submit flow ─────────────────────────────────────────────── */
  const triggerConfirm: SubmitHandler<RolePayload> = (vals) => setConfirm(vals)

  const doSubmit = async () => {
    if (!confirm) return
    try {
      await onSubmit(prunePermissions(confirm))
      toast.success(isEdit ? 'Role updated.' : 'Role created.')
      reset(confirm) // keep form in sync
      setConfirm(null)
    } catch (e: unknown) {
      toastError(e, 'Operation failed.')
      setConfirm(null)
    }
  }

  /* ── confirm dialog helper ───────────────────────────────────── */
  const parentName = () => {
    if (!confirm) return ''
    if (confirm.iscommon) return '—'
    if (confirm.roleLevel === 'Department')
      return confirm.parentDepartmentId
        ? ((departments as { id: string; name: string }[]).find(
            (d) => d.id === confirm.parentDepartmentId
          )?.name ?? 'N/A')
        : 'Top Level'
    if (confirm.roleLevel === 'Branch')
      return (
        (branches as { id: string; name: string }[]).find(
          (b) => b.id === confirm.parentBranchId
        )?.name ?? 'N/A'
      )
    return ''
  }

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <>
      <Form {...methods}>
        <form onSubmit={handleSubmit(triggerConfirm)} className='space-y-12'>
          {/* ─────────────────── Details ─────────────────────── */}
          <section className='space-y-8'>
            <h2 className='text-primary text-lg font-medium'>Details</h2>
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Role Name */}
              <FormField
                name='roleName'
                control={control}
                rules={{ required: 'Role name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Branch Manager' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Level */}
              <FormField
                name='roleLevel'
                control={control}
                rules={{ required: 'Role level required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Level *</FormLabel>
                    <Select
                      disabled={isBranchUser}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select level' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(isSuperAdmin || isDepartmentUser) && (
                          <SelectItem value='Department'>Department</SelectItem>
                        )}
                        <SelectItem value='Branch'>Branch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NEW: Common Role switch */}
              <FormField
                name='iscommon'
                control={control}
                render={({ field }) => (
                  <div className='flex items-center space-x-3 rounded-md border p-4'>
                    <div className='flex-grow'>
                      <FormLabel htmlFor='iscommon' className='font-semibold'>
                        Common Role?
                      </FormLabel>
                      <p className='text-muted-foreground text-xs'>
                        When enabled, this role is treated as a common{' '}
                        {roleLevel?.toLowerCase() ?? '—'} role. Parent selection
                        is hidden.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        id='iscommon'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                )}
              />

              {/* Parent dropdowns (only for superadmin). Hidden when iscommon */}
              {isSuperAdmin && roleLevel === 'Department' && !iscommon && (
                <FormField
                  name='parentDepartmentId'
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Department</FormLabel>
                      {depLoading ? (
                        <Skeleton className='h-10 w-full' />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select department' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(
                              departments as { id: string; name: string }[]
                            ).map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <p className='text-muted-foreground text-xs'>
                        Leave blank for top-level role.
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {isSuperAdmin && roleLevel === 'Branch' && !iscommon && (
                <FormField
                  name='parentBranchId'
                  control={control}
                  rules={{ required: 'Parent branch required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Branch *</FormLabel>
                      {brLoading ? (
                        <Skeleton className='h-10 w-full' />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select branch' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(branches as { id: string; name: string }[]).map(
                              (b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Admin toggle */}
            <FormField
              name='isAdmin'
              control={control}
              render={({ field }) => (
                <div className='flex items-center space-x-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950'>
                  <AlertTriangle className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
                  <div className='flex-grow'>
                    <FormLabel
                      htmlFor='isAdmin'
                      className='font-semibold text-yellow-800 dark:text-yellow-200'
                    >
                      Grant Admin Privileges
                    </FormLabel>
                    <p className='text-xs text-yellow-700 dark:text-yellow-300'>
                      Admins bypass specific permissions and have full access.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      id='isAdmin'
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              )}
            />
          </section>

          {/* ─────────────────── Permissions ────────────────────── */}
          <section className='space-y-8'>
            <h2 className='text-primary text-lg font-medium'>Permissions</h2>

            <div className='space-y-6'>
              {Object.entries(filteredPermissionSections).map(
                ([sectionName, modules]) => {
                  const allPerms = Object.values(modules).flat()
                  const selectedInSection = Object.entries(currentPerms)
                    .filter(([m]) => modules[m])
                    .flatMap(([, p]) => p)

                  const allSelected =
                    allPerms.length &&
                    selectedInSection.length === allPerms.length

                  return (
                    <div
                      key={sectionName}
                      className='bg-card rounded-lg border shadow-sm'
                    >
                      {/* section header */}
                      <div className='flex items-center justify-between p-4'>
                        <h3 className='font-semibold'>{sectionName}</h3>
                        <div className='flex items-center space-x-2'>
                          <label
                            htmlFor={`sel-all-${sectionName}`}
                            className='text-muted-foreground text-sm'
                          >
                            Select All
                          </label>
                          <Switch
                            id={`sel-all-${sectionName}`}
                            checked={!!allSelected}
                            disabled={isAdminChecked}
                            onCheckedChange={(ck) => {
                              const upd = { ...getValues('permissions') }
                              Object.keys(modules).forEach((m) => {
                                upd[m] = ck ? [...(modules[m] as string[])] : []
                              })
                              setValue('permissions', upd, {
                                shouldDirty: true,
                              })
                            }}
                          />
                        </div>
                      </div>
                      <Separator />
                      {/* modules grid */}
                      <div className='grid gap-x-6 gap-y-8 p-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {Object.entries(modules).map(([module, actions]) => (
                          <FormField
                            key={module}
                            name={`permissions.${module}` as const}
                            control={control}
                            render={({ field }) => (
                              <FormItem className='space-y-3'>
                                <FormLabel className='capitalize'>
                                  {module.replace(/_/g, ' ')}
                                </FormLabel>
                                <div className='flex flex-wrap gap-2'>
                                  {(actions as string[]).length > 1 && (
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant={
                                        (actions as string[]).every((p) =>
                                          field.value?.includes(p)
                                        )
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                      disabled={isAdminChecked}
                                      onClick={() => {
                                        const allSel = (
                                          actions as string[]
                                        ).every((p) => field.value?.includes(p))
                                        field.onChange(
                                          allSel
                                            ? []
                                            : [...(actions as string[])]
                                        )
                                      }}
                                    >
                                      All
                                    </Button>
                                  )}

                                  {(actions as string[]).map((perm) => (
                                    <Button
                                      key={perm}
                                      type='button'
                                      size='sm'
                                      disabled={isAdminChecked}
                                      variant={
                                        field.value?.includes(perm)
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className='capitalize'
                                      onClick={() => {
                                        const exists =
                                          field.value?.includes(perm)
                                        field.onChange(
                                          exists
                                            ? field.value.filter(
                                                (p) => p !== perm
                                              )
                                            : [...(field.value ?? []), perm]
                                        )
                                      }}
                                    >
                                      {perm.replace(/_/g, ' ')}
                                    </Button>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </section>

          {/* footer */}
          <div className='flex justify-end gap-4 pt-4'>
            <Button variant='ghost' type='button' onClick={() => reset()}>
              Reset
            </Button>
            <Button type='submit' disabled={formState.isSubmitting}>
              {formState.isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isEdit ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Form>

      {/* ─── confirmation dialog ───────────────────────────────── */}
      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEdit ? 'Confirm Update' : 'Confirm Role Creation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review the details below and confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* summary */}
          <div className='max-h-[60vh] space-y-4 overflow-y-auto p-1 pr-3'>
            <div className='grid grid-cols-3 gap-4 text-sm'>
              <p className='text-muted-foreground font-semibold'>Role Name</p>
              <p className='col-span-2'>{confirm?.roleName}</p>

              <p className='text-muted-foreground font-semibold'>Level</p>
              <p className='col-span-2'>{confirm?.roleLevel}</p>

              <p className='text-muted-foreground font-semibold'>Common Role</p>
              <p className='col-span-2'>
                <Badge variant={confirm?.iscommon ? 'secondary' : 'outline'}>
                  {confirm?.iscommon
                    ? `Yes (${confirm?.commonType ?? '—'})`
                    : 'No'}
                </Badge>
              </p>

              {!confirm?.iscommon && (
                <>
                  <p className='text-muted-foreground font-semibold'>Parent</p>
                  <p className='col-span-2'>{parentName()}</p>
                </>
              )}

              <p className='text-muted-foreground font-semibold'>Is Admin</p>
              <p className='col-span-2'>
                <Badge variant={confirm?.isAdmin ? 'destructive' : 'secondary'}>
                  {confirm?.isAdmin ? 'Yes' : 'No'}
                </Badge>
              </p>
            </div>

            {!confirm?.isAdmin && (
              <div>
                <h4 className='mb-2 font-semibold'>Permissions</h4>
                <div className='space-y-3 rounded-md border p-3'>
                  {Object.entries(PERMISSION_SECTIONS)
                    .map(([secName, mods]) => {
                      const granted = Object.entries(mods)
                        .map(([m]) => {
                          const perms = confirm?.permissions[m] ?? []
                          return perms.length ? { name: m, perms } : null
                        })
                        .filter(Boolean)

                      if (granted.length === 0) return null

                      return (
                        <div key={secName}>
                          <p className='text-muted-foreground font-semibold'>
                            {secName}
                          </p>
                          <div className='pl-4'>
                            {granted.map((g) => (
                              <div
                                key={g!.name}
                                className='grid grid-cols-3 gap-2 text-sm'
                              >
                                <p className='capitalize'>
                                  {g!.name.replace(/_/g, ' ')}
                                </p>
                                <div className='col-span-2 flex flex-wrap gap-1'>
                                  {g!.perms.map((p) => (
                                    <Badge
                                      key={p}
                                      variant='secondary'
                                      className='capitalize'
                                    >
                                      {p.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                    .filter(Boolean).length === 0 && (
                    <p className='text-muted-foreground text-sm'>
                      No specific permissions granted.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={formState.isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={formState.isSubmitting}
              onClick={doSubmit}
            >
              {formState.isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
