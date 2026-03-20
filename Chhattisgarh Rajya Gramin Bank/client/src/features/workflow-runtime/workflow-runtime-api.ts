import type { paths } from '@/types/api/v1'
import { fetchClient } from '@/lib/api'

export type WorkflowDefinitionLite =
  paths['/api/wf/definitions']['get']['responses'][200]['content']['*/*'][number]

export type WorkflowStartRequest =
  paths['/api/wf/instances/start-and-link']['post']['requestBody']['content']['application/json']

export type WorkflowStartEntityLink = NonNullable<
  WorkflowStartRequest['entities']
>[number]

export type WorkflowStartResponse =
  paths['/api/wf/instances/start-and-link']['post']['responses'][200]['content']['*/*']

export type WorkflowBindingLink = NonNullable<
  WorkflowStartResponse['bindings']
>[number]

export type WorkflowTaskPage =
  paths['/api/wf/tasks/my']['get']['responses'][200]['content']['*/*']

export type WorkflowTaskCard = NonNullable<WorkflowTaskPage['content']>[number]

export type WorkflowTaskAccountDetails = NonNullable<
  WorkflowTaskCard['accountDetails']
>

export type WorkflowTaskStatus = Exclude<
  NonNullable<
    paths['/api/wf/tasks/my']['get']['parameters']['query']
  >['status'],
  undefined
>

export type WorkflowTaskUi =
  paths['/api/wf/tasks/{taskId}/ui']['get']['responses'][200]['content']['*/*']

export type WorkflowUiPermission = NonNullable<WorkflowTaskUi['permissions']>

export type WorkflowUiFormSchema = NonNullable<WorkflowTaskUi['formSchema']>

export type WorkflowUiField = NonNullable<
  WorkflowUiFormSchema['fields']
>[number]

export type WorkflowTaskProgressItem = NonNullable<
  WorkflowTaskUi['progress']
>[number]

export type WorkflowTaskHistoryItem = NonNullable<
  WorkflowTaskUi['history']
>[number]

export type WorkflowTaskPreviousStageSnapshot = NonNullable<
  WorkflowTaskUi['previousStages']
>[number]

export type WorkflowInstanceSummary =
  paths['/api/wf/instances/by-business']['get']['responses'][200]['content']['*/*']

type WorkflowStageDetailsMap =
  paths['/api/wf/instances/{instanceId}/stage/{stageDefId}/details-map']['put']['responses'][200]['content']['*/*']

type WorkflowDocumentRecord =
  paths['/api/wf/instances/{instanceId}/documents']['post']['responses'][200]['content']['*/*']

type AddWorkflowDocumentRequest =
  paths['/api/wf/instances/{instanceId}/documents']['post']['requestBody']['content']['application/json']

type UploadWorkflowDocumentBody = NonNullable<
  paths['/api/wf/instances/{instanceId}/documents/upload']['post']['requestBody']
>['content']['multipart/form-data']

type TaskActionPayload =
  paths['/api/wf/tasks/{taskId}/approve']['post']['requestBody']['content']['application/json']

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

