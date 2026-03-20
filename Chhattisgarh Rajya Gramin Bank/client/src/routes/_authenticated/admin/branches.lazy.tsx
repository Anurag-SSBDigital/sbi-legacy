// import { useEffect, useMemo, useState } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createLazyFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
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
// import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
// import PaginatedTable from '@/components/paginated-table.tsx'
// import {
//   DeleteActionCell,
//   EditActionCell,
//   ViewActionCell,
// } from '@/components/table/cells.ts'
// export const Route = createLazyFileRoute('/_authenticated/admin/branches')({
//   component: RouteComponent,
// })
// type ParentDepartmentOption = { id: string; name: string }
// type ParentDepartmentsResponse = {
//   status?: string
//   message?: string
//   data?: ParentDepartmentOption[]
// }
// type NewBranchForm = {
//   id?: string
//   branchName: string
//   branchCode: string
//   district: string
//   state: string
//   city: string
//   parentDepartmentId: string
// }
// function ViewBranchDialog({
//   open,
//   onOpenChange,
//   branch,
// }: {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   branch: NewBranchForm
// }) {
//   if (!branch) return null
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='max-w-xl'>
//         <DialogHeader>
//           <DialogTitle>Branch Details</DialogTitle>
//           <DialogDescription>Full branch information</DialogDescription>
//         </DialogHeader>
//         <div className='grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300'>
//           <div>
//             <p className='font-medium'>Name</p>
//             <p>{branch.branchName}</p>
//           </div>
//           <div>
//             <p className='font-medium'>Code</p>
//             <p>{branch.branchCode}</p>
//           </div>
//           <div>
//             <p className='font-medium'>City</p>
//             <p>{branch.city}</p>
//           </div>
//           <div>
//             <p className='font-medium'>District</p>
//             <p>{branch.district}</p>
//           </div>
//           <div>
//             <p className='font-medium'>State</p>
//             <p>{branch.state}</p>
//           </div>
//           <div className='col-span-2'>
//             <p className='font-medium'>Parent Department</p>
//             <p>
//               {(branch as unknown as { departmentName: string })
//                 .departmentName || '—'}
//             </p>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
// function RouteComponent() {
//   const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
//   const [editingBranch, setEditingBranch] = useState<NewBranchForm | null>(null)
//   const [viewDialogOpen, setViewDialogOpen] = useState(false)
//   const [viewBranch, setViewBranch] = useState<NewBranchForm | null>(null)
//   const canCreate = useCanAccess('branches', 'create')
//   const {
//     data: branchesData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/branches/get', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//       },
//     },
//   }) as {
//     data: {
//       data?: (NewBranchForm & { departmentName: string })[]
//       message?: string
//     }
//     isLoading: boolean
//     refetch: () => void
//   }
//   const deleteBranchMutation = $api.useMutation(
//     'delete',
//     '/branches/delete/{branchId}'
//   )
//   const handleDelete = (branchId: string) => {
//     deleteBranchMutation.mutate(
//       {
//         params: {
//           path: { branchId },
//         },
//       },
//       {
//         onSuccess: () => {
//           toast.success('Branch deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete branch'),
//       }
//     )
//   }
//   // Compute distinct parent departments and states
//   const distinctParentDepartments = useMemo(() => {
//     const departments =
//       branchesData?.data
//         ?.map((branch) => branch.departmentName)
//         .filter(Boolean) || []
//     return [...new Set(departments)].sort()
//   }, [branchesData])
//   const distinctCities = useMemo(() => {
//     const cities =
//       branchesData?.data?.map((branch) => branch.city).filter(Boolean) || []
//     return [...new Set(cities)].sort()
//   }, [branchesData])
//   // State for selected filters
//   const [selectedParentDepartments, setSelectedParentDepartments] = useState<
//     string[]
//   >([])
//   const [selectedCities, setSelectedCities] = useState<string[]>([])
//   // Filter branches based on selected filters
//   const filteredBranches = useMemo(() => {
//     return (
//       branchesData?.data?.filter((branch) => {
//         const departmentMatch =
//           selectedParentDepartments.length === 0 ||
//           (branch.departmentName &&
//             selectedParentDepartments.includes(branch.departmentName))
//         const stateMatch =
//           selectedCities.length === 0 ||
//           (branch.city && selectedCities.includes(branch.city))
//         return departmentMatch && stateMatch
//       }) || []
//     )
//   }, [branchesData, selectedParentDepartments, selectedCities])
//   // Check if any filters are applied
//   const isFiltered =
//     selectedParentDepartments.length > 0 || selectedCities.length > 0
//   // Remove invalid selected filters when options change
//   useEffect(() => {
//     setSelectedParentDepartments((prev) =>
//       prev.filter((dept) => distinctParentDepartments.includes(dept))
//     )
//   }, [distinctParentDepartments])
//   useEffect(() => {
//     setSelectedCities((prev) =>
//       prev.filter((state) => distinctCities.includes(state))
//     )
//   }, [distinctCities])
//   return (
//     <>
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}
//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Branches
//           </h1>
//           {canCreate && (
//             <CreateBranchForm
//               open={isCreateDialogOpen}
//               onOpenChange={(open) => {
//                 if (!open) setEditingBranch(null)
//                 setCreateDialogOpen(open)
//               }}
//               onSuccess={() => {
//                 setCreateDialogOpen(false)
//                 setEditingBranch(null)
//                 refetch()
//               }}
//               defaultValues={editingBranch || undefined}
//             />
//           )}
//         </div>
//         {/* Display Selected Filters */}
//         <div className='mb-4 flex flex-wrap gap-2'>
//           {selectedParentDepartments.map((dept) => (
//             <Badge key={dept} variant='secondary'>
//               Department: {dept}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedParentDepartments((prev) =>
//                     prev.filter((d) => d !== dept)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedCities.map((city) => (
//             <Badge key={city} variant='secondary'>
//               State: {city}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedCities((prev) => prev.filter((s) => s !== city))
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
//                 setSelectedParentDepartments([])
//                 setSelectedCities([])
//               }}
//             >
//               Clear All Filters
//             </Button>
//           )}
//         </div>
//         {filteredBranches.length ? (
//           <PaginatedTable
//             data={filteredBranches}
//             renderActions={(row) => (
//               <div className='flex items-center justify-end'>
//                 <div className='mr-2'>
//                   <ViewActionCell
//                     onClick={() => {
//                       setViewBranch(row)
//                       setViewDialogOpen(true)
//                     }}
//                   />
//                 </div>
//                 <div className='mr-2'>
//                   <EditActionCell
//                     onClick={() => {
//                       setEditingBranch(row)
//                       setCreateDialogOpen(true)
//                     }}
//                   />
//                 </div>
//                 <DeleteActionCell
//                   title={`Delete “${row.branchName}”?`}
//                   onConfirm={() => row.id && handleDelete(row.id)}
//                   isConfirming={deleteBranchMutation.isPending}
//                 />
//               </div>
//             )}
//             columns={[
//               { key: 'branchName', label: 'Name' },
//               { key: 'branchCode', label: 'Code' },
//               { key: 'departmentName', label: 'Parent Department' },
//               {
//                 key: 'city',
//                 label: 'City',
//               },
//             ]}
//             tableActions={
//               <div className='flex space-x-4'>
//                 <FilterPopover
//                   options={distinctParentDepartments}
//                   selected={selectedParentDepartments}
//                   onChange={setSelectedParentDepartments}
//                   placeholder='Filter by Parent Department'
//                 />
//                 <FilterPopover
//                   options={distinctCities}
//                   selected={selectedCities}
//                   onChange={setSelectedCities}
//                   placeholder='Filter by City'
//                 />
//               </div>
//             }
//             emptyMessage={
//               isFiltered
//                 ? 'No branches match the selected filters.'
//                 : 'No branches to display at the moment.'
//             }
//           />
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 {isFiltered
//                   ? 'No branches match the selected filters.'
//                   : 'No Branches Found'}
//               </h3>
//               {!isFiltered && (
//                 <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                   Get started by creating a new branch.
//                 </p>
//               )}
//             </div>
//           )
//         )}
//       </>
//       {viewBranch && (
//         <ViewBranchDialog
//           open={viewDialogOpen}
//           onOpenChange={setViewDialogOpen}
//           branch={viewBranch}
//         />
//       )}
//     </>
//   )
// }
// interface CreateBranchFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: () => void
//   defaultValues?: Partial<NewBranchForm>
// }
// function CreateBranchForm({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: CreateBranchFormProps) {
//   const {
//     data: parentDepartmentsResponse,
//     isLoading: parentDepartmentsLoading,
//   } = $api.useQuery('get', '/departments/get/dropdown', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//       },
//     },
//   }) as { data: ParentDepartmentsResponse | undefined; isLoading: boolean }
//   const createBranchMutation = $api.useMutation('post', '/branches/create')
//   const updateBranchMutation = $api.useMutation(
//     'put',
//     '/branches/update/{branchId}'
//   )
//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<NewBranchForm>({ defaultValues })
//   useEffect(() => {
//     if (open && defaultValues) {
//       reset(defaultValues)
//     } else if (!open) {
//       reset({
//         branchName: '',
//         branchCode: '',
//         district: '',
//         state: '',
//         city: '',
//         parentDepartmentId: '',
//       })
//     }
//   }, [open, defaultValues, reset])
//   const onSubmit = handleSubmit((values) => {
//     const token = sessionStorage.getItem('token') || ''
//     const payload = {
//       ...values,
//     }
//     if (values.id) {
//       updateBranchMutation.mutate(
//         {
//           body: payload,
//           params: {
//             path: { branchId: values.id },
//             header: { Authorization: `Bearer ${token}` },
//           },
//         },
//         {
//           onSuccess: () => {
//             toast.success('Branch updated successfully')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Failed to update branch'),
//         }
//       )
//     } else {
//       createBranchMutation.mutate(
//         {
//           body: payload,
//           params: { header: { Authorization: `Bearer ${token}` } },
//         },
//         {
//           onSuccess: (res) => {
//             toast.success(res?.message || 'Branch created!')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Creation failed'),
//         }
//       )
//     }
//   })
//   const inputFields: Array<[keyof NewBranchForm, string, string?]> = [
//     ['branchName', 'Branch Name *', ''],
//     ['branchCode', 'Branch Code *', '001'],
//     ['district', 'District *', 'e.g., Ahmedabad'],
//     ['state', 'State *', 'e.g., Gujarat'],
//     ['city', 'City *', 'e.g., Dholka'],
//   ]
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogTrigger asChild>
//         <Button size='sm' className='text-white'>
//           New Branch
//         </Button>
//       </DialogTrigger>
//       <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
//         <DialogHeader className='p-6 pb-4'>
//           <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
//             {defaultValues?.id ? 'Edit Branch' : 'Create New Branch'}
//           </DialogTitle>
//           <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
//             Fill in the details below. Fields marked with * are mandatory.
//           </DialogDescription>
//         </DialogHeader>
//         <form
//           id='create-branch-form'
//           onSubmit={onSubmit}
//           className='space-y-5 px-6 pt-2 pb-2'
//         >
//           {inputFields.map(([name, label, placeholder]) => (
//             <div key={name} className='grid gap-1.5'>
//               <Label htmlFor={name} className='font-medium'>
//                 {label}
//               </Label>
//               <Input
//                 id={name}
//                 placeholder={placeholder || `Enter ${label}`}
//                 {...register(name, {
//                   required: `${label.replace(` *`, ``)} is required.`,
//                 })}
//                 className={`dark:border-gray-600 dark:bg-gray-700 ${
//                   errors[name] ? 'border-red-500' : ''
//                 }`}
//               />
//               {errors[name] && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {errors[name]?.message}
//                 </p>
//               )}
//             </div>
//           ))}
//           <div className='grid gap-1.5'>
//             <Label htmlFor='parentDepartmentId'>Parent Department *</Label>
//             <Controller
//               name='parentDepartmentId'
//               control={control}
//               rules={{ required: 'Parent Department is required.' }}
//               render={({ field }) => (
//                 <Select
//                   disabled={parentDepartmentsLoading}
//                   onValueChange={field.onChange}
//                   value={field.value ?? ''} // keeps it controlled
//                 >
//                   <SelectTrigger
//                     id='parentDepartmentId'
//                     aria-invalid={!!errors.parentDepartmentId}
//                     className={
//                       errors.parentDepartmentId ? 'border-red-500' : ''
//                     }
//                   >
//                     <SelectValue placeholder='Select parent department' />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {parentDepartmentsResponse?.data?.map(({ id, name }) => (
//                       <SelectItem key={id} value={id}>
//                         {name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//             {errors.parentDepartmentId && (
//               <p className='pt-1 text-sm text-red-500'>
//                 {errors.parentDepartmentId.message as string}
//               </p>
//             )}
//           </div>
//         </form>
//         <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
//           <Button
//             type='button'
//             variant='outline'
//             onClick={() => onOpenChange(false)}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button
//             type='submit'
//             form='create-branch-form'
//             disabled={isSubmitting}
//             className='text-white'
//           >
//             {defaultValues?.id ? 'Update' : 'Save Branch'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }





















import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createLazyFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { Badge } from '@/components/ui/badge.tsx'
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
} from '@/components/ui/select.tsx'
import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  DeleteActionCell,
  EditActionCell,
  ViewActionCell,
} from '@/components/table/cells.ts'
import { useCanAccess } from '@/components/hooks/use-can-access'

