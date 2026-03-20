import { createFileRoute } from "@tanstack/react-router";
import ContractStagePage from "@/workflow.contract/ui/ContractStagePage";

export const Route = createFileRoute("/_authenticated/wf/instances/$instanceId/stages/$stageDefId")({
  component: Page,
});

function Page() {
  const { instanceId, stageDefId } = Route.useParams();
  return <ContractStagePage instanceId={Number(instanceId)} stageDefId={Number(stageDefId)} />;
}