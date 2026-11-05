import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { resolveAssetUrl } from "@/features/images/asset-url";
import { formatDate } from "@/lib/format";
import type { ImageWithGenerations } from "@/types/api";
import { latestCompletedGeneration, thumbnailUrl } from "../latest-result";

type ImageCardProps = { image: ImageWithGenerations; templateLabel: (id: string) => string };

export const ImageCard = memo(function ImageCard({ image, templateLabel }: ImageCardProps) {
  const latest = latestCompletedGeneration(image);
  const count = image.generations.length;

  return (
    <Link
      to="/gallery/$imageId"
      params={{ imageId: image.id }}
      className="group overflow-hidden rounded-lg border border-border bg-card/70 transition-colors hover:border-primary/60"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={resolveAssetUrl(thumbnailUrl(image))}
          alt={latest ? `${templateLabel(latest.templateId)} result` : "Original upload"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2">
          {latest ? <Badge variant="success">Generated</Badge> : <Badge variant="warning">Original only</Badge>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-3 text-xs text-muted-foreground">
        <span className="truncate">{latest ? templateLabel(latest.templateId) : "Not generated yet"}</span>
        <span className="shrink-0">
          {count} {count === 1 ? "generation" : "generations"} · {formatDate(image.createdAt)}
        </span>
      </div>
    </Link>
  );
});
