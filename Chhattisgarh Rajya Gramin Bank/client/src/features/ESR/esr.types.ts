export type YesNo = "YES" | "NO";

export type ESRProductType =
  | "GENERAL"
  | "CONSTRUCTION"
  | "VEHICLE"
  | "MACHINERY"
  | "AGRICULTURE"
  | "CC_LIMIT";

export type ESRCaseType = "NORMAL" | "TAKEOVER";

export type ESRInvoice = {
  invoiceNo: string;
  invoiceDate: string; // yyyy-mm-dd
  invoiceAmount: string; // keep as string in form state
  description: string;
};

export type ESRRecord = {
  id: string; // uuid
  accountId: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // Basic
  branch: string;
  reviewDate: string;
  loanAccountNo: string;
  unitBorrowerName: string;
  proprietorPartnerDirectorName: string;
  address: string;
  purposeOfLoan: string;
  sanctionedAmount: string;
  sanctionDate: string;
  controlMonitoringDate: string;
  legalVettingDate?: string;
  disbursementDate: string;
  amountDisbursed: string;

  caseType: ESRCaseType;
  productType: ESRProductType;

  // Checklist
  correctProductOpened: YesNo;
  interestRateCorrect: YesNo;
  marginBroughtInAtDisbursement: YesNo;
  allChargesRecovered: YesNo;
  assetsLiabilitiesNotarized: YesNo;

  // Takeover (conditional)
  takeover_collateralDocsReceived?: YesNo;
  takeover_noChangeInSecurity?: YesNo;
  takeover_primaryChargeAndLienCompleted?: YesNo;
  takeover_primaryChargeDate?: string;
  takeover_lienMarkingDate?: string;
  takeover_sanctionTnCComplied?: YesNo;
  takeover_termsAndCondition?: string;

  // Sanction/docs
  sanctionTnCFullyComplied: YesNo;
  sanctionTnCDetails?: string;
  loanDocDeficiencies?: string;
  borrowerAcknowledgementObtained: YesNo;
  chargeMortgageCreationDate?: string;

  // Registration/ROC
  registrationDate?: string;
  registrationPlace?: string;
  registrationNo?: string;
  revenueRecordChargeEntryDate?: string;
  rocChargeRegistrationDate?: string;

  // Insurance
  insuranceStatusText: string;

  // End-use
  endUseDisbursementStage: "PARTIAL" | "FULL";
  invoices: ESRInvoice[];

  // Product-specific
  construction_disbursedAsPerScheduleAfterMargin?: YesNo;

  vehicle_registrationNo?: string;
  vehicle_bankHypothecationMarkedOnRC?: YesNo;
  vehicle_insuredWithBankEndorsement?: YesNo;
  vehicle_insuranceFrom?: string;
  vehicle_insuranceTo?: string;

  machinery_installationDate?: string;
  machinery_satisfactionCertificateDate?: string;
  machinery_amount?: string;

  agri_insuranceStatus?: string;
  agri_otherInfo?: string;

  cc_stockStatementObtainedAndInspectionDone?: YesNo;
  cc_stockInspectionDate?: string;

  // Remarks & sign-off
  inspectionDate?: string;
  remarksOpinion: string;
  officerName: string;
  officerDesignation: string;
  signDate: string;
};
