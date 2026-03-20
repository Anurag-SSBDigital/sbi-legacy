import { useState } from 'react'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { Download, Eye, MoreVertical } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api, BASE_URL } from '@/lib/api.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import {
  AccountNoCell,
  CurrencyCell,
  DateCell,
} from '@/components/table/cells.ts'
import { AuditAccountDetailDialog } from '@/features/audit/audit-account-detail-dialog.tsx'
import { CreateAuditDialog } from '@/features/audit/create-audit-dialog.tsx'
import BranchSelector from '@/features/dashboard/components/branch-selector.tsx'

export const Route = createFileRoute('/_authenticated/audit/')({
  component: RouteComponent,
})

type Row = components['schemas']['Customer2']

function RouteComponent() {
  const [open, setOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)

  const [branchId, setBranchId] = useState<string | undefined>(undefined)

  const [viewingRow, setViewingRow] = useState<Row | undefined>(undefined)

  // const handleViewDetails = (row: AuditRow) => {
  //   setViewingRow(row)
  // }

  const user = useAuthStore().auth.user

  const { data, error, refetch } = $api.useQuery(
    'get',
    '/stockAudit/accounts',
    {
      params: {
        header: { Authorization: '' },
        query: { branchId: branchId === 'all' ? undefined : branchId },
      },
    }
  )

  const canAssign = useCanAccess('stock_audit', 'assign')

  // const createAuditMutation = $api.useMutation('post', '/stockAudit/create', {
  //   onSuccess: () => {
  //     toast.success('Audit created successfully')
  //     refetch()
  //     setOpen(false)
  //   },
  //   onError: () => toast.error('Failed to create audit'),
  // })

  const columns: PaginatedTableProps<Row>['columns'] = [
    {
      key: 'acctNo',
      label: 'Account No',
      sortable: true,
      render: (value) => <AccountNoCell value={(value ?? '') as string} />,
    },
    { key: 'acctDesc', label: 'Description', sortable: true },
    { key: 'custName', label: 'Customer Name', sortable: true },
    // { key: 'city', label: 'City', sortable: true },
    {
      key: 'loanLimit',
      label: 'Loan Limit',
      sortable: true,
      render: (value) => (value ? <CurrencyCell value={`${value}`} /> : ''),
    },

    {
      key: 'sanctDt',
      label: 'Sanction Date',
      sortable: true,
      render: (value) => <DateCell value={value} />,
    },
  ]

  // const form = useForm({ resolver: standardSchemaResolver(formSchema) })

  const handleOpenForm = (row: Row) => {
    setSelectedRow(row)
    setOpen(true)
  }

  // const handleSubmit = (values) => {
  //   createAuditMutation.mutate({
  //     body: { ...values, accountNo: selectedRow.acctNo, status: 'PENDING' },
  //   })
  // }

  if (error) return <div>Error: {(error as unknown as Error)?.message}</div>

  return (
    <MainWrapper
      extra={
        user?.branchId ? null : (
          <BranchSelector value={branchId} setValue={setBranchId} />
        )
      }
    >
      <PaginatedTable
        data={data?.data || []}
        columns={columns}
        tableTitle='Audit Accounts'
        emptyMessage='No audit accounts available.'
        renderActions={(row) => {
          return (
            <div className='flex flex-row justify-end gap-2'>
              {!row.status && (
                <Button
                  variant='outline'
                  disabled={!canAssign}
                  onClick={() => handleOpenForm(row)}
                >
                  Assign Audit
                </Button>
              )}

              {row.status && (
                <Button variant='outline' className='flex-1' disabled>
                  {row.status}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='icon' variant='ghost' className='h-8 w-8'>
                    <MoreVertical className='h-4 w-4' />
                    <span className='sr-only'>Open actions</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align='end' className='w-48'>
                  {/* ───── View – fires setViewingRow ───── */}

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setViewingRow(row)
                    }}
                    className='flex items-center gap-2'
                  >
                    <Eye className='h-4 w-4' />
                    View
                  </DropdownMenuItem>

                  {/* ───── Full Audit Report (only after completion) ───── */}
                  {row.status === 'COMPLETED' && row.stockAuditAssignId ? (
                    <DropdownMenuItem asChild>
                      <a
                        // href={`${BASE_URL}/stockAudit/fullReportPdf/${row.stockAuditAssignId}`}
                        href={`${BASE_URL}/api/stock-audit/pdf/assignment/${row.stockAuditAssignId ?? 0}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex w-full items-center gap-2'
                      >
                        <Download className='h-4 w-4' />
                        Audit Report
                      </a>
                    </DropdownMenuItem>
                  ) : null}

                  {/* ───── Assignment Letter – always available ───── */}
                  {row.stockAuditAssignId && (
                    <DropdownMenuItem asChild>
                      <a
                        href={`${BASE_URL}/stockAudit/generatePdf/${row.stockAuditAssignId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex w-full items-center gap-2'
                      >
                        <Download className='h-4 w-4' />
                        Assignment Letter
                      </a>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }}
      />

      <CreateAuditDialog
        open={open}
        onOpenChange={setOpen}
        selectedRow={selectedRow}
        onSuccess={refetch}
      />

      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[80vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Create Audit</DialogTitle>
          </DialogHeader>

          <Separator className='h-[1px] w-full bg-gray-200' />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4'
            >
              <FormField
                name='auditPeriodFrom'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Period From</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='auditPeriodTo'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Period To</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='facilityType'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='stockLocation'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='auditorName'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='auditorAddress'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='auditScope'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Scope</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='sanctionLimit'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sanction Limit</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='assignedAuditorUsername'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Auditor</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Assign Auditor' />
                        </SelectTrigger>
                        <SelectContent>
                          {auditorList?.data?.map((auditor) => (
                            <SelectItem key={auditor.id} value={auditor.id}>
                              {auditor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='deadline'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='submit' disabled={createAuditMutation.isPending}>
                  Create Audit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog> */}

      <AuditAccountDetailDialog
        row={viewingRow}
        onClose={() => {
          setViewingRow(undefined)
        }}
      />
    </MainWrapper>
  )
}
