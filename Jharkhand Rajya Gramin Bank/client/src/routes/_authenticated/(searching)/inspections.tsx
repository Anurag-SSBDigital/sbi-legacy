/* ------------------------------------------------------------------ */
/* routes/_authenticated/inspection/InspectionSearchPage.tsx          */
/* Keeps form values in the URL so a refresh/back‑nav preserves state */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from 'react'
import * as z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, createFileRoute } from '@tanstack/react-router'
import { paths } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
/* -------------------------------------- */
/* local libs & components                 */
/* -------------------------------------- */
import { $api, BASE_URL } from '@/lib/api'
import { iracToCategory } from '@/lib/helpers.ts'
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
import PaginatedTable from '@/components/paginated-table.tsx'
import { AccountNoCell } from '@/components/table/cells.ts'

/*********************************************************************
 * ROUTE                                                           *
 *********************************************************************/
export const Route = createFileRoute('/_authenticated/(searching)/inspections')(
  {
    validateSearch: (s): SearchParams => ({
      inspectionType:
        (s.inspectionType as 'MSME' | 'Retail') ?? ('MSME' as const),
      branchCode: (s.branchCode as string) ?? '',
      acctType: (s.acctType as string) ?? '',
      fromDate: (s.fromDate as string) ?? '',
      toDate: (s.toDate as string) ?? '',
    }),
    component: InspectionPage,
  }
)

type SearchParams = {
  inspectionType: 'MSME' | 'Retail' | undefined
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
    inspectionType: z.enum(['MSME', 'Retail']),
    branchCode: z.string().optional(),
    acctType: z.string().min(1, 'Select product'),
    fromDate: z.string().min(1, 'Select from-date'),
    toDate: z.string().min(1, 'Select to-date'),
  })
  .refine((d) => new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To‑date must be after From‑date',
  })

type SearchForm = z.infer<typeof schema>

/*********************************************************************
 * COMPONENT                                                       *
 *********************************************************************/
function InspectionPage() {
  /* --------------------------- */
  /* Router helpers              */
  /* --------------------------- */
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const user = useAuthStore().auth?.user

  const branchId = user?.branchId

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
    {
      enabled: !branchId,
    }
  )

  const branchOptions = branchResp?.data ?? []

  /* --------------------------- */
  /* Search Mutation             */
  /* --------------------------- */
  const [result, setResult] = useState<
    | paths['/account/notInspected']['get']['responses']['200']['content']['*/*']
    | null
  >(null)

  const searchMutation = $api.useMutation('get', '/account/notInspected', {
    onSuccess: (data) => {
      setResult(data)
      if (!data?.notInspected?.length && !data?.inspected?.length) {
        toast.info('No records for the given criteria.')
      }
    },
    onError: () => toast.error('Unable to fetch records. Try again.'),
  })

  /* --------------------------- */
  /* RHF Setup                   */
  /* --------------------------- */
  const { control, register, handleSubmit, watch, setValue } =
    useForm<SearchForm>({
      resolver: standardSchemaResolver(schema),
      defaultValues: branchId ? { ...search, branchCode: undefined } : search,
    })

  const selectedSegment = watch('inspectionType')

  const { data: productResp, isLoading: productsLoading } = $api.useQuery(
    'get',
    '/account/accountTypes',
    {
      params: { query: { segment: selectedSegment } },
    },
    { enabled: !!selectedSegment }
  )
  const productOptions = productResp ?? []

  const onSubmit = handleSubmit((v) => {
    navigate({ to: '.', search: v })
  })

  useEffect(() => {
    setValue('acctType', '')
  }, [selectedSegment, setValue])

  useEffect(() => {
    const { acctType, branchCode, inspectionType, fromDate, toDate } = search
    if (acctType && inspectionType && fromDate && toDate) {
      searchMutation.mutate({
        params: {
          query: {
            acctType,
            inspectionType,
            BranchCode: branchId ? '' : branchCode,
            fromDate,
            toDate,
          },
          header: {
            Authorization: `Bearer ${sessionStorage.getItem(`token`) || ``}`,
          },
        },
      })
    }
  }, [search, branchId])

  /* --------------------------- */
  /* Table Columns               */
  /* --------------------------- */

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
            <CardTitle className='text-xl'>Inspection</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className='grid grid-cols-1 gap-4 md:grid-cols-3'
              onSubmit={onSubmit}
            >
              {/* Type */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>Type</label>
                <Controller
                  name='inspectionType'
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='MSME'>MSME</SelectItem>
                        <SelectItem value='Retail'>Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

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
                          {(
                            branchOptions as {
                              branchCode: string
                              branchName: string
                            }[]
                          ).map((b) => (
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
                <Input type='date' {...register('fromDate')} />
              </div>

              {/* To Date */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>To Date</label>
                <Input type='date' {...register('toDate')} />
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
              data={result.inspected || []}
              columns={[
                {
                  key: 'acctCd',
                  label: 'Account No.',
                  render: (value) => <AccountNoCell value={value} />,
                  sortable: true,
                },
                { key: 'acctNm', label: 'Account Name', sortable: true },
                { key: 'typeNm', label: 'Product' },
                // { key: 'city', label: 'City' },
              ]}
              tableTitle='Inspected'
              initialRowsPerPage={10}
              showSearch
              frameless={false}
              emptyMessage='No inspected accounts found'
              tableActions={() => (
                <a
                  href={`${BASE_URL}/account/inspection/downloadPdf?acctType=${search.acctType}&inspectionType=${search.inspectionType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
                  download
                >
                  {/* <DownloadReportButton asChild onClick={() => {}} /> */}
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
                    to='/$category/summary/$accountId'
                    params={{
                      category: iracToCategory(row.npaCd ?? 0),
                      accountId: row.acctCd,
                    }}
                  >
                    <Button variant='outline'>View</Button>
                  </Link>
                )
              }
            />
            <PaginatedTable
              data={result.notInspected || []}
              columns={[
                {
                  key: 'acctCd',
                  label: 'Account No.',
                  render: (value) => <AccountNoCell value={value} />,
                  sortable: true,
                },
                { key: 'acctNm', label: 'Account Name', sortable: true },
                { key: 'typeNm', label: 'Product' },
                // { key: 'city', label: 'City' },
              ]}
              tableTitle='Not Inspected'
              initialRowsPerPage={10}
              showSearch
              frameless={false}
              emptyMessage='No un-inspected accounts found'
              tableActions={() => (
                <a
                  href={`${BASE_URL}/account/inspection/pending-accounts/downloadPdf?acctType=${search.acctType}&inspectionType=${search.inspectionType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
                  download
                >
                  {/* <DownloadReportButton asChild onClick={() => {}} /> */}
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
                    to='/$category/summary/$accountId'
                    params={{
                      category: iracToCategory(row.npaCd ?? 0),
                      accountId: row.acctCd,
                    }}
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
