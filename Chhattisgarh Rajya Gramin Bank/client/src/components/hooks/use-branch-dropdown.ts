import { useMemo } from 'react'
import { $api } from '@/lib/api.ts'

type DropdownOption = {
  id?: string
  name?: string
  code?: string
  branchCode?: string
}

type HierarchyBranchOption = {
  id?: string
  branchName?: string
  branchCode?: string
}

const formatOptionLabel = (name?: string, code?: string) => {
  const trimmedName = name?.trim()
  if (!trimmedName) return undefined
  return code ? `${trimmedName} (${code})` : trimmedName
}

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
        ? (branchData?.data as HierarchyBranchOption[] | undefined)
            ?.map((option) => {
              const id = option.id
              const name = formatOptionLabel(
                option.branchName,
                option.branchCode
              )
              if (!id || !name) return undefined
              return { id, name }
            })
            .filter(
              (option): option is { id: string; name: string } => !!option
            )
        : (dropDownData?.data as DropdownOption[] | undefined)
            ?.map((option) => {
              const id = option.id
              const name = formatOptionLabel(
                option.name,
                option.code ?? option.branchCode
              )
              if (!id || !name) return undefined
              return { id, name }
            })
            .filter(
              (option): option is { id: string; name: string } => !!option
            ),
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
