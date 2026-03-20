import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Building2,
  ClipboardList,
  ShieldCheck,
  ActivityIcon,
  Wrench,
  Car,
  Landmark,
  ClipboardCheck,
  PenLine,
} from "lucide-react";
import YesNoField from "../components/YesNoField";
import { ESRFormSchema, type ESRFormValues } from "../esr.schema";
import { esrStore, makeId } from "../esr.storage";
import type { ESRRecord } from "../esr.types";
import useAccountDetails from "@/hooks/use-account-details";
import { Header } from "@/components/layout/header";
import BranchSelector from "@/features/dashboard/components/branch-selector";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Main } from "@/components/layout/main";
import { AppBreadcrumb } from "@/components/breadcrumb/app-breadcrumb";
import { Home } from "@/components/breadcrumb/common-crumbs";
function toAddress(d?: {
  add1?: string | null;
  add2?: string | null;
  add3?: string | null;
  add4?: string | null;
}) {
  return [d?.add1, d?.add2, d?.add3, d?.add4].filter(Boolean).join(", ");
}
export default function ESRFormPage({
  accountId,
  esrId,
  mode,
}: {
  accountId: string;
  esrId?: string;
  mode: "create" | "edit";
}) {
  const { data: acct, isLoading: acctLoading } = useAccountDetails(
    accountId,
    true
  );
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [deptId, setDeptId] = useState<string | undefined>(undefined);

  const existing = useMemo(() => {
    if (!esrId) return undefined;
    return esrStore.get(accountId, esrId);
  }, [accountId, esrId]);

const defaultValues: ESRFormValues = useMemo(
    () => ({
      branch: "",
      reviewDate: "",
      loanAccountNo: accountId,
      unitBorrowerName: "",
      proprietorPartnerDirectorName: "",
      address: "",
      purposeOfLoan: "",
      sanctionedAmount: "",
      sanctionDate: "",
      controlMonitoringDate: "",
      legalVettingDate: "",
      disbursementDate: "",
      amountDisbursed: "",
      caseType: "NORMAL",
      productType: "GENERAL",
      correctProductOpened: "YES",
      interestRateCorrect: "YES",
      marginBroughtInAtDisbursement: "YES",
      allChargesRecovered: "YES",
      assetsLiabilitiesNotarized: "YES",

      takeover_collateralDocsReceived: undefined,
      takeover_noChangeInSecurity: undefined,
      takeover_primaryChargeAndLienCompleted: undefined,
      takeover_primaryChargeDate: "",
      takeover_lienMarkingDate: "",
      takeover_sanctionTnCComplied: undefined,
      takeover_termsAndCondition: "",

      sanctionTnCFullyComplied: "YES",
      sanctionTnCDetails: "",
      loanDocDeficiencies: "",
      borrowerAcknowledgementObtained: "YES",
      chargeMortgageCreationDate: "",

      registrationDate: "",
      registrationPlace: "",
      registrationNo: "",
      revenueRecordChargeEntryDate: "",
      rocChargeRegistrationDate: "",

      insuranceStatusText: "",
      endUseDisbursementStage: "PARTIAL",
      invoices: [
        { invoiceNo: "", invoiceDate: "", invoiceAmount: "", description: "" },
      ],

      construction_disbursedAsPerScheduleAfterMargin: undefined,

      vehicle_registrationNo: "",
      vehicle_bankHypothecationMarkedOnRC: undefined,
      vehicle_insuredWithBankEndorsement: undefined,
      vehicle_insuranceFrom: "",
      vehicle_insuranceTo: "",

      machinery_installationDate: "",
      machinery_satisfactionCertificateDate: "",
      machinery_amount: "",

      agri_insuranceStatus: "",
      agri_otherInfo: "",

      cc_stockStatementObtainedAndInspectionDone: undefined,
      cc_stockInspectionDate: "",

      inspectionDate: "",
      remarksOpinion: "",

      officerName: "",
      officerDesignation: "",
      signDate: "",
    }),
    [accountId]
  );

  const form = useForm<ESRFormValues>({
    resolver: zodResolver(ESRFormSchema),
    defaultValues: existing ? (existing as ESRFormValues) : defaultValues,
    mode: "onBlur",
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = form;

  const productType = watch("productType");
  const caseType = watch("caseType");
  const invoicesFA = useFieldArray({ control, name: "invoices" });
  const takeover_sanctionTnCComplied = watch("takeover_sanctionTnCComplied");
  const takeover_primaryChargeAndLienCompleted = watch(
    "takeover_primaryChargeAndLienCompleted"
  );

  useEffect(() => {
    if (!acct || mode !== "create") return;
    if (acct.branchName) setValue("branch", acct.branchName);
    if (acct.custName) setValue("unitBorrowerName", acct.custName);
    const addr = toAddress(acct);
    if (addr) setValue("address", addr);
    if (acct.sanctDt) {
      const d = acct.sanctDt.slice(0, 10);
      setValue("sanctionDate", d);
    }
  }, [acct, mode, setValue]);

  const onSubmit = async (values: ESRFormValues) => {
    const nowIso = new Date().toISOString();
    const record: ESRRecord = {
      id: existing?.id ?? makeId(),
      accountId,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      ...values,
    };
    esrStore.upsert(accountId, record);
    toast.success(mode === "create" ? "ESR created" : "ESR updated");
  };

  return (
    <>
      <Header>
        <BranchSelector
          value={branchId}
          setValue={setBranchId}
          deptValue={deptId}
          deptSetValue={setDeptId}
        />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="px-4 py-4 md:px-8">
        <AppBreadcrumb
          className="mb-4"
          crumbs={[Home]}
          currentPage={{ type: "label", label: "Early Sanction Review" }}
        />

        <div className="mx-auto max-w-6xl space-y-6 pb-28 animate-fadeIn">
          <Card className="border-t-4 border-t-accent shadow-sm">
            <CardHeader className="py-5 flex flex-col gap-1.5">
              <CardTitle className="font-manrope text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Early Sanction Review (ESR)
                <span className="text-muted-foreground font-medium">
                  — {accountId}
                </span>
              </CardTitle>
              <div className="text-lg font-medium text-secondary-foreground">
                {acctLoading
                  ? "Loading account details..."
                  : acct
                    ? `Borrower: ${acct.custName}`
                    : ""}
              </div>
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Basic Details */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  Basic Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Account & Classification */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-primary uppercase">
                    Account & Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Branch <span className="text-destructive">*</span>
                      </Label>
                      <Input {...register("branch")} className="mt-1.5" disabled />
                      {errors.branch?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.branch.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Loan Account No.{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("loanAccountNo")}
                        className="mt-1.5"
                        disabled
                      />
                      {errors.loanAccountNo?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.loanAccountNo.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Review Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register("reviewDate")}
                        className="mt-1.5"
                      />
                      {errors.reviewDate?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.reviewDate.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Case Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        control={control}
                        name="caseType"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NORMAL">Normal</SelectItem>
                              <SelectItem value="TAKEOVER">Takeover</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.caseType?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.caseType.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Product Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        control={control}
                        name="productType"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GENERAL">General</SelectItem>
                              <SelectItem value="CONSTRUCTION">
                                Construction
                              </SelectItem>
                              <SelectItem value="VEHICLE">Vehicle</SelectItem>
                              <SelectItem value="MACHINERY">Machinery</SelectItem>
                              <SelectItem value="AGRICULTURE">
                                Agriculture
                              </SelectItem>
                              <SelectItem value="CC_LIMIT">CC Limit</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.productType?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.productType.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Borrower Profile */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-primary uppercase">
                    Borrower Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Name of Unit / Borrower{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("unitBorrowerName")}
                        className="mt-1.5"
                      />
                      {errors.unitBorrowerName?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.unitBorrowerName.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-secondary-foreground">
                        Proprietor / Partner / Director{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("proprietorPartnerDirectorName")}
                        className="mt-1.5"
                      />
                      {errors.proprietorPartnerDirectorName?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.proprietorPartnerDirectorName.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      {...register("address")}
                      className="mt-1.5 min-h-[80px] py-2"
                    />
                    {errors.address?.message && (
                      <div className="mt-1.5 text-xs text-destructive">
                        {errors.address.message}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Financials & Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-primary uppercase">
                    Financials & Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Purpose of Loan{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        {...register("purposeOfLoan")}
                        className="mt-1.5 min-h-[60px] py-2"
                      />
                      {errors.purposeOfLoan?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.purposeOfLoan.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Sanctioned Amount{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("sanctionedAmount")}
                        inputMode="decimal"
                        className="mt-1.5"
                      />
                      {errors.sanctionedAmount?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.sanctionedAmount.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Amount Disbursed{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("amountDisbursed")}
                        inputMode="decimal"
                        className="mt-1.5"
                      />
                      {errors.amountDisbursed?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.amountDisbursed.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Sanction Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register("sanctionDate")}
                        className="mt-1.5"
                      />
                      {errors.sanctionDate?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.sanctionDate.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Control / Monitoring Date{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register("controlMonitoringDate")}
                        className="mt-1.5"
                      />
                      {errors.controlMonitoringDate?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.controlMonitoringDate.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Date of Disbursement{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register("disbursementDate")}
                        className="mt-1.5"
                      />
                      {errors.disbursementDate?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.disbursementDate.message}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-secondary-foreground">
                        Legal Vetting Date
                      </Label>
                      <Input
                        type="date"
                        {...register("legalVettingDate")}
                        className="mt-1.5"
                      />
                      {errors.legalVettingDate?.message && (
                        <div className="mt-1.5 text-xs text-destructive">
                          {errors.legalVettingDate.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Compliance Checklist */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Compliance Checklist
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-5 p-6">
                <Controller
                  control={control}
                  name="correctProductOpened"
                  render={({ field }) => (
                    <YesNoField
                      label="Has the loan account been opened under correct product?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.correctProductOpened?.message}
                    />
                  )}
                />
                <Separator />

                <Controller
                  control={control}
                  name="interestRateCorrect"
                  render={({ field }) => (
                    <YesNoField
                      label="Is the interest rate correctly applied in the loan account?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.interestRateCorrect?.message}
                    />
                  )}
                />
                <Separator />

                <Controller
                  control={control}
                  name="marginBroughtInAtDisbursement"
                  render={({ field }) => (
                    <YesNoField
                      label="Confirm margin is being brought in by borrower through loan account at each disbursement stage?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.marginBroughtInAtDisbursement?.message}
                    />
                  )}
                />
                <Separator />

                <Controller
                  control={control}
                  name="allChargesRecovered"
                  render={({ field }) => (
                    <YesNoField
                      label="Have all applicable charges (processing, documentation, primary/collateral charge creation, etc.) been recovered from the loan account?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.allChargesRecovered?.message}
                    />
                  )}
                />
                <Separator />

                <Controller
                  control={control}
                  name="assetsLiabilitiesNotarized"
                  render={({ field }) => (
                    <YesNoField
                      label="Confirm that the Assets & Liabilities obtained from the borrower have been notarized?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.assetsLiabilitiesNotarized?.message}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* D) Sanction / Documents / Charge Creation */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-accent" />
                  Sanction / Documents / Charge Creation
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <Controller
                  control={control}
                  name="sanctionTnCFullyComplied"
                  render={({ field }) => (
                    <YesNoField
                      label="All terms & conditions in sanction letter fully complied with?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.sanctionTnCFullyComplied?.message}
                    />
                  )}
                />

                <div>
                  <Label className="text-secondary-foreground">
                    Details (if any)
                  </Label>
                  <Textarea
                    {...register("sanctionTnCDetails")}
                    className="mt-1.5 min-h-[80px]"
                  />
                  {errors.sanctionTnCDetails?.message && (
                    <div className="mt-1.5 text-xs text-destructive">
                      {errors.sanctionTnCDetails.message}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-secondary-foreground">
                    Loan documents checked – deficiencies noticed (if any)
                  </Label>
                  <Textarea
                    {...register("loanDocDeficiencies")}
                    className="mt-1.5 min-h-[80px]"
                  />
                  {errors.loanDocDeficiencies?.message && (
                    <div className="mt-1.5 text-xs text-destructive">
                      {errors.loanDocDeficiencies.message}
                    </div>
                  )}
                </div>

                <Controller
                  control={control}
                  name="borrowerAcknowledgementObtained"
                  render={({ field }) => (
                    <YesNoField
                      label="Borrower signed acknowledgement/receipt for schedule of charges & T&Cs obtained; copy given + copy attached?"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.borrowerAcknowledgementObtained?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-secondary-foreground">
                      Date of creation of charge/mortgage on primary & collateral
                      property
                    </Label>
                    <Input
                      type="date"
                      {...register("chargeMortgageCreationDate")}
                      className="mt-1.5"
                    />
                    {errors.chargeMortgageCreationDate?.message && (
                      <div className="mt-1.5 text-xs text-destructive">
                        {errors.chargeMortgageCreationDate.message}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* E) Registration / ROC / Revenue */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-accent" />
                  Registration / ROC / Revenue Records
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-secondary-foreground">
                      Date of registration
                    </Label>
                    <Input
                      type="date"
                      {...register("registrationDate")}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">Place</Label>
                    <Input
                      {...register("registrationPlace")}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Registration No.
                    </Label>
                    <Input
                      {...register("registrationNo")}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Date charge entry recorded in revenue records
                    </Label>
                    <Input
                      type="date"
                      {...register("revenueRecordChargeEntryDate")}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Date of ROC charge registration (company cases)
                    </Label>
                    <Input
                      type="date"
                      {...register("rocChargeRegistrationDate")}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* G) Product-specific conditional blocks */}
            {productType === "CONSTRUCTION" && (
              <Card className="border-l-4 border-l-primary shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-accent" />
                    Construction Case
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <Controller
                    control={control}
                    name="construction_disbursedAsPerScheduleAfterMargin"
                    render={({ field }) => (
                      <YesNoField
                        label="Confirm disbursement is as per approved schedule and only after borrower margin contribution?"
                        value={field.value}
                        onChange={field.onChange}
                        error={
                          errors.construction_disbursedAsPerScheduleAfterMargin
                            ?.message
                        }
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {productType === "VEHICLE" && (
              <Card className="border-l-4 border-l-primary shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg flex items-center gap-2">
                    <Car className="h-5 w-5 text-accent" />
                    Vehicle Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label className="text-secondary-foreground">
                      Registration No.
                    </Label>
                    <Input
                      {...register("vehicle_registrationNo")}
                      className="mt-1.5"
                    />
                  </div>

                  <Controller
                    control={control}
                    name="vehicle_bankHypothecationMarkedOnRC"
                    render={({ field }) => (
                      <YesNoField
                        label="Is Bank’s hypothecation/charge marked on RC book?"
                        value={field.value}
                        onChange={field.onChange}
                        error={
                          errors.vehicle_bankHypothecationMarkedOnRC?.message
                        }
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="vehicle_insuredWithBankEndorsement"
                    render={({ field }) => (
                      <YesNoField
                        label="Whether vehicle is insured and bank endorsement noted in policy?"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.vehicle_insuredWithBankEndorsement?.message}
                      />
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Insurance From
                      </Label>
                      <Input
                        type="date"
                        {...register("vehicle_insuranceFrom")}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-secondary-foreground">
                        Insurance To
                      </Label>
                      <Input
                        type="date"
                        {...register("vehicle_insuranceTo")}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {productType === "MACHINERY" && (
              <Card className="border-l-4 border-l-primary shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-accent" />
                    Machinery Case
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Date of installation
                      </Label>
                      <Input
                        type="date"
                        {...register("machinery_installationDate")}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-secondary-foreground">
                        Borrower’s satisfaction certificate date
                      </Label>
                      <Input
                        type="date"
                        {...register("machinery_satisfactionCertificateDate")}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-secondary-foreground">
                        Amount
                      </Label>
                      <Input
                        {...register("machinery_amount")}
                        inputMode="decimal"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {productType === "AGRICULTURE" && (
              <Card className="border-l-4 border-l-primary shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-accent" />
                    Agriculture / Allied Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label className="text-secondary-foreground">
                      Insurance status
                    </Label>
                    <Textarea
                      {...register("agri_insuranceStatus")}
                      className="mt-1.5 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-secondary-foreground">
                      Other information
                    </Label>
                    <Textarea
                      {...register("agri_otherInfo")}
                      className="mt-1.5 min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {productType === "CC_LIMIT" && (
              <Card className="border-l-4 border-l-primary shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-accent" />
                    CC Limit Case
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <Controller
                    control={control}
                    name="cc_stockStatementObtainedAndInspectionDone"
                    render={({ field }) => (
                      <YesNoField
                        label="Stock statement obtained and stock inspection carried out?"
                        value={field.value}
                        onChange={field.onChange}
                        error={
                          errors.cc_stockStatementObtainedAndInspectionDone
                            ?.message
                        }
                      />
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-secondary-foreground">
                        Stock inspection date
                      </Label>
                      <Input
                        type="date"
                        {...register("cc_stockInspectionDate")}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* C) Takeover conditional */}
            {caseType === "TAKEOVER" && (
              <Card className="border-l-4 border-l-accent shadow-sm animate-fadeIn">
                <CardHeader className="py-5 bg-muted/10 border-b border-border">
                  <CardTitle className="font-manrope text-lg">
                    Takeover Specifics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-5 p-6">
                  <Controller
                    control={control}
                    name="takeover_collateralDocsReceived"
                    render={({ field }) => (
                      <YesNoField
                        label="Collateral security documents received by branch?"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.takeover_collateralDocsReceived?.message}
                      />
                    )}
                  />
                  <Separator />

                  <Controller
                    control={control}
                    name="takeover_noChangeInSecurity"
                    render={({ field }) => (
                      <YesNoField
                        label="No change in primary & collateral security already held in previous bank?"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.takeover_noChangeInSecurity?.message}
                      />
                    )}
                  />
                  <Separator />

                  <Controller
                    control={control}
                    name="takeover_primaryChargeAndLienCompleted"
                    render={({ field }) => (
                      <YesNoField
                        label="Registration/creation of primary charge and lien marking completed?"
                        value={field.value}
                        onChange={field.onChange}
                        error={
                          errors.takeover_primaryChargeAndLienCompleted?.message
                        }
                      />
                    )}
                  />

                  {takeover_primaryChargeAndLienCompleted === "YES" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-secondary-foreground">
                          Date of primary charge
                        </Label>
                        <Input
                          type="date"
                          {...register("takeover_primaryChargeDate")}
                          className="mt-1.5"
                        />
                        {errors.takeover_primaryChargeDate?.message && (
                          <div className="mt-1.5 text-xs text-destructive">
                            {errors.takeover_primaryChargeDate.message}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-secondary-foreground">
                          Date of lien marking
                        </Label>
                        <Input
                          type="date"
                          {...register("takeover_lienMarkingDate")}
                          className="mt-1.5"
                        />
                        {errors.takeover_lienMarkingDate?.message && (
                          <div className="mt-1.5 text-xs text-destructive">
                            {errors.takeover_lienMarkingDate.message}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <Controller
                    control={control}
                    name="takeover_sanctionTnCComplied"
                    render={({ field }) => (
                      <YesNoField
                        label="Takeover sanction letter T&Cs complied with?"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.takeover_sanctionTnCComplied?.message}
                      />
                    )}
                  />

                  {/* If you want remarks when complied, keep YES; if you want reasons when NOT complied, change to === "NO" */}
                  {takeover_sanctionTnCComplied === "YES" && (
                    <>
                      <div>
                        <Label className="text-secondary-foreground">
                          Takeover T&C remarks (if any)
                        </Label>
                        <Textarea
                          {...register("takeover_termsAndCondition")}
                          className="mt-1.5 min-h-[80px] py-2"
                        />
                        {errors.takeover_termsAndCondition?.message && (
                          <div className="mt-1.5 text-xs text-destructive">
                            {errors.takeover_termsAndCondition.message}
                          </div>
                        )}
                      </div>
                      <Separator />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* F) Insurance + End-use Verification */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5 text-accent" />
                  Insurance & End-use
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-secondary-foreground">
                      Insurance status (Primary & Collateral){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      {...register("insuranceStatusText")}
                      className="mt-1.5 min-h-[60px] py-2"
                    />
                    {errors.insuranceStatusText?.message && (
                      <div className="mt-1.5 text-xs text-destructive">
                        {errors.insuranceStatusText.message}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Disbursement Stage{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="endUseDisbursementStage"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                            <SelectItem value="FULL">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-border my-6" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Bills / Invoices{" "}
                      <span className="text-destructive">*</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Record all related invoices for this ESR.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    onClick={() =>
                      invoicesFA.append({
                        invoiceNo: "",
                        invoiceDate: "",
                        invoiceAmount: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Invoice
                  </Button>
                </div>

                {errors.invoices?.message && (
                  <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
                    {errors.invoices.message}
                  </div>
                )}

                <div className="space-y-4">
                  {invoicesFA.fields.map((f, idx) => {
                    const rowErr = errors.invoices?.[idx];
                    return (
                      <Card
                        key={f.id}
                        className="border-l-4 border-l-primary shadow-sm bg-muted/10 animate-fadeIn relative overflow-hidden"
                      >
                        <CardContent className="pt-6 pb-6 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-muted-foreground tracking-wide">
                              INVOICE #{idx + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => invoicesFA.remove(idx)}
                              disabled={invoicesFA.fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <Label className="text-xs">Invoice No. *</Label>
                              <Input
                                {...register(
                                  `invoices.${idx}.invoiceNo` as const
                                )}
                                className="mt-1 bg-background"
                              />
                              {rowErr?.invoiceNo?.message && (
                                <div className="mt-1 text-xs text-destructive">
                                  {rowErr.invoiceNo.message}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs">Date *</Label>
                              <Input
                                type="date"
                                {...register(
                                  `invoices.${idx}.invoiceDate` as const
                                )}
                                className="mt-1 bg-background"
                              />
                              {rowErr?.invoiceDate?.message && (
                                <div className="mt-1 text-xs text-destructive">
                                  {rowErr.invoiceDate.message}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs">Amount *</Label>
                              <Input
                                {...register(
                                  `invoices.${idx}.invoiceAmount` as const
                                )}
                                inputMode="decimal"
                                className="mt-1 bg-background"
                              />
                              {rowErr?.invoiceAmount?.message && (
                                <div className="mt-1 text-xs text-destructive">
                                  {rowErr.invoiceAmount.message}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs">Description *</Label>
                              <Textarea
                                {...register(
                                  `invoices.${idx}.description` as const
                                )}
                                className="mt-1 bg-background min-h-[60px] py-2"
                              />
                              {rowErr?.description?.message && (
                                <div className="mt-1 text-xs text-destructive">
                                  {rowErr.description.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* H) Inspection + Remarks */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-accent" />
                  Inspection + Remarks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-secondary-foreground">
                      Inspection Date
                    </Label>
                    <Input
                      type="date"
                      {...register("inspectionDate")}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-secondary-foreground">
                    Remarks / Opinion
                  </Label>
                  <Textarea
                    {...register("remarksOpinion")}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* I) Footer / Sign-off */}
            <Card className="border-border shadow-sm">
              <CardHeader className="py-5 bg-muted/20 border-b border-border">
                <CardTitle className="font-manrope text-lg flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-accent" />
                  Sign-off
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-secondary-foreground">
                      Name of Inspecting Officer
                    </Label>
                    <Input {...register("officerName")} className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">
                      Designation
                    </Label>
                    <Input
                      {...register("officerDesignation")}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-secondary-foreground">Date</Label>
                    <Input
                      type="date"
                      {...register("signDate")}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Fixed action bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 transition-all">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
                <div className="text-sm font-medium text-muted-foreground hidden sm:block">
                  {mode === "create" ? "Creating new record" : "Editing existing record"}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 flex-1 sm:flex-none bg-background shadow-sm"
                    onClick={() =>
                      reset(existing ? (existing as ESRFormValues) : defaultValues)
                    }
                    disabled={isSubmitting}
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 flex-1 sm:flex-none bg-primary text-primary-foreground shadow-sm hover:brightness-105 transition-all"
                  >
                    <Save className="h-4 w-4" />{" "}
                    {isSubmitting
                      ? "Saving..."
                      : mode === "create"
                        ? "Create ESR"
                        : "Update ESR"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Main>
    </>
  );
}