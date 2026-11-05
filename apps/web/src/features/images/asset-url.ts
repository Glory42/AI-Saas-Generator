import { apiUrl } from "@/lib/api-client";

// Local-disk storage returns API-relative paths (/api/files/...), which need the API host in production.
export const resolveAssetUrl = (url: string): string => (url.startsWith("/") ? apiUrl(url) : url);
