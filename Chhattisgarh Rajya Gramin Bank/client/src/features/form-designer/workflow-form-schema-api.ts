import type { paths } from '@/types/api/v1'
import { fetchClient } from '@/lib/api'

export type WorkflowFormSchemaRecord =
  paths['/api/wf/form-schemas/{id}']['get']['responses'][200]['content']['*/*']

export type WorkflowFormSchemaFieldRecord = NonNullable<
  WorkflowFormSchemaRecord['fields']
>[number]

export type WorkflowFormSchemaKeySummaryRecord =
  paths['/api/wf/form-schemas/keys']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowFormSchemaUsageRecord =
  paths['/api/wf/form-schemas/{id}/usage']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowFormSchemaCreateRequest =
  paths['/api/wf/form-schemas']['post']['requestBody']['content']['application/json']

export type WorkflowFormSchemaCreateFieldRequest = NonNullable<
  WorkflowFormSchemaCreateRequest['fields']
>[number]

export type WorkflowFormPrefillCatalog =
  paths['/api/wf/form-schemas/prefill-catalog']['get']['responses'][200]['content']['*/*']

export type WorkflowFormPrefillContextPath = NonNullable<
  WorkflowFormPrefillCatalog['contextPaths']
>[number]

export type WorkflowFormPrefillProvider = NonNullable<
  WorkflowFormPrefillCatalog['providers']
>[number]

export type WorkflowFormPrefillProviderParam = NonNullable<
  WorkflowFormPrefillProvider['params']
>[number]

export type WorkflowFormPrefillProviderField = NonNullable<
  WorkflowFormPrefillProvider['outputs']
>[number]

const authHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
})

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

const parseJsonResponse = async <T>(response: Response) => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function listWorkflowFormSchemas(
  schemaKey?: string
): Promise<WorkflowFormSchemaRecord[]> {
  const { response } = await fetchClient.GET('/api/wf/form-schemas', {
    params: {
      query: { schemaKey: schemaKey?.trim() || undefined },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowFormSchemaRecord[]>(response)
}

export async function getWorkflowFormSchemaById(
  id: number
): Promise<WorkflowFormSchemaRecord> {
  const { response } = await fetchClient.GET('/api/wf/form-schemas/{id}', {
    params: {
      path: { id },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowFormSchemaRecord>(response)
}

export async function getLatestWorkflowFormSchemaByKey(
  schemaKey: string
): Promise<WorkflowFormSchemaRecord> {
  const { response } = await fetchClient.GET(
    '/api/wf/form-schemas/key/{schemaKey}/latest',
    {
      params: {
        path: { schemaKey },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowFormSchemaRecord>(response)
}

export async function listWorkflowFormSchemaKeys(): Promise<
  WorkflowFormSchemaKeySummaryRecord[]
> {
  const { response } = await fetchClient.GET(`/api/wf/form-schemas/keys`, {
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowFormSchemaKeySummaryRecord[]>(response)
}

export async function getWorkflowFormPrefillCatalog(): Promise<WorkflowFormPrefillCatalog> {
  const { response } = await fetchClient.GET(
    `/api/wf/form-schemas/prefill-catalog`,
    {
      params: {
        header: authHeader(),
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowFormPrefillCatalog>(response)
}

export async function getWorkflowFormSchemaUsage(
  id: number
): Promise<WorkflowFormSchemaUsageRecord[]> {
  const { response } = await fetchClient.GET(
    '/api/wf/form-schemas/{id}/usage',
    {
      params: {
        path: { id },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowFormSchemaUsageRecord[]>(response)
}

export async function setWorkflowFormSchemaActive(
  id: number,
  active: boolean
): Promise<WorkflowFormSchemaRecord> {
  const { response } = await fetchClient.PATCH(
    '/api/wf/form-schemas/{id}/active',
    {
      params: {
        header: authHeader(),
        path: { id },
        query: { active },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowFormSchemaRecord>(response)
}

export async function deleteWorkflowFormSchemaVersion(
  id: number
): Promise<void> {
  const { response } = await fetchClient.DELETE('/api/wf/form-schemas/{id}', {
    params: {
      path: { id },
    },
    parseAs: 'stream',
  })
  await parseJsonResponse<void>(response)
}

export async function createWorkflowFormSchemaVersion(
  body: WorkflowFormSchemaCreateRequest
): Promise<WorkflowFormSchemaRecord> {
  const { response } = await fetchClient.POST(`/api/wf/form-schemas`, {
    params: {
      header: authHeader(),
    },
    body: body,
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowFormSchemaRecord>(response)
}
