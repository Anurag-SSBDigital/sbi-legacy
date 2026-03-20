import type { paths } from '@/types/api/v1'
import { fetchClient } from '@/lib/api'

export type WorkflowDocumentTemplateRecord =
  paths['/api/wf/document-templates/{id}']['get']['responses'][200]['content']['*/*']

export type WorkflowDocumentTemplateKeySummaryRecord =
  paths['/api/wf/document-templates/keys']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowDocumentTemplateUsageRecord =
  paths['/api/wf/document-templates/{id}/usage']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowDocumentTemplateCreateRequest =
  paths['/api/wf/document-templates']['post']['requestBody']['content']['application/json']

export type WorkflowDocumentTemplatePreviewRequest =
  paths['/api/wf/document-templates/preview']['post']['requestBody']['content']['application/json']

export type WorkflowTemplatePreviewFile = {
  blob: Blob
  fileName: string
}

export type WorkflowDocumentBlockPresetRecord =
  paths['/api/wf/document-templates/presets']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowDocumentBlockPresetCreateRequest =
  paths['/api/wf/document-templates/presets']['post']['requestBody']['content']['application/json']

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

const parseDownloadFileName = (response: Response) => {
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, '')
    }
  }
  const plainMatch = disposition.match(/filename=([^;]+)/i)
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/^"|"$/g, '')
  return 'template-preview.pdf'
}

export async function listWorkflowDocumentTemplates(
  templateKey?: string
): Promise<WorkflowDocumentTemplateRecord[]> {
  const { response } = await fetchClient.GET('/api/wf/document-templates', {
    params: {
      query: { templateKey: templateKey?.trim() || undefined },
    },
    parseAs: 'stream',
  })

  return parseJsonResponse<WorkflowDocumentTemplateRecord[]>(response)
}

export async function getWorkflowDocumentTemplateById(
  id: number
): Promise<WorkflowDocumentTemplateRecord> {
  const { response } = await fetchClient.GET(
    '/api/wf/document-templates/{id}',
    {
      params: {
        path: { id },
      },
      parseAs: 'stream',
    }
  )

  return parseJsonResponse<WorkflowDocumentTemplateRecord>(response)
}

export async function getLatestWorkflowDocumentTemplateByKey(
  templateKey: string
): Promise<WorkflowDocumentTemplateRecord> {
  const { response } = await fetchClient.GET(
    '/api/wf/document-templates/key/{templateKey}/latest',
    {
      params: {
        path: { templateKey },
      },
      parseAs: 'stream',
    }
  )

  return parseJsonResponse<WorkflowDocumentTemplateRecord>(response)
}

export async function listWorkflowDocumentTemplateKeys(): Promise<
  WorkflowDocumentTemplateKeySummaryRecord[]
> {
  const { response } = await fetchClient.GET(
    `/api/wf/document-templates/keys`,
    {
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentTemplateKeySummaryRecord[]>(response)
}

export async function getWorkflowDocumentTemplateUsage(
  id: number
): Promise<WorkflowDocumentTemplateUsageRecord[]> {
  const { response } = await fetchClient.GET(
    '/api/wf/document-templates/{id}/usage',
    {
      params: {
        path: { id },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentTemplateUsageRecord[]>(response)
}

export async function setWorkflowDocumentTemplateActive(
  id: number,
  active: boolean
): Promise<WorkflowDocumentTemplateRecord> {
  const { response } = await fetchClient.PATCH(
    '/api/wf/document-templates/{id}/active',
    {
      params: {
        header: authHeader(),
        path: { id },
        query: { active },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentTemplateRecord>(response)
}

export async function deleteWorkflowDocumentTemplateVersion(
  id: number
): Promise<void> {
  const { response } = await fetchClient.DELETE(
    '/api/wf/document-templates/{id}',
    {
      params: {
        path: { id },
      },
      parseAs: 'stream',
    }
  )
  await parseJsonResponse<void>(response)
}

export async function createWorkflowDocumentTemplateVersion(
  body: WorkflowDocumentTemplateCreateRequest
): Promise<WorkflowDocumentTemplateRecord> {
  const { response } = await fetchClient.POST(`/api/wf/document-templates`, {
    params: {
      header: authHeader(),
    },
    body: body,
    parseAs: 'stream',
  })

  return parseJsonResponse<WorkflowDocumentTemplateRecord>(response)
}

export async function downloadWorkflowDocumentTemplatePreview(
  body: WorkflowDocumentTemplatePreviewRequest
): Promise<WorkflowTemplatePreviewFile> {
  const { response } = await fetchClient.POST(
    `/api/wf/document-templates/preview`,
    {
      params: {
        header: authHeader(),
      },
      body: body,
      parseAs: 'stream',
    }
  )

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const blob = await response.blob()
  return {
    blob,
    fileName: parseDownloadFileName(response),
  }
}

export async function listWorkflowDocumentBlockPresets(): Promise<
  WorkflowDocumentBlockPresetRecord[]
> {
  const { response } = await fetchClient.GET(
    `/api/wf/document-templates/presets`,
    {
      params: {
        header: authHeader(),
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentBlockPresetRecord[]>(response)
}

export async function createWorkflowDocumentBlockPreset(
  body: WorkflowDocumentBlockPresetCreateRequest
): Promise<WorkflowDocumentBlockPresetRecord> {
  const { response } = await fetchClient.POST(
    `/api/wf/document-templates/presets`,
    {
      params: {
        header: authHeader(),
      },
      body: body,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentBlockPresetRecord>(response)
}

export async function deleteWorkflowDocumentBlockPreset(
  id: number
): Promise<void> {
  const { response } = await fetchClient.DELETE(
    '/api/wf/document-templates/presets/{id}',
    {
      params: {
        header: authHeader(),
        path: { id },
      },
      parseAs: 'stream',
    }
  )
  await parseJsonResponse<void>(response)
}
