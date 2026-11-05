import { useCallback } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { listTemplates } from "../api";
import type { Template } from "@/types/api";

export const templateKeys = {
  all: ["templates"] as const,
};

// Templates live in code on the server, so they only change on deploy.
export const templatesQueryOptions = queryOptions({
  queryKey: templateKeys.all,
  queryFn: ({ signal }) => listTemplates({ signal }),
  staleTime: 60 * 60_000,
});

export const useTemplates = () => useQuery(templatesQueryOptions);

export const useTemplateLookup = (): ((id: string) => Template | undefined) => {
  const { data } = useTemplates();
  return useCallback((id: string) => data?.find((template) => template.id === id), [data]);
};
