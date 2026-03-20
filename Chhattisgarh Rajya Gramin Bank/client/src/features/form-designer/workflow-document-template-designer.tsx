import {
  JSX,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror from '@uiw/react-codemirror'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Columns2,
  Download,
  Eye,
  FileJson2,
  MoveDown,
  MoveUp,
  Plus,
  Redo2,
  Save,
  Search,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
// import { Settings2, Database, PenTool } from 'lucide-react';
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  createWorkflowDocumentBlockPreset,
  createWorkflowDocumentTemplateVersion,
  deleteWorkflowDocumentBlockPreset,
  downloadWorkflowDocumentTemplatePreview,
  listWorkflowDocumentBlockPresets,
  listWorkflowDocumentTemplates,
  type WorkflowDocumentBlockPresetRecord,
  type WorkflowDocumentTemplateRecord,
} from '@/features/form-designer/workflow-document-template-api.ts'

type BlockType =
  | 'section'
  | 'group'
  | 'heading'
  | 'paragraph'
  | 'kv'
  | 'table'
  | 'divider'
  | 'spacer'
  | 'pageBreak'
type ProviderKey = 'customerProfile' | 'accountProfile' | 'userProfile'
type LayoutMode = 'split' | 'designer' | 'preview'
type PreviewMode = 'preview' | 'json'
type DesignerMode = 'basic' | 'advanced'
type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'exists'
  | 'notExists'
type ConditionValueMode = 'literal' | 'path'
type BindingTarget =
  | 'valuePath'
  | 'rowsPath'
  | 'text'
  | 'value'
  | 'visibleWhenPath'
type TableColumnAlign = 'left' | 'center' | 'right'
type DesignerTab = 'build' | 'preview' | 'settings'

type InspectorSectionKey =
  | 'content'
  | 'binding'
  | 'table'
  | 'defaultRows'
  | 'columns'
  | 'style'
  | 'visibility'
  | 'advanced'

type InlineIssue = {
  level: 'error' | 'warning'
  message: string
}

const BLOCK_TYPE_META: Record<
  BlockType,
  {
    short: string
    badgeClass: string
    chipClass: string
  }
> = {
  section: {
    short: 'S',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    chipClass: 'bg-sky-100 text-sky-700',
  },
  group: {
    short: 'G',
    badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    chipClass: 'bg-indigo-100 text-indigo-700',
  },
  heading: {
    short: 'H',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
    chipClass: 'bg-violet-100 text-violet-700',
  },
  paragraph: {
    short: 'P',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
    chipClass: 'bg-slate-100 text-slate-700',
  },
  kv: {
    short: 'KV',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    chipClass: 'bg-emerald-100 text-emerald-700',
  },
  table: {
    short: 'T',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    chipClass: 'bg-amber-100 text-amber-700',
  },
  divider: {
    short: '—',
    badgeClass: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    chipClass: 'bg-zinc-100 text-zinc-700',
  },
  spacer: {
    short: 'SP',
    badgeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    chipClass: 'bg-cyan-100 text-cyan-700',
  },
  pageBreak: {
    short: 'PB',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    chipClass: 'bg-rose-100 text-rose-700',
  },
}

const buildBlockSearchText = (block: BlockDraft) =>
  [
    block.type,
    block.text,
    block.textKey,
    block.label,
    block.labelKey,
    block.value,
    block.valuePath,
    block.rowsPath,
    block.visibleWhenPath,
    block.visibleWhenValue,
    block.visibleWhenValuePath,
    block.computedPathA,
    block.computedPathB,
    block.columnsJson,
  ]
    .join(' ')
    .toLowerCase()

const createEmptyInspectorSectionState = (): Record<
  InspectorSectionKey,
  boolean
> => ({
  content: false,
  binding: false,
  table: false,
  defaultRows: false,
  columns: false,
  style: false,
  visibility: false,
  advanced: true,
})

const createEmptySectionIssues = (): Record<
  InspectorSectionKey,
  InlineIssue[]
> => ({
  content: [],
  binding: [],
  table: [],
  defaultRows: [],
  columns: [],
  style: [],
  visibility: [],
  advanced: [],
})

const getBlockSectionIssues = (
  block: BlockDraft
): Record<InspectorSectionKey, InlineIssue[]> => {
  const issues = createEmptySectionIssues()

  if (
    (block.type === 'section' ||
      block.type === 'group' ||
      block.type === 'heading' ||
      block.type === 'paragraph') &&
    !block.text.trim() &&
    !block.textKey.trim()
  ) {
    issues.content.push({
      level: 'warning',
      message: 'Set either Text or Translation Key.',
    })
  }

  if (block.type === 'kv') {
    if (!block.label.trim() && !block.labelKey.trim()) {
      issues.content.push({
        level: 'warning',
        message: 'KV block should have Label or Label Key.',
      })
    }

    if (block.valueMode === 'path' && !block.valuePath.trim()) {
      issues.binding.push({
        level: 'error',
        message: 'Value Path is required in Path mode.',
      })
    }

    if (block.valueMode === 'template' && !block.value.trim()) {
      issues.binding.push({
        level: 'warning',
        message: 'Template expression is empty.',
      })
    }

    if (block.valueMode === 'computed') {
      if (
        block.computedType === 'concat' &&
        !block.computedPathA.trim() &&
        !block.computedPathB.trim()
      ) {
        issues.binding.push({
          level: 'error',
          message: 'Concat mode needs at least one source path.',
        })
      }

      if (
        (block.computedType === 'dateFormat' ||
          block.computedType === 'currencyFormat') &&
        !block.computedPathA.trim()
      ) {
        issues.binding.push({
          level: 'error',
          message: 'Computed source path is required.',
        })
      }
    }
  }

  if (block.type === 'table') {
    if (!block.rowsPath.trim()) {
      issues.table.push({
        level: 'warning',
        message:
          'Rows Path is empty. Preview will depend on Default Rows only.',
      })
    }

    const parsed = parseTableColumnsDraft(block.columnsJson)

    if (!parsed.isValid) {
      issues.advanced.push({
        level: 'error',
        message: 'Raw Columns JSON is invalid.',
      })
    }

    if (parsed.columns.length === 0) {
      issues.columns.push({
        level: 'warning',
        message: 'Add at least one table column.',
      })
    }

    parsed.columns.forEach((column, index) => {
      if (!column.header.trim() && !column.headerKey.trim()) {
        issues.columns.push({
          level: 'warning',
          message: `Column ${index + 1} should have Header or Header Key.`,
        })
      }
      if (!column.valuePath.trim()) {
        issues.columns.push({
          level: 'error',
          message: `Column ${index + 1} needs a Value Path.`,
        })
      }
    })

    if (!Array.isArray(block.defaultRows) || block.defaultRows.length === 0) {
      issues.defaultRows.push({
        level: 'warning',
        message: 'No Default Rows added yet.',
      })
    }
  }

  const parsedFontSize = parseOptionalNumber(block.fontSize)
  if (parsedFontSize != null && parsedFontSize <= 0) {
    issues.style.push({
      level: 'warning',
      message: 'Font Size should be greater than 0.',
    })
  }

  const parsedLineHeight = parseOptionalNumber(block.lineHeight)
  if (parsedLineHeight != null && parsedLineHeight < 0.8) {
    issues.style.push({
      level: 'warning',
      message: 'Line Height below 0.8 may reduce readability.',
    })
  }

  if (block.visibleWhenEnabled && !block.visibleWhenPath.trim()) {
    issues.visibility.push({
      level: 'error',
      message: 'Condition Path is required when visibility is enabled.',
    })
  }

  if (
    block.visibleWhenEnabled &&
    block.visibleWhenValueMode === 'path' &&
    !block.visibleWhenValuePath.trim()
  ) {
    issues.visibility.push({
      level: 'error',
      message: 'Compare Path is required in path-based condition mode.',
    })
  }

  return issues
}
type TableColumnFormat =
  | 'text'
  | 'currency'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
type ValueMode = 'path' | 'template' | 'computed'
type ComputedType = 'concat' | 'dateFormat' | 'currencyFormat'
type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold'

type BlockDraft = {
  id: string
  type: BlockType
  text: string
  textKey: string
  label: string
  labelKey: string
  value: string
  valuePath: string
  valueMode: ValueMode
  computedType: ComputedType
  computedPathA: string
  computedPathB: string
  computedSeparator: string
  computedPattern: string
  computedCurrencySymbol: string
  rowsPath: string
  columnsJson: string
  height: string
  visibleWhenEnabled: boolean
  visibleWhenPath: string
  visibleWhenOperator: ConditionOperator
  visibleWhenValue: string
  visibleWhenValueMode: ConditionValueMode
  visibleWhenValuePath: string
  fontSize: string
  align: 'left' | 'center' | 'right'
  bold: boolean
  fontWeight: FontWeight
  spacingTop: string
  spacingBottom: string
  lineHeight: string
  defaultRows: Array<Record<string, string>>
}

type TableColumnDraft = {
  id: string
  header: string
  headerKey: string
  valuePath: string
  align: TableColumnAlign
  width: string
  format: TableColumnFormat
}

type PresetBlockDraft = Omit<BlockDraft, 'id'>

type BlockPreset = {
  id: string
  name: string
  blocks: PresetBlockDraft[]
  source: 'builtin' | 'server'
  serverPresetId?: number
}

type LocalDesignerDraft = {
  version: number
  savedAt: string
  data: {
    templateKey: string
    name: string
    description: string
    defaultLocale: string
    title: string
    titleKey: string
    fileNamePattern: string
    importJson: string
    blocks: BlockDraft[]
    sources: DataSourceDraft[]
    translations?: TranslationEntry[]
    translationsByLocale?: Record<string, TranslationEntry[]>
    translationEditorLocale?: string
    layoutMode: LayoutMode
    previewMode: PreviewMode
    useBankTheme: boolean
    showHeaderFooter: boolean
    marginTop: string
    marginRight: string
    marginBottom: string
    marginLeft: string
    bannerHeight: string
    designerMode: DesignerMode
    bindingTarget: BindingTarget
    selectedBlockId: string | null
    compareTemplateId: string
    diffMode: 'visual' | 'json'
    previewTaskIdInput: string
    bindingTesterContextJson: string
    bindingTesterExpression: string
    bindingTesterMode: 'path' | 'template'
    useBindingTesterForPreview: boolean
  }
}

type TranslationEntry = {
  id: string
  key: string
  value: string
}

type TranslationLocaleMap = Record<string, TranslationEntry[]>

type DataSourceDraft = {
  id: string
  alias: string
  provider: ProviderKey
  paramsJson: string
}

type TemplateExample = {
  id: string
  label: string
  description: string
  templateKey: string
  name: string
  defaultLocale: string
  title: string
  titleKey: string
  fileNamePattern: string
  translations: Array<{ key: string; value: string }>
  sources: Array<{ alias: string; provider: ProviderKey; paramsJson: string }>
  blocks: Array<Partial<Omit<BlockDraft, 'id'>> & Pick<BlockDraft, 'type'>>
}

type GenericRecord = Record<string, unknown>
type DefaultRow = Record<string, string>

const getDefaultRowKey = (col: TableColumnDraft) => {
  const fromPath = (col.valuePath || '').trim().replace(/^item\./, '')
  if (fromPath) return fromPath

  const base = (col.headerKey || col.header || col.id || 'column').trim()
  return `col_${slugify(base)}`
}
const SAMPLE_CONTEXT: GenericRecord = {
  instance: { businessKey: 'WF-2026-0001' },
  task: { id: 4507 },
  forms: {
    current: { applicantName: 'Ravi Kumar', amount: 1200000 },
  },
  documents: {
    current: [
      { docType: 'KYC', url: '/files/kyc.pdf' },
      { docType: 'INCOME_PROOF', url: '/files/income.pdf' },
    ],
  },
  providers: {
    customer: { firstName: 'Ravi', lastName: 'Kumar' },
    account: { accountNo: '1234567890', branchCode: '001' },
    user: { username: 'agm_user', fullName: 'A. G. Manager' },
  },
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120)

const toStringSafe = (value: unknown) =>
  typeof value === 'string' ? value : value == null ? '' : String(value)

const toBooleanSafe = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return fallback
}

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toComparableString = (value: unknown) =>
  value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)

const normalizeLocaleCode = (value: string, fallback = 'en-IN') => {
  const normalized = value.trim()
  return normalized || fallback
}

const evaluateCondition = (
  operator: ConditionOperator,
  actual: unknown,
  expected: unknown
) => {
  const actualText = toComparableString(actual)
  const expectedText = toComparableString(expected).trim()
  if (operator === 'equals') return actualText === expectedText
  if (operator === 'notEquals') return actualText !== expectedText
  if (operator === 'contains') {
    if (Array.isArray(actual))
      return actual.some((item) => toComparableString(item) === expectedText)
    return actualText.includes(expectedText)
  }
  if (operator === 'exists')
    return actual != null && toComparableString(actual) !== ''
  return actual == null || toComparableString(actual) === ''
}

const isRecord = (value: unknown): value is GenericRecord =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const resolvePath = (root: unknown, path: string): unknown => {
  if (!path.trim()) return undefined
  const segments = path.replace(/^\$\./, '').split('.')
  let current: unknown = root
  for (const segment of segments) {
    if (!segment) continue
    const indexed = segment.match(/^([^[]+)(\[(\d+)])?$/)
    const key = indexed?.[1] ?? segment
    const index = indexed?.[3] != null ? Number(indexed[3]) : undefined
    if (!isRecord(current)) return undefined
    current = current[key]
    if (index != null) {
      if (!Array.isArray(current) || index < 0 || index >= current.length) {
        return undefined
      }
      current = current[index]
    }
  }
  return current
}

const formatCell = (value: unknown, format: TableColumnFormat) => {
  if (value == null) return ''
  if (format === 'boolean') return value ? 'Yes' : 'No'

  if (format === 'date' || format === 'datetime') {
    const date = toDateSafe(value)
    if (!date) return toStringSafe(value)
    return format === 'date'
      ? formatDateByPattern(date, 'dd MMM yyyy')
      : formatDateByPattern(date, 'dd MMM yyyy HH:mm')
  }

  if (format === 'number') {
    const n = toNumberSafe(value)
    return n == null
      ? toStringSafe(value)
      : new Intl.NumberFormat('en-IN').format(n)
  }

  if (format === 'currency') {
    const n = toNumberSafe(value)
    if (n == null) return toStringSafe(value)
    return `Rs. ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)}`
  }

  return toStringSafe(value)
}

const resolveItemPath = (row: unknown, path: string) => {
  // columns use "item.xxx" convention in your JSON
  const cleaned = (path || '').trim()
  if (!cleaned) return undefined
  if (cleaned.startsWith('item.')) {
    return resolvePath({ item: row }, cleaned)
  }
  // allow direct paths too
  return resolvePath(row, cleaned)
}

const interpolate = (
  text: string,
  translations: Record<string, string>,
  context: GenericRecord
) =>
  text.replace(/\{\{\s*([^}]+)\s*}}/g, (_, expr: string) => {
    const trimmed = expr.trim()
    if (trimmed.startsWith('t.')) {
      return translations[trimmed.slice(2)] ?? trimmed.slice(2)
    }
    const resolved = resolvePath(context, trimmed)
    return resolved == null ? '' : String(resolved)
  })

const formatDateByPattern = (date: Date, pattern: string) => {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const monthsShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const monthShort = monthsShort[date.getMonth()]
  return pattern
    .replace(/yyyy/g, year)
    .replace(/MMM/g, monthShort)
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
}

const toDateSafe = (value: unknown): Date | null => {
  if (value == null) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  const raw = String(value).trim()
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

const toNumberSafe = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value == null) return null
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

