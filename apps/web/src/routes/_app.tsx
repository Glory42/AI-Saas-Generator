import { Outlet, createFileRoute } from "@tanstack/react-router";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const user = await requireAuthenticatedUser({
      queryClient: context.queryClient,
      redirectPath: location.href,
    });
    return { user };
  },
  component: Outlet,
  errorComponent: (props) => <RouteErrorBoundary {...props} />,
});
