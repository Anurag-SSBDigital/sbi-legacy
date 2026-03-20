// src/features/section138/section138.types.ts
export type DispatchMode = 'REGD_AD' | 'UPC' | 'BY_HAND'
export type PresentationStatus = 'PRESENTED' | 'RETURNED'

export type CaseStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4' | 'STAGE_5'
export type CaseOverallStatus = 'DRAFT' | 'IN_PROGRESS' | 'CLOSED'

export type Stage1ChequePresentation = {
  borrowerName?: string
  borrowerAddress?: string
  borrowerMobile?: string

  acctNo?: string
  branchName?: string

  chequeNumber?: string
  chequeDate?: string
  chequeAmount?: number
  drawnOnBankName?: string
  bankBranchName?: string
  accountType?: string
  dateOfPresentation?: string

  presentationStatus?: PresentationStatus
  dateOfReturn?: string
  returnReason?: string
}

export type Stage2AdminApproval = {
  irregularityDate?: string
  overdueAmount?: number
  defaultFrom?: string
  defaultTo?: string
  reasonForDefault?: string

  reminderCallsMade?: boolean
  writtenNoticeIssued?: boolean
  personalVisitConducted?: boolean
  recoveryRemarks?: string

  recommendedFor138?: boolean
  recommendationRemarks?: string

  departmentId?: string
  branchId?: string

  preparedBy?: string
  verifiedBy?: string
  approvedBy?: string
  approvalDate?: string
}

export type Stage3LegalNotice = {
  noticeDate?: string
  dispatchMode?: DispatchMode
  noticeRefNo?: string

  dishonourDate?: string
  dishonourReason?: string
  chequeReturnMemoDate?: string

  paymentReceivedWithin15Days?: boolean
  paymentDate?: string
  paymentAmount?: number
  paymentRemarks?: string
}

export type Stage4CaseFiling = {
  caseFiledDate?: string
  courtName?: string
  courtType?: string
  caseNumber?: string
  complaintNumber?: string
  filingAdvocateName?: string

  amountClaimed?: number
  courtFeesPaid?: number
  advocateFees?: number

  firstHearingDate?: string
  nextHearingDate?: string
  caseStatus?: 'PENDING' | 'UNDER_TRIAL' | 'SETTLED' | 'DISMISSED'

  documents?: string[] // filenames for now
}

export type Stage5Resolution = {
  judgmentDate?: string
  decisionType?: 'CONVICTED' | 'ACQUITTED' | 'COMPOUNDED' | 'WITHDRAWN'
  finalOrderSummary?: string

  settlementAmount?: number
  amountRecovered?: number
  recoveryDate?: string
  balanceOutstanding?: number

  caseClosedDate?: string
  closureRemarks?: string
  accountUpdatedInCore?: boolean
}

export type Section138CaseRecord = {
  id: string
  createdAt: string
  updatedAt: string

  overallStatus: CaseOverallStatus
  currentStage: CaseStage

  stage1: Stage1ChequePresentation
  stage2: Stage2AdminApproval
  stage3: Stage3LegalNotice
  stage4: Stage4CaseFiling
  stage5: Stage5Resolution
}