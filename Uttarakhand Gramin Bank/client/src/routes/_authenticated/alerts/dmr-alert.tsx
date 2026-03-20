// import { useState } from 'react'
// import { createFileRoute } from '@tanstack/react-router'
// import { paths } from '@/types/api/v1'
// import { Eye } from 'lucide-react'
// import LoadingBar from 'react-top-loading-bar'
// import { $api } from '@/lib/api.ts'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
// import PaginatedTable, {
//   PaginatedTableColumn,
// } from '@/components/paginated-table.tsx'
// type Accounts = paths['/pacs/all']['get']['responses']['200']['content']['*/*']
// export const Route = createFileRoute('/_authenticated/alerts/dmr-alert')({
//   component: RouteComponent,
// })
// function generateAlerts(accounts: Accounts): Accounts {
//   const alerts: {
//     id:number
//     type: string
//     description: string
//     status: string
//     accountNo?: string | undefined
//     linkedAccount?: Accounts[0] | null
//   }[] = []
//   let idCounter = 1
//   const addAlert = (type: string, description: string, acc?: Accounts[0]) => {
//     alerts.push({
//       id: idCounter++,
//       type,
//       description,
//       status: 'Pending',
//       accountNo: acc?.memberAccountNo,
//       linkedAccount: acc,
//     })
//   }
//   // -------------------------
//   // 1. Existing KCC Alerts
//   // -------------------------
//   accounts.forEach((acc) => {
//     // Repayment default but fresh KCC
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberUnpaidPrinciple || '0') > 0
//     ) {
//       addAlert(
//         'KCC CASH',
//         `Repayment default: ${acc.memberAccountName} has outstanding with new KCC issued.`,
//         acc
//       )
//     }
//     // KCC overdue but not NPA
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberIrregularity || '0') === 0
//     ) {
//       addAlert(
//         'KCC LOAN',
//         `Account ${acc.memberAccountNo} overdue but not marked NPA.`,
//         acc
//       )
//     }
//     // PACS staff as loan beneficiary
//     // if (acc.memberAccountName?.toUpperCase().includes('STAFF') || acc.isStaff) {
//     //   addAlert(
//     //     'STAFF LOAN',
//     //     `PACS staff ${acc.memberAccountName} is a loan beneficiary.`,
//     //     acc
//     //   )
//     // }
//     // KCC limit increase >15% YoY
//     // const prevYear = parseFloat(acc.prevYearLimit || '0')
//     // const current = parseFloat(acc.memberLimitSanctioned || '0')
//     // if (prevYear > 0 && current > prevYear * 1.15) {
//     //   addAlert(
//     //     'KCC LIMIT INCREASE',
//     //     `KCC limit increased >15% YoY for ${acc.memberAccountName}.`,
//     //     acc
//     //   )
//     // }
//     // Disbursement on weekend/holiday
//     // if (acc.disbursementDate && acc.disbursementDate !== '99/99/9999') {
//     //   const [d, m, y] = acc.disbursementDate.split('/').map(Number)
//     //   const jsDate = new Date(y, m - 1, d)
//     //   const day = jsDate.getDay()
//     //   if (day === 0 || day === 6)
//     //     addAlert(
//     //       'DISBURSEMENT TIMING',
//     //       `Loan disbursed on weekend for ${acc.memberAccountName}.`,
//     //       acc
//     //     )
//     // }
//     // KCC disbursed but no SB activity
//     // if (
//     //   acc.memberProdName?.toUpperCase().includes('KCC') &&
//     //   parseFloat(acc.memberOutstanding || '0') > 0 &&
//     //   !acc.lastAtmTransaction
//     // ) {
//     //   addAlert(
//     //     'NO SB ACTIVITY',
//     //     `KCC account ${acc.memberAccountNo} has no linked SB activity.`,
//     //     acc
//     //   )
//     // }
//     // Dormant account suddenly active (>6 months)
//     // if (acc.lastAtmTransaction && acc.lastAtmTransaction !== '99/99/9999') {
//     //   const lastDate = new Date(acc.lastAtmTransaction)
//     //   const diffMonths =
//     //     (Date.now() - lastDate.getTime()) / (1000 * 3600 * 24 * 30)
//     //   if (diffMonths > 6 && parseFloat(acc.memberOutstanding || '0') > 0) {
//     //     addAlert(
//     //       'DORMANT ACCOUNT ACTIVE',
//     //       `Dormant account ${acc.memberAccountNo} suddenly active.`,
//     //       acc
//     //     )
//     //   }
//     // }
//   })
//   // -------------------------
//   // 2. Cross-account Checks
//   // -------------------------
//   const mapBy = (key: Accounts) => {
//     const map: Record<string, Accounts> = {}
//     accounts.forEach((acc) => {
//       const val = acc[key] as string
//       if (val) (map[val] = map[val] || []).push(acc)
//     })
//     return map
//   }
//   // Repetitive KCC KIND loan
//   const kindMap = accounts
//     .filter((a) => a.memberProdName?.toUpperCase().includes('KIND'))
//     .reduce(
//       (m, a) => {
//         const k = a.memberCustomerNo || a.memberAccountNo || ''
//         ;(m[k] = m[k] || []).push(a)
//         return m
//       },
//       {} as Record<string, Accounts[]>
//     )
//   Object.entries(kindMap).forEach(([key, list]) => {
//     if (list.length > 1)
//       list.forEach((acc) =>
//         addAlert(
//           'KCC KIND',
//           `Repetitive KCC Kind loan for ${key} in same season.`,
//           acc
//         )
//       )
//   })
//   // Shared Aadhaar
//   Object.entries(mapBy('aadhaarNo')).forEach(([aadhaar, list]) => {
//     if (list.length > 1)
//       list.forEach((acc) =>
//         addAlert(
//           'SHARED AADHAAR',
//           `Aadhaar ${aadhaar} linked to ${list.length} accounts.`,
//           acc
//         )
//       )
//   })
//   // Shared Mobile >=5
//   Object.entries(mapBy('mobileNo')).forEach(([mob, list]) => {
//     if (list.length >= 5)
//       list.forEach((acc) =>
//         addAlert(
//           'SHARED MOBILE',
//           `Mobile ${mob} used in ${list.length} accounts.`,
//           acc
//         )
//       )
//   })
//   // Shared Address
//   Object.entries(mapBy('address')).forEach(([addr, list]) => {
//     if (list.length > 1)
//       list.forEach((acc) =>
//         addAlert(
//           'SHARED ADDRESS',
//           `Address ${addr} linked to ${list.length} accounts.`,
//           acc
//         )
//       )
//   })
//   // -------------------------
//   // 3. Savings/ATM/Branch Alerts
//   // -------------------------
//   // accounts.forEach((acc) => {
//   //   const outAmt = parseFloat(acc.outstandingAmount || '0')
//   //   const depAmt = parseFloat(acc.depositAmount || '0')
//   //   const wdAmt = parseFloat(acc.withdrawalAmount || '0')
//   //   const inflow = parseFloat(acc.monthlyInflows || '0')
//   //   if (parseFloat(acc.atmDistance || '0') > 50 && outAmt > 20000)
//   //     addAlert(
//   //       'ATM DISTANCE',
//   //       `High-value ATM usage >20k at distance >50km for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   //   if ((acc.fullWithdrawalCount || 0) > 2)
//   //     addAlert(
//   //       'FREQUENT FULL WITHDRAWAL',
//   //       `Frequent full withdrawals for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   //   if (outAmt > 50000 || depAmt > 50000)
//   //     addAlert(
//   //       'HIGH CASH DEPOSIT',
//   //       `High-value cash deposit for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   //   if (depAmt >= 10000 && acc.depositDate)
//   //     addAlert(
//   //       'REPEATED SMALL DEPOSITS',
//   //       `Small cash deposit >=10k detected for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   //   if ((acc.atmDeclineCount || 0) > 5)
//   //     addAlert(
//   //       'HIGH ATM DECLINE',
//   //       `High ATM decline rate for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   //   if (inflow > 0 && wdAmt >= inflow * 0.8)
//   //     addAlert(
//   //       'WITHDRAWAL >80%',
//   //       `Withdrawals >80% of monthly inflows for ${acc.memberAccountName}`,
//   //       acc
//   //     )
//   // })
//   return alerts
// }
// function RouteComponent() {
//   const [pacsName, setPacsName] = useState<string | null>(null)
//   const [selectedAccount, setSelectedAccount] = useState(null)
//   const [dialogOpen, setDialogOpen] = useState('')
//   const [alerts, setAlerts] = useState<any[]>([])
//   const { data: accounts = [], isLoading: loadingAccounts } = $api.useQuery(
//     'get',
//     '/pacs/all',
//     {}
//   )
//   const isLoading = loadingAccounts
//   const accountNames = Array.from(new Set(accounts.map((acc) => acc.pacsName)))
//   const alertsColumns: PaginatedTableColumn<(typeof accounts)[0]>[] = [
//     { key: 'type', label: 'Type' },
//     { key: 'description', label: 'Description' },
//     { key: 'accountNo', label: 'Account Number' },
//     { key: 'status', label: 'Status' },
//     {
//       key: 'linkedAccount',
//       label: 'Action',
//       render: (value, row) => (
//         <>
//           <Button
//             variant='link'
//             onClick={() => {
//               setSelectedAccount(value ?? null)
//               setDialogOpen('view')
//             }}
//           >
//             <Eye size={18} aria-hidden='true' />
//           </Button>
//           <Button
//             variant='link'
//             onClick={() => {
//               setSelectedAccount(value ?? null)
//               setDialogOpen('resolve')
//             }}
//           >
//             Resolve
//           </Button>
//         </>
//       ),
//     },
//   ]
//   const handlePacsClick = (value: string) => {
//     setPacsName(value)
//     if (value) {
//       const filtered = accounts.filter((acc) => acc.pacsName === value)
//       const alertsGenerated = generateAlerts(filtered)
//       setAlerts(alertsGenerated)
//     } else {
//       setAlerts([])
//     }
//   }
//   return (
//     <MainWrapper>
//       {isLoading && (
//         <LoadingBar progress={70} className='h-1' color='#2563eb' />
//       )}
//       <div className='mb-6'>
//         <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
//           DMR Alerts
//         </h1>
//         {/* <h1 className='text-lg text-gray-600 dark:text-gray-400'>
//           Monitor and manage mule accounts effectively.
//         </h1> */}
//       </div>
//       <Select onValueChange={handlePacsClick}>
//         <SelectTrigger className='my-4 w-full max-w-xl'>
//           <SelectValue placeholder='Select PACS Name' />
//         </SelectTrigger>
//         <SelectContent>
//           {accountNames.map((name: any) => (
//             <SelectItem key={name} value={name}>
//               {name}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//       {pacsName && (
//         <div className='mb-4'>
//           <h2 className='my-4 text-lg font-semibold'>
//             Accounts for PACS: {pacsName}
//           </h2>
//           <PaginatedTable
//             data={alerts}
//             columns={alertsColumns}
//             emptyMessage='No mule scores to display at the moment.'
//           />
//         </div>
//       )}
//       <Dialog
//         open={dialogOpen === 'view'}
//         onOpenChange={(open) => {
//           if (!open) setSelectedAccount(null)
//           setDialogOpen(open ? 'view' : '')
//         }}
//       >
//         <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
//           <DialogHeader>
//             <DialogTitle>
//               Details for Account: {selectedAccount?.memberAccountName || ''}
//             </DialogTitle>
//           </DialogHeader>
//           <div className='grid grid-cols-1 gap-4 border-t border-gray-200 p-2 text-sm text-gray-700 md:grid-cols-2'>
//             {Object.entries(selectedAccount || {}).map(([key, value]) => (
//               <p key={key} className='break-words'>
//                 <strong className='text-gray-900'>
//                   {key
//                     .replace(/([A-Z])/g, ' $1') // add space before capital letters
//                     .replace(/^./, (str) => str.toUpperCase())}
//                   :
//                 </strong>{' '}
//                 {value || '-'}
//               </p>
//             ))}
//           </div>
//         </DialogContent>
//       </Dialog>
//       <Dialog
//         open={dialogOpen === 'resolve'}
//         onOpenChange={(open) => {
//           if (!open) setSelectedAccount(null)
//           setDialogOpen(open ? 'resolve' : '')
//         }}
//       >
//         <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
//           <DialogHeader>
//             <DialogTitle>
//               Resolution for {selectedAccount?.memberAccountName || ''}
//             </DialogTitle>
//           </DialogHeader>
//           <div className='mt-6'>
//             <Textarea
//               placeholder='Enter resolution notes here...'
//               className='w-full'
//             />
//           </div>
//           <DialogFooter>
//             <Button
//               onClick={() => {
//                 setDialogOpen('')
//                 alert(
//                   'Resolution submitted successfully for ' +
//                     selectedAccount?.memberAccountName
//                 )
//               }}
//             >
//               Submit Resolution
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </MainWrapper>
//   )
// }
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'

