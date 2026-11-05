import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireGuestUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => requireGuestUser(context.queryClient),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Outlet />
    </div>
  );
}
