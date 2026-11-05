import { StatCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplateLookup } from "@/features/templates/hooks/useTemplates";
import { formatNumber, formatUsd } from "@/lib/format";
import { useUsageStats } from "../hooks/useAccount";

export function UsageStatsGrid() {
  const { data: stats, isPending, isError } = useUsageStats();
  const lookupTemplate = useTemplateLookup();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-destructive">Couldn&apos;t load usage stats.</p>;

  const favorite = stats.mostUsedTemplateId
    ? (lookupTemplate(stats.mostUsedTemplateId)?.label ?? stats.mostUsedTemplateId)
    : "—";
  const quota = stats.quota.limit === null ? "Unlimited" : `${stats.quota.used} / ${stats.quota.limit}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Images" value={formatNumber(stats.totalImages)} />
      <StatCard
        label="Generations"
        value={formatNumber(stats.totalGenerations)}
        hint={`${stats.generationsByTier.flash} flash · ${stats.generationsByTier.pro} pro · ${stats.cachedGenerations} cached`}
      />
      <StatCard label="Estimated spend" value={formatUsd(stats.totalCostUsd)} hint={`Favorite style: ${favorite}`} />
      <StatCard label="Today's quota" value={quota} />
    </div>
  );
}
