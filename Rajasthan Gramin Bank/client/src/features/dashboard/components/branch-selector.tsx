import * as React from 'react'
import {
  Building2,
  GitBranch,
  Loader2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useBranchOptions from '@/hooks/use-branch-dropdown.ts'
import useDepartmentOptions from '@/hooks/use-department-dropdown.ts'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Option = { id: string; name: string }

interface IBranchDeptSelector {
  value?: string
  setValue: (value: string | undefined) => void
  deptValue?: string
  deptSetValue?: (value: string | undefined) => void
  showAllOption?: boolean
  className?: string
}

const SS_KEYS = {
  branchId: 'branchDeptSelector.branchId',
  deptId: 'branchDeptSelector.deptId',
}

const normalize = (v: string | undefined | null) => {
  if (!v) return undefined
  return v.toLowerCase() === 'all' ? undefined : v
}

// --- Reusable Searchable Component ---
interface SearchableSelectProps {
  value?: string
  onChange: (value: string) => void
  options: Option[]
  isLoading: boolean
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  icon: React.ReactNode
  disabled?: boolean
  showAllOption?: boolean
  allLabel?: string
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  isLoading,
  placeholder,
  searchPlaceholder,
  emptyText,
  icon,
  disabled,
  showAllOption,
  allLabel = 'All',
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false)

  const displayOptions = React.useMemo(() => {
    const list = [...(options || [])]
    if (showAllOption) {
      list.unshift({ id: 'all', name: allLabel })
    }
    return list
  }, [options, showAllOption, allLabel])

  const selectedLabel = React.useMemo(() => {
    if (!value && showAllOption) return allLabel
    return displayOptions.find((opt) => opt.id === value)?.name ?? placeholder
  }, [value, displayOptions, placeholder, showAllOption, allLabel])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'h-9 w-full justify-between px-3 text-sm font-normal shadow-sm transition-all',
            'border-input hover:bg-accent hover:text-accent-foreground',
            !value && !showAllOption && 'text-muted-foreground'
          )}
        >
          <div className='flex items-center gap-2.5 truncate'>
            {isLoading ? (
              <Loader2 className='text-muted-foreground h-4 w-4 shrink-0 animate-spin' />
            ) : (
              <span className='text-muted-foreground/70'>{icon}</span>
            )}
            <span className='truncate'>
              {isLoading ? 'Loading...' : selectedLabel}
            </span>
          </div>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='w-[--radix-popover-trigger-width] p-0'
        align='start'
      >
        <Command>
          {/* Update: Added focus:ring-0 and border-none to remove the 
            primary color outline/border on focus. 
          */}
          <CommandInput
            placeholder={searchPlaceholder}
            className='h-9 border-none focus:border-none focus:ring-0'
          />
          <CommandList>
            <CommandEmpty className='text-muted-foreground py-6 text-center text-sm'>
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {displayOptions.map((option) => {
                const isSelected =
                  value === option.id || (!value && option.id === 'all')
                return (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => {
                      onChange(option.id)
                      setOpen(false)
                    }}
                    className='py-2.5 text-sm'
                  >
                    <Check
                      className={cn(
                        'text-primary mr-2 h-4 w-4 transition-opacity',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className={cn(
                        isSelected && 'text-foreground font-medium'
                      )}
                    >
                      {option.name}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
// --- Main Component ---

export default function BranchDeptSelector({
  value,
  setValue,
  deptValue,
  deptSetValue,
  showAllOption = true,
  className,
}: IBranchDeptSelector) {
  const { data: deptValues, isLoading: deptLoading } = useDepartmentOptions()

  // --- Department Logic ---
  const [deptInternal, setDeptInternal] = React.useState<string | undefined>(
    undefined
  )

  const isDeptControlled = typeof deptValue !== 'undefined'
  const effectiveDeptValue = isDeptControlled ? deptValue : deptInternal

  const setDept = React.useCallback(
    (next: string | undefined) => {
      if (!isDeptControlled) setDeptInternal(next)
      deptSetValue?.(next)
    },
    [deptSetValue, isDeptControlled]
  )

  // --- Branch Logic ---
  const { data: branchValues, isLoading: branchLoading } =
    useBranchOptions(effectiveDeptValue)

  // --- Restore from sessionStorage on mount ---
  React.useEffect(() => {
    const savedDept = normalize(sessionStorage.getItem(SS_KEYS.deptId))
    const savedBranch = normalize(sessionStorage.getItem(SS_KEYS.branchId))

    // set dept first
    if (savedDept) setDept(savedDept)
    else setDept(undefined)

    if (savedBranch) setValue(savedBranch)
    else setValue(undefined)
  }, [])

  // --- Persist dept changes ---
  React.useEffect(() => {
    const v = normalize(effectiveDeptValue)
    if (v) sessionStorage.setItem(SS_KEYS.deptId, v)
    else sessionStorage.removeItem(SS_KEYS.deptId)
  }, [effectiveDeptValue])

  // --- Persist branch changes ---
  React.useEffect(() => {
    const v = normalize(value)
    if (v) sessionStorage.setItem(SS_KEYS.branchId, v)
    else sessionStorage.removeItem(SS_KEYS.branchId)
  }, [value])

  const onDeptChange = (v: string) => {
    const next = normalize(v)
    setDept(next)
    // when dept changes, clear branch
    setValue(undefined)
  }

  const onBranchChange = (v: string) => {
    setValue(normalize(v))
  }

  return (
    <div className={cn('flex w-full items-center gap-3', className)}>
      <div className='min-w-0 flex-1'>
        <SearchableSelect
          value={effectiveDeptValue}
          onChange={onDeptChange}
          options={deptValues || []}
          isLoading={deptLoading}
          placeholder='Select Department'
          searchPlaceholder='Search departments...'
          emptyText='No department found.'
          icon={<Building2 className='h-4 w-4' />}
          showAllOption={showAllOption}
          allLabel='All Departments'
        />
      </div>

      <div className='min-w-0 flex-1'>
        <SearchableSelect
          value={value}
          onChange={onBranchChange}
          options={branchValues || []}
          isLoading={branchLoading}
          disabled={!deptValues} // Disable if depts haven't loaded
          placeholder='Select Branch'
          searchPlaceholder='Search branches...'
          emptyText='No branch found.'
          icon={<GitBranch className='h-4 w-4' />}
          showAllOption={showAllOption}
          allLabel='All Branches'
        />
      </div>
    </div>
  )
}
