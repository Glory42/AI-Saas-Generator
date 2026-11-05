import { Link } from "@tanstack/react-router";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-variants";
import { useAuth, useLogout } from "@/features/auth/hooks/useAuth";

const NAV_LINK_CLASSES =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const ACTIVE_NAV_LINK_CLASSES = "bg-muted text-foreground";

export function AppNavbar() {
  const { user, isAdmin } = useAuth();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link to={user ? "/studio" : "/"} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">AI Product Studio</span>
          </Link>
          {user ? (
            <nav aria-label="Main" className="flex items-center gap-1">
              <Link to="/studio" className={NAV_LINK_CLASSES} activeProps={{ className: ACTIVE_NAV_LINK_CLASSES }}>
                Studio
              </Link>
              <Link to="/gallery" className={NAV_LINK_CLASSES} activeProps={{ className: ACTIVE_NAV_LINK_CLASSES }}>
                Gallery
              </Link>
              <Link to="/settings" className={NAV_LINK_CLASSES} activeProps={{ className: ACTIVE_NAV_LINK_CLASSES }}>
                Settings
              </Link>
              {isAdmin ? (
                <Link to="/admin" className={NAV_LINK_CLASSES} activeProps={{ className: ACTIVE_NAV_LINK_CLASSES }}>
                  Admin
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{user.username}</span>
            <Button variant="ghost" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className={buttonClasses("ghost", "sm")}>
              Sign in
            </Link>
            <Link to="/register" className={buttonClasses("primary", "sm")}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
