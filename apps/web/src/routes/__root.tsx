import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { Toaster } from "@/components/ui/toaster";

type RouterContext = {
  queryClient: QueryClient;
};

function RootLayout() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <AppNavbar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <AppFooter />
      </div>
      <Toaster />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-left" /> : null}
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="The app failed to load" />,
});
