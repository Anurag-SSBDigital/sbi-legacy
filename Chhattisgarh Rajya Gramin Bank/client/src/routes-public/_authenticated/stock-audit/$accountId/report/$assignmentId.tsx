/* eslint-disable @typescript-eslint/no-explicit-any */
// oxlint-disable no-explicit-any
import { JSX, useEffect, useMemo } from 'react'
import { z } from 'zod'
import {
  useForm,
  Controller,
  useFieldArray,
  useFormContext,
  type Control,
  type FieldArrayPath,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import MainWrapper from '@/components/ui/main-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

/**
 * ============================================================
 * STRICT NUMERIC VALIDATION (ZOD-ONLY)
 * - Accept: number or numeric string
 * - Empty string => undefined (keeps your defaultValues "" working)
 * - Reject: scientific notation, negatives, invalid formats
 * - Enforce: non-negative + max 2 decimals
 * ============================================================
 */

const DECIMAL_2_RE = /^\d+(\.\d{1,2})?$/
const INT_RE = /^\d+$/

const hasMax2Decimals = (n: number) => {
  const scaled = n * 100
  return Math.abs(scaled - Math.round(scaled)) < 1e-9
}

const preprocessDecimal2 = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return undefined
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '') return undefined
    if (!DECIMAL_2_RE.test(s)) return NaN
    return Number(s)
  }
  return NaN
}

const preprocessInt = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return undefined
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '') return undefined
    if (!INT_RE.test(s)) return NaN
    return Number(s)
  }
  return NaN
}

// Keep OPTIONAL everywhere because your defaultValues are "".
const numberSchema = z
  .preprocess(
    preprocessDecimal2,
    z
      .number()
      .refine((n) => Number.isFinite(n), { message: 'Must be a valid number' })
      .min(0, 'Must be non-negative')
      .refine(hasMax2Decimals, { message: 'Max 2 decimal places allowed' })
  )
  .optional()

const intSchema = z
  .preprocess(
    preprocessInt,
    z
      .number()
      .refine((n) => Number.isFinite(n), { message: 'Must be a valid integer' })
      .int('Must be an integer')
      .min(0, 'Must be non-negative')
  )
  .optional()

const yesNoNaSchema = z.enum(['YES', 'NO', 'NA']).optional()

/**
 * ============================================================
 * TABLE ROW SCHEMAS (NO FIELD NAMES CHANGED)
 * ============================================================
 */

const execCreditFacilitiesRowSchema = z.object({
  natureOfLimit: z.string().optional(),
  limitTGB: numberSchema,
  limitOthers: numberSchema,
  outstandingTGB: numberSchema,
  outstandingOthers: numberSchema,
})

const externalFacilitiesRowSchema = z.object({
  natureOfLimit: z.string().optional(),
  lenderName: z.string().optional(),
  outstanding: numberSchema,
  overdue: numberSchema,
})

const insuranceSummaryRowSchema = z.object({
  srNo: intSchema,
  particular: z.string().optional(),
  natureOfSecurity: z.string().optional(),
  assetsSecured: z.string().optional(),
  sumAssured: numberSchema,
  dueDate: z.string().optional(), // kept string to avoid changing date behavior
})

const rocChargesRowSchema = z.object({
  natureOfCharge: z.string().optional(),
  lender: z.string().optional(),
  amount: numberSchema,
  rocChargeId: z.string().optional(),
})

const mandatoryBooksRowSchema = z.object({
  name: z.string().optional(),
  applicability: z.string().optional(),
  status: z.string().optional(),
})

const statutoryDuesRowSchema = z.object({
  natureOfDue: z.string().optional(),
  amountOutstanding: numberSchema,
  paymentStatus: z.string().optional(),
})

const sraTeamMembersRowSchema = z.object({
  name: z.string().optional(),
  qualification: z.string().optional(),
  membershipNo: z.string().optional(),
  role: z.string().optional(),
})

const inventoryOverviewRowSchema = z.object({
  category: z.string().optional(),
  amountCurrent: numberSchema,
  daysCurrent: intSchema,
  amountPrev1: numberSchema,
  daysPrev1: intSchema,
  amountPrev2: numberSchema,
  daysPrev2: intSchema,
})

const inventoryLocationStocksRowSchema = z.object({
  location: z.string().optional(),
  rmAsPerSs: numberSchema,
  rmAsPerAssessment: numberSchema,
  wipAsPerSs: numberSchema,
  wipAsPerAssessment: numberSchema,
  fgAsPerSs: numberSchema,
  fgAsPerAssessment: numberSchema,
  storesAsPerSs: numberSchema,
  storesAsPerAssessment: numberSchema,
})

const receivablesOverviewRowSchema = z.object({
  category: z.string().optional(),
  amount: numberSchema,
  noOfAccounts: intSchema,
  avgRealisationPeriod: intSchema,
})

const receivablesFromAssociatesRowSchema = z.object({
  partyName: z.string().optional(),
  relationship: z.string().optional(),
  amount: numberSchema,
  ageing: z.string().optional(),
})

const receivablesAgeingSummaryRowSchema = z.object({
  partyName: z.string().optional(),
  totalOutstanding: numberSchema,
  bucketUpto90: numberSchema,
  bucket90to180: numberSchema,
  bucket180to365: numberSchema,
  bucketAbove365: numberSchema,
  disputed: z.string().optional(),
})

const verifiedDebtorsRowSchema = z.object({
  partyName: z.string().optional(),
  amount: numberSchema,
  modeOfVerification: z.string().optional(),
  remarks: z.string().optional(),
})

const verifiedCreditorsRowSchema = z.object({
  partyName: z.string().optional(),
  amount: numberSchema,
  modeOfVerification: z.string().optional(),
  remarks: z.string().optional(),
})

const relatedPartyReceivableAgeingRowSchema = z.object({
  partyName: z.string().optional(),
  relationship: z.string().optional(),
  totalOutstanding: numberSchema,
  bucketUpto90: numberSchema,
  bucket90to180: numberSchema,
  bucket180to365: numberSchema,
  bucketAbove365: numberSchema,
})

const gstReturnRowsRowSchema = z.object({
  returnType: z.string().optional(),
  filedUpto: z.string().optional(),
  status: z.string().optional(),
  remarks: z.string().optional(),
})

/**
 * ============================================================
 * MAIN FORM SCHEMA (FIELDS UNCHANGED; ONLY STRICTER VALIDATION)
 * Note: Kept .passthrough() exactly as in your original code.
 * ============================================================
 */
