import { useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { components, paths } from '@/types/api/v1.js'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { toastError } from '@/lib/utils.ts'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Button } from '@/components/ui/button.tsx'
import PaginatedTable from '@/components/paginated-table.tsx'
import {
  EditActionCell,
  SemiBoldCell,
  YesNoCell,
} from '@/components/table/cells.ts'
import {
  ProcessSettingsFormDialog,
  type ProcessSettingFormValues,
  type WorkflowDefinitionOption,
} from '@/features/process-settings/ProcessSettingsFormDialog'
import {
  DEFAULT_PROCESS_SIDEBAR_SECTION,
  isProcessEligibleForGenericPages,
} from '@/features/process-settings/process-setting-utils'

export const Route = createLazyFileRoute(
  '/_authenticated/admin/process-settings'
)({
  component: RouteComponent,
})

const FIXED_PROCESS_CODES = [
  // 'STANDARD',
  // 'SMA',
  // 'NPA',
  // 'RECALLED_ASSETS',
  // 'PL_REVIEW',
  // 'AUCA',
  // 'OTS',
  // 'SARFAESI',
  // 'ESR',
] as const

type FixedProcessCode = (typeof FIXED_PROCESS_CODES)[number]

const DEFAULT_PROCESS_NAMES: Record<FixedProcessCode, string> = {
  STANDARD: 'Standard',
  SMA: 'SMA',
  NPA: 'NPA',
  RECALLED_ASSETS: 'Recalled Assets',
  PL_REVIEW: 'PL Review',
  AUCA: 'AUCA',
  OTS: 'OTS',
  SARFAESI: 'SARFAESI',
  ESR: 'ESR',
}

type ProcessSetting = {
  id?: string
  processCode?: string
  processName?: string
  minOutstanding?: number
  maxOutstanding?: number
  minSanctionLimit?: number
  maxSanctionLimit?: number
  accountTypeCodes?: string
  accountTypeCodeList?: string[]
  minIrac?: number
  maxIrac?: number
  wfDefKey?: string
  active?: boolean
  showInSidebar?: boolean
  sidebarSection?: string
  useCustomQuery?: boolean
  customQuery?: string
  customCountQuery?: string
}

type WorkflowDefinitionData =
  paths['/api/wf/definitions']['get']['responses']['200']['content']['*/*']

type WorkflowDefinition = NonNullable<WorkflowDefinitionData>[number]

type ProcessSettingRow = {
  id?: string
  processCode: string
  processName: string
  minOutstanding?: number
  maxOutstanding?: number
  minSanctionLimit?: number
  maxSanctionLimit?: number
  accountTypeCodes?: string
  minIrac?: number
  maxIrac?: number
  wfDefKey?: string
  active: boolean
  isConfigured: boolean
  isFixed: boolean
  sidebarEnabled: boolean
  sidebarSection: string
  useCustomQuery: boolean
  customQuery?: string
  customCountQuery?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isProcessSettingLike(v: unknown): v is {
  id?: unknown
  processCode?: unknown
  processName?: unknown
  minOutstanding?: unknown
  maxOutstanding?: unknown
  minSanctionLimit?: unknown
  maxSanctionLimit?: unknown
  accountTypeCodes?: unknown
  accountTypeCodeList?: unknown
  minIrac?: unknown
  maxIrac?: unknown
  wfDefKey?: unknown
  active?: unknown
  showInSidebar?: unknown
  sidebarSection?: unknown
  useCustomQuery?: unknown
  customQuery?: unknown
  customCountQuery?: unknown
} {
  return isRecord(v)
}

function isFixedProcessCode(value: string): value is FixedProcessCode {
  return (FIXED_PROCESS_CODES as readonly string[]).includes(value)
}

function extractArray(data: unknown): unknown[] {
  if (isRecord(data)) {
    const maybeData = data.data
    if (Array.isArray(maybeData)) return maybeData
    if (isRecord(maybeData) && Array.isArray(maybeData.content)) {
      return maybeData.content
    }
  }
  if (Array.isArray(data)) return data
  return []
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined
  return value
}

function toOptionalInteger(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined
  if (!Number.isInteger(value)) return undefined
  return value
}

function normalizeAccountTypeCodes(item: {
  accountTypeCodes?: unknown
  accountTypeCodeList?: unknown
}): string | undefined {
  if (typeof item.accountTypeCodes === 'string') {
    const normalized = item.accountTypeCodes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',')
    return normalized || undefined
  }

  if (Array.isArray(item.accountTypeCodeList)) {
    const normalized = item.accountTypeCodeList
      .filter((code): code is string => typeof code === 'string')
      .map((code) => code.trim())
      .filter(Boolean)
      .join(',')
    return normalized || undefined
  }

  return undefined
}

