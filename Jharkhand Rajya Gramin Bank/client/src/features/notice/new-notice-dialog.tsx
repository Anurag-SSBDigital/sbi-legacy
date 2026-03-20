import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { components } from '@/types/api/v1.js'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { $api, BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  accountId: string
  noticeInfo: components['schemas']['NoticeInfoWithHistoryDto']
}

const NewNoticeDialog: React.FC<Props> = ({
  open,
  setOpen,
  accountId,
  noticeInfo,
}) => {
  const { name, noticeType } = noticeInfo

  const [loadingPdf, setLoadingPdf] = useState(true)
  const [issuedDate, setIssuedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )

  const [noticeTemplate, setNoticeTemplate] = useState<string>('TGB')

  const { mutateAsync, isPending } = $api.useMutation('post', '/Notice/create', {
    onSuccess: () => {
      toast.success('Notice saved successfully')
      setOpen(false)
    },
    onError: () => toast.error('Notice failed'),
  })

  const handleConfirm = async () => {
    if (!issuedDate) return toast.error('Please select an issued date')

    await mutateAsync({
      params: { header: { Authorization: '' } },
      body: {
        accountNumber: accountId,
        issuedTo: name,
        noticeType,
        noticeTemplate,
        issuedDate,
      },
    })
  }

  const previewUrl = `${BASE_URL}/Notice/preview/${accountId}?noticeTemplate=${encodeURIComponent(
    noticeTemplate
  )}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='flex max-h-[90vh] flex-col gap-4'>
        <DialogHeader>
          <DialogTitle>Generate Notice</DialogTitle>

          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <label className='mb-1 block text-sm font-medium'>Issued Date</label>
              <Input
                type='date'
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium'>
                Notice Template
              </label>
              <select
                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                value={noticeTemplate}
                onChange={(e) => {
                  setLoadingPdf(true)
                  setNoticeTemplate(e.target.value)
                }}
              >
                <option value='TGB'>Notice</option>
              </select>
            </div>
          </div>
        </DialogHeader>

        <div className='h-[60vh] overflow-y-auto rounded border'>
          <IframePdfWithAuth
            onReady={() => setLoadingPdf(false)}
            accountId={accountId}
            noticeTemplate={noticeTemplate}
            fallbackUrl={previewUrl}
          />
        </div>

        <DialogFooter>
          <Button variant='secondary' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || loadingPdf}>
            {isPending ? 'Saving…' : 'Confirm & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewNoticeDialog

function IframePdfWithAuth({
  accountId,
  noticeTemplate,
  fallbackUrl,
  onReady,
}: {
  accountId: string
  noticeTemplate: string
  fallbackUrl: string
  onReady: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const token = useMemo(() => sessionStorage.getItem('token') ?? '', [])

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)
    return url
  }

  /**
   * ✅ IMPORTANT: prevent “Type instantiation is excessively deep…”
   * by calling useMutation through a shallow, non-inferred signature.
   */
  type ShallowMutation = {
    mutateAsync: (input: unknown) => Promise<unknown>
    isPending: boolean
  }

  const useMutationShallow = $api.useMutation as unknown as (
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    options?: unknown
  ) => ShallowMutation

  const previewMutation = useMutationShallow('get', '/Notice/preview/{accountId}')

  useEffect(() => {
    let cancelled = false
    let objectUrlToRevoke: string | null = null

    const cleanup = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke)
      objectUrlToRevoke = null
    }

    const run = async () => {
      try {
        setBlobUrl(null)

        const req = {
          params: {
            path: { accountId },
            query: { noticeTemplate },
            header: { Authorization: `Bearer ${token}` },
          },
        }

        const result = await previewMutation.mutateAsync(req)

        if (cancelled) return

        if (result instanceof Blob) {
          cleanup()
          objectUrlToRevoke = downloadBlob(result)
          onReady()
          return
        }

        if (typeof result === 'string') {
          // if API returns URL string, use it directly
          cleanup()
          setBlobUrl(result || fallbackUrl)
          onReady()
          return
        }

        // fallback
        cleanup()
        setBlobUrl(fallbackUrl)
        onReady()
      } catch {
        if (cancelled) return
        cleanup()
        setBlobUrl(fallbackUrl)
        onReady()
      }
    }

    run()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [accountId, noticeTemplate, token, fallbackUrl, onReady])

  if (!blobUrl) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='text-muted-foreground animate-spin' size={32} />
      </div>
    )
  }

  return (
    <iframe
      src={blobUrl}
      title='PDF Viewer'
      className='h-full w-full'
      style={{ border: 'none' }}
    />
  )
}



// import React, { useEffect, useState } from 'react'
// import { format } from 'date-fns'
// import { components } from '@/types/api/v1.js'
// import { Loader2 } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api, BASE_URL } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'

// interface Props {
//   open: boolean
//   setOpen: (o: boolean) => void
//   accountId: string
//   noticeInfo: components['schemas']['NoticeInfoWithHistoryDto']
// }

// const NewNoticeDialog: React.FC<Props> = ({
//   open,
//   setOpen,
//   accountId,
//   noticeInfo,
// }) => {
//   const { name, noticeType } = noticeInfo

//   const [loadingPdf, setLoadingPdf] = useState(true)
//   const [issuedDate, setIssuedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

//   // ✅ NEW state
//   // const [noticeTemplate, setNoticeTemplate] = useState<string>('TEMPLATE_1')
//   const [noticeTemplate, setNoticeTemplate] = useState<string>('1st')


//   const { mutateAsync, isPending } = $api.useMutation('post', '/Notice/create', {
//     onSuccess: () => {
//       toast.success('Notice saved successfully')
//       setOpen(false)
//     },
//     onError: () => toast.error('Notice failed'),
//   })

//   const handleConfirm = async () => {
//     if (!issuedDate) return toast.error('Please select an issued date')

//     await mutateAsync({
//       params: { header: { Authorization: '' } },
//       body: {
//         accountNumber: accountId,
//         issuedTo: name,
//         noticeType,
//         noticeTemplate, // ✅ NEW
//         issuedDate,
//       },
//     })
//   }

//   const previewUrl = `${BASE_URL}/Notice/preview/${accountId}?noticeTemplate=${encodeURIComponent(
//     noticeTemplate
//   )}`

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className='flex max-h-[90vh] flex-col gap-4'>
//         <DialogHeader>
//           <DialogTitle>Generate Notice</DialogTitle>

//           <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
//             <div>
//               <label className='mb-1 block text-sm font-medium'>Issued Date</label>
//               <Input type='date' value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
//             </div>

//             <div>
//               <label className='mb-1 block text-sm font-medium'>Notice Template</label>
//               <select
//                 className='h-10 w-full rounded-md border bg-background px-3 text-sm'
//                 value={noticeTemplate}
//                 onChange={(e) => {
//                   setLoadingPdf(true)
//                   setNoticeTemplate(e.target.value)
//                 }}
//               >
//                 <option value='1st'>1st Notice</option>
//                 <option value='2nd'>2nd Notice</option>
//                 <option value='3rd'>3rd Notice</option>
//                 <option value='Last'>Last Notice</option>
//               </select>
//             </div>
//           </div>
//         </DialogHeader>

//         <div className='h-[60vh] overflow-y-auto rounded border'>
//           <IframePdfWithAuth
//             onReady={() => setLoadingPdf(false)}
//             pdfUrl={previewUrl}
//           />
//         </div>

//         <DialogFooter>
//           <Button variant='secondary' onClick={() => setOpen(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleConfirm} disabled={isPending || loadingPdf}>
//             {isPending ? 'Saving…' : 'Confirm & Save'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// export default NewNoticeDialog

// function IframePdfWithAuth({
//   pdfUrl,
//   onReady,
// }: {
//   pdfUrl: string
//   onReady: () => void
// }) {
//   const [blobUrl, setBlobUrl] = useState<string | null>(null)

//   useEffect(() => {
//     let url: string | undefined
//     let cancelled = false

//     const fetchPdf = async () => {
//       try {
//         setBlobUrl(null)

//         const response = await fetch(pdfUrl, {
//           headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
//         })
//         const blob = await response.blob()
//         if (cancelled) return

//         url = URL.createObjectURL(blob)
//         setBlobUrl(url)
//         onReady()
//       } catch {
//         onReady()
//       }
//     }

//     fetchPdf()

//     return () => {
//       cancelled = true
//       if (url) URL.revokeObjectURL(url)
//     }
//   }, [pdfUrl, onReady])

//   if (!blobUrl) {
//     return (
//       <div className='flex h-full items-center justify-center'>
//         <Loader2 className='text-muted-foreground animate-spin' size={32} />
//       </div>
//     )
//   }

//   return <iframe src={blobUrl} title='PDF Viewer' className='h-full w-full' style={{ border: 'none' }} />
// }







// import React, { useEffect, useState } from 'react'
// import { format } from 'date-fns'
// import { components } from '@/types/api/v1.js'
// import { Loader2 } from 'lucide-react'
// import { toast } from 'sonner'
// import { $api, BASE_URL } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'

// // <-- spinner icon

// interface Props {
//   open: boolean
//   setOpen: (o: boolean) => void
//   accountId: string
//   noticeInfo: components['schemas']['NoticeInfoWithHistoryDto']
// }

// const NewNoticeDialog: React.FC<Props> = ({
//   open,
//   setOpen,
//   accountId,
//   noticeInfo,
// }) => {
//   const { name, noticeType } = noticeInfo

//   const [loadingPdf, setLoadingPdf] = useState(true)
//   const [issuedDate, setIssuedDate] = useState<string>(
//     format(new Date(), 'yyyy-MM-dd')
//   )

//   const { mutateAsync, isPending } = $api.useMutation(
//     'post',
//     '/Notice/create',
//     {
//       onSuccess: () => {
//         toast.success('Notice saved successfully')
//         setOpen(false)
//       },
//       onError: () => {
//         toast.error('Notice failed')
//       },
//     }
//   )

//   const handleConfirm = async () => {
//     if (!issuedDate) {
//       toast.error('Please select an issued date')
//       return
//     }

//     await mutateAsync({
//       params: { header: { Authorization: '' } },
//       body: {
//         accountNumber: accountId,
//         issuedTo: name,
//         noticeType,
//         issuedDate,
//       },
//     })
//   }

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       {/* flex-column keeps header and footer in place */}
//       <DialogContent className='flex max-h-[90vh] flex-col gap-4'>
//         {/* ------- header -------- */}
//         <DialogHeader>
//           <DialogTitle>Generate Notice</DialogTitle>
//           <div className='flex flex-row justify-end'>
//             <div>
//               <label className='mb-1 block text-sm font-medium'>
//                 Issued Date
//               </label>
//               <Input
//                 type='date'
//                 value={issuedDate}
//                 onChange={(e) => setIssuedDate(e.target.value)}
//               />
//             </div>
//           </div>
//         </DialogHeader>

//         {/* ------- PDF area (fixed height, scrollable) -------- */}
//         <div className='h-[60vh] overflow-y-auto rounded border'>
//           <IframePdfWithAuth
//             onReady={() => setLoadingPdf(false)}
//             pdfUrl={`${BASE_URL}/Notice/preview/${accountId}`}
//           />
//         </div>

//         {/* ------- footer -------- */}
//         <DialogFooter>
//           <Button variant='secondary' onClick={() => setOpen(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleConfirm} disabled={isPending || loadingPdf}>
//             {isPending ? 'Saving…' : 'Confirm & Save'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// export default NewNoticeDialog

// /* --------------------------------------------------------- */
// /* Iframe with elegant loader                                */
// /* --------------------------------------------------------- */
// function IframePdfWithAuth({
//   pdfUrl,
//   onReady,
// }: {
//   pdfUrl: string
//   onReady: () => void
// }) {
//   const [blobUrl, setBlobUrl] = useState<string | null>(null)

//   useEffect(() => {
//     let url: string

//     const fetchPdf = async () => {
//       const response = await fetch(pdfUrl, {
//         headers: {
//           Authorization: `Bearer ${sessionStorage.getItem('token')}`,
//         },
//       })
//       const blob = await response.blob()
//       url = URL.createObjectURL(blob)
//       setBlobUrl(url)
//       onReady()
//     }

//     fetchPdf()

//     return () => {
//       if (url) URL.revokeObjectURL(url)
//     }
//   }, [pdfUrl, onReady])

//   if (!blobUrl) {
//     /* modern centred spinner */
//     return (
//       <div className='flex h-full items-center justify-center'>
//         <Loader2 className='text-muted-foreground animate-spin' size={32} />
//       </div>
//     )
//   }

//   return (
//     <iframe
//       src={blobUrl}
//       title='PDF Viewer'
//       className='h-full w-full'
//       style={{ border: 'none' }}
//     />
//   )
// }
