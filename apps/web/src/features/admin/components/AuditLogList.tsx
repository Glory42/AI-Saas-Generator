import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/format";
import { useAuditLogs } from "../hooks/useAdmin";

const describeMetadata = (metadata: Record<string, unknown>): string =>
  Object.entries(metadata)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" · ");

export function AuditLogList() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditLogs();
  const logs = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Security- and cost-relevant actions, newest first.</CardDescription>
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
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border/60">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <time dateTime={log.createdAt} className="w-44 shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </time>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <code className="font-mono text-sm text-accent">{log.action}</code>
                    <span className="text-xs text-muted-foreground">
                      {log.actorEmail ?? "anonymous"}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ""}
                    </span>
                  </div>
                  {Object.keys(log.metadata).length > 0 ? (
                    <p className="truncate text-xs text-muted-foreground">{describeMetadata(log.metadata)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
        {hasNextPage ? (
          <Button variant="outline" className="mt-4 w-full" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