// --------------------
// Types
// --------------------
type Account = {
  id?: number
  srNo?: string
  pacsProductCodeAndName?: string
  customerNo?: string
  pacsAccountNo?: string
  pacsName?: string
  limitSanctioned?: string
  drawingPower?: string
  dueDate?: string
  rateOfIntPacs?: string
  accruedIntPacs?: string
  expiryRatePacs?: string
  outstandingAmount?: string
  irregularity?: string
  memberSrNo?: string
  memberProdName?: string
  memberCustomerNo?: string
  memberAccountNo?: string
  memberAccountName?: string
  brNo?: string
  memberLimitSanctioned?: string
  memberDrawingPower?: string
  memberDueDate?: string
  memberUnpaidPrinciple?: string
  memberRateOfInt?: string
  memberAccruedInt?: string
  memberExpiryRate?: string
  memberOutstanding?: string
  memberIrregularity?: string
}

type AlertItem = {
  id: number
  type: string
  description: string
  status: string
  accountNo?: string
  linkedAccount?: Account | null
}

export const Route = createFileRoute('/_authenticated/alerts/dmr-alert')({
  component: RouteComponent,
})

function generateAlerts(accounts: Account[]): AlertItem[] {
  const alerts: AlertItem[] = []
  let idCounter = 1

  const addAlert = (type: string, description: string, acc?: Account) => {
    alerts.push({
      id: idCounter++,
      type,
      description,
      status: 'Pending',
      accountNo: acc?.memberAccountNo,
      linkedAccount: acc,
    })
  }

  if (accounts.length === 0) return alerts

  // Helper to pick a random account
  const getRandomAccount = () =>
    accounts[Math.floor(Math.random() * accounts.length)]

  // -------------------------
  // 2 alerts - Mobile number change near disbursement
  // -------------------------
  for (let i = 0; i < 2; i++) {
    const acc = getRandomAccount()
    addAlert(
      'MOBILE CHANGE',
      `Mobile number changed immediately before/after disbursement for ${acc.memberAccountName}.`,
      acc
    )
  }

  // -------------------------
  // 3 alerts - KCC overdue despite high SB balance
  // -------------------------
  for (let i = 0; i < 3; i++) {
    const acc = getRandomAccount()
    addAlert(
      'KCC OVERDUE HIGH SB BALANCE',
      `KCC account ${acc.memberAccountNo} is overdue despite significant SB balance.`,
      acc
    )
  }

  // -------------------------
  // 1 alert - DMR account limit increase > 15% YoY
  // -------------------------
  {
    const acc = getRandomAccount()
    addAlert(
      'DMR LIMIT INCREASE',
      `DMR account ${acc.memberAccountNo} limit increased >15% YoY.`,
      acc
    )
  }

  // -------------------------
  // 3 alerts - DMR/SB Customer Number Mismatch
  // -------------------------
  for (let i = 0; i < 3; i++) {
    const acc = getRandomAccount()
    addAlert(
      'CUSTOMER NO MISMATCH',
      `DMR and SB customer numbers mismatch for ${acc.memberAccountName}.`,
      acc
    )
  }

  return alerts
}

