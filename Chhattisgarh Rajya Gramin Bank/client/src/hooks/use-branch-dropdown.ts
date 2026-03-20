import { useMemo } from 'react'
import { $api } from '@/lib/api.ts'
import { formatDropdownLabel } from '@/lib/dropdown-label.ts'

const useBranchOptions = (
  departmentId: string | null = null,
  enabled: boolean = true
) => {
  const filterByDepartmentId = departmentId !== null

  const {
    data: dropDownData,
    isLoading: dropDownDataLoading,
    error: dropDownDataError,
    isError: dropDownDataIsError,
  } = $api.useQuery(
    'get',
    '/branches/get/dropdown',
    {
      params: {
        header: { Authorization: '' },
      },
    },
    { enabled: enabled && !filterByDepartmentId }
  )

  const {
    data: branchData,
    isLoading: branchDataIsLoading,
    error: branchDataError,
    isError: branchDataIsError,
  } = $api.useQuery(
    'get',
    '/branches/hierarchy/{departmentId}',
    {
      params: { path: { departmentId: String(departmentId) } },
    },
    { enabled: enabled && filterByDepartmentId }
  )

  const data = useMemo<{ id: string; name: string }[] | undefined>(
    () =>
      filterByDepartmentId
        ? (branchData?.data
            ?.map((x) => ({ id: x.id, name: x.branchName }))
            .filter((x) => x.id !== undefined && x.name !== undefined) as
            | { id: string; name: string }[]
            | undefined)
        : (
            dropDownData?.data as
              | Array<{
                  id: string
                  name: string
                  code?: string
                  branchCode?: string
                }>
              | undefined
          )?.map((item) => ({
            id: item.id,
            name: formatDropdownLabel(item),
          })),
    [branchData?.data, dropDownData?.data]
  )

  return {
    data: data,
    isLoading: branchDataIsLoading || dropDownDataLoading,
    isError: dropDownDataIsError || branchDataIsError,
    error: dropDownDataError ?? branchDataError,
  }
}

export default useBranchOptions