const resolveComputedValue = (block: BlockDraft, context: GenericRecord) => {
  if (block.computedType === 'concat') {
    const left = toStringSafe(resolvePath(context, block.computedPathA))
    const right = toStringSafe(resolvePath(context, block.computedPathB))
    const separator = block.computedSeparator || ' '
    if (!left && !right) return ''
    return [left, right].filter(Boolean).join(separator)
  }

  if (block.computedType === 'dateFormat') {
    const raw = resolvePath(context, block.computedPathA)
    const date = toDateSafe(raw)
    if (!date) return toStringSafe(raw)
    return formatDateByPattern(date, block.computedPattern || 'dd MMM yyyy')
  }

  const raw = resolvePath(context, block.computedPathA)
  const amount = toNumberSafe(raw)
  if (amount == null) return toStringSafe(raw)
  const symbol = block.computedCurrencySymbol || 'Rs. '
  return `${symbol}${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

const resolveBlockValue = (
  block: BlockDraft,
  translations: Record<string, string>,
  context: GenericRecord
) => {
  if (block.valueMode === 'template') {
    return interpolate(block.value, translations, context)
  }
  if (block.valueMode === 'computed') {
    return resolveComputedValue(block, context)
  }
  return toStringSafe(resolvePath(context, block.valuePath))
}

const BLOCK_TOOLBAR_TYPES: BlockType[] = [
  'section',
  'group',
  'heading',
  'paragraph',
  'kv',
  'table',
  'divider',
  'spacer',
  'pageBreak',
]

type ExpressionBuilderProps = {
  value: string
  options: string[]
  placeholder?: string
  onChange: (next: string) => void
  className?: string
  showQuickPicks?: boolean
}

const ExpressionBuilder = ({
  value,
  options,
  placeholder = 'Select expression',
  onChange,
  className,
  showQuickPicks = true,
}: ExpressionBuilderProps) => {
  const hasValue = value.trim().length > 0
  const hasOption = hasValue && options.includes(value)
  const selected = hasOption ? value : '__custom__'
  return (
    <div className={cn('space-y-2', className)}>
      <Select
        value={selected}
        onValueChange={(next) => {
          if (next === '__custom__') {
            if (!hasValue) onChange('')
            return
          }
          onChange(next)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='__custom__'>Custom expression</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value}
        placeholder='expression'
        onChange={(event) => onChange(event.target.value)}
      />
      {showQuickPicks ? (
        <div className='flex max-h-27 flex-wrap gap-1 overflow-auto rounded-md border p-1.5'>
          {options.slice(0, 18).map((option) => (
            <Button
              key={option}
              type='button'
              variant='outline'
              size='sm'
              className='h-7 px-2 text-[11px]'
              onClick={() => onChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const emptyBlock = (type: BlockType): BlockDraft => ({
  id: createId(),
  type,
  text: '',
  textKey: '',
  label: '',
  labelKey: '',
  value: '',
  valuePath: '',
  valueMode: 'path',
  computedType: 'concat',
  computedPathA: '',
  computedPathB: '',
  computedSeparator: ' ',
  computedPattern: 'dd MMM yyyy',
  computedCurrencySymbol: 'Rs. ',
  rowsPath: '',
  columnsJson:
    '[{"header":"Type","valuePath":"item.docType"},{"header":"URL","valuePath":"item.url"}]',
  height: '8',
  visibleWhenEnabled: false,
  visibleWhenPath: '',
  visibleWhenOperator: 'equals',
  visibleWhenValue: '',
  visibleWhenValueMode: 'literal',
  visibleWhenValuePath: '',
  fontSize: '',
  align: 'left',
  bold: false,
  fontWeight: 'normal',
  spacingTop: '',
  spacingBottom: '',
  lineHeight: '',
  defaultRows: [],
})

const toPresetBlock = (block: BlockDraft): PresetBlockDraft => {
  const { id: _id, ...rest } = block
  return rest
}

const emptySource = (): DataSourceDraft => ({
  id: createId(),
  alias: '',
  provider: 'customerProfile',
  paramsJson: '{}',
})

const emptyTranslationEntry = (): TranslationEntry => ({
  id: createId(),
  key: '',
  value: '',
})

const toTranslationEntries = (value: unknown): TranslationEntry[] => {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      id: toStringSafe((item as TranslationEntry).id) || createId(),
      key: toStringSafe((item as TranslationEntry).key),
      value: toStringSafe((item as TranslationEntry).value),
    }))
  }
  if (isRecord(value)) {
    return Object.entries(value).map(([key, rawValue]) => ({
      id: createId(),
      key,
      value: toStringSafe(rawValue),
    }))
  }
  return []
}

const parseTranslationsByLocale = (
  value: unknown,
  fallbackLocaleRaw: string
): TranslationLocaleMap => {
  const fallbackLocale = normalizeLocaleCode(fallbackLocaleRaw)
  const out: TranslationLocaleMap = {}
  if (isRecord(value)) {
    Object.entries(value).forEach(([localeKey, localeValues]) => {
      const locale = normalizeLocaleCode(localeKey, fallbackLocale)
      const entries = toTranslationEntries(localeValues)
      out[locale] = entries.length > 0 ? entries : [emptyTranslationEntry()]
    })
  }
  if (Object.keys(out).length === 0) {
    out[fallbackLocale] = [emptyTranslationEntry()]
  }
  return out
}

const emptyTableColumn = (): TableColumnDraft => ({
  id: createId(),
  header: '',
  headerKey: '',
  valuePath: '',
  align: 'left',
  width: '',
  format: 'text',
})

const normalizeColumnAlign = (value: unknown): TableColumnAlign => {
  const normalized = toStringSafe(value)
  if (normalized === 'center') return 'center'
  if (normalized === 'right') return 'right'
  return 'left'
}

const parseTableColumnsDraft = (columnsJson: string) => {
  try {
    const raw = JSON.parse(columnsJson || '[]') as unknown
    if (!Array.isArray(raw))
      return { columns: [] as TableColumnDraft[], isValid: false }
    const columns = raw
      .map((item) => {
        const row = isRecord(item) ? item : {}
        return {
          id: createId(),
          header: toStringSafe(row.header),
          headerKey: toStringSafe(row.headerKey),
          valuePath: toStringSafe(row.valuePath),
          align: normalizeColumnAlign(row.align),
          width: toStringSafe(row.width),
          format: ([
            'text',
            'currency',
            'number',
            'date',
            'datetime',
            'boolean',
          ].includes(toStringSafe(row.format))
            ? toStringSafe(row.format)
            : 'text') as TableColumnFormat,
        } satisfies TableColumnDraft
      })
      .filter(
        (column) =>
          column.header.trim() ||
          column.headerKey.trim() ||
          column.valuePath.trim()
      )
    return { columns, isValid: true }
  } catch {
    return { columns: [] as TableColumnDraft[], isValid: false }
  }
}

const stringifyTableColumnsDraft = (columns: TableColumnDraft[]) =>
  JSON.stringify(
    columns.map((column) => ({
      id: column.id, // ← ADD THIS
      ...(column.header.trim() ? { header: column.header } : {}),
      ...(column.headerKey.trim() ? { headerKey: column.headerKey } : {}),
      valuePath: column.valuePath,
      ...(column.align !== 'left' ? { align: column.align } : {}),
      ...(column.width.trim()
        ? { width: Number(column.width) || column.width }
        : {}),
      ...(column.format !== 'text' ? { format: column.format } : {}),
    })),
    null,
    2
  )

const TABLE_COLUMNS_FALLBACK: TableColumnDraft[] = [
  {
    id: 'fallback-type',
    header: 'Type',
    headerKey: '',
    valuePath: 'item.docType',
    align: 'left',
    width: '1',
    format: 'text',
  },
  {
    id: 'fallback-url',
    header: 'URL',
    headerKey: '',
    valuePath: 'item.url',
    align: 'left',
    width: '2',
    format: 'text',
  },
]

const DRAFT_STORAGE_KEY = 'wf-document-template-designer:draft:v1'
const BUILTIN_BLOCK_PRESETS: BlockPreset[] = [
  {
    id: 'preset-section-kv',
    name: 'Section + Key Values',
    source: 'builtin',
    blocks: [
      toPresetBlock({
        ...emptyBlock('section'),
        text: 'Applicant Summary',
      }),
      toPresetBlock({
        ...emptyBlock('kv'),
        label: 'Applicant Name',
        valuePath: 'forms.current.applicantName',
      }),
      toPresetBlock({
        ...emptyBlock('kv'),
        label: 'Requested Amount',
        valuePath: 'forms.current.amount',
      }),
    ],
  },
  {
    id: 'preset-group-documents',
    name: 'Group + Documents Table',
    source: 'builtin',
    blocks: [
      toPresetBlock({
        ...emptyBlock('group'),
        text: 'Submitted Documents',
      }),
      toPresetBlock({
        ...emptyBlock('table'),
        rowsPath: 'documents.current',
      }),
    ],
  },
]

const hydratePresetBlocks = (value: unknown): PresetBlockDraft[] => {
  if (!Array.isArray(value)) return []
  return value.map((item) => toPresetBlock(mapRawBlockToDraft(item)))
}

const toServerPreset = (
  record: WorkflowDocumentBlockPresetRecord
): BlockPreset | null => {
  const name = toStringSafe(record.name).trim()
  const id = Number(record.id)
  if (!name || !Number.isFinite(id) || id <= 0) return null

  const presetJson = toStringSafe(record.presetJson)
  if (!presetJson.trim()) return null

  try {
    const parsed = JSON.parse(presetJson) as unknown
    const blocksRaw = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.blocks)
        ? parsed.blocks
        : []
    const blocks = hydratePresetBlocks(blocksRaw)
    if (blocks.length === 0) return null
    return {
      id: `server-${id}`,
      name,
      blocks,
      source: 'server',
      serverPresetId: id,
    }
  } catch {
    return null
  }
}

const materializePresetBlocks = (preset: BlockPreset): BlockDraft[] =>
  preset.blocks.map((block) => ({
    ...emptyBlock(resolveDraftType(block.type)),
    ...block,
    type: resolveDraftType(block.type),
    id: createId(),
  }))

const resolveDraftType = (value: unknown): BlockType => {
  const typeRaw = toStringSafe(value).toLowerCase()
  if (typeRaw === 'section') return 'section'
  if (typeRaw === 'group') return 'group'
  if (typeRaw === 'table') return 'table'
  if (typeRaw === 'kv' || typeRaw === 'keyvalue' || typeRaw === 'key_value')
    return 'kv'
  if (typeRaw === 'divider' || typeRaw === 'line') return 'divider'
  if (typeRaw === 'spacer') return 'spacer'
  if (
    typeRaw === 'pagebreak' ||
    typeRaw === 'page-break' ||
    typeRaw === 'page_break'
  )
    return 'pageBreak'
  if (typeRaw === 'h3') return 'group'
  if (typeRaw.startsWith('h')) return 'heading'
  return 'paragraph'
}

const mapRawBlockToDraft = (item: unknown): BlockDraft => {
  const row = isRecord(item) ? item : {}
  const draftType = resolveDraftType(row.designerType ?? row.type)
  const draft = emptyBlock(draftType)
  const visibleWhen = isRecord(row.visibleWhen) ? row.visibleWhen : {}
  const style = isRecord(row.style) ? row.style : {}
  const computed = isRecord(row.computed) ? row.computed : {}
  const rawComputedType = toStringSafe(computed.type).trim()
  const computedType = (
    rawComputedType === 'dateformat'
      ? 'dateFormat'
      : rawComputedType === 'currencyformat'
        ? 'currencyFormat'
        : ['concat', 'dateFormat', 'currencyFormat'].includes(rawComputedType)
          ? rawComputedType
          : 'concat'
  ) as ComputedType
  const visibleWhenValueMode = (
    toStringSafe(visibleWhen.compareType) === 'path' ||
    !!toStringSafe(visibleWhen.valuePath)
      ? 'path'
      : 'literal'
  ) as ConditionValueMode
  const rawFontWeight = toStringSafe(style.fontWeight)
  const fontWeight = (
    ['normal', 'medium', 'semibold', 'bold'].includes(rawFontWeight)
      ? rawFontWeight
      : toBooleanSafe(style.bold, false)
        ? 'bold'
        : 'normal'
  ) as FontWeight
  const valueMode = (
    computedType && Object.keys(computed).length > 0
      ? 'computed'
      : toStringSafe(row.valuePath).trim()
        ? 'path'
        : toStringSafe(row.value).trim()
          ? 'template'
          : 'path'
  ) as ValueMode

  return {
    ...draft,
    id: createId(),
    text: toStringSafe(row.text),
    textKey: toStringSafe(row.textKey),
    label: toStringSafe(row.label),
    labelKey: toStringSafe(row.labelKey),
    value: toStringSafe(row.value),
    valuePath: toStringSafe(row.valuePath),
    valueMode,
    computedType,
    computedPathA: toStringSafe(computed.pathA || computed.path || ''),
    computedPathB: toStringSafe(computed.pathB),
    computedSeparator: toStringSafe(computed.separator || ' '),
    computedPattern: toStringSafe(computed.pattern || 'dd MMM yyyy'),
    computedCurrencySymbol: toStringSafe(computed.symbol || 'Rs. '),
    rowsPath: toStringSafe(row.rowsPath),
    columnsJson: JSON.stringify(row.columns ?? [], null, 2),
    height: toStringSafe(row.height || '8'),
    visibleWhenEnabled: toBooleanSafe(visibleWhen.enabled, false),
    visibleWhenPath: toStringSafe(visibleWhen.path),
    visibleWhenOperator: ([
      'equals',
      'notEquals',
      'contains',
      'exists',
      'notExists',
    ].includes(toStringSafe(visibleWhen.operator))
      ? toStringSafe(visibleWhen.operator)
      : 'equals') as ConditionOperator,
    visibleWhenValue: toStringSafe(visibleWhen.value),
    visibleWhenValueMode,
    visibleWhenValuePath: toStringSafe(visibleWhen.valuePath),
    fontSize: toStringSafe(style.fontSize),
    align: (['left', 'center', 'right'].includes(toStringSafe(style.align))
      ? toStringSafe(style.align)
      : 'left') as 'left' | 'center' | 'right',
    bold: toBooleanSafe(style.bold, false) || fontWeight === 'bold',
    fontWeight,
    spacingTop: toStringSafe(style.spacingTop || style.marginTop),
    spacingBottom: toStringSafe(style.spacingBottom || style.marginBottom),
    lineHeight: toStringSafe(style.lineHeight),
    defaultRows: Array.isArray(row.defaultRows)
      ? (row.defaultRows as unknown[]).map((r) => {
          const rec = isRecord(r) ? r : {}
          return Object.fromEntries(
            Object.entries(rec).map(([k, v]) => [k, toStringSafe(v)])
          )
        })
      : [],
  }
}

const TEMPLATE_EXAMPLES: TemplateExample[] = [
  {
    id: 'sanction-letter',
    label: 'Sanction Letter',
    description: 'Heading + key-value pairs + attached docs table.',
    templateKey: 'sanction_letter',
    name: 'Sanction Letter',
    defaultLocale: 'en-IN',
    title: 'Loan Sanction Letter',
    titleKey: 'loan_sanction_letter',
    fileNamePattern: 'sanction-{{instance.businessKey}}-{{task.id}}',
    translations: [
      { key: 'loan_sanction_letter', value: 'Loan Sanction Letter' },
      { key: 'applicant_name', value: 'Applicant Name' },
      { key: 'sanction_amount', value: 'Sanction Amount' },
    ],
    sources: [
      { alias: 'customer', provider: 'customerProfile', paramsJson: '{}' },
    ],
    blocks: [
      {
        type: 'heading',
        text: 'Loan Sanction Letter',
        textKey: 'loan_sanction_letter',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'paragraph',
        text: 'Reference: {{instance.businessKey}}',
        textKey: '',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'kv',
        text: '',
        textKey: '',
        label: 'Applicant Name',
        labelKey: 'applicant_name',
        value: '',
        valuePath: 'forms.current.applicantName',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'kv',
        text: '',
        textKey: '',
        label: 'Sanction Amount',
        labelKey: 'sanction_amount',
        value: '',
        valuePath: 'forms.current.amount',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'table',
        text: '',
        textKey: '',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: 'documents.current',
        columnsJson:
          '[{"header":"Document Type","valuePath":"item.docType"},{"header":"Document URL","valuePath":"item.url"}]',
        height: '8',
      },
    ],
  },
  {
    id: 'approval-note',
    label: 'Approval Note',
    description: 'Compact approval note with customer/account fields.',
    templateKey: 'approval_note',
    name: 'Approval Note',
    defaultLocale: 'en-IN',
    title: 'Approval Note',
    titleKey: '',
    fileNamePattern: 'approval-{{instance.businessKey}}',
    translations: [],
    sources: [
      { alias: 'customer', provider: 'customerProfile', paramsJson: '{}' },
      { alias: 'account', provider: 'accountProfile', paramsJson: '{}' },
    ],
    blocks: [
      {
        type: 'heading',
        text: 'Approval Note',
        textKey: '',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'kv',
        text: '',
        textKey: '',
        label: 'Customer First Name',
        labelKey: '',
        value: '',
        valuePath: 'providers.customer.firstName',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'kv',
        text: '',
        textKey: '',
        label: 'Account Number',
        labelKey: '',
        value: '',
        valuePath: 'providers.account.accountNo',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'divider',
        text: '',
        textKey: '',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
      {
        type: 'paragraph',
        text: 'Generated by {{providers.user.fullName}}',
        textKey: '',
        label: '',
        labelKey: '',
        value: '',
        valuePath: '',
        rowsPath: '',
        columnsJson: '[]',
        height: '8',
      },
    ],
  },
]

export default function WorkflowDocumentTemplateDesigner() {
  const queryClient = useQueryClient()
  const [templateKey, setTemplateKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultLocale, setDefaultLocale] = useState('en-IN')
  const [title, setTitle] = useState('')
  const [titleKey, setTitleKey] = useState('')
  const [fileNamePattern, setFileNamePattern] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('__none__')
  const [importJson, setImportJson] = useState('')
  const [blocks, setBlocks] = useState<BlockDraft[]>([emptyBlock('heading')])
  const [sources, setSources] = useState<DataSourceDraft[]>([emptySource()])
  const [translationsByLocale, setTranslationsByLocale] =
    useState<TranslationLocaleMap>({
      'en-IN': [emptyTranslationEntry()],
    })
  const [blockSearch, setBlockSearch] = useState('')
  const [previewFocusMode, setPreviewFocusMode] = useState(false)
  const [collapsedInspectorSections, setCollapsedInspectorSections] = useState<
    Record<InspectorSectionKey, boolean>
  >(createEmptyInspectorSectionState())
  const [translationEditorLocale, setTranslationEditorLocale] =
    useState('en-IN')
  const [newLocaleInput, setNewLocaleInput] = useState('')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('preview')
  const [useBankTheme, setUseBankTheme] = useState(true)
  const [showHeaderFooter, setShowHeaderFooter] = useState(true)
  const [marginTop, setMarginTop] = useState('')
  const [marginRight, setMarginRight] = useState('')
  const [marginBottom, setMarginBottom] = useState('')
  const [marginLeft, setMarginLeft] = useState('')
  const [bannerHeight, setBannerHeight] = useState('')
  const [designerMode, setDesignerMode] = useState<DesignerMode>('advanced')
  const [bindingTarget, setBindingTarget] = useState<BindingTarget>('valuePath')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [dragBlockId, setDragBlockId] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const [dragToolbarType, setDragToolbarType] = useState<BlockType | null>(null)
  const [blockHistory, setBlockHistory] = useState<BlockDraft[][]>([])
  const [blockFuture, setBlockFuture] = useState<BlockDraft[][]>([])
  const [compareTemplateId, setCompareTemplateId] = useState('__none__')
  const [diffMode, setDiffMode] = useState<'visual' | 'json'>('visual')
  const [previewTaskIdInput, setPreviewTaskIdInput] = useState('')
  const [presetName, setPresetName] = useState('')
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [lastAutosavedAt, setLastAutosavedAt] = useState('')
  const [hasStoredDraft, setHasStoredDraft] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [activeTab, setActiveTab] = useState<DesignerTab>('build')
  const [pulseBlockId, setPulseBlockId] = useState<string | null>(null)
  const [bindingTesterContextJson, setBindingTesterContextJson] = useState(
    JSON.stringify(SAMPLE_CONTEXT, null, 2)
  )
  const [bindingTesterExpression, setBindingTesterExpression] = useState(
    'forms.current.applicantName'
  )
  const [bindingTesterMode, setBindingTesterMode] = useState<
    'path' | 'template'
  >('path')
  const [useBindingTesterForPreview, setUseBindingTesterForPreview] =
    useState(false)
  const [howToModalOpen, setHowToModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [bindingTesterModalOpen, setBindingTesterModalOpen] = useState(false)
  const [snippetsModalOpen, setSnippetsModalOpen] = useState(false)
  const skipHistoryRef = useRef(false)
  const skipAutosaveRef = useRef(false)
  const blocksRef = useRef(blocks)
  const canvasBlocksRef = useRef<HTMLDivElement | null>(null)
  const previewBlocksRef = useRef<HTMLDivElement | null>(null)

  const { data: templates = [] } = useQuery({
    queryKey: ['wf-document-templates', 'designer'],
    queryFn: () => listWorkflowDocumentTemplates(),
    staleTime: 30 * 1000,
  })

  const { data: serverPresetsRaw = [] } = useQuery({
    queryKey: ['wf-document-template-presets'],
    queryFn: () => listWorkflowDocumentBlockPresets(),
    staleTime: 30 * 1000,
  })

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => {
        const k = (a.templateKey ?? '').localeCompare(b.templateKey ?? '')
        return k !== 0 ? k : Number(b.version ?? 0) - Number(a.version ?? 0)
      }),
    [templates]
  )

  const selectedBlock = useMemo(
    () => blocks.find((item) => item.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  )

  const copyPreviewJson = async () => {
    try {
      await navigator.clipboard.writeText(payloadJson)
      toast.success('Preview JSON copied to clipboard.')
    } catch (error) {
      toast.error('Failed to copy JSON.')
      toast.error(String(error))
    }
  }
  const selectedTableColumnsState = useMemo(() => {
    if (!selectedBlock || selectedBlock.type !== 'table') {
      return { columns: [] as TableColumnDraft[], isValid: true }
    }
    // Parse WITHOUT the empty-field filter so newly added columns are visible
    try {
      const raw = JSON.parse(selectedBlock.columnsJson || '[]') as unknown
      if (!Array.isArray(raw)) {
        return {
          columns: TABLE_COLUMNS_FALLBACK.map((item) => ({ ...item })),
          isValid: false,
        }
      }
      const columns: TableColumnDraft[] = raw.map((col) => {
        const c = isRecord(col) ? col : {}
        return {
          id: toStringSafe(c.id) || createId(),
          header: toStringSafe(c.header),
          headerKey: toStringSafe(c.headerKey),
          valuePath: toStringSafe(c.valuePath),
          align: normalizeColumnAlign(c.align),
          width: toStringSafe(c.width),
          format: ([
            'text',
            'currency',
            'number',
            'date',
            'datetime',
            'boolean',
          ].includes(toStringSafe(c.format))
            ? toStringSafe(c.format)
            : 'text') as TableColumnFormat,
        }
      })
      return {
        columns:
          columns.length > 0
            ? columns
            : TABLE_COLUMNS_FALLBACK.map((item) => ({ ...item })),
        isValid: true,
      }
    } catch {
      return {
        columns: TABLE_COLUMNS_FALLBACK.map((item) => ({ ...item })),
        isValid: false,
      }
    }
  }, [selectedBlock])

  const compareTemplateRecord = useMemo(
    () =>
      compareTemplateId === '__none__'
        ? null
        : (sortedTemplates.find(
            (item) => Number(item.id) === Number(compareTemplateId)
          ) ?? null),
    [compareTemplateId, sortedTemplates]
  )

  const translationLocales = useMemo(() => {
    const out = new Set<string>([normalizeLocaleCode(defaultLocale)])
    Object.keys(translationsByLocale).forEach((locale) =>
      out.add(normalizeLocaleCode(locale))
    )
    return Array.from(out).sort((a, b) => a.localeCompare(b))
  }, [defaultLocale, translationsByLocale])

  const activeTranslationLocale = useMemo(() => {
    const normalized = normalizeLocaleCode(
      translationEditorLocale,
      normalizeLocaleCode(defaultLocale)
    )
    return translationLocales.includes(normalized)
      ? normalized
      : normalizeLocaleCode(defaultLocale)
  }, [defaultLocale, translationEditorLocale, translationLocales])

  const activeTranslations = useMemo(
    () => translationsByLocale[activeTranslationLocale] ?? [],
    [activeTranslationLocale, translationsByLocale]
  )

  const unionTranslationKeys = useMemo(() => {
    const out = new Set<string>()
    Object.values(translationsByLocale).forEach((entries) => {
      entries.forEach((entry) => {
        const key = entry.key.trim()
        if (!key) return
        out.add(key)
      })
    })
    return Array.from(out).sort((a, b) => a.localeCompare(b))
  }, [translationsByLocale])

  const translationMap = useMemo(() => {
    const out: Record<string, string> = {}
    const locale = normalizeLocaleCode(defaultLocale)
    const entries = translationsByLocale[locale] ?? []
    entries.forEach((entry) => {
      const key = entry.key.trim()
      const value = entry.value.trim()
      if (!key || !value) return
      out[key] = entry.value
    })
    return out
  }, [defaultLocale, translationsByLocale])

  const isCanvasFiltered = blockSearch.trim().length > 0

  const filteredBlocks = useMemo(() => {
    const query = blockSearch.trim().toLowerCase()
    if (!query) return blocks
    return blocks.filter((block) => buildBlockSearchText(block).includes(query))
  }, [blocks, blockSearch])

  const selectedBlockSectionIssues = useMemo(
    () => (selectedBlock ? getBlockSectionIssues(selectedBlock) : null),
    [selectedBlock]
  )

  const toggleInspectorSection = (key: InspectorSectionKey) => {
    setCollapsedInspectorSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderSectionIssues = (issues: InlineIssue[]) => {
    if (!issues.length) return null

    return (
      <div className='bg-muted/30 space-y-1 rounded-md border p-2'>
        {issues.map((issue, index) => (
          <p
            key={`${issue.level}-${index}`}
            className={cn(
              'text-xs',
              issue.level === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground'
            )}
          >
            • {issue.message}
          </p>
        ))}
      </div>
    )
  }

  const renderInspectorSection = (
    key: InspectorSectionKey,
    title: string,
    content: ReactNode
  ) => {
    const isOpen = !collapsedInspectorSections[key]
    const issues = selectedBlockSectionIssues?.[key] ?? []

    return (
      <div className='border-border/40 bg-background/30 border-b'>
        <button
          type='button'
          onClick={() => toggleInspectorSection(key)}
          className='hover:bg-muted/40 focus-visible:bg-muted/40 flex w-full items-center justify-between gap-2 p-4 text-left transition-colors duration-200 outline-none'
        >
          <div className='flex items-center gap-2'>
            <motion.div
              initial={false}
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronDown className='text-muted-foreground h-3.5 w-3.5' />
            </motion.div>
            <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase drop-shadow-sm'>
              {title}
            </p>
          </div>

          {issues.length > 0 ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Badge
                variant={
                  issues.some((item) => item.level === 'error')
                    ? 'destructive'
                    : 'secondary'
                }
                className='text-[9px] shadow-sm'
              >
                {issues.length}
              </Badge>
            </motion.div>
          ) : null}
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
              className='overflow-hidden'
            >
              {/* Added a subtle inner shadow/border to the expanded area for depth */}
              <div className='space-y-4 p-4 pt-1 shadow-[inset_0_4px_10px_-10px_rgba(0,0,0,0.1)]'>
                {renderSectionIssues(issues)}
                <motion.div
                  initial={{ y: -5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {content}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const translationMapsByLocale = useMemo(() => {
    const out: Record<string, Record<string, string>> = {}
    const defaultCode = normalizeLocaleCode(defaultLocale)
    translationLocales.forEach((locale) => {
      const entries = translationsByLocale[locale] ?? []
      const valueMap: Record<string, string> = {}
      entries.forEach((entry) => {
        const key = entry.key.trim()
        const value = entry.value.trim()
        if (!key || !value) return
        valueMap[key] = entry.value
      })
      if (Object.keys(valueMap).length > 0 || locale === defaultCode) {
        out[locale] = valueMap
      }
    })
    if (!out[defaultCode]) {
      out[defaultCode] = {}
    }
    return out
  }, [defaultLocale, translationLocales, translationsByLocale])

  useEffect(() => {
    const defaultCode = normalizeLocaleCode(defaultLocale)
    setTranslationsByLocale((prev) => {
      if (Array.isArray(prev[defaultCode]) && prev[defaultCode].length > 0) {
        return prev
      }
      return { ...prev, [defaultCode]: [emptyTranslationEntry()] }
    })
  }, [defaultLocale])

  useEffect(() => {
    if (!selectedBlockId || typeof window === 'undefined') return

    const frame = window.requestAnimationFrame(() => {
      if (activeTab === 'build') {
        scrollBlockIntoContainer(
          canvasBlocksRef.current,
          `[data-canvas-block-id="${selectedBlockId}"]`
        )
        return
      }

      if (activeTab === 'preview' && previewMode === 'preview') {
        scrollBlockIntoContainer(
          previewBlocksRef.current,
          `[data-preview-block-id="${selectedBlockId}"]`
        )
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, previewMode, selectedBlockId])

  useEffect(() => {
    if (!selectedBlockId || typeof window === 'undefined') return

    setPulseBlockId(selectedBlockId)

    const timer = window.setTimeout(() => {
      setPulseBlockId((current) =>
        current === selectedBlockId ? null : current
      )
    }, 750)

    return () => window.clearTimeout(timer)
  }, [selectedBlockId])

  useEffect(() => {
    if (!selectedBlockId || typeof window === 'undefined') return

    const frame = window.requestAnimationFrame(() => {
      if (activeTab === 'build') {
        scrollCanvasBlock(selectedBlockId)
        return
      }

      if (activeTab === 'preview' && previewMode === 'preview') {
        scrollPreviewBlock(selectedBlockId)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, previewMode, selectedBlockId])

  useEffect(() => {
    if (previewMode !== 'preview' || !selectedBlockId) return

    const element = previewBlocksRef.current?.querySelector(
      `[data-preview-block-id="${selectedBlockId}"]`
    )

    if (!(element instanceof HTMLElement)) return

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [previewMode, selectedBlockId])

  useEffect(() => {
    setTranslationsByLocale((prev) => {
      const currentEntries = prev[activeTranslationLocale] ?? []
      const ensuredEntries =
        currentEntries.length > 0 ? currentEntries : [emptyTranslationEntry()]
      const keySet = new Set(
        ensuredEntries.map((entry) => entry.key.trim()).filter(Boolean)
      )
      const missingEntries = unionTranslationKeys
        .filter((key) => !keySet.has(key))
        .map((key) => ({ id: createId(), key, value: '' }))

      if (prev[activeTranslationLocale] && missingEntries.length === 0) {
        return prev
      }
      return {
        ...prev,
        [activeTranslationLocale]: [...ensuredEntries, ...missingEntries],
      }
    })
  }, [activeTranslationLocale, unionTranslationKeys])

  useEffect(() => {
    if (translationEditorLocale !== activeTranslationLocale) {
      setTranslationEditorLocale(activeTranslationLocale)
    }
  }, [activeTranslationLocale, translationEditorLocale])

  const bindingTesterContextState = useMemo(() => {
    try {
      const parsed = JSON.parse(bindingTesterContextJson || '{}') as unknown
      if (!isRecord(parsed)) {
        return {
          context: SAMPLE_CONTEXT,
          isValid: false,
          error: 'Context JSON must be an object.',
        }
      }
      return {
        context: parsed as GenericRecord,
        isValid: true,
        error: '',
      }
    } catch (error) {
      return {
        context: SAMPLE_CONTEXT,
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      }
    }
  }, [bindingTesterContextJson])

  const previewContext = useMemo(
    () =>
      useBindingTesterForPreview && bindingTesterContextState.isValid
        ? bindingTesterContextState.context
        : SAMPLE_CONTEXT,
    [bindingTesterContextState, useBindingTesterForPreview]
  )

  const bindingTesterResult = useMemo(() => {
    if (!bindingTesterExpression.trim()) return ''
    if (!bindingTesterContextState.isValid) return ''
    if (bindingTesterMode === 'template') {
      return interpolate(
        bindingTesterExpression,
        translationMap,
        bindingTesterContextState.context
      )
    }
    const raw = resolvePath(
      bindingTesterContextState.context,
      bindingTesterExpression
    )
    if (raw == null) return ''
    if (typeof raw === 'string') return raw
    try {
      return JSON.stringify(raw, null, 2)
    } catch {
      return String(raw)
    }
  }, [
    bindingTesterContextState,
    bindingTesterExpression,
    bindingTesterMode,
    translationMap,
  ])

  const bindingPathOptions = useMemo(() => {
    const out = new Set<string>()
    const walk = (value: unknown, prefix: string, depth: number) => {
      if (depth > 5) return
      if (prefix) out.add(prefix)
      if (Array.isArray(value)) {
        if (value.length > 0)
          walk(value[0], prefix ? `${prefix}[0]` : '[0]', depth + 1)
        return
      }
      if (!isRecord(value)) return
      Object.entries(value).forEach(([key, child]) => {
        walk(child, prefix ? `${prefix}.${key}` : key, depth + 1)
      })
    }
    walk(previewContext, '', 0)
    return Array.from(out)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [previewContext])

  const replaceBlocks = (next: BlockDraft[], resetHistory = false) => {
    skipHistoryRef.current = true
    blocksRef.current = next
    setBlocks(next)
    if (resetHistory) {
      setBlockHistory([])
      setBlockFuture([])
    }
  }

  const reorderBlocksById = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return
    setBlocks((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId)
      const toIndex = prev.findIndex((item) => item.id === toId)
      if (fromIndex < 0 || toIndex < 0) return prev
      const next = [...prev]
      const [dragged] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, dragged)
      return next
    })
  }

  const undoBlocks = () => {
    setBlockHistory((prev) => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]
      setBlockFuture((future) => [...future, blocksRef.current])
      skipHistoryRef.current = true
      blocksRef.current = previous
      setBlocks(previous)
      return prev.slice(0, -1)
    })
  }

  const redoBlocks = () => {
    setBlockFuture((prev) => {
      if (prev.length === 0) return prev
      const next = prev[prev.length - 1]
      setBlockHistory((history) => [...history, blocksRef.current].slice(-100))
      skipHistoryRef.current = true
      blocksRef.current = next
      setBlocks(next)
      return prev.slice(0, -1)
    })
  }

  const duplicateSelectedBlock = () => {
    if (!selectedBlockId) {
      toast.error('Select a block to duplicate')
      return
    }
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === selectedBlockId)
      if (index < 0) return prev
      const source = prev[index]
      const clone: BlockDraft = { ...source, id: createId() }
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return next
    })
  }

  const applyBindingToSelectedBlock = (path: string) => {
    if (!selectedBlockId) {
      toast.error('Select a block first')
      return
    }
    setBlocks((prev) =>
      prev.map((item) => {
        if (item.id !== selectedBlockId) return item
        if (bindingTarget === 'text') return { ...item, text: `{{${path}}}` }
        if (bindingTarget === 'value')
          return { ...item, valueMode: 'template', value: `{{${path}}}` }
        if (bindingTarget === 'rowsPath') return { ...item, rowsPath: path }
        if (bindingTarget === 'visibleWhenPath') {
          return {
            ...item,
            visibleWhenEnabled: true,
            visibleWhenPath: path,
            visibleWhenValueMode: 'literal',
          }
        }
        return { ...item, valueMode: 'path', valuePath: path }
      })
    )
  }

  const updateBlockById = (
    blockId: string,
    updater: (block: BlockDraft) => BlockDraft
  ) => {
    setBlocks((prev) =>
      prev.map((item) => (item.id === blockId ? updater(item) : item))
    )
  }

  const updateTableColumnsByBlockId = (
    blockId: string,
    updater: (columns: TableColumnDraft[]) => TableColumnDraft[]
  ) => {
    setBlocks((prev) =>
      prev.map((item) => {
        if (item.id !== blockId || item.type !== 'table') return item

        // Parse directly — skip parseTableColumnsDraft because its
        // empty-field filter drops newly added columns before updater runs
        let baseColumns: TableColumnDraft[]
        try {
          const raw = JSON.parse(item.columnsJson || '[]') as unknown
          if (Array.isArray(raw) && raw.length > 0) {
            baseColumns = raw.map((col): TableColumnDraft => {
              const c = isRecord(col) ? col : {}
              return {
                id: toStringSafe(c.id) || createId(), // ✅ preserve id if present
                header: toStringSafe(c.header),
                headerKey: toStringSafe(c.headerKey),
                valuePath: toStringSafe(c.valuePath),
                align: normalizeColumnAlign(c.align),
                width: toStringSafe(c.width),
                format: ([
                  'text',
                  'currency',
                  'number',
                  'date',
                  'datetime',
                  'boolean',
                ].includes(toStringSafe(c.format))
                  ? toStringSafe(c.format)
                  : 'text') as TableColumnFormat,
              }
            })
          } else {
            baseColumns = TABLE_COLUMNS_FALLBACK.map((column) => ({
              ...column,
              id: createId(),
            }))
          }
        } catch {
          baseColumns = TABLE_COLUMNS_FALLBACK.map((column) => ({
            ...column,
            id: createId(),
          }))
        }

        const nextColumns = updater(baseColumns)
        return {
          ...item,
          columnsJson: stringifyTableColumnsDraft(nextColumns),
        }
      })
    )
  }

  const addBlock = (type: BlockType, patch: Partial<BlockDraft> = {}) => {
    const nextBlock = { ...emptyBlock(type), ...patch }
    setBlocks((prev) => [...prev, nextBlock])
    setSelectedBlockId(nextBlock.id)
  }

  const insertBlockAt = (
    index: number,
    type: BlockType,
    patch: Partial<BlockDraft> = {}
  ) => {
    const nextBlock = { ...emptyBlock(type), ...patch }
    setBlocks((prev) => {
      const boundedIndex = Math.max(0, Math.min(index, prev.length))
      const next = [...prev]
      next.splice(boundedIndex, 0, nextBlock)
      return next
    })
    setSelectedBlockId(nextBlock.id)
  }

  const insertBlockBeforeId = (
    targetId: string,
    type: BlockType,
    patch: Partial<BlockDraft> = {}
  ) => {
    const nextBlock = { ...emptyBlock(type), ...patch }
    setBlocks((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === targetId)
      const boundedIndex = targetIndex < 0 ? prev.length : targetIndex
      const next = [...prev]
      next.splice(boundedIndex, 0, nextBlock)
      return next
    })
    setSelectedBlockId(nextBlock.id)
  }

  const moveBlockByOffset = (blockId: string, offset: number) => {
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === blockId)
      if (index < 0) return prev
      const nextIndex = index + offset
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const duplicateBlockById = (blockId: string) => {
    const cloneId = createId()
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === blockId)
      if (index < 0) return prev
      const source = prev[index]
      const next = [...prev]
      const clone: BlockDraft = { ...source, id: cloneId }
      next.splice(index + 1, 0, clone)
      return next
    })
    setSelectedBlockId(cloneId)
  }

  const removeBlockById = (blockId: string) => {
    setBlocks((prev) =>
      prev.length > 1
        ? prev.filter((item) => item.id !== blockId)
        : [emptyBlock('heading')]
    )
  }

  const describeBlock = (block: BlockDraft) => {
    if (
      block.type === 'section' ||
      block.type === 'group' ||
      block.type === 'heading' ||
      block.type === 'paragraph'
    ) {
      return block.text || block.textKey || 'No text'
    }
    if (block.type === 'kv') {
      const label = block.label || block.labelKey || 'label'
      const value =
        block.valueMode === 'computed'
          ? `computed:${block.computedType}`
          : block.valueMode === 'template'
            ? block.value || 'value-template'
            : block.valuePath || 'valuePath'
      return `${label} -> ${value}`
    }
    if (block.type === 'table') {
      return block.rowsPath || 'rowsPath not set'
    }
    if (block.type === 'spacer') return `Height: ${block.height || '8'}`
    if (block.type === 'pageBreak') return 'Insert page break'
    return 'Horizontal divider'
  }

  const serverPresets = useMemo(
    () =>
      serverPresetsRaw
        .map((record) => toServerPreset(record))
        .filter((item): item is BlockPreset => item != null),
    [serverPresetsRaw]
  )

  const allPresets = useMemo(
    () => [...BUILTIN_BLOCK_PRESETS, ...serverPresets],
    [serverPresets]
  )

  const applyPreset = (preset: BlockPreset) => {
    const nextBlocks = materializePresetBlocks(preset)
    if (nextBlocks.length === 0) {
      toast.error('Preset has no blocks')
      return
    }
    setBlocks((prev) => [...prev, ...nextBlocks])
    setSelectedBlockId(nextBlocks[0].id)
    toast.success(`Applied preset: ${preset.name}`)
  }

  const saveSelectedBlockAsPreset = () => {
    if (!selectedBlock) {
      toast.error('Select a block to save preset')
      return
    }
    const name = presetName.trim() || `${selectedBlock.type} preset`
    createPresetMutation.mutate({
      presetKey: slugify(name),
      name,
      description: `Saved from designer block type ${selectedBlock.type}`,
      presetJson: JSON.stringify({ blocks: [toPresetBlock(selectedBlock)] }),
      isGlobal: true,
      isActive: true,
    })
    setPresetName('')
  }

  const saveAllBlocksAsPreset = () => {
    if (blocks.length === 0) {
      toast.error('No blocks to save')
      return
    }
    const name = presetName.trim() || `${templateKey || 'template'} full layout`
    createPresetMutation.mutate({
      presetKey: slugify(name),
      name,
      description: 'Saved full document block layout from designer',
      presetJson: JSON.stringify({
        blocks: blocks.map((item) => toPresetBlock(item)),
      }),
      isGlobal: true,
      isActive: true,
    })
    setPresetName('')
  }

  const removeServerPreset = (preset: BlockPreset) => {
    if (!preset.serverPresetId) return
    deletePresetMutation.mutate(preset.serverPresetId)
  }

  const applyLocalDraftData = (draftData: LocalDesignerDraft['data']) => {
    skipAutosaveRef.current = true
    setTemplateKey(toStringSafe(draftData.templateKey))
    setName(toStringSafe(draftData.name))
    setDescription(toStringSafe(draftData.description))
    setDefaultLocale(toStringSafe(draftData.defaultLocale) || 'en-IN')
    setTitle(toStringSafe(draftData.title))
    setTitleKey(toStringSafe(draftData.titleKey))
    setFileNamePattern(toStringSafe(draftData.fileNamePattern))
    setImportJson(toStringSafe(draftData.importJson))

    const nextBlocks =
      Array.isArray(draftData.blocks) && draftData.blocks.length > 0
        ? draftData.blocks.map((item) => mapRawBlockToDraft(item))
        : [emptyBlock('heading')]
    replaceBlocks(nextBlocks, true)

    const nextSources =
      Array.isArray(draftData.sources) && draftData.sources.length > 0
        ? draftData.sources.map((item) => ({
            id: toStringSafe(item.id) || createId(),
            alias: toStringSafe(item.alias),
            provider: ([
              'customerProfile',
              'accountProfile',
              'userProfile',
            ].includes(toStringSafe(item.provider))
              ? toStringSafe(item.provider)
              : 'customerProfile') as ProviderKey,
            paramsJson: toStringSafe(item.paramsJson) || '{}',
          }))
        : [emptySource()]
    setSources(nextSources)

    const normalizedDefaultLocale = normalizeLocaleCode(
      toStringSafe(draftData.defaultLocale) || 'en-IN'
    )
    const nextTranslationsByLocale: TranslationLocaleMap = {}
    const rawByLocale = isRecord(draftData.translationsByLocale)
      ? (draftData.translationsByLocale as Record<string, unknown>)
      : {}

    Object.entries(rawByLocale).forEach(([localeKey, value]) => {
      const locale = normalizeLocaleCode(localeKey, normalizedDefaultLocale)
      let entries: TranslationEntry[] = []
      if (Array.isArray(value)) {
        entries = value.map((item) => ({
          id: toStringSafe((item as TranslationEntry).id) || createId(),
          key: toStringSafe((item as TranslationEntry).key),
          value: toStringSafe((item as TranslationEntry).value),
        }))
      } else if (isRecord(value)) {
        entries = Object.entries(value).map(([key, rawValue]) => ({
          id: createId(),
          key,
          value: toStringSafe(rawValue),
        }))
      }
      nextTranslationsByLocale[locale] =
        entries.length > 0 ? entries : [emptyTranslationEntry()]
    })

    if (
      Object.keys(nextTranslationsByLocale).length === 0 &&
      Array.isArray(draftData.translations)
    ) {
      nextTranslationsByLocale[normalizedDefaultLocale] =
        draftData.translations.length > 0
          ? draftData.translations.map((item) => ({
              id: toStringSafe(item.id) || createId(),
              key: toStringSafe(item.key),
              value: toStringSafe(item.value),
            }))
          : [emptyTranslationEntry()]
    }

    if (Object.keys(nextTranslationsByLocale).length === 0) {
      nextTranslationsByLocale[normalizedDefaultLocale] = [
        emptyTranslationEntry(),
      ]
    }
    setTranslationsByLocale(nextTranslationsByLocale)
    setTranslationEditorLocale(
      normalizeLocaleCode(
        toStringSafe(draftData.translationEditorLocale),
        normalizedDefaultLocale
      )
    )

    setLayoutMode(
      ['split', 'designer', 'preview'].includes(
        toStringSafe(draftData.layoutMode)
      )
        ? (draftData.layoutMode as LayoutMode)
        : 'split'
    )
    setPreviewMode(
      ['preview', 'json'].includes(toStringSafe(draftData.previewMode))
        ? (draftData.previewMode as PreviewMode)
        : 'preview'
    )
    setUseBankTheme(toBooleanSafe(draftData.useBankTheme, true))
    setShowHeaderFooter(toBooleanSafe(draftData.showHeaderFooter, true))
    setMarginTop(toStringSafe(draftData.marginTop))
    setMarginRight(toStringSafe(draftData.marginRight))
    setMarginBottom(toStringSafe(draftData.marginBottom))
    setMarginLeft(toStringSafe(draftData.marginLeft))
    setBannerHeight(toStringSafe(draftData.bannerHeight))
    setDesignerMode(
      ['basic', 'advanced'].includes(toStringSafe(draftData.designerMode))
        ? (draftData.designerMode as DesignerMode)
        : 'advanced'
    )
    setBindingTarget(
      ['valuePath', 'rowsPath', 'text', 'value', 'visibleWhenPath'].includes(
        toStringSafe(draftData.bindingTarget)
      )
        ? (draftData.bindingTarget as BindingTarget)
        : 'valuePath'
    )
    setSelectedBlockId(
      toStringSafe(draftData.selectedBlockId) || nextBlocks[0]?.id || null
    )
    setCompareTemplateId(
      toStringSafe(draftData.compareTemplateId) || '__none__'
    )
    setDiffMode(
      ['visual', 'json'].includes(toStringSafe(draftData.diffMode))
        ? (draftData.diffMode as 'visual' | 'json')
        : 'visual'
    )
    setPreviewTaskIdInput(toStringSafe(draftData.previewTaskIdInput))
    setBindingTesterContextJson(
      toStringSafe(draftData.bindingTesterContextJson) ||
        JSON.stringify(SAMPLE_CONTEXT, null, 2)
    )
    setBindingTesterExpression(
      toStringSafe(draftData.bindingTesterExpression) ||
        'forms.current.applicantName'
    )
    setBindingTesterMode(
      ['path', 'template'].includes(toStringSafe(draftData.bindingTesterMode))
        ? (draftData.bindingTesterMode as 'path' | 'template')
        : 'path'
    )
    setUseBindingTesterForPreview(
      toBooleanSafe(draftData.useBindingTesterForPreview, false)
    )
  }

  const restoreDraftFromStorage = () => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) {
      toast.error('No local draft found')
      return
    }
    try {
      const parsed = JSON.parse(raw) as LocalDesignerDraft
      if (!parsed || typeof parsed !== 'object' || !isRecord(parsed.data)) {
        throw new Error('Invalid draft')
      }
      applyLocalDraftData(parsed.data as LocalDesignerDraft['data'])
      setHasStoredDraft(true)
      setLastAutosavedAt(toStringSafe(parsed.savedAt))
      toast.success('Local draft restored')
    } catch {
      toast.error('Failed to restore local draft')
    }
  }

  const clearStoredDraft = () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setHasStoredDraft(false)
    setLastAutosavedAt('')
    toast.success('Local draft cleared')
  }

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      blocksRef.current = blocks
      return
    }
    const prev = blocksRef.current
    if (prev === blocks) return
    setBlockHistory((history) => [...history, prev].slice(-100))
    setBlockFuture([])
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    if (!selectedBlockId) {
      if (blocks[0]) setSelectedBlockId(blocks[0].id)
      return
    }
    if (!blocks.some((item) => item.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0]?.id ?? null)
    }
  }, [blocks, selectedBlockId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const metaOrCtrl = event.ctrlKey || event.metaKey
      if (!metaOrCtrl) return

      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        undoBlocks()
        return
      }
      if (
        event.key.toLowerCase() === 'y' ||
        (event.key.toLowerCase() === 'z' && event.shiftKey)
      ) {
        event.preventDefault()
        redoBlocks()
        return
      }
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelectedBlock()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedBlockId, blockHistory.length, blockFuture.length, blocks])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setStorageReady(true)
      return
    }

    try {
      const draftRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (draftRaw) {
        const parsedDraft = JSON.parse(draftRaw) as LocalDesignerDraft
        if (parsedDraft && isRecord(parsedDraft.data)) {
          applyLocalDraftData(parsedDraft.data as LocalDesignerDraft['data'])
          setHasStoredDraft(true)
          setLastAutosavedAt(toStringSafe(parsedDraft.savedAt))
          toast.success('Recovered local draft')
        }
      }
    } catch {
      setHasStoredDraft(false)
    }

    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady || !autosaveEnabled || typeof window === 'undefined')
      return
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }

    const timer = window.setTimeout(() => {
      const draftPayload: LocalDesignerDraft = {
        version: 1,
        savedAt: new Date().toISOString(),
        data: {
          templateKey,
          name,
          description,
          defaultLocale,
          title,
          titleKey,
          fileNamePattern,
          importJson,
          blocks,
          sources,
          translations:
            translationsByLocale[normalizeLocaleCode(defaultLocale)] ?? [],
          translationsByLocale,
          translationEditorLocale,
          layoutMode,
          previewMode,
          useBankTheme,
          showHeaderFooter,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          bannerHeight,
          designerMode,
          bindingTarget,
          selectedBlockId,
          compareTemplateId,
          diffMode,
          previewTaskIdInput,
          bindingTesterContextJson,
          bindingTesterExpression,
          bindingTesterMode,
          useBindingTesterForPreview,
        },
      }
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(draftPayload)
      )
      setHasStoredDraft(true)
      setLastAutosavedAt(draftPayload.savedAt)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [
    autosaveEnabled,
    bannerHeight,
    bindingTarget,
    bindingTesterContextJson,
    bindingTesterExpression,
    bindingTesterMode,
    blocks,
    compareTemplateId,
    defaultLocale,
    description,
    designerMode,
    diffMode,
    fileNamePattern,
    importJson,
    layoutMode,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    name,
    previewMode,
    previewTaskIdInput,
    useBindingTesterForPreview,
    selectedBlockId,
    showHeaderFooter,
    sources,
    storageReady,
    templateKey,
    title,
    titleKey,
    translationEditorLocale,
    translationsByLocale,
    useBankTheme,
  ])

  const payloadObject = useMemo(() => {
    const layoutMargins: Record<string, number> = {}
    const parsedMarginTop = parseOptionalNumber(marginTop)
    const parsedMarginRight = parseOptionalNumber(marginRight)
    const parsedMarginBottom = parseOptionalNumber(marginBottom)
    const parsedMarginLeft = parseOptionalNumber(marginLeft)
    const parsedBannerHeight = parseOptionalNumber(bannerHeight)
    if (parsedMarginTop != null) layoutMargins.top = parsedMarginTop
    if (parsedMarginRight != null) layoutMargins.right = parsedMarginRight
    if (parsedMarginBottom != null) layoutMargins.bottom = parsedMarginBottom
    if (parsedMarginLeft != null) layoutMargins.left = parsedMarginLeft

    const dataSources = sources
      .map((source) => {
        if (!source.alias.trim()) return null
        let params: Record<string, string> = {}
        try {
          const raw = JSON.parse(source.paramsJson || '{}') as unknown
          if (isRecord(raw)) {
            params = Object.fromEntries(
              Object.entries(raw).map(([key, value]) => [
                key,
                toStringSafe(value),
              ])
            )
          }
        } catch {
          params = {}
        }
        return {
          alias: source.alias.trim(),
          provider: source.provider,
          params,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const mappedBlocks = blocks.map((block) => {
      const style = {
        ...(parseOptionalNumber(block.fontSize) != null
          ? { fontSize: parseOptionalNumber(block.fontSize) }
          : {}),
        ...(block.align !== 'left' ? { align: block.align } : {}),
        ...(block.fontWeight !== 'normal'
          ? { fontWeight: block.fontWeight }
          : {}),
        ...(parseOptionalNumber(block.spacingTop) != null
          ? { spacingTop: parseOptionalNumber(block.spacingTop) }
          : {}),
        ...(parseOptionalNumber(block.spacingBottom) != null
          ? { spacingBottom: parseOptionalNumber(block.spacingBottom) }
          : {}),
        ...(parseOptionalNumber(block.lineHeight) != null
          ? { lineHeight: parseOptionalNumber(block.lineHeight) }
          : {}),
        ...(block.bold || block.fontWeight === 'bold' ? { bold: true } : {}),
      }
      const visibleWhen = block.visibleWhenEnabled
        ? {
            enabled: true,
            path: block.visibleWhenPath.trim(),
            operator: block.visibleWhenOperator,
            compareType: block.visibleWhenValueMode,
            ...(block.visibleWhenValueMode === 'path'
              ? { valuePath: block.visibleWhenValuePath.trim() }
              : { value: block.visibleWhenValue }),
          }
        : undefined

      if (block.type === 'section') {
        return {
          type: 'h2',
          designerType: 'section',
          text: block.text,
          textKey: block.textKey,
          ...(Object.keys(style).length > 0 ? { style } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'group') {
        return {
          type: 'h3',
          designerType: 'group',
          text: block.text,
          textKey: block.textKey,
          ...(Object.keys(style).length > 0 ? { style } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'heading') {
        return {
          type: 'h2',
          designerType: 'heading',
          text: block.text,
          textKey: block.textKey,
          ...(Object.keys(style).length > 0 ? { style } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'paragraph') {
        return {
          type: 'paragraph',
          designerType: 'paragraph',
          text: block.text,
          textKey: block.textKey,
          ...(Object.keys(style).length > 0 ? { style } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'kv') {
        const computed =
          block.valueMode === 'computed'
            ? {
                type: block.computedType,
                ...(block.computedType === 'concat'
                  ? {
                      pathA: block.computedPathA.trim(),
                      pathB: block.computedPathB.trim(),
                      separator: block.computedSeparator,
                    }
                  : block.computedType === 'dateFormat'
                    ? {
                        path: block.computedPathA.trim(),
                        pattern: block.computedPattern || 'dd MMM yyyy',
                      }
                    : {
                        path: block.computedPathA.trim(),
                        symbol: block.computedCurrencySymbol || 'Rs. ',
                      }),
              }
            : undefined
        return {
          type: 'kv',
          designerType: 'kv',
          label: block.label,
          labelKey: block.labelKey,
          ...(block.valueMode === 'template' ? { value: block.value } : {}),
          ...(block.valueMode === 'path' ? { valuePath: block.valuePath } : {}),
          ...(computed ? { computed } : {}),
          ...(Object.keys(style).length > 0 ? { style } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'table') {
        let columns: unknown[] = []
        try {
          const parsed = JSON.parse(block.columnsJson || '[]') as unknown
          if (Array.isArray(parsed)) columns = parsed
        } catch {
          columns = []
        }

        const defaultRows =
          Array.isArray(block.defaultRows) && block.defaultRows.length > 0
            ? block.defaultRows
            : undefined

        return {
          type: 'table',
          designerType: 'table',
          rowsPath: block.rowsPath,
          columns,
          ...(defaultRows ? { defaultRows } : {}),
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'divider') {
        return {
          type: 'divider',
          designerType: 'divider',
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      if (block.type === 'pageBreak') {
        return {
          type: 'pageBreak',
          designerType: 'pageBreak',
          ...(visibleWhen?.path ? { visibleWhen } : {}),
        }
      }
      return {
        type: 'spacer',
        designerType: 'spacer',
        height: Number(block.height || '8'),
        ...(visibleWhen?.path ? { visibleWhen } : {}),
      }
    })

    return {
      defaultLocale,
      title,
      titleKey,
      fileNamePattern,
      layout: {
        useBankTheme,
        showHeaderFooter,
        ...(Object.keys(layoutMargins).length > 0
          ? { margins: layoutMargins }
          : {}),
        ...(parsedBannerHeight != null
          ? { bannerHeight: parsedBannerHeight }
          : {}),
      },
      translations: translationMapsByLocale,
      dataSources,
      blocks: mappedBlocks,
    }
  }, [
    bannerHeight,
    blocks,
    defaultLocale,
    fileNamePattern,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    showHeaderFooter,
    sources,
    title,
    titleKey,
    translationMapsByLocale,
    useBankTheme,
  ])

  const payloadJson = useMemo(
    () => JSON.stringify(payloadObject, null, 2),
    [payloadObject]
  )

  const comparePayloadObject = useMemo(() => {
    if (!compareTemplateRecord?.templateJson) return null
    try {
      return JSON.parse(compareTemplateRecord.templateJson) as GenericRecord
    } catch {
      return null
    }
  }, [compareTemplateRecord])

  const diffSummary = useMemo(() => {
    if (!comparePayloadObject) return null

    const metadataKeys = [
      'defaultLocale',
      'title',
      'titleKey',
      'fileNamePattern',
      'layout',
      'dataSources',
      'translations',
    ]

    const metadataChanges = metadataKeys.filter((key) => {
      const left = JSON.stringify(
        comparePayloadObject[key as keyof typeof comparePayloadObject] ?? null
      )
      const right = JSON.stringify(
        payloadObject[key as keyof typeof payloadObject] ?? null
      )
      return left !== right
    })

    const leftBlocks = Array.isArray(comparePayloadObject.blocks)
      ? comparePayloadObject.blocks
      : []
    const rightBlocks = Array.isArray(payloadObject.blocks)
      ? payloadObject.blocks
      : []

    const details: Array<{
      index: number
      status: 'added' | 'removed' | 'changed'
      before: string
      after: string
    }> = []

    const max = Math.max(leftBlocks.length, rightBlocks.length)
    let added = 0
    let removed = 0
    let changed = 0
    for (let i = 0; i < max; i += 1) {
      const before = leftBlocks[i]
      const after = rightBlocks[i]
      if (before == null && after != null) {
        added += 1
        details.push({
          index: i + 1,
          status: 'added',
          before: '',
          after: JSON.stringify(after, null, 2),
        })
        continue
      }
      if (before != null && after == null) {
        removed += 1
        details.push({
          index: i + 1,
          status: 'removed',
          before: JSON.stringify(before, null, 2),
          after: '',
        })
        continue
      }
      const left = JSON.stringify(before ?? null)
      const right = JSON.stringify(after ?? null)
      if (left !== right) {
        changed += 1
        details.push({
          index: i + 1,
          status: 'changed',
          before: JSON.stringify(before, null, 2),
          after: JSON.stringify(after, null, 2),
        })
      }
    }

    return {
      metadataChanges,
      added,
      removed,
      changed,
      details,
    }
  }, [comparePayloadObject, payloadObject])

  const comparePayloadJson = useMemo(
    () =>
      comparePayloadObject ? JSON.stringify(comparePayloadObject, null, 2) : '',
    [comparePayloadObject]
  )

  const preflight = useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!templateKey.trim()) errors.push('Template key is required.')
    if (!title.trim() && !titleKey.trim()) {
      warnings.push('Consider setting title or titleKey for PDF heading.')
    }
    if (blocks.length === 0) errors.push('At least one block is required.')

    const locales = Array.from(
      new Set([
        normalizeLocaleCode(defaultLocale),
        ...Object.keys(translationsByLocale).map((locale) =>
          normalizeLocaleCode(locale)
        ),
      ])
    )
    const byLocale: Record<string, Record<string, string>> = {}
    const unionKeys = new Set<string>()
    locales.forEach((locale) => {
      const entryMap: Record<string, string> = {}
      const entries = translationsByLocale[locale] ?? []
      entries.forEach((entry) => {
        const key = entry.key.trim()
        if (!key) return
        entryMap[key] = entry.value
        if (entry.value.trim()) {
          unionKeys.add(key)
        }
      })
      byLocale[locale] = entryMap

      const duplicates = entries
        .map((entry) => entry.key.trim())
        .filter(Boolean)
        .filter((key, idx, arr) => arr.indexOf(key) !== idx)
      if (duplicates.length > 0) {
        warnings.push(
          `Translations: locale ${locale} has duplicate keys (${Array.from(
            new Set(duplicates)
          ).join(', ')}).`
        )
      }
    })

    if (unionKeys.size > 0) {
      locales.forEach((locale) => {
        const localeMap = byLocale[locale] ?? {}
        const missing = Array.from(unionKeys).filter((key) => {
          const value = toStringSafe(localeMap[key])
          return !value.trim()
        })
        if (missing.length > 0) {
          const preview = missing.slice(0, 6).join(', ')
          warnings.push(
            `Translations: locale ${locale} is missing ${missing.length} key(s): ${preview}${
              missing.length > 6 ? ' ...' : ''
            }`
          )
        }
      })
    }

    blocks.forEach((block, index) => {
      const prefix = `Block #${index + 1} (${block.type})`
      if (
        (block.type === 'section' ||
          block.type === 'group' ||
          block.type === 'heading' ||
          block.type === 'paragraph') &&
        !block.text.trim() &&
        !block.textKey.trim()
      ) {
        warnings.push(`${prefix}: text/textKey is empty.`)
      }
      if (block.type === 'kv') {
        if (!block.label.trim() && !block.labelKey.trim()) {
          warnings.push(`${prefix}: label/labelKey is empty.`)
        }
        if (block.valueMode === 'path' && !block.valuePath.trim()) {
          warnings.push(`${prefix}: valuePath is empty.`)
        }
        if (block.valueMode === 'template' && !block.value.trim()) {
          warnings.push(`${prefix}: value template is empty.`)
        }
        if (block.valueMode === 'computed') {
          if (block.computedType === 'concat') {
            if (!block.computedPathA.trim() && !block.computedPathB.trim()) {
              warnings.push(`${prefix}: concat needs at least one source path.`)
            }
          } else if (!block.computedPathA.trim()) {
            warnings.push(`${prefix}: computed source path is empty.`)
          }
        }
      }
      if (block.type === 'table') {
        if (!block.rowsPath.trim())
          warnings.push(`${prefix}: rowsPath is empty.`)
        try {
          const cols = JSON.parse(block.columnsJson || '[]') as unknown
          if (!Array.isArray(cols)) {
            warnings.push(`${prefix}: columnsJson must be an array.`)
          } else if (cols.length === 0) {
            warnings.push(`${prefix}: add at least one table column.`)
          } else {
            cols.forEach((col, colIndex) => {
              if (!isRecord(col)) {
                warnings.push(
                  `${prefix}: column #${colIndex + 1} must be an object.`
                )
                return
              }
              const header = toStringSafe(col.header)
              const headerKey = toStringSafe(col.headerKey)
              const valuePath = toStringSafe(col.valuePath)
              const width = toStringSafe(col.width)
              const format = toStringSafe(col.format)
              if (!header.trim() && !headerKey.trim()) {
                warnings.push(
                  `${prefix}: column #${colIndex + 1} should set header or headerKey.`
                )
              }
              if (!valuePath.trim()) {
                warnings.push(
                  `${prefix}: column #${colIndex + 1} valuePath is empty.`
                )
              }
              if (width.trim() && Number.isNaN(Number(width))) {
                warnings.push(
                  `${prefix}: column #${colIndex + 1} width should be numeric.`
                )
              }
              if (
                format.trim() &&
                ![
                  'text',
                  'currency',
                  'number',
                  'date',
                  'datetime',
                  'boolean',
                ].includes(format)
              ) {
                warnings.push(
                  `${prefix}: column #${colIndex + 1} has unsupported format.`
                )
              }
            })
          }
        } catch {
          errors.push(`${prefix}: columnsJson is invalid JSON.`)
        }
      }
      if (block.visibleWhenEnabled && !block.visibleWhenPath.trim()) {
        errors.push(
          `${prefix}: visibility path is required when conditional rendering is enabled.`
        )
      }
      if (
        block.visibleWhenEnabled &&
        block.visibleWhenValueMode === 'path' &&
        !block.visibleWhenValuePath.trim()
      ) {
        errors.push(
          `${prefix}: compare path is required when condition uses path mode.`
        )
      }

      if (
        parseOptionalNumber(block.fontSize) != null &&
        Number(parseOptionalNumber(block.fontSize)) <= 0
      ) {
        warnings.push(`${prefix}: fontSize should be greater than 0.`)
      }
      if (
        parseOptionalNumber(block.lineHeight) != null &&
        Number(parseOptionalNumber(block.lineHeight)) < 0.8
      ) {
        warnings.push(`${prefix}: lineHeight below 0.8 may reduce readability.`)
      }
    })

    return { errors, warnings }
  }, [
    blocks,
    defaultLocale,
    templateKey,
    title,
    titleKey,
    translationsByLocale,
  ])

  const saveMutation = useMutation({
    mutationFn: () =>
      createWorkflowDocumentTemplateVersion({
        templateKey: templateKey.trim(),
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        defaultLocale: defaultLocale.trim() || 'en-IN',
        templateJson: JSON.stringify(payloadObject),
      }),
    onSuccess: (saved) => {
      toast.success(`Saved ${saved.templateKey} v${saved.version}`)
      queryClient.invalidateQueries({ queryKey: ['wf-document-templates'] })
      setSelectedTemplateId(saved.id ? String(saved.id) : '__none__')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Failed to save version'
      ),
  })

  const downloadPreviewMutation = useMutation({
    mutationFn: (taskId?: number) =>
      downloadWorkflowDocumentTemplatePreview({
        templateJson: JSON.stringify(payloadObject),
        locale: defaultLocale.trim() || 'en-IN',
        taskId,
      }),
    onSuccess: ({ blob, fileName }) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'template-preview.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Preview downloaded')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate preview'
      ),
  })

  const createPresetMutation = useMutation({
    mutationFn: createWorkflowDocumentBlockPreset,
    onSuccess: (preset) => {
      queryClient.invalidateQueries({
        queryKey: ['wf-document-template-presets'],
      })
      toast.success(`Preset saved: ${preset.name ?? 'preset'}`)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Failed to save preset'
      ),
  })

  const deletePresetMutation = useMutation({
    mutationFn: (id: number) => deleteWorkflowDocumentBlockPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wf-document-template-presets'],
      })
      toast.success('Preset deleted')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete preset'
      ),
  })

  const loadTemplate = (record: WorkflowDocumentTemplateRecord) => {
    const normalizedLocale = normalizeLocaleCode(
      toStringSafe(record.defaultLocale) || 'en-IN'
    )
    setTemplateKey(toStringSafe(record.templateKey))
    setName(toStringSafe(record.name))
    setDescription(toStringSafe(record.description))
    setDefaultLocale(normalizedLocale)
    setTranslationEditorLocale(normalizedLocale)

    try {
      const json = JSON.parse(record.templateJson || '{}') as GenericRecord
      const localeFromTemplate = normalizeLocaleCode(
        toStringSafe(json.defaultLocale) || normalizedLocale
      )
      setDefaultLocale(localeFromTemplate)
      setTranslationEditorLocale(localeFromTemplate)
      setTitle(toStringSafe(json.title))
      setTitleKey(toStringSafe(json.titleKey))
      setFileNamePattern(toStringSafe(json.fileNamePattern))
      const layoutRaw = isRecord(json.layout) ? json.layout : {}
      const marginsRaw = isRecord(layoutRaw.margins) ? layoutRaw.margins : {}
      setUseBankTheme(toBooleanSafe(layoutRaw.useBankTheme, true))
      setShowHeaderFooter(toBooleanSafe(layoutRaw.showHeaderFooter, true))
      setMarginTop(toStringSafe(marginsRaw.top))
      setMarginRight(toStringSafe(marginsRaw.right))
      setMarginBottom(toStringSafe(marginsRaw.bottom))
      setMarginLeft(toStringSafe(marginsRaw.left))
      setBannerHeight(toStringSafe(layoutRaw.bannerHeight))
      const rawBlocks = Array.isArray(json.blocks) ? json.blocks : []
      const parsedBlocks =
        rawBlocks.length > 0
          ? rawBlocks.map((item) => mapRawBlockToDraft(item))
          : [emptyBlock('heading')]
      replaceBlocks(parsedBlocks, true)
      setTranslationsByLocale(
        parseTranslationsByLocale(json.translations, localeFromTemplate)
      )
      setNewLocaleInput('')
    } catch {
      setUseBankTheme(true)
      setShowHeaderFooter(true)
      setMarginTop('')
      setMarginRight('')
      setMarginBottom('')
      setMarginLeft('')
      setBannerHeight('')
      replaceBlocks([emptyBlock('heading')], true)
      setTranslationsByLocale({ [normalizedLocale]: [emptyTranslationEntry()] })
      setTranslationEditorLocale(normalizedLocale)
      setNewLocaleInput('')
    }
  }

  const loadFromImportJson = () => {
    try {
      const parsed = JSON.parse(importJson || '{}') as GenericRecord
      const locale = normalizeLocaleCode(
        toStringSafe(parsed.defaultLocale) || defaultLocale
      )
      setDefaultLocale(locale)
      setTranslationEditorLocale(locale)
      setTitle(toStringSafe(parsed.title))
      setTitleKey(toStringSafe(parsed.titleKey))
      setFileNamePattern(toStringSafe(parsed.fileNamePattern))
      const layoutRaw = isRecord(parsed.layout) ? parsed.layout : {}
      const marginsRaw = isRecord(layoutRaw.margins) ? layoutRaw.margins : {}
      setUseBankTheme(toBooleanSafe(layoutRaw.useBankTheme, true))
      setShowHeaderFooter(toBooleanSafe(layoutRaw.showHeaderFooter, true))
      setMarginTop(toStringSafe(marginsRaw.top))
      setMarginRight(toStringSafe(marginsRaw.right))
      setMarginBottom(toStringSafe(marginsRaw.bottom))
      setMarginLeft(toStringSafe(marginsRaw.left))
      setBannerHeight(toStringSafe(layoutRaw.bannerHeight))

      if (Array.isArray(parsed.blocks)) {
        replaceBlocks(
          parsed.blocks.map((item) => mapRawBlockToDraft(item)),
          true
        )
      }

      if (Array.isArray(parsed.dataSources)) {
        const nextSources = parsed.dataSources
          .map((item) => {
            const row = isRecord(item) ? item : {}
            const providerValue = toStringSafe(row.provider) as ProviderKey
            return {
              id: createId(),
              alias: toStringSafe(row.alias),
              provider: ([
                'customerProfile',
                'accountProfile',
                'userProfile',
              ].includes(providerValue)
                ? providerValue
                : 'customerProfile') as ProviderKey,
              paramsJson: JSON.stringify(row.params ?? {}, null, 2),
            } satisfies DataSourceDraft
          })
          .filter((item) => item.alias.trim())
        setSources(nextSources.length > 0 ? nextSources : [emptySource()])
      }

      setTranslationsByLocale(
        parseTranslationsByLocale(parsed.translations, locale)
      )
      setNewLocaleInput('')

      toast.success('JSON loaded into designer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid JSON')
    }
  }

  const loadExampleTemplate = (example: TemplateExample) => {
    setSelectedTemplateId('__none__')
    setTemplateKey(example.templateKey)
    setName(example.name)
    setDescription(example.description)
    setDefaultLocale(example.defaultLocale)
    setTranslationEditorLocale(example.defaultLocale)
    setTitle(example.title)
    setTitleKey(example.titleKey)
    setFileNamePattern(example.fileNamePattern)
    setTranslationsByLocale({
      [normalizeLocaleCode(example.defaultLocale)]: [
        ...(example.translations.length > 0
          ? example.translations.map((entry) => ({ ...entry, id: createId() }))
          : [emptyTranslationEntry()]),
      ],
    })
    setNewLocaleInput('')
    setSources(
      example.sources.length > 0
        ? example.sources.map((source) => ({ ...source, id: createId() }))
        : [emptySource()]
    )
    replaceBlocks(
      example.blocks.map((block) => mapRawBlockToDraft(block as unknown)),
      true
    )
    setUseBankTheme(true)
    setShowHeaderFooter(true)
    setMarginTop('')
    setMarginRight('')
    setMarginBottom('')
    setMarginLeft('')
    setBannerHeight('')
    setLayoutMode('split')
    setPreviewMode('preview')
    toast.success(`${example.label} loaded`)
  }

  const downloadPreview = () => {
    const rawTaskId = previewTaskIdInput.trim()
    if (!rawTaskId) {
      downloadPreviewMutation.mutate(undefined)
      return
    }

    const parsed = Number(rawTaskId)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast.error('Task ID must be a positive integer')
      return
    }
    downloadPreviewMutation.mutate(parsed)
  }

  const isBlockVisibleInPreview = (block: BlockDraft) => {
    if (!block.visibleWhenEnabled || !block.visibleWhenPath.trim()) return true
    const actual = resolvePath(previewContext, block.visibleWhenPath)
    const expected =
      block.visibleWhenValueMode === 'path'
        ? resolvePath(previewContext, block.visibleWhenValuePath)
        : block.visibleWhenValue
    return evaluateCondition(block.visibleWhenOperator, actual, expected)
  }
  const scrollBlockIntoContainer = (
    container: HTMLDivElement | null,
    selector: string
  ) => {
    const element = container?.querySelector(selector)
    if (!(element instanceof HTMLElement)) return

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }

  const scrollCanvasBlock = (blockId: string) => {
    scrollBlockIntoContainer(
      canvasBlocksRef.current,
      `[data-canvas-block-id="${blockId}"]`
    )
  }

  const scrollPreviewBlock = (blockId: string) => {
    scrollBlockIntoContainer(
      previewBlocksRef.current,
      `[data-preview-block-id="${blockId}"]`
    )
  }

  const openSelectedInPreview = () => {
    if (!selectedBlockId) {
      toast.error('Select a block first')
      return
    }
    setPreviewMode('preview')
    setActiveTab('preview')
  }

  const openSelectedInCanvas = () => {
    if (!selectedBlockId) {
      toast.error('Select a block first')
      return
    }
    setActiveTab('build')
  }

  const insertBlockRelative = (
    targetId: string,
    type: BlockType,
    position: 'above' | 'below',
    patch: Partial<BlockDraft> = {}
  ) => {
    const nextBlock = { ...emptyBlock(type), ...patch }

    setBlocks((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === targetId)
      if (targetIndex < 0) return [...prev, nextBlock]

      const insertIndex = position === 'above' ? targetIndex : targetIndex + 1
      const next = [...prev]
      next.splice(insertIndex, 0, nextBlock)
      return next
    })

    setSelectedBlockId(nextBlock.id)
  }

  const insertEmptySameType = (
    blockId: string,
    position: 'above' | 'below'
  ) => {
    const source = blocks.find((item) => item.id === blockId)
    if (!source) return
    insertBlockRelative(blockId, source.type, position)
    toast.success(`Inserted ${source.type} block ${position}`)
  }

  const addSimilarBlock = (blockId: string) => {
    const source = blocks.find((item) => item.id === blockId)
    if (!source) return

    const clone: BlockDraft = { ...source, id: createId() }

    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === blockId)
      if (index < 0) return [...prev, clone]
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return next
    })

    setSelectedBlockId(clone.id)
    toast.success('Similar block added')
  }

  const duplicateDefaultRow = (blockId: string, rowIndex: number) => {
    updateBlockById(blockId, (item) => {
      const currentRows = Array.isArray(item.defaultRows)
        ? [...item.defaultRows]
        : []
      const source = currentRows[rowIndex] ?? {}
      currentRows.splice(rowIndex + 1, 0, { ...source })
      return { ...item, defaultRows: currentRows }
    })
    toast.success('Default row duplicated')
  }

  const duplicateTableColumn = (blockId: string, columnId: string) => {
    updateTableColumnsByBlockId(blockId, (columns) => {
      const index = columns.findIndex((item) => item.id === columnId)
      if (index < 0) return columns

      const source = columns[index]
      const clone: TableColumnDraft = {
        ...source,
        id: createId(),
        header: source.header ? `${source.header} Copy` : source.header,
      }

      const next = [...columns]
      next.splice(index + 1, 0, clone)
      return next
    })
    toast.success('Column duplicated')
  }

  const autoFillTableColumnHeaders = (blockId: string) => {
    updateTableColumnsByBlockId(blockId, (columns) =>
      columns.map((column, index) => {
        if (column.header.trim()) return column

        const lastSegment =
          column.valuePath
            .trim()
            .replace(/^item\./, '')
            .split('.')
            .pop() || ''

        const fallbackHeader = lastSegment
          ? lastSegment
              .replace(/[_-]+/g, ' ')
              .replace(/\b\w/g, (match) => match.toUpperCase())
          : `Column ${index + 1}`

        return {
          ...column,
          header: fallbackHeader,
        }
      })
    )
    toast.success('Empty headers auto-filled')
  }

  const getInspectorTableSample = (block: BlockDraft) => {
    const parsed = parseTableColumnsDraft(block.columnsJson)
    const columns =
      parsed.columns.length > 0
        ? parsed.columns
        : TABLE_COLUMNS_FALLBACK.map((item) => ({ ...item }))

    const rowsRaw = resolvePath(previewContext, block.rowsPath)
    const rows =
      Array.isArray(rowsRaw) && rowsRaw.length > 0
        ? rowsRaw
        : Array.isArray(block.defaultRows)
          ? block.defaultRows
          : []

    return {
      columns,
      rows: rows.slice(0, 1),
      isValid: parsed.isValid,
    }
  }

  const selectedBlockSummary = useMemo(() => {
    if (!selectedBlock) return 'No block selected'

    const index = blocks.findIndex((item) => item.id === selectedBlock.id)
    const label = describeBlock(selectedBlock)
    const shortLabel =
      label.length > 60 ? `${label.slice(0, 60).trim()}…` : label

    return `#${index + 1} · ${selectedBlock.type} · ${shortLabel}`
  }, [blocks, selectedBlock])

  const getPreviewTextStyle = (
    block: BlockDraft
  ): Record<string, string | number> => ({
    ...(parseOptionalNumber(block.fontSize) != null
      ? { fontSize: parseOptionalNumber(block.fontSize) }
      : {}),
    ...(block.align ? { textAlign: block.align } : {}),
    ...(block.fontWeight !== 'normal'
      ? {
          fontWeight:
            block.fontWeight === 'bold'
              ? 700
              : block.fontWeight === 'semibold'
                ? 600
                : 500,
        }
      : block.bold
        ? { fontWeight: 700 }
        : {}),
    ...(parseOptionalNumber(block.spacingTop) != null
      ? { marginTop: parseOptionalNumber(block.spacingTop) }
      : {}),
    ...(parseOptionalNumber(block.spacingBottom) != null
      ? { marginBottom: parseOptionalNumber(block.spacingBottom) }
      : {}),
    ...(parseOptionalNumber(block.lineHeight) != null
      ? { lineHeight: parseOptionalNumber(block.lineHeight) }
      : {}),
  })

  const renderPreviewBlockShell = (
    block: BlockDraft,
    index: number,
    content: ReactNode
  ) => {
    const isSelected = selectedBlockId === block.id
    const isPulsing = pulseBlockId === block.id
    const hasSelection = selectedBlockId != null
    const meta = BLOCK_TYPE_META[block.type]

    return (
      <div
        key={block.id}
        data-preview-block-id={block.id}
        role='button'
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={() => setSelectedBlockId(block.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setSelectedBlockId(block.id)
          }
        }}
        className={cn(
          'group/preview relative cursor-pointer rounded-lg border p-2.5 transition-all duration-200 outline-none',
          'hover:border-primary/40 hover:bg-primary/5',
          'focus-visible:ring-primary/30 focus-visible:ring-2',
          hasSelection && !isSelected && 'opacity-80',
          previewFocusMode &&
            hasSelection &&
            !isSelected &&
            'scale-[0.995] opacity-35',
          isSelected &&
            'border-primary bg-primary/5 ring-primary/30 opacity-100 shadow-sm ring-1',
          isPulsing && 'ring-primary/35 ring-2'
        )}
      >
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='font-mono text-[9px]'>
              #{index + 1}
            </Badge>

            <Badge
              variant='outline'
              className={cn('font-mono text-[9px]', meta.badgeClass)}
            >
              {meta.short}
            </Badge>

            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-medium capitalize',
                meta.chipClass
              )}
            >
              {block.type}
            </span>
          </div>

          {isSelected ? <Badge className='text-[9px]'>Selected</Badge> : null}
        </div>

        <div
          className={cn(
            'absolute top-0 bottom-0 left-0 w-1 rounded-l-lg transition-colors',
            isSelected
              ? 'bg-primary'
              : 'group-hover/preview:bg-primary/30 bg-transparent'
          )}
        />

        {content}
      </div>
    )
  }
  const renderPreviewBlockContent = (block: BlockDraft): JSX.Element | null => {
    const style = getPreviewTextStyle(block)

    if (block.type === 'section') {
      return (
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold' style={style}>
            {interpolate(
              block.textKey ? `{{t.${block.textKey}}}` : block.text,
              translationMap,
              previewContext
            )}
          </h2>
          <hr />
        </div>
      )
    }

    if (block.type === 'group') {
      return (
        <h3 className='text-base font-semibold' style={style}>
          {interpolate(
            block.textKey ? `{{t.${block.textKey}}}` : block.text,
            translationMap,
            previewContext
          )}
        </h3>
      )
    }

    if (block.type === 'heading') {
      return (
        <h2 className='text-lg font-semibold' style={style}>
          {interpolate(
            block.textKey ? `{{t.${block.textKey}}}` : block.text,
            translationMap,
            previewContext
          )}
        </h2>
      )
    }

    if (block.type === 'paragraph') {
      return (
        <p style={style}>
          {interpolate(
            block.textKey ? `{{t.${block.textKey}}}` : block.text,
            translationMap,
            previewContext
          )}
        </p>
      )
    }

    if (block.type === 'divider') {
      return <hr />
    }

    if (block.type === 'spacer') {
      return <div style={{ height: Number(block.height || '8') }} />
    }

    if (block.type === 'pageBreak') {
      return (
        <div className='text-muted-foreground rounded border border-dashed p-2 text-center text-xs'>
          Page Break
        </div>
      )
    }

    if (block.type === 'kv') {
      const label = interpolate(
        block.labelKey ? `{{t.${block.labelKey}}}` : block.label,
        translationMap,
        previewContext
      )

      const value = resolveBlockValue(block, translationMap, previewContext)

      return (
        <div className='grid grid-cols-[220px_1fr] border-b py-2 text-sm'>
          <div className='font-medium' style={style}>
            {label}
          </div>
          <div style={style}>{value}</div>
        </div>
      )
    }

    if (block.type === 'table') {
      const parsed = parseTableColumnsDraft(block.columnsJson)
      const columns =
        parsed.columns.length > 0
          ? parsed.columns
          : TABLE_COLUMNS_FALLBACK.map((c) => ({ ...c }))

      const rowsRaw = resolvePath(previewContext, block.rowsPath)
      const rows =
        Array.isArray(rowsRaw) && rowsRaw.length > 0
          ? rowsRaw
          : Array.isArray(block.defaultRows)
            ? block.defaultRows
            : []

      return (
        <div className='space-y-1.5'>
          <div className='w-full overflow-x-auto rounded-md border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/60'>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className='border-b px-3 py-2 text-left font-medium'
                    >
                      {interpolate(
                        col.headerKey ? `{{t.${col.headerKey}}}` : col.header,
                        translationMap,
                        previewContext
                      ) || 'Column'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className='text-muted-foreground px-3 py-3 text-center text-xs'
                    >
                      No rows (rowsPath:{' '}
                      <span className='font-mono'>
                        {block.rowsPath || '(empty)'}
                      </span>
                      )
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={`${block.id}-row-${idx}`} className='border-b'>
                      {columns.map((col) => (
                        <td key={col.id} className='px-3 py-2 align-top'>
                          {formatCell(
                            resolveItemPath(row, col.valuePath),
                            col.format
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!block.rowsPath.trim() && (
            <p className='text-destructive text-xs'>rowsPath is empty.</p>
          )}

          {!parsed.isValid && (
            <p className='text-destructive text-xs'>
              columnsJson is invalid JSON.
            </p>
          )}
        </div>
      )
    }

    return null
  }

  const renderBindingTesterPanel = () => (
    <div className='space-y-3'>
      <div className='grid gap-2 md:grid-cols-[180px_1fr_auto]'>
        <Select
          value={bindingTesterMode}
          onValueChange={(value) =>
            setBindingTesterMode(value as 'path' | 'template')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='path'>Path Mode</SelectItem>
            <SelectItem value='template'>Template Mode</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={bindingTesterExpression}
          onChange={(event) => setBindingTesterExpression(event.target.value)}
          placeholder={
            bindingTesterMode === 'path'
              ? 'forms.current.applicantName'
              : 'Loan for {{forms.current.applicantName}}'
          }
          list='wf-condition-path-options'
        />
        <Button
          type='button'
          variant={useBindingTesterForPreview ? 'default' : 'outline'}
          onClick={() => setUseBindingTesterForPreview((prev) => !prev)}
        >
          {useBindingTesterForPreview
            ? 'Preview Uses Tester'
            : 'Use In Preview'}
        </Button>
      </div>

      <div className='space-y-1'>
        <Label>Context JSON</Label>
        <Textarea
          value={bindingTesterContextJson}
          onChange={(event) => setBindingTesterContextJson(event.target.value)}
          className='min-h-45 font-mono text-xs'
        />
        {bindingTesterContextState.isValid ? (
          <p className='text-muted-foreground text-xs'>
            Context JSON is valid.
          </p>
        ) : (
          <p className='text-destructive text-xs'>
            {bindingTesterContextState.error}
          </p>
        )}
      </div>

      <div className='space-y-1'>
        <Label>Resolved Result</Label>
        <Textarea
          value={bindingTesterResult}
          readOnly
          className='min-h-21 font-mono text-xs'
        />
      </div>
    </div>
  )

  const renderSnippetsBindingAssistantPanel = () => (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setBlocks((prev) => [
              ...prev,
              {
                ...emptyBlock('heading'),
                text: 'Customer Snapshot',
              },
              {
                ...emptyBlock('kv'),
                label: 'Customer Name',
                valuePath: 'forms.current.customer_name',
              },
              {
                ...emptyBlock('kv'),
                label: 'Phone',
                valuePath: 'forms.current.phonenumber',
              },
            ])
          }
        >
          <Sparkles className='mr-1 h-4 w-4' />
          Customer Snapshot
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setBlocks((prev) => [
              ...prev,
              {
                ...emptyBlock('table'),
                rowsPath: 'documents.current',
                columnsJson:
                  '[{"header":"Type","valuePath":"item.docType"},{"header":"URL","valuePath":"item.url"}]',
              },
            ])
          }
        >
          <Sparkles className='mr-1 h-4 w-4' />
          Documents Table
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setBlocks((prev) => [
              ...prev,
              {
                ...emptyBlock('paragraph'),
                text: 'Generated by {{providers.user.fullName}} on {{task.id}}',
              },
            ])
          }
        >
          <Sparkles className='mr-1 h-4 w-4' />
          Footer Line
        </Button>
      </div>

      <Separator />

      <div className='space-y-2'>
        <Label>Binding Target</Label>
        <Select
          value={bindingTarget}
          onValueChange={(value) => setBindingTarget(value as BindingTarget)}
        >
          <SelectTrigger className='md:w-65'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='valuePath'>valuePath</SelectItem>
            <SelectItem value='rowsPath'>rowsPath</SelectItem>
            <SelectItem value='text'>text token</SelectItem>
            <SelectItem value='value'>value token</SelectItem>
            <SelectItem value='visibleWhenPath'>visibleWhen.path</SelectItem>
          </SelectContent>
        </Select>
        <div className='max-h-[220px] overflow-auto rounded border p-2'>
          <div className='flex flex-wrap gap-2'>
            {bindingPathOptions.map((path) => (
              <Button
                key={path}
                type='button'
                size='sm'
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() => applyBindingToSelectedBlock(path)}
              >
                {path}
              </Button>
            ))}
          </div>
        </div>
        <p className='text-muted-foreground text-xs'>
          Select a block first, then click any path to inject it into the
          selected target field.
        </p>
      </div>
    </div>
  )

  const renderHowToUseExamplesPanel = () => (
    <div className='space-y-4'>
      <div className='grid gap-2 text-sm md:grid-cols-2'>
        <div className='rounded-md border p-3'>
          <p className='font-medium'>1) Fill template metadata</p>
          <p className='text-muted-foreground'>
            Set template key, locale, title, and file name pattern.
          </p>
        </div>
        <div className='rounded-md border p-3'>
          <p className='font-medium'>2) Add blocks in order</p>
          <p className='text-muted-foreground'>
            Drag blocks from toolbar into canvas, then reorder by dragging
            inside canvas.
          </p>
        </div>
        <div className='rounded-md border p-3'>
          <p className='font-medium'>3) Bind data with expression builder</p>
          <p className='text-muted-foreground'>
            Use path selectors, conditional visibility builder, and computed
            fields for KV values.
          </p>
        </div>
        <div className='rounded-md border p-3'>
          <p className='font-medium'>4) Switch Preview/JSON and save</p>
          <p className='text-muted-foreground'>
            Validate output side-by-side, then publish a new immutable version.
          </p>
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Useful Binding Paths</Label>
        <div className='grid gap-2 text-xs md:grid-cols-2'>
          <code className='bg-muted rounded border px-2 py-1'>
            forms.current.applicantName
          </code>
          <code className='bg-muted rounded border px-2 py-1'>
            forms.current.amount
          </code>
          <code className='bg-muted rounded border px-2 py-1'>
            documents.current
          </code>
          <code className='bg-muted rounded border px-2 py-1'>
            providers.customer.firstName
          </code>
          <code className='bg-muted rounded border px-2 py-1'>
            providers.account.accountNo
          </code>
          <code className='bg-muted rounded border px-2 py-1'>
            providers.user.fullName
          </code>
        </div>
        <p className='text-muted-foreground text-xs'>
          Translation token example: <code>{'{{t.loan_sanction_letter}}'}</code>
          . Context token example: <code>{'{{instance.businessKey}}'}</code>.
        </p>
      </div>

      <div className='space-y-2'>
        <Label>Load Example</Label>
        <div className='flex flex-wrap gap-2'>
          {TEMPLATE_EXAMPLES.map((example) => (
            <Button
              key={example.id}
              type='button'
              variant='outline'
              size='sm'
              onClick={() => loadExampleTemplate(example)}
            >
              {example.label}
            </Button>
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>
          Start from an example, modify blocks and bindings, then save as a new
          version.
        </p>
      </div>
    </div>
  )

  const renderImportTemplateJsonPanel = () => (
    <div className='space-y-3'>
      <div className='overflow-hidden rounded-md border'>
        <CodeMirror
          value={importJson}
          onChange={(value) => setImportJson(value)}
          height='260px'
          extensions={[json()]}
          theme={oneDark} // Remove this line if you want light theme
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
          placeholder='Paste template JSON here'
          className='font-mono text-xs'
        />
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' onClick={loadFromImportJson}>
          Load Into Designer
        </Button>
        <Button variant='ghost' onClick={() => setImportJson(payloadJson)}>
          Copy Current JSON To Editor
        </Button>
      </div>
    </div>
  )

  const renderVersionDiffPanel = () => (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          size='sm'
          variant={diffMode === 'visual' ? 'default' : 'outline'}
          onClick={() => setDiffMode('visual')}
        >
          Visual Diff
        </Button>
        <Button
          type='button'
          size='sm'
          variant={diffMode === 'json' ? 'default' : 'outline'}
          onClick={() => setDiffMode('json')}
        >
          JSON Compare
        </Button>
      </div>

      <div className='space-y-2 md:max-w-105'>
        <Label>Compare Against Version</Label>
        <Select value={compareTemplateId} onValueChange={setCompareTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder='Select base version' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__none__'>-- None --</SelectItem>
            {sortedTemplates.map((template) => (
              <SelectItem key={String(template.id)} value={String(template.id)}>
                {(template.templateKey ?? 'template').trim()} v
                {template.version ?? 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {compareTemplateId === '__none__' ? (
        <p className='text-muted-foreground text-sm'>
          Select a version to compare with the current draft.
        </p>
      ) : comparePayloadObject == null ? (
        <p className='text-destructive text-sm'>
          Selected version does not contain valid template JSON.
        </p>
      ) : diffMode === 'visual' && diffSummary ? (
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>
              Metadata changed: {diffSummary.metadataChanges.length}
            </Badge>
            <Badge variant='secondary'>Blocks added: {diffSummary.added}</Badge>
            <Badge variant='secondary'>
              Blocks removed: {diffSummary.removed}
            </Badge>
            <Badge variant='secondary'>
              Blocks changed: {diffSummary.changed}
            </Badge>
          </div>

          {diffSummary.metadataChanges.length > 0 ? (
            <div className='space-y-1 rounded-md border p-3'>
              <Label className='text-xs'>Changed Metadata Keys</Label>
              <div className='flex flex-wrap gap-2'>
                {diffSummary.metadataChanges.map((key) => (
                  <Badge key={key} variant='outline'>
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {diffSummary.details.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No block-level differences found.
            </p>
          ) : (
            <div className='space-y-2'>
              {diffSummary.details.slice(0, 12).map((detail) => (
                <div
                  key={`${detail.status}-${detail.index}`}
                  className='rounded-md border p-3'
                >
                  <div className='mb-2 flex flex-wrap items-center gap-2'>
                    <Badge
                      variant={
                        detail.status === 'added'
                          ? 'secondary'
                          : detail.status === 'removed'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {detail.status}
                    </Badge>
                    <span className='text-xs'>Block #{detail.index}</span>
                  </div>
                  <div className='grid gap-2 md:grid-cols-2'>
                    <Textarea
                      value={detail.before || '(none)'}
                      readOnly
                      className='min-h-[110px] font-mono text-xs'
                    />
                    <Textarea
                      value={detail.after || '(none)'}
                      readOnly
                      className='min-h-27.5 font-mono text-xs'
                    />
                  </div>
                </div>
              ))}
              {diffSummary.details.length > 12 ? (
                <p className='text-muted-foreground text-xs'>
                  Showing first 12 block differences out of{' '}
                  {diffSummary.details.length}.
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className='grid gap-3 xl:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Base Version JSON</Label>
            <Textarea
              value={comparePayloadJson}
              readOnly
              className='min-h-[260px] font-mono text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label>Current Draft JSON</Label>
            <Textarea
              value={payloadJson}
              readOnly
              className='min-h-[260px] font-mono text-xs'
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className='bg-background/95 dark:bg-background/90 text-foreground border-primary/10 ring-primary/5 shadow-primary/5 flex h-[100dvh] flex-col overflow-y-auto border shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 backdrop-blur-3xl transition-all duration-500 md:h-[calc(100vh-4rem)] md:overflow-hidden lg:min-h-[700px] lg:rounded-2xl xl:h-[calc(100vh-2rem)] xl:rounded-3xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'>
      {/* ═══════════════════════════════════════════════
        TOP APP BAR
    ═══════════════════════════════════════════════ */}
      <header className='bg-background/60 sticky top-0 z-50 flex shrink-0 flex-col items-start justify-between gap-4 border-b border-white/10 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all md:flex-row md:items-center dark:border-white/5'>
        {/* Add a subtle background glow mesh */}
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <div className='bg-primary/10 absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-50 mix-blend-screen blur-[80px]' />
        </div>

        <div className='group relative z-10 flex shrink-0 cursor-pointer items-center gap-4'>
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='from-primary to-primary/60 border-primary/20 flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-[0_0_20px_rgba(var(--primary),0.3)]'
          >
            <FileJson2 className='text-primary-foreground h-5 w-5 drop-shadow-md' />
          </motion.div>
          <div className='flex flex-col'>
            <h1 className='from-foreground via-foreground/80 to-muted-foreground bg-gradient-to-r bg-clip-text text-lg font-extrabold tracking-tight text-transparent transition-all duration-300 group-hover:tracking-normal'>
              Template Designer
            </h1>
            <div className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
              <Sparkles className='h-3.5 w-3.5 animate-pulse text-amber-400 drop-shadow-sm' />
              PDF Workflow Engine
            </div>
          </div>
        </div>

        <div className='flex w-full flex-wrap items-center gap-4 md:w-auto md:gap-3'>
          {/* Preflight badges */}
          {preflight.errors.length > 0 && (
            <Badge variant='destructive' className='text-[10px]'>
              {preflight.errors.length} error
              {preflight.errors.length > 1 ? 's' : ''}
            </Badge>
          )}
          {preflight.warnings.length > 0 && (
            <Badge variant='secondary' className='text-[10px]'>
              {preflight.warnings.length} warning
              {preflight.warnings.length > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Load existing version */}
          <div className='flex items-center gap-2 border-r pr-3'>
            <Select
              value={selectedTemplateId}
              onValueChange={(value) => {
                setSelectedTemplateId(value)
                if (value === '__none__') return
                const selected = sortedTemplates.find(
                  (item) => Number(item.id) === Number(value)
                )
                if (selected) loadTemplate(selected)
              }}
            >
              <SelectTrigger className='h-8 w-[200px] text-xs'>
                <SelectValue placeholder='Load saved template…' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__none__'>-- None --</SelectItem>
                {sortedTemplates.map((template) => (
                  <SelectItem
                    key={String(template.id)}
                    value={String(template.id)}
                  >
                    {(template.templateKey ?? 'template').trim()} v
                    {template.version ?? 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              size='sm'
              className='h-8 text-xs'
              onClick={() => {
                setSelectedTemplateId('__none__')
                setTemplateKey('')
                setName('')
                setDescription('')
                setDefaultLocale('en-IN')
                setTitle('')
                setTitleKey('')
                setFileNamePattern('')
                replaceBlocks([emptyBlock('heading')], true)
                setSources([emptySource()])
                setTranslationsByLocale({ 'en-IN': [emptyTranslationEntry()] })
                setTranslationEditorLocale('en-IN')
                setNewLocaleInput('')
                setUseBankTheme(true)
                setShowHeaderFooter(true)
                setMarginTop('')
                setMarginRight('')
                setMarginBottom('')
                setMarginLeft('')
                setBannerHeight('')
              }}
            >
              Start Fresh
            </Button>
          </div>

          {/* Template key + Save */}
          <div className='flex items-center gap-2'>
            <Input
              className='h-8 w-[180px] font-mono text-xs'
              value={templateKey}
              placeholder='template_key'
              onChange={(e) => setTemplateKey(slugify(e.target.value))}
            />
            <Button
              size='sm'
              className='h-8 text-xs'
              disabled={saveMutation.isPending || preflight.errors.length > 0}
              onClick={() => {
                if (preflight.errors.length > 0) {
                  toast.error('Fix preflight errors before saving')
                  return
                }
                const key = slugify(templateKey)
                if (!key) {
                  toast.error('Template key is required')
                  return
                }
                setTemplateKey(key)
                saveMutation.mutate()
              }}
            >
              {saveMutation.isPending ? (
                <>
                  <Save className='mr-1.5 h-3.5 w-3.5 animate-pulse' />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-1.5 h-3.5 w-3.5' />
                  Save Version
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
        TABS
    ═══════════════════════════════════════════════ */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DesignerTab)}
        className='flex flex-1 flex-col overflow-hidden'
      >
        <div className='bg-muted/30 dark:bg-muted/10 border-primary/5 no-scrollbar flex shrink-0 items-center justify-start overflow-x-auto scroll-smooth border-b px-4 py-3 shadow-inner md:justify-center'>
          <TabsList className='bg-muted/60 h-10 rounded-full p-1 shadow-inner'>
            <TabsTrigger
              value='build'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              ✨Design Blocks
            </TabsTrigger>
            <TabsTrigger
              value='preview'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              👁️Live Preview
            </TabsTrigger>
            <TabsTrigger
              value='settings'
              className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-6 text-xs transition-all data-[state=active]:shadow-md'
            >
              ⚙️Settings & Config
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════════
          TAB 1 — BUILD (3-pane)
      ═══════════════════════════════════════════════ */}
        <TabsContent
          value='build'
          className='m-0 flex flex-1 flex-col overflow-hidden p-0 focus-visible:outline-none md:flex-row'
        >
          {/* ── LEFT PANE: Block Toolbar ── */}
          <div className='bg-muted/10 border-primary/10 z-10 flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b p-4 shadow-sm md:w-64 md:border-r md:border-b-0'>
            {/* Header */}
            <div>
              <h2 className='text-xs font-bold tracking-tight'>Block Types</h2>
              <p className='text-muted-foreground mt-0.5 text-[10px]'>
                Click or drag onto canvas
              </p>
            </div>

            {/* Undo / Redo / Duplicate */}
            <div className='space-y-1.5'>
              <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                History
              </p>
              <div className='flex gap-1'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 px-1 text-[10px]'
                  disabled={blockHistory.length === 0}
                  onClick={undoBlocks}
                >
                  <Undo2 className='mr-1 h-3 w-3' />
                  Undo
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 px-1 text-[10px]'
                  disabled={blockFuture.length === 0}
                  onClick={redoBlocks}
                >
                  <Redo2 className='mr-1 h-3 w-3' />
                  Redo
                </Button>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='h-7 w-full text-[10px]'
                onClick={duplicateSelectedBlock}
              >
                <Copy className='mr-1.5 h-3 w-3' />
                Duplicate Selected
              </Button>
            </div>

            <Separator />

            {/* Block buttons */}
            <div className='space-y-1'>
              <p className='text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase'>
                Blocks
              </p>
              {BLOCK_TOOLBAR_TYPES.map((type) => (
                <motion.button
                  key={type}
                  type='button'
                  draggable
                  onDragStart={() => setDragToolbarType(type)}
                  onDragEnd={() => setDragToolbarType(null)}
                  onClick={() => addBlock(type)}
                  className={cn(
                    'bg-background hover:border-border hover:bg-accent flex w-full items-center justify-between rounded-md border border-transparent px-2.5 py-1.5 text-left text-xs shadow-sm transition-colors',
                    dragToolbarType === type && 'border-primary bg-primary/10'
                  )}
                >
                  <span className='font-medium capitalize'>{type}</span>
                  <Plus className='text-primary h-3 w-3' />
                </motion.button>
              ))}
            </div>

            <Separator />

            {/* Tools */}
            <div className='space-y-1'>
              <p className='text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase'>
                Tools
              </p>
              {[
                {
                  label: 'How To + Examples',
                  icon: Sparkles,
                  onClick: () => setHowToModalOpen(true),
                  color: 'text-amber-500',
                },
                {
                  label: 'Snippets Assistant',
                  icon: Sparkles,
                  onClick: () => setSnippetsModalOpen(true),
                  color: 'text-primary',
                },
                {
                  label: 'Import JSON',
                  icon: FileJson2,
                  onClick: () => setImportModalOpen(true),
                  color: '',
                },
                {
                  label: 'Binding Tester',
                  icon: Eye,
                  onClick: () => setBindingTesterModalOpen(true),
                  color: '',
                },
                {
                  label: 'Version Diff',
                  icon: Columns2,
                  onClick: () => setDiffModalOpen(true),
                  color: '',
                },
              ].map(({ label, icon: Icon, onClick, color }) => (
                <Button
                  key={label}
                  variant='ghost'
                  size='sm'
                  className='h-7 w-full justify-start px-2 text-[11px]'
                  onClick={onClick}
                >
                  <Icon className={cn('mr-2 h-3 w-3', color)} />
                  {label}
                </Button>
              ))}
            </div>

            <Separator />

            {/* Autosave */}
            <div className='bg-card space-y-2 rounded-md border p-2.5'>
              <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                Autosave
              </p>
              <Select
                value={autosaveEnabled ? 'enabled' : 'disabled'}
                onValueChange={(v) => setAutosaveEnabled(v === 'enabled')}
              >
                <SelectTrigger className='h-7 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='enabled'>Enabled</SelectItem>
                  <SelectItem value='disabled'>Disabled</SelectItem>
                </SelectContent>
              </Select>
              <div className='flex gap-1'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='h-6 flex-1 px-1 text-[10px]'
                  disabled={!hasStoredDraft}
                  onClick={restoreDraftFromStorage}
                >
                  Restore
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='h-6 flex-1 px-1 text-[10px]'
                  disabled={!hasStoredDraft}
                  onClick={clearStoredDraft}
                >
                  Clear
                </Button>
              </div>
              {lastAutosavedAt && (
                <p className='text-muted-foreground truncate text-[9px]'>
                  {autosaveEnabled ? 'Auto-saved' : 'Paused'} ·{' '}
                  {new Date(lastAutosavedAt).toLocaleTimeString()}
                </p>
              )}
              <p className='text-muted-foreground text-[9px]'>
                ⌘Z undo · ⌘Y redo · ⌘D dupe
              </p>
            </div>
          </div>

          {/* ── CENTER PANE: Canvas ── */}
          <div
            className='bg-muted/5 inset-0 flex flex-1 flex-col items-center overflow-y-auto bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] p-4 shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)] md:p-8'
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragToolbarType) {
                insertBlockAt(blocks.length, dragToolbarType)
                setDragToolbarType(null)
              }
            }}
          >
            <datalist id='wf-condition-path-options'>
              {bindingPathOptions.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>

            <div
              ref={canvasBlocksRef}
              className='w-full max-w-xl space-y-2.5 pb-20'
            >
              {/* Block count badge */}
              <div className='space-y-2 px-1'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='space-y-0.5'>
                    <span className='text-muted-foreground text-xs font-semibold'>
                      Canvas
                    </span>
                    {selectedBlock ? (
                      <p className='text-muted-foreground text-[10px]'>
                        Selected: {selectedBlockSummary}
                      </p>
                    ) : null}
                  </div>

                  <Badge variant='secondary' className='text-[10px]'>
                    {blocks.length} blocks
                  </Badge>
                </div>

                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
                  <Input
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    placeholder='Search blocks, label, text, path...'
                    className='h-8 pl-8 text-xs'
                  />
                </div>

                {isCanvasFiltered ? (
                  <p className='text-muted-foreground text-[10px]'>
                    Showing {filteredBlocks.length} of {blocks.length} blocks.
                    Drag reorder is disabled while search is active.
                  </p>
                ) : null}
              </div>
              {filteredBlocks.length === 0 ? (
                <div className='border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center'>
                  <div className='bg-primary/10 mb-3 rounded-full p-4'>
                    <FileJson2 className='text-primary h-7 w-7' />
                  </div>
                  <p className='text-sm font-medium'>No blocks yet</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Click a block type on the left or drag it here.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {filteredBlocks.map((block) => {
                    const index = blocks.findIndex(
                      (item) => item.id === block.id
                    )
                    const meta = BLOCK_TYPE_META[block.type]

                    return (
                      <motion.div>
                        <div
                          key={block.id}
                          data-canvas-block-id={block.id}
                          className={cn(
                            'group bg-card relative flex cursor-pointer flex-col rounded-lg border shadow-sm transition-all duration-200',
                            selectedBlockId === block.id
                              ? 'border-primary ring-primary/30 shadow-md ring-1'
                              : 'border-border hover:border-primary/40',
                            dragBlockId === block.id && 'opacity-60',
                            dragOverBlockId === block.id &&
                              dragBlockId !== block.id &&
                              'border-primary bg-primary/5',
                            pulseBlockId === block.id &&
                              'ring-primary/25 scale-[1.01] ring-2'
                          )}
                          onClick={() => setSelectedBlockId(block.id)}
                          draggable
                          onDragStart={() => {
                            if (dragToolbarType) return
                            setDragBlockId(block.id)
                            setDragOverBlockId(block.id)
                          }}
                          onDragEnter={() => {
                            if (dragToolbarType) {
                              setDragOverBlockId(block.id)
                              return
                            }
                            if (!dragBlockId || dragBlockId === block.id) return
                            setDragOverBlockId(block.id)
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (dragToolbarType) {
                              insertBlockBeforeId(block.id, dragToolbarType)
                              setDragToolbarType(null)
                              setDragOverBlockId(null)
                              return
                            }
                            if (dragBlockId && dragBlockId !== block.id)
                              reorderBlocksById(dragBlockId, block.id)
                            setDragBlockId(null)
                            setDragOverBlockId(null)
                          }}
                          onDragEnd={() => {
                            setDragBlockId(null)
                            setDragOverBlockId(null)
                            setDragToolbarType(null)
                          }}
                        >
                          {/* Active left stripe */}
                          <div
                            className={cn(
                              'absolute top-0 bottom-0 left-0 w-0.5 rounded-l-lg transition-colors',
                              selectedBlockId === block.id
                                ? 'bg-primary'
                                : 'group-hover:bg-primary/30 bg-transparent'
                            )}
                          />

                          <div className='flex items-center justify-between gap-3 px-4 py-3'>
                            <div className='flex min-w-0 flex-1 items-center gap-2'>
                              <span className='text-muted-foreground shrink-0 font-mono text-[10px]'>
                                #{index + 1}
                              </span>
                              <Badge
                                variant='outline'
                                className={cn(
                                  'shrink-0 font-mono text-[9px]',
                                  meta.badgeClass
                                )}
                              >
                                {meta.short}
                              </Badge>

                              <span
                                className={cn(
                                  'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium capitalize',
                                  meta.chipClass
                                )}
                              >
                                {block.type}
                              </span>
                              {block.visibleWhenEnabled && (
                                <Badge
                                  variant='outline'
                                  className='shrink-0 text-[9px]'
                                >
                                  cond.
                                </Badge>
                              )}
                              <p className='text-muted-foreground truncate text-xs'>
                                {describeBlock(block)}
                              </p>
                            </div>

                            <div
                              className={cn(
                                'flex shrink-0 items-center gap-1 transition-opacity',
                                selectedBlockId === block.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'
                              )}
                            >
                              <div className='bg-muted/40 flex rounded border'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-6 w-6 rounded-none'
                                  disabled={index === 0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveBlockByOffset(block.id, -1)
                                  }}
                                >
                                  <MoveUp className='h-3 w-3' />
                                </Button>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-6 w-6 rounded-none'
                                  disabled={index === blocks.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveBlockByOffset(block.id, 1)
                                  }}
                                >
                                  <MoveDown className='h-3 w-3' />
                                </Button>
                              </div>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateBlockById(block.id)
                                }}
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='text-destructive hover:text-destructive h-6 w-6'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeBlockById(block.id)
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
              {/* End drop zone */}
              <div
                className={cn(
                  'text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-center text-xs transition-colors',
                  dragBlockId && 'border-primary text-primary bg-primary/5'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragToolbarType) {
                    insertBlockAt(blocks.length, dragToolbarType)
                    setDragToolbarType(null)
                    setDragOverBlockId(null)
                    return
                  }
                  if (!dragBlockId) return
                  setBlocks((prev) => {
                    const fromIndex = prev.findIndex(
                      (item) => item.id === dragBlockId
                    )
                    if (fromIndex < 0 || fromIndex === prev.length - 1)
                      return prev
                    const next = [...prev]
                    const [item] = next.splice(fromIndex, 1)
                    next.push(item)
                    return next
                  })
                  setDragBlockId(null)
                  setDragOverBlockId(null)
                }}
              >
                Drop block here to append at end
              </div>
            </div>
          </div>

          {/* ── RIGHT PANE: Inspector ── */}
          <div className='bg-card/80 border-primary/10 z-10 flex w-full shrink-0 flex-col overflow-y-auto border-t shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.08)] backdrop-blur-3xl md:w-[360px] md:border-t-0 md:border-l lg:w-[400px]'>
            {!selectedBlock ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'
              >
                <div className='bg-muted/50 rounded-2xl border border-white/5 p-4 shadow-inner'>
                  <FileJson2 className='text-muted-foreground/60 h-6 w-6' />
                </div>
                <div className='space-y-1'>
                  <p className='text-foreground text-sm font-medium'>
                    No Block Selected
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Click a block on the canvas to edit its properties.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedBlock.id} // Forces re-animation when switching blocks
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className='flex h-full flex-col'
              >
                {/* Inspector header */}
                <div className='bg-background/80 border-primary/10 sticky top-0 z-20 flex flex-col gap-3 border-b px-4 py-4 shadow-sm backdrop-blur-xl'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <h2 className='from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-sm font-extrabold text-transparent'>
                        Inspector
                      </h2>
                      <Badge
                        variant='outline'
                        className='bg-primary/5 border-primary/20 font-mono text-[9px]'
                      >
                        {selectedBlock.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Action Toolbar */}
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      className='bg-primary/10 hover:bg-primary/20 text-primary border-primary/10 h-7 border text-[10px] transition-all'
                      onClick={openSelectedInPreview}
                    >
                      <Eye className='mr-1.5 h-3 w-3' />
                      Preview
                    </Button>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='hover:border-primary/40 h-7 text-[10px] transition-all'
                      onClick={() =>
                        insertEmptySameType(selectedBlock.id, 'above')
                      }
                    >
                      + Above
                    </Button>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='hover:border-primary/40 h-7 text-[10px] transition-all'
                      onClick={() =>
                        insertEmptySameType(selectedBlock.id, 'below')
                      }
                    >
                      + Below
                    </Button>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='hover:border-primary/40 h-7 text-[10px] transition-all'
                      onClick={() => addSimilarBlock(selectedBlock.id)}
                    >
                      <Copy className='mr-1.5 h-3 w-3' />
                      Similar
                    </Button>
                  </div>
                </div>

                <div className='flex flex-1 flex-col pb-10'>
                  {/* ── CONTENT: section / group / heading / paragraph ── */}
                  {(selectedBlock.type === 'section' ||
                    selectedBlock.type === 'group' ||
                    selectedBlock.type === 'heading' ||
                    selectedBlock.type === 'paragraph') &&
                    renderInspectorSection(
                      'content',
                      'Content',
                      <>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Text</Label>
                          <Input
                            className='focus-visible:ring-primary/50 h-8 text-xs transition-colors'
                            value={selectedBlock.text}
                            placeholder='text'
                            onChange={(e) =>
                              updateBlockById(selectedBlock.id, (item) => ({
                                ...item,
                                text: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='flex justify-between text-xs'>
                            <span>Translation Key</span>
                            <span className='text-muted-foreground text-[9px] font-normal'>
                              Optional
                            </span>
                          </Label>
                          <Input
                            className='focus-visible:ring-primary/50 h-8 font-mono text-xs transition-colors'
                            value={selectedBlock.textKey}
                            placeholder='e.g., label.welcome'
                            onChange={(e) =>
                              updateBlockById(selectedBlock.id, (item) => ({
                                ...item,
                                textKey: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </>
                    )}

                  {/* ── CONTENT: kv ── */}
                  {selectedBlock.type === 'kv' && (
                    <div className='border-border/40 space-y-4 border-b p-4'>
                      <div className='space-y-3'>
                        <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                          Label Settings
                        </p>
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='space-y-1.5'>
                            <Label className='text-xs'>Label</Label>
                            <Input
                              className='h-8 text-xs'
                              value={selectedBlock.label}
                              placeholder='label'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  label: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs'>Label Key</Label>
                            <Input
                              className='h-8 font-mono text-xs'
                              value={selectedBlock.labelKey}
                              placeholder='labelKey'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  labelKey: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className='bg-border/50' />

                      <div className='space-y-3'>
                        <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                          Value Settings
                        </p>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Value Mode</Label>
                          <Select
                            value={selectedBlock.valueMode}
                            onValueChange={(v) =>
                              updateBlockById(selectedBlock.id, (item) => ({
                                ...item,
                                valueMode: v as ValueMode,
                              }))
                            }
                          >
                            <SelectTrigger className='bg-background/50 h-8 text-xs'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='path'>Data Path</SelectItem>
                              <SelectItem value='template'>
                                Template Expression
                              </SelectItem>
                              <SelectItem value='computed'>
                                Computed Formatting
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <AnimatePresence mode='popLayout'>
                          {selectedBlock.valueMode === 'path' && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className='space-y-1.5'
                            >
                              <Label className='text-xs'>Value Path</Label>
                              <ExpressionBuilder
                                value={selectedBlock.valuePath}
                                options={bindingPathOptions}
                                placeholder='Select value path'
                                onChange={(next) =>
                                  updateBlockById(selectedBlock.id, (item) => ({
                                    ...item,
                                    valueMode: 'path',
                                    valuePath: next,
                                  }))
                                }
                              />
                            </motion.div>
                          )}

                          {selectedBlock.valueMode === 'template' && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className='space-y-1.5'
                            >
                              <Label className='text-xs'>
                                Template Expression
                              </Label>
                              <Textarea
                                value={selectedBlock.value}
                                className='bg-background/50 min-h-[72px] font-mono text-xs'
                                placeholder='e.g. {{forms.current.applicantName}} — {{instance.businessKey}}'
                                onChange={(e) =>
                                  updateBlockById(selectedBlock.id, (item) => ({
                                    ...item,
                                    valueMode: 'template',
                                    value: e.target.value,
                                  }))
                                }
                              />
                            </motion.div>
                          )}

                          {selectedBlock.valueMode === 'computed' && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                            >
                              {/* Keep your exact existing computed logic here, just wrap in the styling */}
                              <div className='space-y-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-inner'>
                                <div className='space-y-1.5'>
                                  <Label className='text-xs font-semibold text-indigo-500 dark:text-indigo-400'>
                                    Computed Type
                                  </Label>
                                  <Select
                                    value={selectedBlock.computedType}
                                    onValueChange={(v) =>
                                      updateBlockById(
                                        selectedBlock.id,
                                        (item) => ({
                                          ...item,
                                          valueMode: 'computed',
                                          computedType: v as ComputedType,
                                        })
                                      )
                                    }
                                  >
                                    <SelectTrigger className='bg-background/80 h-8 text-xs'>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='concat'>
                                        Concat Strings
                                      </SelectItem>
                                      <SelectItem value='dateFormat'>
                                        Date Format
                                      </SelectItem>
                                      <SelectItem value='currencyFormat'>
                                        Currency Format
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* ... CONCAT ... */}
                                {selectedBlock.computedType === 'concat' && (
                                  <div className='space-y-3 pt-2'>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Source A
                                      </Label>
                                      <ExpressionBuilder
                                        value={selectedBlock.computedPathA}
                                        options={bindingPathOptions}
                                        placeholder='Source A'
                                        onChange={(next) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'concat',
                                              computedPathA: next,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Separator
                                      </Label>
                                      <Input
                                        className='bg-background/80 h-7 text-xs'
                                        value={selectedBlock.computedSeparator}
                                        placeholder='e.g. " - "'
                                        onChange={(e) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'concat',
                                              computedSeparator: e.target.value,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Source B
                                      </Label>
                                      <ExpressionBuilder
                                        value={selectedBlock.computedPathB}
                                        options={bindingPathOptions}
                                        placeholder='Source B'
                                        onChange={(next) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'concat',
                                              computedPathB: next,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* ... DATE FORMAT ... */}
                                {selectedBlock.computedType ===
                                  'dateFormat' && (
                                  <div className='space-y-3 pt-2'>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Date Source Path
                                      </Label>
                                      <ExpressionBuilder
                                        value={selectedBlock.computedPathA}
                                        options={bindingPathOptions}
                                        placeholder='Date source path'
                                        onChange={(next) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'dateFormat',
                                              computedPathA: next,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Pattern
                                      </Label>
                                      <Input
                                        className='bg-background/80 h-7 font-mono text-xs'
                                        value={selectedBlock.computedPattern}
                                        placeholder='dd MMM yyyy'
                                        onChange={(e) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'dateFormat',
                                              computedPattern: e.target.value,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* ... CURRENCY FORMAT ... */}
                                {selectedBlock.computedType ===
                                  'currencyFormat' && (
                                  <div className='space-y-3 pt-2'>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Amount Source Path
                                      </Label>
                                      <ExpressionBuilder
                                        value={selectedBlock.computedPathA}
                                        options={bindingPathOptions}
                                        placeholder='Amount source path'
                                        onChange={(next) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'currencyFormat',
                                              computedPathA: next,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                    <div className='space-y-1'>
                                      <Label className='text-[10px] text-indigo-500/80'>
                                        Currency Symbol
                                      </Label>
                                      <Input
                                        className='bg-background/80 h-7 text-xs'
                                        value={
                                          selectedBlock.computedCurrencySymbol
                                        }
                                        placeholder='Rs. '
                                        onChange={(e) =>
                                          updateBlockById(
                                            selectedBlock.id,
                                            (item) => ({
                                              ...item,
                                              valueMode: 'computed',
                                              computedType: 'currencyFormat',
                                              computedCurrencySymbol:
                                                e.target.value,
                                            })
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* ── CONTENT: table ── */}
                  {/* ── CONTENT: table ── */}
                  {selectedBlock.type === 'table' && (
                    <div className='border-border/40 space-y-5 border-b p-4'>
                      <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                        Table Config
                      </p>

                      {/* Rows Path */}
                      <div className='space-y-1.5'>
                        <Label className='text-xs'>Rows Path</Label>
                        <ExpressionBuilder
                          value={selectedBlock.rowsPath}
                          options={bindingPathOptions}
                          placeholder='rowsPath e.g. documents.current'
                          onChange={(next) =>
                            updateBlockById(selectedBlock.id, (item) => ({
                              ...item,
                              rowsPath: next,
                            }))
                          }
                        />
                      </div>

                      {/* Sample Preview */}
                      {(() => {
                        const sample = getInspectorTableSample(selectedBlock)

                        return (
                          <div className='bg-muted/20 border-border/50 rounded-xl border p-3 shadow-inner'>
                            <div className='mb-2 flex items-center justify-between'>
                              <Label className='text-xs font-semibold'>
                                Mini Sample Preview
                              </Label>
                              <span className='text-muted-foreground text-[10px]'>
                                {sample.rows.length} sample row(s)
                              </span>
                            </div>

                            {sample.rows.length === 0 ? (
                              <p className='text-muted-foreground text-xs italic'>
                                No resolved sample rows. Preview will use
                                rowsPath or default rows.
                              </p>
                            ) : (
                              <div className='space-y-1'>
                                {sample.columns.map((col) => {
                                  const firstRow = sample.rows[0]
                                  return (
                                    <div
                                      key={col.id}
                                      className='border-border/50 grid grid-cols-[120px_1fr] gap-2 border-b py-1 text-xs last:border-b-0'
                                    >
                                      <span className='text-foreground/80 font-medium'>
                                        {col.header ||
                                          col.headerKey ||
                                          col.valuePath}
                                      </span>
                                      <span className='text-muted-foreground truncate'>
                                        {formatCell(
                                          resolveItemPath(
                                            firstRow,
                                            col.valuePath
                                          ),
                                          col.format
                                        )}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      <Separator className='bg-border/50' />

                      {/* ── DEFAULT ROWS ── */}
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-xs font-semibold'>
                            Default Rows
                          </Label>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='bg-background/50 hover:bg-background h-6 text-[10px]'
                            onClick={() => {
                              updateBlockById(selectedBlock.id, (item) => {
                                const currentRows: DefaultRow[] = Array.isArray(
                                  item.defaultRows
                                )
                                  ? item.defaultRows
                                  : []
                                const newRow: DefaultRow = {}
                                selectedTableColumnsState.columns.forEach(
                                  (col) => {
                                    newRow[getDefaultRowKey(col)] = ''
                                  }
                                )
                                return {
                                  ...item,
                                  defaultRows: [...currentRows, newRow],
                                }
                              })
                            }}
                          >
                            <Plus className='mr-1 h-3 w-3' />
                            Add Row
                          </Button>
                        </div>

                        {(() => {
                          const rows: DefaultRow[] = Array.isArray(
                            selectedBlock.defaultRows
                          )
                            ? (selectedBlock.defaultRows as DefaultRow[])
                            : []

                          if (rows.length === 0) {
                            return (
                              <p className='text-muted-foreground border-border/50 rounded-lg border border-dashed p-3 text-center text-[10px]'>
                                No default rows. Click "Add Row" to add one.
                              </p>
                            )
                          }

                          return rows.map((row, rowIndex) => (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={`row-${rowIndex}`}
                              className='bg-muted/10 border-border/50 space-y-2 rounded-xl border p-3 shadow-sm'
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                                  Row {rowIndex + 1}
                                </span>
                                <div className='flex items-center gap-1'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='hover:bg-background h-6 w-6'
                                    onClick={() =>
                                      duplicateDefaultRow(
                                        selectedBlock.id,
                                        rowIndex
                                      )
                                    }
                                  >
                                    <Copy className='h-3 w-3' />
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='text-destructive hover:bg-destructive/10 h-6 w-6'
                                    onClick={() =>
                                      updateBlockById(
                                        selectedBlock.id,
                                        (item) => ({
                                          ...item,
                                          defaultRows: item.defaultRows.filter(
                                            (_, i) => i !== rowIndex
                                          ),
                                        })
                                      )
                                    }
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>

                              <div className='grid grid-cols-2 gap-2'>
                                {selectedTableColumnsState.columns.map(
                                  (col) => {
                                    const cellKey = getDefaultRowKey(col)
                                    const rowSafe = row as Record<
                                      string,
                                      string | undefined
                                    >
                                    const cellValue = rowSafe[cellKey] ?? ''

                                    return (
                                      <div key={col.id} className='space-y-1'>
                                        <Label className='text-muted-foreground block truncate text-[9px]'>
                                          {col.header ||
                                            col.headerKey ||
                                            cellKey}
                                        </Label>
                                        <Input
                                          className='bg-background/50 h-7 text-[10px]'
                                          value={cellValue}
                                          placeholder={cellKey}
                                          onChange={(e) =>
                                            updateBlockById(
                                              selectedBlock.id,
                                              (item) => {
                                                const currentRows = [
                                                  ...item.defaultRows,
                                                ]
                                                const baseRow = (currentRows[
                                                  rowIndex
                                                ] ?? {}) as DefaultRow
                                                currentRows[rowIndex] = {
                                                  ...baseRow,
                                                  [cellKey]: e.target.value,
                                                }
                                                return {
                                                  ...item,
                                                  defaultRows: currentRows,
                                                }
                                              }
                                            )
                                          }
                                        />
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            </motion.div>
                          ))
                        })()}
                      </div>

                      <Separator className='bg-border/50' />

                      {/* ── COLUMNS ── */}
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between gap-2'>
                          <Label className='text-xs font-semibold'>
                            Columns
                          </Label>
                          <div className='flex items-center gap-1.5'>
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              className='h-6 text-[10px]'
                              onClick={() =>
                                autoFillTableColumnHeaders(selectedBlock.id)
                              }
                            >
                              Auto Fill Headers
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              className='bg-background/50 hover:bg-background h-6 text-[10px]'
                              onClick={() =>
                                updateTableColumnsByBlockId(
                                  selectedBlock.id,
                                  (cols) => [
                                    ...cols,
                                    {
                                      ...emptyTableColumn(),
                                      header: `Column ${cols.length + 1}`,
                                    },
                                  ]
                                )
                              }
                            >
                              <Plus className='mr-1 h-3 w-3' />
                              Add
                            </Button>
                          </div>
                        </div>

                        <AnimatePresence mode='popLayout'>
                          {selectedTableColumnsState.columns.map(
                            (column, colIndex) => (
                              <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={column.id}
                                className='bg-muted/10 border-border/50 space-y-2.5 rounded-xl border p-3 shadow-sm'
                              >
                                <div className='flex items-center justify-between'>
                                  <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                                    Column {colIndex + 1}
                                  </span>
                                  <div className='flex items-center gap-1'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='hover:bg-background h-6 w-6'
                                      onClick={() =>
                                        duplicateTableColumn(
                                          selectedBlock.id,
                                          column.id
                                        )
                                      }
                                    >
                                      <Copy className='h-3 w-3' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='text-destructive hover:bg-destructive/10 h-6 w-6'
                                      onClick={() =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) => {
                                            const next = cols.filter(
                                              (c) => c.id !== column.id
                                            )
                                            return next.length > 0
                                              ? next
                                              : [
                                                  {
                                                    ...emptyTableColumn(),
                                                    header: 'Column 1',
                                                  },
                                                ]
                                          }
                                        )
                                      }
                                    >
                                      <Trash2 className='h-3 w-3' />
                                    </Button>
                                  </div>
                                </div>

                                <div className='grid grid-cols-2 gap-2'>
                                  <div className='space-y-1'>
                                    <Label className='text-[10px]'>
                                      Header
                                    </Label>
                                    <Input
                                      className='bg-background/50 h-7 text-xs'
                                      value={column.header}
                                      placeholder='Header'
                                      onChange={(e) =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) =>
                                            cols.map((c) =>
                                              c.id === column.id
                                                ? {
                                                    ...c,
                                                    header: e.target.value,
                                                  }
                                                : c
                                            )
                                        )
                                      }
                                    />
                                  </div>
                                  <div className='space-y-1'>
                                    <Label className='text-[10px]'>
                                      Value Path
                                    </Label>
                                    <ExpressionBuilder
                                      value={column.valuePath}
                                      options={bindingPathOptions}
                                      placeholder='item.field'
                                      showQuickPicks={false}
                                      onChange={(next) =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) =>
                                            cols.map((c) =>
                                              c.id === column.id
                                                ? { ...c, valuePath: next }
                                                : c
                                            )
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className='grid grid-cols-3 gap-2'>
                                  <div className='space-y-1'>
                                    <Label className='text-[10px]'>Align</Label>
                                    <Select
                                      value={column.align}
                                      onValueChange={(v) =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) =>
                                            cols.map((c) =>
                                              c.id === column.id
                                                ? {
                                                    ...c,
                                                    align:
                                                      v as TableColumnAlign,
                                                  }
                                                : c
                                            )
                                        )
                                      }
                                    >
                                      <SelectTrigger className='bg-background/50 h-7 text-[10px]'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='left'>
                                          left
                                        </SelectItem>
                                        <SelectItem value='center'>
                                          center
                                        </SelectItem>
                                        <SelectItem value='right'>
                                          right
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className='space-y-1'>
                                    <Label className='text-[10px]'>
                                      Format
                                    </Label>
                                    <Select
                                      value={column.format}
                                      onValueChange={(v) =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) =>
                                            cols.map((c) =>
                                              c.id === column.id
                                                ? {
                                                    ...c,
                                                    format:
                                                      v as TableColumnFormat,
                                                  }
                                                : c
                                            )
                                        )
                                      }
                                    >
                                      <SelectTrigger className='bg-background/50 h-7 text-[10px]'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          'text',
                                          'currency',
                                          'number',
                                          'date',
                                          'datetime',
                                          'boolean',
                                        ].map((f) => (
                                          <SelectItem key={f} value={f}>
                                            {f}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className='space-y-1'>
                                    <Label className='text-[10px]'>Width</Label>
                                    <Input
                                      className='bg-background/50 h-7 text-[10px]'
                                      value={column.width}
                                      placeholder='auto'
                                      onChange={(e) =>
                                        updateTableColumnsByBlockId(
                                          selectedBlock.id,
                                          (cols) =>
                                            cols.map((c) =>
                                              c.id === column.id
                                                ? {
                                                    ...c,
                                                    width: e.target.value,
                                                  }
                                                : c
                                            )
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )
                          )}
                        </AnimatePresence>

                        {!selectedTableColumnsState.isValid && (
                          <p className='text-destructive bg-destructive/10 border-destructive/20 rounded border p-2 text-xs'>
                            Raw columns JSON is invalid.
                          </p>
                        )}
                      </div>

                      <div className='space-y-1.5 pt-2'>
                        <Label className='text-xs'>
                          Raw Columns JSON (Advanced)
                        </Label>
                        <Textarea
                          value={selectedBlock.columnsJson}
                          className='bg-background/30 min-h-[80px] font-mono text-[10px]'
                          onChange={(e) =>
                            updateBlockById(selectedBlock.id, (item) => ({
                              ...item,
                              columnsJson: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ── CONTENT: spacer ── */}
                  {selectedBlock.type === 'spacer' && (
                    <div className='border-border/40 space-y-3 border-b p-4'>
                      <p className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                        Spacer Configuration
                      </p>
                      <div className='space-y-1.5'>
                        <Label className='text-xs'>
                          Height (px or standard units)
                        </Label>
                        <Input
                          className='bg-background/50 h-8 text-xs'
                          value={selectedBlock.height}
                          placeholder='8'
                          onChange={(e) =>
                            updateBlockById(selectedBlock.id, (item) => ({
                              ...item,
                              height: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ── STYLE (section / group / heading / paragraph / kv) ── */}
                  {(selectedBlock.type === 'section' ||
                    selectedBlock.type === 'group' ||
                    selectedBlock.type === 'heading' ||
                    selectedBlock.type === 'paragraph' ||
                    selectedBlock.type === 'kv') &&
                    renderInspectorSection(
                      'style',
                      'Typography & Style',
                      <>
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='space-y-1.5'>
                            <Label className='text-[10px]'>Font Size</Label>
                            <Input
                              className='bg-background/50 focus-visible:bg-background h-7 text-xs'
                              value={selectedBlock.fontSize}
                              placeholder='auto'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  fontSize: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-[10px]'>Font Weight</Label>
                            <Select
                              value={selectedBlock.fontWeight}
                              onValueChange={(v) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  fontWeight: v as FontWeight,
                                  bold: v === 'bold',
                                }))
                              }
                            >
                              <SelectTrigger className='bg-background/50 h-7 text-[10px]'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='normal'>Normal</SelectItem>
                                <SelectItem value='medium'>Medium</SelectItem>
                                <SelectItem value='semibold'>
                                  Semibold
                                </SelectItem>
                                <SelectItem value='bold'>Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='col-span-2 space-y-1.5'>
                            <Label className='text-[10px]'>Alignment</Label>
                            <div className='bg-muted/50 border-border/50 flex rounded-md border p-1'>
                              {['left', 'center', 'right'].map((align) => (
                                <button
                                  key={align}
                                  type='button'
                                  onClick={() =>
                                    updateBlockById(
                                      selectedBlock.id,
                                      (item) => ({
                                        ...item,
                                        align: align as
                                          | 'left'
                                          | 'center'
                                          | 'right',
                                      })
                                    )
                                  }
                                  className={cn(
                                    'flex-1 rounded py-1 text-[10px] capitalize transition-all',
                                    selectedBlock.align === align
                                      ? 'bg-background text-foreground font-semibold shadow-sm'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-[10px]'>Spacing Top</Label>
                            <Input
                              className='bg-background/50 h-7 text-xs'
                              value={selectedBlock.spacingTop}
                              placeholder='auto'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  spacingTop: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-[10px]'>
                              Spacing Bottom
                            </Label>
                            <Input
                              className='bg-background/50 h-7 text-xs'
                              value={selectedBlock.spacingBottom}
                              placeholder='auto'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  spacingBottom: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className='col-span-2 space-y-1.5'>
                            <Label className='text-[10px]'>Line Height</Label>
                            <Input
                              className='bg-background/50 h-7 text-xs'
                              value={selectedBlock.lineHeight}
                              placeholder='auto (e.g. 1.5)'
                              onChange={(e) =>
                                updateBlockById(selectedBlock.id, (item) => ({
                                  ...item,
                                  lineHeight: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                  {/* ── CONDITIONAL VISIBILITY (all block types) ── */}
                  {renderInspectorSection(
                    'visibility',
                    'Conditional Visibility',
                    <div className='space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-inner'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs font-semibold text-amber-600 dark:text-amber-500'>
                          Enable Rendering Condition
                        </Label>
                        <Select
                          value={
                            selectedBlock.visibleWhenEnabled ? 'true' : 'false'
                          }
                          onValueChange={(v) =>
                            updateBlockById(selectedBlock.id, (item) => ({
                              ...item,
                              visibleWhenEnabled: v === 'true',
                            }))
                          }
                        >
                          <SelectTrigger className='bg-background/80 h-7 w-20 text-xs'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='false'>Off</SelectItem>
                            <SelectItem value='true'>On</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <AnimatePresence mode='popLayout'>
                        {selectedBlock.visibleWhenEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='space-y-3 overflow-hidden border-t border-amber-500/20 pt-3'
                          >
                            <div className='space-y-1.5'>
                              <Label className='text-[10px] text-amber-600/80'>
                                Condition Data Path
                              </Label>
                              <ExpressionBuilder
                                value={selectedBlock.visibleWhenPath}
                                options={bindingPathOptions}
                                placeholder='forms.current.status'
                                onChange={(next) =>
                                  updateBlockById(selectedBlock.id, (item) => ({
                                    ...item,
                                    visibleWhenPath: next,
                                  }))
                                }
                              />
                            </div>

                            <div className='space-y-1.5'>
                              <Label className='text-[10px] text-amber-600/80'>
                                Operator
                              </Label>
                              <Select
                                value={selectedBlock.visibleWhenOperator}
                                onValueChange={(v) =>
                                  updateBlockById(selectedBlock.id, (item) => ({
                                    ...item,
                                    visibleWhenOperator: v as ConditionOperator,
                                  }))
                                }
                              >
                                <SelectTrigger className='bg-background/80 h-8 text-xs'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='equals'>
                                    Equals (==)
                                  </SelectItem>
                                  <SelectItem value='notEquals'>
                                    Not Equals (!=)
                                  </SelectItem>
                                  <SelectItem value='contains'>
                                    Contains
                                  </SelectItem>
                                  <SelectItem value='exists'>
                                    Exists (Is Not Null)
                                  </SelectItem>
                                  <SelectItem value='notExists'>
                                    Not Exists (Is Null)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className='space-y-1.5'>
                              <Label className='text-[10px] text-amber-600/80'>
                                Compare Against
                              </Label>
                              <div className='flex gap-2'>
                                <Select
                                  value={selectedBlock.visibleWhenValueMode}
                                  onValueChange={(v) =>
                                    updateBlockById(
                                      selectedBlock.id,
                                      (item) => ({
                                        ...item,
                                        visibleWhenValueMode:
                                          v as ConditionValueMode,
                                      })
                                    )
                                  }
                                >
                                  <SelectTrigger className='bg-background/80 h-8 w-[110px] text-xs'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='literal'>
                                      Literal String
                                    </SelectItem>
                                    <SelectItem value='path'>
                                      Data Path
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className='flex-1'>
                                  {selectedBlock.visibleWhenValueMode ===
                                  'path' ? (
                                    <ExpressionBuilder
                                      value={selectedBlock.visibleWhenValuePath}
                                      options={bindingPathOptions}
                                      placeholder='e.g. user.role'
                                      onChange={(next) =>
                                        updateBlockById(
                                          selectedBlock.id,
                                          (item) => ({
                                            ...item,
                                            visibleWhenValueMode: 'path',
                                            visibleWhenValuePath: next,
                                          })
                                        )
                                      }
                                    />
                                  ) : (
                                    <Input
                                      className='bg-background/80 h-8 text-xs'
                                      value={selectedBlock.visibleWhenValue}
                                      placeholder='Value...'
                                      onChange={(e) =>
                                        updateBlockById(
                                          selectedBlock.id,
                                          (item) => ({
                                            ...item,
                                            visibleWhenValueMode: 'literal',
                                            visibleWhenValue: e.target.value,
                                          })
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════
          TAB 2 — LIVE PREVIEW
      ═══════════════════════════════════════════════ */}
        <TabsContent
          value='preview'
          className='bg-muted/10 m-0 flex flex-1 justify-center overflow-y-auto p-6'
        >
          <div className='w-full max-w-3xl space-y-4'>
            <Card className='shadow-lg'>
              <CardHeader className='bg-card border-b pb-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <CardTitle className='text-xl font-bold'>
                      {title || 'Template Preview'}
                    </CardTitle>
                    <CardDescription className='mt-1 text-xs'>
                      {blocks.length} blocks · sample context data ·{' '}
                      {selectedBlockSummary}
                    </CardDescription>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Input
                      value={previewTaskIdInput}
                      onChange={(e) => setPreviewTaskIdInput(e.target.value)}
                      placeholder='Task ID (optional)'
                      className='h-8 w-[140px] text-xs'
                    />

                    <Button
                      size='sm'
                      variant='outline'
                      disabled={downloadPreviewMutation.isPending}
                      onClick={downloadPreview}
                    >
                      <Download className='mr-1.5 h-3.5 w-3.5' />
                      {downloadPreviewMutation.isPending
                        ? 'Generating…'
                        : 'Download PDF'}
                    </Button>

                    <Button
                      size='sm'
                      variant={previewFocusMode ? 'default' : 'outline'}
                      onClick={() => setPreviewFocusMode((prev) => !prev)}
                      disabled={!selectedBlockId}
                    >
                      {previewFocusMode ? 'Focus On' : 'Focus Off'}
                    </Button>

                    <Button
                      size='sm'
                      variant='outline'
                      onClick={openSelectedInCanvas}
                      disabled={!selectedBlockId}
                    >
                      Open in Canvas
                    </Button>

                    <Button
                      size='sm'
                      variant={
                        previewMode === 'preview' ? 'default' : 'outline'
                      }
                      onClick={() => setPreviewMode('preview')}
                    >
                      <Eye className='mr-1.5 h-3.5 w-3.5' />
                      Preview
                    </Button>

                    <Button
                      size='sm'
                      variant={previewMode === 'json' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('json')}
                    >
                      <FileJson2 className='mr-1.5 h-3.5 w-3.5' />
                      JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                {previewMode === 'preview' ? (
                  <div ref={previewBlocksRef} className='space-y-3'>
                    {blocks.map((block, index) => {
                      if (!isBlockVisibleInPreview(block)) return null

                      const content = renderPreviewBlockContent(block)
                      if (!content) return null

                      return renderPreviewBlockShell(block, index, content)
                    })}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-muted-foreground text-xs'>
                        Generated template JSON preview
                      </p>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={copyPreviewJson}
                      >
                        <Copy className='mr-1.5 h-3.5 w-3.5' />
                        Copy JSON
                      </Button>
                    </div>

                    <pre className='max-h-[500px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-emerald-400'>
                      {payloadJson}
                    </pre>

                    <div className='flex items-center justify-between'>
                      <p className='text-muted-foreground text-xs'>
                        Need to import a saved template JSON?
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setImportModalOpen(true)}
                      >
                        Open Import Dialog
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════
          TAB 3 — SETTINGS & CONFIG
      ═══════════════════════════════════════════════ */}
        <TabsContent
          value='settings'
          className='m-0 flex-1 space-y-6 overflow-y-auto p-6'
        >
          <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-2'>
            {/* Template Metadata */}
            <Card className='shadow-sm md:col-span-2'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-sm font-bold'>
                  Template Metadata
                </CardTitle>
                <CardDescription className='text-xs'>
                  Core identifiers and display text for this template.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3 pt-4 md:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Template Key *</Label>
                  <Input
                    className='h-8 font-mono text-xs'
                    value={templateKey}
                    onChange={(e) => setTemplateKey(slugify(e.target.value))}
                    placeholder='sanction_letter'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Name</Label>
                  <Input
                    className='h-8 text-xs'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className='space-y-1.5 md:col-span-2'>
                  <Label className='text-xs'>Description</Label>
                  <Input
                    className='h-8 text-xs'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Default Locale</Label>
                  <Input
                    className='h-8 text-xs'
                    value={defaultLocale}
                    onChange={(e) =>
                      setDefaultLocale(e.target.value || 'en-IN')
                    }
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>File Name Pattern</Label>
                  <Input
                    className='h-8 font-mono text-xs'
                    value={fileNamePattern}
                    onChange={(e) => setFileNamePattern(e.target.value)}
                    placeholder='report-{{instance.businessKey}}-{{task.id}}'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Title</Label>
                  <Input
                    className='h-8 text-xs'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Title Key</Label>
                  <Input
                    className='h-8 font-mono text-xs'
                    value={titleKey}
                    onChange={(e) => setTitleKey(e.target.value)}
                    placeholder='report_title'
                  />
                </div>
              </CardContent>
            </Card>

            {/* PDF Layout */}
            <Card className='shadow-sm'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-sm font-bold'>
                  PDF Layout Options
                </CardTitle>
                <CardDescription className='text-xs'>
                  Theme, header/footer, and margin overrides.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 pt-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Use Bank Theme</Label>
                    <Select
                      value={useBankTheme ? 'true' : 'false'}
                      onValueChange={(v) => setUseBankTheme(v === 'true')}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='true'>Yes</SelectItem>
                        <SelectItem value='false'>No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Show Header/Footer</Label>
                    <Select
                      value={showHeaderFooter ? 'true' : 'false'}
                      onValueChange={(v) => setShowHeaderFooter(v === 'true')}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='true'>Yes</SelectItem>
                        <SelectItem value='false'>No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <p className='text-muted-foreground text-[10px] font-semibold uppercase'>
                  Margin Overrides
                </p>
                <div className='grid grid-cols-2 gap-2'>
                  {(
                    [
                      ['Margin Top', marginTop, setMarginTop],
                      ['Margin Right', marginRight, setMarginRight],
                      ['Margin Bottom', marginBottom, setMarginBottom],
                      ['Margin Left', marginLeft, setMarginLeft],
                    ] as [string, string, (v: string) => void][]
                  ).map(([lbl, val, setter]) => (
                    <div key={lbl} className='space-y-1'>
                      <Label className='text-[10px]'>{lbl}</Label>
                      <Input
                        className='h-7 text-xs'
                        value={val}
                        placeholder='auto'
                        onChange={(e) => setter(e.target.value)}
                      />
                    </div>
                  ))}
                  <div className='col-span-2 space-y-1'>
                    <Label className='text-[10px]'>Banner Height</Label>
                    <Input
                      className='h-7 text-xs'
                      value={bannerHeight}
                      placeholder='auto'
                      onChange={(e) => setBannerHeight(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preflight Check */}
            <Card className='shadow-sm'>
              <CardHeader className='border-b pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-bold'>
                    Preflight Check
                  </CardTitle>
                  <div className='flex gap-2'>
                    <Badge
                      variant={
                        preflight.errors.length > 0
                          ? 'destructive'
                          : 'secondary'
                      }
                      className='text-[10px]'
                    >
                      {preflight.errors.length} errors
                    </Badge>
                    <Badge variant='secondary' className='text-[10px]'>
                      {preflight.warnings.length} warnings
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-4'>
                {preflight.errors.length === 0 &&
                preflight.warnings.length === 0 ? (
                  <div className='flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800'>
                    <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-600' />
                    No issues detected.
                  </div>
                ) : (
                  <div className='max-h-52 space-y-1 overflow-auto'>
                    {preflight.errors.map((item, i) => (
                      <p key={`err-${i}`} className='text-destructive text-xs'>
                        • {item}
                      </p>
                    ))}
                    {preflight.warnings.map((item, i) => (
                      <p
                        key={`warn-${i}`}
                        className='text-muted-foreground text-xs'
                      >
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translations */}
            <Card className='shadow-sm md:col-span-2'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-sm font-bold'>
                  Translations
                </CardTitle>
                <CardDescription className='text-xs'>
                  Edit translations per locale. Union keys across locales are
                  shown; blank values are not saved.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 pt-4'>
                <div className='grid gap-2 md:grid-cols-[200px_200px_1fr_auto]'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Default Locale</Label>
                    <Input
                      className='h-8 text-xs'
                      value={defaultLocale}
                      readOnly
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Edit Locale</Label>
                    <Select
                      value={activeTranslationLocale}
                      onValueChange={setTranslationEditorLocale}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {translationLocales.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {locale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Add Locale</Label>
                    <Input
                      className='h-8 text-xs'
                      value={newLocaleInput}
                      placeholder='e.g. hi-IN'
                      onChange={(e) => setNewLocaleInput(e.target.value)}
                    />
                  </div>
                  <div className='flex items-end'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-8 text-xs'
                      onClick={() => {
                        const locale = normalizeLocaleCode(newLocaleInput, '')
                        if (!locale) {
                          toast.error('Locale code is required')
                          return
                        }
                        setTranslationsByLocale((prev) => ({
                          ...prev,
                          [locale]:
                            Array.isArray(prev[locale]) &&
                            prev[locale].length > 0
                              ? prev[locale]
                              : [emptyTranslationEntry()],
                        }))
                        setTranslationEditorLocale(locale)
                        setNewLocaleInput('')
                      }}
                    >
                      <Plus className='mr-1 h-3.5 w-3.5' />
                      Add
                    </Button>
                  </div>
                </div>

                <div className='max-h-56 space-y-2 overflow-auto'>
                  {activeTranslations.map((entry) => (
                    <div
                      key={entry.id}
                      className='grid gap-2 md:grid-cols-[200px_1fr_auto]'
                    >
                      <Input
                        className='h-7 font-mono text-xs'
                        value={entry.key}
                        placeholder='translation.key'
                        onChange={(e) =>
                          setTranslationsByLocale((prev) => {
                            const entries = prev[activeTranslationLocale] ?? [
                              emptyTranslationEntry(),
                            ]
                            return {
                              ...prev,
                              [activeTranslationLocale]: entries.map((item) =>
                                item.id === entry.id
                                  ? { ...item, key: e.target.value }
                                  : item
                              ),
                            }
                          })
                        }
                      />
                      <Input
                        className='h-7 text-xs'
                        value={entry.value}
                        placeholder='translation value'
                        onChange={(e) =>
                          setTranslationsByLocale((prev) => {
                            const entries = prev[activeTranslationLocale] ?? [
                              emptyTranslationEntry(),
                            ]
                            return {
                              ...prev,
                              [activeTranslationLocale]: entries.map((item) =>
                                item.id === entry.id
                                  ? { ...item, value: e.target.value }
                                  : item
                              ),
                            }
                          })
                        }
                      />
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() =>
                          setTranslationsByLocale((prev) => {
                            const entries = prev[activeTranslationLocale] ?? [
                              emptyTranslationEntry(),
                            ]
                            const key = entry.key.trim()
                            const isUnionKey = key
                              ? unionTranslationKeys.includes(key)
                              : false
                            const next = isUnionKey
                              ? entries.map((item) =>
                                  item.id === entry.id
                                    ? { ...item, value: '' }
                                    : item
                                )
                              : entries.filter((item) => item.id !== entry.id)
                            return {
                              ...prev,
                              [activeTranslationLocale]:
                                next.length > 0
                                  ? next
                                  : [emptyTranslationEntry()],
                            }
                          })
                        }
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs'
                    onClick={() =>
                      setTranslationsByLocale((prev) => ({
                        ...prev,
                        [activeTranslationLocale]: [
                          ...((prev[activeTranslationLocale] ?? []).length > 0
                            ? prev[activeTranslationLocale]
                            : []),
                          emptyTranslationEntry(),
                        ],
                      }))
                    }
                  >
                    <Plus className='mr-1.5 h-3.5 w-3.5' />
                    Add Translation
                  </Button>
                  {activeTranslationLocale !==
                    normalizeLocaleCode(defaultLocale) && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs'
                      onClick={() => {
                        setTranslationsByLocale((prev) => {
                          const next = { ...prev }
                          delete next[activeTranslationLocale]
                          return Object.keys(next).length > 0
                            ? next
                            : {
                                [normalizeLocaleCode(defaultLocale)]: [
                                  emptyTranslationEntry(),
                                ],
                              }
                        })
                        setTranslationEditorLocale(
                          normalizeLocaleCode(defaultLocale)
                        )
                      }}
                    >
                      Remove Locale
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className='shadow-sm md:col-span-2'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-sm font-bold'>
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 pt-4'>
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className='space-y-2 rounded-md border p-3'
                  >
                    <div className='grid gap-2 md:grid-cols-[1fr_200px_auto]'>
                      <Input
                        className='h-8 text-xs'
                        value={source.alias}
                        placeholder='alias e.g. customer'
                        onChange={(e) =>
                          setSources((prev) =>
                            prev.map((item) =>
                              item.id === source.id
                                ? { ...item, alias: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <Select
                        value={source.provider}
                        onValueChange={(v) =>
                          setSources((prev) =>
                            prev.map((item) =>
                              item.id === source.id
                                ? { ...item, provider: v as ProviderKey }
                                : item
                            )
                          )
                        }
                      >
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='customerProfile'>
                            customerProfile
                          </SelectItem>
                          <SelectItem value='accountProfile'>
                            accountProfile
                          </SelectItem>
                          <SelectItem value='userProfile'>
                            userProfile
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-destructive h-8 w-8'
                        onClick={() =>
                          setSources((prev) =>
                            prev.length > 1
                              ? prev.filter((item) => item.id !== source.id)
                              : [emptySource()]
                          )
                        }
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                    <Textarea
                      className='font-mono text-xs'
                      value={source.paramsJson}
                      onChange={(e) =>
                        setSources((prev) =>
                          prev.map((item) =>
                            item.id === source.id
                              ? { ...item, paramsJson: e.target.value }
                              : item
                          )
                        )
                      }
                      placeholder='params JSON e.g. {"customerId":"{{bindings.primary.customerId}}"}'
                    />
                  </div>
                ))}
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs'
                  onClick={() => setSources((prev) => [...prev, emptySource()])}
                >
                  <Plus className='mr-1.5 h-3.5 w-3.5' />
                  Add Data Source
                </Button>
              </CardContent>
            </Card>

            {/* Block Presets */}
            <Card className='shadow-sm md:col-span-2'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-sm font-bold'>
                  Reusable Block Presets
                </CardTitle>
                <CardDescription className='text-xs'>
                  Save frequently used block layouts and insert them into any
                  template.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 pt-4'>
                <div className='flex flex-wrap gap-2'>
                  <Input
                    className='h-8 min-w-[140px] flex-1 text-xs'
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder='Preset name'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs'
                    disabled={createPresetMutation.isPending}
                    onClick={saveSelectedBlockAsPreset}
                  >
                    Save Selected Block
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs'
                    disabled={createPresetMutation.isPending}
                    onClick={saveAllBlocksAsPreset}
                  >
                    Save Full Layout
                  </Button>
                </div>
                <div className='space-y-2'>
                  {allPresets.length === 0 ? (
                    <p className='text-muted-foreground text-xs'>
                      No presets available.
                    </p>
                  ) : (
                    allPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className='bg-card flex items-center justify-between gap-2 rounded-md border p-2.5'
                      >
                        <div>
                          <p className='text-sm font-medium'>{preset.name}</p>
                          <p className='text-muted-foreground text-[10px]'>
                            {preset.blocks.length} block
                            {preset.blocks.length > 1 ? 's' : ''} ·{' '}
                            {preset.source === 'server' ? 'Server' : 'Built-in'}
                          </p>
                        </div>
                        <div className='flex gap-1.5'>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            className='h-7 text-xs'
                            onClick={() => applyPreset(preset)}
                          >
                            Insert
                          </Button>
                          {preset.source === 'server' && (
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              className='text-destructive h-7 w-7'
                              disabled={deletePresetMutation.isPending}
                              onClick={() => removeServerPreset(preset)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════
        DIALOGS (all unchanged)
    ═══════════════════════════════════════════════ */}
      <Dialog open={howToModalOpen} onOpenChange={setHowToModalOpen}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>How To Use + Examples</DialogTitle>
            <DialogDescription>
              Quick-start guidance, path examples, and starter templates.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[72vh] overflow-auto pr-1'>
            {renderHowToUseExamplesPanel()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Import Template JSON</DialogTitle>
            <DialogDescription>
              Load metadata, blocks, translations, and data sources from JSON.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[72vh] overflow-auto pr-1'>
            {renderImportTemplateJsonPanel()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
        <DialogContent className='sm:max-w-6xl'>
          <DialogHeader>
            <DialogTitle>Version Diff Viewer</DialogTitle>
            <DialogDescription>
              Compare your current draft against any saved template version.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[72vh] overflow-auto pr-1'>
            {renderVersionDiffPanel()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bindingTesterModalOpen}
        onOpenChange={setBindingTesterModalOpen}
      >
        <DialogContent className='sm:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>Data Binding Tester</DialogTitle>
            <DialogDescription>
              Validate path/template expressions with a custom context.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[72vh] overflow-auto pr-1'>
            {renderBindingTesterPanel()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={snippetsModalOpen} onOpenChange={setSnippetsModalOpen}>
        <DialogContent className='sm:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>Snippets + Binding Assistant</DialogTitle>
            <DialogDescription>
              Insert common block patterns and bind selected block fields
              quickly.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[72vh] overflow-auto pr-1'>
            {renderSnippetsBindingAssistantPanel()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