// function generateAlerts(accounts: Account[]): AlertItem[] {
//   const alerts: AlertItem[] = []
//   let idCounter = 1

//   const addAlert = (type: string, description: string, acc?: Account) => {
//     alerts.push({
//       id: idCounter++,
//       type,
//       description,
//       status: 'Pending',
//       accountNo: acc?.memberAccountNo,
//       linkedAccount: acc ?? null,
//     })
//   }

//   // -------------------------
//   // 1. Existing KCC Alerts
//   // -------------------------
//   accounts.forEach((acc) => {
//     // Repayment default but fresh KCC
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberUnpaidPrinciple || '0') > 0
//     ) {
//       addAlert(
//         'KCC CASH',
//         `Repayment default: ${acc.memberAccountName} has outstanding with new KCC issued.`,
//         acc
//       )
//     }

//     // KCC overdue but not NPA
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberIrregularity || '0') === 0
//     ) {
//       addAlert(
//         'KCC LOAN',
//         `Account ${acc.memberAccountNo} overdue but not marked NPA.`,
//         acc
//       )
//     }
//   })

//   // -------------------------
//   // 2. Cross-account Checks
//   // -------------------------

//   // Repetitive KCC KIND loan
//   const kindMap: Record<string, Account[]> = {}
//   accounts
//     .filter((a) => a.memberProdName?.toUpperCase().includes('KIND'))
//     .forEach((a) => {
//       const key = a.memberCustomerNo || a.memberAccountNo
//       if (!kindMap[key]) kindMap[key] = []
//       kindMap[key].push(a)
//     })

