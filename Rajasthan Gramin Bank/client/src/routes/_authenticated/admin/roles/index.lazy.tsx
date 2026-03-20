// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, createLazyFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { useCanAccess } from '@/hooks/use-can-access.tsx'
// import { Badge } from '@/components/ui/badge.tsx'
// import { Button } from '@/components/ui/button'
// import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
// import PaginatedTable, {
//   PaginatedTableColumn,
// } from '@/components/paginated-table.tsx'
// import {
//   AssignmentCell,
//   RoleBadge,
//   DateTimeCell,
//   BadgeCell,
//   DeleteActionCell,
//   EditActionCell,
// } from '@/components/table/cells.ts'
// export const Route = createLazyFileRoute('/_authenticated/admin/roles/')({
//   component: RolesPage,
// })
// type Role = components['schemas']['Role']
// function getRoleType(role: Role): string {
//   if (role.isSuperAdmin) return 'Super Admin'
//   if (role.isAdmin) return 'Admin'
//   if (role.isAuditor) return 'Auditor'
//   if (role.isStockAuditor) return 'Stock Auditor'
//   if (role.isAdvocate) return 'Advocate'
//   if (role.parentBranchId) return 'Branch'
//   if (role.parentDepartmentId) return 'Department'
//   return 'Unknown'
// }
// function RolesPage() {
//   const canCreate = useCanAccess('roles', 'create')
//   const canUpdate = useCanAccess('roles', 'update')
//   const navigate = useNavigate()
//   const {
//     data: rolesData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/roles/getAllRoles', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//       },
//     },
//   })
//   const deleteRoleMutation = $api.useMutation(
//     'delete',
//     '/roles/delete/{roleId}'
//   )
//   const handleDelete = (roleId: string) => {
//     deleteRoleMutation.mutate(
//       {
//         params: {
//           path: { roleId },
//         },
//       },
//       {
//         onSuccess: () => {
//           toast.success('Role deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete role'),
//       }
//     )
//   }
//   // State for selected filters
//   const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
//   const [selectedBranches, setSelectedBranches] = useState<string[]>([])
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
//   // Compute distinct departments, branches, and statuses
//   const distinctDepartments = useMemo(() => {
//     const departments =
//       rolesData?.data?.map((role) => role.departmentName).filter(Boolean) || []
//     return [...new Set(departments)].filter((x) => x !== undefined).sort()
//   }, [rolesData])
//   const distinctBranches = useMemo(() => {
//     const branches =
//       rolesData?.data?.map((role) => role.branchName).filter(Boolean) || []
//     return [...new Set(branches)].filter((x) => x !== undefined).sort()
//   }, [rolesData])
//   const distinctStatuses = ['Active', 'Inactive']
//   // Filter roles based on selected filters
//   const filteredRoles = useMemo(() => {
//     return (
//       rolesData?.data?.filter((role) => {
//         const departmentMatch =
//           selectedDepartments.length === 0 ||
//           (role.departmentName &&
//             selectedDepartments.includes(role.departmentName))
//         const branchMatch =
//           selectedBranches.length === 0 ||
//           (role.branchName && selectedBranches.includes(role.branchName))
//         const statusMatch =
//           selectedStatuses.length === 0 ||
//           (selectedStatuses.includes('Active') && role.isActive) ||
//           (selectedStatuses.includes('Inactive') && !role.isActive)
//         return departmentMatch && branchMatch && statusMatch
//       }) || []
//     )
//   }, [rolesData, selectedDepartments, selectedBranches, selectedStatuses])
//   // Remove invalid selected filters when distinct lists change
//   useEffect(() => {
//     setSelectedDepartments((prev) =>
//       prev.filter((dept) => distinctDepartments.includes(dept))
//     )
//   }, [distinctDepartments])
//   useEffect(() => {
//     setSelectedBranches((prev) =>
//       prev.filter((branch) => distinctBranches.includes(branch))
//     )
//   }, [distinctBranches])
//   const isFiltered =
//     selectedDepartments.length > 0 ||
//     selectedBranches.length > 0 ||
//     selectedStatuses.length > 0
//   const columns: PaginatedTableColumn<Role>[] = [
//     { key: 'roleName', label: 'Role Name' },
//     {
//       key: 'id',
//       label: 'Assignment',
//       render: (_, row) => <AssignmentCell row={row} />,
//     },
//     {
//       key: 'id',
//       label: 'Role Type',
//       render: (_, row) => <RoleBadge role={getRoleType(row)} />,
//     },
//     {
//       key: 'createdTime',
//       label: 'Created Time',
//       render: (value) => (value ? <DateTimeCell value={value} /> : null),
//     },
//     {
//       key: 'isActive',
//       label: 'Status',
//       render: (value) => (
//         <BadgeCell
//           value={value ? 'Active' : 'Inactive'}
//           variant={value ? 'default' : 'destructive'}
//         />
//       ),
//     },
//   ]
//   return (
//     <>
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}
//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Roles
//           </h1>
//           {canCreate && (
//             <Button asChild>
//               <Link to='/admin/roles/create'>Create</Link>
//             </Button>
//           )}
//         </div>
//         {/* Filter Controls */}
//         {/* Display Selected Filters */}
//         <div className='mb-4 flex flex-wrap gap-2'>
//           {selectedDepartments.map((dept) => (
//             <Badge key={dept} variant='secondary'>
//               Department: {dept}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedDepartments((prev) =>
//                     prev.filter((d) => d !== dept)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedBranches.map((branch) => (
//             <Badge key={branch} variant='secondary'>
//               Branch: {branch}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedBranches((prev) =>
//                     prev.filter((b) => b !== branch)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedStatuses.map((status) => (
//             <Badge key={status} variant='secondary'>
//               Status: {status}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedStatuses((prev) =>
//                     prev.filter((s) => s !== status)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {isFiltered && (
//             <Button
//               variant='outline'
//               size='sm'
//               onClick={() => {
//                 setSelectedDepartments([])
//                 setSelectedBranches([])
//                 setSelectedStatuses([])
//               }}
//             >
//               Clear All Filters
//             </Button>
//           )}
//         </div>
//         {filteredRoles.length ? (
//           <div>
//             <PaginatedTable
//               data={filteredRoles}
//               columns={columns}
//               tableActions={
//                 <div className='flex space-x-4'>
//                   <FilterPopover
//                     options={distinctDepartments}
//                     selected={selectedDepartments}
//                     onChange={setSelectedDepartments}
//                     placeholder='Filter by Department'
//                   />
//                   <FilterPopover
//                     options={distinctBranches}
//                     selected={selectedBranches}
//                     onChange={setSelectedBranches}
//                     placeholder='Filter by Branch'
//                   />
//                   <FilterPopover
//                     options={distinctStatuses}
//                     selected={selectedStatuses}
//                     onChange={setSelectedStatuses}
//                     placeholder='Filter by Status'
//                   />
//                 </div>
//               }
//               renderActions={(row) => (
//                 <div className='flex items-center justify-end gap-2'>
//                   {canUpdate && (
//                     <EditActionCell
//                       onClick={() => {
//                         navigate({
//                           to: '/admin/roles/$roleId/edit',
//                           params: { roleId: row.id ?? '' },
//                         })
//                       }}
//                     />
//                   )}
//                   <DeleteActionCell
//                     title={`Delete “${row.roleName}”?`}
//                     description='Delete'
//                     onConfirm={() => row.id && handleDelete(row.id)}
//                     isConfirming={deleteRoleMutation.isPending}
//                   />
//                 </div>
//               )}
//               emptyMessage={
//                 isFiltered
//                   ? 'No roles match the selected filters.'
//                   : 'No roles to display at the moment.'
//               }
//             />
//           </div>
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 {isFiltered
//                   ? 'No roles match the selected filters.'
//                   : 'No Roles Found'}
//               </h3>
//               {!isFiltered && (
//                 <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                   Get started by creating a new role.
//                 </p>
//               )}
//             </div>
//           )
//         )}
//       </>
//     </>
//   )
// }
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, createLazyFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button'
import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'
import {
  AssignmentCell,
  RoleBadge,
  DateTimeCell,
  BadgeCell,
  DeleteActionCell,
  EditActionCell,
} from '@/components/table/cells.ts'

export const Route = createLazyFileRoute('/_authenticated/admin/roles/')({
  component: RolesPage,
})

type Role = components['schemas']['Role']

function getRoleType(role: Role): string {
  if (role.isSuperAdmin) return 'Super Admin'
  if (role.isAdmin) return 'Admin'
  if (role.isAuditor) return 'Auditor'
  if (role.isStockAuditor) return 'Stock Auditor'
  if (role.isAdvocate) return 'Advocate'
  if (role.isValuer) return 'Valuer'
  if (role.parentBranchId) return 'Branch'
  if (role.parentDepartmentId) return 'Department'
  return 'Unknown'
}

/* =============================
   Export helpers (strictly typed)
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

function toTitleCase(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

function buildRowsAndHeaders<T extends Record<string, unknown>>(
  rows: readonly T[]
): { headers: string[]; headerLabels: string[]; matrix: string[][] } {
  const keySet = new Set<string>()
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => keySet.add(k))
  })
  const headers = Array.from(keySet)

  // Put "id" first if present
  const idIdx = headers.indexOf('id')
  if (idIdx > 0) {
    headers.splice(idIdx, 1)
    headers.unshift('id')
  }

  const headerLabels = headers.map(toTitleCase)

  const matrix: string[][] = rows.map((row) =>
    headers.map((h) => {
      const val = row[h as keyof T]
      if (val == null) return ''
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }
      return String(val)
    })
  )

  return { headers, headerLabels, matrix }
}

function exportCSV<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'roles.csv'
) {
  const { headerLabels, matrix } = buildRowsAndHeaders(rows)
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

  const lines = [
    headerLabels.map(escape).join(','),
    ...matrix.map((r) => r.map(escape).join(',')),
  ]
  const csv = '\uFEFF' + lines.join('\n')
  fileDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

async function exportExcel<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename = 'roles.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)

    // xlsx expects a mutable array
    const mutableRows: T[] = Array.from(rows)

    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Roles')
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    fileDownload(
      new Blob([wbout], { type: 'application/octet-stream' }),
      filename
    )
  } catch {
    // Fallback to CSV if xlsx isn't available
    exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
  }
}
/* ============================= */

function RolesPage() {
  const canCreate = useCanAccess('roles', 'create')
  const canUpdate = useCanAccess('roles', 'update')

  const navigate = useNavigate()

  const {
    data: rolesData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/roles/getAllRoles', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
      },
    },
  })

  const deleteRoleMutation = $api.useMutation(
    'delete',
    '/roles/delete/{roleId}'
  )

  const handleDelete = (roleId: string) => {
    deleteRoleMutation.mutate(
      {
        params: {
          path: { roleId },
        },
      },
      {
        onSuccess: () => {
          toast.success('Role deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete role'),
      }
    )
  }

  // State for selected filters
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Compute distinct departments, branches, and statuses
  const distinctDepartments = useMemo(() => {
    const departments =
      rolesData?.data
        ?.map((role: Role) => role.departmentName)
        .filter(Boolean) || []
    return [...new Set(departments)].filter((x) => x !== undefined).sort()
  }, [rolesData])

  const distinctBranches = useMemo(() => {
    const branches =
      rolesData?.data?.map((role: Role) => role.branchName).filter(Boolean) ||
      []
    return [...new Set(branches)].filter((x) => x !== undefined).sort()
  }, [rolesData])

  const distinctStatuses = ['Active', 'Inactive']

  // Filter roles based on selected filters
  const filteredRoles = useMemo<Role[]>(() => {
    return (
      rolesData?.data?.filter((role: Role) => {
        const departmentMatch =
          selectedDepartments.length === 0 ||
          (role.departmentName &&
            selectedDepartments.includes(role.departmentName))
        const branchMatch =
          selectedBranches.length === 0 ||
          (role.branchName && selectedBranches.includes(role.branchName))
        const statusMatch =
          selectedStatuses.length === 0 ||
          (selectedStatuses.includes('Active') && role.isActive) ||
          (selectedStatuses.includes('Inactive') && !role.isActive)
        return departmentMatch && branchMatch && statusMatch
      }) || []
    )
  }, [rolesData, selectedDepartments, selectedBranches, selectedStatuses])

  // Remove invalid selected filters when distinct lists change
  useEffect(() => {
    setSelectedDepartments((prev) =>
      prev.filter((dept) => distinctDepartments.includes(dept))
    )
  }, [distinctDepartments])

  useEffect(() => {
    setSelectedBranches((prev) =>
      prev.filter((branch) => distinctBranches.includes(branch))
    )
  }, [distinctBranches])

  const isFiltered =
    selectedDepartments.length > 0 ||
    selectedBranches.length > 0 ||
    selectedStatuses.length > 0

  // Export handlers: export exactly what's visible
  const handleExportCSV = () => {
    if (!filteredRoles.length) {
      toast.info('No data to export.')
      return
    }
    exportCSV<Role>(filteredRoles, 'roles.csv')
  }

  const handleExportExcel = async () => {
    if (!filteredRoles.length) {
      toast.info('No data to export.')
      return
    }
    await exportExcel<Role>(filteredRoles, 'roles.xlsx')
  }

  const columns: PaginatedTableColumn<Role>[] = [
    { key: 'roleName', label: 'Role Name' },
    {
      key: 'id',
      label: 'Assignment',
      render: (_, row) => <AssignmentCell row={row} />,
    },
    {
      key: 'id',
      label: 'Role Type',
      render: (_, row) => <RoleBadge role={getRoleType(row)} />,
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      render: (value) => (value ? <DateTimeCell value={value} /> : null),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <BadgeCell
          value={value ? 'Active' : 'Inactive'}
          variant={value ? 'default' : 'destructive'}
        />
      ),
    },
  ]

  return (
    <>
      <>
        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}

        <div className='mb-2 flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
            Roles
          </h1>
          {canCreate && (
            <Button asChild>
              <Link to='/admin/roles/create'>Create</Link>
            </Button>
          )}
        </div>

        {/* Display Selected Filters */}
        <div className='mb-4 flex flex-wrap gap-2'>
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
                  setSelectedStatuses((prev) =>
                    prev.filter((s) => s !== status)
                  )
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
                setSelectedDepartments([])
                setSelectedBranches([])
                setSelectedStatuses([])
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>

        {filteredRoles.length ? (
          <div>
            <PaginatedTable
              data={filteredRoles}
              columns={columns}
              tableActions={
                <div className='flex flex-wrap items-center gap-2'>
                  <FilterPopover
                    options={distinctDepartments}
                    selected={selectedDepartments}
                    onChange={setSelectedDepartments}
                    placeholder='Filter by Department'
                  />
                  <FilterPopover
                    options={distinctBranches}
                    selected={selectedBranches}
                    onChange={setSelectedBranches}
                    placeholder='Filter by Branch'
                  />
                  <FilterPopover
                    options={distinctStatuses}
                    selected={selectedStatuses}
                    onChange={setSelectedStatuses}
                    placeholder='Filter by Status'
                  />
                  {/* NEW: Export buttons */}
                  <div className='ml-auto flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleExportExcel}
                    >
                      Export Excel
                    </Button>
                  </div>
                </div>
              }
              renderActions={(row) => (
                <div className='flex items-center justify-end gap-2'>
                  {canUpdate && (
                    <EditActionCell
                      onClick={() => {
                        navigate({
                          to: '/admin/roles/$roleId/edit',
                          params: { roleId: row.id ?? '' },
                        })
                      }}
                    />
                  )}
                  <DeleteActionCell
                    title={`Delete “${row.roleName}”?`}
                    description='Delete'
                    onConfirm={() => row.id && handleDelete(row.id)}
                    isConfirming={deleteRoleMutation.isPending}
                  />
                </div>
              )}
              emptyMessage={
                isFiltered
                  ? 'No roles match the selected filters.'
                  : 'No roles to display at the moment.'
              }
            />
          </div>
        ) : (
          !isLoading && (
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
              <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
                {isFiltered
                  ? 'No roles match the selected filters.'
                  : 'No Roles Found'}
              </h3>
              {!isFiltered && (
                <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                  Get started by creating a new role.
                </p>
              )}
            </div>
          )
        )}
      </>
    </>
  )
}
