// import { useState } from 'react'
// import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { Download, MoreVertical, Play } from 'lucide-react'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api, BASE_URL } from '@/lib/api.ts'
// import { Button } from '@/components/ui/button.tsx'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu.tsx'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import { Separator } from '@/components/ui/separator.tsx'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import {
//   AccountNoCell,
//   CurrencyCell,
//   DateTimeCell,
//   AuditPeriodCell,
// } from '@/components/table/cells.ts'

// type SearchParams = {
//   tab: 'COMPLETED' | 'PENDING' | 'STARTED'
// }

// type ReportRouteKey = 'DEFAULT' | 'UGB' | 'CRGB' | 'RGB' | 'ACRB' | 'MRB'

// type ReportRouteConfig = {
//   to: string
//   assignmentParamKey:
//   | 'assignmentId'
//   | 'assignmentIdUGB'
//   | 'assignmentIdCRGB'
//   | 'assignmentIdRGB'
//   | 'assignmentIdACRB'
//   | 'assignmentIdMRB'
// }

// export const Route = createFileRoute(
//   '/_authenticated/stock-audit/assigned-audits'
// )({
//   component: RouteComponent,
//   validateSearch: (search): SearchParams => ({
//     tab: (search.tab &&
//       ['COMPLETED', 'STARTED', 'PENDING'].includes(search.tab as string)
//       ? (search.tab as string)
//       : 'PENDING') as SearchParams['tab'],
//   }),
// })

// function RouteComponent() {
//   // ---- HOOKS ----
//   const [selectedReportRoute, setSelectedReportRoute] =
//     useState<ReportRouteKey>('UGB')

//   const user = useAuthStore().auth.user
//   const { tab } = Route.useSearch()
//   const navigate = useNavigate()

//   // ---- API: fetch assigned audits ----
//   const { data, isLoading, error } = $api.useQuery(
//     'get',
//     '/stockAudit/history/auditor/{auditorUsername}',
//     {
//       params: {
//         path: {
//           auditorUsername: user?.username ?? '',
//           // if API does not need this, you can remove it
//           username: user?.username ?? '',
//         },
//       },
//     }
//   )

//   // ---- API: start audit ----
//   const startAuditMutation = $api.useMutation(
//     'post',
//     '/stockAudit/{assignmentId}/start',
//     {
//       onSuccess: (res) => {
//         navigate({
//           to: '/stock-audit/$accountId/descriptions/$assignmentId',
//           params: {
//             assignmentId: res.data?.id ? String(res.data.id) : '',
//             accountId: res.data?.accountNo ? String(res.data.accountNo) : '',
//           },
//         })
//       },
//     }
//   )

//   const isProcessingSomething = isLoading || startAuditMutation.isPending

//   if (isLoading) return <MainWrapper>Loading...</MainWrapper>
//   if (error || !data?.data) return <MainWrapper>Error loading data</MainWrapper>

//   const { PENDING, COMPLETED, STARTED } = data.data

//   // ---- Columns for table ----
//   const columns: PaginatedTableProps<
//     components['schemas']['StockAuditAssignment']
//   >['columns'] = [
//       {
//         key: 'accountNo',
//         label: 'Account No',
//         render: (value) => <AccountNoCell value={value} />,
//       },
//       {
//         key: 'auditPeriodFrom',
//         label: 'From',
//         render: (from, row) => (
//           <AuditPeriodCell from={from ?? ''} to={row.auditPeriodTo ?? ''} />
//         ),
//       },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         render: (v) => <CurrencyCell value={v} />,
//       },
//       {
//         key: 'createdAt',
//         label: 'Created At',
//         render: (value) => <DateTimeCell value={value ?? ''} />,
//       },
//     ]

//   const tabs = [
//     { key: 'PENDING', label: 'Pending', data: PENDING },
//     { key: 'STARTED', label: 'Started', data: STARTED },
//     { key: 'COMPLETED', label: 'Completed', data: COMPLETED },
//   ] as const

