export const PASSWORD_CHANGE_REQUIRED_STATUS = 'PASSWORD_CHANGE_REQUIRED'

export const hasPasswordChangeRequiredStatus = (status: unknown): boolean => {
  if (typeof status !== 'string' || !status.trim()) {
    return false
  }
  return status
    .split('|')
    .map((part) => part.trim().toUpperCase())
    .includes(PASSWORD_CHANGE_REQUIRED_STATUS)
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  return value as Record<string, unknown>
}

export const isPasswordChangeRequired = (user: unknown): boolean => {
  const data = asRecord(user)
  if (!data) {
    return false
  }
  if (data.forcePasswordChange === true) {
    return true
  }
  return hasPasswordChangeRequiredStatus(data.status)
}
