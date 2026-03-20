// import { useEffect, useMemo, useState } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { Pencil, Ban, CheckCircle } from 'lucide-react'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { toastError } from '@/lib/utils.ts'
// import { useCanAccess } from '@/hooks/use-can-access.tsx'
// import { Badge } from '@/components/ui/badge.tsx'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select.tsx'
// import { Switch } from '@/components/ui/switch'
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip'
// import ConfirmDeleteDialog from '@/components/confirm-delete-dialog.tsx'
// import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
// import PaginatedTable, {
//   PaginatedTableColumn,
// } from '@/components/paginated-table.tsx'
// import DeleteActionButton from '@/components/table/action/DeleteButton.tsx'
// import {
//   BadgeCell,
//   UserCell,
//   RoleBadge,
//   AssignmentCell,
// } from '@/components/table/cells.ts'

// export const Route = createFileRoute('/_authenticated/admin/users')({
//   component: RouteComponent,
// })

// type DropdownOption = { id: string | number; name: string }
// type DropdownResponse = {
//   status?: string
//   message?: string
//   data?: DropdownOption[]
// }

// type NewUserForm = {
//   name: string
//   username: string
//   fullName: string
//   roleId: string
//   departmentId?: string
//   branchId?: string
//   email: string
//   number: string
//   userLevel: 'Department' | 'Branch' | ''
//   selectedEntityId?: string
//   useCommonRole?: boolean
// }

// type User = components['schemas']['User']

// function getUserRole(user: User): string {
//   if (user.isSuperAdmin) return 'Super Admin'
//   if (user.isAdmin) return 'Admin'
//   if (user.isAuditor) return 'Auditor'
//   if (user.isStockAuditor) return 'Stock Auditor'
//   if (user.isAdvocate) return 'Advocate'
//   if (user.isValuer) return 'Valuer'
//   if (user.branchId) return 'Branch'
//   if (user.departmentId) return 'Department'
//   return 'Unknown'
// }

// const asOptions = (res?: DropdownResponse) => res?.data ?? []

// /* =============================
//   Export helpers (strictly typed)
// ============================= */
// function fileDownload(blob: Blob, filename: string) {
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = filename
//   document.body.appendChild(a)
//   a.click()
//   a.remove()
//   URL.revokeObjectURL(url)
// }

// function toTitleCase(key: string) {
//   return key
//     .replace(/_/g, ' ')
//     .replace(/([a-z])([A-Z])/g, '$1 $2')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .replace(/^./, (c) => c.toUpperCase())
// }

// function buildRowsAndHeaders<T extends Record<string, unknown>>(
//   rows: readonly T[]
// ): { headers: string[]; headerLabels: string[]; matrix: string[][] } {
//   const keySet = new Set<string>()
//   rows.forEach((row) => {
//     Object.keys(row).forEach((k) => keySet.add(k))
//   })
//   const headers = Array.from(keySet)

//   const idIdx = headers.indexOf('id')
//   if (idIdx > 0) {
//     headers.splice(idIdx, 1)
//     headers.unshift('id')
//   }

//   const headerLabels = headers.map(toTitleCase)

//   const matrix: string[][] = rows.map((row) =>
//     headers.map((h) => {
//       const val = row[h as keyof T]
//       if (val == null) return ''
//       if (typeof val === 'object') {
//         try {
//           return JSON.stringify(val)
//         } catch {
//           return String(val)
//         }
//       }
//       return String(val)
//     })
//   )

//   return { headers, headerLabels, matrix }
// }

// function exportCSV<T extends Record<string, unknown>>(
//   rows: readonly T[],
//   filename = 'users.csv'
// ) {
//   const { headerLabels, matrix } = buildRowsAndHeaders(rows)
//   const escape = (v: string) =>
//     /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

//   const lines = [
//     headerLabels.map(escape).join(','),
//     ...matrix.map((r) => r.map(escape).join(',')),
//   ]
//   const csv = '\uFEFF' + lines.join('\n')
//   fileDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
// }

// async function exportExcel<T extends Record<string, unknown>>(
//   rows: readonly T[],
//   filename = 'users.xlsx'
// ): Promise<void> {
//   try {
//     const XLSX: typeof import('xlsx') = await import('xlsx')
//     const { headers } = buildRowsAndHeaders(rows)
//     const mutableRows: T[] = Array.from(rows)
//     const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
//     const wb = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(wb, ws, 'Users')
//     const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
//     fileDownload(
//       new Blob([wbout], { type: 'application/octet-stream' }),
//       filename
//     )
//   } catch {
//     exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
//   }
// }
// /* ============================= */

// function RouteComponent() {
//   const canCreate = useCanAccess('users', 'create')
//   const [isDialogOpen, setDialogOpen] = useState(false)
//   const [userToEdit, setUserToEdit] = useState<User | null>(null)

//   const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([])
//   const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
//   const [selectedBranches, setSelectedBranches] = useState<string[]>([])
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

//   const {
//     data: usersResponse,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/user/get/AllUsers', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
//       },
//     },
//   })

//   const distinctRoleTypes = useMemo(() => {
//     const roleTypes =
//       usersResponse?.data?.map((user: User) => getUserRole(user)) || []
//     return [...new Set(roleTypes)].filter(Boolean).sort()
//   }, [usersResponse])

//   const distinctDepartments = useMemo(() => {
//     const departments =
//       usersResponse?.data?.map((u: User) => u.departmentName).filter(Boolean) ||
//       []
//     return [...new Set(departments)].filter(Boolean).sort()
//   }, [usersResponse])

//   const distinctBranches = useMemo(() => {
//     const branches =
//       usersResponse?.data?.map((u: User) => u.branchName).filter(Boolean) || []
//     return [...new Set(branches)].filter(Boolean).sort()
//   }, [usersResponse])

//   const distinctStatuses = ['Enabled', 'Disabled'] as const

//   const filteredUsers = useMemo<User[]>(() => {
//     return (
//       usersResponse?.data?.filter((user: User) => {
//         const roleMatch =
//           selectedRoleTypes.length === 0 ||
//           selectedRoleTypes.includes(getUserRole(user))
//         const departmentMatch =
//           selectedDepartments.length === 0 ||
//           (user.departmentName &&
//             selectedDepartments.includes(user.departmentName))
//         const branchMatch =
//           selectedBranches.length === 0 ||
//           (user.branchName && selectedBranches.includes(user.branchName))
//         const statusMatch =
//           selectedStatuses.length === 0 ||
//           (selectedStatuses.includes('Enabled') && user.isEnable) ||
//           (selectedStatuses.includes('Disabled') && !user.isEnable)
//         return roleMatch && departmentMatch && branchMatch && statusMatch
//       }) || []
//     )
//   }, [
//     usersResponse,
//     selectedRoleTypes,
//     selectedDepartments,
//     selectedBranches,
//     selectedStatuses,
//   ])

//   useEffect(() => {
//     setSelectedRoleTypes((prev) =>
//       prev.filter((r) => distinctRoleTypes.includes(r))
//     )
//   }, [distinctRoleTypes])
//   useEffect(() => {
//     setSelectedDepartments((prev) =>
//       prev.filter((d) => distinctDepartments.includes(d))
//     )
//   }, [distinctDepartments])
//   useEffect(() => {
//     setSelectedBranches((prev) =>
//       prev.filter((b) => distinctBranches.includes(b))
//     )
//   }, [distinctBranches])

//   const isFiltered =
//     selectedRoleTypes.length > 0 ||
//     selectedDepartments.length > 0 ||
//     selectedBranches.length > 0 ||
//     selectedStatuses.length > 0

//   const deleteUserMutation = $api.useMutation(
//     'delete',
//     '/user/manage/delete/{username}'
//   )
//   const editUserMutation = $api.useMutation('put', '/user/updateUser')
//   const enableDisableMutation = $api.useMutation(
//     'put',
//     '/user/enable-disable/{userId}'
//   )

//   const handleDelete = (userId: string) => {
//     deleteUserMutation.mutate(
//       { params: { path: { username: userId } } },
//       {
//         onSuccess: () => {
//           toast.success('User deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete user'),
//       }
//     )
//   }

//   const handleToggleStatus = (user: User) => {
//     if (!user.id) return
//     const newStatus = !user.isEnable
//     enableDisableMutation.mutate(
//       {
//         params: { path: { userId: user.id! }, query: { enabled: newStatus } },
//       },
//       {
//         onSuccess: () => {
//           toast.success(
//             `User ${newStatus ? 'enabled' : 'disabled'} successfully`
//           )
//           refetch()
//         },
//         onError: () => toast.error('Could not update user status'),
//       }
//     )
//   }

//   const handleExportCSV = () => {
//     if (!filteredUsers.length) return toast.info('No data to export.')
//     exportCSV<User>(filteredUsers, 'users.csv')
//   }
//   const handleExportExcel = async () => {
//     if (!filteredUsers.length) return toast.info('No data to export.')
//     await exportExcel<User>(filteredUsers, 'users.xlsx')
//   }

