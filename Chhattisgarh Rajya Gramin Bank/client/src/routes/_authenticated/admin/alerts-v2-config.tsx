import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { toastError } from '@/lib/utils'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import {
  createEwsV2ConfigParam,
  exportEwsV2ConfigBundle,
  exportEwsV2ConfigParamBundle,
  importEwsV2ConfigBundle,
  listEwsV2ConfigParams,
  listEwsV2ConfigValues,
  listEwsV2Rules,
  upsertEwsV2ConfigValue,
  updateEwsV2ConfigParam,
  type EwsV2ImportExportBundle,
  type EwsV2ImportResult,
} from '@/features/alerts-v2/ews-v2-rule-api'

export const Route = createFileRoute('/_authenticated/admin/alerts-v2-config')({
  component: RouteComponent,
})

const triggerJsonDownload = (fileName: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

const importSummary = (result: EwsV2ImportResult) =>
  [
    `Definitions +${result.createdConfigDefinitions ?? 0}/${result.updatedConfigDefinitions ?? 0}`,
    `Values +${result.createdConfigValues ?? 0}/${result.updatedConfigValues ?? 0}`,
    `Warnings ${result.warnings?.length ?? 0}`,
  ].join(' • ')

function RouteComponent() {
  const navigate = useNavigate()
  const canView = useCanAccess('ews_alert', 'view')
  const canUpdate = useCanAccess('ews_alert', 'update')

  const [paramKeyInput, setParamKeyInput] = useState('')
  const [paramLabelInput, setParamLabelInput] = useState('')
  const [paramTypeInput, setParamTypeInput] = useState<
    'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  >('NUMBER')
  const [paramDefaultInput, setParamDefaultInput] = useState('')
  const [paramAllowGlobalInput, setParamAllowGlobalInput] = useState(true)
  const [paramAllowRuleInput, setParamAllowRuleInput] = useState(true)

  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [selectedParamKey, setSelectedParamKey] = useState('')
  const [globalValueInput, setGlobalValueInput] = useState('')
  const [ruleValueInput, setRuleValueInput] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importJson, setImportJson] = useState('')

  const paramsQuery = useQuery({
    queryKey: ['ews-v2-config-params'],
    queryFn: () => listEwsV2ConfigParams(false),
    enabled: canView,
    staleTime: 60 * 1000,
  })

  const rulesQuery = useQuery({
    queryKey: ['ews-v2-rules'],
    queryFn: listEwsV2Rules,
    enabled: canView,
  })

  const selectedRule = useMemo(
    () =>
      (rulesQuery.data ?? []).find(
        (rule) => String(rule.id) === selectedRuleId
      ) ?? null,
    [rulesQuery.data, selectedRuleId]
  )

  const ruleScopeRef = selectedRule?.ruleKey?.trim().toUpperCase() || ''

  const globalValuesQuery = useQuery({
    queryKey: ['ews-v2-config-values', 'GLOBAL', 'GLOBAL'],
    queryFn: () => listEwsV2ConfigValues('GLOBAL', 'GLOBAL', true),
    enabled: canView,
    staleTime: 60 * 1000,
  })

  const ruleValuesQuery = useQuery({
    queryKey: ['ews-v2-config-values', 'RULE', ruleScopeRef],
    queryFn: () => listEwsV2ConfigValues('RULE', ruleScopeRef, true),
    enabled: canView && !!ruleScopeRef,
    staleTime: 60 * 1000,
  })

  const paramOptions = useMemo(
    () =>
      [...(paramsQuery.data ?? [])].sort((a, b) =>
        a.paramKey.localeCompare(b.paramKey)
      ),
    [paramsQuery.data]
  )

  const selectedParam = useMemo(
    () =>
      paramOptions.find((item) => item.paramKey === selectedParamKey) ?? null,
    [paramOptions, selectedParamKey]
  )

  const selectedGlobalValue = useMemo(
    () =>
      (globalValuesQuery.data ?? []).find(
        (item) => item.paramKey === selectedParamKey
      ) ?? null,
    [globalValuesQuery.data, selectedParamKey]
  )

  const selectedRuleValue = useMemo(
    () =>
      (ruleValuesQuery.data ?? []).find(
        (item) => item.paramKey === selectedParamKey
      ) ?? null,
    [ruleValuesQuery.data, selectedParamKey]
  )

  useEffect(() => {
    if (selectedRuleId || !(rulesQuery.data ?? []).length) return
    setSelectedRuleId(String(rulesQuery.data?.[0]?.id ?? ''))
  }, [rulesQuery.data, selectedRuleId])

  useEffect(() => {
    if (selectedParamKey || !paramOptions.length) return
    setSelectedParamKey(paramOptions[0].paramKey)
  }, [paramOptions, selectedParamKey])

  useEffect(() => {
    if (!selectedParamKey) {
      setGlobalValueInput('')
      return
    }
    setGlobalValueInput(
      selectedGlobalValue?.value !== undefined
        ? pretty(selectedGlobalValue.value)
        : ''
    )
  }, [selectedGlobalValue, selectedParamKey])

  useEffect(() => {
    if (!selectedParamKey) {
      setRuleValueInput('')
      return
    }
    setRuleValueInput(
      selectedRuleValue?.value !== undefined
        ? pretty(selectedRuleValue.value)
        : ''
    )
  }, [selectedRuleValue, selectedParamKey])

  const createParamMutation = useMutation({
    mutationFn: () =>
      createEwsV2ConfigParam({
        paramKey: paramKeyInput.trim().toUpperCase().replace(/\s+/g, '_'),
        label: paramLabelInput.trim(),
        valueType: paramTypeInput,
        defaultValue: paramDefaultInput.trim()
          ? parseJsonLiteral(paramDefaultInput)
          : undefined,
        allowGlobalScope: paramAllowGlobalInput,
        allowRuleScope: paramAllowRuleInput,
      }),
    onSuccess: async () => {
      toast.success('Config parameter created.')
      setParamKeyInput('')
      setParamLabelInput('')
      setParamTypeInput('NUMBER')
      setParamDefaultInput('')
      setParamAllowGlobalInput(true)
      setParamAllowRuleInput(true)
      await paramsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not create config parameter.'),
  })

  const toggleParamMutation = useMutation({
    mutationFn: ({ paramId, active }: { paramId: number; active: boolean }) =>
      updateEwsV2ConfigParam(paramId, { active }),
    onSuccess: async () => {
      await paramsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update parameter state.'),
  })

  const saveValueMutation = useMutation({
    mutationFn: ({
      scopeType,
      valueText,
    }: {
      scopeType: 'GLOBAL' | 'RULE'
      valueText: string
    }) => {
      if (!selectedParamKey.trim()) {
        throw new Error('Select a config parameter first.')
      }
      if (!valueText.trim()) {
        throw new Error('Config value is required.')
      }
      const scopeRef = scopeType === 'GLOBAL' ? 'GLOBAL' : ruleScopeRef
      if (!scopeRef) {
        throw new Error('Select a rule before saving rule-level value.')
      }
      return upsertEwsV2ConfigValue({
        paramKey: selectedParamKey,
        scopeType,
        scopeRef,
        value: parseJsonLiteral(valueText),
      })
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.scopeType === 'GLOBAL'
          ? 'Global value saved.'
          : 'Rule value saved.'
      )
      await Promise.all([
        globalValuesQuery.refetch(),
        ruleValuesQuery.refetch(),
      ])
    },
    onError: (error) => toastError(error, 'Could not save config value.'),
  })

  const exportConfigMutation = useMutation({
    mutationFn: () => exportEwsV2ConfigBundle(),
    onSuccess: (bundle) => {
      triggerJsonDownload(
        `ews-v2-config-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        bundle
      )
      toast.success('Config package exported.')
    },
    onError: (error) => toastError(error, 'Could not export config package.'),
  })

  const exportParamMutation = useMutation({
    mutationFn: () => {
      if (!selectedParam) throw new Error('Select a config parameter first.')
      return exportEwsV2ConfigParamBundle(selectedParam.id)
    },
    onSuccess: (bundle) => {
      const key = selectedParam?.paramKey || 'config-param'
      triggerJsonDownload(
        `ews-v2-config-${key}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        bundle
      )
      toast.success('Config parameter package exported.')
    },
    onError: (error) =>
      toastError(error, 'Could not export config parameter package.'),
  })

  const importConfigMutation = useMutation({
    mutationFn: () =>
      importEwsV2ConfigBundle(
        JSON.parse(importJson) as EwsV2ImportExportBundle
      ),
    onSuccess: async (result) => {
      toast.success(`Config import completed. ${importSummary(result)}`)
      setImportOpen(false)
      setImportJson('')
      await Promise.all([
        paramsQuery.refetch(),
        globalValuesQuery.refetch(),
        ruleValuesQuery.refetch(),
      ])
    },
    onError: (error) => toastError(error, 'Could not import config package.'),
  })

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EWS Config / Thresholds</CardTitle>
          <CardDescription>
            You do not have access to this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-semibold'>EWS Config / Thresholds</h1>
          <p className='text-muted-foreground text-sm'>
            Manage reusable parameters and assign global and rule-level
            threshold values.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={exportConfigMutation.isPending}
            onClick={() => exportConfigMutation.mutate()}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Config
          </Button>
          <Button
            variant='outline'
            disabled={!selectedParam || exportParamMutation.isPending}
            onClick={() => exportParamMutation.mutate()}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Param
          </Button>
          <Button variant='outline' onClick={() => setImportOpen(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Import Config
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/admin/alerts-v2-rules' })}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Rules
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              Promise.all([
                paramsQuery.refetch(),
                globalValuesQuery.refetch(),
                ruleValuesQuery.refetch(),
              ])
            }
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid items-start gap-4 xl:grid-cols-[1.1fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Parameter Library</CardTitle>
            <CardDescription>
              Define strongly-typed config keys reusable across all rules.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-2'>
              <Field label='Param Key'>
                <Input
                  value={paramKeyInput}
                  onChange={(e) =>
                    setParamKeyInput(
                      e.target.value.toUpperCase().replace(/\s+/g, '_')
                    )
                  }
                  placeholder='THRESHOLD_MIN_SCORE'
                />
              </Field>
              <Field label='Label'>
                <Input
                  value={paramLabelInput}
                  onChange={(e) => setParamLabelInput(e.target.value)}
                  placeholder='Minimum Score'
                />
              </Field>
              <Field label='Value Type'>
                <Select
                  value={paramTypeInput}
                  onValueChange={(value) =>
                    setParamTypeInput(
                      value as
                        | 'STRING'
                        | 'INTEGER'
                        | 'NUMBER'
                        | 'BOOLEAN'
                        | 'JSON'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='STRING'>STRING</SelectItem>
                    <SelectItem value='INTEGER'>INTEGER</SelectItem>
                    <SelectItem value='NUMBER'>NUMBER</SelectItem>
                    <SelectItem value='BOOLEAN'>BOOLEAN</SelectItem>
                    <SelectItem value='JSON'>JSON</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label='Default Value (JSON literal)'>
                <Input
                  value={paramDefaultInput}
                  onChange={(e) => setParamDefaultInput(e.target.value)}
                  placeholder='700 or "HIGH" or {"min":700}'
                />
              </Field>
            </div>

            <div className='flex flex-wrap items-center gap-4 rounded-md border p-3'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={paramAllowGlobalInput}
                  onCheckedChange={setParamAllowGlobalInput}
                />
                <Label className='text-sm'>Allow Global Scope</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={paramAllowRuleInput}
                  onCheckedChange={setParamAllowRuleInput}
                />
                <Label className='text-sm'>Allow Rule Scope</Label>
              </div>
              <Button
                className='ml-auto'
                disabled={
                  !canUpdate ||
                  createParamMutation.isPending ||
                  !paramKeyInput.trim() ||
                  !paramLabelInput.trim()
                }
                onClick={() => createParamMutation.mutate()}
              >
                Create Parameter
              </Button>
            </div>

            <div className='space-y-2'>
              {paramOptions.map((param) => (
                <div
                  key={param.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'
                >
                  <div className='min-w-0 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-mono text-sm font-semibold'>
                        {param.paramKey}
                      </p>
                      <Badge variant='outline'>{param.valueType}</Badge>
                      <Badge variant={param.active ? 'default' : 'outline'}>
                        {param.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className='text-sm'>{param.label}</p>
                    <p className='text-muted-foreground text-xs'>
                      Default:{' '}
                      {param.defaultValue === undefined
                        ? '-'
                        : prettyInline(param.defaultValue)}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      variant={
                        selectedParamKey === param.paramKey
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => setSelectedParamKey(param.paramKey)}
                    >
                      Select
                    </Button>
                    <Switch
                      checked={param.active}
                      disabled={!canUpdate || toggleParamMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleParamMutation.mutate({
                          paramId: param.id,
                          active: checked,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
              {!paramOptions.length ? (
                <p className='text-muted-foreground text-sm'>
                  No config parameters found.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope Values</CardTitle>
            <CardDescription>
              Precedence: Version Override &gt; Rule Scope &gt; Global Scope
              &gt; Default.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Field label='Selected Parameter'>
              <Select
                value={selectedParamKey}
                onValueChange={setSelectedParamKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select parameter' />
                </SelectTrigger>
                <SelectContent>
                  {paramOptions.map((param) => (
                    <SelectItem key={param.id} value={param.paramKey}>
                      {param.paramKey} • {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label='Rule'>
              <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select rule for rule scope' />
                </SelectTrigger>
                <SelectContent>
                  {(rulesQuery.data ?? []).map((rule) => (
                    <SelectItem key={rule.id} value={String(rule.id)}>
                      {rule.ruleKey} • {rule.ruleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className='space-y-2 rounded-md border p-3'>
              <p className='text-sm font-semibold'>Global Value</p>
              <Textarea
                value={globalValueInput}
                onChange={(e) => setGlobalValueInput(e.target.value)}
                className='h-24 font-mono text-xs'
                placeholder='JSON literal value'
                disabled={!selectedParam?.allowGlobalScope}
              />
              <Button
                size='sm'
                variant='outline'
                disabled={
                  !canUpdate ||
                  !selectedParam?.allowGlobalScope ||
                  saveValueMutation.isPending
                }
                onClick={() =>
                  saveValueMutation.mutate({
                    scopeType: 'GLOBAL',
                    valueText: globalValueInput,
                  })
                }
              >
                Save Global Value
              </Button>
            </div>

            <div className='space-y-2 rounded-md border p-3'>
              <p className='text-sm font-semibold'>
                Rule Value ({selectedRule?.ruleKey ?? '-'})
              </p>
              <Textarea
                value={ruleValueInput}
                onChange={(e) => setRuleValueInput(e.target.value)}
                className='h-24 font-mono text-xs'
                placeholder='JSON literal value'
                disabled={!selectedParam?.allowRuleScope || !selectedRule}
              />
              <Button
                size='sm'
                variant='outline'
                disabled={
                  !canUpdate ||
                  !selectedParam?.allowRuleScope ||
                  !selectedRule ||
                  saveValueMutation.isPending
                }
                onClick={() =>
                  saveValueMutation.mutate({
                    scopeType: 'RULE',
                    valueText: ruleValueInput,
                  })
                }
              >
                Save Rule Value
              </Button>
            </div>

            <div className='bg-muted/40 rounded-md border p-3 text-xs'>
              <p className='font-semibold'>Selected Snapshot</p>
              <p className='text-muted-foreground mt-1'>
                Param: {selectedParam?.paramKey ?? '-'}
              </p>
              <p className='text-muted-foreground'>
                Global:{' '}
                {selectedGlobalValue?.value === undefined
                  ? '-'
                  : prettyInline(selectedGlobalValue.value)}
              </p>
              <p className='text-muted-foreground'>
                Rule:{' '}
                {selectedRuleValue?.value === undefined
                  ? '-'
                  : prettyInline(selectedRuleValue.value)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Import Config Package</DialogTitle>
            <DialogDescription>
              Import config definitions and scoped values from JSON.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Load JSON File'>
              <Input
                type='file'
                accept='application/json,.json'
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void file
                    .text()
                    .then((text) => setImportJson(text))
                    .catch(() =>
                      toast.error('Could not read selected JSON file.')
                    )
                }}
              />
            </Field>
            <Field label='Import JSON'>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className='h-64 font-mono text-xs'
                placeholder='Paste config export JSON here'
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setImportOpen(false)}
              disabled={importConfigMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={importConfigMutation.isPending || !importJson.trim()}
              onClick={() => importConfigMutation.mutate()}
            >
              Import Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-xs'>{label}</Label>
      {children}
    </div>
  )
}

function parseJsonLiteral(input: string): unknown {
  const value = input.trim()
  if (!value) {
    throw new Error('Value is required.')
  }
  try {
    return JSON.parse(value)
  } catch {
    throw new Error('Invalid JSON literal.')
  }
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value ?? '')
  }
}

function prettyInline(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value ?? '')
  }
}
