import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { promoteToAdmin, resetDatabase } from "./setup/database";
import { registerUser, startTestServer, type TestServer } from "./setup/test-client";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
beforeEach(resetDatabase);
afterAll(() => server.close());

const registerAdmin = async () => {
  const admin = await registerUser(server.baseUrl);
  await promoteToAdmin(admin.user.id);
  return admin;
};

describe("admin", () => {
  test.each(["/api/admin/stats", "/api/admin/users", "/api/admin/audit-logs"])("%s is forbidden for regular users", async (path) => {
    const { client } = await registerUser(server.baseUrl);
    const response = await client.request("GET", path);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  test("a promotion takes effect without signing in again", async () => {
    const { client, user } = await registerUser(server.baseUrl);
    await promoteToAdmin(user.id);
    expect((await client.request("GET", "/api/admin/stats")).status).toBe(200);
  });

  test("stats count users and admins", async () => {
    const admin = await registerAdmin();
    await registerUser(server.baseUrl);

    const response = await admin.client.request("GET", "/api/admin/stats");
    expect(response.body).toMatchObject({ stats: { totalUsers: 2, adminUsers: 1, totalImages: 0, totalGenerations: 0 } });
  });

  test("lists users with search and pagination", async () => {
    const admin = await registerAdmin();
    const target = await registerUser(server.baseUrl);

    const all = await admin.client.request("GET", "/api/admin/users?page=1&pageSize=1");
    expect(all.body).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(all.body.items).toHaveLength(1);

    const searched = await admin.client.request("GET", `/api/admin/users?search=${encodeURIComponent(target.credentials.email.toUpperCase())}`);
    expect(searched.body).toMatchObject({
      total: 1,
      items: [{ id: target.user.id, imageCount: 0, generationCount: 0, totalCostUsd: 0 }],
    });
  });

  test("changes roles, and a demotion applies immediately", async () => {
    const admin = await registerAdmin();
    const target = await registerUser(server.baseUrl);

    const promoted = await admin.client.request("PATCH", `/api/admin/users/${target.user.id}/role`, { json: { role: "admin" } });
    expect(promoted.body).toMatchObject({ user: { id: target.user.id, role: "admin" } });
    expect((await target.client.request("GET", "/api/admin/stats")).status).toBe(200);

    await admin.client.request("PATCH", `/api/admin/users/${target.user.id}/role`, { json: { role: "user" } });
    expect((await target.client.request("GET", "/api/admin/stats")).status).toBe(403);
  });

  test("admins cannot change their own role or delete themselves", async () => {
    const admin = await registerAdmin();

    expect((await admin.client.request("PATCH", `/api/admin/users/${admin.user.id}/role`, { json: { role: "user" } })).status).toBe(400);
    expect((await admin.client.request("DELETE", `/api/admin/users/${admin.user.id}`)).status).toBe(400);
  });

  test("deletes other users and records it in the audit log", async () => {
    const admin = await registerAdmin();
    const target = await registerUser(server.baseUrl);

    expect((await admin.client.request("DELETE", `/api/admin/users/${target.user.id}`)).status).toBe(204);
    expect((await admin.client.request("DELETE", `/api/admin/users/${target.user.id}`)).status).toBe(404);

    // Audit writes are fire-and-forget, so give the insert a moment to land.
    await Bun.sleep(100);
    const logs = await admin.client.request<{ items: { action: string; actorEmail: string | null }[]; nextCursor: string | null }>(
      "GET",
      "/api/admin/audit-logs?limit=50",
    );
    expect(logs.body.items.map((item) => item.action)).toContain("admin.user.deleted");
    expect(logs.body.items.find((item) => item.action === "admin.user.deleted")?.actorEmail).toBe(admin.credentials.email);
  });
});
