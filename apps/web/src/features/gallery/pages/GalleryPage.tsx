import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useImages } from "@/features/images/hooks/useImages";
import { useTemplateLookup } from "@/features/templates/hooks/useTemplates";
import { ImageCard } from "../components/ImageCard";

export function GalleryPage() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useImages();
  const lookupTemplate = useTemplateLookup();
  const templateLabel = useCallback((id: string) => lookupTemplate(id)?.label ?? id, [lookupTemplate]);
  const images = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <PageHeader
        title="Gallery"
        description="Every photo you've uploaded and every style you've rendered it in."
        actions={
          <Link to="/studio" className={buttonClasses("primary")}>
            New generation
          </Link>
        }
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-square" />
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="text-destructive">
          {error.message}
        </p>
      ) : images.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No images yet"
          description="Upload a product photo in the studio and your results will show up here."
          action={
            <Link to="/studio" className={buttonClasses("primary")}>
              Open the studio
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} templateLabel={templateLabel} />
            ))}
          </div>
          {hasNextPage ? (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
