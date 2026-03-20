import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Braces,
  CheckCircle2,
  ClipboardCheck,
  Columns2,
  Copy,
  Eye,
  EyeOff,
  FileCode2,
  FileInput,
  GripVertical,
  MoveDown,
  MoveUp,
  Settings2,
  Plus,
  Sparkles,
  Table2,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  createWorkflowFormSchemaVersion,
  getWorkflowFormPrefillCatalog,
  getWorkflowFormSchemaById,
  listWorkflowFormSchemas,
  type WorkflowFormPrefillCatalog,
  type WorkflowFormSchemaCreateFieldRequest,
  type WorkflowFormSchemaRecord,
} from '@/features/form-designer/workflow-form-schema-api.ts'

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'checkbox'
  | 'switch'
  | 'file'
  | 'select'
  | 'radio'
  | 'multiselect'
  | 'branchSelector'
  | 'departmentSelector'
  | 'roleDropdown'
  | 'userSelector'
  | 'tableInput'

type FieldTypeWithoutTable = Exclude<FieldType, 'tableInput'>

type ConditionOperator =
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

type ConditionalRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'min'
  | 'max'

type OptionItem = {
  id: string
  label: string
  value: string
}

type TableColumn = {
  id: string
  key: string
  label: string
  type: FieldTypeWithoutTable
  placeholder: string
  defaultValue: unknown
  options: OptionItem[]
  validation: FieldValidation
}

type FieldCondition = {
  enabled: boolean
  fieldKey: string
  operator: ConditionOperator
  value: string
}

type ConditionalValidation = {
  enabled: boolean
  when: FieldCondition
  rule: ConditionalRuleType
  ruleValue: string
  message: string
}

type FieldValidation = {
  required: boolean
  minLength: string
  maxLength: string
  pattern: string
  min: string
  max: string
  customMessage: string
  conditional: ConditionalValidation
}

type DesignerField = {
  id: string
  key: string
  label: string
  helpText: string
  placeholder: string
  type: FieldType
  defaultValue: unknown
  options: OptionItem[]
  validation: FieldValidation
  visibility: FieldCondition
  tableColumns: TableColumn[]
  tableMinRows: string
  tableMaxRows: string
}

type FormBlueprint = {
  title: string
  description: string
  submitLabel: string
  columns: '1' | '2'
}

type EmittedField = DesignerField & {
  required: boolean
}

type EmittedSchema = {
  $schema: string
  title: string
  description: string
  type: 'object'
  properties: Record<string, Record<string, unknown>>
  required: string[]
  'x-layout': {
    columns: number
    submitLabel: string
  }
  'x-fields': EmittedField[]
}

const FIELD_TYPES: Array<{
  value: FieldType
  label: string
  group: 'Standard' | 'Choice' | 'Custom'
}> = [
  { value: 'text', label: 'Text', group: 'Standard' },
  { value: 'textarea', label: 'Textarea', group: 'Standard' },
  { value: 'email', label: 'Email', group: 'Standard' },
  { value: 'password', label: 'Password', group: 'Standard' },
  { value: 'number', label: 'Number', group: 'Standard' },
  { value: 'date', label: 'Date', group: 'Standard' },
  { value: 'datetime-local', label: 'Date Time', group: 'Standard' },
  { value: 'time', label: 'Time', group: 'Standard' },
  { value: 'checkbox', label: 'Checkbox', group: 'Standard' },
  { value: 'switch', label: 'Switch', group: 'Standard' },
  { value: 'file', label: 'File', group: 'Standard' },
  { value: 'select', label: 'Select', group: 'Choice' },
  { value: 'radio', label: 'Radio', group: 'Choice' },
  { value: 'multiselect', label: 'Multi Select', group: 'Choice' },
  { value: 'branchSelector', label: 'Branch Selector', group: 'Custom' },
  {
    value: 'departmentSelector',
    label: 'Department Selector',
    group: 'Custom',
  },
  { value: 'roleDropdown', label: 'Role Dropdown', group: 'Custom' },
  { value: 'userSelector', label: 'User Selector', group: 'Custom' },
  { value: 'tableInput', label: 'Table Input', group: 'Custom' },
]

const CONDITION_OPERATORS: Array<{ value: ConditionOperator; label: string }> =
  [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'greaterOrEqual', label: 'Greater or equal' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'lessOrEqual', label: 'Less or equal' },
    { value: 'isTruthy', label: 'Is truthy' },
    { value: 'isFalsy', label: 'Is falsy' },
  ]

const CONDITIONAL_RULES: Array<{ value: ConditionalRuleType; label: string }> =
  [
    { value: 'required', label: 'Required' },
    { value: 'minLength', label: 'Minimum length' },
    { value: 'maxLength', label: 'Maximum length' },
    { value: 'pattern', label: 'Pattern (regex)' },
    { value: 'min', label: 'Minimum number' },
    { value: 'max', label: 'Maximum number' },
  ]

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const slugifyKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)

const emptyCondition = (): FieldCondition => ({
  enabled: false,
  fieldKey: '',
  operator: 'equals',
  value: '',
})

const emptyValidation = (): FieldValidation => ({
  required: false,
  minLength: '',
  maxLength: '',
  pattern: '',
  min: '',
  max: '',
  customMessage: '',
  conditional: {
    enabled: false,
    when: emptyCondition(),
    rule: 'required',
    ruleValue: '',
    message: '',
  },
})

const normalizeFieldType = (value: unknown): FieldType =>
  FIELD_TYPES.some((item) => item.value === value)
    ? (value as FieldType)
    : 'text'

const withStarterOptions = (type: FieldType): OptionItem[] => {
  if (!['select', 'radio', 'multiselect'].includes(type)) return []

  return [
    { id: createId(), label: 'Option A', value: 'option_a' },
    { id: createId(), label: 'Option B', value: 'option_b' },
  ]
}

const defaultValueByType = (type: FieldType): unknown => {
  if (type === 'checkbox' || type === 'switch') return false
  if (type === 'multiselect') return []
  if (type === 'number') return ''
  if (type === 'file') return []
  if (type === 'tableInput') return []
  return ''
}

const createTableColumn = (
  index: number,
  columnType: FieldTypeWithoutTable = 'text'
): TableColumn => ({
  id: createId(),
  key: `column_${index}`,
  label: `Column ${index}`,
  type: columnType,
  placeholder: '',
  defaultValue: defaultValueByType(columnType),
  options: withStarterOptions(columnType),
  validation: emptyValidation(),
})

const createDefaultTableRow = (field: Pick<DesignerField, 'tableColumns'>) => {
  const row: Record<string, unknown> = {}
  field.tableColumns.forEach((column) => {
    row[column.key] = column.defaultValue
  })
  return row
}

const normalizeOptionItems = (options: unknown): OptionItem[] => {
  if (!Array.isArray(options)) return []
  return options
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const label = String(source.label ?? '')
      const value = slugifyKey(String(source.value ?? label))
      if (!label || !value) return null
      return {
        id: String(source.id ?? createId()),
        label,
        value,
      }
    })
    .filter((item): item is OptionItem => item !== null)
}

const normalizeCondition = (condition: unknown): FieldCondition => {
  if (!condition || typeof condition !== 'object') return emptyCondition()
  const source = condition as Record<string, unknown>
  const operator = CONDITION_OPERATORS.some(
    (item) => item.value === source.operator
  )
    ? (source.operator as ConditionOperator)
    : 'equals'
  return {
    enabled: Boolean(source.enabled),
    fieldKey: String(source.fieldKey ?? ''),
    operator,
    value: String(source.value ?? ''),
  }
}

const normalizeConditionalValidation = (
  value: unknown
): ConditionalValidation => {
  const fallback = emptyValidation().conditional
  if (!value || typeof value !== 'object') return fallback
  const source = value as Record<string, unknown>
  const rule = CONDITIONAL_RULES.some((item) => item.value === source.rule)
    ? (source.rule as ConditionalRuleType)
    : 'required'
  return {
    enabled: Boolean(source.enabled),
    when: normalizeCondition(source.when),
    rule,
    ruleValue: String(source.ruleValue ?? ''),
    message: String(source.message ?? ''),
  }
}

const normalizeValidation = (value: unknown): FieldValidation => {
  const fallback = emptyValidation()
  if (!value || typeof value !== 'object') return fallback
  const source = value as Record<string, unknown>
  return {
    required: Boolean(source.required),
    minLength: String(source.minLength ?? ''),
    maxLength: String(source.maxLength ?? ''),
    pattern: String(source.pattern ?? ''),
    min: String(source.min ?? ''),
    max: String(source.max ?? ''),
    customMessage: String(source.customMessage ?? ''),
    conditional: normalizeConditionalValidation(source.conditional),
  }
}

const normalizeTableColumns = (value: unknown): TableColumn[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const rawType = normalizeFieldType(source.type)
      const type: FieldTypeWithoutTable =
        rawType === 'tableInput' ? 'text' : rawType
      const label = String(source.label ?? `Column ${index + 1}`)
      const key =
        slugifyKey(String(source.key ?? label)) || `column_${index + 1}`
      return {
        id: String(source.id ?? createId()),
        key,
        label,
        type,
        placeholder: String(source.placeholder ?? ''),
        defaultValue:
          source.defaultValue !== undefined
            ? source.defaultValue
            : defaultValueByType(type),
        options: normalizeOptionItems(source.options),
        validation: normalizeValidation(source.validation),
      }
    })
    .filter((item): item is TableColumn => item !== null)
}

const normalizeField = (raw: unknown, index: number): DesignerField => {
  if (!raw || typeof raw !== 'object') {
    return makeField('text', index + 1)
  }

  const source = raw as Record<string, unknown>
  const type = normalizeFieldType(source.type)
  const label = String(source.label ?? `Field ${index + 1}`)
  const key = slugifyKey(String(source.key ?? label)) || `field_${index + 1}`
  const tableColumns =
    type === 'tableInput'
      ? normalizeTableColumns(source.tableColumns).length > 0
        ? normalizeTableColumns(source.tableColumns)
        : [createTableColumn(1), createTableColumn(2)]
      : []
  const defaultValue =
    source.defaultValue !== undefined
      ? source.defaultValue
      : type === 'tableInput'
        ? [createDefaultTableRow({ tableColumns })]
        : defaultValueByType(type)

  return {
    id: String(source.id ?? createId()),
    key,
    label,
    helpText: String(source.helpText ?? ''),
    placeholder: String(source.placeholder ?? ''),
    type,
    defaultValue,
    options: normalizeOptionItems(source.options),
    validation: normalizeValidation(source.validation),
    visibility: normalizeCondition(source.visibility),
    tableColumns,
    tableMinRows: String(source.tableMinRows ?? ''),
    tableMaxRows: String(source.tableMaxRows ?? ''),
  }
}

const makeField = (type: FieldType, index: number): DesignerField => {
  const label = FIELD_TYPES.find((x) => x.value === type)?.label ?? 'Field'
  const keyBase = slugifyKey(label) || 'field'
  const tableColumns =
    type === 'tableInput' ? [createTableColumn(1), createTableColumn(2)] : []
  const defaultValue =
    type === 'tableInput'
      ? [createDefaultTableRow({ tableColumns })]
      : defaultValueByType(type)
  return {
    id: createId(),
    key: `${keyBase}_${index}`,
    label: `${label} ${index}`,
    helpText: '',
    placeholder: '',
    type,
    defaultValue,
    options: withStarterOptions(type),
    validation: emptyValidation(),
    visibility: emptyCondition(),
    tableColumns,
    tableMinRows: '',
    tableMaxRows: '',
  }
}

