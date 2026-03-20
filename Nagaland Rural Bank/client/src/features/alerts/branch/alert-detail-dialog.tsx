/* ------------------------------------------------------------------ */
/* components/alerts/alert-details-dialog.tsx                         */
/* ------------------------------------------------------------------ */
import React from 'react'
import { components } from '@/types/api/v1.js'
import { Download, History, Loader2, Eye } from 'lucide-react'
import { $api, BASE_URL } from '@/lib/api.ts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { AccountNoCell } from '@/components/table/cells'

/* ----------------------------- helpers ---------------------------- */
const fmtDate = (d?: string | number) =>
  d ? new Date(d).toLocaleString('en-IN') : '—'

const fmtINR = (n?: number) =>
  typeof n === 'number'
    ? n.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
    : '—'

/* status → Tailwind colour classes (light + dark mode) */
const statusClasses: Record<string, string> = {
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  RESOLVED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
}

const buildDocUrls = (resolutionId?: number, name?: string) => {
  const safeId = resolutionId ?? 0
  const encoded = encodeURIComponent(name ?? '')
  return {
    preview: `${BASE_URL}/alert/resolutions/${safeId}/documents/preview?name=${encoded}`,
    download: `${BASE_URL}/alert/resolutions/${safeId}/documents/downloadByName?name=${encoded}`,
  }
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* --------------------------- component ---------------------------- */
export const AlertDetailsDialog = ({
  loading,
  account,
  onClose,
  alertType,
}: {
  loading: boolean
  account: components['schemas']['AlertDetailDTO'] | undefined
  onClose: () => void
  alertType: 'EWS' | 'FRM'
}) => {
  const alertDetails = account

  const resolutionId = alertDetails?.resolutionId ?? 0
  const alertId = alertDetails?.alertId ?? 0

  /* -------------------------- RESOLUTION HISTORY -------------------------- */
  const {
    data: historyRes,
    isLoading: historyLoading,
    error: historyError,
  } = $api.useQuery(
    'get',
    '/alert/resolutions/{resolutionId}/history',
    { params: { path: { resolutionId } } },
    { enabled: Boolean(alertDetails?.resolutionId) }
  )

  /* -------------------------- TRANSACTIONS -------------------------- */
  const {
    data: transactionData,
    isLoading: transactionLoading,
    error: transactionError,
  } = $api.useQuery(
    'get',
    alertType === 'FRM'
      ? '/api/frm/general/alerts/{alertId}/transactions'
      : '/api/alerts/{alertId}/transactions',
    {
      params: {
        path: { alertId },
        header: { Authorization: '' },
      },
    },
    { enabled: Boolean(alertDetails?.transactional && alertDetails?.alertId) }
  )

  /* -------------------------- UPLOADED DOCS LIST -------------------------- */
  const {
    data: uploadedRes,
    isLoading: docsLoading,
    error: docsError,
  } = $api.useQuery(
    'get',
    '/alert/resolutions/{resolutionId}/documents',
    { params: { path: { resolutionId } } },
    { enabled: Boolean(alertDetails?.resolutionId) }
  )

  /* --------------------- DOWNLOAD ALL ZIP (NO fetch) --------------------- */
  /**
   * IMPORTANT:
   * Your OpenAPI should define this endpoint as a binary response (Blob).
   * Then the generated client typically types `data` as Blob automatically.
   */
  const downloadZipMutation = $api.useMutation(
    'get',
    '/alert/resolutions/{resolutionId}/documents/download'
  )

  const handleDownloadDocuments = async () => {
    if (!alertDetails?.resolutionId) return
    try {
      const res = await downloadZipMutation.mutateAsync({
        params: { path: { resolutionId: alertDetails.resolutionId } },
      })

      // Assumes OpenAPI marks response as binary and the client returns Blob here.
      const blob = res as unknown as Blob
      downloadBlob(
        blob,
        `resolution_${alertDetails.resolutionId}_documents.zip`
      )
    } catch {
      /* toast / notifier here */
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='rounded-xl border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md'
        >
          View Details
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[95vh] max-w-2xl overflow-auto rounded-2xl border bg-white shadow-xl sm:max-w-5xl dark:bg-gray-900'>
        <DialogHeader className='border-b border-gray-200 pb-4 dark:border-gray-800'>
          <DialogTitle className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
            🔍 Alert Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='text-primary mr-2 h-6 w-6 animate-spin' />
            <span className='text-gray-600 dark:text-gray-300'>Loading…</span>
          </div>
        ) : !alertDetails ? (
          <p className='py-10 text-center text-gray-500 dark:text-gray-300'>
            No details available.
          </p>
        ) : (
          <>
            {/* ---------- FACT SHEET ---------- */}
            <section className='mt-4 grid grid-cols-1 gap-x-2 gap-y-1 text-sm leading-relaxed sm:grid-cols-3'>
              <Detail
                label='Account No'
                value={<AccountNoCell value={String(alertDetails.accountNo)} />}
              />
              <Detail label='Customer Name' value={alertDetails.customerName} />
              <Detail
                label='Alert Description'
                value={alertDetails.masterDescription}
              />
              <Detail label='Alert Date' value={fmtDate(alertDetails.alertDate)} />
              <Detail label='Reason' value={alertDetails.alertReason} span={2} />
              <Detail
                label='Status'
                value={
                  <Badge
                    className={`rounded-full border-0 px-3 py-1 text-sm shadow-sm ${alertDetails.status ? statusClasses[alertDetails.status] : ''
                      }`}
                  >
                    {alertDetails.status}
                  </Badge>
                }
              />
            </section>

            <Separator />

            {/* ---------- RESOLUTION HISTORY (Table View) ---------- */}
            {alertDetails.resolutionId && (
              <section className='rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    <History className='text-primary h-5 w-5' /> Resolution History
                  </h3>
                </div>

                {historyLoading ? (
                  <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
                    <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
                    Loading history…
                  </div>
                ) : historyError ? (
                  <p className='text-destructive text-sm'>Couldn’t load history.</p>
                ) : !historyRes?.data?.length ? (
                  <p className='text-sm text-gray-500 dark:text-gray-300'>
                    No resolution history available.
                  </p>
                ) : (
                  <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
                    <table className='w-full border-collapse text-left text-sm'>
                      <thead className='bg-gray-100 dark:bg-gray-700'>
                        <tr>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Date
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            User
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Action
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRes.data.map((e, i) => (
                          <tr
                            key={i}
                            className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
                          >
                            <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                              {fmtDate(e.timestamp)}
                            </td>
                            <td className='px-4 py-2 font-medium text-gray-800 dark:text-gray-200'>
                              {e.user}
                            </td>
                            <td className='px-4 py-2 text-gray-600 italic dark:text-gray-300'>
                              {e.action}
                            </td>
                            <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                              {e.details || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ---------- TRANSACTIONS (if present) ---------- */}
            {alertDetails.transactional && (
              <section className='mt-4 rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
                <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Transactions
                </h3>

                {transactionLoading ? (
                  <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
                    <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
                    Loading transactions…
                  </div>
                ) : transactionError ? (
                  <p className='text-destructive text-sm'>Couldn’t load transactions.</p>
                ) : !transactionData?.data?.transactions?.length ? (
                  <p className='text-sm text-gray-500 dark:text-gray-300'>
                    No transactions available for this alert.
                  </p>
                ) : (
                  <>
                    {/* Summary */}
                    <div className='mb-3 flex flex-wrap items-center gap-2 text-sm'>
                      <Badge variant='secondary' className='rounded-full'>
                        Requested: {transactionData.data.requestedCount ?? 0}
                      </Badge>
                      <Badge variant='secondary' className='rounded-full'>
                        Found: {transactionData.data.foundCount ?? 0}
                      </Badge>

                      {(transactionData.data.missingIds?.length ?? 0) > 0 && (
                        <div className='flex items-center gap-2'>
                          <span className='text-muted-foreground'>Missing IDs:</span>
                          <div className='flex flex-wrap gap-1'>
                            {transactionData.data.missingIds!.map((id) => (
                              <Badge
                                key={id}
                                className='rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                              >
                                {id}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Table */}
                    <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
                      <table className='w-full border-collapse text-left text-sm'>
                        <thead className='bg-gray-100 dark:bg-gray-700'>
                          <tr>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              ID
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Date/Time
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              From A/c
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              To A/c
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Amount
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Type
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Branch
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Scroll
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Leg
                            </th>
                            <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                              Narration
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactionData.data.transactions!.map((t) => (
                            <tr
                              key={t.id}
                              className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
                            >
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.id ?? '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {fmtDate(t.tranTs)}
                              </td>
                              <td className='px-4 py-2 font-mono text-gray-800 dark:text-gray-200'>
                                {t.fromAc || '—'}
                              </td>
                              <td className='px-4 py-2 font-mono text-gray-800 dark:text-gray-200'>
                                {t.toAc || '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-800 dark:text-gray-200'>
                                {fmtINR(t.amount)}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.tranType || '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.tranBranch || '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.scroll1 || '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.leg || '—'}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {t.narration || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ---------- UPLOADED DOCUMENTS ---------- */}
            {alertDetails.resolutionId && (
              <section className='mt-4 rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    📎 Uploaded Documents
                  </h3>

                  <Button
                    variant='secondary'
                    className='rounded-lg shadow transition-all hover:shadow-md'
                    onClick={handleDownloadDocuments}
                    disabled={downloadZipMutation.isPending}
                  >
                    {downloadZipMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Preparing…
                      </>
                    ) : (
                      <>
                        <Download className='mr-2 h-4 w-4' />
                        Download All (ZIP)
                      </>
                    )}
                  </Button>
                </div>

                {docsLoading ? (
                  <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
                    <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
                    Loading documents…
                  </div>
                ) : docsError ? (
                  <p className='text-destructive text-sm'>Couldn’t load documents.</p>
                ) : !uploadedRes?.length ? (
                  <p className='text-sm text-gray-500 dark:text-gray-300'>
                    No documents uploaded for this resolution.
                  </p>
                ) : (
                  <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
                    <table className='w-full border-collapse text-left text-sm'>
                      <thead className='bg-gray-100 dark:bg-gray-700'>
                        <tr>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            #
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Name
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Uploaded At
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Uploaded By
                          </th>
                          <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedRes.map((d, idx) => {
                          const name = d?.documentName ?? '—'
                          const uploadedAt = d?.uploadedAt
                            ? new Date(d.uploadedAt).toLocaleString('en-IN')
                            : '—'
                          const uploadedBy = d?.uploadedBy ?? '—'

                          return (
                            <tr
                              key={d?.id ?? `${name}-${idx}`}
                              className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
                            >
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {idx + 1}
                              </td>
                              <td
                                className='max-w-xs truncate px-4 py-2 text-gray-800 dark:text-gray-200'
                                title={name}
                              >
                                {name}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {uploadedAt}
                              </td>
                              <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                {uploadedBy}
                              </td>
                              <td className='px-4 py-2'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  {(() => {
                                    const { preview, download } = buildDocUrls(
                                      alertDetails?.resolutionId,
                                      d?.documentName
                                    )

                                    return (
                                      <>
                                        <a
                                          href={preview}
                                          target='_blank'
                                          rel='noreferrer'
                                          className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                                          title='Preview'
                                        >
                                          <Eye className='h-4 w-4' /> Preview
                                        </a>

                                        <a
                                          href={download}
                                          download
                                          className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                                          title='Download'
                                        >
                                          <Download className='h-4 w-4' /> Download
                                        </a>
                                      </>
                                    )
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <DialogFooter className='mt-6 border-t border-gray-200 pt-4 dark:border-gray-800'>
          <Button
            onClick={onClose}
            className='rounded-lg px-4 py-2 shadow-sm transition-all hover:shadow-md'
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------------- small sub-component ----------------------- */
const Detail = ({
  label,
  value,
  span = 1,
}: {
  label: string
  value: React.ReactNode
  span?: 1 | 2
}) => (
  <div className={`flex flex-col ${span === 2 ? 'sm:col-span-2' : ''}`}>
    <span className='text-muted-foreground'>{label}</span>
    <span className='font-medium'>{value}</span>
  </div>
)







// /* ------------------------------------------------------------------ */
// /* components/alerts/alert-details-dialog.tsx                         */
// /* ------------------------------------------------------------------ */
// import React from 'react'
// import { components } from '@/types/api/v1.js'
// import { Download, History, Loader2, Eye } from 'lucide-react'
// import { $api, BASE_URL } from '@/lib/api.ts'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog'
// import { Separator } from '@/components/ui/separator'
// import { AccountNoCell } from '@/components/table/cells'

// /* ----------------------------- helpers ---------------------------- */
// const fmtDate = (d?: string | number) =>
//   d ? new Date(d).toLocaleString('en-IN') : '—'

// const fmtINR = (n?: number) =>
//   typeof n === 'number'
//     ? n.toLocaleString('en-IN', {
//         style: 'currency',
//         currency: 'INR',
//         maximumFractionDigits: 2,
//       })
//     : '—'

// /* status → Tailwind colour classes (light + dark mode) */
// const statusClasses: Record<string, string> = {
//   PENDING:
//     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
//   IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
//   RESOLVED:
//     'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
//   REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
// }

// const buildDocUrls = (resolutionId?: number, name?: string) => {
//   const safeId = resolutionId ?? 0
//   const encoded = encodeURIComponent(name ?? '')
//   return {
//     preview: `${BASE_URL}/alert/resolutions/${safeId}/documents/preview?name=${encoded}`,
//     download: `${BASE_URL}/alert/resolutions/${safeId}/documents/downloadByName?name=${encoded}`,
//   }
// }

// /* --------------------------- component ---------------------------- */
// export const AlertDetailsDialog = ({
//   loading,
//   account,
//   onClose,
//   alertType,
// }: {
//   loading: boolean
//   account: components['schemas']['AlertDetailDTO'] | undefined
//   onClose: () => void
//   alertType: 'EWS' | 'FRM'
// }) => {
//   const alertDetails = account

//   const {
//     data: historyRes,
//     isLoading: historyLoading,
//     error: historyError,
//   } = $api.useQuery(
//     'get',
//     '/alert/resolutions/{resolutionId}/history',
//     {
//       params: { path: { resolutionId: alertDetails?.resolutionId ?? 0 } },
//     },
//     { enabled: Boolean(alertDetails?.resolutionId) }
//   )

//   const {
//     data: transactionData,
//     isLoading: transactionLoading,
//     error: transactionError,
//   } = $api.useQuery(
//     'get',
//     alertType === 'FRM'
//       ? '/api/frm/general/alerts/{alertId}/transactions'
//       : '/api/alerts/{alertId}/transactions',
//     {
//       params: {
//         path: { alertId: alertDetails?.alertId ?? 0 },
//         header: { Authorization: '' },
//       },
//     },
//     { enabled: !!(alertDetails?.transactional && alertDetails.alertId) }
//   )

//   const {
//     data: uploadedRes,
//     isLoading: docsLoading,
//     error: docsError,
//   } = $api.useQuery(
//     'get',
//     '/alert/resolutions/{resolutionId}/documents',
//     {
//       params: { path: { resolutionId: alertDetails?.resolutionId ?? 0 } },
//     },
//     { enabled: Boolean(alertDetails?.resolutionId) }
//   )

//   /* --------------------- download ZIP --------------------- */
//   const handleDownloadDocuments = async () => {
//     if (!alertDetails?.resolutionId) return
//     try {
//       const res = await fetch(
//         `${BASE_URL}/alert/resolutions/${alertDetails.resolutionId}/documents/download`
//       )
//       if (!res.ok) throw new Error()

//       const blob = await res.blob()
//       const url = URL.createObjectURL(blob)
//       const a = document.createElement('a')
//       a.href = url
//       a.download = `resolution_${alertDetails.resolutionId}_documents.zip`
//       a.click()
//       URL.revokeObjectURL(url)
//     } catch {
//       /* toast / notifier here */
//     }
//   }

//   return (
//     <Dialog open onOpenChange={onClose}>
//       <DialogTrigger asChild>
//         <Button
//           variant='outline'
//           className='rounded-xl border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md'
//         >
//           View Details
//         </Button>
//       </DialogTrigger>

//       <DialogContent className='max-h-[95vh] max-w-2xl overflow-auto rounded-2xl border bg-white shadow-xl sm:max-w-5xl dark:bg-gray-900'>
//         <DialogHeader className='border-b border-gray-200 pb-4 dark:border-gray-800'>
//           <DialogTitle className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
//             🔍 Alert Details
//           </DialogTitle>
//         </DialogHeader>

//         {loading ? (
//           <div className='flex items-center justify-center py-16'>
//             <Loader2 className='text-primary mr-2 h-6 w-6 animate-spin' />
//             <span className='text-gray-600 dark:text-gray-300'>Loading…</span>
//           </div>
//         ) : !alertDetails ? (
//           <p className='py-10 text-center text-gray-500 dark:text-gray-300'>
//             No details available.
//           </p>
//         ) : (
//           <>
//             {/* ---------- FACT SHEET ---------- */}
//             <section className='mt-4 grid grid-cols-1 gap-x-2 gap-y-1 text-sm leading-relaxed sm:grid-cols-3'>
//               <Detail
//                 label='Account No'
//                 value={<AccountNoCell value={String(alertDetails.accountNo)} />}
//               />
//               <Detail label='Customer Name' value={alertDetails.customerName} />
//               <Detail
//                 label='Alert Description'
//                 value={alertDetails.masterDescription}
//               />
//               <Detail
//                 label='Alert Date'
//                 value={fmtDate(alertDetails.alertDate)}
//               />
//               <Detail
//                 label='Reason'
//                 value={alertDetails.alertReason}
//                 span={2}
//               />
//               <Detail
//                 label='Status'
//                 value={
//                   <Badge
//                     className={`rounded-full border-0 px-3 py-1 text-sm shadow-sm ${
//                       alertDetails.status
//                         ? statusClasses[alertDetails.status]
//                         : ''
//                     }`}
//                   >
//                     {alertDetails.status}
//                   </Badge>
//                 }
//               />
//             </section>

//             <Separator />

//             {/* ---------- RESOLUTION HISTORY (Table View) ---------- */}
//             {alertDetails.resolutionId && (
//               <section className='rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
//                 <div className='mb-4 flex items-center justify-between'>
//                   <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
//                     <History className='text-primary h-5 w-5' /> Resolution
//                     History
//                   </h3>
//                 </div>

//                 {historyLoading ? (
//                   <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
//                     <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
//                     Loading history…
//                   </div>
//                 ) : historyError ? (
//                   <p className='text-destructive text-sm'>
//                     Couldn’t load history.
//                   </p>
//                 ) : !historyRes?.data?.length ? (
//                   <p className='text-sm text-gray-500 dark:text-gray-300'>
//                     No resolution history available.
//                   </p>
//                 ) : (
//                   <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
//                     <table className='w-full border-collapse text-left text-sm'>
//                       <thead className='bg-gray-100 dark:bg-gray-700'>
//                         <tr>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Date
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             User
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Action
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Details
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {historyRes.data.map((e, i) => (
//                           <tr
//                             key={i}
//                             className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
//                           >
//                             <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                               {fmtDate(e.timestamp)}
//                             </td>
//                             <td className='px-4 py-2 font-medium text-gray-800 dark:text-gray-200'>
//                               {e.user}
//                             </td>
//                             <td className='px-4 py-2 text-gray-600 italic dark:text-gray-300'>
//                               {e.action}
//                             </td>
//                             <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                               {e.details || '—'}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </section>
//             )}

//             {/* ---------- TRANSACTIONS (if present) ---------- */}
//             {alertDetails.transactional && (
//               <section className='mt-4 rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
//                 <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100'>
//                   Transactions
//                 </h3>

//                 {transactionLoading ? (
//                   <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
//                     <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
//                     Loading transactions…
//                   </div>
//                 ) : transactionError ? (
//                   <p className='text-destructive text-sm'>
//                     Couldn’t load transactions.
//                   </p>
//                 ) : !transactionData?.data?.transactions?.length ? (
//                   <p className='text-sm text-gray-500 dark:text-gray-300'>
//                     No transactions available for this alert.
//                   </p>
//                 ) : (
//                   <>
//                     {/* Summary */}
//                     <div className='mb-3 flex flex-wrap items-center gap-2 text-sm'>
//                       <Badge variant='secondary' className='rounded-full'>
//                         Requested: {transactionData.data.requestedCount ?? 0}
//                       </Badge>
//                       <Badge variant='secondary' className='rounded-full'>
//                         Found: {transactionData.data.foundCount ?? 0}
//                       </Badge>
//                       {(transactionData.data.missingIds?.length ?? 0) > 0 && (
//                         <div className='flex items-center gap-2'>
//                           <span className='text-muted-foreground'>
//                             Missing IDs:
//                           </span>
//                           <div className='flex flex-wrap gap-1'>
//                             {transactionData.data.missingIds!.map((id) => (
//                               <Badge
//                                 key={id}
//                                 className='rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
//                               >
//                                 {id}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     {/* Table */}
//                     <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
//                       <table className='w-full border-collapse text-left text-sm'>
//                         <thead className='bg-gray-100 dark:bg-gray-700'>
//                           <tr>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               ID
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Date/Time
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               From A/c
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               To A/c
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Amount
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Type
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Branch
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Scroll
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Leg
//                             </th>
//                             <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                               Narration
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {transactionData.data.transactions!.map((t) => (
//                             <tr
//                               key={t.id}
//                               className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
//                             >
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.id ?? '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {fmtDate(t.tranTs)}
//                               </td>
//                               <td className='px-4 py-2 font-mono text-gray-800 dark:text-gray-200'>
//                                 {t.fromAc || '—'}
//                               </td>
//                               <td className='px-4 py-2 font-mono text-gray-800 dark:text-gray-200'>
//                                 {t.toAc || '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-800 dark:text-gray-200'>
//                                 {fmtINR(t.amount)}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.tranType || '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.tranBranch || '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.scroll1 || '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.leg || '—'}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {t.narration || '—'}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </>
//                 )}
//               </section>
//             )}

//             {/* ---------- UPLOADED DOCUMENTS ---------- */}
//             {alertDetails.resolutionId && (
//               <section className='mt-4 rounded-xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800'>
//                 <div className='mb-4 flex items-center justify-between'>
//                   <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
//                     📎 Uploaded Documents
//                   </h3>

//                   {/* Reuse your ZIP download for all documents */}
//                   <Button
//                     variant='secondary'
//                     className='rounded-lg shadow transition-all hover:shadow-md'
//                     onClick={handleDownloadDocuments}
//                   >
//                     <Download className='mr-2 h-4 w-4' /> Download All (ZIP)
//                   </Button>
//                 </div>

//                 {docsLoading ? (
//                   <div className='flex items-center justify-center py-6 text-gray-600 dark:text-gray-300'>
//                     <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />{' '}
//                     Loading documents…
//                   </div>
//                 ) : docsError ? (
//                   <p className='text-destructive text-sm'>
//                     Couldn’t load documents.
//                   </p>
//                 ) : !uploadedRes?.length ? (
//                   <p className='text-sm text-gray-500 dark:text-gray-300'>
//                     No documents uploaded for this resolution.
//                   </p>
//                 ) : (
//                   <div className='overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700'>
//                     <table className='w-full border-collapse text-left text-sm'>
//                       <thead className='bg-gray-100 dark:bg-gray-700'>
//                         <tr>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             #
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Name
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Uploaded At
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Uploaded By
//                           </th>
//                           <th className='px-4 py-2 font-medium text-gray-700 dark:text-gray-200'>
//                             Actions
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {uploadedRes.map((d, idx) => {
//                           const name = d?.documentName ?? '—'
//                           const uploadedAt = d?.uploadedAt
//                             ? new Date(d.uploadedAt).toLocaleString('en-IN')
//                             : '—'
//                           const uploadedBy = d?.uploadedBy ?? '—'
//                           // Fallbacks:

//                           return (
//                             <tr
//                               key={d?.id ?? `${name}-${idx}`}
//                               className='border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
//                             >
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {idx + 1}
//                               </td>
//                               <td
//                                 className='max-w-xs truncate px-4 py-2 text-gray-800 dark:text-gray-200'
//                                 title={name}
//                               >
//                                 {name}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {uploadedAt}
//                               </td>
//                               <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
//                                 {uploadedBy}
//                               </td>
//                               <td className='px-4 py-2'>
//                                 <div className='flex flex-wrap items-center gap-2'>
//                                   {(() => {
//                                     const { preview, download } = buildDocUrls(
//                                       alertDetails?.resolutionId,
//                                       d?.documentName
//                                     )

//                                     return (
//                                       <>
//                                         <a
//                                           href={preview}
//                                           target='_blank'
//                                           rel='noreferrer'
//                                           className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
//                                           title='Preview'
//                                         >
//                                           <Eye className='h-4 w-4' /> Preview
//                                         </a>

//                                         {/* important: use /documents/downloadByName?name=... */}
//                                         <a
//                                           href={download}
//                                           /* let the server's Content-Disposition set filename; download attribute is a harmless hint */
//                                           download
//                                           className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
//                                           title='Download'
//                                         >
//                                           <Download className='h-4 w-4' />{' '}
//                                           Download
//                                         </a>
//                                       </>
//                                     )
//                                   })()}
//                                 </div>
//                               </td>
//                             </tr>
//                           )
//                         })}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </section>
//             )}
//           </>
//         )}

//         <DialogFooter className='mt-6 border-t border-gray-200 pt-4 dark:border-gray-800'>
//           <Button
//             onClick={onClose}
//             className='rounded-lg px-4 py-2 shadow-sm transition-all hover:shadow-md'
//           >
//             Close
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// /* ---------------------- small sub-component ----------------------- */
// const Detail = ({
//   label,
//   value,
//   span = 1,
// }: {
//   label: string
//   value: React.ReactNode
//   span?: 1 | 2
// }) => (
//   <div className={`flex flex-col ${span === 2 ? 'sm:col-span-2' : ''}`}>
//     <span className='text-muted-foreground'>{label}</span>
//     <span className='font-medium'>{value}</span>
//   </div>
// )
