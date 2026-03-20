import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson2,
  FilePlus2,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Send,
  Table2,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api, BASE_URL } from '@/lib/api'
import { cn } from '@/lib/utils'
import useBranchOptions from '@/hooks/use-branch-dropdown'
import useDepartmentOptions from '@/hooks/use-department-dropdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MainWrapper from '@/components/ui/main-wrapper'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { DetailRow } from '@/components/workflow/detail-row'
import {
  getWorkflowTaskUi,
  listMyWorkflowTasks,
  listWorkflowDefinitions,
  runWorkflowTaskAction,
  saveWorkflowStageDetails,
  startWorkflowInstance,
  downloadGeneratedWorkflowDocument,
  uploadWorkflowStageDocument,
  type WorkflowTaskStatus,
  type WorkflowTaskUi,
  type WorkflowUiFormSchema,
} from '@/features/workflow-runtime/workflow-runtime-api'

type WorkflowRuntimePageProps = {
  mode?: 'full' | 'task-only'
  initialTaskId?: number | null
}

type OptionItem = {
  label: string
  value: string
}

type PreviousStageSubmission = NonNullable<
  WorkflowTaskUi['previousStages']
>[number]

type RuntimeConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'greaterOrEqual'
  | 'lessThan'
  | 'lessOrEqual'
  | 'isTruthy'
  | 'isFalsy'

type RuntimeCondition = {
  enabled: boolean
  fieldKey: string
  operator: RuntimeConditionOperator
  value: string
}

type RuntimeConditionalValidationRule =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'min'
  | 'max'

type RuntimeConditionalValidation = {
  enabled: boolean
  when: RuntimeCondition
  rule: RuntimeConditionalValidationRule
  ruleValue: string
  message: string
}

type RuntimeValidation = {
  required: boolean
  minLength: string
  maxLength: string
  pattern: string
  min: string
  max: string
  customMessage: string
  conditional: RuntimeConditionalValidation
}

type RuntimeTableColumn = {
  key: string
  label: string
  type: string
  placeholder: string
  defaultValue: unknown
  options: OptionItem[]
  validation: RuntimeValidation
}

type RuntimeField = {
  key: string
  label: string
  type: string
  order: number
  required: boolean
  config: Record<string, unknown>
}

type RuntimeAction = 'APPROVE' | 'REJECT' | 'SEND_BACK'

const TASK_STATUSES: WorkflowTaskStatus[] = [
  'PENDING',
  'COMPLETED',
  'REJECTED',
  'SENT_BACK',
  'EXPIRED',
]

const NONE_VALUE = '__none__'

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : []

const asString = (value: unknown, fallback = '') =>
  String(value ?? fallback).trim()

const asBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }
  return false
}

const normalizeStageKind = (value: unknown): 'FORM' | 'APPROVAL' | null => {
  const normalized = asString(value).toUpperCase()
  if (normalized === 'FORM') return 'FORM'
  if (normalized === 'APPROVAL' || normalized === 'APPROVE') return 'APPROVAL'
  return null
}

const resolveTaskStageKind = (taskUi?: WorkflowTaskUi): 'FORM' | 'APPROVAL' => {
  const metadata = toObject(taskUi?.metadata)
  return (
    normalizeStageKind(taskUi?.kind) ??
    normalizeStageKind(taskUi?.stageType) ??
    normalizeStageKind(metadata.kind) ??
    normalizeStageKind(metadata['Stage Type']) ??
    normalizeStageKind(metadata.stageType) ??
    'FORM'
  )
}

const resolveWorkflowDocumentUrl = (url?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = (BASE_URL ?? '').trim().replace(/\/+$/, '')
  if (!base) return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

const extractDocumentRequirements = (taskUi?: WorkflowTaskUi) => {
  const metadata = toObject(taskUi?.metadata)
  const requiredTypes = toArray(metadata.requiredDocs)
    .map((item) => asString(item))
    .filter(Boolean)
  const requiresAny =
    Boolean(taskUi?.requiresDocuments) ||
    asBoolean(metadata.requiresDocuments) ||
    asBoolean(metadata.documentsRequired) ||
    asBoolean(metadata.documentRequired) ||
    requiredTypes.length > 0

  return {
    requiresAny,
    requiredTypes,
  }
}

const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const parseCondition = (value: unknown): RuntimeCondition => {
  const source = toObject(value)
  const operator = asString(source.operator) as RuntimeConditionOperator
  const validOperator: RuntimeConditionOperator[] = [
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'greaterThan',
    'greaterOrEqual',
    'lessThan',
    'lessOrEqual',
    'isTruthy',
    'isFalsy',
  ]
  return {
    enabled: Boolean(source.enabled),
    fieldKey: asString(source.fieldKey),
    operator: validOperator.includes(operator) ? operator : 'equals',
    value: asString(source.value),
  }
}

const parseConditionalValidation = (
  value: unknown
): RuntimeConditionalValidation => {
  const source = toObject(value)
  const rule = asString(source.rule) as RuntimeConditionalValidationRule
  const validRules: RuntimeConditionalValidationRule[] = [
    'required',
    'minLength',
    'maxLength',
    'pattern',
    'min',
    'max',
  ]
  return {
    enabled: Boolean(source.enabled),
    when: parseCondition(source.when),
    rule: validRules.includes(rule) ? rule : 'required',
    ruleValue: asString(source.ruleValue),
    message: asString(source.message),
  }
}

const parseValidation = (value: unknown): RuntimeValidation => {
  const source = toObject(value)
  return {
    required: Boolean(source.required),
    minLength: asString(source.minLength),
    maxLength: asString(source.maxLength),
    pattern: asString(source.pattern),
    min: asString(source.min),
    max: asString(source.max),
    customMessage: asString(source.customMessage),
    conditional: parseConditionalValidation(source.conditional),
  }
}

const parseOptions = (value: unknown): OptionItem[] =>
  toArray(value)
    .map((item) => {
      const source = toObject(item)
      const label = asString(source.label)
      const rawValue = asString(source.value || source.id || label)
      if (!label || !rawValue) return null
      return { label, value: rawValue }
    })
    .filter((item): item is OptionItem => item !== null)

const defaultValueByType = (type: string): unknown => {
  if (type === 'checkbox' || type === 'switch') return false
  if (type === 'multiselect' || type === 'file') return []
  if (type === 'tableInput') return []
  return ''
}

const parseTableColumns = (value: unknown): RuntimeTableColumn[] =>
  toArray(value)
    .map((column, index) => {
      const source = toObject(column)
      const label = asString(source.label, `Column ${index + 1}`)
      const key = asString(source.key, `column_${index + 1}`)
      const type = asString(source.type, 'text')
      return {
        key,
        label,
        type,
        placeholder: asString(source.placeholder),
        defaultValue:
          source.defaultValue !== undefined
            ? source.defaultValue
            : defaultValueByType(type),
        options: parseOptions(source.options),
        validation: parseValidation(source.validation),
      }
    })
    .filter((column) => Boolean(column.key))

const createTableRow = (columns: RuntimeTableColumn[]) => {
  const next: Record<string, unknown> = {}
  columns.forEach((column) => {
    next[column.key] = column.defaultValue
  })
  return next
}

const parseFieldConfig = (field: RuntimeField) => toObject(field.config)

const fieldValidation = (field: RuntimeField) => {
  const config = parseFieldConfig(field)
  const validation = parseValidation(config.validation)
  if (!validation.conditional.enabled) {
    const fallbackConditional = parseConditionalValidation(
      config['x-conditionalValidation']
    )
    if (fallbackConditional.enabled) {
      validation.conditional = fallbackConditional
    }
  }
  if (field.required) validation.required = true
  return validation
}

const fieldVisibility = (field: RuntimeField) => {
  const config = parseFieldConfig(field)
  const visibility = parseCondition(config.visibility)
  if (visibility.enabled) return visibility
  return parseCondition(config['x-visibleWhen'])
}

const fieldTableColumns = (field: RuntimeField) => {
  const config = parseFieldConfig(field)
  const fromConfig = parseTableColumns(config.tableColumns)
  if (fromConfig.length > 0) return fromConfig
  return parseTableColumns(config['x-tableColumns'])
}

const parsePrimitive = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  if (value === 'true') return true
  if (value === 'false') return false
  if (value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return value
}

const compareWithOperator = (
  left: unknown,
  operator: RuntimeConditionOperator,
  rightRaw: string
) => {
  const right = parsePrimitive(rightRaw)
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  switch (operator) {
    case 'equals':
      return left === right
    case 'notEquals':
      return left !== right
    case 'contains':
      if (Array.isArray(left)) return left.includes(right as never)
      return String(left ?? '').includes(String(right ?? ''))
    case 'notContains':
      if (Array.isArray(left)) return !left.includes(right as never)
      return !String(left ?? '').includes(String(right ?? ''))
    case 'greaterThan':
      return !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        ? leftNumber > rightNumber
        : false
    case 'greaterOrEqual':
      return !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        ? leftNumber >= rightNumber
        : false
    case 'lessThan':
      return !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        ? leftNumber < rightNumber
        : false
    case 'lessOrEqual':
      return !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        ? leftNumber <= rightNumber
        : false
    case 'isTruthy':
      return Boolean(left)
    case 'isFalsy':
      return !left
    default:
      return false
  }
}

const evaluateCondition = (
  condition: RuntimeCondition,
  values: Record<string, unknown>
) => {
  if (!condition.enabled || !condition.fieldKey) return true
  return compareWithOperator(
    values[condition.fieldKey],
    condition.operator,
    condition.value
  )
}

const hasEmptyValue = (value: unknown) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object')
    return Object.keys(toObject(value)).length === 0
  return false
}

