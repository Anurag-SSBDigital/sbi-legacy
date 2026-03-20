import { createFileRoute } from '@tanstack/react-router'
import { usePageBuilderStore } from '@/stores/pageBuilderStore.ts'
import { $api } from '@/lib/api.ts'
import { CurrencyCell } from '@/components/table/cells.ts'
import { DetailRow } from '@/components/workflow/detail-row.tsx'
import { WorkflowAccountList } from '@/components/workflow/workflow-account-list.tsx'

export const Route = createFileRoute(
  '/_authenticated/admin/workflow/$processCode'
)({
  component: DynamicWorkflowPage,
})

const START_AND_LINK_ENDPOINT = '/api/wf/instances/start-and-link' as const

type EntityLinkPayload = {
  entityType: string
  entityId: string
  accountNo: string
  customerId?: string
  branchId?: string
  departmentId?: string
}

type StartAndLinkPayload = {
  defKey: string
  variables: Record<string, unknown>
  entities: EntityLinkPayload[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord)
}

function extractContent(response: unknown): Record<string, unknown>[] {
  if (!isRecord(response)) {
    return []
  }

  if ('content' in response) {
    return toRecordArray(response.content)
  }

  if ('data' in response) {
    const data = response.data

    if (isRecord(data) && 'content' in data) {
      return toRecordArray(data.content)
    }

    return toRecordArray(data)
  }

  return []
}

function readString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const raw = value[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function DynamicWorkflowPage() {
  const { processCode } = Route.useParams()

  const deployedPages = usePageBuilderStore((state) => state.deployedPages)

  const config = deployedPages.find(
    (page) => page.processCode.toLowerCase() === processCode.toLowerCase()
  )

  const apiPath = config?.apiPath ?? null
  const apiPathWithQuery = apiPath
    ? `${apiPath}?branchId=null&page=0&size=100000`
    : null

  const {
    data: listResponse,
    isLoading,
    isFetching,
    refetch,
  } = $api.useQuery(
    'get',
    (apiPathWithQuery ?? '/dashboard/data') as never,
    undefined,
    { enabled: Boolean(apiPathWithQuery) }
  )

  const startWorkflowMutation = $api.useMutation(
    'post',
    START_AND_LINK_ENDPOINT as never
  )

  if (!config) {
    return (
      <div className='p-10 text-center text-gray-500'>
        Page Configuration Not Found. Please deploy it from the Admin Builder.
      </div>
    )
  }

  const accounts = extractContent(listResponse)

  const workflowDefKeyOverride =
    readString(config, 'workflowDefKey') ?? config.processCode

  const dynamicColumns = config.columns.map((column) => ({
    key: column.key,
    label: column.label,
    render: (value: unknown) => {
      if (column.type === 'currency') {
        return <CurrencyCell value={String(value ?? 0)} />
      }

      return <span>{String(value ?? '-')}</span>
    },
  }))

  const handleRefresh = async (): Promise<void> => {
    await refetch()
  }

  const handleStartWorkflow = async (
    accountNo: string,
    defKey: string
  ): Promise<void> => {
    const payload: StartAndLinkPayload = {
      defKey,
      variables: {
        accountNo,
      },
      entities: [
        {
          entityType: 'ACCOUNT',
          entityId: accountNo,
          accountNo,
        },
      ],
    }

    await startWorkflowMutation.mutateAsync({
      body: payload,
    } as never)

    await refetch()
  }

  const renderDialogDetails = (accountNo: string) => {
    const selectedAccount = accounts.find(
      (account) => String(account[config.identifierKey]) === accountNo
    )

    return (
      <div className='bg-muted/40 grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2'>
        <DetailRow label='Target Account' value={accountNo} />
        {config.dialogFields.map((field) => (
          <DetailRow
            key={field.key}
            label={field.label}
            value={String(selectedAccount?.[field.key] ?? '-')}
          />
        ))}
      </div>
    )
  }

  return (
    <WorkflowAccountList<Record<string, unknown>>
      title={config.title}
      processCode={config.processCode}
      accounts={accounts}
      totalRows={accounts.length}
      pageIndex={0}
      pageSize={Math.max(accounts.length, 1)}
      columns={dynamicColumns}
      isLoading={isLoading}
      processSettingsResponse={null}
      isProcessSettingsLoading={false}
      processSettingsError={null}
      isBranchDropdownVisible={false}
      statsKey={config.statsKey}
      identifierKey={config.identifierKey}
      workflowDefKeyOverride={workflowDefKeyOverride}
      onPaginationChange={() => {}}
      onRefresh={handleRefresh}
      isRefreshing={isFetching && !isLoading}
      onStartWorkflow={handleStartWorkflow}
      isStarting={startWorkflowMutation.isPending}
      canInitiate
      renderDialogDetails={renderDialogDetails}
    />
  )
}