//   Object.entries(kindMap).forEach(([key, list]) => {
//     if (list.length > 1)
//       list.forEach((acc) =>
//         addAlert(
//           'KCC KIND',
//           `Repetitive KCC Kind loan for ${key} in same season.`,
//           acc
//         )
//       )
//   })

//   return alerts
// }

// function generateAlerts(accounts: Account[]): AlertItem[] {
//   const alerts: AlertItem[] = []
//   let idCounter = 1

//   const addAlert = (type: string, description: string, acc?: Account) => {
//     alerts.push({
//       id: idCounter++,
//       type,
//       description,
//       status: 'Pending',
//       accountNo: acc?.memberAccountNo,
//       linkedAccount: acc,
//     })
//   }

//   // -------------------------
//   // 1. Existing KCC Alerts
//   // -------------------------
//   accounts.forEach((acc) => {
//     // Repayment default but fresh KCC
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberUnpaidPrinciple || '0') > 0
//     ) {
//       addAlert(
//         'KCC CASH',
//         `Repayment default: ${acc.memberAccountName} has outstanding with new KCC issued.`,
//         acc
//       )
//     }

//     // KCC overdue but not NPA
//     if (
//       parseFloat(acc.memberOutstanding || '0') > 0 &&
//       parseFloat(acc.memberIrregularity || '0') === 0
//     ) {
//       addAlert(
//         'KCC LOAN',
//         `Account ${acc.memberAccountNo} overdue but not marked NPA.`,
//         acc
//       )
//     }

