import React, { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { toastError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { DateCell, StatusCell } from '@/components/table/cells.ts'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/advocate/')({
  component: RouteComponent,
})

/* ---------------- safe helpers ---------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function pickBlob(res: unknown): Blob | null {
  if (typeof Blob !== 'undefined' && res instanceof Blob) return res
  if (isRecord(res) && typeof Blob !== 'undefined' && res.data instanceof Blob)
    return res.data
  return null
}

/**
 * ✅ Shallow mutation wrapper:
 * still $api.useMutation, but avoids OpenAPI type explosions for non-json/binary endpoints.
 */
type ShallowMutationResult = {
  mutate: (input: unknown) => void
  mutateAsync: (input: unknown) => Promise<unknown>
  isPending?: boolean
}
const useMutationShallow = $api.useMutation as unknown as (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  opts?: unknown
) => ShallowMutationResult

function RouteComponent() {
  const token = sessionStorage.getItem('token') || ''

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    data,
    isLoading,
    isError,
    refetch: refreshData,
  } = $api.useQuery('get', '/legal/events/by-username', {
    params: {
      header: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const events = data?.data ?? []

  const transformedData = events.map((item) => ({
    ...item,
    id: item?.event?.id,
    eventType: item?.event?.eventType,
    accountNo: item?.event?.accountNo,
    customerName: item.borrowerDetails?.custName ?? '—',
    outstanding: item.borrowerDetails?.outstand ?? 0,
    createdAt: item?.event?.createdAt,
    dueDate: item.assignment?.dueDate ?? '—',
    status: item.assignment?.status ?? '—',
    branchCode: item.borrowerDetails?.branchCode ?? '—',
    address: [
      item.borrowerDetails?.add1,
      item.borrowerDetails?.add2,
      item.borrowerDetails?.add3,
      item.borrowerDetails?.add4,
    ]
      .filter(Boolean)
      .join(', '),
  }))

  const [selectedEvent, setSelectedEvent] = useState<
    (typeof transformedData)[number] | null
  >(null)

  /* =========================
     Upload Documents Mutation
     POST /legal/events/upload-documents
     ========================= */
  const uploadDocsMutation = useMutationShallow(
    'post',
    '/legal/events/upload-documents',
    {
      onSuccess: () => {
        toast.success('Documents submitted successfully!')
        setFiles([])
        setSubmitDialogOpen(false)
        void refreshData()
      },
      onError: (e: unknown) => {
        toastError(e, 'Upload failed. Please try again.')
      },
    }
  )

  /* =========================
     Download ZIP Mutation (Blob)
     GET /legal/events/{eventId}/download-documents
     ========================= */
  const downloadZipMutation = useMutationShallow(
    'get',
    '/legal/events/{eventId}/download-documents'
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast.error('Please upload at least one file.')
      return
    }

    if (!selectedEvent?.accountNo) {
      toast.error('No event selected.')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const assignmentId = selectedEvent?.assignment?.id
    if (assignmentId !== undefined && assignmentId !== null) {
      formData.append('assignmentId', String(assignmentId))
    }

    try {
      await uploadDocsMutation.mutateAsync({
        // IMPORTANT: do NOT set Content-Type for FormData
        params: {
          header: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        },
        body: formData,
      })
    } catch {
      // handled by onError
    }
  }

  const handleDownload = async (eventId: number) => {
    try {
      const res = await downloadZipMutation.mutateAsync({
        params: {
          path: { eventId },
          header: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        },
        // many openapi clients support this; harmless if ignored
        parseAs: 'blob',
      } as unknown)

      const blob = pickBlob(res)
      if (!blob) {
        toast.error('Failed to download document.')
        return
      }

      const filename = `event-${eventId}.zip`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Download started.')
    } catch (err) {
      toastError(err, 'Failed to download document.')
    }
  }

  const columns: PaginatedTableProps<
    (typeof transformedData)[number]
  >['columns'] = [
    { key: 'eventType', label: 'Event Type' },
    { key: 'accountNo', label: 'Account No' },
    { key: 'customerName', label: 'Customer Name' },
    {
      key: 'createdAt',
      label: 'Created On',
      render: (v) => <DateCell value={v} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusCell value={value as 'COMPLETED' | 'PENDING'} />
      ),
    },
    {
      key: 'status',
      label: 'Actions',
      render: (_, row) => (
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setSelectedEvent(row)
              setViewDialogOpen(true)
            }}
          >
            View
          </Button>

          {row.assignment?.status === 'PENDING' && (
            <Button
              size='sm'
              onClick={() => {
                setSelectedEvent(row)
                setSubmitDialogOpen(true)
              }}
            >
              Submit Document
            </Button>
          )}

          {row.assignment?.status === 'COMPLETED' && (
            <Button
              size='sm'
              disabled={!row.id || !!downloadZipMutation.isPending}
              onClick={() => row.id && handleDownload(row.id)}
            >
              {downloadZipMutation.isPending
                ? 'Downloading…'
                : 'Download Document'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='px-4 py-2'>
        <h1 className='mb-6 text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Assigned Legal Events
        </h1>

        {isLoading && (
          <LoadingBar progress={70} className='h-1' color='#2563eb' />
        )}

        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-24 w-full rounded-md' />
            ))}
          </div>
        ) : isError ? (
          <div className='mb-6 rounded-lg bg-red-100 p-4 text-red-800'>
            Failed to load legal events. Please try again later.
          </div>
        ) : (
          <PaginatedTable
            data={transformedData}
            columns={columns}
            emptyMessage='No legal events assigned to you.'
          />
        )}

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className='max-h-[85vh] max-w-4xl overflow-y-auto p-6'>
            <DialogHeader>
              <DialogTitle className='text-xl font-bold'>
                Event Details
              </DialogTitle>
            </DialogHeader>

            {selectedEvent && (
              <div className='space-y-8 text-sm'>
                <section>
                  <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
                    Event Information
                  </h3>
                  <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                    <div>
                      <strong>Event Type:</strong> {selectedEvent.eventType}
                    </div>
                    <div>
                      <strong>Account No:</strong> {selectedEvent.accountNo}
                    </div>
                    <div>
                      <strong>Created On:</strong>{' '}
                      {new Date(selectedEvent.createdAt ?? '').toLocaleString()}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedEvent.status}
                    </div>
                  </div>
                </section>

                {selectedEvent.assignment && (
                  <section>
                    <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
                      Assignment Information
                    </h3>
                    <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                      <div>
                        <strong>Due Date:</strong>{' '}
                        {selectedEvent.assignment.dueDate}
                      </div>
                      <div>
                        <strong>Assigned By:</strong>{' '}
                        {selectedEvent.assignment.assignedBy}
                      </div>
                      <div>
                        <strong>Assigned At:</strong>{' '}
                        {new Date(
                          selectedEvent.assignment.assignedAt ?? ''
                        ).toLocaleString()}
                      </div>
                    </div>
                  </section>
                )}

                {selectedEvent.borrowerDetails && (
                  <section>
                    <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
                      Borrower Details
                    </h3>
                    <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                      <div>
                        <strong>Name:</strong>{' '}
                        {selectedEvent.borrowerDetails.custName}
                      </div>
                      <div>
                        <strong>Phone:</strong>{' '}
                        {selectedEvent.borrowerDetails.telNo}
                      </div>
                      <div className='col-span-2'>
                        <strong>Address:</strong>{' '}
                        {[
                          selectedEvent.borrowerDetails.add1,
                          selectedEvent.borrowerDetails.add2,
                          selectedEvent.borrowerDetails.add3,
                          selectedEvent.borrowerDetails.add4,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </section>
                )}

                {selectedEvent.branchDetails && (
                  <section>
                    <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
                      Branch Details
                    </h3>
                    <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                      <div>
                        <strong>Branch Name:</strong>{' '}
                        {selectedEvent.branchDetails.branchName}
                      </div>
                      <div>
                        <strong>Branch Code:</strong>{' '}
                        {selectedEvent.branchDetails.branchCode}
                      </div>
                      <div>
                        <strong>Department:</strong>{' '}
                        {selectedEvent.branchDetails.departmentName}
                      </div>
                      <div>
                        <strong>District:</strong>{' '}
                        {selectedEvent.branchDetails.district}
                      </div>
                      <div>
                        <strong>State:</strong>{' '}
                        {selectedEvent.branchDetails.state}
                      </div>
                      <div>
                        <strong>City:</strong>{' '}
                        {selectedEvent.branchDetails.city}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Submit Dialog */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className='max-w-lg rounded-2xl p-8 shadow-xl'>
            <DialogHeader>
              <DialogTitle className='mb-2 text-2xl leading-snug font-semibold'>
                Submit Documents
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className='mt-4 space-y-8'>
              <div>
                <Label
                  htmlFor='doc'
                  className='mb-2 block text-sm leading-6 font-medium'
                >
                  Upload Documents
                </Label>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => inputRef.current?.click()}
                  className='flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-center text-sm transition-all hover:bg-gray-100'
                >
                  <p className='select-none'>
                    Drag & drop files here or{' '}
                    <span className='underline'>click to select</span>
                  </p>
                  <input
                    ref={inputRef}
                    id='doc'
                    type='file'
                    multiple
                    className='hidden'
                    onChange={handleFileSelect}
                  />
                </div>

                {files.length > 0 && (
                  <ul className='mt-5 space-y-2 border-t pt-4'>
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                      >
                        <span className='truncate'>{file.name}</span>
                        <button
                          type='button'
                          onClick={() => handleRemove(index)}
                          className='ml-4 text-xs underline hover:opacity-80'
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter className='pt-2'>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={uploadDocsMutation.isPending}
                >
                  {uploadDocsMutation.isPending ? 'Submitting…' : 'Submit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}

// import { useRef, useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { $api } from '@/lib/api'
// import { toastError } from '@/lib/utils.ts'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Label } from '@/components/ui/label'
// import { Skeleton } from '@/components/ui/skeleton'
// import { Header } from '@/components/layout/header'
// import { Main } from '@/components/layout/main'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import { ProfileDropdown } from '@/components/profile-dropdown'
// import { DateCell, StatusCell } from '@/components/table/cells.ts'
// import { ThemeSwitch } from '@/components/theme-switch'

// export const Route = createFileRoute('/_authenticated/advocate/')({
//   component: RouteComponent,
// })

// function RouteComponent() {
//   const token = sessionStorage.getItem('token') || ''

//   const [viewDialogOpen, setViewDialogOpen] = useState(false)
//   const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
//   const [files, setFiles] = useState<File[]>([])
//   const inputRef = useRef<HTMLInputElement>(null)

//   const {
//     data,
//     isLoading,
//     isError,
//     refetch: refreshData,
//   } = $api.useQuery('get', '/legal/events/by-username', {
//     params: {
//       header: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   })

//   const events = data?.data ?? []

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selected = Array.from(e.target.files || [])
//     setFiles((prev) => [...prev, ...selected])
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     const droppedFiles = Array.from(e.dataTransfer.files)
//     setFiles((prev) => [...prev, ...droppedFiles])
//   }

//   const handleRemove = (index: number) => {
//     setFiles((prev) => prev.filter((_, i) => i !== index))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (files.length === 0) {
//       toast.error('Please upload at least one file.')
//       return
//     }

//     if (!selectedEvent?.accountNo) {
//       toast.error('No event selected.')
//       return
//     }

//     const formData = new FormData()
//     files.forEach((file) => {
//       formData.append('files', file)
//     })
//     if (selectedEvent?.assignment?.id) {
//       formData.append('assignmentId', selectedEvent?.assignment?.id?.toString())
//     }

//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_APP_API_URL}/legal/events/upload-documents`,
//         {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: formData,
//         }
//       )

//       if (!response.ok) {
//         throw new Error(`Server responded with ${response.status}`)
//       }

//       toast.success('Documents submitted successfully!')
//       setFiles([])
//       setSubmitDialogOpen(false)
//       refreshData()
//     } catch (err) {
//       toastError(err, 'Upload failed. Please try again.')
//     }
//   }

//   const handleDownload = async (eventId: number) => {
//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_APP_API_URL}/legal/events/${eventId}/download-documents`,
//         {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       )

//       if (!response.ok) {
//         throw new Error(`Failed to download file. Status: ${response.status}`)
//       }

//       const blob = await response.blob()
//       const contentDisposition = response.headers.get('Content-Disposition')
//       const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/)
//       const filename = filenameMatch ? filenameMatch[1] : `event-${eventId}.zip`

//       const url = window.URL.createObjectURL(blob)
//       const link = document.createElement('a')
//       link.href = url
//       link.download = filename
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)
//       window.URL.revokeObjectURL(url)

//       toast.success('Download started.')
//     } catch {
//       // console.error('Download error:', error)
//       toast.error('Failed to download document.')
//     }
//   }

//   const transformedData = events.map((item) => ({
//     ...item,
//     id: item?.event?.id,
//     eventType: item?.event?.eventType,
//     accountNo: item?.event?.accountNo,
//     customerName: item.borrowerDetails?.custName ?? '—',
//     outstanding: item.borrowerDetails?.outstand ?? 0,
//     createdAt: item?.event?.createdAt,
//     dueDate: item.assignment?.dueDate ?? '—',
//     status: item.assignment?.status ?? '—',
//     branchCode: item.borrowerDetails?.branchCode ?? '—',
//     address: [
//       item.borrowerDetails?.add1,
//       item.borrowerDetails?.add2,
//       item.borrowerDetails?.add3,
//       item.borrowerDetails?.add4,
//     ]
//       .filter(Boolean)
//       .join(', '),
//   }))

//   const [selectedEvent, setSelectedEvent] = useState<
//     (typeof transformedData)[number] | null
//   >(null)

//   const columns: PaginatedTableProps<
//     (typeof transformedData)[number]
//   >['columns'] = [
//     { key: 'eventType', label: 'Event Type' },
//     { key: 'accountNo', label: 'Account No' },
//     { key: 'customerName', label: 'Customer Name' },
//     {
//       key: 'createdAt',
//       label: 'Created On',
//       render: (v) => <DateCell value={v} />,
//     },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (value) => (
//         <StatusCell value={value as 'COMPLETED' | 'PENDING'} />
//       ),
//     },

//     {
//       key: 'status',
//       label: 'Actions',
//       render: (_, row) => (
//         <div className='flex gap-2'>
//           <Button
//             variant='outline'
//             size='sm'
//             onClick={() => {
//               setSelectedEvent(row)
//               setViewDialogOpen(true)
//             }}
//           >
//             View
//           </Button>

//           {row.assignment?.status === 'PENDING' && (
//             <Button
//               size='sm'
//               onClick={() => {
//                 setSelectedEvent(row)
//                 setSubmitDialogOpen(true)
//               }}
//             >
//               Submit Document
//             </Button>
//           )}

//           {row.assignment?.status === 'COMPLETED' && (
//             <Button size='sm' onClick={() => row.id && handleDownload(row.id)}>
//               Download Document
//             </Button>
//           )}
//         </div>
//       ),
//     },
//   ]

//   return (
//     <>
//       <Header>
//         <div className='ml-auto flex items-center space-x-4'>
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header>

//       <Main className='px-4 py-2'>
//         <h1 className='mb-6 text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//           Assigned Legal Events
//         </h1>

//         {isLoading && (
//           <LoadingBar progress={70} className='h-1' color='#2563eb' />
//         )}

//         {isLoading ? (
//           <div className='space-y-4'>
//             {[...Array(3)].map((_, i) => (
//               <Skeleton key={i} className='h-24 w-full rounded-md' />
//             ))}
//           </div>
//         ) : isError ? (
//           <div className='mb-6 rounded-lg bg-red-100 p-4 text-red-800'>
//             Failed to load legal events. Please try again later.
//           </div>
//         ) : (
//           <PaginatedTable
//             data={transformedData}
//             columns={columns}
//             emptyMessage='No legal events assigned to you.'
//           />
//         )}

//         <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//           <DialogContent className='max-h-[85vh] max-w-4xl overflow-y-auto p-6'>
//             <DialogHeader>
//               <DialogTitle className='text-xl font-bold'>
//                 Event Details
//               </DialogTitle>
//             </DialogHeader>

//             {selectedEvent && (
//               <div className='space-y-8 text-sm'>
//                 {/* Event Info */}
//                 <section>
//                   <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
//                     Event Information
//                   </h3>
//                   <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
//                     <div>
//                       <strong>Event Type:</strong> {selectedEvent.eventType}
//                     </div>
//                     <div>
//                       <strong>Account No:</strong> {selectedEvent.accountNo}
//                     </div>
//                     <div>
//                       <strong>Created On:</strong>{' '}
//                       {new Date(selectedEvent.createdAt ?? '').toLocaleString()}
//                     </div>
//                     <div>
//                       <strong>Status:</strong> {selectedEvent.status}
//                     </div>
//                   </div>
//                 </section>

//                 {/* Assignment Info */}
//                 {selectedEvent.assignment && (
//                   <section>
//                     <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
//                       Assignment Information
//                     </h3>
//                     <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
//                       <div>
//                         <strong>Due Date:</strong>{' '}
//                         {selectedEvent.assignment.dueDate}
//                       </div>
//                       <div>
//                         <strong>Assigned By:</strong>{' '}
//                         {selectedEvent.assignment.assignedBy}
//                       </div>
//                       <div>
//                         <strong>Assigned At:</strong>{' '}
//                         {new Date(
//                           selectedEvent?.assignment?.assignedAt ?? ''
//                         ).toLocaleString()}
//                       </div>
//                     </div>
//                   </section>
//                 )}

//                 {/* Borrower Info */}
//                 {selectedEvent.borrowerDetails && (
//                   <section>
//                     <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
//                       Borrower Details
//                     </h3>
//                     <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
//                       <div>
//                         <strong>Name:</strong>{' '}
//                         {selectedEvent.borrowerDetails.custName}
//                       </div>
//                       <div>
//                         <strong>Phone:</strong>{' '}
//                         {selectedEvent.borrowerDetails.telNo}
//                       </div>
//                       <div className='col-span-2'>
//                         <strong>Address:</strong>{' '}
//                         {[
//                           selectedEvent.borrowerDetails.add1,
//                           selectedEvent.borrowerDetails.add2,
//                           selectedEvent.borrowerDetails.add3,
//                           selectedEvent.borrowerDetails.add4,
//                         ]
//                           .filter(Boolean)
//                           .join(', ')}
//                       </div>
//                     </div>
//                   </section>
//                 )}

//                 {/* Branch Info */}
//                 {selectedEvent.branchDetails && (
//                   <section>
//                     <h3 className='mb-4 border-b pb-1 text-base font-semibold'>
//                       Branch Details
//                     </h3>
//                     <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
//                       <div>
//                         <strong>Branch Name:</strong>{' '}
//                         {selectedEvent.branchDetails.branchName}
//                       </div>
//                       <div>
//                         <strong>Branch Code:</strong>{' '}
//                         {selectedEvent.branchDetails.branchCode}
//                       </div>
//                       <div>
//                         <strong>Department:</strong>{' '}
//                         {selectedEvent.branchDetails.departmentName}
//                       </div>
//                       <div>
//                         <strong>District:</strong>{' '}
//                         {selectedEvent.branchDetails.district}
//                       </div>
//                       <div>
//                         <strong>State:</strong>{' '}
//                         {selectedEvent.branchDetails.state}
//                       </div>
//                       <div>
//                         <strong>City:</strong>{' '}
//                         {selectedEvent.branchDetails.city}
//                       </div>
//                     </div>
//                   </section>
//                 )}
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>

//         <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
//           <DialogContent className='max-w-lg rounded-2xl p-8 shadow-xl'>
//             <DialogHeader>
//               <DialogTitle className='mb-2 text-2xl leading-snug font-semibold'>
//                 Submit Documents
//               </DialogTitle>
//             </DialogHeader>

//             <form onSubmit={handleSubmit} className='mt-4 space-y-8'>
//               {/* Upload Label */}
//               <div>
//                 <Label
//                   htmlFor='doc'
//                   className='mb-2 block text-sm leading-6 font-medium'
//                 >
//                   Upload Documents
//                 </Label>

//                 {/* Dropzone */}
//                 <div
//                   onDrop={handleDrop}
//                   onDragOver={(e) => e.preventDefault()}
//                   onClick={() => inputRef.current?.click()}
//                   className='flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-center text-sm transition-all hover:bg-gray-100'
//                 >
//                   <p className='select-none'>
//                     Drag & drop files here or{' '}
//                     <span className='underline'>click to select</span>
//                   </p>
//                   <input
//                     ref={inputRef}
//                     id='doc'
//                     type='file'
//                     multiple
//                     className='hidden'
//                     onChange={handleFileSelect}
//                   />
//                 </div>

//                 {/* File List */}
//                 {files.length > 0 && (
//                   <ul className='mt-5 space-y-2 border-t pt-4'>
//                     {files.map((file, index) => (
//                       <li
//                         key={index}
//                         className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
//                       >
//                         <span className='truncate'>{file.name}</span>
//                         <button
//                           type='button'
//                           onClick={() => handleRemove(index)}
//                           className='ml-4 text-xs underline hover:opacity-80'
//                         >
//                           Remove
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* Submit Button */}
//               <DialogFooter className='pt-2'>
//                 <Button type='submit' className='w-full'>
//                   Submit
//                 </Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </Main>
//     </>
//   )
// }
