import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/features/images/components/GenerationBadges";
import { cn } from "@/lib/utils";
import { useTemplates } from "../hooks/useTemplates";

type TemplatePickerProps = {
  value: string | null;
  onChange: (templateId: string) => void;
  disabled?: boolean;
};

export function TemplatePicker({ value, onChange, disabled = false }: TemplatePickerProps) {
  const { data: templates, isPending, isError } = useTemplates();

  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Couldn&apos;t load styles. Refresh to try again.</p>;
  }

  return (
    <div role="radiogroup" aria-label="Style" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const selected = template.id === value;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(template.id)}
            className={cn(
              "relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card/60 hover:border-primary/50 hover:bg-muted/60",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{template.label}</span>
              <TierBadge tier={template.modelTier} />
            </div>
            <p className="text-xs text-muted-foreground">{template.description}</p>
            {selected ? (
              <Check className="absolute right-3 bottom-3 h-4 w-4 text-primary" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
