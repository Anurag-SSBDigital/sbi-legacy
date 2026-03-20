export interface CreditFacility {
  type: string
  amount: number
  presentOs: number
  overdue: number
  primeSecurity: number
}

export interface SisterConcernCreditFacility {
  bankName: string
  typeOfAdvance: string
  limitSanction: number
  outstanding: number
}

export interface PromoterDetail {
  name: string
  types_of_applicant: string
  relation_applicant: string
}

export interface GuarantorDetail {
  name: string
}

export interface CollateralSecurity {
  propertyLocation: string
  value: number
}

export interface FinancialDetails {
  acc_year_end: number[]
  cash_and_bank_balance: string[]
  fixed_assets: string[]
  investments: string[]
  investments_long_term: string[]
  sundry_debtors: string[]
  other_current_assets: string[]
  opening_stock: string[]
  net_sales: string[]
  net_purchase: string[]
  closing_stock: string[]
  gross_profit: string[]
  depreciation: string[]
  net_profit: string[]
  capital: string[]
  all_secured_term_loan: string[]
  cash_credit: string[]
  unsecured_loans: string[]
  sundry_creditors: string[]
  other_current_liabilities: string[]
  other_liabilties: string[]
  total_interest_paid_yearly: string[]
  annual_installment_amount: string[]
  net_profit_sales_ratios: string[]
  current_ratio: string[]
  debt_equity_ratio: string[]
  dscr: string[]
}

export interface CustomerDetails {
  acctCd?: string
  typeNm?: string
  customerId?: string
  contact?: string
  ptsNm?: string
  acctNm?: string
  add1?: string
  add2?: string
  area?: string
  city?: string
  sanctionedAmount?: number
  intRate?: number
  amount?: number
  opDate?: string
  npaCd?: number
  branchCd?: string
  acctType?: string
  alert1?: string
  alert2?: string
  alert3?: string
  district?: string
  constitution?: string
}

/* ---------- the root response ---------- */
export interface CreditAppraisalResponse {
  creditFacilities: CreditFacility[]
  status_code: number
  constitution: string
  sisterConcernCreditFacilities: SisterConcernCreditFacility[]
  lead_no: number
  branch_status: string
  promoter_details: PromoterDetail[]
  loan_amount: number
  branch_code: string
  guarantor_details: GuarantorDetail[]
  collateralSecurities: CollateralSecurity[]
  nature_of_business: string
  branch_id: number
  branch_name: string
  financial_details: FinancialDetails
  name: string
  customerDetails: CustomerDetails
  status: string
  sanctioning_authority: string
}

/* ---------- convenience aliases ---------- */
