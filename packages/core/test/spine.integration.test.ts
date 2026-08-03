// Opportunity spine — INTEGRATION test against a real Postgres. Skipped by default (MOCK-first CI
// runs with zero external calls); opt in with RUN_DB_IT=1 and a DATABASE_URL pointing at a scratch DB
// that has the migrations applied:
//
//   createdb autopilot_verify
//   DATABASE_URL=postgres://…/autopilot_verify pnpm --filter @autopilot/core migrate
//   RUN_DB_IT=1 DATABASE_URL=postgres://…/autopilot_verify pnpm --filter @autopilot/core test
//
// It proves the wiring end to end on real SQL: creation (ensureServiceOpportunities), the projection,
// the sell-after-close hold (planOpportunityDispatch driven by real lead_status), idempotency, and
// the transactional advanceOpportunity (legal transition applied, illegal one rejected).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type LeadStatus,
  type OpportunityRow,
  type OpportunityStatus,
  type ServiceType,
  advanceOpportunity,
  closePool,
  ensureServiceOpportunities,
  getPool,
  isWebsiteUnlockedForLead,
  planOpportunityDispatch,
} from "../src/index.js";

const RUN = process.env.RUN_DB_IT === "1";
const suite = RUN ? describe : describe.skip;

const SIGNALS = {
  hasWebsite: false,
  siteIsWeak: false,
  reviewCount: 120,
  isPhoneDriven: true,
  hasOnlineBooking: false,
  hasChat: false,
};

suite("opportunity spine — integration (Postgres; RUN_DB_IT=1 + DATABASE_URL)", () => {
  let leadId: string;

  beforeAll(async () => {
    const r = await getPool().query<{ id: string }>(
      `insert into leads (company_name, industry, city, region, website_url, review_count, rating, contact_phone, source, status)
       values ('Spine IT Roofing','roofing','Austin','TX',null,120,4.8,'+15125550100','places','qualified')
       returning id`,
    );
    leadId = r.rows[0].id;
  });

  afterAll(async () => {
    await getPool()
      .query("delete from opportunities where lead_id=$1", [leadId])
      .catch(() => undefined);
    await getPool()
      .query("delete from leads where id=$1", [leadId])
      .catch(() => undefined);
    await closePool();
  });

  async function oppMap(): Promise<Record<string, string>> {
    const r = await getPool().query<{ service_type: string; status: string }>(
      "select service_type, status from opportunities where lead_id=$1",
      [leadId],
    );
    return Object.fromEntries(r.rows.map((x) => [x.service_type, x.status]));
  }

  async function planNow() {
    const pool = getPool();
    const lead = await pool.query<{ status: LeadStatus }>("select status from leads where id=$1", [leadId]);
    const unlocked = isWebsiteUnlockedForLead(lead.rows[0].status);
    const rows = await pool.query<{
      id: string;
      lead_id: string;
      service_type: ServiceType;
      status: OpportunityStatus;
      score: number | null;
    }>(
      "select id, lead_id, service_type, status, score from opportunities where lead_id=$1 and service_type<>'website'",
      [leadId],
    );
    const opRows: OpportunityRow[] = rows.rows.map((r) => ({
      ...r,
      approved: false,
      websiteUnlocked: unlocked,
    }));
    return planOpportunityDispatch(opRows, { mode: "review", budgetRemainingUsd: 30, estCostUsd: 6 });
  }

  it("creates the website line + expansion lines for a qualified, high-review, phone-driven lead", async () => {
    const res = await ensureServiceOpportunities(leadId, SIGNALS, {
      leadStatus: "qualified",
      score: 75,
      agent: "it",
    });
    expect(res.websiteStatus).toBe("proposed"); // projected from lead_status 'qualified'
    const m = await oppMap();
    expect(m.website).toBe("proposed");
    expect(m.chatbot).toBe("identified");
    expect(m.ai_automation).toBe("identified");
    expect(m.voice_agent).toBe("identified");
  });

  it("is idempotent — a second create adds no new expansion lines", async () => {
    const res = await ensureServiceOpportunities(leadId, SIGNALS, {
      leadStatus: "qualified",
      score: 75,
      agent: "it",
    });
    expect(res.created).toEqual([]);
  });

  it("holds expansion while the website isn't won, then unlocks at closed_won", async () => {
    const held = await planNow();
    expect(held.held.length).toBe(3); // chatbot / voice / automation, all held
    expect(held.enqueue.length).toBe(0);

    await getPool().query("update leads set status='closed_won' where id=$1", [leadId]);
    const unlocked = await planNow();
    expect(unlocked.held.length).toBe(0);
    expect(unlocked.enqueue.length).toBe(3); // now each enqueues its propose step
  });

  it("advanceOpportunity applies a legal transition and rejects an illegal one", async () => {
    const opp = await getPool().query<{ id: string }>(
      "select id from opportunities where lead_id=$1 and service_type='chatbot'",
      [leadId],
    );
    const oppId = opp.rows[0].id;
    const moved = await advanceOpportunity(oppId, "proposed", { agent: "it" });
    expect(moved.to).toBe("proposed");
    const after = await getPool().query<{ status: string }>("select status from opportunities where id=$1", [
      oppId,
    ]);
    expect(after.rows[0].status).toBe("proposed");
    await expect(advanceOpportunity(oppId, "live", { agent: "it" })).rejects.toThrow();
  });
});