export const Route = createLazyFileRoute('/_authenticated/admin/branches')({
  component: RouteComponent,
})

type ParentDepartmentOption = {
  id: string
  name: string
  code?: string
  departmentCode?: string
}

type ParentDepartmentsResponse = {
  status?: string
  message?: string
  data?: ParentDepartmentOption[]
}

const formatDropdownLabel = (option: ParentDepartmentOption) => {
  const code = option.code ?? option.departmentCode
  return code ? `${option.name} (${code})` : option.name
}

type NewBranchForm = {
  id?: string
  branchName: string
  branchCode: string
  district: string
  state: string
  city: string
  parentDepartmentId: string
}

type BranchRow = NewBranchForm & { departmentName?: string }

/* =============================
   Download helpers
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

function exportCSVFromObjects<T extends Record<string, unknown>>(
  rows: readonly T[],
  filename: string
) {
  const keys = Array.from(
    rows.reduce<Set<string>>((s, r) => {
      Object.keys(r).forEach((k) => s.add(k))
      return s
    }, new Set<string>())
  )

  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

  const lines = [
    keys.map(escape).join(','),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const val = r[k]
          if (val == null) return ''
          if (typeof val === 'object') {
            try {
              return escape(JSON.stringify(val))
            } catch {
              return escape(String(val))
            }
          }
          return escape(String(val))
        })
        .join(',')
    ),
  ]

  const csv = '\uFEFF' + lines.join('\n')
  fileDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

/* =============================
   Bulk upload types + parsing
============================= */
type BranchUploadRow = {
  branchName: string
  branchCode: string
  district: string
  state: string
  city: string
  parentDepartmentId: string
}

