import { useMemo } from 'react'
import { $api } from '@/lib/api.ts'
import { CurrencyCell } from '@/components/table/cells.ts'
import { DetailRow } from '@/components/workflow/detail-row.tsx'
import { WorkflowAccountList } from '@/components/workflow/workflow-account-list.tsx'
import { resolveProcessRouteConfigByParam } from '@/features/process-settings/process-setting-utils.ts'

const START_AND_LINK_ENDPOINT = '/api/wf/instances/start-and-link' as const
const DEFAULT_ENTITY_TYPE = 'ACCOUNT'

type WorkflowAccountsPageProps = {
  processCode: string
  processName: string
}

type DynamicColumnConfig = {
  key: string
  label: string
  type?: string
}

type DialogFieldConfig = {
  key: string
  label: string
}

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

function toDynamicColumnConfigs(value: unknown): DynamicColumnConfig[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      key: readString(item, 'key') ?? '',
      label: readString(item, 'label') ?? '',
      type: readString(item, 'type'),
    }))
    .filter((item) => item.key !== '' && item.label !== '')
}

function toDialogFieldConfigs(value: unknown): DialogFieldConfig[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      key: readString(item, 'key') ?? '',
      label: readString(item, 'label') ?? '',
    }))
    .filter((item) => item.key !== '' && item.label !== '')
}

export function WorkflowAccountsPage({
  processCode,
  processName,
}: WorkflowAccountsPageProps) {
  const { data: processSettingsResponse, isLoading: isProcessSettingsLoading } =
    $api.useQuery('get', '/api/process-settings/getAll', {})

  const resolvedProcess = useMemo(
    () =>
      resolveProcessRouteConfigByParam(processSettingsResponse, processCode),
    [processCode, processSettingsResponse]
  )

  const resolvedProcessRecord = resolvedProcess as unknown

  const apiPath = readString(resolvedProcessRecord, 'apiPath') ?? null
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

  const accounts = extractContent(listResponse)

  const columnsConfig = useMemo(
    () =>
      toDynamicColumnConfigs(
        isRecord(resolvedProcessRecord) ? resolvedProcessRecord.columns : []
      ),
    [resolvedProcessRecord]
  )

  const dialogFields = useMemo(
    () =>
      toDialogFieldConfigs(
        isRecord(resolvedProcessRecord)
          ? resolvedProcessRecord.dialogFields
          : []
      ),
    [resolvedProcessRecord]
  )

  const dynamicColumns = useMemo(
    () =>
      columnsConfig.map((column) => ({
        key: column.key,
        label: column.label,
        render: (value: unknown) => {
          if (column.type === 'currency') {
            return <CurrencyCell value={String(value ?? 0)} />
          }

          return <span>{String(value ?? '-')}</span>
        },
      })),
    [columnsConfig]
  )

  const identifierKey =
    (readString(resolvedProcessRecord, 'identifierKey') as keyof Record<
      string,
      unknown
    >) ?? ('accountNo' as keyof Record<string, unknown>)

  const statsKey = readString(resolvedProcessRecord, 'statsKey') as
    | keyof Record<string, unknown>
    | undefined

  const workflowDefKeyOverride =
    readString(resolvedProcessRecord, 'workflowDefKey') ??
    readString(resolvedProcessRecord, 'workflowDefinitionKey') ??
    processCode

  const pageTitle =
    readString(resolvedProcessRecord, 'title') ??
    readString(resolvedProcessRecord, 'processName') ??
    processName

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
          entityType: DEFAULT_ENTITY_TYPE,
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
      (account) => String(account[identifierKey]) === accountNo
    )

    return (
      <div className='bg-muted/40 grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2'>
        <DetailRow label='Target Account' value={accountNo} />
        {dialogFields.map((field) => (
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
      title={pageTitle}
      processCode={processCode}
      accounts={accounts}
      totalRows={accounts.length}
      pageIndex={0}
      pageSize={Math.max(accounts.length, 1)}
      columns={dynamicColumns}
      isLoading={isLoading || isProcessSettingsLoading}
      processSettingsResponse={processSettingsResponse}
      isProcessSettingsLoading={isProcessSettingsLoading}
      processSettingsError={null}
      isBranchDropdownVisible={false}
      statsKey={statsKey}
      identifierKey={identifierKey}
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
