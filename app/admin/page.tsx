import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { Bar, Card, Group, Metric, Panel, Sparkline, StatusPill } from "@/components/admin/AdminUI";
import { SerpPreview, WhatsAppPreview } from "@/components/admin/Previews";
import { SetupGrow } from "@/components/admin/SetupGrow";
import { Tabs } from "@/components/admin/Tabs";
import { Logo } from "@/components/brand/Logo";
import { getTraffic } from "@/lib/analytics";
import { photoProgress, readinessItems, readinessSummary } from "@/lib/readiness";
import { resolveAuditOrigin, runAudit, siteCoverage } from "@/lib/seoAudit";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The studio's own panel.
 *
 * Password-protected in proxy.ts and excluded from search engines both by the
 * robots meta below and by a Disallow in robots.txt.
 *
 * Dynamic, not static: the search panel fetches the site's own live pages and
 * the visitor panel calls an external API, so this has to render per request.
 * It is one page behind a password, so the cost of that is nobody's problem.
 *
 * Laid out as three tabs rather than three stacked panels. The studio's note
 * was that there were no clear sections, which was fair — the readiness list,
 * the visitor figures and sixty-odd search checks ran together into one very
 * long scroll, and the only way to find out whether anything needed attention
 * was to read all of it.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage() {
  // The panel audits whatever host it is being served from, so it reports on
  // the live site in production and on localhost in development without any
  // configuration.
  const head = await headers();
  const host = head.get("host") ?? new URL(site.url).host;
  /*
   * The readiness panel below still asks about `host` — the address that
   * actually served this request — because that is the honest answer to "is
   * the real domain live yet". The search audit deliberately asks something
   * different: what the public site looks like, wherever this panel is open.
   */
  const audited = await resolveAuditOrigin(host);

  const [pages, traffic] = await Promise.all([runAudit(audited.origin), getTraffic()]);

  // "Keys are present" — either provider — so a failing connection can be
  // reported as broken configuration rather than as nothing being set up.
  const plausibleEnvSet = Boolean(
    (process.env.PLAUSIBLE_SITE_ID && process.env.PLAUSIBLE_API_KEY) ||
      (process.env.UMAMI_SITE_ID && process.env.UMAMI_API_KEY),
  );

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
    : null;
  /* A score of 0% and a score of "we could not read anything" look identical
     as a number and mean opposite things, so the second one is not a number. */
  const seoLabel = seoScore === null ? "—" : `${seoScore}%`;

  const reachable = pages.filter((p) => !p.error);
  const unreachable = pages.filter((p) => p.error);
  const totalWords = reachable.reduce((n, p) => n + p.words, 0);

  const blocking = items.filter((i) => !i.done && i.severity === "blocker");
  const soon = items.filter((i) => !i.done && i.severity === "should");
  const later = items.filter((i) => !i.done && i.severity === "nice");
  const settled = items.filter((i) => i.done);

  /** Every check that is not a pass, flattened across pages and worst first. */
  const needsAttention = pages
    .filter((p) => !p.error)
    .flatMap((p) => p.checks.filter((c) => c.status !== "pass").map((c) => ({ ...c, page: p.name })))
    .sort((a, b) => (a.status === "fail" ? -1 : 0) - (b.status === "fail" ? -1 : 0));

  const domainLive = !audited.host.includes("vercel.app") && !audited.host.startsWith("localhost");
  const setupPending = (domainLive ? 0 : 1) + (traffic.connected ? 0 : 1);

  const standing = blocking.length
    ? `${blocking.length === 1 ? "One thing is" : `${blocking.length} things are`} holding up launch. Everything else on the site is built and working.`
    : "Nothing is holding up launch. The site is ready to go public whenever you are.";

  return (
    <div className="min-h-screen bg-pista-mist/40 pb-24">
      {/* ---------------------------------------------------------- */}
      {/* Masthead                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="border-b border-ink/12 bg-chandni">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Logo size="sm" layout="row" tone="ink" />
            <span aria-hidden className="hidden h-6 w-px bg-ink/15 sm:block" />
            <p className="font-sans text-micro font-semibold uppercase tracking-[0.16em] text-stone-deep">
              Studio panel
            </p>
          </div>

          <Link
            href="/"
            className="font-sans text-micro font-semibold text-pista-ink transition-colors hover:text-ink"
          >
            View the website ↗
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6">
        {/* -------------------------------------------------------- */}
        {/* Where things stand                                        */}
        {/* -------------------------------------------------------- */}
        <section className="py-10">
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-pista-ink">
            Where things stand
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-light leading-tight text-ink md:text-4xl">
            {standing}
          </h1>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric
              value={`${summary.percent}%`}
              label="Ready to launch"
              note={`${summary.done} of ${summary.total} items settled.`}
              tone={summary.percent >= 90 ? "good" : summary.percent >= 60 ? "warn" : "bad"}
            />
            <Metric
              value={`${photos.real}/${photos.total}`}
              label="Real photographs"
              note={
                photos.onDemo
                  ? "The rest are temporary stand-ins and cannot go live."
                  : "No stand-in images left."
              }
              tone={photos.real === photos.total ? "good" : "bad"}
            />
            <Metric
              value={seoLabel}
              label="Search health"
              note={
                seoScore === null
                  ? "The pages could not be read, so there is nothing to score."
                  : `${passes} good, ${warns} worth a look, ${fails} needing a fix.`
              }
              tone={seoScore === null || fails > 0 ? "bad" : warns > 3 ? "warn" : "good"}
            />
          </div>

          <div className="mt-5">
            <Bar
              percent={summary.percent}
              tone={summary.percent >= 90 ? "good" : summary.percent >= 60 ? "warn" : "bad"}
            />
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Sections                                                  */}
        {/* -------------------------------------------------------- */}
        <Tabs
          tabs={[
            {
              id: "todo",
              label: "What's left to do",
              badge: String(blocking.length + soon.length + later.length),
              tone: blocking.length ? "bad" : soon.length ? "warn" : "good",
              panel: (
                <Panel
                  title="What's left to do"
                  subtitle="Measured from the website itself, so it updates on its own as things are supplied. There is nothing here to tick off by hand."
                >
                  {blocking.length > 0 && (
                    <Group
                      title="Holding up launch"
                      count={blocking.length}
                      tone="bad"
                      note="The site should not go public until these are cleared."
                    >
                      {blocking.map((item) => (
                        <ReadinessCard key={item.id} item={item} />
                      ))}
                    </Group>
                  )}

                  {soon.length > 0 && (
                    <Group
                      title="Worth doing soon"
                      count={soon.length}
                      tone="warn"
                      note="None of these stop the site going live, but each one makes it work harder."
                    >
                      {soon.map((item) => (
                        <ReadinessCard key={item.id} item={item} />
                      ))}
                    </Group>
                  )}

                  {later.length > 0 && (
                    <Group
                      title="When you have a moment"
                      count={later.length}
                      note="Small improvements. Nothing is waiting on them."
                    >
                      {later.map((item) => (
                        <ReadinessCard key={item.id} item={item} />
                      ))}
                    </Group>
                  )}

                  {settled.length > 0 && (
                    <Group title="Already done" count={settled.length} tone="good">
                      {settled.map((item) => (
                        <ReadinessCard key={item.id} item={item} />
                      ))}
                    </Group>
                  )}
                </Panel>
              ),
            },

            {
              id: "visitors",
              label: "Who is visiting",
              tone: traffic.connected ? "good" : undefined,
              badge: traffic.connected ? undefined : "Not set up",
              panel: (
                <Panel
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
                        <Metric
                          value={traffic.pageviews.toLocaleString("en-IN")}
                          label="Pages viewed"
                        />
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
                          [
                            "Most visited pages",
                            traffic.topPages.map((p) => [p.path, p.visitors] as const),
                          ],
                          [
                            "Where they came from",
                            traffic.topSources.map((s) => [s.source, s.visitors] as const),
                          ],
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
                                  <span className="shrink-0 lining-nums tabular-nums text-stone-deep">
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
                        Visitor counting is already switched on and recording, so nothing is being
                        lost while this is set up — the figures are being collected and the charts
                        in Vercel work today. This panel can show them alongside everything else
                        once an analytics service with a readable API is connected.
                      </p>
                      <div className="mt-5 border-t border-ink/10 pt-4">
                        <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                          To show the numbers here
                        </p>
                        <p className="mt-2 max-w-2xl font-sans text-micro text-stone-deep">
                          Add <code className="font-semibold text-ink">PLAUSIBLE_SITE_ID</code> and{" "}
                          <code className="font-semibold text-ink">PLAUSIBLE_API_KEY</code> to the
                          site&apos;s environment variables. This panel fills in on the next page
                          load — nothing else needs changing.
                        </p>
                      </div>
                    </Card>
                  )}
                </Panel>
              ),
            },

            {
              id: "search",
              label: "Search health",
              badge: seoLabel,
              tone: seoScore === null || fails > 0 ? "bad" : warns > 3 ? "warn" : "good",
              panel: (
                <Panel
                  title="How the site looks to Google"
                  subtitle={`Checked against the live pages at ${audited.host} every time this panel is opened, not against a saved report — so it is always current.`}
                >
                  {unreachable.length > 0 && (
                    <Card className="mb-6 border-l-2 border-l-[#a8443a]">
                      <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#8f3a32]">
                        {unreachable.length === pages.length
                          ? "The site could not be read"
                          : `${unreachable.length} of ${pages.length} pages could not be read`}
                      </p>
                      <p className="mt-2 max-w-2xl font-sans text-body text-ink">
                        {unreachable.length === pages.length
                          ? `Nothing below is a verdict on your pages — the checks could not reach ${audited.host} at all.`
                          : "The pages listed below with an error were not measured. The score covers only the ones that were."}
                      </p>
                      <p className="mt-3 max-w-2xl font-sans text-micro text-stone-deep">
                        {unreachable[0].error}
                      </p>
                    </Card>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                      value={`${reachable.length}/${pages.length}`}
                      label="Pages checked"
                      tone={unreachable.length ? "bad" : "ink"}
                      note={unreachable.length ? "Some pages could not be reached." : undefined}
                    />
                    <Metric
                      value={`${Math.round(totalWords / 100) / 10}k`}
                      label="Words of text"
                      note="Across the whole site."
                    />
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

                  {/* The actionable half. Everything not passing, gathered
                      from every page, so nothing has to be expanded to find
                      out whether there is anything to do. */}
                  <Group
                    title={needsAttention.length ? "What to look at first" : "Nothing needs fixing"}
                    count={needsAttention.length || undefined}
                    tone={fails > 0 ? "bad" : needsAttention.length ? "warn" : "good"}
                    note={
                      needsAttention.length
                        ? "Gathered from every page, so this is the whole list."
                        : "Every check on every page passed. The full detail is below if you want it."
                    }
                  >
                    {needsAttention.length > 0 && (
                      <Card>
                        <ul className="flex flex-col">
                          {needsAttention.map((check, index) => (
                            <li
                              key={`${check.page}-${check.id}-${index}`}
                              className="grid gap-x-6 gap-y-1 border-t border-ink/10 py-3 first:border-t-0 sm:grid-cols-[9rem_1fr_auto] sm:items-baseline"
                            >
                              <span className="font-sans text-micro font-semibold text-ink">
                                {check.page}
                              </span>
                              <span className="font-sans text-micro text-stone-deep">
                                <span className="text-ink">{check.label}</span>
                                {" — "}
                                {check.detail}
                              </span>
                              <StatusPill status={check.status} />
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </Group>

                  {/* Full detail, one collapsed block per page. */}
                  <Group
                    title="Every page in detail"
                    count={pages.length}
                    note="Open any page to see exactly what Google reads from it."
                  >
                    {pages.map((page) => {
                      const status = page.error
                        ? "fail"
                        : page.checks.some((c) => c.status === "fail")
                          ? "fail"
                          : page.checks.some((c) => c.status === "warn")
                            ? "warn"
                            : "pass";

                      return (
                        <details
                          key={page.path}
                          className="group rounded-sm border border-ink/12 bg-chandni shadow-[0_1px_0_0_rgba(34,39,31,0.04)]"
                        >
                          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-6 gap-y-2 p-5">
                            <div className="flex items-baseline gap-3">
                              <span
                                aria-hidden
                                className="font-sans text-micro text-stone-deep transition-transform group-open:rotate-90"
                              >
                                ›
                              </span>
                              <div>
                                <h4 className="font-display text-xl font-light text-ink">
                                  {page.name}
                                </h4>
                                <p className="mt-0.5 font-sans text-micro text-stone-deep">
                                  {page.path}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 font-sans text-micro text-stone-deep">
                              {!page.error && (
                                <span className="lining-nums tabular-nums">
                                  {page.words.toLocaleString("en-IN")} words
                                </span>
                              )}
                              <StatusPill status={status} />
                            </div>
                          </summary>

                          <div className="border-t border-ink/10 px-5 pb-5">
                            {page.error ? (
                              <p className="pt-4 font-sans text-micro text-[#8f3a32]">
                                Could not check this page: {page.error}
                              </p>
                            ) : (
                              <>
                                {/* Not the metadata as data but the metadata as
                                    it is actually seen — a Google result and a
                                    WhatsApp forward, drawn from the served tags. */}
                                <div className="grid items-start gap-4 border-b border-ink/10 py-4 lg:grid-cols-2">
                                  <SerpPreview page={page} host={audited.host} />
                                  <WhatsAppPreview
                                    page={page}
                                    host={audited.host}
                                    origin={audited.origin}
                                  />
                                </div>
                                <p className="border-b border-ink/10 py-3 font-sans text-micro text-stone-deep">
                                  On the page: {page.h2Count} sections · {page.images} images ·{" "}
                                  {page.internalLinks} links to other pages
                                  {page.schemaTypes.length > 0 && (
                                    <> · structured data: {page.schemaTypes.join(", ")}</>
                                  )}
                                </p>

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
                          </div>
                        </details>
                      );
                    })}
                  </Group>
                </Panel>
              ),
            },

            {
              id: "setup",
              label: "Set up & grow",
              badge: setupPending ? `${setupPending} to do` : "Ready",
              tone: setupPending ? "warn" : "good",
              panel: (
                <Panel
                  title="Set up & grow"
                  subtitle="Connections, the exact text to paste into listings, and an on-demand speed test. API keys go into Vercel's environment variables — this panel notices them by itself."
                >
                  <SetupGrow
                    auditedOrigin={audited.origin}
                    domainLive={domainLive}
                    traffic={traffic}
                    plausibleEnvSet={plausibleEnvSet}
                  />
                </Panel>
              ),
            },
          ]}
        />

        <p className="mt-16 border-t border-ink/12 pt-6 font-sans text-micro text-stone-deep">
          This page is password-protected and hidden from search engines. Everything on it is
          measured live — there is nothing to refresh or maintain.
        </p>
      </div>
    </div>
  );
}

/** One readiness item. Same card in every group; the group carries the state. */
function ReadinessCard({
  item,
}: {
  item: ReturnType<typeof readinessItems>[number];
}) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        item.done && "opacity-70",
      )}
    >
      <div className="flex gap-4">
        {/* A tick means done and nothing else. An outstanding blocker used to
            render a tick in red, which read as "finished, badly" — it now
            carries an exclamation, and everything else an empty circle. */}
        <span
          aria-hidden
          className={cn(
            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-semibold",
            item.done
              ? "border-[#3f6b3f] bg-[#3f6b3f] text-chandni"
              : item.severity === "blocker"
                ? "border-[#a8443a] text-[#a8443a]"
                : "border-ink/25 text-transparent",
          )}
        >
          {item.done ? "✓" : item.severity === "blocker" ? "!" : "·"}
        </span>
        <div>
          <h4 className="font-display text-xl font-light text-ink">{item.title}</h4>
          <p className="mt-1 max-w-2xl font-sans text-micro text-stone-deep">{item.status}</p>
          {!item.done && item.action && (
            <p className="mt-2 max-w-2xl border-l-2 border-pista pl-3 font-sans text-micro text-ink">
              {item.action}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
