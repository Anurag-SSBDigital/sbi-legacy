import React, { useMemo } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { createFileRoute, createLink } from '@tanstack/react-router'
import { components } from '@/types/api/v1.js'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  ClipboardCheck,
  Download,
  FileBadge,
  FileSearch,
  FileText,
  Gavel,
  LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api, BASE_URL } from '@/lib/api'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button'
import {
  Card,
} from '@/components/ui/card'
import MainWrapper from '@/components/ui/main-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table'
import AccountNoCell2 from '@/components/table/cells/account-no-cell2'
import { resolveApiUrl } from '@/lib/url'

export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/'
)({
  loader: (ctx) => ({ crumb: ctx.params.accountId }),
  params: {
    parse: z.object({
      accountId: z.string(),
      category: z.enum(['standard', 'npa', 'sma']),
    }).parse,
  },
  component: AccountSummaryPage,
})

function AccountSummaryPage() {
  const { accountId, category } = Route.useParams()
  const {
    data: acctResp,
    isLoading: acctLoading,
    isError: acctError,
  } = $api.useQuery('get', '/account/NpaAccount/{acctNo}', {
    params: { path: { acctNo: accountId } },
    enabled: !!accountId,
    onError: () => toast.error('Could not fetch account'),
  })
  const account = acctResp?.data

  const { data: followResp } = $api.useQuery(
    'get',
    '/ActtionAccount/follow-ups',
    {
      params: { query: { accountNumber: accountId } },
      enabled: !!accountId,
      onError: () => toast.error('Could not fetch follow‑ups'),
    }
  )
  const followUps = followResp?.data ?? []

  const columns = useMemo<
    PaginatedTableColumn<components['schemas']['FollowUpDetailsDto']>[]
  >(
    () => [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        render: (value) =>
          value ? format(new Date(value), 'dd-MM-yyyy HH:mm') : '-',
      },
      {
        key: 'followUpType',
        label: 'Follow‑up Type',
      },
      {
        key: 'summary',
        label: 'Summary',
      },
      {
        key: 'report',
        label: 'Report',
        render: (url) => {
          const reportUrl = resolveApiUrl(url)

          return reportUrl ? (
            <a
               href={reportUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-blue-600 hover:underline'
            >
              <Download className='h-4 w-4' />
              Download
            </a>
          ) : (
            '—'
          )
        },
      },
    ],
    []
  )

  return (
    <MainWrapper>
      <AppBreadcrumb
        crumbs={[
          { type: 'link', item: { label: 'Home', to: '/' } },
          {
            label: 'Summary',
            type: 'dropdown',
            selectedIndex:
              category === 'standard' ? 0 : category === 'npa' ? 2 : 1,
            items: [
              { label: 'Standard', to: '/standard/summary' },
              { label: 'SMA', to: '/sma/summary' },
              { label: 'NPA', to: '/npa/summary' },
            ],
          },
        ]}
        currentPage={{
          type: 'label',
          label: `${account?.custName ? `${account?.custName} - ` : ''}${accountId}`,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='space-y-10 pt-4'
      >
        <header className='space-y-4 text-center'>
          <div className='inline-flex mt-4 items-center justify-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-[24px] font-bold uppercase'>
            <span className='inline-flex h-3 w-3 rounded-full bg-primary/80' />
            Account Summary
          </div>

          <div className='h-1 mt-4 w-full bg-gradient-to-r from-transparent via-border/90 to-transparent' />
        </header>

        <section className="relative mt-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-primary/70" />

          <div className="flex items-center justify-between pl-3 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Key Snapshot
              </h2>
              <p className="text-xs text-muted-foreground">
                Product, account number, outstanding & segment
              </p>
            </div>
          </div>

          <div className="pt-4 pl-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {acctLoading ? (
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))
              ) : (
                <>
                  <StatsCard label="Product" value={account?.productCode ?? '—'} />
                  {/* <StatsCard label="Account No" value={account?.acctNo ?? '—'} />                   */}
                  <StatsCard label="Account No" value={<AccountNoCell2 value={account?.acctNo ?? '—'} />} />
                  <StatsCard
                    label="Outstanding"
                    value={formatCurrency(account?.outstand)}
                  />
                  <StatsCard label="Segment" value={account?.segement ?? '—'} />
                </>
              )}
            </div>
          </div>
        </section>

        <section className="relative mt-6 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-primary/70" />
          <div className="flex items-center justify-between pl-3 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                General Details
              </h2>
              <p className="text-xs text-muted-foreground">
                Borrower & credit facility information
              </p>
            </div>
          </div>

          <div className="pt-4 pl-3">
            {acctLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 rounded-md" />
                ))}
              </div>
            ) : acctError ? (
              <p className="text-sm font-medium text-destructive">
                Something went wrong. Please try again.
              </p>
            ) : (
              <DetailGrid account={account} />
            )}
          </div>
        </section>

        <section className="relative mt-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-primary/70" />

          <div className="flex items-center justify-between pl-3 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Actions
              </h2>
              <p className="text-xs text-muted-foreground">
                Launch inspections, interviews, notices & legal workflows.
              </p>
            </div>
          </div>

          <div className="pt-4 pl-3">
            <ActionGrid
              accountId={accountId}
              category={category}
              inspecttionType={account?.inspecttionType}
            />
          </div>
        </section>

        <PaginatedTable
          tableTitle='Follow‑ups'
          data={followUps}
          columns={columns}
          initialRowsPerPage={5}
          emptyMessage='No follow‑ups recorded'
        />
      </motion.div>
    </MainWrapper>
  )
}

