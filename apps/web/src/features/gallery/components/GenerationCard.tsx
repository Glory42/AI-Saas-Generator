import { Download } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAssetUrl } from "@/features/images/asset-url";
import { CachedBadge, GenerationStatusBadge, TierBadge } from "@/features/images/components/GenerationBadges";
import { formatDateTime, formatUsd } from "@/lib/format";
import type { Generation } from "@/types/api";

type GenerationCardProps = { generation: Generation; templateLabel: string };

export function GenerationCard({ generation, templateLabel }: GenerationCardProps) {
  const resultUrl = generation.resultUrl ? resolveAssetUrl(generation.resultUrl) : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-square items-center justify-center bg-muted/40">
        {resultUrl ? (
          <img src={resultUrl} alt={`${templateLabel} result`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <p className="px-6 text-center text-sm text-muted-foreground">
            {generation.status === "failed" ? "This attempt failed." : "Still rendering…"}
          </p>
        )}
      </div>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{templateLabel}</span>
          <GenerationStatusBadge status={generation.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <TierBadge tier={generation.modelTier} />
          {generation.cached ? <CachedBadge /> : null}
          <span className="font-mono">{formatUsd(generation.costUsd)}</span>
          <span>· {formatDateTime(generation.createdAt)}</span>
        </div>
        {generation.status === "failed" && generation.errorMessage ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {generation.errorMessage}
          </p>
        ) : null}
        {resultUrl ? (
          <a href={resultUrl} target="_blank" rel="noreferrer" download className={buttonClasses("outline", "sm")}>
            <Download className="h-4 w-4" aria-hidden /> Download
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
