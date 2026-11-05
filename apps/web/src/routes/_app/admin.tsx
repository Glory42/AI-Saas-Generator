import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import type { AdminUsersQuery } from "@/features/admin/api";
import { adminStatsQueryOptions, adminUsersQueryOptions } from "@/features/admin/hooks/useAdmin";
import { AdminPage } from "@/features/admin/pages/AdminPage";
import { requireAdminUser } from "@/lib/router/auth-guards";

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).catch(1),
  search: z.string().trim().max(100).default("").catch(""),
});

export const Route = createFileRoute("/_app/admin")({
  validateSearch: searchSchema,
  beforeLoad: ({ context, location }) =>
    requireAdminUser({ queryClient: context.queryClient, redirectPath: location.href }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminStatsQueryOptions),
      context.queryClient.ensureQueryData(adminUsersQueryOptions(deps)),
    ]),
  component: AdminRoute,
});

function AdminRoute() {
  const query = Route.useSearch();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate({ from: Route.fullPath });

  const handleQueryChange = (next: AdminUsersQuery) => navigate({ search: next });

  return <AdminPage currentUserId={user.id} query={query} onQueryChange={handleQueryChange} />;
}
