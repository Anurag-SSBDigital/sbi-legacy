/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  TestTube2,
  Wrench,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, toastError } from '@/lib/utils'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  cloneEwsV2RuleVersion,
  compileEwsV2Dsl,
  createEwsV2ConfigParam,
  createAlertSeverity,
  createEwsV2Rule,
  createEwsV2RuleVersion,
  getEwsV2DslSuggestions,
  getEwsV2DslMetadata,
  getEwsV2QuestionCatalog,
  listEwsV2ConfigParams,
  listEwsV2ConfigValues,
  listAlertSeverities,
  listEwsV2Adapters,
  listEwsV2AdapterVersions,
  listEwsV2HitEvidence,
  listEwsV2RulePlugins,
  listEwsV2RunHits,
  listEwsV2RuleRuns,
  listEwsV2Rules,
  listEwsV2RuleVersions,
  publishEwsV2RuleVersion,
  revalidateAllEwsV2Rules,
  runEwsV2Rule,
  upsertEwsV2ConfigValue,
  updateAlertSeverity,
  updateEwsV2ConfigParam,
  updateEwsV2Rule,
  updateEwsV2RuleVersion,
  validateEwsV2Dsl,
  validateEwsV2RuleVersion,
  type EwsV2RevalidateRulesResult,
  type AlertSeverityDefinition,
  type EwsV2ConfigParamDefinition,
  type EwsV2ConfigParamValue,
  type EwsV2AdapterDefinition,
  type EwsV2AdapterVersion,
  type EwsV2AlertHit,
  type EwsV2DslFunction,
  type EwsV2DslMetadata,
  type EwsV2QuestionCatalog,
  type EwsV2RuleVersion,
  type EwsV2RunResult,
} from '@/features/alerts-v2/ews-v2-rule-api'

export const Route = createFileRoute(
  '/_authenticated/admin/alerts-v2-rules/$ruleId'
)({
  component: RouteComponent,
})

type RuleWorkspaceProps = {
  createVersionStandalone?: boolean
  editVersionNo?: number | null
  readOnly?: boolean
}

type DslOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'LIKE'
  | 'NOT_LIKE'
  | 'IN'
  | 'NOT_IN'
  | 'BETWEEN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'RAW'
  | 'EXISTS'
  | 'NOT_EXISTS'

type DslValueMode = 'LITERAL' | 'PARAM' | 'FIELD'

type DslCondition = {
  id: string
  left: string
  op: DslOperator
  mode: DslValueMode
  first: string
  second: string
  rawExpr: string
  subqueryJson: string
  subqueryTable: string
  subqueryAlias: string
  subquerySelectExpr: string
  subqueryLinkLeft: string
  subqueryLinkRight: string
  subqueryExtraRaw: string
}

type DslOrderBy = {
  id: string
  expr: string
  direction: 'ASC' | 'DESC'
}

type DslJoin = {
  id: string
  type: 'INNER' | 'LEFT' | 'RIGHT'
  sourceType: 'TABLE' | 'SUBQUERY'
  table: string
  subqueryJson: string
  alias: string
  on: string
  onLeft: string
  onOp: '=' | '!=' | '>' | '>=' | '<' | '<='
  onRight: string
}

type DslCte = {
  id: string
  name: string
  queryJson: string
}

type DslState = {
  ctes: DslCte[]
  fromSourceType: 'TABLE' | 'SUBQUERY'
  fromTable: string
  fromSubqueryJson: string
  fromAlias: string
  selectAcctNo: string
  selectCustName: string
  selectBranchCode: string
  selectRemarks: string
  selectAlertValue: string
  selectThresholdValue: string
  joins: DslJoin[]
  combinator: 'AND' | 'OR'
  conditions: DslCondition[]
  groupBy: string[]
  havingCombinator: 'AND' | 'OR'
  havingConditions: DslCondition[]
  orderBy: DslOrderBy[]
  limit: string
}

type DslConditionPreset = {
  id: string
  name: string
  scope: 'WHERE' | 'HAVING'
  combinator: 'AND' | 'OR'
  conditions: Omit<DslCondition, 'id'>[]
}

type DslDiagnostic = {
  level: 'error' | 'warning'
  message: string
}

type DslBuilderSection =
  | 'extensions'
  | 'fromSelect'
  | 'joins'
  | 'where'
  | 'groupBy'
  | 'having'
  | 'orderLimit'

type SchedulerMode = 'BASIC' | 'ADVANCED'
type BasicSchedulePreset =
  | 'EVERY_N_MINUTES'
  | 'EVERY_N_HOURS'
  | 'DAILY'
  | 'EVERY_N_DAYS'
  | 'WEEKLY'
  | 'MONTHLY'

type BasicSchedulerConfig = {
  preset: BasicSchedulePreset
  time: string
  minuteOfHour: string
  interval: string
  dayOfWeek: string
  dayOfMonth: string
}

type QuestionRuleSource = 'STOCK_AUDIT' | 'MSME_INSPECTION'
type QuestionAnswerOperator =
  | 'EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'ANY_NON_EMPTY'
type QuestionRuleMode = 'STANDARD' | 'MULTIPLE_CRITICAL_STOCK_AUDIT'

const OP_LABELS: Record<DslOperator, string> = {
  '=': 'is equal to',
  '!=': 'is not equal to',
  '>': 'is greater than',
  '>=': 'is greater than or equal to',
  '<': 'is less than',
  '<=': 'is less than or equal to',
  LIKE: 'contains',
  NOT_LIKE: 'does not contain',
  IN: 'is one of',
  NOT_IN: 'is not one of',
  BETWEEN: 'is between',
  IS_NULL: 'is empty',
  IS_NOT_NULL: 'is not empty',
  RAW: 'raw SQL expression',
  EXISTS: 'subquery exists',
  NOT_EXISTS: 'subquery does not exist',
}

const NUMERIC_OP_OPTIONS: DslOperator[] = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'BETWEEN',
  'IN',
  'NOT_IN',
  'IS_NULL',
  'IS_NOT_NULL',
]
const STRING_OP_OPTIONS: DslOperator[] = [
  '=',
  '!=',
  'LIKE',
  'NOT_LIKE',
  'IN',
  'NOT_IN',
  'IS_NULL',
  'IS_NOT_NULL',
]
const DATE_OP_OPTIONS: DslOperator[] = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'BETWEEN',
  'IS_NULL',
  'IS_NOT_NULL',
]
const BOOLEAN_OP_OPTIONS: DslOperator[] = ['=', '!=', 'IS_NULL', 'IS_NOT_NULL']
const UNKNOWN_OP_OPTIONS: DslOperator[] = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'LIKE',
  'NOT_LIKE',
  'IN',
  'NOT_IN',
  'BETWEEN',
  'IS_NULL',
  'IS_NOT_NULL',
]
const ADVANCED_ONLY_OPS = new Set<DslOperator>(['RAW', 'EXISTS', 'NOT_EXISTS'])

const JOIN_TYPE_LABELS: Record<DslJoin['type'], string> = {
  INNER: 'Match only',
  LEFT: 'Keep base',
  RIGHT: 'Keep related',
}

const CONDITION_MODE_LABELS: Record<DslValueMode, string> = {
  LITERAL: 'Fixed value',
  PARAM: 'Input parameter',
  FIELD: 'Another field',
}

const SOURCE_TYPE_LABELS: Record<'TABLE' | 'SUBQUERY', string> = {
  TABLE: 'Table',
  SUBQUERY: 'Subquery',
}

const FIXED_CRON_TIMEZONE = 'Asia/Kolkata'
const BASIC_DAY_OF_WEEK_OPTIONS = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
] as const
const BASIC_PRESET_OPTIONS: Array<{
  value: BasicSchedulePreset
  label: string
}> = [
  { value: 'EVERY_N_MINUTES', label: 'Every N Minutes' },
  { value: 'EVERY_N_HOURS', label: 'Every N Hours' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'EVERY_N_DAYS', label: 'Every N Days' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]
const DEFAULT_BASIC_SCHEDULER: BasicSchedulerConfig = {
  preset: 'DAILY',
  time: '06:30',
  minuteOfHour: '0',
  interval: '1',
  dayOfWeek: 'MON',
  dayOfMonth: '1',
}
const QUESTION_SOURCE_OPTIONS: Array<{
  value: QuestionRuleSource
  label: string
}> = [
  { value: 'STOCK_AUDIT', label: 'Stock Audit Responses' },
  { value: 'MSME_INSPECTION', label: 'MSME Inspection Responses' },
]
const QUESTION_OPERATOR_OPTIONS: Array<{
  value: QuestionAnswerOperator
  label: string
}> = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'STARTS_WITH', label: 'Starts With' },
  { value: 'ENDS_WITH', label: 'Ends With' },
  { value: 'ANY_NON_EMPTY', label: 'Any Non-Empty Answer' },
]
const QUESTION_MODE_OPTIONS: Array<{
  value: QuestionRuleMode
  label: string
}> = [
  { value: 'STANDARD', label: 'Standard Question Match' },
  {
    value: 'MULTIPLE_CRITICAL_STOCK_AUDIT',
    label: 'Stock Audit: Multiple Critical Issues',
  },
]
const FALLBACK_STOCK_AUDIT_QUESTIONS = [
  14, 20, 22, 23, 29, 31, 32, 37, 40, 49, 50, 51, 52, 72, 73,
]
const FALLBACK_MSME_QUESTIONS = [21, 25, 35, 54, 57, 58]

const parseDayOfWeekToken = (raw: string) => {
  const token = raw.trim().toUpperCase()
  if (!token) return null
  if (
    BASIC_DAY_OF_WEEK_OPTIONS.includes(
      token as (typeof BASIC_DAY_OF_WEEK_OPTIONS)[number]
    )
  ) {
    return token
  }
  const numeric = Number(token)
  if (!Number.isInteger(numeric)) return null
  const normalized = numeric === 7 ? 0 : numeric
  const lookup = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return normalized >= 0 && normalized < lookup.length
    ? lookup[normalized]
    : null
}

const normalizeBasicTime = (raw: string) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim())
  if (!match) return DEFAULT_BASIC_SCHEDULER.time
  return `${match[1]}:${match[2]}`
}

const normalizeRangedInt = (
  raw: string,
  min: number,
  max: number,
  fallback: string
) => {
  const value = Number(raw)
  if (!Number.isInteger(value)) return fallback
  return String(Math.min(max, Math.max(min, value)))
}

const normalizeStep = (raw: string, max: number) =>
  normalizeRangedInt(raw, 1, max, DEFAULT_BASIC_SCHEDULER.interval)

const normalizeMinuteOfHour = (raw: string) =>
  normalizeRangedInt(raw, 0, 59, DEFAULT_BASIC_SCHEDULER.minuteOfHour)

const normalizeBasicDayOfMonth = (raw: string) => {
  return normalizeRangedInt(raw, 1, 31, DEFAULT_BASIC_SCHEDULER.dayOfMonth)
}

const buildCronFromBasic = (config: BasicSchedulerConfig) => {
  const [hour, minute] = normalizeBasicTime(config.time).split(':')
  const dayOfMonth = normalizeBasicDayOfMonth(config.dayOfMonth)
  const dayOfWeek =
    parseDayOfWeekToken(config.dayOfWeek) ?? DEFAULT_BASIC_SCHEDULER.dayOfWeek
  const step = normalizeStep(config.interval, 59)
  const minuteOfHour = normalizeMinuteOfHour(config.minuteOfHour)
  switch (config.preset) {
    case 'EVERY_N_MINUTES':
      return `0 */${step} * * * *`
    case 'EVERY_N_HOURS':
      return `0 ${minuteOfHour} */${normalizeStep(config.interval, 23)} * * *`
    case 'EVERY_N_DAYS':
      return `0 ${minute} ${hour} */${normalizeStep(config.interval, 31)} * *`
    case 'WEEKLY':
      return `0 ${minute} ${hour} * * ${dayOfWeek}`
    case 'MONTHLY':
      return `0 ${minute} ${hour} ${dayOfMonth} * *`
    default:
      return `0 ${minute} ${hour} * * *`
  }
}

const describeBasicSchedule = (config: BasicSchedulerConfig) => {
  const normalized = {
    preset: config.preset,
    time: normalizeBasicTime(config.time),
    minuteOfHour: normalizeMinuteOfHour(config.minuteOfHour),
    interval: normalizeStep(config.interval, 59),
    dayOfWeek:
      parseDayOfWeekToken(config.dayOfWeek) ??
      DEFAULT_BASIC_SCHEDULER.dayOfWeek,
    dayOfMonth: normalizeBasicDayOfMonth(config.dayOfMonth),
  }
  switch (normalized.preset) {
    case 'EVERY_N_MINUTES':
      return `Runs every ${normalized.interval} minute(s) in ${FIXED_CRON_TIMEZONE}.`
    case 'EVERY_N_HOURS':
      return `Runs every ${normalizeStep(config.interval, 23)} hour(s) at minute ${normalized.minuteOfHour} in ${FIXED_CRON_TIMEZONE}.`
    case 'EVERY_N_DAYS':
      return `Runs every ${normalizeStep(config.interval, 31)} day(s) at ${normalized.time} in ${FIXED_CRON_TIMEZONE}.`
    case 'WEEKLY':
      return `Runs every ${normalized.dayOfWeek} at ${normalized.time} in ${FIXED_CRON_TIMEZONE}.`
    case 'MONTHLY':
      return `Runs monthly on day ${normalized.dayOfMonth} at ${normalized.time} in ${FIXED_CRON_TIMEZONE}.`
    default:
      return `Runs daily at ${normalized.time} in ${FIXED_CRON_TIMEZONE}.`
  }
}

const describeAdvancedSchedule = (rawCron: string) => {
  const cron = rawCron.trim() || '(empty cron expression)'
  return `Runs with custom cron "${cron}" in ${FIXED_CRON_TIMEZONE}.`
}

const parseCronToBasic = (
  cron?: string | null
): BasicSchedulerConfig | null => {
  const value = cron?.trim()
  if (!value) return null
  const parts = value.split(/\s+/)
  if (parts.length !== 6) return null
  const [sec, min, hour, dom, mon, dow] = parts
  if (sec !== '0') return null

  const parseIntToken = (token: string, minValue: number, maxValue: number) => {
    if (!/^\d+$/.test(token)) return null
    const valueNumber = Number(token)
    if (
      !Number.isInteger(valueNumber) ||
      valueNumber < minValue ||
      valueNumber > maxValue
    ) {
      return null
    }
    return valueNumber
  }
  const parseStepToken = (token: string, maxValue: number) => {
    const match = /^\*\/(\d+)$/.exec(token)
    if (!match) return null
    const valueNumber = Number(match[1])
    if (
      !Number.isInteger(valueNumber) ||
      valueNumber < 1 ||
      valueNumber > maxValue
    ) {
      return null
    }
    return valueNumber
  }

  const minuteInt = parseIntToken(min, 0, 59)
  const hourInt = parseIntToken(hour, 0, 23)
  const minuteStep = parseStepToken(min, 59)
  const hourStep = parseStepToken(hour, 23)
  const dayStep = parseStepToken(dom, 31)
  const time =
    minuteInt != null && hourInt != null
      ? `${String(hourInt).padStart(2, `0`)}:${String(minuteInt).padStart(2, `0`)}`
      : DEFAULT_BASIC_SCHEDULER.time
  const monthIsWildcard = mon === '*' || mon === '?'
  const dayOfMonthIsWildcard = dom === '*' || dom === '?'
  const dayOfWeekIsWildcard = dow === '*' || dow === '?'
  if (!monthIsWildcard) return null
  if (
    minuteStep != null &&
    hour === '*' &&
    dayOfMonthIsWildcard &&
    dayOfWeekIsWildcard
  ) {
    return {
      ...DEFAULT_BASIC_SCHEDULER,
      preset: 'EVERY_N_MINUTES',
      interval: String(minuteStep),
    }
  }
  if (
    minuteInt != null &&
    hourStep != null &&
    dayOfMonthIsWildcard &&
    dayOfWeekIsWildcard
  ) {
    return {
      ...DEFAULT_BASIC_SCHEDULER,
      preset: 'EVERY_N_HOURS',
      interval: String(hourStep),
      minuteOfHour: String(minuteInt),
    }
  }
  if (
    minuteInt != null &&
    hourInt != null &&
    dayStep != null &&
    dayOfWeekIsWildcard
  ) {
    return {
      ...DEFAULT_BASIC_SCHEDULER,
      preset: 'EVERY_N_DAYS',
      interval: String(dayStep),
      time,
    }
  }
  if (dayOfMonthIsWildcard && dayOfWeekIsWildcard) {
    if (minuteInt == null || hourInt == null) return null
    return { ...DEFAULT_BASIC_SCHEDULER, preset: 'DAILY', time }
  }
  if (dayOfMonthIsWildcard && !dayOfWeekIsWildcard) {
    if (minuteInt == null || hourInt == null) return null
    if (/[,\-/]/.test(dow)) return null
    const dayOfWeek = parseDayOfWeekToken(dow)
    if (!dayOfWeek) return null
    return {
      ...DEFAULT_BASIC_SCHEDULER,
      preset: 'WEEKLY',
      time,
      dayOfWeek,
    }
  }
  if (!dayOfMonthIsWildcard && dayOfWeekIsWildcard) {
    if (minuteInt == null || hourInt == null) return null
    if (/[,\-/]/.test(dom)) return null
    const dayOfMonth = Number(dom)
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return null
    }
    return {
      ...DEFAULT_BASIC_SCHEDULER,
      preset: 'MONTHLY',
      time,
      dayOfMonth: String(dayOfMonth),
    }
  }
  return null
}

const humanize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const NO_VALUE_OPS = new Set<DslOperator>(['IS_NULL', 'IS_NOT_NULL'])
const RANGE_OPS = new Set<DslOperator>(['BETWEEN'])
const LIST_OPS = new Set<DslOperator>(['IN', 'NOT_IN'])
const RAW_OPS = new Set<DslOperator>(['RAW'])
const SUBQUERY_OPS = new Set<DslOperator>(['EXISTS', 'NOT_EXISTS'])
const NUMERIC_TYPES = new Set([
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'integer',
  'bigint',
  'decimal',
  'numeric',
  'float',
  'double',
  'real',
])
const DATE_TYPES = new Set(['date', 'datetime', 'timestamp', 'time', 'year'])
const BOOLEAN_TYPES = new Set(['bit', 'bool', 'boolean'])
const DSL_PRESET_STORAGE_KEY = 'ews-v2-dsl-condition-presets-v1'
const DEFAULT_DSL_FUNCTIONS: EwsV2DslFunction[] = [
  { key: 'COALESCE', returnType: 'ANY', minArgs: 2, maxArgs: null },
  { key: 'CONCAT', returnType: 'STRING', minArgs: 2, maxArgs: null },
  { key: 'LOWER', returnType: 'STRING', minArgs: 1, maxArgs: 1 },
  { key: 'UPPER', returnType: 'STRING', minArgs: 1, maxArgs: 1 },
  { key: 'ABS', returnType: 'NUMBER', minArgs: 1, maxArgs: 1 },
  { key: 'ROUND', returnType: 'NUMBER', minArgs: 1, maxArgs: 2 },
  { key: 'DATE_DIFF_DAYS', returnType: 'NUMBER', minArgs: 2, maxArgs: 2 },
  { key: 'DATE_ADD_DAYS', returnType: 'DATE', minArgs: 2, maxArgs: 2 },
  { key: 'DATE_SUB_DAYS', returnType: 'DATE', minArgs: 2, maxArgs: 2 },
  { key: 'NOW', returnType: 'DATETIME', minArgs: 0, maxArgs: 0 },
  { key: 'IF_NULL', returnType: 'ANY', minArgs: 2, maxArgs: 2 },
]

const newId = () => Math.random().toString(36).slice(2, 10)
const asDate = (value?: string | null) =>
  value && value.length >= 10 ? value.slice(0, 10) : '-'

const formatJson = (raw?: string | null) => {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const parseObjectJson = (text: string) => {
  const raw = text.trim()
  if (!raw) return undefined
  const parsed = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
    throw new Error('Expected JSON object.')
  }
  return parsed as Record<string, unknown>
}

const parseJsonValue = (text: string) => {
  const raw = text.trim()
  if (!raw) return undefined
  return JSON.parse(raw) as unknown
}

const pretty = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return String(value ?? '')
  }
}

const numberOrUndefined = (raw: string) => {
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return undefined
  return Math.trunc(value)
}

const withCurrentOption = (options: string[], current?: string) => {
  const normalized = options.filter(Boolean)
  if (current && !normalized.includes(current)) {
    return [current, ...normalized]
  }
  return normalized
}

type SearchableSelectProps = {
  value?: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  allowClear?: boolean
  clearLabel?: string
  disabled?: boolean
  getLabel?: (value: string) => string
}

const SearchableSelectField = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  allowClear = false,
  clearLabel = 'Clear selection',
  disabled = false,
  getLabel,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false)
  const normalizedOptions = useMemo(
    () => withCurrentOption(options, value).filter(Boolean),
    [options, value]
  )
  const selected = value?.trim() || ''
  const selectedLabel = selected
    ? getLabel
      ? getLabel(selected)
      : selected
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className='truncate'>{selectedLabel}</span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[--radix-popover-trigger-width] p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  value={clearLabel}
                  onSelect={() => {
                    onChange('')
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !selected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {clearLabel}
                </CommandItem>
              ) : null}
              {normalizedOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={`${getLabel ? getLabel(option) : option} ${option}`}
                  onSelect={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected === option ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className='truncate'>
                    {getLabel ? getLabel(option) : option}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type LabeledControlProps = {
  label: string
  className?: string
  children: ReactNode
}

const LabeledControl = ({
  label,
  className,
  children,
}: LabeledControlProps) => (
  <div className={cn('space-y-1', className)}>
    <Label className='text-muted-foreground text-[11px] font-medium'>
      {label}
    </Label>
    {children}
  </div>
)

const defaultCondition = (): DslCondition => ({
  id: newId(),
  left: '',
  op: '=',
  mode: 'LITERAL',
  first: '',
  second: '',
  rawExpr: '',
  subqueryJson: '',
  subqueryTable: '',
  subqueryAlias: 'sq',
  subquerySelectExpr: '1',
  subqueryLinkLeft: '',
  subqueryLinkRight: '',
  subqueryExtraRaw: '',
})

const defaultJoin = (): DslJoin => ({
  id: newId(),
  type: 'INNER',
  sourceType: 'TABLE',
  table: '',
  subqueryJson: '',
  alias: '',
  on: '',
  onLeft: '',
  onOp: '=',
  onRight: '',
})

const defaultCte = (): DslCte => ({
  id: newId(),
  name: '',
  queryJson: '',
})

const defaultOrderBy = (): DslOrderBy => ({
  id: newId(),
  expr: '',
  direction: 'ASC',
})

const defaultDsl = (): DslState => ({
  ctes: [],
  fromSourceType: 'TABLE',
  fromTable: '',
  fromSubqueryJson: '',
  fromAlias: 'a',
  selectAcctNo: '',
  selectCustName: '',
  selectBranchCode: '',
  selectRemarks: '',
  selectAlertValue: '',
  selectThresholdValue: '',
  joins: [],
  combinator: 'AND',
  conditions: [defaultCondition()],
  groupBy: [],
  havingCombinator: 'AND',
  havingConditions: [defaultCondition()],
  orderBy: [],
  limit: '',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const operatorFromNode = (raw: unknown): DslOperator => {
  const token = String(raw ?? '=')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  const normalized =
    token === 'NOTLIKE' ? 'NOT_LIKE' : token === 'NOTIN' ? 'NOT_IN' : token
  const allowed: DslOperator[] = [
    '=',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    'LIKE',
    'NOT_LIKE',
    'IN',
    'NOT_IN',
    'BETWEEN',
    'IS_NULL',
    'IS_NOT_NULL',
    'RAW',
    'EXISTS',
    'NOT_EXISTS',
  ]
  return allowed.includes(normalized as DslOperator)
    ? (normalized as DslOperator)
    : '='
}

const stringFromValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const parseJoinOnClause = (on: string) => {
  const match =
    /^\s*([A-Za-z0-9_$.]+)\s*(=|!=|>=|<=|>|<)\s*([A-Za-z0-9_$.]+)\s*$/.exec(on)
  if (!match) return null
  return {
    left: match[1],
    op: match[2] as DslJoin['onOp'],
    right: match[3],
  }
}

const conditionFromNode = (node: unknown): DslCondition | null => {
  if (!isRecord(node)) return null
  const op = operatorFromNode(node.op)
  const condition = defaultCondition()
  condition.op = op
  condition.left = stringFromValue(node.left)

  if (RAW_OPS.has(op)) {
    condition.rawExpr = stringFromValue(node.expr)
    return condition
  }

  if (SUBQUERY_OPS.has(op)) {
    const subquery = isRecord(node.subquery) ? node.subquery : null
    if (subquery) {
      condition.subqueryJson = pretty(subquery)
      const from = isRecord(subquery.from) ? subquery.from : null
      condition.subqueryTable = stringFromValue(from?.table)
      condition.subqueryAlias = stringFromValue(from?.alias) || 'sq'
      const select = isRecord(subquery.select) ? subquery.select : null
      const columns = Array.isArray(select?.columns) ? select?.columns : []
      condition.subquerySelectExpr =
        columns.length > 0 ? stringFromValue(columns[0]) : '1'

      const where = isRecord(subquery.where) ? subquery.where : null
      const children = Array.isArray(where?.children) ? where?.children : []
      const firstLink = children.find(
        (child) =>
          isRecord(child) &&
          operatorFromNode(child.op) === '=' &&
          String(child.valueType ?? '').toUpperCase() === 'EXPR'
      )
      if (isRecord(firstLink)) {
        condition.subqueryLinkLeft = stringFromValue(firstLink.left)
        condition.subqueryLinkRight = stringFromValue(firstLink.expr)
      }
      const rawExtras = children
        .filter(
          (child) => isRecord(child) && operatorFromNode(child.op) === 'RAW'
        )
        .map((child) =>
          stringFromValue((child as Record<string, unknown>).expr)
        )
        .filter(Boolean)
      condition.subqueryExtraRaw = rawExtras.join(' AND ')
    }
    return condition
  }

  if (NO_VALUE_OPS.has(op)) {
    return condition
  }

  const valueType = String(node.valueType ?? 'LITERAL').toUpperCase()
  if (valueType === 'PARAM') {
    condition.mode = 'PARAM'
    condition.first = stringFromValue(node.param)
    condition.second = stringFromValue(node.secondParam)
    return condition
  }
  if (valueType === 'EXPR') {
    condition.mode = 'FIELD'
    condition.first = stringFromValue(node.expr)
    condition.second = stringFromValue(node.secondExpr)
    return condition
  }

  condition.mode = 'LITERAL'
  if (LIST_OPS.has(op)) {
    const value = node.value
    condition.first = Array.isArray(value)
      ? JSON.stringify(value)
      : stringFromValue(value)
    return condition
  }
  condition.first = stringFromValue(node.value)
  condition.second = stringFromValue(node.secondValue)
  return condition
}

const parseConditionGroup = (
  node: unknown
): {
  combinator: 'AND' | 'OR'
  conditions: DslCondition[]
} | null => {
  if (!isRecord(node)) return null
  const combinator =
    String(node.combinator ?? 'AND').toUpperCase() === 'OR' ? 'OR' : 'AND'
  const children = Array.isArray(node.children) ? node.children : []
  const conditions = children
    .map((child) => conditionFromNode(child))
    .filter((item): item is DslCondition => item !== null)
  if (!conditions.length) return null
  return { combinator, conditions }
}

const dslStateFromPayload = (payload: unknown): DslState => {
  const state = defaultDsl()
  if (!isRecord(payload)) {
    return state
  }

  const from = isRecord(payload.from) ? payload.from : null
  if (from) {
    if (from.subquery !== undefined) {
      state.fromSourceType = 'SUBQUERY'
      state.fromSubqueryJson = pretty(from.subquery)
      state.fromAlias = stringFromValue(from.alias) || 'a'
    } else {
      state.fromSourceType = 'TABLE'
      state.fromTable = stringFromValue(from.table)
      state.fromAlias = stringFromValue(from.alias) || 'a'
    }
  }

  const select = isRecord(payload.select) ? payload.select : null
  if (select) {
    state.selectAcctNo = stringFromValue(select.acctNo)
    state.selectCustName = stringFromValue(select.custName)
    state.selectBranchCode = stringFromValue(select.branchCode)
    state.selectRemarks = stringFromValue(select.remarks)
    state.selectAlertValue = stringFromValue(select.alertValue)
    state.selectThresholdValue = stringFromValue(select.thresholdValue)
  }

  const ctes = Array.isArray(payload.ctes) ? payload.ctes : []
  state.ctes = ctes
    .map((item) => {
      if (!isRecord(item)) return null
      return {
        id: newId(),
        name: stringFromValue(item.name),
        queryJson: pretty(item.query),
      } satisfies DslCte
    })
    .filter((item): item is DslCte => item !== null)

  const joins = Array.isArray(payload.joins) ? payload.joins : []
  state.joins = joins
    .map((item) => {
      if (!isRecord(item)) return null
      const on = stringFromValue(item.on)
      const parsedOn = parseJoinOnClause(on)
      return {
        id: newId(),
        type:
          String(item.type ?? 'INNER').toUpperCase() === 'LEFT'
            ? 'LEFT'
            : String(item.type ?? 'INNER').toUpperCase() === 'RIGHT'
              ? 'RIGHT'
              : 'INNER',
        sourceType: item.subquery !== undefined ? 'SUBQUERY' : 'TABLE',
        table: stringFromValue(item.table),
        subqueryJson: item.subquery !== undefined ? pretty(item.subquery) : '',
        alias: stringFromValue(item.alias),
        on,
        onLeft: parsedOn?.left ?? '',
        onOp: parsedOn?.op ?? '=',
        onRight: parsedOn?.right ?? '',
      } satisfies DslJoin
    })
    .filter((item): item is DslJoin => item !== null)

  const where = parseConditionGroup(payload.where)
  if (where) {
    state.combinator = where.combinator
    state.conditions = where.conditions
  }

  const groupBy = Array.isArray(payload.groupBy) ? payload.groupBy : []
  state.groupBy = groupBy.map((item) => stringFromValue(item)).filter(Boolean)

  const having = parseConditionGroup(payload.having)
  if (having) {
    state.havingCombinator = having.combinator
    state.havingConditions = having.conditions
  }

  const orderBy = Array.isArray(payload.orderBy) ? payload.orderBy : []
  state.orderBy = orderBy
    .map((item) => {
      if (!isRecord(item)) return null
      return {
        id: newId(),
        expr: stringFromValue(item.expr),
        direction:
          String(item.direction ?? 'ASC').toUpperCase() === 'DESC'
            ? 'DESC'
            : 'ASC',
      } satisfies DslOrderBy
    })
    .filter((item): item is DslOrderBy => item !== null)

  if (payload.limit !== null && payload.limit !== undefined) {
    state.limit = stringFromValue(payload.limit)
  }

  if (!state.conditions.length) {
    state.conditions = [defaultCondition()]
  }
  if (!state.havingConditions.length) {
    state.havingConditions = [defaultCondition()]
  }

  return state
}

const parseLiteral = (raw: string) => {
  const value = raw.trim()
  if (!value) return ''
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true'
  return value
}

const parseListLiteral = (raw: string) => {
  const value = raw.trim()
  if (!value) return []
  if (value.startsWith('[')) {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) throw new Error('IN/NOT_IN expects array JSON.')
    return parsed
  }
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => parseLiteral(token))
}

const parseListTokens = (raw: string) => {
  const value = raw.trim()
  if (!value) return [] as string[]
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
      }
    } catch {
      return []
    }
  }
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
}

