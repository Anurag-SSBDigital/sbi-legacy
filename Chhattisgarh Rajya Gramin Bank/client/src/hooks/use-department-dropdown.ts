import { $api } from '@/lib/api.ts'
import { formatDropdownLabel } from '@/lib/dropdown-label.ts'

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
    data: (
      data?.data as
        | Array<{
            id: string
            name: string
            code?: string
            departmentCode?: string
          }>
        | undefined
    )?.map((item) => ({
      id: item.id,
      name: formatDropdownLabel(item),
    })),
    isLoading,
    isError,
    error,
  }
}

export default useDepartmentOptions
