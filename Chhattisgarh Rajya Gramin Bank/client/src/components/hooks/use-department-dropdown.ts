import { $api } from '@/lib/api.ts'

type DropdownOption = {
  id?: string
  name?: string
  code?: string
  departmentCode?: string
}

const formatOptionLabel = (option: DropdownOption) => {
  const name = option.name?.trim()
  if (!name) return undefined
  const code = option.code ?? option.departmentCode
  return code ? `${name} (${code})` : name
}

const useDepartmentOptions = (enabled: boolean = true) => {
  const { data, isLoading, error, isError } = $api.useQuery(
    'get',
    '/departments/get/dropdown',
    {
      params: {
        header: { Authorization: '' },
      },
    },
    { enabled }
  )

  return {
    data: (data?.data as DropdownOption[] | undefined)
      ?.map((option) => {
        const id = option.id
        const name = formatOptionLabel(option)
        if (!id || !name) return undefined
        return { id, name }
      })
      .filter((option): option is { id: string; name: string } => !!option),
    isLoading,
    isError,
    error,
  }
}

export default useDepartmentOptions