function normalizeList(data: unknown): ProcessSetting[] {
  return extractArray(data)
    .filter(isProcessSettingLike)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      processCode:
        typeof item.processCode === 'string'
          ? item.processCode.trim().toUpperCase()
          : undefined,
      processName:
        typeof item.processName === 'string'
          ? item.processName.trim()
          : undefined,
      minOutstanding: toOptionalNumber(item.minOutstanding),
      maxOutstanding: toOptionalNumber(item.maxOutstanding),
      minSanctionLimit: toOptionalNumber(item.minSanctionLimit),
      maxSanctionLimit: toOptionalNumber(item.maxSanctionLimit),
      accountTypeCodes: normalizeAccountTypeCodes(item),
      accountTypeCodeList: Array.isArray(item.accountTypeCodeList)
        ? item.accountTypeCodeList.filter(
            (code): code is string => typeof code === 'string'
          )
        : undefined,
      minIrac: toOptionalInteger(item.minIrac),
      maxIrac: toOptionalInteger(item.maxIrac),
      wfDefKey:
        typeof item.wfDefKey === 'string' ? item.wfDefKey.trim() : undefined,
      active: typeof item.active === 'boolean' ? item.active : false,
      showInSidebar: item.showInSidebar === true,
      sidebarSection:
        typeof item.sidebarSection === 'string'
          ? item.sidebarSection.trim() || DEFAULT_PROCESS_SIDEBAR_SECTION
          : DEFAULT_PROCESS_SIDEBAR_SECTION,
      useCustomQuery: item.useCustomQuery === true,
      customQuery:
        typeof item.customQuery === 'string' ? item.customQuery : undefined,
      customCountQuery:
        typeof item.customCountQuery === 'string'
          ? item.customCountQuery
          : undefined,
    }))
}

function buildRows(data: unknown): ProcessSettingRow[] {
  const normalized = normalizeList(data)
  const byCode = new Map<string, ProcessSetting>()

  normalized.forEach((item) => {
    if (!item.processCode) return
    byCode.set(item.processCode, item)
  })

  const fixedRows: ProcessSettingRow[] = FIXED_PROCESS_CODES.map((code) => {
    const existing = byCode.get(code)

    return {
      id: existing?.id,
      processCode: code,
      processName: existing?.processName || DEFAULT_PROCESS_NAMES[code],
      minOutstanding: existing?.minOutstanding,
      maxOutstanding: existing?.maxOutstanding,
      minSanctionLimit: existing?.minSanctionLimit,
      maxSanctionLimit: existing?.maxSanctionLimit,
      accountTypeCodes: existing?.accountTypeCodes,
      minIrac: existing?.minIrac,
      maxIrac: existing?.maxIrac,
      wfDefKey: existing?.wfDefKey,
      active: existing?.active ?? false,
      isConfigured: !!existing,
      isFixed: true,
      sidebarEnabled: existing?.showInSidebar === true,
      sidebarSection:
        existing?.sidebarSection || DEFAULT_PROCESS_SIDEBAR_SECTION,
      useCustomQuery: existing?.useCustomQuery === true,
      customQuery: existing?.customQuery,
      customCountQuery: existing?.customCountQuery,
    }
  })

  const customRows: ProcessSettingRow[] = normalized
    .filter((item) => item.processCode && !isFixedProcessCode(item.processCode))
    .map((item) => ({
      id: item.id,
      processCode: item.processCode as string,
      processName: item.processName || item.processCode || '',
      minOutstanding: item.minOutstanding,
      maxOutstanding: item.maxOutstanding,
      minSanctionLimit: item.minSanctionLimit,
      maxSanctionLimit: item.maxSanctionLimit,
      accountTypeCodes: item.accountTypeCodes,
      minIrac: item.minIrac,
      maxIrac: item.maxIrac,
      wfDefKey: item.wfDefKey,
      active: item.active ?? false,
      isConfigured: true,
      isFixed: false,
      sidebarEnabled: item.showInSidebar === true,
      sidebarSection: item.sidebarSection || DEFAULT_PROCESS_SIDEBAR_SECTION,
      useCustomQuery: item.useCustomQuery === true,
      customQuery: item.customQuery,
      customCountQuery: item.customCountQuery,
    }))

  return [...fixedRows, ...customRows]
}