//   const columns: PaginatedTableColumn<User>[] = [
//     { key: 'name', label: 'Name', render: (_, row) => <UserCell row={row} /> },
//     { key: 'username', label: 'Username' },
//     {
//       key: 'roleId',
//       label: 'Role',
//       render: (_, row) => <RoleBadge role={getUserRole(row)} />,
//     },
//     {
//       key: 'departmentName',
//       label: 'Assignment',
//       render: (_, row) => <AssignmentCell row={row} />,
//     },
//     {
//       key: 'number',
//       label: 'Number',
//       render: (value) => <BadgeCell value={`📞 ${value || '------------'}`} />,
//     },
//     {
//       key: 'isEnable',
//       label: 'Status',
//       render: (value) => (
//         <BadgeCell
//           value={value ? 'Enabled' : 'Disabled'}
//           variant={value ? 'default' : 'destructive'}
//         />
//       ),
//     },
//   ]

//   const tableActions = (
//     <div className='flex flex-wrap items-center gap-2'>
//       <FilterPopover
//         options={distinctRoleTypes}
//         selected={selectedRoleTypes}
//         onChange={setSelectedRoleTypes}
//         placeholder='Filter by Role Type'
//       />
//       <FilterPopover
//         options={distinctDepartments.filter((a) => a !== undefined)}
//         selected={selectedDepartments}
//         onChange={setSelectedDepartments}
//         placeholder='Filter by Department'
//       />
//       <FilterPopover
//         options={distinctBranches.filter((a) => a !== undefined)}
//         selected={selectedBranches}
//         onChange={setSelectedBranches}
//         placeholder='Filter by Branch'
//       />
//       <FilterPopover
//         options={[...distinctStatuses]}
//         selected={selectedStatuses}
//         onChange={setSelectedStatuses}
//         placeholder='Filter by Status'
//       />

//       <div className='ml-auto flex items-center gap-2'>
//         <Button variant='outline' size='sm' onClick={handleExportCSV}>
//           Export CSV
//         </Button>
//         <Button variant='outline' size='sm' onClick={handleExportExcel}>
//           Export Excel
//         </Button>
//       </div>
//     </div>
//   )

//   return (
//     <>
//       {isLoading && (
//         <LoadingBar progress={70} className='h-1' color='#2563eb' />
//       )}
//       <div className='mb-2 flex items-center justify-between'>
//         <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//           Users
//         </h1>
//         {canCreate && (
//           <UserForm
//             open={isDialogOpen}
//             onOpenChange={setDialogOpen}
//             onSuccess={() => {
//               setDialogOpen(false)
//               refetch()
//             }}
//             userToEdit={userToEdit}
//           />
//         )}
//       </div>

//       <div className='mb-4 flex flex-wrap gap-2'>
//         {selectedRoleTypes.map((role) => (
//           <Badge key={role} variant='secondary'>
//             Role: {role}
//             <Button
//               variant='ghost'
//               size='sm'
//               className='ml-1'
//               onClick={() =>
//                 setSelectedRoleTypes((prev) => prev.filter((r) => r !== role))
//               }
//             >
//               ×
//             </Button>
//           </Badge>
//         ))}
//         {selectedDepartments.map((dept) => (
//           <Badge key={dept} variant='secondary'>
//             Department: {dept}
//             <Button
//               variant='ghost'
//               size='sm'
//               className='ml-1'
//               onClick={() =>
//                 setSelectedDepartments((prev) => prev.filter((d) => d !== dept))
//               }
//             >
//               ×
//             </Button>
//           </Badge>
//         ))}
//         {selectedBranches.map((branch) => (
//           <Badge key={branch} variant='secondary'>
//             Branch: {branch}
//             <Button
//               variant='ghost'
//               size='sm'
//               className='ml-1'
//               onClick={() =>
//                 setSelectedBranches((prev) => prev.filter((b) => b !== branch))
//               }
//             >
//               ×
//             </Button>
//           </Badge>
//         ))}
//         {selectedStatuses.map((status) => (
//           <Badge key={status} variant='secondary'>
//             Status: {status}
//             <Button
//               variant='ghost'
//               size='sm'
//               className='ml-1'
//               onClick={() =>
//                 setSelectedStatuses((prev) => prev.filter((s) => s !== status))
//               }
//             >
//               ×
//             </Button>
//           </Badge>
//         ))}
//         {isFiltered && (
//           <Button
//             variant='outline'
//             size='sm'
//             onClick={() => {
//               setSelectedRoleTypes([])
//               setSelectedDepartments([])
//               setSelectedBranches([])
//               setSelectedStatuses([])
//             }}
//           >
//             Clear All Filters
//           </Button>
//         )}
//       </div>

//       {filteredUsers.length ? (
//         <TooltipProvider delayDuration={200}>
//           <PaginatedTable
//             data={filteredUsers}
//             columns={columns}
//             tableActions={tableActions}
//             renderActions={(row) => {
//               if (row.isSuperAdmin) return null
//               const toggleLabel = row.isEnable ? 'Disable user' : 'Enable user'
//               return (
//                 <div className='flex items-center space-x-2'>
//                   <Tooltip>
//                     <TooltipTrigger asChild>
//                       <Button
//                         variant='ghost'
//                         size='icon'
//                         aria-label='Edit user'
//                         onClick={() => {
//                           setUserToEdit(row)
//                           setDialogOpen(true)
//                         }}
//                       >
//                         <Pencil className='h-4 w-4' />
//                       </Button>
//                     </TooltipTrigger>
//                     <TooltipContent side='top'>Edit</TooltipContent>
//                   </Tooltip>

//                   <ConfirmStatusToggleDialog
//                     title={`${row.isEnable ? 'Disable' : 'Enable'} “${row.name}”?`}
//                     description={`Are you sure you want to ${row.isEnable ? 'disable' : 'enable'} this user?`}
//                     onConfirm={() => handleToggleStatus(row)}
//                     isConfirming={editUserMutation.isPending}
//                     confirmLabel={row.isEnable ? 'Disable' : 'Enable'}
//                     confirmVariant={row.isEnable ? 'destructive' : 'default'}
//                     tooltip={toggleLabel}
//                   >
//                     <Button
//                       variant='ghost'
//                       size='icon'
//                       aria-label={toggleLabel}
//                     >
//                       {row.isEnable ? (
//                         <Ban className='h-4 w-4 text-red-500' />
//                       ) : (
//                         <CheckCircle className='h-4 w-4 text-green-500' />
//                       )}
//                     </Button>
//                   </ConfirmStatusToggleDialog>

//                   <ConfirmDeleteDialog
//                     title={`Delete “${row.name}”?`}
//                     onConfirm={() => handleDelete(row.username ?? '')}
//                     isConfirming={deleteUserMutation.isPending}
//                     tooltip='Delete user'
//                   >
//                     <DeleteActionButton
//                       onClick={() => {}}
//                       aria-label='Delete user'
//                     />
//                   </ConfirmDeleteDialog>
//                 </div>
//               )
//             }}
//             emptyMessage={
//               isFiltered
//                 ? 'No users match the selected filters.'
//                 : 'No users to display at the moment.'
//             }
//           />
//         </TooltipProvider>
//       ) : (
//         !isLoading && (
//           <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//             <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//               {isFiltered
//                 ? 'No users match the selected filters.'
//                 : 'No Users Found'}
//             </h3>
//             {!isFiltered && (
//               <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                 Get started by creating a new user.
//               </p>
//             )}
//           </div>
//         )
//       )}
//     </>
//   )
// }

// interface UserFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: () => void
//   userToEdit?: User | null
// }

// function UserForm({
//   open,
//   onOpenChange,
//   onSuccess,
//   userToEdit,
// }: UserFormProps) {
//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     setValue,
//     watch,
//     clearErrors,
//     getValues,
//     formState: { errors, isSubmitting },
//   } = useForm<NewUserForm>({
//     defaultValues: {
//       userLevel: '',
//       name: '',
//       username: '',
//       fullName: '',
//       email: '',
//       number: '',
//       departmentId: undefined,
//       branchId: undefined,
//       roleId: '',
//       selectedEntityId: undefined,
//       useCommonRole: false,
//     },
//     shouldUnregister: true, // IMPORTANT: unmount clears value + errors
//   })

//   const selectedUserLevel = watch('userLevel')
//   const selectedEntityId = watch('selectedEntityId')
//   const useCommonRole = watch('useCommonRole') || false

//   const { data: departmentsResponse, isLoading: departmentsLoading } =
//     $api.useQuery('get', '/departments/get/dropdown', {
//       params: {
//         header: {
//           Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
//         },
//       },
//       enabled: selectedUserLevel === 'Department',
//     })

//   const { data: branchesResponse, isLoading: branchesLoading } = $api.useQuery(
//     'get',
//     '/branches/get/dropdown',
//     {
//       params: {
//         header: {
//           Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
//         },
//       },
//       enabled: selectedUserLevel === 'Branch',
//     }
//   ) as {
//     data: DropdownResponse | undefined
//     isLoading: boolean
//     refetch: () => void
//   }

