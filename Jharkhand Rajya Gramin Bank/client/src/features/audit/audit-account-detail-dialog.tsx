import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'

interface AuditRow {
  acctNo?: string
  acctDesc?: string
  custNumber?: string
  telNo?: string
  segement?: string
  custName?: string
  add1?: string
  add2?: string
  add3?: string
  add4?: string
  loanLimit?: number
  intRate?: number
  theoBal?: number
  outstand?: number
  irregAmt?: number
  sanctDt?: string
  emisDue?: number
  emisPaid?: number
  emisOvrdue?: number
  newIrac?: number
  oldIrac?: number
  arrCond?: number
  currency?: string
  maintBr?: number
  instalAmt?: number
  irrgDtString?: string
  irrgDt?: string
  unrealInt?: number
  accrInt?: number
  stress?: string
  smaCodeIncipientStress?: string
  ra?: string
  raDate?: string
  writeOffFlag?: string
  writeOffAmount?: number
  writeOffDate?: string
  alert1?: string
  alert2?: string
  alert3?: string
  branchCode?: string
  crmDone?: boolean
  actType?: string
  status?: string
  city?: string
}

// interface DetailItemProps {
//   label: string
//   children?: React.ReactNode
// }

// const DetailItem: React.FC<DetailItemProps> = ({ label, children }) => {
//   const hasContent =
//     children !== null &&
//     typeof children !== 'undefined' &&
//     (typeof children !== 'string' || children.trim() !== '')
//   const isBooleanFalse = children === false

//   return (
//     <div className='py-3 sm:grid sm:grid-cols-3 sm:gap-4'>
//       <dt className='text-muted-foreground text-sm leading-6 font-medium'>
//         {label}
//       </dt>
//       <dd className='text-foreground mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0'>
//         {hasContent || isBooleanFalse ? (
//           children
//         ) : (
//           <span className='text-slate-500 italic dark:text-slate-400'>
//             Not Provided
//           </span>
//         )}
//       </dd>
//     </div>
//   )
// }

export function AuditAccountDetailDialog({
  row,
  onClose,
}: {
  row?: AuditRow | null
  onClose: () => void
}) {
  if (!row) return null

  return (
    <Dialog
      open={!!row}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {/* <DialogContent className='dark:bg-background max-h-3/4 overflow-auto rounded-lg bg-white shadow-xl sm:max-w-xl'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle className='text-foreground text-xl leading-7 font-semibold'>
            Audit Account Details
          </DialogTitle>
        </DialogHeader>

        <div className='border-border dark:border-border mt-4 border-t border-b px-6 py-4'>
          <dl className='divide-border dark:divide-border divide-y'>
            <DetailItem label='Account No'>{row.acctNo}</DetailItem>
            <DetailItem label='Description'>{row.acctDesc}</DetailItem>
            <DetailItem label='Customer Name'>{row.custName}</DetailItem>
            <DetailItem label='City'>{row.add4}</DetailItem>
            <DetailItem label='Loan Limit'>
              {row.loanLimit != null
                ? row.loanLimit.toLocaleString(undefined, {
                    style: 'currency',
                    currency: row.currency || 'INR',
                  })
                : null}
            </DetailItem>
            <DetailItem label='Interest Rate (%)'>{row.intRate}</DetailItem>
            <DetailItem label='Sanction Date'>{row.sanctDt}</DetailItem>
            <DetailItem label='Outstanding'>{row.outstand}</DetailItem>
            <DetailItem label='Segment'>{row.segement}</DetailItem>
            <DetailItem label='Status'>
              {row.status ? (
                <Badge
                  variant={
                    row.status.toLowerCase().includes('pending')
                      ? 'secondary'
                      : row.status.toLowerCase().includes('complete') ||
                          row.status.toLowerCase().includes('done')
                        ? 'default'
                        : 'outline'
                  }
                  className='capitalize'
                >
                  {row.status}
                </Badge>
              ) : null}
            </DetailItem>
            {/* <DetailItem label='CRM Done'>
              {row.crmDone ? 'Yes' : 'No'}
            </DetailItem>
            <DetailItem label='Alerts'>
              <ul className='list-inside list-disc space-y-1 pl-5'>
                {[row.alert1, row.alert2, row.alert3]
                  .filter(Boolean)
                  .map((alert, i) => (
                    <li key={i}>{alert}</li>
                  ))}
              </ul>
            </DetailItem>
          </dl>
        </div>

        <DialogFooter className='bg-muted/40 dark:bg-muted/20 rounded-b-lg px-6 py-4'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent> */}
      <DialogContent className='dark:bg-background max-h-[90vh] w-full overflow-auto rounded-2xl bg-white shadow-xl sm:max-w-3xl'>
        {/* Header */}
        <DialogHeader className='from-primary/20 via-primary/10 sticky top-0 z-10 border-b bg-gradient-to-r to-transparent px-6 pt-5 pb-2'>
          <DialogTitle className='text-foreground text-xl leading-7 font-semibold tracking-tight'>
            Audit Account Details
          </DialogTitle>
          {row?.acctNo ? (
            <p className='text-muted-foreground mt-1 text-sm'>
              Account No:{' '}
              <span className='text-foreground font-medium'>{row.acctNo}</span>
            </p>
          ) : null}
        </DialogHeader>

        {/* Content */}
        <div className='px-4 py-2'>
          <dl className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Account No */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Account No
              </dt>
              <dd className='text-foreground mt-1 text-sm font-semibold'>
                {row.acctNo}
              </dd>
            </div>

            {/* Description */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Description
              </dt>
              <dd className='mt-1 text-sm font-medium'>{row.acctDesc}</dd>
            </div>

            {/* Customer Name */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Customer Name
              </dt>
              <dd className='mt-1 text-sm font-medium'>{row.custName}</dd>
            </div>

            {/* City */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                City
              </dt>
              <dd className='mt-1 text-sm font-medium'>{row.city}</dd>
            </div>

            {/* Loan Limit */}
            {/* <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Loan Limit
              </dt>
              <dd className='mt-1 text-sm font-semibold'>
                {row.loanLimit != null
                  ? row.loanLimit.toLocaleString(undefined, {
                      style: 'currency',
                      currency: row.currency || 'INR',
                    })
                  : '—'}
              </dd>
            </div> */}

            {/* Interest Rate */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Interest Rate (%)
              </dt>
              <dd className='mt-1 text-sm font-medium'>{row.intRate ?? '—'}</dd>
            </div>

            {/* Sanction Date */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Sanction Date
              </dt>
              <dd className='mt-1 text-sm font-medium'>{row.sanctDt ?? '—'}</dd>
            </div>

            {/* Outstanding */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Outstanding
              </dt>
              <dd className='mt-1 text-sm font-medium'>
                {row.outstand ?? '—'}
              </dd>
            </div>

            {/* Segment */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Segment
              </dt>
              <dd className='mt-1 text-sm font-medium'>
                {row.segement ?? '—'}
              </dd>
            </div>

            {/* Status */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
              <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                Status
              </dt>
              <dd className='mt-1 text-sm'>
                {row.status ? (
                  <Badge
                    variant={
                      row.status.toLowerCase().includes('pending')
                        ? 'secondary'
                        : row.status.toLowerCase().includes('complete') ||
                            row.status.toLowerCase().includes('done')
                          ? 'default'
                          : 'outline'
                    }
                    className='capitalize'
                  >
                    {row.status}
                  </Badge>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter className='bg-muted/40 sticky bottom-0 rounded-b-2xl border-t px-6 py-4 backdrop-blur'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
