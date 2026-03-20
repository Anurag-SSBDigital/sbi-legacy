type CodeLike = string | number | null | undefined

type DropdownOptionLike = {
  name?: string | null
  code?: CodeLike
  departmentCode?: CodeLike
  branchCode?: CodeLike
}

const normalizeCode = (value: CodeLike): string | undefined => {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  return text.length ? text : undefined
}

export const getDropdownOptionCode = (
  option: DropdownOptionLike
): string | undefined =>
  normalizeCode(option.code) ??
  normalizeCode(option.departmentCode) ??
  normalizeCode(option.branchCode)

export const formatDropdownLabel = (option: DropdownOptionLike): string => {
  const name = (option.name ?? '').trim()
  const code = getDropdownOptionCode(option)

  if (!name) return code ?? ''
  if (!code) return name
  return `${name} (${code})`
}
