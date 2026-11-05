import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getSafeRedirectPath } from "@/lib/router/redirect";

const searchSchema = z.object({ redirect: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/_auth/register")({
  validateSearch: searchSchema,
  component: RegisterRoute,
});

function RegisterRoute() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Create your account"
      description="Twenty free generations a day, no card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" search={{ redirect }} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={() => navigate({ to: getSafeRedirectPath(redirect, "/studio") })} />
    </AuthCard>
  );
}
