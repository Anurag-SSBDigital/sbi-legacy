import { z } from 'zod'

type FieldType = 'text' | 'date' | 'number' | 'textarea'
export type StageKey =
  | 'DEMAND_NOTICE_PREPARATION'
  | 'NOTICE_13_2_ISSUANCE'
  | 'CUSTOMER_RESPONSE_HANDLING'
  | 'POSSESSION_PREPARATION'
  | 'PHYSICAL_POSSESSION'
  | 'RESERVE_PRICE_DETERMINATION'
  | 'SALE_NOTICE_PREPARATION'
  | string

export type StageFormField = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  readOnly?: boolean
}

type Value = string | number | boolean

export type StageFormConfig = {
  title: string
  description?: string
  schema: z.ZodTypeAny
  defaultValues: Record<
    string,
    string | number | boolean | Record<string, Value>
  >
  fields: StageFormField[]
}

const dateField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')

/** helpers */
const optionalDateField = () =>
  z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use format YYYY-MM-DD')

const requiredText = (label: string) =>
  z.string().min(1, `${label} is required`)
const optionalText = () => z.string().optional()

export const stageFormConfigs: Record<StageKey, StageFormConfig> = {
  /* ------------------------------------------------------------------ */
  /* DEMAND_NOTICE_PREPARATION (still internal draft step)               */
  /* - removed dueDate, added statutoryPeriodDays (fixed = 60)           */
  /* ------------------------------------------------------------------ */
  DEMAND_NOTICE_PREPARATION: {
    title: 'SARFAESI Demand Notice (Draft)',
    description:
      'Draft demand notice details for the selected loan account (Section 13(2) – 60 days statutory period).',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      noticeNumber: requiredText('Notice number'),
      noticeDate: dateField('Notice date'),
      demandAmount: z.coerce
        .number({ error: 'Demand amount is required' })
        .nonnegative('Demand amount must be non-negative'),
      statutoryPeriodDays: z.coerce
        .number({ error: 'Statutory period is required' })
        .int('Must be an integer')
        .min(60, 'Must be 60 days')
        .max(60, 'Must be 60 days'),

      // ✅ derived field: allow empty initially, but validate format if present
      dueDate: optionalDateField(),
    }),
    defaultValues: {
      accountNumber: '',
      noticeNumber: '',
      noticeDate: '',
      demandAmount: 0,
      statutoryPeriodDays: 60,

      // ✅ added
      dueDate: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        placeholder: 'Loan account number',
        required: true,
        readOnly: true,
      },
      {
        name: 'noticeNumber',
        label: 'Notice Number',
        type: 'text',
        placeholder: 'NOTICE-13-2-2024-001',
        required: true,
      },
      {
        name: 'noticeDate',
        label: 'Notice Date',
        type: 'date',
        required: true,
      },
      {
        name: 'demandAmount',
        label: 'Demand Amount (as on notice date)',
        type: 'number',
        placeholder: '1500000.00',
        required: true,
      },
      {
        name: 'statutoryPeriodDays',
        label: 'Statutory Period (Days)',
        type: 'number',
        required: true,
        readOnly: true,
      },

      // ✅ show computed due date
      {
        name: 'dueDate',
        label: 'Due Date (Notice date + statutory period)',
        type: 'date',
        readOnly: true,
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* NOTICE_13_2_ISSUANCE (aligned with SarfaesiNotice13_2 entity)       */
  /* ------------------------------------------------------------------ */
  NOTICE_13_2_ISSUANCE: {
    title: 'SARFAESI Notice 13(2) Issuance & Service',
    description:
      'Capture issuance and service details for Section 13(2) notice (RPAD / publication etc.).',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      noticeNumber: requiredText('Notice number'),
      issuanceDate: dateField('Issuance date'),
      dispatchMethod: requiredText('Dispatch method'),
      dispatchDate: optionalDateField(),
      recipientType: requiredText('Recipient type'),
      serviceStatus: requiredText('Service status'),
      proofReference: optionalText(),
      servedDate: optionalDateField(),
      authorisedOfficerName: requiredText('Authorised officer name'),
      remarks: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      noticeNumber: '',
      issuanceDate: '',
      dispatchMethod: 'REGISTERED_POST',
      dispatchDate: '',
      recipientType: 'BORROWER',
      serviceStatus: 'ISSUED',
      proofReference: '',
      servedDate: '',
      authorisedOfficerName: '',
      remarks: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'noticeNumber',
        label: 'Notice Number',
        type: 'text',
        placeholder: 'NOTICE-13-2-2024-001',
        required: true,
      },
      {
        name: 'issuanceDate',
        label: 'Issuance Date',
        type: 'date',
        required: true,
      },
      {
        name: 'dispatchMethod',
        label: 'Dispatch Method',
        type: 'text',
        placeholder: 'REGISTERED_POST / HAND_DELIVERY / COURIER / NEWSPAPER',
        required: true,
      },
      {
        name: 'dispatchDate',
        label: 'Dispatch Date',
        type: 'date',
      },
      {
        name: 'recipientType',
        label: 'Recipient Type',
        type: 'text',
        placeholder: 'BORROWER / GUARANTOR / LEGAL_HEIR',
        required: true,
      },
      {
        name: 'serviceStatus',
        label: 'Service Status',
        type: 'text',
        placeholder: 'ISSUED / SERVED / RETURNED / REFUSED / PUBLISHED',
        required: true,
      },
      {
        name: 'servedDate',
        label: 'Served Date',
        type: 'date',
      },
      {
        name: 'proofReference',
        label: 'Proof Reference',
        type: 'text',
        placeholder: 'RPAD receipt / AD card / Newspaper name+date',
      },
      {
        name: 'authorisedOfficerName',
        label: 'Authorised Officer Name',
        type: 'text',
        placeholder: 'Name of Authorised Officer',
        required: true,
      },
      {
        name: 'remarks',
        label: 'Remarks',
        type: 'textarea',
        placeholder: 'Returned unserved / refused / affixture details etc.',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* CUSTOMER_RESPONSE_HANDLING (aligned with SarfaesiCustomerResponse)  */
  /* ------------------------------------------------------------------ */
  CUSTOMER_RESPONSE_HANDLING: {
    title: 'SARFAESI Customer Response (Rule 3A)',
    description:
      "Record customer objections/representations and bank's reply with reasons (Rule 3A).",
    schema: z.object({
      accountNumber: requiredText('Account number'),
      responseDate: dateField('Response date'),
      responseType: requiredText('Response type'),
      responseDetails: requiredText('Response details'),
      bankReply: optionalText(),
      bankReplyDate: optionalDateField(),
      replyDispatchMethod: optionalText(),
      replyProofReference: optionalText(),
      decision: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      responseDate: '',
      responseType: 'OBJECTION',
      responseDetails: '',
      bankReply: '',
      bankReplyDate: '',
      replyDispatchMethod: 'REGISTERED_POST',
      replyProofReference: '',
      decision: 'REJECTED',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'responseDate',
        label: 'Customer Response Date',
        type: 'date',
        required: true,
      },
      {
        name: 'responseType',
        label: 'Response Type',
        type: 'text',
        placeholder: 'OBJECTION / REPRESENTATION / REQUEST / CONSENT',
        required: true,
      },
      {
        name: 'responseDetails',
        label: 'Response Details',
        type: 'textarea',
        placeholder: "Customer's objection / representation details",
        required: true,
      },
      {
        name: 'decision',
        label: 'Decision',
        type: 'text',
        placeholder: 'ACCEPTED / REJECTED / PARTIAL',
      },
      {
        name: 'bankReply',
        label: 'Bank Reply (Reasons)',
        type: 'textarea',
        placeholder:
          "Bank's examination and reasons for acceptance/non-acceptance",
      },
      {
        name: 'bankReplyDate',
        label: 'Bank Reply Date',
        type: 'date',
      },
      {
        name: 'replyDispatchMethod',
        label: 'Reply Dispatch Method',
        type: 'text',
        placeholder: 'REGISTERED_POST / HAND_DELIVERY / COURIER / EMAIL',
      },
      {
        name: 'replyProofReference',
        label: 'Reply Proof Reference',
        type: 'text',
        placeholder: 'Receipt / acknowledgement / email ref',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* POSSESSION_PREPARATION (aligned with SarfaesiPossession entity)     */
  /* - removed inspections                                               */
  /* ------------------------------------------------------------------ */
  POSSESSION_PREPARATION: {
    title: 'SARFAESI Possession Notice',
    description:
      'Record possession notice issuance details (Rule 8) and Section 14 readiness.',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      possessionNoticeNumber: requiredText('Possession notice number'),
      possessionNoticeDate: dateField('Possession notice date'),
      possessionType: requiredText('Possession type'),
      possessionTakenDate: optionalDateField(),
      securedAssetDescription: requiredText('Secured asset description'),
      place: optionalText(),
      section14Invoked: z.coerce.boolean().optional(),
      dmCmmOrderNumber: optionalText(),
      dmCmmOrderDate: optionalDateField(),
      panchnamaReference: optionalText(),
      inventoryReference: optionalText(),
      witnessDetails: optionalText(),
      enforcementAgency: optionalText(),
      publicationOrAffixtureProof: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      possessionNoticeNumber: '',
      possessionNoticeDate: '',
      possessionType: 'SYMBOLIC',
      possessionTakenDate: '',
      securedAssetDescription: '',
      place: '',
      section14Invoked: false,
      dmCmmOrderNumber: '',
      dmCmmOrderDate: '',
      panchnamaReference: '',
      inventoryReference: '',
      witnessDetails: '',
      enforcementAgency: '',
      publicationOrAffixtureProof: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'possessionNoticeNumber',
        label: 'Possession Notice Number',
        type: 'text',
        placeholder: 'POSS-2024-001',
        required: true,
      },
      {
        name: 'possessionNoticeDate',
        label: 'Possession Notice Date',
        type: 'date',
        required: true,
      },
      {
        name: 'possessionType',
        label: 'Possession Type',
        type: 'text',
        placeholder: 'SYMBOLIC / PHYSICAL',
        required: true,
      },
      {
        name: 'securedAssetDescription',
        label: 'Secured Asset Description',
        type: 'textarea',
        placeholder: 'Property/asset description (as per notice schedule)',
        required: true,
      },
      {
        name: 'place',
        label: 'Place',
        type: 'text',
        placeholder: 'Town/City/Village',
      },
      {
        name: 'possessionTakenDate',
        label: 'Possession Taken Date',
        type: 'date',
      },
      {
        name: 'section14Invoked',
        label: 'Section 14 Invoked',
        type: 'text',
        placeholder: 'true / false',
      },
      {
        name: 'dmCmmOrderNumber',
        label: 'DM/CMM Order Number',
        type: 'text',
        placeholder: 'Order reference (if Section 14 invoked)',
      },
      {
        name: 'dmCmmOrderDate',
        label: 'DM/CMM Order Date',
        type: 'date',
      },
      {
        name: 'publicationOrAffixtureProof',
        label: 'Publication / Affixture Proof',
        type: 'text',
        placeholder: 'Newspaper name+date / affixture memo ref',
      },
      {
        name: 'panchnamaReference',
        label: 'Panchnama Reference',
        type: 'text',
        placeholder: 'Document ref / upload id',
      },
      {
        name: 'inventoryReference',
        label: 'Inventory Reference',
        type: 'text',
        placeholder: 'Document ref / upload id',
      },
      {
        name: 'witnessDetails',
        label: 'Witness Details',
        type: 'textarea',
        placeholder: 'Names/addresses of panch witnesses',
      },
      {
        name: 'enforcementAgency',
        label: 'Enforcement Agency',
        type: 'text',
        placeholder: 'Local Police Station / Agency',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* PHYSICAL_POSSESSION (aligned with SarfaesiPhysicalPossession entity) */
  /* ------------------------------------------------------------------ */
  PHYSICAL_POSSESSION: {
    title: 'SARFAESI Physical Possession',
    description:
      'Record details of physical possession (Panchnama, Inventory, Section 14, witnesses).',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      possessionDate: dateField('Possession date'),
      possessionReport: requiredText('Possession report'),
      panchnamaDetails: optionalText(),
      inventoryDetails: optionalText(),
      section14Invoked: z.coerce.boolean().optional(),
      dmCmmOrderNumber: optionalText(),
      dmCmmOrderDate: optionalDateField(),
      enforcementAgency: optionalText(),
      witnessDetails: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      possessionDate: '',
      possessionReport: '',
      panchnamaDetails: '',
      inventoryDetails: '',
      section14Invoked: false,
      dmCmmOrderNumber: '',
      dmCmmOrderDate: '',
      enforcementAgency: '',
      witnessDetails: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'possessionDate',
        label: 'Physical Possession Date',
        type: 'date',
        required: true,
      },
      {
        name: 'possessionReport',
        label: 'Possession Report',
        type: 'textarea',
        placeholder: 'Detailed report by Authorised Officer',
        required: true,
      },
      {
        name: 'panchnamaDetails',
        label: 'Panchnama Details',
        type: 'textarea',
        placeholder: 'Panchnama summary / reference',
      },
      {
        name: 'inventoryDetails',
        label: 'Inventory Details',
        type: 'textarea',
        placeholder: 'Inventory summary / reference',
      },
      {
        name: 'section14Invoked',
        label: 'Section 14 Invoked',
        type: 'text',
        placeholder: 'true / false',
      },
      {
        name: 'dmCmmOrderNumber',
        label: 'DM/CMM Order Number',
        type: 'text',
      },
      {
        name: 'dmCmmOrderDate',
        label: 'DM/CMM Order Date',
        type: 'date',
      },
      {
        name: 'enforcementAgency',
        label: 'Enforcement Agency',
        type: 'text',
        placeholder: 'Local Police Station / Agency',
      },
      {
        name: 'witnessDetails',
        label: 'Witness Details',
        type: 'textarea',
        placeholder: 'Names/addresses of panch witnesses',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* RESERVE_PRICE_DETERMINATION (aligned with SarfaesiReservePrice entity) */
  /* ------------------------------------------------------------------ */
  RESERVE_PRICE_DETERMINATION: {
    title: 'SARFAESI Reserve Price (Determination & Approval)',
    description:
      'Record valuation details, reserve price determination, and committee approval (if available).',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      marketValue: z.coerce
        .number({ error: 'Market value is required' })
        .nonnegative('Market value must be non-negative'),
      realisableValue: z.coerce
        .number()
        .nonnegative('Realisable value must be non-negative')
        .optional(),
      reservePrice: z.coerce
        .number({ error: 'Reserve price is required' })
        .nonnegative('Reserve price must be non-negative'),
      valuationBasis: requiredText('Valuation basis'),
      valuerName: requiredText('Valuer name'),
      valuerRegistrationNo: optionalText(),
      valuationDate: dateField('Valuation date'),
      priceJustification: optionalText(),
      approved: z.coerce.boolean().optional(),
      approvalDate: optionalDateField(),
      approvalAuthority: optionalText(),
      approvalMembers: optionalText(),
      approvalRemarks: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      marketValue: 0,
      realisableValue: 0,
      reservePrice: 0,
      valuationBasis: 'Registered Valuer Report',
      valuerName: '',
      valuerRegistrationNo: '',
      valuationDate: '',
      priceJustification: '',
      approved: false,
      approvalDate: '',
      approvalAuthority: '',
      approvalMembers: '',
      approvalRemarks: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'marketValue',
        label: 'Market Value',
        type: 'number',
        placeholder: '2000000.00',
        required: true,
      },
      {
        name: 'realisableValue',
        label: 'Realisable Value',
        type: 'number',
        placeholder: '1800000.00',
      },
      {
        name: 'reservePrice',
        label: 'Reserve Price',
        type: 'number',
        placeholder: '1600000.00',
        required: true,
      },
      {
        name: 'valuationBasis',
        label: 'Valuation Basis',
        type: 'text',
        placeholder: 'Registered Valuer Report / Market comparison / etc.',
        required: true,
      },
      {
        name: 'valuerName',
        label: 'Valuer Name',
        type: 'text',
        placeholder: 'ABC Valuers Pvt Ltd',
        required: true,
      },
      {
        name: 'valuerRegistrationNo',
        label: 'Valuer Registration No.',
        type: 'text',
        placeholder: 'IBBI/REG/XXXX or approved valuer reg no',
      },
      {
        name: 'valuationDate',
        label: 'Valuation Date',
        type: 'date',
        required: true,
      },
      {
        name: 'priceJustification',
        label: 'Price Justification',
        type: 'textarea',
        placeholder:
          'Reasoning for reserve price (marketability, condition, etc.)',
      },
      {
        name: 'approved',
        label: 'Approved',
        type: 'text',
        placeholder: 'true / false',
      },
      {
        name: 'approvalAuthority',
        label: 'Approval Authority',
        type: 'text',
        placeholder: 'ROCC / HOCC',
      },
      {
        name: 'approvalDate',
        label: 'Approval Date',
        type: 'date',
      },
      {
        name: 'approvalMembers',
        label: 'Approval Members',
        type: 'textarea',
        placeholder: 'Committee member names/designations',
      },
      {
        name: 'approvalRemarks',
        label: 'Approval Remarks',
        type: 'textarea',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* SALE_NOTICE_PREPARATION (aligned with SarfaesiSaleNotice entity)    */
  /* ------------------------------------------------------------------ */
  SALE_NOTICE_PREPARATION: {
    title: 'SARFAESI Sale Notice',
    description:
      'Prepare sale notice and publication details (Annexure-14/15 + 12).',
    schema: z.object({
      accountNumber: requiredText('Account number'),
      noticeNumber: requiredText('Notice number'),
      noticeDate: dateField('Notice date'),
      saleDate: dateField('Sale date'),
      lastDateBid: dateField('Last date for bid submission'),
      earnestMoney: z.coerce
        .number({ error: 'Earnest money is required' })
        .nonnegative('Earnest money must be non-negative'),
      earnestMoneyPercentage: z.coerce
        .number()
        .nonnegative('EMD% must be non-negative')
        .optional(),
      propertyDescription: requiredText('Property description'),
      auctionTerms: requiredText('Auction terms'),
      auctionPlatform: optionalText(),
      bankWebsiteUrl: optionalText(),
      publicationDate: optionalDateField(),
      publicationDetails: optionalText(),
    }),
    defaultValues: {
      accountNumber: '',
      noticeNumber: '',
      noticeDate: '',
      saleDate: '',
      lastDateBid: '',
      earnestMoney: 0,
      earnestMoneyPercentage: 0,
      propertyDescription: '',
      auctionTerms:
        'As is where is / As is what is basis. Terms as per SARFAESI.',
      auctionPlatform: '',
      bankWebsiteUrl: '',
      publicationDate: '',
      publicationDetails: '',
    },
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        readOnly: true,
      },
      {
        name: 'noticeNumber',
        label: 'Sale Notice Number',
        type: 'text',
        placeholder: 'SALE-2024-001',
        required: true,
      },
      {
        name: 'noticeDate',
        label: 'Sale Notice Date',
        type: 'date',
        required: true,
      },
      {
        name: 'saleDate',
        label: 'Auction / Sale Date',
        type: 'date',
        required: true,
      },
      {
        name: 'lastDateBid',
        label: 'Last Date for Bid Submission',
        type: 'date',
        required: true,
      },
      {
        name: 'earnestMoney',
        label: 'Earnest Money (EMD)',
        type: 'number',
        placeholder: '160000.00',
        required: true,
      },
      {
        name: 'earnestMoneyPercentage',
        label: 'EMD Percentage',
        type: 'number',
        placeholder: '10',
      },
      {
        name: 'propertyDescription',
        label: 'Property Description',
        type: 'textarea',
        placeholder: 'Full property/asset description as per schedule',
        required: true,
      },
      {
        name: 'auctionTerms',
        label: 'Auction Terms',
        type: 'textarea',
        placeholder:
          'As-is-where-is, payment timelines, bidder eligibility, etc.',
        required: true,
      },
      {
        name: 'auctionPlatform',
        label: 'Auction Platform',
        type: 'text',
        placeholder: 'E-auction vendor / portal name',
      },
      {
        name: 'bankWebsiteUrl',
        label: 'Bank Website URL',
        type: 'text',
        placeholder: 'Website where notice/terms are published',
      },
      {
        name: 'publicationDate',
        label: 'Publication Date',
        type: 'date',
      },
      {
        name: 'publicationDetails',
        label: 'Publication Details',
        type: 'textarea',
        placeholder: 'Newspaper name(s), language, edition, etc.',
      },
    ],
  },
}
