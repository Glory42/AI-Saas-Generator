import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api-client";
import { jsonResponse, mockFetch } from "../helpers";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("apiRequest", () => {
  it("sends credentials and a JSON body, and returns the parsed payload", async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ ok: true }));

    const result = await apiRequest<{ ok: boolean }, { name: string }>("/api/things", {
      method: "POST",
      body: { name: "lamp" },
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/things");
    expect(init?.credentials).toBe("include");
    expect(init?.body).toBe(JSON.stringify({ name: "lamp" }));
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("leaves FormData bodies alone so the browser sets the multipart boundary", async () => {
    const fetchMock = mockFetch(async () => jsonResponse({}));
    const form = new FormData();
    form.append("image", new Blob(["x"]), "photo.png");

    await apiRequest("/api/images", { method: "POST", body: form });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
  });

  it("maps the API error shape to an ApiError with status, code and details", async () => {
    mockFetch(async () =>
      jsonResponse(
        { error: { message: "Daily quota used up", code: "QUOTA_EXCEEDED", details: { resetsAt: "x" } } },
        429,
      ),
    );

    const error = await apiRequest("/api/images/1/generations").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "QUOTA_EXCEEDED",
      message: "Daily quota used up",
      details: { resetsAt: "x" },
    });
  });

  it("falls back to the status text when the error body isn't in the API shape", async () => {
    mockFetch(async () => new Response("", { status: 502, statusText: "Bad Gateway" }));

    await expect(apiRequest("/api/health")).rejects.toMatchObject({ status: 502, message: "Bad Gateway" });
  });

  it("returns null for 204 responses", async () => {
    mockFetch(async () => new Response(null, { status: 204 }));

    await expect(apiRequest("/api/images/1", { method: "DELETE" })).resolves.toBeNull();
  });

  it("turns network failures into status 0", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(apiRequest("/api/health")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("aborts slow requests and reports a 408", async () => {
    vi.useFakeTimers();
    mockFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    const pending = apiRequest("/api/slow", { timeoutMs: 1_000 }).catch((caught: unknown) => caught);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(await pending).toMatchObject({ status: 408, code: "REQUEST_TIMEOUT" });
  });
});
