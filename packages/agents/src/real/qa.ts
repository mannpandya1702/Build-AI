// QA Agent (spec §6.8): demo_qa/final_qa -> outreach_ready/delivery_approval, with a fix loop back
// to the builder (max 2 iterations, then hold + notify). Mechanizes the CLAUDE.md §8 Definition of
// Done: watermark + noindex on demos, tap-to-call present, reviews verbatim 4+, no placeholder or
// fabricated copy, no secrets in the bundle, and on a real deploy the PageSpeed bar + a Sonnet vision
// review of the live screenshots. A failing check does not fabricate a pass: it loops or holds.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceLead, emitEvent, getPool, notifyOperator } from "@autopilot/core";
import { pagespeed, screenshotSite, llm, MOCK } from "@autopilot/adapters";

const VISION_PROMPT = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "prompts/qa-vision.md"), "utf8");

interface Check { name: string; ok: boolean; detail: string; critical: boolean }

// Secret patterns that must never appear in a client bundle (spec §6.8, CLAUDE.md §5e).
const SECRET_PATTERNS = [/sk-ant-[a-z0-9-]{20,}/i, /AIza[0-9A-Za-z_-]{30,}/, /\bre_[A-Za-z0-9]{20,}/, /cal_live_[a-z0-9]{20,}/, /vc[pk]_[A-Za-z0-9]{20,}/];
const PLACEHOLDER_PATTERNS = [/\[NEEDS:/i, /lorem ipsum/i, /placeholder/i, /example-fixture/i, /\byour company\b/i];

/** Walk a build dir (skipping deps/build output) collecting readable source for grep checks. */
function collectSource(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      if (/^(node_modules|\.next|out|\.git)$/.test(entry)) continue;
      const p = join(d, entry);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (exts.some((e) => p.endsWith(e))) out.push(p);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

/** Rendered copy strings from content.json (everything the visitor can read), EXCLUDING the internal
 *  `needs` array (which legitimately holds [NEEDS] markers and is never rendered). */
function renderedStrings(content: any): string[] {
  const s: string[] = [content.businessName, content.city, content.state, content.primaryService, content.address];
  for (const svc of content.services ?? []) s.push(svc.name, svc.blurb);
  for (const r of content.reviews ?? []) s.push(r.text, r.author);
  for (const f of content.faq ?? []) s.push(f.q, f.a);
  if (content.theme?.hero) s.push(content.theme.hero.headline, content.theme.hero.subhead);
  if (content.watermark) s.push(content.watermark);
  return s.filter((x) => typeof x === "string");
}

export async function qa(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);
  if (lead.status !== "demo_qa" && lead.status !== "final_qa") {
    await emitEvent({ agent: "qa", leadId, level: "debug", type: "qa.skipped", message: `lead at ${lead.status}` });
    return;
  }
  const kind: "demo" | "final" = lead.status === "final_qa" ? "final" : "demo";

  const build = (await pool.query("select * from builds where lead_id=$1 and kind=$2 order by created_at desc limit 1", [leadId, kind])).rows[0];
  if (!build) throw new Error(`no ${kind} build for lead ${leadId}`);
  const dir: string = build.repo_path;
  const url: string = build.deploy_url;
  const iteration: number = build.iteration;

  const checks: Check[] = [];
  const push = (name: string, ok: boolean, detail: string, critical = true) => checks.push({ name, ok, detail, critical });

  // --- content.json checks (structure + honesty) ---
  let content: any = null;
  try {
    content = JSON.parse(readFileSync(resolve(dir, "content.json"), "utf8"));
  } catch {
    push("content.json readable", false, "could not read the build's content.json");
  }

  if (content) {
    if (kind === "demo") {
      push("noindex on demo", content.noindex === true, `noindex=${content.noindex}`);
      push("watermark on demo", Boolean(content.demo) && Boolean(content.watermark), content.watermark ? "present" : "missing");
    } else {
      push("no watermark on final", !content.demo && !content.watermark, content.watermark ? "watermark still present" : "clean");
      push("indexable final", content.noindex !== true, `noindex=${content.noindex}`);
    }
    // tap-to-call: a real phone wired, OR honestly absent (no phone on GBP is a [NEEDS], not a fail)
    push("tap-to-call", Boolean(content.phone), content.phone ? `phone ${content.phone}` : "no phone on GBP (form-only, flagged)", Boolean(lead.contact_phone));
    // reviews shown are verbatim 4+ only (curation, not fabrication)
    const badReview = (content.reviews ?? []).find((r: any) => (r.rating ?? 0) < 4);
    push("reviews 4+ only", !badReview, badReview ? `a ${badReview.rating}-star review is shown` : `${(content.reviews ?? []).length} curated reviews`);
    // no placeholder/fabricated copy leaks into anything the visitor reads
    const rendered = renderedStrings(content).join("\n");
    const placeholderHit = PLACEHOLDER_PATTERNS.find((re) => re.test(rendered));
    push("no placeholder copy", !placeholderHit, placeholderHit ? `matched ${placeholderHit}` : "clean");
  }

  // --- bundle checks (no secrets, no leaked placeholders in source) ---
  const sourceFiles = collectSource(dir, [".tsx", ".ts", ".js", ".json", ".mjs"]);
  let secretHit = "";
  for (const f of sourceFiles) {
    const text = readFileSync(f, "utf8");
    const m = SECRET_PATTERNS.find((re) => re.test(text));
    if (m) { secretHit = `${f.split("/").pop()} matches ${m}`; break; }
  }
  push("no secrets in bundle", !secretHit, secretHit || "clean");

  // --- deployed-URL checks (real mode only; a localhost mock URL can't be PageSpeed'd) ---
  const isLive = !MOCK() && /^https:\/\//.test(url ?? "");
  if (isLive) {
    const reach = await fetch(url, { redirect: "manual" }).catch(() => null);
    push("publicly reachable", Boolean(reach && reach.status === 200), `status ${reach?.status ?? "unreachable"}`);

    try {
      const psi = await pagespeed(url, "mobile");
      const perfBar = kind === "final" ? 90 : 85;
      push("mobile performance", psi.performance >= perfBar, `Lighthouse perf ${psi.performance} (bar ${perfBar})`, false);
      push("seo", psi.seo >= 90, `Lighthouse SEO ${psi.seo} (bar 90)`, false);
    } catch (err) {
      push("pagespeed", false, `pagespeed failed: ${(err as Error).message}`, false);
    }

    try {
      const shots = await screenshotSite(url, `qa-${build.id}`);
      const imgs = shots.filter((s) => s.viewport === "mobile" || s.viewport === "desktop").map((s) => s.path);
      const raw = await llm({ tier: "sonnet", agent: "qa", leadId, maxTokens: 700, system: VISION_PROMPT, images: imgs, prompt: "Review the attached deployed-site screenshots and return the JSON verdict.", mockResponse: JSON.stringify({ pass: true, issues: [] }) });
      const v = safeJson(raw);
      const visionIssues = Array.isArray(v?.issues) ? v.issues.filter((i: any) => i.severity !== "low") : [];
      push("visual review", v?.pass !== false && visionIssues.length === 0, visionIssues.length ? visionIssues.map((i: any) => `${i.where}: ${i.what}`).join("; ") : "clean", false);
    } catch (err) {
      push("visual review", false, `vision QA failed: ${(err as Error).message}`, false);
    }
  } else {
    push("deploy reachable (mock)", Boolean(url), url ? "mock deploy url present" : "no url", false);
  }

  // --- verdict: every CRITICAL check must pass ---
  const failing = checks.filter((c) => !c.ok);
  const criticalFailing = failing.filter((c) => c.critical);
  const passed = criticalFailing.length === 0;
  const issues = failing.map((c) => ({ check: c.name, detail: c.detail, critical: c.critical }));

  await pool.query(
    `insert into qa_reports (build_id, passed, checks, issues, iteration) values ($1,$2,$3,$4,$5)`,
    [build.id, passed, JSON.stringify(checks), JSON.stringify(issues), iteration],
  );

  if (passed) {
    await emitEvent({ agent: "qa", leadId, type: "qa.passed", message: `${kind} #${iteration} green (${checks.length} checks)${MOCK() ? " (mock)" : ""}` });
    if (kind === "demo") {
      await advanceLead(leadId, "outreach_ready", { agent: "qa" });
    } else {
      await advanceLead(leadId, "delivery_approval", { agent: "qa" });
      await notifyOperator({ type: "delivery_approval", title: `${lead.company_name}: final build ready for delivery approval`, leadId });
    }
    return;
  }

  // Failed. Loop back to the builder up to 2 iterations, then hold for the operator (spec §6.8).
  await emitEvent({ agent: "qa", leadId, level: "warn", type: "qa.failed", message: `${kind} #${iteration} failed: ${criticalFailing.map((c) => c.name).join(", ")}`, payload: { issues } });
  if (iteration >= 2) {
    await notifyOperator({ type: "qa_failed", title: `${lead.company_name}: ${kind} failed QA twice, needs you`, leadId });
    await emitEvent({ agent: "qa", leadId, level: "warn", type: "qa.held", message: `held after ${iteration} iterations` });
    return; // stay in *_qa; operator intervenes
  }
  await advanceLead(leadId, kind === "demo" ? "demo_building" : "final_building", { agent: "qa" }); // re-trigger builder
}

function safeJson(s: string): any {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
