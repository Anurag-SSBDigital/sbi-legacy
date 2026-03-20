import { createFileRoute } from "@tanstack/react-router";
import BuilderPage from "@/workflow.dynamic/ui/BuilderPage";

export const Route = createFileRoute("/_authenticated/wf/builder")({
  component: BuilderPage,
});