import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { resetDatabase } from "./setup/database";
import { loginBody, registerUser, startTestServer, TestClient, uniqueCredentials, type TestServer } from "./setup/test-client";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetDatabase);
afterAll(() => server.close());

describe("auth", () => {
  test("register signs the user in with httpOnly cookies and never returns tokens", async () => {
    const client = new TestClient(server.baseUrl);
    const credentials = uniqueCredentials();
    const response = await client.request("POST", "/api/auth/register", { json: credentials });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: expect.objectContaining({ email: credentials.email, username: credentials.username, role: "user" }),
    });
    expect(JSON.stringify(response.body)).not.toMatch(/token|password/i);
    expect(client.cookieNames.sort()).toEqual(["aisg_access", "aisg_refresh"]);
    for (const header of response.headers.getSetCookie()) expect(header).toMatch(/HttpOnly/i);
  });

  test("register rejects a duplicate email with 409", async () => {
    const { credentials } = await registerUser(server.baseUrl);
    const response = await new TestClient(server.baseUrl).request("POST", "/api/auth/register", {
      json: { ...credentials, username: "someone_else" },
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: { code: "CONFLICT" } });
  });

  test("register validates input", async () => {
    const response = await new TestClient(server.baseUrl).request("POST", "/api/auth/register", {
      json: { email: "nope", password: "short", username: "x" },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });

  test("session reflects sign-in state and logout clears it", async () => {
    const { client, user } = await registerUser(server.baseUrl);

    expect((await client.request("GET", "/api/auth/session")).body).toEqual({ user: expect.objectContaining({ id: user.id }) });
    expect((await client.request("POST", "/api/auth/logout")).status).toBe(200);
    expect((await client.request("GET", "/api/auth/session")).body).toEqual({ user: null });
  });

  test("wrong password and unknown email return the same 401", async () => {
    const { credentials } = await registerUser(server.baseUrl);
    const client = new TestClient(server.baseUrl);

    const wrongPassword = await client.request("POST", "/api/auth/login", {
      json: { email: credentials.email, password: "not-the-password" },
    });
    const unknownEmail = await client.request("POST", "/api/auth/login", {
      json: { email: "nobody@example.com", password: "not-the-password" },
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body).toMatchObject({ error: { code: "INVALID_CREDENTIALS" } });
  });

  test("five failed logins lock the email, even for the right password", async () => {
    const { credentials } = await registerUser(server.baseUrl);
    const client = new TestClient(server.baseUrl);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await client.request("POST", "/api/auth/login", { json: { email: credentials.email, password: "wrong-password" } });
      expect(response.status).toBe(401);
    }

    const locked = await client.request("POST", "/api/auth/login", { json: loginBody(credentials) });
    expect(locked.status).toBe(429);
    expect(locked.body).toMatchObject({ error: { code: "ACCOUNT_LOCKED", details: { retryAfterSeconds: expect.any(Number) } } });
  });

  test("refresh rotates the refresh token and the old one stops working", async () => {
    const { client } = await registerUser(server.baseUrl);
    const original = client.cookie("aisg_refresh") ?? "";

    expect((await client.request("POST", "/api/auth/refresh")).status).toBe(200);
    expect(client.cookie("aisg_refresh")).not.toBe(original);

    const replay = new TestClient(server.baseUrl);
    replay.setCookie("aisg_refresh", original);
    const response = await replay.request("POST", "/api/auth/refresh");
    expect(response.status).toBe(401);
  });

  test("an expired access token is refreshed transparently", async () => {
    const { client, user } = await registerUser(server.baseUrl);
    client.setCookie("aisg_access", "expired.or.garbage");

    const response = await client.request("GET", "/api/users/me/stats");
    expect(response.status).toBe(200);
    expect(client.cookie("aisg_access")).not.toBe("expired.or.garbage");
    expect((await client.request("GET", "/api/auth/session")).body).toMatchObject({ user: { id: user.id } });
  });

  test("parallel requests racing the same refresh token all stay signed in", async () => {
    const { client } = await registerUser(server.baseUrl);
    const refreshToken = client.cookie("aisg_refresh") ?? "";

    const clients = Array.from({ length: 4 }, () => {
      const parallel = new TestClient(server.baseUrl);
      parallel.setCookie("aisg_refresh", refreshToken);
      return parallel;
    });
    const responses = await Promise.all(clients.map((parallel) => parallel.request("GET", "/api/users/me/stats")));

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200]);
  });

  test("logout-all revokes every session", async () => {
    const first = await registerUser(server.baseUrl);
    const second = new TestClient(server.baseUrl);
    expect((await second.request("POST", "/api/auth/login", { json: loginBody(first.credentials) })).status).toBe(200);

    expect((await first.client.request("POST", "/api/auth/logout-all")).status).toBe(200);
    expect((await second.request("GET", "/api/users/me/stats")).status).toBe(401);
  });
});
