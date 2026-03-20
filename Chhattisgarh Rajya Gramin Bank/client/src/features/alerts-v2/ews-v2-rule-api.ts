import type { paths } from '@/types/api/v1'
import { fetchClient } from '@/lib/api'

type ApiEnvelope<T> = {
  status?: string
  message?: string
  data?: T
}

export type EwsV2RuleDefinition = {
  id: number
  ruleKey: string
  ruleName: string
  description?: string | null
  category?: string | null
  active: boolean
  publishedVersionNo?: number | null
  alertSeverityKey?: string | null
  dedupeMode?: 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE' | null
  dedupeWindowDays?: number | null
  alertTitleTemplate?: string | null
  alertCategory?: string | null
  autoRunEnabled?: boolean | null
  cronExpression?: string | null
  cronTimezone?: string | null
  lastAutoRunAt?: string | null
  healthStatus?: 'HEALTHY' | 'DEGRADED' | 'BROKEN' | null
  healthMessage?: string | null
  healthCheckedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2RuleVersion = {
  id: number
  ruleDefinitionId: number
  versionNo: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  ruleType: 'SQL' | 'QUESTION' | 'ADAPTER' | 'PLUGIN'
  dsl?: unknown
  executionSql?: string | null
  reasonTemplate?: string | null
  params?: unknown
  adapterKey?: string | null
  adapterVersionNo?: number | null
  questionConfig?: unknown
  pluginKey?: string | null
  pluginConfig?: unknown
  lookbackDays?: number | null
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2ConfigScopeType = 'GLOBAL' | 'RULE'

export type EwsV2ConfigValueType =
  | 'STRING'
  | 'INTEGER'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'JSON'

export type EwsV2ConfigParamDefinition = {
  id: number
  paramKey: string
  label: string
  valueType: EwsV2ConfigValueType
  unit?: string | null
  description?: string | null
  defaultValue?: unknown
  validation?: unknown
  active: boolean
  allowGlobalScope: boolean
  allowRuleScope: boolean
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2ConfigParamValue = {
  id: number
  paramDefinitionId: number
  paramKey: string
  scopeType: EwsV2ConfigScopeType
  scopeRef: string
  value?: unknown
  active: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2RuleVersionConfigOverride = {
  id: number
  ruleVersionId: number
  paramDefinitionId: number
  paramKey: string
  value?: unknown
  active: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2AdapterDefinition = {
  id: number
  adapterKey: string
  adapterName: string
  description?: string | null
  active: boolean
  publishedVersionNo?: number | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2AdapterVersion = {
  id: number
  adapterDefinitionId: number
  versionNo: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  httpMethod: string
  endpointUrl: string
  headers?: Record<string, string> | null
  queryParams?: Record<string, string> | null
  requestBodyTemplate?: string | null
  authType?: string | null
  authConfig?: Record<string, unknown> | null
  responsePath?: string | null
  rowMapping?: Record<string, string> | null
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type EwsV2DslColumn = {
  name: string
  dataType?: string | null
  nullable?: boolean | null
  primaryKey?: boolean | null
  referencedTable?: string | null
  referencedColumn?: string | null
}

export type EwsV2DslTable = {
  name: string
  legacyAliases?: string[]
  columns: EwsV2DslColumn[]
}

export type EwsV2DslFunction = {
  key: string
  label?: string | null
  description?: string | null
  returnType?: string | null
  minArgs?: number | null
  maxArgs?: number | null
}

export type EwsV2DslMetadata = {
  tables: EwsV2DslTable[]
  functions?: EwsV2DslFunction[]
}

export type EwsV2DslSuggestionRequest = {
  table: string
  column: string
  q?: string
  limit?: number
}

export type EwsV2QuestionOption = {
  questionNo: number
  label?: string | null
  questionText?: string | null
}

export type EwsV2QuestionCatalog = {
  stockAudit: EwsV2QuestionOption[]
  msmeInspection: EwsV2QuestionOption[]
}

export type EwsV2QuestionMasterSource = 'STOCK_AUDIT' | 'MSME_INSPECTION'

export type EwsV2QuestionMasterLink = {
  linkType: 'EWS_V2_RULE_VERSION' | string
  referenceId?: string | null
  label?: string | null
  description?: string | null
  active?: boolean | null
}

export type EwsV2QuestionMaster = {
  id: number
  source: EwsV2QuestionMasterSource
  questionNo: number
  questionText: string
  active: boolean
  ewsAlert?: string | null
  linked?: boolean | null
  linkedAlerts?: EwsV2QuestionMasterLink[] | null
}

export type EwsV2QuestionMasterRequest = {
  source: EwsV2QuestionMasterSource
  questionNo?: number
  questionText?: string
  active?: boolean
  ewsAlert?: string
}

export type EwsV2RuleRun = {
  id: number
  ruleDefinitionId: number
  versionNo: number
  runDate: string
  periodStart: string
  periodEnd: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  triggeredBy?: string | null
  startedAt?: string | null
  completedAt?: string | null
  totalRows?: number | null
  createdHits?: number | null
  duplicateHits?: number | null
  errorMessage?: string | null
  resolvedConfig?: Record<string, unknown> | null
  resolvedConfigSources?: Record<string, string> | null
}

export type EwsV2AlertHit = {
  id: number
  runId?: number | null
  ewsAlertId?: number | null
  versionNo?: number | null
  accountNo?: string | null
  customerName?: string | null
  branchCode?: string | null
  severityKey?: string | null
  reason?: string | null
  alertValue?: number | null
  thresholdValue?: number | null
  periodStart?: string | null
  periodEnd?: string | null
  alertDate?: string | null
  active?: boolean | null
  createdAt?: string | null
}

export type EwsV2AlertEvidence = {
  id: number
  hitId?: number | null
  runId?: number | null
  snapshot?: string | null
  evTxnIds?: string | null
  evFirstTs?: string | null
  evLastTs?: string | null
  createdAt?: string | null
}

export type EwsV2RunResult = {
  ruleId?: number | null
  ruleKey?: string | null
  ruleName?: string | null
  versionNo?: number | null
  runId?: number | null
  status?: string | null
  totalRows?: number | null
  createdHits?: number | null
  duplicateHits?: number | null
  skippedRows?: number | null
  errorMessage?: string | null
  dryRun?: boolean | null
  previewRows?: Array<Record<string, unknown>> | null
  resolvedConfig?: Record<string, unknown> | null
  resolvedConfigSources?: Record<string, string> | null
}

export type EwsV2AdapterRunResult = {
  adapterKey?: string | null
  versionNo?: number | null
  totalRows?: number | null
  previewRows?: Array<Record<string, unknown>> | null
}

export type CreateEwsV2RuleRequest = {
  ruleKey: string
  ruleName: string
  description?: string
  category?: string
  alertSeverityKey?: string
  dedupeMode?: 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
  dedupeWindowDays?: number
  alertTitleTemplate?: string
  alertCategory?: string
  autoRunEnabled?: boolean
  cronExpression?: string
  cronTimezone?: string
  createdBy?: string
}

export type UpdateEwsV2RuleRequest = {
  ruleName?: string
  description?: string
  category?: string
  alertSeverityKey?: string
  dedupeMode?: 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
  dedupeWindowDays?: number
  alertTitleTemplate?: string
  alertCategory?: string
  active?: boolean
  autoRunEnabled?: boolean
  cronExpression?: string
  cronTimezone?: string
  updatedBy?: string
}

export type AlertSeverityDefinition = {
  id: number
  severityKey: string
  label: string
  rankOrder: number
  colorHex?: string | null
  workflowSeverityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null
  isSystem: boolean
  isActive: boolean
  description?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type CreateAlertSeverityRequest = {
  severityKey: string
  label: string
  rankOrder?: number
  colorHex?: string
  workflowSeverityLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  isActive?: boolean
  description?: string
  createdBy?: string
}

export type UpdateAlertSeverityRequest = {
  label?: string
  rankOrder?: number
  colorHex?: string
  workflowSeverityLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  isActive?: boolean
  description?: string
  updatedBy?: string
}

export type CreateEwsV2AdapterRequest = {
  adapterKey: string
  adapterName: string
  description?: string
  createdBy?: string
}

export type UpdateEwsV2AdapterRequest = {
  adapterName?: string
  description?: string
  active?: boolean
  updatedBy?: string
}

export type CreateEwsV2AdapterVersionRequest = {
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpointUrl: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  requestBodyTemplate?: string
  authType?: 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY_HEADER' | 'API_KEY_QUERY'
  authConfig?: Record<string, unknown>
  responsePath?: string
  rowMapping?: Record<string, string>
  notes?: string
  createdBy?: string
}

export type RunEwsV2AdapterRequest = {
  versionNo?: number
  params?: Record<string, unknown>
}

export type CreateEwsV2RuleVersionRequest = {
  ruleType?: 'SQL' | 'QUESTION' | 'ADAPTER' | 'PLUGIN'
  dsl?: unknown
  executionSql?: string
  reasonTemplate?: string
  params?: Record<string, unknown>
  adapterKey?: string
  adapterVersionNo?: number
  questionConfig?: Record<string, unknown>
  pluginKey?: string
  pluginConfig?: Record<string, unknown>
  configOverrides?: Record<string, unknown>
  lookbackDays?: number
  notes?: string
  createdBy?: string
  updatedBy?: string
}

export type ValidateEwsV2RuleVersionRequest = CreateEwsV2RuleVersionRequest & {
  runDate?: string
  sampleLimit?: number
}

export type CloneEwsV2RuleVersionRequest = {
  createdBy?: string
}

export type CreateEwsV2ConfigParamRequest = {
  paramKey: string
  label: string
  valueType?: EwsV2ConfigValueType
  unit?: string
  description?: string
  defaultValue?: unknown
  validation?: unknown
  active?: boolean
  allowGlobalScope?: boolean
  allowRuleScope?: boolean
  createdBy?: string
}

export type UpdateEwsV2ConfigParamRequest = {
  label?: string
  valueType?: EwsV2ConfigValueType
  unit?: string
  description?: string
  defaultValue?: unknown
  validation?: unknown
  active?: boolean
  allowGlobalScope?: boolean
  allowRuleScope?: boolean
  updatedBy?: string
}

export type UpsertEwsV2ConfigParamValueRequest = {
  paramKey: string
  scopeType?: EwsV2ConfigScopeType
  scopeRef?: string
  value?: unknown
  active?: boolean
  notes?: string
  updatedBy?: string
}

export type UpsertEwsV2RuleVersionOverridesRequest = {
  overrides?: Record<string, unknown>
  updatedBy?: string
}

export type RunEwsV2RuleRequest = {
  versionNo?: number
  runDate?: string
  dryRun?: boolean
  triggeredBy?: string
  params?: Record<string, unknown>
}

export type RunAllEwsV2RulesRequest = {
  runDate?: string
  dryRun?: boolean
  triggeredBy?: string
  ruleIds?: number[]
}

export type EwsV2RunAllResult = {
  totalRules?: number
  attemptedRules?: number
  succeededRules?: number
  failedRules?: number
  results?: EwsV2RunResult[]
}

export type EwsV2ManualRunAllLog = {
  id: number
  runDate?: string | null
  dryRun?: boolean | null
  triggeredBy?: string | null
  status?: string | null
  totalRules?: number | null
  attemptedRules?: number | null
  succeededRules?: number | null
  failedRules?: number | null
  errorMessage?: string | null
  requestedRuleIds?: number[] | null
  results?: EwsV2RunResult[] | null
  startedAt?: string | null
  completedAt?: string | null
}

export type RevalidateEwsV2RulesRequest = {
  updatedBy?: string
  disableAutoRunOnBroken?: boolean
}

export type EwsV2RuleGuardrailIssue = {
  code?: string | null
  message?: string | null
}

export type EwsV2RuleBrokenReport = {
  ruleId?: number | null
  ruleKey?: string | null
  ruleName?: string | null
  versionNo?: number | null
  active?: boolean | null
  autoRunEnabled?: boolean | null
  healthStatus?: 'HEALTHY' | 'DEGRADED' | 'BROKEN' | null
  healthMessage?: string | null
  errorCount?: number | null
  warningCount?: number | null
  errors?: EwsV2RuleGuardrailIssue[] | null
  warnings?: EwsV2RuleGuardrailIssue[] | null
}

export type EwsV2RevalidateRulesResult = {
  totalPublishedRules?: number | null
  healthyRules?: number | null
  degradedRules?: number | null
  brokenRules?: number | null
  autoRunDisabledRules?: number | null
  checkedAt?: string | null
  brokenRuleReports?: EwsV2RuleBrokenReport[] | null
}

export type EwsV2DslCompileRequest = {
  dsl: unknown
}

export type EwsV2DslCompileResult = {
  sql: string
  generatedParams?: Record<string, unknown>
}

export type EwsV2DslValidateRequest = {
  dsl: unknown
  params?: Record<string, unknown>
  sampleLimit?: number
}

export type EwsV2DslValidateResult = {
  sql: string
  generatedParams?: Record<string, unknown>
  sampleRows?: number
  previewRows?: Array<Record<string, unknown>>
}

type EwsV2ImportExportRequest =
  paths['/api/alerts-v2/io/engine/import']['post']['requestBody']['content']['application/json']

type EwsV2ImportResponseEnvelope =
  paths['/api/alerts-v2/io/engine/import']['post']['responses'][200]['content']['*/*']

export type EwsV2ImportExportBundle = EwsV2ImportExportRequest

export type EwsV2ImportExportScope = NonNullable<
  EwsV2ImportExportBundle['scope']
>

export type EwsV2ImportSeverity = NonNullable<
  EwsV2ImportExportBundle['severities']
>[number]

export type EwsV2ImportQuestion = NonNullable<
  EwsV2ImportExportBundle['questions']
>[number]

export type EwsV2ImportAdapter = NonNullable<
  EwsV2ImportExportBundle['adapters']
>[number]

export type EwsV2ImportAdapterVersion = NonNullable<
  EwsV2ImportAdapter['versions']
>[number]

export type EwsV2ImportRule = NonNullable<
  EwsV2ImportExportBundle['rules']
>[number]

export type EwsV2ImportRuleVersion = NonNullable<
  EwsV2ImportRule['versions']
>[number]

export type EwsV2ImportRuleOverride = NonNullable<
  EwsV2ImportRuleVersion['configOverrides']
>[number]

export type EwsV2ImportConfigSection = NonNullable<
  EwsV2ImportExportBundle['config']
>

export type EwsV2ImportConfigDefinition = NonNullable<
  EwsV2ImportConfigSection['definitions']
>[number]

export type EwsV2ImportConfigValue = NonNullable<
  EwsV2ImportConfigSection['values']
>[number]

export type EwsV2ImportResult = NonNullable<EwsV2ImportResponseEnvelope['data']>

const jsonHeaders = (hasBody = false) => {
  const headers = new Headers()
  if (hasBody) {
    headers.set('Content-Type', 'application/json')
  }
  const token = sessionStorage.getItem('token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

const parseErrorMessage = async (response: Response) => {
  const text = await response.text()
  if (!text) return `Request failed (${response.status})`

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string }
    return parsed.message || parsed.error || text
  } catch {
    return text
  }
}

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

const unwrapData = <T>(payload: ApiEnvelope<T> | T): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data as T
  }
  return payload as T
}

export async function listEwsV2Rules(): Promise<EwsV2RuleDefinition[]> {
  const { response } = await fetchClient.GET(`/api/alerts-v2/rules`, {
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2RuleDefinition[]>>(response)
    ) ?? []
  )
}

export async function listAlertSeverities(
  includeInactive = false
): Promise<AlertSeverityDefinition[]> {
  const { response } = await fetchClient.GET('/api/alerts-v2/severities', {
    params: {
      query: { includeInactive },
    },
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<AlertSeverityDefinition[]>>(response)
    ) ?? []
  )
}

export async function createAlertSeverity(
  body: CreateAlertSeverityRequest
): Promise<AlertSeverityDefinition> {
  const { response } = await fetchClient.POST(`/api/alerts-v2/severities`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<AlertSeverityDefinition>>(response)
  )
}

export async function updateAlertSeverity(
  severityId: number,
  body: UpdateAlertSeverityRequest
): Promise<AlertSeverityDefinition> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/severities/{severityId}',
    {
      params: {
        path: { severityId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<AlertSeverityDefinition>>(response)
  )
}

export async function listEwsV2RulePlugins(): Promise<string[]> {
  const { response } = await fetchClient.GET(`/api/alerts-v2/rules/plugins`, {
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(await parseJsonResponse<ApiEnvelope<string[]>>(response)) ?? []
  )
}

export async function listEwsV2ConfigParams(
  includeInactive = false
): Promise<EwsV2ConfigParamDefinition[]> {
  const { response } = await fetchClient.GET('/api/alerts-v2/config/params', {
    params: {
      query: { includeInactive },
    },
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2ConfigParamDefinition[]>>(
        response
      )
    ) ?? []
  )
}

export async function createEwsV2ConfigParam(
  body: CreateEwsV2ConfigParamRequest
): Promise<EwsV2ConfigParamDefinition> {
  const { response } = await fetchClient.POST(`/api/alerts-v2/config/params`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ConfigParamDefinition>>(response)
  )
}

export async function updateEwsV2ConfigParam(
  paramId: number,
  body: UpdateEwsV2ConfigParamRequest
): Promise<EwsV2ConfigParamDefinition> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/config/params/{paramId}',
    {
      params: {
        path: { paramId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ConfigParamDefinition>>(response)
  )
}

export async function listEwsV2ConfigValues(
  scopeType: EwsV2ConfigScopeType,
  scopeRef?: string,
  includeInactive = false
): Promise<EwsV2ConfigParamValue[]> {
  const { response } = await fetchClient.GET('/api/alerts-v2/config/values', {
    params: {
      query: {
        scopeType,
        scopeRef: scopeRef?.trim() || undefined,
        includeInactive,
      },
    },
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2ConfigParamValue[]>>(response)
    ) ?? []
  )
}

export async function upsertEwsV2ConfigValue(
  body: UpsertEwsV2ConfigParamValueRequest
): Promise<EwsV2ConfigParamValue> {
  const { response } = await fetchClient.PUT(`/api/alerts-v2/config/values`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ConfigParamValue>>(response)
  )
}

export async function listEwsV2RuleVersionOverrides(
  ruleId: number,
  versionNo: number,
  includeInactive = false
): Promise<EwsV2RuleVersionConfigOverride[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/config/rules/{ruleId}/versions/{versionNo}/overrides',
    {
      params: {
        path: { ruleId, versionNo },
        query: { includeInactive },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2RuleVersionConfigOverride[]>>(
        response
      )
    ) ?? []
  )
}

export async function upsertEwsV2RuleVersionOverrides(
  ruleId: number,
  versionNo: number,
  body: UpsertEwsV2RuleVersionOverridesRequest
): Promise<EwsV2RuleVersionConfigOverride[]> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/config/rules/{ruleId}/versions/{versionNo}/overrides',
    {
      params: {
        path: { ruleId, versionNo },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2RuleVersionConfigOverride[]>>(
        response
      )
    ) ?? []
  )
}

export async function listEwsV2Adapters(): Promise<EwsV2AdapterDefinition[]> {
  const { response } = await fetchClient.GET(`/api/alerts-v2/adapters`, {
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2AdapterDefinition[]>>(response)
    ) ?? []
  )
}

export async function listEwsV2AdapterVersions(
  adapterId: number
): Promise<EwsV2AdapterVersion[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/adapters/{adapterId}/versions',
    {
      params: {
        path: { adapterId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2AdapterVersion[]>>(response)
    ) ?? []
  )
}

export async function createEwsV2Adapter(
  body: CreateEwsV2AdapterRequest
): Promise<EwsV2AdapterDefinition> {
  const { response } = await fetchClient.POST(`/api/alerts-v2/adapters`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2AdapterDefinition>>(response)
  )
}

export async function updateEwsV2Adapter(
  adapterId: number,
  body: UpdateEwsV2AdapterRequest
): Promise<EwsV2AdapterDefinition> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/adapters/{adapterId}',
    {
      params: {
        path: { adapterId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2AdapterDefinition>>(response)
  )
}

export async function createEwsV2AdapterVersion(
  adapterId: number,
  body: CreateEwsV2AdapterVersionRequest
): Promise<EwsV2AdapterVersion> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/adapters/{adapterId}/versions',
    {
      params: {
        path: { adapterId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2AdapterVersion>>(response)
  )
}

export async function publishEwsV2AdapterVersion(
  adapterId: number,
  versionNo: number,
  updatedBy?: string
): Promise<EwsV2AdapterVersion> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/adapters/{adapterId}/versions/{versionNo}/publish',
    {
      params: {
        path: { adapterId, versionNo },
      },
      headers: jsonHeaders(true),
      body: { updatedBy },
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2AdapterVersion>>(response)
  )
}

export async function runEwsV2Adapter(
  adapterKey: string,
  body: RunEwsV2AdapterRequest
): Promise<EwsV2AdapterRunResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/adapters/key/{adapterKey}/run',
    {
      params: {
        path: { adapterKey },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2AdapterRunResult>>(response)
  )
}

export async function getEwsV2Rule(
  ruleId: number
): Promise<EwsV2RuleDefinition> {
  const { response } = await fetchClient.GET('/api/alerts-v2/rules/{ruleId}', {
    params: {
      path: { ruleId },
    },
    headers: jsonHeaders(),
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleDefinition>>(response)
  )
}

export async function createEwsV2Rule(
  body: CreateEwsV2RuleRequest
): Promise<EwsV2RuleDefinition> {
  const { response } = await fetchClient.POST(`/api/alerts-v2/rules`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleDefinition>>(response)
  )
}

export async function updateEwsV2Rule(
  ruleId: number,
  body: UpdateEwsV2RuleRequest
): Promise<EwsV2RuleDefinition> {
  const { response } = await fetchClient.PUT('/api/alerts-v2/rules/{ruleId}', {
    params: {
      path: { ruleId },
    },
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleDefinition>>(response)
  )
}

export async function listEwsV2RuleVersions(
  ruleId: number
): Promise<EwsV2RuleVersion[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/{ruleId}/versions',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2RuleVersion[]>>(response)
    ) ?? []
  )
}

export async function createEwsV2RuleVersion(
  ruleId: number,
  body: CreateEwsV2RuleVersionRequest
): Promise<EwsV2RuleVersion> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/rules/{ruleId}/versions',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleVersion>>(response)
  )
}

export async function updateEwsV2RuleVersion(
  ruleId: number,
  versionNo: number,
  body: CreateEwsV2RuleVersionRequest
): Promise<EwsV2RuleVersion> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/rules/{ruleId}/versions/{versionNo}',
    {
      params: {
        path: { ruleId, versionNo },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleVersion>>(response)
  )
}

export async function publishEwsV2RuleVersion(
  ruleId: number,
  versionNo: number,
  updatedBy?: string
): Promise<EwsV2RuleVersion> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/rules/{ruleId}/versions/{versionNo}/publish',
    {
      params: {
        path: { ruleId, versionNo },
      },
      headers: jsonHeaders(true),
      body: { updatedBy },
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleVersion>>(response)
  )
}

export async function cloneEwsV2RuleVersion(
  ruleId: number,
  versionNo: number,
  body: CloneEwsV2RuleVersionRequest = {}
): Promise<EwsV2RuleVersion> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/rules/{ruleId}/versions/{versionNo}/clone',
    {
      params: {
        path: { ruleId, versionNo },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RuleVersion>>(response)
  )
}

export async function runEwsV2Rule(
  ruleId: number,
  body: RunEwsV2RuleRequest
): Promise<EwsV2RunResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/rules/{ruleId}/run',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RunResult>>(response)
  )
}

export async function validateEwsV2RuleVersion(
  ruleId: number,
  body: ValidateEwsV2RuleVersionRequest
): Promise<EwsV2RunResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/rules/{ruleId}/versions/validate',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RunResult>>(response)
  )
}

export async function listEwsV2RuleRuns(
  ruleId: number
): Promise<EwsV2RuleRun[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/{ruleId}/runs',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2RuleRun[]>>(response)
    ) ?? []
  )
}

export async function listEwsV2RunHits(
  ruleId: number,
  runId: number
): Promise<EwsV2AlertHit[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/{ruleId}/runs/{runId}/hits',
    {
      params: {
        path: { ruleId, runId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2AlertHit[]>>(response)
    ) ?? []
  )
}

export async function listEwsV2HitEvidence(
  ruleId: number,
  hitId: number
): Promise<EwsV2AlertEvidence[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/{ruleId}/hits/{hitId}/evidence',
    {
      params: {
        path: { ruleId, hitId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2AlertEvidence[]>>(response)
    ) ?? []
  )
}

export async function runAllEwsV2Rules(
  body: RunAllEwsV2RulesRequest
): Promise<EwsV2RunAllResult> {
  const { response } = await fetchClient.POST(`/api/alerts-v2/rules/run-all`, {
    headers: jsonHeaders(true),
    body: body,
    parseAs: 'stream',
  })
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RunAllResult>>(response)
  )
}

export async function listEwsV2RunAllLogs(
  limit = 50
): Promise<EwsV2ManualRunAllLog[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/run-all/logs',
    {
      params: {
        query: { limit },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2ManualRunAllLog[]>>(response)
    ) ?? []
  )
}

export async function revalidateAllEwsV2Rules(
  body: RevalidateEwsV2RulesRequest = {}
): Promise<EwsV2RevalidateRulesResult> {
  const { response } = await fetchClient.POST(
    `/api/alerts-v2/rules/revalidate-all`,
    {
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2RevalidateRulesResult>>(response)
  )
}

export async function compileEwsV2Dsl(
  body: EwsV2DslCompileRequest
): Promise<EwsV2DslCompileResult> {
  const { response } = await fetchClient.POST(
    `/api/alerts-v2/rules/dsl/compile`,
    {
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2DslCompileResult>>(response)
  )
}

export async function validateEwsV2Dsl(
  body: EwsV2DslValidateRequest
): Promise<EwsV2DslValidateResult> {
  const { response } = await fetchClient.POST(
    `/api/alerts-v2/rules/dsl/validate`,
    {
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2DslValidateResult>>(response)
  )
}

export async function getEwsV2DslMetadata(): Promise<EwsV2DslMetadata> {
  const { response } = await fetchClient.GET(
    `/api/alerts-v2/rules/dsl/metadata`,
    {
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2DslMetadata>>(response)
  )
}

export async function getEwsV2DslSuggestions(
  request: EwsV2DslSuggestionRequest
): Promise<string[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/rules/dsl/suggestions',
    {
      params: {
        query: {
          table: request.table,
          column: request.column,
          q: request.q?.trim() || undefined,
          limit: request.limit,
        },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(await parseJsonResponse<ApiEnvelope<string[]>>(response)) ?? []
  )
}

export async function getEwsV2QuestionCatalog(): Promise<EwsV2QuestionCatalog> {
  const { response } = await fetchClient.GET(
    `/api/alerts-v2/rules/questions/catalog`,
    {
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2QuestionCatalog>>(response)
    ) ?? {
      stockAudit: [],
      msmeInspection: [],
    }
  )
}

export async function listEwsV2QuestionMasters(
  source: EwsV2QuestionMasterSource,
  includeInactive = false
): Promise<EwsV2QuestionMaster[]> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/question-masters',
    {
      params: {
        query: { source, includeInactive },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return (
    unwrapData(
      await parseJsonResponse<ApiEnvelope<EwsV2QuestionMaster[]>>(response)
    ) ?? []
  )
}

export async function createEwsV2QuestionMaster(
  body: EwsV2QuestionMasterRequest
): Promise<EwsV2QuestionMaster> {
  const { response } = await fetchClient.POST(
    `/api/alerts-v2/question-masters`,
    {
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2QuestionMaster>>(response)
  )
}

export async function updateEwsV2QuestionMaster(
  source: EwsV2QuestionMasterSource,
  id: number,
  body: EwsV2QuestionMasterRequest
): Promise<EwsV2QuestionMaster> {
  const { response } = await fetchClient.PUT(
    '/api/alerts-v2/question-masters/{source}/{id}',
    {
      params: {
        path: { source, id },
      },
      headers: jsonHeaders(true),
      body: body,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2QuestionMaster>>(response)
  )
}

export async function deleteEwsV2QuestionMaster(
  source: EwsV2QuestionMasterSource,
  id: number
): Promise<void> {
  const { response } = await fetchClient.DELETE(
    '/api/alerts-v2/question-masters/{source}/{id}',
    {
      params: {
        path: { source, id },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  await parseJsonResponse<ApiEnvelope<null>>(response)
}

export async function exportEwsV2EngineBundle(): Promise<EwsV2ImportExportBundle> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/io/engine/export',
    {
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportExportBundle>>(response)
  )
}

export async function importEwsV2EngineBundle(
  bundle: EwsV2ImportExportBundle
): Promise<EwsV2ImportResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/io/engine/import',
    {
      headers: jsonHeaders(true),
      body: bundle,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportResult>>(response)
  )
}

export async function exportEwsV2RuleBundle(
  ruleId: number
): Promise<EwsV2ImportExportBundle> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/io/rules/{ruleId}/export',
    {
      params: {
        path: { ruleId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportExportBundle>>(response)
  )
}

export async function importEwsV2RuleBundle(
  bundle: EwsV2ImportExportBundle
): Promise<EwsV2ImportResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/io/rules/import',
    {
      headers: jsonHeaders(true),
      body: bundle,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportResult>>(response)
  )
}

export async function exportEwsV2AdapterBundle(
  adapterId: number
): Promise<EwsV2ImportExportBundle> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/io/adapters/{adapterId}/export',
    {
      params: {
        path: { adapterId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportExportBundle>>(response)
  )
}

export async function importEwsV2AdapterBundle(
  bundle: EwsV2ImportExportBundle
): Promise<EwsV2ImportResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/io/adapters/import',
    {
      headers: jsonHeaders(true),
      body: bundle,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportResult>>(response)
  )
}

export async function exportEwsV2ConfigBundle(): Promise<EwsV2ImportExportBundle> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/io/config/export',
    {
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportExportBundle>>(response)
  )
}

export async function exportEwsV2ConfigParamBundle(
  paramId: number
): Promise<EwsV2ImportExportBundle> {
  const { response } = await fetchClient.GET(
    '/api/alerts-v2/io/config/params/{paramId}/export',
    {
      params: {
        path: { paramId },
      },
      headers: jsonHeaders(),
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportExportBundle>>(response)
  )
}

export async function importEwsV2ConfigBundle(
  bundle: EwsV2ImportExportBundle
): Promise<EwsV2ImportResult> {
  const { response } = await fetchClient.POST(
    '/api/alerts-v2/io/config/import',
    {
      headers: jsonHeaders(true),
      body: bundle,
      parseAs: 'stream',
    }
  )
  return unwrapData(
    await parseJsonResponse<ApiEnvelope<EwsV2ImportResult>>(response)
  )
}
