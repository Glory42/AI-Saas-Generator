import { useEffect, useState } from "react";
import { RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useCreateGeneration, useUploadImage } from "@/features/images/hooks/useImages";
import { TemplatePicker } from "@/features/templates/components/TemplatePicker";
import { ImageDropzone } from "../components/ImageDropzone";
import { QuotaIndicator } from "../components/QuotaIndicator";
import { ResultPanel } from "../components/ResultPanel";

export function StudioPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const upload = useUploadImage();
  const generate = useCreateGeneration();

  const uploadedImage = upload.data;
  const canGenerate = Boolean(uploadedImage && templateId) && !generate.isPending;

  // Release the previous preview blob whenever it's replaced or the page unmounts.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileAccepted = (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    generate.reset();
    upload.mutate(file);
  };

  const handleGenerate = () => {
    if (!uploadedImage || !templateId) return;
    generate.mutate({ imageId: uploadedImage.id, templateId });
  };

  const handleReset = () => {
    setPreviewUrl(null);
    upload.reset();
    generate.reset();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <PageHeader
        title="Studio"
        description="Upload a product photo, choose a style and let the pipeline do the rest."
        actions={<QuotaIndicator />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1. Pick a style</CardTitle>
          <CardDescription>Flash styles are fast and cheap; Pro styles use the higher-quality model.</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplatePicker value={templateId} onChange={setTemplateId} disabled={generate.isPending} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>2. Upload your photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            {previewUrl ? (
              <div className="relative flex min-h-72 flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
                <img src={previewUrl} alt="Original upload" className="max-h-[28rem] w-full object-contain" />
                {upload.isPending ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-sm">
                    <Spinner className="text-primary" /> Uploading…
                  </div>
                ) : null}
              </div>
            ) : (
              <ImageDropzone onFileAccepted={handleFileAccepted} />
            )}
            {previewUrl ? (
              <Button variant="ghost" onClick={handleReset} disabled={upload.isPending || generate.isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Use a different photo
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>3. Generate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <ResultPanel
              result={generate.data}
              isGenerating={generate.isPending}
              errorMessage={generate.error?.message ?? null}
            />
            <Button size="lg" onClick={handleGenerate} disabled={!canGenerate} loading={generate.isPending}>
              <Wand2 className="h-4 w-4" aria-hidden />
              {generate.data ? "Generate again" : "Generate"}
            </Button>
            {!uploadedImage || !templateId ? (
              <p className="text-center text-xs text-muted-foreground">
                {!templateId ? "Pick a style" : "Upload a photo"} to enable generation.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
