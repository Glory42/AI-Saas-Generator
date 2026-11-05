import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { resetDatabase } from "./setup/database";
import { loginBody, registerUser, startTestServer, TestClient, type TestServer } from "./setup/test-client";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetDatabase);
afterAll(() => server.close());

describe("users", () => {
  test("requires authentication", async () => {
    const response = await new TestClient(server.baseUrl).request("GET", "/api/users/me/stats");
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("updates username and email", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("PATCH", "/api/users/me", {
      json: { username: "renamed", email: "Renamed@Example.com" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { username: "renamed", email: "renamed@example.com" } });
  });

  // Regression: the first version let any user send { role: "admin" } to their own profile.
  test("cannot promote yourself through PATCH /me", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("PATCH", "/api/users/me", { json: { username: "sneaky", role: "admin" } });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect((await client.request("GET", "/api/auth/session")).body).toMatchObject({ user: { role: "user" } });
  });

  test("changing the password revokes other sessions but keeps this one", async () => {
    const { client, credentials } = await registerUser(server.baseUrl);
    const otherDevice = new TestClient(server.baseUrl);
    expect((await otherDevice.request("POST", "/api/auth/login", { json: loginBody(credentials) })).status).toBe(200);

    const response = await client.request("POST", "/api/users/me/password", {
      json: { currentPassword: credentials.password, newPassword: "a-brand-new-password" },
    });

    expect(response.status).toBe(200);
    expect((await client.request("GET", "/api/users/me/stats")).status).toBe(200);
    expect((await otherDevice.request("GET", "/api/users/me/stats")).status).toBe(401);

    const relogin = await new TestClient(server.baseUrl).request("POST", "/api/auth/login", {
      json: { email: credentials.email, password: "a-brand-new-password" },
    });
    expect(relogin.status).toBe(200);
  });

  test("changing the password requires the current one", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("POST", "/api/users/me/password", {
      json: { currentPassword: "wrong-password", newPassword: "a-brand-new-password" },
    });

    expect(response.status).toBe(400);
  });

  test("deleting the account signs out and removes the user", async () => {
    const { client, credentials } = await registerUser(server.baseUrl);

    expect((await client.request("DELETE", "/api/users/me", { json: { currentPassword: credentials.password } })).status).toBe(204);
    expect((await client.request("GET", "/api/auth/session")).body).toEqual({ user: null });
    expect((await new TestClient(server.baseUrl).request("POST", "/api/auth/login", { json: loginBody(credentials) })).status).toBe(401);
  });

  test("fresh accounts have empty stats and the default quota", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("GET", "/api/users/me/stats");

    expect(response.body).toMatchObject({
      stats: {
        totalImages: 0,
        totalGenerations: 0,
        cachedGenerations: 0,
        totalCostUsd: 0,
        generationsByTier: { flash: 0, pro: 0 },
        mostUsedTemplateId: null,
        quota: { limit: 3, used: 0 },
      },
    });
  });
});
