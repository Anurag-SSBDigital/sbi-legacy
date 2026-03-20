/* ------------------------------------------------------------------ */
/* routes/_authenticated/loan-review/LoanReviewPage.tsx              */
/* Keeps form values in the URL so a refresh/back-nav preserves state */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useState } from 'react'
import * as z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
/* -------------------------------------- */
/* local libs & components                 */
/* -------------------------------------- */
import { $api, BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
/* -------------------------------------- */
/* shadcn & radix primitives               */
/* -------------------------------------- */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'
import {
  AccountNoCell,
  CurrencyCell,
  SemiBoldCell,
} from '@/components/table/cells.ts'

/*********************************************************************
 * ROUTE                                                           *
 *********************************************************************/
export const Route = createFileRoute(
  '/_authenticated/(searching)/term-loan-review/'
)({
  validateSearch: (s): SearchParams =>
    ({
      branchCode: s.branchCode ?? '',
      acctType: s.acctType ?? '',
      fromDate: s.fromDate ?? '',
      toDate: s.toDate ?? '',
    }) as SearchParams,
  component: LoanReviewPage,
})

type SearchParams = {
  branchCode?: string
  acctType: string
  fromDate: string
  toDate: string
}

/*********************************************************************
 * ZOD SCHEMA                                                      *
 *********************************************************************/
const schema = z
  .object({
    branchCode: z.optional(z.string()),
    acctType: z.string().min(1, 'Select product'),
    fromDate: z.string().min(1, 'Select from-date'),
    toDate: z.string().min(1, 'Select to-date'),
  })
  .refine((d) => new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To-date must be after From-date',
  })

type SearchForm = z.infer<typeof schema>

interface LoanReviewData {
  reviewed: components['schemas']['CustomerDetails'][]
  notReviewed: components['schemas']['CustomerDetails'][]
}

interface LoanReviewApiResponse {
  status: string
  message: string
  data: LoanReviewData
}

/*********************************************************************
 * COMPONENT                                                       *
 *********************************************************************/
