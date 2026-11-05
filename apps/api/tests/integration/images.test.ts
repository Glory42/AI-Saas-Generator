import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { imageForm, pngFile } from "./setup/fixtures";
import { resetDatabase } from "./setup/database";
import { registerUser, startTestServer, type TestClient, type TestServer } from "./setup/test-client";

type Generation = { id: string; status: string; cached: boolean; costUsd: number; resultUrl: string | null; templateId: string };
type GenerationResponse = { generation: Generation; cached: boolean };
type ImageResponse = { image: { id: string; originalUrl: string; width: number; height: number } };

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetDatabase);
afterAll(() => server.close());

const upload = async (client: TestClient, color?: { r: number; g: number; b: number }) => {
  const response = await client.request<ImageResponse>("POST", "/api/images", { form: imageForm(await pngFile(color)) });
  expect(response.status).toBe(201);
  return response.body.image;
};

const generate = (client: TestClient, imageId: string, templateId = "ecommerce-clean") =>
  client.request<GenerationResponse>("POST", `/api/images/${imageId}/generations`, { json: { templateId } });

describe("images", () => {
  test("uploads are normalized to WebP and served back", async () => {
    const { client } = await registerUser(server.baseUrl);
    const image = await upload(client);

    expect(image).toMatchObject({ width: 64, height: 64 });
    expect(image.originalUrl).toMatch(/\/api\/files\/uploads\/.+\.webp$/);

    const file = await fetch(`${server.baseUrl}${new URL(image.originalUrl).pathname}`);
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("image/webp");
  });

  test("a text file renamed to .png is rejected with 415", async () => {
    const { client } = await registerUser(server.baseUrl);
    const fake = new Blob(["just some text"], { type: "image/png" });
    const response = await client.request("POST", "/api/images", { form: imageForm(fake, "totally-a.png") });

    expect(response.status).toBe(415);
    expect(response.body).toMatchObject({ error: { code: "UNSUPPORTED_MEDIA" } });
  });

  test("an upload without a file is a 400", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("POST", "/api/images", { form: new FormData() });
    expect(response.status).toBe(400);
  });

  test("generating twice with the same template is served from the cache", async () => {
    const { client } = await registerUser(server.baseUrl);
    const image = await upload(client);

    const first = await generate(client, image.id);
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ cached: false, generation: { status: "completed", cached: false } });
    expect(first.body.generation.resultUrl).toMatch(/\/api\/files\/generations\//);

    const second = await generate(client, image.id);
    expect(second.status).toBe(201);
    expect(second.body).toMatchObject({ cached: true, generation: { cached: true, costUsd: 0, status: "completed" } });
    expect(second.body.generation.resultUrl).toBe(first.body.generation.resultUrl);
  });

  test("re-uploading identical bytes still hits the cache", async () => {
    const { client } = await registerUser(server.baseUrl);
    const firstImage = await upload(client);
    const secondImage = await upload(client);

    await generate(client, firstImage.id);
    const response = await generate(client, secondImage.id);
    expect(response.body.cached).toBe(true);
  });

  test("the cache is per user", async () => {
    const alice = await registerUser(server.baseUrl);
    const bob = await registerUser(server.baseUrl);

    await generate(alice.client, (await upload(alice.client)).id);
    const response = await generate(bob.client, (await upload(bob.client)).id);
    expect(response.body.cached).toBe(false);
  });

  test("an unknown template is a 400", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await generate(client, (await upload(client)).id, "does-not-exist");
    expect(response.status).toBe(400);
  });

  test("the daily quota counts cache hits and then blocks with 429", async () => {
    const { client } = await registerUser(server.baseUrl);
    const image = await upload(client);

    for (const templateId of ["ecommerce-clean", "ecommerce-clean", "luxury-dark"]) {
      expect((await generate(client, image.id, templateId)).status).toBe(201);
    }

    const blocked = await generate(client, image.id, "minimal-flatlay");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ error: { code: "QUOTA_EXCEEDED", details: { limit: 3 } } });
  });

  test("lists images newest first with their generations, using cursor pagination", async () => {
    const { client } = await registerUser(server.baseUrl);
    const older = await upload(client, { r: 1, g: 2, b: 3 });
    const newer = await upload(client, { r: 4, g: 5, b: 6 });
    await generate(client, older.id);

    const firstPage = await client.request<{ items: { id: string; generations: Generation[] }[]; nextCursor: string | null }>(
      "GET",
      "/api/images?limit=1",
    );
    expect(firstPage.body.items.map((item) => item.id)).toEqual([newer.id]);
    expect(firstPage.body.nextCursor).not.toBeNull();

    const secondPage = await client.request<{ items: { id: string; generations: Generation[] }[]; nextCursor: string | null }>(
      "GET",
      `/api/images?limit=1&cursor=${firstPage.body.nextCursor}`,
    );
    expect(secondPage.body.items.map((item) => item.id)).toEqual([older.id]);
    expect(secondPage.body.items[0]?.generations).toHaveLength(1);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  test("another user's image is a 404 everywhere", async () => {
    const owner = await registerUser(server.baseUrl);
    const stranger = await registerUser(server.baseUrl);
    const image = await upload(owner.client);

    expect((await stranger.client.request("GET", `/api/images/${image.id}`)).status).toBe(404);
    expect((await generate(stranger.client, image.id)).status).toBe(404);
    expect((await stranger.client.request("DELETE", `/api/images/${image.id}`)).status).toBe(404);
  });

  test("deleting an image keeps result files that a cache hit still uses", async () => {
    const { client } = await registerUser(server.baseUrl);
    const first = await upload(client);
    const second = await upload(client);
    const original = await generate(client, first.id);
    await generate(client, second.id);

    expect((await client.request("DELETE", `/api/images/${first.id}`)).status).toBe(204);
    expect((await client.request("GET", `/api/images/${first.id}`)).status).toBe(404);

    const resultPath = new URL(original.body.generation.resultUrl ?? "").pathname;
    expect((await fetch(`${server.baseUrl}${resultPath}`)).status).toBe(200);
    expect((await fetch(`${server.baseUrl}${new URL(first.originalUrl).pathname}`)).status).toBe(404);
  });

  test("stats aggregate generations", async () => {
    const { client } = await registerUser(server.baseUrl);
    const image = await upload(client);
    await generate(client, image.id, "luxury-dark");
    await generate(client, image.id, "luxury-dark");

    const response = await client.request("GET", "/api/users/me/stats");
    expect(response.body).toMatchObject({
      stats: {
        totalImages: 1,
        totalGenerations: 2,
        cachedGenerations: 1,
        generationsByTier: { flash: 0, pro: 2 },
        mostUsedTemplateId: "luxury-dark",
        quota: { limit: 3, used: 2 },
      },
    });
  });

  test("the files route rejects path traversal", async () => {
    const response = await fetch(`${server.baseUrl}/api/files/..%2F..%2Fetc%2Fpasswd`);
    expect(response.status).toBe(404);
  });
});
