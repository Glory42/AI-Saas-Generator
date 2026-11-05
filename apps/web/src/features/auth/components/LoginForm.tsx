import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useLogin } from "../hooks/useAuth";
import { hasErrors, validateEmail, validateRequired, type FieldErrors } from "../validation";

type LoginFormProps = { onSuccess: () => void };

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const login = useLogin();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = { email: validateEmail(email), password: validateRequired(password, "Password") };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    login.mutate({ email: email.trim(), password }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      {login.error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {login.error.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}
