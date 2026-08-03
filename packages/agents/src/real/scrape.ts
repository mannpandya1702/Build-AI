import { CapExceededError, crawlSite, hasMx, llm, placeDetails } from "@autopilot/adapters";
// Scrape/Enrichment Agent (spec §6.2): Places Details (reviews verbatim, photo refs), site crawl,
// Haiku contact extraction (never guessed: regex-verified against page text), MX-check.
// Rule: no findable email AND no contact form -> disqualified(no_contact_path).
import { advanceLead, emitEvent, getPool } from "@autopilot/core";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 12000);
}

export async function scrape(leadId: string): Promise<void> {
  const pool = getPool();
  const r = await pool.query("select * from leads where id = $1", [leadId]);
  const lead = r.rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  // 1. Place Details: reviews verbatim, photo references, authoritative fields.
  // A hard Places cap is not a transient failure: leave the lead in `discovered` for the next
  // day's budget, emit one info event, and return without throwing (no retry storm).
  let d;
  try {
    d = await placeDetails(lead.google_place_id ?? leadId);
  } catch (err) {
    if (err instanceof CapExceededError) {
      await emitEvent({
        agent: "scrape",
        leadId,
        level: "info",
        type: "scrape.deferred",
        message: "places cap reached; lead waits for next day's budget",
      });
      return;
    }
    throw err;
  }
  const reviews = (d.reviews ?? [])
    .filter((x) => (x.text?.text ?? "").trim())
    .slice(0, 5)
    .map((x) => ({
      author: x.authorAttribution?.displayName ?? "Google reviewer",
      rating: x.rating ?? 5,
      text: (x.text!.text as string).trim(),
    }));
  const photoRefs = (d.photos ?? []).slice(0, 8).map((p) => p.name);

  // 2. Crawl their site for contacts (public pages only, robots-aware, rate-limited)
  let email: string | null = null;
  const phone: string | null = lead.contact_phone ?? d.nationalPhoneNumber ?? null;
  let hasContactForm = false;
  let siteAlive = false;
  if (lead.website_url ?? d.websiteUri) {
    const pages = await crawlSite(lead.website_url ?? d.websiteUri!);
    siteAlive = pages.some((p) => p.status >= 200 && p.status < 400 && p.html.length > 300);
    const allText = pages.map((p) => textOf(p.html)).join("\n---\n");
    hasContactForm = pages.some((p) => /<form[\s>]/i.test(p.html));
    const regexHits = [...new Set(allText.match(EMAIL_RE) ?? [])].filter(
      (e) => !/\.(png|jpg|webp|svg)$/i.test(e) && !/example|sentry|wixpress|schema\.org/i.test(e),
    );
    if (regexHits.length) {
      // Haiku picks the best business contact from real candidates; never invents (spec §4.1)
      const pick = await llm({
        tier: "haiku",
        agent: "scrape",
        leadId,
        maxTokens: 60,
        prompt: `From these email addresses found on ${lead.company_name}'s website, return ONLY the single best business contact email (prefer owner/office/info over noreply/webmaster). Candidates: ${regexHits.join(", ")}. Reply with just the email, nothing else.`,
        mockResponse: regexHits[0],
      });
      const candidate = pick.trim().match(EMAIL_RE)?.[0] ?? regexHits[0];
      if (regexHits.includes(candidate)) email = candidate; // must exist verbatim on their pages
    }
  }

  // 3. MX-check the email domain: an address that cannot receive mail is not a contact path
  if (email) {
    const ok = await hasMx(email.split("@")[1]);
    if (!ok) {
      await emitEvent({
        agent: "scrape",
        leadId,
        level: "warn",
        type: "contact.email_invalid_mx",
        message: email,
      });
      email = null;
    }
  }

  await pool.query(
    `update leads set review_count = coalesce($2, review_count), rating = coalesce($3, rating),
       reviews = $4::jsonb, photos = $5::jsonb, contact_email = coalesce($6, contact_email),
       contact_phone = coalesce($7, contact_phone), website_url = coalesce(website_url, $8),
       gbp_url = coalesce(gbp_url, $9)
     where id = $1`,
    [
      leadId,
      d.userRatingCount ?? null,
      d.rating ?? null,
      JSON.stringify(reviews),
      JSON.stringify(photoRefs),
      email,
      phone,
      d.websiteUri ?? null,
      d.googleMapsUri ?? null,
    ],
  );

  // 4. Contact-path rule (spec §6.2). Phone counts as a path for the operator's Touch-2 call.
  if (!email && !hasContactForm && !phone) {
    await pool.query("update leads set disqualify_reason = 'no_contact_path' where id = $1", [leadId]);
    await emitEvent({
      agent: "scrape",
      leadId,
      level: "warn",
      type: "lead.disqualified",
      message: "no_contact_path",
    });
    await advanceLead(leadId, "disqualified", { agent: "scrape", reason: "no_contact_path" });
    return;
  }

  await emitEvent({
    agent: "scrape",
    leadId,
    type: "lead.enriched",
    message: `email=${email ?? "none"} phone=${phone ? "yes" : "no"} form=${hasContactForm} site_alive=${siteAlive} reviews=${reviews.length}`,
    payload: { site_alive: siteAlive, has_contact_form: hasContactForm },
  });
  await advanceLead(leadId, "enriched", { agent: "scrape" });
}
