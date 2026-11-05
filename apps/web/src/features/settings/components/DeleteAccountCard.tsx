import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalShell } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { useDeleteAccount } from "../hooks/useAccount";

export function DeleteAccountCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const deleteAccount = useDeleteAccount();

  const close = () => {
    setIsOpen(false);
    setPassword("");
    deleteAccount.reset();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password) deleteAccount.mutate(password);
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Deleting your account removes every image, generation and stored file. This can&apos;t be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete account
        </Button>
      </CardContent>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        title="Delete your account?"
        description="Enter your password to confirm."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={deleteAccount.error?.message}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={deleteAccount.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!password} loading={deleteAccount.isPending}>
              Delete forever
            </Button>
          </div>
        </form>
      </ModalShell>
    </Card>
  );
}
