import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import CreditAuditListingPage from "@/features/credit-audit/pages/CreditAuditListing";

const SearchSchema = z.object({
  accountId: z.string().min(1, "accountId is required"),
});

export const Route = createFileRoute("/_authenticated/creditAudit/listing")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId } = Route.useSearch();
  return <CreditAuditListingPage accountId={accountId} />;
}