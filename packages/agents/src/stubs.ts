// Phase 1 stub handlers (spec §13 Phase 1): each agent reads its input, waits briefly, writes
// plausible fixture output to the real tables, emits events, and advances the lead. The full
// state machine is traversable start to finish in mock mode with zero external calls.
// Real implementations replace these one phase at a time; the seams (registry, scheduler,
// advanceLead, events) are already final.

import { advanceLead, emitEvent, getPool, notifyOperator, type LeadStatus } from "@autopilot/core";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LeadRow {
  id: string;
  status: LeadStatus;
  company_name: string;
  slug: string | null;
  industry: string | null;
  city: string | null;
}

async function getLead(leadId: string): Promise<LeadRow> {
  const r = await getPool().query<LeadRow>(
    "select id, status, company_name, slug, industry, city from leads where id = $1",
    [leadId],
  );
  if (r.rowCount === 0) throw new Error(`lead ${leadId} not found`);
  return r.rows[0];
}

/** scrape/enrichment stub: fills GBP-ish fields, then enriched */
async function scrape(leadId: string): Promise<void> {
  const pool = getPool();
  await sleep(300);
  await pool.query(
    `update leads set review_count = 57, rating = 4.8, contact_email = coalesce(contact_email, 'owner@example-fixture.test'),
     contact_phone = coalesce(contact_phone, '(214) 555-0100'),
     reviews = $2::jsonb where id = $1`,
    [leadId, JSON.stringify([{ author: "Fixture Reviewer", rating: 5, text: "Great work, fast and honest." }])],
  );
  await emitEvent({ agent: "scrape", leadId, type: "lead.enriched", message: "fixture enrichment complete" });
  await advanceLead(leadId, "enriched", { agent: "scrape" });
}

/** qualifier stub: deterministic fixture score, then qualified */
async function qualify(leadId: string): Promise<void> {
  await sleep(200);
  const breakdown = { reviews: 30, rating: 15, website_gap: 25, niche: 15, photos: 10, phone: 5 };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  await getPool().query("update leads set score = $2, score_breakdown = $3 where id = $1", [
    leadId,
    score,
    JSON.stringify(breakdown),
  ]);
  await emitEvent({ agent: "qualify", leadId, type: "lead.qualified", message: `score ${score}`, payload: breakdown });
  await advanceLead(leadId, "qualified", { agent: "qualify" });
}

/** analyzer stub: audit row with evidence-shaped findings */
async function analyzer(leadId: string): Promise<void> {
  await sleep(400);
  await getPool().query(
    `insert into audits (lead_id, lighthouse, findings, summary) values ($1, $2, $3, $4)`,
    [
      leadId,
      JSON.stringify({ performance: 34, seo: 61, accessibility: 70, best_practices: 75 }),
      JSON.stringify([
        {
          category: "performance",
          severity: "high",
          evidence: "Lighthouse mobile performance 34/100 (fixture)",
          why_it_costs_them: "slow mobile pages lose emergency callers to faster competitors",
        },
        {
          category: "conversion",
          severity: "high",
          evidence: "no tap-to-call element found at 375px viewport (fixture)",
          why_it_costs_them: "mobile visitors cannot call in one tap",
        },
      ]),
      "Fixture audit: slow, no mobile call path.",
    ],
  );
  await emitEvent({ agent: "analyzer", leadId, type: "audit.completed", message: "fixture audit written" });
  await advanceLead(leadId, "analyzed", { agent: "analyzer" });
}

/** solution stub */
async function solution(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  await sleep(300);
  await getPool().query(
    `insert into solutions (lead_id, pitch_angle, proposed_pages, features, call_sheet_md) values ($1,$2,$3,$4,$5)`,
    [
      leadId,
      `${lead.company_name} has strong reviews that nobody can see from their slow site.`,
      JSON.stringify(["Home", "Services", "About", "Contact"]),
      JSON.stringify(["sticky tap-to-call", "reviews block", "quote form"]),
      `# Call sheet (fixture)\nOpener: mention the slow mobile site.\nDemo: {url}\n`,
    ],
  );
  await emitEvent({ agent: "solution", leadId, type: "solution.ready", message: "fixture solution written" });
  await advanceLead(leadId, "solution_ready", { agent: "solution" });
}

/** uiux stub */
async function uiux(leadId: string): Promise<void> {
  await sleep(300);
  await getPool().query(
    `insert into designs (lead_id, brand, sitemap, page_specs) values ($1,$2,$3,$4)`,
    [
      leadId,
      JSON.stringify({ palette: { brand: "180 56 13" }, fonts: { display: "Bricolage Grotesque", body: "Source Sans 3" }, tone: "direct, local" }),
      JSON.stringify(["Home", "Services", "About", "Contact"]),
      JSON.stringify([{ page: "Home", blocks: [{ block: "hero", props: {} }, { block: "reviews", props: {} }] }]),
    ],
  );
  await emitEvent({ agent: "uiux", leadId, type: "design.ready", message: "fixture design written" });
  await advanceLead(leadId, "design_ready", { agent: "uiux" });
}

