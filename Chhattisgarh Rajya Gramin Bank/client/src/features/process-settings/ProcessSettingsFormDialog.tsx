import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export type ProcessSettingFormValues = {
  id?: string
  processCode: string
  processName: string
  minOutstanding?: number
  maxOutstanding?: number
  minSanctionLimit?: number
  maxSanctionLimit?: number
  accountTypeCodes?: string
  minIrac?: number
  maxIrac?: number
  wfDefKey?: string
  active: boolean
  sidebarSection?: string
  useCustomQuery: boolean
  customQuery?: string
  customCountQuery?: string
}

export type WorkflowDefinitionOption = {
  key: string
  label: string
  disabled?: boolean
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (values: ProcessSettingFormValues) => void
  isSubmitting?: boolean
  initialData: ProcessSettingFormValues | null
  workflowDefinitionOptions: WorkflowDefinitionOption[]
  readOnlyProcessCode?: boolean
}

const NONE_WF_DEF_KEY = '__NONE__'

export const ProcessSettingsFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  workflowDefinitionOptions,
  readOnlyProcessCode = false,
}) => {
  const [processCode, setProcessCode] = React.useState('')
  const [processName, setProcessName] = React.useState('')
  const [minOutstanding, setMinOutstanding] = React.useState('')
  const [maxOutstanding, setMaxOutstanding] = React.useState('')
  const [minSanctionLimit, setMinSanctionLimit] = React.useState('')
  const [maxSanctionLimit, setMaxSanctionLimit] = React.useState('')
  const [accountTypeCodes, setAccountTypeCodes] = React.useState('')
  const [minIrac, setMinIrac] = React.useState('')
  const [maxIrac, setMaxIrac] = React.useState('')
  const [wfDefKey, setWfDefKey] = React.useState('')
  const [active, setActive] = React.useState(true)
  const [sidebarSection, setSidebarSection] = React.useState('')
  const [useCustomQuery, setUseCustomQuery] = React.useState(false)
  const [customQuery, setCustomQuery] = React.useState('')
  const [customCountQuery, setCustomCountQuery] = React.useState('')

  const toOptFieldString = React.useCallback((value: number | undefined) => {
    if (value == null) return ''
    return String(value)
  }, [])

  React.useEffect(() => {
    setProcessCode(initialData?.processCode ?? '')
    setProcessName(initialData?.processName ?? '')
    setMinOutstanding(toOptFieldString(initialData?.minOutstanding))
    setMaxOutstanding(toOptFieldString(initialData?.maxOutstanding))
    setMinSanctionLimit(toOptFieldString(initialData?.minSanctionLimit))
    setMaxSanctionLimit(toOptFieldString(initialData?.maxSanctionLimit))
    setAccountTypeCodes(initialData?.accountTypeCodes ?? '')
    setMinIrac(toOptFieldString(initialData?.minIrac))
    setMaxIrac(toOptFieldString(initialData?.maxIrac))
    setWfDefKey(initialData?.wfDefKey ?? '')
    setActive(initialData?.active ?? true)
    setSidebarSection(initialData?.sidebarSection ?? 'CREDIT & RECOVERY')
    setUseCustomQuery(initialData?.useCustomQuery ?? false)
    setCustomQuery(initialData?.customQuery ?? '')
    setCustomCountQuery(initialData?.customCountQuery ?? '')
  }, [initialData, open, toOptFieldString])

  const parseOptionalNumber = React.useCallback((value: string) => {
    if (!value.trim()) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }, [])

  const parseOptionalInteger = React.useCallback((value: string) => {
    if (!value.trim()) return undefined
    const parsed = Number(value)
    if (Number.isNaN(parsed) || !Number.isInteger(parsed)) return undefined
    return parsed
  }, [])

  const canSubmit = React.useMemo(() => {
    if (!processCode.trim() || !processName.trim()) return false

    const minOutstandingValue = parseOptionalNumber(minOutstanding)
    const maxOutstandingValue = parseOptionalNumber(maxOutstanding)
    const hasMinOutstandingInput = !!minOutstanding.trim()
    const hasMaxOutstandingInput = !!maxOutstanding.trim()

    const minSanction = parseOptionalNumber(minSanctionLimit)
    const maxSanction = parseOptionalNumber(maxSanctionLimit)
    const hasMinSanctionInput = !!minSanctionLimit.trim()
    const hasMaxSanctionInput = !!maxSanctionLimit.trim()

    const minIracValue = parseOptionalInteger(minIrac)
    const maxIracValue = parseOptionalInteger(maxIrac)
    const hasMinIracInput = !!minIrac.trim()
    const hasMaxIracInput = !!maxIrac.trim()

    if (hasMinOutstandingInput && minOutstandingValue === undefined)
      return false
    if (hasMaxOutstandingInput && maxOutstandingValue === undefined)
      return false
    if (
      hasMinOutstandingInput &&
      hasMaxOutstandingInput &&
      minOutstandingValue! > maxOutstandingValue!
    ) {
      return false
    }

    if (hasMinSanctionInput && minSanction === undefined) return false
    if (hasMaxSanctionInput && maxSanction === undefined) return false
    if (
      hasMinSanctionInput &&
      hasMaxSanctionInput &&
      minSanction! > maxSanction!
    ) {
      return false
    }

    if (hasMinIracInput && minIracValue === undefined) return false
    if (hasMaxIracInput && maxIracValue === undefined) return false
    if (hasMinIracInput && hasMaxIracInput && minIracValue! > maxIracValue!) {
      return false
    }

    if (useCustomQuery) {
      if (!customQuery.trim()) return false
      if (!customCountQuery.trim()) return false
    }

    return true
  }, [
    processCode,
    processName,
    minOutstanding,
    maxOutstanding,
    minSanctionLimit,
    maxSanctionLimit,
    minIrac,
    maxIrac,
    useCustomQuery,
    customQuery,
    customCountQuery,
    parseOptionalInteger,
    parseOptionalNumber,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    onSubmit({
      id: initialData?.id,
      processCode: processCode.trim(),
      processName: processName.trim(),
      minOutstanding: parseOptionalNumber(minOutstanding),
      maxOutstanding: parseOptionalNumber(maxOutstanding),
      minSanctionLimit: parseOptionalNumber(minSanctionLimit),
      maxSanctionLimit: parseOptionalNumber(maxSanctionLimit),
      accountTypeCodes: accountTypeCodes.trim() || undefined,
      minIrac: parseOptionalInteger(minIrac),
      maxIrac: parseOptionalInteger(maxIrac),
      wfDefKey: wfDefKey.trim() || undefined,
      active,
      sidebarSection: sidebarSection.trim() || undefined,
      useCustomQuery,
      customQuery: customQuery.trim() || undefined,
      customCountQuery: customCountQuery.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData?.id ? 'Edit Process Setting' : 'New Process Setting'}
            </DialogTitle>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='processCode'>Process Code</Label>
              <Input
                id='processCode'
                placeholder='e.g., SARFAESI'
                value={processCode}
                onChange={(e) => setProcessCode(e.target.value)}
                autoFocus
                required
                disabled={readOnlyProcessCode}
                readOnly={readOnlyProcessCode}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='processName'>Process Name</Label>
              <Input
                id='processName'
                placeholder='e.g., SARFAESI Process'
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
              />
            </div>

            <div className='flex items-center justify-between rounded-md border px-3 py-2'>
              <div className='space-y-0.5'>
                <Label htmlFor='useCustomQuery'>Use Custom Query</Label>
                <p className='text-muted-foreground text-xs'>
                  Enable this when this process should fetch data using a custom
                  read-only JPQL query instead of only standard filters.
                </p>
              </div>
              <Switch
                id='useCustomQuery'
                checked={useCustomQuery}
                onCheckedChange={setUseCustomQuery}
                disabled={isSubmitting}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='minOutstanding'>Min Outstanding</Label>
                <Input
                  id='minOutstanding'
                  type='text'
                  inputMode='decimal'
                  placeholder='Leave blank for no limit'
                  value={minOutstanding}
                  onChange={(e) => setMinOutstanding(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='maxOutstanding'>Max Outstanding</Label>
                <Input
                  id='maxOutstanding'
                  type='text'
                  inputMode='decimal'
                  value={maxOutstanding}
                  onChange={(e) => setMaxOutstanding(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='minSanctionLimit'>Min Sanction Limit</Label>
                <Input
                  id='minSanctionLimit'
                  type='number'
                  step='0.01'
                  min='0'
                  placeholder='Optional'
                  value={minSanctionLimit}
                  onChange={(e) => setMinSanctionLimit(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='maxSanctionLimit'>Max Sanction Limit</Label>
                <Input
                  id='maxSanctionLimit'
                  type='number'
                  step='0.01'
                  min='0'
                  placeholder='Optional'
                  value={maxSanctionLimit}
                  onChange={(e) => setMaxSanctionLimit(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='minIrac'>Min IRAC</Label>
                <Input
                  id='minIrac'
                  type='number'
                  step='1'
                  min='0'
                  placeholder='Optional integer'
                  value={minIrac}
                  onChange={(e) => setMinIrac(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='maxIrac'>Max IRAC</Label>
                <Input
                  id='maxIrac'
                  type='number'
                  step='1'
                  min='0'
                  placeholder='Optional integer'
                  value={maxIrac}
                  onChange={(e) => setMaxIrac(e.target.value)}
                />
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='accountTypeCodes'>Account Type Codes (CSV)</Label>
              <Input
                id='accountTypeCodes'
                placeholder='e.g., CC,OD,TL'
                value={accountTypeCodes}
                onChange={(e) => setAccountTypeCodes(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='wfDefKey'>Workflow Definition Key</Label>
              <Select
                value={wfDefKey || NONE_WF_DEF_KEY}
                onValueChange={(value) =>
                  setWfDefKey(value === NONE_WF_DEF_KEY ? '' : value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id='wfDefKey'>
                  <SelectValue placeholder='Select workflow definition' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_WF_DEF_KEY}>-- None --</SelectItem>
                  {workflowDefinitionOptions.length === 0 ? (
                    <SelectItem value='__NO_WORKFLOW_DEFINITION__' disabled>
                      No workflow definitions available
                    </SelectItem>
                  ) : (
                    workflowDefinitionOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        value={option.key}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-xs'>
                Workflow keys already linked to another process are disabled.
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='sidebarSection'>Sidebar Section</Label>
              <Input
                id='sidebarSection'
                placeholder='e.g., CREDIT & RECOVERY'
                value={sidebarSection}
                onChange={(e) => setSidebarSection(e.target.value)}
                disabled={isSubmitting}
              />
              <p className='text-muted-foreground text-xs'>
                When this process is published, it appears under this section.
                Existing sections are reused; new names create new sections.
              </p>
            </div>

            {useCustomQuery && (
              <>
                <div className='grid gap-2'>
                  <Label htmlFor='customQuery'>Custom Query</Label>
                  <textarea
                    id='customQuery'
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder={`SELECT new com.loan.radis.action.DTO.AccountListDto2(
  c.acctNo, c.custName, c.telNo, c.outstand, c.city, c.newIrac
)
FROM Customer2 c
WHERE (:branchCodes IS NULL OR c.branchCode IN :branchCodes)`}
                    rows={8}
                    className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[180px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Must be a read-only JPQL query returning{' '}
                    <code>new AccountListDto2(...)</code>.
                  </p>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='customCountQuery'>Custom Count Query</Label>
                  <textarea
                    id='customCountQuery'
                    value={customCountQuery}
                    onChange={(e) => setCustomCountQuery(e.target.value)}
                    placeholder={`SELECT COUNT(c)
FROM Customer2 c
WHERE (:branchCodes IS NULL OR c.branchCode IN :branchCodes)`}
                    rows={5}
                    className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Used for pagination total count. Keep the same joins and
                    filters as the custom query.
                  </p>
                </div>

                <div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'>
                  Supported parameters can include:
                  <span className='font-medium'>
                    {' '}
                    :branchCodes, :wfKey, :minOutstanding, :maxOutstanding,
                    :minSanction, :maxSanction, :accountTypes, :minIrac,
                    :maxIrac, :processCode
                  </span>
                </div>
              </>
            )}

            <div className='flex items-center justify-between rounded-md border px-3 py-2'>
              <div className='space-y-0.5'>
                <Label htmlFor='processActive'>Active</Label>
                <p className='text-muted-foreground text-xs'>
                  Toggle process availability.
                </p>
              </div>
              <Switch
                id='processActive'
                checked={active}
                onCheckedChange={setActive}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProcessSettingsFormDialog
