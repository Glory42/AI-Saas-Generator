import { createFileRoute } from "@tanstack/react-router";
import { GalleryPage } from "@/features/gallery/pages/GalleryPage";
import { imagesInfiniteQueryOptions } from "@/features/images/hooks/useImages";
import { templatesQueryOptions } from "@/features/templates/hooks/useTemplates";

export const Route = createFileRoute("/_app/gallery/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(imagesInfiniteQueryOptions),
      context.queryClient.ensureQueryData(templatesQueryOptions),
    ]),
  component: GalleryPage,
});
