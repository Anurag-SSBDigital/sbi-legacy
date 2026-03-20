import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createLazyFileRoute } from '@tanstack/react-router'
import type { components } from '@/types/api/v1.js'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { formatDropdownLabel } from '@/lib/dropdown-label.ts'
import { neverToError } from '@/lib/utils'
import { useCanAccess, usePermissions } from '@/hooks/use-can-access.tsx'
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

export const Route = createLazyFileRoute('/_authenticated/admin/departements')({
  component: RouteComponent,
})

type ParentDepartmentOption = {
  id: string
  name: string
  code?: string | number
  departmentCode?: string | number
  branchCode?: string | number
}

type ParentDepartmentsResponse = {
  status?: string
  message?: string
  data?: ParentDepartmentOption[]
}

type NewDeptForm = {
  id?: string
  departmentName: string
  departmentCode: string
  district: string
  state: string
  city: string
  parentDepartmentId?: string
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
  rows.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)))
  const headers = Array.from(keySet)

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
  filename = 'departments.csv'
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
  filename = 'departments.xlsx'
): Promise<void> {
  try {
    const XLSX: typeof import('xlsx') = await import('xlsx')
    const { headers } = buildRowsAndHeaders(rows)
    const mutableRows: T[] = Array.from(rows)

    const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Departments')
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    fileDownload(
      new Blob([wbout], { type: 'application/octet-stream' }),
      filename
    )
  } catch {
    exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'))
  }
}

/* =============================
   Demo Excel Download
============================= */
type DemoDeptRow = {
  departmentName: string
  departmentCode: string
  district: string
  state: string
  city: string
  parentDepartmentId?: string
  parentDepartmentName?: string
}

async function downloadDemoDepartmentsExcel() {
  const XLSX: typeof import('xlsx') = await import('xlsx')

  const rows: DemoDeptRow[] = [
    {
      departmentName: 'Human Resources',
      departmentCode: 'HR-001',
      district: 'Ahmedabad',
      state: 'GJ',
      city: 'Ahmedabad',
      parentDepartmentId: 'DEPT-cb7c6e19-bd11-4291-9be8-e96aa2c98af4',
      parentDepartmentName: 'Main Department',
    },
    {
      departmentName: 'IT Department',
      departmentCode: 'IT-002',
      district: 'Surat',
      state: 'GJ',
      city: 'Surat',
      parentDepartmentName: 'Main Department', // optional, useful if user pastes name
    },
    {
      departmentName: 'Operations',
      departmentCode: 'OPS-003',
      district: 'Vadodara',
      state: 'GJ',
      city: 'Vadodara',
    },
  ]

  const headers: (keyof DemoDeptRow)[] = [
    'departmentName',
    'departmentCode',
    'district',
    'state',
    'city',
    'parentDepartmentId',
    'parentDepartmentName',
  ]

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers as string[] })
  ws['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 42 },
    { wch: 22 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Departments')

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  fileDownload(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'departments_bulk_upload_demo.xlsx'
  )
}

/* =============================
   Bulk Upload
============================= */
type UploadRow = {
  departmentName?: string
  departmentCode?: string
  district?: string
  state?: string
  city?: string
  parentDepartmentId?: string
  parentDepartmentName?: string
}

type UploadError = {
  row: number
  message: string
  data?: UploadRow
}

function normalizeKey(k: string) {
  return k.replace(/\s+/g, '').toLowerCase()
}

function pickVal(obj: Record<string, unknown>, keys: string[]) {
  const map = new Map(Object.keys(obj).map((k) => [normalizeKey(k), k]))
  for (const kk of keys) {
    const real = map.get(normalizeKey(kk))
    if (real) return obj[real]
  }
  return undefined
}

async function readExcelRows(file: File): Promise<UploadRow[]> {
  const XLSX: typeof import('xlsx') = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
  })

  // map various header styles to our keys
  const rows: UploadRow[] = json.map((r) => ({
    departmentName: String(
      pickVal(r, ['departmentName', 'Department Name', 'Name']) ?? ''
    ).trim(),
    departmentCode: String(
      pickVal(r, ['departmentCode', 'Department Code', 'Code']) ?? ''
    ).trim(),
    district: String(pickVal(r, ['district', 'District']) ?? '').trim(),
    state: String(pickVal(r, ['state', 'State']) ?? '').trim(),
    city: String(pickVal(r, ['city', 'City']) ?? '').trim(),
    parentDepartmentId:
      String(
        pickVal(r, ['parentDepartmentId', 'Parent Department Id']) ?? ''
      ).trim() || undefined,
    parentDepartmentName:
      String(
        pickVal(r, ['parentDepartmentName', 'Parent Department Name']) ?? ''
      ).trim() || undefined,
  }))

  // remove fully empty rows
  return rows.filter((x) =>
    Object.values(x).some((v) => String(v ?? '').trim() !== '')
  )
}

function validateUploadRows(rows: UploadRow[]): {
  ok: UploadRow[]
  errors: UploadError[]
} {
  const errors: UploadError[] = []
  const ok: UploadRow[] = []

  rows.forEach((r, idx) => {
    const rowNo = idx + 2 // assuming row1 header
    const missing: string[] = []
    if (!r.departmentName) missing.push('departmentName')
    if (!r.departmentCode) missing.push('departmentCode')
    if (!r.district) missing.push('district')
    if (!r.state) missing.push('state')
    if (!r.city) missing.push('city')

    if (missing.length) {
      errors.push({
        row: rowNo,
        message: `Missing required: ${missing.join(', ')}`,
        data: r,
      })
      return
    }

    ok.push(r)
  })

  return { ok, errors }
}

function ProgressBar({
  total,
  sent,
  success,
  failed,
  running,
  currentLabel,
}: {
  total: number
  sent: number
  success: number
  failed: number
  running: boolean
  currentLabel?: string
}) {
  const pct = total <= 0 ? 0 : Math.round((sent / total) * 100)
  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]'>
        <div className='flex items-center gap-2'>
          <span className='font-medium text-[var(--color-foreground)]'>
            Progress
          </span>
          <span>
            {sent}/{total} sent
          </span>
          <span className='rounded-full border px-2 py-0.5'>✅ {success}</span>
          <span className='rounded-full border px-2 py-0.5'>❌ {failed}</span>
          {running && (
            <span className='rounded-full border px-2 py-0.5'>⏳ Running</span>
          )}
        </div>
        <div className='tabular-nums'>{pct}%</div>
      </div>

      <div className='h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800'>
        <div
          className='h-full rounded-full transition-[width] duration-300'
          style={{
            width: `${pct}%`,
            background:
              'linear-gradient(90deg,var(--color-primary),color-mix(in oklab,var(--color-primary),var(--color-chart-2) 45%))',
          }}
        />
      </div>

      {currentLabel && (
        <div className='text-xs text-[var(--color-muted-foreground)]'>
          Now:{' '}
          <span className='font-medium text-[var(--color-foreground)]'>
            {currentLabel}
          </span>
        </div>
      )}
    </div>
  )
}

