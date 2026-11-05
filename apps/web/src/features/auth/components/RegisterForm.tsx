import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useRegister } from "../hooks/useAuth";
import { hasErrors, validateEmail, validatePassword, validateUsername, type FieldErrors } from "../validation";

type RegisterField = "username" | "email" | "password";

type RegisterFormProps = { onSuccess: () => void };

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({});
  const register = useRegister();

  const update = (field: RegisterField) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    register.mutate(
      { username: values.username.trim(), email: values.email.trim(), password: values.password },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Username"
        autoComplete="username"
        value={values.username}
        onChange={update("username")}
        error={errors.username}
      />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={update("password")}
        error={errors.password}
        hint="At least 8 characters."
      />
      {register.error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {register.error.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={register.isPending}>
        Create account
      </Button>
    </form>
  );
}