const shouldHaveOptions = (type: FieldType) =>
  type === 'select' || type === 'radio' || type === 'multiselect'

const isBooleanType = (type: FieldType) =>
  type === 'checkbox' || type === 'switch'

const parsePrimitive = (value: string): unknown => {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return value
}

const compareWithOperator = (
  left: unknown,
  operator: ConditionOperator,
  rightRaw: string
): boolean => {
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
  condition: FieldCondition,
  values: Record<string, unknown>
) => {
  if (!condition.enabled || !condition.fieldKey) return true
  return compareWithOperator(
    values[condition.fieldKey],
    condition.operator,
    condition.value
  )
}

type PropertyFieldConfig = {
  label: string
  helpText?: string
  placeholder: string
  defaultValue: unknown
  type: FieldTypeWithoutTable
  options: OptionItem[]
  validation: FieldValidation
  extra?: Record<string, unknown>
}

const getLeafPropertySchema = ({
  label,
  helpText,
  placeholder,
  defaultValue,
  type,
  options,
  validation,
  extra = {},
}: PropertyFieldConfig): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    title: label,
    description: helpText || undefined,
    default: defaultValue,
    'x-component': type,
    'x-placeholder': placeholder || undefined,
    ...extra,
  }

  if (type === 'number') {
    return {
      ...base,
      type: 'number',
      minimum:
        validation.min.trim() !== '' ? Number(validation.min) : undefined,
      maximum:
        validation.max.trim() !== '' ? Number(validation.max) : undefined,
    }
  }

  if (type === 'checkbox' || type === 'switch') {
    return { ...base, type: 'boolean' }
  }

  if (type === 'multiselect') {
    return {
      ...base,
      type: 'array',
      items: {
        type: 'string',
        enum: options.map((x) => x.value),
      },
      minItems:
        validation.required || validation.conditional.enabled ? 1 : undefined,
    }
  }

  if (type === 'file') {
    return {
      ...base,
      type: 'array',
      items: { type: 'string', contentMediaType: 'application/octet-stream' },
    }
  }

  if (type === 'select' || type === 'radio') {
    return {
      ...base,
      type: 'string',
      enum: options.map((x) => x.value),
      enumNames: options.map((x) => x.label),
    }
  }

  const format: Record<FieldTypeWithoutTable, string | undefined> = {
    text: undefined,
    textarea: undefined,
    email: 'email',
    password: undefined,
    number: undefined,
    date: 'date',
    'datetime-local': 'date-time',
    time: 'time',
    checkbox: undefined,
    switch: undefined,
    file: undefined,
    select: undefined,
    radio: undefined,
    multiselect: undefined,
    branchSelector: undefined,
    departmentSelector: undefined,
    roleDropdown: undefined,
    userSelector: undefined,
  }

  return {
    ...base,
    type: 'string',
    format: format[type],
    minLength:
      validation.minLength.trim() !== ''
        ? Number(validation.minLength)
        : undefined,
    maxLength:
      validation.maxLength.trim() !== ''
        ? Number(validation.maxLength)
        : undefined,
    pattern: validation.pattern || undefined,
  }
}

const getPropertySchema = (field: DesignerField): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    title: field.label,
    description: field.helpText || undefined,
    default: field.defaultValue,
    'x-component': field.type,
    'x-placeholder': field.placeholder || undefined,
    'x-visibleWhen': field.visibility.enabled ? field.visibility : undefined,
    'x-conditionalValidation': field.validation.conditional.enabled
      ? field.validation.conditional
      : undefined,
  }

  if (field.type === 'tableInput') {
    const rowProperties: Record<string, Record<string, unknown>> = {}
    const rowRequired: string[] = []

    field.tableColumns.forEach((column) => {
      rowProperties[column.key] = getLeafPropertySchema({
        label: column.label,
        placeholder: column.placeholder,
        defaultValue: column.defaultValue,
        type: column.type,
        options: column.options,
        validation: column.validation,
        extra: {
          'x-conditionalValidation': column.validation.conditional.enabled
            ? column.validation.conditional
            : undefined,
        },
      })
      if (column.validation.required) rowRequired.push(column.key)
    })

    return {
      ...base,
      type: 'array',
      minItems:
        field.tableMinRows.trim() !== ''
          ? Number(field.tableMinRows)
          : field.validation.required
            ? 1
            : undefined,
      maxItems:
        field.tableMaxRows.trim() !== ''
          ? Number(field.tableMaxRows)
          : undefined,
      items: {
        type: 'object',
        properties: rowProperties,
        required: rowRequired.length > 0 ? rowRequired : undefined,
      },
      'x-tableColumns': field.tableColumns,
    }
  }

  return getLeafPropertySchema({
    label: field.label,
    helpText: field.helpText,
    placeholder: field.placeholder,
    defaultValue: field.defaultValue,
    type: field.type,
    options: field.options,
    validation: field.validation,
    extra: base,
  })
}

const emitSchema = (blueprint: FormBlueprint, fields: DesignerField[]) => {
  const properties: Record<string, Record<string, unknown>> = {}
  const required: string[] = []

  for (const field of fields) {
    properties[field.key] = getPropertySchema(field)
    if (field.validation.required) required.push(field.key)
  }

  const schema: EmittedSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: blueprint.title,
    description: blueprint.description,
    type: 'object',
    properties,
    required,
    'x-layout': {
      columns: Number(blueprint.columns),
      submitLabel: blueprint.submitLabel,
    },
    'x-fields': fields.map((field) => ({
      ...field,
      required: field.validation.required,
    })),
  }

  return schema
}

const hasEmptyValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'boolean') return value === false
  return value === null || value === undefined || String(value).trim() === ''
}

const validateRule = (
  label: string,
  validation: FieldValidation,
  value: unknown,
  rule: ConditionalRuleType,
  ruleValue: string,
  message?: string
) => {
  const fallbackMessage = message || validation.customMessage || ''
  const text = String(value ?? '')
  const asNumber = Number(value)
  const parsedRuleValue = Number(ruleValue)

  if (rule === 'required') {
    return hasEmptyValue(value)
      ? fallbackMessage || `${label} is required`
      : undefined
  }

  if (rule === 'minLength' && !Number.isNaN(parsedRuleValue)) {
    return text.length < parsedRuleValue
      ? fallbackMessage ||
          `${label} must be at least ${parsedRuleValue} characters`
      : undefined
  }

  if (rule === 'maxLength' && !Number.isNaN(parsedRuleValue)) {
    return text.length > parsedRuleValue
      ? fallbackMessage ||
          `${label} must be at most ${parsedRuleValue} characters`
      : undefined
  }

  if (rule === 'pattern' && ruleValue.trim()) {
    try {
      const regex = new RegExp(ruleValue)
      return regex.test(text)
        ? undefined
        : fallbackMessage || `${label} does not match expected pattern`
    } catch {
      return 'Pattern in validation rule is invalid'
    }
  }

  if (rule === 'min' && !Number.isNaN(parsedRuleValue)) {
    return !Number.isNaN(asNumber) && asNumber < parsedRuleValue
      ? fallbackMessage || `${label} must be >= ${parsedRuleValue}`
      : undefined
  }

  if (rule === 'max' && !Number.isNaN(parsedRuleValue)) {
    return !Number.isNaN(asNumber) && asNumber > parsedRuleValue
      ? fallbackMessage || `${label} must be <= ${parsedRuleValue}`
      : undefined
  }

  return undefined
}

const validateByValidation = (
  label: string,
  validation: FieldValidation,
  value: unknown,
  values: Record<string, unknown>
) => {
  const base = validation
  if (base.required) {
    const requiredError = validateRule(
      label,
      validation,
      value,
      'required',
      '',
      ''
    )
    if (requiredError) return requiredError
  }

  if (base.minLength.trim()) {
    const error = validateRule(
      label,
      validation,
      value,
      'minLength',
      base.minLength,
      ''
    )
    if (error) return error
  }

  if (base.maxLength.trim()) {
    const error = validateRule(
      label,
      validation,
      value,
      'maxLength',
      base.maxLength,
      ''
    )
    if (error) return error
  }

  if (base.pattern.trim()) {
    const error = validateRule(
      label,
      validation,
      value,
      'pattern',
      base.pattern,
      ''
    )
    if (error) return error
  }

  if (base.min.trim()) {
    const error = validateRule(label, validation, value, 'min', base.min, '')
    if (error) return error
  }

  if (base.max.trim()) {
    const error = validateRule(label, validation, value, 'max', base.max, '')
    if (error) return error
  }

  if (
    base.conditional.enabled &&
    evaluateCondition(base.conditional.when, values)
  ) {
    const conditionalError = validateRule(
      label,
      validation,
      value,
      base.conditional.rule,
      base.conditional.ruleValue,
      base.conditional.message
    )
    if (conditionalError) return conditionalError
  }

  return undefined
}

const validateField = (
  field: DesignerField,
  value: unknown,
  values: Record<string, unknown>
) => {
  const baseError = validateByValidation(
    field.label,
    field.validation,
    value,
    values
  )
  if (baseError) return baseError

  if (field.type !== 'tableInput') return undefined

  const rows = Array.isArray(value) ? value : []
  const minRows = Number(field.tableMinRows)
  const maxRows = Number(field.tableMaxRows)
  if (
    !Number.isNaN(minRows) &&
    field.tableMinRows.trim() !== '' &&
    rows.length < minRows
  ) {
    return `${field.label} must have at least ${minRows} rows`
  }
  if (
    !Number.isNaN(maxRows) &&
    field.tableMaxRows.trim() !== '' &&
    rows.length > maxRows
  ) {
    return `${field.label} must have at most ${maxRows} rows`
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    if (!row || typeof row !== 'object') {
      return `${field.label} row ${rowIndex + 1} is invalid`
    }

    const rowValues = row as Record<string, unknown>
    for (const column of field.tableColumns) {
      const columnError = validateByValidation(
        `${field.label} - ${column.label}`,
        column.validation,
        rowValues[column.key],
        rowValues
      )
      if (columnError) {
        return `Row ${rowIndex + 1}: ${columnError}`
      }
    }
  }

  return undefined
}

const uiSelectValue = (value: string) => (value === '' ? '__empty__' : value)

const fromUiSelectValue = (value: string) =>
  value === '__empty__' ? '' : value

const inferFieldTypeFromProperty = (
  property: Record<string, unknown>
): FieldType => {
  const component = property['x-component']
  if (FIELD_TYPES.some((item) => item.value === component)) {
    return component as FieldType
  }
  if (property.type === 'array' && property['x-tableColumns'])
    return 'tableInput'
  if (property.type === 'array') return 'multiselect'
  if (property.type === 'boolean') return 'checkbox'
  if (property.type === 'number' || property.type === 'integer') return 'number'
  return 'text'
}