const encodeListTokens = (tokens: string[]) =>
  tokens
    .map((token) => token.trim())
    .filter(Boolean)
    .join(',')

const expressionFunctionName = (expression: string) => {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(expression.trim())
  return match?.[1]?.toUpperCase() ?? null
}

const inferFunctionReturnDataType = (functionReturnType?: string | null) => {
  const type = (functionReturnType ?? '').trim().toUpperCase()
  if (!type) return undefined
  if (type === 'NUMBER') return 'decimal'
  if (type === 'DATE' || type === 'DATETIME') return 'datetime'
  if (type === 'BOOLEAN') return 'boolean'
  if (type === 'STRING') return 'varchar'
  return undefined
}

const buildFunctionExpressionTemplates = ({
  functions,
  expressions,
  resolveDataType,
}: {
  functions: EwsV2DslFunction[]
  expressions: string[]
  resolveDataType: (expression: string) => string | undefined
}) => {
  const unique = new Set<string>()
  const add = (value: string) => {
    const trimmed = value.trim()
    if (trimmed) unique.add(trimmed)
  }
  const byType = {
    number: expressions.filter((expr) => {
      const type = resolveDataType(expr)
      return Boolean(type && NUMERIC_TYPES.has(type))
    }),
    date: expressions.filter((expr) => {
      const type = resolveDataType(expr)
      return Boolean(type && DATE_TYPES.has(type))
    }),
    string: expressions.filter((expr) => {
      const type = resolveDataType(expr)
      return Boolean(
        type &&
        !NUMERIC_TYPES.has(type) &&
        !DATE_TYPES.has(type) &&
        !BOOLEAN_TYPES.has(type)
      )
    }),
  }

  const capped = (items: string[], max = 40) => items.slice(0, max)

  for (const fn of functions) {
    const key = (fn.key ?? '').trim().toUpperCase()
    if (!key) continue
    if (key === 'NOW') {
      add('NOW()')
      continue
    }
    if (key === 'LOWER' || key === 'UPPER') {
      for (const expr of capped(byType.string)) {
        add(`${key}(${expr})`)
      }
      continue
    }
    if (key === 'ABS') {
      for (const expr of capped(byType.number)) {
        add(`ABS(${expr})`)
      }
      continue
    }
    if (key === 'ROUND') {
      for (const expr of capped(byType.number)) {
        add(`ROUND(${expr}, 2)`)
      }
      continue
    }
    if (key === 'CONCAT') {
      for (const expr of capped(byType.string)) {
        add(`CONCAT(${expr}, '')`)
      }
      continue
    }
    if (key === 'COALESCE' || key === 'IF_NULL') {
      for (const expr of capped(expressions)) {
        const type = resolveDataType(expr)
        if (type && NUMERIC_TYPES.has(type)) {
          add(`${key}(${expr}, 0)`)
        } else {
          add(`${key}(${expr}, '')`)
        }
      }
      continue
    }
    if (key === 'DATE_ADD_DAYS' || key === 'DATE_SUB_DAYS') {
      for (const expr of capped(byType.date)) {
        add(`${key}(${expr}, 1)`)
      }
      continue
    }
    if (key === 'DATE_DIFF_DAYS') {
      for (const expr of capped(byType.date)) {
        add(`DATE_DIFF_DAYS(NOW(), ${expr})`)
      }
      continue
    }
    add(`${key}()`)
  }

  return Array.from(unique)
}

const inferExpressionTypeGroup = (leftType?: string) => {
  if (!leftType) return 'unknown' as const
  if (NUMERIC_TYPES.has(leftType)) return 'number' as const
  if (DATE_TYPES.has(leftType)) return 'date' as const
  if (BOOLEAN_TYPES.has(leftType)) return 'boolean' as const
  return 'string' as const
}

const getOperatorOptionsForType = ({
  leftType,
  isGuided,
  safeSqlMode,
}: {
  leftType?: string
  isGuided: boolean
  safeSqlMode: boolean
}) => {
  const typeGroup = inferExpressionTypeGroup(leftType)
  let base = UNKNOWN_OP_OPTIONS
  if (typeGroup === 'number') base = NUMERIC_OP_OPTIONS
  if (typeGroup === 'date') base = DATE_OP_OPTIONS
  if (typeGroup === 'boolean') base = BOOLEAN_OP_OPTIONS
  if (typeGroup === 'string') base = STRING_OP_OPTIONS

  const options = [...base]
  if (!isGuided) {
    options.push('RAW', 'EXISTS', 'NOT_EXISTS')
  }
  return options.filter((op) => {
    if (safeSqlMode && op === 'RAW') return false
    if (isGuided && ADVANCED_ONLY_OPS.has(op)) return false
    return true
  })
}

const toPresetCondition = (
  condition: DslCondition
): Omit<DslCondition, 'id'> => ({
  left: condition.left,
  op: condition.op,
  mode: condition.mode,
  first: condition.first,
  second: condition.second,
  rawExpr: condition.rawExpr,
  subqueryJson: condition.subqueryJson,
  subqueryTable: condition.subqueryTable,
  subqueryAlias: condition.subqueryAlias,
  subquerySelectExpr: condition.subquerySelectExpr,
  subqueryLinkLeft: condition.subqueryLinkLeft,
  subqueryLinkRight: condition.subqueryLinkRight,
  subqueryExtraRaw: condition.subqueryExtraRaw,
})

const hydratePresetCondition = (
  condition: Partial<Omit<DslCondition, 'id'>>
): DslCondition => ({
  ...defaultCondition(),
  ...condition,
  id: newId(),
})

