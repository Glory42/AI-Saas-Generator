import { Skeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/features/images/components/GenerationBadges";
import { useTemplates } from "@/features/templates/hooks/useTemplates";

export function TemplateShowcase() {
  const { data: templates, isPending, isError } = useTemplates();

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }
  if (isError || templates.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {templates.map((template) => (
        <div key={template.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{template.label}</h3>
            <TierBadge tier={template.modelTier} />
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      ))}
    </div>
  );
}
