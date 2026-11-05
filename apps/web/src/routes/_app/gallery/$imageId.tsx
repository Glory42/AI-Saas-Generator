import { createFileRoute } from "@tanstack/react-router";
import { ImageDetailPage } from "@/features/gallery/pages/ImageDetailPage";
import { imageQueryOptions } from "@/features/images/hooks/useImages";
import { templatesQueryOptions } from "@/features/templates/hooks/useTemplates";

export const Route = createFileRoute("/_app/gallery/$imageId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(imageQueryOptions(params.imageId)),
      context.queryClient.ensureQueryData(templatesQueryOptions),
    ]),
  component: ImageDetailRoute,
});

function ImageDetailRoute() {
  const { imageId } = Route.useParams();
  return <ImageDetailPage key={imageId} imageId={imageId} />;
}