//   // ---- Dynamic report route config (path + param name) ----
//   const reportRouteConfig: Record<ReportRouteKey, ReportRouteConfig> = {
//     // DEFAULT: {
//     //   to: '/stock-audit/$accountId/report/$assignmentId',
//     //   assignmentParamKey: 'assignmentId',
//     // },
//     DEFAULT: {
//       to: '/stock-audit/$accountId/report/$assignmentIdUGB',
//       assignmentParamKey: 'assignmentIdUGB',
//     },
//     UGB: {
//       to: '/stock-audit/$accountId/report/$assignmentIdUGB',
//       assignmentParamKey: 'assignmentIdUGB',
//     },
//     CRGB: {
//       to: '/stock-audit/$accountId/report/$assignmentIdCRGB',
//       assignmentParamKey: 'assignmentIdCRGB',
//     },
//     RGB: {
//       to: '/stock-audit/$accountId/report/$assignmentIdRGB',
//       assignmentParamKey: 'assignmentIdRGB',
//     },
//     ACRB: {
//       to: '/stock-audit/$accountId/report/$assignmentIdACRB',
//       assignmentParamKey: 'assignmentIdACRB',
//     },
//     MRB: {
//       to: '/stock-audit/$accountId/report/$assignmentIdMRB',
//       assignmentParamKey: 'assignmentIdMRB',
//     },
//   }

//   return (
//     <MainWrapper>
//       <div className="text-2xl font-semibold">Assigned Audits</div>
//       <Separator className="my-2 lg:my-4" />

//       {/* Global selector for report type */}
//       <div className="hidden mb-4 flex items-center gap-2 text-sm">
//         <span className="font-medium">Bank Format:</span>
//         <select
//           className="border rounded px-2 py-1 text-xs lg:text-sm"
//           value={selectedReportRoute}
//           onChange={(e) =>
//             setSelectedReportRoute(e.target.value as ReportRouteKey)
//           }
//         >
//           {/* <option value="DEFAULT">Default</option>           */}
//           <option value="DEFAULT">Default</option>
//           <option value="UGB">UGB</option>
//           <option value="CRGB">CRGB</option>
//           <option value="RGB">RGB</option>
//           <option value="ACRB">ACRB</option>
//           <option value="MRB">MRB</option>
//         </select>
//       </div>

//       <Tabs
//         value={tab}
//         onValueChange={(value) =>
//           navigate({
//             to: '.',
//             search: (prev) => ({
//               ...prev,
//               tab: value as SearchParams['tab'],
//             }),
//           })
//         }
//         className="w-full"
//       >
//         <TabsList className="mb-4">
//           {tabs.map((t) => (
//             <TabsTrigger key={t.key} value={t.key}>
//               {t.label} ({t.data.length})
//             </TabsTrigger>
//           ))}
//         </TabsList>

//         {tabs.map((t) => (
//           <TabsContent key={t.key} value={t.key}>
//             <PaginatedTable
//               data={t.data}
//               columns={columns}
//               tableTitle={`${t.label} Audits`}
//               showSearch
//               emptyMessage={`No ${t.label.toLowerCase()} audits found.`}
//               initialRowsPerPage={5}
//               renderActions={(row) => {
//                 const cfg = reportRouteConfig[selectedReportRoute]

//                 return (
//                   <div className="flex flex-row gap-2 items-center">
//                     {/* PENDING => Start Audit */}
//                     {row.status === 'PENDING' && (
//                       <Button
//                         size="sm"
//                         disabled={isProcessingSomething}
//                         onClick={() => {
//                           startAuditMutation.mutate({
//                             params: {
//                               path: { assignmentId: row.id ?? 0 },
//                               header: {
//                                 Authorization: ''
//                               }
//                             },
//                           })
//                         }}
//                       >
//                         <Play className="h-4 w-4" />{' '}
//                         {startAuditMutation.isPending ? 'Starting...' : 'Start'}
//                       </Button>
//                     )}

//                     {/* STARTED + description completed => Complete Audit with dynamic route */}
//                     {row.status === 'STARTED' &&
//                       row.descriptionStatus === 'COMPLETED' ? (
//                       <Link
//                         to={cfg.to}
//                         params={{
//                           accountId: row.accountNo ?? '',
//                           // dynamic param key: assignmentId / assignmentIdRGB / etc.
//                           [cfg.assignmentParamKey]: `${row.id ?? ''}`,
//                         }}
//                       >
//                         <Button
//                           size="sm"
//                           disabled={isProcessingSomething}
//                           onClick={() => { }}
//                         >
//                           Complete Audit
//                         </Button>
//                       </Link>
//                     ) : null}

