import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type RouteErrorBoundaryProps = ErrorComponentProps & { title?: string };

export function RouteErrorBoundary({ error, reset, title = "Something went wrong" }: RouteErrorBoundaryProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  const retry = async () => {
    queryErrorResetBoundary.reset();
    reset();
    await router.invalidate();
  };

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