export const stockAuditSchema = z
  .object({
    borrowerName: z.string().min(1, 'Borrower name is required'),
    referenceDateForSra: z.string().optional(),
    registeredOfficeAddress: z.string().optional(),
    corporateOfficeAddress: z.string().optional(),
    unitAddresses: z.string().optional(),
    natureOfActivity: z.string().optional(),
    bankingArrangement: z.string().optional(),
    borrowerProfileNote: z.string().optional(),

    execCreditFacilities: z.array(execCreditFacilitiesRowSchema).optional(),

    totalFundBasedLimit: numberSchema,
    totalNonFundBasedLimit: numberSchema,
    totalExposure: numberSchema,

    externalFacilities: z.array(externalFacilitiesRowSchema).optional(),

    physicalVerificationDate: z.string().optional(),
    drawingPowerAsPerAnnexureA: numberSchema,
    physicalVerificationRemarks: z.string().optional(),

    domesticReceivablesAsPerStock: numberSchema,
    domesticReceivablesAsPerAssessment: numberSchema,
    dpAgainstReceivables: numberSchema,
    receivablesVariationReasons: z.string().optional(),

    cfSalesTurnoverBooks: numberSchema,
    cfSalesTurnoverGstr1: numberSchema,
    cfAmountRealisedFromCustomers: numberSchema,
    cfTotalCreditSummations: numberSchema,
    cfOpeningDebtors: numberSchema,
    cfSalesDuringPeriod: numberSchema,
    cfClosingDebtors: numberSchema,
    cfCashRealisationComputed: numberSchema,
    cfComments: z.string().optional(),

    insuranceSummary: z.array(insuranceSummaryRowSchema).optional(),
    insuranceCoverAsPerSanction: yesNoNaSchema,
    insuranceDeviationDetails: z.string().optional(),

    rocCharges: z.array(rocChargesRowSchema).optional(),
    mandatoryBooks: z.array(mandatoryBooksRowSchema).optional(),
    booksOfAccountComments: z.string().optional(),
    returnsComments: z.string().optional(),

    statutoryDues: z.array(statutoryDuesRowSchema).optional(),
    statutoryDuesComments: z.string().optional(),

    sraTeamMembers: z.array(sraTeamMembersRowSchema).optional(),
    sraCommencementDate: z.string().optional(),
    sraCompletionDate: z.string().optional(),
    sraVisitDates: z.string().optional(),

    invMarketValueDate: z.string().optional(),
    invMarketValueAmount: numberSchema,
    inventoryOverview: z.array(inventoryOverviewRowSchema).optional(),
    inventoryLocationStocks: z
      .array(inventoryLocationStocksRowSchema)
      .optional(),

    inventoryVariationComments: z.string().optional(),
    inventoryValuationComments: z.string().optional(),
    inventoryJobWorkDetails: z.string().optional(),
    inventoryThirdPartyStockDetails: z.string().optional(),
    inventoryControlQualityComments: z.string().optional(),
    inventoryControlMisComments: z.string().optional(),

    dpStockEligible: numberSchema,
    dpStockMargin: numberSchema,
    dpStockAvailable: numberSchema,

    // Unknown row shapes (not shown in your provided code) - kept as-is to avoid breaking existing functionality
    creditorsAgeingSummary: z.array(z.any()).optional(),
    creditorsComments: z.string().optional(),

    receivablesOverview: z.array(receivablesOverviewRowSchema).optional(),
    receivablesFromAssociates: z
      .array(receivablesFromAssociatesRowSchema)
      .optional(),
    receivablesAgeingSummary: z
      .array(receivablesAgeingSummaryRowSchema)
      .optional(),

    receivablesVariationReasonsDetailed: z.string().optional(),
    disputedReceivablesDetails: z.string().optional(),
    provisionRequiredDetails: z.string().optional(),
    receivableAuditTrailComments: z.string().optional(),

    verifiedDebtors: z.array(verifiedDebtorsRowSchema).optional(),
    verifiedCreditors: z.array(verifiedCreditorsRowSchema).optional(),
    relatedPartyReceivableAgeing: z
      .array(relatedPartyReceivableAgeingRowSchema)
      .optional(),

    cashFlowVerificationComments: z.string().optional(),
    rocComplianceComments: z.string().optional(),
    miscEmployeeRelationComments: z.string().optional(),
    miscPowerAvailabilityComments: z.string().optional(),

    miscNoticesReceived: yesNoNaSchema,
    miscNoticesDetails: z.string().optional(),

    miscOtherBankAccounts: yesNoNaSchema,
    miscOtherBankAccountsDetails: z.string().optional(),

    miscDiversionOfFunds: yesNoNaSchema,
    miscDiversionOfFundsDetails: z.string().optional(),

    miscSalesRoutingThroughLenders: yesNoNaSchema,
    miscSalesRoutingDetails: z.string().optional(),

    miscHypothecationBoardDisplayed: yesNoNaSchema,
    miscJobWorkStockSeparatelyStored: yesNoNaSchema,
    miscJobWorkStockDetails: z.string().optional(),

    miscLevelOfActivityComments: z.string().optional(),
    miscSpecialEventsComments: z.string().optional(),

    miscConstraintsDuringSra: yesNoNaSchema,
    miscConstraintsDetails: z.string().optional(),

    miscSuggestions: z.string().optional(),

    gstReturnRows: z.array(gstReturnRowsRowSchema).optional(),

    certificateExceptions: z.string().optional(),
    certificateComments: z.string().optional(),

    eligibleReceivablesForDp: numberSchema,
    dpReceivablesMargin: numberSchema,
    dpReceivablesAvailable: numberSchema,
  })
  .passthrough()

const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur()
  e.stopPropagation()
}
// const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
//   // Allow Ctrl/Cmd shortcuts
//   if (e.ctrlKey || e.metaKey) return

//   // Allow navigation + control keys
//   if (
//     [
//       'Backspace',
//       'Delete',
//       'Tab',
//       'Escape',
//       'Enter',
//       'ArrowLeft',
//       'ArrowRight',
//       'Home',
//       'End',
//     ].includes(e.key)
//   ) {
//     return
//   }

//   // Block decimal point and anything not 0-9
//   if (e.key < '0' || e.key > '9') {
//     e.preventDefault()
//   }
// }

// const blockDigitsInText = (e: React.KeyboardEvent<HTMLInputElement>) => {
//   if (e.ctrlKey || e.metaKey) return
//   if (
//     [
//       'Backspace',
//       'Delete',
//       'Tab',
//       'Escape',
//       'Enter',
//       'ArrowLeft',
//       'ArrowRight',
//       'Home',
//       'End',
//       ' ',
//       '-',
//       '/',
//       '&',
//       '(',
//       ')',
//       '.',
//       ',',
//     ].includes(e.key)
//   ) {
//     return
//   }
//   // Block digits only
//   if (e.key >= '0' && e.key <= '9') {
//     e.preventDefault()
//   }
// }

// const sanitizeInteger = (raw: string) => raw.replace(/[^\d]/g, '')

const sanitizeDecimal2 = (raw: string) => {
  // keep digits + one dot, and max 2 decimals
  const cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length === 1) return parts[0]
  const intPart = parts[0]
  const decPart = (parts[1] ?? '').slice(0, 2)
  return decPart.length ? `${intPart}.${decPart}` : intPart
}

