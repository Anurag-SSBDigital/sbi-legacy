// import { useState } from 'react'
// import { AlertTriangle, FileText, Loader2 } from 'lucide-react'
// import { $api } from '@/lib/api.ts'
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
// type AccountDetail = {
//   acctNo: string
//   acctDesc: string
//   custNumber: string
//   telNo: string | null
//   segement: string | null
//   custName: string
//   add1: string | null
//   add2: string | null
//   add3: string | null
//   add4: string | null
//   loanLimit: number
//   intRate: number
//   theoBal: number
//   outstand: number
//   irregAmt: number
//   sanctDt: string
//   emisDue: number
//   emisPaid: number
//   emisOvrdue: number
//   currency: string
//   maintBr: number
//   instalAmt: number
//   irrgDtString: string | null
//   irrgDt: string | null
//   unrealInt: number
//   accrInt: number
//   stress: string
//   smaCodeIncipientStress: string
//   ra: string
//   raDate: string
//   writeOffFlag: string
//   writeOffAmount: number
//   writeOffDate: string
//   alert1: string | null
//   alert2: string | null
//   alert3: string | null
//   branchCode: string
//   crmDone: string | null
//   actType: string
//   status: string | null
//   stockAuditAssignId: string | null
//   branchName: string | null
// }
// export default function AccountNoCell({
//   value,
// }: {
//   value: string | undefined
// }) {
//   const [open, setOpen] = useState(false)
//   const { data, isLoading, isError, refetch } = $api.useQuery(
//     'get',
//     '  ',
//     {
//       params: { query: { acctNm: value } },
//     },
//     {
//       enabled: false,
//     }
//   )
//   const account: AccountDetail | undefined = data as AccountDetail | undefined
//   const handleOpenChange = (isOpen: boolean) => {
//     setOpen(isOpen)
//     if (isOpen && !account) {
//       refetch()
//     }
//   }
//   const formatCurrency = (amount: number | null | undefined) => {
//     if (typeof amount !== 'number') return '-'
//     return amount.toLocaleString('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })
//   }
//   const formatPercentage = (rate: number | null | undefined) => {
//     if (typeof rate !== 'number') return '-'
//     return `${rate.toFixed(2)}%`
//   }
//   const getFullAddress = (acc: AccountDetail | undefined) => {
//     if (!acc) return '-'
//     return (
//       [acc.add1, acc.add2, acc.add3, acc.add4].filter(Boolean).join(', ') || '-'
//     )
//   }
//   const accountDetailsList = account
//     ? [
//         { label: 'Account Number', value: account.acctNo },
//         { label: 'Customer Name', value: account.custName },
//         { label: 'Account Description', value: account.acctDesc },
//         { label: 'Segment', value: account.segement || '-' },
//         { label: 'Contact Number', value: account.telNo || '-' },
//         {
//           label: 'Full Address',
//           value: getFullAddress(account),
//           colSpan: true,
//         },
//         { label: 'Branch Name', value: account.branchName || '-' },
//         { label: 'Sanctioned Date', value: account.sanctDt || '-' },
//         { label: 'Loan Limit', value: formatCurrency(account.loanLimit) },
//         { label: 'Interest Rate', value: formatPercentage(account.intRate) },
//       ]
//     : []
//   return (
//     <Dialog open={open} onOpenChange={handleOpenChange}>
//       <DialogTrigger asChild>
//         <button
//           className='group inline-flex items-center gap-x-2 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-all duration-150 ease-in-out hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 dark:focus-visible:ring-offset-slate-900'
//           aria-label={`View details for account ${value}`}
//         >
//           <FileText className='h-4 w-4 text-indigo-500 transition-colors group-hover:text-indigo-600 dark:text-indigo-400 dark:group-hover:text-indigo-300' />
//           <span>{value}</span>
//         </button>
//       </DialogTrigger>
//       <DialogContent className='fixed top-1/2 left-1/2 z-[100] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/90'>
//         {/* Gradient accent */}
//         <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400' />
//         <DialogHeader className='sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/70'>
//           <DialogTitle className='text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>
//             Account Details
//           </DialogTitle>
//           <DialogDescription className='text-sm text-slate-600 dark:text-slate-400'>
//             Showing details for account:{' '}
//             <strong className='text-indigo-600 dark:text-indigo-400'>
//               {value}
//             </strong>
//           </DialogDescription>
//         </DialogHeader>
//         {isLoading && (
//           <div className='flex flex-col items-center justify-center space-y-3 py-16'>
//             <Loader2 className='h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400' />
//             <p className='text-sm text-slate-500 dark:text-slate-400'>
//               Loading account details...
//             </p>
//           </div>
//         )}
//         {isError && !isLoading && (
//           <div className='mx-6 my-6 rounded-xl border border-red-200/60 bg-red-50/70 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/40'>
//             <AlertTriangle className='mx-auto h-12 w-12 text-red-600 dark:text-red-400' />
//             <p className='mt-3 text-base font-semibold text-red-700 dark:text-red-300'>
//               Failed to Fetch Details
//             </p>
//             <p className='mt-1 text-sm text-red-700/90 dark:text-red-300/90'>
//               We couldn't retrieve the account information at this time.
//             </p>
//             <Button
//               variant='outline'
//               onClick={() => refetch()}
//               className='mt-4'
//             >
//               Try Again
//             </Button>
//           </div>
//         )}
//         {account && !isLoading && !isError && (
//           <div className='px-6 py-2'>
//             <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
//               {accountDetailsList.map((item, index) => (
//                 <div
//                   key={index}
//                   className='rounded-xl border border-slate-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/60'
//                 >
//                   <dt className='text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400'>
//                     {item.label}
//                   </dt>
//                   <dd className='mt-1 text-sm font-medium break-words text-slate-900 dark:text-slate-100'>
//                     {item.value}
//                   </dd>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//         <DialogFooter className='sticky bottom-0 z-10 border-t border-slate-200/70 bg-gradient-to-t from-white/90 to-white/60 px-6 py-4 backdrop-blur-md dark:border-slate-700/60 dark:from-slate-900/90 dark:to-slate-900/60'>
//           <Button
//             variant='outline'
//             onClick={() => setOpen(false)}
//             className='dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
//           >
//             Close
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
import { useState } from 'react'
import { AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ---------------- Types ----------------
export type AccountDetail = {
  acctNo: string
  acctDesc: string
  custNumber: string
  telNo: string | null
  segement: string | null
  custName: string
  add1: string | null
  add2: string | null
  add3: string | null
  add4: string | null
  loanLimit: number
  intRate: number
  theoBal: number
  outstand: number
  irregAmt: number
  sanctDt: string
  emisDue: number
  emisPaid: number
  emisOvrdue: number
  currency: string
  maintBr: number
  instalAmt: number
  irrgDtString: string | null
  irrgDt: string | null
  unrealInt: number
  accrInt: number
  stress: string
  smaCodeIncipientStress: string
  ra: string
  raDate: string
  writeOffFlag: string
  writeOffAmount: number
  writeOffDate: string
  alert1: string | null
  alert2: string | null
  alert3: string | null
  branchCode: string
  crmDone: string | null
  actType: string
  status: string | null
  stockAuditAssignId: string | null
  branchName: string | null
}

// New API deposit type (based on your sample)
type DepositDetail = {
  acctCd: string
  compCd: string
  branchCd: string
  acctType: string
  acctNm: string
  typeNm: string
  intRate: number
  opDate: string
  closingDate: string | null
  amount: number
  contact: string | null
  provisionalBal: number
  add1?: string | null
  add2?: string | null
  add3?: string | null
  add4?: string | null
  pinCode?: string | null
  pts?: string | null
  npaCd?: string | null
  ptsNm?: string | null
  area?: string | null
  city?: string | null
  district?: string | null
  state?: string | null
  customerId: string
  netBalance: number
  closeOpenStatus: string
  colUpdFlg?: string | null
  modifiedDt?: string | null
}

type ApiResponse = {
  customer: AccountDetail | null
  deposit: DepositDetail | null
}

// ---------------- Component ----------------
export default function AccountNoCell({
  value,
}: {
  value: string | undefined
}) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, isError, refetch } = $api.useQuery(
    'get',
    '/account/getAccountDetail',
    { params: { query: { acctNm: value } } },
    { enabled: false }
  )

  const response = data as ApiResponse | undefined
  // Only one will have data at a time (per your note)
  const isCustomer = !!response?.customer
  const detail = (response?.customer ?? response?.deposit) || null

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !detail) refetch()
  }

  // ---------- Helpers ----------
  const isBlank = (v: unknown) =>
    v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || Number.isNaN(amount))
      return null
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercent = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined || Number.isNaN(rate)) return null
    return `${rate.toFixed(2)}%`
  }

  const joinAddress = (...parts: Array<string | null | undefined>) => {
    const txt = parts.filter(Boolean).join(', ')
    return txt || null
  }

  // Build display list for CUSTOMER (your AccountDetail type)
  const customerList = (c: AccountDetail) =>
    [
      { label: 'Account Number', value: c.acctNo },
      { label: 'Customer Name', value: c.custName },
      { label: 'Account Description', value: c.acctDesc },
      { label: 'Segment', value: c.segement },
      { label: 'Contact Number', value: c.telNo },
      { label: 'Branch Name', value: c.branchName },
      { label: 'Sanctioned Date', value: c.sanctDt },
      // { label: 'Loan Limit', value: formatCurrency(c.loanLimit) },
      { label: 'Interest Rate', value: formatPercent(c.intRate) },
      { label: 'Outstanding', value: formatCurrency(c.outstand) },
      { label: 'Account Type', value: c.actType },
      { label: 'Status', value: c.status },
      {
        label: 'Address',
        value: joinAddress(c.add1, c.add2, c.add3, c.add4),
      },

      { label: 'Customer No.', value: c.custNumber },
    ].filter((row) => !isBlank(row.value))

  // Build display list for DEPOSIT
  const depositList = (d: DepositDetail) =>
    [
      { label: 'Account Number', value: d.acctCd },
      { label: 'Account Name', value: d.acctNm },
      { label: 'Type', value: d.typeNm },
      { label: 'Account Type Code', value: d.acctType },
      { label: 'Branch Code', value: d.branchCd },
      { label: 'Open Date', value: d.opDate },
      { label: 'Net Balance', value: formatCurrency(d.netBalance) },
      { label: 'Interest Rate', value: formatPercent(d.intRate) },
      { label: 'Status', value: d.closeOpenStatus },
      { label: 'Contact', value: d.contact },
      {
        label: 'Address',
        value: joinAddress(
          d.add1,
          d.add2,
          d.area,
          d.city,
          d.district,
          d.state,
          d.pinCode
        ),
      },
      { label: 'Customer ID', value: d.customerId },
      { label: 'PTS', value: d.pts },
      { label: 'PTS Name', value: d.ptsNm },
      { label: 'Last Modified', value: d.modifiedDt },
    ].filter((row) => !isBlank(row.value))

  const tiles =
    detail == null
      ? []
      : isCustomer
        ? customerList(detail as AccountDetail)
        : depositList(detail as DepositDetail)

  // ---------------- UI ----------------
  return (
    <>
      <button
        type='button'
        onClick={() => handleOpenChange(true)}
        className='group inline-flex items-center gap-x-2 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-all duration-150 ease-in-out hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 dark:focus-visible:ring-offset-slate-900'
        aria-label={`View details for account ${value ?? ''}`}
      >
        <FileText className='h-4 w-4 text-indigo-500 transition-colors group-hover:text-indigo-600 dark:text-indigo-400 dark:group-hover:text-indigo-300' />
        <span>{value}</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='fixed top-1/2 left-1/2 z-[100] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/90'>
          {/* Gradient accent */}
          <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400' />

          {/* Header (sticky) */}
          <DialogHeader className='sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/70'>
            <DialogTitle className='text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>
              {isCustomer ? 'Customer Details' : 'Deposit Details'}
            </DialogTitle>
            <DialogDescription className='text-sm text-slate-600 dark:text-slate-400'>
              Showing details for:&nbsp;
              <strong className='text-indigo-600 dark:text-indigo-400'>
                {value}
              </strong>
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable middle */}
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            {isLoading && (
              <div className='flex flex-col items-center justify-center space-y-3 py-16'>
                <Loader2 className='h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400' />
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Loading details...
                </p>
              </div>
            )}

            {isError && !isLoading && (
              <div className='rounded-xl border border-red-200/60 bg-red-50/70 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/40'>
                <AlertTriangle className='mx-auto h-12 w-12 text-red-600 dark:text-red-400' />
                <p className='mt-3 text-base font-semibold text-red-700 dark:text-red-300'>
                  Failed to Fetch Details
                </p>
                <p className='mt-1 text-sm text-red-700/90 dark:text-red-300/90'>
                  We couldn't retrieve the information at this time.
                </p>
                <Button
                  variant='outline'
                  onClick={() => refetch()}
                  className='mt-4'
                >
                  Try Again
                </Button>
              </div>
            )}

            {!isLoading && !isError && tiles.length > 0 && (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {tiles.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className='rounded-xl border border-slate-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/60'
                  >
                    <dt className='text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400'>
                      {item.label}
                    </dt>
                    <dd className='mt-1 text-sm font-medium break-words text-slate-900 dark:text-slate-100'>
                      {String(item.value)}
                    </dd>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (sticky) */}
          <DialogFooter className='sticky bottom-0 z-10 border-t border-slate-200/70 bg-gradient-to-t from-white/90 to-white/60 px-6 py-4 backdrop-blur-md dark:border-slate-700/60 dark:from-slate-900/90 dark:to-slate-900/60'>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              className='dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
