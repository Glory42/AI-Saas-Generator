import { createFileRoute } from "@tanstack/react-router";
import { usageStatsQueryOptions } from "@/features/settings/hooks/useAccount";
import { StudioPage } from "@/features/studio/pages/StudioPage";
import { templatesQueryOptions } from "@/features/templates/hooks/useTemplates";

export const Route = createFileRoute("/_app/studio")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(templatesQueryOptions),
      context.queryClient.ensureQueryData(usageStatsQueryOptions),
    ]),
  component: StudioPage,
});