const validateValueByRule = (
  label: string,
  value: unknown,
  rule: RuntimeConditionalValidationRule,
  ruleValue: string,
  message = ''
) => {
  const fallback = message || `${label} is invalid`
  const text = String(value ?? '')
  const numberValue = Number(value)
  const numberRule = Number(ruleValue)

  if (rule === 'required') {
    return hasEmptyValue(value) ? message || `${label} is required` : undefined
  }

  if (rule === 'minLength' && !Number.isNaN(numberRule)) {
    return text.length < numberRule
      ? message || `${label} must be at least ${numberRule} characters`
      : undefined
  }

  if (rule === 'maxLength' && !Number.isNaN(numberRule)) {
    return text.length > numberRule
      ? message || `${label} must be at most ${numberRule} characters`
      : undefined
  }

  if (rule === 'pattern' && ruleValue.trim()) {
    try {
      const regex = new RegExp(ruleValue)
      return regex.test(text) ? undefined : fallback
    } catch {
      return 'Pattern is invalid'
    }
  }

  if (
    rule === 'min' &&
    !Number.isNaN(numberRule) &&
    !Number.isNaN(numberValue)
  ) {
    return numberValue < numberRule
      ? message || `${label} must be >= ${numberRule}`
      : undefined
  }

  if (
    rule === 'max' &&
    !Number.isNaN(numberRule) &&
    !Number.isNaN(numberValue)
  ) {
    return numberValue > numberRule
      ? message || `${label} must be <= ${numberRule}`
      : undefined
  }

  return undefined
}

const validateFieldValue = (
  field: RuntimeField,
  value: unknown,
  values: Record<string, unknown>
) => {
  const label = field.label || field.key
  const validation = fieldValidation(field)

  if (validation.required) {
    const requiredError = validateValueByRule(label, value, 'required', '')
    if (requiredError) return requiredError
  }

  if (!hasEmptyValue(value)) {
    if (validation.minLength.trim()) {
      const minLengthError = validateValueByRule(
        label,
        value,
        'minLength',
        validation.minLength,
        validation.customMessage
      )
      if (minLengthError) return minLengthError
    }

    if (validation.maxLength.trim()) {
      const maxLengthError = validateValueByRule(
        label,
        value,
        'maxLength',
        validation.maxLength,
        validation.customMessage
      )
      if (maxLengthError) return maxLengthError
    }

    if (validation.pattern.trim()) {
      const patternError = validateValueByRule(
        label,
        value,
        'pattern',
        validation.pattern,
        validation.customMessage || `${label} format is invalid`
      )
      if (patternError) return patternError
    }

    if (validation.min.trim()) {
      const minError = validateValueByRule(
        label,
        value,
        'min',
        validation.min,
        validation.customMessage
      )
      if (minError) return minError
    }

    if (validation.max.trim()) {
      const maxError = validateValueByRule(
        label,
        value,
        'max',
        validation.max,
        validation.customMessage
      )
      if (maxError) return maxError
    }
  }

  if (validation.conditional.enabled) {
    const shouldApply = evaluateCondition(validation.conditional.when, values)
    if (shouldApply) {
      const conditionalError = validateValueByRule(
        label,
        value,
        validation.conditional.rule,
        validation.conditional.ruleValue,
        validation.conditional.message || validation.customMessage
      )
      if (conditionalError) return conditionalError
    }
  }

  return undefined
}

const validateTableValue = (
  field: RuntimeField,
  value: unknown,
  values: Record<string, unknown>
) => {
  const label = field.label || field.key
  const config = parseFieldConfig(field)
  const validation = fieldValidation(field)
  const rows = Array.isArray(value) ? value : []
  const columns = fieldTableColumns(field)

  if (validation.required && rows.length === 0) {
    return `${label} must contain at least one row`
  }

  const minRows = Number(asString(config.tableMinRows))
  if (!Number.isNaN(minRows) && minRows > 0 && rows.length < minRows) {
    return `${label} must contain at least ${minRows} rows`
  }

  const maxRows = Number(asString(config.tableMaxRows))
  if (!Number.isNaN(maxRows) && maxRows > 0 && rows.length > maxRows) {
    return `${label} must contain at most ${maxRows} rows`
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = toObject(rows[rowIndex])
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex]
      const mergedField: RuntimeField = {
        key: `${field.key}.${rowIndex}.${column.key}`,
        label: `${column.label} (row ${rowIndex + 1})`,
        type: column.type,
        order: columnIndex,
        required: column.validation.required,
        config: {
          placeholder: column.placeholder,
          options: column.options,
          validation: column.validation,
        },
      }

      const rowValues = { ...values, ...row }
      const cellError = validateFieldValue(
        mergedField,
        row[column.key],
        rowValues
      )
      if (cellError) return cellError
    }
  }

  return undefined
}

const taskActionLabel = (action: RuntimeAction, kind?: string) => {
  if (action === 'APPROVE' && kind?.toUpperCase() === 'FORM') return 'Submit'
  if (action === 'APPROVE') return 'Approve'
  if (action === 'SEND_BACK') return 'Send Back'
  return 'Reject'
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const progressBadgeVariant = (
  status?: string
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const normalized = asString(status).toUpperCase()
  if (normalized === 'CURRENT') return 'default'
  if (normalized === 'COMPLETED') return 'secondary'
  if (normalized === 'REJECTED' || normalized === 'EXPIRED')
    return 'destructive'
  if (normalized === 'SENT_BACK') return 'outline'
  return 'outline'
}

const tryParseJsonText = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return value
  if (!raw.startsWith('{') && !raw.startsWith('[') && !raw.startsWith('"')) {
    return value
  }
  try {
    return JSON.parse(raw)
  } catch {
    return value
  }
}

const extractRuntimeFieldsFromFormSchema = (
  formSchema?: WorkflowUiFormSchema | null
): RuntimeField[] => {
  if (!formSchema) return []

  const fromFieldRows = (formSchema.fields ?? [])
    .map((field, index) => ({
      key: asString(field.key, `field_${index + 1}`),
      label: asString(field.label, asString(field.key, `Field ${index + 1}`)),
      type: asString(field.type, 'text'),
      order: Number(field.order ?? index + 1),
      required: Boolean(field.required),
      config: toObject(field.config),
    }))
    .filter((field) => Boolean(field.key))

  if (fromFieldRows.length > 0) {
    return fromFieldRows.sort((a, b) => a.order - b.order)
  }

  const schema = toObject(formSchema.schema)
  const xFields = toArray(schema['x-fields'])
  const fromXFields = xFields
    .map((raw, index) => {
      const source = toObject(raw)
      const key = asString(source.key, `field_${index + 1}`)
      const label = asString(source.label, key || `Field ${index + 1}`)
      const validation = parseValidation(source.validation)
      const required = Boolean(source.required) || validation.required
      return {
        key,
        label,
        type: asString(source.type, 'text'),
        order: Number(source.order ?? index + 1),
        required,
        config: source,
      }
    })
    .filter((field) => Boolean(field.key))

  return fromXFields.sort((a, b) => a.order - b.order)
}

const extractRuntimeFields = (taskUi?: WorkflowTaskUi): RuntimeField[] =>
  extractRuntimeFieldsFromFormSchema(taskUi?.formSchema)

const buildInitialValues = (
  fields: RuntimeField[],
  existingValues: Record<string, unknown>
) => {
  const next: Record<string, unknown> = { ...existingValues }

  fields.forEach((field) => {
    if (next[field.key] !== undefined) return
    const config = parseFieldConfig(field)
    if (config.defaultValue !== undefined) {
      next[field.key] = config.defaultValue
      return
    }

    if (field.type === 'tableInput') {
      const columns = fieldTableColumns(field)
      next[field.key] = columns.length > 0 ? [createTableRow(columns)] : []
      return
    }

    next[field.key] = defaultValueByType(field.type)
  })

  return next
}

const fieldUsesSelector = (field: RuntimeField, selectorType: string) => {
  if (field.type === selectorType) return true
  if (field.type !== 'tableInput') return false
  return fieldTableColumns(field).some((column) => column.type === selectorType)
}

