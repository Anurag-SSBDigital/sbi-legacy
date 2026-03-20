// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { format, parse } from 'date-fns'
import { Controller, Path, useFieldArray, useForm } from 'react-hook-form'
import { useParams } from '@tanstack/react-router'
import {
  IconCalculator,
  IconDownload,
  IconEdit,
  IconMinus,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { valueTypeCasting } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import PaginatedTable from '@/components/paginated-table.tsx'
import AccountNoCell from '@/components/table/cells/account-no-cell.tsx'
import './styles.css'
import { CreditAppraisalResponse } from './types.ts'

// TypeScript Interfaces
interface CreditFacility {
  type: string
  margin: string
  amount: string
  interestRate: string
  primeSecurity: string
  value: string
  insurance: string
  presentOs: string
  overdue: boolean
  lastReviewRenewal: string
}

interface PersonalGuarantee {
  name: string
}

interface CollateralSecurity {
  propertyLocation: string
  value: string
}

interface OtherBankCreditFacility {
  bankName: string
  branch: string
  typeOfAdvance: string
  amountOfLimit: string
  outstanding: string
  remarks: string
}

interface SisterConcernCreditFacility {
  bankName: string
  branch: string
  typeOfAdvance: string
  limitSanction: string
  outstanding: string
  remarks: string
}

interface FinancialParameter {
  id?: string // Added for useFieldArray compatibility or manual key management
  name: string
  values: { diff: number; [year: string]: string | number }
  new?: boolean // Made optional to track newly added parameters
}

interface Ratio {
  [year: string]: string
}

interface FormData {
  borrowerName: string
  accountNumber: string
  constitution: string
  natureOfBusiness: string
  limitFacilitiesSince: string
  creditFacilities: CreditFacility[]
  personalGuarantees: PersonalGuarantee[]
  collateralSecurities: CollateralSecurity[]
  otherBankCreditFacilities: OtherBankCreditFacility[]
  sisterConcernCreditFacilities: SisterConcernCreditFacility[]
  marketStatus: string
  operationsExperience: string
  lastInspectionDate: string
  inspectingOfficer: string
  inspectionObservations: string
  years: { year: string }[]
  financialParameters: FinancialParameter[]
  ratios: {
    currentRatio: Ratio
    debtEquityRatio: Ratio
    totalLiabilities: Ratio
    totalAssets: Ratio
    dscr: Ratio
    netProfitNetsalesRatio: Ratio
  }
  auditIrregularities: string
  remarks: string
}

interface LoanReviewHistory {
  id: string
  accountNumber: string
  borrowerName: string
  constitution: string
  remarks: string
  createdTime: string
}

interface LeadFormData {
  accountNo: string
  leadNo: string
  type: string
}

const backendUrl = import.meta.env.VITE_APP_API_URL

// Loader Component
const Loader = () => (
  <div className='flex items-center justify-center py-8'>
    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
  </div>
)

// DeleteConfirmationDialog Component
interface DeleteConfirmationDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText: string
  cancelText: string
  loading: boolean
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  loading,
}) => (
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
    <DialogContent className='sm:max-w-md'>
      <DialogTitle className='text-lg font-semibold text-gray-900'>
        {title}
      </DialogTitle>
      <DialogDescription className='text-gray-600'>{message}</DialogDescription>
      <DialogFooter className='mt-4'>
        <Button variant='outline' onClick={onCancel} className='mr-2'>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className='bg-red-600 hover:bg-red-700'
        >
          {loading ? 'Deleting...' : confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default function LoanReview() {
  const { accountId } = useParams({
    from: '/_authenticated/(searching)/loan-review/$accountId',
  })
  const [formVisible, setFormVisible] = useState<boolean>(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [openConfirmDialog, setOpenConfirmDialog] = useState<FormData | null>(
    null
  )
  const [message, setMessage] = useState<string>('')

  const defaultValues: FormData = {
    borrowerName: '',
    accountNumber: accountId || '',
    constitution: '',
    natureOfBusiness: '',
    limitFacilitiesSince: '',
    creditFacilities: [
      {
        type: '',
        margin: '',
        amount: '',
        interestRate: '',
        primeSecurity: '',
        value: '',
        insurance: '',
        presentOs: '',
        overdue: false,
        lastReviewRenewal: '',
      },
    ],
    personalGuarantees: [{ name: '' }],
    collateralSecurities: [{ propertyLocation: '', value: '' }],
    otherBankCreditFacilities: [
      {
        bankName: '',
        branch: '',
        typeOfAdvance: '',
        amountOfLimit: '',
        outstanding: '',
        remarks: '',
      },
    ],
    sisterConcernCreditFacilities: [
      {
        bankName: '',
        branch: '',
        typeOfAdvance: '',
        limitSanction: '',
        outstanding: '',
        remarks: '',
      },
    ],
    marketStatus: '',
    operationsExperience: '',
    lastInspectionDate: '',
    inspectingOfficer: '',
    inspectionObservations: '',
    years: [],
    financialParameters: [
      { name: 'OPENING STOCK', values: { diff: 0 } },
      { name: 'NET SALES', values: { diff: 0 } },
      { name: 'NET PURCHASES', values: { diff: 0 } },
      { name: 'LOANS FROM RELATIVES', values: { diff: 0 } },
      { name: 'BANK LOANS', values: { diff: 0 } },
      { name: 'CLOSING STOCKS', values: { diff: 0 } },
      { name: 'GROSS PROFIT', values: { diff: 0 } },
      { name: 'DEPRECIATION', values: { diff: 0 } },
      { name: 'NET PROFIT', values: { diff: 0 } },
      { name: 'CAPITAL', values: { diff: 0 } },
      { name: 'ALL SECURED TERM LOAN', values: { diff: 0 } },
      { name: 'CASH CREDIT/ OD', values: { diff: 0 } },
      { name: 'UNSECURED LOANS', values: { diff: 0 } },
      { name: 'SUNDRY CREDITORS', values: { diff: 0 } },
      { name: 'OTHER CURRENT LIABILITIES', values: { diff: 0 } },
      { name: 'OTHER CURRENT ASSETS', values: { diff: 0 } },
      { name: 'FIXED ASSETS', values: { diff: 0 } },
      { name: 'INVESTMENTS', values: { diff: 0 } },
      { name: 'SUNDRY DEBTORS', values: { diff: 0 } },
      { name: 'CASH/BANK BALANCE', values: { diff: 0 } },
      { name: 'TOTAL INTEREST PAID AMOUNT DURING YEAR', values: { diff: 0 } },
      {
        name: 'ACTUAL ALL EMI PAYABLE DURING YEAR FOR EXISTING TERM LOANS (Maximum 12 EMI)',
        values: { diff: 0 },
      },
      { name: 'DEPRICIATION', values: { diff: 0 } },
    ],
    ratios: {
      currentRatio: {},
      debtEquityRatio: {},
      totalLiabilities: {},
      totalAssets: {},
      dscr: {},
      netProfitNetsalesRatio: {},
    },
    auditIrregularities: '',
    remarks: '',
  }

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({ defaultValues })

  const {
    fields: creditFacilityFields,
    append: appendCreditFacility,
    remove: removeCreditFacility,
  } = useFieldArray({ control, name: 'creditFacilities' })

  const {
    fields: personalGuaranteeFields,
    append: appendPersonalGuarantee,
    remove: removePersonalGuarantee,
  } = useFieldArray({ control, name: 'personalGuarantees' })

  const {
    fields: collateralSecuritiesFields,
    append: appendCollateralSecurity,
    remove: removeCollateralSecurity,
  } = useFieldArray({ control, name: 'collateralSecurities' })

  const {
    fields: otherBankCreditFields,
    append: appendOtherBankCredit,
    remove: removeOtherBankCredit,
  } = useFieldArray({ control, name: 'otherBankCreditFacilities' })

  const {
    fields: sisterConcernFields,
    append: appendSisterConcern,
    remove: removeSisterConcern,
  } = useFieldArray({ control, name: 'sisterConcernCreditFacilities' })

  const {
    fields: yearFields,
    append: appendYear,
    remove: removeYear,
  } = useFieldArray({ control, name: 'years' })

  const [parameterFields = [], years = [], ratios = defaultValues.ratios] =
    watch(['financialParameters', 'years', 'ratios'])

  const removeFinancialParam = (index: number) => {
    const updatedValues = [...parameterFields]
    updatedValues.splice(index, 1)
    setValue('financialParameters', updatedValues)
  }

  const addFinancialParam = () => {
    const values: { diff: number; [key: string]: string | number } = {
      diff: 0,
    }
    years.forEach((year) => {
      values[year.year] = '0'
    })
    const updatedValues = [...parameterFields, { name: '', values, new: true }]
    setValue('financialParameters', updatedValues as FinancialParameter[])
  }

  const getValue = (name: string, year: string): number => {
    const param = parameterFields.find((p) => p.name === name)
    return param && param.values[year] !== undefined
      ? parseFloat(param.values[year] as string)
      : 0
  }

  // Ratio Calculations
  const calculateCurrentRatio = () => {
    yearFields.forEach((year) => {
      const numerator =
        getValue('SUNDRY DEBTORS', year.year) +
        getValue('INVESTMENTS', year.year) +
        getValue('OTHER CURRENT ASSETS', year.year)
      const denominator =
        getValue('SUNDRY CREDITORS', year.year) +
        getValue('OTHER CURRENT LIABILITIES', year.year)
      setValue(
        `ratios.currentRatio.${year.year}` as Path<FormData>,
        denominator !== 0 ? (numerator / denominator).toFixed(2) : 'N/A'
      )
    })
  }

  const calculateDebtEquityRatio = () => {
    yearFields.forEach((year) => {
      const numerator =
        getValue('LOANS FROM RELATIVES', year.year) +
        getValue('BANK LOANS', year.year)
      const denominator = getValue('CAPITAL', year.year)
      setValue(
        `ratios.debtEquityRatio.${year.year}` as Path<FormData>,
        denominator !== 0 ? (numerator / denominator).toFixed(2) : 'N/A'
      )
    })
  }

  const calculateTotalLiabilities = () => {
    yearFields.forEach((year) => {
      const total =
        getValue('CAPITAL', year.year) +
        getValue('ALL SECURED TERM LOAN', year.year) +
        getValue('CASH CREDIT/ OD', year.year) +
        getValue('UNSECURED LOANS', year.year) +
        getValue('SUNDRY CREDITORS', year.year) +
        getValue('OTHER CURRENT LIABILITIES', year.year)
      setValue(
        `ratios.totalLiabilities.${year.year}` as Path<FormData>,
        total.toString()
      )
    })
  }

  const calculateTotalAsset = () => {
    yearFields.forEach((year) => {
      const total =
        getValue('FIXED ASSETS', year.year) +
        getValue('INVESTMENTS', year.year) +
        getValue('SUNDRY DEBTORS', year.year) +
        getValue('CLOSING STOCKS', year.year) +
        getValue('CASH/BANK BALANCE', year.year)
      setValue(
        `ratios.totalAssets.${year.year}` as Path<FormData>,
        total.toString()
      )
    })
  }

  const calculateDSCR = () => {
    yearFields.forEach((year) => {
      const numerator =
        getValue('NET PROFIT', year.year) +
        getValue('DEPRICIATION', year.year) +
        getValue('TOTAL INTEREST PAID AMOUNT DURING YEAR', year.year)
      const denominator = getValue(
        'ACTUAL ALL EMI PAYABLE DURING YEAR FOR EXISTING TERM LOANS (Maximum 12 EMI)',
        year.year
      )
      setValue(
        `ratios.dscr.${year.year}` as Path<FormData>,
        denominator !== 0 ? (numerator / denominator).toFixed(2) : 'N/A'
      )
    })
  }

  const calculateNetprofitNetsalesRatio = () => {
    yearFields.forEach((year) => {
      const netProfit = getValue('NET PROFIT', year.year)
      const netSales = getValue('NET SALES', year.year)
      setValue(
        `ratios.netProfitNetsalesRatio.${year.year}` as Path<FormData>,
        netSales !== 0 ? ((netProfit / netSales) * 100).toFixed(2) : 'N/A'
      )
    })
  }

  const calculateAllRatios = () => {
    calculateCurrentRatio()
    calculateDebtEquityRatio()
    calculateTotalLiabilities()
    calculateTotalAsset()
    calculateDSCR()
    calculateNetprofitNetsalesRatio()
  }

  const handleAddYear = (newYear: string) => {
    if (yearFields.length === 2) {
      toast.warning('Max year limit reached')
      return
    }
    if (!newYear.trim() || yearFields.some((y) => y.year === newYear)) return
    appendYear({ year: newYear })
    parameterFields.forEach((_, paramIndex) => {
      const currentValues =
        getValues(
          `financialParameters.${paramIndex}.values` as Path<FormData>
        ) || {}
      setValue(
        `financialParameters.${paramIndex}.values` as Path<FormData>,
        {
          ...(currentValues as Record<string, string>),
          [newYear]: '0',
          diff: 0,
        } as FinancialParameter['values']
      )
    })
  }

  const handleYearRemove = (yearIndex: number) => {
    const removedYear = yearFields[yearIndex].year
    removeYear(yearIndex)
    parameterFields.forEach((_, paramIndex) => {
      const currentValues =
        getValues(
          `financialParameters.${paramIndex}.values` as Path<FormData>
        ) || {}
      const paramValues = { ...(currentValues as Record<string, string>) }
      delete paramValues[removedYear]
      setValue(
        `financialParameters.${paramIndex}.values` as Path<FormData>,
        paramValues
      )
    })
    const updatedRatios = { ...ratios }
    const ratioKeys = [
      'currentRatio',
      'debtEquityRatio',
      'dscr',
      'netProfitNetsalesRatio',
      'totalAssets',
      'totalLiabilities',
    ] as const
    ratioKeys.forEach((key: (typeof ratioKeys)[number]) => {
      if (updatedRatios[key]?.[removedYear]) {
        delete updatedRatios[key][removedYear]
      }
    })
    setValue('ratios', updatedRatios)
  }

  const checkMissingFields = (data: FormData): boolean => {
    const missingFields: string[] = []
    if (!data.personalGuarantees[0]?.name)
      missingFields.push('Personal Guarantees')
    if (
      !data.collateralSecurities[0]?.propertyLocation &&
      !data.collateralSecurities[0]?.value
    )
      missingFields.push('Collateral Securities')
    if (
      !data.sisterConcernCreditFacilities[0]?.bankName &&
      !data.sisterConcernCreditFacilities[0]?.branch &&
      !data.sisterConcernCreditFacilities[0]?.limitSanction &&
      !data.sisterConcernCreditFacilities[0]?.outstanding &&
      !data.sisterConcernCreditFacilities[0]?.remarks
    )
      missingFields.push('Sister Concern Credit Facilities')
    if (
      !data.otherBankCreditFacilities[0]?.bankName &&
      !data.otherBankCreditFacilities[0]?.branch &&
      !data.otherBankCreditFacilities[0]?.amountOfLimit &&
      !data.otherBankCreditFacilities[0]?.outstanding &&
      !data.otherBankCreditFacilities[0]?.remarks
    )
      missingFields.push('Other Bank Credit Facilities')
    if (missingFields.length > 0) {
      setMessage(`Do you want to continue without ${missingFields.join(', ')}?`)
      return true
    }
    return false
  }

  const {
    data: loanReviewHistoryResponse,
    error: loanReviewHistoryError,
    refetch: refetchLoanReviewHistory,
  } = $api.useQuery(
    'get',
    '/loan-review/get',
    {
      params: {
        query: { acctNo: accountId ?? '' },
      },
    },
    { enabled: Boolean(accountId) }
  )
  const loanReviewHistory: LoanReviewHistory[] = Array.isArray(
    loanReviewHistoryResponse
  )
    ? (loanReviewHistoryResponse as LoanReviewHistory[])
    : Array.isArray(
          (loanReviewHistoryResponse as { data?: unknown } | undefined)?.data
        )
      ? ((loanReviewHistoryResponse as { data?: unknown[] })
          .data as LoanReviewHistory[])
      : []

  useEffect(() => {
    if (!loanReviewHistoryError) return
    toast.error(
      (loanReviewHistoryError as Error).message || 'An error occurred'
    )
  }, [loanReviewHistoryError])

  const createLoanReviewMutation = $api.useMutation(
    'post',
    '/loan-review/create'
  )
  const updateLoanReviewMutation = $api.useMutation(
    'put',
    '/loan-review/update/{id}'
  )

  const leadDataMutation = $api.useMutation('get', '/loan-review/fetchData')

  const deleteLoanReviewMutation = $api.useMutation(
    'delete',
    '/loan-review/delete/{id}'
  )

  const onSubmit = async (data: FormData) => {
    if (!openConfirmDialog) {
      if (checkMissingFields(data)) {
        setOpenConfirmDialog(data)
        return
      }
    }
    setOpenConfirmDialog(null)
    try {
      const result = editing
        ? await updateLoanReviewMutation.mutateAsync({
            body: data,
            params: {
              path: { id: Number(editing) },
              header: { Authorization: '' },
            },
          })
        : await createLoanReviewMutation.mutateAsync({
            body: data,
            params: { header: { Authorization: '' } },
          })

      toast.success((result as { message?: string })?.message || 'Submitted')
      await refetchLoanReviewHistory()
      reset(defaultValues)
      setEditing(null)
    } catch (error) {
      toast.error((error as Error).message || 'An error occurred')
    }
  }

  const { handleSubmit: handleSubmit2, control: control2 } =
    useForm<LeadFormData>({
      defaultValues: { accountNo: accountId || '', leadNo: '', type: '' },
    })

  const [yearsList, setYearsList] = useState<
    CreditAppraisalResponse['financial_details']['acc_year_end']
  >([])
  const [financialDataFetched, setFinancialDataFetched] = useState<
    CreditAppraisalResponse['financial_details'] | null
  >(null)
  const [fetchYearLoading, setFetchYearLoading] = useState<boolean>(false)

  const getLeadData = (data: LeadFormData) => {
    leadDataMutation.mutate(
      {
        params: {
          query: {
            acctNo: data.accountNo,
            lead_no: data.leadNo,
            type: data.type,
          },
        },
      },
      {
        onSuccess: (result) => {
          const leadData = result as CreditAppraisalResponse
          setFormVisible(true)
          setYearsList(leadData?.financial_details?.acc_year_end || [])
          setFinancialDataFetched(leadData?.financial_details)
          reset({
            ...defaultValues,
            constitution: leadData?.customerDetails?.constitution || '',
            borrowerName: leadData?.customerDetails?.acctNm || '',
            personalGuarantees: leadData?.guarantor_details || [{ name: '' }],
            natureOfBusiness: leadData?.nature_of_business || '',
            limitFacilitiesSince: leadData?.customerDetails?.opDate || '',
            creditFacilities:
              leadData?.creditFacilities || defaultValues.creditFacilities,
            sisterConcernCreditFacilities:
              leadData?.sisterConcernCreditFacilities ||
              defaultValues.sisterConcernCreditFacilities,
            collateralSecurities:
              leadData?.collateralSecurities ||
              defaultValues.collateralSecurities,
          })
          toast.success('Lead data fetched.')
        },
        onError: (error) => {
          toast.error((error as Error).message || 'An error occurred')
        },
      }
    )
  }

  const [yearToFetch, setYeartoFetch] = useState<string | undefined>(undefined)

  const fetchFinancialParams = () => {
    if (yearFields.length === 2) {
      toast.warning('Max year limit reached')
      return
    }
    if (!yearToFetch || yearFields.some((y) => y.year === yearToFetch)) {
      toast.warning('Year is already in table or invalid')
      return
    }
    setFetchYearLoading(true)
    // console.log({
    //   yearToFetch,
    //   acc_year_end: financialDataFetched?.acc_year_end,
    // })
    const index = (
      financialDataFetched?.acc_year_end as string[] | undefined
    )?.findIndex((y) => String(y) === String(yearToFetch))
    if (index === -1) {
      toast.error('Year not found in financial data')
      setFetchYearLoading(false)
      return
    }
    appendYear({ year: yearToFetch })
    const params = [
      'opening_stock',
      'net_sales',
      'net_purchase',
      'loans_from_relatives',
      'bank_loans',
      'closing_stock',
      'gross_profit',
      'depreciation',
      'net_profit',
      'capital',
      'all_secured_term_loan',
      'cash_credit',
      'unsecured_loans',
      'sundry_creditors',
      'other_current_liabilities',
      'other_current_assets',
      'fixed_assets',
      'investments',
      'sundry_debtors',
      'cash_and_bank_balance',
    ]
    params.forEach((key, idx) => {
      const updatedValues = {
        ...parameterFields[idx].values,
        [yearToFetch]: financialDataFetched?.[key]?.[index] || '0',
      }
      setValue(
        `financialParameters.${idx}.values` as Path<FormData>,
        updatedValues
      )
    })
    setYeartoFetch(undefined)
    calculateCurrentRatio()
    calculateDebtEquityRatio()
    setFetchYearLoading(false)
  }

  const deleteRecord = async (id: string) => {
    try {
      const result = await deleteLoanReviewMutation.mutateAsync({
        params: { path: { id: Number(id) } },
      })
      toast.success(
        (result as { message?: string })?.message || 'Record Deleted'
      )
      setOpenDialog(null)
      await refetchLoanReviewHistory()
    } catch (error) {
      toast.error((error as Error).message || 'An error occurred')
    }
  }

  const editRecord = (data: LoanReviewHistory) => {
    toast.info('Values are updated in below form')
    setEditing(data.id)
    // Assuming backend returns full FormData when fetching by ID would be ideal.
    // For now, cast with caution since LoanReviewHistory lacks full FormData fields.
    reset({ ...defaultValues, ...data } as FormData)
  }

  const downloadExcel = (id: string, type: 'excel' | 'pdf') => {
    const url = `${backendUrl}/loan-review/download/${type}/${id}`
    window.open(url, '_blank')
  }

  const columns = [
    {
      key: 'accountNumber' as const,
      label: 'Account No',
      render: (value: string) => (
        <AccountNoCell value={(value ?? '') as string} />
      ),
    },
    { key: 'borrowerName' as const, label: 'Borrower Name' },
    { key: 'constitution' as const, label: 'Constitution' },
    { key: 'remarks' as const, label: 'Remarks' },
    // { key: 'createdTime' as const, label: 'Created Time' },
    {
      key: 'createdTime' as const,
      label: 'Created Date',
      render: (value) => (value ? format(new Date(value), 'dd-MM-yyyy') : '—'),
    },

    {
      key: 'id' as const,
      label: 'Actions',
      render: (_value: string, row: LoanReviewHistory) => (
        <div className='flex gap-2'>
          <Button
            variant='destructive'
            onClick={() => setOpenDialog(row.id)}
            className='flex items-center'
          >
            <IconTrash className='mr-1 h-4 w-4' /> Delete
          </Button>
          <Button onClick={() => editRecord(row)} className='flex items-center'>
            <IconEdit className='mr-1 h-4 w-4' /> Edit
          </Button>
          <Button
            onClick={() => downloadExcel(row.id, 'excel')}
            className='flex items-center'
          >
            <IconDownload className='mr-1 h-4 w-4' /> Excel
          </Button>
          <Button
            onClick={() => downloadExcel(row.id, 'pdf')}
            className='flex items-center'
          >
            <IconDownload className='mr-1 h-4 w-4' /> PDF
          </Button>
        </div>
      ),
    },
  ]

  return (
    <MainWrapper>
      <div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
        {isSubmitting ? (
          <Loader />
        ) : (
          <>
            <Card className='mb-8 border border-gray-200/70 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-center text-2xl font-semibold text-[var(--primary)]'>
                  Fetch Lead Data
                </CardTitle>
              </CardHeader>

              <CardContent className='pt-2'>
                <form onSubmit={handleSubmit2(getLeadData)} className='mx-auto'>
                  {/* Grid fields */}
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {/* Account Number */}
                    <div className='rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm'>
                      <div className='flex items-center justify-between'>
                        <Label
                          htmlFor='accountNo'
                          className='text-sm font-medium text-gray-800'
                        >
                          Account Number
                        </Label>
                        <span className='rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600'>
                          Read only
                        </span>
                      </div>
                      <Controller
                        name='accountNo'
                        control={control2}
                        render={({ field }) => (
                          <Input
                            id='accountNo'
                            {...field}
                            value={valueTypeCasting(field.value)}
                            disabled
                            placeholder='Account Number'
                            className='mt-2 bg-gray-100 font-bold focus-visible:ring-2 focus-visible:ring-blue-500'
                          />
                        )}
                      />
                      <p className='mt-1.5 text-xs text-gray-500'>
                        Auto-filled from the selected lead.
                      </p>
                    </div>

                    {/* Type */}
                    <div className='rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm'>
                      <div className='flex items-center gap-2'>
                        <Label
                          htmlFor='type'
                          className="text-sm font-medium text-gray-800 after:ml-1 after:text-red-600 after:content-['*']"
                        >
                          Type
                        </Label>
                      </div>
                      <Controller
                        name='type'
                        control={control2}
                        rules={{ required: 'Type is required' }}
                        render={({ field, fieldState: { error } }) => (
                          <div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger
                                id='type'
                                className='mt-2 w-full focus:ring-2 focus:ring-blue-500'
                              >
                                <SelectValue placeholder='Select type...' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='msme'>MSME</SelectItem>
                                <SelectItem value='retail'>Retail</SelectItem>
                              </SelectContent>
                            </Select>
                            {error ? (
                              <p className='mt-1.5 text-xs text-red-600'>
                                {error.message}
                              </p>
                            ) : (
                              <p className='mt-1.5 text-xs text-gray-500'>
                                Choose the segment this lead belongs to.
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    {/* Lead Number */}
                    <div className='rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm'>
                      <div className='flex items-center gap-2'>
                        <Label
                          htmlFor='leadNo'
                          className="text-sm font-medium text-gray-800 after:ml-1 after:text-red-600 after:content-['*']"
                        >
                          Lead Number
                        </Label>
                      </div>
                      <Controller
                        name='leadNo'
                        control={control2}
                        rules={{ required: 'Lead Number is required' }}
                        render={({ field, fieldState: { error } }) => (
                          <div>
                            <Input
                              id='leadNo'
                              {...field}
                              value={valueTypeCasting(field.value)}
                              placeholder='Enter lead number'
                              className='mt-2 focus-visible:ring-2 focus-visible:ring-blue-500'
                            />
                            {error ? (
                              <p className='mt-1.5 text-xs text-red-600'>
                                {error.message}
                              </p>
                            ) : (
                              <p className='mt-1.5 text-xs text-gray-500'>
                                Provide the exact lead number.
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='mt-6 flex items-center justify-end'>
                    <Button
                      type='submit'
                      className='w-full rounded-lg px-6 py-2.5 md:w-auto'
                    >
                      Search
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {formVisible && (
              <>
                {/* Loan Review History */}
                <Card className='mb-8 shadow-md'>
                  <CardHeader>
                    <CardTitle className='text-2xl font-semibold text-[var(--primary)]'>
                      Loan Review History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-2'>
                    <PaginatedTable
                      data={loanReviewHistory}
                      columns={columns}
                      initialRowsPerPage={10}
                      emptyMessage='No Data'
                      tableTitle=''
                      showSearch={true}
                      // Removed className if not supported by PaginatedTableProps
                    />
                  </CardContent>
                </Card>

                {/* Loan Review Form */}
                <div className='space-y-8'>
                  {/* Borrower Information */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Borrower Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <div>
                          <Label
                            htmlFor='borrowerName'
                            className='text-gray-700'
                          >
                            Borrower Name
                          </Label>
                          <Controller
                            name='borrowerName'
                            control={control}
                            rules={{ required: 'Borrower Name is required' }}
                            render={({ field, fieldState: { error } }) => (
                              <div>
                                <Input
                                  id='borrowerName'
                                  {...field}
                                  value={valueTypeCasting(field.value)}
                                  className='mt-1'
                                  placeholder='Enter borrower name'
                                />
                                {error && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='accountNumber'
                            className='text-gray-700'
                          >
                            Account Number
                          </Label>
                          <Controller
                            name='accountNumber'
                            control={control}
                            render={({ field }) => (
                              <Input
                                id='accountNumber'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                disabled
                                className='mt-1 bg-gray-100'
                                placeholder='Account Number'
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='constitution'
                            className='text-gray-700'
                          >
                            Constitution
                          </Label>
                          <Controller
                            name='constitution'
                            control={control}
                            rules={{ required: 'Constitution is required' }}
                            render={({ field, fieldState: { error } }) => (
                              <div>
                                <Input
                                  id='constitution'
                                  {...field}
                                  value={valueTypeCasting(field.value)}
                                  className='mt-1'
                                  placeholder='Enter constitution'
                                />
                                {error && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='natureOfBusiness'
                            className='text-gray-700'
                          >
                            Nature of Business
                          </Label>
                          <Controller
                            name='natureOfBusiness'
                            control={control}
                            rules={{
                              required: 'Nature of Business is required',
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <div>
                                <Input
                                  id='natureOfBusiness'
                                  {...field}
                                  value={valueTypeCasting(field.value)}
                                  className='mt-1'
                                  placeholder='Enter nature of business'
                                />
                                {error && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='limitFacilitiesSince'
                            className='text-gray-700'
                          >
                            Limit Facilities Since
                          </Label>
                          <Controller
                            name='limitFacilitiesSince'
                            control={control}
                            rules={{
                              required: 'Limit Facilities Since is required',
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <div>
                                <Input
                                  id='limitFacilitiesSince'
                                  {...field}
                                  value={valueTypeCasting(field.value)}
                                  type='date'
                                  className='mt-1'
                                />
                                {error && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credit Facilities */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Credit Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader>
                            <TableRow className='bg-gray-100 dark:bg-gray-900'>
                              <TableHead>Type</TableHead>
                              <TableHead>Margin</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Interest Rate (%)</TableHead>
                              <TableHead>Prime Security</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Insurance</TableHead>
                              <TableHead>Present OS</TableHead>
                              <TableHead>Overdue</TableHead>
                              <TableHead>Last Review/Renewal</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditFacilityFields.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.type`}
                                    className='sr-only'
                                  >
                                    Type
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.type` as Path<FormData>
                                    }
                                    control={control}
                                    rules={{ required: 'Type is required' }}
                                    render={({
                                      field,
                                      fieldState: { error },
                                    }) => (
                                      <div>
                                        <Input
                                          id={`creditFacilities.${index}.type`}
                                          {...field}
                                          value={valueTypeCasting(field.value)}
                                          placeholder='Type'
                                        />
                                        {error && (
                                          <p className='mt-1 text-sm text-red-500'>
                                            {error.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.margin`}
                                    className='sr-only'
                                  >
                                    Margin
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.margin` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.margin`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Margin'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.amount`}
                                    className='sr-only'
                                  >
                                    Amount
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.amount` as Path<FormData>
                                    }
                                    control={control}
                                    rules={{ required: 'Amount is required' }}
                                    render={({
                                      field,
                                      fieldState: { error },
                                    }) => (
                                      <div>
                                        <Input
                                          id={`creditFacilities.${index}.amount`}
                                          {...field}
                                          value={valueTypeCasting(field.value)}
                                          type='number'
                                          step='0.01'
                                          placeholder='Amount'
                                          onInput={(e) => {
                                            const el = e.currentTarget
                                            if (el.value.includes('.')) {
                                              const [int, dec] =
                                                el.value.split('.')
                                              if (dec && dec.length > 2) {
                                                el.value = `${int}.${dec.slice(0, 2)}`
                                              }
                                            }
                                          }}
                                        />
                                        {error && (
                                          <p className='mt-1 text-sm text-red-500'>
                                            {error.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.interestRate`}
                                    className='sr-only'
                                  >
                                    Interest Rate
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.interestRate` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.interestRate`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Interest Rate'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.primeSecurity`}
                                    className='sr-only'
                                  >
                                    Prime Security
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.primeSecurity` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.primeSecurity`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Prime Security'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.value`}
                                    className='sr-only'
                                  >
                                    Value
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.value` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.value`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Value'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.insurance`}
                                    className='sr-only'
                                  >
                                    Insurance
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.insurance` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.insurance`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Insurance'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.presentOs`}
                                    className='sr-only'
                                  >
                                    Present OS
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.presentOs` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.presentOs`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Present OS'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.overdue`}
                                    className='sr-only'
                                  >
                                    Overdue
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.overdue` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Checkbox
                                        id={`creditFacilities.${index}.overdue`}
                                        checked={field.value as boolean}
                                        onCheckedChange={field.onChange}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`creditFacilities.${index}.lastReviewRenewal`}
                                    className='sr-only'
                                  >
                                    Last Review/Renewal
                                  </Label>
                                  <Controller
                                    name={
                                      `creditFacilities.${index}.lastReviewRenewal` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`creditFacilities.${index}.lastReviewRenewal`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='date'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {index > 0 && (
                                    <Button
                                      variant='outline'
                                      onClick={() =>
                                        removeCreditFacility(index)
                                      }
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          onClick={() =>
                            appendCreditFacility({
                              type: '',
                              margin: '',
                              amount: '',
                              interestRate: '',
                              primeSecurity: '',
                              value: '',
                              insurance: '',
                              presentOs: '',
                              overdue: false,
                              lastReviewRenewal: '',
                            })
                          }
                          className='mt-4'
                        >
                          <IconPlus className='h-4 w-4' /> Add Credit Facility
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Guarantees */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Personal Guarantees
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader>
                            <TableRow className='bg-gray-100 dark:bg-gray-900'>
                              <TableHead>Guarantee Name</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {personalGuaranteeFields.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`personalGuarantees.${index}.name`}
                                    className='sr-only'
                                  >
                                    Guarantee Name
                                  </Label>
                                  <Controller
                                    name={
                                      `personalGuarantees.${index}.name` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`personalGuarantees.${index}.name`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder={`Guarantee ${index + 1}`}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {index > 0 && (
                                    <Button
                                      variant='outline'
                                      onClick={() =>
                                        removePersonalGuarantee(index)
                                      }
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          onClick={() => appendPersonalGuarantee({ name: '' })}
                          className='mt-4'
                        >
                          <IconPlus className='h-4 w-4' /> Add Personal
                          Guarantee
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Collateral Securities */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Collateral Securities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader>
                            <TableRow className='bg-gray-100 dark:bg-gray-900'>
                              <TableHead>Property Location</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {collateralSecuritiesFields.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`collateralSecurities.${index}.propertyLocation`}
                                    className='sr-only'
                                  >
                                    Property Location
                                  </Label>
                                  <Controller
                                    name={
                                      `collateralSecurities.${index}.propertyLocation` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`collateralSecurities.${index}.propertyLocation`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Property Location'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`collateralSecurities.${index}.value`}
                                    className='sr-only'
                                  >
                                    Value
                                  </Label>
                                  <Controller
                                    name={
                                      `collateralSecurities.${index}.value` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`collateralSecurities.${index}.value`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Value'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {index > 0 && (
                                    <Button
                                      variant='outline'
                                      onClick={() =>
                                        removeCollateralSecurity(index)
                                      }
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          onClick={() =>
                            appendCollateralSecurity({
                              propertyLocation: '',
                              value: '',
                            })
                          }
                          className='mt-4'
                        >
                          <IconPlus className='h-4 w-4' /> Add Collateral
                          Security
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Other Bank Credit Facilities */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Other Bank Credit Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader>
                            <TableRow className='bg-gray-100 dark:bg-gray-900'>
                              <TableHead>Bank Name</TableHead>
                              <TableHead>Branch</TableHead>
                              <TableHead>Type of Advance</TableHead>
                              <TableHead>Amount of Limit</TableHead>
                              <TableHead>Outstanding</TableHead>
                              <TableHead>Remarks</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {otherBankCreditFields.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.bankName`}
                                    className='sr-only'
                                  >
                                    Bank Name
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.bankName` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.bankName`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Bank Name'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.branch`}
                                    className='sr-only'
                                  >
                                    Branch
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.branch` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.branch`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Branch'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.typeOfAdvance`}
                                    className='sr-only'
                                  >
                                    Type of Advance
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.typeOfAdvance` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.typeOfAdvance`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Type of Advance'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.amountOfLimit`}
                                    className='sr-only'
                                  >
                                    Amount of Limit
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.amountOfLimit` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.amountOfLimit`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Amount'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.outstanding`}
                                    className='sr-only'
                                  >
                                    Outstanding
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.outstanding` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.outstanding`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Outstanding'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`otherBankCreditFacilities.${index}.remarks`}
                                    className='sr-only'
                                  >
                                    Remarks
                                  </Label>
                                  <Controller
                                    name={
                                      `otherBankCreditFacilities.${index}.remarks` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`otherBankCreditFacilities.${index}.remarks`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Remarks'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {index > 0 && (
                                    <Button
                                      variant='outline'
                                      onClick={() =>
                                        removeOtherBankCredit(index)
                                      }
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          onClick={() =>
                            appendOtherBankCredit({
                              bankName: '',
                              branch: '',
                              typeOfAdvance: '',
                              amountOfLimit: '',
                              outstanding: '',
                              remarks: '',
                            })
                          }
                          className='mt-4'
                        >
                          <IconPlus className='h-4 w-4' /> Add Other Bank Credit
                          Facility
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sister Concern Credit Facilities */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Sister Concern Credit Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader>
                            <TableRow className='bg-gray-100 dark:bg-gray-900'>
                              <TableHead>Bank Name</TableHead>
                              <TableHead>Branch</TableHead>
                              <TableHead>Type of Advance</TableHead>
                              <TableHead>Limit Sanction</TableHead>
                              <TableHead>Outstanding</TableHead>
                              <TableHead>Remarks</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sisterConcernFields.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.bankName`}
                                    className='sr-only'
                                  >
                                    Bank Name
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.bankName` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.bankName`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Bank Name'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.branch`}
                                    className='sr-only'
                                  >
                                    Branch
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.branch` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.branch`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Branch'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.typeOfAdvance`}
                                    className='sr-only'
                                  >
                                    Type of Advance
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.typeOfAdvance` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.typeOfAdvance`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Type of Advance'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.limitSanction`}
                                    className='sr-only'
                                  >
                                    Limit Sanction
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.limitSanction` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.limitSanction`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Limit'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.outstanding`}
                                    className='sr-only'
                                  >
                                    Outstanding
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.outstanding` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.outstanding`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        type='number'
                                        step='0.01'
                                        placeholder='Outstanding'
                                        onInput={(e) => {
                                          const el = e.currentTarget
                                          if (el.value.includes('.')) {
                                            const [int, dec] =
                                              el.value.split('.')
                                            if (dec && dec.length > 2) {
                                              el.value = `${int}.${dec.slice(0, 2)}`
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Label
                                    htmlFor={`sisterConcernCreditFacilities.${index}.remarks`}
                                    className='sr-only'
                                  >
                                    Remarks
                                  </Label>
                                  <Controller
                                    name={
                                      `sisterConcernCreditFacilities.${index}.remarks` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`sisterConcernCreditFacilities.${index}.remarks`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Remarks'
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {index > 0 && (
                                    <Button
                                      variant='outline'
                                      onClick={() => removeSisterConcern(index)}
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          onClick={() =>
                            appendSisterConcern({
                              bankName: '',
                              branch: '',
                              typeOfAdvance: '',
                              limitSanction: '',
                              outstanding: '',
                              remarks: '',
                            })
                          }
                          className='mt-4'
                        >
                          <IconPlus className='h-4 w-4' /> Add Sister Concern
                          Credit Facility
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <div>
                          <Label
                            htmlFor='marketStatus'
                            className='text-gray-700'
                          >
                            Market Status
                          </Label>
                          <Controller
                            name='marketStatus'
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id='marketStatus'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                className='mt-1'
                                placeholder='Describe market status'
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='operationsExperience'
                            className='text-gray-700'
                          >
                            Operations Experience
                          </Label>
                          <Controller
                            name='operationsExperience'
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id='operationsExperience'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                className='mt-1'
                                placeholder='Describe operations experience'
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='lastInspectionDate'
                            className='text-gray-700'
                          >
                            Last Inspection Date
                          </Label>
                          <Controller
                            name='lastInspectionDate'
                            control={control}
                            render={({ field }) => (
                              <Input
                                id='lastInspectionDate'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                type='date'
                                className='mt-1'
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor='inspectingOfficer'
                            className='text-gray-700'
                          >
                            Inspecting Officer
                          </Label>
                          <Controller
                            name='inspectingOfficer'
                            control={control}
                            render={({ field }) => (
                              <Input
                                id='inspectingOfficer'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                className='mt-1'
                                placeholder='Enter inspecting officer'
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className='mt-6'>
                        <Label
                          htmlFor='inspectionObservations'
                          className='text-gray-700'
                        >
                          Inspection Observations
                        </Label>
                        <Controller
                          name='inspectionObservations'
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              id='inspectionObservations'
                              {...field}
                              value={valueTypeCasting(field.value)}
                              className='mt-1'
                              placeholder='Enter inspection observations'
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Parameters */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Financial Parameters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='mb-6 flex flex-col gap-4 md:flex-row'>
                        <div className='flex gap-2'>
                          <Label htmlFor='financialYear' className='sr-only'>
                            Select Financial Year
                          </Label>
                          <Select
                            value={yearToFetch}
                            onValueChange={(v) => setYeartoFetch(v)}
                          >
                            <SelectTrigger
                              id='financialYear'
                              className='w-full'
                            >
                              <SelectValue placeholder='Select Year' />
                            </SelectTrigger>
                            <SelectContent>
                              {yearsList.map((year) => (
                                <SelectItem key={year} value={`${year}`}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={fetchFinancialParams}
                            disabled={fetchYearLoading}
                            className='hover:'
                          >
                            {fetchYearLoading ? 'Fetching...' : 'Fetch'}
                          </Button>
                        </div>
                        <div className='flex gap-2'>
                          <Label htmlFor='new-year-input' className='sr-only'>
                            Add New Year
                          </Label>
                          <Input
                            id='new-year-input'
                            type='date'
                            className='w-40'
                          />
                          <Button
                            onClick={() => {
                              const newYearInput = document.getElementById(
                                'new-year-input'
                              ) as HTMLInputElement
                              const newYear = newYearInput.value
                              if (!newYear) {
                                toast.info('Please select date')
                                return
                              }
                              const date = parse(
                                newYear,
                                'yyyy-MM-dd',
                                new Date()
                              )
                              const formattedDate = format(date, 'dd-MM-yyyy')
                              handleAddYear(formattedDate)
                              newYearInput.value = ''
                            }}
                            className=''
                          >
                            <IconPlus className='h-4 w-4' /> Add Year
                          </Button>
                        </div>
                      </div>
                      <div className='overflow-x-auto'>
                        <Table className='min-w-full'>
                          <TableHeader className='sticky top-0 bg-gray-100 dark:bg-gray-900'>
                            <TableRow>
                              <TableHead className='font-semibold'>
                                Parameters
                              </TableHead>
                              {yearFields.map((yearField, index) => (
                                <TableHead
                                  key={yearField.id}
                                  className='font-semibold'
                                >
                                  <div className='flex items-center justify-between'>
                                    {yearField.year}
                                    <Button
                                      variant='ghost'
                                      onClick={() => handleYearRemove(index)}
                                      className='text-red-600 hover:text-red-800'
                                    >
                                      <IconMinus className='h-4 w-4' />
                                    </Button>
                                  </div>
                                </TableHead>
                              ))}
                              <TableHead className='font-semibold'>
                                Difference
                              </TableHead>
                              <TableHead className='font-semibold'>
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parameterFields.map((param, paramIndex) => (
                              <TableRow
                                key={paramIndex}
                                className='hover:bg-gray-100 hover:dark:bg-gray-900'
                              >
                                <TableCell>
                                  <Label
                                    htmlFor={`financialParameters.${paramIndex}.name`}
                                    className='sr-only'
                                  >
                                    Parameter Name
                                  </Label>
                                  <Controller
                                    name={
                                      `financialParameters.${paramIndex}.name` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`financialParameters.${paramIndex}.name`}
                                        {...field}
                                        value={valueTypeCasting(field.value)}
                                        placeholder='Parameter Name'
                                        readOnly
                                      />
                                    )}
                                  />
                                </TableCell>
                                {yearFields.map((yearField) => (
                                  <TableCell key={yearField.id}>
                                    <Label
                                      htmlFor={`financialParameters.${paramIndex}.values.${yearField.year}`}
                                      className='sr-only'
                                    >
                                      Value for {yearField.year}
                                    </Label>
                                    <Controller
                                      name={
                                        `financialParameters.${paramIndex}.values.${yearField.year}` as Path<FormData>
                                      }
                                      control={control}
                                      render={({ field }) => (
                                        <Input
                                          id={`financialParameters.${paramIndex}.values.${yearField.year}`}
                                          {...field}
                                          value={valueTypeCasting(field.value)}
                                          type='number'
                                          step='0.01'
                                          placeholder='0'
                                          onChange={(e) => {
                                            let valStr = e.target.value ?? ''
                                            if (valStr.startsWith('.'))
                                              valStr = '0' + valStr
                                            const [int = '', dec = ''] =
                                              valStr.split('.')
                                            if (dec && dec.length > 2)
                                              valStr = `${int}.${dec.slice(0, 2)}`
                                            e.currentTarget.value = valStr
                                            field.onChange(valStr)
                                            const editedValue =
                                              parseFloat(valStr) || 0
                                            const otherYear = yearFields.find(
                                              (y) => y.year !== yearField.year
                                            )?.year
                                            const otherValue = otherYear
                                              ? parseFloat(
                                                  (getValues(
                                                    `financialParameters.${paramIndex}.values.${otherYear}` as Path<FormData>
                                                  ) as string) || '0'
                                                )
                                              : 0

                                            const diff = otherYear
                                              ? editedValue - otherValue
                                              : editedValue

                                            setValue(
                                              `financialParameters.${paramIndex}.values.diff` as Path<FormData>,
                                              diff
                                            )
                                          }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Label
                                    htmlFor={`financialParameters.${paramIndex}.values.diff`}
                                    className='sr-only'
                                  >
                                    Difference
                                  </Label>
                                  {/* <Controller
                                    name={
                                      `financialParameters.${paramIndex}.values.diff` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => (
                                      <Input
                                        id={`financialParameters.${paramIndex}.values.diff`}
                                        {...field}
                                        disabled
                                        className='bg-gray-100'
                                        value={(field.value as string) ?? 0}
                                      />
                                    )}
                                  /> */}
                                  <Controller
                                    name={
                                      `financialParameters.${paramIndex}.values.diff` as Path<FormData>
                                    }
                                    control={control}
                                    render={({ field }) => {
                                      const val = Number.parseFloat(
                                        String(field.value ?? 0)
                                      )
                                      const display = Number.isFinite(val)
                                        ? val.toFixed(2)
                                        : '0.00'

                                      return (
                                        <Input
                                          id={`financialParameters.${paramIndex}.values.diff`}
                                          {...field}
                                          disabled
                                          className='bg-gray-100'
                                          value={display}
                                          inputMode='decimal'
                                        />
                                      )
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {param.new && (
                                    <Button
                                      variant='destructive'
                                      onClick={() =>
                                        removeFinancialParam(paramIndex)
                                      }
                                      className='flex items-center'
                                    >
                                      <IconTrash className='mr-2 h-4 w-4' />{' '}
                                      Remove
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Current Ratio row */}
                            <TableRow>
                              <TableCell>Current Ratio (CA / CL)</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(
                                    ratios?.currentRatio?.[year.year],
                                    '0.00'
                                  )}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>

                            {/* Debt Equity */}
                            <TableRow>
                              <TableCell>Debt Equity Ratio</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(
                                    ratios?.debtEquityRatio?.[year.year],
                                    '0.00'
                                  )}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>

                            {/* Total Liability */}
                            <TableRow>
                              <TableCell>Total Liability</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(
                                    ratios?.totalLiabilities?.[year.year],
                                    '0.00'
                                  )}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>

                            {/* Total Assets */}
                            <TableRow>
                              <TableCell>Total Assets</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(
                                    ratios?.totalAssets?.[year.year],
                                    '0.00'
                                  )}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>

                            {/* DSCR */}
                            <TableRow>
                              <TableCell>D.S.C.R</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(ratios?.dscr?.[year.year], '0.00')}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>

                            {/* NP / Net Sales */}
                            <TableRow>
                              <TableCell>Net Profit / Net Sales</TableCell>
                              {yearFields.map((year) => (
                                <TableCell key={year.id}>
                                  {format2dp(
                                    ratios?.netProfitNetsalesRatio?.[year.year],
                                    '0.00'
                                  )}
                                </TableCell>
                              ))}
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className='mt-4 flex gap-4'>
                        <Button onClick={addFinancialParam} className=''>
                          <IconPlus className='h-4 w-4' /> Add Parameter
                        </Button>
                        {yearFields.length > 0 && (
                          <Button
                            onClick={calculateAllRatios}
                            className='hover:'
                          >
                            <IconCalculator className='mr-2 h-4 w-4' />{' '}
                            Calculate All Ratios
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Remarks */}
                  <Card className='shadow-md'>
                    <CardHeader>
                      <CardTitle className='text-xl font-semibold text-[var(--primary)]'>
                        Additional Remarks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <div className='space-y-6'>
                        <div>
                          <Label
                            htmlFor='auditIrregularities'
                            className='text-gray-700'
                          >
                            Audit Irregularities
                          </Label>
                          <Controller
                            name='auditIrregularities'
                            control={control}
                            render={({ field }) => (
                              <Input
                                id='auditIrregularities'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                className='mt-1'
                                placeholder='Enter audit irregularities'
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor='remarks' className='text-gray-700'>
                            Remarks
                          </Label>
                          <Controller
                            name='remarks'
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id='remarks'
                                {...field}
                                value={valueTypeCasting(field.value)}
                                className='mt-1'
                                placeholder='Enter remarks'
                              />
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Actions */}
                  <div className='flex justify-end gap-4'>
                    {editing && (
                      <Button
                        variant='outline'
                        onClick={() => reset(defaultValues)}
                        className='border-gray-300 text-gray-700 hover:bg-gray-100'
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      className='hover: px-6 py-2 text-white'
                    >
                      {editing ? 'Update' : 'Submit'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={!!openConfirmDialog}
          onOpenChange={(open) => !open && setOpenConfirmDialog(null)}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogTitle className='text-lg font-semibold text-gray-900'>
              Missing Information
            </DialogTitle>
            <DialogDescription className='text-gray-600'>
              {message}
            </DialogDescription>
            <DialogFooter className='mt-4'>
              <Button
                variant='outline'
                onClick={() => setOpenConfirmDialog(null)}
                className='mr-2'
              >
                Cancel
              </Button>
              <Button
                onClick={() => onSubmit(openConfirmDialog!)}
                className='hover:'
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={!!openDialog}
          onConfirm={() => deleteRecord(openDialog!)}
          onCancel={() => setOpenDialog(null)}
          title='Confirm Deletion'
          message='Are you sure you want to delete this record? This action is irreversible.'
          confirmText='Yes, Delete'
          cancelText='No, Cancel'
          loading={deleteLoanReviewMutation.isPending}
        />
      </div>
    </MainWrapper>
  )
}

function format2dp(value: unknown, fallback = '0.00') {
  const num = parseFloat(String(value))
  return !isNaN(num) ? num.toFixed(2) : fallback
}