const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value?: number) {
  return typeof value === 'number' ? amountFormatter.format(value) : '-'
}

function RouteComponent() {
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingProcessSetting, setEditingProcessSetting] =
    useState<ProcessSettingFormValues | null>(null)

  const canCreate = useCanAccess('process_settings', 'create')
  const canEdit = useCanAccess('process_settings', 'update')

  const createProcessSettingMutation = $api.useMutation(
    'post',
    '/api/process-settings/create',
    {
      onSuccess: () => {
        toast.success('Process setting created successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(
          error,
          'Could not create process setting. Please try again.'
        ),
    }
  )

  const updateProcessSettingMutation = $api.useMutation(
    'put',
    '/api/process-settings/update/{id}',
    {
      onSuccess: () => {
        toast.success('Process setting updated successfully!')
        refetch()
        setFormOpen(false)
      },
      onError: (error) =>
        toastError(
          error,
          'Could not update process setting. Please try again.'
        ),
    }
  )

  const updateSidebarPublishMutation = $api.useMutation(
    'put',
    '/api/process-settings/update/{id}',
    {
      onSuccess: () => {
        toast.success('Sidebar visibility updated successfully!')
        refetch()
      },
      onError: (error) =>
        toastError(
          error,
          'Could not update sidebar visibility. Please try again.'
        ),
    }
  )

  const {
    data: processSettingResp,
    isLoading,
    refetch,
  } = $api.useQuery('get', '/api/process-settings/getAll', {})
  const { data: workflowDefinitionsResp } = $api.useQuery(
    'get',
    '/api/wf/definitions'
  )

  const normalizedSettings = useMemo<ProcessSetting[]>(
    () => normalizeList(processSettingResp),
    [processSettingResp]
  )

  const tableData = useMemo<ProcessSettingRow[]>(
    () => buildRows(processSettingResp),
    [processSettingResp]
  )

  const workflowDefinitionOptions = useMemo<WorkflowDefinitionOption[]>(() => {
    const definitions = (workflowDefinitionsResp ?? []) as WorkflowDefinition[]
    const currentSettingId = editingProcessSetting?.id
    const currentWfDefKey = editingProcessSetting?.wfDefKey
      ?.trim()
      .toUpperCase()

    const linkedByWorkflowKey = new Map<
      string,
      { id?: string; processCode: string }
    >()
    normalizedSettings.forEach((setting) => {
      const key = setting.wfDefKey?.trim()
      if (!key) return
      linkedByWorkflowKey.set(key.toUpperCase(), {
        id: setting.id,
        processCode: setting.processCode ?? '',
      })
    })

    const uniqueDefinitions = new Map<string, WorkflowDefinition>()
    definitions.forEach((definition) => {
      const key = String(definition.key ?? '')
        .trim()
        .toUpperCase()
      if (!key) return

      const existing = uniqueDefinitions.get(key)
      if (!existing) {
        uniqueDefinitions.set(key, definition)
        return
      }

      const currentVersion = Number(definition.version ?? 0)
      const existingVersion = Number(existing.version ?? 0)
      const currentActive = definition.isActive === true
      const existingActive = existing.isActive === true

      if (currentActive && !existingActive) {
        uniqueDefinitions.set(key, definition)
        return
      }

      if (currentVersion > existingVersion) {
        uniqueDefinitions.set(key, definition)
      }
    })

    const options = [...uniqueDefinitions.entries()]
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, definition]) => {
        const linked = linkedByWorkflowKey.get(key)
        const linkedToAnotherProcess =
          linked != null && linked.id !== currentSettingId
        const name = String(definition.name ?? '').trim()
        const baseLabel = name ? `${key} - ${name}` : key
        const label = linkedToAnotherProcess
          ? `${baseLabel} (Linked to ${linked?.processCode || 'another process'})`
          : baseLabel

        return {
          key,
          label,
          disabled: linkedToAnotherProcess,
        }
      })

    if (
      currentWfDefKey &&
      !options.some((option) => option.key === currentWfDefKey)
    ) {
      options.push({
        key: currentWfDefKey,
        label: `${currentWfDefKey} (Currently linked; definition missing)`,
        disabled: false,
      })
      options.sort((a, b) => a.key.localeCompare(b.key))
    }

    return options
  }, [
    editingProcessSetting?.id,
    editingProcessSetting?.wfDefKey,
    normalizedSettings,
    workflowDefinitionsResp,
  ])

  const handleConfigure = (row: ProcessSettingRow) => {
    setEditingProcessSetting({
      id: row.id,
      processCode: row.processCode,
      processName: row.processName,
      minOutstanding: row.minOutstanding,
      maxOutstanding: row.maxOutstanding,
      minSanctionLimit: row.minSanctionLimit,
      maxSanctionLimit: row.maxSanctionLimit,
      accountTypeCodes: row.accountTypeCodes ?? '',
      minIrac: row.minIrac,
      maxIrac: row.maxIrac,
      wfDefKey: row.wfDefKey,
      active: row.active,
      sidebarSection: row.sidebarSection,
      useCustomQuery: row.useCustomQuery,
      customQuery: row.customQuery ?? '',
      customCountQuery: row.customCountQuery ?? '',
    })
    setFormOpen(true)
  }

  const handleFormSubmit = (values: ProcessSettingFormValues) => {
    const processCode = values.processCode.trim().toUpperCase()
    const processName = values.processName.trim()
    const minOutstanding = values.minOutstanding
    const maxOutstanding = values.maxOutstanding
    const minSanctionLimit = values.minSanctionLimit
    const maxSanctionLimit = values.maxSanctionLimit
    const minIrac = values.minIrac
    const maxIrac = values.maxIrac
    const wfDefKey = values.wfDefKey?.trim() || undefined
    const accountTypeCodes = values.accountTypeCodes
      ?.split(',')
      .map((code) => code.trim())
      .filter(Boolean)
      .join(',')
    const useCustomQuery = values.useCustomQuery === true
    const customQuery = values.customQuery?.trim() || undefined
    const customCountQuery = values.customCountQuery?.trim() || undefined

    if (!processName) {
      toast.error('Process Name is required')
      return
    }

    if (
      minOutstanding !== undefined &&
      maxOutstanding !== undefined &&
      minOutstanding > maxOutstanding
    ) {
      toast.error('Min Outstanding cannot be greater than Max Outstanding')
      return
    }

    if (minSanctionLimit !== undefined && Number.isNaN(minSanctionLimit)) {
      toast.error('Min Sanction Limit must be a valid number')
      return
    }

    if (maxSanctionLimit !== undefined && Number.isNaN(maxSanctionLimit)) {
      toast.error('Max Sanction Limit must be a valid number')
      return
    }

    if (
      minSanctionLimit !== undefined &&
      maxSanctionLimit !== undefined &&
      minSanctionLimit > maxSanctionLimit
    ) {
      toast.error(
        'Min Sanction Limit cannot be greater than Max Sanction Limit'
      )
      return
    }

    if (minIrac !== undefined && (!Number.isInteger(minIrac) || minIrac < 0)) {
      toast.error('Min IRAC must be a non-negative integer')
      return
    }

    if (maxIrac !== undefined && (!Number.isInteger(maxIrac) || maxIrac < 0)) {
      toast.error('Max IRAC must be a non-negative integer')
      return
    }

    if (minIrac !== undefined && maxIrac !== undefined && minIrac > maxIrac) {
      toast.error('Min IRAC cannot be greater than Max IRAC')
      return
    }

    if (useCustomQuery) {
      if (!customQuery) {
        toast.error(
          'Custom Query is required when custom query mode is enabled'
        )
        return
      }

      if (!customCountQuery) {
        toast.error(
          'Custom Count Query is required when custom query mode is enabled'
        )
        return
      }
    }

    const duplicate = normalizedSettings.find(
      (item) => item.processCode === processCode && item.id !== values.id
    )
    if (duplicate) {
      toast.error('Process code already exists')
      return
    }

    const linkedWorkflow = normalizedSettings.find(
      (item) =>
        item.wfDefKey?.trim().toUpperCase() === wfDefKey?.toUpperCase() &&
        item.id !== values.id
    )
    if (wfDefKey && linkedWorkflow?.processCode) {
      toast.error(
        `Workflow Definition Key is already linked to process ${linkedWorkflow.processCode}`
      )
      return
    }

    const existingSetting = normalizedSettings.find(
      (item) =>
        (values.id && item.id === values.id) || item.processCode === processCode
    )

    const payload = {
      processCode,
      processName,
      minOutstanding,
      maxOutstanding,
      minSanctionLimit,
      maxSanctionLimit,
      accountTypeCodes: accountTypeCodes || undefined,
      minIrac,
      maxIrac,
      wfDefKey,
      active: values.active,
      showInSidebar: existingSetting?.showInSidebar === true,
      sidebarSection:
        values.sidebarSection?.trim() || DEFAULT_PROCESS_SIDEBAR_SECTION,
      useCustomQuery,
      customQuery,
      customCountQuery,
    } as unknown as components['schemas']['ProcessSettingDto']

    if (values.id) {
      updateProcessSettingMutation.mutate({
        body: payload,
        params: {
          path: { id: values.id },
        },
      })
      return
    }

    createProcessSettingMutation.mutate({
      body: payload,
    })
  }

  const isSubmitting =
    createProcessSettingMutation.isPending ||
    updateProcessSettingMutation.isPending ||
    updateSidebarPublishMutation.isPending

  return (
    <>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}

      <div className='mb-2 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          Process Settings
        </h1>
        {canCreate && (
          <Button
            type='button'
            onClick={() => {
              if (isSubmitting) return
              setEditingProcessSetting(null)
              setFormOpen(true)
            }}
            disabled={isSubmitting}
          >
            Create Process Setting
          </Button>
        )}
      </div>

      <PaginatedTable
        data={tableData}
        renderActions={(row) => {
          const processSetting = row as ProcessSettingRow
          const canConfigure = processSetting.isConfigured ? canEdit : canCreate
          const canPublishSidebar =
            canEdit &&
            processSetting.isConfigured &&
            isProcessEligibleForGenericPages(processSetting.processCode)

          if (!canConfigure && !canPublishSidebar) return null

          return (
            <div className='flex flex-row gap-2'>
              {canConfigure && (
                <EditActionCell
                  onClick={() => {
                    if (isSubmitting) return
                    handleConfigure(processSetting)
                  }}
                />
              )}
              {canPublishSidebar && (
                <Button
                  type='button'
                  variant={
                    processSetting.sidebarEnabled ? 'secondary' : 'outline'
                  }
                  size='sm'
                  disabled={isSubmitting || !processSetting.id}
                  onClick={() => {
                    if (!processSetting.id) return

                    const payload = {
                      processCode: processSetting.processCode,
                      processName: processSetting.processName,
                      minOutstanding: processSetting.minOutstanding,
                      maxOutstanding: processSetting.maxOutstanding,
                      minSanctionLimit: processSetting.minSanctionLimit,
                      maxSanctionLimit: processSetting.maxSanctionLimit,
                      accountTypeCodes: processSetting.accountTypeCodes,
                      minIrac: processSetting.minIrac,
                      maxIrac: processSetting.maxIrac,
                      wfDefKey: processSetting.wfDefKey,
                      active: processSetting.active,
                      showInSidebar: !processSetting.sidebarEnabled,
                      sidebarSection: processSetting.sidebarSection,
                      useCustomQuery: processSetting.useCustomQuery,
                      customQuery: processSetting.customQuery,
                      customCountQuery: processSetting.customCountQuery,
                    } as unknown as components['schemas']['ProcessSettingDto']

                    updateSidebarPublishMutation.mutate({
                      body: payload,
                      params: {
                        path: { id: processSetting.id },
                      },
                    })
                  }}
                >
                  {processSetting.sidebarEnabled ? 'Unpublish' : 'Publish'}
                </Button>
              )}
            </div>
          )
        }}
        columns={[
          {
            key: 'processCode',
            label: 'Process Code',
            render: (value) => <SemiBoldCell value={value || ''} />,
          },
          {
            key: 'processName',
            label: 'Process Name',
          },
          {
            key: 'useCustomQuery',
            label: 'Mode',
            render: (value) => (value ? 'Custom Query' : 'Filter'),
          },
          {
            key: 'minOutstanding',
            label: 'Min Outstanding',
            render: (value) => formatAmount(value),
          },
          {
            key: 'maxOutstanding',
            label: 'Max Outstanding',
            render: (value) => formatAmount(value),
          },
          {
            key: 'active',
            label: 'Active',
            render: (value) => <YesNoCell value={value} />,
          },
          {
            key: 'sidebarSection',
            label: 'Sidebar Section',
          },
          {
            key: 'isConfigured',
            label: 'Configured',
            render: (value) => <YesNoCell value={value} />,
          },
          {
            key: 'sidebarEnabled',
            label: 'In Sidebar',
            render: (value) => <YesNoCell value={value} />,
          },
        ]}
        emptyMessage='No process settings found.'
      />

      <ProcessSettingsFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingProcessSetting}
        workflowDefinitionOptions={workflowDefinitionOptions}
        readOnlyProcessCode={!!editingProcessSetting}
      />
    </>
  )
}
