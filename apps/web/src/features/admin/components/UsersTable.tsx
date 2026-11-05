import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatNumber, formatUsd } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { AdminUser } from "@/types/api";
import { ADMIN_USERS_PAGE_SIZE, type AdminUsersQuery } from "../api";
import { useAdminUsers, useDeleteUser, useUpdateUserRole } from "../hooks/useAdmin";

type UsersTableProps = {
  currentUserId: string;
  query: AdminUsersQuery;
  onQueryChange: (query: AdminUsersQuery) => void;
};

export function UsersTable({ currentUserId, query, onQueryChange }: UsersTableProps) {
  const { data, isPending, isError, error, isPlaceholderData } = useAdminUsers(query);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / ADMIN_USERS_PAGE_SIZE)) : 1;

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    onQueryChange({ page: 1, search: searchDraft.trim() });
  };

  const toggleRole = (user: AdminUser) => {
    const role = user.role === "admin" ? "user" : "admin";
    updateRole.mutate(
      { userId: user.id, role },
      { onSuccess: () => toast.success(`${user.username} is now ${role === "admin" ? "an admin" : "a user"}.`) },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteUser.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`${pendingDelete.username} was deleted.`);
        setPendingDelete(null);
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Users</CardTitle>
        <form onSubmit={handleSearch} role="search" className="flex gap-2">
          <Input
            aria-label="Search users by email or username"
            placeholder="Search email or username"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="icon" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        ) : data.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No users match that search.</p>
        ) : (
          <div className={isPlaceholderData ? "opacity-60" : undefined}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-3 pr-4 font-medium">User</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Usage</th>
                    <th className="py-3 pr-4 font-medium">Joined</th>
                    <th className="py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => {
                    const isSelf = user.id === currentUserId;
                    return (
                      <tr key={user.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {formatNumber(user.imageCount)} images · {formatNumber(user.generationCount)} gens ·{" "}
                          {formatUsd(user.totalCostUsd)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || updateRole.isPending}
                              onClick={() => toggleRole(user)}
                              title={isSelf ? "You can't change your own role" : undefined}
                            >
                              {user.role === "admin" ? (
                                <ShieldOff className="h-4 w-4" aria-hidden />
                              ) : (
                                <ShieldCheck className="h-4 w-4" aria-hidden />
                              )}
                              {user.role === "admin" ? "Demote" : "Promote"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSelf}
                              onClick={() => setPendingDelete(user)}
                              aria-label={`Delete ${user.username}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {query.page} of {totalPages} · {formatNumber(data.total)} users
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={query.page <= 1}
                  onClick={() => onQueryChange({ ...query, page: query.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={query.page >= totalPages}
                  onClick={() => onQueryChange({ ...query, page: query.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isPending={deleteUser.isPending}
        title={`Delete ${pendingDelete?.username ?? "user"}?`}
        description="Their images, generations and stored files are removed permanently."
        confirmLabel="Delete user"
      />
    </Card>
  );
}