//   const { data: rolesResponse, isLoading: rolesLoading } = $api.useQuery(
//     'get',
//     '/roles/get/dropdown/{type}',
//     {
//       params: {
//         query: { id: selectedEntityId ?? '' },
//         path: { type: selectedUserLevel?.toLowerCase() },
//       },
//       enabled: !!selectedUserLevel && !!selectedEntityId && !useCommonRole,
//     }
//   ) as { data: DropdownResponse | undefined; isLoading: boolean }

//   const { data: commonRolesResponse, isLoading: commonRolesResponseLoading } =
//     $api.useQuery('get', '/roles/get/dropdown/common/{type}', {
//       params: { path: { type: selectedUserLevel?.toLowerCase() } },
//       enabled: !!selectedUserLevel && useCommonRole,
//     }) as { data: DropdownResponse | undefined; isLoading: boolean }

//   const createUserMutation = $api.useMutation('post', '/user/create', {
//     onSuccess: (response) => {
//       toast.success(response?.message || 'User createdsuccessfully! 🎉')
//       reset()
//       onSuccess()
//     },
//     onError: (error) => {
//       toastError(error, 'Could not create user. Please try again.')
//     },
//   })

//   const editUserMutation = $api.useMutation('put', '/user/updateUser', {
//     onSuccess: (response) => {
//       toast.success(response?.message || 'User edited successfully! 🎉')
//       reset()
//       onSuccess()
//     },
//     onError: (error) => {
//       toastError(error, 'Could not update user. Please try again.')
//     },
//   })

//   const onSubmit = handleSubmit(async (values) => {
//     const token = sessionStorage.getItem('token') || ''
//     if (!token) {
//       toast.error('Authentication token not found. Please log in again. 🔑')
//       return
//     }

//     const payload = {
//       name: values.name,
//       username: values.username,
//       fullName: values.fullName,
//       roleId: values.roleId,
//       email: values.email,
//       number: values.number,
//       departmentId: '',
//       branchId: '',
//     }

//     if (values.userLevel === 'Department' && values.selectedEntityId) {
//       payload.departmentId = values.selectedEntityId
//     } else if (values.userLevel === 'Branch' && values.selectedEntityId) {
//       payload.branchId = values.selectedEntityId
//     }

//     if (userToEdit) {
//       editUserMutation.mutate({
//         body: {
//           ...userToEdit,
//           ...payload,
//           id: userToEdit.id,
//           isEnable: userToEdit.isEnable,
//         },
//         params: { header: { Authorization: '' } },
//       })
//     } else {
//       createUserMutation.mutate({ body: payload })
//     }
//   })

//   useEffect(() => {
//     if (!open) reset()
//   }, [open, reset])

//   useEffect(() => {
//     if (userToEdit) {
//       reset({
//         name: userToEdit.name || '',
//         username: userToEdit.username || '',
//         fullName: userToEdit.fullName || '',
//         roleId: userToEdit.roleId || '',
//         email: userToEdit.email || '',
//         number: userToEdit.number || '',
//         userLevel: userToEdit.departmentId
//           ? 'Department'
//           : userToEdit.branchId
//             ? 'Branch'
//             : '',
//         selectedEntityId:
//           userToEdit.departmentId || userToEdit.branchId || undefined,
//         useCommonRole: false,
//       })
//     }
//   }, [userToEdit, reset])

//   // When level changes, reset entity & role and clear related errors
//   useEffect(() => {
//     setValue('selectedEntityId', undefined, { shouldValidate: false })
//     setValue('roleId', '', { shouldValidate: false })
//     clearErrors(['selectedEntityId', 'roleId'])
//   }, [selectedUserLevel, setValue, clearErrors])

//   // When toggling common/specific roles, reset & clear role error
//   useEffect(() => {
//     setValue('roleId', '', { shouldValidate: false })
//     clearErrors('roleId')
//   }, [useCommonRole, setValue, clearErrors])

//   // === Conditional validator for entity (Department/Branch) ===
//   const entityRules = {
//     validate: (v: string | undefined) => {
//       const lvl = getValues('userLevel')
//       if (lvl === 'Department') return v ? true : 'Department is required.'
//       if (lvl === 'Branch') return v ? true : 'Branch is required.'
//       return true
//     },
//   }

//   const inputFields: Array<
//     [
//       keyof NewUserForm,
//       string,
//       string?,
//       string?,
//       Record<
//         string,
//         Record<string, string | number | RegExp> | string | number | RegExp
//       >?,
//     ]
//   > = [
//     [
//       'name',
//       'Name *',
//       'e.g., Anurag Parmar',
//       'text',
//       {
//         required: 'Name is required.',
//         minLength: { value: 2, message: 'Name must be at least 2 characters.' },
//       },
//     ],
//     [
//       'username',
//       'Username *',
//       'e.g., anuragp',
//       'text',
//       {
//         required: 'Username is required.',
//         minLength: {
//           value: 3,
//           message: 'Username must be at least 3 characters.',
//         },
//         pattern: {
//           value: /^[a-zA-Z0-9_.-]+$/,
//           message:
//             'Username can only contain letters, numbers, underscore, dot, or hyphen.',
//         },
//       },
//     ],
//     [
//       'fullName',
//       'Full Name *',
//       'e.g., Anurag P Parmar',
//       'text',
//       {
//         required: 'Full Name is required.',
//         minLength: {
//           value: 2,
//           message: 'Full name must be at least 2 characters.',
//         },
//       },
//     ],
//     [
//       'email',
//       'Email *',
//       'e.g., user@example.com',
//       'email',
//       {
//         required: 'Email is required.',
//         pattern: {
//           value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//           message: 'Invalid email address. Please use format: name@domain.com',
//         },
//       },
//     ],
//     [
//       'number',
//       'Number *',
//       'e.g., 9104544235',
//       'tel',
//       {
//         required: 'Phone number is required.',
//         pattern: {
//           value: /^\+?([0-9]{1,3})?[-. ]?([0-9]{10})$/,
//           message:
//             'Invalid phone number. Please enter a 10-digit number, optionally with a country code.',
//         },
//       },
//     ],
//   ]

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogTrigger asChild>
//         <Button size='sm' variant='default' className='text-white'>
//           New User
//         </Button>
//       </DialogTrigger>

//       <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
//         <DialogHeader className='p-6 pb-4'>
//           <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
//             {userToEdit ? 'Edit User' : 'Create New User'}
//           </DialogTitle>
//           <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
//             {userToEdit
//               ? 'Update the details below. Fields marked with * are mandatory.'
//               : 'Fill in the details below. Fields marked with * are mandatory.'}
//           </DialogDescription>
//         </DialogHeader>
//         <form
//           id='user-form'
//           onSubmit={onSubmit}
//           className='space-y-5 px-6 pt-2 pb-2'
//         >
//           {/* User Level */}
//           <div className='grid gap-1.5'>
//             <Label
//               htmlFor='userLevel'
//               className='font-medium text-gray-700 dark:text-gray-300'
//             >
//               User Level *
//             </Label>
//             <Controller
//               name='userLevel'
//               control={control}
//               rules={{ required: 'User Level is required.' }}
//               render={({ field }) => (
//                 <Select
//                   disabled={!!userToEdit}
//                   onValueChange={(value) => {
//                     field.onChange(value as 'Department' | 'Branch')
//                   }}
//                   value={field.value ?? ''}
//                 >
//                   <SelectTrigger
//                     id='userLevel'
//                     className={`dark:border-gray-600 dark:bg-gray-700 ${errors.userLevel ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
//                   >
//                     <SelectValue placeholder='Select user level' />
//                   </SelectTrigger>
//                   <SelectContent className='dark:bg-gray-700 dark:text-gray-200'>
//                     <SelectItem value='Department'>Department</SelectItem>
//                     <SelectItem value='Branch'>Branch</SelectItem>
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//             {errors.userLevel && (
//               <p className='pt-1 text-sm text-red-500'>
//                 {errors.userLevel?.message}
//               </p>
//             )}
//           </div>

