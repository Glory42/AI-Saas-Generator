import { LogOut, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useLogoutAll } from "@/features/auth/hooks/useAuth";
import type { User } from "@/types/api";
import { DeleteAccountCard } from "../components/DeleteAccountCard";
import { PasswordForm } from "../components/PasswordForm";
import { ProfileForm } from "../components/ProfileForm";
import { UsageStatsGrid } from "../components/UsageStatsGrid";

export function SettingsPage({ user }: { user: User }) {
  const logout = useLogout();
  const logoutAll = useLogoutAll();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <PageHeader title="Settings" description={`Signed in as ${user.email}`} />

      <section aria-labelledby="usage-heading" className="mb-8">
        <h2 id="usage-heading" className="mb-4 text-lg font-semibold">
          Usage
        </h2>
        <UsageStatsGrid />
      </section>

      <div className="flex flex-col gap-6">
        <ProfileForm key={`${user.username}:${user.email}`} user={user} />
        <PasswordForm />

        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Sign out here, or end the session on every device you&apos;ve used.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => logout.mutate()} loading={logout.isPending}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </Button>
            <Button variant="secondary" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}>
              <MonitorSmartphone className="h-4 w-4" aria-hidden /> Sign out everywhere
            </Button>
          </CardContent>
        </Card>

        <DeleteAccountCard />
      </div>
    </div>
  );
}