//     // // PACS staff as loan beneficiary
//     // if (
//     //   acc.memberAccountName?.toUpperCase().includes("STAFF") ||
//     //   acc.isStaff
//     // ) {
//     //   addAlert(
//     //     "STAFF LOAN",
//     //     `PACS staff ${acc.memberAccountName} is a loan beneficiary.`,
//     //     acc
//     //   );
//     // }

//     // // KCC limit increase >15% YoY
//     // const prevYear = parseFloat(acc.prevYearLimit || "0");
//     // const current = parseFloat(acc.memberLimitSanctioned || "0");
//     // if (prevYear > 0 && current > prevYear * 1.15) {
//     //   addAlert(
//     //     "KCC LIMIT INCREASE",
//     //     `KCC limit increased >15% YoY for ${acc.memberAccountName}.`,
//     //     acc
//     //   );
//     // }

//     // // Disbursement on weekend/holiday
//     // if (acc.disbursementDate && acc.disbursementDate !== "99/99/9999") {
//     //   const [d, m, y] = acc.disbursementDate.split("/").map(Number);
//     //   const jsDate = new Date(y, m - 1, d);
//     //   const day = jsDate.getDay();
//     //   if (day === 0 || day === 6)
//     //     addAlert(
//     //       "DISBURSEMENT TIMING",
//     //       `Loan disbursed on weekend for ${acc.memberAccountName}.`,
//     //       acc
//     //     );
//     // }

//     // // KCC disbursed but no SB activity
//     // if (
//     //   acc.memberProdName?.toUpperCase().includes("KCC") &&
//     //   parseFloat(acc.memberOutstanding || "0") > 0 &&
//     //   !acc.lastAtmTransaction
//     // ) {
//     //   addAlert(
//     //     "NO SB ACTIVITY",
//     //     `KCC account ${acc.memberAccountNo} has no linked SB activity.`,
//     //     acc
//     //   );
//     // }