//           {/* Department / Branch pickers (entity is required depending on level) */}
//           {selectedUserLevel === 'Department' && (
//             <div className='grid gap-1.5'>
//               <Label
//                 htmlFor='selectedEntityId-dept'
//                 className='font-medium text-gray-700 dark:text-gray-300'
//               >
//                 Select Department *
//               </Label>
//               <Controller
//                 name='selectedEntityId'
//                 control={control}
//                 rules={entityRules}
//                 render={({ field }) => (
//                   <Select
//                     disabled={
//                       departmentsLoading || !departmentsResponse?.data?.length
//                     }
//                     onValueChange={(value) => {
//                       field.onChange(String(value))
//                       setValue('roleId', '', { shouldValidate: true })
//                       clearErrors(['selectedEntityId', 'roleId'])
//                     }}
//                     value={field.value ?? ''}
//                   >
//                     <SelectTrigger
//                       id='selectedEntityId-dept'
//                       className={`dark:border-gray-600 dark:bg-gray-700 ${errors.selectedEntityId ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
//                     >
//                       <SelectValue
//                         placeholder={
//                           departmentsLoading
//                             ? 'Loading departments...'
//                             : 'Select a department'
//                         }
//                       />
//                     </SelectTrigger>
//                     <SelectContent className='dark:bg-gray-700 dark:text-gray-200'>
//                       {departmentsLoading && (
//                         <SelectItem value='loading' disabled>
//                           Loading...
//                         </SelectItem>
//                       )}
//                       {!departmentsLoading &&
//                         !departmentsResponse?.data?.length && (
//                           <SelectItem value='no-options' disabled>
//                             No departments available
//                           </SelectItem>
//                         )}
//                       {(departmentsResponse?.data || []).map(({ id, name }) => (
//                         <SelectItem key={String(id)} value={String(id)}>
//                           {name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 )}
//               />
//               {errors.selectedEntityId &&
//                 selectedUserLevel === 'Department' && (
//                   <p className='pt-1 text-sm text-red-500'>
//                     {errors.selectedEntityId?.message}
//                   </p>
//                 )}
//             </div>
//           )}

//           {selectedUserLevel === 'Branch' && (
//             <div className='grid gap-1.5'>
//               <Label
//                 htmlFor='selectedEntityId-branch'
//                 className='font-medium text-gray-700 dark:text-gray-300'
//               >
//                 Select Branch *
//               </Label>
//               <Controller
//                 name='selectedEntityId'
//                 control={control}
//                 rules={{
//                   validate: (v) => {
//                     if (getValues('userLevel') === 'Branch')
//                       return v ? true : 'Branch is required.'
//                     if (getValues('userLevel') === 'Department')
//                       return v ? true : 'Department is required.'
//                     return true
//                   },
//                 }}
//                 render={({ field }) => {
//                   const options = asOptions(branchesResponse)
//                   const noneAvail = !branchesLoading && options.length === 0
//                   return (
//                     <Select
//                       disabled={branchesLoading || noneAvail}
//                       onValueChange={(value) => {
//                         field.onChange(String(value))
//                         setValue('roleId', '', { shouldValidate: true })
//                         clearErrors(['selectedEntityId', 'roleId'])
//                       }}
//                       value={field.value ?? ''}
//                     >
//                       <SelectTrigger
//                         id='selectedEntityId-branch'
//                         className={`dark:border-gray-600 dark:bg-gray-700 ${
//                           errors.selectedEntityId
//                             ? 'border-red-500 focus:border-red-500'
//                             : 'border-gray-300 dark:border-gray-600'
//                         }`}
//                       >
//                         <SelectValue
//                           placeholder={
//                             branchesLoading
//                               ? 'Loading branches...'
//                               : 'Select a branch'
//                           }
//                         />
//                       </SelectTrigger>
//                       <SelectContent className='dark:bg-gray-700 dark:text-gray-200'>
//                         {branchesLoading && (
//                           <SelectItem value='loading' disabled>
//                             Loading...
//                           </SelectItem>
//                         )}
//                         {noneAvail && (
//                           <SelectItem value='no-options' disabled>
//                             No branches available
//                           </SelectItem>
//                         )}
//                         {options.map(({ id, name }) => (
//                           <SelectItem key={String(id)} value={String(id)}>
//                             {name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   )
//                 }}
//               />
//               {errors.selectedEntityId && selectedUserLevel === 'Branch' && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {errors.selectedEntityId?.message}
//                 </p>
//               )}
//             </div>
//           )}

//           {/* Common Role switch */}
//           {selectedUserLevel && (
//             <div className='flex items-center justify-between rounded-md border p-3 pr-4 dark:border-gray-700'>
//               <div className='space-y-0.5'>
//                 <Label className='font-medium text-gray-700 dark:text-gray-300'>
//                   Common Role?
//                 </Label>
//                 <p className='text-muted-foreground text-xs'>
//                   Show common {selectedUserLevel?.toLowerCase()} roles instead
//                   of specific ones. Department/Branch selection is still
//                   required.
//                 </p>
//               </div>
//               <Controller
//                 name='useCommonRole'
//                 control={control}
//                 render={({ field }) => (
//                   <Switch
//                     checked={!!field.value}
//                     onCheckedChange={(val) => {
//                       field.onChange(val)
//                       setValue('roleId', '', { shouldValidate: false })
//                       clearErrors('roleId')
//                     }}
//                     aria-label='Use common role'
//                   />
//                 )}
//               />
//             </div>
//           )}

//           {/* Role (from common or specific source) */}
//           {selectedUserLevel && selectedEntityId && (
//             <div className='grid gap-1.5'>
//               <Label
//                 htmlFor='roleId'
//                 className='font-medium text-gray-700 dark:text-gray-300'
//               >
//                 Select Role *
//               </Label>
//               <Controller
//                 name='roleId'
//                 control={control}
//                 rules={{ required: 'Role is required.' }}
//                 render={({ field }) => {
//                   const loading = useCommonRole
//                     ? commonRolesResponseLoading
//                     : rolesLoading
//                   const list =
//                     (useCommonRole
//                       ? commonRolesResponse?.data
//                       : rolesResponse?.data) || []
//                   const noneAvail = !loading && list.length === 0

//                   return (
//                     <Select
//                       disabled={loading || noneAvail}
//                       onValueChange={(value) => {
//                         field.onChange(String(value))
//                         clearErrors('roleId')
//                       }}
//                       value={field.value ?? ''}
//                     >
//                       <SelectTrigger
//                         id='roleId'
//                         className={`dark:border-gray-600 dark:bg-gray-700 ${errors.roleId ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
//                       >
//                         <SelectValue
//                           placeholder={
//                             loading
//                               ? 'Loading roles...'
//                               : useCommonRole
//                                 ? 'Select a common role'
//                                 : 'Select a role'
//                           }
//                         />
//                       </SelectTrigger>
//                       <SelectContent className='dark:bg-gray-700 dark:text-gray-200'>
//                         {loading && (
//                           <SelectItem value='loading' disabled>
//                             Loading...
//                           </SelectItem>
//                         )}
//                         {noneAvail && (
//                           <SelectItem value='no-options' disabled>
//                             {useCommonRole
//                               ? `No common ${selectedUserLevel?.toLowerCase()} roles available`
//                               : `No roles available for selected ${selectedUserLevel?.toLowerCase()}`}
//                           </SelectItem>
//                         )}
//                         {list.map(({ id, name }) => (
//                           <SelectItem key={String(id)} value={String(id)}>
//                             {name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   )
//                 }}
//               />
//               {errors.roleId && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {errors.roleId?.message}
//                 </p>
//               )}
//             </div>
//           )}

//           {inputFields.map(
//             ([name, label, placeholder, type, validationRules]) => (
//               <div key={name as string} className='grid gap-1.5'>
//                 <Label
//                   htmlFor={name as string}
//                   className='font-medium text-gray-700 dark:text-gray-300'
//                 >
//                   {label}
//                 </Label>
//                 <Input
//                   id={name as string}
//                   type={type || 'text'}
//                   placeholder={
//                     placeholder ||
//                     `Enter ${label.replace(' *', '').toLowerCase()}`
//                   }
//                   disabled={name === 'username' && !!userToEdit}
//                   {...register(name, validationRules)}
//                   className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
//                 />
//                 {errors[name] && (
//                   <p className='pt-1 text-sm text-red-500'>
//                     {errors[name]?.message}
//                   </p>
//                 )}
//               </div>
//             )
//           )}
//         </form>
//         <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
//           <Button
//             type='button'
//             variant='outline'
//             onClick={() => {
//               reset()
//               onOpenChange(false)
//             }}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button
//             type='submit'
//             form='user-form'
//             disabled={
//               isSubmitting ||
//               (userToEdit
//                 ? editUserMutation.isPending
//                 : createUserMutation.isPending)
//             }
//             className='text-white'
//           >
//             {isSubmitting ||
//             (userToEdit
//               ? editUserMutation.isPending
//               : createUserMutation.isPending)
//               ? 'Saving...'
//               : userToEdit
//                 ? 'Update User'
//                 : 'Save User'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // Accept a tooltip prop
// interface ConfirmStatusToggleDialogProps {
//   title: string
//   description: string
//   onConfirm: () => void
//   isConfirming: boolean
//   confirmLabel: string
//   confirmVariant: 'default' | 'destructive'
//   children: React.ReactNode
//   tooltip?: string
// }

// function ConfirmStatusToggleDialog({
//   title,
//   description,
//   onConfirm,
//   isConfirming,
//   confirmLabel,
//   confirmVariant,
//   children,
//   tooltip,
// }: ConfirmStatusToggleDialogProps) {
//   return (
//     <Dialog>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <DialogTrigger asChild>{children}</DialogTrigger>
//         </TooltipTrigger>
//         {tooltip ? <TooltipContent side='top'>{tooltip}</TooltipContent> : null}
//       </Tooltip>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//           <DialogDescription>{description}</DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <Button
//             variant={confirmVariant}
//             onClick={onConfirm}
//             disabled={isConfirming}
//           >
//             {isConfirming ? 'Processing...' : confirmLabel}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }













