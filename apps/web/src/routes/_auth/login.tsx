import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getSafeRedirectPath } from "@/lib/router/redirect";

const searchSchema = z.object({ redirect: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/_auth/login")({
  validateSearch: searchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue to your studio."
      footer={
        <>
          New here?{" "}
          <Link to="/register" search={{ redirect }} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate({ to: getSafeRedirectPath(redirect, "/studio") })} />
    </AuthCard>
  );
}
