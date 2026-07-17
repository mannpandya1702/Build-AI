import { describe, expect, it } from "vitest";
import {
  type OppGateContext,
  type OpportunityRow,
  planOpportunityDispatch,
} from "../src/planOpportunityDispatch.js";

// tiny row builder so each test reads as intent, not boilerplate
let seq = 0;
function row(p: Partial<OpportunityRow> & Pick<OpportunityRow, "status">): OpportunityRow {
  seq += 1;
  return {
    id: p.id ?? `opp-${seq}`,
    lead_id: p.lead_id ?? `lead-${seq}`,
    service_type: p.service_type ?? "website",
    status: p.status,
    approved: p.approved ?? false,
    score: p.score ?? null,
    websiteUnlocked: p.websiteUnlocked ?? false,
  };
}

const REVIEW: OppGateContext = { mode: "review", budgetRemainingUsd: 30, estCostUsd: 6 };

describe("planOpportunityDispatch", () => {
  it("routes enqueue-able statuses to the right service queue", () => {
    const plan = planOpportunityDispatch(
      [
        row({ status: "identified", service_type: "website" }),
        row({ status: "building", service_type: "chatbot" }),
        row({ status: "closed_won", service_type: "voice_agent" }),
        row({ status: "demo_ready", service_type: "ai_automation" }),
      ],
      REVIEW,
    );
    const queues = plan.enqueue.map((e) => e.queue).sort();
    expect(queues).toEqual(
      ["agent:solution", "agent:chatbot-build", "agent:voice-provision", "agent:opportunity-outreach"].sort(),
    );
  });

  it("parks proposed solutions at the gate (no spend, free hop)", () => {
    const plan = planOpportunityDispatch([row({ status: "proposed" })], REVIEW);
    expect(plan.parkAtGate).toHaveLength(1);
    expect(plan.admitToBuild).toHaveLength(0);
    expect(plan.enqueue).toHaveLength(0);
  });

  it("review mode: admits an approved opportunity, leaves an unapproved one waiting", () => {
    const plan = planOpportunityDispatch(
      [
        row({ status: "awaiting_build_approval", approved: true, id: "yes" }),
        row({ status: "awaiting_build_approval", approved: false, id: "no" }),
      ],
      REVIEW,
    );
    expect(plan.admitToBuild.map((a) => a.oppId)).toEqual(["yes"]);
    expect(plan.waiting.map((w) => w.oppId)).toContain("no");
  });

  it("auto mode: admits within budget with no per-opportunity approval", () => {
    const plan = planOpportunityDispatch([row({ status: "awaiting_build_approval", approved: false })], {
      mode: "auto",
      budgetRemainingUsd: 30,
      estCostUsd: 6,
    });
    expect(plan.admitToBuild).toHaveLength(1);
  });

  it("budget is a hard ceiling: admits best scores first, rest wait", () => {
    // budget = 12 USD, est 6 each → only 2 slots. Five approved candidates, distinct scores.
    const plan = planOpportunityDispatch(
      [
        row({ status: "awaiting_build_approval", approved: true, id: "s40", score: 40 }),
        row({ status: "awaiting_build_approval", approved: true, id: "s90", score: 90 }),
        row({ status: "awaiting_build_approval", approved: true, id: "s70", score: 70 }),
        row({ status: "awaiting_build_approval", approved: true, id: "s10", score: 10 }),
        row({ status: "awaiting_build_approval", approved: true, id: "s60", score: 60 }),
      ],
      { mode: "review", budgetRemainingUsd: 12, estCostUsd: 6 },
    );
    expect(plan.admitToBuild.map((a) => a.oppId)).toEqual(["s90", "s70"]); // top 2 by score
    expect(plan.admitToBuild).toHaveLength(2);
    // the other three are held waiting on budget, not admitted
    expect(plan.waiting.map((w) => w.oppId).sort()).toEqual(["s10", "s40", "s60"]);
  });

  it("zero budget admits nothing even with approvals", () => {
    const plan = planOpportunityDispatch([row({ status: "awaiting_build_approval", approved: true })], {
      mode: "review",
      budgetRemainingUsd: 0,
      estCostUsd: 6,
    });
    expect(plan.admitToBuild).toHaveLength(0);
    expect(plan.waiting[0].reason).toMatch(/budget/i);
  });

  it("await_prospect / operate / terminal statuses are inert (waiting)", () => {
    const plan = planOpportunityDispatch(
      [
        row({ status: "in_outreach" }),
        row({ status: "negotiating" }),
        row({ status: "live" }),
        row({ status: "paused" }),
        row({ status: "churned" }),
        row({ status: "closed_lost" }),
      ],
      REVIEW,
    );
    expect(plan.enqueue).toHaveLength(0);
    expect(plan.admitToBuild).toHaveLength(0);
    expect(plan.parkAtGate).toHaveLength(0);
    expect(plan.waiting).toHaveLength(6);
  });

  it("a mixed batch splits cleanly across the four buckets", () => {
    const plan = planOpportunityDispatch(
      [
        row({ status: "identified" }), // enqueue
        row({ status: "proposed" }), // park
        row({ status: "awaiting_build_approval", approved: true }), // admit
        row({ status: "live" }), // waiting
      ],
      REVIEW,
    );
    expect(plan.enqueue).toHaveLength(1);
    expect(plan.parkAtGate).toHaveLength(1);
    expect(plan.admitToBuild).toHaveLength(1);
    expect(plan.waiting).toHaveLength(1);
  });

  it("expansion-hold: a non-website identified opp is HELD until the website closes", () => {
    const locked = planOpportunityDispatch(
      [row({ status: "identified", service_type: "chatbot", websiteUnlocked: false })],
      REVIEW,
    );
    expect(locked.held).toHaveLength(1);
    expect(locked.enqueue).toHaveLength(0);

    const unlocked = planOpportunityDispatch(
      [row({ status: "identified", service_type: "chatbot", websiteUnlocked: true })],
      REVIEW,
    );
    expect(unlocked.held).toHaveLength(0);
    expect(unlocked.enqueue).toMatchObject([{ queue: "agent:chatbot-plan" }]);
  });

  it("expansion-hold: a WEBSITE identified opp is never held (it's the cold pitch)", () => {
    const plan = planOpportunityDispatch(
      [row({ status: "identified", service_type: "website", websiteUnlocked: false })],
      REVIEW,
    );
    expect(plan.held).toHaveLength(0);
    expect(plan.enqueue).toMatchObject([{ queue: "agent:solution" }]);
  });

  it("expansion-hold: once past identified, an unlocked expansion opp flows through the gate", () => {
    // a chatbot opp that has been proposed (already unlocked + advanced) parks at the gate normally
    const plan = planOpportunityDispatch(
      [row({ status: "proposed", service_type: "chatbot", websiteUnlocked: true })],
      REVIEW,
    );
    expect(plan.held).toHaveLength(0);
    expect(plan.parkAtGate).toHaveLength(1);
  });
});