export default function WorkflowRuntimePage({
  mode = 'full',
  initialTaskId = null,
}: WorkflowRuntimePageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isFullMode = mode === 'full'

  const [selectedDefinitionKey, setSelectedDefinitionKey] = useState('')
  const [entityType, setEntityType] = useState('ACCOUNT')
  const [entityId, setEntityId] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [startVariablesText, setStartVariablesText] = useState('{}')

  const [taskStatus, setTaskStatus] = useState<WorkflowTaskStatus>('PENDING')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    initialTaskId
  )
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const formValuesRef = useRef<Record<string, unknown>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [lastSavedFormSignature, setLastSavedFormSignature] = useState('{}')
  const [isFormStepCompleted, setIsFormStepCompleted] = useState(false)
  const [comments, setComments] = useState('')
  const [docType, setDocType] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docFileInputKey, setDocFileInputKey] = useState(0)
  const [downloadingGeneratedDocCode, setDownloadingGeneratedDocCode] =
    useState<string | null>(null)
  const [lastActionSummary, setLastActionSummary] = useState<
    | {
        instanceId?: number
        status?: string
        currentStage?: string
      }
    | undefined
  >(undefined)
  const [activePreviousSubmission, setActivePreviousSubmission] =
    useState<PreviousStageSubmission | null>(null)
  const hydratedTaskContextRef = useRef<string | null>(null)

  const definitionsQuery = useQuery({
    queryKey: ['workflow-runtime', 'definitions'],
    queryFn: () => listWorkflowDefinitions(true),
    staleTime: 60 * 1000,
    enabled: isFullMode,
  })

  const tasksQuery = useQuery({
    queryKey: ['workflow-runtime', 'my-tasks', taskStatus],
    queryFn: () =>
      listMyWorkflowTasks({
        status: taskStatus,
        page: 0,
        size: 100,
      }),
    staleTime: 10 * 1000,
    enabled: isFullMode,
  })

  const taskUiQuery = useQuery({
    queryKey: ['workflow-runtime', 'task-ui', selectedTaskId],
    queryFn: () => getWorkflowTaskUi(Number(selectedTaskId)),
    enabled: selectedTaskId !== null,
  })

  const taskAccountDetails = taskUiQuery.data?.accountDetails
  const shouldShowTaskAccountDetails =
    !isFullMode && Boolean(taskAccountDetails?.accountNo)

  const runtimeFields = useMemo(
    () => extractRuntimeFields(taskUiQuery.data),
    [taskUiQuery.data]
  )

  const visibleFields = useMemo(
    () =>
      runtimeFields.filter((field) => {
        const visibility = fieldVisibility(field)
        return evaluateCondition(visibility, formValues)
      }),
    [runtimeFields, formValues]
  )

  const schemaLayoutColumns = useMemo(() => {
    const schema = toObject(taskUiQuery.data?.formSchema?.schema)
    const layout = toObject(schema['x-layout'])
    return Number(layout.columns) === 2 ? 2 : 1
  }, [taskUiQuery.data?.formSchema?.schema])

  const stageKind = useMemo(
    () => resolveTaskStageKind(taskUiQuery.data),
    [taskUiQuery.data]
  )
  const isFormStage = stageKind === 'FORM'
  const isApprovalStage = stageKind === 'APPROVAL'

  const requiredActions = useMemo(() => {
    const actions = taskUiQuery.data?.permissions?.actions ?? []
    const filtered = actions.filter(
      (action): action is RuntimeAction =>
        action === 'APPROVE' || action === 'REJECT' || action === 'SEND_BACK'
    )
    if (isFormStage) return ['APPROVE'] as RuntimeAction[]
    if (filtered.length > 0) return filtered
    return ['APPROVE', 'REJECT', 'SEND_BACK'] as RuntimeAction[]
  }, [taskUiQuery.data?.permissions?.actions, isFormStage])

  const canEdit = Boolean(taskUiQuery.data?.permissions?.canEdit)
  const canSaveDraft = Boolean(taskUiQuery.data?.permissions?.canSaveDraft)

  const stageDocuments = taskUiQuery.data?.documents ?? []
  const documentRequirements = useMemo(
    () => extractDocumentRequirements(taskUiQuery.data),
    [taskUiQuery.data]
  )
  const existingDocTypes = useMemo(
    () =>
      new Set(
        stageDocuments
          .map((doc) => asString(doc.docType).toUpperCase())
          .filter(Boolean)
      ),
    [stageDocuments]
  )
  const missingRequiredDocTypes = useMemo(
    () =>
      documentRequirements.requiredTypes.filter(
        (requiredType) => !existingDocTypes.has(requiredType.toUpperCase())
      ),
    [documentRequirements.requiredTypes, existingDocTypes]
  )
  const hasRequiredDocuments = useMemo(() => {
    if (!documentRequirements.requiresAny) return true
    if (documentRequirements.requiredTypes.length > 0) {
      return missingRequiredDocTypes.length === 0
    }
    return stageDocuments.length > 0
  }, [
    documentRequirements.requiresAny,
    documentRequirements.requiredTypes.length,
    missingRequiredDocTypes.length,
    stageDocuments.length,
  ])
  const documentRequirementMessage = useMemo(() => {
    if (missingRequiredDocTypes.length > 0) {
      return `Upload required document types: ${missingRequiredDocTypes.join(
        ', '
      )}`
    }
    return 'At least one document upload is required before submission.'
  }, [missingRequiredDocTypes])
  const requiresDocumentsForFormStage =
    isFormStage && documentRequirements.requiresAny

  const currentFormSignature = useMemo(
    () => safeJsonStringify(formValues),
    [formValues]
  )
  const hasUnsavedFormChanges = isFormStage
    ? currentFormSignature !== lastSavedFormSignature
    : false

  const workflowProgress = taskUiQuery.data?.progress ?? []
  const previousStageSnapshots = useMemo(
    () =>
      [...(taskUiQuery.data?.previousStages ?? [])].sort((a, b) => {
        const left = Number(a.stageOrder ?? Number.MAX_SAFE_INTEGER)
        const right = Number(b.stageOrder ?? Number.MAX_SAFE_INTEGER)
        return left - right
      }),
    [taskUiQuery.data?.previousStages]
  )
  const workflowHistory = useMemo(
    () =>
      [...(taskUiQuery.data?.history ?? [])].sort((a, b) => {
        const left = a.at ? new Date(a.at).getTime() : 0
        const right = b.at ? new Date(b.at).getTime() : 0
        return right - left
      }),
    [taskUiQuery.data?.history]
  )
  const previousStageRuntimeFields = useMemo(
    () =>
      previousStageSnapshots.flatMap((snapshot) =>
        extractRuntimeFieldsFromFormSchema(snapshot.formSchema)
      ),
    [previousStageSnapshots]
  )
  const selectorLookupFields = useMemo(
    () => [...runtimeFields, ...previousStageRuntimeFields],
    [runtimeFields, previousStageRuntimeFields]
  )

  const needsBranchSelector = useMemo(
    () =>
      selectorLookupFields.some((field) =>
        fieldUsesSelector(field, 'branchSelector')
      ),
    [selectorLookupFields]
  )

  const needsDepartmentSelector = useMemo(
    () =>
      selectorLookupFields.some((field) =>
        fieldUsesSelector(field, 'departmentSelector')
      ),
    [selectorLookupFields]
  )

  const needsRoleSelector = useMemo(
    () =>
      selectorLookupFields.some((field) =>
        fieldUsesSelector(field, 'roleDropdown')
      ),
    [selectorLookupFields]
  )

  const needsUserSelector = useMemo(
    () =>
      selectorLookupFields.some((field) =>
        fieldUsesSelector(field, 'userSelector')
      ),
    [selectorLookupFields]
  )

  const { data: branchOptions = [] } = useBranchOptions(
    null,
    needsBranchSelector
  )
  const { data: departmentOptions = [] } = useDepartmentOptions(
    needsDepartmentSelector
  )

  const { data: roleResponse } = $api.useQuery(
    'get',
    '/roles/getAllRoles',
    {
      params: { header: { Authorization: '' } },
    },
    { enabled: needsRoleSelector }
  ) as {
    data?: { data?: Array<{ id: string; roleName: string }> }
  }

  const { data: usersResponse } = $api.useQuery(
    'get',
    '/user/get/AllUsers',
    {
      params: {
        header: {
          Authorization: '',
        },
      },
    },
    { enabled: needsUserSelector }
  ) as {
    data?: {
      data?: Array<{ id?: string; username?: string; fullName?: string }>
    }
  }

  const roleOptions = useMemo(
    () =>
      (roleResponse?.data ?? []).map((role) => ({
        label: role.roleName,
        value: role.id,
      })),
    [roleResponse?.data]
  )

  const userOptions = useMemo(
    () =>
      (usersResponse?.data ?? [])
        .map((user) => {
          const value = asString(user.username || user.id)
          if (!value) return null
          return {
            value,
            label: asString(user.fullName || user.username || user.id),
          }
        })
        .filter((item): item is OptionItem => item !== null),
    [usersResponse?.data]
  )

  const startMutation = useMutation({
    mutationFn: startWorkflowInstance,
    onSuccess: (res) => {
      toast.success(
        `Started instance ${res.instanceId} at stage "${res.currentStage}".`
      )
      queryClient.invalidateQueries({
        queryKey: ['workflow-runtime', 'my-tasks'],
      })
    },
  })

  const saveDetailsMutation = useMutation({
    mutationFn: saveWorkflowStageDetails,
  })

  const actionMutation = useMutation({
    mutationFn: runWorkflowTaskAction,
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadWorkflowStageDocument,
    onSuccess: () => {
      toast.success('Document uploaded and linked.')
      setDocType('')
      setDocFile(null)
      setDocFileInputKey((prev) => prev + 1)
    },
  })

  useEffect(() => {
    if (!selectedDefinitionKey && definitionsQuery.data?.length) {
      setSelectedDefinitionKey(definitionsQuery.data[0]?.key ?? '')
    }
  }, [definitionsQuery.data, selectedDefinitionKey])

  useEffect(() => {
    if (initialTaskId === null || initialTaskId === undefined) return
    if (selectedTaskId === initialTaskId) return
    setSelectedTaskId(initialTaskId)
  }, [initialTaskId, selectedTaskId])

  useEffect(() => {
    if (!isFullMode) return
    if (selectedTaskId !== null) return
    const firstTask = tasksQuery.data?.content?.[0]
    if (firstTask?.taskId) setSelectedTaskId(firstTask.taskId)
  }, [isFullMode, selectedTaskId, tasksQuery.data?.content])

  useEffect(() => {
    if (!taskUiQuery.data) return
    const hydrationContext = [
      taskUiQuery.data.taskId,
      taskUiQuery.data.stageDefId,
      taskUiQuery.data.formSchema?.id ?? 'none',
      taskUiQuery.data.formSchema?.version ?? 'none',
    ].join(':')
    const isNewTaskContext = hydratedTaskContextRef.current !== hydrationContext
    hydratedTaskContextRef.current = hydrationContext

    const currentSignature = safeJsonStringify(formValuesRef.current)
    const initialValues = buildInitialValues(
      runtimeFields,
      taskUiQuery.data.initialValues ?? taskUiQuery.data.values ?? {}
    )
    const initialSignature = safeJsonStringify(initialValues)
    formValuesRef.current = initialValues
    setFormValues(initialValues)
    setLastSavedFormSignature(initialSignature)
    setIsFormStepCompleted((prev) => {
      if (isNewTaskContext) return false
      if (!prev) return false
      return currentSignature === initialSignature
    })
    setFormErrors({})
    if (isNewTaskContext) {
      setComments('')
      setActivePreviousSubmission(null)
    }
  }, [taskUiQuery.data, runtimeFields])

  useEffect(() => {
    formValuesRef.current = formValues
  }, [formValues])

  const updateFieldValue = useCallback((key: string, value: unknown) => {
    setIsFormStepCompleted(false)
    setFormValues((prev) => {
      const next = { ...prev, [key]: value }
      formValuesRef.current = next
      return next
    })
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const updateTableCell = useCallback(
    (
      field: RuntimeField,
      rowIndex: number,
      columnKey: string,
      value: unknown
    ) => {
      const currentValue = formValuesRef.current[field.key]
      const current = Array.isArray(currentValue)
        ? [...(currentValue as Array<Record<string, unknown>>)]
        : []
      const row = toObject(current[rowIndex])
      current[rowIndex] = { ...row, [columnKey]: value }
      updateFieldValue(field.key, current)
    },
    [updateFieldValue]
  )

  const addTableRow = useCallback(
    (field: RuntimeField) => {
      const columns = fieldTableColumns(field)
      const currentValue = formValuesRef.current[field.key]
      const current = Array.isArray(currentValue)
        ? [...(currentValue as Array<Record<string, unknown>>)]
        : []
      current.push(createTableRow(columns))
      updateFieldValue(field.key, current)
    },
    [updateFieldValue]
  )

  const removeTableRow = useCallback(
    (field: RuntimeField, rowIndex: number) => {
      const currentValue = formValuesRef.current[field.key]
      const current = Array.isArray(currentValue)
        ? [...(currentValue as Array<Record<string, unknown>>)]
        : []
      current.splice(rowIndex, 1)
      updateFieldValue(field.key, current)
    },
    [updateFieldValue]
  )

  const validateCurrentForm = useCallback(
    (values?: Record<string, unknown>) => {
      const snapshot = values ?? formValuesRef.current
      const nextErrors: Record<string, string> = {}

      visibleFields.forEach((field) => {
        const value = snapshot[field.key]
        const error =
          field.type === 'tableInput'
            ? validateTableValue(field, value, snapshot)
            : validateFieldValue(field, value, snapshot)
        if (error) nextErrors[field.key] = error
      })

      setFormErrors(nextErrors)
      return nextErrors
    },
    [visibleFields]
  )

  const handleStartWorkflow = async () => {
    if (!selectedDefinitionKey) {
      toast.error('Select a workflow definition.')
      return
    }
    if (!entityType.trim() || !entityId.trim()) {
      toast.error('Entity Type and Entity ID are required to start workflow.')
      return
    }

    let variables: Record<string, unknown> = {}
    if (startVariablesText.trim()) {
      try {
        const parsed = JSON.parse(startVariablesText) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          variables = parsed as Record<string, unknown>
        } else {
          toast.error('Variables JSON must be an object.')
          return
        }
      } catch {
        toast.error('Variables JSON is invalid.')
        return
      }
    }

    await startMutation.mutateAsync({
      defKey: selectedDefinitionKey,
      entities: [
        {
          entityType: entityType.trim(),
          entityId: entityId.trim(),
          accountNo: accountNo.trim() || undefined,
          customerId: customerId.trim() || undefined,
          branchId: branchId || undefined,
          departmentId: departmentId || undefined,
        },
      ],
      variables,
    })

    if (isFullMode) {
      await tasksQuery.refetch()
    }
  }

  const handleSaveDraft = async () => {
    if (!taskUiQuery.data) return
    if (!isFormStage) return
    if (
      taskUiQuery.data.instanceId == null ||
      taskUiQuery.data.stageDefId == null
    ) {
      toast.error('Task context is missing instance or stage information.')
      return
    }
    const submissionValues = { ...formValuesRef.current }
    const validationErrors = validateCurrentForm(submissionValues)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Fix validation errors before saving.')
      return
    }

    await saveDetailsMutation.mutateAsync({
      instanceId: taskUiQuery.data.instanceId,
      stageDefId: taskUiQuery.data.stageDefId,
      values: submissionValues,
    })
    setLastSavedFormSignature(safeJsonStringify(submissionValues))
    toast.success('Draft saved.')
    await taskUiQuery.refetch()
  }

  const handleSubmitFormValues = async () => {
    if (!taskUiQuery.data || !isFormStage) return
    if (
      taskUiQuery.data.instanceId == null ||
      taskUiQuery.data.stageDefId == null
    ) {
      toast.error('Task context is missing instance or stage information.')
      return
    }
    if (!canEdit) {
      toast.error('This task is already completed.')
      return
    }
    if (requiresDocumentsForFormStage && !hasRequiredDocuments) {
      toast.error(documentRequirementMessage)
      return
    }

    const submissionValues = { ...formValuesRef.current }
    const validationErrors = validateCurrentForm(submissionValues)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Fix validation errors before submitting form values.')
      return
    }

    await saveDetailsMutation.mutateAsync({
      instanceId: taskUiQuery.data.instanceId,
      stageDefId: taskUiQuery.data.stageDefId,
      values: submissionValues,
    })
    setLastSavedFormSignature(safeJsonStringify(submissionValues))
    setIsFormStepCompleted(true)
    toast.success('Form values submitted. You can now complete the task.')
    await taskUiQuery.refetch()
  }

  const handleTaskAction = async (action: RuntimeAction) => {
    const taskId = taskUiQuery.data?.taskId

    if (!taskId) {
      toast.error('Task ID is missing.')
      return
    }

    if (!canEdit) {
      toast.error('This task is already completed.')
      return
    }

    if (actionMutation.isPending) return

    if (action === 'APPROVE') {
      if (requiresDocumentsForFormStage && !hasRequiredDocuments) {
        toast.error(documentRequirementMessage)
        return
      }

      if (isFormStage && (!isFormStepCompleted || hasUnsavedFormChanges)) {
        toast.error('Submit form values first, then complete the task.')
        return
      }
    }

    try {
      const summary = await actionMutation.mutateAsync({
        taskId,
        action,
        comments: comments.trim(),
        payload: { ...formValuesRef.current },
      })

      setLastActionSummary({
        instanceId: summary.instanceId,
        status: summary.status,
        currentStage: summary.currentStage,
      })

      toast.success(
        `${taskActionLabel(action, stageKind)} completed for task ${taskId}.`
      )

      if (isFullMode) {
        await Promise.allSettled([tasksQuery.refetch(), taskUiQuery.refetch()])
      } else {
        await taskUiQuery.refetch()
      }

      await navigate({ to: '/workflow/tasks' })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to complete the task.'
      toast.error(message)
    }
  }

  const handleAddDocument = async () => {
    if (!taskUiQuery.data) return
    if (
      taskUiQuery.data.instanceId == null ||
      taskUiQuery.data.stageDefId == null
    ) {
      toast.error('Task context is missing instance or stage information.')
      return
    }
    if (!canEdit) {
      toast.error('This task is already completed.')
      return
    }
    if (!docFile) {
      toast.error('Select a file to upload.')
      return
    }

    await uploadDocumentMutation.mutateAsync({
      instanceId: taskUiQuery.data.instanceId,
      stageDefId: taskUiQuery.data.stageDefId,
      docType: docType.trim() || undefined,
      file: docFile,
    })

    await taskUiQuery.refetch()
  }

  const handleDownloadGeneratedDocument = async (docCode: string) => {
    if (!taskUiQuery.data || !docCode) return
    if (taskUiQuery.data.taskId == null) {
      toast.error('Task ID is missing.')
      return
    }
    setDownloadingGeneratedDocCode(docCode)
    try {
      const locale =
        typeof navigator !== 'undefined' ? navigator.language : undefined
      const { blob, fileName } = await downloadGeneratedWorkflowDocument({
        taskId: taskUiQuery.data.taskId,
        docCode,
        locale,
      })
      downloadBlob(blob, fileName)
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to download document'
      toast.error(message)
    } finally {
      setDownloadingGeneratedDocCode(null)
    }
  }

  const renderSelectLikeField = (
    field: RuntimeField,
    options: OptionItem[],
    value: unknown,
    disabled: boolean
  ) => (
    <Select
      value={asString(value) || NONE_VALUE}
      onValueChange={(next) =>
        updateFieldValue(field.key, next === NONE_VALUE ? '' : next)
      }
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder='Select value' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
        {options.map((option) => (
          <SelectItem key={`${field.key}-${option.value}`} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderFieldInput = (field: RuntimeField) => {
    const value = formValues[field.key]
    const config = parseFieldConfig(field)
    const placeholder = asString(config.placeholder)
    const disabled =
      !canEdit ||
      saveDetailsMutation.isPending ||
      actionMutation.isPending ||
      taskUiQuery.isFetching

    const options = parseOptions(config.options)

    if (field.type === 'textarea') {
      return (
        <Textarea
          value={asString(value)}
          onChange={(event) => updateFieldValue(field.key, event.target.value)}
          placeholder={placeholder || 'Enter value'}
          disabled={disabled}
          className='min-h-[88px]'
        />
      )
    }

    if (field.type === 'number') {
      return (
        <Input
          type='number'
          value={asString(value)}
          onChange={(event) => updateFieldValue(field.key, event.target.value)}
          placeholder={placeholder || 'Enter number'}
          disabled={disabled}
        />
      )
    }

    if (
      field.type === 'date' ||
      field.type === 'datetime-local' ||
      field.type === 'time' ||
      field.type === 'email' ||
      field.type === 'password'
    ) {
      return (
        <Input
          type={field.type}
          value={asString(value)}
          onChange={(event) => updateFieldValue(field.key, event.target.value)}
          placeholder={placeholder || 'Enter value'}
          disabled={disabled}
        />
      )
    }

    if (field.type === 'checkbox' || field.type === 'switch') {
      return (
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) =>
              updateFieldValue(field.key, Boolean(checked))
            }
            disabled={disabled}
          />
          <span className='text-muted-foreground text-sm'>Checked</span>
        </div>
      )
    }

    if (field.type === 'select') {
      return renderSelectLikeField(field, options, value, disabled)
    }

    if (field.type === 'radio') {
      return (
        <RadioGroup
          value={asString(value)}
          onValueChange={(next) => updateFieldValue(field.key, next)}
          className='grid gap-2'
          disabled={disabled}
        >
          {options.map((option) => (
            <div
              key={`${field.key}-${option.value}`}
              className='flex items-center gap-2'
            >
              <RadioGroupItem
                value={option.value}
                id={`${field.key}-${option.value}`}
              />
              <Label htmlFor={`${field.key}-${option.value}`}>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )
    }

    if (field.type === 'multiselect') {
      const selected = Array.isArray(value) ? value.map(String) : []
      return (
        <div className='space-y-2 rounded-md border p-3'>
          {options.length === 0 && (
            <p className='text-muted-foreground text-xs'>
              No options configured.
            </p>
          )}
          {options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <div
                key={`${field.key}-${option.value}`}
                className='flex items-center gap-2'
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) => {
                    const nextSet = new Set(selected)
                    if (next) nextSet.add(option.value)
                    else nextSet.delete(option.value)
                    updateFieldValue(field.key, Array.from(nextSet))
                  }}
                />
                <span className='text-sm'>{option.label}</span>
              </div>
            )
          })}
        </div>
      )
    }

    if (field.type === 'branchSelector') {
      const branchItems = (branchOptions ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }))
      return renderSelectLikeField(field, branchItems, value, disabled)
    }

    if (field.type === 'departmentSelector') {
      const departmentItems = (departmentOptions ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }))
      return renderSelectLikeField(field, departmentItems, value, disabled)
    }

    if (field.type === 'roleDropdown') {
      return renderSelectLikeField(field, roleOptions, value, disabled)
    }

    if (field.type === 'userSelector') {
      return renderSelectLikeField(field, userOptions, value, disabled)
    }

    if (field.type === 'file') {
      return (
        <Input
          value={asString(value)}
          onChange={(event) => updateFieldValue(field.key, event.target.value)}
          placeholder={placeholder || 'Enter uploaded file URL/reference'}
          disabled={disabled}
        />
      )
    }

    if (field.type === 'tableInput') {
      const rows = Array.isArray(value)
        ? (value as Array<Record<string, unknown>>)
        : []
      const columns = fieldTableColumns(field)
      return (
        <div className='space-y-3 rounded-md border p-3'>
          <div className='flex items-center justify-between'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Table2 className='h-4 w-4' />
              <span>{columns.length} columns configured</span>
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={disabled}
              onClick={() => addTableRow(field)}
            >
              Add Row
            </Button>
          </div>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={`${field.key}-${column.key}`}>
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className='w-[96px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className='text-muted-foreground text-center text-xs'
                    >
                      No rows yet. Click Add Row.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, rowIndex) => (
                  <TableRow key={`${field.key}-row-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell key={`${field.key}-${rowIndex}-${column.key}`}>
                        {column.type === 'select' ||
                        column.type === 'radio' ||
                        column.type === 'branchSelector' ||
                        column.type === 'departmentSelector' ||
                        column.type === 'roleDropdown' ||
                        column.type === 'userSelector' ? (
                          <Select
                            value={asString(row?.[column.key]) || NONE_VALUE}
                            onValueChange={(next) =>
                              updateTableCell(
                                field,
                                rowIndex,
                                column.key,
                                next === NONE_VALUE ? '' : next
                              )
                            }
                            disabled={disabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select value' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>
                                -- None --
                              </SelectItem>
                              {(column.type === 'branchSelector'
                                ? (branchOptions ?? []).map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                  }))
                                : column.type === 'departmentSelector'
                                  ? (departmentOptions ?? []).map((item) => ({
                                      label: item.name,
                                      value: item.id,
                                    }))
                                  : column.type === 'roleDropdown'
                                    ? roleOptions
                                    : column.type === 'userSelector'
                                      ? userOptions
                                      : column.options
                              ).map((option) => (
                                <SelectItem
                                  key={`${field.key}-${rowIndex}-${column.key}-${option.value}`}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : column.type === 'checkbox' ||
                          column.type === 'switch' ? (
                          <Checkbox
                            checked={Boolean(row?.[column.key])}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                              updateTableCell(
                                field,
                                rowIndex,
                                column.key,
                                Boolean(checked)
                              )
                            }
                          />
                        ) : column.type === 'textarea' ? (
                          <Textarea
                            value={asString(row?.[column.key])}
                            disabled={disabled}
                            onChange={(event) =>
                              updateTableCell(
                                field,
                                rowIndex,
                                column.key,
                                event.target.value
                              )
                            }
                            placeholder={column.placeholder || 'Enter value'}
                            className='min-h-[70px]'
                          />
                        ) : (
                          <Input
                            type={column.type === 'number' ? 'number' : 'text'}
                            value={asString(row?.[column.key])}
                            disabled={disabled}
                            onChange={(event) =>
                              updateTableCell(
                                field,
                                rowIndex,
                                column.key,
                                event.target.value
                              )
                            }
                            placeholder={column.placeholder || 'Enter value'}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        disabled={disabled}
                        onClick={() => removeTableRow(field, rowIndex)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    }

    return (
      <Input
        value={asString(value)}
        onChange={(event) => updateFieldValue(field.key, event.target.value)}
        placeholder={placeholder || 'Enter value'}
        disabled={disabled}
      />
    )
  }

  const resolveDisplayOptions = (type: string, configured: OptionItem[]) => {
    if (type === 'branchSelector') {
      const resolved = (branchOptions ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }))
      return resolved.length > 0 ? resolved : configured
    }
    if (type === 'departmentSelector') {
      const resolved = (departmentOptions ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }))
      return resolved.length > 0 ? resolved : configured
    }
    if (type === 'roleDropdown') {
      return roleOptions.length > 0 ? roleOptions : configured
    }
    if (type === 'userSelector') {
      return userOptions.length > 0 ? userOptions : configured
    }
    return configured
  }

  const renderReadOnlyValue = (
    type: string,
    value: unknown,
    options: OptionItem[]
  ) => {
    if (type === 'checkbox' || type === 'switch') {
      return (
        <Badge variant={value ? 'secondary' : 'outline'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (type === 'multiselect') {
      const selected = Array.isArray(value) ? value.map(String) : []
      if (selected.length === 0) {
        return <p className='text-muted-foreground text-xs'>—</p>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {selected.map((item) => {
            const match = options.find((option) => option.value === item)
            return (
              <Badge key={`${type}-${item}`} variant='outline'>
                {match?.label ?? item}
              </Badge>
            )
          })}
        </div>
      )
    }

    if (
      type === 'select' ||
      type === 'radio' ||
      type === 'branchSelector' ||
      type === 'departmentSelector' ||
      type === 'roleDropdown' ||
      type === 'userSelector'
    ) {
      const raw = asString(value)
      if (!raw) return <p className='text-muted-foreground text-xs'>—</p>
      const match = options.find((option) => option.value === raw)
      if (!match) return <p className='text-sm'>{raw}</p>
      return (
        <div className='space-y-0.5'>
          <p className='text-sm'>{match.label}</p>
          {match.value !== match.label ? (
            <p className='text-muted-foreground text-[11px]'>{match.value}</p>
          ) : null}
        </div>
      )
    }

    if (type === 'date') {
      const raw = asString(value)
      if (!raw) return <p className='text-muted-foreground text-xs'>—</p>
      const parsed = new Date(raw)
      if (Number.isNaN(parsed.getTime()))
        return <p className='text-sm'>{raw}</p>
      return (
        <p className='text-sm'>
          {parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )
    }

    if (type === 'datetime-local' || type === 'time') {
      const raw = asString(value)
      if (!raw) return <p className='text-muted-foreground text-xs'>—</p>
      return <p className='text-sm'>{formatDateTime(raw)}</p>
    }

    if (type === 'file') {
      const raw = asString(value)
      if (!raw) return <p className='text-muted-foreground text-xs'>—</p>
      const url = resolveWorkflowDocumentUrl(raw)
      return url ? (
        <a
          href={url}
          target='_blank'
          rel='noreferrer'
          className='text-primary text-sm break-all underline'
        >
          {url}
        </a>
      ) : (
        <p className='text-sm break-words'>{raw}</p>
      )
    }

    if (type === 'tableInput') {
      return (
        <pre className='bg-muted/40 max-h-[220px] overflow-auto rounded border p-2 text-xs'>
          {safeJsonStringify(value)}
        </pre>
      )
    }

    if (Array.isArray(value)) {
      if (value.length === 0)
        return <p className='text-muted-foreground text-xs'>—</p>
      return (
        <div className='flex flex-wrap gap-1'>
          {value.map((item, index) => (
            <Badge key={`${type}-${index}`} variant='outline'>
              {asString(item)}
            </Badge>
          ))}
        </div>
      )
    }

    if (value && typeof value === 'object') {
      return (
        <pre className='bg-muted/40 max-h-[220px] overflow-auto rounded border p-2 text-xs'>
          {safeJsonStringify(value)}
        </pre>
      )
    }

    const raw = asString(value)
    if (!raw) return <p className='text-muted-foreground text-xs'>—</p>
    return <p className='text-sm break-words'>{raw}</p>
  }

  const renderPreviousStageTable = (
    field: RuntimeField,
    values: Record<string, unknown>
  ) => {
    const rows = Array.isArray(values[field.key])
      ? (values[field.key] as Array<Record<string, unknown>>)
      : []
    const columns = fieldTableColumns(field)
    return (
      <div className='space-y-2 rounded-md border p-3'>
        <div className='flex items-center gap-2 text-xs font-medium'>
          <Table2 className='h-4 w-4' />
          <span>{field.label}</span>
        </div>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={`${field.key}-${column.key}`}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(columns.length, 1)}
                    className='text-muted-foreground text-center text-xs'
                  >
                    No rows submitted.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, rowIndex) => (
                  <TableRow key={`${field.key}-readonly-${rowIndex}`}>
                    {columns.map((column) => {
                      const options = resolveDisplayOptions(
                        column.type,
                        column.options
                      )
                      return (
                        <TableCell
                          key={`${field.key}-${rowIndex}-${column.key}`}
                        >
                          {renderReadOnlyValue(
                            column.type,
                            row?.[column.key],
                            options
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderPreviousStageSubmission = (
    snapshotValues: Record<string, unknown>,
    formSchema?: WorkflowUiFormSchema | null
  ) => {
    const parsedValues = tryParseJsonText(snapshotValues)
    const values = toObject(parsedValues)
    const fields = extractRuntimeFieldsFromFormSchema(formSchema)

    if (fields.length === 0) {
      const entries = Object.entries(values)
      if (entries.length === 0) {
        return (
          <p className='text-muted-foreground text-xs'>
            No submitted values for this stage.
          </p>
        )
      }
      return (
        <div className='grid gap-2 md:grid-cols-2'>
          {entries.map(([key, value]) => (
            <div key={key} className='space-y-1 rounded-md border p-2'>
              <p className='text-muted-foreground text-[11px] font-medium'>
                {key}
              </p>
              {renderReadOnlyValue('text', value, [])}
            </div>
          ))}
        </div>
      )
    }

    const simpleFields = fields.filter((field) => field.type !== 'tableInput')
    const tableFields = fields.filter((field) => field.type === 'tableInput')

    return (
      <div className='space-y-3'>
        {simpleFields.length > 0 ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {simpleFields.map((field) => {
              const config = parseFieldConfig(field)
              const configuredOptions = parseOptions(config.options)
              const options = resolveDisplayOptions(
                field.type,
                configuredOptions
              )
              const submittedValue = values[field.key]
              return (
                <div
                  key={field.key}
                  className='space-y-1 rounded-md border p-2.5'
                >
                  <p className='text-muted-foreground text-[11px] font-medium'>
                    {field.label}
                  </p>
                  {renderReadOnlyValue(field.type, submittedValue, options)}
                </div>
              )
            })}
          </div>
        ) : null}

        {tableFields.map((field) => (
          <div key={field.key}>{renderPreviousStageTable(field, values)}</div>
        ))}
      </div>
    )
  }

  return (
    <MainWrapper>
      <div className='space-y-5'>
        {isFullMode ? (
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Workflow Runtime
              </h1>
              <p className='text-muted-foreground text-sm'>
                End-to-end test flow: start a workflow instance, open your task,
                submit form values, and complete stage actions.
              </p>
            </div>
            <Button
              variant='outline'
              onClick={() => {
                definitionsQuery.refetch()
                tasksQuery.refetch()
                taskUiQuery.refetch()
              }}
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        ) : (
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Task Completion
              </h1>
              <p className='text-muted-foreground text-sm'>
                Complete this assigned task by filling the form, uploading
                documents, and taking an action.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => navigate({ to: '/workflow/tasks' })}
              >
                <ChevronLeft className='mr-2 h-4 w-4' />
                Back to My Tasks
              </Button>
              <Button variant='outline' onClick={() => taskUiQuery.refetch()}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
            </div>
          </div>
        )}

        <div className='grid gap-5'>
          {isFullMode && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Play className='h-4 w-4' />
                  1. Start Workflow Instance
                </CardTitle>
                <CardDescription>
                  Choose active workflow definition and provide root entity
                  details.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Workflow Definition</Label>
                    <Select
                      value={selectedDefinitionKey || NONE_VALUE}
                      onValueChange={(next) =>
                        setSelectedDefinitionKey(
                          next === NONE_VALUE ? '' : next
                        )
                      }
                      disabled={
                        definitionsQuery.isLoading || startMutation.isPending
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select workflow definition' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- Select --</SelectItem>
                        {(definitionsQuery.data ?? []).map(
                          (definition, index) => {
                            if (!definition.key) return null
                            return (
                              <SelectItem
                                key={
                                  definition.id ?? `${definition.key}-${index}`
                                }
                                value={definition.key}
                              >
                                {definition.name} ({definition.key}) v
                                {definition.version ?? 1}
                              </SelectItem>
                            )
                          }
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label>Entity Type</Label>
                    <Input
                      value={entityType}
                      onChange={(event) => setEntityType(event.target.value)}
                      placeholder='ACCOUNT'
                      disabled={startMutation.isPending}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Entity ID</Label>
                    <Input
                      value={entityId}
                      onChange={(event) => setEntityId(event.target.value)}
                      placeholder='e.g. account number'
                      disabled={startMutation.isPending}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Account No (optional)</Label>
                    <Input
                      value={accountNo}
                      onChange={(event) => setAccountNo(event.target.value)}
                      placeholder='Optional'
                      disabled={startMutation.isPending}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Customer ID (optional)</Label>
                    <Input
                      value={customerId}
                      onChange={(event) => setCustomerId(event.target.value)}
                      placeholder='Optional'
                      disabled={startMutation.isPending}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Branch (optional)</Label>
                    <Select
                      value={branchId || NONE_VALUE}
                      onValueChange={(next) =>
                        setBranchId(next === NONE_VALUE ? '' : next)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select branch' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                        {(branchOptions ?? []).map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Department (optional)</Label>
                    <Select
                      value={departmentId || NONE_VALUE}
                      onValueChange={(next) =>
                        setDepartmentId(next === NONE_VALUE ? '' : next)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                        {(departmentOptions ?? []).map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Variables JSON</Label>
                  <Textarea
                    value={startVariablesText}
                    onChange={(event) =>
                      setStartVariablesText(event.target.value)
                    }
                    className='font-mono text-xs'
                    placeholder='{"accountNo":"1234567890"}'
                    rows={4}
                    disabled={startMutation.isPending}
                  />
                </div>

                <div className='flex justify-end'>
                  <Button
                    onClick={handleStartWorkflow}
                    disabled={startMutation.isPending}
                  >
                    {startMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    <Play className='mr-2 h-4 w-4' />
                    Start Instance
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isFullMode && (
            <Card>
              <CardHeader>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <ClipboardList className='h-4 w-4' />
                      2. Pick Task
                    </CardTitle>
                    <CardDescription>
                      Open a task from your queue and load its schema-driven UI.
                    </CardDescription>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Select
                      value={taskStatus}
                      onValueChange={(next) =>
                        setTaskStatus(next as WorkflowTaskStatus)
                      }
                    >
                      <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Status' />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => tasksQuery.refetch()}
                      disabled={tasksQuery.isFetching}
                    >
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task ID</TableHead>
                        <TableHead>Instance</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Entities</TableHead>
                        <TableHead className='w-[120px] text-right'>
                          Open
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasksQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center'>
                            <Loader2 className='text-muted-foreground mx-auto h-4 w-4 animate-spin' />
                          </TableCell>
                        </TableRow>
                      ) : (tasksQuery.data?.content?.length ?? 0) === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-muted-foreground text-center'
                          >
                            No tasks found for selected status.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (tasksQuery.data?.content ?? []).map((task) => {
                          if (task.taskId == null) return null
                          const taskId = task.taskId
                          return (
                            <TableRow
                              key={taskId}
                              className={cn(
                                selectedTaskId === taskId && 'bg-muted/50'
                              )}
                            >
                              <TableCell className='font-medium'>
                                {taskId}
                              </TableCell>
                              <TableCell>{task.instanceId}</TableCell>
                              <TableCell>{task.stageName}</TableCell>
                              <TableCell>
                                {formatDateTime(task.dueAt)}
                              </TableCell>
                              <TableCell className='max-w-[320px] truncate'>
                                {(task.entities ?? []).join(', ') || '—'}
                              </TableCell>
                              <TableCell className='text-right'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setSelectedTaskId(taskId)}
                                >
                                  Open
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Send className='h-4 w-4' />
                {isFullMode
                  ? '3. Fill Form and Complete Task'
                  : 'Task Form & Actions'}
              </CardTitle>
              <CardDescription>
                {isFullMode
                  ? 'Save draft values, attach documents if required, and run task actions.'
                  : 'Submit required form details, add task documents, and complete the task.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTaskId ? (
                <div className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
                  {isFullMode
                    ? 'Select a task from the table above.'
                    : 'Task ID is missing from URL.'}
                </div>
              ) : taskUiQuery.isLoading ? (
                <div className='flex items-center justify-center py-10'>
                  <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
                </div>
              ) : !taskUiQuery.data ? (
                <div className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
                  Task UI data not found.
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline'>
                      Task {taskUiQuery.data.taskId}
                    </Badge>
                    <Badge variant='outline'>
                      Instance {taskUiQuery.data.instanceId}
                    </Badge>
                    <Badge>{stageKind}</Badge>
                    <Badge variant='secondary'>
                      {taskUiQuery.data.stageName || taskUiQuery.data.stageKey}
                    </Badge>
                    {taskUiQuery.data.formSchema && (
                      <Badge variant='secondary'>
                        {taskUiQuery.data.formSchema.schemaKey} v
                        {taskUiQuery.data.formSchema.version}
                      </Badge>
                    )}
                  </div>

                  {shouldShowTaskAccountDetails && (
                    <div className='space-y-2 rounded-md border p-3'>
                      <p className='text-sm font-medium'>Account Details</p>
                      <div className='bg-muted/40 grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2'>
                        <DetailRow
                          label='Account No'
                          value={taskAccountDetails?.accountNo}
                        />
                        <DetailRow
                          label='Customer Name'
                          value={taskAccountDetails?.customerName}
                        />
                        <DetailRow
                          label='Account Description'
                          value={taskAccountDetails?.accountDescription}
                        />
                        <DetailRow
                          label='Outstanding'
                          value={
                            taskAccountDetails?.outstanding != null
                              ? Number(
                                  taskAccountDetails.outstanding
                                ).toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : null
                          }
                        />
                        <DetailRow
                          label='Branch Code'
                          value={taskAccountDetails?.branchCode}
                        />
                        <DetailRow
                          label='Mobile'
                          value={taskAccountDetails?.mobileNo}
                        />
                      </div>
                    </div>
                  )}

                  <div className='grid gap-4 xl:grid-cols-3'>
                    <div className='rounded-md border p-3'>
                      <p className='mb-2 text-sm font-medium'>
                        Workflow Progress
                      </p>
                      {workflowProgress.length === 0 ? (
                        <p className='text-muted-foreground text-xs'>
                          Progress data is not available.
                        </p>
                      ) : (
                        <div className='space-y-2'>
                          {workflowProgress.map((stageItem, index) => (
                            <div
                              key={`${stageItem.stageDefId ?? index}-${stageItem.stageName ?? ''}`}
                              className='rounded-md border p-2 text-xs'
                            >
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <p className='font-medium'>
                                  {stageItem.stageOrder != null
                                    ? `${stageItem.stageOrder}. `
                                    : ''}
                                  {stageItem.stageName ||
                                    stageItem.stageKey ||
                                    `Stage ${index + 1}`}
                                </p>
                                <Badge
                                  variant={progressBadgeVariant(
                                    stageItem.status
                                  )}
                                >
                                  {stageItem.status || 'PENDING'}
                                </Badge>
                              </div>
                              <p className='text-muted-foreground mt-1'>
                                Acted: {stageItem.actedBy || '—'} •{' '}
                                {formatDateTime(stageItem.actedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className='rounded-md border p-3 xl:col-span-2'>
                      <p className='mb-2 text-sm font-medium'>
                        Completion History
                      </p>
                      {workflowHistory.length === 0 ? (
                        <p className='text-muted-foreground text-xs'>
                          No prior action history for this instance.
                        </p>
                      ) : (
                        <div className='space-y-2'>
                          {workflowHistory.slice(0, 12).map((entry, index) => (
                            <div
                              key={`${entry.taskId ?? index}-${entry.at ?? ''}`}
                              className='rounded-md border p-2 text-xs'
                            >
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <p className='font-medium'>
                                  {entry.stageName || 'Stage'} •{' '}
                                  {entry.action || 'ACTION'}
                                </p>
                                <p className='text-muted-foreground'>
                                  {formatDateTime(entry.at)}
                                </p>
                              </div>
                              <p className='text-muted-foreground'>
                                By: {entry.actorUserId || '—'}
                              </p>
                              {asString(entry.comments) ? (
                                <p className='mt-1'>{entry.comments}</p>
                              ) : null}
                            </div>
                          ))}
                          {workflowHistory.length > 12 ? (
                            <p className='text-muted-foreground text-xs'>
                              Showing latest 12 events.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='rounded-md border p-3'>
                    <p className='mb-2 text-sm font-medium'>
                      Previous Stage Submissions
                    </p>
                    {previousStageSnapshots.length === 0 ? (
                      <p className='text-muted-foreground text-xs'>
                        No prior stage submissions found for this instance.
                      </p>
                    ) : (
                      <div className='space-y-3'>
                        {previousStageSnapshots.map((snapshot, index) => {
                          const snapshotKey = `${snapshot.stageDefId ?? index}-${snapshot.stageOrder ?? index}`
                          return (
                            <div
                              key={snapshotKey}
                              className='space-y-2 rounded-md border p-3'
                            >
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <div className='space-y-1'>
                                  <p className='text-sm font-medium'>
                                    {snapshot.stageOrder != null
                                      ? `${snapshot.stageOrder}. `
                                      : ''}
                                    {snapshot.stageName ||
                                      snapshot.stageKey ||
                                      `Stage ${index + 1}`}
                                  </p>
                                  <p className='text-muted-foreground text-xs'>
                                    {snapshot.actedBy || '—'} •{' '}
                                    {formatDateTime(snapshot.actedAt)}
                                  </p>
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <Badge
                                    variant={progressBadgeVariant(
                                      snapshot.status
                                    )}
                                  >
                                    {snapshot.status || 'PENDING'}
                                  </Badge>
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='outline'
                                    onClick={() =>
                                      setActivePreviousSubmission(snapshot)
                                    }
                                  >
                                    View Submission
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Dialog
                    open={activePreviousSubmission != null}
                    onOpenChange={(open) => {
                      if (!open) setActivePreviousSubmission(null)
                    }}
                  >
                    <DialogContent className='sm:max-w-5xl'>
                      <DialogHeader>
                        <DialogTitle>
                          {activePreviousSubmission
                            ? `${activePreviousSubmission.stageOrder != null ? `${activePreviousSubmission.stageOrder}. ` : ''}${activePreviousSubmission.stageName || activePreviousSubmission.stageKey || 'Stage Submission'}`
                            : 'Stage Submission'}
                        </DialogTitle>
                        <DialogDescription>
                          {activePreviousSubmission
                            ? `Submitted by ${activePreviousSubmission.actedBy || '—'} on ${formatDateTime(activePreviousSubmission.actedAt)}`
                            : 'Submission details'}
                        </DialogDescription>
                      </DialogHeader>

                      {activePreviousSubmission ? (
                        <div className='max-h-[72vh] space-y-4 overflow-auto pr-1'>
                          <div className='space-y-1'>
                            <p className='text-xs font-medium'>
                              Submitted Values
                            </p>
                            {renderPreviousStageSubmission(
                              activePreviousSubmission.values ?? {},
                              activePreviousSubmission.formSchema
                            )}
                          </div>

                          <div className='space-y-1'>
                            <p className='text-xs font-medium'>Documents</p>
                            {(activePreviousSubmission.documents ?? [])
                              .length === 0 ? (
                              <p className='text-muted-foreground text-xs'>
                                No documents attached in this stage.
                              </p>
                            ) : (
                              <ul className='space-y-1 text-xs'>
                                {(activePreviousSubmission.documents ?? []).map(
                                  (doc, docIndex) => {
                                    const url = resolveWorkflowDocumentUrl(
                                      doc.url
                                    )
                                    return (
                                      <li
                                        key={`${doc.id ?? docIndex}-${url}`}
                                        className='break-all'
                                      >
                                        <span className='font-medium'>
                                          {doc.docType || 'DOC'}
                                        </span>{' '}
                                        -{' '}
                                        {url ? (
                                          <a
                                            href={url}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='text-primary underline'
                                          >
                                            {url}
                                          </a>
                                        ) : (
                                          '—'
                                        )}
                                      </li>
                                    )
                                  }
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </DialogContent>
                  </Dialog>

                  <Tabs defaultValue='form' className='w-full'>
                    {isFullMode && (
                      <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='form'>
                          {isApprovalStage ? 'Task' : 'Form'}
                        </TabsTrigger>
                        <TabsTrigger value='schema'>Schema JSON</TabsTrigger>
                        <TabsTrigger value='values'>Values JSON</TabsTrigger>
                      </TabsList>
                    )}

                    <TabsContent value='form' className='space-y-4 pt-4'>
                      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                        <div className='bg-muted/20 rounded-md border p-3'>
                          <p className='text-muted-foreground text-xs'>
                            Form Status
                          </p>
                          <p className='text-sm font-medium'>
                            {isFormStage
                              ? isFormStepCompleted && !hasUnsavedFormChanges
                                ? 'Submitted'
                                : 'Pending Submit'
                              : 'Not Required'}
                          </p>
                        </div>
                        <div className='bg-muted/20 rounded-md border p-3'>
                          <p className='text-muted-foreground text-xs'>
                            Documents
                          </p>
                          <p className='text-sm font-medium'>
                            {hasRequiredDocuments ? 'Ready' : 'Action Needed'}
                          </p>
                        </div>
                        <div className='bg-muted/20 rounded-md border p-3'>
                          <p className='text-muted-foreground text-xs'>
                            Stage Type
                          </p>
                          <p className='text-sm font-medium'>{stageKind}</p>
                        </div>
                        <div className='bg-muted/20 rounded-md border p-3'>
                          <p className='text-muted-foreground text-xs'>
                            Completion
                          </p>
                          <p className='text-sm font-medium'>
                            {canEdit ? 'Pending' : 'Completed'}
                          </p>
                        </div>
                      </div>

                      {isFormStage ? (
                        <div className='space-y-4 rounded-md border p-4'>
                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <div>
                              <p className='text-sm font-semibold'>
                                1. Fill Form
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                Complete required fields, then submit form
                                values.
                              </p>
                            </div>
                            <Badge variant='outline'>
                              {isFormStepCompleted && !hasUnsavedFormChanges
                                ? 'Submitted'
                                : 'Not Submitted'}
                            </Badge>
                          </div>

                          <div
                            className={cn(
                              'grid gap-4',
                              schemaLayoutColumns === 2
                                ? 'grid-cols-1 lg:grid-cols-2'
                                : 'grid-cols-1'
                            )}
                          >
                            {visibleFields.length === 0 && (
                              <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                                No form fields in this stage.
                              </div>
                            )}

                            {visibleFields.map((field) => {
                              const config = parseFieldConfig(field)
                              const helpText = asString(config.helpText)
                              return (
                                <div key={field.key} className='space-y-2'>
                                  <Label className='flex items-center gap-2'>
                                    <span>{field.label}</span>
                                    {fieldValidation(field).required && (
                                      <span className='text-destructive text-xs'>
                                        *
                                      </span>
                                    )}
                                  </Label>
                                  {renderFieldInput(field)}
                                  {helpText && (
                                    <p className='text-muted-foreground text-xs'>
                                      {helpText}
                                    </p>
                                  )}
                                  {formErrors[field.key] && (
                                    <p className='text-destructive text-xs'>
                                      {formErrors[field.key]}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-3'>
                            <p className='text-muted-foreground text-xs'>
                              Submit form values before completing the task
                              action.
                            </p>
                            <div className='flex flex-wrap items-center gap-2'>
                              {canSaveDraft && (
                                <Button
                                  variant='outline'
                                  onClick={handleSaveDraft}
                                  disabled={
                                    !canEdit ||
                                    saveDetailsMutation.isPending ||
                                    actionMutation.isPending
                                  }
                                >
                                  {saveDetailsMutation.isPending ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  ) : (
                                    <Save className='mr-2 h-4 w-4' />
                                  )}
                                  Save Draft
                                </Button>
                              )}
                              <Button
                                onClick={handleSubmitFormValues}
                                disabled={
                                  !canEdit ||
                                  saveDetailsMutation.isPending ||
                                  actionMutation.isPending ||
                                  (requiresDocumentsForFormStage &&
                                    !hasRequiredDocuments)
                                }
                              >
                                {saveDetailsMutation.isPending ? (
                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                ) : (
                                  <Send className='mr-2 h-4 w-4' />
                                )}
                                Submit Form Values
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                          This is an approval stage. Form submission is not
                          required.
                        </div>
                      )}

                      <div className='space-y-3 rounded-md border p-4'>
                        <div className='flex items-center gap-2'>
                          <FilePlus2 className='h-4 w-4' />
                          <p className='text-sm font-semibold'>
                            2. Stage Documents
                          </p>
                        </div>
                        {requiresDocumentsForFormStage && (
                          <div className='space-y-1 text-xs'>
                            <p
                              className={cn(
                                hasRequiredDocuments
                                  ? 'text-emerald-600'
                                  : 'text-destructive'
                              )}
                            >
                              {hasRequiredDocuments
                                ? 'Document requirement satisfied.'
                                : documentRequirementMessage}
                            </p>
                            {documentRequirements.requiredTypes.length > 0 && (
                              <p className='text-muted-foreground'>
                                Required types:{' '}
                                {documentRequirements.requiredTypes.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                        <div className='grid gap-3 md:grid-cols-[180px,1fr,auto]'>
                          <Input
                            placeholder='Document type (optional)'
                            value={docType}
                            onChange={(event) => setDocType(event.target.value)}
                            disabled={
                              uploadDocumentMutation.isPending || !canEdit
                            }
                          />
                          <Input
                            key={docFileInputKey}
                            type='file'
                            onChange={(event) =>
                              setDocFile(event.target.files?.[0] ?? null)
                            }
                            disabled={
                              uploadDocumentMutation.isPending || !canEdit
                            }
                          />
                          <Button
                            variant='outline'
                            onClick={handleAddDocument}
                            disabled={
                              uploadDocumentMutation.isPending || !canEdit
                            }
                          >
                            {uploadDocumentMutation.isPending && (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            Upload
                          </Button>
                        </div>
                        <div className='rounded-md border p-3 text-xs'>
                          {stageDocuments.length === 0 ? (
                            <p className='text-muted-foreground'>
                              No stage documents attached.
                            </p>
                          ) : (
                            <ul className='space-y-1'>
                              {stageDocuments.map((doc, index) => {
                                const downloadUrl = resolveWorkflowDocumentUrl(
                                  doc.url
                                )
                                return (
                                  <li
                                    key={`${doc.id ?? index}-${doc.url}`}
                                    className='break-all'
                                  >
                                    <span className='font-medium'>
                                      {doc.docType || 'DOC'}
                                    </span>{' '}
                                    -{' '}
                                    {downloadUrl ? (
                                      <a
                                        href={downloadUrl}
                                        target='_blank'
                                        rel='noreferrer'
                                        className='text-primary underline'
                                      >
                                        {downloadUrl}
                                      </a>
                                    ) : (
                                      '—'
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>

                        <div className='rounded-md border p-3 text-xs'>
                          <p className='mb-2 text-sm font-medium'>
                            Generated Documents (On Demand)
                          </p>
                          {(taskUiQuery.data.generatedDocuments ?? [])
                            .length === 0 ? (
                            <p className='text-muted-foreground'>
                              No generated documents configured for this stage.
                            </p>
                          ) : (
                            <ul className='space-y-2'>
                              {(taskUiQuery.data.generatedDocuments ?? []).map(
                                (doc, index) => {
                                  const code = asString(doc.code)
                                  const isDownloading =
                                    downloadingGeneratedDocCode === code
                                  return (
                                    <li
                                      key={`${code || index}-${doc.templateKey ?? ''}`}
                                      className='flex flex-wrap items-center justify-between gap-2'
                                    >
                                      <div className='min-w-0'>
                                        <p className='font-medium'>
                                          {doc.label || code || 'Generated PDF'}
                                        </p>
                                        <p className='text-muted-foreground'>
                                          {doc.docType || 'PDF'} •{' '}
                                          {doc.templateKey || 'template'} v
                                          {doc.templateVersion ?? 'latest'}
                                        </p>
                                      </div>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                          handleDownloadGeneratedDocument(code)
                                        }
                                        disabled={!code || isDownloading}
                                      >
                                        {isDownloading ? (
                                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        ) : (
                                          <Download className='mr-2 h-4 w-4' />
                                        )}
                                        Download
                                      </Button>
                                    </li>
                                  )
                                }
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className='space-y-3 rounded-md border p-4'>
                        <div className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          <p className='text-sm font-semibold'>
                            3. Complete Task
                          </p>
                        </div>
                        <div className='space-y-3'>
                          <Label>Comments</Label>
                          <Textarea
                            value={comments}
                            onChange={(event) =>
                              setComments(event.target.value)
                            }
                            placeholder='Optional comments for this action'
                            rows={3}
                          />
                        </div>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='text-muted-foreground text-xs'>
                            Select an action to complete this stage.
                          </p>
                          <div className='flex flex-wrap items-center gap-2'>
                            {requiredActions.map((action) => (
                              <Button
                                key={action}
                                variant={
                                  action === 'APPROVE' ? 'default' : 'outline'
                                }
                                onClick={() => handleTaskAction(action)}
                                disabled={
                                  !canEdit ||
                                  actionMutation.isPending ||
                                  saveDetailsMutation.isPending ||
                                  (action === 'APPROVE' &&
                                    ((requiresDocumentsForFormStage &&
                                      !hasRequiredDocuments) ||
                                      (isFormStage &&
                                        (!isFormStepCompleted ||
                                          hasUnsavedFormChanges))))
                                }
                              >
                                {actionMutation.isPending ? (
                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                ) : action === 'APPROVE' ? (
                                  <CheckCircle2 className='mr-2 h-4 w-4' />
                                ) : (
                                  <ArrowRight className='mr-2 h-4 w-4' />
                                )}
                                {isFormStage && action === 'APPROVE'
                                  ? 'Complete Task'
                                  : taskActionLabel(action, stageKind)}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {isFormStage &&
                          (!isFormStepCompleted || hasUnsavedFormChanges) && (
                            <p className='text-muted-foreground text-xs'>
                              Submit form values first, then complete the task.
                            </p>
                          )}
                        {requiresDocumentsForFormStage &&
                          !hasRequiredDocuments && (
                            <p className='text-muted-foreground text-xs'>
                              Upload required stage documents before completing
                              the task.
                            </p>
                          )}
                      </div>
                    </TabsContent>

                    {isFullMode && (
                      <TabsContent value='schema' className='pt-4'>
                        <div className='rounded-md border'>
                          <div className='flex items-center gap-2 border-b p-3 text-sm font-medium'>
                            <FileJson2 className='h-4 w-4' />
                            Rendered schema payload
                          </div>
                          <pre className='max-h-[480px] overflow-auto p-3 text-xs'>
                            {safeJsonStringify(
                              taskUiQuery.data.formSchema ?? {}
                            )}
                          </pre>
                        </div>
                      </TabsContent>
                    )}

                    {isFullMode && (
                      <TabsContent value='values' className='pt-4'>
                        <div className='rounded-md border'>
                          <div className='flex items-center gap-2 border-b p-3 text-sm font-medium'>
                            <FileJson2 className='h-4 w-4' />
                            Current form values
                          </div>
                          <pre className='max-h-[480px] overflow-auto p-3 text-xs'>
                            {safeJsonStringify(formValues)}
                          </pre>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>

                  {lastActionSummary && (
                    <div className='bg-muted/40 rounded-md border p-3 text-sm'>
                      <div className='mb-1 font-medium'>Last action result</div>
                      <div className='text-muted-foreground grid gap-1 text-xs'>
                        <div>Instance: {lastActionSummary.instanceId}</div>
                        <div>Status: {lastActionSummary.status || '—'}</div>
                        <div>
                          Current Stage: {lastActionSummary.currentStage || '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainWrapper>
  )
}
