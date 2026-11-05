import { Link } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button-variants";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold">Nothing in frame.</h1>
      <p className="text-sm text-muted-foreground">This page doesn&apos;t exist or was moved.</p>
      <Link to="/" className={buttonClasses("primary")}>
        Back home
      </Link>
    </div>
  );
}
