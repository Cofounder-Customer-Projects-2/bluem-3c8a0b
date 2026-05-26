import { ThemeToggle } from "@/components/theme-toggle";
import { MeasuredTextBlock } from "@/components/ui/MeasuredTextBlock";

const COFOUNDER_APP_URL = "https://app.cofounder.co";

const HERO_PROSE =
  "From your Cofounder: we wired auth, payments, and email for your new " +
  "product. The plumbing is yours to extend. Day one is on us. The first " +
  "real feature is yours to ship.";

// Provisioning manifest, product variant — leans on the application
// infrastructure that ships with the product template (Supabase auth,
// Stripe webhooks, server actions for the waitlist, Postmark mail).
const MANIFEST: ReadonlyArray<readonly [string, string]> = [
  ["Runtime", "Bun · Next.js 16 · React 19"],
  ["Language", "TypeScript, strict mode"],
  ["Auth", "Supabase SSR, wired"],
  ["Payments", "Stripe webhooks"],
  ["Email", "Postmark transactional"],
  ["Server", "Server actions · proxy"],
];

const STATUS_LABEL = "Work in progress";

function repositoryDetailsFromVercelEnv() {
  const provider =
    process.env.NEXT_PUBLIC_VERCEL_GIT_PROVIDER?.trim() || process.env.VERCEL_GIT_PROVIDER?.trim();
  const owner =
    process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER?.trim() ||
    process.env.VERCEL_GIT_REPO_OWNER?.trim();
  const slug =
    process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG?.trim() ||
    process.env.VERCEL_GIT_REPO_SLUG?.trim();

  if (!owner || !slug || (provider && provider.toLowerCase() !== "github")) {
    return null;
  }

  return {
    label: `${owner}/${slug}`,
    url: `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}`,
  };
}

// Type-foundry diamond — a small filled lozenge used as a visual rest
// between sections, the way fine printing uses ornaments.
function Diamond({ className, size = 6 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-block rotate-45 ${className ?? "bg-[var(--color-ink-70)]"}`}
    />
  );
}

export default function HomePage() {
  const repositoryDetails = repositoryDetailsFromVercelEnv();

  return (
    <main className="relative min-h-screen">
      {/* Masthead — product variant carries its own issue number. */}
      <div className="border-b border-[var(--color-rule)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-8 py-3.5 text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-50)] md:px-12 lg:px-16">
          <span className="inline-flex items-center gap-2.5">
            <Diamond className="bg-[var(--color-caret)]" size={6} />
            <span className="text-[var(--color-ink-80)]">Cofounder</span>
            <span aria-hidden="true" className="text-[var(--color-ink-30)]">
              /
            </span>
            <span>Product — № 03</span>
          </span>
          <span className="inline-flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2.5">
              <span>NY</span>
              <span aria-hidden="true" className="text-[var(--color-ink-30)]">
                ·
              </span>
              <span>MMXXVI</span>
              <span aria-hidden="true" className="text-[var(--color-ink-30)]">
                ·
              </span>
              <span>Work in Progress</span>
            </span>
            <ThemeToggle />
          </span>
        </div>
      </div>

      {/* Spread */}
      <section className="mx-auto grid max-w-6xl gap-x-12 gap-y-16 px-8 pt-20 pb-24 md:grid-cols-12 md:px-12 md:pt-28 md:pb-32 lg:px-16 lg:pt-36 lg:pb-40">
        {/* Editorial column */}
        <div className="co-rise md:col-span-7" style={{ animationDelay: "60ms" }}>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-40)]">
            № 03 · Product · From Cofounder
          </p>

          <h1 className="mt-10 font-display text-[clamp(2.5rem,6.4vw,5.25rem)] font-normal leading-[1] tracking-normal whitespace-nowrap text-[var(--color-ink)]">
            Day one.
          </h1>

          <p className="mt-6 max-w-2xl text-balance italic text-[clamp(1.375rem,2.35vw,1.875rem)] leading-[1.32] tracking-[-0.005em] text-[var(--color-ink-70)]">
            {"bluem, product template."}
          </p>

          <MeasuredTextBlock
            className="mt-12 max-w-md text-[var(--color-ink-70)]"
            text={HERO_PROSE}
            fontFamily='var(--font-figtree), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            fontSizePx={13}
            lineHeightPx={22}
          />

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={COFOUNDER_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 border border-[var(--color-ink)] bg-[var(--color-ink)] px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-[var(--color-bg)] transition-colors duration-200 hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
            >
              <span>Edit in Cofounder</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
            <span className="text-[11px] text-[var(--color-ink-50)]">
              or open{" "}
              <code className="rounded-[2px] bg-[var(--color-ink-5)] px-1.5 py-1 text-[var(--color-ink-80)]">
                src/app/page.tsx
              </code>
            </span>
          </div>
        </div>

        {/* Manifest column — product spec sheet. */}
        <aside
          className="co-rise md:col-span-5 md:border-l md:border-[var(--color-rule)] md:pl-10 lg:pl-14"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-3">
            <Diamond size={6} />
            <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-50)]">
              Provisioning Manifest
            </p>
          </div>

          <dl className="mt-8 divide-y divide-[var(--color-rule-soft)] border-y border-[var(--color-rule)]">
            {MANIFEST.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-4 py-3.5"
              >
                <dt className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-50)]">
                  {label}
                </dt>
                <dd className="text-[12px] leading-[1.5] text-[var(--color-ink-90)]">{value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-4 py-3.5">
              <dt className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-50)]">
                Status
              </dt>
              <dd className="inline-flex items-baseline gap-2.5 text-[12px] leading-[1.5] text-[var(--color-ink-90)]">
                <Diamond size={6} className="translate-y-[1px] bg-[var(--color-caret)]" />
                <span>{STATUS_LABEL}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-ink-40)]">
              Filed
            </p>
            {repositoryDetails ? (
              <a
                href={repositoryDetails.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block text-[12px] text-[var(--color-ink-90)] underline decoration-[var(--color-ink-20)] decoration-from-font underline-offset-[5px] transition-colors hover:decoration-[var(--color-ink-70)]"
              >
                {repositoryDetails.label}
              </a>
            ) : (
              <p className="mt-1.5 text-[12px] text-[var(--color-ink-60)]">via Vercel · GitHub</p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