interface StatsCardProps {
  label: string
  value: React.ReactNode
}
const StatsCard = ({ label, value }: StatsCardProps) => (
  <Card className='flex flex-col justify-center p-4'>
    <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
      {label}
    </p>
    <p className='text-lg leading-snug font-semibold'>{value}</p>
  </Card>
)

const DetailGrid = ({
  account,
}: {
  account: components['schemas']['NpaAccountDetailDto2'] | undefined
}) => (
  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
    <Detail label='Customer Name' value={account?.custName} />
    <Detail
      label='Sanction Date'
      value={
        account?.sanctDt ? format(new Date(account.sanctDt), 'dd-MM-yyyy') : '—'
      }
    />
    <Detail label='CIF Number' value={account?.cifNumber} />
    <Detail label='Phone' value={account?.telNo} />
    <Detail label='Arrears' value={account?.arrearRs ?? '-'} />
    {/* <Detail label='EMIs Due' value={account?.emisDue ?? '-'} /> */}
  </div>
)

interface DetailProps {
  label: string
  value: React.ReactNode
}
const Detail = ({ label, value }: DetailProps) => (
  <div className='border border-muted rounded-lg p-4'>
    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
      {label}
    </p>
    <p className='font-semibold text-lg mt-4 break-all'>{value ?? '—'}</p>
  </div>
)

const actions: {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >
  label: string
  path: string
  category: ('standard' | 'sma' | 'npa')[]
}[] = [
    {
      icon: FileSearch,
      label: 'Inspection',
      path: 'inspection',
      category: ['standard', 'sma', 'npa'],
    },
    {
      icon: CalendarClock,
      label: 'Interview',
      path: 'interview',
      category: ['standard', 'sma', 'npa'],
    },
    {
      icon: FileText,
      label: 'Notice',
      path: 'notice',
      category: ['sma', 'npa'],
    },
    {
      icon: ClipboardCheck,
      label: 'Stock Audit',
      path: 'stock-audit',
      category: ['standard', 'sma', 'npa'],
    },
    {
      icon: Gavel,
      label: 'Legal',
      path: 'legal',
      category: ['standard', 'sma', 'npa'],
    },
    {
      icon: Gavel,
      label: 'Valuer',
      path: 'valuer',
      category: ['standard', 'sma', 'npa'],
    },
    {
      icon: Gavel,
      label: 'Statutory Auditors',
      path: 'statutoryAuditors',
      category: ['standard', 'sma', 'npa'],
    },
  ]