function LoanReviewPage() {
  /* --------------------------- */
  /* Router helpers              */
  /* --------------------------- */
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const user = useAuthStore().auth.user
  const branchId = user?.branchId

  const BANK_CODE = 'UGB' // adjust if you want this dynamic

  /* --------------------------- */
  /* Dropdown Data               */
  /* --------------------------- */

  const { data: branchResp, isLoading: branchesLoading } = $api.useQuery(
    'get',
    '/account/getAllBranch',
    {
      params: {
        header: {
          Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
        },
      },
    },
    { enabled: !branchId }
  )

  const branchOptions =
    (
      branchResp as
        | {
            data: {
              branchCode: string
              branchName: string
            }[]
          }
        | undefined
    )?.data ?? []

  const { data: productResp, isLoading: productsLoading } = $api.useQuery(
    'get',
    '/account/accountTypes',
    {
      params: {},
    }
  )

  const productOptions = productResp ?? []

  /* --------------------------- */
  /* Search Mutation             */
  /* --------------------------- */
  const [result, setResult] = useState<LoanReviewData | null>(null)

  const searchMutation = $api.useMutation(
    'get',
    '/term-loan-review/accounts/review-status',
    {
      onSuccess: (data) => {
        const apiResp = data as unknown as LoanReviewApiResponse
        const payload = apiResp?.data

        if (!payload) {
          toast.error('Unexpected response from server.')
          setResult(null)
          return
        }

        setResult(payload)

        if (!payload.notReviewed?.length && !payload.reviewed?.length) {
          toast.info('No records for the given criteria.')
        }
      },
      onError: () => toast.error('Unable to fetch records. Try again.'),
    }
  )

  /* --------------------------- */
  /* RHF Setup                   */
  /* --------------------------- */
  const { control, register, handleSubmit } = useForm<SearchForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: search as SearchForm, // pre-fill from URL
  })

  /** Push form values into the route search params */
  const onSubmit = handleSubmit((v) => {
    navigate({ to: '.', search: v })
  })

  useEffect(() => {
    const { acctType, branchCode, fromDate, toDate } = search

    if (!acctType || !fromDate || !toDate) return

    searchMutation.mutate({
      params: {
        query: {
          acctType,
          // if branchId is set on user → ignore dropdown value
          branchCode: branchId ? '' : branchCode,
          fromDate,
          toDate,
          bankCode: BANK_CODE,
        },
      },
    })
  }, [search])

  /* --------------------------- */
  /* Table Columns               */
  /* --------------------------- */
  const columns = useMemo<
    PaginatedTableColumn<components['schemas']['CustomerDetails']>[]
  >(
    () => [
      {
        key: 'acctCd',
        label: 'Account No.',
        sortable: true,
        render: (value) => <AccountNoCell value={(value ?? '') as string} />,
      },
      {
        key: 'acctNm',
        label: 'Account Name',
        sortable: true,
        render: (value) => <SemiBoldCell value={`${value}`} />,
      },
      {
        key: 'typeNm',
        label: 'Product',
        render: (value) => <SemiBoldCell value={`${value}`} />,
      },
      // {
      //   key: 'city',
      //   label: 'City',
      //   render: (value) => <SemiBoldCell value={`${value}`} />,
      // },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        render: (value) => (value ? <CurrencyCell value={`${value}`} /> : `-`),
      },
    ],
    []
  )

  const loading = branchesLoading || productsLoading || searchMutation.isPending

  /* --------------------------- */
  /* UI                          */
  /* --------------------------- */
  return (
    <MainWrapper>
      <div className='space-y-6'>
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Term Loan Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className='grid grid-cols-1 gap-4 md:grid-cols-3'
              onSubmit={onSubmit}
            >
              {/* Branch */}
              {branchId ? null : (
                <div className='flex flex-col gap-1'>
                  <label className='text-sm font-medium'>Branch</label>
                  <Controller
                    name='branchCode'
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={branchesLoading}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue
                            placeholder={
                              branchesLoading ? 'Loading…' : 'Select branch'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions.map((b) => (
                            <SelectItem key={b.branchCode} value={b.branchCode}>
                              {b.branchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Product */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>Product</label>
                <Controller
                  name='acctType'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={productsLoading}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={
                            productsLoading ? 'Loading…' : 'Select product'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {productOptions.map((p) => (
                          <SelectItem key={p.code} value={p.code ?? ''}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* From Date */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>From Date</label>
                <Input
                  type='date'
                  {...register('fromDate')}
                  className='w-full'
                />
              </div>

              {/* To Date */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>To Date</label>
                <Input type='date' {...register('toDate')} className='w-full' />
              </div>

              {/* Action */}
              <div className='flex items-end'>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className='space-y-6'>
            <PaginatedTable
              data={result?.reviewed || []}
              columns={columns}
              tableTitle='Reviewed'
              initialRowsPerPage={10}
              showSearch
              frameless={false}
              emptyMessage='No reviewed accounts found'
              tableActions={() => (
                <a
                  href={`${BASE_URL}/account/loan-review/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
                  download
                >
                  <Button
                    type='button'
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                </a>
              )}
              renderActions={(row) =>
                row.acctCd && (
                  <Link
                    to='/loan-review/$accountId'
                    params={{ accountId: row.acctCd }}
                  >
                    <Button variant='outline'>View</Button>
                  </Link>
                )
              }
            />

            <PaginatedTable
              data={result?.notReviewed || []}
              columns={columns}
              tableTitle='Not Reviewed'
              initialRowsPerPage={10}
              showSearch
              frameless={false}
              emptyMessage='No not reviewed accounts found'
              tableActions={() => (
                <a
                  href={`${BASE_URL}/account/loan-review/pending-accounts/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
                  download
                >
                  <Button
                    type='button'
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                </a>
              )}
              renderActions={(row) =>
                row.acctCd && (
                  <Link
                    to='/loan-review/$accountId'
                    params={{ accountId: row.acctCd }}
                  >
                    <Button variant='outline'>View</Button>
                  </Link>
                )
              }
            />
          </div>
        )}
      </div>
    </MainWrapper>
  )
}

export default LoanReviewPage

// /* ------------------------------------------------------------------ */
// /* routes/_authenticated/loan-review/LoanReviewPage.tsx              */
// /* Keeps form values in the URL so a refresh/back‑nav preserves state */
// /* ------------------------------------------------------------------ */
// import { useEffect, useMemo, useState } from 'react'
// import * as z from 'zod'
// import { Controller, useForm } from 'react-hook-form'
// import { Link, createFileRoute } from '@tanstack/react-router'
// import { components } from '@/types/api/v1.js'
// import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
// import { Download } from 'lucide-react'
// import { toast } from 'sonner'
// import { useAuthStore } from '@/stores/authStore.ts'
// /* -------------------------------------- */
// /* local libs & components                 */
// /* -------------------------------------- */
// import { $api, BASE_URL } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import MainWrapper from '@/components/ui/main-wrapper.tsx'
// /* -------------------------------------- */
// /* shadcn & radix primitives               */
// /* -------------------------------------- */
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import PaginatedTable, {
//   PaginatedTableColumn,
// } from '@/components/paginated-table.tsx'
// import {
//   AccountNoCell,
//   CurrencyCell,
//   SemiBoldCell,
// } from '@/components/table/cells.ts'

// /*********************************************************************
//  * ROUTE                                                           *
//  *********************************************************************/
// export const Route = createFileRoute(
//   '/_authenticated/(searching)/term-loan-review/'
// )({
//   validateSearch: (s): SearchParams =>
//   (({
//     branchCode: s.branchCode ?? '',
//     acctType: s.acctType ?? '',
//     fromDate: s.fromDate ?? '',
//     toDate: s.toDate ?? ''
//   }) as SearchParams),
//   component: LoanReviewPage,
// })

// type SearchParams = {
//   branchCode?: string
//   acctType: string
//   fromDate: string
//   toDate: string
// }

// /*********************************************************************
//  * ZOD SCHEMA                                                      *
//  *********************************************************************/
// const schema = z
//   .object({
//     branchCode: z.optional(z.string()),
//     acctType: z.string().min(1, 'Select product'),
//     fromDate: z.string().min(1, 'Select from-date'),
//     toDate: z.string().min(1, 'Select to-date'),
//   })
//   .refine((d) => new Date(d.toDate) >= new Date(d.fromDate), {
//     path: ['toDate'],
//     message: 'To‑date must be after From‑date',
//   })

// type SearchForm = z.infer<typeof schema>

// interface LoanReviewResponse {
//   reviewed: components['schemas']['CustomerDetails'][]
//   notReviewed: components['schemas']['CustomerDetails'][]
// }

// /*********************************************************************
//  * COMPONENT                                                       *
//  *********************************************************************/
// function LoanReviewPage() {
//   /* --------------------------- */
//   /* Router helpers              */
//   /* --------------------------- */
//   const search = Route.useSearch()
//   const navigate = Route.useNavigate()

//   const user = useAuthStore().auth.user
//   const branchId = user?.branchId

//   /* --------------------------- */
//   /* Dropdown Data               */
//   /* --------------------------- */

//   const { data: branchResp, isLoading: branchesLoading } = $api.useQuery(
//     'get',
//     '/account/getAllBranch',
//     {
//       params: {
//         header: {
//           Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
//         },
//       },
//     },
//     { enabled: !branchId }
//   )

//   const branchOptions =
//     (
//       branchResp as
//       | {
//         data: {
//           branchCode: string
//           branchName: string
//         }[]
//       }
//       | undefined
//     )?.data ?? []

//   const { data: productResp, isLoading: productsLoading } = $api.useQuery(
//     'get',
//     '/account/accountTypes',
//     {
//       params: {},
//     }
//   )

//   const productOptions = productResp ?? []

//   /* --------------------------- */
//   /* Search Mutation             */
//   /* --------------------------- */
//   const [result, setResult] = useState<LoanReviewResponse | null>(null)

//   const searchMutation = $api.useMutation('get', '/account/loan-review', {
//     onSuccess: (data) => {
//       setResult(data as unknown as LoanReviewResponse)
//       if (!data?.notReviewed.length && !data?.reviewed.length) {
//         toast.info('No records for the given criteria.')
//       }
//     },
//     onError: () => toast.error('Unable to fetch records. Try again.'),
//   })

//   /* --------------------------- */
//   /* RHF Setup                   */
//   /* --------------------------- */
//   const { control, register, handleSubmit } = useForm<SearchForm>({
//     resolver: standardSchemaResolver(schema),
//     defaultValues: search, // pre‑fill from URL
//   })

//   /** Push form values into the route search params */
//   const onSubmit = handleSubmit((v) => {
//     navigate({ to: '.', search: v })
//   })

//   /* When URL search params change → (re)fire API */
//   useEffect(() => {
//     const { acctType, branchCode, fromDate, toDate } = search
//     if (acctType && fromDate && toDate) {
//       searchMutation.mutate({
//         params: {
//           query: {
//             acctType,
//             BranchCode: branchId ? '' : branchCode,
//             fromDate,
//             toDate,
//           },
//         },
//       })
//     }
//   }, [search])

//   /* --------------------------- */
//   /* Table Columns               */
//   /* --------------------------- */
//   const columns = useMemo<
//     PaginatedTableColumn<components['schemas']['CustomerDetails']>[]
//   >(
//     () => [
//       {
//         key: 'acctCd',
//         label: 'Account No.',
//         sortable: true,
//         render: (value) => <AccountNoCell value={(value ?? '') as string} />,
//       },
//       {
//         key: 'acctNm',
//         label: 'Account Name',
//         sortable: true,
//         render: (value) => <SemiBoldCell value={`${value}`} />,
//       },
//       {
//         key: 'typeNm',
//         label: 'Product',
//         render: (value) => <SemiBoldCell value={`${value}`} />,
//       },
//       {
//         key: 'city',
//         label: 'City',
//         render: (value) => <SemiBoldCell value={`${value}`} />,
//       },
//       {
//         key: 'amount',
//         label: 'Amount',
//         sortable: true,
//         render: (value) => (value ? <CurrencyCell value={`${value}`} /> : `-`),
//       },
//     ],
//     []
//   )

//   const loading = branchesLoading || productsLoading || searchMutation.isPending

//   /* --------------------------- */
//   /* UI                          */
//   /* --------------------------- */
//   return (
//     <MainWrapper>
//       <div className='space-y-6'>
//         {/* Search Card */}
//         <Card>
//           <CardHeader>
//             <CardTitle className='text-xl'>Term Loan Review</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form
//               className='grid grid-cols-1 gap-4 md:grid-cols-3'
//               onSubmit={onSubmit}
//             >
//               {/* Branch */}
//               {branchId ? null : (
//                 <div className='flex flex-col gap-1'>
//                   <label className='text-sm font-medium'>Branch</label>
//                   <Controller
//                     name='branchCode'
//                     control={control}
//                     render={({ field }) => (
//                       <Select
//                         value={field.value}
//                         onValueChange={field.onChange}
//                         disabled={branchesLoading}
//                       >
//                         <SelectTrigger className='w-full'>
//                           <SelectValue
//                             placeholder={
//                               branchesLoading ? 'Loading…' : 'Select branch'
//                             }
//                           />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {branchOptions.map((b) => (
//                             <SelectItem key={b.branchCode} value={b.branchCode}>
//                               {b.branchName}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     )}
//                   />
//                 </div>
//               )}

//               {/* Product */}
//               <div className='flex flex-col gap-1'>
//                 <label className='text-sm font-medium'>Product</label>
//                 <Controller
//                   name='acctType'
//                   control={control}
//                   render={({ field }) => (
//                     <Select
//                       value={field.value}
//                       onValueChange={field.onChange}
//                       disabled={productsLoading}
//                     >
//                       <SelectTrigger className='w-full'>
//                         <SelectValue
//                           placeholder={
//                             productsLoading ? 'Loading…' : 'Select product'
//                           }
//                         />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {productOptions.map((p) => (
//                           <SelectItem key={p.code} value={p.code ?? ''}>
//                             {p.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   )}
//                 />
//               </div>

//               {/* From Date */}
//               <div className='flex flex-col gap-1'>
//                 <label className='text-sm font-medium'>From Date</label>
//                 <Input
//                   type='date'
//                   {...register('fromDate')}
//                   className='w-full'
//                 />
//               </div>

//               {/* To Date */}
//               <div className='flex flex-col gap-1'>
//                 <label className='text-sm font-medium'>To Date</label>
//                 <Input type='date' {...register('toDate')} className='w-full' />
//               </div>

//               {/* Action */}
//               <div className='flex items-end'>
//                 <Button type='submit' disabled={loading}>
//                   {loading ? 'Searching…' : 'Search'}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>

//         {/* Results */}
//         {result && (
//           <div className='space-y-6'>
//             <PaginatedTable
//               data={result?.reviewed || []}
//               columns={columns}
//               tableTitle='Reviewed'
//               initialRowsPerPage={10}
//               showSearch
//               frameless={false}
//               emptyMessage='No reviewed accounts found'
//               tableActions={() => (
//                 <a
//                   href={`${BASE_URL}/account/loan-review/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
//                   download
//                 >
//                   {/* <DownloadReportButton asChild onClick={() => {}} /> */}
//                   <Button
//                     type='button'
//                     variant='outline'
//                     className='flex items-center gap-2'
//                   >
//                     <Download className='h-4 w-4' />
//                     Download
//                   </Button>
//                 </a>
//               )}
//               renderActions={(row) =>
//                 row.acctCd && (
//                   <Link
//                     to='/loan-review/$accountId'
//                     params={{ accountId: row.acctCd }}
//                   >
//                     <Button variant='outline'>View</Button>
//                   </Link>
//                 )
//               }
//             />

//             <PaginatedTable
//               data={result?.notReviewed || []}
//               columns={columns}
//               tableTitle='Not Reviewed'
//               initialRowsPerPage={10}
//               showSearch
//               frameless={false}
//               emptyMessage='No not reviewed accounts found'
//               tableActions={() => (
//                 <a
//                   href={`${BASE_URL}/account/loan-review/pending-accounts/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
//                   download
//                 >
//                   {/* <DownloadReportButton asChild onClick={() => {}} /> */}
//                   <Button
//                     type='button'
//                     variant='outline'
//                     className='flex items-center gap-2'
//                   >
//                     <Download className='h-4 w-4' />
//                     Download
//                   </Button>
//                 </a>
//               )}
//               renderActions={(row) =>
//                 row.acctCd && (
//                   <Link
//                     to='/loan-review/$accountId'
//                     params={{ accountId: row.acctCd }}
//                   >
//                     <Button variant='outline'>View</Button>
//                   </Link>
//                 )
//               }
//             />
//           </div>
//         )}
//       </div>
//     </MainWrapper>
//   )
// }
