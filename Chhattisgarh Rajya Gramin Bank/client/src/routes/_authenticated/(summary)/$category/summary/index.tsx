// import { useMemo, useState, type ReactNode } from 'react'
// import { createFileRoute, Link, redirect } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import Select, { MultiValue } from 'react-select'
// import LoadingBar from 'react-top-loading-bar'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api } from '@/lib/api.ts'
// import { Button } from '@/components/ui/button.tsx'
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card.tsx'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog.tsx'
// import { Input } from '@/components/ui/input.tsx'
// import { Label } from '@/components/ui/label.tsx'
// import { Skeleton } from '@/components/ui/skeleton.tsx'
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
// import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx'
// import { Home } from '@/components/breadcrumb/common-crumbs.ts'
// import { Header } from '@/components/layout/header.tsx'
// import { Main } from '@/components/layout/main.tsx'
// import PaginatedTable, {
//   type PaginatedTableProps,
// } from '@/components/paginated-table.tsx'
// import { ProfileDropdown } from '@/components/profile-dropdown.tsx'
// import { Search } from '@/components/search.tsx'
// import { AccountNoCell, CurrencyCell } from '@/components/table/cells.ts'
// import { ThemeSwitch } from '@/components/theme-switch.tsx'
// import BranchSelector from '@/features/dashboard/components/branch-selector'
// type AccountRow = components['schemas']['AccountListDto2']
// // ✅ Define columns in a safe shape that matches PaginatedTable expectation
// type TableColumn = {
//   key: string
//   label: string
//   sortable?: boolean
//   render?: (value: any, row: AccountRow) => ReactNode
// }
// const columns: TableColumn[] = [
//   {
//     key: 'acctNo',
//     label: 'Account No',
//     render: (value: AccountRow['acctNo']) =>
//       value ? <AccountNoCell value={`${value}`} /> : '-',
//   },
//   {
//     key: 'custName',
//     label: 'Customer Name',
//     render: (value: AccountRow['custName']) => (
//       <span className='font-semibold'>{value ?? '-'}</span>
//     ),
//   },
//   {
//     key: 'outstand',
//     label: 'Outstanding',
//     render: (value: AccountRow['outstand']) => (
//       <CurrencyCell value={String(value ?? 0)} />
//     ),
//   },
// ]
// export const Route = createFileRoute(
//   '/_authenticated/(summary)/$category/summary/'
// )({
//   component: RouteComponent,
//   loader: (ctx) => ({ crumb: ctx.params.category.toLocaleUpperCase() }),
//   beforeLoad: (a) => {
//     if (!['npa', 'sma', 'standard'].includes(a.params.category)) {
//       throw redirect({ to: '/' })
//     }
//   },
// })
// interface CityOptionType {
//   value: string
//   label: string
// }
// /**
//  * ✅ SMA variants (using ONE endpoint + bucket)
//  * - all  => ALL (or SMA depending on backend)
//  * - sma0 => SMA0
//  * - sma1 => SMA1
//  * - sma2 => SMA2
//  */
// type SmaVariant = 'all' | 'sma0' | 'sma1' | 'sma2'
// // ✅ One SMA endpoint only (OpenAPI: /account/SMA_All_Accounts)
// const SMA_ALL_ENDPOINT = '/account/SMA_All_Accounts' as const
// const SMA_BUCKET_MAP: Record<SmaVariant, string> = {
//   all: 'ALL', // if backend expects "SMA" for all, change this to "SMA"
//   sma0: 'SMA0',
//   sma1: 'SMA1',
//   sma2: 'SMA2',
// }
// const SMA_TITLE_MAP: Record<SmaVariant, string> = {
//   all: 'SMA Accounts Summary',
//   sma0: 'SMA 0 Accounts Summary',
//   sma1: 'SMA 1 Accounts Summary',
//   sma2: 'SMA 2 Accounts Summary',
// }
// const guideMap = {
//   standard: {
//     title: 'Standard Accounts Summary',
//     apiEndpoint: '/account/StandardAccounts',
//   },
//   npa: {
//     title: 'NPA Accounts Summary',
//     apiEndpoint: '/account/NPA_Accounts',
//   },
//   sma: {
//     title: 'SMA Accounts Summary',
//     apiEndpoint: SMA_ALL_ENDPOINT,
//   },
// } as const
// type SummaryCategory = keyof typeof guideMap
// // ✅ Endpoints used by this page
// type SummaryEndpoint =
//   | typeof SMA_ALL_ENDPOINT
//   | '/account/StandardAccounts'
//   | '/account/NPA_Accounts'
// function RouteComponent() {
//   const [branchId, setBranchId] = useState<string | undefined>(undefined)
//   const [query, setQuery] = useState('')
//   const [filtersOpen, setFiltersOpen] = useState(false)
//   const [minOutstanding, setMinOutstanding] = useState('')
//   const [maxOutstanding, setMaxOutstanding] = useState('')
//   const [selectedCities, setSelectedCities] = useState<
//     MultiValue<CityOptionType>
//   >([])
//   // ✅ Default to ALL
//   const [smaVariant, setSmaVariant] = useState<SmaVariant>('all')
//   const { category } = Route.useParams() as { category: SummaryCategory }
//   const user = useAuthStore().auth.user
//   const isBranchDropdownVisible = user?.superAdmin || user?.admin || false
//   const title =
//     category === 'sma' ? SMA_TITLE_MAP[smaVariant] : guideMap[category].title
//   const apiEndpoint: SummaryEndpoint =
//     category === 'sma'
//       ? SMA_ALL_ENDPOINT
//       : (guideMap[category].apiEndpoint as SummaryEndpoint)
//   const bucket = category === 'sma' ? SMA_BUCKET_MAP[smaVariant] : undefined
//   const { data, isLoading, error } = $api.useQuery('get', apiEndpoint, {
//     params: {
//       header: {
//         Authorization: `Bearer ${sessionStorage.getItem('token')}`,
//       },
//       query: {
//         id: branchId === 'all' ? undefined : branchId,
//         ...(category === 'sma' ? { bucket } : {}),
//       },
//     },
//   })
//   const reactSelectCityOptions: CityOptionType[] = useMemo(() => {
//     const cities = new Set<string>()
//     ;(data?.data ?? []).forEach((row: AccountRow) => {
//       const city = (row.add4 ?? '').split(' ')[0]?.trim()
//       if (city) cities.add(city)
//     })
//     return Array.from(cities)
//       .sort()
//       .map((c) => ({ value: c, label: c }))
//   }, [data?.data])
//   const outstandingStats = useMemo(() => {
//     const values: number[] = (data?.data ?? [])
//       .map((d: AccountRow) => Number(d.outstand))
//       .filter((val: number) => Number.isFinite(val))
//     const min = values.length > 0 ? Math.min(...values) : 0
//     const max = values.length > 0 ? Math.max(...values) : 0
//     return { min, max }
//   }, [data?.data])
//   const filteredData: AccountRow[] = useMemo(() => {
//     let result: AccountRow[] = data?.data ? [...data.data] : []
//     if (query) {
//       const q = query.toLowerCase()
//       result = result.filter((a: AccountRow) =>
//         Object.values(a).join(' ').toLowerCase().includes(q)
//       )
//     }
//     if (minOutstanding) {
//       const minVal = Number(minOutstanding)
//       if (!isNaN(minVal)) {
//         result = result.filter(
//           (a: AccountRow) => Number(a.outstand ?? 0) >= minVal
//         )
//       }
//     }
//     if (maxOutstanding) {
//       const maxVal = Number(maxOutstanding)
//       if (!isNaN(maxVal)) {
//         result = result.filter(
//           (a: AccountRow) => Number(a.outstand ?? 0) <= maxVal
//         )
//       }
//     }
//     if (selectedCities.length > 0) {
//       const cityValues = selectedCities.map((c) => c.value.toLowerCase())
//       result = result.filter((a: AccountRow) => {
//         const rowCity = (a.add4 ?? '').split(' ')[0]?.toLowerCase()
//         return rowCity ? cityValues.includes(rowCity) : false
//       })
//     }
//     return result
//   }, [data?.data, query, minOutstanding, maxOutstanding, selectedCities])
//   const handleApplyFilters = () => {
//     const min = Number(minOutstanding)
//     const max = Number(maxOutstanding)
//     if (!isNaN(min) && !isNaN(max) && min > max) {
//       alert('Minimum outstanding cannot be greater than maximum outstanding.')
//       return
//     }
//     setFiltersOpen(false)
//   }
//   return (
//     <>
//       <Header>
//         {isBranchDropdownVisible && (
//           <BranchSelector value={branchId} setValue={setBranchId} />
//         )}
//         <div className='ml-auto flex items-center space-x-4'>
//           <Search />
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header>
//       <LoadingBar progress={isLoading ? 70 : 100} color='#2998ff' height={3} />
//       <Main className='px-4 py-2'>
//         <AppBreadcrumb
//           className='p-2'
//           crumbs={[Home]}
//           currentPage={{
//             type: 'dropdown',
//             selectedIndex:
//               category === 'standard' ? 0 : category === 'sma' ? 1 : 2,
//             items: [
//               { label: 'Standard', to: '/standard/summary' },
//               { label: 'SMA', to: '/sma/summary' },
//               { label: 'NPA', to: '/npa/summary' },
//             ],
//           }}
//         />
//         <Card className='col-span-full shadow-lg'>
//           {/* ✅ Always visible header (Tabs will never disappear) */}
//           <CardHeader className='bg-background sticky top-0 z-10 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
//             <div className='flex flex-col gap-2'>
//               <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
//                 {title}{' '}
//                 <span className='text-sm font-normal text-gray-500'>
//                   ({isLoading ? '...' : filteredData.length} accounts)
//                 </span>
//               </CardTitle>
//               {/* ✅ Tabs ALWAYS visible even if no data */}
//               {category === 'sma' && (
//                 <Tabs
//                   value={smaVariant}
//                   onValueChange={(v) => setSmaVariant(v as SmaVariant)}
//                 >
//                   <TabsList className='w-fit'>
//                     <TabsTrigger value='all'>All</TabsTrigger>
//                     <TabsTrigger value='sma0'>SMA 0</TabsTrigger>
//                     <TabsTrigger value='sma1'>SMA 1</TabsTrigger>
//                     <TabsTrigger value='sma2'>SMA 2</TabsTrigger>
//                   </TabsList>
//                 </Tabs>
//               )}
//             </div>
//             <div className='flex flex-row items-center gap-2'>
//               <Input
//                 placeholder='Search accounts...'
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 className='max-w-sm border-gray-300 focus:border-blue-500'
//                 aria-label='Search accounts'
//                 disabled={isLoading}
//               />
//               <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
//                 <DialogTrigger asChild>
//                   <Button
//                     variant='outline'
//                     className='border-gray-300 hover:bg-gray-100'
//                     disabled={isLoading}
//                   >
//                     Filter
//                   </Button>
//                 </DialogTrigger>
//                 {/* keep your existing DialogContent exactly same */}
//                 {/* ... */}
//               </Dialog>
//             </div>
//           </CardHeader>
//           {/* ✅ Only content changes; Tabs/Header stays fixed */}
//           <CardContent className='px-6'>
//             {isLoading ? (
//               <div className='space-y-3 py-4'>
//                 {[...Array(8)].map((_, i) => (
//                   <div
//                     key={i}
//                     className='flex items-center space-x-6'
//                     aria-hidden='true'
//                   >
//                     <Skeleton className='h-6 w-1/6 rounded-md' />
//                     <Skeleton className='h-6 w-2/6 rounded-md' />
//                     <Skeleton className='h-6 w-1/6 rounded-md' />
//                     <Skeleton className='h-6 w-1/12 rounded-md' />
//                   </div>
//                 ))}
//               </div>
//             ) : error ? (
//               <div className='py-10 text-center text-red-500'>
//                 Error fetching data: {(error as Error)?.message}
//               </div>
//             ) : !data?.data || data.data.length === 0 ? (
//               <div className='py-10 text-center text-gray-500'>
//                 No accounts available for this branch.
//               </div>
//             ) : (
//               <PaginatedTable
//                 frameless
//                 showSearch={false}
//                 data={filteredData}
//                 columns={columns as PaginatedTableProps<AccountRow>['columns']}
//                 emptyMessage='No accounts to show.'
//                 renderActions={(row: AccountRow) =>
//                   row.acctNo ? (
//                     <Link
//                       to='/$category/summary/$accountId'
//                       params={{ category, accountId: String(row.acctNo) }}
//                     >
//                       <Button
//                         variant='outline'
//                         className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
//                       >
//                         View
//                       </Button>
//                     </Link>
//                   ) : null
//                 }
//               />
//             )}
//           </CardContent>
//         </Card>
//       </Main>
//     </>
//   )
// }
import { useMemo, useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import Select, { MultiValue } from 'react-select'
import LoadingBar from 'react-top-loading-bar'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb.tsx'
import { Home } from '@/components/breadcrumb/common-crumbs.ts'
import { Header } from '@/components/layout/header.tsx'
import { Main } from '@/components/layout/main.tsx'
import PaginatedTable, {
  type PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown.tsx'
import { Search } from '@/components/search.tsx'
import { AccountNoCell, CurrencyCell } from '@/components/table/cells.ts'
import { ThemeSwitch } from '@/components/theme-switch.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector'

type AccountRow = components['schemas']['AccountListDto2']

const columns: PaginatedTableProps<AccountRow>['columns'] = [
  {
    key: 'acctNo',
    label: 'Account No',
    render: (value) => (value ? <AccountNoCell value={`${value}`} /> : '-'),
  },
  {
    key: 'custName',
    label: 'Customer Name',
    render: (value) => <span className='font-semibold'>{value ?? '-'}</span>,
  },
  {
    key: 'outstand',
    label: 'Outstanding',
    render: (value) => <CurrencyCell value={String(value ?? 0)} />,
  },
]

export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/'
)({
  component: RouteComponent,
  loader: (ctx) => ({ crumb: ctx.params.category.toLocaleUpperCase() }),
  beforeLoad: (a) => {
    if (!['npa', 'sma', 'standard'].includes(a.params.category)) {
      throw redirect({ to: '/' })
    }
  },
})

interface CityOptionType {
  value: string
  label: string
}

type SmaVariant = 'all' | 'sma0' | 'sma1' | 'sma2'

// ✅ One SMA endpoint only
const SMA_ALL_ENDPOINT = '/account/SMA_All_Accounts' as const

const SMA_BUCKET_MAP: Record<SmaVariant, string> = {
  all: 'ALL', // if backend expects "SMA" for all, change to "SMA"
  sma0: 'SMA0',
  sma1: 'SMA1',
  sma2: 'SMA2',
}

const SMA_TITLE_MAP: Record<SmaVariant, string> = {
  all: 'SMA Accounts Summary',
  sma0: 'SMA 0 Accounts Summary',
  sma1: 'SMA 1 Accounts Summary',
  sma2: 'SMA 2 Accounts Summary',
}

const guideMap = {
  standard: {
    title: 'Standard Accounts Summary',
    apiEndpoint: '/account/StandardAccounts',
  },
  npa: {
    title: 'NPA Accounts Summary',
    apiEndpoint: '/account/NPA_Accounts',
  },
  sma: {
    title: 'SMA Accounts Summary',
    apiEndpoint: SMA_ALL_ENDPOINT,
  },
} as const

type SummaryCategory = keyof typeof guideMap

type SummaryEndpoint =
  | typeof SMA_ALL_ENDPOINT
  | '/account/StandardAccounts'
  | '/account/NPA_Accounts'

function RouteComponent() {
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minOutstanding, setMinOutstanding] = useState('')
  const [maxOutstanding, setMaxOutstanding] = useState('')
  const [selectedCities, setSelectedCities] = useState<
    MultiValue<CityOptionType>
  >([])

  const [smaVariant, setSmaVariant] = useState<SmaVariant>('all')

  const { category } = Route.useParams() as { category: SummaryCategory }

  const user = useAuthStore().auth.user
  const isBranchDropdownVisible = user?.superAdmin || user?.admin || false

  const title =
    category === 'sma' ? SMA_TITLE_MAP[smaVariant] : guideMap[category].title

  const apiEndpoint: SummaryEndpoint =
    category === 'sma'
      ? SMA_ALL_ENDPOINT
      : (guideMap[category].apiEndpoint as SummaryEndpoint)

  const bucket = category === 'sma' ? SMA_BUCKET_MAP[smaVariant] : undefined

  const { data, isLoading, error } = $api.useQuery('get', apiEndpoint, {
    params: {
      header: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      },
      query: {
        id: branchId === 'all' ? undefined : branchId,
        ...(category === 'sma' ? { bucket } : {}),
      },
    },
  })

  const noAccountsForSelectedBranch =
    !isLoading && !error && (data?.data?.length ?? 0) === 0

  const showResetToAllBranch =
    isBranchDropdownVisible &&
    branchId !== undefined &&
    branchId !== 'all' &&
    noAccountsForSelectedBranch

  const resetBranchToAll = () => {
    setBranchId('all')
  }

  // ✅ Filter: Cities options
  const reactSelectCityOptions: CityOptionType[] = useMemo(() => {
    const cities = new Set<string>()
    ;(data?.data ?? []).forEach((row: AccountRow) => {
      const city = (row.add4 ?? '').split(' ')[0]?.trim()
      if (city) cities.add(city)
    })
    return Array.from(cities)
      .sort()
      .map((c) => ({ value: c, label: c }))
  }, [data?.data])

  // ✅ Filter: Outstanding min/max stats+
  const outstandingStats = useMemo(() => {
    const values: number[] = (data?.data ?? [])
      .map((d: AccountRow) => Number(d.outstand))
      .filter((val: number) => Number.isFinite(val))
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    return { min, max }
  }, [data?.data])

  // ✅ Apply filters (search + outstanding + cities)
  const filteredData: AccountRow[] = useMemo(() => {
    let result: AccountRow[] = data?.data ? [...data.data] : []

    if (query) {
      const q = query.toLowerCase()
      result = result.filter((a: AccountRow) =>
        Object.values(a).join(' ').toLowerCase().includes(q)
      )
    }

    if (minOutstanding) {
      const minVal = Number(minOutstanding)
      if (!isNaN(minVal)) {
        result = result.filter(
          (a: AccountRow) => Number(a.outstand ?? 0) >= minVal
        )
      }
    }

    if (maxOutstanding) {
      const maxVal = Number(maxOutstanding)
      if (!isNaN(maxVal)) {
        result = result.filter(
          (a: AccountRow) => Number(a.outstand ?? 0) <= maxVal
        )
      }
    }

    if (selectedCities.length > 0) {
      const cityValues = selectedCities.map((c) => c.value.toLowerCase())
      result = result.filter((a: AccountRow) => {
        const rowCity = (a.add4 ?? '').split(' ')[0]?.toLowerCase()
        return rowCity ? cityValues.includes(rowCity) : false
      })
    }

    return result
  }, [data?.data, query, minOutstanding, maxOutstanding, selectedCities])

  const handleApplyFilters = () => {
    const min = Number(minOutstanding)
    const max = Number(maxOutstanding)
    if (!isNaN(min) && !isNaN(max) && min > max) {
      alert('Minimum outstanding cannot be greater than maximum outstanding.')
      return
    }
    setFiltersOpen(false)
  }

  return (
    <>
      <Header>
        {/* {isBranchDropdownVisible && (
          <BranchSelector value={branchId} setValue={setBranchId} />
        )} */}
        {isBranchDropdownVisible && (
          <div className='flex items-center gap-2'>
            <BranchSelector value={branchId} setValue={setBranchId} />

            {showResetToAllBranch && (
              <Button
                variant='outline'
                onClick={resetBranchToAll}
                className='whitespace-nowrap'
                title='Reset branch to All'
              >
                Clear Filter
              </Button>
            )}
          </div>
        )}

        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <LoadingBar progress={isLoading ? 70 : 100} color='#2998ff' height={3} />

      <Main className='px-4 py-2'>
        <AppBreadcrumb
          className='p-2'
          crumbs={[Home]}
          currentPage={{
            type: 'dropdown',
            selectedIndex:
              category === 'standard' ? 0 : category === 'sma' ? 1 : 2,
            items: [
              { label: 'Standard', to: '/standard/summary' },
              { label: 'SMA', to: '/sma/summary' },
              { label: 'NPA', to: '/npa/summary' },
            ],
          }}
        />

        <Card className='col-span-full shadow-lg'>
          {/* ✅ Sticky header (Tabs + Search + Filter always visible) */}
          <CardHeader className='bg-background sticky top-0 z-10 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
            <div className='flex flex-col gap-2'>
              <CardTitle className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                {title}{' '}
                <span className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                  ({isLoading ? '...' : filteredData.length} accounts)
                </span>
              </CardTitle>

              {category === 'sma' && (
                <Tabs
                  value={smaVariant}
                  onValueChange={(v) => setSmaVariant(v as SmaVariant)}
                >
                  <TabsList className='w-fit'>
                    <TabsTrigger value='all'>All</TabsTrigger>
                    <TabsTrigger value='sma0'>SMA 0</TabsTrigger>
                    <TabsTrigger value='sma1'>SMA 1</TabsTrigger>
                    <TabsTrigger value='sma2'>SMA 2</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className='flex flex-row items-center gap-2'>
              <Input
                placeholder='Search accounts...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='max-w-sm border-gray-300 focus:border-blue-500'
                aria-label='Search accounts'
                disabled={isLoading}
              />

              {/* ✅ Filter dialog restored */}
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    className='border-gray-300 hover:bg-gray-100'
                    disabled={isLoading}
                  >
                    Filter
                  </Button>
                </DialogTrigger>

                <DialogContent className='sm:max-w-lg'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                      Filter Accounts
                    </DialogTitle>
                  </DialogHeader>

                  <div className='grid gap-6 py-4'>
                    <div className='grid gap-2'>
                      <Label
                        htmlFor='city-multiselect'
                        className='text-gray-700'
                      >
                        Cities
                      </Label>

                      <Select<CityOptionType, true>
                        id='city-multiselect'
                        isMulti
                        options={reactSelectCityOptions}
                        value={selectedCities}
                        onChange={(options: MultiValue<CityOptionType>) =>
                          setSelectedCities(options ?? [])
                        }
                        placeholder='Select cities...'
                        className='basic-multi-select'
                        classNamePrefix='select'
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: 'hsl(var(--input))',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            '&:hover': { borderColor: 'hsl(var(--ring))' },
                          }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>

                    <div className='grid gap-1'>
                      <Label htmlFor='minOut' className='text-gray-700'>
                        Min Outstanding{' '}
                        <span className='text-xs text-gray-500'>
                          (min: {outstandingStats.min})
                        </span>
                      </Label>
                      <Input
                        id='minOut'
                        value={minOutstanding}
                        onChange={(e) => setMinOutstanding(e.target.value)}
                        type='number'
                        placeholder={`${outstandingStats.min}`}
                        className='border-gray-300 focus:border-blue-500'
                        aria-label='Minimum outstanding amount'
                      />
                    </div>

                    <div className='grid gap-1'>
                      <Label htmlFor='maxOut' className='text-gray-700'>
                        Max Outstanding{' '}
                        <span className='text-xs text-gray-500'>
                          (max: {outstandingStats.max})
                        </span>
                      </Label>
                      <Input
                        id='maxOut'
                        value={maxOutstanding}
                        onChange={(e) => setMaxOutstanding(e.target.value)}
                        type='number'
                        placeholder={`${outstandingStats.max}`}
                        className='border-gray-300 focus:border-blue-500'
                        aria-label='Maximum outstanding amount'
                      />
                    </div>
                  </div>

                  <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
                    <Button
                      variant='ghost'
                      onClick={() => {
                        setSelectedCities([])
                        setMinOutstanding('')
                        setMaxOutstanding('')
                      }}
                      className='text-gray-500 hover:text-gray-700'
                    >
                      Clear Filters
                    </Button>

                    <Button onClick={handleApplyFilters} className='text-white'>
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className='px-6'>
            {isLoading ? (
              <div className='space-y-3 py-4'>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center space-x-6'
                    aria-hidden='true'
                  >
                    <Skeleton className='h-6 w-1/6 rounded-md' />
                    <Skeleton className='h-6 w-2/6 rounded-md' />
                    <Skeleton className='h-6 w-1/6 rounded-md' />
                    <Skeleton className='h-6 w-1/12 rounded-md' />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className='py-10 text-center text-red-500'>
                Error fetching data: {(error as Error)?.message}
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className='py-10 text-center text-gray-500'>
                No accounts available for this branch.
              </div>
            ) : (
              <PaginatedTable
                frameless
                showSearch={false}
                data={filteredData}
                columns={columns}
                emptyMessage='No accounts to show.'
                renderActions={(row: AccountRow) =>
                  row.acctNo ? (
                    <Link
                      to='/$category/summary/$accountId'
                      params={{ category, accountId: String(row.acctNo) }}
                    >
                      <Button
                        variant='outline'
                        className='border-[var(--primary)] text-black hover:bg-[var(--primary)] hover:text-white dark:text-white'
                      >
                        View
                      </Button>
                    </Link>
                  ) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
