import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as imagesApi from "../api";
import { settingsKeys } from "@/features/settings/hooks/useAccount";

export const imageKeys = {
  all: ["images"] as const,
  list: () => [...imageKeys.all, "list"] as const,
  detail: (imageId: string) => [...imageKeys.all, "detail", imageId] as const,
};

export const imagesInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: imageKeys.list(),
  queryFn: ({ pageParam, signal }) => imagesApi.listImages(pageParam, { signal }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const imageQueryOptions = (imageId: string) =>
  queryOptions({
    queryKey: imageKeys.detail(imageId),
    queryFn: ({ signal }) => imagesApi.getImage(imageId, { signal }),
  });

export const useImages = () => useInfiniteQuery(imagesInfiniteQueryOptions);

export const useImage = (imageId: string) => useQuery(imageQueryOptions(imageId));

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: imagesApi.uploadImage,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: imageKeys.list() }),
        queryClient.invalidateQueries({ queryKey: settingsKeys.stats() }),
      ]),
  });
};

export const useCreateGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: imagesApi.createGeneration,
    // Failed generations are stored server-side too, so refresh on error as well.
    onSettled: (_data, _error, { imageId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: imageKeys.detail(imageId) }),
        queryClient.invalidateQueries({ queryKey: imageKeys.list() }),
        queryClient.invalidateQueries({ queryKey: settingsKeys.stats() }),
      ]),
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: imagesApi.deleteImage,
    onSuccess: (_data, imageId) => {
      queryClient.removeQueries({ queryKey: imageKeys.detail(imageId) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: imageKeys.list() }),
        queryClient.invalidateQueries({ queryKey: settingsKeys.stats() }),
      ]);
    },
  });
};