const hydrateFieldsFromProperties = (schema: Record<string, unknown>) => {
  const properties =
    schema.properties && typeof schema.properties === 'object'
      ? (schema.properties as Record<string, Record<string, unknown>>)
      : {}
  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.map((key) => String(key))
      : []
  )

  return Object.entries(properties).map(([key, property], index) => {
    const type = inferFieldTypeFromProperty(property)
    const field = makeField(type, index + 1)
    const normalized = normalizeField(
      {
        ...field,
        key,
        label: String(property.title ?? key),
        helpText: String(property.description ?? ''),
        placeholder: String(property['x-placeholder'] ?? ''),
        type,
        options:
          Array.isArray(property.enum) && Array.isArray(property.enumNames)
            ? (property.enum as unknown[]).map((value, optionIndex) => ({
                id: createId(),
                value: slugifyKey(String(value)),
                label: String(
                  (property.enumNames as unknown[])[optionIndex] ?? value
                ),
              }))
            : field.options,
        validation: {
          ...field.validation,
          required: required.has(key),
          minLength: String(property.minLength ?? ''),
          maxLength: String(property.maxLength ?? ''),
          pattern: String(property.pattern ?? ''),
          min: String(property.minimum ?? ''),
          max: String(property.maximum ?? ''),
          conditional: normalizeConditionalValidation(
            property['x-conditionalValidation']
          ),
        },
        visibility: normalizeCondition(property['x-visibleWhen']),
        tableColumns: normalizeTableColumns(property['x-tableColumns']),
      },
      index
    )

    if (
      normalized.type === 'tableInput' &&
      normalized.tableColumns.length === 0
    ) {
      normalized.tableColumns = [createTableColumn(1), createTableColumn(2)]
    }

    return normalized
  })
}

