// import { createFileRoute, useNavigate } from '@tanstack/react-router'
// import {
//   useForm,
//   Controller,
//   useFieldArray,
//   type Control,
//   type FieldArrayPath,
//   type FieldPath,
// } from 'react-hook-form'
// import { toast } from 'sonner'

// import MainWrapper from '@/components/ui/main-wrapper'
// import { Button } from '@/components/ui/button'
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from '@/components/ui/card'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'
// import { Skeleton } from '@/components/ui/skeleton'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { Plus, Trash } from 'lucide-react'
// import { JSX } from 'react'
// import { $api } from '@/lib/api.ts'

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type FormValues = Record<string, any>

// type ColumnDef = {
//   key: string
//   header: string
//   placeholder?: string
//   type?: 'text' | 'number' | 'date' | 'select'
//   options?: { value: string; label: string }[]
// }

// interface EditableTableProps {
//   control: Control<FormValues>
//   title?: string
//   description?: string
//   name: string
//   columns: ColumnDef[]
//   emptyRow: Record<string, string>
// }

// function EditableTable({
//   control,
//   title,
//   description,
//   name,
//   columns,
//   emptyRow,
// }: EditableTableProps) {
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: name as FieldArrayPath<FormValues>,
//   })

//   const handleAddRow = () => {
//     append(emptyRow)
//   }

