import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usageStatsQueryOptions } from "@/features/settings/hooks/useAccount";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export const Route = createFileRoute("/_app/settings")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(usageStatsQueryOptions);
  },
  component: SettingsRoute,
});

function SettingsRoute() {
  // Read the live session instead of route context so profile edits show up immediately.
  const { user } = useAuth();
  return user ? <SettingsPage user={user} /> : null;
}
