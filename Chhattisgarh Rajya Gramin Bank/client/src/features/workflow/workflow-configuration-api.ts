import type { paths } from '@/types/api/v1'
import { fetchClient } from '@/lib/api'

export type WorkflowDefinitionConfiguration =
  paths['/api/wf/definitions/{defId}/configuration/export']['get']['responses'][200]['content']['*/*']

type WorkflowDefinitionConfigurationImportRequest =
  paths['/api/wf/definitions/configuration/import']['post']['requestBody']['content']['application/json']

type ImportedWorkflowDefinition =
  paths['/api/wf/definitions/configuration/import']['post']['responses'][200]['content']['*/*']

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
  if (!response.ok) throw new Error(await parseErrorMessage(response))
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function exportWorkflowConfiguration(defId: number) {
  const { response } = await fetchClient.GET(
    '/api/wf/definitions/{defId}/configuration/export',
    {
      params: {
        path: { defId },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDefinitionConfiguration>(response)
}

export async function importWorkflowConfiguration(
  payload: WorkflowDefinitionConfigurationImportRequest
) {
  const { response } = await fetchClient.POST(
    `/api/wf/definitions/configuration/import`,
    {
      params: {
        header: authHeader(),
      },
      body: payload,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<ImportedWorkflowDefinition>(response)
}
