import { StatCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatUsd } from "@/lib/format";
import { useAdminStats } from "../hooks/useAdmin";

export function AdminStatsGrid() {
  const { data: stats, isPending, isError } = useAdminStats();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-destructive">Couldn&apos;t load system stats.</p>;

  const cacheRate = stats.totalGenerations > 0 ? Math.round((stats.cachedGenerations / stats.totalGenerations) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Users" value={formatNumber(stats.totalUsers)} hint={`${stats.adminUsers} admins`} />
      <StatCard
        label="Generations"
        value={formatNumber(stats.totalGenerations)}
        hint={`${stats.generationsLast24h} in the last 24h · ${stats.failedGenerations} failed`}
      />
      <StatCard label="Cache hit rate" value={`${cacheRate}%`} hint={`${stats.cachedGenerations} served free`} />
      <StatCard label="Estimated spend" value={formatUsd(stats.totalCostUsd)} hint={`${stats.totalImages} images stored`} />
    </div>
  );
}
