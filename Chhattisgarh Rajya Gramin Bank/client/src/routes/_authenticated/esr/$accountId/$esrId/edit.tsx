import { createFileRoute } from "@tanstack/react-router";
import ESRFormPage from "@/features/ESR/pages/ESRfrom";

export const Route = createFileRoute("/_authenticated/esr/$accountId/$esrId/edit")({
  component: Page,
});

function Page() {
  const { accountId, esrId } = Route.useParams();
  return <ESRFormPage accountId={accountId} esrId={esrId} mode="edit" />;
}
