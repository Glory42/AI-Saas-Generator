import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { hasErrors, validateEmail, validateUsername, type FieldErrors } from "@/features/auth/validation";
import { toast } from "@/lib/toast";
import type { User } from "@/types/api";
import { useUpdateProfile } from "../hooks/useAccount";

// Parent remounts this with key={user.username + user.email} so the form always starts from saved values.
export function ProfileForm({ user }: { user: User }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<FieldErrors<"username" | "email">>({});
  const updateProfile = useUpdateProfile();

  const changes = {
    ...(username.trim() !== user.username ? { username: username.trim() } : {}),
    ...(email.trim().toLowerCase() !== user.email ? { email: email.trim() } : {}),
  };
  const isDirty = Object.keys(changes).length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = { username: validateUsername(username), email: validateEmail(email) };
    setErrors(nextErrors);
    if (hasErrors(nextErrors) || !isDirty) return;
    updateProfile.mutate(changes, { onSuccess: () => toast.success("Profile updated.") });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How you sign in and how you appear to admins.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={errors.username}
            autoComplete="username"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          {updateProfile.error ? (
            <p role="alert" className="text-sm text-destructive">
              {updateProfile.error.message}
            </p>
          ) : null}
          <Button type="submit" className="self-start" disabled={!isDirty} loading={updateProfile.isPending}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