type UploadFailure = {
  rowNumber: number
  reason: string
  row: Partial<BranchUploadRow>
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, '').toLowerCase()
}

function pickString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v).trim()
}

function validateUploadRow(row: Partial<BranchUploadRow>): string | null {
  if (!row.branchName) return 'branchName is required'
  if (!row.branchCode) return 'branchCode is required'
  if (!row.district) return 'district is required'
  if (!row.state) return 'state is required'
  if (!row.city) return 'city is required'
  if (!row.parentDepartmentId) return 'parentDepartmentId is required'
  return null
}

async function readXlsxOrCsv(file: File): Promise<Partial<BranchUploadRow>[]> {
  const name = file.name.toLowerCase()

  // CSV
  if (name.endsWith('.csv')) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map((h) => normalizeHeader(h))
    const rows: Partial<BranchUploadRow>[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      const rec: Record<string, string> = {}
      headers.forEach((h, idx) => {
        rec[h] = cols[idx] ?? ''
      })

      rows.push({
        branchName: rec['branchname'] ?? '',
        branchCode: rec['branchcode'] ?? '',
        district: rec['district'] ?? '',
        state: rec['state'] ?? '',
        city: rec['city'] ?? '',
        parentDepartmentId: rec['parentdepartmentid'] ?? '',
      })
    }

    return rows
  }

  // XLSX
  const XLSX: typeof import('xlsx') = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const wsName = wb.SheetNames[0]
  const ws = wb.Sheets[wsName]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
  })

  return json.map((r) => {
    const mapped: Partial<BranchUploadRow> = {}

    for (const [k, v] of Object.entries(r)) {
      const nk = normalizeHeader(k)
      const val = pickString(v)

      if (nk === 'branchname') mapped.branchName = val
      else if (nk === 'branchcode') mapped.branchCode = val
      else if (nk === 'district') mapped.district = val
      else if (nk === 'state') mapped.state = val
      else if (nk === 'city') mapped.city = val
      else if (nk === 'parentdepartmentid') mapped.parentDepartmentId = val
    }

    return mapped
  })
}

