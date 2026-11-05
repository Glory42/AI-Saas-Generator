export function AppFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} AI Product Studio · GPL-3.0</p>
        <a
          href="https://github.com/Glory42/ai-saas-generator"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
