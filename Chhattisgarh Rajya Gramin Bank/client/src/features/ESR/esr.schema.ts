import { z } from "zod";

const dateString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => !Number.isNaN(Date.parse(v)), `${label} must be a valid date`);

const optionalDateString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), `${label} must be a valid date`);

const amountString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^[0-9]+(\.[0-9]{1,2})?$/, `${label} must be a valid amount`);

const optionalAmountString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[0-9]+(\.[0-9]{1,2})?$/.test(v), `${label} must be a valid amount`);

export const YesNoEnum = z.enum(["YES", "NO"]);
export const ProductTypeEnum = z.enum([
  "GENERAL",
  "CONSTRUCTION",
  "VEHICLE",
  "MACHINERY",
  "AGRICULTURE",
  "CC_LIMIT",
]);
export const CaseTypeEnum = z.enum(["NORMAL", "TAKEOVER"]);

export const InvoiceSchema = z.object({
  invoiceNo: z.string().trim().min(1, "Bill/Invoice No. is required"),
  invoiceDate: dateString("Invoice Date"),
  invoiceAmount: amountString("Invoice Amount"),
  description: z.string().trim().min(3, "Description is required"),
});

export const ESRFormSchema = z
  .object({
    branch: z.string().trim().min(2, "Branch is required"),
    reviewDate: dateString("Review Date"),
    loanAccountNo: z.string().trim().min(5, "Loan Account No. is required"),
    unitBorrowerName: z.string().trim().min(2, "Name of Unit/Borrower is required"),
    proprietorPartnerDirectorName: z.string().trim().min(2, "Name is required"),
    address: z.string().trim().min(10, "Address must be at least 10 characters"),
    purposeOfLoan: z.string().trim().min(3, "Purpose of loan is required"),
    takeover_termsAndCondition: z.string().trim().min(10, "Address must be at least 10 characters"),
    sanctionedAmount: amountString("Sanctioned Amount"),
    sanctionDate: dateString("Sanction Date"),
    controlMonitoringDate: dateString("Control/Monitoring Date"),
    legalVettingDate: optionalDateString("Legal Vetting Date"),
    disbursementDate: dateString("Date of Disbursement"),
    amountDisbursed: amountString("Amount Disbursed"),

    

    caseType: CaseTypeEnum,
    productType: ProductTypeEnum,

    correctProductOpened: YesNoEnum,
    interestRateCorrect: YesNoEnum,
    marginBroughtInAtDisbursement: YesNoEnum,
    allChargesRecovered: YesNoEnum,
    assetsLiabilitiesNotarized: YesNoEnum,

    takeover_collateralDocsReceived: YesNoEnum.optional(),
    takeover_noChangeInSecurity: YesNoEnum.optional(),
    takeover_primaryChargeAndLienCompleted: YesNoEnum.optional(),
    takeover_primaryChargeDate: optionalDateString("Primary Charge Date"),
    takeover_lienMarkingDate: optionalDateString("Lien Marking Date"),
    takeover_sanctionTnCComplied: YesNoEnum.optional(),

    sanctionTnCFullyComplied: YesNoEnum,
    sanctionTnCDetails: z.string().trim().optional(),
    loanDocDeficiencies: z.string().trim().optional(),
    borrowerAcknowledgementObtained: YesNoEnum,
    chargeMortgageCreationDate: optionalDateString("Creation of charge/mortgage date"),

    registrationDate: optionalDateString("Registration Date"),
    registrationPlace: z.string().trim().optional(),
    registrationNo: z.string().trim().optional(),
    revenueRecordChargeEntryDate: optionalDateString("Charge entry in revenue records date"),
    rocChargeRegistrationDate: optionalDateString("ROC charge registration date"),

    insuranceStatusText: z.string().trim().min(3, "Insurance status details are required"),

    endUseDisbursementStage: z.enum(["PARTIAL", "FULL"]),
    invoices: z.array(InvoiceSchema).min(1, "At least 1 invoice is required"),

    construction_disbursedAsPerScheduleAfterMargin: YesNoEnum.optional(),

    vehicle_registrationNo: z.string().trim().optional(),
    vehicle_bankHypothecationMarkedOnRC: YesNoEnum.optional(),
    vehicle_insuredWithBankEndorsement: YesNoEnum.optional(),
    vehicle_insuranceFrom: optionalDateString("Vehicle insurance From"),
    vehicle_insuranceTo: optionalDateString("Vehicle insurance To"),

    machinery_installationDate: optionalDateString("Installation Date"),
    machinery_satisfactionCertificateDate: optionalDateString("Satisfaction Certificate Date"),
    machinery_amount: optionalAmountString("Machinery Amount"),

    agri_insuranceStatus: z.string().trim().optional(),
    agri_otherInfo: z.string().trim().optional(),

    cc_stockStatementObtainedAndInspectionDone: YesNoEnum.optional(),
    cc_stockInspectionDate: optionalDateString("Stock Inspection Date"),

    inspectionDate: optionalDateString("Inspection date"),
    remarksOpinion: z.string().trim().min(3, "Remarks/Opinion is required"),

    officerName: z.string().trim().min(2, "Officer name is required"),
    officerDesignation: z.string().trim().min(2, "Designation is required"),
    signDate: dateString("Sign Date"),
  })
  .superRefine((data, ctx) => {
    if (data.caseType === "TAKEOVER") {
      const requiredKeys: Array<keyof typeof data> = [
        "takeover_collateralDocsReceived",
        "takeover_noChangeInSecurity",
        "takeover_primaryChargeAndLienCompleted",
        "takeover_sanctionTnCComplied",
      ];
      for (const k of requiredKeys) {
        if (!data[k]) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [k], message: "Required for Takeover cases" });
        }
      }
    }

    if (data.productType === "VEHICLE") {
      if (!data.vehicle_registrationNo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle_registrationNo"], message: "Vehicle Registration No. is required" });
      }
      if (!data.vehicle_bankHypothecationMarkedOnRC) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle_bankHypothecationMarkedOnRC"], message: "Required for Vehicle loans" });
      }
      if (!data.vehicle_insuredWithBankEndorsement) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle_insuredWithBankEndorsement"], message: "Required for Vehicle loans" });
      }
      if (!data.vehicle_insuranceFrom) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle_insuranceFrom"], message: "Insurance From date is required" });
      }
      if (!data.vehicle_insuranceTo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle_insuranceTo"], message: "Insurance To date is required" });
      }
    }

    if (data.productType === "CONSTRUCTION" && !data.construction_disbursedAsPerScheduleAfterMargin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["construction_disbursedAsPerScheduleAfterMargin"], message: "Required for Construction cases" });
    }

    if (data.productType === "MACHINERY" && !data.machinery_installationDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["machinery_installationDate"], message: "Installation date is required for Machinery cases" });
    }

    if (data.productType === "CC_LIMIT") {
      if (!data.cc_stockStatementObtainedAndInspectionDone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cc_stockStatementObtainedAndInspectionDone"], message: "Required for CC limit cases" });
      }
      if (!data.cc_stockInspectionDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cc_stockInspectionDate"], message: "Stock inspection date is required for CC limit cases" });
      }
    }
  });

export type ESRFormValues = z.infer<typeof ESRFormSchema>;
