import { Sparkles, Zap } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { GenerationStatus, ModelTier } from "@/types/api";

const STATUS: Record<GenerationStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export function GenerationStatusBadge({ status }: { status: GenerationStatus }) {
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function TierBadge({ tier }: { tier: ModelTier }) {
  return tier === "pro" ? (
    <Badge variant="primary">
      <Sparkles className="h-3 w-3" aria-hidden /> Pro
    </Badge>
  ) : (
    <Badge variant="accent">
      <Zap className="h-3 w-3" aria-hidden /> Flash
    </Badge>
  );
}

export function CachedBadge() {
  return <Badge variant="success">Served from cache · free</Badge>;
}