//   return (
//     <Card className="mt-4">
//       {title ? (
//         <CardHeader className="pb-2">
//           <CardTitle className="text-base font-semibold">{title}</CardTitle>
//           {description ? (
//             <CardDescription className="text-xs text-muted-foreground">
//               {description}
//             </CardDescription>
//           ) : null}
//         </CardHeader>
//       ) : null}
//       <CardContent className={title ? 'pt-0' : ''}>
//         <div className="rounded-md border">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 {columns.map((col) => (
//                   <TableHead key={col.key}>{col.header}</TableHead>
//                 ))}
//                 <TableHead className="w-[40px]" />
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {fields.length === 0 ? (
//                 <TableRow>
//                   <TableCell
//                     colSpan={columns.length + 1}
//                     className="py-6 text-center text-xs text-muted-foreground"
//                   >
//                     No rows added yet. Use &quot;Add row&quot; to start.
//                   </TableCell>
//                 </TableRow>
//               ) : null}
//               {fields.map((row, rowIndex) => (
//                 <TableRow key={row.id}>
//                   {columns.map((col) => {
//                     const fieldName = `${name}.${rowIndex}.${col.key}` as const

//                     return (
//                       <TableCell key={col.key}>
//                         <Controller
//                           control={control}
//                           name={fieldName as FieldPath<FormValues>}
//                           render={({ field }) => {
//                             const commonProps = {
//                               id: field.name,
//                               value:
//                                 (field.value as string | number | undefined) ??
//                                 '',
//                               onChange: field.onChange,
//                               onBlur: field.onBlur,
//                               className:
//                                 'h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
//                               placeholder: col.placeholder,
//                             }

//                             if (col.type === 'select' && col.options) {
//                               return (
//                                 <select {...commonProps}>
//                                   <option value="">Select</option>
//                                   {col.options.map((opt) => (
//                                     <option key={opt.value} value={opt.value}>
//                                       {opt.label}
//                                     </option>
//                                   ))}
//                                 </select>
//                               )
//                             }

//                             return (
//                               <Input
//                                 {...commonProps}
//                                 type={col.type ?? 'text'}
//                               />
//                             )
//                           }}
//                         />
//                       </TableCell>
//                     )
//                   })}
//                   <TableCell className="w-[40px] text-right">
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="icon"
//                       className="h-7 w-7 text-destructive"
//                       onClick={() => remove(rowIndex)}
//                     >
//                       <Trash className="h-3 w-3" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//         <div className="mt-2 flex justify-between">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={handleAddRow}
//           >
//             <Plus className="mr-1 h-3 w-3" />
//             Add row
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// interface YesNoNaSelectProps {
//   name: string
//   value?: string
//   onChange: (value: string) => void
//   onBlur?: () => void
// }

// function YesNoNaSelect({
//   name,
//   value,
//   onChange,
//   onBlur,
// }: YesNoNaSelectProps) {
//   return (
//     <select
//       name={name}
//       value={value ?? ''}
//       onChange={(e) => onChange(e.target.value)}
//       onBlur={onBlur}
//       className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//     >
//       <option value="">Select</option>
//       <option value="YES">YES</option>
//       <option value="NO">NO</option>
//       <option value="NA">N/A</option>
//     </select>
//   )
// }

// function StockAuditFormSkeleton(): JSX.Element {
//   return (
//     <MainWrapper>
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <Skeleton className="mb-2 h-6 w-64" />
//             <Skeleton className="h-4 w-40" />
//           </div>
//           <Skeleton className="h-9 w-24" />
//         </div>

//         {[0, 1, 2, 3].map((sectionIndex) => (
//           <Card key={sectionIndex}>
//             <CardHeader>
//               <Skeleton className="h-5 w-48" />
//             </CardHeader>
//             <CardContent className="space-y-3">
//               {[0, 1, 2, 3].map((rowIndex) => (
//                 <div
//                   key={rowIndex}
//                   className="grid grid-cols-1 gap-3 md:grid-cols-2"
//                 >
//                   <Skeleton className="h-4 w-32" />
//                   <Skeleton className="h-9 w-full" />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </MainWrapper>
//   )
// }

// function RouteComponent(): JSX.Element {
//   const { accountId, assignmentIdCRGB } = Route.useParams()
//   const navigate = useNavigate()

//   // ---- API mutation for saving CRGB report ----
//   const saveTgbReportMutation = $api.useMutation(
//     'post',
//     '/api/crgb-stock-audit/create',
//     {
//       onSuccess: () => {
//         toast.success('CRGB stock audit report saved successfully.')
//         navigate({
//           to: '/stock-audit/assigned-audits',
//           search: { tab: 'COMPLETED' },
//         })
//         setTimeout(() => {
//           window.location.reload()
//         }, 0)
//       },
//       onError: (err) => {
//         // eslint-disable-next-line no-console
//         console.error('Error saving CRGB report', err)
//         toast.error('Failed to save CRGB stock audit report.')
//       },
//     }
//   )

//   const form = useForm<FormValues>({
//     mode: 'onSubmit',
//     defaultValues: {
//       // note: bankFormat is not part of form; we inject it in payload
//       borrowerName: '',
//       referenceDateForSra: '',
//       registeredOfficeAddress: '',
//       corporateOfficeAddress: '',
//       unitAddresses: '',
//       natureOfActivity: '',
//       bankingArrangement: '',
//       borrowerProfileNote: '',
//       execCreditFacilities: [],
//       totalFundBasedLimit: '',
//       totalNonFundBasedLimit: '',
//       totalExposure: '',
//       externalFacilities: [],
//       physicalVerificationDate: '',
//       drawingPowerAsPerAnnexureA: '',
//       physicalVerificationRemarks: '',
//       domesticReceivablesAsPerStock: '',
//       domesticReceivablesAsPerAssessment: '',
//       dpAgainstReceivables: '',
//       receivablesVariationReasons: '',
//       cfSalesTurnoverBooks: '',
//       cfSalesTurnoverGstr1: '',
//       cfAmountRealisedFromCustomers: '',
//       cfTotalCreditSummations: '',
//       cfOpeningDebtors: '',
//       cfSalesDuringPeriod: '',
//       cfClosingDebtors: '',
//       cfCashRealisationComputed: '',
//       cfComments: '',
//       insuranceSummary: [],
//       insuranceCoverAsPerSanction: '',
//       insuranceDeviationDetails: '',
//       rocCharges: [],
//       mandatoryBooks: [],
//       booksOfAccountComments: '',
//       returnsComments: '',
//       statutoryDues: [],
//       statutoryDuesComments: '',
//       sraTeamMembers: [],
//       sraCommencementDate: '',
//       sraCompletionDate: '',
//       sraVisitDates: '',
//       invMarketValueDate: '',
//       invMarketValueAmount: '',
//       inventoryOverview: [],
//       inventoryLocationStocks: [],
//       inventoryVariationComments: '',
//       inventoryValuationComments: '',
//       inventoryJobWorkDetails: '',
//       inventoryThirdPartyStockDetails: '',
//       inventoryControlQualityComments: '',
//       inventoryControlMisComments: '',
//       dpStockEligible: '',
//       dpStockMargin: '',
//       dpStockAvailable: '',
//       creditorsAgeingSummary: [],
//       creditorsComments: '',
//       receivablesOverview: [],
//       receivablesFromAssociates: [],
//       receivablesAgeingSummary: [],
//       receivablesVariationReasonsDetailed: '',
//       disputedReceivablesDetails: '',
//       provisionRequiredDetails: '',
//       receivableAuditTrailComments: '',
//       verifiedDebtors: [],
//       verifiedCreditors: [],
//       relatedPartyReceivableAgeing: [],
//       cashFlowVerificationComments: '',
//       rocComplianceComments: '',
//       miscEmployeeRelationComments: '',
//       miscPowerAvailabilityComments: '',
//       miscNoticesReceived: '',
//       miscNoticesDetails: '',
//       miscOtherBankAccounts: '',
//       miscOtherBankAccountsDetails: '',
//       miscDiversionOfFunds: '',
//       miscDiversionOfFundsDetails: '',
//       miscSalesRoutingThroughLenders: '',
//       miscSalesRoutingDetails: '',
//       miscHypothecationBoardDisplayed: '',
//       miscJobWorkStockSeparatelyStored: '',
//       miscJobWorkStockDetails: '',
//       miscLevelOfActivityComments: '',
//       miscSpecialEventsComments: '',
//       miscConstraintsDuringSra: '',
//       miscConstraintsDetails: '',
//       miscSuggestions: '',
//       gstReturnRows: [],
//       certificateExceptions: '',
//       certificateComments: '',
//       eligibleReceivablesForDp: '',
//       dpReceivablesMargin: '',
//       dpReceivablesAvailable: '',
//     },
//   })

//   const {
//     control,
//     handleSubmit,
//     formState: { isSubmitting },
//   } = form

//   const onSubmit = async (data: FormValues) => {
//     // Map to backend expected shape as much as possible
//     const payload = {
//       ...data,
//       // map to OpenAPI body fields
//       bankFormat: 'CRGB' as const,
//       accountNo: accountId,
//       // if backend body has assignmentId or id, you can also map it:
//       // id: Number(assignmentIdCRGB),
//       assignmentId: assignmentIdCRGB,
//       // if backend expects registeredOffice / corporateOffice fields:
//       registeredOffice: data.registeredOfficeAddress,
//       corporateOffice: data.corporateOfficeAddress,
//       manufacturingLocations: data.unitAddresses,
//     }

//     try {
//       await saveTgbReportMutation.mutateAsync({
//         body: payload,
//         params: {
//           query: {
//             assignmentId: 0
//           },
//           header: undefined,
//           path: undefined,
//           cookie: undefined
//         }
//       })
//     } catch (err) {
//       // onError toast already handled in mutation; just log for debugging
//       // eslint-disable-next-line no-console
//       console.error('Submit failed', err)
//     }
//   }

//   const isLoading = false
//   if (isLoading) {
//     return <StockAuditFormSkeleton />
//   }

//   return (
//     <MainWrapper>
//       <Form {...form}>
//         <form
//           onSubmit={handleSubmit(onSubmit)}
//           className="space-y-6 pb-32"
//         >
//           {/* Header */}
//           <header className="from-primary/20 via-primary/10 ring-border mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1">
//             <div>
//               <h1 className="text-xl font-semibold">
//                 Stock &amp; Receivable Audit
//               </h1>
//               <p className="text-xs text-muted-foreground">
//                 Account ID: {accountId} · Assignment ID: {assignmentIdCRGB}
//               </p>
//             </div>

//             <button
//               type="button"
//               onClick={() => window.history.back()}
//               className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground"
//             >
//               Go Back
//             </button>
//           </header>

//           {/* Annexure I – Executive Summary */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base font-semibold">
//                 Annexure I – Executive Summary
//               </CardTitle>
//               <CardDescription className="text-xs text-muted-foreground">
//                 Borrower profile, facilities and high-level observations.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {/* Borrower profile */}
//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="borrowerName"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Borrower Name</FormLabel>
//                       <FormControl>
//                         <Input {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="referenceDateForSra"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Reference date for Stock &amp; Receivable Audit</FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="registeredOfficeAddress"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Registered Office Address</FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="corporateOfficeAddress"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Corporate / Administrative Office Address</FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="unitAddresses"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Address of Manufacturing Unit(s) / Works / Godowns (with brief description)
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="natureOfActivity"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Nature of Activity / Line of Business</FormLabel>
//                       <FormControl>
//                         <Input {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="bankingArrangement"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Banking Arrangement</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Sole / Consortium / Multiple banking etc." {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="borrowerProfileNote"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Brief write-up on borrower profile &amp; management</FormLabel>
//                     <FormControl>
//                       <Textarea rows={4} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Credit facilities */}
//               <EditableTable
//                 control={control}
//                 name="execCreditFacilities"
//                 title="1. Details of credit facilities enjoyed"
//                 description="As per latest sanction letters / review – CRGB &amp; other lenders."
//                 columns={[
//                   { key: 'natureOfLimit', header: 'Nature of limit' },
//                   { key: 'limitCrgb', header: 'Limit – CRGB (₹ lakh)' },
//                   { key: 'limitOthers', header: 'Limit – Other Banks / FIs (₹ lakh)' },
//                   { key: 'outstandingCrgb', header: 'Outstanding – CRGB (₹ lakh)' },
//                   { key: 'outstandingOthers', header: 'Outstanding – Others (₹ lakh)' },
//                 ]}
//                 emptyRow={{
//                   natureOfLimit: '',
//                   limitCrgb: '',
//                   limitOthers: '',
//                   outstandingCrgb: '',
//                   outstandingOthers: '',
//                 }}
//               />

//               <div className="grid gap-4 md:grid-cols-3">
//                 <FormField
//                   control={form.control}
//                   name="totalFundBasedLimit"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Total Fund Based Limits (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="totalNonFundBasedLimit"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Total Non-Fund Based Limits (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="totalExposure"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Total Exposure (Fund + Non-Fund) (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               {/* Facilities from FIs / NBFC / factoring */}
//               <EditableTable
//                 control={control}
//                 name="externalFacilities"
//                 title="2. Facilities from FI / NBFC / Factoring companies"
//                 columns={[
//                   { key: 'natureOfLimit', header: 'Nature of facility' },
//                   { key: 'lenderName', header: 'Lender name' },
//                   { key: 'outstanding', header: 'Outstanding (₹ lakh)' },
//                   { key: 'overdue', header: 'Overdue, if any (₹ lakh)' },
//                 ]}
//                 emptyRow={{
//                   natureOfLimit: '',
//                   lenderName: '',
//                   outstanding: '',
//                   overdue: '',
//                 }}
//               />

//               {/* Physical verification & DP for receivables */}
//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="physicalVerificationDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Date of physical verification of stock &amp; receivables
//                       </FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="drawingPowerAsPerAnnexureA"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Drawing Power as per Annexure A (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="physicalVerificationRemarks"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Remarks on physical verification (coverage, locations visited, exceptions)
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* High level DP variation for receivables */}
//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="domesticReceivablesAsPerStock"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Domestic receivables – As per stock statement (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="domesticReceivablesAsPerAssessment"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Domestic receivables – As per auditor&apos;s assessment (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="dpAgainstReceivables"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Drawing Power against receivables as per assessment (₹ lakh)</FormLabel>
//                     <FormControl>
//                       <Input type="number" step="0.01" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="receivablesVariationReasons"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Reasons for variation between stock statement and assessment</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Cash flow summary */}
//               <Card className="border-dashed">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-semibold">
//                     7. Cash Flow Summary (for the period covered)
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3 pt-0">
//                   <div className="grid gap-4 md:grid-cols-2">
//                     <FormField
//                       control={form.control}
//                       name="cfSalesTurnoverBooks"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Sales turnover as per books (₹ crore)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="cfSalesTurnoverGstr1"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Sales turnover as per GSTR-1 (₹ crore)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className="grid gap-4 md:grid-cols-2">
//                     <FormField
//                       control={form.control}
//                       name="cfAmountRealisedFromCustomers"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Amount realised from customers (₹ crore)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="cfTotalCreditSummations"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Total credit summations in main CC/OD account (₹ crore)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <div className="grid gap-4 md:grid-cols-4">
//                     <FormField
//                       control={form.control}
//                       name="cfOpeningDebtors"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Opening debtors (₹ lakh)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="cfSalesDuringPeriod"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Add: Sales during period (₹ lakh)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="cfClosingDebtors"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Less: Closing debtors (₹ lakh)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="cfCashRealisationComputed"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Cash realisation from debtors (₹ lakh)</FormLabel>
//                           <FormControl>
//                             <Input type="number" step="0.01" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <FormField
//                     control={form.control}
//                     name="cfComments"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Remarks on cash flow and routing of sales</FormLabel>
//                         <FormControl>
//                           <Textarea rows={3} {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>

//               {/* Insurance summary */}
//               <EditableTable
//                 control={control}
//                 name="insuranceSummary"
//                 title="8. Insurance coverage summary"
//                 columns={[
//                   { key: 'srNo', header: 'Sr. No.' },
//                   { key: 'particular', header: 'Particulars (Primary / Collateral)' },
//                   { key: 'natureOfSecurity', header: 'Nature of security' },
//                   { key: 'assetsSecured', header: 'Assets secured' },
//                   { key: 'sumAssured', header: 'Sum assured (₹ lakh)' },
//                   { key: 'dueDate', header: 'Policy due date', type: 'date' },
//                 ]}
//                 emptyRow={{
//                   srNo: '',
//                   particular: '',
//                   natureOfSecurity: '',
//                   assetsSecured: '',
//                   sumAssured: '',
//                   dueDate: '',
//                 }}
//               />

//               <FormField
//                 control={form.control}
//                 name="insuranceCoverAsPerSanction"
//                 render={({ field }) => (
//                   <FormItem className="md:max-w-xs">
//                     <FormLabel>
//                       Whether insurance cover is as per terms of sanction?
//                     </FormLabel>
//                     <FormControl>
//                       <YesNoNaSelect
//                         name={field.name}
//                         value={field.value as string | undefined}
//                         onChange={field.onChange}
//                         onBlur={field.onBlur}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="insuranceDeviationDetails"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Details of deviation in insurance, if any</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* ROC charges */}
//               <EditableTable
//                 control={control}
//                 name="rocCharges"
//                 title="9. Registration of charge with ROC"
//                 columns={[
//                   { key: 'natureOfCharge', header: 'Nature of charge' },
//                   { key: 'lender', header: 'Lender(s)' },
//                   { key: 'amount', header: 'Amount (₹ lakh)' },
//                   { key: 'rocChargeId', header: 'ROC charge ID / details' },
//                 ]}
//                 emptyRow={{
//                   natureOfCharge: '',
//                   lender: '',
//                   amount: '',
//                   rocChargeId: '',
//                 }}
//               />

//               {/* Mandatory books & returns */}
//               <EditableTable
//                 control={control}
//                 name="mandatoryBooks"
//                 title="10. Mandatory books / returns"
//                 description="Books and statutory returns required for the unit and their compliance status."
//                 columns={[
//                   { key: 'name', header: 'Book / Return' },
//                   { key: 'applicability', header: 'Applicability' },
//                   { key: 'status', header: 'Status of compliance' },
//                 ]}
//                 emptyRow={{
//                   name: '',
//                   applicability: '',
//                   status: '',
//                 }}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="booksOfAccountComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Remarks on books of accounts</FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="returnsComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Remarks on statutory returns</FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               {/* Statutory dues */}
//               <EditableTable
//                 control={control}
//                 name="statutoryDues"
//                 title="11. Status of payment of statutory dues"
//                 columns={[
//                   { key: 'natureOfDue', header: 'Nature of due (GST / TDS / PF / ESIC / others)' },
//                   { key: 'amountOutstanding', header: 'Amount outstanding (₹ lakh)' },
//                   { key: 'paymentStatus', header: 'Payment status as advised by company' },
//                 ]}
//                 emptyRow={{
//                   natureOfDue: '',
//                   amountOutstanding: '',
//                   paymentStatus: '',
//                 }}
//               />

//               <FormField
//                 control={form.control}
//                 name="statutoryDuesComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Overall comments on statutory dues</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* SRA team & schedule */}
//               <EditableTable
//                 control={control}
//                 name="sraTeamMembers"
//                 title="12. Officials of Stock & Receivable Audit team"
//                 columns={[
//                   { key: 'name', header: 'Name' },
//                   { key: 'qualification', header: 'Qualification' },
//                   { key: 'membershipNo', header: 'Membership No. (if applicable)' },
//                   { key: 'role', header: 'Role in assignment' },
//                 ]}
//                 emptyRow={{
//                   name: '',
//                   qualification: '',
//                   membershipNo: '',
//                   role: '',
//                 }}
//               />

//               <div className="grid gap-4 md:grid-cols-3">
//                 <FormField
//                   control={form.control}
//                   name="sraCommencementDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of commencement of SRA</FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="sraCompletionDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of completion of SRA</FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="sraVisitDates"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Location-wise visit dates (brief)</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="e.g. Unit-1: 05-07-2025; Unit-2: 06-07-2025"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </CardContent>
//           </Card>

//           {/* Annexure A – Inventories */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base font-semibold">
//                 Annexure A – Inventories
//               </CardTitle>
//               <CardDescription className="text-xs text-muted-foreground">
//                 Physical verification, valuation &amp; drawing power computation.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
//                 <FormField
//                   control={form.control}
//                   name="invMarketValueDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Date of stock statement / valuation</FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="invMarketValueAmount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Market value of stock as on that date (₹ lakh)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.01" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <EditableTable
//                 control={control}
//                 name="inventoryOverview"
//                 title="A. Overview & composition of stock"
//                 description="Category-wise stock position for the latest 3 dates (amount & number of days)."
//                 columns={[
//                   { key: 'category', header: 'Category (RM / WIP / FG / Stores)' },
//                   { key: 'amountCurrent', header: 'Amount – Current date (₹ lakh)' },
//                   { key: 'daysCurrent', header: 'No. of days – Current' },
//                   { key: 'amountPrev1', header: 'Amount – Previous date 1' },
//                   { key: 'daysPrev1', header: 'No. of days – Prev 1' },
//                   { key: 'amountPrev2', header: 'Amount – Previous date 2' },
//                   { key: 'daysPrev2', header: 'No. of days – Prev 2' },
//                 ]}
//                 emptyRow={{
//                   category: '',
//                   amountCurrent: '',
//                   daysCurrent: '',
//                   amountPrev1: '',
//                   daysPrev1: '',
//                   amountPrev2: '',
//                   daysPrev2: '',
//                 }}
//               />

//               <EditableTable
//                 control={control}
//                 name="inventoryLocationStocks"
//                 title="B. Location-wise closing stock (as per stock statement & assessment)"
//                 columns={[
//                   { key: 'location', header: 'Location / Unit' },
//                   { key: 'rmAsPerSs', header: 'Raw material – As per SS' },
//                   { key: 'rmAsPerAssessment', header: 'Raw material – As per assessment' },
//                   { key: 'wipAsPerSs', header: 'WIP – As per SS' },
//                   { key: 'wipAsPerAssessment', header: 'WIP – As per assessment' },
//                   { key: 'fgAsPerSs', header: 'Finished goods – As per SS' },
//                   { key: 'fgAsPerAssessment', header: 'Finished goods – As per assessment' },
//                   { key: 'storesAsPerSs', header: 'Stores & spares – As per SS' },
//                   { key: 'storesAsPerAssessment', header: 'Stores & spares – As per assessment' },
//                 ]}
//                 emptyRow={{
//                   location: '',
//                   rmAsPerSs: '',
//                   rmAsPerAssessment: '',
//                   wipAsPerSs: '',
//                   wipAsPerAssessment: '',
//                   fgAsPerSs: '',
//                   fgAsPerAssessment: '',
//                   storesAsPerSs: '',
//                   storesAsPerAssessment: '',
//                 }}
//               />

//               <FormField
//                 control={form.control}
//                 name="inventoryVariationComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Reasons for variation between stock statement and physical / assessed stock
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="inventoryValuationComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Comments on valuation (cost / NRV, method of valuation, over / under valuation)
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="inventoryJobWorkDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Stocks held for / received from job work (quantitative &amp; value details)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="inventoryThirdPartyStockDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Third party stocks held at unit (and unit&apos;s stock with third parties)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="inventoryControlQualityComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Quality, slow / non-moving, obsolete, perishable goods – observations
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="inventoryControlMisComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Stock records, MIS controls, reconciliations &amp; periodic physical verification
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <Card className="border-dashed">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-semibold">
//                     Drawing Power against stock – summary
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
//                   <FormField
//                     control={form.control}
//                     name="dpStockEligible"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Eligible stock for DP (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="dpStockMargin"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Margin on stock (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="dpStockAvailable"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Available DP against stock (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>
//             </CardContent>
//           </Card>

//           {/* Annexure B – Receivables */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base font-semibold">
//                 Annexure B – Receivables
//               </CardTitle>
//               <CardDescription className="text-xs text-muted-foreground">
//                 Overview, age-wise analysis &amp; drawing power for receivables.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <EditableTable
//                 control={control}
//                 name="receivablesOverview"
//                 title="B.1 Overview & composition of receivables"
//                 columns={[
//                   { key: 'category', header: 'Category (Domestic / Export / Others)' },
//                   { key: 'amount', header: 'Amount (₹ lakh)' },
//                   { key: 'noOfAccounts', header: 'No. of accounts' },
//                   { key: 'avgRealisationPeriod', header: 'Average realisation period (days)' },
//                 ]}
//                 emptyRow={{
//                   category: '',
//                   amount: '',
//                   noOfAccounts: '',
//                   avgRealisationPeriod: '',
//                 }}
//               />

//               <EditableTable
//                 control={control}
//                 name="receivablesFromAssociates"
//                 title="B.2 Receivables from associates / group concerns"
//                 columns={[
//                   { key: 'partyName', header: 'Name of party' },
//                   { key: 'relationship', header: 'Relationship / group' },
//                   { key: 'amount', header: 'Amount (₹ lakh)' },
//                   { key: 'ageing', header: 'Ageing bucket' },
//                 ]}
//                 emptyRow={{
//                   partyName: '',
//                   relationship: '',
//                   amount: '',
//                   ageing: '',
//                 }}
//               />

//               <EditableTable
//                 control={control}
//                 name="receivablesAgeingSummary"
//                 title="B.3 Age-wise analysis of receivables"
//                 description="Debtor-wise or bucket-wise ageing as per Annexure B."
//                 columns={[
//                   { key: 'partyName', header: 'Customer / Debtor name' },
//                   { key: 'totalOutstanding', header: 'Total outstanding (₹ lakh)' },
//                   { key: 'bucketUpto90', header: '≤ 90 days' },
//                   { key: 'bucket90to180', header: '91–180 days' },
//                   { key: 'bucket180to365', header: '181–365 days' },
//                   { key: 'bucketAbove365', header: '&gt; 365 days' },
//                   { key: 'disputed', header: 'Disputed? (Y/N)' },
//                 ]}
//                 emptyRow={{
//                   partyName: '',
//                   totalOutstanding: '',
//                   bucketUpto90: '',
//                   bucket90to180: '',
//                   bucket180to365: '',
//                   bucketAbove365: '',
//                   disputed: '',
//                 }}
//               />

//               <Card className="border-dashed">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-semibold">
//                     Drawing Power against receivables – summary
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
//                   <FormField
//                     control={form.control}
//                     name="eligibleReceivablesForDp"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Eligible receivables for DP (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="dpReceivablesMargin"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Margin on receivables (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="dpReceivablesAvailable"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Available DP against receivables (₹ lakh)</FormLabel>
//                         <FormControl>
//                           <Input type="number" step="0.01" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </CardContent>
//               </Card>

//               <FormField
//                 control={form.control}
//                 name="receivablesVariationReasonsDetailed"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Detailed reasons for variation between book receivables and stock statement
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="disputedReceivablesDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Details of disputed / long overdue receivables &amp; follow-up
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="provisionRequiredDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Provision required / made for doubtful receivables (with justification)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="receivableAuditTrailComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Comments on audit trail, linkage with sales, GST, e-way bills etc.
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <EditableTable
//                 control={control}
//                 name="verifiedDebtors"
//                 title="List of debtors verified (sample testing)"
//                 columns={[
//                   { key: 'partyName', header: 'Debtor name' },
//                   { key: 'amount', header: 'Amount verified (₹ lakh)' },
//                   { key: 'modeOfVerification', header: 'Mode (Balance confirmation / visit / other)' },
//                   { key: 'remarks', header: 'Remarks' },
//                 ]}
//                 emptyRow={{
//                   partyName: '',
//                   amount: '',
//                   modeOfVerification: '',
//                   remarks: '',
//                 }}
//               />

//               <EditableTable
//                 control={control}
//                 name="verifiedCreditors"
//                 title="List of creditors verified (sample testing)"
//                 columns={[
//                   { key: 'partyName', header: 'Creditor name' },
//                   { key: 'amount', header: 'Amount verified (₹ lakh)' },
//                   { key: 'modeOfVerification', header: 'Mode of verification' },
//                   { key: 'remarks', header: 'Remarks' },
//                 ]}
//                 emptyRow={{
//                   partyName: '',
//                   amount: '',
//                   modeOfVerification: '',
//                   remarks: '',
//                 }}
//               />

//               <EditableTable
//                 control={control}
//                 name="relatedPartyReceivableAgeing"
//                 title="Age-wise receivables from associates / group concerns"
//                 columns={[
//                   { key: 'partyName', header: 'Party name' },
//                   { key: 'relationship', header: 'Relationship' },
//                   { key: 'totalOutstanding', header: 'Total outstanding (₹ lakh)' },
//                   { key: 'bucketUpto90', header: '≤ 90 days' },
//                   { key: 'bucket90to180', header: '91–180 days' },
//                   { key: 'bucket180to365', header: '181–365 days' },
//                   { key: 'bucketAbove365', header: '&gt; 365 days' },
//                 ]}
//                 emptyRow={{
//                   partyName: '',
//                   relationship: '',
//                   totalOutstanding: '',
//                   bucketUpto90: '',
//                   bucket90to180: '',
//                   bucket180to365: '',
//                   bucketAbove365: '',
//                 }}
//               />

//               <FormField
//                 control={form.control}
//                 name="cashFlowVerificationComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Cash flow trail between receivables and banking transactions – observations
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </CardContent>
//           </Card>

//           {/* Annexure C – Miscellaneous & GST */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base font-semibold">
//                 Annexure C – Miscellaneous &amp; GST
//               </CardTitle>
//               <CardDescription className="text-xs text-muted-foreground">
//                 Insurance, ROC, operational aspects &amp; GST returns status.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="rocComplianceComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Comments on compliance with registration of charges / ROC filings
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="miscEmployeeRelationComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Relation with employees / labour and overview of manpower
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscPowerAvailabilityComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Availability of power, raw material, logistics &amp; other infrastructure
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-3">
//                 <FormField
//                   control={form.control}
//                   name="miscNoticesReceived"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Any notices from statutory authorities?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscOtherBankAccounts"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Accounts maintained with other banks?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscDiversionOfFunds"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Any diversion of funds observed?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="miscNoticesDetails"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Details of statutory notices, if any</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="miscOtherBankAccountsDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Details of accounts with other banks (nature, purpose, turnover)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscDiversionOfFundsDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Diversion / siphoning of funds (if any) and auditor&apos;s comments
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-3">
//                 <FormField
//                   control={form.control}
//                   name="miscSalesRoutingThroughLenders"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Sales routed through CRGB accounts?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscHypothecationBoardDisplayed"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Hypothecation board displayed at unit / godown?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscJobWorkStockSeparatelyStored"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Job work stocks kept separately &amp; identified?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="miscSalesRoutingDetails"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Details on routing of sales through banking channels</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="miscJobWorkStockDetails"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Additional details on job work stocks &amp; ownership</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="miscLevelOfActivityComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Level of activity during audit period (capacity utilisation, trend)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscSpecialEventsComments"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>
//                         Special events impacting business (lockdowns, strikes, policy changes etc.)
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="miscConstraintsDuringSra"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Any constraints faced during SRA?</FormLabel>
//                       <FormControl>
//                         <YesNoNaSelect
//                           name={field.name}
//                           value={field.value as string | undefined}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="miscConstraintsDetails"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Details of constraints / limitations, if any</FormLabel>
//                       <FormControl>
//                         <Textarea rows={3} {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="miscSuggestions"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Suggestions / recommendations of auditor</FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* GST details */}
//               <EditableTable
//                 control={control}
//                 name="gstReturnRows"
//                 title="4. GST returns &amp; reconciliations"
//                 columns={[
//                   { key: 'returnType', header: 'Return type (GSTR-1 / GSTR-3B / others)' },
//                   { key: 'filedUpto', header: 'Filed up to (month / year)' },
//                   { key: 'status', header: 'Status (on time / delayed / pending)' },
//                   { key: 'remarks', header: 'Remarks / reconciliation notes' },
//                 ]}
//                 emptyRow={{
//                   returnType: '',
//                   filedUpto: '',
//                   status: '',
//                   remarks: '',
//                 }}
//               />
//             </CardContent>
//           </Card>

//           {/* Annexure D – Auditor certificate (key points) */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base font-semibold">
//                 Annexure D – Auditor Certificate (Key Inputs)
//               </CardTitle>
//               <CardDescription className="text-xs text-muted-foreground">
//                 Use this section to capture exceptions &amp; remarks which will flow into the
//                 certificate.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="certificateExceptions"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Key exceptions observed (stock, receivables, creditors, documentation etc.)
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={4} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="certificateComments"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>
//                       Any other important comments for Annexure D certificate
//                     </FormLabel>
//                     <FormControl>
//                       <Textarea rows={3} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </CardContent>
//           </Card>

//           <div className="flex justify-end">
//             <Button
//               type="submit"
//               disabled={isSubmitting || saveTgbReportMutation.isPending}
//             >
//               {isSubmitting || saveTgbReportMutation.isPending ? 'Saving…' : 'Save'}
//             </Button>
//           </div>
//         </form>
//       </Form>
//     </MainWrapper>
//   )
// }

// export const Route = createFileRoute(
//   '/_authenticated/stock-audit/$accountId/report/$assignmentIdCRGB',
// )({
//   component: RouteComponent,
// })


import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useForm,
  Controller,
  useFieldArray,
  type Control,
  type FieldArrayPath,
  type FieldPath,
} from 'react-hook-form'
import { toast } from 'sonner'