function ActionGrid({
  accountId,
  category,
  inspecttionType,
}: {
  accountId: string
  category: 'standard' | 'sma' | 'npa'
  inspecttionType?: string
}) {
  const canCreateInspection = useCanAccess('inspection', 'create')
  const canCreateInterview = useCanAccess('interview', 'create')
  const canCreateStockAudit = useCanAccess('stock_audit_action', 'create')
  const canCreateLegal = useCanAccess('legal', 'create')
  const canCreateStatutoryAudit = useCanAccess('statutory_auditors', 'create')
  const canCreateNotice = useCanAccess('notice', 'create')
  const canCreateValuer = useCanAccess('valuer', 'create')
  const canGenerateReport = useCanAccess('generate_report', 'view')

  const permissions = useMemo<Record<string, boolean>>(
    () => ({
      inspection: canCreateInspection,
      interview: canCreateInterview,
      'stock-audit': canCreateStockAudit,
      statutoryAuditors: canCreateStatutoryAudit,
      legal: canCreateLegal,
      notice: canCreateNotice,
      valuer: canCreateValuer,
    }),
    [
      canCreateInspection,
      canCreateInterview,
      canCreateLegal,
      canCreateNotice,
      canCreateStatutoryAudit,
      canCreateStockAudit,
      canCreateValuer,
    ]
  )

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {actions
        .filter((a) => a.category.includes(category) && permissions[a.path])
        .map(({ icon, label, path }) => (
          <ActionLink
            key={path}
            icon={icon}
            label={label}
            to={
              '/$category/summary/$accountId/action/$path' as '/$category/summary/$accountId/action/notice'
            }
            params={
              {
                category,
                path,
                accountId,
              } as {
                category: 'standard' | 'sma' | 'npa'
                accountId: string
              }
            }
            search={{
              inspecttionType: inspecttionType ?? '',
            }}
          />
        ))}

      {canGenerateReport && (
        <div className="col-span-full mt-6 relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-tr from-muted/60 via-card/90 to-transparent p-6 shadow-sm transition-all duration-300">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
              <FileBadge className="h-3 w-3" />
              Final Document Available
            </div>

            <h3 className="text-lg font-bold tracking-tight">
              Consolidated Account Report
            </h3>

            <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
              Includes inspection notes, interviews, legal actions, notices and follow-ups — compiled in a single structured PDF.
            </p>

            <a
              href={`${BASE_URL}/AlertReport/generate/${accountId}`}
              download
              className="group inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/90 px-6 py-2.5 font-medium text-primary-foreground shadow hover:bg-primary transition-all duration-200"
            >
              <FileBadge className="h-4 w-4 transition-transform group-hover:scale-110" />
              Download Report
            </a>

            <p className="text-[11px] text-muted-foreground">
              Auto-generated · Secured · Timestamped
            </p>
          </div>
        </div>
      )}


    </div>
  )
}

const ActionLink = createLink(
  React.forwardRef<
    HTMLAnchorElement,
    {
      icon: React.ComponentType<{ className?: string }>
      label: string
      className?: string
    }
  >(({ icon: Icon, label, className, ...linkProps }, ref) => (
    <Button
      size='lg'
      variant='outline'
      asChild
      className={`w-full gap-2 ${className ?? ''}`}
    >
      <a {...linkProps} ref={ref}>
        <Icon className='h-4 w-4' />
        {label}
      </a>
    </Button>
  ))
)

function formatCurrency(value: number | undefined | null) {
  if (value == null) return '—'
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  })
}

export default AccountSummaryPage