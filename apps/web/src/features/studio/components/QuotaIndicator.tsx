import { Gauge } from "lucide-react";
import { useUsageStats } from "@/features/settings/hooks/useAccount";
import { formatRelativeHours } from "@/lib/format";
import { cn } from "@/lib/utils";

export function QuotaIndicator() {
  const { data: stats } = useUsageStats();
  if (!stats) return null;

  const { limit, used, resetsAt } = stats.quota;
  if (limit === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Gauge className="h-4 w-4" aria-hidden /> Unlimited generations (admin)
      </p>
    );
  }

  const remaining = Math.max(0, limit - used);
  const ratio = Math.min(1, used / limit);

  return (
    <div className="flex min-w-56 flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="h-4 w-4" aria-hidden /> Daily quota
        </span>
        <span className="tabular-nums">
          {remaining} / {limit} left
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Generations used today"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", ratio >= 1 ? "bg-destructive" : ratio > 0.75 ? "bg-warning" : "bg-primary")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {remaining === 0 ? (
        <p className="text-xs text-muted-foreground">Resets {formatRelativeHours(resetsAt)}</p>
      ) : null}
    </div>
  );
}