export async function listWorkflowDefinitions(activeOnly = true) {
  const { response } = await fetchClient.GET('/api/wf/definitions', {
    params: {
      query: { activeOnly },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowDefinitionLite[]>(response)
}

export async function getWorkflowInstanceByBusiness(key: string) {
  const businessKey = key?.trim()
  if (!businessKey) {
    throw new Error('Business key is required.')
  }
  const { response } = await fetchClient.GET('/api/wf/instances/by-business', {
    params: {
      query: { key: businessKey },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowInstanceSummary>(response)
}

export async function getWorkflowInstanceByBusinessV2(key: string) {
  const businessKey = key?.trim()
  if (!businessKey) {
    throw new Error('Business key is required.')
  }
  const { response } = await fetchClient.GET(
    '/api/wf/instances/by-business/v2',
    {
      params: {
        query: { key: businessKey },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowInstanceSummary>(response)
}

export async function getWorkflowInstanceUi(instanceId: number) {
  const resolvedInstanceId = Number(instanceId)
  if (!Number.isFinite(resolvedInstanceId) || resolvedInstanceId <= 0) {
    throw new Error('Valid workflow instance ID is required.')
  }
  const { response } = await fetchClient.GET(
    '/api/wf/instances/{instanceId}/ui',
    {
      params: {
        header: authHeader(),
        path: { instanceId: resolvedInstanceId },
      },
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowTaskUi>(response)
}

export async function startWorkflowInstance(body: WorkflowStartRequest) {
  const { response } = await fetchClient.POST(
    `/api/wf/instances/start-and-link`,
    {
      params: {
        header: authHeader(),
      },
      body: body,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowStartResponse>(response)
}

export async function listMyWorkflowTasks(args: {
  status?: WorkflowTaskStatus
  page?: number
  size?: number
}) {
  const status = args.status ?? 'PENDING'
  const page = args.page ?? 0
  const size = args.size ?? 50
  const { response } = await fetchClient.GET('/api/wf/tasks/my', {
    params: {
      header: authHeader(),
      query: { status, page, size },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowTaskPage>(response)
}

export async function getWorkflowTaskUi(taskId: number) {
  const { response } = await fetchClient.GET('/api/wf/tasks/{taskId}/ui', {
    params: {
      header: authHeader(),
      path: { taskId },
    },
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowTaskUi>(response)
}

export async function saveWorkflowStageDetails(args: {
  instanceId: number
  stageDefId: number
  values: paths['/api/wf/instances/{instanceId}/stage/{stageDefId}/details-map']['put']['requestBody']['content']['application/json']
}) {
  const { instanceId, stageDefId, values } = args
  const { response } = await fetchClient.PUT(
    '/api/wf/instances/{instanceId}/stage/{stageDefId}/details-map',
    {
      params: {
        header: authHeader(),
        path: { instanceId, stageDefId },
      },
      body: values,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowStageDetailsMap>(response)
}

export async function addWorkflowStageDocument(
  args: {
    instanceId: number
  } & AddWorkflowDocumentRequest
) {
  const { instanceId, ...body } = args
  const { response } = await fetchClient.POST(
    '/api/wf/instances/{instanceId}/documents',
    {
      params: {
        header: authHeader(),
        path: { instanceId },
      },
      body,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentRecord>(response)
}

export async function uploadWorkflowStageDocument(args: {
  instanceId: number
  stageDefId: number
  file: File
  docType?: string
}) {
  const { instanceId, stageDefId, file, docType } = args
  const uploadBody: UploadWorkflowDocumentBody = {
    file: file as unknown as UploadWorkflowDocumentBody['file'],
  }

  const { response } = await fetchClient.POST(
    '/api/wf/instances/{instanceId}/documents/upload',
    {
      params: {
        header: authHeader(),
        path: { instanceId },
        query: { stageDefId, docType: docType?.trim() || undefined },
      },
      body: uploadBody,
      parseAs: 'stream',
    }
  )
  return parseJsonResponse<WorkflowDocumentRecord>(response)
}

export async function runWorkflowTaskAction(args: {
  taskId: number
  action: 'APPROVE' | 'REJECT' | 'SEND_BACK'
  comments?: TaskActionPayload['comments']
  payload?: TaskActionPayload['payload']
}) {
  const { taskId, action, comments, payload } = args

  const body: TaskActionPayload = {}
  if (comments && comments.trim()) body.comments = comments.trim()
  if (payload !== undefined) body.payload = payload

  const endpointPath =
    action === 'REJECT'
      ? '/api/wf/tasks/{taskId}/reject'
      : action === 'SEND_BACK'
        ? '/api/wf/tasks/{taskId}/send-back'
        : '/api/wf/tasks/{taskId}/approve'

  const { response } = await fetchClient.POST(endpointPath, {
    params: {
      header: authHeader(),
      path: { taskId },
    },
    body,
    parseAs: 'stream',
  })
  return parseJsonResponse<WorkflowInstanceSummary>(response)
}

const parseFileNameFromContentDisposition = (value: string | null) => {
  if (!value) return null
  const utf8Match = value.match(/filename\\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }
  const basicMatch = value.match(/filename="?([^";]+)"?/i)
  return basicMatch?.[1]?.trim() || null
}

export async function downloadGeneratedWorkflowDocument(args: {
  taskId: number
  docCode: string
  locale?: string
}) {
  const { taskId, docCode, locale } = args
  const { response } = await fetchClient.GET(
    '/api/wf/tasks/{taskId}/generated-docs/{docCode}',
    {
      params: {
        header: authHeader(),
        path: { taskId, docCode },
        query: { locale: locale?.trim() || undefined },
      },
      parseAs: 'stream',
    }
  )
  if (!response.ok) throw new Error(await parseErrorMessage(response))

  const blob = await response.blob()
  const fileName =
    parseFileNameFromContentDisposition(
      response.headers.get('content-disposition')
    ) || `${docCode}.pdf`

  return { blob, fileName }
}
