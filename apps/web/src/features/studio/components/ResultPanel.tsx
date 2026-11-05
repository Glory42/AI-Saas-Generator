import { Download, Sparkles, TriangleAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { buttonClasses } from "@/components/ui/button-variants";
import { resolveAssetUrl } from "@/features/images/asset-url";
import { CachedBadge, TierBadge } from "@/features/images/components/GenerationBadges";
import type { GenerationResult } from "@/features/images/api";
import { formatUsd } from "@/lib/format";

type ResultPanelProps = {
  result: GenerationResult | undefined;
  isGenerating: boolean;
  errorMessage: string | null;
};

export function ResultPanel({ result, isGenerating, errorMessage }: ResultPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 text-muted-foreground">
        <Spinner size="lg" className="text-primary" label="Generating" />
        <p className="text-sm">Rendering your shot… pro styles can take a minute.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
        <TriangleAlert className="h-7 w-7 text-destructive" aria-hidden />
        <p className="text-sm">{errorMessage}</p>
      </div>
    );
  }

  const generation = result?.generation;
  if (!generation?.resultUrl) {
    return (
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-muted-foreground">
        <Sparkles className="h-7 w-7" aria-hidden />
        <p className="text-sm">Your result appears here.</p>
      </div>
    );
  }

  const resultUrl = resolveAssetUrl(generation.resultUrl);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex min-h-72 flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
        <img src={resultUrl} alt="Generated product shot" className="max-h-[28rem] w-full object-contain" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <TierBadge tier={generation.modelTier} />
        {result?.cached ? <CachedBadge /> : null}
        <span className="text-muted-foreground">
          Cost <span className="font-mono text-foreground">{formatUsd(generation.costUsd)}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={resultUrl} target="_blank" rel="noreferrer" download className={buttonClasses("primary")}>
          <Download className="h-4 w-4" aria-hidden /> Download
        </a>
        <Link
          to="/gallery/$imageId"
          params={{ imageId: generation.imageId }}
          className={buttonClasses("outline")}
        >
          Open in gallery
        </Link>
      </div>
    </div>
  );
}
