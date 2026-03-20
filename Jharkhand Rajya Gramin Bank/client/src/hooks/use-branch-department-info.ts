import { $api } from '@/lib/api.ts'

const useBranchDepartmentInfo = (
  accountNumber: string | number,
  enabled: boolean = true
) => {
  const { data, isLoading, error, isError } = $api.useQuery(
    'get',
    '/branches/{accountNumber}/branch-department-info',
    {
      params: {
        path: { accountNumber: String(accountNumber) },
      },
    },
    { enabled }
  )

  return {
    data,
    isLoading,
    isError,
    error,
  }
}

export default useBranchDepartmentInfo
