import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { resetDatabase } from "./setup/database";
import { registerUser, startTestServer, TestClient, uniqueCredentials, type TestServer } from "./setup/test-client";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetDatabase);
afterAll(() => server.close());

describe("security", () => {
  test("mutations from an untrusted Origin are refused", async () => {
    const response = await new TestClient(server.baseUrl).request("POST", "/api/auth/register", {
      json: uniqueCredentials(),
      origin: "https://evil.example",
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ error: { code: "CORS_NOT_ALLOWED" } });
  });

  test("CORS only reflects trusted origins", async () => {
    const trusted = await fetch(`${server.baseUrl}/api/templates`, { headers: { origin: "http://localhost:5173" } });
    const untrusted = await fetch(`${server.baseUrl}/api/templates`, { headers: { origin: "https://evil.example" } });

    expect(trusted.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(trusted.headers.get("access-control-allow-credentials")).toBe("true");
    expect(untrusted.headers.get("access-control-allow-origin")).toBeNull();
  });

  test("malformed JSON is a 400 MALFORMED_BODY, not a 500", async () => {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:5173" },
      body: "{not json",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "MALFORMED_BODY" } });
  });

  test("unknown routes return the standard error shape", async () => {
    const response = await new TestClient(server.baseUrl).request("GET", "/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  test("health and readiness", async () => {
    const client = new TestClient(server.baseUrl);
    expect((await client.request("GET", "/api/health")).body).toEqual({ status: "ok" });
    expect((await client.request("GET", "/api/health/ready")).body).toEqual({ status: "ok", database: "up" });
  });

  test("responses carry a request id and security headers", async () => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("GET", "/api/templates");

    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-powered-by")).toBeNull();
  });

  test("templates never expose system prompts", async () => {
    const response = await new TestClient(server.baseUrl).request<{ templates: Record<string, unknown>[] }>("GET", "/api/templates");
    expect(response.body.templates.length).toBeGreaterThan(0);
    for (const template of response.body.templates) expect(template).not.toHaveProperty("systemPrompt");
  });
});
