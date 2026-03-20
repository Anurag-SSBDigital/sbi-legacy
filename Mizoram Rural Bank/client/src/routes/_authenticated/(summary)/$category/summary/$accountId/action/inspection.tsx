import { useMemo, useState } from 'react'
import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { Factory, Users } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import PaginatedTable, {
  PaginatedTableProps,
} from '@/components/paginated-table.tsx'
import {
  DateCell,
  ReportCell,
  DeleteActionCell,
} from '@/components/table/cells.ts'
import NewAgricultureDialog from '@/features/inspections/new-agriculture-dialog.tsx'
import NewMsmeDialog from '@/features/inspections/new-msme-inspection-dialog.tsx'
import NewPSegmentDialog from '@/features/inspections/new-psegmnet-dialog.tsx'
import { useCanAccess } from '@/hooks/use-can-access'

/* ------------------------------------------------------------------ */
/* Route Definition                                                   */
/* ------------------------------------------------------------------ */
export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action/inspection'
)({
  component: InspectionHistoryPage,
  validateSearch: z.object({
    inspecttionType: z.string().optional(),
  }),
})

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function InspectionHistoryPage() {
  const { accountId } = Route.useParams()
  const { inspecttionType } = Route.useSearch()
  const canDelete = useCanAccess('inspection', 'delete')

  /* --------------------- */
  /* Queries               */
  /* --------------------- */
  const { data: nameRes, isLoading: nameLoading } = $api.useQuery(
    'get',
    '/account/getName',
    {
      params: {
        query: { acctNo: accountId },
      },
      onError: () => toast.error('Could not fetch account holder name'),
    }
  )

  const {
    data: inspectionsRes,
    isLoading: inspectionsLoading,
    refetch,
  } = $api.useQuery('get', '/Inspections/getAll', {
    params: {
      query: { accountNumber: accountId },
    },
    onError: () => toast.error('Could not fetch inspections'),
  })

  const inspections = inspectionsRes?.data ?? []

  /* --------------------- */
  /* Mutations             */
  /* --------------------- */
  const deleteMsmeMutation = $api.useMutation(
    'delete',
    '/Msme_inspections/delete/{inspectionId}'
  )
  const deleteRetailMutation = $api.useMutation(
    'delete',
    '/Psegement_inspections/delete/{inspectionId}'
  )

  const handleDelete = async (inspectionId: number) => {
    try {
      if (inspecttionType === 'MSME') {
        const res = await deleteMsmeMutation.mutateAsync({
          params: { path: { inspectionId } },
        })

        if (res) {
          toast.success('MSME inspection deleted successfully')
          refetch()
        } else {
          toast.error('Failed to delete MSME inspection')
        }
      } else if (inspecttionType === 'Retail') {
        const res = await deleteRetailMutation.mutateAsync({
          params: { path: { inspectionId } },
        })

        if (res) {
          toast.success('Retail inspection deleted successfully')
          refetch()
        } else {
          toast.error('Failed to delete Retail inspection')
        }
      }
    } catch {
      // toast.error('Could not delete inspection')
    }
  }

  const [agricultureDialogOpen, setAgricultureDialogOpen] = useState(false)
  const [psegmnetDialogOpen, setPsegmnetDialogOpen] = useState(false)
  const [msmeDialogOpen, setMsmeDialogOpen] = useState(false)

  const columns = useMemo<
    PaginatedTableProps<components['schemas']['AllInspectionDto']>['columns']
  >(() => {
    const baseColumns: PaginatedTableProps<
      components['schemas']['AllInspectionDto']
    >['columns'] = [
        {
          key: 'date',
          label: 'Date',
          sortable: true,
          render: (value) => <DateCell value={value} />,
        },
        { key: 'followUpType', label: 'Type', sortable: true },
        { key: 'location', label: 'Location' },
        { key: 'summary', label: 'Summary' },
        {
          key: 'report',
          label: 'Report',
          render: (v) => <ReportCell url={v} />,
        },
      ]

    // Add Actions column only if user has permission
    if (canDelete) {
      baseColumns.push({
        key: 'id',
        label: 'Actions',
        render: (_, row: components['schemas']['AllInspectionDto']) => (
          <DeleteActionCell
            title='Delete Inspection'
            description='Are you sure you want to delete this inspection? This action cannot be undone.'
            onConfirm={() => handleDelete(Number(row.id))}
            isConfirming={
              deleteMsmeMutation.isPending || deleteRetailMutation.isPending
            }
          />
        ),
      })
    }

    return baseColumns
  }, [inspecttionType, canDelete])

  const loading = inspectionsLoading || nameLoading

  /* --------------------- */
  /* UI                    */
  /* --------------------- */
  return (
    <>
      <div className='space-y-6'>
        <header className='text-center'>
          {loading ? (
            <Skeleton className='mx-auto h-6 w-72' />
          ) : (
            <h2 className='text-2xl font-semibold tracking-tight'>
              Inspection History — {nameRes?.data ?? ''} ({accountId}){' '}
              {inspecttionType ? `(${inspecttionType})` : ``}
            </h2>
          )}
        </header>

        <Card>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Inspection Records</CardTitle>

            <div className='flex flex-wrap gap-3'>
              {/* ---------------- New Retail Inspection ---------------- */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='default'
                      size='sm'
                      className='gap-2'
                      onClick={() => setPsegmnetDialogOpen(true)}
                    >
                      <Users className='h-4 w-4' />
                      <span className='hidden sm:inline'>New Retail</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create Retail Inspection</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* ---------------- New MSME Inspection ---------------- */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='default'
                      size='sm'
                      className='gap-2'
                      onClick={() => setMsmeDialogOpen(true)}
                    >
                      <Factory className='h-4 w-4' />
                      <span className='hidden sm:inline'>New MSME</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create MSME Inspection</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* CTA: New Inspection Buttons                                         */}
            {/* ------------------------------------------------------------------ */}
            {/* <div className='flex flex-wrap gap-3'>
              {inspecttionType === 'Retail' && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='default'
                        size='sm'
                        className='gap-2'
                        onClick={() => setPsegmnetDialogOpen(true)}
                      >
                        <Users className='h-4 w-4' />
                        <span className='hidden sm:inline'>New Retail</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create Retail Inspection</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {inspecttionType === 'MSME' && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='default'
                        size='sm'
                        className='gap-2'
                        onClick={() => setMsmeDialogOpen(true)}
                      >
                        <Factory className='h-4 w-4' />
                        <span className='hidden sm:inline'>New MSME</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create MSME Inspection</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div> */}
          </CardHeader>

          <CardContent>
            <PaginatedTable
              data={inspections}
              columns={columns}
              initialRowsPerPage={10}
              emptyMessage='No inspections found'
              showSearch={true}
              frameless={true}
            />
          </CardContent>
        </Card>
      </div>
      <NewAgricultureDialog
        open={agricultureDialogOpen}
        setOpen={setAgricultureDialogOpen}
        accountId={accountId}
        onSuccess={refetch}
      />
      <NewPSegmentDialog
        open={psegmnetDialogOpen}
        setOpen={setPsegmnetDialogOpen}
        accountId={accountId}
        onSuccess={refetch}
      />
      <NewMsmeDialog
        open={msmeDialogOpen}
        setOpen={setMsmeDialogOpen}
        accountId={accountId}
        onSuccess={refetch}
      />
    </>
  )
}
