import { createFileRoute } from "@tanstack/react-router";
import CreditAuditFetchPage from "@/features/credit-audit/pages/CreditAuditFetch";

export const Route = createFileRoute("/_authenticated/creditAudit/fetch")({
  component: CreditAuditFetchPage,
});