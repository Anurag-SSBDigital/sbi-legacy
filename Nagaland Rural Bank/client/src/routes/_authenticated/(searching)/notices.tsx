/* ------------------------------------------------------------------ */
/* routes/_authenticated/inspection/NoticeSearchPage.tsx              */
/* Keeps form values in the URL so refresh/back-nav preserves state   */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useState } from 'react'
import * as z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, createFileRoute } from '@tanstack/react-router'
import { components, paths } from '@/types/api/v1.js'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
/* local libs & components ----------------------------------------- */
import { $api, BASE_URL } from '@/lib/api'
import { iracToCategory } from '@/lib/helpers.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
/* shadcn & radix --------------------------------------------------- */
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
  SemiBoldCell,
  ClassificationCell,
} from '@/components/table/cells.ts'

/*********************************************************************
 * ROUTE                                                             *
 *********************************************************************/
export const Route = createFileRoute('/_authenticated/(searching)/notices')({
  validateSearch: (s): SearchParams =>
    ({
      acctType: s.acctType ?? '',
      branchCode: s.branchCode ?? '',
      fromDate: s.fromDate ?? '',
      toDate: s.toDate ?? '',
    }) as SearchParams,
  component: NoticePage,
})

type SearchParams = {
  acctType: string
  branchCode?: string | undefined
  fromDate: string
  toDate: string
}

/*********************************************************************
 * ZOD SCHEMA                                                        *
 *********************************************************************/
const schema = z
  .object({
    acctType: z.string().min(1, 'Select product'),
    branchCode: z.optional(z.string()),
    fromDate: z.string().min(1, 'Select from-date'),
    toDate: z.string().min(1, 'Select to-date'),
  })
  .refine((d) => new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To-date must be after From-date',
  })

type SearchForm = z.infer<typeof schema>

/*********************************************************************
 * COMPONENT                                                         *
 *********************************************************************/
function NoticePage() {
  /* Router helpers ------------------------------------------------- */
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const user = useAuthStore().auth.user
  const branchId = user?.branchId

  /* Branch dropdown ----------------------------------------------- */
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

  /* Product dropdown ---------------------------------------------- */
  const { data: productResp, isLoading: productsLoading } = $api.useQuery(
    'get',
    '/account/accountTypes',
    { params: {} }
  )

  const branchOptions = branchResp?.data ?? []
  const productOptions = productResp ?? []

  /* Search mutation ----------------------------------------------- */
  const [result, setResult] = useState<
    | paths['/account/noticed']['get']['responses']['200']['content']['*/*']
    | null
  >(null)

  const searchMutation = $api.useMutation('get', '/account/noticed', {
    onSuccess: (data) => {
      setResult(data)
      if (!data?.noticed?.length && !data?.notNoticed?.length)
        toast.info('No records for the given criteria.')
    },
    onError: () => toast.error('Unable to fetch records. Try again.'),
  })

  /* RHF setup ------------------------------------------------------ */
  const { control, register, handleSubmit } = useForm<SearchForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: search, // pre-fill from URL
  })

  /** Push form values into the route search params */
  const onSubmit = handleSubmit((v) => navigate({ to: '.', search: v }))

  /* Fire API whenever URL search params change -------------------- */
  useEffect(() => {
    const { acctType, branchCode, fromDate, toDate } = search
    if (acctType && fromDate && toDate) {
      searchMutation.mutate({
        params: {
          query: {
            acctType,
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
  }, [search])

  /* Table columns -------------------------------------------------- */
  const columns = useMemo<
    PaginatedTableColumn<components['schemas']['CustomerDetails']>[]
  >(
    () => [
      {
        key: 'acctCd',
        label: 'Account No.',
        sortable: true,
        render: (value) => <AccountNoCell value={value} />,
      },
      {
        key: 'acctNm',
        label: 'Account Name',
        sortable: true,
        render: (value) => <SemiBoldCell value={value} />,
      },
      {
        key: 'typeNm',
        label: 'Product',
        render: (value) => <SemiBoldCell value={value} />,
      },
      // {
      //   key: 'city',
      //   label: 'City',
      //   render: (value) => <SemiBoldCell value={value} />,
      // },
      {
        key: 'npaCd',
        label: 'Classification',
        render: (_, row) => <ClassificationCell npaCd={row?.npaCd} />,
      },
    ],
    []
  )

  const loading = branchesLoading || productsLoading || searchMutation.isPending

  /* UI ------------------------------------------------------------- */
  return (
    <MainWrapper>
      <div className='space-y-6'>
        {/* Search card --------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Notices</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className='grid grid-cols-1 gap-4 md:grid-cols-3'
              onSubmit={onSubmit}
            >
              {/* Branch ------------------------------------------- */}
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
                              branchName: string
                              branchCode: string
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

              {/* Product ------------------------------------------ */}
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

              {/* From date ---------------------------------------- */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>From&nbsp;Date</label>
                <Input type='date' {...register('fromDate')} />
              </div>

              {/* To date ------------------------------------------ */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium'>To&nbsp;Date</label>
                <Input type='date' {...register('toDate')} />
              </div>

              {/* Action button ------------------------------------ */}
              <div className='flex items-end'>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results table ----------------------------------------- */}
        {result && (
          <PaginatedTable
            data={result.noticed || []}
            columns={columns}
            tableTitle='Noticed'
            initialRowsPerPage={10}
            showSearch
            frameless={false}
            emptyMessage='No noticed accounts found'
            tableActions={() => (
              <a
                href={`${BASE_URL}/account/notice/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
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
              row.npaCd && row.acctCd ? (
                <Link
                  to='/$category/summary/$accountId'
                  params={{
                    category: iracToCategory(row.npaCd),
                    accountId: row.acctCd,
                  }}
                >
                  <Button variant='outline'>View</Button>
                </Link>
              ) : null
            }
          />
        )}

        {result && (
          <PaginatedTable
            data={result.notNoticed || []}
            columns={columns}
            tableTitle='Not Noticed'
            initialRowsPerPage={10}
            showSearch
            frameless={false}
            emptyMessage='No un-noticed accounts found'
            tableActions={() => (
              <a
                href={`${BASE_URL}/account/notice/pending-accounts/downloadPdf?acctType=${search.acctType}&BranchCode=${search.branchCode}&fromDate=${search.fromDate}&toDate=${search.toDate}`}
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
              row.npaCd && row.acctCd ? (
                <Link
                  to='/$category/summary/$accountId'
                  params={{
                    category: iracToCategory(row.npaCd),
                    accountId: row.acctCd,
                  }}
                >
                  <Button variant='outline'>View</Button>
                </Link>
              ) : null
            }
          />
        )}
      </div>
    </MainWrapper>
  )
}
