import { z } from 'zod'

/** -----------------------------
 * JsonValue
 * ----------------------------- */
export const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue),
  ])
)

/** -----------------------------
 * ConditionV1
 * ----------------------------- */
export const ConditionV1: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      op: z.enum(['EQ', 'NE', 'GT', 'LT', 'GTE', 'LTE']),
      field: z.string().min(1),
      value: JsonValue,
    }),
    z.object({
      op: z.literal('IN'),
      field: z.string().min(1),
      value: z.array(JsonValue),
    }),
    z.object({ op: z.literal('AND'), conditions: z.array(ConditionV1).min(1) }),
    z.object({ op: z.literal('OR'), conditions: z.array(ConditionV1).min(1) }),
    z.object({ op: z.literal('NOT'), condition: ConditionV1 }),
  ])
)

/** -----------------------------
 * ValidationRuleV1
 * ----------------------------- */
export const ValidationRuleV1 = z.union([
  z.object({
    rule: z.literal('REGEX'),
    pattern: z.string(),
    message: z.string(),
  }),
  z.object({
    rule: z.literal('REQUIRED_IF'),
    condition: ConditionV1,
    message: z.string(),
  }),
  z.object({ rule: z.literal('MIN'), value: z.number(), message: z.string() }),
  z.object({ rule: z.literal('MAX'), value: z.number(), message: z.string() }),
  z.object({
    rule: z.literal('MIN_LEN'),
    value: z.number(),
    message: z.string(),
  }),
  z.object({
    rule: z.literal('MAX_LEN'),
    value: z.number(),
    message: z.string(),
  }),
])

/** -----------------------------
 * FieldV1
 * ----------------------------- */
const FieldBaseV1 = z.object({
  key: z.string().min(1),
  label: z.string().min(1),

  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),

  visibleIf: ConditionV1.optional(),
  enabledIf: ConditionV1.optional(),

  validations: z.array(ValidationRuleV1).optional(),
  defaultValue: JsonValue.optional(),
})

const Option = z.object({ label: z.string(), value: z.string() })

export const FieldV1 = z.discriminatedUnion('type', [
  FieldBaseV1.extend({
    type: z.literal('TEXT'),
    minLen: z.number().int().optional(),
    maxLen: z.number().int().optional(),
  }),
  FieldBaseV1.extend({
    type: z.literal('TEXTAREA'),
    minLen: z.number().int().optional(),
    maxLen: z.number().int().optional(),
  }),
  FieldBaseV1.extend({
    type: z.literal('NUMBER'),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  }),
  FieldBaseV1.extend({
    type: z.literal('CURRENCY'),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  FieldBaseV1.extend({ type: z.literal('DATE') }), // "YYYY-MM-DD"
  FieldBaseV1.extend({
    type: z.literal('YES_NO'),
    trueLabel: z.string().optional(),
    falseLabel: z.string().optional(),
  }),
  FieldBaseV1.extend({
    type: z.enum(['SELECT', 'RADIO']),
    options: z.array(Option).min(1),
  }),
  FieldBaseV1.extend({
    type: z.literal('USER_PICKER'),
    dataSource: z.object({
      kind: z.literal('API'),
      url: z.string().min(1),
      method: z.enum(['GET']).optional(),
      labelPath: z.string().min(1),
      valuePath: z.string().min(1),
    }),
  }),
  FieldBaseV1.extend({
    type: z.literal('TABLE'),
    columns: z
      .array(
        z.union([
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(['TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'YES_NO']),
          }),
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.literal('SELECT'),
            options: z.array(Option).min(1),
          }),
        ])
      )
      .min(1),
    minRows: z.number().int().optional(),
    maxRows: z.number().int().optional(),
  }),
  FieldBaseV1.extend({
    type: z.literal('FILE'),
    docType: z.string().min(1),
    maxFiles: z.number().int().optional(),
    accept: z.array(z.string()).optional(),
  }),
])

/** -----------------------------
 * Sections / Form / Approval
 * ----------------------------- */
export const SectionV1 = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  visibleIf: ConditionV1.optional(),
  fields: z.array(FieldV1).min(1),
})

export const PrefillRuleV1 = z.object({
  fieldKey: z.string(),
  source: z.enum([
    'SYSTEM_DATE',
    'BINDING.accountNo',
    'BINDING.customerId',
    'BINDING.branchId',
    'BINDING.departmentId',
    'BINDING.entityId',
    'BINDING.entityType',
  ]),
})

export const FormSchemaV1 = z.object({
  formKey: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  mode: z.enum(['DRAFT_AND_SUBMIT', 'SUBMIT_ONLY', 'DRAFT_ONLY']),
  prefill: z.array(PrefillRuleV1).optional(),
  sections: z.array(SectionV1).min(1),
})

export const ApprovalSchemaV1 = z.object({
  title: z.string().min(1),
  actions: z
    .array(
      z.object({
        key: z.enum(['APPROVE', 'REJECT', 'SEND_BACK']),
        label: z.string(),
        requiresComment: z.boolean().optional(),
      })
    )
    .min(1),
  fields: z.array(FieldV1).optional(),
})

export const StageMetadataV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.enum(['FORM', 'APPROVAL']),
    ui: z
      .object({
        layout: z.enum(['SINGLE_COLUMN', 'TWO_COLUMN']).optional(),
        submitLabel: z.string().optional(),
        saveDraftLabel: z.string().optional(),
      })
      .optional(),
    form: FormSchemaV1.optional(),
    approval: ApprovalSchemaV1.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'FORM' && !v.form)
      ctx.addIssue({ code: 'custom', message: 'kind=FORM requires form' })
    if (v.kind === 'APPROVAL' && !v.approval)
      ctx.addIssue({
        code: 'custom',
        message: 'kind=APPROVAL requires approval',
      })
  })

export type StageMetadataV1 = z.infer<typeof StageMetadataV1Schema>
export type FieldV1T = z.infer<typeof FieldV1>
export type SectionV1T = z.infer<typeof SectionV1>

/** -----------------------------
 * UI endpoint response schema
 * ----------------------------- */
export const StageUiResponseV1Schema = z.object({
  schemaVersion: z.literal(1),
  instanceId: z.number(),
  stageDefId: z.number(),
  stageKey: z.string(),
  stageName: z.string(),
  kind: z.enum(['FORM', 'APPROVAL']),
  metadata: StageMetadataV1Schema,
  values: z.record(z.string(), z.unknown()).default({}),
  permissions: z.object({
    canEdit: z.boolean(),
    canSaveDraft: z.boolean(),
    canSubmit: z.boolean(),
    actions: z.array(z.string()),
    taskId: z.number().optional(), // include for action calls
  }),
  documents: z
    .array(
      z.object({
        id: z.number(),
        docType: z.string(),
        url: z.string(),
        fileName: z.string().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional(),
})

export type StageUiResponseV1 = z.infer<typeof StageUiResponseV1Schema>