import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import {
  Pencil,
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Upload,
  Download,
  FileSpreadsheet,
  KeyRound,
} from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog'
import { FilterPopover } from '@/components/filter/FilterPopover'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table'
import DeleteActionButton from '@/components/table/action/DeleteButton'
import {
  BadgeCell,
  UserCell,
  RoleBadge,
  AssignmentCell,
} from '@/components/table/cells'

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: RouteComponent,
})

/* =============================
  Types
============================= */
type DropdownOption = { id: string | number; name: string }
type DropdownResponse = {
  status?: string
  message?: string
  data?: DropdownOption[]
}

type NewUserForm = {
  name: string
  username: string
  fullName: string
  roleId: string
  departmentId?: string
  branchId?: string
  email: string
  number: string
  userLevel: 'Department' | 'Branch' | ''
  selectedEntityId?: string
  useCommonRole?: boolean
}

type User = components['schemas']['User']

/** EXCEL/CREATE payload keys ONLY */
type UserCreatePayload = {
  name: string
  username: string
  fullName: string
  roleId: string
  email: string
  number: string
  departmentId: string
  branchId: string
}

type BulkFailure = { row: number; reason: string }

/* =============================
  Helpers
============================= */
function authHeader() {
  const token = sessionStorage.getItem('token') || ''
  return { Authorization: `Bearer ${token}` }
}

function getUserRole(user: User): string {
  if (user.isSuperAdmin) return 'Super Admin'
  if (user.isAdmin) return 'Admin'
  if (user.isAuditor) return 'Auditor'
  if (user.isStockAuditor) return 'Stock Auditor'
  if (user.isAdvocate) return 'Advocate'
  if (user.isValuer) return 'Valuer'
  if (user.branchId) return 'Branch'
  if (user.departmentId) return 'Department'
  return 'Unknown'
}

const asOptions = (res?: DropdownResponse) => res?.data ?? []

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  } catch {
    toast.error('Copy failed')
  }
}

/* =============================
  XLSX Export helpers
============================= */
function fileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toPayloadRow(u: User): UserCreatePayload {
  return {
    name: u.name ?? '',
    username: u.username ?? '',
    fullName: u.fullName ?? '',
    roleId: u.roleId ?? '',
    email: u.email ?? '',
    number: u.number ?? '',
    departmentId: u.departmentId ?? '',
    branchId: u.branchId ?? '',
  }
}

