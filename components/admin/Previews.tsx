import type { PageAudit } from "@/lib/seoAudit";

/**
 * What a page actually looks like in the two places it gets seen before
 * anyone visits: a Google result and a WhatsApp forward. Rendered from the
 * audited page's own served metadata, so these previews cannot flatter — if
 * the title truncates here, it truncates out there.
 *
 * Both cards deliberately use those platforms' own colours rather than the
 * brand's: the point is to show the page in *their* clothes.
 */

/** Truncate on a word boundary with an ellipsis, the way result pages do. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))} …`;
}

export function SerpPreview({ page, host }: { page: PageAudit; host: string }) {
  const crumb = page.path === "/" ? "" : ` › ${page.path.slice(1).replace(/\//g, " › ")}`;

  return (
    <div className="rounded-sm border border-ink/12 bg-white p-4">
      <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
        In a Google result
      </p>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f3f4] font-display text-xs text-ink"
          >
            R
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-sans text-[0.8125rem] text-[#202124]">Riwaaya</span>
            <span className="font-sans text-[0.6875rem] text-[#4d5156]">
              {host}
              {crumb}
            </span>
          </span>
        </div>
        <p className="mt-1.5 font-sans text-[1.125rem] leading-snug text-[#1a0dab]">
          {clip(page.title || "(no title)", 60)}
        </p>
        <p className="mt-1 font-sans text-[0.8125rem] leading-normal text-[#4d5156]">
          {clip(page.description || "(Google will pick its own sentence from the page)", 160)}
        </p>
      </div>
    </div>
  );
}

export function WhatsAppPreview({
  page,
  host,
  origin,
}: {
  page: PageAudit;
  host: string;
  origin: string;
}) {
  /*
   * og:image URLs are absolute on the canonical domain, which before launch
   * is not the domain actually serving — so for the <img> here, keep the
   * path and load it from the origin the audit reached. What renders is the
   * same generated image a WhatsApp forward would fetch.
   */
  const imageSrc = (() => {
    if (!page.ogImage) return null;
    try {
      const url = new URL(page.ogImage);
      return `${origin}${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  })();

  return (
    <div className="rounded-sm border border-ink/12 bg-[#efeae2] p-4">
      <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
        Forwarded on WhatsApp
      </p>
      <div className="mt-3 max-w-sm overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
        {imageSrc ? (
          // A plain img, not next/image: the source is the audited origin at
          // runtime, and optimising a 45KB generated PNG through the image
          // pipeline would only add a hop.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="" className="aspect-[1200/630] w-full object-cover" />
        ) : (
          <div className="flex aspect-[1200/630] w-full items-center justify-center bg-[#f0f2f5] font-sans text-micro text-stone-deep">
            No preview image
          </div>
        )}
        <div className="bg-[#f0f2f5] px-3 py-2">
          <p className="truncate font-sans text-[0.8125rem] font-semibold text-[#111b21]">
            {page.ogTitle || page.title || "(no title)"}
          </p>
          <p className="line-clamp-2 font-sans text-[0.75rem] leading-snug text-[#54656f]">
            {/* og:description, which is what a share shows — it differs from
                the search description on most pages here. */}
            {page.ogDescription || page.description}
          </p>
          <p className="mt-0.5 font-sans text-[0.6875rem] lowercase text-[#8696a0]">{host}</p>
        </div>
      </div>
    </div>
  );
}