const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey) return

  if (
    [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      '.',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ].includes(e.key)
  ) {
    return
  }
  if (e.key < '0' || e.key > '9') {
    e.preventDefault()
  }
}

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

type ColumnDef = {
  key: string
  header: string
  placeholder?: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
}

interface EditableTableProps<T extends FieldValues> {
  control: Control<T>
  name: FieldArrayPath<T>
  title?: string
  description?: string
  columns: ColumnDef[]
  emptyRow: Record<string, string | number>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = any

// Value sanitizer to avoid passing objects into <Input value={...}>
type InputScalar = string | number | readonly string[] | undefined
const toInputScalar = (v: unknown): InputScalar => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (Array.isArray(v)) return v as readonly string[]
  return ''
}

function EditableTable<T extends FieldValues>({
  control,
  title,
  description,
  name,
  columns,
  emptyRow,
}: EditableTableProps<T>) {
  // NOTE:
  // - Dynamic add/remove rows come from react-hook-form's useFieldArray.
  // - The "name" prop (e.g., "insuranceSummary") is the form key that stores the array.
  const { getValues } = useFormContext<T>()

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name,
  })

  // If a table has "srNo" column, we auto-generate it for UX and keep it read-only.
  const hasSrNo = useMemo(
    () => columns.some((c) => c.key === 'srNo'),
    [columns]
  )

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // const toInputScalar = (v: unknown): string | number => {
  //   if (v === null || v === undefined) return ''
  //   if (typeof v === 'string' || typeof v === 'number') return v
  //   // Avoid passing objects/arrays into <Input value=...> (causes TS + runtime issues)
  //   return ''
  // }

  const sanitizeInteger = (raw: string) => raw.replace(/[^\d]/g, '')

  // const sanitizeDecimal2 = (raw: string) => {
  //   // Keep only digits and at most one dot; keep max 2 digits after dot.
  //   let s = raw.replace(/[^\d.]/g, '')

  //   const firstDot = s.indexOf('.')
  //   if (firstDot !== -1) {
  //     const before = s.slice(0, firstDot)
  //     const after = s
  //       .slice(firstDot + 1)
  //       .replace(/\./g, '')
  //       .slice(0, 2)
  //     s = `${before}.${after}`
  //   }

  //   if (s.startsWith('.')) s = `0${s}`
  //   return s
  // }

  // const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.ctrlKey || e.metaKey) return
  //   if (
  //     [
  //       'Backspace',
  //       'Delete',
  //       'Tab',
  //       'Escape',
  //       'Enter',
  //       'ArrowLeft',
  //       'ArrowRight',
  //       'Home',
  //       'End',
  //     ].includes(e.key)
  //   ) {
  //     return
  //   }
  //   // Only digits allowed
  //   if (e.key < '0' || e.key > '9') e.preventDefault()
  // }

  // const blockNonNumericDecimal = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   // Your existing logic (allows '.' for decimals)
  //   if (e.ctrlKey || e.metaKey) return
  //   if (
  //     [
  //       'Backspace',
  //       'Delete',
  //       'Tab',
  //       'Escape',
  //       'Enter',
  //       '.',
  //       'ArrowLeft',
  //       'ArrowRight',
  //       'Home',
  //       'End',
  //     ].includes(e.key)
  //   ) {
  //     return
  //   }
  //   if (e.key < '0' || e.key > '9') e.preventDefault()
  // }

  // Integer-only keys (your "No. of days" issue + similar)
  const isIntegerKey = (key: string) => {
    if (key === 'srNo') return true
    if (key === 'membershipNo') return true
    if (/^days/i.test(key)) return true
    if (/^noOfAccounts$/i.test(key)) return true
    if (/^avgRealisationPeriod$/i.test(key)) return true
    return false
  }

  // const sanitizeInteger = (raw: string) => raw.replace(/[^\d]/g, '')

  const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) return
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ].includes(e.key)
    ) {
      return
    }
    if (e.key < '0' || e.key > '9') e.preventDefault()
  }

  const inferNumberCol = (key: string) => {
    // FIX: natureOfLimit must always be text, even though it contains "limit" in the key name.
    if (key === 'natureOfLimit') return false

    if (key === 'srNo') return true
    if (/^amount/i.test(key)) return true
    if (/(limit|outstanding|overdue|sumAssured)/i.test(key)) return true
    if (/(days|noOfAccounts|avgRealisationPeriod|totalOutstanding)/i.test(key))
      return true
    if (/^bucket/i.test(key)) return true
    if (/(AsPerSs|AsPerAssessment)/.test(key)) return true
    if (/^amount(Current|Prev)/i.test(key)) return true
    return false
  }

  const handleAddRow = () => {
    const current = (getValues(name as any) as unknown as any[]) ?? []
    const nextRow: Record<string, unknown> = { ...emptyRow }

    if (hasSrNo) {
      nextRow.srNo = String(current.length + 1)
    }

    append(nextRow as any)
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (!hasSrNo) {
      remove(rowIndex)
      return
    }

    // Re-index srNo without losing user-entered values (use getValues, not "fields")
    const current = (getValues(name as any) as unknown as any[]) ?? []
    const next = current
      .filter((_: unknown, idx: number) => idx !== rowIndex)
      .map((r: any, idx: number) => ({
        ...r,
        srNo: String(idx + 1),
      }))

    replace(next as any)
  }

  return (
    <Card className='mt-4'>
      {title ? (
        <CardHeader className='pb-2'>
          <CardTitle className='text-base font-semibold'>{title}</CardTitle>
          {description ? (
            <CardDescription className='text-muted-foreground text-xs'>
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}

      <CardContent className={title ? 'pt-0' : ''}>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className='text-muted-foreground py-6 text-center text-xs'
                  >
                    No rows added yet. Use &quot;Add row&quot; to start.
                  </TableCell>
                </TableRow>
              ) : null}

              {fields.map((row, rowIndex) => (
                <TableRow key={row.id}>
                  {columns.map((col) => {
                    const fieldName = `${name}.${rowIndex}.${col.key}`

                    // Effective type:
                    // - if caller set col.type, respect it
                    // - else infer numeric conservatively
                    // - but NEVER treat "natureOfLimit" as numeric (explicit fix above)
                    const effectiveType =
                      col.type ?? (inferNumberCol(col.key) ? 'number' : 'text')

                    const isSerial = hasSrNo && col.key === 'srNo'
                    // const isInteger =
                    //   effectiveType === 'number' && isIntegerKey(col.key)
                    // const isDecimal =
                    //   effectiveType === 'number' && !isIntegerKey(col.key)

                    return (
                      <TableCell key={col.key} className='align-top'>
                        <Controller
                          control={control}
                          name={fieldName as FieldPath<T>}
                          render={({ field, fieldState }) => {
                            const safeValue = toInputScalar(field.value)

                            const baseClass =
                              'h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

                            // --- Select ---
                            if (effectiveType === 'select' && col.options) {
                              return (
                                <div>
                                  <select
                                    id={field.name}
                                    name={field.name}
                                    value={(safeValue ?? '') as any}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                    onBlur={field.onBlur}
                                    className={baseClass}
                                  >
                                    <option value=''>Select</option>
                                    {col.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>

                                  {fieldState.error?.message ? (
                                    <p className='text-destructive mt-1 text-[10px]'>
                                      {fieldState.error.message}
                                    </p>
                                  ) : null}
                                </div>
                              )
                            }

                            // --- Date ---
                            if (effectiveType === 'date') {
                              return (
                                <div>
                                  <Input
                                    id={field.name}
                                    name={field.name}
                                    type='date'
                                    value={(safeValue ?? '') as any}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                    onBlur={field.onBlur}
                                    className={baseClass}
                                    placeholder={col.placeholder}
                                  />

                                  {fieldState.error?.message ? (
                                    <p className='text-destructive mt-1 text-[10px]'>
                                      {fieldState.error.message}
                                    </p>
                                  ) : null}
                                </div>
                              )
                            }

                            // --- Number ---
                            if (effectiveType === 'number') {
                              const displayValue =
                                typeof safeValue === 'number'
                                  ? String(safeValue)
                                  : (safeValue ?? '')

                              const isInteger = isIntegerKey(col.key)

                              return (
                                <div>
                                  <Input
                                    id={field.name}
                                    name={field.name}
                                    // Keep as text to fully control keystrokes ("e", "+", "-", etc.)
                                    type='text'
                                    inputMode={
                                      isInteger ? 'numeric' : 'decimal'
                                    }
                                    autoComplete='off'
                                    value={displayValue as any}
                                    placeholder={col.placeholder}
                                    readOnly={isSerial}
                                    tabIndex={isSerial ? -1 : 0}
                                    className={baseClass}
                                    onKeyDown={(e) => {
                                      if (isSerial) {
                                        e.preventDefault()
                                        return
                                      }
                                      // FIX: integers (days/membershipNo/etc.) must not allow '.'
                                      if (isInteger) {
                                        blockNonInteger(e)
                                        return
                                      }
                                      // decimals (max 2 dp) keep existing decimal keydown guard
                                      blockNonNumeric(e)
                                    }}
                                    onWheel={preventScrollChange}
                                    onPaste={(e) => {
                                      if (isSerial) {
                                        e.preventDefault()
                                        return
                                      }
                                      const txt =
                                        e.clipboardData.getData('text')
                                      if (!txt) return
                                      e.preventDefault()
                                      field.onChange(
                                        isInteger
                                          ? sanitizeInteger(txt)
                                          : sanitizeDecimal2(txt)
                                      )
                                    }}
                                    onChange={(e) => {
                                      if (isSerial) return
                                      const raw = e.target.value
                                      field.onChange(
                                        isInteger
                                          ? sanitizeInteger(raw)
                                          : sanitizeDecimal2(raw)
                                      )
                                    }}
                                    onBlur={field.onBlur}
                                  />

                                  {fieldState.error?.message ? (
                                    <p className='text-destructive mt-1 text-[10px]'>
                                      {fieldState.error.message}
                                    </p>
                                  ) : null}
                                </div>
                              )
                            }

                            // --- Text (default) ---
                            return (
                              <div>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  type='text'
                                  autoComplete='off'
                                  value={(safeValue ?? '') as any}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  onBlur={field.onBlur}
                                  className={baseClass}
                                  placeholder={col.placeholder}
                                />

                                {fieldState.error?.message ? (
                                  <p className='text-destructive mt-1 text-[10px]'>
                                    {fieldState.error.message}
                                  </p>
                                ) : null}
                              </div>
                            )
                          }}
                        />
                      </TableCell>
                    )
                  })}

                  <TableCell className='w-10 text-right'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='text-destructive h-7 w-7'
                      onClick={() => handleRemoveRow(rowIndex)}
                    >
                      <Trash className='h-3 w-3' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='mt-2 flex justify-between'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleAddRow}
          >
            <Plus className='mr-1 h-3 w-3' />
            Add row
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface YesNoNaSelectProps {
  name: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

function YesNoNaSelect({ name, value, onChange, onBlur }: YesNoNaSelectProps) {
  return (
    <select
      name={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className='border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
    >
      <option value=''>Select</option>
      <option value='YES'>YES</option>
      <option value='NO'>NO</option>
      <option value='NA'>N/A</option>
    </select>
  )
}

function StockAuditFormSkeleton(): JSX.Element {
  return (
    <MainWrapper>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='mb-2 h-6 w-64' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-9 w-24' />
        </div>

        {[0, 1, 2, 3].map((sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <Skeleton className='h-5 w-48' />
            </CardHeader>
            <CardContent className='space-y-3'>
              {[0, 1, 2, 3].map((rowIndex) => (
                <div
                  key={rowIndex}
                  className='grid grid-cols-1 gap-3 md:grid-cols-2'
                >
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-9 w-full' />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </MainWrapper>
  )
}

function RouteComponent(): JSX.Element {
  const { accountId, assignmentId } = Route.useParams()
  const navigate = useNavigate()

  const saveTgbReportMutation = $api.useMutation(
    'post',
    '/api/crgb-stock-audit/create',
    {
      onSuccess: () => {
        toast.success('TGB stock audit report saved successfully.')
        navigate({
          to: '/stock-audit/assigned-audits',
          search: { tab: 'COMPLETED' },
        })
        setTimeout(() => {
          window.location.reload()
        }, 0)
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('Error saving TGB report', err)
        toast.error('Failed to save TGB stock audit report.')
      },
    }
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(stockAuditSchema) as any,
    mode: 'onSubmit',
    defaultValues: {
      borrowerName: '',
      referenceDateForSra: '',
      registeredOfficeAddress: '',
      corporateOfficeAddress: '',
      unitAddresses: '',
      natureOfActivity: '',
      bankingArrangement: '',
      borrowerProfileNote: '',
      execCreditFacilities: [],
      totalFundBasedLimit: '',
      totalNonFundBasedLimit: '',
      totalExposure: '',
      externalFacilities: [],
      physicalVerificationDate: '',
      drawingPowerAsPerAnnexureA: '',
      physicalVerificationRemarks: '',
      domesticReceivablesAsPerStock: '',
      domesticReceivablesAsPerAssessment: '',
      dpAgainstReceivables: '',
      receivablesVariationReasons: '',
      cfSalesTurnoverBooks: '',
      cfSalesTurnoverGstr1: '',
      cfAmountRealisedFromCustomers: '',
      cfTotalCreditSummations: '',
      cfOpeningDebtors: '',
      cfSalesDuringPeriod: '',
      cfClosingDebtors: '',
      cfCashRealisationComputed: '',
      cfComments: '',
      insuranceSummary: [],
      insuranceCoverAsPerSanction: '',
      insuranceDeviationDetails: '',
      rocCharges: [],
      mandatoryBooks: [],
      booksOfAccountComments: '',
      returnsComments: '',
      statutoryDues: [],
      statutoryDuesComments: '',
      sraTeamMembers: [],
      sraCommencementDate: '',
      sraCompletionDate: '',
      sraVisitDates: '',
      invMarketValueDate: '',
      invMarketValueAmount: '',
      inventoryOverview: [],
      inventoryLocationStocks: [],
      inventoryVariationComments: '',
      inventoryValuationComments: '',
      inventoryJobWorkDetails: '',
      inventoryThirdPartyStockDetails: '',
      inventoryControlQualityComments: '',
      inventoryControlMisComments: '',
      dpStockEligible: '',
      dpStockMargin: '',
      dpStockAvailable: '',
      // creditorsAgeingSummary: [],
      creditorsComments: '',
      receivablesOverview: [],
      receivablesFromAssociates: [],
      receivablesAgeingSummary: [],
      receivablesVariationReasonsDetailed: '',
      disputedReceivablesDetails: '',
      provisionRequiredDetails: '',
      receivableAuditTrailComments: '',
      verifiedDebtors: [],
      verifiedCreditors: [],
      relatedPartyReceivableAgeing: [],
      cashFlowVerificationComments: '',
      rocComplianceComments: '',
      miscEmployeeRelationComments: '',
      miscPowerAvailabilityComments: '',
      miscNoticesReceived: '',
      miscNoticesDetails: '',
      miscOtherBankAccounts: '',
      miscOtherBankAccountsDetails: '',
      miscDiversionOfFunds: '',
      miscDiversionOfFundsDetails: '',
      miscSalesRoutingThroughLenders: '',
      miscSalesRoutingDetails: '',
      miscHypothecationBoardDisplayed: '',
      miscJobWorkStockSeparatelyStored: '',
      miscJobWorkStockDetails: '',
      miscLevelOfActivityComments: '',
      miscSpecialEventsComments: '',
      miscConstraintsDuringSra: '',
      miscConstraintsDetails: '',
      miscSuggestions: '',
      gstReturnRows: [],
      certificateExceptions: '',
      certificateComments: '',
      eligibleReceivablesForDp: '',
      dpReceivablesMargin: '',
      dpReceivablesAvailable: '',
    },
  })

  const {
    data: accountDetailResponse,
    isLoading: isAccountDetailLoading,
    error: accountDetailError,
  } = $api.useQuery(
    'get',
    '/account/getAccountDetail',
    {
      params: {
        query: { acctNm: accountId ?? '' },
      },
    },
    { enabled: Boolean(accountId) }
  )

  useEffect(() => {
    const c = (accountDetailResponse?.customer ?? null) as
      | Record<string, any>
      | null
    if (!c) return

    const addressLines = [c.add1, c.add2, c.add3, c.add4].filter(Boolean)
    const fullAddress = addressLines.join(', ')

    const unitAddressParts = [
      fullAddress,
      c.area ? `Area: ${c.area}` : '',
      c.city ? `City: ${c.city}` : '',
      c.district ? `District: ${c.district}` : '',
      c.state ? `State: ${c.state}` : '',
      c.pinCode ? `PIN: ${c.pinCode}` : '',
    ].filter(Boolean)

    form.reset(
      {
        ...form.getValues(),

        borrowerName: c.custName ?? form.getValues('borrowerName') ?? '',

        registeredOfficeAddress:
          fullAddress || form.getValues('registeredOfficeAddress') || '',
        corporateOfficeAddress:
          fullAddress || form.getValues('corporateOfficeAddress') || '',
        unitAddresses:
          unitAddressParts.join('\n') || form.getValues('unitAddresses') || '',

        natureOfActivity:
          (c.segement ?? '') || form.getValues('natureOfActivity') || '',

        referenceDateForSra:
          formatDateForInput(c.refDate) ||
          form.getValues('referenceDateForSra') ||
          '',

        sraCommencementDate:
          formatDateForInput(c.startDate) ||
          form.getValues('sraCommencementDate') ||
          '',

        borrowerProfileNote:
          [
            form.getValues('borrowerProfileNote') || '',
            c.acctDesc ? `Account Type: ${c.acctDesc}` : '',
            c.custNumber ? `Customer No: ${c.custNumber}` : '',
            c.telNo ? `Contact: ${c.telNo}` : '',
            c.branchName ? `Branch: ${c.branchName}` : '',
            c.sanctDt ? `Sanction Date: ${formatDateForInput(c.sanctDt)}` : '',
            c.loanLimit != null ? `Limit: ${c.loanLimit}` : '',
            c.intRate != null ? `ROI: ${c.intRate}` : '',
          ]
            .filter(Boolean)
            .join('\n')
            .trim() || form.getValues('borrowerProfileNote') || '',
      },
      { keepDirtyValues: true, keepTouched: true }
    )
  }, [accountDetailResponse, form])

  useEffect(() => {
    if (!accountDetailError) return
    // eslint-disable-next-line no-console
    console.error(accountDetailError)
    toast.error('Unable to prefill borrower details.')
  }, [accountDetailError])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      bankFormat: 'TGB' as const,
      accountNo: accountId,
      assignmentId: assignmentId,
      registeredOffice: data.registeredOfficeAddress,
      corporateOffice: data.corporateOfficeAddress,
      manufacturingLocations: data.unitAddresses,
    }

    try {
      await saveTgbReportMutation.mutateAsync({
        body: payload,
        params: {
          query: {
            assignmentId: Number(assignmentId),
          },
          header: undefined,
          path: undefined,
          cookie: undefined,
        },
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Submit failed', err)
    }
  }

  if (isAccountDetailLoading) {
    return <StockAuditFormSkeleton />
  }

  return (
    <MainWrapper>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-6 pb-32'
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.target instanceof HTMLTextAreaElement) return
              e.preventDefault()
            }
          }}
        >
          {/* Header */}
          <header className='from-primary/20 via-primary/10 ring-border mb-8 flex items-center justify-between rounded-2xl bg-linear-to-r to-transparent p-6 ring-1'>
            <div>
              <h1 className='text-xl font-semibold'>
                Stock &amp; Receivable Audit
              </h1>
              <p className='text-muted-foreground text-xs'>
                Account ID: {accountId} · Assignment ID: {assignmentId}
              </p>
            </div>

            <button
              type='button'
              onClick={() => window.history.back()}
              className='border-border bg-background hover:bg-muted hover:text-foreground rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors'
            >
              Go Back
            </button>
          </header>

          {/* Annexure I – Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Annexure I – Executive Summary
              </CardTitle>
              <CardDescription className='text-muted-foreground text-xs'>
                Borrower profile, facilities and high-level observations.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Borrower profile */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='borrowerName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrower Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='referenceDateForSra'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reference date for Stock &amp; Receivable Audit
                      </FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='registeredOfficeAddress'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Office Address</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='corporateOfficeAddress'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Corporate / Administrative Office Address
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='unitAddresses'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address of Manufacturing Unit(s) / Works / Godowns (with
                      brief description)
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='natureOfActivity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nature of Activity / Line of Business
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='bankingArrangement'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banking Arrangement</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Sole / Consortium / Multiple banking etc.'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='borrowerProfileNote'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Brief write-up on borrower profile &amp; management
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit facilities */}
              <EditableTable
                control={control}
                name='execCreditFacilities'
                title='1. Details of credit facilities enjoyed'
                description='As per latest sanction letters / review – TGB &amp; other lenders.'
                columns={[
                  {
                    key: 'natureOfLimit',
                    header: 'Nature of limit',
                    type: 'select',
                    options: [
                      { value: 'CC', label: 'Cash Credit (CC)' },
                      { value: 'OD', label: 'Overdraft (OD)' },
                      { value: 'TL', label: 'Term Loan (TL)' },
                      { value: 'DL', label: 'Demand Loan (DL)' },
                      { value: 'BG', label: 'Bank Guarantee (BG)' },
                      { value: 'LC', label: 'Letter of Credit (LC)' },
                      { value: 'PCFC', label: 'PCFC' },
                      {
                        value: 'WCDL',
                        label: 'Working Capital Demand Loan (WCDL)',
                      },
                      { value: 'OTHER', label: 'Other' },
                    ],
                  },

                  { key: 'limitTGB', header: 'Limit – TGB (₹ lakh)' },
                  {
                    key: 'limitOthers',
                    header: 'Limit – Other Banks / FIs (₹ lakh)',
                  },
                  {
                    key: 'outstandingTGB',
                    header: 'Outstanding – TGB (₹ lakh)',
                  },
                  {
                    key: 'outstandingOthers',
                    header: 'Outstanding – Others (₹ lakh)',
                  },
                ]}
                emptyRow={{
                  natureOfLimit: '',
                  limitTGB: '',
                  limitOthers: '',
                  outstandingTGB: '',
                  outstandingOthers: '',
                }}
              />

              <div className='grid gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='totalFundBasedLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Fund Based Limits (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          {...field}
                          onKeyDown={blockNonNumeric}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='totalNonFundBasedLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Total Non-Fund Based Limits (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          {...field}
                          onKeyDown={blockNonNumeric}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='totalExposure'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Total Exposure (Fund + Non-Fund) (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          {...field}
                          onKeyDown={blockNonNumeric}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Facilities from FIs / NBFC / factoring */}
              <EditableTable
                control={control}
                name='externalFacilities'
                title='2. Facilities from FI / NBFC / Factoring companies'
                columns={[
                  { key: 'natureOfLimit', header: 'Nature of facility' },
                  { key: 'lenderName', header: 'Lender name' },
                  { key: 'outstanding', header: 'Outstanding (₹ lakh)' },
                  { key: 'overdue', header: 'Overdue, if any (₹ lakh)' },
                ]}
                emptyRow={{
                  natureOfLimit: '',
                  lenderName: '',
                  outstanding: '',
                  overdue: '',
                }}
              />

              {/* Physical verification & DP for receivables */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='physicalVerificationDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date of physical verification of stock &amp; receivables
                      </FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='drawingPowerAsPerAnnexureA'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Drawing Power as per Annexure A (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          onKeyDown={blockNonNumeric}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='physicalVerificationRemarks'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Remarks on physical verification (coverage, locations
                      visited, exceptions)
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* High level DP variation for receivables */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='domesticReceivablesAsPerStock'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Domestic receivables – As per stock statement (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          onKeyDown={blockNonNumeric}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='domesticReceivablesAsPerAssessment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Domestic receivables – As per auditor&apos;s assessment
                        (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          onKeyDown={blockNonNumeric}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='dpAgainstReceivables'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Drawing Power against receivables as per assessment (₹
                      lakh)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        onKeyDown={blockNonNumeric}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='receivablesVariationReasons'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reasons for variation between stock statement and
                      assessment
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cash flow summary */}
              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-semibold'>
                    7. Cash Flow Summary (for the period covered)
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 pt-0'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='cfSalesTurnoverBooks'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Sales turnover as per books (₹ crore)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cfSalesTurnoverGstr1'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Sales turnover as per GSTR-1 (₹ crore)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='cfAmountRealisedFromCustomers'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Amount realised from customers (₹ crore)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cfTotalCreditSummations'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Total credit summations in main CC/OD account (₹
                            crore)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid gap-4 md:grid-cols-4'>
                    <FormField
                      control={form.control}
                      name='cfOpeningDebtors'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opening debtors (₹ lakh)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cfSalesDuringPeriod'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Add: Sales during period (₹ lakh)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cfClosingDebtors'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Less: Closing debtors (₹ lakh)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='cfCashRealisationComputed'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Cash realisation from debtors (₹ lakh)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              onKeyDown={blockNonNumeric}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='cfComments'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Remarks on cash flow and routing of sales
                        </FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Insurance summary */}
              <EditableTable
                control={control}
                name='insuranceSummary'
                title='8. Insurance coverage summary'
                columns={[
                  { key: 'srNo', header: 'Sr. No.' },
                  {
                    key: 'particular',
                    header: 'Particulars (Primary / Collateral)',
                  },
                  { key: 'natureOfSecurity', header: 'Nature of security' },
                  { key: 'assetsSecured', header: 'Assets secured' },
                  { key: 'sumAssured', header: 'Sum assured (₹ lakh)' },
                  { key: 'dueDate', header: 'Policy due date', type: 'date' },
                ]}
                emptyRow={{
                  srNo: '',
                  particular: '',
                  natureOfSecurity: '',
                  assetsSecured: '',
                  sumAssured: '',
                  dueDate: '',
                }}
              />

              <FormField
                control={form.control}
                name='insuranceCoverAsPerSanction'
                render={({ field }) => (
                  <FormItem className='md:max-w-xs'>
                    <FormLabel>
                      Whether insurance cover is as per terms of sanction?
                    </FormLabel>
                    <FormControl>
                      <YesNoNaSelect
                        name={field.name}
                        value={field.value as string | undefined}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='insuranceDeviationDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Details of deviation in insurance, if any
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ROC charges */}
              <EditableTable
                control={control}
                name='rocCharges'
                title='9. Registration of charge with ROC'
                columns={[
                  { key: 'natureOfCharge', header: 'Nature of charge' },
                  { key: 'lender', header: 'Lender(s)' },
                  { key: 'amount', header: 'Amount (₹ lakh)' },
                  { key: 'rocChargeId', header: 'ROC charge ID / details' },
                ]}
                emptyRow={{
                  natureOfCharge: '',
                  lender: '',
                  amount: '',
                  rocChargeId: '',
                }}
              />

              {/* Mandatory books & returns */}
              <EditableTable
                control={control}
                name='mandatoryBooks'
                title='10. Mandatory books / returns'
                description='Books and statutory returns required for the unit and their compliance status.'
                columns={[
                  { key: 'name', header: 'Book / Return' },
                  { key: 'applicability', header: 'Applicability' },
                  { key: 'status', header: 'Status of compliance' },
                ]}
                emptyRow={{
                  name: '',
                  applicability: '',
                  status: '',
                }}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='booksOfAccountComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks on books of accounts</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='returnsComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks on statutory returns</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Statutory dues */}
              <EditableTable
                control={control}
                name='statutoryDues'
                title='11. Status of payment of statutory dues'
                columns={[
                  {
                    key: 'natureOfDue',
                    header: 'Nature of due (GST / TDS / PF / ESIC / others)',
                  },
                  {
                    key: 'amountOutstanding',
                    header: 'Amount outstanding (₹ lakh)',
                  },
                  {
                    key: 'paymentStatus',
                    header: 'Payment status as advised by company',
                  },
                ]}
                emptyRow={{
                  natureOfDue: '',
                  amountOutstanding: '',
                  paymentStatus: '',
                }}
              />

              <FormField
                control={form.control}
                name='statutoryDuesComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall comments on statutory dues</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SRA team & schedule */}
              <EditableTable
                control={control}
                name='sraTeamMembers'
                title='12. Officials of Stock & Receivable Audit team'
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'qualification', header: 'Qualification' },
                  {
                    key: 'membershipNo',
                    header: 'Membership No. (if applicable)',
                  },
                  { key: 'role', header: 'Role in assignment' },
                ]}
                emptyRow={{
                  name: '',
                  qualification: '',
                  membershipNo: '',
                  role: '',
                }}
              />

              <div className='grid gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='sraCommencementDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of commencement of SRA</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='sraCompletionDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of completion of SRA</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='sraVisitDates'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location-wise visit dates (brief)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Unit-1: 05-07-2025; Unit-2: 06-07-2025'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Annexure A – Inventories */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Annexure A – Inventories
              </CardTitle>
              <CardDescription className='text-muted-foreground text-xs'>
                Physical verification, valuation &amp; drawing power
                computation.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-[2fr,1fr]'>
                <FormField
                  control={form.control}
                  name='invMarketValueDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of stock statement / valuation</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='invMarketValueAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Market value of stock as on that date (₹ lakh)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          onKeyDown={blockNonNumeric}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <EditableTable
                control={control}
                name='inventoryOverview'
                title='A. Overview & composition of stock'
                description='Category-wise stock position for the latest 3 dates (amount & number of days).'
                columns={[
                  {
                    key: 'category',
                    header: 'Category (RM / WIP / FG / Stores)',
                  },
                  {
                    key: 'amountCurrent',
                    header: 'Amount – Current date (₹ lakh)',
                  },
                  { key: 'daysCurrent', header: 'No. of days – Current' },
                  { key: 'amountPrev1', header: 'Amount – Previous date 1' },
                  { key: 'daysPrev1', header: 'No. of days – Prev 1' },
                  { key: 'amountPrev2', header: 'Amount – Previous date 2' },
                  { key: 'daysPrev2', header: 'No. of days – Prev 2' },
                ]}
                emptyRow={{
                  category: '',
                  amountCurrent: '',
                  daysCurrent: '',
                  amountPrev1: '',
                  daysPrev1: '',
                  amountPrev2: '',
                  daysPrev2: '',
                }}
              />

              <EditableTable
                control={control}
                name='inventoryLocationStocks'
                title='B. Location-wise closing stock (as per stock statement & assessment)'
                columns={[
                  { key: 'location', header: 'Location / Unit' },
                  { key: 'rmAsPerSs', header: 'Raw material – As per SS' },
                  {
                    key: 'rmAsPerAssessment',
                    header: 'Raw material – As per assessment',
                  },
                  { key: 'wipAsPerSs', header: 'WIP – As per SS' },
                  {
                    key: 'wipAsPerAssessment',
                    header: 'WIP – As per assessment',
                  },
                  { key: 'fgAsPerSs', header: 'Finished goods – As per SS' },
                  {
                    key: 'fgAsPerAssessment',
                    header: 'Finished goods – As per assessment',
                  },
                  {
                    key: 'storesAsPerSs',
                    header: 'Stores & spares – As per SS',
                  },
                  {
                    key: 'storesAsPerAssessment',
                    header: 'Stores & spares – As per assessment',
                  },
                ]}
                emptyRow={{
                  location: '',
                  rmAsPerSs: '',
                  rmAsPerAssessment: '',
                  wipAsPerSs: '',
                  wipAsPerAssessment: '',
                  fgAsPerSs: '',
                  fgAsPerAssessment: '',
                  storesAsPerSs: '',
                  storesAsPerAssessment: '',
                }}
              />

              <FormField
                control={form.control}
                name='inventoryVariationComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reasons for variation between stock statement and physical
                      / assessed stock
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='inventoryValuationComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Comments on valuation (cost / NRV, method of valuation,
                      over / under valuation)
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='inventoryJobWorkDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stocks held for / received from job work (quantitative
                        &amp; value details)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='inventoryThirdPartyStockDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Third party stocks held at unit (and unit&apos;s stock
                        with third parties)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='inventoryControlQualityComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quality, slow / non-moving, obsolete, perishable goods –
                        observations
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='inventoryControlMisComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stock records, MIS controls, reconciliations &amp;
                        periodic physical verification
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-semibold'>
                    Drawing Power against stock – summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4 pt-0 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='dpStockEligible'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible stock for DP (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dpStockMargin'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margin on stock (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dpStockAvailable'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Available DP against stock (₹ lakh)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Annexure B – Receivables */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Annexure B – Receivables
              </CardTitle>
              <CardDescription className='text-muted-foreground text-xs'>
                Overview, age-wise analysis &amp; drawing power for receivables.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <EditableTable
                control={control}
                name='receivablesOverview'
                title='B.1 Overview & composition of receivables'
                columns={[
                  {
                    key: 'category',
                    header: 'Category (Domestic / Export / Others)',
                  },
                  { key: 'amount', header: 'Amount (₹ lakh)' },
                  { key: 'noOfAccounts', header: 'No. of accounts' },
                  {
                    key: 'avgRealisationPeriod',
                    header: 'Average realisation period (days)',
                  },
                ]}
                emptyRow={{
                  category: '',
                  amount: '',
                  noOfAccounts: '',
                  avgRealisationPeriod: '',
                }}
              />

              <EditableTable
                control={control}
                name='receivablesFromAssociates'
                title='B.2 Receivables from associates / group concerns'
                columns={[
                  { key: 'partyName', header: 'Name of party' },
                  { key: 'relationship', header: 'Relationship / group' },
                  { key: 'amount', header: 'Amount (₹ lakh)' },
                  { key: 'ageing', header: 'Ageing bucket' },
                ]}
                emptyRow={{
                  partyName: '',
                  relationship: '',
                  amount: '',
                  ageing: '',
                }}
              />

              <EditableTable
                control={control}
                name='receivablesAgeingSummary'
                title='B.3 Age-wise analysis of receivables'
                description='Debtor-wise or bucket-wise ageing as per Annexure B.'
                columns={[
                  { key: 'partyName', header: 'Customer / Debtor name' },
                  {
                    key: 'totalOutstanding',
                    header: 'Total outstanding (₹ lakh)',
                  },
                  { key: 'bucketUpto90', header: '≤ 90 days' },
                  { key: 'bucket90to180', header: '91–180 days' },
                  { key: 'bucket180to365', header: '181–365 days' },
                  { key: 'bucketAbove365', header: '> 365 days' },
                  { key: 'disputed', header: 'Disputed? (Y/N)' },
                ]}
                emptyRow={{
                  partyName: '',
                  totalOutstanding: '',
                  bucketUpto90: '',
                  bucket90to180: '',
                  bucket180to365: '',
                  bucketAbove365: '',
                  disputed: '',
                }}
              />

              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-semibold'>
                    Drawing Power against receivables – summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4 pt-0 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='eligibleReceivablesForDp'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Eligible receivables for DP (₹ lakh)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dpReceivablesMargin'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margin on receivables (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dpReceivablesAvailable'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Available DP against receivables (₹ lakh)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            onKeyDown={blockNonNumeric}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name='receivablesVariationReasonsDetailed'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Detailed reasons for variation between book receivables
                      and stock statement
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='disputedReceivablesDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Details of disputed / long overdue receivables &amp;
                        follow-up
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='provisionRequiredDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Provision required / made for doubtful receivables (with
                        justification)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='receivableAuditTrailComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Comments on audit trail, linkage with sales, GST, e-way
                      bills etc.
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <EditableTable
                control={control}
                name='verifiedDebtors'
                title='List of debtors verified (sample testing)'
                columns={[
                  { key: 'partyName', header: 'Debtor name' },
                  { key: 'amount', header: 'Amount verified (₹ lakh)' },
                  {
                    key: 'modeOfVerification',
                    header: 'Mode (Balance confirmation / visit / other)',
                  },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  partyName: '',
                  amount: '',
                  modeOfVerification: '',
                  remarks: '',
                }}
              />

              <EditableTable
                control={control}
                name='verifiedCreditors'
                title='List of creditors verified (sample testing)'
                columns={[
                  { key: 'partyName', header: 'Creditor name' },
                  { key: 'amount', header: 'Amount verified (₹ lakh)' },
                  { key: 'modeOfVerification', header: 'Mode of verification' },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  partyName: '',
                  amount: '',
                  modeOfVerification: '',
                  remarks: '',
                }}
              />

              <EditableTable
                control={control}
                name='relatedPartyReceivableAgeing'
                title='Age-wise receivables from associates / group concerns'
                columns={[
                  { key: 'partyName', header: 'Party name' },
                  { key: 'relationship', header: 'Relationship' },
                  {
                    key: 'totalOutstanding',
                    header: 'Total outstanding (₹ lakh)',
                  },
                  { key: 'bucketUpto90', header: '≤ 90 days' },
                  { key: 'bucket90to180', header: '91–180 days' },
                  { key: 'bucket180to365', header: '181–365 days' },
                  { key: 'bucketAbove365', header: '> 365 days' },
                ]}
                emptyRow={{
                  partyName: '',
                  relationship: '',
                  totalOutstanding: '',
                  bucketUpto90: '',
                  bucket90to180: '',
                  bucket180to365: '',
                  bucketAbove365: '',
                }}
              />

              <FormField
                control={form.control}
                name='cashFlowVerificationComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cash flow trail between receivables and banking
                      transactions – observations
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Annexure C – Miscellaneous & GST */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Annexure C – Miscellaneous &amp; GST
              </CardTitle>
              <CardDescription className='text-muted-foreground text-xs'>
                Insurance, ROC, operational aspects &amp; GST returns status.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='rocComplianceComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Comments on compliance with registration of charges / ROC
                      filings
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='miscEmployeeRelationComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Relation with employees / labour and overview of
                        manpower
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscPowerAvailabilityComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Availability of power, raw material, logistics &amp;
                        other infrastructure
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='miscNoticesReceived'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Any notices from statutory authorities?
                      </FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscOtherBankAccounts'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Accounts maintained with other banks?
                      </FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscDiversionOfFunds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any diversion of funds observed?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='miscNoticesDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details of statutory notices, if any</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='miscOtherBankAccountsDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Details of accounts with other banks (nature, purpose,
                        turnover)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscDiversionOfFundsDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Diversion / siphoning of funds (if any) and
                        auditor&apos;s comments
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='miscSalesRoutingThroughLenders'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales routed through TGB accounts?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscHypothecationBoardDisplayed'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hypothecation board displayed at unit / godown?
                      </FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscJobWorkStockSeparatelyStored'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Job work stocks kept separately &amp; identified?
                      </FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='miscSalesRoutingDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Details on routing of sales through banking channels
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='miscJobWorkStockDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Additional details on job work stocks &amp; ownership
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='miscLevelOfActivityComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Level of activity during audit period (capacity
                        utilisation, trend)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscSpecialEventsComments'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Special events impacting business (lockdowns, strikes,
                        policy changes etc.)
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='miscConstraintsDuringSra'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any constraints faced during SRA?</FormLabel>
                      <FormControl>
                        <YesNoNaSelect
                          name={field.name}
                          value={field.value as string | undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='miscConstraintsDetails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Details of constraints / limitations, if any
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='miscSuggestions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Suggestions / recommendations of auditor
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GST details */}
              <EditableTable
                control={control}
                name='gstReturnRows'
                title='4. GST returns &amp; reconciliations'
                columns={[
                  {
                    key: 'returnType',
                    header: 'Return type (GSTR-1 / GSTR-3B / others)',
                  },
                  { key: 'filedUpto', header: 'Filed up to (month / year)' },
                  {
                    key: 'status',
                    header: 'Status (on time / delayed / pending)',
                  },
                  { key: 'remarks', header: 'Remarks / reconciliation notes' },
                ]}
                emptyRow={{
                  returnType: '',
                  filedUpto: '',
                  status: '',
                  remarks: '',
                }}
              />
            </CardContent>
          </Card>

          {/* Annexure D – Auditor certificate (key points) */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Annexure D – Auditor Certificate (Key Inputs)
              </CardTitle>
              <CardDescription className='text-muted-foreground text-xs'>
                Use this section to capture exceptions &amp; remarks which will
                flow into the certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='certificateExceptions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Key exceptions observed (stock, receivables, creditors,
                      documentation etc.)
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='certificateComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Any other important comments for Annexure D certificate
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={isSubmitting || saveTgbReportMutation.isPending}
            >
              {isSubmitting || saveTgbReportMutation.isPending
                ? 'Saving…'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </MainWrapper>
  )
}

export const Route = createFileRoute(
  '/_authenticated/stock-audit/$accountId/report/$assignmentId'
)({
  component: RouteComponent,
})