async function exportExcelPayloadOnly(
  rows: readonly UserCreatePayload[],
  filename = 'users.xlsx'
): Promise<void> {
  const XLSX: typeof import('xlsx') = await import('xlsx')

  // IMPORTANT: xlsx typing expects mutable array
  const mutableRows: UserCreatePayload[] = Array.from(rows)

  const ws = XLSX.utils.json_to_sheet(mutableRows, {
    header: [
      'name',
      'username',
      'fullName',
      'roleId',
      'email',
      'number',
      'departmentId',
      'branchId',
    ],
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Users')
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

  fileDownload(
    new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename
  )
}

/* =============================
  Bulk Upload Dialog (with progress)
============================= */
function BulkUserUploadDialog({
  disabled,
  onSuccess,
}: {
  disabled?: boolean
  onSuccess: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [rows, setRows] = useState<UserCreatePayload[]>([])
  const [failures, setFailures] = useState<BulkFailure[]>([])

  const [sent, setSent] = useState(0)
  const [success, setSuccess] = useState(0)
  const [failed, setFailed] = useState(0)

  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const createUserMutation = $api.useMutation('post', '/user/create')

  const total = rows.length
  const progressPct =
    total === 0 ? 0 : Math.min(100, Math.round((sent / total) * 100))

  const downloadTemplate = async () => {
    const template: UserCreatePayload[] = [
      {
        name: '',
        username: '',
        fullName: '',
        roleId: '',
        email: '',
        number: '',
        departmentId: '',
        branchId: '',
      },
    ]
    await exportExcelPayloadOnly(template, 'users_template.xlsx')
  }

  const parseFile = async (picked: File) => {
    setIsParsing(true)
    try {
      const XLSX: typeof import('xlsx') = await import('xlsx')
      const buf = await picked.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })

      const ok: UserCreatePayload[] = []
      const bad: BulkFailure[] = []

      const reqKeys: Array<keyof UserCreatePayload> = [
        'name',
        'username',
        'fullName',
        'roleId',
        'email',
        'number',
        'departmentId',
        'branchId',
      ]

      parsed.forEach((r, idx) => {
        const rowNumber = idx + 2 // header = 1

        const get = (k: keyof UserCreatePayload) => {
          const v = r[k as string]
          return typeof v === 'string' || typeof v === 'number'
            ? String(v).trim()
            : ''
        }

        const missingHeaders = reqKeys.filter((k) => !(k in r))
        if (missingHeaders.length > 0) {
          bad.push({
            row: rowNumber,
            reason: `Missing columns: ${missingHeaders.join(', ')}`,
          })
          return
        }

        const payload: UserCreatePayload = {
          name: get('name'),
          username: get('username'),
          fullName: get('fullName'),
          roleId: get('roleId'),
          email: get('email'),
          number: get('number'),
          departmentId: get('departmentId'),
          branchId: get('branchId'),
        }

        if (!payload.username || !payload.roleId || !payload.email) {
          bad.push({ row: rowNumber, reason: 'username, roleId, email are required' })
          return
        }

        if (!payload.departmentId && !payload.branchId) {
          bad.push({ row: rowNumber, reason: 'Either departmentId or branchId is required' })
          return
        }

        ok.push(payload)
      })

      setRows(ok)
      setFailures(bad)
      setSent(0)
      setSuccess(0)
      setFailed(0)

      toast.success(`Parsed: ${ok.length} valid, ${bad.length} invalid`)
    } catch {
      toast.error('Could not parse file')
      setRows([])
      setFailures([])
      setSent(0)
      setSuccess(0)
      setFailed(0)
    } finally {
      setIsParsing(false)
    }
  }

  const startUpload = async () => {
    if (!rows.length) return
    setIsUploading(true)
    setSent(0)
    setSuccess(0)
    setFailed(0)

    const apiFailures: BulkFailure[] = []

    for (let i = 0; i < rows.length; i++) {
      try {
        await createUserMutation.mutateAsync({
          // params: { header: authHeader() },
          body: rows[i],
        })
        setSuccess((s) => s + 1)
      } catch {
        setFailed((f) => f + 1)
        apiFailures.push({ row: i + 2, reason: 'API error while creating user' })
      } finally {
        setSent((s) => s + 1)
      }
    }

    if (apiFailures.length) setFailures((prev) => [...prev, ...apiFailures])

    setIsUploading(false)
    toast.success('Bulk upload completed')
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' disabled={disabled}>
          <Upload className='h-4 w-4' />
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl'>
        <DialogHeader className='border-b p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold'>Bulk Upload Users</DialogTitle>
          <DialogDescription className='mt-1 text-sm text-[var(--color-muted-foreground)]'>
            Upload Excel with headers:
            <span className='ml-2 rounded-md border bg-[var(--color-card)] px-2 py-0.5 font-mono text-[10px]'>
              name, username, fullName, roleId, email, number, departmentId, branchId
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 p-6 pt-4'>
          {/* Actions */}
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => void downloadTemplate()}
            >
              <Download className='mr-2 h-4 w-4' />
              Download Template
            </Button>

            <input
              ref={inputRef}
              type='file'
              accept='.xlsx,.xls'
              className='hidden'
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  setFile(f)
                  void parseFile(f)
                }
                e.currentTarget.value = ''
              }}
            />

            <Button
              type='button'
              size='sm'
              className='text-white'
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || isParsing}
            >
              <FileSpreadsheet className='mr-2 h-4 w-4' />
              Choose File
            </Button>

            {file?.name ? (
              <span className='rounded-full border bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]'>
                {file.name}
              </span>
            ) : (
              <span className='text-xs text-[var(--color-muted-foreground)]'>No file selected</span>
            )}
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
              <div className='text-[11px] text-[var(--color-muted-foreground)]'>Valid Rows</div>
              <div className='text-xl font-semibold'>{rows.length}</div>
            </div>
            <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
              <div className='text-[11px] text-[var(--color-muted-foreground)]'>Invalid Rows</div>
              <div className='text-xl font-semibold'>{failures.length}</div>
            </div>
            <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
              <div className='text-[11px] text-[var(--color-muted-foreground)]'>Uploaded</div>
              <div className='text-xl font-semibold'>{sent}</div>
            </div>
            <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
              <div className='text-[11px] text-[var(--color-muted-foreground)]'>Success / Failed</div>
              <div className='text-xl font-semibold'>
                {success} / {failed}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[var(--color-muted-foreground)]'>Progress</span>
              <span className='font-mono'>
                {sent}/{total} ({progressPct}%)
              </span>
            </div>

            <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800'>
              <div
                className='h-full rounded-full'
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg,var(--color-primary),var(--color-chart-2))',
                  transition: 'width 200ms linear',
                }}
              />
            </div>

            {(isParsing || isUploading) && (
              <div className='mt-2 text-xs text-[var(--color-muted-foreground)]'>
                {isParsing ? 'Parsing file…' : 'Uploading…'}
              </div>
            )}
          </div>

          {/* Failures */}
          {failures.length > 0 && (
            <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
              <div className='mb-2 text-sm font-semibold'>
                Invalid / Failed Rows ({failures.length})
              </div>

              <div className='max-h-56 overflow-auto text-xs'>
                <table className='w-full'>
                  <thead className='text-left'>
                    <tr className='border-b'>
                      <th className='py-2 pr-2'>Row</th>
                      <th className='py-2 pr-2'>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failures.slice(0, 20).map((f) => (
                      <tr key={`${f.row}-${f.reason}`} className='border-b last:border-0'>
                        <td className='py-2 pr-2 font-mono'>{f.row}</td>
                        <td className='py-2 pr-2'>{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {failures.length > 20 && (
                  <div className='mt-2 text-[var(--color-muted-foreground)]'>
                    Showing first 20 rows…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 border-t bg-[var(--color-card)] p-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isUploading || isParsing}
          >
            Close
          </Button>

          <Button
            type='button'
            className='text-white'
            onClick={() => void startUpload()}
            disabled={isUploading || isParsing || rows.length === 0}
          >
            Start Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* =============================
  Main Page
============================= */
function RouteComponent() {
    const canCreate = useCanAccess('users', 'create')
  const canUpdate = useCanAccess('users', 'update')
  const canDelete = useCanAccess('users', 'delete')

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [showIds, setShowIds] = useState(false)

  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const { data: usersResponse, isLoading, refetch } = $api.useQuery(
    'get',
    '/user/get/AllUsers',
    { params: { header: authHeader() } },
    {}
  )

  const users: User[] = (usersResponse)?.data ?? usersResponse?.data ?? []

  const distinctRoleTypes = useMemo(() => {
    const roleTypes = users.map((u) => getUserRole(u))
    return [...new Set(roleTypes)].filter(Boolean).sort()
  }, [users])

  const distinctDepartments = useMemo(() => {
    const departments = users.map((u) => u.departmentName).filter(Boolean)
    return [...new Set(departments)].filter(Boolean).sort()
  }, [users])

  const distinctBranches = useMemo(() => {
    const branches = users.map((u) => u.branchName).filter(Boolean)
    return [...new Set(branches)].filter(Boolean).sort()
  }, [users])

  const distinctStatuses = ['Enabled', 'Disabled'] as const

  const filteredUsers = useMemo<User[]>(() => {
    return users.filter((user) => {
      const roleMatch =
        selectedRoleTypes.length === 0 ||
        selectedRoleTypes.includes(getUserRole(user))

      const departmentMatch =
        selectedDepartments.length === 0 ||
        (user.departmentName &&
          selectedDepartments.includes(user.departmentName))

      const branchMatch =
        selectedBranches.length === 0 ||
        (user.branchName && selectedBranches.includes(user.branchName))

      const statusMatch =
        selectedStatuses.length === 0 ||
        (selectedStatuses.includes('Enabled') && !!user.isEnable) ||
        (selectedStatuses.includes('Disabled') && !user.isEnable)

      return roleMatch && departmentMatch && branchMatch && statusMatch
    })
  }, [
    users,
    selectedRoleTypes,
    selectedDepartments,
    selectedBranches,
    selectedStatuses,
  ])

  useEffect(() => {
    setSelectedRoleTypes((prev) =>
      prev.filter((r) => distinctRoleTypes.includes(r))
    )
  }, [distinctRoleTypes])

  useEffect(() => {
    setSelectedDepartments((prev) =>
      prev.filter((d) => distinctDepartments.includes(d))
    )
  }, [distinctDepartments])

  useEffect(() => {
    setSelectedBranches((prev) =>
      prev.filter((b) => distinctBranches.includes(b))
    )
  }, [distinctBranches])

  const isFiltered =
    selectedRoleTypes.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedBranches.length > 0 ||
    selectedStatuses.length > 0

  const deleteUserMutation = $api.useMutation(
    'delete',
    '/user/manage/delete/{username}'
  )
  const enableDisableMutation = $api.useMutation(
    'put',
    '/user/enable-disable/{userId}'
  )
  const paswordUpdateMutation = $api.useMutation(
            'put',
            '/user/super-admin/update-password/{username}'
          )
        
          const updatePasswordWrapper: UpdatePasswordFn = ({ username, newPassword }) =>
            new Promise<void>((resolve) => {
              paswordUpdateMutation.mutate(
                {
                  params: { path: { username }, header: { Authorization: '' } },
                  body: { currentPassword: null as unknown as string, newPassword },
                },
                {
                  onSuccess: (res) => {
                    toast.success(res?.message || 'Password updated successfully.')
                    resolve()
                  },
                  onError: (err) => {
                    toastError(err, 'Failed to update password')
                    resolve()
                  },
                }
              )
            })

  const handleDelete = (username: string) => {
    deleteUserMutation.mutate(
      {
        params: {
          // header: authHeader(),
          path: { username },
        },
      },
      {
        onSuccess: () => {
          toast.success('User deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete user'),
      }
    )
  }

  const handleToggleStatus = (user: User) => {
    if (!user.id) return
    const newStatus = !user.isEnable
    enableDisableMutation.mutate(
      {
        params: {
          // header: authHeader(),
          path: { userId: user.id },
          query: { enabled: newStatus },
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `User ${newStatus ? 'enabled' : 'disabled'} successfully`
          )
          refetch()
        },
        onError: () => toast.error('Could not update user status'),
      }
    )
  }

  const handleExportExcel = async () => {
    if (!filteredUsers.length) return toast.info('No data to export.')
    const payloadRows = filteredUsers.map(toPayloadRow)
    await exportExcelPayloadOnly(payloadRows, 'users.xlsx')
  }

  const columns: PaginatedTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <div className='space-y-1'>
          <UserCell row={row} />
          {showIds && (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>ID: {row.id ?? '-'}</span>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => void copyText(String(row.id ?? ''))}
                aria-label='Copy user id'
              >
                <Copy className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    { key: 'username', label: 'Username' },
    {
      key: 'roleId',
      label: 'Role',
      render: (_, row) => (
        <div className='space-y-1'>
          <RoleBadge role={getUserRole(row)} />
          {showIds && (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>roleId: {row.roleId ?? '-'}</span>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => void copyText(row.roleId ?? '')}
                aria-label='Copy role id'
              >
                <Copy className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'departmentName',
      label: 'Assignment',
      render: (_, row) => (
        <div className='space-y-1'>
          <AssignmentCell row={row} />
          {showIds && (
            <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <span>departmentId: {row.departmentId ?? '-'}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => void copyText(row.departmentId ?? '')}
                  aria-label='Copy department id'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
              <div className='flex items-center gap-2'>
                <span>branchId: {row.branchId ?? '-'}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => void copyText(row.branchId ?? '')}
                  aria-label='Copy branch id'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'number',
      label: 'Number',
      render: (value) => <BadgeCell value={`📞 ${value || '------------'}`} />,
    },
    {
      key: 'isEnable',
      label: 'Status',
      render: (value) => (
        <BadgeCell
          value={value ? 'Enabled' : 'Disabled'}
          variant={value ? 'default' : 'destructive'}
        />
      ),
    },
  ]

  const tableActions = (
    <div className='flex flex-wrap items-center gap-2'>
      <FilterPopover
        options={distinctRoleTypes}
        selected={selectedRoleTypes}
        onChange={setSelectedRoleTypes}
        placeholder='Filter by Role Type'
      />
      <FilterPopover
        options={distinctDepartments.filter(
          (a): a is string => typeof a === 'string'
        )}
        selected={selectedDepartments}
        onChange={setSelectedDepartments}
        placeholder='Filter by Department'
      />
      <FilterPopover
        options={distinctBranches.filter((a): a is string => typeof a === 'string')}
        selected={selectedBranches}
        onChange={setSelectedBranches}
        placeholder='Filter by Branch'
      />
      <FilterPopover
        options={[...distinctStatuses]}
        selected={selectedStatuses}
        onChange={setSelectedStatuses}
        placeholder='Filter by Status'
      />
    </div>
  )

  return (
    <>
      {isLoading && <LoadingBar progress={70} className='h-1' color='#2563eb' />}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Users
        </h1>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowIds((v) => !v)}
          >
            {showIds ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>

          <BulkUserUploadDialog onSuccess={refetch} disabled={!canCreate} />

          <Button
            variant='outline'
            size='sm'
            onClick={() => void handleExportExcel()}
          >
            <Download className='h-4 w-4' />
          </Button>

          {canCreate && (
            <UserForm
              open={isDialogOpen}
              onOpenChange={setDialogOpen}
              onSuccess={() => {
                setDialogOpen(false)
                refetch()
              }}
              userToEdit={userToEdit}
            />
          )}
        </div>
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        {selectedRoleTypes.map((role) => (
          <Badge key={role} variant='secondary'>
            Role: {role}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedRoleTypes((prev) => prev.filter((r) => r !== role))
              }
            >
              ×
            </Button>
          </Badge>
        ))}
        {selectedDepartments.map((dept) => (
          <Badge key={dept} variant='secondary'>
            Department: {dept}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedDepartments((prev) =>
                  prev.filter((d) => d !== dept)
                )
              }
            >
              ×
            </Button>
          </Badge>
        ))}
        {selectedBranches.map((branch) => (
          <Badge key={branch} variant='secondary'>
            Branch: {branch}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedBranches((prev) =>
                  prev.filter((b) => b !== branch)
                )
              }
            >
              ×
            </Button>
          </Badge>
        ))}
        {selectedStatuses.map((status) => (
          <Badge key={status} variant='secondary'>
            Status: {status}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedStatuses((prev) => prev.filter((s) => s !== status))
              }
            >
              ×
            </Button>
          </Badge>
        ))}
        {isFiltered && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setSelectedRoleTypes([])
              setSelectedDepartments([])
              setSelectedBranches([])
              setSelectedStatuses([])
            }}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {filteredUsers.length ? (
        <TooltipProvider delayDuration={200}>
          <PaginatedTable
            data={filteredUsers}
            columns={columns}
            tableActions={tableActions}
            renderActions={(row) => {
              if (row.isSuperAdmin) return null
              const toggleLabel = row.isEnable ? 'Disable user' : 'Enable user'
              return (
                <div className='flex items-center space-x-2'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label='Edit user'
                        onClick={() => {
                          setUserToEdit(row)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='top'>Edit</TooltipContent>
                  </Tooltip>

                  <ConfirmStatusToggleDialog
                    title={`${row.isEnable ? 'Disable' : 'Enable'} “${row.name}”?`}
                    description={`Are you sure you want to ${row.isEnable ? 'disable' : 'enable'} this user?`}
                    onConfirm={() => handleToggleStatus(row)}
                    isConfirming={enableDisableMutation.isPending}
                    confirmLabel={row.isEnable ? 'Disable' : 'Enable'}
                    confirmVariant={row.isEnable ? 'destructive' : 'default'}
                    tooltip={toggleLabel}
                  >
                    <Button variant='ghost' size='icon' aria-label={toggleLabel}>
                      {row.isEnable ? (
                        <Ban className='h-4 w-4 text-red-500' />
                      ) : (
                        <CheckCircle className='h-4 w-4 text-green-500' />
                      )}
                    </Button>
                  </ConfirmStatusToggleDialog>

                  {/* Update Password */}
                  {canUpdate && (
                    <UpdatePasswordDialog
                      username={row.username ?? ''}
                      onUpdatePassword={updatePasswordWrapper}
                    />
                  )}

                  {/* Delete */}
                  {canDelete && (
                    <ConfirmDeleteDialog
                      title={`Delete “${row.name}”?`}
                      onConfirm={() => handleDelete(row.username ?? '')}
                      isConfirming={deleteUserMutation.isPending}
                      tooltip='Delete user'
                    >
                      <DeleteActionButton
                        onClick={() => {}}
                        aria-label='Delete user'
                      />
                    </ConfirmDeleteDialog>
                  )}
                </div>
              )
            }}
            emptyMessage={
              isFiltered
                ? 'No users match the selected filters.'
                : 'No users to display at the moment.'
            }
          />
        </TooltipProvider>
      ) : (
        !isLoading && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
            <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
              {isFiltered ? 'No users match the selected filters.' : 'No Users Found'}
            </h3>
            {!isFiltered && (
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new user.
              </p>
            )}
          </div>
        )
      )}
    </>
  )
}

/* =============================
  User Form
============================= */
interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userToEdit?: User | null
}

function UserForm({ open, onOpenChange, onSuccess, userToEdit }: UserFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<NewUserForm>({
    defaultValues: {
      userLevel: '',
      name: '',
      username: '',
      fullName: '',
      email: '',
      number: '',
      departmentId: undefined,
      branchId: undefined,
      roleId: '',
      selectedEntityId: undefined,
      useCommonRole: false,
    },
    shouldUnregister: true,
  })

  const selectedUserLevel = watch('userLevel')
  const selectedEntityId = watch('selectedEntityId')
  const useCommonRole = watch('useCommonRole') || false

  const { data: departmentsResponse, isLoading: departmentsLoading } = $api.useQuery(
    'get',
    '/departments/get/dropdown',
    { params: { header: authHeader() } },
    { enabled: selectedUserLevel === 'Department' }
  )

  const { data: branchesResponse, isLoading: branchesLoading } = $api.useQuery(
    'get',
    '/branches/get/dropdown',
    { params: { header: authHeader() } },
    { enabled: selectedUserLevel === 'Branch' }
  ) as { data: DropdownResponse | undefined; isLoading: boolean }

  const { data: rolesResponse, isLoading: rolesLoading } = $api.useQuery(
    'get',
    '/roles/get/dropdown/{type}',
    {
      params: {
        // header: authHeader(),
        query: { id: selectedEntityId ?? '' },
        path: { type: selectedUserLevel?.toLowerCase() },
      },
    },
    { enabled: !!selectedUserLevel && !!selectedEntityId && !useCommonRole }
  ) as { data: DropdownResponse | undefined; isLoading: boolean }

  const { data: commonRolesResponse, isLoading: commonRolesLoading } = $api.useQuery(
    'get',
    '/roles/get/dropdown/common/{type}',
    {
      params: {
        // header: authHeader(),
        path: { type: selectedUserLevel?.toLowerCase() },
      },
    },
    { enabled: !!selectedUserLevel && useCommonRole }
  ) as { data: DropdownResponse | undefined; isLoading: boolean }

  const createUserMutation = $api.useMutation('post', '/user/create', {
    onSuccess: (response) => {
      toast.success(response?.message || 'User created successfully! 🎉')
      reset()
      onSuccess()
    },
    onError: (error) =>
      toastError(error, 'Could not create user. Please try again.'),
  })

  const editUserMutation = $api.useMutation('put', '/user/updateUser', {
    onSuccess: (response) => {
      toast.success(response?.message || 'User updated successfully! 🎉')
      reset()
      onSuccess()
    },
    onError: (error) =>
      toastError(error, 'Could not update user. Please try again.'),
  })

  const onSubmit = handleSubmit((values) => {
    const payload: UserCreatePayload = {
      name: values.name,
      username: values.username,
      fullName: values.fullName,
      roleId: values.roleId,
      email: values.email,
      number: values.number,
      departmentId: '',
      branchId: '',
    }

    if (values.userLevel === 'Department' && values.selectedEntityId) {
      payload.departmentId = values.selectedEntityId
    } else if (values.userLevel === 'Branch' && values.selectedEntityId) {
      payload.branchId = values.selectedEntityId
    }

    if (userToEdit) {
      editUserMutation.mutate({
        params: { header: authHeader() },
        body: {
          ...userToEdit,
          ...payload,
          id: userToEdit.id,
          isEnable: userToEdit.isEnable,
        },
      })
    } else {
      createUserMutation.mutate({
        // params: { header: authHeader() },
        body: payload,
      })
    }
  })

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    if (userToEdit) {
      reset({
        name: userToEdit.name || '',
        username: userToEdit.username || '',
        fullName: userToEdit.fullName || '',
        roleId: userToEdit.roleId || '',
        email: userToEdit.email || '',
        number: userToEdit.number || '',
        userLevel: userToEdit.departmentId
          ? 'Department'
          : userToEdit.branchId
            ? 'Branch'
            : '',
        selectedEntityId:
          userToEdit.departmentId || userToEdit.branchId || undefined,
        useCommonRole: false,
      })
    }
  }, [userToEdit, reset])

  useEffect(() => {
    setValue('selectedEntityId', undefined, { shouldValidate: false })
    setValue('roleId', '', { shouldValidate: false })
    clearErrors(['selectedEntityId', 'roleId'])
  }, [selectedUserLevel, setValue, clearErrors])

  useEffect(() => {
    setValue('roleId', '', { shouldValidate: false })
    clearErrors('roleId')
  }, [useCommonRole, setValue, clearErrors])

  const entityRules = {
    validate: (v: string | undefined) => {
      const lvl = getValues('userLevel')
      if (lvl === 'Department') return v ? true : 'Department is required.'
      if (lvl === 'Branch') return v ? true : 'Branch is required.'
      return true
    },
  }

  const inputFields: Array<
    [
      keyof NewUserForm,
      string,
      string?,
      string?,
      Record<
        string,
        Record<string, string | number | RegExp> | string | number | RegExp
      >?,
    ]
  > = [
      [
        'name',
        'Name *',
        'e.g., Anurag Parmar',
        'text',
        {
          required: 'Name is required.',
          minLength: { value: 2, message: 'Min 2 chars.' },
        },
      ],
      [
        'username',
        'Username *',
        'e.g., anuragp',
        'text',
        {
          required: 'Username is required.',
          minLength: { value: 3, message: 'Min 3 chars.' },
          pattern: {
            value: /^[a-zA-Z0-9_.-]+$/,
            message: 'Allowed: letters, numbers, underscore, dot, hyphen',
          },
        },
      ],
      [
        'fullName',
        'Full Name *',
        'e.g., Anurag P Parmar',
        'text',
        {
          required: 'Full Name is required.',
          minLength: { value: 2, message: 'Min 2 chars.' },
        },
      ],
      [
        'email',
        'Email *',
        'e.g., user@example.com',
        'email',
        {
          required: 'Email is required.',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email',
          },
        },
      ],
      [
        'number',
        'Number *',
        'e.g., 9104544235',
        'tel',
        {
          required: 'Phone number is required.',
          pattern: { value: /^\+?\d{10,13}$/, message: 'Enter 10–13 digits' },
        },
      ],
    ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='default' className='text-white'>
          New User
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-2xl font-semibold'>
            {userToEdit ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription className='mt-1'>
            Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>

        <form
          id='user-form'
          onSubmit={onSubmit}
          className='space-y-5 px-6 pt-2 pb-2'
        >
          {/* User Level */}
          <div className='grid gap-1.5'>
            <Label htmlFor='userLevel'>User Level *</Label>
            <Controller
              name='userLevel'
              control={control}
              rules={{ required: 'User Level is required.' }}
              render={({ field }) => (
                <Select
                  // disabled={!!userToEdit}
                  onValueChange={(value) =>
                    field.onChange(value as 'Department' | 'Branch')
                  }
                  value={field.value ?? ''}
                >
                  <SelectTrigger
                    id='userLevel'
                    className={errors.userLevel ? 'border-red-500' : undefined}
                  >
                    <SelectValue placeholder='Select user level' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Department'>Department</SelectItem>
                    <SelectItem value='Branch'>Branch</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.userLevel && (
              <p className='text-sm text-red-500'>{errors.userLevel.message}</p>
            )}
          </div>

          {/* Department */}
          {selectedUserLevel === 'Department' && (
            <div className='grid gap-1.5'>
              <Label>Select Department *</Label>
              <Controller
                name='selectedEntityId'
                control={control}
                rules={entityRules}
                render={({ field }) => (
                  <Select
                    disabled={
                      departmentsLoading || !(departmentsResponse?.data?.length ?? 0)
                    }
                    onValueChange={(value) => {
                      field.onChange(String(value))
                      setValue('roleId', '', { shouldValidate: true })
                      clearErrors(['selectedEntityId', 'roleId'])
                    }}
                    value={field.value ?? ''}
                  >
                    <SelectTrigger
                      className={errors.selectedEntityId ? 'border-red-500' : undefined}
                    >
                      <SelectValue
                        placeholder={departmentsLoading ? 'Loading...' : 'Select a department'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(departmentsResponse?.data ?? []).map(({ id, name }) => (
                        <SelectItem key={String(id)} value={String(id)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.selectedEntityId && (
                <p className='text-sm text-red-500'>
                  {errors.selectedEntityId.message}
                </p>
              )}
            </div>
          )}

          {/* Branch */}
          {selectedUserLevel === 'Branch' && (
            <div className='grid gap-1.5'>
              <Label>Select Branch *</Label>
              <Controller
                name='selectedEntityId'
                control={control}
                rules={entityRules}
                render={({ field }) => {
                  const options = asOptions(branchesResponse)
                  const noneAvail = !branchesLoading && options.length === 0
                  return (
                    <Select
                      disabled={branchesLoading || noneAvail}
                      onValueChange={(value) => {
                        field.onChange(String(value))
                        setValue('roleId', '', { shouldValidate: true })
                        clearErrors(['selectedEntityId', 'roleId'])
                      }}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger
                        className={errors.selectedEntityId ? 'border-red-500' : undefined}
                      >
                        <SelectValue
                          placeholder={branchesLoading ? 'Loading...' : 'Select a branch'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(({ id, name }) => (
                          <SelectItem key={String(id)} value={String(id)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {errors.selectedEntityId && (
                <p className='text-sm text-red-500'>
                  {errors.selectedEntityId.message}
                </p>
              )}
            </div>
          )}

          {/* Common Role switch */}
          {selectedUserLevel && (
            <div className='flex items-center justify-between rounded-md border p-3 pr-4'>
              <div className='space-y-0.5'>
                <Label>Common Role?</Label>
                <p className='text-xs text-muted-foreground'>
                  Shows common roles instead of entity-specific ones.
                </p>
              </div>
              <Controller
                name='useCommonRole'
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(val) => {
                      field.onChange(val)
                      setValue('roleId', '', { shouldValidate: false })
                      clearErrors('roleId')
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* Role */}
          {selectedUserLevel && selectedEntityId && (
            <div className='grid gap-1.5'>
              <Label>Select Role *</Label>
              <Controller
                name='roleId'
                control={control}
                rules={{ required: 'Role is required.' }}
                render={({ field }) => {
                  const loading = useCommonRole ? commonRolesLoading : rolesLoading
                  const list =
                    (useCommonRole ? commonRolesResponse?.data : rolesResponse?.data) ?? []
                  const noneAvail = !loading && list.length === 0
                  return (
                    <Select
                      disabled={loading || noneAvail}
                      onValueChange={(value) => {
                        field.onChange(String(value))
                        clearErrors('roleId')
                      }}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger className={errors.roleId ? 'border-red-500' : undefined}>
                        <SelectValue placeholder={loading ? 'Loading...' : 'Select role'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(list).map(({ id, name }) => (
                          <SelectItem key={String(id)} value={String(id)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {errors.roleId && (
                <p className='text-sm text-red-500'>{errors.roleId.message}</p>
              )}
            </div>
          )}

          {/* Text inputs */}
          {inputFields.map(([name, labelText, placeholder, type, rules]) => (
            <div key={name} className='grid gap-1.5'>
              <Label htmlFor={name}>{labelText}</Label>
              <Input
                id={name}
                type={type ?? 'text'}
                placeholder={placeholder ?? ''}
                disabled={name === 'username' && !!userToEdit}
                {...register(name, rules)}
                className={errors[name] ? 'border-red-500' : undefined}
              />
              {errors[name] && (
                <p className='text-sm text-red-500'>
                  {String(errors[name]?.message ?? '')}
                </p>
              )}
            </div>
          ))}
        </form>

        <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='user-form'
            disabled={
              isSubmitting ||
              createUserMutation.isPending ||
              editUserMutation.isPending
            }
            className='text-white'
          >
            {isSubmitting || createUserMutation.isPending || editUserMutation.isPending
              ? 'Saving...'
              : userToEdit
                ? 'Update User'
                : 'Save User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* =============================
  Confirm Status Toggle Dialog
============================= */
interface ConfirmStatusToggleDialogProps {
  title: string
  description: string
  onConfirm: () => void
  isConfirming: boolean
  confirmLabel: string
  confirmVariant: 'default' | 'destructive'
  children: React.ReactNode
  tooltip?: string
}

function ConfirmStatusToggleDialog({
  title,
  description,
  onConfirm,
  isConfirming,
  confirmLabel,
  confirmVariant,
  children,
  tooltip,
}: ConfirmStatusToggleDialogProps) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{children}</DialogTrigger>
        </TooltipTrigger>
        {tooltip ? <TooltipContent side='top'>{tooltip}</TooltipContent> : null}
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


type UpdatePasswordArgs = { username: string; newPassword: string }
type UpdatePasswordFn = (args: UpdatePasswordArgs) => Promise<void>

function UpdatePasswordDialog({
  username,
  onUpdatePassword,
}: {
  username: string
  onUpdatePassword: UpdatePasswordFn
}) {
  const [open, setOpen] = useState(false)
  const [pwd, setPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await onUpdatePassword({ username, newPassword: pwd })
      setPwd('')
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon' aria-label='Update password'>
              <KeyRound className='h-4 w-4' />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side='top'>Update password</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
          <DialogDescription>
            Set a new password for{' '}
            <span className='font-medium'>{username}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor='new-password'>New Password</Label>
            <Input
              id='new-password'
              type='password'
              placeholder='Enter new password'
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              disabled={submitting}
              className='dark:border-gray-600 dark:bg-gray-700'
            />
            <p className='text-muted-foreground text-xs'>
              Minimum 8 characters. Current password is not required.
            </p>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting} className='text-white'>
              {submitting ? 'Saving...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}