const loadConditionPresets = (): DslConditionPreset[] => {
  try {
    const raw = window.localStorage.getItem(DSL_PRESET_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(
        (item): DslConditionPreset => ({
          id: String(item?.id ?? newId()),
          name: String(item?.name ?? '').trim(),
          scope: item?.scope === 'HAVING' ? 'HAVING' : 'WHERE',
          combinator: item?.combinator === 'OR' ? 'OR' : 'AND',
          conditions: Array.isArray(item?.conditions)
            ? item.conditions.map((condition: unknown) =>
                toPresetCondition(
                  hydratePresetCondition(
                    typeof condition === 'object' && condition !== null
                      ? (condition as Partial<Omit<DslCondition, 'id'>>)
                      : {}
                  )
                )
              )
            : [],
        })
      )
      .filter((item) => item.name)
  } catch {
    return []
  }
}

const saveConditionPresets = (presets: DslConditionPreset[]) => {
  try {
    window.localStorage.setItem(DSL_PRESET_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // ignore storage write failures
  }
}

const isFieldModeAllowed = (op: DslOperator) =>
  !LIST_OPS.has(op) &&
  !RANGE_OPS.has(op) &&
  !NO_VALUE_OPS.has(op) &&
  !RAW_OPS.has(op) &&
  !SUBQUERY_OPS.has(op)

const normalizeConditionMode = (
  op: DslOperator,
  mode: DslValueMode
): DslValueMode => {
  if (NO_VALUE_OPS.has(op) || RAW_OPS.has(op) || SUBQUERY_OPS.has(op))
    return 'LITERAL'
  if (!isFieldModeAllowed(op) && mode === 'FIELD') return 'LITERAL'
  return mode
}

const parseDslSubqueryJson = (text: string, label: string) => {
  const parsed = parseObjectJson(text)
  if (!parsed) {
    throw new Error(`${label} is required.`)
  }
  return parsed
}

const buildConditionNode = (condition: DslCondition) => {
  const op = condition.op
  if (RAW_OPS.has(op)) {
    if (!condition.rawExpr.trim())
      throw new Error('RAW expression is required.')
    return {
      kind: 'condition',
      left: '1',
      op,
      expr: condition.rawExpr.trim(),
    }
  }

  if (SUBQUERY_OPS.has(op)) {
    let subquery: Record<string, unknown>
    if (condition.subqueryJson.trim()) {
      subquery = parseDslSubqueryJson(
        condition.subqueryJson,
        `${op} subquery JSON`
      )
    } else {
      const table = condition.subqueryTable.trim()
      const alias = condition.subqueryAlias.trim() || 'sq'
      const left = condition.subqueryLinkLeft.trim()
      const right = condition.subqueryLinkRight.trim()
      if (!table || !left || !right) {
        throw new Error(
          `${op} requires subquery table + link fields (or provide Subquery JSON).`
        )
      }
      const children: Array<Record<string, unknown>> = [
        {
          kind: 'condition',
          left,
          op: '=',
          valueType: 'EXPR',
          expr: right,
        },
      ]
      if (condition.subqueryExtraRaw.trim()) {
        children.push({
          kind: 'condition',
          left: '1',
          op: 'RAW',
          expr: condition.subqueryExtraRaw.trim(),
        })
      }
      subquery = {
        from: { table, alias },
        select: { columns: [condition.subquerySelectExpr.trim() || '1'] },
        where: {
          kind: 'group',
          combinator: 'AND',
          children,
        },
      }
    }
    return {
      kind: 'condition',
      left: '1',
      op,
      subquery,
    }
  }

  const left = condition.left.trim()
  if (!left) return null

  const node: Record<string, unknown> = {
    kind: 'condition',
    left,
    op,
  }
  if (NO_VALUE_OPS.has(op)) return node

  const mode = normalizeConditionMode(op, condition.mode)
  if (mode === 'PARAM') {
    if (!condition.first.trim()) throw new Error(`Param missing for ${left}`)
    node.valueType = 'PARAM'
    node.param = condition.first.trim()
    if (RANGE_OPS.has(op)) {
      if (!condition.second.trim()) {
        throw new Error(`Second param missing for ${left}`)
      }
      node.secondParam = condition.second.trim()
    }
    return node
  }

  if (mode === 'FIELD') {
    if (!condition.first.trim())
      throw new Error(`Right field missing for ${left}`)
    node.valueType = 'EXPR'
    node.expr = condition.first.trim()
    if (RANGE_OPS.has(op)) {
      if (!condition.second.trim()) {
        throw new Error(`Second right field missing for ${left}`)
      }
      node.secondExpr = condition.second.trim()
    }
    return node
  }

  node.valueType = 'LITERAL'
  if (RANGE_OPS.has(op)) {
    if (!condition.first.trim() || !condition.second.trim()) {
      throw new Error(`Both values required for ${left}`)
    }
    node.value = parseLiteral(condition.first)
    node.secondValue = parseLiteral(condition.second)
  } else if (LIST_OPS.has(op)) {
    const values = parseListLiteral(condition.first)
    if (!values.length)
      throw new Error(`At least one value required for ${left}`)
    node.value = values
  } else {
    if (!condition.first.trim()) throw new Error(`Value required for ${left}`)
    node.value = parseLiteral(condition.first)
  }
  return node
}

const buildConditionGroup = (
  combinator: DslState['combinator'],
  conditions: DslCondition[]
) => {
  const children = conditions.map(buildConditionNode).filter(Boolean)
  if (!children.length) return undefined
  return { kind: 'group', combinator, children }
}

const isConditionConfigured = (condition: DslCondition) => {
  if (RAW_OPS.has(condition.op)) return Boolean(condition.rawExpr.trim())
  if (SUBQUERY_OPS.has(condition.op)) {
    return Boolean(
      condition.subqueryJson.trim() ||
      (condition.subqueryTable.trim() &&
        condition.subqueryLinkLeft.trim() &&
        condition.subqueryLinkRight.trim())
    )
  }
  return Boolean(condition.left.trim())
}

const buildDsl = (state: DslState) => {
  const fromSourceType = state.fromSourceType
  if (fromSourceType === 'TABLE' && !state.fromTable.trim()) {
    throw new Error('From table is required.')
  }
  if (fromSourceType === 'SUBQUERY' && !state.fromSubqueryJson.trim()) {
    throw new Error('From subquery JSON is required.')
  }
  if (!state.selectAcctNo.trim()) throw new Error('Select acctNo is required.')
  const from =
    fromSourceType === 'SUBQUERY'
      ? {
          subquery: parseDslSubqueryJson(
            state.fromSubqueryJson,
            'From subquery JSON'
          ),
          ...(state.fromAlias.trim() ? { alias: state.fromAlias.trim() } : {}),
        }
      : {
          table: state.fromTable.trim(),
          ...(state.fromAlias.trim() ? { alias: state.fromAlias.trim() } : {}),
        }
  const payload: Record<string, unknown> = {
    from,
    select: {
      acctNo: state.selectAcctNo.trim(),
      ...(state.selectCustName.trim()
        ? { custName: state.selectCustName.trim() }
        : {}),
      ...(state.selectBranchCode.trim()
        ? { branchCode: state.selectBranchCode.trim() }
        : {}),
      ...(state.selectRemarks.trim()
        ? { remarks: state.selectRemarks.trim() }
        : {}),
      ...(state.selectAlertValue.trim()
        ? { alertValue: state.selectAlertValue.trim() }
        : {}),
      ...(state.selectThresholdValue.trim()
        ? { thresholdValue: state.selectThresholdValue.trim() }
        : {}),
    },
  }
  const ctes = state.ctes
    .filter((cte) => cte.name.trim() || cte.queryJson.trim())
    .map((cte) => {
      const name = cte.name.trim()
      if (!name) throw new Error('CTE name is required.')
      return {
        name,
        query: parseDslSubqueryJson(cte.queryJson, `CTE ${name}`),
      }
    })
  if (ctes.length) {
    payload.ctes = ctes
  }
  const joins = state.joins
    .map((join) => {
      const onFromSelector =
        join.onLeft.trim() && join.onRight.trim()
          ? `${join.onLeft.trim()} ${join.onOp} ${join.onRight.trim()}`
          : ''
      const on = join.on.trim() || onFromSelector
      const hasSource =
        join.sourceType === 'SUBQUERY'
          ? Boolean(join.subqueryJson.trim())
          : Boolean(join.table.trim())
      if (!hasSource && !on) {
        return null
      }
      const sourceType = join.sourceType
      const source =
        sourceType === 'SUBQUERY'
          ? {
              subquery: parseDslSubqueryJson(
                join.subqueryJson,
                `Join subquery (${join.alias || 'no alias'})`
              ),
            }
          : { table: join.table.trim() }
      return {
        type: join.type,
        sourceType,
        ...source,
        alias: join.alias.trim(),
        on,
      }
    })
    .filter((join): join is NonNullable<typeof join> => join !== null)
    .filter((join) =>
      join.sourceType === 'SUBQUERY'
        ? Boolean((join as { subquery?: unknown }).subquery) && Boolean(join.on)
        : Boolean((join as { table?: string }).table) && Boolean(join.on)
    )
    .map((join) => {
      const { sourceType, ...rest } = join
      return {
        ...rest,
        ...(join.alias ? { alias: join.alias } : {}),
      }
    })
  if (joins.length) payload.joins = joins

  const where = buildConditionGroup(state.combinator, state.conditions)
  if (where) {
    payload.where = where
  }

  const groupBy = state.groupBy.map((expr) => expr.trim()).filter(Boolean)
  if (groupBy.length) {
    payload.groupBy = Array.from(new Set(groupBy))
  }

  const having = buildConditionGroup(
    state.havingCombinator,
    state.havingConditions
  )
  if (having) {
    payload.having = having
  }

  const orderBy = state.orderBy
    .map((item) => ({
      expr: item.expr.trim(),
      direction: item.direction,
    }))
    .filter((item) => item.expr)
  if (orderBy.length) {
    payload.orderBy = orderBy
  }

  const limit = Number(state.limit)
  if (Number.isFinite(limit) && limit > 0) {
    payload.limit = Math.trunc(limit)
  }
  return payload
}

function RuleWorkspace({
  createVersionStandalone = false,
  editVersionNo = null,
  readOnly = false,
}: RuleWorkspaceProps) {
  const navigate = useNavigate()
  const { ruleId } = Route.useParams()
  const canView = useCanAccess('ews_alert', 'view')
  const canCreate = useCanAccess('ews_alert', 'create')
  const canUpdate = useCanAccess('ews_alert', 'update')
  const isWorkspaceReadOnly = readOnly
  const canModify = canUpdate && !isWorkspaceReadOnly
  const canCreateArtifacts = canCreate && !isWorkspaceReadOnly

  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(() => {
    const parsed = Number(ruleId)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })
  const [createRuleOpen, setCreateRuleOpen] = useState(false)
  const [createVersionOpen, setCreateVersionOpen] = useState(
    createVersionStandalone
  )
  const [severityDialogOpen, setSeverityDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  const [severityKeyInput, setSeverityKeyInput] = useState('')
  const [severityLabelInput, setSeverityLabelInput] = useState('')
  const [severityRankInput, setSeverityRankInput] = useState('50')
  const [severityColorInput, setSeverityColorInput] = useState('#6B7280')
  const [severityWorkflowLevelInput, setSeverityWorkflowLevelInput] = useState<
    'LOW' | 'MEDIUM' | 'HIGH'
  >('MEDIUM')
  const [configParamKeyInput, setConfigParamKeyInput] = useState('')
  const [configParamLabelInput, setConfigParamLabelInput] = useState('')
  const [configParamTypeInput, setConfigParamTypeInput] = useState<
    'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  >('NUMBER')
  const [configParamDefaultInput, setConfigParamDefaultInput] = useState('')
  const [configParamAllowGlobalInput, setConfigParamAllowGlobalInput] =
    useState(true)
  const [configParamAllowRuleInput, setConfigParamAllowRuleInput] =
    useState(true)
  const [configValueParamKeyInput, setConfigValueParamKeyInput] = useState('')
  const [configValueGlobalInput, setConfigValueGlobalInput] = useState('')
  const [configValueRuleInput, setConfigValueRuleInput] = useState('')

  const [newRuleKey, setNewRuleKey] = useState('')
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleSeverityKey, setNewRuleSeverityKey] = useState('MEDIUM')
  const [newRuleDedupeMode, setNewRuleDedupeMode] = useState<
    'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
  >('PERIOD')
  const [newRuleDedupeWindowDays, setNewRuleDedupeWindowDays] = useState('30')
  const [newRuleAlertTitleTemplate, setNewRuleAlertTitleTemplate] = useState('')
  const [newRuleAlertCategory, setNewRuleAlertCategory] = useState('')
  const [newRuleAutoRun, setNewRuleAutoRun] = useState(false)
  const [newSchedulerMode, setNewSchedulerMode] =
    useState<SchedulerMode>('BASIC')
  const [newBasicPreset, setNewBasicPreset] = useState<BasicSchedulePreset>(
    DEFAULT_BASIC_SCHEDULER.preset
  )
  const [newBasicTime, setNewBasicTime] = useState(DEFAULT_BASIC_SCHEDULER.time)
  const [newBasicMinuteOfHour, setNewBasicMinuteOfHour] = useState(
    DEFAULT_BASIC_SCHEDULER.minuteOfHour
  )
  const [newBasicInterval, setNewBasicInterval] = useState(
    DEFAULT_BASIC_SCHEDULER.interval
  )
  const [newBasicDayOfWeek, setNewBasicDayOfWeek] = useState(
    DEFAULT_BASIC_SCHEDULER.dayOfWeek
  )
  const [newBasicDayOfMonth, setNewBasicDayOfMonth] = useState(
    DEFAULT_BASIC_SCHEDULER.dayOfMonth
  )
  const [newRuleCron, setNewRuleCron] = useState('0 30 6 * * *')

  const [editRuleName, setEditRuleName] = useState('')
  const [editRuleCategory, setEditRuleCategory] = useState('')
  const [editRuleDescription, setEditRuleDescription] = useState('')
  const [editRuleSeverityKey, setEditRuleSeverityKey] = useState('MEDIUM')
  const [editRuleDedupeMode, setEditRuleDedupeMode] = useState<
    'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
  >('PERIOD')
  const [editRuleDedupeWindowDays, setEditRuleDedupeWindowDays] = useState('30')
  const [editRuleAlertTitleTemplate, setEditRuleAlertTitleTemplate] =
    useState('')
  const [editRuleAlertCategory, setEditRuleAlertCategory] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editAutoRun, setEditAutoRun] = useState(false)
  const [editSchedulerMode, setEditSchedulerMode] =
    useState<SchedulerMode>('BASIC')
  const [editBasicPreset, setEditBasicPreset] = useState<BasicSchedulePreset>(
    DEFAULT_BASIC_SCHEDULER.preset
  )
  const [editBasicTime, setEditBasicTime] = useState(
    DEFAULT_BASIC_SCHEDULER.time
  )
  const [editBasicMinuteOfHour, setEditBasicMinuteOfHour] = useState(
    DEFAULT_BASIC_SCHEDULER.minuteOfHour
  )
  const [editBasicInterval, setEditBasicInterval] = useState(
    DEFAULT_BASIC_SCHEDULER.interval
  )
  const [editBasicDayOfWeek, setEditBasicDayOfWeek] = useState(
    DEFAULT_BASIC_SCHEDULER.dayOfWeek
  )
  const [editBasicDayOfMonth, setEditBasicDayOfMonth] = useState(
    DEFAULT_BASIC_SCHEDULER.dayOfMonth
  )
  const [editCron, setEditCron] = useState('')

  const [versionSql, setVersionSql] = useState('')
  const [versionRuleType, setVersionRuleType] = useState<
    'SQL' | 'QUESTION' | 'ADAPTER' | 'PLUGIN'
  >('SQL')
  const [versionReason, setVersionReason] = useState('')
  const [versionParams, setVersionParams] = useState('{}')
  const [versionAdapterId, setVersionAdapterId] = useState('')
  const [versionAdapterVersionNo, setVersionAdapterVersionNo] = useState('')
  const [versionQuestionSource, setVersionQuestionSource] =
    useState<QuestionRuleSource>('STOCK_AUDIT')
  const [versionQuestionNo, setVersionQuestionNo] = useState('')
  const [versionQuestionAnswerOperator, setVersionQuestionAnswerOperator] =
    useState<QuestionAnswerOperator>('EQUALS')
  const [versionQuestionAnswerValue, setVersionQuestionAnswerValue] =
    useState('YES')
  const [versionQuestionMode, setVersionQuestionMode] =
    useState<QuestionRuleMode>('STANDARD')
  const [versionQuestionCriticalMinCount, setVersionQuestionCriticalMinCount] =
    useState('3')
  const [
    versionQuestionCriticalAnswerValue,
    setVersionQuestionCriticalAnswerValue,
  ] = useState('YES')
  const [versionPluginKey, setVersionPluginKey] = useState('')
  const [versionPluginConfig, setVersionPluginConfig] = useState('{}')
  const [versionConfigOverrides, setVersionConfigOverrides] = useState('{}')
  const [versionLookback, setVersionLookback] = useState('30')
  const [versionNotes, setVersionNotes] = useState('')
  const [versionEditorMode, setVersionEditorMode] = useState<'create' | 'edit'>(
    'create'
  )
  const [editingVersionNo, setEditingVersionNo] = useState<number | null>(null)
  const [versionAdapterKeyHint, setVersionAdapterKeyHint] = useState('')
  const [versionInitModeKey, setVersionInitModeKey] = useState('')
  const [safeSqlMode, setSafeSqlMode] = useState(true)
  const [dsl, setDsl] = useState<DslState>(defaultDsl())
  const [compiledSql, setCompiledSql] = useState('')
  const [builderExperience, setBuilderExperience] = useState<
    'guided' | 'advanced'
  >('guided')
  const [showSqlInternals, setShowSqlInternals] = useState(false)
  const [dslSectionsOpen, setDslSectionsOpen] = useState<
    Record<DslBuilderSection, boolean>
  >({
    extensions: false,
    fromSelect: true,
    joins: true,
    where: true,
    groupBy: false,
    having: false,
    orderLimit: false,
  })

  const [runVersionNo, setRunVersionNo] = useState<number | null>(null)
  const [runDate, setRunDate] = useState(new Date().toISOString().slice(0, 10))
  const [runParams, setRunParams] = useState('{}')
  const [lastRunResult, setLastRunResult] = useState<EwsV2RunResult | null>(
    null
  )
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [selectedHit, setSelectedHit] = useState<EwsV2AlertHit | null>(null)
  const [hitsDialogOpen, setHitsDialogOpen] = useState(false)
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false)
  const [revalidateReport, setRevalidateReport] =
    useState<EwsV2RevalidateRulesResult | null>(null)
  const [conditionPresets, setConditionPresets] = useState<
    DslConditionPreset[]
  >(() => (typeof window === 'undefined' ? [] : loadConditionPresets()))
  const [wherePresetNameInput, setWherePresetNameInput] = useState('')
  const [havingPresetNameInput, setHavingPresetNameInput] = useState('')
  const [selectedWherePresetId, setSelectedWherePresetId] = useState('')
  const [selectedHavingPresetId, setSelectedHavingPresetId] = useState('')
  const [suggestionRequest, setSuggestionRequest] = useState<{
    table: string
    column: string
    scope: 'WHERE' | 'HAVING'
    conditionId: string
    q: string
  } | null>(null)

  const newBasicCron = useMemo(
    () =>
      buildCronFromBasic({
        preset: newBasicPreset,
        time: newBasicTime,
        minuteOfHour: newBasicMinuteOfHour,
        interval: newBasicInterval,
        dayOfWeek: newBasicDayOfWeek,
        dayOfMonth: newBasicDayOfMonth,
      }),
    [
      newBasicDayOfMonth,
      newBasicDayOfWeek,
      newBasicInterval,
      newBasicMinuteOfHour,
      newBasicPreset,
      newBasicTime,
    ]
  )

  const editBasicCron = useMemo(
    () =>
      buildCronFromBasic({
        preset: editBasicPreset,
        time: editBasicTime,
        minuteOfHour: editBasicMinuteOfHour,
        interval: editBasicInterval,
        dayOfWeek: editBasicDayOfWeek,
        dayOfMonth: editBasicDayOfMonth,
      }),
    [
      editBasicDayOfMonth,
      editBasicDayOfWeek,
      editBasicInterval,
      editBasicMinuteOfHour,
      editBasicPreset,
      editBasicTime,
    ]
  )

  const newScheduleSentence = useMemo(
    () =>
      newSchedulerMode === 'BASIC'
        ? describeBasicSchedule({
            preset: newBasicPreset,
            time: newBasicTime,
            minuteOfHour: newBasicMinuteOfHour,
            interval: newBasicInterval,
            dayOfWeek: newBasicDayOfWeek,
            dayOfMonth: newBasicDayOfMonth,
          })
        : describeAdvancedSchedule(newRuleCron),
    [
      newBasicDayOfMonth,
      newBasicDayOfWeek,
      newBasicInterval,
      newBasicMinuteOfHour,
      newBasicPreset,
      newBasicTime,
      newRuleCron,
      newSchedulerMode,
    ]
  )

  const editScheduleSentence = useMemo(
    () =>
      editSchedulerMode === 'BASIC'
        ? describeBasicSchedule({
            preset: editBasicPreset,
            time: editBasicTime,
            minuteOfHour: editBasicMinuteOfHour,
            interval: editBasicInterval,
            dayOfWeek: editBasicDayOfWeek,
            dayOfMonth: editBasicDayOfMonth,
          })
        : describeAdvancedSchedule(editCron),
    [
      editBasicDayOfMonth,
      editBasicDayOfWeek,
      editBasicInterval,
      editBasicMinuteOfHour,
      editBasicPreset,
      editBasicTime,
      editCron,
      editSchedulerMode,
    ]
  )

  const rulesQuery = useQuery({
    queryKey: ['ews-v2-rules'],
    queryFn: listEwsV2Rules,
    enabled: canView,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    throwOnError: false,
  })

  useEffect(() => {
    const parsed = Number(ruleId)
    const nextId = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    setSelectedRuleId(nextId)
  }, [ruleId])

  const selectedRule = useMemo(
    () =>
      (rulesQuery.data ?? []).find((rule) => rule.id === selectedRuleId) ??
      null,
    [rulesQuery.data, selectedRuleId]
  )
  const selectedRuleHealthBadgeVariant = useMemo(() => {
    if (!selectedRule?.healthStatus) return 'outline'
    if (selectedRule.healthStatus === 'BROKEN') return 'destructive'
    if (selectedRule.healthStatus === 'DEGRADED') return 'secondary'
    return 'outline'
  }, [selectedRule?.healthStatus])

  const selectedRuleGuardrailReport = useMemo(
    () =>
      (revalidateReport?.brokenRuleReports ?? []).find(
        (item) => Number(item.ruleId) === Number(selectedRuleId)
      ) ?? null,
    [revalidateReport?.brokenRuleReports, selectedRuleId]
  )

  useEffect(() => {
    if (!selectedRule) return
    setEditRuleName(selectedRule.ruleName ?? '')
    setEditRuleCategory(selectedRule.category ?? '')
    setEditRuleDescription(selectedRule.description ?? '')
    setEditRuleSeverityKey(selectedRule.alertSeverityKey ?? 'MEDIUM')
    setEditRuleDedupeMode(selectedRule.dedupeMode ?? 'PERIOD')
    setEditRuleDedupeWindowDays(
      selectedRule.dedupeWindowDays
        ? String(selectedRule.dedupeWindowDays)
        : '30'
    )
    setEditRuleAlertTitleTemplate(selectedRule.alertTitleTemplate ?? '')
    setEditRuleAlertCategory(
      selectedRule.alertCategory ?? selectedRule.category ?? ''
    )
    setEditActive(Boolean(selectedRule.active))
    setEditAutoRun(Boolean(selectedRule.autoRunEnabled))
    const selectedCron = selectedRule.cronExpression?.trim() || ''
    setEditCron(selectedCron || '0 30 6 * * *')
    const parsedBasic = parseCronToBasic(selectedCron)
    if (parsedBasic) {
      setEditSchedulerMode('BASIC')
      setEditBasicPreset(parsedBasic.preset)
      setEditBasicTime(parsedBasic.time)
      setEditBasicMinuteOfHour(parsedBasic.minuteOfHour)
      setEditBasicInterval(parsedBasic.interval)
      setEditBasicDayOfWeek(parsedBasic.dayOfWeek)
      setEditBasicDayOfMonth(parsedBasic.dayOfMonth)
    } else {
      setEditSchedulerMode(selectedCron ? 'ADVANCED' : 'BASIC')
      setEditBasicPreset(DEFAULT_BASIC_SCHEDULER.preset)
      setEditBasicTime(DEFAULT_BASIC_SCHEDULER.time)
      setEditBasicMinuteOfHour(DEFAULT_BASIC_SCHEDULER.minuteOfHour)
      setEditBasicInterval(DEFAULT_BASIC_SCHEDULER.interval)
      setEditBasicDayOfWeek(DEFAULT_BASIC_SCHEDULER.dayOfWeek)
      setEditBasicDayOfMonth(DEFAULT_BASIC_SCHEDULER.dayOfMonth)
    }
    setSelectedRunId(null)
    setSelectedHit(null)
    setHitsDialogOpen(false)
    setEvidenceDialogOpen(false)
  }, [selectedRule])

  const versionsQuery = useQuery({
    queryKey: ['ews-v2-rule-versions', selectedRuleId],
    queryFn: () => listEwsV2RuleVersions(Number(selectedRuleId)),
    enabled: Number(selectedRuleId) > 0,
    throwOnError: false,
  })

  useEffect(() => {
    const versions = versionsQuery.data ?? []
    if (!versions.length) {
      setRunVersionNo(null)
      return
    }
    if (
      !runVersionNo ||
      !versions.some((item) => item.versionNo === runVersionNo)
    ) {
      setRunVersionNo(versions[0].versionNo)
    }
  }, [runVersionNo, versionsQuery.data])

  const resetVersionBuilder = () => {
    setVersionEditorMode('create')
    setEditingVersionNo(null)
    setVersionRuleType('SQL')
    setVersionSql('')
    setVersionReason('')
    setVersionParams('{}')
    setVersionAdapterId('')
    setVersionAdapterVersionNo('')
    setVersionAdapterKeyHint('')
    setVersionQuestionSource('STOCK_AUDIT')
    setVersionQuestionNo('')
    setVersionQuestionAnswerOperator('EQUALS')
    setVersionQuestionAnswerValue('YES')
    setVersionQuestionMode('STANDARD')
    setVersionQuestionCriticalMinCount('3')
    setVersionQuestionCriticalAnswerValue('YES')
    setVersionPluginKey('')
    setVersionPluginConfig('{}')
    setVersionConfigOverrides('{}')
    setVersionLookback('30')
    setVersionNotes('')
    setDsl(defaultDsl())
    setCompiledSql('')
  }

  const loadVersionIntoBuilder = (
    version: EwsV2RuleVersion,
    mode: 'edit' | 'create'
  ) => {
    const ruleType =
      version.ruleType === 'ADAPTER' ||
      version.ruleType === 'QUESTION' ||
      version.ruleType === 'PLUGIN'
        ? version.ruleType
        : 'SQL'
    setVersionEditorMode(mode)
    setEditingVersionNo(mode === 'edit' ? version.versionNo : null)
    setVersionRuleType(ruleType)
    setVersionSql(version.executionSql ?? '')
    setVersionReason(version.reasonTemplate ?? '')
    setVersionLookback(
      version.lookbackDays && Number.isFinite(version.lookbackDays)
        ? String(version.lookbackDays)
        : '30'
    )
    setVersionNotes(version.notes ?? '')

    const paramsRecord = isRecord(version.params) ? version.params : {}
    const questionConfigRecord = isRecord(version.questionConfig)
      ? version.questionConfig
      : paramsRecord
    setVersionParams(pretty(paramsRecord))
    setVersionConfigOverrides('{}')

    if (ruleType === 'QUESTION') {
      const source =
        String(questionConfigRecord.source ?? '').toUpperCase() ===
        'MSME_INSPECTION'
          ? 'MSME_INSPECTION'
          : 'STOCK_AUDIT'
      const modeValue =
        String(questionConfigRecord.mode ?? '').toUpperCase() ===
        'MULTIPLE_CRITICAL_STOCK_AUDIT'
          ? 'MULTIPLE_CRITICAL_STOCK_AUDIT'
          : 'STANDARD'
      const operator =
        String(questionConfigRecord.answerOperator ?? '').toUpperCase() ===
        'CONTAINS'
          ? 'CONTAINS'
          : String(questionConfigRecord.answerOperator ?? '').toUpperCase() ===
              'STARTS_WITH'
            ? 'STARTS_WITH'
            : String(
                  questionConfigRecord.answerOperator ?? ''
                ).toUpperCase() === 'ENDS_WITH'
              ? 'ENDS_WITH'
              : String(
                    questionConfigRecord.answerOperator ?? ''
                  ).toUpperCase() === 'ANY_NON_EMPTY'
                ? 'ANY_NON_EMPTY'
                : 'EQUALS'
      setVersionQuestionSource(source)
      setVersionQuestionMode(modeValue)
      setVersionQuestionNo(stringFromValue(questionConfigRecord.questionNo))
      setVersionQuestionAnswerOperator(operator)
      setVersionQuestionAnswerValue(
        stringFromValue(questionConfigRecord.answerValue) || 'YES'
      )
      setVersionQuestionCriticalMinCount(
        stringFromValue(questionConfigRecord.criticalMinCount) || '3'
      )
      setVersionQuestionCriticalAnswerValue(
        stringFromValue(questionConfigRecord.criticalAnswerValue) || 'YES'
      )
    } else {
      setVersionQuestionSource('STOCK_AUDIT')
      setVersionQuestionNo('')
      setVersionQuestionAnswerOperator('EQUALS')
      setVersionQuestionAnswerValue('YES')
      setVersionQuestionMode('STANDARD')
      setVersionQuestionCriticalMinCount('3')
      setVersionQuestionCriticalAnswerValue('YES')
    }

    if (ruleType === 'ADAPTER') {
      setVersionAdapterKeyHint(version.adapterKey ?? '')
      setVersionAdapterVersionNo(
        version.adapterVersionNo && Number.isFinite(version.adapterVersionNo)
          ? String(version.adapterVersionNo)
          : ''
      )
    } else {
      setVersionAdapterKeyHint('')
      setVersionAdapterId('')
      setVersionAdapterVersionNo('')
    }

    if (ruleType === 'PLUGIN') {
      setVersionPluginKey(version.pluginKey ?? '')
      setVersionPluginConfig(pretty(version.pluginConfig ?? {}))
    } else {
      setVersionPluginKey('')
      setVersionPluginConfig('{}')
    }

    if (ruleType === 'SQL') {
      setDsl(dslStateFromPayload(version.dsl))
    } else {
      setDsl(defaultDsl())
    }
    setCompiledSql('')
  }

  useEffect(() => {
    setVersionInitModeKey('')
  }, [
    selectedRuleId,
    editVersionNo,
    createVersionStandalone,
    createVersionOpen,
  ])

  useEffect(() => {
    if (!createVersionStandalone) return
    if (!createVersionOpen) return
    const targetModeKey = editVersionNo ? `edit:${editVersionNo}` : 'create'
    if (versionInitModeKey === targetModeKey) return

    if (!editVersionNo) {
      resetVersionBuilder()
      setVersionInitModeKey(targetModeKey)
      return
    }
    const target = (versionsQuery.data ?? []).find(
      (item) => item.versionNo === Number(editVersionNo)
    )
    if (!target) return
    if (target.status === 'PUBLISHED' && !isWorkspaceReadOnly) {
      toast.error(
        'Published version cannot be edited. Clone it to a draft first.'
      )
      resetVersionBuilder()
      setVersionInitModeKey(targetModeKey)
      return
    }
    loadVersionIntoBuilder(target, 'edit')
    setVersionInitModeKey(targetModeKey)
  }, [
    createVersionOpen,
    createVersionStandalone,
    editVersionNo,
    isWorkspaceReadOnly,
    versionInitModeKey,
    versionsQuery.data,
  ])

  useEffect(() => {
    setVersionAdapterVersionNo('')
  }, [versionAdapterId])

  useEffect(() => {
    if (
      versionQuestionMode === 'MULTIPLE_CRITICAL_STOCK_AUDIT' &&
      versionQuestionSource !== 'STOCK_AUDIT'
    ) {
      setVersionQuestionSource('STOCK_AUDIT')
    }
  }, [versionQuestionMode, versionQuestionSource])

  const runsQuery = useQuery({
    queryKey: ['ews-v2-rule-runs', selectedRuleId],
    queryFn: () => listEwsV2RuleRuns(Number(selectedRuleId)),
    enabled: Number(selectedRuleId) > 0,
    throwOnError: false,
  })

  const dslMetadataQuery = useQuery<EwsV2DslMetadata>({
    queryKey: ['ews-v2-dsl-metadata'],
    queryFn: getEwsV2DslMetadata,
    enabled: canView,
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  })
  const dslSuggestionsQuery = useQuery<string[]>({
    queryKey: [
      'ews-v2-dsl-suggestions',
      suggestionRequest?.table,
      suggestionRequest?.column,
      suggestionRequest?.q,
      suggestionRequest?.conditionId,
    ],
    queryFn: () =>
      getEwsV2DslSuggestions({
        table: suggestionRequest?.table ?? '',
        column: suggestionRequest?.column ?? '',
        q: suggestionRequest?.q ?? '',
        limit: 20,
      }),
    enabled: Boolean(suggestionRequest?.table && suggestionRequest?.column),
    staleTime: 30 * 1000,
    throwOnError: false,
  })

  const severityQuery = useQuery<AlertSeverityDefinition[]>({
    queryKey: ['alerts-v2-severities'],
    queryFn: () => listAlertSeverities(false),
    enabled: canView,
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const configParamsQuery = useQuery<EwsV2ConfigParamDefinition[]>({
    queryKey: ['ews-v2-config-params'],
    queryFn: () => listEwsV2ConfigParams(false),
    enabled: canView,
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const globalConfigValuesQuery = useQuery<EwsV2ConfigParamValue[]>({
    queryKey: ['ews-v2-config-values', 'GLOBAL', 'GLOBAL'],
    queryFn: () => listEwsV2ConfigValues('GLOBAL', 'GLOBAL', false),
    enabled: canView,
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const ruleScopeRef = selectedRule?.ruleKey?.trim().toUpperCase() || ''
  const ruleConfigValuesQuery = useQuery<EwsV2ConfigParamValue[]>({
    queryKey: ['ews-v2-config-values', 'RULE', ruleScopeRef],
    queryFn: () => listEwsV2ConfigValues('RULE', ruleScopeRef, false),
    enabled: canView && Boolean(ruleScopeRef),
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const adaptersQuery = useQuery<EwsV2AdapterDefinition[]>({
    queryKey: ['ews-v2-adapters'],
    queryFn: listEwsV2Adapters,
    enabled: canView,
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const pluginKeysQuery = useQuery<string[]>({
    queryKey: ['ews-v2-rule-plugins'],
    queryFn: listEwsV2RulePlugins,
    enabled: canView,
    staleTime: 60 * 1000,
    throwOnError: false,
  })

  const questionCatalogQuery = useQuery<EwsV2QuestionCatalog>({
    queryKey: ['ews-v2-question-catalog'],
    queryFn: getEwsV2QuestionCatalog,
    enabled: canView && createVersionOpen && versionRuleType === 'QUESTION',
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  })

  const selectedAdapterIdNumber = Number(versionAdapterId)
  const adapterVersionsQuery = useQuery<EwsV2AdapterVersion[]>({
    queryKey: ['ews-v2-adapter-versions', selectedAdapterIdNumber],
    queryFn: () => listEwsV2AdapterVersions(selectedAdapterIdNumber),
    enabled: selectedAdapterIdNumber > 0 && createVersionOpen,
    throwOnError: false,
  })

  const selectedAdapter = useMemo(
    () =>
      (adaptersQuery.data ?? []).find(
        (adapter) => adapter.id === selectedAdapterIdNumber
      ) ?? null,
    [adaptersQuery.data, selectedAdapterIdNumber]
  )

  useEffect(() => {
    if (!versionAdapterKeyHint) return
    if (versionAdapterId) return
    const match = (adaptersQuery.data ?? []).find(
      (item) => item.adapterKey === versionAdapterKeyHint
    )
    if (!match) return
    setVersionAdapterId(String(match.id))
  }, [adaptersQuery.data, versionAdapterId, versionAdapterKeyHint])

  const severityOptions = useMemo(() => {
    const rows = severityQuery.data ?? []
    if (!rows.length) {
      return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    }
    return rows.map((row) => row.severityKey)
  }, [severityQuery.data])

  const configParamOptions = useMemo(
    () =>
      (configParamsQuery.data ?? []).sort((a, b) =>
        (a.paramKey ?? '').localeCompare(b.paramKey ?? '')
      ),
    [configParamsQuery.data]
  )

  const selectedConfigParam = useMemo(
    () =>
      configParamOptions.find(
        (item) => item.paramKey === configValueParamKeyInput
      ) ?? null,
    [configParamOptions, configValueParamKeyInput]
  )

  const selectedGlobalConfigValue = useMemo(
    () =>
      (globalConfigValuesQuery.data ?? []).find(
        (item) => item.paramKey === configValueParamKeyInput
      ) ?? null,
    [configValueParamKeyInput, globalConfigValuesQuery.data]
  )

  const selectedRuleConfigValue = useMemo(
    () =>
      (ruleConfigValuesQuery.data ?? []).find(
        (item) => item.paramKey === configValueParamKeyInput
      ) ?? null,
    [configValueParamKeyInput, ruleConfigValuesQuery.data]
  )

  useEffect(() => {
    if (configValueParamKeyInput || !configParamOptions.length) return
    setConfigValueParamKeyInput(configParamOptions[0].paramKey)
  }, [configParamOptions, configValueParamKeyInput])

  useEffect(() => {
    if (!configValueParamKeyInput) return
    setConfigValueGlobalInput(
      selectedGlobalConfigValue?.value !== undefined
        ? pretty(selectedGlobalConfigValue.value)
        : ''
    )
    setConfigValueRuleInput(
      selectedRuleConfigValue?.value !== undefined
        ? pretty(selectedRuleConfigValue.value)
        : ''
    )
  }, [
    configValueParamKeyInput,
    selectedGlobalConfigValue?.value,
    selectedRuleConfigValue?.value,
  ])

  useEffect(() => {
    if (versionRuleType !== 'ADAPTER') return
    if (versionAdapterVersionNo) return
    if (adapterVersionsQuery.data?.length) {
      setVersionAdapterVersionNo(String(adapterVersionsQuery.data[0].versionNo))
    }
  }, [adapterVersionsQuery.data, versionAdapterVersionNo, versionRuleType])

  const runHitsQuery = useQuery({
    queryKey: ['ews-v2-rule-run-hits', selectedRuleId, selectedRunId],
    queryFn: () =>
      listEwsV2RunHits(Number(selectedRuleId), Number(selectedRunId)),
    enabled:
      Number(selectedRuleId) > 0 && Number(selectedRunId) > 0 && hitsDialogOpen,
    throwOnError: false,
  })

  const evidenceQuery = useQuery({
    queryKey: ['ews-v2-rule-hit-evidence', selectedRuleId, selectedHit?.id],
    queryFn: () =>
      listEwsV2HitEvidence(Number(selectedRuleId), Number(selectedHit?.id)),
    enabled:
      Number(selectedRuleId) > 0 &&
      Number(selectedHit?.id) > 0 &&
      evidenceDialogOpen,
    throwOnError: false,
  })

  const tableMetadataIndex = useMemo(() => {
    const map = new Map<string, EwsV2DslMetadata['tables'][number]>()
    for (const table of dslMetadataQuery.data?.tables ?? []) {
      map.set(table.name.toLowerCase(), table)
      for (const alias of table.legacyAliases ?? []) {
        map.set(alias.toLowerCase(), table)
      }
    }
    return map
  }, [dslMetadataQuery.data])

  const tableColumnIndex = useMemo(() => {
    const map = new Map<string, string[]>()
    tableMetadataIndex.forEach((table, key) => {
      map.set(key, (table.columns ?? []).map((col) => col.name).filter(Boolean))
    })
    return map
  }, [tableMetadataIndex])

  const createRuleMutation = useMutation({
    mutationFn: () =>
      createEwsV2Rule({
        ruleKey: newRuleKey.trim().toUpperCase(),
        ruleName: newRuleName.trim(),
        alertSeverityKey: newRuleSeverityKey || undefined,
        dedupeMode: newRuleDedupeMode,
        dedupeWindowDays: numberOrUndefined(newRuleDedupeWindowDays),
        alertTitleTemplate: newRuleAlertTitleTemplate.trim() || undefined,
        alertCategory: newRuleAlertCategory.trim() || undefined,
        autoRunEnabled: newRuleAutoRun,
        cronExpression: newRuleAutoRun
          ? newSchedulerMode === 'BASIC'
            ? newBasicCron
            : newRuleCron.trim() || undefined
          : undefined,
        cronTimezone: newRuleAutoRun ? FIXED_CRON_TIMEZONE : undefined,
      }),
    onSuccess: async (rule) => {
      toast.success('Rule created.')
      setCreateRuleOpen(false)
      setNewRuleKey('')
      setNewRuleName('')
      setNewRuleSeverityKey('MEDIUM')
      setNewRuleDedupeMode('PERIOD')
      setNewRuleDedupeWindowDays('30')
      setNewRuleAlertTitleTemplate('')
      setNewRuleAlertCategory('')
      setNewRuleAutoRun(false)
      setNewSchedulerMode('BASIC')
      setNewBasicPreset(DEFAULT_BASIC_SCHEDULER.preset)
      setNewBasicTime(DEFAULT_BASIC_SCHEDULER.time)
      setNewBasicMinuteOfHour(DEFAULT_BASIC_SCHEDULER.minuteOfHour)
      setNewBasicInterval(DEFAULT_BASIC_SCHEDULER.interval)
      setNewBasicDayOfWeek(DEFAULT_BASIC_SCHEDULER.dayOfWeek)
      setNewBasicDayOfMonth(DEFAULT_BASIC_SCHEDULER.dayOfMonth)
      setNewRuleCron('0 30 6 * * *')
      await rulesQuery.refetch()
      navigate({
        to: '/admin/alerts-v2-rules/$ruleId',
        params: { ruleId: String(rule.id) },
      })
    },
    onError: (error) => toastError(error, 'Could not create rule.'),
  })

  const updateRuleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRuleId) throw new Error('Select a rule first.')
      return updateEwsV2Rule(selectedRuleId, {
        ruleName: editRuleName.trim() || undefined,
        category: editRuleCategory.trim() || undefined,
        description: editRuleDescription.trim() || undefined,
        alertSeverityKey: editRuleSeverityKey || undefined,
        dedupeMode: editRuleDedupeMode,
        dedupeWindowDays: numberOrUndefined(editRuleDedupeWindowDays),
        alertTitleTemplate: editRuleAlertTitleTemplate.trim() || undefined,
        alertCategory: editRuleAlertCategory.trim() || undefined,
        active: editActive,
        autoRunEnabled: editAutoRun,
        cronExpression: editAutoRun
          ? editSchedulerMode === 'BASIC'
            ? editBasicCron
            : editCron.trim() || undefined
          : undefined,
        cronTimezone: editAutoRun ? FIXED_CRON_TIMEZONE : undefined,
      })
    },
    onSuccess: async () => {
      toast.success('Rule settings saved.')
      await rulesQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update rule.'),
  })

  const revalidateAllMutation = useMutation({
    mutationFn: () =>
      revalidateAllEwsV2Rules({
        disableAutoRunOnBroken: true,
      }),
    onSuccess: async (result) => {
      setRevalidateReport(result)
      toast.success(
        `Revalidation done. Broken: ${result.brokenRules ?? 0}, Degraded: ${result.degradedRules ?? 0}.`
      )
      await rulesQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not revalidate rules.'),
  })

  const createSeverityMutation = useMutation({
    mutationFn: () =>
      createAlertSeverity({
        severityKey: severityKeyInput.trim().toUpperCase(),
        label: severityLabelInput.trim(),
        rankOrder: Number(severityRankInput) || undefined,
        colorHex: severityColorInput.trim() || undefined,
        workflowSeverityLevel: severityWorkflowLevelInput,
      }),
    onSuccess: async () => {
      toast.success('Severity created.')
      setSeverityKeyInput('')
      setSeverityLabelInput('')
      setSeverityRankInput('50')
      setSeverityColorInput('#6B7280')
      setSeverityWorkflowLevelInput('MEDIUM')
      await severityQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not create severity.'),
  })

  const toggleSeverityMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateAlertSeverity(id, {
        isActive,
      }),
    onSuccess: async () => {
      await severityQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update severity.'),
  })

  const createConfigParamMutation = useMutation({
    mutationFn: () =>
      createEwsV2ConfigParam({
        paramKey: configParamKeyInput.trim().toUpperCase().replace(/\s+/g, '_'),
        label: configParamLabelInput.trim(),
        valueType: configParamTypeInput,
        defaultValue: configParamDefaultInput.trim()
          ? parseJsonValue(configParamDefaultInput)
          : undefined,
        allowGlobalScope: configParamAllowGlobalInput,
        allowRuleScope: configParamAllowRuleInput,
      }),
    onSuccess: async () => {
      toast.success('Config parameter created.')
      setConfigParamKeyInput('')
      setConfigParamLabelInput('')
      setConfigParamTypeInput('NUMBER')
      setConfigParamDefaultInput('')
      setConfigParamAllowGlobalInput(true)
      setConfigParamAllowRuleInput(true)
      await Promise.all([
        configParamsQuery.refetch(),
        globalConfigValuesQuery.refetch(),
      ])
      if (ruleScopeRef) {
        await ruleConfigValuesQuery.refetch()
      }
    },
    onError: (error) => toastError(error, 'Could not create config parameter.'),
  })

  const upsertConfigValueMutation = useMutation({
    mutationFn: ({
      scopeType,
      valueText,
    }: {
      scopeType: 'GLOBAL' | 'RULE'
      valueText: string
    }) => {
      if (!configValueParamKeyInput.trim()) {
        throw new Error('Select a config parameter key.')
      }
      if (!valueText.trim()) {
        throw new Error('Config value is required.')
      }
      return upsertEwsV2ConfigValue({
        paramKey: configValueParamKeyInput.trim().toUpperCase(),
        scopeType,
        scopeRef: scopeType === 'GLOBAL' ? 'GLOBAL' : ruleScopeRef,
        value: parseJsonValue(valueText),
      })
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.scopeType === 'GLOBAL'
          ? 'Global config value saved.'
          : 'Rule-level config value saved.'
      )
      await Promise.all([
        globalConfigValuesQuery.refetch(),
        ruleConfigValuesQuery.refetch(),
      ])
    },
    onError: (error) => toastError(error, 'Could not save config value.'),
  })

  const toggleConfigParamMutation = useMutation({
    mutationFn: ({ paramId, active }: { paramId: number; active: boolean }) =>
      updateEwsV2ConfigParam(paramId, {
        active,
      }),
    onSuccess: async () => {
      await configParamsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update config parameter.'),
  })

  const compileDslMutation = useMutation({
    mutationFn: () => {
      if (blockingDslIssues.length) {
        throw new Error(
          `Fix ${blockingDslIssues.length} semantic issue(s) before compiling.`
        )
      }
      return compileEwsV2Dsl({ dsl: buildDsl(dsl) })
    },
    onSuccess: (result) => {
      setCompiledSql(result.sql ?? '')
      toast.success('DSL compiled.')
    },
    onError: (error) => toastError(error, 'Could not compile DSL.'),
  })

  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      if (isWorkspaceReadOnly) {
        throw new Error('Read-only mode: version changes are disabled.')
      }
      if (!selectedRuleId) throw new Error('Select a rule first.')
      const isEditing =
        versionEditorMode === 'edit' && Number(editingVersionNo) > 0
      const commonPayload = {
        ruleType: versionRuleType,
        reasonTemplate: versionReason.trim() || undefined,
        params: parseObjectJson(versionParams),
        configOverrides: parseObjectJson(versionConfigOverrides),
        lookbackDays: Number(versionLookback) || undefined,
        notes: versionNotes.trim() || undefined,
      } as const

      if (versionRuleType === 'ADAPTER') {
        const adapterKey =
          selectedAdapter?.adapterKey ||
          versionAdapterKeyHint.trim() ||
          undefined
        if (!adapterKey) {
          throw new Error('Select an adapter for ADAPTER rule type.')
        }
        const payload = {
          ...commonPayload,
          adapterKey,
          adapterVersionNo: Number(versionAdapterVersionNo) || undefined,
        }
        const validationResult = await validateEwsV2RuleVersion(
          selectedRuleId,
          {
            ...payload,
            sampleLimit: 1,
          }
        )
        const validationRows =
          Number(validationResult.totalRows ?? 0) ||
          Number(validationResult.previewRows?.length ?? 0)
        if (validationRows <= 0) {
          throw new Error(
            'ADAPTER validation returned 0 rows. Adjust adapter/params before saving.'
          )
        }
        if (isEditing) {
          return updateEwsV2RuleVersion(
            selectedRuleId,
            Number(editingVersionNo),
            payload
          )
        }
        return createEwsV2RuleVersion(selectedRuleId, payload)
      }

      if (versionRuleType === 'QUESTION') {
        if (
          versionQuestionMode === 'STANDARD' &&
          !numberOrUndefined(versionQuestionNo)
        ) {
          throw new Error('Question number is required for QUESTION rules.')
        }
        const questionConfig: Record<string, unknown> = {
          source: versionQuestionSource,
          mode: versionQuestionMode,
          answerOperator: versionQuestionAnswerOperator,
          ...(versionQuestionMode === 'STANDARD'
            ? {
                questionNo: numberOrUndefined(versionQuestionNo),
                ...(versionQuestionAnswerOperator === 'ANY_NON_EMPTY'
                  ? {}
                  : {
                      answerValue: versionQuestionAnswerValue.trim() || 'YES',
                    }),
              }
            : {
                criticalMinCount:
                  numberOrUndefined(versionQuestionCriticalMinCount) ?? 3,
                criticalAnswerValue:
                  versionQuestionCriticalAnswerValue.trim() || 'YES',
              }),
        }
        const payload = {
          ...commonPayload,
          questionConfig,
        }
        const validationResult = await validateEwsV2RuleVersion(
          selectedRuleId,
          {
            ...payload,
            sampleLimit: 1,
          }
        )
        const validationRows =
          Number(validationResult.totalRows ?? 0) ||
          Number(validationResult.previewRows?.length ?? 0)
        if (validationRows <= 0) {
          throw new Error(
            'QUESTION validation returned 0 rows. Refine question criteria before saving.'
          )
        }
        if (isEditing) {
          return updateEwsV2RuleVersion(
            selectedRuleId,
            Number(editingVersionNo),
            payload
          )
        }
        return createEwsV2RuleVersion(selectedRuleId, payload)
      }

      if (versionRuleType === 'PLUGIN') {
        if (!versionPluginKey.trim()) {
          throw new Error('Plugin key is required for PLUGIN rule type.')
        }
        const payload = {
          ...commonPayload,
          pluginKey: versionPluginKey.trim(),
          pluginConfig: parseObjectJson(versionPluginConfig),
        }
        if (isEditing) {
          return updateEwsV2RuleVersion(
            selectedRuleId,
            Number(editingVersionNo),
            payload
          )
        }
        return createEwsV2RuleVersion(selectedRuleId, payload)
      }

      if (blockingDslIssues.length) {
        throw new Error(
          `Fix ${blockingDslIssues.length} semantic issue(s) before creating version.`
        )
      }
      if (safeSqlMode && versionSql.trim()) {
        throw new Error(
          'Raw SQL override is blocked in Safe SQL mode. Clear override or disable Safe mode.'
        )
      }

      const dslPayload = buildDsl(dsl)
      const validationResult = await validateEwsV2Dsl({
        dsl: dslPayload,
        params: parseObjectJson(versionParams),
        sampleLimit: 1,
      })
      setCompiledSql(validationResult.sql ?? '')
      if ((validationResult.sampleRows ?? 0) <= 0) {
        throw new Error(
          'DSL validation returned 0 rows. Refine conditions or params before saving.'
        )
      }

      const payload = {
        ...commonPayload,
        dsl: dslPayload,
        executionSql: versionSql.trim() || undefined,
      }
      if (isEditing) {
        return updateEwsV2RuleVersion(
          selectedRuleId,
          Number(editingVersionNo),
          payload
        )
      }
      return createEwsV2RuleVersion(selectedRuleId, payload)
    },
    onSuccess: async () => {
      const isEditing =
        versionEditorMode === 'edit' && Number(editingVersionNo) > 0
      toast.success(isEditing ? 'Version updated.' : 'Version created.')
      if (createVersionStandalone) {
        closeCreateVersionPage()
      } else {
        setCreateVersionOpen(false)
      }
      resetVersionBuilder()
      await versionsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not save version.'),
  })

  const publishMutation = useMutation({
    mutationFn: (versionNo: number) => {
      if (!selectedRuleId) throw new Error('Select a rule first.')
      return publishEwsV2RuleVersion(selectedRuleId, versionNo)
    },
    onSuccess: async () => {
      toast.success('Version published.')
      await Promise.all([rulesQuery.refetch(), versionsQuery.refetch()])
    },
    onError: (error) => toastError(error, 'Could not publish version.'),
  })

  const cloneVersionMutation = useMutation({
    mutationFn: async (sourceVersionNo: number) => {
      if (!selectedRuleId) throw new Error('Select a rule first.')
      return cloneEwsV2RuleVersion(selectedRuleId, sourceVersionNo)
    },
    onSuccess: async (cloned) => {
      toast.success(`Cloned to v${cloned.versionNo}.`)
      await Promise.all([rulesQuery.refetch(), versionsQuery.refetch()])
      navigate({
        to: '/admin/alerts-v2-rules/$ruleId/create-version',
        params: { ruleId: String(selectedRuleId) },
        search: { editVersionNo: cloned.versionNo },
      })
    },
    onError: (error) => toastError(error, 'Could not clone version.'),
  })

  const runMutation = useMutation({
    mutationFn: (dryRun: boolean) => {
      if (!selectedRuleId) throw new Error('Select a rule first.')
      if (!runVersionNo) throw new Error('Select version first.')
      return runEwsV2Rule(selectedRuleId, {
        versionNo: runVersionNo,
        runDate,
        dryRun,
        params: parseObjectJson(runParams),
      })
    },
    onSuccess: async (result) => {
      setLastRunResult(result)
      toast.success(result.dryRun ? 'Dry run done.' : 'Execution done.')
      await runsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not run rule.'),
  })

  const dslJsonPreview = useMemo(() => {
    try {
      return buildDsl(dsl)
    } catch {
      return {}
    }
  }, [dsl])

  const versionParamKeys = useMemo(() => {
    try {
      const parsed = JSON.parse(versionParams || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return []
      return Object.keys(parsed).sort((a, b) => a.localeCompare(b))
    } catch {
      return []
    }
  }, [versionParams])
  const configParamKeys = useMemo(
    () =>
      (configParamsQuery.data ?? [])
        .map((item) => item.paramKey?.trim())
        .filter((item): item is string => Boolean(item)),
    [configParamsQuery.data]
  )
  const suggestedParamKeys = useMemo(
    () =>
      Array.from(
        new Set([...versionParamKeys, ...configParamKeys].filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [configParamKeys, versionParamKeys]
  )

  useEffect(() => {
    if (!createVersionOpen) return
    if (builderExperience === 'guided') {
      setDslSectionsOpen({
        extensions: false,
        fromSelect: true,
        joins: false,
        where: true,
        groupBy: false,
        having: false,
        orderLimit: false,
      })
      return
    }
    setDslSectionsOpen({
      extensions: true,
      fromSelect: true,
      joins: true,
      where: true,
      groupBy: true,
      having: true,
      orderLimit: true,
    })
  }, [createVersionOpen, builderExperience])

  useEffect(() => {
    if (builderExperience !== 'guided') return
    setShowSqlInternals(false)
    setDslSectionsOpen((prev) => ({
      ...prev,
      extensions: false,
      groupBy: false,
      having: false,
      orderLimit: false,
    }))
  }, [builderExperience])

  useEffect(() => {
    saveConditionPresets(conditionPresets)
  }, [conditionPresets])

  const tableOptions = useMemo(
    () =>
      (dslMetadataQuery.data?.tables ?? [])
        .map((table) => table.name)
        .sort((a, b) => a.localeCompare(b)),
    [dslMetadataQuery.data]
  )
  const dslFunctions = useMemo(() => {
    const fromApi = dslMetadataQuery.data?.functions ?? []
    const source = fromApi.length ? fromApi : DEFAULT_DSL_FUNCTIONS
    return source
      .filter((item) => Boolean(item.key?.trim()))
      .sort((a, b) => (a.key ?? '').localeCompare(b.key ?? ''))
  }, [dslMetadataQuery.data?.functions])

  const aliasToTableMap = useMemo(() => {
    const map = new Map<string, string>()
    const baseAlias = (dsl.fromAlias || 'a').trim() || 'a'
    if (dsl.fromSourceType === 'TABLE' && dsl.fromTable.trim()) {
      map.set(baseAlias, dsl.fromTable.trim())
    }
    dsl.joins.forEach((join, idx) => {
      const alias = (join.alias || `j${idx + 1}`).trim()
      if (alias && join.sourceType === 'TABLE' && join.table.trim()) {
        map.set(alias, join.table.trim())
      }
    })
    return map
  }, [dsl.fromAlias, dsl.fromSourceType, dsl.fromTable, dsl.joins])

  const tableExpressionOptions = useMemo(() => {
    const options: string[] = []
    aliasToTableMap.forEach((tableName, alias) => {
      const columns = tableColumnIndex.get(tableName.toLowerCase()) ?? []
      columns.forEach((column) => {
        options.push(`${alias}.${column}`)
      })
    })
    return Array.from(new Set(options))
  }, [aliasToTableMap, tableColumnIndex])
  const dslFunctionIndex = useMemo(() => {
    const map = new Map<string, EwsV2DslFunction>()
    dslFunctions.forEach((fn) => {
      const key = (fn.key ?? '').trim().toUpperCase()
      if (key) map.set(key, fn)
    })
    return map
  }, [dslFunctions])
  const resolveTableExpressionDataType = (expression: string) => {
    const [alias, column] = expression.split('.', 2)
    if (!alias || !column) return undefined
    const tableName = aliasToTableMap.get(alias)
    if (!tableName) return undefined
    const table = tableMetadataIndex.get(tableName.toLowerCase())
    const columnMeta = (table?.columns ?? []).find(
      (item) => item.name.toLowerCase() === column.toLowerCase()
    )
    return columnMeta?.dataType?.toLowerCase()
  }
  const functionExpressionOptions = useMemo(
    () =>
      buildFunctionExpressionTemplates({
        functions: dslFunctions,
        expressions: tableExpressionOptions,
        resolveDataType: resolveTableExpressionDataType,
      }),
    [dslFunctions, tableExpressionOptions, aliasToTableMap, tableMetadataIndex]
  )
  const expressionOptions = useMemo(
    () =>
      Array.from(
        new Set([...tableExpressionOptions, ...functionExpressionOptions])
      ),
    [tableExpressionOptions, functionExpressionOptions]
  )

  const primaryAlias = (dsl.fromAlias || 'a').trim() || 'a'
  const isSqlRuleType = versionRuleType === 'SQL'
  const isGuided = builderExperience === 'guided'
  const questionNumberOptions = useMemo(() => {
    const sourceOptions =
      versionQuestionSource === 'STOCK_AUDIT'
        ? questionCatalogQuery.data?.stockAudit
        : questionCatalogQuery.data?.msmeInspection

    const fallback =
      versionQuestionSource === 'STOCK_AUDIT'
        ? FALLBACK_STOCK_AUDIT_QUESTIONS
        : FALLBACK_MSME_QUESTIONS

    const mapped =
      sourceOptions && sourceOptions.length > 0
        ? sourceOptions
            .filter(
              (option) =>
                Number.isFinite(option.questionNo) &&
                Number(option.questionNo) > 0
            )
            .map((option) => ({
              value: String(option.questionNo),
              questionText:
                option.questionText?.trim() ||
                option.label?.trim() ||
                `Question ${option.questionNo}`,
              label: option.label?.trim() || '',
            }))
        : fallback.map((questionNo) => ({
            value: String(questionNo),
            questionText: `Question ${questionNo}`,
            label: `Question ${questionNo}`,
          }))

    return mapped
  }, [
    questionCatalogQuery.data?.msmeInspection,
    questionCatalogQuery.data?.stockAudit,
    versionQuestionSource,
  ])
  const selectedQuestionLabel = useMemo(
    () =>
      questionNumberOptions.find((item) => item.value === versionQuestionNo)
        ?.questionText ?? '',
    [questionNumberOptions, versionQuestionNo]
  )
  const wherePresets = useMemo(
    () =>
      conditionPresets
        .filter((preset) => preset.scope === 'WHERE')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [conditionPresets]
  )
  const havingPresets = useMemo(
    () =>
      conditionPresets
        .filter((preset) => preset.scope === 'HAVING')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [conditionPresets]
  )

  const saveConditionPresetForScope = (scope: 'WHERE' | 'HAVING') => {
    const name =
      scope === 'WHERE'
        ? wherePresetNameInput.trim()
        : havingPresetNameInput.trim()
    if (!name) {
      toast.error('Enter a preset name first.')
      return
    }
    const sourceConditions =
      scope === 'WHERE' ? dsl.conditions : dsl.havingConditions
    const configured = sourceConditions.filter(isConditionConfigured)
    if (!configured.length) {
      toast.error('No configured conditions to save as preset.')
      return
    }
    const nextPreset: DslConditionPreset = {
      id: newId(),
      name,
      scope,
      combinator: scope === 'WHERE' ? dsl.combinator : dsl.havingCombinator,
      conditions: configured.map((condition) => toPresetCondition(condition)),
    }
    const existingPreset = conditionPresets.find(
      (item) =>
        item.scope === scope &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    )
    const savedPresetId = existingPreset?.id ?? nextPreset.id
    setConditionPresets((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.scope === scope &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
      if (existingIndex < 0) {
        return [...prev, nextPreset]
      }
      const copy = [...prev]
      copy[existingIndex] = { ...nextPreset, id: prev[existingIndex].id }
      return copy
    })
    if (scope === 'WHERE') {
      setSelectedWherePresetId(savedPresetId)
      setWherePresetNameInput('')
    } else {
      setSelectedHavingPresetId(savedPresetId)
      setHavingPresetNameInput('')
    }
    toast.success('Condition preset saved.')
  }

  const applyConditionPresetForScope = (
    scope: 'WHERE' | 'HAVING',
    mode: 'REPLACE' | 'APPEND'
  ) => {
    const selectedId =
      scope === 'WHERE' ? selectedWherePresetId : selectedHavingPresetId
    if (!selectedId) {
      toast.error('Select a preset first.')
      return
    }
    const preset = conditionPresets.find((item) => item.id === selectedId)
    if (!preset) {
      toast.error('Selected preset was not found.')
      return
    }
    const hydrated = preset.conditions.map((condition) =>
      hydratePresetCondition(condition)
    )
    if (!hydrated.length) {
      toast.error('Preset has no conditions.')
      return
    }
    setDsl((prev) => {
      if (scope === 'WHERE') {
        return {
          ...prev,
          combinator: preset.combinator,
          conditions:
            mode === 'REPLACE' ? hydrated : [...prev.conditions, ...hydrated],
        }
      }
      return {
        ...prev,
        havingCombinator: preset.combinator,
        havingConditions:
          mode === 'REPLACE'
            ? hydrated
            : [...prev.havingConditions, ...hydrated],
      }
    })
    toast.success(mode === 'REPLACE' ? 'Preset applied.' : 'Preset appended.')
  }

  const deleteConditionPresetForScope = (scope: 'WHERE' | 'HAVING') => {
    const selectedId =
      scope === 'WHERE' ? selectedWherePresetId : selectedHavingPresetId
    if (!selectedId) {
      toast.error('Select a preset first.')
      return
    }
    setConditionPresets((prev) => prev.filter((item) => item.id !== selectedId))
    if (scope === 'WHERE') {
      setSelectedWherePresetId('')
    } else {
      setSelectedHavingPresetId('')
    }
    toast.success('Preset removed.')
  }

  useEffect(() => {
    if (versionRuleType !== 'QUESTION' || versionQuestionMode !== 'STANDARD')
      return
    if (!questionNumberOptions.length) {
      if (versionQuestionNo) setVersionQuestionNo('')
      return
    }
    if (
      !questionNumberOptions.some((item) => item.value === versionQuestionNo)
    ) {
      setVersionQuestionNo(questionNumberOptions[0].value)
    }
  }, [
    questionNumberOptions,
    versionQuestionMode,
    versionQuestionNo,
    versionRuleType,
  ])

  const ruleBehaviorSummary = useMemo(() => {
    const lookbackDays = numberOrUndefined(versionLookback) ?? 30
    const reasonConfigured = versionReason.trim().length > 0
    const reasonSuffix = reasonConfigured
      ? ' Reason template is configured.'
      : ' Reason template is not configured.'

    if (versionRuleType === 'ADAPTER') {
      const adapterKey =
        selectedAdapter?.adapterKey || 'an adapter (not selected)'
      const adapterVersion = versionAdapterVersionNo
        ? `v${versionAdapterVersionNo}`
        : 'published version'
      return `This rule reads records from ${adapterKey} (${adapterVersion}), evaluates each row, and creates alerts for matching results over the last ${lookbackDays} day(s).${reasonSuffix}`
    }

    if (versionRuleType === 'PLUGIN') {
      const pluginKey = versionPluginKey.trim() || 'a plugin (not selected)'
      return `This rule executes plugin ${pluginKey} with the provided config/params and creates alerts for matching results over the last ${lookbackDays} day(s).${reasonSuffix}`
    }

    if (versionRuleType === 'QUESTION') {
      if (versionQuestionMode === 'MULTIPLE_CRITICAL_STOCK_AUDIT') {
        const threshold =
          numberOrUndefined(versionQuestionCriticalMinCount) ?? 3
        const answer = versionQuestionCriticalAnswerValue.trim() || 'YES'
        return `This rule reads Stock Audit responses and creates alerts when an account has at least ${threshold} critical answer(s) matching "${answer}" within the configured window of ${lookbackDays} day(s).${reasonSuffix}`
      }
      const questionNo = numberOrUndefined(versionQuestionNo)
      const sourceLabel =
        versionQuestionSource === 'STOCK_AUDIT'
          ? 'Stock Audit responses'
          : 'MSME Inspection responses'
      const operatorLabel =
        QUESTION_OPERATOR_OPTIONS.find(
          (item) => item.value === versionQuestionAnswerOperator
        )?.label ?? versionQuestionAnswerOperator
      return `This rule reads ${sourceLabel}, checks question ${questionNo ?? '(not set)'} with answer criteria "${operatorLabel}"${versionQuestionAnswerOperator === 'ANY_NON_EMPTY' ? '' : ` = "${versionQuestionAnswerValue.trim() || 'YES'}"`}, and creates alerts for matching rows over the last ${lookbackDays} day(s).${reasonSuffix}`
    }

    const sourceTable =
      dsl.fromSourceType === 'SUBQUERY'
        ? 'a custom subquery source'
        : dsl.fromTable.trim()
          ? humanize(dsl.fromTable.trim())
          : 'the selected source table'
    const joinCount = dsl.joins.filter((join) =>
      join.sourceType === 'SUBQUERY'
        ? Boolean(join.subqueryJson.trim())
        : Boolean(join.table.trim())
    ).length
    const cteCount = dsl.ctes.filter(
      (cte) => cte.name.trim() && cte.queryJson.trim()
    ).length
    const whereCount = dsl.conditions.filter(isConditionConfigured).length
    const havingCount = dsl.havingConditions.filter(
      isConditionConfigured
    ).length
    const accountField = dsl.selectAcctNo.trim()
      ? dsl.selectAcctNo.trim()
      : 'account field (required)'
    const customerField = dsl.selectCustName.trim()
    const branchField = dsl.selectBranchCode.trim()
    const conditionParts = [`${whereCount} row-level condition(s)`]
    if (havingCount > 0) {
      conditionParts.push(`${havingCount} group-level condition(s)`)
    }
    return `This rule queries ${sourceTable}${cteCount > 0 ? ` with ${cteCount} CTE(s)` : ``}${joinCount > 0 ? ` and ${joinCount} join(s)` : ``}, applies ${conditionParts.join(` and `)}, and maps ${accountField} as account number${customerField ? `, ${customerField} as customer name` : ``}${branchField ? `, and ${branchField} as branch code` : ``}. It evaluates data over the last ${lookbackDays} day(s).${reasonSuffix}`
  }, [
    dsl.ctes,
    dsl.conditions,
    dsl.fromSourceType,
    dsl.fromTable,
    dsl.havingConditions,
    dsl.joins,
    dsl.selectAcctNo,
    dsl.selectBranchCode,
    dsl.selectCustName,
    selectedAdapter?.adapterKey,
    versionAdapterVersionNo,
    versionLookback,
    versionQuestionAnswerOperator,
    versionQuestionAnswerValue,
    versionQuestionCriticalAnswerValue,
    versionQuestionCriticalMinCount,
    versionQuestionMode,
    versionQuestionNo,
    versionQuestionSource,
    versionPluginKey,
    versionReason,
    versionRuleType,
  ])

  const primaryExpressionOptions = useMemo(() => {
    if (dsl.fromSourceType !== 'TABLE') return []
    const columns =
      tableColumnIndex.get((dsl.fromTable || '').trim().toLowerCase()) ?? []
    const base = columns.map((column) => `${primaryAlias}.${column}`)
    const templates = buildFunctionExpressionTemplates({
      functions: dslFunctions,
      expressions: base,
      resolveDataType: resolveTableExpressionDataType,
    })
    return Array.from(new Set([...base, ...templates]))
  }, [
    dsl.fromSourceType,
    dsl.fromTable,
    primaryAlias,
    tableColumnIndex,
    dslFunctions,
    aliasToTableMap,
    tableMetadataIndex,
  ])

  const expressionLabel = (expression: string) => {
    const functionName = expressionFunctionName(expression)
    if (functionName) {
      const fn = dslFunctionIndex.get(functionName)
      const fnLabel = fn?.label?.trim() || functionName
      return `${fnLabel} • Function expression`
    }
    const [alias, column] = expression.split('.', 2)
    if (!column) return humanize(expression)
    const scope =
      alias === primaryAlias ? 'Selected table' : `Related table (${alias})`
    return `${humanize(column)} • ${scope}`
  }

  const tableLabel = (tableName: string) => {
    const table = tableMetadataIndex.get(tableName.toLowerCase())
    const legacy = table?.legacyAliases?.[0]
    return legacy ? `${humanize(tableName)} (${legacy})` : humanize(tableName)
  }

  const resolveExpressionDataType = (expression: string) => {
    const functionName = expressionFunctionName(expression)
    if (functionName) {
      const fn = dslFunctionIndex.get(functionName)
      return inferFunctionReturnDataType(fn?.returnType)
    }
    const [alias, column] = expression.split('.', 2)
    if (!alias || !column) return undefined
    const tableName = aliasToTableMap.get(alias)
    if (!tableName) return undefined
    const table = tableMetadataIndex.get(tableName.toLowerCase())
    const columnMeta = (table?.columns ?? []).find(
      (item) => item.name.toLowerCase() === column.toLowerCase()
    )
    return columnMeta?.dataType?.toLowerCase()
  }

  const resolveExpressionTableColumn = (expression: string) => {
    const [alias, column] = expression.split('.', 2)
    if (!alias || !column) return null
    const table = aliasToTableMap.get(alias)
    if (!table) return null
    return {
      table,
      column,
    }
  }

  const joinRelationSuggestions = (join: DslJoin, joinIndex: number) => {
    const suggestions: Array<{
      label: string
      left: string
      op: DslJoin['onOp']
      right: string
    }> = []
    if (join.sourceType !== 'TABLE') return suggestions
    const joinTable = join.table.trim()
    if (!joinTable) return suggestions
    const joinAlias = (join.alias || `j${joinIndex + 1}`).trim()
    if (!joinAlias) return suggestions
    const joinTableMeta = tableMetadataIndex.get(joinTable.toLowerCase())
    if (!joinTableMeta) return suggestions

    const existingAliases = new Map<string, string>()
    const baseAlias = (dsl.fromAlias || 'a').trim() || 'a'
    if (dsl.fromSourceType === 'TABLE' && dsl.fromTable.trim()) {
      existingAliases.set(baseAlias, dsl.fromTable.trim())
    }
    dsl.joins.forEach((item, idx) => {
      if (idx >= joinIndex) return
      const alias = (item.alias || `j${idx + 1}`).trim()
      if (alias && item.sourceType === 'TABLE' && item.table.trim()) {
        existingAliases.set(alias, item.table.trim())
      }
    })

    for (const [alias, tableName] of existingAliases.entries()) {
      const existingTable = tableMetadataIndex.get(tableName.toLowerCase())
      if (!existingTable) continue
      for (const col of joinTableMeta.columns ?? []) {
        if (
          col.referencedTable &&
          col.referencedColumn &&
          col.referencedTable.toLowerCase() === existingTable.name.toLowerCase()
        ) {
          suggestions.push({
            label: `${joinAlias}.${col.name} -> ${alias}.${col.referencedColumn}`,
            left: `${joinAlias}.${col.name}`,
            op: '=',
            right: `${alias}.${col.referencedColumn}`,
          })
        }
      }
      for (const col of existingTable.columns ?? []) {
        if (
          col.referencedTable &&
          col.referencedColumn &&
          col.referencedTable.toLowerCase() === joinTableMeta.name.toLowerCase()
        ) {
          suggestions.push({
            label: `${alias}.${col.name} -> ${joinAlias}.${col.referencedColumn}`,
            left: `${alias}.${col.name}`,
            op: '=',
            right: `${joinAlias}.${col.referencedColumn}`,
          })
        }
      }
      const normalizedExisting = new Map<string, string>()
      for (const col of existingTable.columns ?? []) {
        normalizedExisting.set(
          col.name.replace(/_/g, '').toLowerCase(),
          col.name
        )
      }
      for (const col of joinTableMeta.columns ?? []) {
        const key = col.name.replace(/_/g, '').toLowerCase()
        const matched = normalizedExisting.get(key)
        if (!matched) continue
        if (!/(acct|account|cust|customer|branch|id)/i.test(key)) continue
        suggestions.push({
          label: `${joinAlias}.${col.name} ≈ ${alias}.${matched}`,
          left: `${joinAlias}.${col.name}`,
          op: '=',
          right: `${alias}.${matched}`,
        })
      }
    }

    const unique = new Map<string, (typeof suggestions)[number]>()
    for (const candidate of suggestions) {
      unique.set(`${candidate.left}|${candidate.right}`, candidate)
    }
    return Array.from(unique.values())
  }

  const dslDiagnostics = useMemo<DslDiagnostic[]>(() => {
    if (!isSqlRuleType) return []
    const issues: DslDiagnostic[] = []
    const push = (level: DslDiagnostic['level'], message: string) =>
      issues.push({ level, message })
    if (dsl.fromSourceType === 'TABLE') {
      const baseTable = dsl.fromTable.trim()
      if (!baseTable) {
        push('error', 'Base table is required.')
      } else if (!tableMetadataIndex.has(baseTable.toLowerCase())) {
        push('error', `Base table "${baseTable}" is not available in metadata.`)
      }
    } else if (!dsl.fromSubqueryJson.trim()) {
      push('error', 'Base subquery JSON is required when source is Subquery.')
    }
    if (!dsl.selectAcctNo.trim()) {
      push('error', 'Account number expression is required.')
    }
    const aliasSeen = new Set<string>()
    const baseAlias = (dsl.fromAlias || 'a').trim() || 'a'
    aliasSeen.add(baseAlias)
    dsl.joins.forEach((join, idx) => {
      const alias = (join.alias || `j${idx + 1}`).trim()
      if (!alias) {
        push('error', `Join #${idx + 1}: alias is required.`)
      } else if (aliasSeen.has(alias)) {
        push('error', `Join #${idx + 1}: alias "${alias}" is duplicated.`)
      } else {
        aliasSeen.add(alias)
      }
      if (join.sourceType === 'TABLE') {
        const tableName = join.table.trim()
        if (!tableName) {
          push('error', `Join #${idx + 1}: table is required.`)
        } else if (!tableMetadataIndex.has(tableName.toLowerCase())) {
          push(
            'warning',
            `Join #${idx + 1}: table "${tableName}" not found in metadata.`
          )
        }
      } else if (!join.subqueryJson.trim()) {
        push('error', `Join #${idx + 1}: subquery JSON is required.`)
      }
      const hasStructuredOn = join.onLeft.trim() && join.onRight.trim()
      if (!join.on.trim() && !hasStructuredOn) {
        push('error', `Join #${idx + 1}: ON relation is required.`)
      }
      if (safeSqlMode && join.on.trim()) {
        push(
          'warning',
          `Join #${idx + 1}: manual ON expression is enabled. Prefer relation fields in Safe mode.`
        )
      }
    })

    const inspectConditions = (
      scope: 'WHERE' | 'HAVING',
      conditions: DslCondition[]
    ) => {
      conditions.forEach((condition, index) => {
        const label = `${scope} #${index + 1}`
        const op = condition.op
        const leftType = resolveExpressionDataType(condition.left)
        const allowedOps = getOperatorOptionsForType({
          leftType,
          isGuided,
          safeSqlMode,
        })
        if (!allowedOps.includes(op)) {
          push(
            safeSqlMode ? 'error' : 'warning',
            `${label}: operator "${op}" is not allowed for current mode/type.`
          )
        }
        if (
          !NO_VALUE_OPS.has(op) &&
          !RAW_OPS.has(op) &&
          !SUBQUERY_OPS.has(op) &&
          !condition.left.trim()
        ) {
          push('warning', `${label}: left field is empty.`)
        }
        if (safeSqlMode && RAW_OPS.has(op)) {
          push('error', `${label}: RAW operator is blocked in Safe SQL mode.`)
        }
        if (RAW_OPS.has(op) && !condition.rawExpr.trim()) {
          push('error', `${label}: RAW expression is empty.`)
        }
        if (SUBQUERY_OPS.has(op)) {
          const hasGuided =
            condition.subqueryTable.trim() &&
            condition.subqueryLinkLeft.trim() &&
            condition.subqueryLinkRight.trim()
          if (!condition.subqueryJson.trim() && !hasGuided) {
            push(
              'error',
              `${label}: subquery JSON or guided subquery fields are required.`
            )
          }
        }
        if (
          (op === 'LIKE' || op === 'NOT_LIKE') &&
          leftType &&
          NUMERIC_TYPES.has(leftType)
        ) {
          push(
            'warning',
            `${label}: LIKE on numeric field "${condition.left}" may cause cast/full scan.`
          )
        }
        if (LIST_OPS.has(op)) {
          const listSize = parseListTokens(condition.first).length
          if (listSize > 50) {
            push(
              'warning',
              `${label}: IN/NOT IN list has ${listSize} values; consider lookup table/join.`
            )
          }
        }
      })
    }

    inspectConditions('WHERE', dsl.conditions)
    inspectConditions('HAVING', dsl.havingConditions)

    if (!dsl.conditions.some(isConditionConfigured)) {
      push(
        'warning',
        'No WHERE conditions configured; this may create many alerts.'
      )
    }
    if (safeSqlMode && versionSql.trim()) {
      push(
        'error',
        'Raw SQL override is blocked in Safe SQL mode. Clear override or disable Safe mode.'
      )
    }
    return issues
  }, [
    dsl.conditions,
    dsl.fromAlias,
    dsl.fromSourceType,
    dsl.fromSubqueryJson,
    dsl.fromTable,
    dsl.havingConditions,
    dsl.joins,
    dsl.selectAcctNo,
    isGuided,
    isSqlRuleType,
    safeSqlMode,
    dslFunctionIndex,
    tableMetadataIndex,
    versionSql,
  ])
  const blockingDslIssues = useMemo(
    () => dslDiagnostics.filter((item) => item.level === 'error'),
    [dslDiagnostics]
  )
  const rawPredicateCount = useMemo(() => {
    const topLevelRaw = dsl.conditions.filter(
      (item) => item.op === 'RAW'
    ).length
    const havingRaw = dsl.havingConditions.filter(
      (item) => item.op === 'RAW'
    ).length
    const subqueryRaw = [...dsl.conditions, ...dsl.havingConditions].filter(
      (item) => item.subqueryExtraRaw.trim().length > 0
    ).length
    return topLevelRaw + havingRaw + subqueryRaw
  }, [dsl.conditions, dsl.havingConditions])

  const handleOpenRunHits = (runId?: number | null) => {
    if (!runId) return
    setSelectedRunId(runId)
    setSelectedHit(null)
    setEvidenceDialogOpen(false)
    setHitsDialogOpen(true)
  }

  const closeCreateVersionPage = () => {
    if (selectedRuleId) {
      navigate({
        to: '/admin/alerts-v2-rules/$ruleId',
        params: { ruleId: String(selectedRuleId) },
      })
      return
    }
    navigate({ to: '/admin/alerts-v2-rules' })
  }

  const handleCreateVersionOpenChange = (open: boolean) => {
    if (createVersionStandalone && !open) {
      closeCreateVersionPage()
      return
    }
    setCreateVersionOpen(open)
  }

  const CreateVersionContainer = ({ children }: { children: ReactNode }) => {
    if (createVersionStandalone) {
      if (!createVersionOpen) return null
      return (
        <div className='bg-background h-[calc(100vh-10rem)] w-full overflow-hidden rounded-md border p-0 shadow-none'>
          {children}
        </div>
      )
    }

    return (
      <Dialog
        open={createVersionOpen}
        onOpenChange={handleCreateVersionOpenChange}
      >
        <DialogContent className='h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] min-w-[75vw] overflow-hidden p-0'>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EWS Rules</CardTitle>
          <CardDescription>
            You do not have access to this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {createVersionStandalone ? (
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h1 className='text-2xl font-semibold'>
              {isWorkspaceReadOnly
                ? `View Rule Version v${editingVersionNo ?? editVersionNo ?? ''}`.trim()
                : versionEditorMode === 'edit'
                  ? `Edit Rule Version v${editingVersionNo ?? ''}`.trim()
                  : 'Create Rule Version'}
            </h1>
            <p className='text-muted-foreground text-sm'>
              Full-page version builder for{' '}
              {selectedRule
                ? `${selectedRule.ruleName} (${selectedRule.ruleKey})`
                : `rule ${ruleId}`}
              .
            </p>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Badge variant='outline'>
                Current Rule: {selectedRule?.ruleKey ?? `ID ${ruleId}`}
              </Badge>
              <Badge variant={selectedRule?.active ? 'outline' : 'secondary'}>
                {selectedRule?.active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={selectedRuleHealthBadgeVariant}>
                Health: {selectedRule?.healthStatus ?? 'UNKNOWN'}
              </Badge>
            </div>
          </div>
          <Button variant='outline' onClick={closeCreateVersionPage}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Workspace
          </Button>
        </div>
      ) : (
        <>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div>
              <h1 className='text-2xl font-semibold'>EWS Rule Workspace</h1>
              <p className='text-muted-foreground text-sm'>
                Working on:{' '}
                {selectedRule
                  ? `${selectedRule.ruleName} (${selectedRule.ruleKey})`
                  : `rule ${ruleId}`}
                .
              </p>
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>
                  Current Rule: {selectedRule?.ruleKey ?? `ID ${ruleId}`}
                </Badge>
                <Badge variant={selectedRule?.active ? 'outline' : 'secondary'}>
                  {selectedRule?.active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant={selectedRuleHealthBadgeVariant}>
                  Health: {selectedRule?.healthStatus ?? 'UNKNOWN'}
                </Badge>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                onClick={() => navigate({ to: '/admin/alerts-v2-rules' })}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Rules
              </Button>
              <Button
                variant='outline'
                disabled={!canModify}
                onClick={() => setSeverityDialogOpen(true)}
              >
                Manage Severities
              </Button>
              <Button
                variant='outline'
                disabled={!canModify}
                onClick={() => navigate({ to: '/admin/alerts-v2-config' })}
              >
                Manage Config/Thresholds
              </Button>
              <Button
                variant='outline'
                onClick={() => void rulesQuery.refetch()}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
              <Button
                variant='outline'
                disabled={!canModify || revalidateAllMutation.isPending}
                onClick={() => revalidateAllMutation.mutate()}
              >
                <Wrench className='mr-2 h-4 w-4' />
                {revalidateAllMutation.isPending
                  ? 'Revalidating...'
                  : 'Revalidate Health'}
              </Button>
            </div>
          </div>
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRule
                    ? `${selectedRule.ruleName} (${selectedRule.ruleKey})`
                    : 'Select a rule'}
                </CardTitle>
                <CardDescription>Rule metadata and scheduling.</CardDescription>
              </CardHeader>
              {selectedRule ? (
                <CardContent className='space-y-3'>
                  <fieldset
                    disabled={isWorkspaceReadOnly}
                    className='space-y-3'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2'>
                      <div className='space-y-1'>
                        <p className='text-muted-foreground text-[11px] font-medium'>
                          Label / Key
                        </p>
                        <p className='text-sm font-semibold'>
                          {selectedRule.ruleName}
                        </p>
                        <p className='text-muted-foreground font-mono text-xs'>
                          {selectedRule.ruleKey}
                        </p>
                      </div>
                      <div className='flex items-center gap-2 rounded-md border px-3 py-2'>
                        <Label className='text-muted-foreground text-[11px] font-medium'>
                          Active
                        </Label>
                        <Switch
                          checked={editActive}
                          onCheckedChange={setEditActive}
                        />
                      </div>
                    </div>
                    <div className='space-y-2 rounded-md border p-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='text-xs font-medium'>Health</p>
                        <Badge
                          variant={
                            selectedRule.healthStatus === 'BROKEN'
                              ? 'destructive'
                              : selectedRule.healthStatus === 'DEGRADED'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {selectedRule.healthStatus ?? 'UNKNOWN'}
                        </Badge>
                        <span className='text-muted-foreground text-xs'>
                          Checked:{' '}
                          {selectedRule.healthCheckedAt
                            ? new Date(
                                selectedRule.healthCheckedAt
                              ).toLocaleString('en-IN')
                            : '-'}
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs whitespace-pre-wrap'>
                        {selectedRule.healthMessage ||
                          'No health message available.'}
                      </p>
                      {selectedRuleGuardrailReport ? (
                        <div className='space-y-1 rounded-md border p-2 text-xs'>
                          <p className='font-medium'>
                            Guardrail Detail • v
                            {selectedRuleGuardrailReport.versionNo ?? '-'} •
                            Errors:{' '}
                            {selectedRuleGuardrailReport.errorCount ?? 0} •
                            Warnings:{' '}
                            {selectedRuleGuardrailReport.warningCount ?? 0}
                          </p>
                          {(selectedRuleGuardrailReport.errors ?? []).map(
                            (issue, idx) => (
                              <p
                                key={`ws-rule-error-${idx}`}
                                className='text-destructive'
                              >
                                [{issue.code || 'ERROR'}] {issue.message || '-'}
                              </p>
                            )
                          )}
                          {(selectedRuleGuardrailReport.warnings ?? []).map(
                            (issue, idx) => (
                              <p
                                key={`ws-rule-warning-${idx}`}
                                className='text-muted-foreground'
                              >
                                [{issue.code || 'WARN'}] {issue.message || '-'}
                              </p>
                            )
                          )}
                        </div>
                      ) : selectedRule.healthStatus &&
                        selectedRule.healthStatus !== 'HEALTHY' ? (
                        <p className='text-muted-foreground text-xs'>
                          Detailed guardrail issues are not loaded yet. Click{' '}
                          <span className='font-medium'>Revalidate Health</span>{' '}
                          to refresh detailed reasons for this rule.
                        </p>
                      ) : null}
                    </div>
                    <div className='grid gap-2 md:grid-cols-2'>
                      <LabeledControl label='Rule Name'>
                        <Input
                          value={editRuleName}
                          onChange={(e) => setEditRuleName(e.target.value)}
                          placeholder='Rule name'
                        />
                      </LabeledControl>
                      <LabeledControl label='Category'>
                        <Input
                          value={editRuleCategory}
                          onChange={(e) => setEditRuleCategory(e.target.value)}
                          placeholder='Category'
                        />
                      </LabeledControl>
                      <LabeledControl
                        label='Description'
                        className='md:col-span-2'
                      >
                        <Textarea
                          value={editRuleDescription}
                          onChange={(e) =>
                            setEditRuleDescription(e.target.value)
                          }
                          placeholder='Description'
                          className='h-20'
                        />
                      </LabeledControl>
                      <LabeledControl label='Severity Key'>
                        <Select
                          value={editRuleSeverityKey}
                          onValueChange={setEditRuleSeverityKey}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Severity key' />
                          </SelectTrigger>
                          <SelectContent>
                            {severityOptions.map((key) => (
                              <SelectItem key={key} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </LabeledControl>
                      <LabeledControl label='Dedupe Mode'>
                        <Select
                          value={editRuleDedupeMode}
                          onValueChange={(value) =>
                            setEditRuleDedupeMode(
                              value as 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Dedupe mode' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='PERIOD'>PERIOD</SelectItem>
                            <SelectItem value='DAY'>DAY</SelectItem>
                            <SelectItem value='WINDOW'>WINDOW</SelectItem>
                            <SelectItem value='NONE'>NONE</SelectItem>
                          </SelectContent>
                        </Select>
                      </LabeledControl>
                      <LabeledControl label='Dedupe Window Days'>
                        <Input
                          value={editRuleDedupeWindowDays}
                          onChange={(e) =>
                            setEditRuleDedupeWindowDays(e.target.value)
                          }
                          placeholder='Dedupe window days'
                          type='number'
                          disabled={editRuleDedupeMode !== 'WINDOW'}
                        />
                      </LabeledControl>
                      <LabeledControl
                        label='Alert Category Override'
                        className='md:col-span-2'
                      >
                        <Input
                          value={editRuleAlertCategory}
                          onChange={(e) =>
                            setEditRuleAlertCategory(e.target.value)
                          }
                          placeholder='Alert category override'
                        />
                      </LabeledControl>
                      <LabeledControl
                        label='Alert Title Template (shown in alert list/details)'
                        className='md:col-span-2'
                      >
                        <Textarea
                          value={editRuleAlertTitleTemplate}
                          onChange={(e) =>
                            setEditRuleAlertTitleTemplate(e.target.value)
                          }
                          placeholder='Example: {{acctNo}} - {{custName}} crossed {{thresholdValue}}'
                          className='h-20'
                        />
                        <p className='text-muted-foreground text-[11px]'>
                          Supports tokens like {'{{acctNo}}'}, {'{{custName}}'},{' '}
                          {'{{branchCode}}'}, {'{{alertValue}}'} and{' '}
                          {'{{thresholdValue}}'}.
                        </p>
                      </LabeledControl>
                    </div>

                    <div className='space-y-2 rounded-md border p-3'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs'>Auto-run Scheduler</Label>
                        <Switch
                          checked={editAutoRun}
                          onCheckedChange={setEditAutoRun}
                        />
                      </div>
                      <div className='grid gap-2 md:grid-cols-2'>
                        <LabeledControl label='Mode'>
                          <Select
                            value={editSchedulerMode}
                            onValueChange={(value) =>
                              setEditSchedulerMode(value as SchedulerMode)
                            }
                            disabled={!editAutoRun}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='BASIC'>Basic</SelectItem>
                              <SelectItem value='ADVANCED'>Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </LabeledControl>
                        <LabeledControl label='Timezone'>
                          <Input
                            value={FIXED_CRON_TIMEZONE}
                            readOnly
                            disabled
                          />
                        </LabeledControl>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {editAutoRun
                          ? editScheduleSentence
                          : `Auto-run is disabled. Schedules run in ${FIXED_CRON_TIMEZONE} when enabled.`}
                      </p>
                      {editSchedulerMode === 'BASIC' ? (
                        <div className='grid gap-2 md:grid-cols-4'>
                          <LabeledControl label='Pattern'>
                            <Select
                              value={editBasicPreset}
                              onValueChange={(value) =>
                                setEditBasicPreset(value as BasicSchedulePreset)
                              }
                              disabled={!editAutoRun}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BASIC_PRESET_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </LabeledControl>
                          {editBasicPreset === 'EVERY_N_MINUTES' ? (
                            <LabeledControl label='Every (minutes)'>
                              <Input
                                type='number'
                                min={1}
                                max={59}
                                value={editBasicInterval}
                                onChange={(e) =>
                                  setEditBasicInterval(e.target.value)
                                }
                                disabled={!editAutoRun}
                              />
                            </LabeledControl>
                          ) : null}
                          {editBasicPreset === 'EVERY_N_HOURS' ? (
                            <>
                              <LabeledControl label='Every (hours)'>
                                <Input
                                  type='number'
                                  min={1}
                                  max={23}
                                  value={editBasicInterval}
                                  onChange={(e) =>
                                    setEditBasicInterval(e.target.value)
                                  }
                                  disabled={!editAutoRun}
                                />
                              </LabeledControl>
                              <LabeledControl label='At Minute'>
                                <Input
                                  type='number'
                                  min={0}
                                  max={59}
                                  value={editBasicMinuteOfHour}
                                  onChange={(e) =>
                                    setEditBasicMinuteOfHour(e.target.value)
                                  }
                                  disabled={!editAutoRun}
                                />
                              </LabeledControl>
                            </>
                          ) : null}
                          {editBasicPreset === 'DAILY' ||
                          editBasicPreset === 'EVERY_N_DAYS' ||
                          editBasicPreset === 'WEEKLY' ||
                          editBasicPreset === 'MONTHLY' ? (
                            <LabeledControl label='Run Time'>
                              <Input
                                type='time'
                                value={editBasicTime}
                                onChange={(e) =>
                                  setEditBasicTime(e.target.value)
                                }
                                disabled={!editAutoRun}
                              />
                            </LabeledControl>
                          ) : null}
                          {editBasicPreset === 'EVERY_N_DAYS' ? (
                            <LabeledControl label='Every (days)'>
                              <Input
                                type='number'
                                min={1}
                                max={31}
                                value={editBasicInterval}
                                onChange={(e) =>
                                  setEditBasicInterval(e.target.value)
                                }
                                disabled={!editAutoRun}
                              />
                            </LabeledControl>
                          ) : null}
                          {editBasicPreset === 'WEEKLY' ? (
                            <LabeledControl label='Day of Week'>
                              <Select
                                value={editBasicDayOfWeek}
                                onValueChange={setEditBasicDayOfWeek}
                                disabled={!editAutoRun}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {BASIC_DAY_OF_WEEK_OPTIONS.map((day) => (
                                    <SelectItem key={day} value={day}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </LabeledControl>
                          ) : null}
                          {editBasicPreset === 'MONTHLY' ? (
                            <LabeledControl label='Day of Month'>
                              <Input
                                type='number'
                                min={1}
                                max={31}
                                value={editBasicDayOfMonth}
                                onChange={(e) =>
                                  setEditBasicDayOfMonth(e.target.value)
                                }
                                disabled={!editAutoRun}
                              />
                            </LabeledControl>
                          ) : null}
                        </div>
                      ) : (
                        <LabeledControl label='Cron Expression (advanced raw input)'>
                          <Input
                            value={editCron}
                            onChange={(e) => setEditCron(e.target.value)}
                            placeholder='0 30 6 * * *'
                            disabled={!editAutoRun}
                          />
                        </LabeledControl>
                      )}
                      <p className='text-muted-foreground text-xs'>
                        Last auto-run: {asDate(selectedRule.lastAutoRunAt)}
                      </p>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        disabled={!canModify || updateRuleMutation.isPending}
                        onClick={() => updateRuleMutation.mutate()}
                      >
                        <Wrench className='mr-2 h-4 w-4' />
                        Save
                      </Button>
                      <Button
                        variant='outline'
                        disabled={!canCreateArtifacts}
                        onClick={() =>
                          navigate({
                            to: '/admin/alerts-v2-rules/$ruleId/create-version',
                            params: { ruleId: String(selectedRuleId) },
                          })
                        }
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        New Version
                      </Button>
                    </div>
                  </fieldset>
                  {isWorkspaceReadOnly ? (
                    <p className='text-muted-foreground text-xs'>
                      Read-only mode is active for this workspace.
                    </p>
                  ) : null}
                </CardContent>
              ) : null}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Run</CardTitle>
              </CardHeader>
              {selectedRule ? (
                <CardContent className='space-y-2'>
                  <div className='grid gap-2 md:grid-cols-4'>
                    <LabeledControl label='Version'>
                      <Select
                        value={runVersionNo ? String(runVersionNo) : ''}
                        onValueChange={(value) =>
                          setRunVersionNo(Number(value) || null)
                        }
                        disabled={!(versionsQuery.data ?? []).length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select version' />
                        </SelectTrigger>
                        <SelectContent>
                          {(versionsQuery.data ?? []).map((version) => (
                            <SelectItem
                              key={version.id}
                              value={String(version.versionNo)}
                            >
                              v{version.versionNo} • {version.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    <LabeledControl label='Run Date'>
                      <Input
                        type='date'
                        value={runDate}
                        onChange={(e) => setRunDate(e.target.value)}
                      />
                    </LabeledControl>
                    <div className='md:col-span-2 md:self-end'>
                      <div className='flex flex-wrap gap-2'>
                        <Button
                          variant='outline'
                          disabled={
                            runMutation.isPending || isWorkspaceReadOnly
                          }
                          onClick={() => runMutation.mutate(true)}
                        >
                          <TestTube2 className='mr-2 h-4 w-4' />
                          Dry Run
                        </Button>
                        <Button
                          disabled={
                            runMutation.isPending || isWorkspaceReadOnly
                          }
                          onClick={() => runMutation.mutate(false)}
                        >
                          <Play className='mr-2 h-4 w-4' />
                          Execute
                        </Button>
                      </div>
                    </div>
                  </div>
                  <LabeledControl label='Run Params JSON'>
                    <Textarea
                      value={runParams}
                      onChange={(e) => setRunParams(e.target.value)}
                      className='h-24 font-mono text-xs'
                      placeholder='Run Params JSON'
                    />
                  </LabeledControl>
                  {lastRunResult ? (
                    <div className='rounded-md border p-2 text-xs'>
                      <div className='flex flex-wrap gap-3'>
                        <span>Status: {lastRunResult.status ?? '-'}</span>
                        <span>Rows: {lastRunResult.totalRows ?? 0}</span>
                        <span>Created: {lastRunResult.createdHits ?? 0}</span>
                        <span>
                          Duplicates: {lastRunResult.duplicateHits ?? 0}
                        </span>
                      </div>
                      {lastRunResult.errorMessage ? (
                        <p className='text-destructive mt-1'>
                          {lastRunResult.errorMessage}
                        </p>
                      ) : null}
                      {lastRunResult.resolvedConfig ? (
                        <div className='mt-2 space-y-1'>
                          <p className='text-muted-foreground text-[11px]'>
                            Resolved Config Snapshot
                          </p>
                          <Textarea
                            readOnly
                            value={pretty(lastRunResult.resolvedConfig)}
                            className='h-24 font-mono text-[11px]'
                          />
                        </div>
                      ) : null}
                      {lastRunResult.previewRows?.length ? (
                        <div className='mt-2 space-y-1'>
                          <p className='text-muted-foreground text-[11px]'>
                            Preview Rows ({lastRunResult.previewRows.length})
                          </p>
                          <Textarea
                            readOnly
                            value={pretty(lastRunResult.previewRows)}
                            className='h-36 font-mono text-[11px]'
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className='space-y-2 rounded-md border p-2'>
                    <div className='flex items-center justify-between'>
                      <p className='text-xs font-medium'>Recent Runs</p>
                      <Badge variant='outline'>
                        {runsQuery.data?.length ?? 0}
                      </Badge>
                    </div>
                    <div className='space-y-1'>
                      {(runsQuery.data ?? []).slice(0, 8).map((run) => (
                        <div
                          key={run.id}
                          className='flex items-center justify-between gap-2 rounded border px-2 py-1 text-[11px]'
                        >
                          <div className='min-w-0'>
                            <p className='truncate'>
                              #{run.id} • v{run.versionNo} •{' '}
                              {asDate(run.runDate)}
                            </p>
                            <p className='text-muted-foreground truncate'>
                              {run.status} • rows {run.totalRows ?? 0} • created{' '}
                              {run.createdHits ?? 0}
                            </p>
                          </div>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleOpenRunHits(run.id)}
                          >
                            View Hits
                          </Button>
                        </div>
                      ))}
                      {!runsQuery.data?.length ? (
                        <p className='text-muted-foreground text-[11px]'>
                          No runs yet.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              ) : null}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Versions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {(versionsQuery.data ?? []).map((version) => (
                  <div
                    key={version.id}
                    className='space-y-2 rounded-md border p-2 text-xs'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <p className='font-medium'>
                          v{version.versionNo} • {version.status}
                        </p>
                        <p className='text-muted-foreground'>
                          {asDate(version.updatedAt ?? version.createdAt)}
                        </p>
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            navigate({
                              to: '/admin/alerts-v2-rules/$ruleId/create-version',
                              params: { ruleId: String(selectedRuleId) },
                              search: {
                                editVersionNo: version.versionNo,
                                readOnly: true,
                              },
                            })
                          }
                        >
                          View
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={
                            !canModify ||
                            version.status === 'PUBLISHED' ||
                            cloneVersionMutation.isPending
                          }
                          onClick={() =>
                            navigate({
                              to: '/admin/alerts-v2-rules/$ruleId/create-version',
                              params: { ruleId: String(selectedRuleId) },
                              search: { editVersionNo: version.versionNo },
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={
                            !canCreateArtifacts ||
                            cloneVersionMutation.isPending
                          }
                          onClick={() =>
                            cloneVersionMutation.mutate(version.versionNo)
                          }
                        >
                          Clone
                        </Button>
                        <Button
                          size='sm'
                          disabled={
                            !canModify ||
                            version.status === 'PUBLISHED' ||
                            publishMutation.isPending
                          }
                          onClick={() =>
                            publishMutation.mutate(version.versionNo)
                          }
                        >
                          <Rocket className='mr-1 h-4 w-4' />
                          Publish
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogContent className='max-h-[90vh] max-w-6xl overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Manage Config/Thresholds</DialogTitle>
                <DialogDescription>
                  Define reusable parameters once, then assign global and
                  rule-level values. Global applies to all rules, rule scope
                  overrides global, and version overrides supersede both.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 lg:grid-cols-2'>
                <div className='space-y-3 rounded-md border p-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold'>Config Parameters</p>
                    <Badge variant='outline'>{configParamOptions.length}</Badge>
                  </div>
                  <div className='grid gap-2 md:grid-cols-2'>
                    <LabeledControl label='Param Key'>
                      <Input
                        value={configParamKeyInput}
                        onChange={(e) =>
                          setConfigParamKeyInput(
                            e.target.value.toUpperCase().replace(/\s+/g, '_')
                          )
                        }
                        placeholder='THRESHOLD_MIN_SCORE'
                      />
                    </LabeledControl>
                    <LabeledControl label='Label'>
                      <Input
                        value={configParamLabelInput}
                        onChange={(e) =>
                          setConfigParamLabelInput(e.target.value)
                        }
                        placeholder='Minimum Score'
                      />
                    </LabeledControl>
                    <LabeledControl label='Value Type'>
                      <Select
                        value={configParamTypeInput}
                        onValueChange={(value) =>
                          setConfigParamTypeInput(
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
                    </LabeledControl>
                    <LabeledControl label='Default Value (JSON literal)'>
                      <Input
                        value={configParamDefaultInput}
                        onChange={(e) =>
                          setConfigParamDefaultInput(e.target.value)
                        }
                        placeholder={'700 or "HIGH" or {"min":700}'}
                      />
                    </LabeledControl>
                    <div className='col-span-2 grid gap-2 md:grid-cols-2'>
                      <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                        <Label className='text-xs'>Allow Global Scope</Label>
                        <Switch
                          checked={configParamAllowGlobalInput}
                          onCheckedChange={setConfigParamAllowGlobalInput}
                        />
                      </div>
                      <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                        <Label className='text-xs'>Allow Rule Scope</Label>
                        <Switch
                          checked={configParamAllowRuleInput}
                          onCheckedChange={setConfigParamAllowRuleInput}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='flex justify-end'>
                    <Button
                      onClick={() => createConfigParamMutation.mutate()}
                      disabled={
                        createConfigParamMutation.isPending ||
                        !configParamKeyInput.trim() ||
                        !configParamLabelInput.trim()
                      }
                    >
                      Add Parameter
                    </Button>
                  </div>

                  <ScrollArea className='h-[320px] rounded-md border p-2'>
                    <div className='space-y-2'>
                      {configParamOptions.map((param) => (
                        <div
                          key={param.id}
                          className='flex items-start justify-between gap-2 rounded-md border p-2 text-xs'
                        >
                          <div className='min-w-0 space-y-1'>
                            <p className='font-medium'>
                              {param.paramKey}{' '}
                              <span className='text-muted-foreground'>
                                ({param.label})
                              </span>
                            </p>
                            <p className='text-muted-foreground'>
                              {param.valueType} • Global:{' '}
                              {param.allowGlobalScope ? 'Yes' : 'No'} • Rule:{' '}
                              {param.allowRuleScope ? 'Yes' : 'No'}
                            </p>
                            <p className='text-muted-foreground line-clamp-2 break-all'>
                              Default:{' '}
                              {param.defaultValue !== undefined
                                ? pretty(param.defaultValue)
                                : '-'}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant={param.active ? 'default' : 'outline'}
                            >
                              {param.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={toggleConfigParamMutation.isPending}
                              onClick={() =>
                                toggleConfigParamMutation.mutate({
                                  paramId: param.id,
                                  active: !param.active,
                                })
                              }
                            >
                              {param.active ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!configParamOptions.length ? (
                        <p className='text-muted-foreground text-xs'>
                          No config parameters defined yet.
                        </p>
                      ) : null}
                    </div>
                  </ScrollArea>
                </div>

                <div className='space-y-3 rounded-md border p-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold'>Scoped Values</p>
                    <Badge variant='outline'>
                      Rule: {selectedRule?.ruleKey ?? 'Not selected'}
                    </Badge>
                  </div>

                  <LabeledControl label='Parameter'>
                    <Select
                      value={configValueParamKeyInput}
                      onValueChange={setConfigValueParamKeyInput}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select parameter' />
                      </SelectTrigger>
                      <SelectContent>
                        {configParamOptions.map((param) => (
                          <SelectItem key={param.id} value={param.paramKey}>
                            {param.paramKey} ({param.valueType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledControl>

                  <div className='space-y-2 rounded-md border p-2'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>
                        Global Value (all rules)
                      </Label>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={
                          upsertConfigValueMutation.isPending ||
                          !selectedConfigParam?.allowGlobalScope
                        }
                        onClick={() =>
                          upsertConfigValueMutation.mutate({
                            scopeType: 'GLOBAL',
                            valueText: configValueGlobalInput,
                          })
                        }
                      >
                        Save Global
                      </Button>
                    </div>
                    <Textarea
                      value={configValueGlobalInput}
                      onChange={(e) =>
                        setConfigValueGlobalInput(e.target.value)
                      }
                      className='h-24 font-mono text-xs'
                      placeholder={'700 or "MEDIUM" or {"limit": 10}'}
                      disabled={!selectedConfigParam?.allowGlobalScope}
                    />
                  </div>

                  <div className='space-y-2 rounded-md border p-2'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>
                        Rule Value ({selectedRule?.ruleKey ?? 'select a rule'})
                      </Label>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={
                          upsertConfigValueMutation.isPending ||
                          !selectedRule ||
                          !selectedConfigParam?.allowRuleScope
                        }
                        onClick={() =>
                          upsertConfigValueMutation.mutate({
                            scopeType: 'RULE',
                            valueText: configValueRuleInput,
                          })
                        }
                      >
                        Save Rule
                      </Button>
                    </div>
                    <Textarea
                      value={configValueRuleInput}
                      onChange={(e) => setConfigValueRuleInput(e.target.value)}
                      className='h-24 font-mono text-xs'
                      placeholder='Rule specific value'
                      disabled={
                        !selectedRule || !selectedConfigParam?.allowRuleScope
                      }
                    />
                  </div>

                  <p className='text-muted-foreground text-xs'>
                    Precedence at execution: <b>Version Override</b> {'>'}{' '}
                    <b>Rule Scope</b> {'>'} <b>Global</b> {'>'} <b>Default</b>{' '}
                    {'>'} legacy version params.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setConfigDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      <Dialog open={severityDialogOpen} onOpenChange={setSeverityDialogOpen}>
        <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Manage Severities</DialogTitle>
            <DialogDescription>
              Default keys are pre-seeded. Add custom keys and map each to a
              workflow severity bucket.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid gap-2 md:grid-cols-5'>
              <LabeledControl label='Severity Key'>
                <Input
                  value={severityKeyInput}
                  onChange={(e) =>
                    setSeverityKeyInput(
                      e.target.value.toUpperCase().replace(/\s+/g, '_')
                    )
                  }
                  placeholder='Key'
                />
              </LabeledControl>
              <LabeledControl label='Label'>
                <Input
                  value={severityLabelInput}
                  onChange={(e) => setSeverityLabelInput(e.target.value)}
                  placeholder='Label'
                />
              </LabeledControl>
              <LabeledControl label='Rank'>
                <Input
                  value={severityRankInput}
                  onChange={(e) => setSeverityRankInput(e.target.value)}
                  type='number'
                  placeholder='Rank'
                />
              </LabeledControl>
              <LabeledControl label='Color Hex'>
                <Input
                  value={severityColorInput}
                  onChange={(e) => setSeverityColorInput(e.target.value)}
                  placeholder='#RRGGBB'
                />
              </LabeledControl>
              <LabeledControl label='Workflow Level'>
                <Select
                  value={severityWorkflowLevelInput}
                  onValueChange={(value) =>
                    setSeverityWorkflowLevelInput(
                      value as 'LOW' | 'MEDIUM' | 'HIGH'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Workflow Level' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='LOW'>LOW</SelectItem>
                    <SelectItem value='MEDIUM'>MEDIUM</SelectItem>
                    <SelectItem value='HIGH'>HIGH</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledControl>
            </div>
            <div className='flex justify-end'>
              <Button
                disabled={createSeverityMutation.isPending}
                onClick={() => createSeverityMutation.mutate()}
              >
                Add Severity
              </Button>
            </div>

            <div className='space-y-2'>
              {(severityQuery.data ?? []).map((severity) => (
                <div
                  key={severity.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-xs'
                >
                  <div className='space-y-1'>
                    <p className='font-medium'>
                      {severity.severityKey}{' '}
                      <span className='text-muted-foreground'>
                        ({severity.label})
                      </span>
                    </p>
                    <p className='text-muted-foreground'>
                      Rank {severity.rankOrder} • Workflow bucket:{' '}
                      {severity.workflowSeverityLevel || '-'} • Color:{' '}
                      {severity.colorHex || '-'}{' '}
                      {severity.isSystem ? '• System' : ''}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant={severity.isActive ? 'default' : 'outline'}>
                      {severity.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={toggleSeverityMutation.isPending}
                      onClick={() =>
                        toggleSeverityMutation.mutate({
                          id: severity.id,
                          isActive: !severity.isActive,
                        })
                      }
                    >
                      {severity.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSeverityDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Rule</DialogTitle>
            <DialogDescription>
              Define key/name and optional scheduler metadata.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2 md:grid-cols-2'>
            <LabeledControl label='Rule Key'>
              <Input
                value={newRuleKey}
                onChange={(e) =>
                  setNewRuleKey(
                    e.target.value.toUpperCase().replace(/\s+/g, '_')
                  )
                }
                placeholder='Rule Key'
              />
            </LabeledControl>
            <LabeledControl label='Rule Name'>
              <Input
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder='Rule Name'
              />
            </LabeledControl>
            <LabeledControl label='Severity Key'>
              <Select
                value={newRuleSeverityKey}
                onValueChange={setNewRuleSeverityKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Severity key' />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledControl>
            <LabeledControl label='Dedupe Mode'>
              <Select
                value={newRuleDedupeMode}
                onValueChange={(value) =>
                  setNewRuleDedupeMode(
                    value as 'PERIOD' | 'DAY' | 'WINDOW' | 'NONE'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Dedupe mode' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PERIOD'>PERIOD</SelectItem>
                  <SelectItem value='DAY'>DAY</SelectItem>
                  <SelectItem value='WINDOW'>WINDOW</SelectItem>
                  <SelectItem value='NONE'>NONE</SelectItem>
                </SelectContent>
              </Select>
            </LabeledControl>
            <LabeledControl label='Dedupe Window Days'>
              <Input
                type='number'
                value={newRuleDedupeWindowDays}
                onChange={(e) => setNewRuleDedupeWindowDays(e.target.value)}
                placeholder='Dedupe window days'
                disabled={newRuleDedupeMode !== 'WINDOW'}
              />
            </LabeledControl>
            <LabeledControl
              label='Alert Category Override'
              className='md:col-span-2'
            >
              <Input
                value={newRuleAlertCategory}
                onChange={(e) => setNewRuleAlertCategory(e.target.value)}
                placeholder='Alert category override'
              />
            </LabeledControl>
            <LabeledControl
              label='Alert Title Template (shown in alert list/details)'
              className='md:col-span-2'
            >
              <Textarea
                value={newRuleAlertTitleTemplate}
                onChange={(e) => setNewRuleAlertTitleTemplate(e.target.value)}
                placeholder='Example: {{acctNo}} - {{custName}} crossed {{thresholdValue}}'
                className='h-20'
              />
              <p className='text-muted-foreground text-[11px]'>
                Supports tokens like {'{{acctNo}}'}, {'{{custName}}'},{' '}
                {'{{branchCode}}'}, {'{{alertValue}}'} and{' '}
                {'{{thresholdValue}}'}.
              </p>
            </LabeledControl>
            <div className='space-y-2 rounded-md border p-3 md:col-span-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Auto-run Scheduler</Label>
                <Switch
                  checked={newRuleAutoRun}
                  onCheckedChange={setNewRuleAutoRun}
                />
              </div>
              <div className='grid gap-2 md:grid-cols-2'>
                <LabeledControl label='Mode'>
                  <Select
                    value={newSchedulerMode}
                    onValueChange={(value) =>
                      setNewSchedulerMode(value as SchedulerMode)
                    }
                    disabled={!newRuleAutoRun}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='BASIC'>Basic</SelectItem>
                      <SelectItem value='ADVANCED'>Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </LabeledControl>
                <LabeledControl label='Timezone'>
                  <Input value={FIXED_CRON_TIMEZONE} readOnly disabled />
                </LabeledControl>
              </div>
              <p className='text-muted-foreground text-xs'>
                {newRuleAutoRun
                  ? newScheduleSentence
                  : `Auto-run is disabled. Schedules run in ${FIXED_CRON_TIMEZONE} when enabled.`}
              </p>
              {newSchedulerMode === 'BASIC' ? (
                <div className='grid gap-2 md:grid-cols-4'>
                  <LabeledControl label='Pattern'>
                    <Select
                      value={newBasicPreset}
                      onValueChange={(value) =>
                        setNewBasicPreset(value as BasicSchedulePreset)
                      }
                      disabled={!newRuleAutoRun}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BASIC_PRESET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledControl>
                  {newBasicPreset === 'EVERY_N_MINUTES' ? (
                    <LabeledControl label='Every (minutes)'>
                      <Input
                        type='number'
                        min={1}
                        max={59}
                        value={newBasicInterval}
                        onChange={(e) => setNewBasicInterval(e.target.value)}
                        disabled={!newRuleAutoRun}
                      />
                    </LabeledControl>
                  ) : null}
                  {newBasicPreset === 'EVERY_N_HOURS' ? (
                    <>
                      <LabeledControl label='Every (hours)'>
                        <Input
                          type='number'
                          min={1}
                          max={23}
                          value={newBasicInterval}
                          onChange={(e) => setNewBasicInterval(e.target.value)}
                          disabled={!newRuleAutoRun}
                        />
                      </LabeledControl>
                      <LabeledControl label='At Minute'>
                        <Input
                          type='number'
                          min={0}
                          max={59}
                          value={newBasicMinuteOfHour}
                          onChange={(e) =>
                            setNewBasicMinuteOfHour(e.target.value)
                          }
                          disabled={!newRuleAutoRun}
                        />
                      </LabeledControl>
                    </>
                  ) : null}
                  {newBasicPreset === 'DAILY' ||
                  newBasicPreset === 'EVERY_N_DAYS' ||
                  newBasicPreset === 'WEEKLY' ||
                  newBasicPreset === 'MONTHLY' ? (
                    <LabeledControl label='Run Time'>
                      <Input
                        type='time'
                        value={newBasicTime}
                        onChange={(e) => setNewBasicTime(e.target.value)}
                        disabled={!newRuleAutoRun}
                      />
                    </LabeledControl>
                  ) : null}
                  {newBasicPreset === 'EVERY_N_DAYS' ? (
                    <LabeledControl label='Every (days)'>
                      <Input
                        type='number'
                        min={1}
                        max={31}
                        value={newBasicInterval}
                        onChange={(e) => setNewBasicInterval(e.target.value)}
                        disabled={!newRuleAutoRun}
                      />
                    </LabeledControl>
                  ) : null}
                  {newBasicPreset === 'WEEKLY' ? (
                    <LabeledControl label='Day of Week'>
                      <Select
                        value={newBasicDayOfWeek}
                        onValueChange={setNewBasicDayOfWeek}
                        disabled={!newRuleAutoRun}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BASIC_DAY_OF_WEEK_OPTIONS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                  ) : null}
                  {newBasicPreset === 'MONTHLY' ? (
                    <LabeledControl label='Day of Month'>
                      <Input
                        type='number'
                        min={1}
                        max={31}
                        value={newBasicDayOfMonth}
                        onChange={(e) => setNewBasicDayOfMonth(e.target.value)}
                        disabled={!newRuleAutoRun}
                      />
                    </LabeledControl>
                  ) : null}
                </div>
              ) : (
                <LabeledControl label='Cron Expression (advanced raw input)'>
                  <Input
                    value={newRuleCron}
                    onChange={(e) => setNewRuleCron(e.target.value)}
                    placeholder='0 30 6 * * *'
                    disabled={!newRuleAutoRun}
                  />
                </LabeledControl>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createRuleMutation.isPending}
              onClick={() => createRuleMutation.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateVersionContainer>
        <fieldset disabled={isWorkspaceReadOnly} className='contents'>
          <div className='bg-muted/20 border-b px-6 py-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='space-y-1'>
                <h2 className='text-lg leading-none font-semibold'>
                  {isWorkspaceReadOnly
                    ? `View Version v${editingVersionNo ?? editVersionNo ?? ''}`.trim()
                    : versionEditorMode === 'edit'
                      ? `Edit Version v${editingVersionNo ?? ''}`.trim()
                      : 'Create Version'}
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Current Rule:{' '}
                  {selectedRule
                    ? `${selectedRule.ruleName} (${selectedRule.ruleKey})`
                    : `rule ${ruleId}`}
                  .
                </p>
                <div className='flex flex-wrap items-center gap-2 pt-1'>
                  <Badge variant='outline'>
                    Rule Key: {selectedRule?.ruleKey ?? `ID ${ruleId}`}
                  </Badge>
                  <Badge
                    variant={selectedRule?.active ? 'outline' : 'secondary'}
                  >
                    {selectedRule?.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={selectedRuleHealthBadgeVariant}>
                    Health: {selectedRule?.healthStatus ?? 'UNKNOWN'}
                  </Badge>
                </div>
              </div>
              {isSqlRuleType ? (
                <div className='flex items-center gap-2'>
                  <div className='flex items-center rounded-md border p-1'>
                    <Button
                      size='sm'
                      variant={
                        builderExperience === 'guided' ? 'default' : 'ghost'
                      }
                      className='h-7 px-2'
                      onClick={() => setBuilderExperience('guided')}
                    >
                      Guided
                    </Button>
                    <Button
                      size='sm'
                      variant={
                        builderExperience === 'advanced' ? 'default' : 'ghost'
                      }
                      className='h-7 px-2'
                      onClick={() => setBuilderExperience('advanced')}
                    >
                      Advanced
                    </Button>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setDslSectionsOpen({
                        extensions: true,
                        fromSelect: true,
                        joins: true,
                        where: true,
                        groupBy: true,
                        having: true,
                        orderLimit: true,
                      })
                    }
                  >
                    Expand All
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setDslSectionsOpen({
                        extensions: false,
                        fromSelect: false,
                        joins: false,
                        where: false,
                        groupBy: false,
                        having: false,
                        orderLimit: false,
                      })
                    }
                  >
                    Collapse All
                  </Button>
                  <div className='flex items-center gap-2 rounded-md border px-2 py-1'>
                    <Label className='text-muted-foreground text-[11px] font-medium'>
                      Safe SQL Mode
                    </Label>
                    <Switch
                      checked={safeSqlMode}
                      onCheckedChange={setSafeSqlMode}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className='grid h-[calc(100vh-185px)] gap-4 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1.2fr)_470px]'>
            <div className='space-y-3 overflow-y-auto pr-1'>
              {isSqlRuleType && isGuided ? (
                <div className='bg-muted/20 rounded-md border p-3 text-sm'>
                  <p className='font-medium'>Quick Start</p>
                  <p className='text-muted-foreground'>
                    1) Pick data source. 2) Add plain-language conditions. 3)
                    Compile and create version.
                  </p>
                </div>
              ) : null}
              <div className='bg-primary/5 rounded-md border p-3 text-sm'>
                <p className='font-medium'>What This Rule Will Do</p>
                <p className='text-muted-foreground mt-1'>
                  {ruleBehaviorSummary}
                </p>
              </div>
              <div className='grid items-start gap-2 md:grid-cols-4'>
                <div className='grid gap-2 md:col-span-4 md:grid-cols-3'>
                  <LabeledControl label='Rule Type' className='md:col-span-2'>
                    <Select
                      value={versionRuleType}
                      onValueChange={(value) =>
                        setVersionRuleType(
                          value as 'SQL' | 'QUESTION' | 'ADAPTER' | 'PLUGIN'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='SQL'>
                          SQL (database query)
                        </SelectItem>
                        <SelectItem value='QUESTION'>
                          QUESTION (question response matcher)
                        </SelectItem>
                        <SelectItem value='ADAPTER'>
                          ADAPTER (HTTP integration)
                        </SelectItem>
                        <SelectItem value='PLUGIN'>
                          PLUGIN (custom Java)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledControl>
                  <LabeledControl label='Lookback Days'>
                    <Input
                      type='number'
                      value={versionLookback}
                      onChange={(e) => setVersionLookback(e.target.value)}
                      placeholder='Lookback Days'
                    />
                  </LabeledControl>
                </div>
                <LabeledControl
                  label='Reason Template'
                  className='md:col-span-4'
                >
                  <Input
                    value={versionReason}
                    onChange={(e) => setVersionReason(e.target.value)}
                    placeholder='Reason Template'
                  />
                </LabeledControl>
                {versionRuleType === 'ADAPTER' ? (
                  <>
                    <LabeledControl label='Adapter' className='md:col-span-2'>
                      <Select
                        value={versionAdapterId}
                        onValueChange={setVersionAdapterId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select adapter' />
                        </SelectTrigger>
                        <SelectContent>
                          {(adaptersQuery.data ?? []).map((adapter) => (
                            <SelectItem
                              key={adapter.id}
                              value={String(adapter.id)}
                            >
                              {adapter.adapterKey} - {adapter.adapterName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    <LabeledControl
                      label='Adapter Version'
                      className='md:col-span-2'
                    >
                      <Select
                        value={versionAdapterVersionNo}
                        onValueChange={setVersionAdapterVersionNo}
                        disabled={!versionAdapterId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Published/default if empty' />
                        </SelectTrigger>
                        <SelectContent>
                          {(adapterVersionsQuery.data ?? []).map((version) => (
                            <SelectItem
                              key={version.id}
                              value={String(version.versionNo)}
                            >
                              v{version.versionNo} ({version.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    {selectedAdapter ? (
                      <p className='text-muted-foreground text-xs md:col-span-4'>
                        Using adapter <b>{selectedAdapter.adapterKey}</b>. Leave
                        version blank to use published version.
                      </p>
                    ) : null}
                  </>
                ) : null}
                {versionRuleType === 'QUESTION' ? (
                  <>
                    <LabeledControl
                      label='Question Source'
                      className='md:col-span-2'
                    >
                      <Select
                        value={versionQuestionSource}
                        onValueChange={(value) =>
                          setVersionQuestionSource(value as QuestionRuleSource)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select source' />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_SOURCE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    <LabeledControl label='Mode' className='md:col-span-2'>
                      <Select
                        value={versionQuestionMode}
                        onValueChange={(value) =>
                          setVersionQuestionMode(value as QuestionRuleMode)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select mode' />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_MODE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    {versionQuestionMode === 'STANDARD' ? (
                      <>
                        <LabeledControl
                          label='Question Number'
                          className='md:col-span-2'
                        >
                          <Select
                            value={versionQuestionNo}
                            onValueChange={setVersionQuestionNo}
                            disabled={!questionNumberOptions.length}
                          >
                            <SelectTrigger className='w-full min-w-0 overflow-hidden'>
                              <SelectValue
                                asChild
                                placeholder={
                                  questionCatalogQuery.isFetching
                                    ? 'Loading questions...'
                                    : 'Select question number'
                                }
                              >
                                <span className='block max-w-[calc(100%-1.5rem)] truncate'>
                                  {versionQuestionNo
                                    ? `Q${versionQuestionNo}`
                                    : questionCatalogQuery.isFetching
                                      ? 'Loading questions...'
                                      : 'Select question number'}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {questionNumberOptions.map((item) => (
                                <SelectItem
                                  key={item.value}
                                  value={item.value}
                                  textValue={`Q${item.value}`}
                                  className='items-start py-2'
                                >
                                  <div className='flex flex-col gap-1'>
                                    <span className='text-muted-foreground text-xs'>
                                      Q{item.value}
                                    </span>
                                    <span className='leading-snug whitespace-normal'>
                                      {item.questionText}
                                    </span>
                                    {item.label &&
                                    item.label !== item.questionText ? (
                                      <span className='text-muted-foreground text-[11px] leading-snug whitespace-normal'>
                                        {item.label}
                                      </span>
                                    ) : null}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedQuestionLabel ? (
                            <p className='text-muted-foreground w-full text-xs leading-snug break-words'>
                              {selectedQuestionLabel}
                            </p>
                          ) : null}
                        </LabeledControl>
                        <LabeledControl
                          label='Answer Criteria'
                          className='md:col-span-2'
                        >
                          <Select
                            value={versionQuestionAnswerOperator}
                            onValueChange={(value) =>
                              setVersionQuestionAnswerOperator(
                                value as QuestionAnswerOperator
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select criteria' />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_OPERATOR_OPTIONS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </LabeledControl>
                        {versionQuestionAnswerOperator !== 'ANY_NON_EMPTY' ? (
                          <LabeledControl
                            label='Answer Value'
                            className='md:col-span-4'
                          >
                            <Input
                              value={versionQuestionAnswerValue}
                              onChange={(e) =>
                                setVersionQuestionAnswerValue(e.target.value)
                              }
                              placeholder='YES'
                            />
                          </LabeledControl>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <LabeledControl
                          label='Minimum Matching Issues'
                          className='md:col-span-2'
                        >
                          <Input
                            type='number'
                            min={2}
                            value={versionQuestionCriticalMinCount}
                            onChange={(e) =>
                              setVersionQuestionCriticalMinCount(e.target.value)
                            }
                            placeholder='3'
                          />
                        </LabeledControl>
                        <LabeledControl
                          label='Critical Answer Value'
                          className='md:col-span-2'
                        >
                          <Input
                            value={versionQuestionCriticalAnswerValue}
                            onChange={(e) =>
                              setVersionQuestionCriticalAnswerValue(
                                e.target.value
                              )
                            }
                            placeholder='YES'
                          />
                        </LabeledControl>
                      </>
                    )}
                  </>
                ) : null}
                {versionRuleType === 'PLUGIN' ? (
                  <>
                    <LabeledControl
                      label='Plugin Key'
                      className='md:col-span-2'
                    >
                      <Select
                        value={versionPluginKey}
                        onValueChange={setVersionPluginKey}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select plugin key' />
                        </SelectTrigger>
                        <SelectContent>
                          {(pluginKeysQuery.data ?? []).map((pluginKey) => (
                            <SelectItem key={pluginKey} value={pluginKey}>
                              {pluginKey}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledControl>
                    <LabeledControl
                      label='Plugin Config JSON'
                      className='md:col-span-4'
                    >
                      <Textarea
                        value={versionPluginConfig}
                        onChange={(e) => setVersionPluginConfig(e.target.value)}
                        className='h-20 font-mono text-xs'
                        placeholder='Plugin Config JSON'
                      />
                    </LabeledControl>
                  </>
                ) : null}
                <LabeledControl label='Params JSON' className='md:col-span-4'>
                  <Textarea
                    value={versionParams}
                    onChange={(e) => setVersionParams(e.target.value)}
                    className='h-20 font-mono text-xs'
                    placeholder='Params JSON'
                  />
                </LabeledControl>
                <LabeledControl
                  label='Config Overrides JSON'
                  className='md:col-span-4'
                >
                  <Textarea
                    value={versionConfigOverrides}
                    onChange={(e) => setVersionConfigOverrides(e.target.value)}
                    className='h-20 font-mono text-xs'
                    placeholder='{"THRESHOLD_MIN_CREDIT_SCORE": 700}'
                  />
                  <p className='text-muted-foreground text-[11px]'>
                    Override selected global/rule config keys for this version.
                    Version overrides win over rule/global values.
                  </p>
                </LabeledControl>
                <LabeledControl label='Notes' className='md:col-span-4'>
                  <Input
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder='Notes'
                  />
                </LabeledControl>
              </div>

              {isSqlRuleType ? (
                <>
                  <Collapsible
                    open={dslSectionsOpen.extensions}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({
                        ...prev,
                        extensions: open,
                      }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.extensions && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              Advanced SQL Extensions
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <p className='text-muted-foreground text-xs'>
                          CTEs and source subqueries (advanced mode)
                        </p>
                      </div>
                      <CollapsibleContent className='space-y-3 pt-2'>
                        <div className='grid gap-2 md:grid-cols-3'>
                          <LabeledControl label='From Source Type'>
                            <Select
                              value={dsl.fromSourceType}
                              onValueChange={(value) =>
                                setDsl((prev) => ({
                                  ...prev,
                                  fromSourceType: value as 'TABLE' | 'SUBQUERY',
                                }))
                              }
                              disabled={isGuided}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='TABLE'>
                                  {SOURCE_TYPE_LABELS.TABLE}
                                </SelectItem>
                                <SelectItem value='SUBQUERY'>
                                  {SOURCE_TYPE_LABELS.SUBQUERY}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </LabeledControl>
                          <div className='md:col-span-2'>
                            <p className='text-muted-foreground rounded-md border px-3 py-2 text-xs leading-relaxed'>
                              Use this only when a plain table source is not
                              enough. Subquery JSON must be a valid DSL object
                              with `from` + `select`.
                            </p>
                          </div>
                        </div>

                        {dsl.fromSourceType === 'SUBQUERY' ? (
                          <LabeledControl label='From Subquery JSON'>
                            <Textarea
                              value={dsl.fromSubqueryJson}
                              onChange={(e) =>
                                setDsl((prev) => ({
                                  ...prev,
                                  fromSubqueryJson: e.target.value,
                                }))
                              }
                              className='h-32 font-mono text-xs'
                              placeholder='{"from":{"table":"customer","alias":"c"},"select":{"columns":["c.acct_no","c.cust_name"]}}'
                            />
                          </LabeledControl>
                        ) : null}

                        <div className='space-y-2 rounded-md border p-3'>
                          <div className='flex items-center justify-between gap-2'>
                            <Label>Common Table Expressions (CTEs)</Label>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                setDsl((prev) => ({
                                  ...prev,
                                  ctes: [...prev.ctes, defaultCte()],
                                }))
                              }
                            >
                              <Plus className='mr-1 h-4 w-4' />
                              Add CTE
                            </Button>
                          </div>
                          {!dsl.ctes.length ? (
                            <p className='text-muted-foreground text-xs'>
                              No CTEs configured.
                            </p>
                          ) : null}
                          <div className='space-y-2'>
                            {dsl.ctes.map((cte) => (
                              <div
                                key={cte.id}
                                className='space-y-2 rounded-md border p-2'
                              >
                                <div className='grid gap-2 md:grid-cols-[1fr_auto]'>
                                  <LabeledControl label='CTE Name'>
                                    <Input
                                      value={cte.name}
                                      onChange={(e) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          ctes: prev.ctes.map((item) =>
                                            item.id === cte.id
                                              ? {
                                                  ...item,
                                                  name: e.target.value,
                                                }
                                              : item
                                          ),
                                        }))
                                      }
                                      placeholder='latest'
                                    />
                                  </LabeledControl>
                                  <LabeledControl label='Action'>
                                    <Button
                                      size='icon'
                                      variant='outline'
                                      onClick={() =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          ctes: prev.ctes.filter(
                                            (item) => item.id !== cte.id
                                          ),
                                        }))
                                      }
                                    >
                                      <X className='h-4 w-4' />
                                    </Button>
                                  </LabeledControl>
                                </div>
                                <LabeledControl label='CTE Query JSON'>
                                  <Textarea
                                    value={cte.queryJson}
                                    onChange={(e) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        ctes: prev.ctes.map((item) =>
                                          item.id === cte.id
                                            ? {
                                                ...item,
                                                queryJson: e.target.value,
                                              }
                                            : item
                                        ),
                                      }))
                                    }
                                    className='h-28 font-mono text-xs'
                                    placeholder='{"from":{"table":"txn_master","alias":"t"},"select":{"columns":["t.from_ac","SUM(t.amount) AS total_amount"]},"groupBy":["t.from_ac"]}'
                                  />
                                </LabeledControl>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.fromSelect}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({
                        ...prev,
                        fromSelect: open,
                      }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.fromSelect && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              From + Select Mapping
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <p className='text-muted-foreground text-xs'>
                          {dslMetadataQuery.isFetching
                            ? 'Loading schema metadata...'
                            : `${tableOptions.length} tables loaded • ${dslFunctions.length} functions available`}
                        </p>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        <div className='grid gap-2 md:grid-cols-2'>
                          <LabeledControl label='From Table'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.fromTable}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    fromTable: value,
                                  }))
                                }
                                options={tableOptions}
                                placeholder='From table'
                                searchPlaceholder='Search table...'
                                allowClear
                                getLabel={tableLabel}
                              />
                            ) : (
                              <div className='text-muted-foreground rounded-md border px-3 py-2 text-xs'>
                                Source is subquery. Edit it in Advanced SQL
                                Extensions.
                              </div>
                            )}
                          </LabeledControl>
                          <LabeledControl label='From Alias'>
                            {!isGuided ? (
                              <Input
                                value={dsl.fromAlias}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    fromAlias: e.target.value,
                                  }))
                                }
                                placeholder='From alias (e.g. a)'
                              />
                            ) : (
                              <div className='text-muted-foreground rounded-md border px-3 py-2 text-xs'>
                                Base alias is auto-managed in guided mode.
                              </div>
                            )}
                          </LabeledControl>

                          <LabeledControl label='Account Number Field (required)'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectAcctNo}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectAcctNo: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select acctNo (required)'
                                searchPlaceholder='Search field...'
                                allowClear
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectAcctNo}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectAcctNo: e.target.value,
                                  }))
                                }
                                placeholder='e.g. a.acct_no'
                              />
                            )}
                          </LabeledControl>

                          <LabeledControl label='Customer Name Field'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectCustName}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectCustName: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select custName'
                                searchPlaceholder='Search field...'
                                allowClear
                                clearLabel='None'
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectCustName}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectCustName: e.target.value,
                                  }))
                                }
                                placeholder='Optional expression'
                              />
                            )}
                          </LabeledControl>

                          <LabeledControl label='Branch Code Field'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectBranchCode}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectBranchCode: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select branchCode'
                                searchPlaceholder='Search field...'
                                allowClear
                                clearLabel='None'
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectBranchCode}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectBranchCode: e.target.value,
                                  }))
                                }
                                placeholder='Optional expression'
                              />
                            )}
                          </LabeledControl>

                          <LabeledControl label='Remarks Field'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectRemarks}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectRemarks: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select remarks'
                                searchPlaceholder='Search field...'
                                allowClear
                                clearLabel='None'
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectRemarks}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectRemarks: e.target.value,
                                  }))
                                }
                                placeholder='Optional expression or string literal'
                              />
                            )}
                          </LabeledControl>

                          <LabeledControl label='Alert Value Field'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectAlertValue}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectAlertValue: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select alertValue'
                                searchPlaceholder='Search field...'
                                allowClear
                                clearLabel='None'
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectAlertValue}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectAlertValue: e.target.value,
                                  }))
                                }
                                placeholder='Optional numeric expression'
                              />
                            )}
                          </LabeledControl>

                          <LabeledControl label='Threshold Value Field'>
                            {dsl.fromSourceType === 'TABLE' ? (
                              <SearchableSelectField
                                value={dsl.selectThresholdValue}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectThresholdValue: value,
                                  }))
                                }
                                options={primaryExpressionOptions}
                                placeholder='Select thresholdValue'
                                searchPlaceholder='Search field...'
                                allowClear
                                clearLabel='None'
                                getLabel={expressionLabel}
                              />
                            ) : (
                              <Input
                                value={dsl.selectThresholdValue}
                                onChange={(e) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    selectThresholdValue: e.target.value,
                                  }))
                                }
                                placeholder='Optional numeric expression'
                              />
                            )}
                          </LabeledControl>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.joins}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({ ...prev, joins: open }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.joins && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              {isGuided
                                ? 'Optional: Connect Related Data'
                                : 'Joins'}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            setDsl((prev) => ({
                              ...prev,
                              joins: [...prev.joins, defaultJoin()],
                            }))
                          }
                        >
                          <Plus className='mr-1 h-4 w-4' />
                          Add Join
                        </Button>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        {dsl.joins.map((join, joinIndex) => {
                          const relationSuggestions = joinRelationSuggestions(
                            join,
                            joinIndex
                          )
                          return (
                            <div
                              key={join.id}
                              className='space-y-2 rounded-md border p-2'
                            >
                              <div className='grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-12'>
                                <div className='min-w-0 sm:col-span-1 xl:col-span-2'>
                                  <LabeledControl label='Join Type'>
                                    <Select
                                      value={join.type}
                                      onValueChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.map((item) =>
                                            item.id === join.id
                                              ? {
                                                  ...item,
                                                  type: value as DslJoin['type'],
                                                }
                                              : item
                                          ),
                                        }))
                                      }
                                    >
                                      <SelectTrigger className='w-full min-w-0 [&>span]:truncate'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='INNER'>
                                          {JOIN_TYPE_LABELS.INNER}
                                        </SelectItem>
                                        <SelectItem value='LEFT'>
                                          {JOIN_TYPE_LABELS.LEFT}
                                        </SelectItem>
                                        <SelectItem value='RIGHT'>
                                          {JOIN_TYPE_LABELS.RIGHT}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </LabeledControl>
                                </div>
                                <div className='min-w-0 sm:col-span-1 xl:col-span-3'>
                                  <LabeledControl label='Join Source Type'>
                                    <Select
                                      value={join.sourceType}
                                      onValueChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.map((item) =>
                                            item.id === join.id
                                              ? {
                                                  ...item,
                                                  sourceType: value as
                                                    | 'TABLE'
                                                    | 'SUBQUERY',
                                                }
                                              : item
                                          ),
                                        }))
                                      }
                                    >
                                      <SelectTrigger className='w-full min-w-0 [&>span]:truncate'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='TABLE'>
                                          {SOURCE_TYPE_LABELS.TABLE}
                                        </SelectItem>
                                        <SelectItem value='SUBQUERY'>
                                          {SOURCE_TYPE_LABELS.SUBQUERY}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </LabeledControl>
                                </div>
                                <div className='min-w-0 sm:col-span-1 xl:col-span-4'>
                                  <LabeledControl label='Related Source'>
                                    {join.sourceType === 'TABLE' ? (
                                      <SearchableSelectField
                                        value={join.table}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            joins: prev.joins.map((item) =>
                                              item.id === join.id
                                                ? { ...item, table: value }
                                                : item
                                            ),
                                          }))
                                        }
                                        options={tableOptions}
                                        placeholder='Join table'
                                        searchPlaceholder='Search table...'
                                        allowClear
                                        getLabel={tableLabel}
                                      />
                                    ) : (
                                      <Textarea
                                        value={join.subqueryJson}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            joins: prev.joins.map((item) =>
                                              item.id === join.id
                                                ? {
                                                    ...item,
                                                    subqueryJson:
                                                      e.target.value,
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                        className='h-20 font-mono text-xs'
                                        placeholder='Join subquery DSL JSON'
                                      />
                                    )}
                                  </LabeledControl>
                                </div>
                                <div className='min-w-0 sm:col-span-2 xl:col-span-2'>
                                  <LabeledControl label='Alias'>
                                    {!isGuided ? (
                                      <Input
                                        value={join.alias}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            joins: prev.joins.map((item) =>
                                              item.id === join.id
                                                ? {
                                                    ...item,
                                                    alias: e.target.value,
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                        placeholder='alias'
                                      />
                                    ) : (
                                      <div className='text-muted-foreground rounded-md border px-3 py-2 text-xs break-words'>
                                        Alias is auto-managed.
                                      </div>
                                    )}
                                  </LabeledControl>
                                </div>
                                <div className='sm:col-span-2 xl:col-span-1 xl:justify-self-end'>
                                  <LabeledControl label='Action'>
                                    <Button
                                      size='icon'
                                      variant='outline'
                                      className='w-full sm:w-10'
                                      onClick={() =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.filter(
                                            (item) => item.id !== join.id
                                          ),
                                        }))
                                      }
                                    >
                                      <X className='h-4 w-4' />
                                    </Button>
                                  </LabeledControl>
                                </div>
                              </div>

                              <div className='grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-12'>
                                <div className='min-w-0 sm:col-span-1 xl:col-span-5'>
                                  <LabeledControl label='Left Field'>
                                    <SearchableSelectField
                                      value={join.onLeft}
                                      onChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.map((item) =>
                                            item.id === join.id
                                              ? { ...item, onLeft: value }
                                              : item
                                          ),
                                        }))
                                      }
                                      options={expressionOptions}
                                      placeholder='ON left field'
                                      searchPlaceholder='Search field...'
                                      allowClear
                                      getLabel={expressionLabel}
                                    />
                                  </LabeledControl>
                                </div>
                                <div className='min-w-0 sm:col-span-1 xl:col-span-2'>
                                  <LabeledControl label='Comparison'>
                                    <Select
                                      value={join.onOp}
                                      onValueChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.map((item) =>
                                            item.id === join.id
                                              ? {
                                                  ...item,
                                                  onOp: value as DslJoin['onOp'],
                                                }
                                              : item
                                          ),
                                        }))
                                      }
                                    >
                                      <SelectTrigger className='w-full min-w-0 [&>span]:truncate'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='='>=</SelectItem>
                                        <SelectItem value='!='>!=</SelectItem>
                                        <SelectItem value='>'>{'>'}</SelectItem>
                                        <SelectItem value='>='>
                                          {'>='}
                                        </SelectItem>
                                        <SelectItem value='<'>{'<'}</SelectItem>
                                        <SelectItem value='<='>
                                          {'<='}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </LabeledControl>
                                </div>
                                <div className='min-w-0 sm:col-span-2 xl:col-span-5'>
                                  <LabeledControl label='Right Field'>
                                    <SearchableSelectField
                                      value={join.onRight}
                                      onChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          joins: prev.joins.map((item) =>
                                            item.id === join.id
                                              ? { ...item, onRight: value }
                                              : item
                                          ),
                                        }))
                                      }
                                      options={expressionOptions}
                                      placeholder='ON right field'
                                      searchPlaceholder='Search field...'
                                      allowClear
                                      getLabel={expressionLabel}
                                    />
                                  </LabeledControl>
                                </div>
                              </div>

                              {join.sourceType === 'TABLE' &&
                              relationSuggestions.length ? (
                                <LabeledControl label='Suggested Relation'>
                                  <Select
                                    value='__none__'
                                    onValueChange={(value) => {
                                      if (value === '__none__') return
                                      const suggestion =
                                        relationSuggestions.find(
                                          (item) =>
                                            `${item.left}|${item.op}|${item.right}` ===
                                            value
                                        )
                                      if (!suggestion) return
                                      setDsl((prev) => ({
                                        ...prev,
                                        joins: prev.joins.map((item) =>
                                          item.id === join.id
                                            ? {
                                                ...item,
                                                onLeft: suggestion.left,
                                                onOp: suggestion.op,
                                                onRight: suggestion.right,
                                                on: '',
                                              }
                                            : item
                                        ),
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className='w-full min-w-0 [&>span]:truncate'>
                                      <SelectValue placeholder='Suggested relation (from foreign keys)' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='__none__'>
                                        Select suggestion
                                      </SelectItem>
                                      {relationSuggestions.map((suggestion) => (
                                        <SelectItem
                                          key={`${suggestion.left}|${suggestion.op}|${suggestion.right}`}
                                          value={`${suggestion.left}|${suggestion.op}|${suggestion.right}`}
                                        >
                                          {suggestion.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </LabeledControl>
                              ) : null}

                              {!isGuided ? (
                                <LabeledControl label='Manual ON Expression (last resort)'>
                                  <Input
                                    value={join.on}
                                    onChange={(e) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        joins: prev.joins.map((item) =>
                                          item.id === join.id
                                            ? { ...item, on: e.target.value }
                                            : item
                                        ),
                                      }))
                                    }
                                    placeholder='Manual ON expression (last resort)'
                                  />
                                </LabeledControl>
                              ) : null}
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.where}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({ ...prev, where: open }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.where && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              {isGuided
                                ? 'Rule Conditions'
                                : 'Where Conditions'}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <div className='flex items-center gap-2'>
                          <Select
                            value={dsl.combinator}
                            onValueChange={(value) =>
                              setDsl((prev) => ({
                                ...prev,
                                combinator: value as DslState['combinator'],
                              }))
                            }
                          >
                            <SelectTrigger className='w-24'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='AND'>AND</SelectItem>
                              <SelectItem value='OR'>OR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              setDsl((prev) => ({
                                ...prev,
                                conditions: [
                                  ...prev.conditions,
                                  defaultCondition(),
                                ],
                              }))
                            }
                          >
                            <Plus className='mr-1 h-4 w-4' />
                            Add
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        <div className='bg-muted/20 grid gap-2 rounded-md border p-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]'>
                          <LabeledControl label='Condition Preset'>
                            <Select
                              value={selectedWherePresetId}
                              onValueChange={setSelectedWherePresetId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select preset' />
                              </SelectTrigger>
                              <SelectContent>
                                {wherePresets.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    {preset.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </LabeledControl>
                          <LabeledControl label='Replace'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                applyConditionPresetForScope('WHERE', 'REPLACE')
                              }
                            >
                              Load
                            </Button>
                          </LabeledControl>
                          <LabeledControl label='Append'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                applyConditionPresetForScope('WHERE', 'APPEND')
                              }
                            >
                              Append
                            </Button>
                          </LabeledControl>
                          <LabeledControl label='Delete'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                deleteConditionPresetForScope('WHERE')
                              }
                            >
                              Delete
                            </Button>
                          </LabeledControl>
                          <LabeledControl
                            label='Save Current As'
                            className='md:col-span-3'
                          >
                            <Input
                              value={wherePresetNameInput}
                              onChange={(e) =>
                                setWherePresetNameInput(e.target.value)
                              }
                              placeholder='e.g. active_sma_accounts'
                            />
                          </LabeledControl>
                          <LabeledControl label='Action'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                saveConditionPresetForScope('WHERE')
                              }
                            >
                              Save
                            </Button>
                          </LabeledControl>
                        </div>
                        {dsl.conditions.map((condition) => {
                          const noValue = NO_VALUE_OPS.has(condition.op)
                          const range = RANGE_OPS.has(condition.op)
                          const list = LIST_OPS.has(condition.op)
                          const isRaw = RAW_OPS.has(condition.op)
                          const isSubquery = SUBQUERY_OPS.has(condition.op)
                          const listTokens = parseListTokens(condition.first)
                          const mode = normalizeConditionMode(
                            condition.op,
                            condition.mode
                          )
                          const fieldModeAllowed = isFieldModeAllowed(
                            condition.op
                          )
                          const leftType = resolveExpressionDataType(
                            condition.left
                          )
                          const allowedOperators = getOperatorOptionsForType({
                            leftType,
                            isGuided,
                            safeSqlMode,
                          })
                          const operatorOptions = withCurrentOption(
                            allowedOperators,
                            condition.op
                          ) as DslOperator[]
                          const literalInputType =
                            leftType && NUMERIC_TYPES.has(leftType)
                              ? 'number'
                              : leftType &&
                                  (leftType === 'datetime' ||
                                    leftType === 'timestamp')
                                ? 'datetime-local'
                                : leftType && DATE_TYPES.has(leftType)
                                  ? 'date'
                                  : 'text'
                          const suggestionSource = resolveExpressionTableColumn(
                            condition.left
                          )
                          const showValueSuggestions =
                            mode === 'LITERAL' &&
                            !noValue &&
                            !range &&
                            !isRaw &&
                            !isSubquery &&
                            Boolean(suggestionSource)
                          const isCurrentSuggestionRequest =
                            suggestionRequest?.scope === 'WHERE' &&
                            suggestionRequest?.conditionId === condition.id
                          const suggestionValues = isCurrentSuggestionRequest
                            ? (dslSuggestionsQuery.data ?? [])
                            : []
                          return (
                            <div
                              key={condition.id}
                              className='space-y-2 rounded-md border p-2'
                            >
                              <div className='grid gap-2 md:grid-cols-[1fr_130px_140px_auto]'>
                                <LabeledControl label='Field'>
                                  {isRaw || isSubquery ? (
                                    <div className='text-muted-foreground rounded-md border px-3 py-2 text-xs'>
                                      Not required for {condition.op} operator.
                                    </div>
                                  ) : (
                                    <SearchableSelectField
                                      value={condition.left}
                                      onChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          conditions: prev.conditions.map(
                                            (item) =>
                                              item.id === condition.id
                                                ? {
                                                    ...item,
                                                    left: value,
                                                  }
                                                : item
                                          ),
                                        }))
                                      }
                                      options={expressionOptions}
                                      placeholder='Left field'
                                      searchPlaceholder='Search field...'
                                      allowClear
                                      getLabel={expressionLabel}
                                    />
                                  )}
                                </LabeledControl>
                                <LabeledControl label='Operator'>
                                  <Select
                                    value={condition.op}
                                    onValueChange={(value) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        conditions: prev.conditions.map(
                                          (item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  op: value as DslOperator,
                                                  mode: normalizeConditionMode(
                                                    value as DslOperator,
                                                    item.mode
                                                  ),
                                                }
                                              : item
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operatorOptions.map((op) => (
                                        <SelectItem key={op} value={op}>
                                          {OP_LABELS[op]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </LabeledControl>
                                <LabeledControl label='Value Type'>
                                  <Select
                                    value={mode}
                                    onValueChange={(value) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        conditions: prev.conditions.map(
                                          (item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  mode: value as DslCondition['mode'],
                                                }
                                              : item
                                        ),
                                      }))
                                    }
                                    disabled={noValue || isRaw || isSubquery}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='LITERAL'>
                                        {CONDITION_MODE_LABELS.LITERAL}
                                      </SelectItem>
                                      <SelectItem value='PARAM'>
                                        {CONDITION_MODE_LABELS.PARAM}
                                      </SelectItem>
                                      {fieldModeAllowed ? (
                                        <SelectItem value='FIELD'>
                                          {CONDITION_MODE_LABELS.FIELD}
                                        </SelectItem>
                                      ) : null}
                                    </SelectContent>
                                  </Select>
                                </LabeledControl>
                                <LabeledControl label='Action'>
                                  <Button
                                    size='icon'
                                    variant='outline'
                                    onClick={() =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        conditions:
                                          prev.conditions.length === 1
                                            ? [defaultCondition()]
                                            : prev.conditions.filter(
                                                (item) =>
                                                  item.id !== condition.id
                                              ),
                                      }))
                                    }
                                  >
                                    <X className='h-4 w-4' />
                                  </Button>
                                </LabeledControl>
                              </div>
                              {leftType ? (
                                <p className='text-muted-foreground text-[11px]'>
                                  Type: {leftType}
                                </p>
                              ) : null}
                              {isRaw ? (
                                <LabeledControl label='RAW SQL Expression'>
                                  <Textarea
                                    value={condition.rawExpr}
                                    onChange={(e) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        conditions: prev.conditions.map(
                                          (item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  rawExpr: e.target.value,
                                                }
                                              : item
                                        ),
                                      }))
                                    }
                                    className='h-20 font-mono text-xs'
                                    placeholder="e.g. c.balance < 0 AND c.status = 'ACTIVE'"
                                  />
                                </LabeledControl>
                              ) : null}
                              {isSubquery ? (
                                <div className='space-y-2'>
                                  <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
                                    <LabeledControl label='Subquery Table'>
                                      <SearchableSelectField
                                        value={condition.subqueryTable}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subqueryTable: value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        options={tableOptions}
                                        placeholder='Subquery table'
                                        searchPlaceholder='Search table...'
                                        allowClear
                                        getLabel={tableLabel}
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Subquery Alias'>
                                      <Input
                                        value={condition.subqueryAlias}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subqueryAlias:
                                                        e.target.value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        placeholder='sq'
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Select Expression'>
                                      <Input
                                        value={condition.subquerySelectExpr}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subquerySelectExpr:
                                                        e.target.value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        placeholder='1'
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Outer Link Field'>
                                      <SearchableSelectField
                                        value={condition.subqueryLinkLeft}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subqueryLinkLeft: value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        options={expressionOptions}
                                        placeholder='Outer field'
                                        searchPlaceholder='Search field...'
                                        allowClear
                                        getLabel={expressionLabel}
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Inner Link Field'>
                                      <Input
                                        value={condition.subqueryLinkRight}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subqueryLinkRight:
                                                        e.target.value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        placeholder='sq.account_no'
                                      />
                                    </LabeledControl>
                                    {!isGuided ? (
                                      <LabeledControl label='Extra RAW Filter (optional)'>
                                        <Input
                                          value={condition.subqueryExtraRaw}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              conditions: prev.conditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryExtraRaw:
                                                          e.target.value,
                                                      }
                                                    : item
                                              ),
                                            }))
                                          }
                                          placeholder="sq.status = 'ACTIVE'"
                                        />
                                      </LabeledControl>
                                    ) : null}
                                  </div>
                                  {!isGuided ||
                                  condition.subqueryJson.trim() ? (
                                    <LabeledControl
                                      label={`${condition.op} Subquery JSON Override (optional)`}
                                    >
                                      <Textarea
                                        value={condition.subqueryJson}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      subqueryJson:
                                                        e.target.value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        className='h-24 font-mono text-xs'
                                        placeholder='Optional raw subquery JSON override'
                                      />
                                    </LabeledControl>
                                  ) : null}
                                </div>
                              ) : null}
                              {!noValue && !isRaw && !isSubquery ? (
                                <div className='grid gap-2 md:grid-cols-2'>
                                  {mode === 'FIELD' ? (
                                    <LabeledControl label='Right Field'>
                                      <SearchableSelectField
                                        value={condition.first}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      first: value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        options={expressionOptions}
                                        placeholder='Right field'
                                        searchPlaceholder='Search field...'
                                        allowClear
                                        getLabel={expressionLabel}
                                      />
                                    </LabeledControl>
                                  ) : mode === 'PARAM' ? (
                                    <div className='space-y-2'>
                                      {suggestedParamKeys.length ? (
                                        <LabeledControl label='Pick Parameter Key'>
                                          <Select
                                            value='__pick__'
                                            onValueChange={(value) => {
                                              if (value === '__pick__') return
                                              setDsl((prev) => ({
                                                ...prev,
                                                conditions: prev.conditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          first: value,
                                                        }
                                                      : item
                                                ),
                                              }))
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder='Pick from Params JSON' />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value='__pick__'>
                                                Pick parameter
                                              </SelectItem>
                                              {suggestedParamKeys.map((key) => (
                                                <SelectItem
                                                  key={key}
                                                  value={key}
                                                >
                                                  {key}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </LabeledControl>
                                      ) : null}
                                      <LabeledControl label='Parameter Name'>
                                        <Input
                                          value={condition.first}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              conditions: prev.conditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        first: e.target.value,
                                                      }
                                                    : item
                                              ),
                                            }))
                                          }
                                          placeholder='param name'
                                        />
                                      </LabeledControl>
                                    </div>
                                  ) : list ? (
                                    <LabeledControl label='Values'>
                                      <div className='space-y-2'>
                                        <div className='flex flex-wrap gap-2'>
                                          {listTokens.map(
                                            (token, tokenIndex) => (
                                              <div
                                                key={`${condition.id}-token-${tokenIndex}`}
                                                className='bg-muted flex items-center gap-1 rounded-full px-2 py-1 text-xs'
                                              >
                                                <span className='max-w-[180px] truncate'>
                                                  {token}
                                                </span>
                                                <button
                                                  type='button'
                                                  className='text-muted-foreground hover:text-foreground'
                                                  onClick={() =>
                                                    setDsl((prev) => ({
                                                      ...prev,
                                                      conditions:
                                                        prev.conditions.map(
                                                          (item) =>
                                                            item.id ===
                                                            condition.id
                                                              ? {
                                                                  ...item,
                                                                  first:
                                                                    encodeListTokens(
                                                                      listTokens.filter(
                                                                        (
                                                                          _,
                                                                          idx
                                                                        ) =>
                                                                          idx !==
                                                                          tokenIndex
                                                                      )
                                                                    ),
                                                                }
                                                              : item
                                                        ),
                                                    }))
                                                  }
                                                >
                                                  <X className='h-3 w-3' />
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                        <Input
                                          value={condition.first}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              conditions: prev.conditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        first: e.target.value,
                                                      }
                                                    : item
                                              ),
                                            }))
                                          }
                                          placeholder='Comma-separated values or JSON array'
                                        />
                                      </div>
                                    </LabeledControl>
                                  ) : mode === 'LITERAL' &&
                                    leftType &&
                                    BOOLEAN_TYPES.has(leftType) ? (
                                    <LabeledControl label='Value'>
                                      <Select
                                        value={condition.first || '__empty__'}
                                        onValueChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      first:
                                                        value === '__empty__'
                                                          ? ''
                                                          : value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder='Value' />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value='__empty__'>
                                            Select
                                          </SelectItem>
                                          <SelectItem value='true'>
                                            true
                                          </SelectItem>
                                          <SelectItem value='false'>
                                            false
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </LabeledControl>
                                  ) : (
                                    <LabeledControl label='Value'>
                                      <Input
                                        type={literalInputType}
                                        value={condition.first}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            conditions: prev.conditions.map(
                                              (item) =>
                                                item.id === condition.id
                                                  ? {
                                                      ...item,
                                                      first: e.target.value,
                                                    }
                                                  : item
                                            ),
                                          }))
                                        }
                                        placeholder='value'
                                      />
                                    </LabeledControl>
                                  )}
                                  {range ? (
                                    mode === 'FIELD' ? (
                                      <LabeledControl label='Second Right Field'>
                                        <SearchableSelectField
                                          value={condition.second}
                                          onChange={(value) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              conditions: prev.conditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        second: value,
                                                      }
                                                    : item
                                              ),
                                            }))
                                          }
                                          options={expressionOptions}
                                          placeholder='Second right field'
                                          searchPlaceholder='Search field...'
                                          allowClear
                                          getLabel={expressionLabel}
                                        />
                                      </LabeledControl>
                                    ) : (
                                      <LabeledControl
                                        label={
                                          mode === 'PARAM'
                                            ? 'Second Parameter'
                                            : 'Second Value'
                                        }
                                      >
                                        <Input
                                          type={
                                            mode === 'LITERAL'
                                              ? literalInputType
                                              : 'text'
                                          }
                                          value={condition.second}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              conditions: prev.conditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        second: e.target.value,
                                                      }
                                                    : item
                                              ),
                                            }))
                                          }
                                          placeholder={
                                            mode === 'PARAM'
                                              ? 'second param'
                                              : 'second value'
                                          }
                                        />
                                      </LabeledControl>
                                    )
                                  ) : null}
                                  {showValueSuggestions && suggestionSource ? (
                                    <div className='space-y-2 md:col-span-2'>
                                      <div className='flex flex-wrap items-center gap-2'>
                                        <Button
                                          type='button'
                                          size='sm'
                                          variant='outline'
                                          onClick={() =>
                                            setSuggestionRequest({
                                              table: suggestionSource.table,
                                              column: suggestionSource.column,
                                              scope: 'WHERE',
                                              conditionId: condition.id,
                                              q: condition.first.trim(),
                                            })
                                          }
                                        >
                                          Suggest Values
                                        </Button>
                                        <span className='text-muted-foreground text-[11px]'>
                                          {suggestionSource.table}.
                                          {suggestionSource.column}
                                        </span>
                                      </div>
                                      {isCurrentSuggestionRequest ? (
                                        dslSuggestionsQuery.isFetching ? (
                                          <p className='text-muted-foreground text-xs'>
                                            Loading suggestions...
                                          </p>
                                        ) : suggestionValues.length ? (
                                          <div className='flex flex-wrap gap-2'>
                                            {suggestionValues.map((value) => (
                                              <Button
                                                key={`${condition.id}-${value}`}
                                                type='button'
                                                size='sm'
                                                variant='secondary'
                                                className='h-7 max-w-[220px]'
                                                onClick={() =>
                                                  setDsl((prev) => ({
                                                    ...prev,
                                                    conditions:
                                                      prev.conditions.map(
                                                        (item) =>
                                                          item.id ===
                                                          condition.id
                                                            ? {
                                                                ...item,
                                                                first: list
                                                                  ? encodeListTokens(
                                                                      Array.from(
                                                                        new Set(
                                                                          [
                                                                            ...parseListTokens(
                                                                              item.first
                                                                            ),
                                                                            value,
                                                                          ]
                                                                        )
                                                                      )
                                                                    )
                                                                  : value,
                                                              }
                                                            : item
                                                      ),
                                                  }))
                                                }
                                              >
                                                <span className='truncate'>
                                                  {value}
                                                </span>
                                              </Button>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className='text-muted-foreground text-xs'>
                                            No suggestions available.
                                          </p>
                                        )
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.groupBy}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({ ...prev, groupBy: open }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.groupBy && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              {isGuided ? 'Advanced: Group By' : 'Group By'}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            setDsl((prev) => ({
                              ...prev,
                              groupBy: [...prev.groupBy, ''],
                            }))
                          }
                        >
                          <Plus className='mr-1 h-4 w-4' />
                          Add
                        </Button>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        {!dsl.groupBy.length ? (
                          <p className='text-muted-foreground text-xs'>
                            Optional. Add fields when using aggregates.
                          </p>
                        ) : null}
                        {dsl.groupBy.map((groupExpr, idx) => (
                          <div
                            key={`${idx}-${groupExpr}`}
                            className='grid gap-2 md:grid-cols-[1fr_auto]'
                          >
                            <LabeledControl label='Group Field'>
                              <SearchableSelectField
                                value={groupExpr}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    groupBy: prev.groupBy.map(
                                      (item, groupIdx) =>
                                        groupIdx === idx ? value : item
                                    ),
                                  }))
                                }
                                options={expressionOptions}
                                placeholder='Select group field'
                                searchPlaceholder='Search field...'
                                allowClear
                                getLabel={expressionLabel}
                              />
                            </LabeledControl>
                            <LabeledControl label='Action'>
                              <Button
                                size='icon'
                                variant='outline'
                                onClick={() =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    groupBy: prev.groupBy.filter(
                                      (_, groupIdx) => groupIdx !== idx
                                    ),
                                  }))
                                }
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </LabeledControl>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.having}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({ ...prev, having: open }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.having && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              {isGuided
                                ? 'Advanced: Group-level Conditions'
                                : 'Having Conditions'}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <div className='flex items-center gap-2'>
                          <Select
                            value={dsl.havingCombinator}
                            onValueChange={(value) =>
                              setDsl((prev) => ({
                                ...prev,
                                havingCombinator:
                                  value as DslState['havingCombinator'],
                              }))
                            }
                          >
                            <SelectTrigger className='w-24'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='AND'>AND</SelectItem>
                              <SelectItem value='OR'>OR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              setDsl((prev) => ({
                                ...prev,
                                havingConditions: [
                                  ...prev.havingConditions,
                                  defaultCondition(),
                                ],
                              }))
                            }
                          >
                            <Plus className='mr-1 h-4 w-4' />
                            Add
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        <div className='bg-muted/20 grid gap-2 rounded-md border p-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]'>
                          <LabeledControl label='Condition Preset'>
                            <Select
                              value={selectedHavingPresetId}
                              onValueChange={setSelectedHavingPresetId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select preset' />
                              </SelectTrigger>
                              <SelectContent>
                                {havingPresets.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    {preset.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </LabeledControl>
                          <LabeledControl label='Replace'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                applyConditionPresetForScope(
                                  'HAVING',
                                  'REPLACE'
                                )
                              }
                            >
                              Load
                            </Button>
                          </LabeledControl>
                          <LabeledControl label='Append'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                applyConditionPresetForScope('HAVING', 'APPEND')
                              }
                            >
                              Append
                            </Button>
                          </LabeledControl>
                          <LabeledControl label='Delete'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                deleteConditionPresetForScope('HAVING')
                              }
                            >
                              Delete
                            </Button>
                          </LabeledControl>
                          <LabeledControl
                            label='Save Current As'
                            className='md:col-span-3'
                          >
                            <Input
                              value={havingPresetNameInput}
                              onChange={(e) =>
                                setHavingPresetNameInput(e.target.value)
                              }
                              placeholder='e.g. suspicious_volume'
                            />
                          </LabeledControl>
                          <LabeledControl label='Action'>
                            <Button
                              type='button'
                              variant='outline'
                              className='w-full'
                              onClick={() =>
                                saveConditionPresetForScope('HAVING')
                              }
                            >
                              Save
                            </Button>
                          </LabeledControl>
                        </div>
                        {dsl.havingConditions.map((condition) => {
                          const noValue = NO_VALUE_OPS.has(condition.op)
                          const range = RANGE_OPS.has(condition.op)
                          const list = LIST_OPS.has(condition.op)
                          const isRaw = RAW_OPS.has(condition.op)
                          const isSubquery = SUBQUERY_OPS.has(condition.op)
                          const listTokens = parseListTokens(condition.first)
                          const mode = normalizeConditionMode(
                            condition.op,
                            condition.mode
                          )
                          const fieldModeAllowed = isFieldModeAllowed(
                            condition.op
                          )
                          const leftType = resolveExpressionDataType(
                            condition.left
                          )
                          const allowedOperators = getOperatorOptionsForType({
                            leftType,
                            isGuided,
                            safeSqlMode,
                          })
                          const operatorOptions = withCurrentOption(
                            allowedOperators,
                            condition.op
                          ) as DslOperator[]
                          const literalInputType =
                            leftType && NUMERIC_TYPES.has(leftType)
                              ? 'number'
                              : leftType &&
                                  (leftType === 'datetime' ||
                                    leftType === 'timestamp')
                                ? 'datetime-local'
                                : leftType && DATE_TYPES.has(leftType)
                                  ? 'date'
                                  : 'text'
                          const suggestionSource = resolveExpressionTableColumn(
                            condition.left
                          )
                          const showValueSuggestions =
                            mode === 'LITERAL' &&
                            !noValue &&
                            !range &&
                            !isRaw &&
                            !isSubquery &&
                            Boolean(suggestionSource)
                          const isCurrentSuggestionRequest =
                            suggestionRequest?.scope === 'HAVING' &&
                            suggestionRequest?.conditionId === condition.id
                          const suggestionValues = isCurrentSuggestionRequest
                            ? (dslSuggestionsQuery.data ?? [])
                            : []
                          return (
                            <div
                              key={condition.id}
                              className='space-y-2 rounded-md border p-2'
                            >
                              <div className='grid gap-2 md:grid-cols-[1fr_130px_140px_auto]'>
                                <LabeledControl label='Field'>
                                  {isRaw || isSubquery ? (
                                    <div className='text-muted-foreground rounded-md border px-3 py-2 text-xs'>
                                      Not required for {condition.op} operator.
                                    </div>
                                  ) : (
                                    <SearchableSelectField
                                      value={condition.left}
                                      onChange={(value) =>
                                        setDsl((prev) => ({
                                          ...prev,
                                          havingConditions:
                                            prev.havingConditions.map((item) =>
                                              item.id === condition.id
                                                ? {
                                                    ...item,
                                                    left: value,
                                                  }
                                                : item
                                            ),
                                        }))
                                      }
                                      options={expressionOptions}
                                      placeholder='Left field'
                                      searchPlaceholder='Search field...'
                                      allowClear
                                      getLabel={expressionLabel}
                                    />
                                  )}
                                </LabeledControl>
                                <LabeledControl label='Operator'>
                                  <Select
                                    value={condition.op}
                                    onValueChange={(value) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        havingConditions:
                                          prev.havingConditions.map((item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  op: value as DslOperator,
                                                  mode: normalizeConditionMode(
                                                    value as DslOperator,
                                                    item.mode
                                                  ),
                                                }
                                              : item
                                          ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operatorOptions.map((op) => (
                                        <SelectItem key={op} value={op}>
                                          {OP_LABELS[op]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </LabeledControl>
                                <LabeledControl label='Value Type'>
                                  <Select
                                    value={mode}
                                    onValueChange={(value) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        havingConditions:
                                          prev.havingConditions.map((item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  mode: value as DslCondition['mode'],
                                                }
                                              : item
                                          ),
                                      }))
                                    }
                                    disabled={noValue || isRaw || isSubquery}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='LITERAL'>
                                        {CONDITION_MODE_LABELS.LITERAL}
                                      </SelectItem>
                                      <SelectItem value='PARAM'>
                                        {CONDITION_MODE_LABELS.PARAM}
                                      </SelectItem>
                                      {fieldModeAllowed ? (
                                        <SelectItem value='FIELD'>
                                          {CONDITION_MODE_LABELS.FIELD}
                                        </SelectItem>
                                      ) : null}
                                    </SelectContent>
                                  </Select>
                                </LabeledControl>
                                <LabeledControl label='Action'>
                                  <Button
                                    size='icon'
                                    variant='outline'
                                    onClick={() =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        havingConditions:
                                          prev.havingConditions.length === 1
                                            ? [defaultCondition()]
                                            : prev.havingConditions.filter(
                                                (item) =>
                                                  item.id !== condition.id
                                              ),
                                      }))
                                    }
                                  >
                                    <X className='h-4 w-4' />
                                  </Button>
                                </LabeledControl>
                              </div>
                              {leftType ? (
                                <p className='text-muted-foreground text-[11px]'>
                                  Type: {leftType}
                                </p>
                              ) : null}
                              {isRaw ? (
                                <LabeledControl label='RAW SQL Expression'>
                                  <Textarea
                                    value={condition.rawExpr}
                                    onChange={(e) =>
                                      setDsl((prev) => ({
                                        ...prev,
                                        havingConditions:
                                          prev.havingConditions.map((item) =>
                                            item.id === condition.id
                                              ? {
                                                  ...item,
                                                  rawExpr: e.target.value,
                                                }
                                              : item
                                          ),
                                      }))
                                    }
                                    className='h-20 font-mono text-xs'
                                    placeholder='e.g. SUM(t.amount) > 100000'
                                  />
                                </LabeledControl>
                              ) : null}
                              {isSubquery ? (
                                <div className='space-y-2'>
                                  <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
                                    <LabeledControl label='Subquery Table'>
                                      <SearchableSelectField
                                        value={condition.subqueryTable}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryTable: value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        options={tableOptions}
                                        placeholder='Subquery table'
                                        searchPlaceholder='Search table...'
                                        allowClear
                                        getLabel={tableLabel}
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Subquery Alias'>
                                      <Input
                                        value={condition.subqueryAlias}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryAlias:
                                                          e.target.value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        placeholder='sq'
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Select Expression'>
                                      <Input
                                        value={condition.subquerySelectExpr}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subquerySelectExpr:
                                                          e.target.value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        placeholder='1'
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Outer Link Field'>
                                      <SearchableSelectField
                                        value={condition.subqueryLinkLeft}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryLinkLeft: value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        options={expressionOptions}
                                        placeholder='Outer field'
                                        searchPlaceholder='Search field...'
                                        allowClear
                                        getLabel={expressionLabel}
                                      />
                                    </LabeledControl>
                                    <LabeledControl label='Inner Link Field'>
                                      <Input
                                        value={condition.subqueryLinkRight}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryLinkRight:
                                                          e.target.value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        placeholder='sq.account_no'
                                      />
                                    </LabeledControl>
                                    {!isGuided ? (
                                      <LabeledControl label='Extra RAW Filter (optional)'>
                                        <Input
                                          value={condition.subqueryExtraRaw}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              havingConditions:
                                                prev.havingConditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          subqueryExtraRaw:
                                                            e.target.value,
                                                        }
                                                      : item
                                                ),
                                            }))
                                          }
                                          placeholder="sq.status = 'ACTIVE'"
                                        />
                                      </LabeledControl>
                                    ) : null}
                                  </div>
                                  {!isGuided ||
                                  condition.subqueryJson.trim() ? (
                                    <LabeledControl
                                      label={`${condition.op} Subquery JSON Override (optional)`}
                                    >
                                      <Textarea
                                        value={condition.subqueryJson}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        subqueryJson:
                                                          e.target.value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        className='h-24 font-mono text-xs'
                                        placeholder='Optional raw subquery JSON override'
                                      />
                                    </LabeledControl>
                                  ) : null}
                                </div>
                              ) : null}
                              {!noValue && !isRaw && !isSubquery ? (
                                <div className='grid gap-2 md:grid-cols-2'>
                                  {mode === 'FIELD' ? (
                                    <LabeledControl label='Right Field'>
                                      <SearchableSelectField
                                        value={condition.first}
                                        onChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        first: value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        options={expressionOptions}
                                        placeholder='Right field'
                                        searchPlaceholder='Search field...'
                                        allowClear
                                        getLabel={expressionLabel}
                                      />
                                    </LabeledControl>
                                  ) : mode === 'PARAM' ? (
                                    <div className='space-y-2'>
                                      {suggestedParamKeys.length ? (
                                        <LabeledControl label='Pick Parameter Key'>
                                          <Select
                                            value='__pick__'
                                            onValueChange={(value) => {
                                              if (value === '__pick__') return
                                              setDsl((prev) => ({
                                                ...prev,
                                                havingConditions:
                                                  prev.havingConditions.map(
                                                    (item) =>
                                                      item.id === condition.id
                                                        ? {
                                                            ...item,
                                                            first: value,
                                                          }
                                                        : item
                                                  ),
                                              }))
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder='Pick from Params JSON' />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value='__pick__'>
                                                Pick parameter
                                              </SelectItem>
                                              {suggestedParamKeys.map((key) => (
                                                <SelectItem
                                                  key={key}
                                                  value={key}
                                                >
                                                  {key}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </LabeledControl>
                                      ) : null}
                                      <LabeledControl label='Parameter Name'>
                                        <Input
                                          value={condition.first}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              havingConditions:
                                                prev.havingConditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          first: e.target.value,
                                                        }
                                                      : item
                                                ),
                                            }))
                                          }
                                          placeholder='param name'
                                        />
                                      </LabeledControl>
                                    </div>
                                  ) : list ? (
                                    <LabeledControl label='Values'>
                                      <div className='space-y-2'>
                                        <div className='flex flex-wrap gap-2'>
                                          {listTokens.map(
                                            (token, tokenIndex) => (
                                              <div
                                                key={`${condition.id}-token-${tokenIndex}`}
                                                className='bg-muted flex items-center gap-1 rounded-full px-2 py-1 text-xs'
                                              >
                                                <span className='max-w-[180px] truncate'>
                                                  {token}
                                                </span>
                                                <button
                                                  type='button'
                                                  className='text-muted-foreground hover:text-foreground'
                                                  onClick={() =>
                                                    setDsl((prev) => ({
                                                      ...prev,
                                                      havingConditions:
                                                        prev.havingConditions.map(
                                                          (item) =>
                                                            item.id ===
                                                            condition.id
                                                              ? {
                                                                  ...item,
                                                                  first:
                                                                    encodeListTokens(
                                                                      listTokens.filter(
                                                                        (
                                                                          _,
                                                                          idx
                                                                        ) =>
                                                                          idx !==
                                                                          tokenIndex
                                                                      )
                                                                    ),
                                                                }
                                                              : item
                                                        ),
                                                    }))
                                                  }
                                                >
                                                  <X className='h-3 w-3' />
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                        <Input
                                          value={condition.first}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              havingConditions:
                                                prev.havingConditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          first: e.target.value,
                                                        }
                                                      : item
                                                ),
                                            }))
                                          }
                                          placeholder='Comma-separated values or JSON array'
                                        />
                                      </div>
                                    </LabeledControl>
                                  ) : mode === 'LITERAL' &&
                                    leftType &&
                                    BOOLEAN_TYPES.has(leftType) ? (
                                    <LabeledControl label='Value'>
                                      <Select
                                        value={condition.first || '__empty__'}
                                        onValueChange={(value) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        first:
                                                          value === '__empty__'
                                                            ? ''
                                                            : value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder='Value' />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value='__empty__'>
                                            Select
                                          </SelectItem>
                                          <SelectItem value='true'>
                                            true
                                          </SelectItem>
                                          <SelectItem value='false'>
                                            false
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </LabeledControl>
                                  ) : (
                                    <LabeledControl label='Value'>
                                      <Input
                                        type={literalInputType}
                                        value={condition.first}
                                        onChange={(e) =>
                                          setDsl((prev) => ({
                                            ...prev,
                                            havingConditions:
                                              prev.havingConditions.map(
                                                (item) =>
                                                  item.id === condition.id
                                                    ? {
                                                        ...item,
                                                        first: e.target.value,
                                                      }
                                                    : item
                                              ),
                                          }))
                                        }
                                        placeholder='value'
                                      />
                                    </LabeledControl>
                                  )}
                                  {range ? (
                                    mode === 'FIELD' ? (
                                      <LabeledControl label='Second Right Field'>
                                        <SearchableSelectField
                                          value={condition.second}
                                          onChange={(value) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              havingConditions:
                                                prev.havingConditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          second: value,
                                                        }
                                                      : item
                                                ),
                                            }))
                                          }
                                          options={expressionOptions}
                                          placeholder='Second right field'
                                          searchPlaceholder='Search field...'
                                          allowClear
                                          getLabel={expressionLabel}
                                        />
                                      </LabeledControl>
                                    ) : (
                                      <LabeledControl
                                        label={
                                          mode === 'PARAM'
                                            ? 'Second Parameter'
                                            : 'Second Value'
                                        }
                                      >
                                        <Input
                                          type={
                                            mode === 'LITERAL'
                                              ? literalInputType
                                              : 'text'
                                          }
                                          value={condition.second}
                                          onChange={(e) =>
                                            setDsl((prev) => ({
                                              ...prev,
                                              havingConditions:
                                                prev.havingConditions.map(
                                                  (item) =>
                                                    item.id === condition.id
                                                      ? {
                                                          ...item,
                                                          second:
                                                            e.target.value,
                                                        }
                                                      : item
                                                ),
                                            }))
                                          }
                                          placeholder={
                                            mode === 'PARAM'
                                              ? 'second param'
                                              : 'second value'
                                          }
                                        />
                                      </LabeledControl>
                                    )
                                  ) : null}
                                  {showValueSuggestions && suggestionSource ? (
                                    <div className='space-y-2 md:col-span-2'>
                                      <div className='flex flex-wrap items-center gap-2'>
                                        <Button
                                          type='button'
                                          size='sm'
                                          variant='outline'
                                          onClick={() =>
                                            setSuggestionRequest({
                                              table: suggestionSource.table,
                                              column: suggestionSource.column,
                                              scope: 'HAVING',
                                              conditionId: condition.id,
                                              q: condition.first.trim(),
                                            })
                                          }
                                        >
                                          Suggest Values
                                        </Button>
                                        <span className='text-muted-foreground text-[11px]'>
                                          {suggestionSource.table}.
                                          {suggestionSource.column}
                                        </span>
                                      </div>
                                      {isCurrentSuggestionRequest ? (
                                        dslSuggestionsQuery.isFetching ? (
                                          <p className='text-muted-foreground text-xs'>
                                            Loading suggestions...
                                          </p>
                                        ) : suggestionValues.length ? (
                                          <div className='flex flex-wrap gap-2'>
                                            {suggestionValues.map((value) => (
                                              <Button
                                                key={`${condition.id}-${value}`}
                                                type='button'
                                                size='sm'
                                                variant='secondary'
                                                className='h-7 max-w-[220px]'
                                                onClick={() =>
                                                  setDsl((prev) => ({
                                                    ...prev,
                                                    havingConditions:
                                                      prev.havingConditions.map(
                                                        (item) =>
                                                          item.id ===
                                                          condition.id
                                                            ? {
                                                                ...item,
                                                                first: list
                                                                  ? encodeListTokens(
                                                                      Array.from(
                                                                        new Set(
                                                                          [
                                                                            ...parseListTokens(
                                                                              item.first
                                                                            ),
                                                                            value,
                                                                          ]
                                                                        )
                                                                      )
                                                                    )
                                                                  : value,
                                                              }
                                                            : item
                                                      ),
                                                  }))
                                                }
                                              >
                                                <span className='truncate'>
                                                  {value}
                                                </span>
                                              </Button>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className='text-muted-foreground text-xs'>
                                            No suggestions available.
                                          </p>
                                        )
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Collapsible
                    open={dslSectionsOpen.orderLimit}
                    onOpenChange={(open) =>
                      setDslSectionsOpen((prev) => ({
                        ...prev,
                        orderLimit: open,
                      }))
                    }
                    className='rounded-md border'
                  >
                    <div className='space-y-2 p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <CollapsibleTrigger asChild>
                          <Button variant='ghost' className='-ml-2 h-8 px-2'>
                            <ChevronRight
                              className={cn(
                                'mr-1 h-4 w-4 transition-transform',
                                dslSectionsOpen.orderLimit && 'rotate-90'
                              )}
                            />
                            <Label className='cursor-pointer'>
                              {isGuided
                                ? 'Advanced: Sort + Limit'
                                : 'Order + Limit'}
                            </Label>
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            setDsl((prev) => ({
                              ...prev,
                              orderBy: [...prev.orderBy, defaultOrderBy()],
                            }))
                          }
                        >
                          <Plus className='mr-1 h-4 w-4' />
                          Add Order
                        </Button>
                      </div>
                      <CollapsibleContent className='space-y-2 pt-2'>
                        {dsl.orderBy.map((order) => (
                          <div
                            key={order.id}
                            className='grid gap-2 md:grid-cols-[1fr_120px_auto]'
                          >
                            <LabeledControl label='Order By Field'>
                              <SearchableSelectField
                                value={order.expr}
                                onChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    orderBy: prev.orderBy.map((item) =>
                                      item.id === order.id
                                        ? { ...item, expr: value }
                                        : item
                                    ),
                                  }))
                                }
                                options={expressionOptions}
                                placeholder='Order by field'
                                searchPlaceholder='Search field...'
                                allowClear
                                getLabel={expressionLabel}
                              />
                            </LabeledControl>
                            <LabeledControl label='Direction'>
                              <Select
                                value={order.direction}
                                onValueChange={(value) =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    orderBy: prev.orderBy.map((item) =>
                                      item.id === order.id
                                        ? {
                                            ...item,
                                            direction:
                                              value as DslOrderBy['direction'],
                                          }
                                        : item
                                    ),
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='ASC'>ASC</SelectItem>
                                  <SelectItem value='DESC'>DESC</SelectItem>
                                </SelectContent>
                              </Select>
                            </LabeledControl>
                            <LabeledControl label='Action'>
                              <Button
                                size='icon'
                                variant='outline'
                                onClick={() =>
                                  setDsl((prev) => ({
                                    ...prev,
                                    orderBy: prev.orderBy.filter(
                                      (item) => item.id !== order.id
                                    ),
                                  }))
                                }
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </LabeledControl>
                          </div>
                        ))}
                        <LabeledControl label='Limit (optional)'>
                          <Input
                            type='number'
                            min={1}
                            value={dsl.limit}
                            onChange={(e) =>
                              setDsl((prev) => ({
                                ...prev,
                                limit: e.target.value,
                              }))
                            }
                            placeholder='Limit (optional)'
                          />
                        </LabeledControl>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </>
              ) : (
                <div className='bg-muted/10 rounded-md border p-4 text-sm'>
                  <p className='font-medium'>No SQL DSL required</p>
                  <p className='text-muted-foreground mt-1'>
                    This version type runs through{' '}
                    {versionRuleType === 'ADAPTER'
                      ? 'a published adapter configuration.'
                      : versionRuleType === 'QUESTION'
                        ? 'question-response matching logic.'
                        : 'a registered backend plugin.'}
                  </p>
                </div>
              )}
            </div>

            <div className='space-y-3 overflow-y-auto'>
              <div className='bg-muted/20 rounded-md border p-3'>
                {isSqlRuleType ? (
                  <div className='grid gap-2 text-xs sm:grid-cols-2'>
                    <div className='bg-background rounded-md border px-3 py-2'>
                      <p className='text-muted-foreground'>Tables</p>
                      <p className='font-medium'>{tableOptions.length}</p>
                    </div>
                    <div className='bg-background rounded-md border px-3 py-2'>
                      <p className='text-muted-foreground'>
                        {isGuided ? 'Related Data Links' : 'Joins'}
                      </p>
                      <p className='font-medium'>{dsl.joins.length}</p>
                    </div>
                    <div className='bg-background rounded-md border px-3 py-2'>
                      <p className='text-muted-foreground'>
                        {isGuided ? 'Rule Conditions' : 'Where Conditions'}
                      </p>
                      <p className='font-medium'>
                        {dsl.conditions.filter(isConditionConfigured).length}
                      </p>
                    </div>
                    <div className='bg-background rounded-md border px-3 py-2'>
                      <p className='text-muted-foreground'>
                        {isGuided ? 'Advanced Conditions' : 'Having Conditions'}
                      </p>
                      <p className='font-medium'>
                        {
                          dsl.havingConditions.filter(isConditionConfigured)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2 text-xs'>
                    <div className='bg-background rounded-md border px-3 py-2'>
                      <p className='text-muted-foreground'>Type</p>
                      <p className='font-medium'>{versionRuleType}</p>
                    </div>
                    {versionRuleType === 'ADAPTER' ? (
                      <div className='bg-background rounded-md border px-3 py-2'>
                        <p className='text-muted-foreground'>Adapter</p>
                        <p className='font-medium'>
                          {selectedAdapter?.adapterKey ?? 'Not selected'}
                        </p>
                      </div>
                    ) : versionRuleType === 'QUESTION' ? (
                      <div className='bg-background rounded-md border px-3 py-2'>
                        <p className='text-muted-foreground'>Question Match</p>
                        <p className='font-medium'>
                          {versionQuestionMode ===
                          'MULTIPLE_CRITICAL_STOCK_AUDIT'
                            ? 'Stock Audit Multiple Critical'
                            : `${versionQuestionSource} • Q${versionQuestionNo || `-`}`}
                        </p>
                      </div>
                    ) : (
                      <div className='bg-background rounded-md border px-3 py-2'>
                        <p className='text-muted-foreground'>Plugin</p>
                        <p className='font-medium'>
                          {versionPluginKey || 'Not selected'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className='bg-background space-y-2 rounded-md border p-3 xl:sticky xl:top-0'>
                {isSqlRuleType ? (
                  <>
                    <div className='flex items-center justify-between'>
                      <Label>
                        {isGuided ? 'Validate + Preview' : 'Compile + Preview'}
                      </Label>
                      <div className='flex items-center gap-2'>
                        {isGuided ? (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setShowSqlInternals((prev) => !prev)}
                          >
                            {showSqlInternals
                              ? 'Hide SQL Internals'
                              : 'Show SQL Internals'}
                          </Button>
                        ) : null}
                        <Button
                          variant='outline'
                          disabled={
                            compileDslMutation.isPending ||
                            blockingDslIssues.length > 0
                          }
                          onClick={() => compileDslMutation.mutate()}
                        >
                          <Sparkles className='mr-2 h-4 w-4' />
                          {isGuided ? 'Validate Rule' : 'Compile DSL'}
                        </Button>
                      </div>
                    </div>
                    <div className='space-y-2 rounded-md border p-2'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-sm font-medium'>Semantic Checks</p>
                        <div className='flex items-center gap-2 text-xs'>
                          <Badge variant='destructive'>
                            Errors: {blockingDslIssues.length}
                          </Badge>
                          <Badge variant='secondary'>
                            Warnings:{' '}
                            {
                              dslDiagnostics.filter(
                                (item) => item.level === 'warning'
                              ).length
                            }
                          </Badge>
                        </div>
                      </div>
                      {!dslDiagnostics.length ? (
                        <p className='text-muted-foreground text-xs'>
                          No semantic issues detected.
                        </p>
                      ) : (
                        <ScrollArea className='h-28 rounded-md border p-2'>
                          <div className='space-y-1'>
                            {dslDiagnostics.map((issue, idx) => (
                              <p
                                key={`dsl-issue-${idx}`}
                                className={cn(
                                  'text-xs',
                                  issue.level === 'error'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                                )}
                              >
                                [{issue.level.toUpperCase()}] {issue.message}
                              </p>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      {safeSqlMode ? (
                        <p className='text-muted-foreground text-[11px]'>
                          Safe mode blocks RAW SQL operators and raw SQL
                          override.
                        </p>
                      ) : null}
                      {rawPredicateCount > 0 ? (
                        <p className='text-[11px] text-amber-600'>
                          RAW usage detected ({rawPredicateCount}). Prefer
                          structured operators for portable, guardrail-friendly
                          rules.
                        </p>
                      ) : null}
                    </div>
                    {isGuided && !showSqlInternals ? (
                      <div className='text-muted-foreground bg-muted/10 rounded-md border p-3 text-sm'>
                        SQL and JSON internals are hidden in guided mode. Use
                        “Show SQL Internals” if you want to inspect technical
                        details.
                      </div>
                    ) : (
                      <>
                        <Textarea
                          readOnly
                          value={compiledSql}
                          className='h-36 font-mono text-xs'
                          placeholder='Compiled SQL preview'
                        />
                        <Label className='text-muted-foreground text-xs'>
                          Raw SQL Override (optional)
                        </Label>
                        <Textarea
                          value={versionSql}
                          onChange={(e) => setVersionSql(e.target.value)}
                          className='h-36 font-mono text-xs'
                          placeholder='Optional raw SQL override'
                        />
                        <Label className='text-muted-foreground text-xs'>
                          DSL JSON Preview
                        </Label>
                        <Textarea
                          readOnly
                          value={pretty(dslJsonPreview)}
                          className='h-56 font-mono text-xs'
                        />
                      </>
                    )}
                  </>
                ) : (
                  <div className='space-y-2 text-sm'>
                    <p className='font-medium'>Execution Summary</p>
                    {versionRuleType === 'ADAPTER' ? (
                      <p className='text-muted-foreground'>
                        Rule will execute via adapter{' '}
                        <b>{selectedAdapter?.adapterKey ?? 'N/A'}</b> and read
                        rows from adapter mapping.
                      </p>
                    ) : versionRuleType === 'QUESTION' ? (
                      <p className='text-muted-foreground'>
                        Rule will execute question matching on{' '}
                        <b>
                          {versionQuestionMode ===
                          'MULTIPLE_CRITICAL_STOCK_AUDIT'
                            ? 'Stock Audit (multiple critical issues)'
                            : versionQuestionSource}
                        </b>
                        {versionQuestionMode === 'STANDARD' ? (
                          <>
                            {' '}
                            for question <b>{versionQuestionNo || 'N/A'}</b>.
                          </>
                        ) : (
                          '.'
                        )}
                      </p>
                    ) : (
                      <p className='text-muted-foreground'>
                        Rule will execute via plugin{' '}
                        <b>{versionPluginKey || 'N/A'}</b> with plugin config.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </fieldset>
        <div className='flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end'>
          <Button
            variant='outline'
            onClick={() => {
              if (createVersionStandalone) {
                closeCreateVersionPage()
                return
              }
              setCreateVersionOpen(false)
            }}
          >
            Cancel
          </Button>
          {isWorkspaceReadOnly ? (
            <span className='text-muted-foreground self-center text-xs'>
              Read-only mode: saving is disabled.
            </span>
          ) : (
            <Button
              disabled={
                saveVersionMutation.isPending ||
                (isSqlRuleType && blockingDslIssues.length > 0)
              }
              onClick={() => saveVersionMutation.mutate()}
            >
              {versionEditorMode === 'edit' ? 'Save Changes' : 'Create Version'}
            </Button>
          )}
        </div>
      </CreateVersionContainer>
      <Dialog
        open={hitsDialogOpen}
        onOpenChange={(open) => {
          setHitsDialogOpen(open)
          if (!open) {
            setSelectedRunId(null)
            setSelectedHit(null)
            setEvidenceDialogOpen(false)
          }
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Run Hits</DialogTitle>
            <DialogDescription>
              Run #{selectedRunId ?? '-'} • showing up to 500 hits.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            {runHitsQuery.isFetching ? (
              <p className='text-sm'>Loading hits...</p>
            ) : null}
            {!runHitsQuery.isFetching && !(runHitsQuery.data ?? []).length ? (
              <p className='text-muted-foreground text-sm'>
                No hits found for this run.
              </p>
            ) : null}
            {(runHitsQuery.data ?? []).map((hit) => (
              <div key={hit.id} className='rounded-md border p-2 text-xs'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 space-y-1'>
                    <p className='font-medium'>
                      {hit.accountNo || '-'}{' '}
                      <span className='text-muted-foreground'>
                        {hit.customerName ? `• ${hit.customerName}` : ``}
                      </span>
                    </p>
                    <p className='text-muted-foreground'>
                      Branch: {hit.branchCode || '-'} • Alert Date:{' '}
                      {asDate(hit.alertDate)} • Severity:{' '}
                      {hit.severityKey || '-'} • Alert ID:{' '}
                      {hit.ewsAlertId ?? '-'}
                    </p>
                    <p className='line-clamp-3 whitespace-pre-wrap'>
                      {hit.reason || '-'}
                    </p>
                    <p className='text-muted-foreground'>
                      Value: {hit.alertValue ?? '-'} • Threshold:{' '}
                      {hit.thresholdValue ?? '-'}
                    </p>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setSelectedHit(hit)
                      setEvidenceDialogOpen(true)
                    }}
                  >
                    Evidence
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setHitsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={evidenceDialogOpen}
        onOpenChange={(open) => {
          setEvidenceDialogOpen(open)
          if (!open) {
            setSelectedHit(null)
          }
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Hit Evidence</DialogTitle>
            <DialogDescription>
              Hit #{selectedHit?.id ?? '-'} • Account{' '}
              {selectedHit?.accountNo ?? '-'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            {evidenceQuery.isFetching ? (
              <p className='text-sm'>Loading evidence...</p>
            ) : null}
            {!evidenceQuery.isFetching && !(evidenceQuery.data ?? []).length ? (
              <p className='text-muted-foreground text-sm'>
                No evidence found.
              </p>
            ) : null}
            {(evidenceQuery.data ?? []).map((evidence) => (
              <div
                key={evidence.id}
                className='space-y-2 rounded-md border p-2 text-xs'
              >
                <div className='text-muted-foreground flex flex-wrap gap-3'>
                  <span>ID: {evidence.id}</span>
                  <span>Txn IDs: {evidence.evTxnIds || '-'}</span>
                  <span>First TS: {evidence.evFirstTs || '-'}</span>
                  <span>Last TS: {evidence.evLastTs || '-'}</span>
                </div>
                <Textarea
                  readOnly
                  value={formatJson(evidence.snapshot)}
                  className='h-44 font-mono text-[11px]'
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEvidenceDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RouteComponent() {
  return <Outlet />
}

export function RuleWorkspacePage() {
  return <RuleWorkspace />
}

export function RuleWorkspaceCreateVersionPage({
  editVersionNo = null,
  readOnly = false,
}: {
  editVersionNo?: number | null
  readOnly?: boolean
}) {
  return (
    <RuleWorkspace
      createVersionStandalone
      editVersionNo={editVersionNo}
      readOnly={readOnly}
    />
  )
}
