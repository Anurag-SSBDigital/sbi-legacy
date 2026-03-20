import { createFileRoute } from "@tanstack/react-router";
import ESRListing from "@/features/ESR/pages/ESRListing";

export const Route = createFileRoute("/_authenticated/esr/$accountId/")({
  component: Page,
});

function Page() {
  const { accountId } = Route.useParams();
  return <ESRListing accountId={accountId} />;
}
