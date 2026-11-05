import { createFileRoute, redirect } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { templatesQueryOptions } from "@/features/templates/hooks/useTemplates";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(authQueryOptions).catch(() => null);
    if (user) throw redirect({ to: "/studio" });
  },
  loader: ({ context }) => {
    // The showcase degrades gracefully, so a failed prefetch must not block the landing page.
    void context.queryClient.prefetchQuery(templatesQueryOptions);
  },
  component: LandingPage,
});