function BulkUploadDepartments({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)

  const [fileName, setFileName] = useState<string>('')
  const [rows, setRows] = useState<UploadRow[]>([])
  const [preErrors, setPreErrors] = useState<UploadError[]>([])

  const [running, setRunning] = useState(false)
  const [total, setTotal] = useState(0)
  const [sent, setSent] = useState(0)
  const [success, setSuccess] = useState(0)
  const [failed, setFailed] = useState(0)
  const [currentLabel, setCurrentLabel] = useState<string>('')

  const [runErrors, setRunErrors] = useState<UploadError[]>([])

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

  const parentNameToId = useMemo(() => {
    const m = new Map<string, string>()
    parentDepartmentsResponse?.data?.forEach((p) =>
      m.set(p.name.trim().toLowerCase(), p.id)
    )
    return m
  }, [parentDepartmentsResponse])

  const createDepartmentMutation = $api.useMutation(
    'post',
    '/departments/create'
  )

  const clearAll = () => {
    setFileName('')
    setRows([])
    setPreErrors([])
    setRunErrors([])
    setTotal(0)
    setSent(0)
    setSuccess(0)
    setFailed(0)
    setCurrentLabel('')
  }

  const pickFile = () => inputRef.current?.click()

  const onFileChange = async (f?: File | null) => {
    if (!f) return
    try {
      clearAll()
      setFileName(f.name)
      const parsed = await readExcelRows(f)
      const { ok, errors } = validateUploadRows(parsed)
      setRows(ok)
      setPreErrors(errors)
      if (!ok.length) {
        toast.error('No valid rows found in Excel.')
      } else {
        toast.success(`Loaded ${ok.length} rows from Excel.`)
      }
    } catch (e) {
      toast.error(`Failed to read Excel: ${neverToError(e as Error)}`)
    }
  }

  const runUpload = async () => {
    const token = sessionStorage.getItem('token') || ''
    if (!rows.length) {
      toast.info('Please upload an Excel with valid rows first.')
      return
    }

    setRunning(true)
    setRunErrors([])
    setTotal(rows.length)
    setSent(0)
    setSuccess(0)
    setFailed(0)

    let okCount = 0
    let failCount = 0
    let sentCount = 0
    const errors: UploadError[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNo = i + 2

      const resolvedParentId =
        r.parentDepartmentId ||
        (r.parentDepartmentName
          ? parentNameToId.get(r.parentDepartmentName.trim().toLowerCase())
          : undefined)

      const payload: NewDeptForm = {
        departmentName: r.departmentName || '',
        departmentCode: r.departmentCode || '',
        district: r.district || '',
        state: r.state || '',
        city: r.city || '',
        parentDepartmentId: resolvedParentId || undefined,
      }

      setCurrentLabel(`${payload.departmentName} (${payload.departmentCode})`)
      try {
        // Prefer mutateAsync if available (react-query style)
        const mutAny = createDepartmentMutation
        if (typeof mutAny.mutateAsync === 'function') {
          await mutAny.mutateAsync({
            body: payload,
            params: { header: { Authorization: `Bearer ${token}` } },
          })
        } else {
          // fallback promise wrapper
          await new Promise<void>((resolve, reject) => {
            createDepartmentMutation.mutate(
              {
                body: payload,
                params: { header: { Authorization: `Bearer ${token}` } },
              },
              {
                onSuccess: () => resolve(),
                onError: (err) => reject(err),
              }
            )
          })
        }
        okCount++
      } catch (e) {
        failCount++
        errors.push({
          row: rowNo,
          message: neverToError(e as Error),
          data: r,
        })
      } finally {
        sentCount++
        setSent(sentCount)
        setSuccess(okCount)
        setFailed(failCount)
      }
    }

    setRunErrors(errors)
    setRunning(false)
    setCurrentLabel('')

    if (errors.length) {
      toast.error(`Upload finished: ${okCount} success, ${failCount} failed.`)
    } else {
      toast.success(`Upload finished: ${okCount} departments created.`)
    }

    onDone()
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) clearAll()
        }}
      >
        <DialogTrigger asChild>
          <Button variant='outline' size='sm'>
            Bulk Upload
          </Button>
        </DialogTrigger>
        {/* <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Bulk Upload Departments (Excel)</DialogTitle>
            <DialogDescription>
              Upload an Excel and we will call <code>/departments/create</code> sequentially (one-by-one) with progress.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={async () => {
                  try {
                    await downloadDemoDepartmentsExcel()
                    toast.success('Demo Excel downloaded.')
                  } catch (e) {
                    toast.error(`Failed to generate demo excel: ${neverToError(e as Error)}`)
                  }
                }}
              >
                Download Demo Excel
              </Button>

              <Button type='button' size='sm' onClick={pickFile} disabled={running}>
                Upload Excel
              </Button>

              <input
                ref={inputRef}
                type='file'
                accept='.xlsx,.xls,.csv'
                className='hidden'
                onChange={(e) => onFileChange(e.target.files?.[0])}
              />

              {fileName && (
                <span className='text-xs text-[var(--color-muted-foreground)]'>
                  File: <span className='font-medium text-[var(--color-foreground)]'>{fileName}</span>
                </span>
              )}
            </div>

            {parentDepartmentsLoading ? (
              <div className='text-sm text-[var(--color-muted-foreground)]'>Loading parent departments…</div>
            ) : (
              <div className='text-xs text-[var(--color-muted-foreground)]'>
                Parent resolution supported via <b>parentDepartmentId</b> or <b>parentDepartmentName</b>.
              </div>
            )}

            <div className='rounded-xl border p-4'>
              <ProgressBar
                total={total}
                sent={sent}
                success={success}
                failed={failed}
                running={running}
                currentLabel={currentLabel}
              />
            </div>

            <div className='grid gap-2 rounded-xl border p-4'>
              <div className='text-sm font-semibold'>Validation Summary</div>
              <div className='text-sm'>
                Valid rows: <b>{rows.length}</b> &nbsp; | &nbsp; Invalid rows: <b>{preErrors.length}</b>
              </div>

              {preErrors.length > 0 && (
                <div className='max-h-40 overflow-auto rounded-lg border bg-[var(--color-card)] p-3 text-xs'>
                  {preErrors.slice(0, 50).map((e, idx) => (
                    <div key={idx} className='py-1'>
                      <b>Row {e.row}:</b> {e.message}
                    </div>
                  ))}
                  {preErrors.length > 50 && (
                    <div className='pt-2 text-[var(--color-muted-foreground)]'>
                      Showing first 50 errors…
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='grid gap-2 rounded-xl border p-4'>
              <div className='text-sm font-semibold'>Run Errors</div>
              {runErrors.length === 0 ? (
                <div className='text-sm text-[var(--color-muted-foreground)]'>No runtime errors yet.</div>
              ) : (
                <div className='max-h-56 overflow-auto rounded-lg border bg-[var(--color-card)] p-3 text-xs'>
                  {runErrors.map((e, idx) => (
                    <div key={idx} className='py-1'>
                      <b>Row {e.row}:</b> {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={running}>
              Close
            </Button>
            <Button
              type='button'
              onClick={runUpload}
              disabled={running || rows.length === 0 || preErrors.length > 0}
              className='text-white'
              title={preErrors.length ? 'Fix validation errors first' : undefined}
            >
              {running ? 'Uploading…' : `Start Upload (${rows.length})`}
            </Button>
          </DialogFooter>
        </DialogContent> */}
        <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl'>
          <DialogHeader className='border-b p-6 pb-4'>
            <DialogTitle className='text-xl font-semibold'>
              Bulk Upload Departments
            </DialogTitle>
            {/* <DialogDescription className='mt-1 text-sm text-[var(--color-muted-foreground)]'>
              Upload an Excel and we will call <code>/departments/create</code> sequentially (one-by-one) with progress.
            </DialogDescription> */}
          </DialogHeader>

          <div className='space-y-4 p-6 pt-4'>
            {/* Actions row */}
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={async () => {
                  try {
                    await downloadDemoDepartmentsExcel()
                    toast.success('Demo Excel downloaded.')
                  } catch (e) {
                    toast.error(
                      `Failed to generate demo excel: ${neverToError(e instanceof Error ? e : new Error('Unknown error'))}`
                    )
                  }
                }}
              >
                Download Demo Excel
              </Button>

              <Button
                type='button'
                size='sm'
                onClick={pickFile}
                disabled={running}
                className='text-white'
              >
                Choose File
              </Button>

              <input
                ref={inputRef}
                type='file'
                accept='.xlsx,.xls,.csv'
                className='hidden'
                onChange={(e) => {
                  void onFileChange(e.target.files?.[0])
                  e.currentTarget.value = ''
                }}
              />

              {fileName ? (
                <span className='rounded-full border bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]'>
                  File:{' '}
                  <span className='font-medium text-[var(--color-foreground)]'>
                    {fileName}
                  </span>
                </span>
              ) : (
                <span className='text-xs text-[var(--color-muted-foreground)]'>
                  No file selected
                </span>
              )}
            </div>

            {parentDepartmentsLoading ? (
              <div className='text-sm text-[var(--color-muted-foreground)]'>
                Loading parent departments…
              </div>
            ) : (
              <div className='text-xs text-[var(--color-muted-foreground)]'>
                Parent resolution supported via <b>parentDepartmentId</b> or{' '}
                <b>parentDepartmentName</b>.
              </div>
            )}

            {/* Progress (same card style as branches) */}
            <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
              <ProgressBar
                total={total}
                sent={sent}
                success={success}
                failed={failed}
                running={running}
                currentLabel={currentLabel}
              />
            </div>

            {/* Validation summary */}
            <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
              <div className='text-sm font-semibold'>Validation Summary</div>
              <div className='mt-1 text-sm'>
                Valid rows: <b>{rows.length}</b> &nbsp; | &nbsp; Invalid rows:{' '}
                <b>{preErrors.length}</b>
              </div>

              {preErrors.length > 0 && (
                <div className='mt-3 max-h-44 overflow-auto rounded-lg border bg-[var(--color-card)] p-3 text-xs'>
                  {preErrors.slice(0, 50).map((e, idx) => (
                    <div key={`${e.row}-${idx}`} className='py-1'>
                      <b>Row {e.row}:</b> {e.message}
                    </div>
                  ))}
                  {preErrors.length > 50 && (
                    <div className='pt-2 text-[var(--color-muted-foreground)]'>
                      Showing first 50 errors…
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run errors */}
            <div className='rounded-xl border bg-[var(--color-card)] p-4 shadow-sm'>
              <div className='text-sm font-semibold'>Run Errors</div>
              {runErrors.length === 0 ? (
                <div className='mt-1 text-sm text-[var(--color-muted-foreground)]'>
                  No runtime errors yet.
                </div>
              ) : (
                <div className='mt-3 max-h-56 overflow-auto rounded-lg border bg-[var(--color-card)] p-3 text-xs'>
                  {runErrors.map((e, idx) => (
                    <div key={`${e.row}-${idx}`} className='py-1'>
                      <b>Row {e.row}:</b> {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='gap-2 border-t bg-[var(--color-card)] p-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={running}
            >
              Close
            </Button>
            <Button
              type='button'
              onClick={runUpload}
              disabled={running || rows.length === 0 || preErrors.length > 0}
              className='text-white'
              title={
                preErrors.length ? 'Fix validation errors first' : undefined
              }
            >
              {running ? 'Uploading…' : `Start Upload (${rows.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* =============================
   Page
============================= */
function RouteComponent() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<
    components['schemas']['DepartmentDTO'] | null
  >(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewDepartment, setViewDepartment] = useState<
    components['schemas']['DepartmentDTO'] | null
  >(null)

  const [selectedParentDepartmentNames, setSelectedParentDepartmentNames] =
    useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])

  const canCreate = useCanAccess('departments', 'create')
  const [canUpdate, canDelete] = usePermissions('departments', [
    'update',
    'delete',
  ])

  const {
    data: departmentsData,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/departments/list', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
      },
    },
  })

  const deleteDepartmentMutation = $api.useMutation(
    'delete',
    '/departments/delete/{id}'
  )

  const handleDelete = (deptId: string) => {
    deleteDepartmentMutation.mutate(
      { params: { path: { id: deptId } } },
      {
        onSuccess: () => {
          toast.success('Department deleted')
          refetch()
        },
        onError: () => toast.error('Could not delete department'),
      }
    )
  }

  const departments = departmentsData?.data || []

  const idToNameMap = useMemo(
    () => new Map(departments.map((dept) => [dept.id, dept.departmentName])),
    [departments]
  )

  type DepartmentRow = (typeof departments)[number] & {
    parentDepartmentName: string
  }

  const transformedDepartments: DepartmentRow[] = useMemo(
    () =>
      departments.map((dept) => ({
        ...dept,
        parentDepartmentName: dept.parentDepartmentId
          ? idToNameMap.get(dept.parentDepartmentId) || 'Unknown'
          : 'None',
      })),
    [departments, idToNameMap]
  )

  const distinctParentDepartmentNames = useMemo(
    () =>
      [
        ...new Set(
          transformedDepartments.map((dept) => dept.parentDepartmentName)
        ),
      ].sort(),
    [transformedDepartments]
  )

  const distinctCities = useMemo(
    () =>
      [...new Set(transformedDepartments.map((dept) => dept.city))]
        .filter((x): x is string => x !== undefined)
        .sort(),
    [transformedDepartments]
  )

  const filteredDepartments: DepartmentRow[] = useMemo(
    () =>
      transformedDepartments.filter((dept) => {
        const parentMatch =
          selectedParentDepartmentNames.length === 0 ||
          selectedParentDepartmentNames.includes(dept.parentDepartmentName)

        const cityMatch =
          selectedCities.length === 0 ||
          selectedCities.includes(dept.city || '')
        return parentMatch && cityMatch
      }),
    [transformedDepartments, selectedParentDepartmentNames, selectedCities]
  )

  const isFiltered =
    selectedParentDepartmentNames.length > 0 || selectedCities.length > 0

  const handleExportCSV = () => {
    if (!filteredDepartments.length) return toast.info('No data to export.')
    exportCSV<DepartmentRow>(filteredDepartments, 'departments.csv')
  }

  const handleExportExcel = async () => {
    if (!filteredDepartments.length) return toast.info('No data to export.')
    await exportExcel<DepartmentRow>(filteredDepartments, 'departments.xlsx')
  }

  const [copiedDeptId, setCopiedDeptId] = useState(false)

  const copyDeptId = async (id?: string) => {
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      setCopiedDeptId(true)
      window.setTimeout(() => setCopiedDeptId(false), 1500)
      toast.success('Department ID copied')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = id
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopiedDeptId(true)
      window.setTimeout(() => setCopiedDeptId(false), 1500)
      toast.success('Department ID copied')
    }
  }

  return (
    <>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Departments
        </h1>

        <div className='flex items-center gap-2'>
          <BulkUploadDepartments onDone={refetch} />

          {canCreate && (
            <CreateDepartmentForm
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (!open) setEditingDepartment(null)
                setCreateDialogOpen(open)
              }}
              onSuccess={() => {
                setCreateDialogOpen(false)
                setEditingDepartment(null)
                refetch()
              }}
              defaultValues={editingDepartment || undefined}
            />
          )}
        </div>
      </div>

      {/* Display Selected Filters */}
      <div className='mb-4 flex flex-wrap gap-2'>
        {selectedParentDepartmentNames.map((name) => (
          <Badge key={name} variant='secondary'>
            Parent Department: {name}
            <Button
              variant='ghost'
              size='sm'
              className='ml-1'
              onClick={() =>
                setSelectedParentDepartmentNames((prev) =>
                  prev.filter((n) => n !== name)
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
                setSelectedCities((prev) => prev.filter((c) => c !== city))
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
              setSelectedParentDepartmentNames([])
              setSelectedCities([])
            }}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {filteredDepartments.length > 0 ? (
        <PaginatedTable
          data={filteredDepartments}
          renderActions={(row) => (
            <div className='flex items-center justify-end gap-2'>
              <ViewActionCell
                onClick={() => {
                  setViewDepartment(row)
                  setViewDialogOpen(true)
                }}
              />
              {canUpdate && (
                <EditActionCell
                  onClick={() => {
                    setEditingDepartment(row)
                    setCreateDialogOpen(true)
                  }}
                />
              )}
              {canDelete && (
                <DeleteActionCell
                  title={`Delete “${row.departmentName}”?`}
                  description='Delete Department'
                  onConfirm={() => row.id && handleDelete(row.id)}
                  isConfirming={deleteDepartmentMutation.isPending}
                />
              )}
            </div>
          )}
          columns={[
            { key: 'departmentName', label: 'Name' },
            { key: 'departmentCode', label: 'Code' },
            { key: 'parentDepartmentName', label: 'Parent Department' },
            { key: 'city', label: 'City' },
            { key: 'createdBy', label: 'Created By' },
          ]}
          tableActions={
            <div className='flex flex-wrap items-center gap-2'>
              <FilterPopover
                options={distinctParentDepartmentNames}
                selected={selectedParentDepartmentNames}
                onChange={setSelectedParentDepartmentNames}
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
                <Button variant='outline' size='sm' onClick={handleExportExcel}>
                  Export Excel
                </Button>
              </div>
            </div>
          }
          emptyMessage={
            isFiltered
              ? 'No departments match the selected filters.'
              : 'No departments to display at the moment.'
          }
        />
      ) : (
        !isLoading && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
            <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
              {isFiltered
                ? 'No departments match the selected filters.'
                : 'No Departments Found'}
            </h3>
            {!isFiltered && (
              <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating a new department.
              </p>
            )}
          </div>
        )
      )}

      {viewDepartment && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className='max-w-xl'>
            <DialogHeader>
              <DialogTitle className='text-xl font-bold'>
                Department Details
              </DialogTitle>
              <DialogDescription>
                Full information about the department
              </DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-100'>
              <div>
                <p className='text-muted-foreground font-semibold'>Name</p>
                <p>{viewDepartment.departmentName}</p>
              </div>
              <div>
                <p className='text-muted-foreground font-semibold'>Code</p>
                <p>{viewDepartment.departmentCode}</p>
              </div>
              <div>
                <p className='text-muted-foreground font-semibold'>City</p>
                <p>{viewDepartment.city}</p>
              </div>
              <div>
                <p className='text-muted-foreground font-semibold'>District</p>
                <p>{viewDepartment.district}</p>
              </div>
              <div>
                <p className='text-muted-foreground mt-3 font-semibold'>
                  State
                </p>
                <p>{viewDepartment.state}</p>
              </div>
              <div>
                <p className='text-muted-foreground font-semibold'>
                  Parent Department
                </p>
                <p>{viewDepartment.parentDepartmentName || '—'}</p>
              </div>
              {/* <div className='col-span-2'>
                <p className='text-muted-foreground font-semibold'>Department Id</p>
                <p>{(viewDepartment).id || '—'}</p>
              </div> */}
              <div className='col-span-2'>
                <p className='text-muted-foreground font-semibold'>
                  Department Id
                </p>

                <div className='mt-1 flex items-center justify-between gap-2 rounded-lg border bg-[var(--color-card)] px-3 py-2'>
                  <p className='min-w-0 flex-1 truncate font-mono text-sm'>
                    {viewDepartment.id || '—'}
                  </p>

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!viewDepartment.id}
                    onClick={() => copyDeptId(viewDepartment.id)}
                    className='h-8 px-2'
                  >
                    {copiedDeptId ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

interface CreateDepartmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultValues?: Partial<NewDeptForm>
}

function CreateDepartmentForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: CreateDepartmentFormProps) {
  const {
    data: parentDepartmentsResponse,
    isLoading: parentDepartmentsLoading,
  } = $api.useQuery('get', '/departments/get/dropdown', {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
      },
    },
  }) as { data: ParentDepartmentsResponse | undefined; isLoading: boolean }

  const createDepartmentMutation = $api.useMutation(
    'post',
    '/departments/create'
  )
  const updateDepartmentMutation = $api.useMutation(
    'put',
    '/departments/update/{id}'
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewDeptForm>({ defaultValues })

  useEffect(() => {
    if (open && defaultValues) {
      reset(defaultValues)
    } else if (!open) {
      reset({
        id: undefined,
        departmentName: '',
        departmentCode: '',
        district: '',
        state: '',
        city: '',
        parentDepartmentId: undefined,
      })
    }
  }, [open, defaultValues, reset])

  const onSubmit = handleSubmit((values) => {
    const token = sessionStorage.getItem('token') || ''
    const payload = {
      ...values,
      parentDepartmentId: values.parentDepartmentId || undefined,
    }

    if (values.id) {
      updateDepartmentMutation.mutate(
        {
          body: payload,
          params: {
            path: { id: values.id },
            header: { Authorization: `Bearer ${token}` },
          },
        },
        {
          onSuccess: () => {
            toast.success('Department updated successfully')
            reset()
            onSuccess()
          },
          onError: () => toast.error('Failed to update department'),
        }
      )
    } else {
      createDepartmentMutation.mutate(
        {
          body: payload,
          params: { header: { Authorization: `Bearer ${token}` } },
        },
        {
          onSuccess: (res) => {
            toast.success(res?.message || 'Department created!')
            reset()
            onSuccess()
          },
          onError: () => toast.error('Creation failed'),
        }
      )
    }
  })

  const inputFields: Array<[keyof NewDeptForm, string, string?]> = [
    ['departmentName', 'Department Name *', 'e.g., Human Resources'],
    ['departmentCode', 'Department Code *', 'e.g., HR-001'],
    ['district', 'District *', 'e.g., Central District'],
    ['state', 'State *', 'e.g., Gujarat'],
    ['city', 'City *', 'e.g., Ahmedabad'],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='default' className='text-white'>
          New Department
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
            {defaultValues?.id ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Fill in the details below. Fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>

        <form
          id='create-dept-form'
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
                  required: `${label.replace(` *`, ``)} is required.`,
                })}
                className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? `border-red-500` : ``}`}
              />
              {errors[name] && (
                <p className='pt-1 text-sm text-red-500'>
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}

          <div className='grid gap-1.5'>
            <Label htmlFor='parentDepartmentId'>
              Parent Department (Optional)
            </Label>
            <Controller
              name='parentDepartmentId'
              control={control}
              render={({ field }) => (
                <Select
                  disabled={parentDepartmentsLoading}
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <SelectTrigger>
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
            form='create-dept-form'
            disabled={isSubmitting}
            className='text-white'
          >
            {defaultValues?.id ? 'Update' : 'Save Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// import { useEffect, useMemo, useState } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createLazyFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { useCanAccess, usePermissions } from '@/hooks/use-can-access.tsx'
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
// export const Route = createLazyFileRoute('/_authenticated/admin/departements')({
//   component: RouteComponent,
// })
// type ParentDepartmentOption = {
//   id: string
//   name: string
// }
// type ParentDepartmentsResponse = {
//   status?: string
//   message?: string
//   data?: ParentDepartmentOption[]
// }
// type NewDeptForm = {
//   id?: string
//   departmentName: string
//   departmentCode: string
//   district: string
//   state: string
//   city: string
//   parentDepartmentId?: string
// }
// function RouteComponent() {
//   const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
//   const [editingDepartment, setEditingDepartment] = useState<
//     components['schemas']['DepartmentDTO'] | null
//   >(null)
//   const [viewDialogOpen, setViewDialogOpen] = useState(false)
//   const [viewDepartment, setViewDepartment] = useState<
//     components['schemas']['DepartmentDTO'] | null
//   >(null)
//   const [selectedParentDepartmentNames, setSelectedParentDepartmentNames] =
//     useState<string[]>([])
//   const [selectedCities, setSelectedCities] = useState<string[]>([])
//   const canCreate = useCanAccess('departments', 'create')
//   const [canUpdate, canDelete] = usePermissions('departments', [
//     'update',
//     'delete',
//   ])
//   const {
//     data: departmentsData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/departments/list', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//       },
//     },
//   })
//   const deleteDepartmentMutation = $api.useMutation(
//     'delete',
//     '/departments/delete/{id}'
//   )
//   const handleDelete = (deptId: string) => {
//     deleteDepartmentMutation.mutate(
//       {
//         params: {
//           path: { id: deptId },
//         },
//       },
//       {
//         onSuccess: () => {
//           toast.success('Department deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete department'),
//       }
//     )
//   }
//   // Transform departments data to include parentDepartmentName
//   const departments = departmentsData?.data || []
//   const idToNameMap = useMemo(
//     () => new Map(departments.map((dept) => [dept.id, dept.departmentName])),
//     [departments]
//   )
//   const transformedDepartments = useMemo(
//     () =>
//       departments.map((dept) => ({
//         ...dept,
//         parentDepartmentName: dept.parentDepartmentId
//           ? idToNameMap.get(dept.parentDepartmentId) || 'Unknown'
//           : 'None',
//       })),
//     [departments, idToNameMap]
//   )
//   // Compute distinct filter options
//   const distinctParentDepartmentNames = useMemo(
//     () =>
//       [
//         ...new Set(
//           transformedDepartments.map((dept) => dept.parentDepartmentName)
//         ),
//       ].sort(),
//     [transformedDepartments]
//   )
//   const distinctCities = useMemo(
//     () =>
//       [...new Set(transformedDepartments.map((dept) => dept.city))]
//         .filter((x) => x !== undefined)
//         .sort(),
//     [transformedDepartments]
//   )
//   // Filter departments based on selected filters
//   const filteredDepartments = useMemo(
//     () =>
//       transformedDepartments.filter((dept) => {
//         const parentMatch =
//           selectedParentDepartmentNames.length === 0 ||
//           selectedParentDepartmentNames.includes(dept.parentDepartmentName)
//         const cityMatch =
//           selectedCities.length === 0 ||
//           selectedCities.includes(dept.city || '')
//         return parentMatch && cityMatch
//       }),
//     [transformedDepartments, selectedParentDepartmentNames, selectedCities]
//   )
//   const isFiltered =
//     selectedParentDepartmentNames.length > 0 || selectedCities.length > 0
//   return (
//     <>
//       {/* <Header>
//         <div className='ml-auto flex items-center space-x-4'>
//           <Search />
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header> */}
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}
//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Departments
//           </h1>
//           {canCreate && (
//             <CreateDepartmentForm
//               open={isCreateDialogOpen}
//               onOpenChange={(open) => {
//                 if (!open) setEditingDepartment(null)
//                 setCreateDialogOpen(open)
//               }}
//               onSuccess={() => {
//                 setCreateDialogOpen(false)
//                 setEditingDepartment(null)
//                 refetch()
//               }}
//               defaultValues={editingDepartment || undefined}
//             />
//           )}
//         </div>
//         {/* Display Selected Filters */}
//         <div className='mb-4 flex flex-wrap gap-2'>
//           {selectedParentDepartmentNames.map((name) => (
//             <Badge key={name} variant='secondary'>
//               Parent Department: {name}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedParentDepartmentNames((prev) =>
//                     prev.filter((n) => n !== name)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedCities.map((city) => (
//             <Badge key={city} variant='secondary'>
//               City: {city}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedCities((prev) => prev.filter((c) => c !== city))
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
//                 setSelectedParentDepartmentNames([])
//                 setSelectedCities([])
//               }}
//             >
//               Clear All Filters
//             </Button>
//           )}
//         </div>
//         {filteredDepartments.length > 0 ? (
//           <PaginatedTable
//             data={filteredDepartments}
//             renderActions={(row) => (
//               <div className='flex items-center justify-end gap-2'>
//                 <ViewActionCell
//                   onClick={() => {
//                     setViewDepartment(row)
//                     setViewDialogOpen(true)
//                   }}
//                 />
//                 {canUpdate && (
//                   <EditActionCell
//                     onClick={() => {
//                       setEditingDepartment(row)
//                       setCreateDialogOpen(true)
//                     }}
//                   />
//                 )}
//                 {canDelete && (
//                   <DeleteActionCell
//                     title={`Delete “${row.departmentName}”?`}
//                     description='Delete Department'
//                     onConfirm={() => row.id && handleDelete(row.id)}
//                     isConfirming={deleteDepartmentMutation.isPending}
//                   />
//                 )}
//               </div>
//             )}
//             columns={[
//               { key: 'departmentName', label: 'Name' },
//               {
//                 key: 'departmentCode',
//                 label: 'Code',
//               },
//               { key: 'parentDepartmentName', label: 'Parent Department' },
//               { key: 'city', label: 'City' },
//               { key: 'createdBy', label: 'Created By' },
//             ]}
//             tableActions={
//               <div className='flex space-x-4'>
//                 <FilterPopover
//                   options={distinctParentDepartmentNames}
//                   selected={selectedParentDepartmentNames}
//                   onChange={setSelectedParentDepartmentNames}
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
//                 ? 'No departments match the selected filters.'
//                 : 'No departments to display at the moment.'
//             }
//           />
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 {isFiltered
//                   ? 'No departments match the selected filters.'
//                   : 'No Departments Found'}
//               </h3>
//               {!isFiltered && (
//                 <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                   Get started by creating a new department.
//                 </p>
//               )}
//             </div>
//           )
//         )}
//         {viewDepartment && (
//           <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//             <DialogContent className='max-w-xl'>
//               <DialogHeader>
//                 <DialogTitle className='text-xl font-bold'>
//                   Department Details
//                 </DialogTitle>
//                 <DialogDescription>
//                   Full information about the department
//                 </DialogDescription>
//               </DialogHeader>
//               <div className='grid grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-100'>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>Name</p>
//                   <p>{viewDepartment.departmentName}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>Code</p>
//                   <p>{viewDepartment.departmentCode}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>City</p>
//                   <p>{viewDepartment.city}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>
//                     District
//                   </p>
//                   <p>{viewDepartment.departmentName}</p>
//                   <p className='text-muted-foreground font-semibold'>State</p>
//                   <p>{viewDepartment.state}</p>
//                 </div>
//                 {/* <div>
//                   <p className='text-muted-foreground font-semibold'>
//                     Created By
//                   </p>
//                   <p>{viewDepartment.createdBy}</p>
//                 </div> */}
//                 <div className='col-span-2'>
//                   <p className='text-muted-foreground font-semibold'>
//                     Parent Department
//                   </p>
//                   <p>{viewDepartment.parentDepartmentName || '—'}</p>
//                 </div>
//               </div>
//             </DialogContent>
//           </Dialog>
//         )}
//       </>
//     </>
//   )
// }
// interface CreateDepartmentFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: () => void
//   defaultValues?: Partial<NewDeptForm>
// }
// function CreateDepartmentForm({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: CreateDepartmentFormProps) {
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
//   const createDepartmentMutation = $api.useMutation(
//     'post',
//     '/departments/create'
//   )
//   const updateDepartmentMutation = $api.useMutation(
//     'put',
//     '/departments/update/{id}'
//   )
//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<NewDeptForm>({ defaultValues })
//   useEffect(() => {
//     if (open && defaultValues) {
//       reset(defaultValues)
//     } else if (!open) {
//       reset({
//         id: undefined,
//         departmentName: '',
//         departmentCode: '',
//         district: '',
//         state: '',
//         city: '',
//         parentDepartmentId: undefined,
//       })
//     }
//   }, [open, defaultValues, reset])
//   const onSubmit = handleSubmit((values) => {
//     const token = sessionStorage.getItem('token') || ''
//     const payload = {
//       ...values,
//       parentDepartmentId: values.parentDepartmentId || undefined,
//     }
//     if (values.id) {
//       updateDepartmentMutation.mutate(
//         {
//           body: payload,
//           params: {
//             path: { id: values.id },
//             header: { Authorization: `Bearer ${token}` },
//           },
//         },
//         {
//           onSuccess: () => {
//             toast.success('Department updated successfully')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Failed to update department'),
//         }
//       )
//     } else {
//       createDepartmentMutation.mutate(
//         {
//           body: payload,
//           params: { header: { Authorization: `Bearer ${token}` } },
//         },
//         {
//           onSuccess: (res) => {
//             toast.success(res?.message || 'Department created!')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Creation failed'),
//         }
//       )
//     }
//   })
//   const inputFields: Array<[keyof NewDeptForm, string, string?]> = [
//     ['departmentName', 'Department Name *', 'e.g., Human Resources'],
//     ['departmentCode', 'Department Code *', 'e.g., HR-001'],
//     ['district', 'District *', 'e.g., Central District'],
//     ['state', 'State *', 'e.g., California'],
//     ['city', 'City *', 'e.g., Springfield'],
//   ]
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogTrigger asChild>
//         <Button size='sm' variant='default' className='text-white'>
//           New Department
//         </Button>
//       </DialogTrigger>
//       <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
//         <DialogHeader className='p-6 pb-4'>
//           <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
//             {defaultValues?.id ? 'Edit Department' : 'Create New Department'}
//           </DialogTitle>
//           <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
//             Fill in the details below. Fields marked with * are mandatory.
//           </DialogDescription>
//         </DialogHeader>
//         <form
//           id='create-dept-form'
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
//                 className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? `border-red-500` : ``}`}
//               />
//               {errors[name] && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {errors[name]?.message}
//                 </p>
//               )}
//             </div>
//           ))}
//           <div className='grid gap-1.5'>
//             <Label htmlFor='parentDepartmentId'>
//               Parent Department (Optional)
//             </Label>
//             <Controller
//               name='parentDepartmentId'
//               control={control}
//               render={({ field }) => (
//                 <Select
//                   disabled={parentDepartmentsLoading}
//                   onValueChange={field.onChange}
//                   value={field.value ?? ''}
//                 >
//                   <SelectTrigger>
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
//             form='create-dept-form'
//             disabled={isSubmitting}
//             className='text-white'
//           >
//             {defaultValues?.id ? 'Update' : 'Save Department'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// import { useEffect, useMemo, useState } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createLazyFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api.ts'
// import { useCanAccess, usePermissions } from '@/hooks/use-can-access.tsx'
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

// export const Route = createLazyFileRoute('/_authenticated/admin/departements')({
//   component: RouteComponent,
// })

// type ParentDepartmentOption = {
//   id: string
//   name: string
// }

// type ParentDepartmentsResponse = {
//   status?: string
//   message?: string
//   data?: ParentDepartmentOption[]
// }

// type NewDeptForm = {
//   id?: string
//   departmentName: string
//   departmentCode: string
//   district: string
//   state: string
//   city: string
//   parentDepartmentId?: string
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
//   filename = 'departments.csv'
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
//   filename = 'departments.xlsx'
// ): Promise<void> {
//   try {
//     const XLSX: typeof import('xlsx') = await import('xlsx')
//     const { headers } = buildRowsAndHeaders(rows)

//     // xlsx requires a mutable array
//     const mutableRows: T[] = Array.from(rows)

//     const ws = XLSX.utils.json_to_sheet(mutableRows, { header: headers })
//     const wb = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(wb, ws, 'Departments')
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
//   const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
//   const [editingDepartment, setEditingDepartment] = useState<
//     components['schemas']['DepartmentDTO'] | null
//   >(null)
//   const [viewDialogOpen, setViewDialogOpen] = useState(false)
//   const [viewDepartment, setViewDepartment] = useState<
//     components['schemas']['DepartmentDTO'] | null
//   >(null)
//   const [selectedParentDepartmentNames, setSelectedParentDepartmentNames] =
//     useState<string[]>([])
//   const [selectedCities, setSelectedCities] = useState<string[]>([])

//   const canCreate = useCanAccess('departments', 'create')
//   const [canUpdate, canDelete] = usePermissions('departments', [
//     'update',
//     'delete',
//   ])

//   const {
//     data: departmentsData,
//     isLoading,
//     refetch,
//   } = $api.useQuery('get', '/departments/list', {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//       },
//     },
//   })

//   const deleteDepartmentMutation = $api.useMutation(
//     'delete',
//     '/departments/delete/{id}'
//   )

//   const handleDelete = (deptId: string) => {
//     deleteDepartmentMutation.mutate(
//       {
//         params: {
//           path: { id: deptId },
//         },
//       },
//       {
//         onSuccess: () => {
//           toast.success('Department deleted')
//           refetch()
//         },
//         onError: () => toast.error('Could not delete department'),
//       }
//     )
//   }

//   // Source data
//   const departments = departmentsData?.data || []

//   // Build parent id -> name map
//   const idToNameMap = useMemo(
//     () => new Map(departments.map((dept) => [dept.id, dept.departmentName])),
//     [departments]
//   )

//   // Augmented type with parentDepartmentName
//   type DepartmentRow = (typeof departments)[number] & {
//     parentDepartmentName: string
//   }

//   const transformedDepartments: DepartmentRow[] = useMemo(
//     () =>
//       departments.map((dept) => ({
//         ...dept,
//         parentDepartmentName: dept.parentDepartmentId
//           ? idToNameMap.get(dept.parentDepartmentId) || 'Unknown'
//           : 'None',
//       })),
//     [departments, idToNameMap]
//   )

//   // Compute distinct filter options
//   const distinctParentDepartmentNames = useMemo(
//     () =>
//       [
//         ...new Set(
//           transformedDepartments.map((dept) => dept.parentDepartmentName)
//         ),
//       ].sort(),
//     [transformedDepartments]
//   )

//   const distinctCities = useMemo(
//     () =>
//       [...new Set(transformedDepartments.map((dept) => dept.city))]
//         .filter((x): x is string => x !== undefined)
//         .sort(),
//     [transformedDepartments]
//   )

//   // Filter departments based on selected filters
//   const filteredDepartments: DepartmentRow[] = useMemo(
//     () =>
//       transformedDepartments.filter((dept) => {
//         const parentMatch =
//           selectedParentDepartmentNames.length === 0 ||
//           selectedParentDepartmentNames.includes(dept.parentDepartmentName)
//         const cityMatch =
//           selectedCities.length === 0 ||
//           selectedCities.includes(dept.city || '')
//         return parentMatch && cityMatch
//       }),
//     [transformedDepartments, selectedParentDepartmentNames, selectedCities]
//   )

//   const isFiltered =
//     selectedParentDepartmentNames.length > 0 || selectedCities.length > 0

//   // Export handlers: export exactly what's visible in the table
//   const handleExportCSV = () => {
//     if (!filteredDepartments.length) {
//       toast.info('No data to export.')
//       return
//     }
//     exportCSV<DepartmentRow>(filteredDepartments, 'departments.csv')
//   }

//   const handleExportExcel = async () => {
//     if (!filteredDepartments.length) {
//       toast.info('No data to export.')
//       return
//     }
//     await exportExcel<DepartmentRow>(filteredDepartments, 'departments.xlsx')
//   }

//   return (
//     <>
//       <>
//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}

//         <div className='mb-2 flex items-center justify-between'>
//           <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//             Departments
//           </h1>
//           {canCreate && (
//             <CreateDepartmentForm
//               open={isCreateDialogOpen}
//               onOpenChange={(open) => {
//                 if (!open) setEditingDepartment(null)
//                 setCreateDialogOpen(open)
//               }}
//               onSuccess={() => {
//                 setCreateDialogOpen(false)
//                 setEditingDepartment(null)
//                 refetch()
//               }}
//               defaultValues={editingDepartment || undefined}
//             />
//           )}
//         </div>

//         {/* Display Selected Filters */}
//         <div className='mb-4 flex flex-wrap gap-2'>
//           {selectedParentDepartmentNames.map((name) => (
//             <Badge key={name} variant='secondary'>
//               Parent Department: {name}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedParentDepartmentNames((prev) =>
//                     prev.filter((n) => n !== name)
//                   )
//                 }
//               >
//                 ×
//               </Button>
//             </Badge>
//           ))}
//           {selectedCities.map((city) => (
//             <Badge key={city} variant='secondary'>
//               City: {city}
//               <Button
//                 variant='ghost'
//                 size='sm'
//                 className='ml-1'
//                 onClick={() =>
//                   setSelectedCities((prev) => prev.filter((c) => c !== city))
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
//                 setSelectedParentDepartmentNames([])
//                 setSelectedCities([])
//               }}
//             >
//               Clear All Filters
//             </Button>
//           )}
//         </div>

//         {filteredDepartments.length > 0 ? (
//           <PaginatedTable
//             data={filteredDepartments}
//             renderActions={(row) => (
//               <div className='flex items-center justify-end gap-2'>
//                 <ViewActionCell
//                   onClick={() => {
//                     setViewDepartment(row)
//                     setViewDialogOpen(true)
//                   }}
//                 />
//                 {canUpdate && (
//                   <EditActionCell
//                     onClick={() => {
//                       setEditingDepartment(row)
//                       setCreateDialogOpen(true)
//                     }}
//                   />
//                 )}
//                 {canDelete && (
//                   <DeleteActionCell
//                     title={`Delete “${row.departmentName}”?`}
//                     description='Delete Department'
//                     onConfirm={() => row.id && handleDelete(row.id)}
//                     isConfirming={deleteDepartmentMutation.isPending}
//                   />
//                 )}
//               </div>
//             )}
//             columns={[
//               { key: 'departmentName', label: 'Name' },
//               {
//                 key: 'departmentCode',
//                 label: 'Code',
//               },
//               { key: 'parentDepartmentName', label: 'Parent Department' },
//               { key: 'city', label: 'City' },
//               { key: 'createdBy', label: 'Created By' },
//             ]}
//             tableActions={
//               <div className='flex flex-wrap items-center gap-2'>
//                 <FilterPopover
//                   options={distinctParentDepartmentNames}
//                   selected={selectedParentDepartmentNames}
//                   onChange={setSelectedParentDepartmentNames}
//                   placeholder='Filter by Parent Department'
//                 />
//                 <FilterPopover
//                   options={distinctCities}
//                   selected={selectedCities}
//                   onChange={setSelectedCities}
//                   placeholder='Filter by City'
//                 />

//                 {/* NEW: Export buttons */}
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
//                 ? 'No departments match the selected filters.'
//                 : 'No departments to display at the moment.'
//             }
//           />
//         ) : (
//           !isLoading && (
//             <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700'>
//               <h3 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
//                 {isFiltered
//                   ? 'No departments match the selected filters.'
//                   : 'No Departments Found'}
//               </h3>
//               {!isFiltered && (
//                 <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
//                   Get started by creating a new department.
//                 </p>
//               )}
//             </div>
//           )
//         )}

//         {viewDepartment && (
//           <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//             <DialogContent className='max-w-xl'>
//               <DialogHeader>
//                 <DialogTitle className='text-xl font-bold'>
//                   Department Details
//                 </DialogTitle>
//                 <DialogDescription>
//                   Full information about the department
//                 </DialogDescription>
//               </DialogHeader>
//               <div className='grid grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-100'>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>Name</p>
//                   <p>{viewDepartment.departmentName}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>Code</p>
//                   <p>{viewDepartment.departmentCode}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>City</p>
//                   <p>{viewDepartment.city}</p>
//                 </div>
//                 <div>
//                   <p className='text-muted-foreground font-semibold'>
//                     District
//                   </p>
//                   <p>{viewDepartment.departmentName}</p>

//                   <p className='text-muted-foreground font-semibold'>State</p>
//                   <p>{viewDepartment.state}</p>
//                 </div>
//                 <div className='col-span-2'>
//                   <p className='text-muted-foreground font-semibold'>
//                     Parent Department
//                   </p>
//                   <p>{viewDepartment.parentDepartmentName || '—'}</p>
//                 </div>
//               </div>
//             </DialogContent>
//           </Dialog>
//         )}
//       </>
//     </>
//   )
// }

// interface CreateDepartmentFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: () => void
//   defaultValues?: Partial<NewDeptForm>
// }

// function CreateDepartmentForm({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: CreateDepartmentFormProps) {
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

//   const createDepartmentMutation = $api.useMutation(
//     'post',
//     '/departments/create'
//   )
//   const updateDepartmentMutation = $api.useMutation(
//     'put',
//     '/departments/update/{id}'
//   )

//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<NewDeptForm>({ defaultValues })

//   useEffect(() => {
//     if (open && defaultValues) {
//       reset(defaultValues)
//     } else if (!open) {
//       reset({
//         id: undefined,
//         departmentName: '',
//         departmentCode: '',
//         district: '',
//         state: '',
//         city: '',
//         parentDepartmentId: undefined,
//       })
//     }
//   }, [open, defaultValues, reset])

//   const onSubmit = handleSubmit((values) => {
//     const token = sessionStorage.getItem('token') || ''
//     const payload = {
//       ...values,
//       parentDepartmentId: values.parentDepartmentId || undefined,
//     }

//     if (values.id) {
//       updateDepartmentMutation.mutate(
//         {
//           body: payload,
//           params: {
//             path: { id: values.id },
//             header: { Authorization: `Bearer ${token}` },
//           },
//         },
//         {
//           onSuccess: () => {
//             toast.success('Department updated successfully')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Failed to update department'),
//         }
//       )
//     } else {
//       createDepartmentMutation.mutate(
//         {
//           body: payload,
//           params: { header: { Authorization: `Bearer ${token}` } },
//         },
//         {
//           onSuccess: (res) => {
//             toast.success(res?.message || 'Department created!')
//             reset()
//             onSuccess()
//           },
//           onError: () => toast.error('Creation failed'),
//         }
//       )
//     }
//   })

//   const inputFields: Array<[keyof NewDeptForm, string, string?]> = [
//     ['departmentName', 'Department Name *', 'e.g., Human Resources'],
//     ['departmentCode', 'Department Code *', 'e.g., HR-001'],
//     ['district', 'District *', 'e.g., Central District'],
//     ['state', 'State *', 'e.g., California'],
//     ['city', 'City *', 'e.g., Springfield'],
//   ]

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogTrigger asChild>
//         <Button size='sm' variant='default' className='text-white'>
//           New Department
//         </Button>
//       </DialogTrigger>
//       <DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl'>
//         <DialogHeader className='p-6 pb-4'>
//           <DialogTitle className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
//             {defaultValues?.id ? 'Edit Department' : 'Create New Department'}
//           </DialogTitle>
//           <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
//             Fill in the details below. Fields marked with * are mandatory.
//           </DialogDescription>
//         </DialogHeader>
//         <form
//           id='create-dept-form'
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
//                 className={`dark:border-gray-600 dark:bg-gray-700 ${errors[name] ? `border-red-500` : ``}`}
//               />
//               {errors[name] && (
//                 <p className='pt-1 text-sm text-red-500'>
//                   {errors[name]?.message}
//                 </p>
//               )}
//             </div>
//           ))}
//           <div className='grid gap-1.5'>
//             <Label htmlFor='parentDepartmentId'>
//               Parent Department (Optional)
//             </Label>
//             <Controller
//               name='parentDepartmentId'
//               control={control}
//               render={({ field }) => (
//                 <Select
//                   disabled={parentDepartmentsLoading}
//                   onValueChange={field.onChange}
//                   value={field.value ?? ''}
//                 >
//                   <SelectTrigger>
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
//             form='create-dept-form'
//             disabled={isSubmitting}
//             className='text-white'
//           >
//             {defaultValues?.id ? 'Update' : 'Save Department'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
