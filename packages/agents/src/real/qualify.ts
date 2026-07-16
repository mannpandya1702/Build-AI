import { loadIcp } from "@autopilot/adapters";
// Qualifier Agent (spec §6.3): deterministic scoring from icp.yaml (the contract's §4 rubric,
// encoded exactly). ENV ADAPTATION (PROGRESS.md): the "outdated/broken/mobile-unfriendly"
// judgment uses a deterministic homepage probe (dead/parked/no-viewport) instead of a Haiku
// screenshot review until Phase 3 wires screenshots.
import { advanceLead, emitEvent, getPool } from "@autopilot/core";

async function probeSiteWeak(url: string): Promise<{ weak: boolean; why: string }> {
  try {
    const res = await fetch(url.startsWith("http") ? url : `https://${url}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      },
    });
    if (res.status >= 400) return { weak: true, why: `homepage HTTP ${res.status}` };
    const html = await res.text();
    if (html.length < 300 || /window\.location\.href=.{0,4}\/lander/i.test(html))
      return { weak: true, why: "parked/empty page" };
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) return { weak: true, why: "no mobile viewport meta" };
    return { weak: false, why: "live mobile site" };
  } catch {
    return { weak: true, why: "unreachable" };
  }
}

export async function qualify(leadId: string): Promise<void> {
  const pool = getPool();
  const r = await pool.query("select * from leads where id = $1", [leadId]);
  const lead = r.rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);
  const icp = loadIcp();
  const rub = icp.rubric;

  // auto-disqualify: chains/franchises (contract §4)
  const nameLc = (lead.company_name as string).toLowerCase();
  if (icp.disqualify.chain_markers.some((m) => nameLc.includes(m))) {
    await pool.query("update leads set disqualify_reason = 'national_chain' where id = $1", [leadId]);
    await advanceLead(leadId, "disqualified", { agent: "qualify", reason: "national_chain" });
    return;
  }

  const breakdown: Record<string, number> = {};
  const reviews = lead.review_count ?? 0;
  breakdown.reviews = reviews >= 40 ? rub.reviews_40_plus : reviews >= 20 ? rub.reviews_20_plus : 0;
  breakdown.rating = (lead.rating ?? 0) >= 4 ? rub.rating_4_plus : 0;

  let gapWhy = "no website";
  if (!lead.website_url) {
    breakdown.website_gap = rub.website_gap;
  } else {
    const probe = await probeSiteWeak(lead.website_url);
    gapWhy = probe.why;
    breakdown.website_gap = probe.weak ? rub.website_gap : 0;
    // auto-disqualify: already on a live modern mobile site AND nothing else weak (contract §4)
  }
  breakdown.niche = rub.target_niche; // discovered via the active vertical's own queries
  breakdown.photos = (lead.photos ?? []).length > 0 ? rub.photos_available : 0;
  breakdown.phone = lead.contact_phone ? rub.phone_present : 0;

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  await pool.query("update leads set score = $2, score_breakdown = $3 where id = $1", [
    leadId,
    score,
    JSON.stringify(breakdown),
  ]);

  // no personalization material at all -> disqualify (contract §4)
  if ((lead.photos ?? []).length === 0 && reviews === 0) {
    await pool.query("update leads set disqualify_reason = 'nothing_real_to_personalize' where id = $1", [
      leadId,
    ]);
    await advanceLead(leadId, "disqualified", { agent: "qualify", reason: "nothing_real_to_personalize" });
    return;
  }

  await emitEvent({
    agent: "qualify",
    leadId,
    type: "lead.scored",
    message: `score ${score} (site: ${gapWhy})`,
    payload: breakdown,
  });
  if (score >= icp.qualify_threshold) {
    await advanceLead(leadId, "qualified", { agent: "qualify" });
  } else {
    await pool.query("update leads set disqualify_reason = $2 where id = $1", [
      leadId,
      `below_threshold_${score}`,
    ]);
    await advanceLead(leadId, "disqualified", {
      agent: "qualify",
      reason: `score ${score} < ${icp.qualify_threshold}`,
    });
  }
}
