import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/wf/instances/$instanceId")({
  component: () => <Outlet />,
});