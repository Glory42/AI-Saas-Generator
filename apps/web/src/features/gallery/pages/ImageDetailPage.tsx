import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageSpinner } from "@/components/ui/spinner";
import { resolveAssetUrl } from "@/features/images/asset-url";
import { useCreateGeneration, useDeleteImage, useImage } from "@/features/images/hooks/useImages";
import { TemplatePicker } from "@/features/templates/components/TemplatePicker";
import { useTemplateLookup } from "@/features/templates/hooks/useTemplates";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { GenerationCard } from "../components/GenerationCard";

export function ImageDetailPage({ imageId }: { imageId: string }) {
  const navigate = useNavigate();
  const { data: image, isPending, isError, error } = useImage(imageId);
  const lookupTemplate = useTemplateLookup();
  const generate = useCreateGeneration();
  const deleteImage = useDeleteImage();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isPending) return <PageSpinner label="Loading image…" />;
  if (isError) {
    return (
      <p role="alert" className="mx-auto max-w-6xl px-4 py-10 text-destructive">
        {error.message}
      </p>
    );
  }

  const originalUrl = resolveAssetUrl(image.originalUrl);

  const handleGenerate = () => {
    if (!templateId) return;
    generate.mutate(
      { imageId, templateId },
      { onSuccess: ({ cached }) => toast.success(cached ? "Served from cache — no charge." : "Generation complete.") },
    );
  };

  const handleDelete = () =>
    deleteImage.mutate(imageId, {
      onSuccess: async () => {
        toast.success("Image deleted.");
        await navigate({ to: "/gallery" });
      },
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Link to="/gallery" className={buttonClasses("ghost", "sm", "mb-6")}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to gallery
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit overflow-hidden">
          <img src={originalUrl} alt="Original upload" className="w-full bg-muted/40 object-contain" />
          <CardContent className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">
              Uploaded {formatDateTime(image.createdAt)} · {image.width}×{image.height}px
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={originalUrl} target="_blank" rel="noreferrer" download className={buttonClasses("outline", "sm")}>
                <Download className="h-4 w-4" aria-hidden /> Original
              </a>
              <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Render in another style</CardTitle>
            <CardDescription>Same photo and style again is served from your cache for free.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TemplatePicker value={templateId} onChange={setTemplateId} disabled={generate.isPending} />
            <Button onClick={handleGenerate} disabled={!templateId} loading={generate.isPending} className="self-start">
              <Wand2 className="h-4 w-4" aria-hidden /> Generate
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 mb-4 text-xl font-semibold">
        Generations <span className="text-muted-foreground">({image.generations.length})</span>
      </h2>
      {image.generations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing rendered yet. Pick a style above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {image.generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              templateLabel={lookupTemplate(generation.templateId)?.label ?? generation.templateId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        isPending={deleteImage.isPending}
        title="Delete this image?"
        description="The photo and all of its generations will be removed permanently."
        confirmLabel="Delete image"
      />
    </div>
  );
}
