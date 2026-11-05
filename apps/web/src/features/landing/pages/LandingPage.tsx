import { Link } from "@tanstack/react-router";
import { ArrowRight, Database, Gauge, ImageUp, Layers, Palette, ScrollText, Sparkles, Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-variants";
import { TemplateShowcase } from "../components/TemplateShowcase";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ImageUp, title: "Upload", body: "Drop in any product photo — even a quick phone shot on the kitchen table." },
  { icon: Palette, title: "Pick a style", body: "Studio-clean for your store, vibrant for Instagram, or an outdoor lifestyle scene." },
  { icon: Download, title: "Download", body: "Get a marketing-ready image in seconds and find it again in your gallery." },
];

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Layers,
    title: "Tiered AI pipeline",
    body: "Flash styles use the fast model, Pro styles the high-quality one, with an automatic fallback strategy if a model fails.",
  },
  {
    icon: Database,
    title: "Smart result cache",
    body: "The same photo in the same style is served from your cache instantly — and costs nothing.",
  },
  {
    icon: Gauge,
    title: "Fair daily quotas",
    body: "Rolling 24-hour limits keep costs predictable, and you can always see what's left.",
  },
  {
    icon: ScrollText,
    title: "Audit trail",
    body: "Logins, generations and admin actions are recorded so every cost and change is traceable.",
  },
];

export function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="flex flex-col items-center gap-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Powered by Gemini image models
        </span>
        <h1 className="max-w-3xl text-5xl font-black tracking-tight text-balance sm:text-6xl">
          Turn product photos into <span className="text-primary">studio-quality</span> shots
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          Upload a blurry phone photo, choose a style, and get a professional e-commerce or social asset in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className={buttonClasses("primary", "lg")}>
            Get started free <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to="/login" className={buttonClasses("outline", "lg")}>
            Sign in
          </Link>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="py-16">
        <h2 id="how-heading" className="mb-10 text-center text-3xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-semibold">
                {index + 1}. {title}
              </h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="styles-heading" className="py-16">
        <h2 id="styles-heading" className="mb-2 text-center text-3xl font-bold">
          Styles
        </h2>
        <p className="mb-10 text-center text-muted-foreground">Every style is tuned for a different channel.</p>
        <TemplateShowcase />
      </section>

      <section aria-labelledby="features-heading" className="py-16">
        <h2 id="features-heading" className="mb-10 text-center text-3xl font-bold">
          Built like a real product
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-card/60 p-6">
              <Icon className="h-6 w-6 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="my-16 flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-14 text-center">
        <h2 className="text-3xl font-bold">Ready for better product photos?</h2>
        <p className="text-muted-foreground">Create an account and render your first shot in under a minute.</p>
        <Link to="/register" className={buttonClasses("primary", "lg")}>
          Create your account
        </Link>
      </section>
    </div>
  );
}