/** builder stub: demo or final depending on trigger status */
async function builder(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  const kind = lead.status === "closed_won" ? "final" : "demo";
  await advanceLead(leadId, kind === "demo" ? "demo_building" : "final_building", { agent: "builder" });
  await sleep(600);
  const url = `http://localhost:4400/${lead.slug ?? leadId}${kind === "final" ? "-final" : ""}`;
  await getPool().query(
    `insert into builds (lead_id, kind, status, deploy_url) values ($1,$2,'deployed',$3)`,
    [leadId, kind, url],
  );
  await emitEvent({ agent: "builder", leadId, type: "build.deployed", message: `${kind} deployed (mock)`, payload: { url, kind } });
  await advanceLead(leadId, kind === "demo" ? "demo_qa" : "final_qa", { agent: "builder" });
}

/** qa stub: always passes in fixture mode */
async function qa(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  const kind = lead.status === "final_qa" ? "final" : "demo";
  await sleep(300);
  const b = await getPool().query<{ id: string }>(
    "select id from builds where lead_id = $1 and kind = $2 order by created_at desc limit 1",
    [leadId, kind],
  );
  if (b.rowCount) {
    await getPool().query(
      `insert into qa_reports (build_id, passed, checks) values ($1, true, $2)`,
      [b.rows[0].id, JSON.stringify({ links: true, console_errors: 0, responsive: true, lighthouse_perf: 92 })],
    );
  }
  await emitEvent({ agent: "qa", leadId, type: "qa.passed", message: `${kind} QA green (mock)` });
  if (kind === "demo") {
    await advanceLead(leadId, "outreach_ready", { agent: "qa" });
  } else {
    await advanceLead(leadId, "delivery_approval", { agent: "qa" });
    await notifyOperator({ type: "delivery_approval", title: "Final build ready for delivery approval", leadId });
  }
}

/**
 * sales stub: drives outreach_ready -> awaiting_approval -> contacted -> replied -> negotiating
 * -> closed_won, and delivery_approval -> delivered. In mock mode approvals/replies auto-fire so
 * the acceptance path completes hands-free; the review-mode gates become real in Phase 5.
 */
async function sales(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = await getLead(leadId);
  await sleep(250);

  switch (lead.status) {
    case "outreach_ready": {
      const seq = await pool.query<{ id: string }>(
        "insert into email_sequences (lead_id, current_step, state) values ($1, 1, 'active') returning id",
        [leadId],
      );
      await pool.query(
        `insert into emails (lead_id, sequence_id, direction, kind, subject, body_text, status, idempotency_key)
         values ($1,$2,'outbound','outreach',$3,$4,'awaiting_approval',$5)`,
        [
          leadId,
          seq.rows[0].id,
          `Built ${lead.company_name} a new site (2 min look?)`,
          "Fixture outreach body: one finding, demo link, booking link, unsubscribe, address.",
          `outreach:${leadId}:1`,
        ],
      );
      await emitEvent({ agent: "sales", leadId, type: "email.drafted", message: "touch 1 queued for approval (mock)" });
      await advanceLead(leadId, "awaiting_approval", { agent: "sales" });
      break;
    }
    case "awaiting_approval": {
      await pool.query(
        `update emails set status = 'sent', sent_at = now() where lead_id = $1 and kind = 'outreach' and status = 'awaiting_approval'`,
        [leadId],
      );
      await emitEvent({ agent: "sales", leadId, type: "email.sent", message: "touch 1 sent (mock auto-approve)" });
      await advanceLead(leadId, "contacted", { agent: "sales" });
      break;
    }
    case "contacted": {
      const email = await pool.query<{ id: string }>(
        "select id from emails where lead_id = $1 and kind = 'outreach' limit 1",
        [leadId],
      );
      await pool.query(
        `insert into emails (lead_id, direction, kind, subject, body_text, status, idempotency_key)
         values ($1,'inbound','outreach','Re: demo','Fixture reply: interested, tell me more.','sent',$2)`,
        [leadId, `inbound:${leadId}:1`],
      );
      if (email.rowCount) {
        await pool.query(
          `insert into replies (email_id, classification, classified_by) values ($1,'interested','mock')`,
          [email.rows[0].id],
        );
      }
      await notifyOperator({ type: "reply", title: "Interested reply (mock)", leadId });
      await emitEvent({ agent: "sales", leadId, type: "reply.classified", message: "interested (mock)" });
      await advanceLead(leadId, "replied", { agent: "sales" });
      break;
    }
    case "replied": {
      await advanceLead(leadId, "negotiating", { agent: "sales" });
      break;
    }
    case "negotiating": {
      await emitEvent({ agent: "sales", leadId, type: "deal.closed_won", message: "closed won (mock)" });
      await advanceLead(leadId, "closed_won", { agent: "sales" });
      break;
    }
    case "delivery_approval": {
      await pool.query(
        `insert into emails (lead_id, direction, kind, subject, body_text, status, idempotency_key)
         values ($1,'outbound','delivery','Your new site is live','Fixture delivery email.','sent',$2)`,
        [leadId, `delivery:${leadId}`],
      );
      await emitEvent({ agent: "sales", leadId, type: "delivery.sent", message: "delivered (mock auto-approve)" });
      await advanceLead(leadId, "delivered", { agent: "sales" });
      break;
    }
    default:
      await emitEvent({ agent: "sales", leadId, level: "warn", type: "sales.noop", message: `no action for ${lead.status}` });
  }
}

export const STUB_HANDLERS: Record<string, (leadId: string) => Promise<void>> = {
  scrape,
  qualify,
  analyzer,
  solution,
  uiux,
  builder,
  qa,
  sales,
};
