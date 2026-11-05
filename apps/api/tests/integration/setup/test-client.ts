import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../../src/index";

export const TRUSTED_ORIGIN = "http://localhost:5173";

export type TestServer = { baseUrl: string; close: () => Promise<void> };

export const startTestServer = async (): Promise<TestServer> => {
  const app = createApp({ rateLimits: { api: 10_000, credentials: 10_000 } });
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
};

type RequestOptions = { json?: unknown; form?: FormData; origin?: string | null };

export type TestResponse<T = Record<string, unknown>> = { status: number; body: T; headers: Headers };

// Minimal browser stand-in: keeps cookies between requests and sends a trusted Origin.
export class TestClient {
  private readonly cookies = new Map<string, string>();

  constructor(private readonly baseUrl: string) {}

  get cookieNames(): string[] {
    return [...this.cookies.keys()];
  }

  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  async request<T = Record<string, unknown>>(method: string, path: string, options: RequestOptions = {}): Promise<TestResponse<T>> {
    const headers = new Headers();
    if (options.origin !== null) headers.set("origin", options.origin ?? TRUSTED_ORIGIN);
    if (this.cookies.size > 0) {
      headers.set("cookie", [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    }

    let body: string | FormData | undefined;
    if (options.json !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(options.json);
    } else if (options.form) {
      body = options.form;
    }

    const response = await fetch(`${this.baseUrl}${path}`, { method, headers, body });
    this.storeCookies(response.headers.getSetCookie());

    const text = await response.text();
    return { status: response.status, body: (text ? JSON.parse(text) : {}) as T, headers: response.headers };
  }

  private storeCookies(setCookies: string[]): void {
    for (const header of setCookies) {
      const [pair = "", ...attributes] = header.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const expired = attributes.some((attribute) => {
        const [key, raw] = attribute.split("=");
        return key?.trim().toLowerCase() === "expires" && raw !== undefined && new Date(raw).getTime() <= Date.now();
      });

      if (!value || expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
}

let userCounter = 0;

export const uniqueCredentials = () => {
  userCounter += 1;
  return {
    email: `user${userCounter}-${Date.now()}@example.com`,
    username: `user_${userCounter}`,
    password: "correct-horse-battery",
  };
};

export const loginBody = (credentials: { email: string; password: string }) => ({
  email: credentials.email,
  password: credentials.password,
});

export const registerUser = async (baseUrl: string) => {
  const client = new TestClient(baseUrl);
  const credentials = uniqueCredentials();
  const response = await client.request<{ user: { id: string; email: string; role: string } }>("POST", "/api/auth/register", {
    json: credentials,
  });
  if (response.status !== 201) throw new Error(`Registration failed: ${response.status} ${JSON.stringify(response.body)}`);

  return { client, credentials, user: response.body.user };
};