import MainWrapper from '@/components/ui/main-wrapper'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash } from 'lucide-react'
import { JSX } from 'react'
import { $api } from '@/lib/api.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>

type ColumnDef = {
  key: string
  header: string
  placeholder?: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
}

interface EditableTableProps {
  control: Control<FormValues>
  title?: string
  description?: string
  name: string
  columns: ColumnDef[]
  emptyRow: Record<string, string>
}

function EditableTable({
  control,
  title,
  description,
  name,
  columns,
  emptyRow,
}: EditableTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<FormValues>,
  })

  const handleAddRow = () => {
    append(emptyRow)
  }

  return (
    <Card className="mt-4">
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={title ? 'pt-0' : ''}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No rows added yet. Use &quot;Add row&quot; to start.
                  </TableCell>
                </TableRow>
              ) : null}
              {fields.map((row, rowIndex) => (
                <TableRow key={row.id}>
                  {columns.map((col) => {
                    const fieldName = `${name}.${rowIndex}.${col.key}` as const

                    return (
                      <TableCell key={col.key}>
                        <Controller
                          control={control}
                          name={fieldName as FieldPath<FormValues>}
                          render={({ field }) => {
                            const commonProps = {
                              id: field.name,
                              value:
                                (field.value as string | number | undefined) ??
                                '',
                              onChange: field.onChange,
                              onBlur: field.onBlur,
                              className:
                                'h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                              placeholder: col.placeholder,
                            }

                            if (col.type === 'select' && col.options) {
                              return (
                                <select {...commonProps}>
                                  <option value="">Select</option>
                                  {col.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )
                            }

                            return (
                              <Input
                                {...commonProps}
                                type={col.type ?? 'text'}
                              />
                            )
                          }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell className="w-[40px] text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(rowIndex)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 flex justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
          >
            <Plus className="mr-1 h-3 w-3" />
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

function YesNoNaSelect({
  name,
  value,
  onChange,
  onBlur,
}: YesNoNaSelectProps) {
  return (
    <select
      name={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">Select</option>
      <option value="YES">YES</option>
      <option value="NO">NO</option>
      <option value="NA">N/A</option>
    </select>
  )
}

function StockAuditFormSkeleton(): JSX.Element {
  return (
    <MainWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {[0, 1, 2, 3, 4].map((sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2, 3].map((rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-1 gap-3 md:grid-cols-2"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
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
  const { accountId, assignmentIdCRGB } = Route.useParams()
  const navigate = useNavigate()

  // ---- API mutation for saving CRGB report ----
  const saveTgbReportMutation = $api.useMutation(
    'post',
    '/api/crgb-stock-audit/create',
    {
      onSuccess: () => {
        toast.success('CRGB stock audit report saved successfully.')
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
        console.error('Error saving CRGB report', err)
        toast.error('Failed to save CRGB stock audit report.')
      },
    }
  )

  const form = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: {
      // Basic Information
      borrowerName: '',
      referenceDateForSra: '',
      registeredOfficeAddress: '',
      corporateOfficeAddress: '',
      unitAddresses: '',
      natureOfActivity: '',
      bankingArrangement: '',
      borrowerProfileNote: '',
      totalFundBasedLimit: '',
      totalNonFundBasedLimit: '',
      totalExposure: '',
      
      // Physical Verification
      physicalVerificationDate: '',
      drawingPowerAsPerAnnexureA: '',
      physicalVerificationRemarks: '',
      domesticReceivablesAsPerStock: '',
      domesticReceivablesAsPerAssessment: '',
      dpAgainstReceivables: '',
      receivablesVariationReasons: '',
      
      // Cash Flow
      cfSalesTurnoverBooks: '',
      cfSalesTurnoverGstr1: '',
      cfAmountRealisedFromCustomers: '',
      cfTotalCreditSummations: '',
      cfOpeningDebtors: '',
      cfSalesDuringPeriod: '',
      cfClosingDebtors: '',
      cfCashRealisationComputed: '',
      cfComments: '',
      cfPeriodFrom: '',
      cfPeriodTo: '',
      cfPeriodMonths: 0,
      
      // Insurance
      insuranceCoverAsPerSanction: '',
      insuranceDeviationDetails: '',
      insGoodsFullyInsured: '',
      insCompanyName: '',
      insPeakStockLastYear: '',
      insLenderNameIncluded: '',
      insAdditionalRisksIncluded: '',
      insLocationCorrectInPolicy: '',
      insTransitOrJobworkInsured: '',
      insAnyLocationNotCovered: '',
      insExcludedRisksReasons: '',
      
      // Books & Returns
      booksOfAccountComments: '',
      returnsComments: '',
      
      // Statutory Dues
      statutoryDues: [],
      statutoryDuesComments: '',
      
      // SRA Team
      sraTeamMembers: [],
      sraCommencementDate: '',
      sraCompletionDate: '',
      sraVisitDates: '',
      
      // Inventory
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
      
      // Creditors
      creditorsComments: '',
      creditorsOpeningBalance: '',
      creditorsPurchasesDuringPeriod: '',
      creditorsClosingBalance: '',
      creditorsTotalPayments: '',
      creditorsTotalDebitSummations: '',
      creditorsMovementComments: '',
      
      // Receivables
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
      receivableAgeingBuckets: [],
      eligibleReceivablesForDp: '',
      dpReceivablesMargin: '',
      dpReceivablesAvailable: '',
      receivableCoverPeriodDaysDomestic: 0,
      receivableCoverPeriodDaysExport: 0,
      domesticRelatedPartyExcluded: '',
      domesticAboveCoverPeriodExcluded: '',
      domesticReceivableMargin: '',
      exportReceivablesAsPerStock: '',
      exportReceivablesAsPerAssessment: '',
      exportRelatedPartyExcluded: '',
      exportAboveCoverPeriodExcluded: '',
      exportReceivableMargin: '',
      receivableAsOnDate: '',
      receivableAmountLacs: '',
      receivableStockStatementDate: '',
      
      // Cash Flow Verification
      cashFlowVerificationComments: '',
      
      // ROC Compliance
      rocComplianceComments: '',
      rocCharges: [],
      mcaChargeRows: [],
      
      // Miscellaneous
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
      
      // GST Returns
      gstReturnRows: [],
      
      // Certificate
      certificateExceptions: '',
      certificateComments: '',
      
      // Drawing Power
      drawingPowerRows: [],
      
      // Sales Routing
      salesRoutingRows: [],
      purchaseSalesDetails: '',
      
      // Credit Facilities
      execCreditFacilities: [],
      externalFacilities: [],
      
      // Insurance Summary
      insuranceSummary: [],
      
      // Mandatory Books
      mandatoryBooks: [],
      
      // Verification Thresholds
      debtorVerificationPercent: 0,
      debtorVerificationMinCount: 0,
      creditorVerificationPercent: 0,
      creditorVerificationMinCount: 0,
      
      // Trade Confirmation
      receivablesTradeConfirmedAbove50Lacs: '',
      creditorsTradeConfirmedThreshold: '',
      
      // Statutory Liabilities
      statutoryLiabilitiesPressingCreditorsComments: '',
      
      // Report Details
      reportPlace: '',
      reportDate: '',
      auditorName: '',
      saleInvoiceVerifiedAsOn: '',
      crgbBranchName: '',
      firmName: '',
      registeredOffice: '',
      corporateOffice: '',
      manufacturingLocations: '',
    },
  })

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const onSubmit = async (data: FormValues) => {
    // Map to backend expected shape
    const payload = {
      ...data,
      bankFormat: 'CRGB' as const,
      accountNo: accountId,
      assignmentId: assignmentIdCRGB,
      registeredOffice: data.registeredOfficeAddress,
      corporateOffice: data.corporateOfficeAddress,
      manufacturingLocations: data.unitAddresses,
    }

    try {
      await saveTgbReportMutation.mutateAsync({
        body: payload,
        params: {
          query: {
            assignmentId: 0
          },
          header: undefined,
          path: undefined,
          cookie: undefined
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Submit failed', err)
    }
  }

  const isLoading = false
  if (isLoading) {
    return <StockAuditFormSkeleton />
  }

  return (
    <MainWrapper>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 pb-32"
        >
          {/* Header */}
          <header className="from-primary/20 via-primary/10 ring-border mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-r to-transparent p-6 ring-1">
            <div>
              <h1 className="text-xl font-semibold">
                Stock &amp; Receivable Audit
              </h1>
              <p className="text-xs text-muted-foreground">
                Account ID: {accountId} · Assignment ID: {assignmentIdCRGB}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              Go Back
            </button>
          </header>

          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 1: Basic Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Borrower details, addresses and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="borrowerName"
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
                  name="referenceDateForSra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Date for SRA</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="registeredOfficeAddress"
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
                  name="corporateOfficeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corporate Office Address</FormLabel>
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
                name="unitAddresses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Addresses</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="natureOfActivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature of Activity</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankingArrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banking Arrangement</FormLabel>
                      <FormControl>
                        <Input placeholder="Sole / Consortium / Multiple banking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="borrowerProfileNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Borrower Profile Note</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="totalFundBasedLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Fund Based Limit (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalNonFundBasedLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Non-Fund Based Limit (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalExposure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Exposure (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Physical Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 2: Physical Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="physicalVerificationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Verification Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drawingPowerAsPerAnnexureA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drawing Power as per Annexure A (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="physicalVerificationRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Verification Remarks</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="domesticReceivablesAsPerStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domestic Receivables - As per Stock (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domesticReceivablesAsPerAssessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domestic Receivables - As per Assessment (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dpAgainstReceivables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DP Against Receivables (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivablesVariationReasons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivables Variation Reasons</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Export Receivables */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="exportReceivablesAsPerStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Receivables - As per Stock (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exportReceivablesAsPerAssessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Receivables - As per Assessment (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Cash Flow Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 3: Cash Flow Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cfSalesTurnoverBooks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Turnover as per Books (₹ crore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfSalesTurnoverGstr1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Turnover as per GSTR-1 (₹ crore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cfAmountRealisedFromCustomers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Realised from Customers (₹ crore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfTotalCreditSummations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Credit Summations (₹ crore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="cfOpeningDebtors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Debtors (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfSalesDuringPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales During Period (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfClosingDebtors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Debtors (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfCashRealisationComputed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash Realisation Computed (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="cfPeriodFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfPeriodTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period To</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfPeriodMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cfComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash Flow Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 4: Inventory Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 4: Inventory Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="invMarketValueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Value Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invMarketValueAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Value Amount (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Inventory Overview Table */}
              <EditableTable
                control={control}
                name="inventoryOverview"
                title="Inventory Overview"
                description="Category-wise stock position"
                columns={[
                  { key: 'category', header: 'Category' },
                  { key: 'amountCurrent', header: 'Amount - Current (₹ lakh)' },
                  { key: 'daysCurrent', header: 'Days - Current' },
                  { key: 'amountPrev1', header: 'Amount - Previous 1 (₹ lakh)' },
                  { key: 'daysPrev1', header: 'Days - Previous 1' },
                  { key: 'amountPrev2', header: 'Amount - Previous 2 (₹ lakh)' },
                  { key: 'daysPrev2', header: 'Days - Previous 2' },
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

              {/* Inventory Location Stocks Table */}
              <EditableTable
                control={control}
                name="inventoryLocationStocks"
                title="Location-wise Stock"
                columns={[
                  { key: 'location', header: 'Location' },
                  { key: 'rmAsPerSs', header: 'RM - As per SS (₹ lakh)' },
                  { key: 'rmAsPerAssessment', header: 'RM - As per Assessment (₹ lakh)' },
                  { key: 'wipAsPerSs', header: 'WIP - As per SS (₹ lakh)' },
                  { key: 'wipAsPerAssessment', header: 'WIP - As per Assessment (₹ lakh)' },
                  { key: 'fgAsPerSs', header: 'FG - As per SS (₹ lakh)' },
                  { key: 'fgAsPerAssessment', header: 'FG - As per Assessment (₹ lakh)' },
                  { key: 'storesAsPerSs', header: 'Stores - As per SS (₹ lakh)' },
                  { key: 'storesAsPerAssessment', header: 'Stores - As per Assessment (₹ lakh)' },
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="inventoryVariationComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Variation Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inventoryValuationComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Valuation Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="inventoryJobWorkDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Work Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inventoryThirdPartyStockDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Third Party Stock Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="inventoryControlQualityComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Control Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inventoryControlMisComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MIS Control Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Drawing Power against Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="dpStockEligible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Stock for DP (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dpStockMargin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margin on Stock (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dpStockAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available DP against Stock (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Section 5: Receivables Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 5: Receivables Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Receivables Overview Table */}
              <EditableTable
                control={control}
                name="receivablesOverview"
                title="Receivables Overview"
                columns={[
                  { key: 'category', header: 'Category' },
                  { key: 'amountCurrent', header: 'Amount - Current (₹ lakh)' },
                  { key: 'daysCurrent', header: 'Days - Current' },
                  { key: 'amountPrevYear', header: 'Amount - Previous Year (₹ lakh)' },
                  { key: 'daysPrevYear', header: 'Days - Previous Year' },
                  { key: 'amountPrev2Year', header: 'Amount - Previous 2 Year (₹ lakh)' },
                  { key: 'daysPrev2Year', header: 'Days - Previous 2 Year' },
                ]}
                emptyRow={{
                  category: '',
                  amountCurrent: '',
                  daysCurrent: '',
                  amountPrevYear: '',
                  daysPrevYear: '',
                  amountPrev2Year: '',
                  daysPrev2Year: '',
                }}
              />

              {/* Receivables from Associates */}
              <EditableTable
                control={control}
                name="receivablesFromAssociates"
                title="Receivables from Associates"
                columns={[
                  { key: 'partyName', header: 'Party Name' },
                  { key: 'relationship', header: 'Relationship' },
                  { key: 'amount', header: 'Amount (₹ lakh)' },
                  { key: 'ageing', header: 'Ageing (days)' },
                ]}
                emptyRow={{
                  partyName: '',
                  relationship: '',
                  amount: '',
                  ageing: '',
                }}
              />

              {/* Receivables Ageing Summary */}
              <EditableTable
                control={control}
                name="receivablesAgeingSummary"
                title="Age-wise Analysis of Receivables"
                columns={[
                  { key: 'partyName', header: 'Party Name' },
                  { key: 'totalOutstanding', header: 'Total Outstanding (₹ lakh)' },
                  { key: 'bucketUpto90', header: 'Upto 90 days' },
                  { key: 'bucket90to180', header: '91-180 days' },
                  { key: 'bucket180to365', header: '181-365 days' },
                  { key: 'bucketAbove365', header: 'Above 365 days' },
                  { key: 'disputed', header: 'Disputed (Y/N)' },
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

              {/* Receivable Ageing Buckets */}
              <EditableTable
                control={control}
                name="receivableAgeingBuckets"
                title="Receivable Ageing Buckets"
                columns={[
                  { key: 'periodicity', header: 'Periodicity' },
                  { key: 'asPerSs', header: 'As per Stock Statement (₹ lakh)' },
                  { key: 'asPerAssessment', header: 'As per Assessment (₹ lakh)' },
                ]}
                emptyRow={{
                  periodicity: '',
                  asPerSs: '',
                  asPerAssessment: '',
                }}
              />

              {/* Verified Debtors */}
              <EditableTable
                control={control}
                name="verifiedDebtors"
                title="Verified Debtors"
                columns={[
                  { key: 'partyName', header: 'Party Name' },
                  { key: 'amount', header: 'Amount Verified (₹ lakh)' },
                  { key: 'modeOfVerification', header: 'Mode of Verification' },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  partyName: '',
                  amount: '',
                  modeOfVerification: '',
                  remarks: '',
                }}
              />

              {/* Related Party Receivable Ageing */}
              <EditableTable
                control={control}
                name="relatedPartyReceivableAgeing"
                title="Related Party Receivable Ageing"
                columns={[
                  { key: 'partyName', header: 'Party Name' },
                  { key: 'relationship', header: 'Relationship' },
                  { key: 'totalOutstanding', header: 'Total Outstanding (₹ lakh)' },
                  { key: 'bucketUpto90', header: 'Upto 90 days' },
                  { key: 'bucket90to180', header: '91-180 days' },
                  { key: 'bucket180to365', header: '181-365 days' },
                  { key: 'bucketAbove365', header: 'Above 365 days' },
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receivablesVariationReasonsDetailed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivables Variation Reasons (Detailed)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="disputedReceivablesDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disputed Receivables Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="provisionRequiredDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provision Required Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivableAuditTrailComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivable Audit Trail Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="receivableCoverPeriodDaysDomestic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Period Days - Domestic</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivableCoverPeriodDaysExport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Period Days - Export</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="domesticRelatedPartyExcluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domestic Related Party Excluded</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domesticAboveCoverPeriodExcluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domestic Above Cover Period Excluded</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domesticReceivableMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domestic Receivable Margin (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="exportRelatedPartyExcluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Related Party Excluded</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exportAboveCoverPeriodExcluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Above Cover Period Excluded</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exportReceivableMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Receivable Margin (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Drawing Power against Receivables
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="eligibleReceivablesForDp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Receivables for DP (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dpReceivablesMargin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margin on Receivables (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dpReceivablesAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available DP against Receivables (₹ lakh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Section 6: Credit Facilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 6: Credit Facilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Executive Credit Facilities */}
              <EditableTable
                control={control}
                name="execCreditFacilities"
                title="Executive Credit Facilities"
                columns={[
                  { key: 'facilityType', header: 'Facility Type' },
                  { key: 'sanctionedLimit', header: 'Sanctioned Limit (₹ lakh)' },
                  { key: 'outstanding', header: 'Outstanding (₹ lakh)' },
                  { key: 'margin', header: 'Margin (%)' },
                  { key: 'natureOfLimit', header: 'Nature of Limit' },
                  { key: 'limitCrgb', header: 'Limit - CRGB (₹ lakh)' },
                  { key: 'limitOthers', header: 'Limit - Others (₹ lakh)' },
                  { key: 'outstandingCrgb', header: 'Outstanding - CRGB (₹ lakh)' },
                  { key: 'outstandingOthers', header: 'Outstanding - Others (₹ lakh)' },
                ]}
                emptyRow={{
                  facilityType: '',
                  sanctionedLimit: '',
                  outstanding: '',
                  margin: '',
                  natureOfLimit: '',
                  limitCrgb: '',
                  limitOthers: '',
                  outstandingCrgb: '',
                  outstandingOthers: '',
                }}
              />

              {/* External Facilities */}
              <EditableTable
                control={control}
                name="externalFacilities"
                title="External Facilities"
                columns={[
                  { key: 'natureOfLimit', header: 'Nature of Limit' },
                  { key: 'lenderName', header: 'Lender Name' },
                  { key: 'outstanding', header: 'Outstanding (₹ lakh)' },
                  { key: 'overdue', header: 'Overdue (₹ lakh)' },
                ]}
                emptyRow={{
                  natureOfLimit: '',
                  lenderName: '',
                  outstanding: '',
                  overdue: '',
                }}
              />
            </CardContent>
          </Card>

          {/* Section 7: SRA Team & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 7: SRA Team & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableTable
                control={control}
                name="sraTeamMembers"
                title="SRA Team Members"
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'qualification', header: 'Qualification' },
                  { key: 'membershipNo', header: 'Membership No.' },
                  { key: 'role', header: 'Role' },
                ]}
                emptyRow={{
                  name: '',
                  qualification: '',
                  membershipNo: '',
                  role: '',
                }}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sraCommencementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commencement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sraCompletionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sraVisitDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Dates</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Unit-1: 05-07-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 8: Statutory Dues & GST */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 8: Statutory Dues & GST
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statutory Dues Table */}
              <EditableTable
                control={control}
                name="statutoryDues"
                title="Statutory Dues"
                columns={[
                  { key: 'natureOfDue', header: 'Nature of Due' },
                  { key: 'amountOutstanding', header: 'Amount Outstanding (₹ lakh)' },
                  { key: 'paymentStatus', header: 'Payment Status' },
                ]}
                emptyRow={{
                  natureOfDue: '',
                  amountOutstanding: '',
                  paymentStatus: '',
                }}
              />

              <FormField
                control={form.control}
                name="statutoryDuesComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statutory Dues Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GST Return Rows */}
              <EditableTable
                control={control}
                name="gstReturnRows"
                title="GST Returns"
                columns={[
                  { key: 'returnType', header: 'Return Type' },
                  { key: 'filedUpto', header: 'Filed Upto' },
                  { key: 'status', header: 'Status' },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  returnType: '',
                  filedUpto: '',
                  status: '',
                  remarks: '',
                }}
              />

              <FormField
                control={form.control}
                name="statutoryLiabilitiesPressingCreditorsComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statutory Liabilities & Pressing Creditors Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 9: Insurance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 9: Insurance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Insurance Summary Table */}
              <EditableTable
                control={control}
                name="insuranceSummary"
                title="Insurance Summary"
                columns={[
                  { key: 'policyNo', header: 'Policy No.' },
                  { key: 'sumInsured', header: 'Sum Insured (₹ lakh)' },
                  { key: 'remarks', header: 'Remarks' },
                  { key: 'srNo', header: 'Sr. No.' },
                  { key: 'particular', header: 'Particulars' },
                  { key: 'natureOfSecurity', header: 'Nature of Security' },
                  { key: 'assetsSecured', header: 'Assets Secured' },
                  { key: 'dueDate', header: 'Due Date', type: 'date' },
                ]}
                emptyRow={{
                  policyNo: '',
                  sumInsured: '',
                  remarks: '',
                  srNo: '',
                  particular: '',
                  natureOfSecurity: '',
                  assetsSecured: '',
                  dueDate: '',
                }}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="insuranceCoverAsPerSanction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Cover as per Sanction?</FormLabel>
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
                  name="insuranceDeviationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Deviation Details</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="insGoodsFullyInsured"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goods Fully Insured?</FormLabel>
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
                  name="insCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="insPeakStockLastYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peak Stock Last Year (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insLenderNameIncluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Name Included?</FormLabel>
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
                  name="insAdditionalRisksIncluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Risks Included?</FormLabel>
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

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="insLocationCorrectInPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Correct in Policy?</FormLabel>
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
                  name="insTransitOrJobworkInsured"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transit/Jobwork Insured?</FormLabel>
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
                  name="insAnyLocationNotCovered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any Location Not Covered?</FormLabel>
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
                name="insExcludedRisksReasons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excluded Risks Reasons</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 10: ROC & MCA Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 10: ROC & MCA Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ROC Charges Table */}
              <EditableTable
                control={control}
                name="rocCharges"
                title="ROC Charges"
                columns={[
                  { key: 'natureOfCharge', header: 'Nature of Charge' },
                  { key: 'lender', header: 'Lender' },
                  { key: 'amount', header: 'Amount (₹ lakh)' },
                  { key: 'rocChargeId', header: 'ROC Charge ID' },
                ]}
                emptyRow={{
                  natureOfCharge: '',
                  lender: '',
                  amount: '',
                  rocChargeId: '',
                }}
              />

              {/* MCA Charge Rows */}
              <EditableTable
                control={control}
                name="mcaChargeRows"
                title="MCA Charges"
                columns={[
                  { key: 'dateOfRegn', header: 'Date of Registration', type: 'date' },
                  { key: 'dateOfDocument', header: 'Date of Document', type: 'date' },
                  { key: 'lenders', header: 'Lenders' },
                  { key: 'amountSecured', header: 'Amount Secured (₹ lakh)' },
                  { key: 'assetsCharged', header: 'Assets Charged' },
                ]}
                emptyRow={{
                  dateOfRegn: '',
                  dateOfDocument: '',
                  lenders: '',
                  amountSecured: '',
                  assetsCharged: '',
                }}
              />

              <FormField
                control={form.control}
                name="rocComplianceComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ROC Compliance Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 11: Creditors Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 11: Creditors Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="creditorsOpeningBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Balance (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditorsPurchasesDuringPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchases During Period (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="creditorsClosingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Balance (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditorsTotalPayments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Payments (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="creditorsTotalDebitSummations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Debit Summations (₹ lakh)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Verified Creditors */}
              <EditableTable
                control={control}
                name="verifiedCreditors"
                title="Verified Creditors"
                columns={[
                  { key: 'partyName', header: 'Party Name' },
                  { key: 'amount', header: 'Amount Verified (₹ lakh)' },
                  { key: 'modeOfVerification', header: 'Mode of Verification' },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  partyName: '',
                  amount: '',
                  modeOfVerification: '',
                  remarks: '',
                }}
              />

              <FormField
                control={form.control}
                name="creditorsComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creditors Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditorsMovementComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creditors Movement Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 12: Drawing Power & Sales Routing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 12: Drawing Power & Sales Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drawing Power Rows */}
              <EditableTable
                control={control}
                name="drawingPowerRows"
                title="Drawing Power Calculation"
                columns={[
                  { key: 'srNo', header: 'Sr. No.' },
                  { key: 'particular', header: 'Particulars' },
                  { key: 'asPerSs', header: 'As per Stock Statement (₹ lakh)' },
                  { key: 'asPerAssessment', header: 'As per Assessment (₹ lakh)' },
                  { key: 'remarks', header: 'Remarks' },
                ]}
                emptyRow={{
                  srNo: '',
                  particular: '',
                  asPerSs: '',
                  asPerAssessment: '',
                  remarks: '',
                }}
              />

              {/* Sales Routing Rows */}
              <EditableTable
                control={control}
                name="salesRoutingRows"
                title="Sales Routing"
                columns={[
                  { key: 'bankName', header: 'Bank Name' },
                  { key: 'accountNo', header: 'Account No.' },
                  { key: 'forMonth', header: 'For Month' },
                  { key: 'drSummation', header: 'DR Summation (₹ lakh)' },
                  { key: 'crSummation', header: 'CR Summation (₹ lakh)' },
                ]}
                emptyRow={{
                  bankName: '',
                  accountNo: '',
                  forMonth: '',
                  drSummation: '',
                  crSummation: '',
                }}
              />

              <FormField
                control={form.control}
                name="purchaseSalesDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase/Sales Details</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 13: Miscellaneous */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 13: Miscellaneous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="miscEmployeeRelationComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Relation Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="miscPowerAvailabilityComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power Availability Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="miscNoticesReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notices Received?</FormLabel>
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
                  name="miscOtherBankAccounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Bank Accounts?</FormLabel>
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
                  name="miscDiversionOfFunds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diversion of Funds?</FormLabel>
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
                name="miscNoticesDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notices Details</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="miscOtherBankAccountsDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Bank Accounts Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="miscDiversionOfFundsDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diversion of Funds Details</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="miscSalesRoutingThroughLenders"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Routing Through Lenders?</FormLabel>
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
                  name="miscHypothecationBoardDisplayed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hypothecation Board Displayed?</FormLabel>
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
                  name="miscJobWorkStockSeparatelyStored"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Work Stock Separately Stored?</FormLabel>
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
                name="miscSalesRoutingDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Routing Details</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="miscJobWorkStockDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Work Stock Details</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="miscLevelOfActivityComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level of Activity Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="miscSpecialEventsComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Events Comments</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="miscConstraintsDuringSra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Constraints During SRA?</FormLabel>
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
                  name="miscConstraintsDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Constraints Details</FormLabel>
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
                name="miscSuggestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggestions</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 14: Mandatory Books */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 14: Mandatory Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableTable
                control={control}
                name="mandatoryBooks"
                title="Mandatory Books & Returns"
                columns={[
                  { key: 'name', header: 'Book/Return Name' },
                  { key: 'applicability', header: 'Applicability' },
                  { key: 'status', header: 'Status' },
                ]}
                emptyRow={{
                  name: '',
                  applicability: '',
                  status: '',
                }}
              />

              <FormField
                control={form.control}
                name="booksOfAccountComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Books of Account Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnsComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Returns Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 15: Report Details & Certificate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Section 15: Report Details & Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="crgbBranchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRGB Branch Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firmName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firm Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="reportPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Place</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auditor Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="saleInvoiceVerifiedAsOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Invoice Verified As On</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivableAsOnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivable As On Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivableStockStatementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivable Stock Statement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receivableAmountLacs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivable Amount (₹ lakh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Verification Thresholds */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Verification Thresholds
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="debtorVerificationPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debtor Verification %</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="debtorVerificationMinCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debtor Min Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditorVerificationPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creditor Verification %</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditorVerificationMinCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creditor Min Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receivablesTradeConfirmedAbove50Lacs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receivables Trade Confirmed Above 50 Lacs</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditorsTradeConfirmedThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creditors Trade Confirmed Threshold</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cashFlowVerificationComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash Flow Verification Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificateExceptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Exceptions</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificateComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || saveTgbReportMutation.isPending}
            >
              {isSubmitting || saveTgbReportMutation.isPending ? 'Saving…' : 'Save Report'}
            </Button>
          </div>
        </form>
      </Form>
    </MainWrapper>
  )
}

export const Route = createFileRoute(
  '/_authenticated/stock-audit/$accountId/report/$assignmentIdCRGB',
)({
  component: RouteComponent,
})