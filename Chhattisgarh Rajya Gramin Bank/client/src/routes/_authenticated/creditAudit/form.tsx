import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import CreditAuditFormPage from "@/features/credit-audit/pages/CreditAuditForm";

const SearchSchema = z
  .object({
    accountId: z.string().min(1, "accountId is required"),
    mode: z.enum(["create", "edit"]).default("create"),
    auditId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "edit" && !v.auditId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["auditId"],
        message: "auditId is required in edit mode",
      });
    }
  });

export const Route = createFileRoute("/_authenticated/creditAudit/form")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId, auditId, mode } = Route.useSearch();
  return (
    <CreditAuditFormPage
      accountId={accountId}
      auditId={auditId}
      mode={mode}
    />
  );
}