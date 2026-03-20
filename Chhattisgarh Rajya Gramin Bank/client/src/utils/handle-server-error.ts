import { toast } from 'sonner'

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  return value as Record<string, unknown>
}

const getHttpStatus = (error: unknown): number | null => {
  const top = asRecord(error)
  if (typeof top?.status === 'number') {
    return top.status
  }

  const response = asRecord(top?.response)
  if (typeof response?.status === 'number') {
    return response.status
  }

  return null
}

const getErrorMessage = (error: unknown): string | null => {
  const top = asRecord(error)
  const response = asRecord(top?.response)
  const responseData = asRecord(response?.data)

  if (typeof responseData?.title === 'string' && responseData.title.trim()) {
    return responseData.title
  }
  if (
    typeof responseData?.message === 'string' &&
    responseData.message.trim()
  ) {
    return responseData.message
  }
  if (typeof top?.message === 'string' && top.message.trim()) {
    return top.message
  }

  return null
}

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (getHttpStatus(error) === 204) {
    errMsg = 'Content not found.'
  }

  const resolvedMessage = getErrorMessage(error)
  if (resolvedMessage) {
    errMsg = resolvedMessage
  }

  toast.error(errMsg)
}
