import { createFileRoute } from "@tanstack/react-router";
import ESRFormPage from "@/features/ESR/pages/ESRfrom";

export const Route = createFileRoute("/_authenticated/esr/$accountId/new")({
  component: Page,
});

function Page() {
  const { accountId } = Route.useParams();
  return <ESRFormPage accountId={accountId} mode="create" />;
}
