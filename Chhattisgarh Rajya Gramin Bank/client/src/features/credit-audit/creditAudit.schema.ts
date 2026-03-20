import { z } from 'zod'
import { CREDIT_AUDIT_CHECKLIST } from './creditAudit.constants'

/** ---------- Strict helpers ---------- **/

// YYYY-MM-DD (from <input type="date">)
const dateISO = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date (YYYY-MM-DD)`)

// Digits only (no alphabets, no spaces, no symbols)
const digitsOnly = (
  label: string,
  opts?: { minLen?: number; maxLen?: number }
) => {
  const minLen = opts?.minLen ?? 1
  const maxLen = opts?.maxLen

  let s = z
    .string()
    .trim()
    .min(minLen, `${label} is required`)
    .regex(/^\d+$/, `${label} must contain digits only`)

  if (typeof maxLen === 'number') {
    s = s.max(maxLen, `${label} must be at most ${maxLen} digits`)
  }
  return s
}

// Exactly 4-digit year
const yearYYYY = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d{4}$/, `${label} must be a 4-digit year`)
    .refine((v) => {
      const n = Number(v)
      return n >= 1800 && n <= 2200
    }, `${label} must be between 1800 and 2200`)

// Amount: digits with optional . and 1-2 decimals
const amountStrictOptional = (label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .refine((v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(v), {
      message: `${label} must be a valid amount (e.g., 1000 or 1000.50)`,
    })
    .optional()

// Account numbers: digits with separators only (comma/space/slash/hyphen)
const accountNumbersStrict = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(
      /^[0-9][0-9,\s/-]*$/,
      `${label} must contain digits only (separators: , space / - allowed)`
    )
    .refine((v) => v.replace(/[,\s/-]/g, '').length > 0, {
      message: `${label} must contain at least one digit`,
    })

/** ---------- Enums ---------- **/

export const YesNoNAEnum = z.enum(['YES', 'NO', 'NA'])

export const ConstitutionEnum = z.enum([
  'PROPRIETORSHIP',
  'PARTNERSHIP',
  'COMPANY',
])

export const ProposalTypeEnum = z.enum(['EXISTING', 'NEW', 'TAKEOVER'])

/** ---------- Checklist item ---------- **/

const checklistItemSchema = z.object({
  id: z.number().int().min(1),
  response: YesNoNAEnum,
  remark: z.string().trim().max(2000).default(''),
})

/** ---------- Main schema ---------- **/

export const CreditAuditFormSchema = z
  .object({
    // Header (strict)
    reportDate: dateISO('Report date'),
    branchName: z
      .string()
      .trim()
      .min(1, 'Branch name is required')
      .max(200, 'Branch name is too long'),
    branchCode: digitsOnly('Branch code', { maxLen: 20 }), // ✅ digits only

    // Profile
    borrowerName: z
      .string()
      .trim()
      .min(1, 'Borrower name is required')
      .max(300, 'Borrower name is too long'),
    constitution: ConstitutionEnum,

    // ✅ strict 4-digit years (string because Input gives string)
    yearOfIncorporation: yearYYYY('Year of incorporation'),

    proprietorPartners: z.string().trim().max(500).default(''),

    registeredOfficeAddress: z
      .string()
      .trim()
      .min(1, 'Registered office address is required')
      .max(1500, 'Registered office address is too long'),

    factoryUnitGodownAddress: z.string().trim().max(1500).default(''),

    // ✅ digits with separators only
    accountNumbers: accountNumbersStrict('Account number(s)'),

    industryActivity: z.string().trim().max(300).default(''),

    // ✅ strict 4-digit year
    bankingWithUsSince: yearYYYY('Banking with us since'),

    proposalType: ProposalTypeEnum,
    proposalComment: z.string().trim().max(2000).default(''),

    // Snapshot (amounts optional but strict if provided)
    totalExposureFB: amountStrictOptional('Total Exposure (FB)'),
    totalExposureNFB: amountStrictOptional('Total Exposure (NFB)'),

    borrowerBrief: z.string().trim().max(5000).default(''),
    operationalPerformanceComment: z.string().trim().max(5000).default(''),

    // Checklist
    checklist: z
      .array(checklistItemSchema)
      .length(
        CREDIT_AUDIT_CHECKLIST.length,
        `Checklist must have ${CREDIT_AUDIT_CHECKLIST.length} items`
      ),

    // Problem loan
    problemLoanReview: z.string().trim().max(3000).default(''),
    problemLoanHandling: z.string().trim().max(3000).default(''),
    recoveryActions: z.string().trim().max(3000).default(''),
    anyOtherActionProposed: z.string().trim().max(3000).default(''),

    // Sign-off
    auditorName: z
      .string()
      .trim()
      .min(1, 'Auditor name is required')
      .max(200, 'Auditor name is too long'),
    auditorSignatureDate: dateISO('Signature date'),

    // If you want this mandatory, change to .min(1)
    auditorSealRef: z.string().trim().max(200).default(''),
  })
  .superRefine((v, ctx) => {
    v.checklist.forEach((item, idx) => {
      if (item.response === 'NO' && item.remark.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['checklist', idx, 'remark'],
          message: 'Remark is required when response is NO',
        })
      }
    })
  })

export type CreditAuditFormValues = z.infer<typeof CreditAuditFormSchema>
