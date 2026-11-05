import { errorBodySchema } from "@/types/api";

type ApiRequestOptions<TBody> = Omit<RequestInit, "body"> & {
  body?: TBody;
  timeoutMs?: number;
};

// Shared shape for query functions that receive React Query's AbortSignal.
export type QueryRequestOptions = {
  signal?: AbortSignal;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(status: number, message: string, code: string | null = null, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const parsePayload = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.includes("text/")) return response.text();
  return null;
};

const toApiError = (response: Response, payload: unknown): ApiError => {
  const parsed = errorBodySchema.safeParse(payload);
  if (parsed.success) {
    const { message, code, details } = parsed.data.error;
    return new ApiError(response.status, message, code, details);
  }

  const fallback = response.statusText || `Request failed with ${response.status}`;
  return new ApiError(response.status, typeof payload === "string" && payload ? payload : fallback);
};

export const apiRequest = async <TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> => {
  const { body, headers: customHeaders, signal: externalSignal, timeoutMs = 15_000, ...rest } = options;
  const headers = new Headers(customHeaders);

  const isJsonBody = body !== undefined && body !== null && !(body instanceof FormData);
  if (isJsonBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const controller = new AbortController();
  let didTimeout = false;
  const forwardAbort = (): void => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) forwardAbort();
    else externalSignal.addEventListener("abort", forwardAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      credentials: "include",
      ...rest,
      headers,
      body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
      signal: controller.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new ApiError(408, "Request timed out. Please try again.", "REQUEST_TIMEOUT");
    }
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(0, "Unable to reach the API server.", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", forwardAbort);
  }

  const payload = await parsePayload(response);
  if (!response.ok) throw toApiError(response, payload);

  return payload as TResponse;
};
