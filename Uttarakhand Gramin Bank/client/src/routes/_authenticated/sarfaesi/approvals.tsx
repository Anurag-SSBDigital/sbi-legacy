// src/routes/_authenticated/sarfaesi/approvals.tsx
import React, { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
// If you have OpenAPI types:
import { components } from '@/types/api/v1.js'
import { Eye, AlertCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // ⬅️ add this
} from '@/components/ui/dialog'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import PaginatedTable, {
  type PaginatedTableColumn,
} from '@/components/paginated-table.tsx'

type SarfaesiApproval = components['schemas']['SarfaesiApproval']

export const Route = createFileRoute('/_authenticated/sarfaesi/approvals')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, isLoading, error } = $api.useQuery(
    'get',
    '/sarfaesi/approvals/all'
  )

  const initiateSarfaesiMutation = $api.useMutation(
    'post',
    '/api/sarfaesi/{accountNumber}/initiate',
    {
      onSuccess: (res) => {
        toast.success(res.message ?? 'Sarfaesi initiated successfully')
      },
      onError: (error) => {
        toastError(error, 'Failed to initiate Sarfaesi')
      },
    }
  )

  const initiateSarfaesi = (accountNumber: string) => {
    initiateSarfaesiMutation.mutate({
      params: { path: { accountNumber }, header: { Authorization: '' } },
    })
  }

  const approvals: SarfaesiApproval[] = data?.data ?? []

  const columns = useMemo<PaginatedTableColumn<SarfaesiApproval>[]>(
    () => [
      {
        key: 'accountNo',
        label: 'Account No.',
        sortable: true,
        render: (value, row) => (
          <div className='flex flex-col'>
            <span className='font-medium'>{value || '—'}</span>
            {row.borrowerName && (
              <span className='text-muted-foreground text-xs'>
                {row.borrowerName}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'branchName',
        label: 'Branch',
        sortable: true,
        render: (value, row) => (
          <div className='flex flex-col'>
            <span>{value || '—'}</span>
            {row.branchCode && (
              <span className='text-muted-foreground text-xs'>
                Code: {row.branchCode}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'sanctionAmount',
        label: 'Sanction Amt',
        sortable: true,
        render: (value) =>
          value != null ? (
            <span className='font-medium'>
              ₹ {Number(value).toLocaleString('en-IN')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'totalDues',
        label: 'Total Dues',
        sortable: true,
        render: (value) =>
          value != null ? (
            <span className='font-semibold text-amber-700'>
              ₹ {Number(value).toLocaleString('en-IN')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'npaDate',
        label: 'NPA Date',
        sortable: true,
        render: (value) => (value ? formatDate(value) : '—'),
      },
      {
        key: 'presentAssetCategory',
        label: 'Asset Category',
        sortable: true,
        render: (value) =>
          value ? (
            <AssetCategoryBadge category={value as string} />
          ) : (
            <span className='text-muted-foreground italic'>Not set</span>
          ),
      },
      {
        key: 'accountStatus',
        label: 'Account Status',
        sortable: true,
        render: (value) =>
          value ? (
            <StatusBadge status={value as string} />
          ) : (
            <span className='text-muted-foreground italic'>Not set</span>
          ),
      },
      {
        key: 'createdTime',
        label: 'Created',
        sortable: true,
        render: (value) =>
          value ? (
            <div className='flex flex-col'>
              <span>{formatDateTime(value as string)}</span>
            </div>
          ) : (
            '—'
          ),
      },
    ],
    []
  )

  return (
    <MainWrapper>
      <div className='mb-6 flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          SARFAESI Approvals
        </h1>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          View all SARFAESI approval proposals, their branch details, sanction
          amounts, NPA status and overall dues. Click on{' '}
          <span className='font-medium'>View</span> to see full proposal
          details.
        </p>
      </div>

      {isLoading && (
        <div className='text-muted-foreground bg-card rounded-lg border px-4 py-6 text-sm'>
          Loading approvals…
        </div>
      )}

      {error && !isLoading && (
        <div className='border-destructive bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm'>
          <AlertCircle className='h-4 w-4' />
          <span>Failed to load approvals. Please try again.</span>
        </div>
      )}

      {!isLoading && !error && (
        <PaginatedTable<SarfaesiApproval>
          data={approvals}
          columns={columns}
          tableTitle='Approvals list'
          emptyMessage='No approvals found.'
          initialRowsPerPage={10}
          renderActions={(row) => (
            <div className='flex gap-2'>
              <ApprovalViewDialog approval={row} />
              {row.performaCompleted ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='destructive' size='sm'>
                      Initiate SARFAESI
                    </Button>
                  </DialogTrigger>

                  <DialogContent className='max-w-md'>
                    <DialogHeader>
                      <DialogTitle>Initiate SARFAESI?</DialogTitle>
                      <DialogDescription>
                        You are about to initiate SARFAESI for account{' '}
                        <span className='font-semibold'>{row.accountNo}</span>
                        {row.borrowerName && (
                          <>
                            {' '}
                            (borrower:{' '}
                            <span className='font-semibold'>
                              {row.borrowerName}
                            </span>
                            )
                          </>
                        )}
                        . This action will trigger the SARFAESI process in the
                        system.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className='flex justify-end gap-2'>
                      <DialogClose asChild>
                        <Button variant='outline' size='sm'>
                          Cancel
                        </Button>
                      </DialogClose>

                      <DialogClose asChild>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() =>
                            initiateSarfaesi(String(row.accountNo))
                          }
                        >
                          Confirm &amp; Initiate
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Link
                  to='/sarfaesi/proforma'
                  search={{ acctNo: String(row.accountNo) }}
                >
                  <Button variant='secondary'>
                    Proforma
                    <ChevronRight />
                  </Button>
                </Link>
              )}
            </div>
          )}
        />
      )}
    </MainWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AssetCategoryBadge({ category }: { category: string }) {
  const normalized = category.toUpperCase()
  let className =
    'bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded-full'
  if (normalized.includes('STANDARD')) {
    className =
      'bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full'
  } else if (normalized.includes('SUB') || normalized.includes('DOUBT')) {
    className =
      'bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full'
  } else if (normalized.includes('LOSS')) {
    className =
      'bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-0.5 rounded-full'
  }

  return <span className={className}>{category}</span>
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase()
  let variantClasses =
    'bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded-full'
  if (normalized.includes('ACTIVE')) {
    variantClasses =
      'bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full'
  } else if (normalized.includes('CLOSED') || normalized.includes('SETTLED')) {
    variantClasses =
      'bg-sky-100 text-sky-800 border border-sky-200 text-xs px-2 py-0.5 rounded-full'
  } else if (normalized.includes('NPA') || normalized.includes('DEFAULT')) {
    variantClasses =
      'bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-0.5 rounded-full'
  }

  return <span className={variantClasses}>{status}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// View Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface ApprovalViewDialogProps {
  approval: SarfaesiApproval
}

function ApprovalViewDialog({ approval }: ApprovalViewDialogProps) {
  const {
    accountNo,
    borrowerName,
    borrowerAddress,
    branchName,
    branchCode,
    region,
    constitution,
    sanctionAmount,
    sanctionDate,
    facility,
    bankingRelationship,
    sharePercentage,
    activityName,
    activityStatus,
    npaDate,
    presentAssetCategory,
    accountStatus,
    rehabilitationStatus,
    bifrStatus,
    suitStatus,
    outstandingDues,
    totalDues,
    taxDuesDetails,
    documentDetails,
    limitationComments,
    tangibleSecurities,
    enforcedSecurities,
    marketabilityComments,
    consentRequired,
    consentBankName,
    interCreditorComments,
    recoveryEfforts,
    staffAccountabilityStatus,
    branchCategory,
    incumbentCadre,
    remarks,
    personDetails,
    createdBy,
    createdTime,
    updatedBy,
    updatedTime,
  } = approval

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <Eye className='mr-1.5 h-4 w-4' />
          View
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] max-w-4xl gap-0 p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='flex items-center justify-between gap-3 text-lg'>
            <span>SARFAESI Approval Details</span>
            {presentAssetCategory && (
              <AssetCategoryBadge category={presentAssetCategory} />
            )}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground mt-1 text-xs'>
            Account: <span className='font-medium'>{accountNo}</span>{' '}
            {borrowerName && (
              <>
                · Borrower: <span className='font-medium'>{borrowerName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[70vh]'>
          <div className='space-y-6 px-6 py-5'>
            {/* Top key info badges */}
            <div className='flex flex-wrap gap-2 text-xs'>
              {branchName && (
                <Badge variant='outline'>
                  Branch: {branchName}
                  {branchCode ? ` (${branchCode})` : ''}
                </Badge>
              )}
              {region && <Badge variant='outline'>Region: {region}</Badge>}
              {constitution && (
                <Badge variant='outline'>Constitution: {constitution}</Badge>
              )}
              {facility && (
                <Badge variant='outline'>Facility: {facility}</Badge>
              )}
              {accountStatus && <StatusBadge status={accountStatus} />}
            </div>

            {/* Account & sanction details */}
            <Section title='Account & Sanction Details'>
              <TwoColRow
                label='Account No.'
                value={accountNo}
                label2='Borrower'
                value2={borrowerName}
              />
              <TwoColRow
                label='Address'
                value={borrowerAddress}
                label2='Constitution'
                value2={constitution}
              />
              <TwoColRow
                label='Sanction Amount'
                value={
                  sanctionAmount != null
                    ? `₹ ${Number(sanctionAmount).toLocaleString('en-IN')}`
                    : '—'
                }
                label2='Sanction Date'
                value2={sanctionDate ? formatDate(sanctionDate) : '—'}
              />
              <TwoColRow
                label='Facility'
                value={facility}
                label2='Banking Relationship'
                value2={bankingRelationship}
              />
              <TwoColRow
                label='Share %'
                value={sharePercentage != null ? `${sharePercentage} %` : '—'}
                label2='Activity'
                value2={
                  activityName
                    ? `${activityName}${
                        activityStatus ? ` (${activityStatus})` : ''
                      }`
                    : activityStatus || '—'
                }
              />
            </Section>

            {/* NPA & dues */}
            <Section title='NPA & Dues'>
              <TwoColRow
                label='NPA Date'
                value={npaDate ? formatDate(npaDate) : '—'}
                label2='Outstanding Dues'
                value2={
                  outstandingDues != null
                    ? `₹ ${Number(outstandingDues).toLocaleString('en-IN')}`
                    : '—'
                }
              />
              <TwoColRow
                label='Total Dues'
                value={
                  totalDues != null
                    ? `₹ ${Number(totalDues).toLocaleString('en-IN')}`
                    : '—'
                }
                label2='Tax Dues'
                value2={taxDuesDetails || '—'}
              />
              <TwoColRow
                label='Rehabilitation Status'
                value={rehabilitationStatus}
                label2='BIFR Status'
                value2={bifrStatus}
              />
              <TwoColRow
                label='Suit Status'
                value={suitStatus}
                label2='Staff Accountability'
                value2={staffAccountabilityStatus}
              />
            </Section>

            {/* Person details */}
            {personDetails && personDetails.length > 0 && (
              <Section title='Promoters / Guarantors'>
                <div className='overflow-hidden rounded-md border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/60 text-xs'>
                      <tr>
                        <th className='px-3 py-2 text-left font-medium'>
                          Name
                        </th>
                        <th className='px-3 py-2 text-left font-medium'>
                          Relationship
                        </th>
                        <th className='px-3 py-2 text-right font-medium'>
                          Net Worth (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {personDetails.map((p, idx) => (
                        <tr
                          key={`${p.name}-${idx}`}
                          className='border-t text-xs sm:text-sm'
                        >
                          <td className='px-3 py-2'>{p.name || '—'}</td>
                          <td className='px-3 py-2'>{p.relationship || '—'}</td>
                          <td className='px-3 py-2 text-right'>
                            {p.netWorth != null
                              ? Number(p.netWorth).toLocaleString('en-IN')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Document details */}
            {documentDetails && documentDetails.length > 0 && (
              <Section title='Document Details'>
                <div className='overflow-hidden rounded-md border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/60 text-xs'>
                      <tr>
                        <th className='px-3 py-2 text-left font-medium'>
                          Document
                        </th>
                        <th className='px-3 py-2 text-left font-medium'>
                          Date of Execution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentDetails.map((d, idx) => (
                        <tr
                          key={`${d.name}-${idx}`}
                          className='border-t text-xs sm:text-sm'
                        >
                          <td className='px-3 py-2'>{d.name || '—'}</td>
                          <td className='px-3 py-2'>
                            {d.dateOfExecution
                              ? formatDate(d.dateOfExecution)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {limitationComments && (
                  <FieldBlock
                    label='Limitation Comments'
                    value={limitationComments}
                  />
                )}
              </Section>
            )}

            {/* Securities */}
            {(tangibleSecurities && tangibleSecurities.length > 0) ||
            (enforcedSecurities && enforcedSecurities.length > 0) ? (
              <Section title='Security Details'>
                {tangibleSecurities && tangibleSecurities.length > 0 && (
                  <SubSection title='Tangible Securities'>
                    <div className='overflow-hidden rounded-md border'>
                      <table className='w-full text-sm'>
                        <thead className='bg-muted/60 text-xs'>
                          <tr>
                            <th className='px-3 py-2 text-left font-medium'>
                              Details
                            </th>
                            <th className='px-3 py-2 text-left font-medium'>
                              Charge Type
                            </th>
                            <th className='px-3 py-2 text-right font-medium'>
                              Expected Market Value (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tangibleSecurities.map((s, idx) => (
                            <tr
                              key={idx}
                              className='border-t text-xs sm:text-sm'
                            >
                              <td className='px-3 py-2'>{s.details || '—'}</td>
                              <td className='px-3 py-2'>
                                {s.chargeType || '—'}
                              </td>
                              <td className='px-3 py-2 text-right'>
                                {s.expectedMarketValue != null
                                  ? Number(
                                      s.expectedMarketValue
                                    ).toLocaleString('en-IN')
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SubSection>
                )}

                {enforcedSecurities && enforcedSecurities.length > 0 && (
                  <SubSection title='Enforced Securities'>
                    <div className='overflow-hidden rounded-md border'>
                      <table className='w-full text-sm'>
                        <thead className='bg-muted/60 text-xs'>
                          <tr>
                            <th className='px-3 py-2 text-left font-medium'>
                              Details
                            </th>
                            <th className='px-3 py-2 text-left font-medium'>
                              Charge Type
                            </th>
                            <th className='px-3 py-2 text-left font-medium'>
                              Owned By
                            </th>
                            <th className='px-3 py-2 text-right font-medium'>
                              Expected Market Value (₹)
                            </th>
                            <th className='px-3 py-2 text-right font-medium'>
                              Share of Charge (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {enforcedSecurities.map((s, idx) => (
                            <tr
                              key={idx}
                              className='border-t text-xs sm:text-sm'
                            >
                              <td className='px-3 py-2'>{s.details || '—'}</td>
                              <td className='px-3 py-2'>
                                {s.chargeType || '—'}
                              </td>
                              <td className='px-3 py-2'>{s.ownedBy || '—'}</td>
                              <td className='px-3 py-2 text-right'>
                                {s.expectedMarketValue != null
                                  ? Number(
                                      s.expectedMarketValue
                                    ).toLocaleString('en-IN')
                                  : '—'}
                              </td>
                              <td className='px-3 py-2 text-right'>
                                {s.shareOfCharge != null
                                  ? `${s.shareOfCharge} %`
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SubSection>
                )}

                {marketabilityComments && (
                  <FieldBlock
                    label='Marketability Comments'
                    value={marketabilityComments}
                  />
                )}
              </Section>
            ) : null}

            {/* Consents & recovery */}
            <Section title='Consents & Recovery Efforts'>
              <TwoColRow
                label='Consent Required'
                value={
                  consentRequired == null ? '—' : consentRequired ? 'Yes' : 'No'
                }
                label2='Consent Bank'
                value2={consentBankName}
              />
              <FieldBlock
                label='Inter-Creditor Comments'
                value={interCreditorComments}
              />
              <FieldBlock label='Recovery Efforts' value={recoveryEfforts} />
            </Section>

            {/* Branch / misc */}
            <Section title='Branch & Miscellaneous'>
              <TwoColRow
                label='Branch Category'
                value={branchCategory}
                label2='Incumbent Cadre'
                value2={incumbentCadre}
              />
              <FieldBlock label='Remarks' value={remarks} />
            </Section>

            {/* Audit trail */}
            <Section title='Audit Trail'>
              <TwoColRow
                label='Created By'
                value={createdBy}
                label2='Created Time'
                value2={createdTime ? formatDateTime(createdTime) : '—'}
              />
              <TwoColRow
                label='Updated By'
                value={updatedBy}
                label2='Updated Time'
                value2={updatedTime ? formatDateTime(updatedTime) : '—'}
              />
            </Section>
          </div>
        </ScrollArea>

        <DialogFooter className='bg-muted/40 border-t px-6 py-3'>
          <Button variant='outline' size='sm'>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Small layout helpers for consistent sections

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <h3 className='text-sm font-semibold'>{title}</h3>
        <Separator className='flex-1' />
      </div>
      <div className='grid gap-3 text-xs sm:text-sm'>{children}</div>
    </div>
  )
}

function SubSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-2'>
      <h4 className='text-muted-foreground text-xs font-semibold'>{title}</h4>
      {children}
    </div>
  )
}

function TwoColRow(props: {
  label: string
  value?: string | number | null
  label2?: string
  value2?: string | number | null
}) {
  const { label, value, label2, value2 } = props
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <FieldBlock label={label} value={value} />
      {label2 && <FieldBlock label={label2} value={value2} />}
    </div>
  )
}

function FieldBlock({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  const display =
    value == null || value === ''
      ? '—'
      : typeof value === 'number'
        ? value.toString()
        : value

  return (
    <div className='space-y-1'>
      <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
        {label}
      </div>
      <div className='bg-muted/40 rounded-md border px-2.5 py-1.5 text-xs sm:text-sm'>
        {display}
      </div>
    </div>
  )
}
