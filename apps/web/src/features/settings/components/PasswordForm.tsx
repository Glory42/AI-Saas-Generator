import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { hasErrors, validatePassword, validateRequired, type FieldErrors } from "@/features/auth/validation";
import { toast } from "@/lib/toast";
import { useChangePassword } from "../hooks/useAccount";

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<PasswordField>>({});
  const changePassword = useChangePassword();

  const update = (field: PasswordField) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      currentPassword: validateRequired(values.currentPassword, "Current password"),
      newPassword: validatePassword(values.newPassword),
      confirmPassword: values.confirmPassword === values.newPassword ? undefined : "Passwords don't match.",
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setValues(EMPTY);
          toast.success("Password changed. Other devices were signed out.");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Changing it signs out every other device.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={update("currentPassword")}
            error={errors.currentPassword}
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={update("newPassword")}
            error={errors.newPassword}
            hint="At least 8 characters."
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
          />
          {changePassword.error ? (
            <p role="alert" className="text-sm text-destructive">
              {changePassword.error.message}
            </p>
          ) : null}
          <Button type="submit" className="self-start" loading={changePassword.isPending}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