export default function UltraFormDesigner() {
  const queryClient = useQueryClient()

  const [blueprint, setBlueprint] = useState<FormBlueprint>({
    title: 'Form Designer',
    description:
      'Design a dynamic form with conditional rendering, cross-field validation, and custom field types.',
    submitLabel: 'Submit Dynamic Form',
    columns: '1',
  })

  const [fields, setFields] = useState<DesignerField[]>([
    {
      ...makeField('text', 1),
      key: 'customer_name',
      label: 'Customer Name',
      placeholder: 'Enter customer name',
      validation: { ...emptyValidation(), required: true, minLength: '3' },
    },
    {
      ...makeField('roleDropdown', 2),
      key: 'assigned_role',
      label: 'Assigned Role',
      validation: { ...emptyValidation(), required: true },
    },
    {
      ...makeField('branchSelector', 3),
      key: 'branch',
      label: 'Branch',
    },
  ])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [quickAddType, setQuickAddType] = useState<FieldType>('text')
  const [fieldSearch, setFieldSearch] = useState('')
  const [importSchemaText, setImportSchemaText] = useState('')
  const [schemaKeyInput, setSchemaKeyInput] = useState('')
  const [schemaNameInput, setSchemaNameInput] = useState('')
  const [schemaDescriptionInput, setSchemaDescriptionInput] = useState('')
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>('')
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submittedValues, setSubmittedValues] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [providerFilter, setProviderFilter] = useState('')

  const emittedSchema = useMemo(
    () => emitSchema(blueprint, fields),
    [blueprint, fields]
  )

  const {
    data: savedSchemas = [],
    isLoading: savedSchemasLoading,
    isError: savedSchemasError,
    error: savedSchemasErrorValue,
  } = useQuery({
    queryKey: ['wf-form-schemas', 'designer'],
    queryFn: () => listWorkflowFormSchemas(),
    staleTime: 60 * 1000,
  })

  const prefillCatalogQuery = useQuery({
    queryKey: ['wf-form-prefill-catalog'],
    queryFn: () => getWorkflowFormPrefillCatalog(),
    staleTime: 5 * 60 * 1000,
  })

  const prefillCatalog = prefillCatalogQuery.data as
    | WorkflowFormPrefillCatalog
    | undefined

  const filteredPrefillProviders = useMemo(() => {
    const source = prefillCatalog?.providers ?? []
    const keyword = providerFilter.trim().toLowerCase()
    if (!keyword) return source
    return source.filter((provider) => {
      const key = String(provider.key ?? '').toLowerCase()
      const description = String(provider.description ?? '').toLowerCase()
      return key.includes(keyword) || description.includes(keyword)
    })
  }, [prefillCatalog?.providers, providerFilter])

  const saveSchemaVersionMutation = useMutation({
    mutationFn: createWorkflowFormSchemaVersion,
    onSuccess: async (saved) => {
      toast.success(
        `Saved ${saved.schemaKey ?? 'schema'} v${saved.version ?? '?'}`
      )
      await queryClient.invalidateQueries({
        queryKey: ['wf-form-schemas', 'designer'],
      })
      if (saved.id) setSelectedSchemaId(String(saved.id))
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? `Failed to save schema: ${error.message}`
          : 'Failed to save schema.'
      )
    },
  })

  const { data: branchOptions, isLoading: branchesLoading } = useBranchOptions()
  const { data: departmentOptions, isLoading: departmentsLoading } =
    useDepartmentOptions()

  const { data: rolesResponse, isLoading: rolesLoading } = $api.useQuery(
    'get',
    '/roles/getAllRoles',
    {
      params: { header: { Authorization: '' } },
      staleTime: 5 * 60 * 1000,
    }
  ) as {
    data?: { data?: Array<{ id: string; roleName: string }> }
    isLoading: boolean
  }

  const { data: usersResponse, isLoading: usersLoading } = $api.useQuery(
    'get',
    '/user/get/AllUsers',
    {
      params: {
        header: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
        },
      },
    }
  ) as {
    data?: {
      data?: Array<{ username?: string; fullName?: string }>
    }
    isLoading: boolean
  }

  const roleOptions = useMemo(
    () =>
      (rolesResponse?.data ?? []).map((x) => ({
        label: x.roleName,
        value: x.id,
      })),
    [rolesResponse?.data]
  )

  const userOptions = useMemo(
    () =>
      (usersResponse?.data ?? [])
        .filter((x) => x.username)
        .map((x) => ({
          label: x.fullName || x.username || '',
          value: x.username || '',
        })),
    [usersResponse?.data]
  )

  const branchSelectorOptions = useMemo(
    () => (branchOptions ?? []).map((x) => ({ label: x.name, value: x.id })),
    [branchOptions]
  )

  const departmentSelectorOptions = useMemo(
    () =>
      (departmentOptions ?? []).map((x) => ({ label: x.name, value: x.id })),
    [departmentOptions]
  )

  const customLoading =
    branchesLoading || departmentsLoading || rolesLoading || usersLoading

  useEffect(() => {
    if (schemaKeyInput.trim() !== '') return
    const suggested = slugifyKey(blueprint.title)
    if (suggested) setSchemaKeyInput(suggested)
  }, [blueprint.title, schemaKeyInput])

  useEffect(() => {
    if (!activeFieldId && fields.length > 0) {
      setActiveFieldId(fields[0].id)
    }
    if (activeFieldId && !fields.some((x) => x.id === activeFieldId)) {
      setActiveFieldId(fields[0]?.id ?? null)
    }
  }, [activeFieldId, fields])

  useEffect(() => {
    setFormValues((prev) => {
      const next: Record<string, unknown> = {}
      let changed = false
      for (const field of fields) {
        if (field.key in prev) {
          next[field.key] = prev[field.key]
        } else {
          next[field.key] = field.defaultValue
          changed = true
        }
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [fields])

  const fieldKeyDuplicates = useMemo(() => {
    const counter = new Map<string, number>()
    fields.forEach((field) =>
      counter.set(field.key, (counter.get(field.key) ?? 0) + 1)
    )
    return new Set(
      Array.from(counter.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key)
    )
  }, [fields])

  const activeField = fields.find((x) => x.id === activeFieldId) ?? null
  const activeTableColumnDuplicates = useMemo(() => {
    if (!activeField || activeField.type !== 'tableInput')
      return new Set<string>()
    const counter = new Map<string, number>()
    activeField.tableColumns.forEach((column) =>
      counter.set(column.key, (counter.get(column.key) ?? 0) + 1)
    )
    return new Set(
      Array.from(counter.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key)
    )
  }, [activeField])
  const savedSchemaOptions = useMemo(
    () =>
      [...savedSchemas].sort((a, b) => {
        const aKey = (a.schemaKey ?? '').toLowerCase()
        const bKey = (b.schemaKey ?? '').toLowerCase()
        if (aKey !== bKey) return aKey.localeCompare(bKey)
        return (b.version ?? 0) - (a.version ?? 0)
      }),
    [savedSchemas]
  )
  const selectedSavedSchemaSummary = useMemo(
    () =>
      savedSchemaOptions.find(
        (schema) => Number(schema.id) === Number(selectedSchemaId)
      ),
    [savedSchemaOptions, selectedSchemaId]
  )
  const filteredFields = useMemo(() => {
    const query = fieldSearch.trim().toLowerCase()
    if (!query) return fields
    return fields.filter((field) =>
      `${field.label} ${field.key} ${field.type}`.toLowerCase().includes(query)
    )
  }, [fields, fieldSearch])

  const addField = (type: FieldType) => {
    setFields((prev) => {
      const next = [...prev, makeField(type, prev.length + 1)]
      setActiveFieldId(next[next.length - 1].id)
      return next
    })
  }

  const updateField = (
    fieldId: string,
    updater: (field: DesignerField) => DesignerField
  ) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? updater(f) : f)))
  }

  const updateTableColumn = (
    fieldId: string,
    columnId: string,
    updater: (column: TableColumn) => TableColumn
  ) => {
    updateField(fieldId, (field) => {
      if (field.type !== 'tableInput') return field
      return {
        ...field,
        tableColumns: field.tableColumns.map((column) =>
          column.id === columnId ? updater(column) : column
        ),
      }
    })
  }

  const addTableColumn = (fieldId: string) => {
    updateField(fieldId, (field) => {
      if (field.type !== 'tableInput') return field
      const nextColumn = createTableColumn(field.tableColumns.length + 1)
      const nextColumns = [...field.tableColumns, nextColumn]
      const existingRows = Array.isArray(field.defaultValue)
        ? (field.defaultValue as Array<Record<string, unknown>>)
        : []
      const nextRows =
        existingRows.length > 0
          ? existingRows.map((row) => ({
              ...row,
              [nextColumn.key]: nextColumn.defaultValue,
            }))
          : [createDefaultTableRow({ tableColumns: nextColumns })]
      return {
        ...field,
        tableColumns: nextColumns,
        defaultValue: nextRows,
      }
    })
  }

  const removeTableColumn = (fieldId: string, columnId: string) => {
    updateField(fieldId, (field) => {
      if (field.type !== 'tableInput') return field
      const target = field.tableColumns.find((column) => column.id === columnId)
      const nextColumns = field.tableColumns.filter(
        (column) => column.id !== columnId
      )
      const existingRows = Array.isArray(field.defaultValue)
        ? (field.defaultValue as Array<Record<string, unknown>>)
        : []
      const nextRows = existingRows.map((row) => {
        const copy = { ...row }
        if (target?.key) delete copy[target.key]
        return copy
      })

      return {
        ...field,
        tableColumns: nextColumns,
        defaultValue: nextRows,
      }
    })
  }

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((x) => x.id !== fieldId))
    setFormErrors((prev) => {
      const next = { ...prev }
      const key = fields.find((x) => x.id === fieldId)?.key
      if (key) delete next[key]
      return next
    })
  }

  const moveField = (fieldId: string, direction: -1 | 1) => {
    setFields((prev) => {
      const currentIndex = prev.findIndex((x) => x.id === fieldId)
      if (currentIndex < 0) return prev

      const targetIndex = currentIndex + direction
      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const copy = [...prev]
      const [current] = copy.splice(currentIndex, 1)
      copy.splice(targetIndex, 0, current)
      return copy
    })
  }

  const duplicateField = (fieldId: string) => {
    setFields((prev) => {
      const index = prev.findIndex((x) => x.id === fieldId)
      if (index < 0) return prev

      const source = prev[index]
      const clone: DesignerField = {
        ...source,
        id: createId(),
        key: `${source.key}_copy_${index + 1}`,
        label: `${source.label} (Copy)`,
        options: source.options.map((x) => ({ ...x, id: createId() })),
      }

      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return next
    })
  }

  const referenceFields = fields
    .filter((x) => x.id !== activeFieldId)
    .map((x) => ({ label: `${x.label} (${x.key})`, value: x.key }))

  const visibleRenderedFields = useMemo(
    () =>
      emittedSchema['x-fields'].filter((field) =>
        evaluateCondition(field.visibility, formValues)
      ),
    [emittedSchema, formValues]
  )

  const getChoiceOptions = (
    config: Pick<DesignerField, 'type' | 'options'>
  ): Array<{ label: string; value: string }> => {
    if (config.type === 'branchSelector') return branchSelectorOptions
    if (config.type === 'departmentSelector') return departmentSelectorOptions
    if (config.type === 'roleDropdown') return roleOptions
    if (config.type === 'userSelector') return userOptions
    return config.options.map((x) => ({ label: x.label, value: x.value }))
  }

  const onSubmitPreview = () => {
    const nextErrors: Record<string, string> = {}

    if (fieldKeyDuplicates.size > 0) {
      toast.error('Schema has duplicate field keys. Resolve before submitting.')
      return
    }

    visibleRenderedFields.forEach((field) => {
      const error = validateField(field, formValues[field.key], formValues)
      if (error) nextErrors[field.key] = error
    })

    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Form has validation errors.')
      return
    }

    const payload: Record<string, unknown> = {}
    fields.forEach((field) => {
      payload[field.key] = formValues[field.key]
    })
    setSubmittedValues(payload)
    toast.success('Form submitted in preview.')
  }

  const copySchema = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(emittedSchema, null, 2)
      )
      toast.success('Schema copied to clipboard.')
    } catch {
      toast.error('Unable to copy schema to clipboard.')
    }
  }

  const copyText = async (text: string, label = 'Path') => {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied.`)
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}.`)
    }
  }

  const normalizeRawSchemaFields = (
    rawFields: WorkflowFormSchemaRecord['fields']
  ) => {
    if (!Array.isArray(rawFields)) return [] as unknown[]
    return rawFields.map((field, index) => {
      const fallbackKey = `field_${index + 1}`
      let parsedConfig: Record<string, unknown> = {}
      if (field.fieldJson && field.fieldJson.trim()) {
        try {
          const parsed = JSON.parse(field.fieldJson) as Record<string, unknown>
          if (parsed && typeof parsed === 'object') parsedConfig = parsed
        } catch {
          parsedConfig = {}
        }
      }

      const key =
        slugifyKey(String(field.fieldKey ?? fallbackKey)) || fallbackKey
      const type = normalizeFieldType(field.fieldType)

      return {
        ...parsedConfig,
        key,
        label:
          String(field.fieldLabel ?? parsedConfig.label ?? key) ||
          `Field ${index + 1}`,
        type,
        validation: {
          ...normalizeValidation(parsedConfig.validation),
          required:
            Boolean(field.required) ||
            normalizeValidation(parsedConfig.validation).required,
        },
      }
    })
  }

  const applyImportedSchema = (
    parsed: Record<string, unknown>,
    rawFields?: WorkflowFormSchemaRecord['fields']
  ) => {
    const importedFieldsRaw = Array.isArray(parsed['x-fields'])
      ? (parsed['x-fields'] as unknown[])
      : Array.isArray(rawFields) && rawFields.length > 0
        ? normalizeRawSchemaFields(rawFields)
        : hydrateFieldsFromProperties(parsed)
    const importedFields = importedFieldsRaw.map((field, index) =>
      normalizeField(field, index)
    )

    if (importedFields.length === 0) {
      toast.error('No fields found in imported schema.')
      return false
    }

    const layout = parsed['x-layout']
    const blueprintFromImport: FormBlueprint = {
      title: String(parsed.title ?? 'Imported Form'),
      description: String(parsed.description ?? ''),
      submitLabel:
        layout && typeof layout === 'object'
          ? String(
              (layout as Record<string, unknown>).submitLabel ??
                'Submit Dynamic Form'
            )
          : 'Submit Dynamic Form',
      columns:
        layout &&
        typeof layout === 'object' &&
        Number((layout as Record<string, unknown>).columns) === 2
          ? '2'
          : '1',
    }

    setBlueprint(blueprintFromImport)
    setFields(importedFields)
    setActiveFieldId(importedFields[0]?.id ?? null)
    setFormErrors({})
    setSubmittedValues(null)
    return true
  }

  const handleSaveSchemaVersion = () => {
    if (fields.length === 0) {
      toast.error('Add at least one field before publishing a schema version.')
      return
    }
    if (fieldKeyDuplicates.size > 0) {
      toast.error('Resolve duplicate field keys before publishing.')
      return
    }

    const resolvedSchemaKey = slugifyKey(schemaKeyInput || blueprint.title)
    if (!resolvedSchemaKey) {
      toast.error('Schema key is required.')
      return
    }

    setSchemaKeyInput(resolvedSchemaKey)

    const schemaFields: WorkflowFormSchemaCreateFieldRequest[] = fields.map(
      (field, index) => ({
        fieldKey: field.key,
        fieldLabel: field.label,
        fieldType: field.type,
        fieldOrder: index + 1,
        required: field.validation.required,
        fieldJson: JSON.stringify({
          helpText: field.helpText,
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
          options: field.options,
          validation: field.validation,
          visibility: field.visibility,
          tableColumns: field.tableColumns,
          tableMinRows: field.tableMinRows,
          tableMaxRows: field.tableMaxRows,
        }),
      })
    )

    saveSchemaVersionMutation.mutate({
      schemaKey: resolvedSchemaKey,
      name:
        schemaNameInput.trim() ||
        blueprint.title.trim() ||
        `${resolvedSchemaKey}`,
      description:
        schemaDescriptionInput.trim() || blueprint.description.trim(),
      schemaJson: JSON.stringify(emittedSchema),
      fields: schemaFields,
    })
  }

  const loadSelectedSchemaVersion = async () => {
    const schemaId = Number(selectedSchemaId)
    if (!schemaId) {
      toast.error('Select a schema version to load.')
      return
    }

    try {
      const schema = await getWorkflowFormSchemaById(schemaId)
      const parsed =
        schema.schemaJson && schema.schemaJson.trim()
          ? (JSON.parse(schema.schemaJson) as Record<string, unknown>)
          : ({} as Record<string, unknown>)

      const loaded = applyImportedSchema(parsed, schema.fields)
      if (!loaded) return

      if (schema.schemaKey) setSchemaKeyInput(schema.schemaKey)
      setSchemaNameInput(schema.name ?? '')
      setSchemaDescriptionInput(schema.description ?? '')

      toast.success(
        `Loaded ${(schema.schemaKey ?? 'schema').trim()} v${schema.version ?? '?'}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to load schema: ${error.message}`
          : 'Failed to load schema.'
      )
    }
  }

  const loadSchemaFromJson = () => {
    try {
      const parsed = JSON.parse(importSchemaText) as Record<string, unknown>
      const loaded = applyImportedSchema(parsed)
      if (!loaded) return
      toast.success('Schema imported successfully.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : 'Import failed: invalid JSON'
      )
    }
  }

  const getTableRows = (field: EmittedField) => {
    const value = formValues[field.key]
    if (!Array.isArray(value)) return [] as Array<Record<string, unknown>>
    return value
      .filter((row) => row && typeof row === 'object')
      .map((row) => row as Record<string, unknown>)
  }

  const updateTableRows = (
    field: EmittedField,
    updater: (
      rows: Array<Record<string, unknown>>
    ) => Array<Record<string, unknown>>
  ) => {
    setFormValues((prev) => {
      const currentValue = prev[field.key]
      const currentRows = Array.isArray(currentValue)
        ? currentValue
            .filter((row) => row && typeof row === 'object')
            .map((row) => row as Record<string, unknown>)
        : []
      return {
        ...prev,
        [field.key]: updater(currentRows),
      }
    })
  }
  const formatImportJson = () => {
    try {
      const parsed = JSON.parse(importSchemaText)
      setImportSchemaText(JSON.stringify(parsed, null, 2))
      toast.success('JSON formatted.')
    } catch (e) {
      toast.error('Invalid JSON. Cannot format.')
      toast.error(e as string)
    }
  }

  return (
    <div className='bg-background/95 dark:bg-background/90 text-foreground border-primary/10 ring-primary/5 shadow-primary/5 flex h-[100dvh] flex-col overflow-y-auto border shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 backdrop-blur-3xl transition-all duration-500 md:h-[calc(100vh-4rem)] md:overflow-hidden lg:min-h-[700px] lg:rounded-2xl xl:h-[calc(100vh-2rem)] xl:rounded-3xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'>
      {/* 1. TOP APP BAR (Schema Management) */}
      <header className='bg-background/60 border-primary/10 z-20 flex shrink-0 flex-col items-center justify-between gap-4 border-b px-4 py-4 shadow-sm backdrop-blur-2xl md:flex-row md:px-6 dark:bg-black/40'>
        <div className='flex items-center gap-4'>
          <div className='from-primary/20 to-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'>
            <FileCode2 className='text-primary h-5 w-5' />
          </div>
          <div>
            <h1 className='from-primary bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent drop-shadow-sm'>
              Form Designer
            </h1>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <Sparkles className='h-3.5 w-3.5 text-amber-500' />
              Dynamic Schema Engine
            </div>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          {savedSchemasError && (
            <span className='text-destructive flex items-center gap-1 text-xs'>
              Error:{' '}
              {savedSchemasErrorValue instanceof Error
                ? savedSchemasErrorValue.message
                : 'Failed to load'}
            </span>
          )}
          <div className='mr-2 flex flex-col items-end'>
            {selectedSavedSchemaSummary && (
              <span className='text-muted-foreground text-[10px]'>
                Selected: {selectedSavedSchemaSummary.schemaKey} v
                {selectedSavedSchemaSummary.version}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2 border-r pr-4'>
            <Select
              value={selectedSchemaId || 'none'}
              onValueChange={(value) =>
                setSelectedSchemaId(value === 'none' ? '' : value)
              }
              disabled={savedSchemasLoading}
            >
              <SelectTrigger className='h-8 w-[200px] text-xs'>
                <SelectValue placeholder='Load saved schema...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>-- Select --</SelectItem>
                {savedSchemaOptions.map((schema) => (
                  <SelectItem key={schema.id} value={String(schema.id)}>
                    {(schema.schemaKey ?? 'schema').trim()} v
                    {schema.version ?? 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              className='h-8 text-xs'
              onClick={loadSelectedSchemaVersion}
              disabled={!selectedSchemaId}
            >
              <Eye className='mr-1.5 h-3.5 w-3.5' /> Load
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            <Input
              className='h-8 w-[180px] text-xs'
              value={schemaKeyInput}
              placeholder='Schema Key (e.g. branch_review)'
              onChange={(event) =>
                setSchemaKeyInput(slugifyKey(event.target.value))
              }
            />
            <Button
              type='button'
              size='sm'
              className='h-8 text-xs'
              onClick={handleSaveSchemaVersion}
              disabled={saveSchemaVersionMutation.isPending}
            >
              <Upload className='mr-1.5 h-3.5 w-3.5' />
              {saveSchemaVersionMutation.isPending
                ? 'Publishing...'
                : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH TABS */}
      <Tabs
        defaultValue='build'
        className='bg-muted/5 flex flex-1 flex-col overflow-hidden dark:bg-transparent'
      >
        <div className='bg-muted/30 dark:bg-muted/10 border-primary/5 no-scrollbar flex shrink-0 items-center justify-start overflow-x-auto scroll-smooth border-b px-4 py-3 shadow-inner md:justify-center'>
          <TabsList className='bg-muted/60 h-10 rounded-full p-1 shadow-inner'>
            <TabsTrigger
              value='build'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              ✨ Build Form
            </TabsTrigger>
            <TabsTrigger
              value='preview'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              👁️ Live Preview
            </TabsTrigger>
            <TabsTrigger
              value='output'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              Schema & Output
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- BUILD TAB (3-PANE LAYOUT) --- */}
        <TabsContent
          value='build'
          className='m-0 flex flex-1 flex-col overflow-y-auto p-0 md:flex-row md:overflow-hidden'
        >
          {/* LEFT PANE: Toolbox */}
          <div className='bg-muted/5 dark:bg-background/50 border-border/50 flex h-auto max-h-[35vh] w-full shrink-0 flex-col gap-4 border-b p-5 backdrop-blur-md transition-all md:h-full md:max-h-none md:w-64 md:gap-0 md:overflow-y-auto md:border-r md:border-b-0 lg:w-72'>
            <div className='mb-4 space-y-1'>
              <h2 className='text-sm font-semibold'>Toolbox</h2>
              <p className='text-muted-foreground text-xs'>
                Add fields to your form
              </p>
            </div>

            {/* Restored Quick Add Feature */}
            <div className='bg-card mb-4 space-y-2 rounded-md border p-3 shadow-sm'>
              <Label className='text-[10px] font-semibold uppercase'>
                Quick Add
              </Label>
              <div className='flex flex-col gap-2'>
                <Select
                  value={quickAddType}
                  onValueChange={(val: FieldType) => setQuickAddType(val)}
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.group} - {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type='button'
                  size='sm'
                  className='h-8 text-xs'
                  onClick={() => addField(quickAddType)}
                >
                  <Plus className='mr-1.5 h-3.5 w-3.5' /> Add
                </Button>
              </div>
            </div>

            <Separator className='my-2' />

            <div className='space-y-4 pt-2'>
              {(['Standard', 'Choice', 'Custom'] as const).map((group) => (
                <div key={group} className='space-y-1.5'>
                  <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                    {group}
                  </p>
                  <div className='grid grid-cols-1 gap-1'>
                    {FIELD_TYPES.filter((x) => x.group === group).map(
                      (type) => (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={type.value}
                        >
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='bg-background hover:border-border hover:bg-accent h-8 w-full justify-start border border-transparent text-xs shadow-sm'
                            onClick={() => addField(type.value)}
                          >
                            <Plus className='text-primary mr-2 h-3.5 w-3.5' />
                            {type.label}
                          </Button>
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER PANE: Canvas */}
          <div
            className='from-muted/20 via-background to-muted/10 dark:from-muted/5 dark:via-background dark:to-muted/5 relative flex max-h-[50vh] min-h-[400px] flex-1 flex-col items-center overflow-y-auto bg-gradient-to-br p-4 shadow-inner md:max-h-none md:p-8'
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)/0.15) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className='mt-4 w-full max-w-2xl space-y-4 pb-20'>
              <Card className='border-t-primary ring-primary/5 bg-card/80 dark:bg-card/40 hover:shadow-primary/5 border-t-4 shadow-lg ring-1 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl'>
                <CardContent className='space-y-4 p-5'>
                  <Input
                    className='focus-visible:border-b-primary rounded-none border-0 border-b bg-transparent px-0 text-2xl font-bold shadow-none focus-visible:ring-0'
                    value={blueprint.title}
                    placeholder='Form Title'
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  <Textarea
                    className='focus-visible:border-b-primary resize-none rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0'
                    value={blueprint.description}
                    placeholder='Form Description...'
                    rows={2}
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                  <div className='flex items-center gap-4 pt-2'>
                    <div className='flex-1 space-y-1'>
                      <Label className='text-muted-foreground text-xs'>
                        Submit Button Label
                      </Label>
                      <Input
                        className='h-8 text-xs'
                        value={blueprint.submitLabel}
                        onChange={(e) =>
                          setBlueprint((prev) => ({
                            ...prev,
                            submitLabel: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='w-32 space-y-1'>
                      <Label className='text-muted-foreground text-xs'>
                        Columns
                      </Label>
                      <Select
                        value={blueprint.columns}
                        onValueChange={(value: '1' | '2') =>
                          setBlueprint((prev) => ({ ...prev, columns: value }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1'>1 Column</SelectItem>
                          <SelectItem value='2'>2 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Restored Field Search */}
              {/* Restored Field Search */}
              <div className='flex items-center gap-2'>
                <Input
                  className='bg-card h-9 text-xs shadow-sm'
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder='Search fields...'
                />
                <Badge variant='outline'>
                  {filteredFields.length} / {fields.length}
                </Badge>
              </div>

              {/* Field Stats Summary - Build Tab */}
              {fields.length > 0 && (
                <div className='grid grid-cols-3 gap-2'>
                  <div className='bg-card flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm'>
                    <div className='bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full'>
                      <FileCode2 className='text-primary h-3.5 w-3.5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-[9px] font-medium tracking-wider uppercase'>
                        Total
                      </p>
                      <p className='text-xl leading-none font-bold'>
                        {fields.length}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 shadow-sm'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100'>
                      <Eye className='h-3.5 w-3.5 text-emerald-600' />
                    </div>
                    <div>
                      <p className='text-[9px] font-medium tracking-wider text-emerald-700 uppercase'>
                        Visible
                      </p>
                      <p className='text-xl leading-none font-bold text-emerald-700'>
                        {visibleRenderedFields.length}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 shadow-sm'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100'>
                      <EyeOff className='h-3.5 w-3.5 text-amber-600' />
                    </div>
                    <div>
                      <p className='text-[9px] font-medium tracking-wider text-amber-700 uppercase'>
                        Hidden
                      </p>
                      <p className='text-xl leading-none font-bold text-amber-700'>
                        {fields.length - visibleRenderedFields.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Field List (Using filteredFields) */}
              {filteredFields.length === 0 ? (
                <div className='border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center'>
                  <div className='bg-primary/10 mb-3 rounded-full p-3'>
                    <FileCode2 className='text-primary h-6 w-6' />
                  </div>
                  <p className='text-sm font-medium'>No fields found</p>
                  <p className='text-muted-foreground text-xs'>
                    Add a field or adjust your search.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {filteredFields.map((field) => {
                    const originalIndex = fields.findIndex(
                      (f) => f.id === field.id
                    )
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -15 }}
                        transition={{
                          duration: 0.25,
                          type: 'spring',
                          bounce: 0.2,
                        }}
                        key={field.id}
                        className={cn(
                          'group relative flex cursor-pointer flex-col rounded-xl border transition-all duration-500',
                          field.id === activeFieldId
                            ? 'border-primary ring-primary/30 from-primary/10 dark:from-primary/20 shadow-primary/10 z-10 scale-[1.02] bg-gradient-to-br to-transparent shadow-xl ring-2 backdrop-blur-sm dark:to-transparent'
                            : 'border-border bg-card/50 dark:bg-card/30 hover:border-primary/50 hover:bg-muted/50 dark:hover:bg-muted/20 backdrop-blur-sm hover:scale-[1.01] hover:shadow-lg'
                        )}
                        onClick={() => setActiveFieldId(field.id)}
                      >
                        <div
                          className={cn(
                            'absolute top-0 bottom-0 left-0 w-1.5 rounded-l-xl transition-all duration-300',
                            field.id === activeFieldId
                              ? 'from-primary bg-gradient-to-b to-purple-600'
                              : 'group-hover:bg-primary/20 bg-transparent'
                          )}
                        />
                        <div className='flex items-start justify-between gap-3 p-4 pl-3'>
                          <div className='text-muted-foreground/30 mt-1 flex flex-col items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
                            <GripVertical className='h-4 w-4' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <h3
                                className={cn(
                                  'truncate text-sm font-semibold transition-colors',
                                  field.id === activeFieldId
                                    ? 'text-primary'
                                    : ''
                                )}
                              >
                                {field.label || 'Untitled Field'}
                              </h3>
                              {field.validation.required && (
                                <span className='text-destructive text-xs font-bold'>
                                  *
                                </span>
                              )}
                              <Badge
                                variant={
                                  field.id === activeFieldId
                                    ? 'default'
                                    : 'secondary'
                                }
                                className='font-mono text-[9px]'
                              >
                                {field.type}
                              </Badge>
                            </div>
                            <p className='text-muted-foreground mt-1 font-mono text-[11px] break-all'>
                              Key:{' '}
                              <span className='bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-bold'>
                                {field.key}
                              </span>
                            </p>
                            {field.helpText && (
                              <p className='text-muted-foreground border-primary/20 mt-2 border-l-2 pl-2 text-xs leading-relaxed'>
                                {field.helpText}
                              </p>
                            )}
                          </div>

                          <div
                            className={cn(
                              'flex flex-col gap-1.5 transition-all duration-200',
                              field.id === activeFieldId
                                ? 'translate-x-0 opacity-100'
                                : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                            )}
                          >
                            <div className='bg-muted/50 flex rounded-md border p-0.5'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveField(field.id, -1)
                                }}
                                disabled={originalIndex === 0}
                              >
                                <MoveUp className='h-3 w-3' />
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveField(field.id, 1)
                                }}
                                disabled={originalIndex === fields.length - 1}
                              >
                                <MoveDown className='h-3 w-3' />
                              </Button>
                            </div>
                            <div className='flex justify-end gap-1'>
                              <Button
                                type='button'
                                variant='outline'
                                size='icon'
                                className='bg-background h-7 w-7'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateField(field.id)
                                }}
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                              <Button
                                type='button'
                                variant='outline'
                                size='icon'
                                className='text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground h-7 w-7'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeField(field.id)
                                }}
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Inspector */}
          <div className='bg-card/90 dark:bg-card/30 border-primary/10 z-10 flex min-h-[300px] w-full shrink-0 flex-col overflow-y-auto border-t shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.05)] backdrop-blur-2xl md:min-h-0 md:w-80 md:border-t-0 md:border-l lg:w-96 dark:shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.2)]'>
            {!activeField ? (
              <div className='text-muted-foreground to-muted/20 flex h-full flex-col items-center justify-center space-y-5 bg-gradient-to-b from-transparent p-8 text-center'>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className='bg-primary/5 ring-primary/20 rounded-2xl p-5 shadow-inner ring-1'
                >
                  <Settings2 className='text-primary/60 h-10 w-10 animate-pulse' />
                </motion.div>
                <div className='space-y-2'>
                  <p className='text-foreground text-lg font-bold tracking-tight'>
                    No field selected
                  </p>
                  <p className='mx-auto max-w-[200px] text-xs leading-relaxed opacity-80'>
                    Click any field on the canvas to configure its properties,
                    rules, and layout options here.
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex flex-col'>
                <div className='bg-card/95 border-primary/10 sticky top-0 z-10 border-b p-4 shadow-sm backdrop-blur-md'>
                  <h2 className='flex items-center gap-3 text-sm font-extrabold tracking-tight'>
                    Field Properties
                    <Badge
                      variant='secondary'
                      className='bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase'
                    >
                      {activeField.type}
                    </Badge>
                  </h2>
                </div>

                <div className='space-y-6 p-4'>
                  {/* SECTION: GENERAL */}
                  <div className='space-y-3'>
                    <h3 className='text-muted-foreground border-b pb-1 text-[10px] font-bold tracking-wider uppercase'>
                      General Info
                    </h3>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Label</Label>
                      <Input
                        className='h-8 text-xs'
                        value={activeField.label}
                        onChange={(e) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            label: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='flex justify-between text-xs'>
                        Data Key
                        {fieldKeyDuplicates.has(activeField.key) && (
                          <span className='text-destructive'>Duplicate</span>
                        )}
                      </Label>
                      <Input
                        className={cn(
                          'h-8 font-mono text-xs',
                          fieldKeyDuplicates.has(activeField.key) &&
                            'border-destructive focus-visible:ring-destructive'
                        )}
                        value={activeField.key}
                        onChange={(e) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            key: slugifyKey(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Field Type</Label>
                      <Select
                        value={activeField.type}
                        onValueChange={(nextType: FieldType) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            type: nextType,
                            options: shouldHaveOptions(nextType)
                              ? field.options.length > 0
                                ? field.options
                                : withStarterOptions(nextType)
                              : [],
                            defaultValue:
                              nextType === 'tableInput'
                                ? [
                                    createDefaultTableRow({
                                      tableColumns:
                                        field.tableColumns.length > 0
                                          ? field.tableColumns
                                          : [
                                              createTableColumn(1),
                                              createTableColumn(2),
                                            ],
                                    }),
                                  ]
                                : defaultValueByType(nextType),
                            tableColumns:
                              nextType === 'tableInput'
                                ? field.tableColumns.length > 0
                                  ? field.tableColumns
                                  : [createTableColumn(1), createTableColumn(2)]
                                : [],
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Placeholder</Label>
                      <Input
                        className='h-8 text-xs'
                        value={String(activeField.placeholder || '')}
                        onChange={(e) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            placeholder: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Help Text</Label>
                      <Textarea
                        className='min-h-[60px] text-xs'
                        value={activeField.helpText}
                        onChange={(e) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            helpText: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* SECTION: OPTIONS */}
                  {shouldHaveOptions(activeField.type) && (
                    <div className='space-y-3'>
                      <h3 className='text-muted-foreground flex items-center justify-between border-b pb-1 text-[10px] font-bold tracking-wider uppercase'>
                        Choices
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-5 px-2 text-[10px]'
                          onClick={() =>
                            updateField(activeField.id, (field) => ({
                              ...field,
                              options: [
                                ...field.options,
                                {
                                  id: createId(),
                                  label: `Option ${field.options.length + 1}`,
                                  value: `option_${field.options.length + 1}`,
                                },
                              ],
                            }))
                          }
                        >
                          + Add
                        </Button>
                      </h3>
                      <div className='space-y-2'>
                        {activeField.options.map((option) => (
                          <div key={option.id} className='flex gap-1.5'>
                            <Input
                              className='h-7 flex-1 text-xs'
                              value={option.label}
                              placeholder='Label'
                              onChange={(e) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  options: field.options.map((x) =>
                                    x.id === option.id
                                      ? { ...x, label: e.target.value }
                                      : x
                                  ),
                                }))
                              }
                            />
                            <Input
                              className='h-7 flex-1 font-mono text-xs'
                              value={option.value}
                              placeholder='value'
                              onChange={(e) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  options: field.options.map((x) =>
                                    x.id === option.id
                                      ? {
                                          ...x,
                                          value: slugifyKey(e.target.value),
                                        }
                                      : x
                                  ),
                                }))
                              }
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='text-destructive h-7 w-7 shrink-0'
                              onClick={() =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  options: field.options.filter(
                                    (x) => x.id !== option.id
                                  ),
                                }))
                              }
                            >
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION: TABLE CONFIGURATION */}
                  {activeField.type === 'tableInput' && (
                    <div className='space-y-3'>
                      <h3 className='text-primary border-primary/20 flex items-center gap-1 border-b pb-1 text-[10px] font-bold tracking-wider uppercase'>
                        <Table2 className='h-3 w-3' /> Table Structure
                      </h3>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-1'>
                          <Label className='text-[10px]'>Min Rows</Label>
                          <Input
                            type='number'
                            className='h-7 text-xs'
                            value={activeField.tableMinRows}
                            onChange={(e) =>
                              updateField(activeField.id, (field) => ({
                                ...field,
                                tableMinRows: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-[10px]'>Max Rows</Label>
                          <Input
                            type='number'
                            className='h-7 text-xs'
                            value={activeField.tableMaxRows}
                            onChange={(e) =>
                              updateField(activeField.id, (field) => ({
                                ...field,
                                tableMaxRows: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className='mt-4 flex items-center justify-between'>
                        <Label className='text-xs font-semibold'>Columns</Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-6 text-[10px]'
                          onClick={() => addTableColumn(activeField.id)}
                        >
                          + Col
                        </Button>
                      </div>
                      <div className='space-y-3'>
                        {activeField.tableColumns.map((column) => (
                          <Card key={column.id} className='bg-muted/30'>
                            <CardContent className='relative space-y-2 p-3'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='text-destructive absolute top-1 right-1 h-5 w-5'
                                onClick={() =>
                                  removeTableColumn(activeField.id, column.id)
                                }
                                disabled={activeField.tableColumns.length <= 1}
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                              <div className='pr-6'>
                                <Input
                                  className='h-7 text-xs font-semibold'
                                  value={column.label}
                                  onChange={(e) =>
                                    updateTableColumn(
                                      activeField.id,
                                      column.id,
                                      (c) => ({ ...c, label: e.target.value })
                                    )
                                  }
                                  placeholder='Col Label'
                                />
                              </div>
                              <div className='grid grid-cols-2 gap-2'>
                                {/* Restored ActiveTableColumnDuplicates logic */}
                                <Input
                                  className={cn(
                                    'h-7 font-mono text-[10px]',
                                    activeTableColumnDuplicates.has(
                                      column.key
                                    ) && 'border-destructive'
                                  )}
                                  value={column.key}
                                  onChange={(e) =>
                                    updateTableColumn(
                                      activeField.id,
                                      column.id,
                                      (c) => ({
                                        ...c,
                                        key: slugifyKey(e.target.value),
                                      })
                                    )
                                  }
                                  placeholder='col_key'
                                />
                                <Select
                                  value={column.type}
                                  onValueChange={(t: FieldTypeWithoutTable) =>
                                    updateTableColumn(
                                      activeField.id,
                                      column.id,
                                      (c) => ({
                                        ...c,
                                        type: t,
                                        defaultValue: defaultValueByType(t),
                                      })
                                    )
                                  }
                                >
                                  <SelectTrigger className='h-7 text-[10px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FIELD_TYPES.filter(
                                      (t) => t.value !== 'tableInput'
                                    ).map((t) => (
                                      <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION: VALIDATION */}
                  <div className='space-y-3'>
                    <h3 className='text-muted-foreground border-b pb-1 text-[10px] font-bold tracking-wider uppercase'>
                      Validation
                    </h3>
                    <div className='bg-card flex items-center justify-between rounded-md border p-2'>
                      <Label
                        className='cursor-pointer text-xs font-medium'
                        htmlFor='req-toggle'
                      >
                        Required Field
                      </Label>
                      <Switch
                        id='req-toggle'
                        checked={activeField.validation.required}
                        onCheckedChange={(checked) =>
                          updateField(activeField.id, (field) => ({
                            ...field,
                            validation: {
                              ...field.validation,
                              required: checked,
                            },
                          }))
                        }
                      />
                    </div>
                    {activeField.type !== 'tableInput' &&
                      !isBooleanType(activeField.type) &&
                      !shouldHaveOptions(activeField.type) && (
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='space-y-1.5'>
                            <Label className='text-xs'>Min Lngth</Label>
                            <Input
                              type='number'
                              className='h-7 text-xs'
                              value={activeField.validation.minLength}
                              onChange={(e) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  validation: {
                                    ...field.validation,
                                    minLength: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs'>Max Lngth</Label>
                            <Input
                              type='number'
                              className='h-7 text-xs'
                              value={activeField.validation.maxLength}
                              onChange={(e) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  validation: {
                                    ...field.validation,
                                    maxLength: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    {activeField.type === 'number' && (
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Min Value</Label>
                          <Input
                            type='number'
                            className='h-7 text-xs'
                            value={activeField.validation.min}
                            onChange={(e) =>
                              updateField(activeField.id, (field) => ({
                                ...field,
                                validation: {
                                  ...field.validation,
                                  min: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Max Value</Label>
                          <Input
                            type='number'
                            className='h-7 text-xs'
                            value={activeField.validation.max}
                            onChange={(e) =>
                              updateField(activeField.id, (field) => ({
                                ...field,
                                validation: {
                                  ...field.validation,
                                  max: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                    {activeField.type === 'text' && (
                      <div className='space-y-1.5'>
                        <Label className='text-xs'>Regex Pattern</Label>
                        <Input
                          className='h-7 font-mono text-xs'
                          placeholder='^[A-Z]+$'
                          value={activeField.validation.pattern}
                          onChange={(e) =>
                            updateField(activeField.id, (field) => ({
                              ...field,
                              validation: {
                                ...field.validation,
                                pattern: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* SECTION: ADVANCED LOGIC */}
                  <div className='space-y-3'>
                    <h3 className='text-muted-foreground border-b border-indigo-100 pb-1 text-[10px] font-bold tracking-wider text-indigo-600 uppercase'>
                      Advanced Logic
                    </h3>

                    <div className='space-y-2 rounded-md border border-indigo-100 bg-indigo-50/30 p-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs'>Show conditionally</Label>
                        <Switch
                          checked={activeField.visibility.enabled}
                          onCheckedChange={(checked) =>
                            updateField(activeField.id, (field) => ({
                              ...field,
                              visibility: {
                                ...field.visibility,
                                enabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                      {activeField.visibility.enabled && (
                        <div className='mt-2 space-y-2 border-t border-indigo-100/50 pt-2'>
                          <Select
                            value={uiSelectValue(
                              activeField.visibility.fieldKey
                            )}
                            onValueChange={(val) =>
                              updateField(activeField.id, (field) => ({
                                ...field,
                                visibility: {
                                  ...field.visibility,
                                  fieldKey: fromUiSelectValue(val),
                                },
                              }))
                            }
                          >
                            <SelectTrigger className='h-7 text-xs'>
                              <SelectValue placeholder='Select field' />
                            </SelectTrigger>
                            <SelectContent>
                              {referenceFields.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className='flex gap-2'>
                            <Select
                              value={activeField.visibility.operator}
                              onValueChange={(val: ConditionOperator) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  visibility: {
                                    ...field.visibility,
                                    operator: val,
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className='h-7 w-[100px] text-xs'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_OPERATORS.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className='h-7 flex-1 text-xs'
                              placeholder='Value'
                              value={activeField.visibility.value}
                              onChange={(e) =>
                                updateField(activeField.id, (field) => ({
                                  ...field,
                                  visibility: {
                                    ...field.visibility,
                                    value: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className='space-y-2 rounded-md border border-orange-100 bg-orange-50/30 p-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs'>
                          Validate conditionally
                        </Label>
                        <Switch
                          checked={activeField.validation.conditional.enabled}
                          onCheckedChange={(checked) =>
                            updateField(activeField.id, (field) => ({
                              ...field,
                              validation: {
                                ...field.validation,
                                conditional: {
                                  ...field.validation.conditional,
                                  enabled: checked,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      {activeField.validation.conditional.enabled && (
                        <div className='mt-2 space-y-2 border-t border-orange-100/50 pt-2'>
                          <p className='text-muted-foreground text-[10px]'>
                            When field...
                          </p>
                          <Select
                            value={uiSelectValue(
                              activeField.validation.conditional.when.fieldKey
                            )}
                            onValueChange={(val) =>
                              updateField(activeField.id, (f) => ({
                                ...f,
                                validation: {
                                  ...f.validation,
                                  conditional: {
                                    ...f.validation.conditional,
                                    when: {
                                      ...f.validation.conditional.when,
                                      fieldKey: fromUiSelectValue(val),
                                    },
                                  },
                                },
                              }))
                            }
                          >
                            <SelectTrigger className='h-7 text-xs'>
                              <SelectValue placeholder='Select field' />
                            </SelectTrigger>
                            <SelectContent>
                              {referenceFields.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className='flex gap-2'>
                            <Select
                              value={
                                activeField.validation.conditional.when.operator
                              }
                              onValueChange={(val: ConditionOperator) =>
                                updateField(activeField.id, (f) => ({
                                  ...f,
                                  validation: {
                                    ...f.validation,
                                    conditional: {
                                      ...f.validation.conditional,
                                      when: {
                                        ...f.validation.conditional.when,
                                        operator: val,
                                      },
                                    },
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className='h-7 w-[100px] text-xs'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_OPERATORS.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className='h-7 flex-1 text-xs'
                              placeholder='Value'
                              value={
                                activeField.validation.conditional.when.value
                              }
                              onChange={(e) =>
                                updateField(activeField.id, (f) => ({
                                  ...f,
                                  validation: {
                                    ...f.validation,
                                    conditional: {
                                      ...f.validation.conditional,
                                      when: {
                                        ...f.validation.conditional.when,
                                        value: e.target.value,
                                      },
                                    },
                                  },
                                }))
                              }
                            />
                          </div>

                          <p className='text-muted-foreground mt-2 text-[10px]'>
                            Enforce rule...
                          </p>
                          <div className='flex gap-2'>
                            <Select
                              value={activeField.validation.conditional.rule}
                              onValueChange={(val: ConditionalRuleType) =>
                                updateField(activeField.id, (f) => ({
                                  ...f,
                                  validation: {
                                    ...f.validation,
                                    conditional: {
                                      ...f.validation.conditional,
                                      rule: val,
                                    },
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className='h-7 flex-1 text-xs'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITIONAL_RULES.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className='h-7 flex-1 text-xs'
                              placeholder='Param'
                              disabled={
                                activeField.validation.conditional.rule ===
                                'required'
                              }
                              value={
                                activeField.validation.conditional.ruleValue
                              }
                              onChange={(e) =>
                                updateField(activeField.id, (f) => ({
                                  ...f,
                                  validation: {
                                    ...f.validation,
                                    conditional: {
                                      ...f.validation.conditional,
                                      ruleValue: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* --- PREVIEW TAB --- */}
        <TabsContent
          value='preview'
          className='from-muted/20 via-background to-muted/10 dark:from-muted/5 dark:via-background dark:to-muted/5 m-0 flex flex-1 justify-center overflow-y-auto bg-gradient-to-br p-4 md:p-8'
        >
          <div className='w-full max-w-3xl space-y-4'>
            {/* Field Stats Summary */}
            {fields.length > 0 && (
              <div className='grid grid-cols-3 gap-4'>
                <div className='group border-primary/10 from-card to-primary/5 relative flex items-center gap-4 rounded-2xl border bg-gradient-to-br px-5 py-4 shadow-sm transition-all hover:shadow-md'>
                  <div className='bg-primary/10 ring-primary/20 group-hover:bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ring-1 transition-colors'>
                    <FileCode2 className='text-primary h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                      Total Fields
                    </p>
                    <p className='text-foreground text-3xl leading-none font-black tracking-tight'>
                      {fields.length}
                    </p>
                  </div>
                </div>
                <div className='group from-card relative flex items-center gap-4 rounded-2xl border border-emerald-200/50 bg-gradient-to-br to-emerald-50/50 px-5 py-4 shadow-sm transition-all hover:border-emerald-300/60 hover:shadow-md'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 shadow-inner ring-1 ring-emerald-200 transition-colors group-hover:bg-emerald-200'>
                    <Eye className='h-5 w-5 text-emerald-600' />
                  </div>
                  <div>
                    <p className='text-[10px] font-bold tracking-widest text-emerald-700 uppercase'>
                      Visible
                    </p>
                    <p className='text-3xl leading-none font-black tracking-tight text-emerald-700'>
                      {visibleRenderedFields.length}
                    </p>
                  </div>
                </div>
                <div className='group from-card relative flex items-center gap-4 rounded-2xl border border-amber-200/50 bg-gradient-to-br to-amber-50/50 px-5 py-4 shadow-sm transition-all hover:border-amber-300/60 hover:shadow-md'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 shadow-inner ring-1 ring-amber-200 transition-colors group-hover:bg-amber-200'>
                    <EyeOff className='h-5 w-5 text-amber-600' />
                  </div>
                  <div>
                    <p className='text-[10px] font-bold tracking-widest text-amber-700 uppercase'>
                      Hidden
                    </p>
                    <p className='text-3xl leading-none font-black tracking-tight text-amber-700'>
                      {fields.length - visibleRenderedFields.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Field Breakdown Detail
            {fields.length > 0 && (
              <div className='bg-card overflow-hidden rounded-lg border shadow-sm'>
                <div className='bg-muted/30 flex items-center gap-2 border-b px-4 py-2.5'>
                  <Columns2 className='text-muted-foreground h-3.5 w-3.5' />
                  <span className='text-xs font-semibold'>Field Breakdown</span>
                  <span className='text-muted-foreground ml-auto text-[10px]'>
                    Updates live as conditions change
                  </span>
                </div>
                <div className='max-h-[180px] divide-y overflow-y-auto'>
                  {fields.map((field) => {
                    const isVisible = visibleRenderedFields.some(
                      (v) => v.id === field.id
                    )
                    return (
                      <div
                        key={field.id}
                        className='hover:bg-muted/40 flex items-center gap-3 px-4 py-2 text-xs transition-colors'
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {isVisible ? '✓' : '—'}
                        </span>
                        <span className='flex-1 truncate font-medium'>
                          {field.label}
                        </span>
                        <span className='text-muted-foreground max-w-[100px] truncate font-mono text-[10px]'>
                          {field.key}
                        </span>
                        <Badge
                          variant='secondary'
                          className='shrink-0 text-[9px]'
                        >
                          {field.type}
                        </Badge>
                        <span
                          className={`w-12 shrink-0 text-right text-[10px] font-medium ${isVisible ? 'text-emerald-600' : 'text-amber-500'}`}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )} */}

            <Card className='border-primary/10 ring-primary/5 overflow-hidden rounded-2xl shadow-2xl ring-1'>
              <CardHeader className='from-card to-muted border-primary/5 border-b bg-gradient-to-r px-8 pt-8 pb-5'>
                <CardTitle className='text-3xl font-extrabold tracking-tight'>
                  {blueprint.title || 'Live Preview'}
                </CardTitle>
                {blueprint.description && (
                  <CardDescription className='mt-3 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap opacity-90'>
                    {blueprint.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className='space-y-6 p-6'>
                {customLoading && (
                  <div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                    Loading remote options for select fields...
                  </div>
                )}

                <div
                  className={cn(
                    'grid gap-6',
                    blueprint.columns === '2' && 'md:grid-cols-2'
                  )}
                >
                  {visibleRenderedFields.map((field) => {
                    const value = formValues[field.key]
                    const error = formErrors[field.key]
                    const options = getChoiceOptions(field)

                    const renderInput = () => {
                      if (field.type === 'textarea')
                        return (
                          <Textarea
                            value={String(value ?? '')}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setFormValues((p) => ({
                                ...p,
                                [field.key]: e.target.value,
                              }))
                            }
                          />
                        )
                      if (field.type === 'switch')
                        return (
                          <Switch
                            checked={Boolean(value)}
                            onCheckedChange={(c) =>
                              setFormValues((p) => ({ ...p, [field.key]: c }))
                            }
                          />
                        )
                      if (field.type === 'checkbox')
                        return (
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              checked={Boolean(value)}
                              onCheckedChange={(c) =>
                                setFormValues((p) => ({
                                  ...p,
                                  [field.key]: Boolean(c),
                                }))
                              }
                            />
                            <Label className='text-sm font-normal'>
                              Yes/Agree
                            </Label>
                          </div>
                        )
                      if (
                        [
                          'select',
                          'branchSelector',
                          'departmentSelector',
                          'roleDropdown',
                          'userSelector',
                        ].includes(field.type)
                      ) {
                        return (
                          <Select
                            value={String(value ?? '')}
                            onValueChange={(val) =>
                              setFormValues((p) => ({ ...p, [field.key]: val }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={field.placeholder || 'Select...'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      }
                      if (field.type === 'radio') {
                        return (
                          <div className='space-y-2'>
                            {options.map((o) => (
                              <label
                                key={o.value}
                                className='flex items-center gap-2 text-sm'
                              >
                                <input
                                  type='radio'
                                  name={field.key}
                                  value={o.value}
                                  checked={String(value ?? '') === o.value}
                                  onChange={(e) =>
                                    setFormValues((p) => ({
                                      ...p,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                />
                                {o.label}
                              </label>
                            ))}
                          </div>
                        )
                      }

                      // Restored Interactive Table preview functionality
                      if (field.type === 'tableInput') {
                        const rows = getTableRows(field)
                        const maxRows = Number(field.tableMaxRows)
                        const canAddRow =
                          field.tableColumns.length > 0 &&
                          (field.tableMaxRows.trim() === '' ||
                            Number.isNaN(maxRows) ||
                            rows.length < maxRows)
                        return (
                          <div className='bg-background space-y-3 rounded-md border p-4'>
                            <div className='overflow-x-auto'>
                              <table className='w-full min-w-[500px] text-sm'>
                                <thead className='bg-muted/40 border-b'>
                                  <tr>
                                    {field.tableColumns.map((c) => (
                                      <th
                                        key={c.id}
                                        className='text-muted-foreground px-3 py-2 text-left font-medium'
                                      >
                                        {c.label}
                                      </th>
                                    ))}
                                    <th className='px-3 py-2'></th>
                                  </tr>
                                </thead>
                                <tbody className='divide-y'>
                                  {rows.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={field.tableColumns.length + 1}
                                        className='text-muted-foreground py-4 text-center text-xs'
                                      >
                                        No data
                                      </td>
                                    </tr>
                                  ) : (
                                    rows.map((r, i) => (
                                      <tr key={i}>
                                        {field.tableColumns.map((c) => (
                                          <td
                                            key={c.id}
                                            className='truncate px-3 py-2 text-xs'
                                          >
                                            {String(r[c.key] || '-')}
                                          </td>
                                        ))}
                                        <td className='px-3 py-2 align-top'>
                                          <Button
                                            type='button'
                                            variant='ghost'
                                            size='sm'
                                            className='text-destructive'
                                            onClick={() =>
                                              updateTableRows(
                                                field,
                                                (currentRows) =>
                                                  currentRows.filter(
                                                    (_, index) => index !== i
                                                  )
                                              )
                                            }
                                          >
                                            <Trash2 className='h-4 w-4' />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              disabled={!canAddRow}
                              onClick={() =>
                                updateTableRows(field, (currentRows) => [
                                  ...currentRows,
                                  createDefaultTableRow({
                                    tableColumns: field.tableColumns,
                                  }),
                                ])
                              }
                            >
                              <Plus className='mr-1.5 h-3.5 w-3.5' /> Add Row
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <Input
                          type={field.type}
                          value={String(value ?? '')}
                          placeholder={field.placeholder}
                          onChange={(e) =>
                            setFormValues((p) => ({
                              ...p,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      )
                    }

                    return (
                      <div
                        key={field.id}
                        className={cn(
                          'min-w-0 space-y-1.5',
                          blueprint.columns === '2' &&
                            field.type === 'tableInput' &&
                            'md:col-span-2'
                        )}
                      >
                        <Label className='text-foreground/90 flex items-center gap-1 font-semibold'>
                          {field.label}{' '}
                          {field.validation.required && (
                            <span className='text-destructive'>*</span>
                          )}
                        </Label>
                        {renderInput()}
                        {field.helpText && (
                          <p className='text-muted-foreground text-[11px]'>
                            {field.helpText}
                          </p>
                        )}
                        {error && (
                          <p className='text-destructive text-xs font-medium'>
                            {error}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              <div className='bg-muted/10 flex justify-end border-t p-6'>
                <Button
                  onClick={onSubmitPreview}
                  size='lg'
                  className='min-w-[140px] shadow-sm'
                >
                  <ClipboardCheck className='mr-2 h-4 w-4' />{' '}
                  {blueprint.submitLabel || 'Submit'}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* --- SCHEMA & OUTPUT TAB --- */}
        <TabsContent
          value='output'
          className='m-0 flex-1 space-y-6 overflow-y-auto p-6'
        >
          <div className='mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8'>
            <Card className='border-primary/10 ring-primary/5 overflow-hidden rounded-2xl shadow-lg ring-1'>
              <CardHeader className='from-card to-muted/50 border-primary/5 border-b bg-gradient-to-br pb-4'>
                <CardTitle className='flex items-center justify-between text-base'>
                  <div className='flex items-center gap-2 font-bold'>
                    <div className='bg-primary/10 ring-primary/20 rounded-lg p-1.5 ring-1'>
                      <Braces className='text-primary h-4 w-4' />
                    </div>
                    Emitted JSON Schema
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={copySchema}
                    className='hover:bg-primary hover:text-primary-foreground h-8 text-xs font-semibold shadow-sm transition-all duration-300'
                  >
                    <Copy className='mr-2 h-3.5 w-3.5' /> Copy JSON
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='h-[350px] border-none'>
                  <JsonEditor
                    value={JSON.stringify(emittedSchema, null, 2)}
                    onChange={() => {}}
                    height={350}
                    readOnly={true}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className='border-primary/10 ring-primary/5 overflow-hidden rounded-2xl shadow-lg ring-1'>
              <CardHeader className='from-card to-muted/50 border-primary/5 border-b bg-gradient-to-br pb-4'>
                <CardTitle className='flex items-center justify-between text-base'>
                  <div className='flex items-center gap-2 font-bold'>
                    <div className='rounded-lg bg-amber-500/10 p-1.5 ring-1 ring-amber-500/20'>
                      <Upload className='h-4 w-4 text-amber-600' />
                    </div>
                    Import JSON Schema
                  </div>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={formatImportJson}
                    disabled={!importSchemaText}
                    className='h-7 text-xs'
                  >
                    Format
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col p-0'>
                <div className='h-[300px]'>
                  <JsonEditor
                    value={importSchemaText}
                    onChange={setImportSchemaText}
                    height={300}
                  />
                </div>
                <div className='bg-muted/20 border-t p-4'>
                  <Button
                    onClick={loadSchemaFromJson}
                    disabled={!importSchemaText}
                    className='w-full font-bold shadow-md'
                    size='lg'
                  >
                    <Upload className='mr-2 h-4 w-4' /> Overwrite Current Canvas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Restored Prefill Catalog */}
            <Card className='shadow-sm md:col-span-2'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Sparkles className='h-4 w-4' /> Prefill Catalog
                </CardTitle>
                <CardDescription>
                  Discover available binding paths and provider outputs for{' '}
                  <code>x-prefill.path</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {prefillCatalogQuery.isLoading ? (
                  <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                    Loading provider catalog...
                  </div>
                ) : prefillCatalogQuery.isError ? (
                  <div className='text-destructive rounded-md border border-dashed p-4 text-sm'>
                    Failed to load provider catalog.
                  </div>
                ) : (
                  <div className='grid gap-6 md:grid-cols-2'>
                    {/* Common context paths */}
                    <div className='space-y-2'>
                      <p className='text-xs font-semibold uppercase'>
                        Common context paths
                      </p>
                      <div className='max-h-[250px] space-y-2 overflow-auto pr-1'>
                        {(prefillCatalog?.contextPaths ?? []).map((item) => (
                          <div
                            key={item.path}
                            className='grid gap-2 rounded-md border p-2 sm:grid-cols-[minmax(0,1fr)_auto]'
                          >
                            <div className='min-w-0 space-y-1'>
                              <p className='font-mono text-xs break-all'>
                                {item.path}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {(item.type ?? 'unknown') + ' - '}{' '}
                                {item.description ?? ''}
                              </p>
                            </div>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                copyText(String(item.path), 'Path')
                              }
                            >
                              <Copy className='mr-1.5 h-3.5 w-3.5' /> Copy
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Providers List */}
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='text-xs font-semibold uppercase'>
                          Providers ({filteredPrefillProviders.length})
                        </p>
                        <Input
                          value={providerFilter}
                          onChange={(e) => setProviderFilter(e.target.value)}
                          placeholder='Filter providers...'
                          className='h-8 max-w-[200px] text-xs'
                        />
                      </div>
                      <div className='max-h-[250px] space-y-3 overflow-auto pr-1'>
                        {filteredPrefillProviders.length === 0 ? (
                          <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
                            No provider matched.
                          </div>
                        ) : (
                          filteredPrefillProviders.map((provider) => (
                            <div
                              key={provider.key}
                              className='space-y-2 rounded-md border p-3'
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <p className='text-sm font-semibold'>
                                    {provider.key}
                                  </p>
                                  <p className='text-muted-foreground text-[10px]'>
                                    {provider.description}
                                  </p>
                                </div>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  className='h-6 text-[10px]'
                                  onClick={() =>
                                    copyText(
                                      String(provider.bindingPrefix),
                                      'Prefix'
                                    )
                                  }
                                >
                                  Copy Prefix
                                </Button>
                              </div>
                              <div className='bg-muted/40 rounded p-2 font-mono text-xs break-all'>
                                Prefix: {provider.bindingPrefix}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submitted Payload Viewer */}
            <Card className='shadow-sm'>
              <CardHeader className='to-card border-b border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 pb-4'>
                <CardTitle className='flex items-center gap-2 text-base font-bold text-indigo-900 dark:text-indigo-100'>
                  <div className='rounded-lg bg-indigo-500/10 p-1.5 ring-1 ring-indigo-500/20'>
                    <FileInput className='h-4 w-4 text-indigo-600' />
                  </div>
                  Form Submission Payload
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                {submittedValues ? (
                  <div className='h-[300px]'>
                    <JsonEditor
                      value={JSON.stringify(submittedValues, null, 2)}
                      onChange={() => {}}
                      height={300}
                      readOnly={true}
                    />
                  </div>
                ) : (
                  <div className='flex items-center justify-center border-dashed border-indigo-100/50 bg-indigo-50/30 py-16 text-sm font-medium text-indigo-400'>
                    Submit the form in the 'Live Preview' tab.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className='overflow-hidden rounded-2xl border-emerald-200/50 shadow-lg ring-1 ring-emerald-500/10'>
              <CardHeader className='to-card border-b border-emerald-100/50 bg-gradient-to-br from-emerald-50/80 pb-4'>
                <CardTitle className='flex items-center gap-2 text-base font-bold text-emerald-900 dark:text-emerald-100'>
                  <div className='rounded-lg bg-emerald-500/10 p-1.5 ring-1 ring-emerald-500/20'>
                    <Columns2 className='h-4 w-4 text-emerald-600' />
                  </div>
                  Runtime Notes
                </CardTitle>
              </CardHeader>
              <CardContent className='bg-card space-y-4 p-6 text-sm'>
                <div className='space-y-3'>
                  <p className='text-muted-foreground flex gap-2'>
                    <span className='font-mono font-bold text-emerald-600'>
                      01
                    </span>
                    Custom field types fetch real options from existing frontend
                    APIs.
                  </p>
                  <p className='text-muted-foreground flex gap-2'>
                    <span className='font-mono font-bold text-emerald-600'>
                      02
                    </span>
                    Conditional visibility and conditional validation are
                    evaluated at runtime.
                  </p>
                  <p className='text-muted-foreground flex gap-2'>
                    <span className='font-mono font-bold text-emerald-600'>
                      03
                    </span>
                    Schema output includes extensions (<code>x-fields</code>,{' '}
                    <code>x-visibleWhen</code>) for dynamic behavior.
                  </p>
                </div>
                <div className='mt-6 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-800 shadow-inner ring-1 ring-emerald-100'>
                  <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                  <span className='text-sm font-semibold tracking-tight'>
                    Designer and renderer are perfectly synchronized.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

type JsonEditorProps = {
  value: string
  onChange: (next: string) => void
  height?: number
  readOnly?: boolean
}

function JsonEditor({
  value,
  onChange,
  height = 320,
  readOnly = false,
}: JsonEditorProps) {
  const options = useMemo(
    () => ({
      readOnly,
      minimap: { enabled: false },
      fontSize: 12,
      lineNumbers: 'on' as const,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on' as const,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      folding: true,
    }),
    [readOnly]
  )

  return (
    <div className='overflow-hidden rounded-md border'>
      <Editor
        height={height}
        language='json'
        value={value}
        onChange={(v: string | undefined) => onChange(v ?? '')}
        options={options}
      />
    </div>
  )
}
