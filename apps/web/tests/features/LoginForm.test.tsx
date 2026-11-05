import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { jsonResponse, mockFetch } from "../helpers";

const user = {
  id: "user-1",
  email: "ada@example.com",
  username: "ada",
  role: "user",
  createdAt: "2026-11-05T10:00:00.000Z",
};

const renderForm = (onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return { queryClient, onSuccess };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LoginForm", () => {
  it("shows field errors and doesn't call the API for invalid input", async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ user }));
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in, caches the session user and calls onSuccess", async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ user }));
    const { queryClient, onSuccess } = renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "  ada@example.com ");
    await userEvent.type(screen.getByLabelText("Password"), "correct horse");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(String(init?.body))).toEqual({ email: "ada@example.com", password: "correct horse" });
    expect(queryClient.getQueryData(authKeys.session)).toEqual(user);
  });

  it("shows the API's message when credentials are rejected", async () => {
    mockFetch(async () =>
      jsonResponse({ error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }, 401),
    );
    const { onSuccess } = renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
