import { PageHeader } from "@/components/ui/page-header";
import type { AdminUsersQuery } from "../api";
import { AdminStatsGrid } from "../components/AdminStatsGrid";
import { AuditLogList } from "../components/AuditLogList";
import { UsersTable } from "../components/UsersTable";

type AdminPageProps = {
  currentUserId: string;
  query: AdminUsersQuery;
  onQueryChange: (query: AdminUsersQuery) => void;
};

export function AdminPage({ currentUserId, query, onQueryChange }: AdminPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <PageHeader title="Admin" description="System health, user management and the audit trail." />
      <div className="flex flex-col gap-6">
        <AdminStatsGrid />
        <UsersTable key={query.search} currentUserId={currentUserId} query={query} onQueryChange={onQueryChange} />
        <AuditLogList />
      </div>
    </div>
  );
}