//     // // Dormant account suddenly active (>6 months)
//     // if (acc.lastAtmTransaction && acc.lastAtmTransaction !== "99/99/9999") {
//     //   const lastDate = new Date(acc.lastAtmTransaction);
//     //   const diffMonths =
//     //     (Date.now() - lastDate.getTime()) / (1000 * 3600 * 24 * 30);
//     //   if (diffMonths > 6 && parseFloat(acc.memberOutstanding || "0") > 0) {
//     //     addAlert(
//     //       "DORMANT ACCOUNT ACTIVE",
//     //       `Dormant account ${acc.memberAccountNo} suddenly active.`,
//     //       acc
//     //     );
//     //   }
//     // }
//   })

//   // -------------------------
//   // 2. Cross-account Checks
//   // -------------------------
//   // const mapBy = (key: keyof Account) => {
//   //   const map: Record<string, Account[]> = {};
//   //   accounts.forEach((acc) => {
//   //     const val = acc[key] as string;
//   //     if (val) (map[val] = map[val] || []).push(acc);
//   //   });
//   //   return map;
//   // };

//   // Repetitive KCC KIND loan
//   const kindMap = accounts
//     .filter((a) => a.memberProdName?.toUpperCase().includes('KIND'))
//     .reduce(
//       (m, a) => {
//         const k = a.memberCustomerNo || a.memberAccountNo || ''
//         ;(m[k] = m[k] || []).push(a)
//         return m
//       },
//       {} as Record<string, Account[]>
//     )
//   Object.entries(kindMap).forEach(([key, list]) => {
//     if (list.length > 1)
//       list.forEach((acc) =>
//         addAlert(
//           'KCC KIND',
//           `Repetitive KCC Kind loan for ${key} in same season.`,
//           acc
//         )
//       )
//   })

//   // // Shared Aadhaar
//   // Object.entries(mapBy("aadhaarNo")).forEach(([aadhaar, list]) => {
//   //   if (list.length > 1)
//   //     list.forEach((acc) =>
//   //       addAlert(
//   //         "SHARED AADHAAR",
//   //         `Aadhaar ${aadhaar} linked to ${list.length} accounts.`,
//   //         acc
//   //       )
//   //     );
//   // });

//   // // Shared Mobile >=5
//   // Object.entries(mapBy("mobileNo")).forEach(([mob, list]) => {
//   //   if (list.length >= 5)
//   //     list.forEach((acc) =>
//   //       addAlert(
//   //         "SHARED MOBILE",
//   //         `Mobile ${mob} used in ${list.length} accounts.`,
//   //         acc
//   //       )
//   //     );
//   // });

//   // // Shared Address
//   // Object.entries(mapBy("address")).forEach(([addr, list]) => {
//   //   if (list.length > 1)
//   //     list.forEach((acc) =>
//   //       addAlert(
//   //         "SHARED ADDRESS",
//   //         `Address ${addr} linked to ${list.length} accounts.`,
//   //         acc
//   //       )
//   //     );
//   // });

//   // -------------------------
//   // 3. Savings/ATM/Branch Alerts
//   // -------------------------
//   // accounts.forEach((acc) => {
//   //   const outAmt = parseFloat(acc.outstandingAmount || "0");
//   //   const depAmt = parseFloat(acc.depositAmount || "0");
//   //   const wdAmt = parseFloat(acc.withdrawalAmount || "0");
//   //   const inflow = parseFloat(acc.monthlyInflows || "0");

//   //   if (parseFloat(acc.atmDistance || "0") > 50 && outAmt > 20000)
//   //     addAlert(
//   //       "ATM DISTANCE",
//   //       `High-value ATM usage >20k at distance >50km for ${acc.memberAccountName}`,
//   //       acc
//   //     );

//   //   if ((acc.fullWithdrawalCount || 0) > 2)
//   //     addAlert(
//   //       "FREQUENT FULL WITHDRAWAL",
//   //       `Frequent full withdrawals for ${acc.memberAccountName}`,
//   //       acc
//   //     );

//   //   if (outAmt > 50000 || depAmt > 50000)
//   //     addAlert(
//   //       "HIGH CASH DEPOSIT",
//   //       `High-value cash deposit for ${acc.memberAccountName}`,
//   //       acc
//   //     );