async function downloadDemoBranchesExcel(): Promise<void> {
  const XLSX: typeof import('xlsx') = await import('xlsx')

  const demo: BranchUploadRow[] = [
    {
      branchName: 'Yogi Chowk',
      branchCode: '012',
      district: 'SURAT',
      state: 'GUJARAT',
      city: 'SURAT',
      parentDepartmentId: 'DEPT-cb7c6e19-bd11-4291-9be8-e96aa2c98af4',
    },
    {
      branchName: 'Utran',
      branchCode: '028',
      district: 'SURAT',
      state: 'GUJARAT',
      city: 'SURAT',
      parentDepartmentId: 'DEPT-cb7c6e19-bd11-4291-9be8-e96aa2c98af4',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(demo, {
    header: [
      'branchName',
      'branchCode',
      'district',
      'state',
      'city',
      'parentDepartmentId',
    ],
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Branches')

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  fileDownload(
    new Blob([out], { type: 'application/octet-stream' }),
    'branches_bulk_upload_template.xlsx'
  )
}

/* =============================
   Bulk upload dialog (UI like departments)
============================= */
function BulkBranchUploadDialog({
  canOpen,
  token,
  onDone,
}: {
  canOpen: boolean
  token: string
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<BranchUploadRow[]>([])
  const [failures, setFailures] = useState<UploadFailure[]>([])
  const [isParsing, setIsParsing] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [sent, setSent] = useState(0)
  const [success, setSuccess] = useState(0)
  const [failed, setFailed] = useState(0)

  const createBranchMutation = $api.useMutation('post', '/branches/create')

  const total = rows.length
  const progressPct = total === 0 ? 0 : Math.round((sent / total) * 100)

  const resetAll = () => {
    setFile(null)
    setRows([])
    setFailures([])
    setIsParsing(false)
    setIsUploading(false)
    setSent(0)
    setSuccess(0)
    setFailed(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onPickFile = async (f: File) => {
    setFile(f)
    setIsParsing(true)
    setRows([])
    setFailures([])
    setSent(0)
    setSuccess(0)
    setFailed(0)

    try {
      const raw = await readXlsxOrCsv(f)

      const valid: BranchUploadRow[] = []
      const bad: UploadFailure[] = []

      raw.forEach((r, idx) => {
        const candidate: Partial<BranchUploadRow> = {
          branchName: (r.branchName ?? '').trim(),
          branchCode: (r.branchCode ?? '').trim(),
          district: (r.district ?? '').trim(),
          state: (r.state ?? '').trim(),
          city: (r.city ?? '').trim(),
          parentDepartmentId: (r.parentDepartmentId ?? '').trim(),
        }
        const err = validateUploadRow(candidate)
        if (err) {
          bad.push({ rowNumber: idx + 2, reason: err, row: candidate })
        } else {
          valid.push(candidate as BranchUploadRow)
        }
      })

      setRows(valid)
      setFailures(bad)

      if (valid.length === 0) toast.error('No valid rows found in file')
      else toast.success(`Loaded ${valid.length} rows`)
      if (bad.length > 0) toast.warning(`${bad.length} rows have issues`)
    } catch {
      toast.error('Failed to parse file')
    } finally {
      setIsParsing(false)
    }
  }

  const exportFailuresCsv = () => {
    if (failures.length === 0) return
    exportCSVFromObjects(
      failures.map((f) => ({
        rowNumber: f.rowNumber,
        reason: f.reason,
        ...f.row,
      })),
      'branches_upload_failures.csv'
    )
  }

  const startUpload = async () => {
    if (rows.length === 0) {
      toast.info('No valid rows to upload.')
      return
    }
    if (!token) {
      toast.error('Token missing')
      return
    }

    setIsUploading(true)
    setSent(0)
    setSuccess(0)
    setFailed(0)

    const nextFailures: UploadFailure[] = [...failures]

    for (let i = 0; i < rows.length; i++) {
      const payload = rows[i]

      try {
         
        await new Promise<void>((resolve, reject) => {
          createBranchMutation.mutate(
            {
              body: payload,
              params: { header: { Authorization: `Bearer ${token}` } },
            },
            {
              onSuccess: () => resolve(),
              onError: () => reject(new Error('create failed')),
            }
          )
        })
        setSuccess((p) => p + 1)
      } catch {
        setFailed((p) => p + 1)
        nextFailures.push({
          rowNumber: i + 2,
          reason: 'API failed',
          row: payload,
        })
      } finally {
        setSent((p) => p + 1)
      }
    }

    setFailures(nextFailures)
    setIsUploading(false)

    toast.success('Bulk upload finished')
    onDone()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={!canOpen}
          title={!canOpen ? 'No access' : 'Upload branches in bulk'}
        >
          Bulk Upload
        </Button>
      </DialogTrigger>

      {/* <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Bulk Upload Branches</DialogTitle>
          <DialogDescription>
            Upload Excel/CSV with headers:
            <span className='ml-2 font-mono text-xs'>
              branchName, branchCode, district, state, city, parentDepartmentId
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void downloadDemoBranchesExcel()}
          >
            Download Demo Excel
          </Button>

          <input
            ref={inputRef}
            type='file'
            accept='.xlsx,.csv'
            className='hidden'
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPickFile(f)
            }}
          />

          <Button
            type='button'
            size='sm'
            className='text-white'
            onClick={() => inputRef.current?.click()}
          >
            Choose File
          </Button>

          {file?.name ? (
            <span className='rounded-full border px-3 py-1 text-xs text-[var(--color-muted-foreground)]'>
              {file.name}
            </span>
          ) : (
            <span className='text-xs text-[var(--color-muted-foreground)]'>
              No file selected
            </span>
          )}
        </div>

        <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
            <div className='text-[11px] text-[var(--color-muted-foreground)]'>
              Valid Rows
            </div>
            <div className='text-xl font-semibold'>{rows.length}</div>
          </div>
          <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
            <div className='text-[11px] text-[var(--color-muted-foreground)]'>
              Invalid Rows
            </div>
            <div className='text-xl font-semibold'>{failures.length}</div>
          </div>
          <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
            <div className='text-[11px] text-[var(--color-muted-foreground)]'>
              Uploaded
            </div>
            <div className='text-xl font-semibold'>{sent}</div>
          </div>
          <div className='rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
            <div className='text-[11px] text-[var(--color-muted-foreground)]'>
              Success / Failed
            </div>
            <div className='text-xl font-semibold'>
              {success} / {failed}
            </div>
          </div>
        </div>

        <div className='mt-4 space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-[var(--color-muted-foreground)]'>
              Progress
            </span>
            <span className='font-mono'>
              {sent}/{total} ({progressPct}%)
            </span>
          </div>

          <div className='h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800'>
            <div
              className='h-full rounded-full'
              style={{
                width: `${progressPct}%`,
                background:
                  'linear-gradient(90deg,var(--color-primary),var(--color-chart-2))',
                transition: 'width 200ms linear',
              }}
            />
          </div>

          {(isParsing || isUploading) && (
            <div className='text-xs text-[var(--color-muted-foreground)]'>
              {isParsing ? 'Parsing file…' : 'Uploading…'}
            </div>
          )}
        </div>

        {failures.length > 0 && (
          <div className='mt-5 rounded-xl border bg-[var(--color-card)] p-3 shadow-sm'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='text-sm font-semibold'>
                Invalid / Failed Rows ({failures.length})
              </div>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={exportFailuresCsv}
              >
                Export Failures CSV
              </Button>
            </div>

            <div className='max-h-44 overflow-auto text-xs'>
              <table className='w-full'>
                <thead className='text-left'>
                  <tr className='border-b'>
                    <th className='py-1 pr-2'>Row</th>
                    <th className='py-1 pr-2'>Reason</th>
                    <th className='py-1 pr-2'>branchName</th>
                    <th className='py-1 pr-2'>branchCode</th>
                    <th className='py-1 pr-2'>parentDepartmentId</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.slice(0, 20).map((f) => (
                    <tr
                      key={`${f.rowNumber}-${f.reason}`}
                      className='border-b last:border-0'
                    >
                      <td className='py-1 pr-2 font-mono'>{f.rowNumber}</td>
                      <td className='py-1 pr-2'>{f.reason}</td>
                      <td className='py-1 pr-2'>{f.row.branchName ?? ''}</td>
                      <td className='py-1 pr-2'>{f.row.branchCode ?? ''}</td>
                      <td className='py-1 pr-2 font-mono'>
                        {f.row.parentDepartmentId ?? ''}
                      </td>
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

        <DialogFooter className='mt-6'>
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
      </DialogContent> */}

      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl'>
        <DialogHeader className='border-b p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold'>Bulk Upload Branches</DialogTitle>
          <DialogDescription className='mt-1 text-sm text-[var(--color-muted-foreground)]'>
            Upload Excel/CSV with headers:
            <span className='ml-2 rounded-md border bg-[var(--color-card)] px-2 py-0.5 font-mono text-[10px]'>
              branchName, branchCode, district, state, city, parentDepartmentId
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 p-6 pt-4'>
          {/* Actions row */}
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => void downloadDemoBranchesExcel()}
            >
              Download Demo Excel
            </Button>

            <input
              ref={inputRef}
              type='file'
              accept='.xlsx,.xls,.csv'
              className='hidden'
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onPickFile(f)
                // allow re-selecting same file
                e.currentTarget.value = ''
              }}
            />

            <Button
              type='button'
              size='sm'
              className='text-white'
              onClick={() => inputRef.current?.click()}
            >
              Choose File
            </Button>

            {file?.name ? (
              <span className='rounded-full border bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]'>
                {file.name}
              </span>
            ) : (
              <span className='text-xs text-[var(--color-muted-foreground)]'>
                No file selected
              </span>
            )}
          </div>

          {/* Stats tiles */}
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
                  background:
                    'linear-gradient(90deg,var(--color-primary),var(--color-chart-2))',
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

          {/* Invalid / Failed preview */}
          {failures.length > 0 && (
            <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='text-sm font-semibold'>
                  Invalid / Failed Rows ({failures.length})
                </div>
                <Button type='button' size='sm' variant='outline' onClick={exportFailuresCsv}>
                  Export Failures CSV
                </Button>
              </div>

              <div className='max-h-56 overflow-auto text-xs'>
                <table className='w-full'>
                  <thead className='text-left'>
                    <tr className='border-b'>
                      <th className='py-2 pr-2'>Row</th>
                      <th className='py-2 pr-2'>Reason</th>
                      <th className='py-2 pr-2'>branchName</th>
                      <th className='py-2 pr-2'>branchCode</th>
                      <th className='py-2 pr-2'>parentDepartmentId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failures.slice(0, 20).map((f) => (
                      <tr key={`${f.rowNumber}-${f.reason}`} className='border-b last:border-0'>
                        <td className='py-2 pr-2 font-mono'>{f.rowNumber}</td>
                        <td className='py-2 pr-2'>{f.reason}</td>
                        <td className='py-2 pr-2'>{f.row.branchName ?? ''}</td>
                        <td className='py-2 pr-2'>{f.row.branchCode ?? ''}</td>
                        <td className='py-2 pr-2 font-mono'>{f.row.parentDepartmentId ?? ''}</td>
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
   View dialog (for row view)
============================= */
function ViewBranchDialog({
  open,
  onOpenChange,
  branch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch: BranchRow
}) {
  const [copied, setCopied] = useState(false)

  const copyId = async () => {
    if (!branch.id) return
    try {
      await navigator.clipboard.writeText(branch.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
      toast.success('Branch ID copied')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = branch.id
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
      toast.success('Branch ID copied')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Branch Details</DialogTitle>
          <DialogDescription>Full branch information</DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300'>
          <div>
            <p className='font-medium'>Name</p>
            <p>{branch.branchName}</p>
          </div>
          <div>
            <p className='font-medium'>Code</p>
            <p>{branch.branchCode}</p>
          </div>
          <div>
            <p className='font-medium'>City</p>
            <p>{branch.city}</p>
          </div>
          <div>
            <p className='font-medium'>District</p>
            <p>{branch.district}</p>
          </div>
          <div>
            <p className='font-medium'>State</p>
            <p>{branch.state}</p>
          </div>
          <div className='col-span-2'>
            <p className='font-medium'>Parent Department</p>
            <p>{branch.departmentName || '—'}</p>
          </div>

          <div className='col-span-2'>
            <p className='font-medium'>Branch ID</p>
            <div className='mt-1 flex items-center justify-between gap-2 rounded-lg border bg-[var(--color-card)] px-3 py-2'>
              <p className='min-w-0 flex-1 truncate font-mono text-sm'>
                {branch.id || '—'}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!branch.id}
                onClick={copyId}
                className='h-8 px-2'
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* =============================
   Page component
============================= */
function RouteComponent() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewBranch, setViewBranch] = useState<BranchRow | null>(null)

  const canCreate = useCanAccess('branches', 'create')
  const token = sessionStorage.getItem('token') || ''

  const {
    data: branchesData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/branches/get', {
    params: {
      header: {
        Authorization: `Bearer ${token}`,
      },
    },
  }) as {
    data: { data?: BranchRow[]; message?: string }
    isLoading: boolean
    refetch: () => void
  }

  const deleteBranchMutation = $api.useMutation(
    'delete',
    '/branches/delete/{branchId}'
  )

  const handleDelete = (branchId: string) => {
    deleteBranchMutation.mutate(
      { params: { path: { branchId } } },
      {
        onSuccess: () => {
          toast.success('Branch deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete branch'),
      }
    )
  }

  const distinctParentDepartments = useMemo<string[]>(() => {
    const departments =
      branchesData?.data
        ?.map((branch) => branch.departmentName)
        .filter((v): v is string => Boolean(v)) || []
    return [...new Set(departments)].sort()
  }, [branchesData])

  const distinctCities = useMemo<string[]>(() => {
    const cities =
      branchesData?.data
        ?.map((branch) => branch.city)
        .filter((v): v is string => Boolean(v)) || []
    return [...new Set(cities)].sort()
  }, [branchesData])

  const [selectedParentDepartments, setSelectedParentDepartments] = useState<
    string[]
  >([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])

  const filteredBranches = useMemo<BranchRow[]>(() => {
    const all = branchesData?.data ?? []
    return all.filter((branch) => {
      const departmentMatch =
        selectedParentDepartments.length === 0 ||
        (branch.departmentName &&
          selectedParentDepartments.includes(branch.departmentName))
      const cityMatch =
        selectedCities.length === 0 ||
        (branch.city && selectedCities.includes(branch.city))
      return departmentMatch && cityMatch
    })
  }, [branchesData, selectedParentDepartments, selectedCities])

  const isFiltered =
    selectedParentDepartments.length > 0 || selectedCities.length > 0

  useEffect(() => {
    setSelectedParentDepartments((prev) =>
      prev.filter((dept) => distinctParentDepartments.includes(dept))
    )
  }, [distinctParentDepartments])

  useEffect(() => {
    setSelectedCities((prev) =>
      prev.filter((city) => distinctCities.includes(city))
    )
  }, [distinctCities])

  const handleExportCSV = () => {
    if (!filteredBranches.length) {
      toast.info('No data to export.')
      return
    }
    exportCSVFromObjects(filteredBranches, 'branches.csv')
  }

  const handleExportExcel = async () => {
    if (!filteredBranches.length) {
      toast.info('No data to export.')
      return
    }

    try {
      const XLSX: typeof import('xlsx') = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(filteredBranches)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Branches')
      const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      fileDownload(
        new Blob([out], { type: 'application/octet-stream' }),
        'branches.xlsx'
      )
    } catch {
      exportCSVFromObjects(filteredBranches, 'branches.csv')
    }
  }

  return (
    <>
      {isLoading && <LoadingBar progress={70} className='h-1' color='#2563eb' />}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Branches
        </h1>

        <div className='flex items-center gap-2'>
          <BulkBranchUploadDialog
            canOpen={canCreate}
            token={token}
            onDone={() => refetch()}
          />

          {canCreate && (
            <CreateBranchForm
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (!open) setEditingBranch(null)
                setCreateDialogOpen(open)
              }}
              onSuccess={() => {
                setCreateDialogOpen(false)
                setEditingBranch(null)
                refetch()
              }}
              defaultValues={editingBranch || undefined}
            />
          )}
        </div>
      </div>

      {/* Selected Filters */}
      <div className='mb-4 flex flex-wrap gap-2'>
        {selectedParentDepartments.map((dept) => (
          <Badge key={dept} variant='secondary'>
            Department: {dept}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedParentDepartments((prev) =>
                  prev.filter((d) => d !== dept)
                )
              }
            >
              ×
            </Button>
          </Badge>
        ))}
        {selectedCities.map((city) => (
          <Badge key={city} variant='secondary'>
            City: {city}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedCities((prev) => prev.filter((s) => s !== city))
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
              setSelectedParentDepartments([])
              setSelectedCities([])
            }}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {filteredBranches.length ? (
        <PaginatedTable
          data={filteredBranches}
          renderActions={(row: BranchRow) => (
            <div className='flex items-center justify-end'>
              <div className='mr-2'>
                <ViewActionCell
                  onClick={() => {
                    setViewBranch(row)
                    setViewDialogOpen(true)
                  }}
                />
              </div>
              <div className='mr-2'>
                <EditActionCell
                  onClick={() => {
                    setEditingBranch(row)
                    setCreateDialogOpen(true)
                  }}
                />
              </div>
              <DeleteActionCell
                title={`Delete “${row.branchName}”?`}
                onConfirm={() => row.id && handleDelete(row.id)}
                isConfirming={deleteBranchMutation.isPending}
              />
            </div>
          )}
          columns={[
            { key: 'branchName', label: 'Name' },
            { key: 'branchCode', label: 'Code' },
            { key: 'departmentName', label: 'Parent Department' },
            { key: 'city', label: 'City' },
          ]}
          tableActions={
            <div className='flex flex-wrap items-center gap-2'>
              <FilterPopover
                options={distinctParentDepartments}
                selected={selectedParentDepartments}
                onChange={setSelectedParentDepartments}
                placeholder='Filter by Parent Department'
              />
              <FilterPopover
                options={distinctCities}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder='Filter by City'
              />
              <div className='ml-auto flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={handleExportCSV}>
                  Export CSV
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void handleExportExcel()}
                >
                  Export Excel
                </Button>
              </div>
            </div>
          }
          emptyMessage={
            isFiltered
              ? 'No branches match the selected filters.'
              : 'No branches to display at the moment.'
          }
        />
      ) : (
        !isLoading && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
            <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
              {isFiltered
                ? 'No branches match the selected filters.'
                : 'No Branches Found'}
            </h3>
            {!isFiltered && (
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new branch.
              </p>
            )}
          </div>
        )
      )}

      {viewBranch && (
        <ViewBranchDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          branch={viewBranch}
        />
      )}
    </>
  )
}

/* =============================
   Create/Edit form
============================= */
interface CreateBranchFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultValues?: Partial<BranchRow>
}

function CreateBranchForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: CreateBranchFormProps) {
  const {
    data: parentDepartmentsResponse,
    isLoading: parentDepartmentsLoading,
  } = $api.useQuery('get', '/departments/get/dropdown', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
      },
    },
  }) as { data: ParentDepartmentsResponse | undefined; isLoading: boolean }

  const createBranchMutation = $api.useMutation('post', '/branches/create')
  const updateBranchMutation = $api.useMutation(
    'put',
    '/branches/update/{branchId}'
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchRow>({ defaultValues })

  useEffect(() => {
    if (open && defaultValues) {
      reset(defaultValues)
    } else if (!open) {
      reset({
        branchName: '',
        branchCode: '',
        district: '',
        state: '',
        city: '',
        parentDepartmentId: '',
      })
    }
  }, [open, defaultValues, reset])

  const onSubmit = handleSubmit((values) => {
    const token = sessionStorage.getItem('token') || ''
    const payload: NewBranchForm = {
      branchName: values.branchName,
      branchCode: values.branchCode,
      district: values.district,
      state: values.state,
      city: values.city,
      parentDepartmentId: values.parentDepartmentId,
      id: values.id,
    }

    if (values.id) {
      updateBranchMutation.mutate(
        {
          body: payload,
          params: {
            path: { branchId: values.id },
            header: { Authorization: `Bearer ${token}` },
          },
        },
        {
          onSuccess: () => {
            toast.success('Branch updated successfully')
            reset()
            onSuccess()
          },
          onError: () => toast.error('Failed to update branch'),
        }
      )
    } else {
      createBranchMutation.mutate(
        {
          body: payload,
          params: { header: { Authorization: `Bearer ${token}` } },
        },
        {
          onSuccess: (res: { message?: string }) => {
            toast.success(res?.message || 'Branch created!')
            reset()
            onSuccess()
          },
          onError: () => toast.error('Creation failed'),
        }
      )
    }
  })

  const inputFields: ReadonlyArray<[keyof NewBranchForm, string, string?]> = [
    ['branchName', 'Branch Name *', 'e.g., Yogi Chowk'],
    ['branchCode', 'Branch Code *', 'e.g., 012'],
    ['district', 'District *', 'e.g., Surat'],
    ['state', 'State *', 'e.g., Gujarat'],
    ['city', 'City *', 'e.g., Surat'],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' className='text-white'>
          New Branch
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
            {defaultValues?.id ? 'Edit Branch' : 'Create New Branch'}
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Fill in the details below. Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>

        <form
          id='create-branch-form'
          onSubmit={onSubmit}
          className='space-y-5 px-6 pt-2 pb-2'
        >
          {inputFields.map(([name, label, placeholder]) => (
            <div key={name} className='grid gap-1.5'>
              <Label htmlFor={name} className='font-medium'>
                {label}
              </Label>
              <Input
                id={name}
                placeholder={placeholder || `Enter ${label}`}
                {...register(name, {
                  required: `${label.replace(' *', '')} is required.`,
                })}
                className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? 'border-red-500' : ''
                  }`}
              />
              {errors[name] && (
                <p className='pt-1 text-sm text-red-500'>
                  {String(errors[name]?.message)}
                </p>
              )}
            </div>
          ))}

          <div className='grid gap-1.5'>
            <Label htmlFor='parentDepartmentId'>Parent Department *</Label>
            <Controller
              name='parentDepartmentId'
              control={control}
              rules={{ required: 'Parent Department is required.' }}
              render={({ field }) => (
                <Select
                  disabled={parentDepartmentsLoading}
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <SelectTrigger
                    id='parentDepartmentId'
                    aria-invalid={!!errors.parentDepartmentId}
                    className={errors.parentDepartmentId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder='Select parent department' />
                  </SelectTrigger>
                  <SelectContent>
                    {parentDepartmentsResponse?.data?.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {formatDropdownLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parentDepartmentId && (
              <p className='pt-1 text-sm text-red-500'>
                {String(errors.parentDepartmentId.message)}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='create-branch-form'
            disabled={isSubmitting}
            className='text-white'
          >
            {defaultValues?.id ? 'Update' : 'Save Branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}











// import { useEffect, useMemo, useState } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createLazyFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
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
// import { FilterPopover } from '@/components/filter/FilterPopover.tsx'
// import PaginatedTable from '@/components/paginated-table.tsx'
// import {
//   DeleteActionCell,
//   EditActionCell,
//   ViewActionCell,
// } from '@/components/table/cells.ts'

// export const Route = createLazyFileRoute('/_authenticated/admin/branches')({
//   component: RouteComponent,
// })

// type ParentDepartmentOption = { id: string; name: string }

// type ParentDepartmentsResponse = {
//   status?: string
//   message?: string
//   data?: ParentDepartmentOption[]
// }

// type NewBranchForm = {
//   id?: string
//   branchName: string
//   branchCode: string
//   district: string
//   state: string
//   city: string
//   parentDepartmentId: string
// }

// type BranchRow = NewBranchForm & { departmentName?: string }

// function ViewBranchDialog({
//   open,
//   onOpenChange,
//   branch,
// }: {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   branch: BranchRow
// }) {
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='max-w-xl'>
//         <DialogHeader>
//           <DialogTitle>Branch Details</DialogTitle>
//           <DialogDescription>Full branch information</DialogDescription>
//         </DialogHeader>
//         <div className='grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300'>
//           <div>
//             <p className='font-medium'>Name</p>
//             <p>{branch.branchName}</p>
//           </div>
//           <div>
//             <p className='font-medium'>Code</p>
//             <p>{branch.branchCode}</p>
//           </div>
//           <div>
//             <p className='font-medium'>City</p>
//             <p>{branch.city}</p>
//           </div>
//           <div>
//             <p className='font-medium'>District</p>
//             <p>{branch.district}</p>
//           </div>
//           <div>
//             <p className='font-medium'>State</p>
//             <p>{branch.state}</p>
//           </div>
//           <div className='col-span-2'>
//             <p className='font-medium'>Parent Department</p>
//             <p>{branch.departmentName || '—'}</p>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

// /* =============================
//    Export helpers (strictly typed)
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
//   filename = 'branches.csv'
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
//   filename = 'branches.xlsx'
// ): Promise<void> {
//   try {
//     const XLSX: typeof import('xlsx') = await import('xlsx')

//     // make a mutable copy (T[]) from readonly T[]
//     const mutableRows: T[] = Array.from(rows)

//     const { headers } = buildRowsAndHeaders(rows)
//     const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
//     const wb = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(wb, ws, 'Branches')
//     const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
//     fileDownload(
//       new Blob([wbout], { type: 'application/octet-stream' }),
//       filename
//     )
//   } catch {
//     exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
//   }
// }

// function RouteComponent() {
//   const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
//   const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null)
//   const [viewDialogOpen, setViewDialogOpen] = useState(false)
//   const [viewBranch, setViewBranch] = useState<BranchRow | null>(null)

//   const canCreate = useCanAccess('branches', 'create')

//   const {
//     data: branchesData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/branches/get', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
//       },
//     },
//   }) as {
//     data: { data?: BranchRow[]; message?: string }
//     isLoading: boolean
//     refetch: () => void
//   }

//   const deleteBranchMutation = $api.useMutation(
//     'delete',
//     '/branches/delete/{branchId}'
//   )

//   const handleDelete = (branchId: string) => {
//     deleteBranchMutation.mutate(
//       { params: { path: { branchId } } },
//       {
//         onSuccess: () => {
//           toast.success('Branch deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete branch'),
//       }
//     )
//   }

//   const distinctParentDepartments = useMemo<string[]>(() => {
//     const departments =
//       branchesData?.data
//         ?.map((branch) => branch.departmentName)
//         .filter((v): v is string => Boolean(v)) || []
//     return [...new Set(departments)].sort()
//   }, [branchesData])

//   const distinctCities = useMemo<string[]>(() => {
//     const cities =
//       branchesData?.data?.map((branch) => branch.city).filter(Boolean) || []
//     return [...new Set(cities)].sort()
//   }, [branchesData])

//   const [selectedParentDepartments, setSelectedParentDepartments] = useState<
//     string[]
//   >([])
//   const [selectedCities, setSelectedCities] = useState<string[]>([])

//   const filteredBranches = useMemo<BranchRow[]>(() => {
//     const all = branchesData?.data ?? []
//     return all.filter((branch) => {
//       const departmentMatch =
//         selectedParentDepartments.length === 0 ||
//         (branch.departmentName &&
//           selectedParentDepartments.includes(branch.departmentName))
//       const cityMatch =
//         selectedCities.length === 0 ||
//         (branch.city && selectedCities.includes(branch.city))
//       return departmentMatch && cityMatch
//     })
//   }, [branchesData, selectedParentDepartments, selectedCities])

//   const isFiltered =
//     selectedParentDepartments.length > 0 || selectedCities.length > 0

//   useEffect(() => {
//     setSelectedParentDepartments((prev) =>
//       prev.filter((dept) => distinctParentDepartments.includes(dept))
//     )
//   }, [distinctParentDepartments])

//   useEffect(() => {
//     setSelectedCities((prev) =>
//       prev.filter((city) => distinctCities.includes(city))
//     )
//   }, [distinctCities])

//   const handleExportCSV = () => {
//     if (!filteredBranches.length) {
//       toast.info('No data to export.')
//       return
//     }
//     exportCSV<BranchRow>(filteredBranches, 'branches.csv')
//   }

//   const handleExportExcel = async () => {
//     if (!filteredBranches.length) {
//       toast.info('No data to export.')
//       return
//     }
//     await exportExcel<BranchRow>(filteredBranches, 'branches.xlsx')
//   }

//   return (
//     <>
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}
//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Branches
//           </h1>
//           {canCreate && (
//             <CreateBranchForm
//               open={isCreateDialogOpen}
//               onOpenChange={(open) => {
//                 if (!open) setEditingBranch(null)
//                 setCreateDialogOpen(open)
//               }}
//               onSuccess={() => {
//                 setCreateDialogOpen(false)
//                 setEditingBranch(null)
//                 refetch()
//               }}
//               defaultValues={editingBranch || undefined}
//             />
//           )}
//         </div>

//         {/* Selected Filters */}
//         <div className='mb-4 flex flex-wrap gap-2'>
//           {selectedParentDepartments.map((dept) => (
//             <Badge key={dept} variant='secondary'>
//               Department: {dept}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedParentDepartments((prev) =>
//                     prev.filter((d) => d !== dept)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedCities.map((city) => (
//             <Badge key={city} variant='secondary'>
//               State: {city}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedCities((prev) => prev.filter((s) => s !== city))
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
//                 setSelectedParentDepartments([])
//                 setSelectedCities([])
//               }}
//             >
//               Clear All Filters
//             </Button>
//           )}
//         </div>

//         {filteredBranches.length ? (
//           <PaginatedTable
//             data={filteredBranches}
//             renderActions={(row: BranchRow) => (
//               <div className='flex items-center justify-end'>
//                 <div className='mr-2'>
//                   <ViewActionCell
//                     onClick={() => {
//                       setViewBranch(row)
//                       setViewDialogOpen(true)
//                     }}
//                   />
//                 </div>
//                 <div className='mr-2'>
//                   <EditActionCell
//                     onClick={() => {
//                       setEditingBranch(row)
//                       setCreateDialogOpen(true)
//                     }}
//                   />
//                 </div>
//                 <DeleteActionCell
//                   title={`Delete “${row.branchName}”?`}
//                   onConfirm={() => row.id && handleDelete(row.id)}
//                   isConfirming={deleteBranchMutation.isPending}
//                 />
//               </div>
//             )}
//             columns={[
//               { key: 'branchName', label: 'Name' },
//               { key: 'branchCode', label: 'Code' },
//               { key: 'departmentName', label: 'Parent Department' },
//               { key: 'city', label: 'City' },
//             ]}
//             tableActions={
//               <div className='flex flex-wrap items-center gap-2'>
//                 <FilterPopover
//                   options={distinctParentDepartments}
//                   selected={selectedParentDepartments}
//                   onChange={setSelectedParentDepartments}
//                   placeholder='Filter by Parent Department'
//                 />
//                 <FilterPopover
//                   options={distinctCities}
//                   selected={selectedCities}
//                   onChange={setSelectedCities}
//                   placeholder='Filter by City'
//                 />
//                 <div className='ml-auto flex items-center gap-2'>
//                   <Button variant='outline' size='sm' onClick={handleExportCSV}>
//                     Export CSV
//                   </Button>
//                   <Button
//                     variant='outline'
//                     size='sm'
//                     onClick={handleExportExcel}
//                   >
//                     Export Excel
//                   </Button>
//                 </div>
//               </div>
//             }
//             emptyMessage={
//               isFiltered
//                 ? 'No branches match the selected filters.'
//                 : 'No branches to display at the moment.'
//             }
//           />
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 {isFiltered
//                   ? 'No branches match the selected filters.'
//                   : 'No Branches Found'}
//               </h3>
//               {!isFiltered && (
//                 <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                   Get started by creating a new branch.
//                 </p>
//               )}
//             </div>
//           )
//         )}
//       </>

//       {viewBranch && (
//         <ViewBranchDialog
//           open={viewDialogOpen}
//           onOpenChange={setViewDialogOpen}
//           branch={viewBranch!}
//         />
//       )}
//     </>
//   )
// }

// interface CreateBranchFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: () => void
//   defaultValues?: Partial<BranchRow>
// }

// function CreateBranchForm({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: CreateBranchFormProps) {
//   const {
//     data: parentDepartmentsResponse,
//     isLoading: parentDepartmentsLoading,
//   } = $api.useQuery('get', '/departments/get/dropdown', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
//       },
//     },
//   }) as { data: ParentDepartmentsResponse | undefined; isLoading: boolean }

//   const createBranchMutation = $api.useMutation('post', '/branches/create')
//   const updateBranchMutation = $api.useMutation(
//     'put',
//     '/branches/update/{branchId}'
//   )

//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<BranchRow>({ defaultValues })

//   useEffect(() => {
//     if (open && defaultValues) {
//       reset(defaultValues)
//     } else if (!open) {
//       reset({
//         branchName: '',
//         branchCode: '',
//         district: '',
//         state: '',
//         city: '',
//         parentDepartmentId: '',
//       })
//     }
//   }, [open, defaultValues, reset])

//   const onSubmit = handleSubmit((values) => {
//     const token = sessionStorage.getItem('token') || ''
//     const payload: BranchRow = { ...values }

//     if (values.id) {
//       updateBranchMutation.mutate(
//         {
//           body: payload,
//           params: {
//             path: { branchId: values.id },
//             header: { Authorization: `Bearer ${token}` },
//           },
//         },
//         {
//           onSuccess: () => {
//             toast.success('Branch updated successfully')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Failed to update branch'),
//         }
//       )
//     } else {
//       createBranchMutation.mutate(
//         {
//           body: payload,
//           params: { header: { Authorization: `Bearer ${token}` } },
//         },
//         {
//           onSuccess: (res: { message?: string }) => {
//             toast.success(res?.message || 'Branch created!')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Creation failed'),
//         }
//       )
//     }
//   })

//   const inputFields: ReadonlyArray<[keyof NewBranchForm, string, string?]> = [
//     ['branchName', 'Branch Name *', ''],
//     ['branchCode', 'Branch Code *', '001'],
//     ['district', 'District *', 'e.g., Ahmedabad'],
//     ['state', 'State *', 'e.g., Gujarat'],
//     ['city', 'City *', 'e.g., Dholka'],
//   ]

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogTrigger asChild>
//         <Button size='sm' className='text-white'>
//           New Branch
//         </Button>
//       </DialogTrigger>

//       <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
//         <DialogHeader className='p-6 pb-4'>
//           <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
//             {defaultValues?.id ? 'Edit Branch' : 'Create New Branch'}
//           </DialogTitle>
//           <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
//             Fill in the details below. Fields marked with * are mandatory.
//           </DialogDescription>
//         </DialogHeader>

//         <form
//           id='create-branch-form'
//           onSubmit={onSubmit}
//           className='space-y-5 px-6 pt-2 pb-2'
//         >
//           {inputFields.map(([name, label, placeholder]) => (
//             <div key={name} className='grid gap-1.5'>
//               <Label htmlFor={name} className='font-medium'>
//                 {label}
//               </Label>
//               <Input
//                 id={name}
//                 placeholder={placeholder || `Enter ${label}`}
//                 {...register(name, {
//                   required: `${label.replace(' *', '')} is required.`,
//                 })}
//                 className={`dark:border-gray-600 dark:bg-gray-700 ${
//                   errors[name] ? 'border-red-500' : ''
//                 }`}
//               />
//               {errors[name] && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {String(errors[name]?.message)}
//                 </p>
//               )}
//             </div>
//           ))}

//           <div className='grid gap-1.5'>
//             <Label htmlFor='parentDepartmentId'>Parent Department *</Label>
//             <Controller
//               name='parentDepartmentId'
//               control={control}
//               rules={{ required: 'Parent Department is required.' }}
//               render={({ field }) => (
//                 <Select
//                   disabled={parentDepartmentsLoading}
//                   onValueChange={field.onChange}
//                   value={field.value ?? ''}
//                 >
//                   <SelectTrigger
//                     id='parentDepartmentId'
//                     aria-invalid={!!errors.parentDepartmentId}
//                     className={
//                       errors.parentDepartmentId ? 'border-red-500' : ''
//                     }
//                   >
//                     <SelectValue placeholder='Select parent department' />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {parentDepartmentsResponse?.data?.map(({ id, name }) => (
//                       <SelectItem key={id} value={id}>
//                         {name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//             {errors.parentDepartmentId && (
//               <p className='pt-1 text-sm text-red-500'>
//                 {String(errors.parentDepartmentId.message)}
//               </p>
//             )}
//           </div>
//         </form>

//         <DialogFooter className='rounded-b-lg bg-gray-50 p-6 pt-4 dark:bg-gray-800'>
//           <Button
//             type='button'
//             variant='outline'
//             onClick={() => onOpenChange(false)}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button
//             type='submit'
//             form='create-branch-form'
//             disabled={isSubmitting}
//             className='text-white'
//           >
//             {defaultValues?.id ? 'Update' : 'Save Branch'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
