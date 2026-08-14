import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { Bar, Card, Metric, Panel, Sparkline, StatusPill } from "@/components/admin/AdminUI";
import { Logo } from "@/components/brand/Logo";
import { getTraffic } from "@/lib/analytics";
import { photoProgress, readinessItems, readinessSummary } from "@/lib/readiness";
import { runAudit, siteCoverage } from "@/lib/seoAudit";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The studio's own panel.
 *
 * Password-protected in middleware.ts and excluded from search engines both by
 * the robots meta below and by a Disallow in robots.txt.
 *
 * Dynamic, not static: the SEO panel fetches the site's own live pages and the
 * traffic panel calls an external API, so this has to render per request. It is
 * one page behind a password, so the cost of that is nobody's problem.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

function severityLabel(severity: "blocker" | "should" | "nice"): string {
  return severity === "blocker"
    ? "Holds up launch"
    : severity === "should"
      ? "Should be done"
      : "When you can";
}

export default async function AdminPage() {
  // The panel audits whatever host it is being served from, so it reports on
  // the live site in production and on localhost in development without any
  // configuration.
  const head = await headers();
  const host = head.get("host") ?? new URL(site.url).host;
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const [pages, traffic] = await Promise.all([runAudit(origin), getTraffic()]);

  const items = readinessItems(host);
  const summary = readinessSummary(items);
  const photos = photoProgress();
  const coverage = siteCoverage();

  const allChecks = pages.flatMap((p) => p.checks);
  const fails = allChecks.filter((c) => c.status === "fail").length;
  const warns = allChecks.filter((c) => c.status === "warn").length;
  const passes = allChecks.filter((c) => c.status === "pass").length;
  const seoScore = allChecks.length
    ? Math.round(((passes + warns * 0.5) / allChecks.length) * 100)
    : 0;

  const reachable = pages.filter((p) => !p.error);
  const totalWords = reachable.reduce((n, p) => n + p.words, 0);

  return (
    <div className="min-h-screen bg-pista-mist/50 pb-24">
      <header className="border-b border-ink/12 bg-chandni">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Logo size="sm" layout="row" tone="ink" />
            <span
              aria-hidden
              className="hidden h-6 w-px bg-ink/15 sm:block"
            />
            <p className="font-sans text-micro font-semibold uppercase tracking-[0.16em] text-stone-deep">
              Studio panel
            </p>
          </div>

          <nav aria-label="Panel sections" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              ["#readiness", "Readiness"],
              ["#traffic", "Visitors"],
              ["#seo", "Search"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="font-sans text-micro text-stone-deep transition-colors hover:text-ink"
              >
                {label}
              </a>
            ))}
            <Link
              href="/"
              className="font-sans text-micro font-semibold text-pista-ink transition-colors hover:text-ink"
            >
              View site ↗
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-12">
        {/* ---------------------------------------------------------- */}
        {/* Readiness                                                   */}
        {/* ---------------------------------------------------------- */}
        <Panel
          id="readiness"
          title="Ready to launch?"
          subtitle="Everything here is measured from the site itself, so it updates on its own as things are supplied. Nothing needs ticking off by hand."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              value={`${summary.percent}%`}
              label="Overall readiness"
              note={`${summary.done} of ${summary.total} items settled.`}
              tone={summary.percent >= 90 ? "good" : summary.percent >= 60 ? "warn" : "bad"}
            />
            <Metric
              value={`${summary.blockers - summary.blockersDone}`}
              label="Holding up launch"
              note={
                summary.blockers - summary.blockersDone === 0
                  ? "Nothing is blocking. The site can go live."
                  : "The site should not go public until these are cleared."
              }
              tone={summary.blockers - summary.blockersDone === 0 ? "good" : "bad"}
            />
            <Metric
              value={`${photos.real}/${photos.total}`}
              label="Real photographs"
              note={photos.onDemo ? "The rest are temporary stand-ins." : "No stand-in images left."}
              tone={photos.real === photos.total ? "good" : "bad"}
            />
            <Metric
              value={String(coverage[0].count)}
              label="Pages published"
              note={`About ${Math.round(totalWords / 100) / 10}k words of text across the site.`}
            />
          </div>

          <div className="mt-6">
            <Bar
              percent={summary.percent}
              tone={summary.percent >= 90 ? "good" : summary.percent >= 60 ? "warn" : "bad"}
            />
          </div>

          <ul className="mt-8 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card
                  className={cn(
                    "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
                    item.done && "opacity-70",
                  )}
                >
                  <div className="flex gap-4">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.625rem]",
                        item.done
                          ? "border-[#3f6b3f] bg-[#3f6b3f] text-chandni"
                          : item.severity === "blocker"
                            ? "border-[#a8443a] text-[#a8443a]"
                            : "border-ink/25 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-light text-ink">{item.title}</h3>
                      <p className="mt-1 max-w-2xl font-sans text-micro text-stone-deep">
                        {item.status}
                      </p>
                      {!item.done && item.action && (
                        <p className="mt-2 max-w-2xl border-l-2 border-pista pl-3 font-sans text-micro text-ink">
                          {item.action}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 self-start rounded-full px-3 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em]",
                      item.done
                        ? "bg-[#3f6b3f]/12 text-[#3f6b3f]"
                        : item.severity === "blocker"
                          ? "bg-[#a8443a]/12 text-[#8f3a32]"
                          : "bg-ink/8 text-stone-deep",
                    )}
                  >
                    {item.done ? "Done" : severityLabel(item.severity)}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </Panel>

        {/* ---------------------------------------------------------- */}
        {/* Traffic                                                     */}
        {/* ---------------------------------------------------------- */}
        <Panel
          id="traffic"
          title="Who is visiting"
          subtitle={
            traffic.connected
              ? `${traffic.period}, from ${traffic.provider}.`
              : "Visitor numbers need an analytics service. Until one is connected there is nothing real to show here."
          }
        >
          {traffic.connected ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric value={traffic.visitors.toLocaleString("en-IN")} label="Visitors" />
                <Metric value={traffic.pageviews.toLocaleString("en-IN")} label="Pages viewed" />
                <Metric
                  value={traffic.bounceRate === null ? "—" : `${traffic.bounceRate}%`}
                  label="Left straight away"
                  note="Visited one page and went no further."
                />
                <Metric
                  value={
                    traffic.visitDuration === null
                      ? "—"
                      : `${Math.floor(traffic.visitDuration / 60)}m ${traffic.visitDuration % 60}s`
                  }
                  label="Average visit"
                />
              </div>

              {traffic.series.length > 1 && (
                <Card className="mt-4">
                  <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                    Visitors per day
                  </p>
                  <Sparkline
                    points={traffic.series.map((p) => p.visitors)}
                    label={`Daily visitors over the ${traffic.period.toLowerCase()}`}
                  />
                </Card>
              )}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {[
                  ["Most visited pages", traffic.topPages.map((p) => [p.path, p.visitors] as const)],
                  ["Where they came from", traffic.topSources.map((s) => [s.source, s.visitors] as const)],
                ].map(([heading, rows]) => (
                  <Card key={heading as string}>
                    <p className="mb-4 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                      {heading as string}
                    </p>
                    <ul className="flex flex-col">
                      {(rows as (readonly [string, number])[]).map(([name, n]) => (
                        <li
                          key={name}
                          className="flex items-baseline justify-between gap-4 border-t border-ink/10 py-2.5 font-sans text-micro first:border-t-0"
                        >
                          <span className="truncate text-ink">{name}</span>
                          <span className="shrink-0 tabular-nums text-stone-deep">
                            {n.toLocaleString("en-IN")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <p className="font-sans text-body text-ink">{traffic.reason}</p>
              <p className="mt-4 max-w-2xl font-sans text-micro text-stone-deep">
                Visitor counting is already switched on and recording from today, so no data is
                being lost while this is set up — the figures are being collected in Vercel, and
                the charts there work now. This panel can pull them in alongside everything else
                once an analytics service with a readable API is connected.
              </p>
              <div className="mt-5 border-t border-ink/10 pt-4">
                <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                  To show the numbers here
                </p>
                <p className="mt-2 max-w-2xl font-sans text-micro text-stone-deep">
                  Add <code className="font-semibold text-ink">PLAUSIBLE_SITE_ID</code> and{" "}
                  <code className="font-semibold text-ink">PLAUSIBLE_API_KEY</code> to the site's
                  environment variables. This panel fills in on the next page load — nothing else
                  needs changing.
                </p>
              </div>
            </Card>
          )}
        </Panel>

        {/* ---------------------------------------------------------- */}
        {/* SEO                                                         */}
        {/* ---------------------------------------------------------- */}
        <Panel
          id="seo"
          title="How the site looks to Google"
          subtitle="Checked against the live pages every time this panel is opened, not against a saved report — so it is always current."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              value={`${seoScore}%`}
              label="Search health"
              note={`${passes} good, ${warns} worth a look, ${fails} needing a fix.`}
              tone={fails > 0 ? "bad" : warns > 3 ? "warn" : "good"}
            />
            <Metric value={String(reachable.length)} label="Pages checked" />
            <Metric
              value={String(coverage[1].count)}
              label="Service pages"
              note={coverage[1].note}
            />
            <Metric
              value={String(coverage[3].count)}
              label="Cities named"
              note={coverage[3].note}
            />
          </div>

          <div className="mt-8 flex flex-col gap-5">
            {pages.map((page) => (
              <Card key={page.path}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/10 pb-4">
                  <div>
                    <h3 className="font-display text-xl font-light text-ink">{page.name}</h3>
                    <p className="mt-0.5 font-sans text-micro text-stone-deep">{page.path}</p>
                  </div>
                  {page.error ? (
                    <StatusPill status="fail" />
                  ) : (
                    <div className="flex items-center gap-4 font-sans text-micro text-stone-deep">
                      <span className="tabular-nums">{page.words.toLocaleString("en-IN")} words</span>
                      <StatusPill
                        status={
                          page.checks.some((c) => c.status === "fail")
                            ? "fail"
                            : page.checks.some((c) => c.status === "warn")
                              ? "warn"
                              : "pass"
                        }
                      />
                    </div>
                  )}
                </div>

                {page.error ? (
                  <p className="pt-4 font-sans text-micro text-[#8f3a32]">
                    Could not check this page: {page.error}
                  </p>
                ) : (
                  <>
                    <dl className="grid gap-x-8 gap-y-3 border-b border-ink/10 py-4 sm:grid-cols-2">
                      <div>
                        <dt className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                          Shows in Google as
                        </dt>
                        <dd className="mt-1 font-sans text-micro text-ink">
                          {page.title || "— no title —"}
                        </dd>
                        <dd className="mt-1 font-sans text-micro leading-snug text-stone-deep">
                          {page.description || "— no description —"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                          On the page
                        </dt>
                        <dd className="mt-1 font-sans text-micro text-stone-deep">
                          {page.h2Count} sections · {page.images} images ·{" "}
                          {page.internalLinks} links to other pages
                          {page.schemaTypes.length > 0 && (
                            <>
                              <br />
                              {page.schemaTypes.join(", ")}
                            </>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <ul className="flex flex-col">
                      {page.checks.map((check) => (
                        <li
                          key={check.id}
                          className="grid gap-x-6 gap-y-1 border-b border-ink/8 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline"
                        >
                          <span className="font-sans text-micro font-semibold text-ink">
                            {check.label}
                          </span>
                          <span className="font-sans text-micro text-stone-deep">
                            <span className="text-ink">{check.value}</span>
                            {" — "}
                            {check.detail}
                          </span>
                          <StatusPill status={check.status} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            ))}
          </div>
        </Panel>

        <p className="border-t border-ink/12 pt-6 font-sans text-micro text-stone-deep">
          This page is password-protected and hidden from search engines. Everything on it is
          measured live — there is nothing to refresh or maintain.
        </p>
      </main>
    </div>
  );
}