//   //   if (depAmt >= 10000 && acc.depositDate)
//   //     addAlert(
//   //       "REPEATED SMALL DEPOSITS",
//   //       `Small cash deposit >=10k detected for ${acc.memberAccountName}`,
//   //       acc
//   //     );

//   //   if ((acc.atmDeclineCount || 0) > 5)
//   //     addAlert(
//   //       "HIGH ATM DECLINE",
//   //       `High ATM decline rate for ${acc.memberAccountName}`,
//   //       acc
//   //     );

//   //   if (inflow > 0 && wdAmt >= inflow * 0.8)
//   //     addAlert(
//   //       "WITHDRAWAL >80%",
//   //       `Withdrawals >80% of monthly inflows for ${acc.memberAccountName}`,
//   //       acc
//   //     );
//   // });

//   return alerts
// }

function RouteComponent() {
  const [pacsName, setPacsName] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [dialogOpen, setDialogOpen] = useState<'view' | 'resolve' | ''>('')
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  const { data: accounts = [], isLoading: loadingAccounts } = $api.useQuery(
    'get',
    '/pacs/all',
    {}
  )

  const isLoading = loadingAccounts
  const accountNames = Array.from(new Set(accounts.map((acc) => acc.pacsName)))

  const alertsColumns: PaginatedTableColumn<AlertItem>[] = [
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'accountNo', label: 'Account Number' },
    { key: 'status', label: 'Status' },
    {
      key: 'linkedAccount',
      label: 'Action',
      render: (_value, row) => (
        <>
          <Button
            variant='link'
            onClick={() => {
              setSelectedAccount(row.linkedAccount ?? null)
              setDialogOpen('view')
            }}
          >
            <Eye size={18} aria-hidden='true' />
          </Button>
          <Button
            variant='link'
            onClick={() => {
              setSelectedAccount(row.linkedAccount ?? null)
              setDialogOpen('resolve')
            }}
          >
            Resolve
          </Button>
        </>
      ),
    },
  ]

  const handlePacsClick = (value: string) => {
    setPacsName(value)
    if (value) {
      const filtered = accounts.filter((acc) => acc.pacsName === value)
      const alertsGenerated = generateAlerts(filtered)
      setAlerts(alertsGenerated)
    } else {
      setAlerts([])
    }
  }

  return (
    <MainWrapper>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}
      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          DMR Alerts
        </h1>
      </div>
      <Select onValueChange={handlePacsClick}>
        <SelectTrigger className='my-4 w-full max-w-xl'>
          <SelectValue placeholder='Select PACS Name' />
        </SelectTrigger>
        <SelectContent>
          {accountNames.map((name) => (
            <SelectItem key={name} value={name || ''}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pacsName && (
        <div className='mb-4'>
          <h2 className='my-4 text-lg font-semibold'>
            Accounts for PACS: {pacsName}
          </h2>
          <PaginatedTable
            data={alerts}
            columns={alertsColumns}
            emptyMessage='No alerts to display at the moment.'
          />
        </div>
      )}
      <Dialog
        open={dialogOpen === 'view'}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null)
          setDialogOpen(open ? 'view' : '')
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Details for Account: {selectedAccount?.memberAccountName || ''}
            </DialogTitle>
          </DialogHeader>
          <div className='grid grid-cols-1 gap-4 border-t border-gray-200 p-2 text-sm text-gray-700 md:grid-cols-2'>
            {selectedAccount &&
              Object.entries(selectedAccount).map(([key, value]) => (
                <p key={key} className='break-words'>
                  <strong className='text-gray-900'>
                    {key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
                    :
                  </strong>{' '}
                  {value || '-'}
                </p>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialogOpen === 'resolve'}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null)
          setDialogOpen(open ? 'resolve' : '')
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Resolution for {selectedAccount?.memberAccountName || ''}
            </DialogTitle>
          </DialogHeader>

          <div className='mt-6'>
            <Textarea
              placeholder='Enter resolution notes here...'
              className='w-full'
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen('')
                alert(
                  'Resolution submitted successfully for ' +
                    selectedAccount?.memberAccountName
                )
              }}
            >
              Submit Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainWrapper>
  )
}
