import { $api } from '@/lib/api.ts'

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
    data: data?.data as { id: string; name: string }[] | undefined,
    isLoading,
    isError,
    error,
  }
}

export default useDepartmentOptions