//                     {/* STARTED + description pending => Fill Descriptions */}
//                     {row.status === 'STARTED' &&
//                       row.descriptionStatus === 'PENDING' ? (
//                       <Link
//                         to="/stock-audit/$accountId/descriptions/$assignmentId"
//                         params={{
//                           assignmentId: `${row.id ?? ''}`,
//                           accountId: row.accountNo ?? '',
//                         }}
//                       >
//                         <Button
//                           size="sm"
//                           disabled={isProcessingSomething}
//                           onClick={() => { }}
//                         >
//                           Fill Descriptions
//                         </Button>
//                       </Link>
//                     ) : null}

//                     {/* Dropdown actions */}
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           className="h-8 w-8"
//                         >
//                           <MoreVertical className="h-4 w-4" />
//                           <span className="sr-only">Open row actions</span>
//                         </Button>
//                       </DropdownMenuTrigger>

//                       <DropdownMenuContent align="end" className="w-48">
//                         {row.status === 'COMPLETED' && (
//                           <DropdownMenuItem
//                             disabled={!!row.id && isProcessingSomething}
//                             onSelect={() => { }}
//                           >
//                             <a
//                               // href={`${BASE_URL}/stockAudit/fullReportPdf/${row.id ?? 0
//                               //   }`}
//                               href={`${BASE_URL}/api/stock-audit/pdf/assignment/${row.id ?? 0}`}
//                               className="flex w-full items-center gap-2"
//                             >
//                               <Download className="mr-2 h-4 w-4" />
//                               <span>Audit Report</span>
//                             </a>
//                           </DropdownMenuItem>
//                         )}

//                         <DropdownMenuItem
//                           asChild
//                           onSelect={(e) => e.preventDefault()}
//                         >
//                           <a
//                             href={`${BASE_URL}/stockAudit/generatePdf/${row.id ?? 0
//                               }`}
//                             className="flex w-full items-center gap-2"
//                           >
//                             <Download className="mr-2 h-4 w-4" />
//                             <span>Assignment Letter</span>
//                           </a>
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </div>
//                 )
//               }}
//             />
//           </TabsContent>
//         ))}
//       </Tabs>
//     </MainWrapper>
//   )
// }















































import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { Download, MoreVertical, Play } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api, BASE_URL } from '@/lib/api.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import {
  AccountNoCell,
  CurrencyCell,
  DateTimeCell,
  AuditPeriodCell,
} from '@/components/table/cells.ts'

type SearchParams = {
  tab: 'COMPLETED' | 'PENDING' | 'STARTED'
}

export const Route = createFileRoute(
  '/_authenticated/stock-audit/assigned-audits'
)({
  component: RouteComponent,
  validateSearch: (search): SearchParams => ({
    tab: (search.tab &&
      ['COMPLETED', 'STARTED', 'PENDING'].includes(search.tab as string)
      ? (search.tab as string)
      : 'PENDING') as SearchParams['tab'],
  }),
})

