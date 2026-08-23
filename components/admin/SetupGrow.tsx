import { Card, Group } from "@/components/admin/AdminUI";
import { CopyButton } from "@/components/admin/CopyButton";
import { SpeedCheck } from "@/components/admin/SpeedCheck";
import type { Traffic } from "@/lib/analytics";
import { WHATSAPP_DISPLAY, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The tab for everything that connects this site to the outside world:
 * which services are wired up, the exact text to paste into listings, and
 * an on-demand speed test.
 *
 * The connection rows only claim what the server can actually observe —
 * environment variables and API responses. Anything that lives in a Google
 * account this code cannot see is labelled "yours to confirm", never
 * guessed at.
 */

type Connection = {
  id: string;
  title: string;
  state: "done" | "todo" | "manual";
  status: string;
  steps?: string[];
};

function StateChip({ state }: { state: Connection["state"] }) {
  const styles = {
    done: "bg-[#3f6b3f]/12 text-[#33562f]",
    todo: "bg-[#9a7433]/16 text-[#7d5d24]",
    manual: "bg-ink/8 text-stone-deep",
  } as const;
  const words = { done: "Done", todo: "To set up", manual: "Yours to confirm" } as const;

  return (
    <span
      className={cn(
        "shrink-0 self-start rounded-full px-3 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em]",
        styles[state],
      )}
    >
      {words[state]}
    </span>
  );
}

export function SetupGrow({
  auditedOrigin,
  domainLive,
  traffic,
  plausibleEnvSet,
}: {
  auditedOrigin: string;
  domainLive: boolean;
  traffic: Traffic;
  plausibleEnvSet: boolean;
}) {
  const connections: Connection[] = [
    {
      id: "domain",
      title: "Your own domain",
      state: domainLive ? "done" : "todo",
      status: domainLive
        ? "The site is being served from your own domain."
        : "The site is still on its temporary address. The setup guide PDF walks through pointing riwaaya.in at it — about twenty minutes, most of it waiting.",
      steps: domainLive
        ? undefined
        : [
            "Vercel → Settings → Domains → add riwaaya.in",
            "Add the two DNS records Vercel shows, at the registrar",
            "Set NEXT_PUBLIC_SITE_URL to https://riwaaya.in and redeploy",
          ],
    },
    {
      id: "plausible",
      title: "Visitor numbers",
      state: traffic.connected ? "done" : "todo",
      status: traffic.connected
        ? `Connected — the “Who is visiting” tab is reading real figures from ${traffic.provider}.`
        : plausibleEnvSet
          ? `The keys are set but the connection is failing: ${traffic.reason}`
          : "Counting is already running and nothing is being lost — the charts are in Vercel today. Showing them here as well needs a service with a readable API; either Umami or Plausible works.",
      steps: traffic.connected
        ? undefined
        : plausibleEnvSet
          ? ["Check both values in Vercel → Settings → Environment Variables, then redeploy"]
          : [
              "Counting is already running — the charts work today in Vercel → Analytics, with nothing to set up",
              "To read the numbers into this panel instead, pick either: Umami (umami.is, free tier) or Plausible (plausible.io, paid)",
              "Add that service's site ID and API key in Vercel → Settings → Environment Variables — UMAMI_SITE_ID and UMAMI_API_KEY, or PLAUSIBLE_SITE_ID and PLAUSIBLE_API_KEY",
              "Redeploy — whichever is set, this tab fills in by itself",
            ],
    },
    {
      id: "search-console",
      title: "Google Search Console",
      state: "manual",
      status:
        "How you find out what people searched to reach the site. Lives in your Google account, so this panel cannot see whether it is done — the steps are short.",
      steps: [
        "search.google.com/search-console → add riwaaya.in as a Domain property",
        "Verify with the TXT record it gives you, added at the registrar",
        "Submit sitemap.xml under Sitemaps",
        "Read the Pages report weekly for the first two months",
      ],
    },
    {
      id: "gbp",
      title: "Google Business Profile",
      state: "manual",
      status:
        "For local searches this outranks the website itself. Create it in the studio's own Google account — the wording must match the listings block below, exactly.",
      steps: [
        "business.google.com → category Wedding Planner, secondary Event Planner",
        "Service area: Chandigarh, Mohali, Panchkula and the hill destinations",
        "Paste the name, address and phone from the block below — do not retype",
        "Verify (Google usually posts a code), then add brand-grade photos",
      ],
    },
    {
      id: "email",
      title: `${site.email} mailbox`,
      state: "manual",
      status:
        "The site already shows this address, so mail sent to it must arrive. The setup guide PDF covers the mailbox and the DNS records that keep it out of spam folders.",
    },
  ];

  /**
   * The exact values to paste into every listing. Consistency is the point:
   * Google decides whether two listings are the same business by comparing
   * these strings, and "3rd Floor" versus "Third Floor" is enough to make it
   * hesitate.
   */
  const listingRows: { label: string; value: string }[] = [
    { label: "Business name", value: site.name },
    { label: "Category", value: "Wedding Planner (secondary: Event Planner)" },
    { label: "Phone", value: WHATSAPP_DISPLAY },
    { label: "Email", value: site.email },
    { label: "Website", value: site.url },
    {
      label: "Address",
      value: `${site.address.street}, ${site.address.locality}, ${site.address.region}${site.address.postalCode ? ` ${site.address.postalCode}` : ""}`,
    },
    { label: "Description", value: site.description },
  ];

  const directories = [
    ["Google Business Profile", "the one that moves local rankings"],
    ["WedMeGood", "the deepest Indian wedding platform, and real referral traffic"],
    ["WeddingWire India / ShaadiSaga", "same parent company, one submission each"],
    ["WeddingSutra", "editorial — also takes real-wedding features"],
    ["Justdial and Sulekha", "low glamour, but they rank for local queries and cost nothing"],
    ["Bing Places and Apple Business Connect", "ten minutes each, then done"],
  ] as const;

  return (
    <>
      <Group
        title="Connections"
        note="What this panel can observe is marked automatically. What lives in your accounts is marked as yours."
      >
        {connections.map((connection) => (
          <Card
            key={connection.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <h4 className="font-display text-xl font-light text-ink">{connection.title}</h4>
              <p className="mt-1 max-w-2xl font-sans text-micro text-stone-deep">
                {connection.status}
              </p>
              {connection.steps && (
                <ol className="mt-3 flex max-w-2xl list-decimal flex-col gap-1 pl-5 font-sans text-micro text-ink/85">
                  {connection.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
            <StateChip state={connection.state} />
          </Card>
        ))}
      </Group>

      <Group
        title="Copy-paste for listings"
        note="Identical wording on every directory is a ranking factor in itself. Copy from here rather than retyping — these are the exact strings the website and its structured data already publish."
      >
        <Card>
          <ul className="flex flex-col">
            {listingRows.map((row) => (
              <li
                key={row.label}
                className="flex items-start justify-between gap-4 border-t border-ink/10 py-3 first:border-t-0"
              >
                <div className="min-w-0">
                  <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                    {row.label}
                  </p>
                  <p className="mt-0.5 break-words font-sans text-micro text-ink">{row.value}</p>
                </div>
                <CopyButton value={row.value} label={row.label.toLowerCase()} />
              </li>
            ))}
          </ul>
          {!site.address.postalCode && (
            <p className="mt-4 border-t border-ink/10 pt-3 font-sans text-micro text-stone-deep">
              The address carries no PIN code yet — it is left out rather than guessed. Send it
              and it appears here and in the site&apos;s structured data in one change.
            </p>
          )}
        </Card>

        <Card>
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
            Where to list, in order
          </p>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
            {directories.map(([name, why]) => (
              <li key={name} className="font-sans text-micro text-stone-deep">
                <span className="font-semibold text-ink">{name}</span> — {why}
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-ink/10 pt-3 font-sans text-micro text-stone-deep">
            Do not pay any of them for placement yet — wait until enquiries show which one sends
            real families.
          </p>
        </Card>
      </Group>

      <Group
        title="Speed"
        note="Slow sites lose mobile visitors before the first photograph loads, and this audience is on phones."
      >
        <SpeedCheck origin={auditedOrigin} />
      </Group>
    </>
  );
}
