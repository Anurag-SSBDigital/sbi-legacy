import { $api } from '@/lib/api.ts'

export type AccountDetail = {
  acctNo: string
  acctDesc: string
  custNumber: string
  telNo: string | null
  segement: string | null
  custName: string
  add1: string | null
  add2: string | null
  add3: string | null
  add4: string | null
  loanLimit: number
  intRate: number
  theoBal: number
  outstand: number
  irregAmt: number
  sanctDt: string
  emisDue: number
  emisPaid: number
  emisOvrdue: number
  currency: string
  maintBr: number
  instalAmt: number
  irrgDtString: string | null
  irrgDt: string | null
  unrealInt: number
  accrInt: number
  stress: string
  smaCodeIncipientStress: string
  ra: string
  raDate: string
  writeOffFlag: string
  writeOffAmount: number
  writeOffDate: string
  alert1: string | null
  alert2: string | null
  alert3: string | null
  branchCode: string
  crmDone: string | null
  actType: string
  status: string | null
  stockAuditAssignId: string | null
  branchName: string | null
}

type ApiResponse = {
  customer: AccountDetail | null
  deposit: null
}

const useAccountDetails = (
  accountNumber: string | number,
  enabled: boolean = true
) => {
  const { data, isLoading, error, isError } = $api.useQuery(
    'get',
    '/account/getAccountDetail',
    {
      params: { query: { acctNm: String(accountNumber) } },
    },
    { enabled }
  )

  const accountData = data as ApiResponse | undefined

  return {
    data: accountData?.customer ?? undefined,
    isLoading,
    isError,
    error,
  }
}

export default useAccountDetails

// New API deposit type (based on your sample)
// type DepositDetail = {
//   acctCd: string
//   compCd: string
//   branchCd: string
//   acctType: string
//   acctNm: string
//   typeNm: string
//   intRate: number
//   opDate: string
//   closingDate: string | null
//   amount: number
//   contact: string | null
//   provisionalBal: number
//   add1?: string | null
//   add2?: string | null
//   add3?: string | null
//   add4?: string | null
//   pinCode?: string | null
//   pts?: string | null
//   npaCd?: string | null
//   ptsNm?: string | null
//   area?: string | null
//   city?: string | null
//   district?: string | null
//   state?: string | null
//   customerId: string
//   netBalance: number
//   closeOpenStatus: string
//   colUpdFlg?: string | null
//   modifiedDt?: string | null
// }