function RouteComponent() {
  const user = useAuthStore().auth.user

  const { tab } = Route.useSearch()

  const { data, isLoading, error } = $api.useQuery(
    'get',
    '/stockAudit/history/auditor/{auditorUsername}',
    {
      params: {
        path: {
          auditorUsername: user?.username ?? '',
          username: user?.username ?? '',
        },
      },
    }
  )

  const navigate = useNavigate()

  const startAuditMutation = $api.useMutation(
    'post',
    '/stockAudit/{assignmentId}/start',
    {
      onSuccess: (res) => {
        navigate({
          to: '/stock-audit/$accountId/descriptions/$assignmentId',
          params: {
            assignmentId: res.data?.id ? String(res.data.id) : '',
            accountId: res.data?.accountNo ? String(res.data.accountNo) : '',
          },
        })
      },
    }
  )

  const isProcessingSomething = isLoading || startAuditMutation.isPending

  if (isLoading) return <MainWrapper>Loading...</MainWrapper>
  if (error || !data?.data) return <MainWrapper>Error loading data</MainWrapper>

  const { PENDING, COMPLETED, STARTED } = data.data

  const columns: PaginatedTableProps<
    components['schemas']['StockAuditAssignment']
  >['columns'] = [
      // { key: 'accountNo', label: 'Account No', render: AccountNoCell },
      {
        key: 'accountNo',
        label: 'Account No',
        render: (value) => <AccountNoCell value={value} />,
      },

      {
        key: 'auditPeriodFrom',
        label: 'From',
        render: (from, row) => (
          <AuditPeriodCell from={from ?? ''} to={row.auditPeriodTo ?? ''} />
        ),
      },
      // { key: 'stockLocation', label: 'Stock Location' },
      {
        key: 'sanctionLimit',
        label: 'Sanction Limit',
        render: (v) => <CurrencyCell value={v} />,
      },

      {
        key: 'createdAt',
        label: 'Created At',
        render: (value) => <DateTimeCell value={value ?? ''} />,
      },
    ]

  const tabs = [
    { key: 'PENDING', label: 'Pending', data: PENDING },
    { key: 'STARTED', label: 'Started', data: STARTED },
    { key: 'COMPLETED', label: 'Completed', data: COMPLETED },
  ]

  return (
    <MainWrapper>
      <div className='text-2xl font-semibold'>Assigned Audits</div>
      <Separator className='my-2 lg:my-4' />

      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({
            to: '.',
            search: (prev) => ({ ...prev, tab: value as 'COMPLETED' }),
          })
        }
        className='w-full'
      >
        <TabsList className='mb-4'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label} ({tab.data.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <PaginatedTable
              data={tab.data}
              columns={columns}
              tableTitle={`${tab.label} Audits`}
              showSearch
              emptyMessage={`No ${tab.label.toLowerCase()} audits found.`}
              initialRowsPerPage={5}
              renderActions={(row) => {
                return (
                  <div className='flex flex-row gap-2'>
                    {row.status === 'PENDING' && (
                      <Button
                        size='sm'
                        disabled={isProcessingSomething}
                        onClick={() => {
                          startAuditMutation.mutate({
                            params: {
                              path: { assignmentId: row.id ?? 0 },
                              header: { Authorization: '' },
                            },
                          })
                        }}
                      >
                        <Play className='h-4 w-4' />{' '}
                        {startAuditMutation.isPending ? 'Starting...' : 'Start'}
                      </Button>
                      // </Link>
                    )}

                    {row.status === 'STARTED' &&
                      row.descriptionStatus === 'COMPLETED' ? (
                      <Link
                        to='/stock-audit/$accountId/report/$assignmentId'
                        params={{
                          assignmentId: `${row.id}`,
                          accountId: row.accountNo ?? '',
                        }}
                      >
                        <Button
                          size='sm'
                          disabled={isProcessingSomething}
                          onClick={() => { }}
                        >
                          Complete Audit
                        </Button>
                      </Link>
                    ) : null}

                    {row.status === 'STARTED' &&
                      row.descriptionStatus === 'PENDING' ? (
                      <Link
                        to='/stock-audit/$accountId/descriptions/$assignmentId'
                        params={{
                          assignmentId: `${row.id}`,
                          accountId: row.accountNo ?? '',
                        }}
                      >
                        <Button
                          size='sm'
                          disabled={isProcessingSomething}
                          onClick={() => { }}
                        >
                          Fill Descriptions
                        </Button>
                      </Link>
                    ) : null}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size='icon' variant='ghost' className='h-8 w-8'>
                          <MoreVertical className='h-4 w-4' />
                          <span className='sr-only'>Open row actions</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align='end' className='w-48'>
                        {row.status === 'COMPLETED' && (
                          <DropdownMenuItem
                            disabled={!!row.id && isProcessingSomething}
                            onSelect={() => { }}
                          >
                            <a
                              // href={`${BASE_URL}/stockAudit/fullReportPdf/${row.id ?? 0}`}                              
                              href={`${BASE_URL}/api/stock-audit/pdf/assignment/${row.id ?? 0}`}
                              className='flex w-full items-center gap-2'
                            >
                              <Download className='mr-2 h-4 w-4' />
                              <span>Audit Report</span>
                            </a>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          asChild
                          onSelect={(e) => e.preventDefault()}
                        >
                          <a
                            href={`${BASE_URL}/stockAudit/generatePdf/${row.id ?? 0}`}
                            className='flex w-full items-center gap-2'
                          >
                            <Download className='mr-2 h-4 w-4' />
                            <span>Assignment Letter</span>
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </MainWrapper>
  )
}












// import { useState } from 'react'
// import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { Download, MoreVertical, Play } from 'lucide-react'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api, BASE_URL } from '@/lib/api.ts'
// import { Button } from '@/components/ui/button.tsx'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu.tsx'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// import { Separator } from '@/components/ui/separator.tsx'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import PaginatedTable, {
//   PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import {
//   AccountNoCell,
//   CurrencyCell,
//   DateTimeCell,
//   AuditPeriodCell,
// } from '@/components/table/cells.ts'

// type SearchParams = {
//   tab: 'COMPLETED' | 'PENDING' | 'STARTED'
// }

// type ReportRouteKey = 'DEFAULT' | 'UGB' | 'CRGB' | 'RGB' | 'ACRB'

// export const Route = createFileRoute(
//   '/_authenticated/stock-audit/assigned-audits'
// )({
//   component: RouteComponent,
//   validateSearch: (search): SearchParams => ({
//     tab: (search.tab &&
//       ['COMPLETED', 'STARTED', 'PENDING'].includes(search.tab as string)
//       ? (search.tab as string)
//       : 'PENDING') as SearchParams['tab'],
//   }),
// })

// function RouteComponent() {
//   // ✅ HOOKS MUST BE AT THE TOP (before any early return)
//   const [selectedReportRoute, setSelectedReportRoute] =
//     useState<ReportRouteKey>('DEFAULT')

//   const user = useAuthStore().auth.user
//   const { tab } = Route.useSearch()
//   const navigate = useNavigate()

//   const { data, isLoading, error } = $api.useQuery(
//     'get',
//     '/stockAudit/history/auditor/{auditorUsername}',
//     {
//       params: {
//         path: {
//           auditorUsername: user?.username ?? '',
//           username: user?.username ?? '',
//         },
//       },
//     }
//   )

//   const startAuditMutation = $api.useMutation(
//     'post',
//     '/stockAudit/{assignmentId}/start',
//     {
//       onSuccess: (res) => {
//         navigate({
//           to: '/stock-audit/$accountId/descriptions/$assignmentId',
//           params: {
//             assignmentId: res.data?.id ? String(res.data.id) : '',
//             accountId: res.data?.accountNo ? String(res.data.accountNo) : '',
//           },
//         })
//       },
//     }
//   )

//   const isProcessingSomething = isLoading || startAuditMutation.isPending

//   if (isLoading) return <MainWrapper>Loading...</MainWrapper>
//   if (error || !data?.data) return <MainWrapper>Error loading data</MainWrapper>

//   const { PENDING, COMPLETED, STARTED } = data.data

//   const columns: PaginatedTableProps<
//     components['schemas']['StockAuditAssignment']
//   >['columns'] = [
//       {
//         key: 'accountNo',
//         label: 'Account No',
//         render: (value) => <AccountNoCell value={value} />,
//       },
//       {
//         key: 'auditPeriodFrom',
//         label: 'From',
//         render: (from, row) => (
//           <AuditPeriodCell from={from ?? ''} to={row.auditPeriodTo ?? ''} />
//         ),
//       },
//       {
//         key: 'sanctionLimit',
//         label: 'Sanction Limit',
//         render: (v) => <CurrencyCell value={v} />,
//       },
//       {
//         key: 'createdAt',
//         label: 'Created At',
//         render: (value) => <DateTimeCell value={value ?? ''} />,
//       },
//     ]

//   const tabs = [
//     { key: 'PENDING', label: 'Pending', data: PENDING },
//     { key: 'STARTED', label: 'Started', data: STARTED },
//     { key: 'COMPLETED', label: 'Completed', data: COMPLETED },
//   ]

//   // Map for dynamic report routes
//   const reportRouteMap: Record<ReportRouteKey, string> = {
//     DEFAULT: '/stock-audit/$accountId/report/$assignmentId',
//     UGB: '/stock-audit/$accountId/report/$assignmentIdUGB',
//     CRGB: '/stock-audit/$accountId/report/$assignmentIdCRGB',
//     RGB: '/stock-audit/$accountId/report/$assignmentIdRGB',
//     ACRB: '/stock-audit/$accountId/report/$assignmentIdACRB',
//   }

//   return (
//     <MainWrapper>
//       <div className='text-2xl font-semibold'>Assigned Audits</div>
//       <Separator className='my-2 lg:my-4' />

//       {/* Global selector for report type */}
//       <div className='mb-4 flex items-center gap-2 text-sm'>
//         <span className='font-medium'>Bank Format:</span>
//         <select
//           className='border rounded px-2 py-1 text-xs lg:text-sm'
//           value={selectedReportRoute}
//           onChange={(e) =>
//             setSelectedReportRoute(e.target.value as ReportRouteKey)
//           }
//         >
//           {/* <option value='DEFAULT'>Default</option> */}
//           <option value='UGB'>Default</option>
//           <option value='UGB'>UGB</option>
//           <option value='CRGB'>CRGB</option>
//           <option value='RGB'>RGB</option>
//           <option value='ACRB'>ACRB</option>
//         </select>
//       </div>

//       <Tabs
//         value={tab}
//         onValueChange={(value) =>
//           navigate({
//             to: '.',
//             search: (prev) => ({ ...prev, tab: value as 'COMPLETED' }),
//           })
//         }
//         className='w-full'
//       >
//         <TabsList className='mb-4'>
//           {tabs.map((tab) => (
//             <TabsTrigger key={tab.key} value={tab.key}>
//               {tab.label} ({tab.data.length})
//             </TabsTrigger>
//           ))}
//         </TabsList>

//         {tabs.map((tab) => (
//           <TabsContent key={tab.key} value={tab.key}>
//             <PaginatedTable
//               data={tab.data}
//               columns={columns}
//               tableTitle={`${tab.label} Audits`}
//               showSearch
//               emptyMessage={`No ${tab.label.toLowerCase()} audits found.`}
//               initialRowsPerPage={5}
//               renderActions={(row) => {
//                 return (
//                   <div className='flex flex-row gap-2 items-center'>
//                     {row.status === 'PENDING' && (
//                       <Button
//                         size='sm'
//                         disabled={isProcessingSomething}
//                         onClick={() => {
//                           startAuditMutation.mutate({
//                             params: {
//                               path: { assignmentId: row.id ?? 0 },
//                               header: { Authorization: '' },
//                             },
//                           })
//                         }}
//                       >
//                         <Play className='h-4 w-4' />{' '}
//                         {startAuditMutation.isPending ? 'Starting...' : 'Start'}
//                       </Button>
//                     )}

//                     {/* STARTED + description completed => Complete Audit with dynamic route */}
//                     {row.status === 'STARTED' &&
//                       row.descriptionStatus === 'COMPLETED' ? (
//                       <Link
//                         to={reportRouteMap[selectedReportRoute]}
//                         params={{
//                           assignmentId: `${row.id}`,
//                           accountId: row.accountNo ?? '',
//                         }}
//                       >
//                         <Button
//                           size='sm'
//                           disabled={isProcessingSomething}
//                           onClick={() => { }}
//                         >
//                           Complete Audit
//                         </Button>
//                       </Link>
//                     ) : null}

//                     {/* STARTED + description pending => Fill Descriptions */}
//                     {row.status === 'STARTED' &&
//                       row.descriptionStatus === 'PENDING' ? (
//                       <Link
//                         to='/stock-audit/$accountId/descriptions/$assignmentId'
//                         params={{
//                           assignmentId: `${row.id}`,
//                           accountId: row.accountNo ?? '',
//                         }}
//                       >
//                         <Button
//                           size='sm'
//                           disabled={isProcessingSomething}
//                           onClick={() => { }}
//                         >
//                           Fill Descriptions
//                         </Button>
//                       </Link>
//                     ) : null}

//                     {/* Dropdown actions */}
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button size='icon' variant='ghost' className='h-8 w-8'>
//                           <MoreVertical className='h-4 w-4' />
//                           <span className='sr-only'>Open row actions</span>
//                         </Button>
//                       </DropdownMenuTrigger>

//                       <DropdownMenuContent align='end' className='w-48'>
//                         {row.status === 'COMPLETED' && (
//                           <DropdownMenuItem
//                             disabled={!!row.id && isProcessingSomething}
//                             onSelect={() => { }}
//                           >
//                             <a
//                               href={`${BASE_URL}/stockAudit/fullReportPdf/${row.id ?? 0
//                                 }`}
//                               className='flex w-full items-center gap-2'
//                             >
//                               <Download className='mr-2 h-4 w-4' />
//                               <span>Audit Report</span>
//                             </a>
//                           </DropdownMenuItem>
//                         )}

//                         <DropdownMenuItem
//                           asChild
//                           onSelect={(e) => e.preventDefault()}
//                         >
//                           <a
//                             href={`${BASE_URL}/stockAudit/generatePdf/${row.id ?? 0
//                               }`}
//                             className='flex w-full items-center gap-2'
//                           >
//                             <Download className='mr-2 h-4 w-4' />
//                             <span>Assignment Letter</span>
//                           </a>
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </div>
//                 )
//               }}
//             />
//           </TabsContent>
//         ))}
//       </Tabs>
//     </MainWrapper>
//   )
// }