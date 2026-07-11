// Sales Agent (spec §6.9): outreach sequence, replies, booking, delivery. Touch 1 is the demo drop
// (email, the clickable artifact + paper trail). Touch 2 is the operator's phone call (a task + the
// call sheet). Touch 3 is a one-line nudge. Every send passes the gate (suppression, caps, CAN-SPAM
// footer, honest subject) and the voice lint (CLAUDE.md §3). Idempotency keys prevent double-sends.
// Review mode drafts to awaiting_approval; auto mode sends within caps. Replies + bookings arrive via
// the API/webhook endpoints, which call the handlers exported here.
import { advanceLead, emitEvent, getPool, notifyOperator } from "@autopilot/core";
import { sendEmail, emailGate, voiceLint, canSpamFooter, checkSuppression, addSuppression, loadAgencyFacts, llm, MOCK } from "@autopilot/adapters";

const mode = () => (process.env.OUTREACH_MODE === "auto" ? "auto" : "review");

function firstName(companyName: string): string | null {
  const m = companyName.match(/^([A-Z][a-z]+)'s\b/);
  return m ? m[1] : null;
}
function shortName(company: string, city?: string | null): string {
  let s = company.replace(/[,\s]+(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Co\.?|Ltd\.?|LLP)\.?$/i, "").replace(/\s*&\s+[A-Za-z].*$/, "").trim();
  if (city) s = s.replace(new RegExp(`\\s+${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "").trim();
  return s || company;
}

interface Lead { id: string; company_name: string; city: string | null; contact_email: string | null; contact_name: string | null; status: string; contact_phone: string | null }

async function getLead(id: string): Promise<Lead> {
  const r = await getPool().query<Lead>("select id, company_name, city, contact_email, contact_name, status, contact_phone from leads where id=$1", [id]);
  if (!r.rowCount) throw new Error(`lead ${id} missing`);
  return r.rows[0];
}

/** The one real observation to open with. Preference order matters (2026-07-11 fix): the
 *  solution's pitch_angle is written in plain customer language ("a homepage that loads in 14
 *  seconds is sending leaking-roof callers back to Google"); the audit summary is the plain-voice
 *  fallback. Raw finding evidence is NEVER used — it reads as Lighthouse jargon ("LCP at
 *  14.16 seconds") that means nothing to an owner. */
async function observation(leadId: string, company: string): Promise<string> {
  const s = await getPool().query<{ pitch_angle: string | null }>(
    "select pitch_angle from solutions where lead_id=$1 order by created_at desc limit 1", [leadId]);
  const pitch = s.rows[0]?.pitch_angle?.trim();
  if (pitch) return pitch;
  const a = await getPool().query<{ summary: string | null }>(
    "select summary from audits where lead_id=$1 order by created_at desc limit 1", [leadId]);
  const summary = a.rows[0]?.summary?.trim();
  if (summary) return summary;
  return `Your Google presence is stronger than the site behind it.`;
}

async function demoUrl(leadId: string): Promise<string | null> {
  const r = await getPool().query<{ deploy_url: string }>(
    "select deploy_url from builds where lead_id=$1 and kind='demo' and deploy_url like 'https://%' order by created_at desc limit 1", [leadId]);
  return r.rows[0]?.deploy_url ?? null;
}

/** Build the Touch-1 demo-drop email. Deterministic shape (guaranteed §3-clean), real observation,
 *  real demo link, CAN-SPAM footer. Under ~90 words, one link, a single binary close. */
async function buildTouch1(lead: Lead): Promise<{ subject: string; body: string } | { blocked: string }> {
  // No recipient = nothing to send. Check BEFORE drafting: a draft with no destination reaches the
  // Outbox, gets approved, and only then fails the gate — the operator approves into a dead end
  // (exactly what happened with the two 2026-07-10 orphans; see PROGRESS.md).
  if (!lead.contact_email) return { blocked: "no contact email on file" };
  const footer = canSpamFooter();
  if (!footer) return { blocked: "agency name/address unconfirmed (CAN-SPAM footer)" };
  const link = await demoUrl(lead.id);
  if (!link) return { blocked: "no live demo deployed yet" };
  const short = shortName(lead.company_name, lead.city);
  const who = firstName(lead.company_name) ?? lead.contact_name?.split(/\s+/)[0];
  const sender = loadAgencyFacts().identity.operator_first_name;
  const subject = `Built ${short} a new site (2 min look?)`;
  const body = [
    who ? `Hey ${who},` : `Hey ${short} team,`,
    ``,
    await observation(lead.id, lead.company_name),
    ``,
    `So I built you one. It's already live: ${link}`,
    ``,
    `Fast on phones, your number one tap away, your real reviews front and center.`,
    ``,
    `Want me to put it on your domain this week?`,
    ``,
    sender,
    footer,
  ].join("\n");
  return { subject, body };
}

/** outreach_ready -> draft Touch 1 -> awaiting_approval (review) or send -> contacted (auto). */
export async function sales(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = await getLead(leadId);

  if (lead.status === "outreach_ready") {
    const built = await buildTouch1(lead);
    if ("blocked" in built) {
      // Once per 12h per lead (cap_hit precedent): outreach_ready re-triggers every few minutes,
      // and a non-transient block (e.g. no contact email) would otherwise bury the bell and the
      // activity feed under identical warnings.
      const already = await pool.query<{ n: string }>(
        "select count(*)::text n from notifications where type='outreach_blocked' and lead_id=$1 and created_at > now() - interval '12 hours'",
        [leadId],
      );
      if (already.rows[0].n === "0") {
        await emitEvent({ agent: "sales", leadId, level: "warn", type: "outreach.blocked", message: built.blocked });
        // No email but a live demo + phone = a phone-first lead, not a dead one (contract §6: the
        // call is the primary channel; the demo is the reason for the call). Say that.
        const phoneFirst = built.blocked === "no contact email on file" && lead.contact_phone && (await demoUrl(leadId));
        await notifyOperator({
          type: "outreach_blocked",
          title: phoneFirst
            ? `Call ${lead.company_name} (${lead.contact_phone}): demo is live, no email found`
            : `${lead.company_name}: outreach blocked (${built.blocked})`,
          body: phoneFirst
            ? "No email address exists for this lead, so the demo drop can't go by email. The demo is deployed: open the lead page for the call sheet and lead with the call."
            : undefined,
          leadId,
        });
      }
      return; // hold at outreach_ready
    }
    const problems = voiceLint(`${built.subject}\n${built.body}`);
    if (problems.length) { // deterministic template should never trip this; guard anyway
      await emitEvent({ agent: "sales", leadId, level: "warn", type: "voice.failed", message: problems.join("; ") });
      return;
    }
    const seq = await pool.query<{ id: string }>(
      "insert into email_sequences (lead_id, current_step, state) values ($1,1,'active') on conflict do nothing returning id", [leadId]);
    const seqId = seq.rows[0]?.id ?? (await pool.query<{ id: string }>("select id from email_sequences where lead_id=$1 order by created_at desc limit 1", [leadId])).rows[0]?.id;
    const idem = `outreach:${leadId}:1`;
    await pool.query(
      `insert into emails (lead_id, sequence_id, direction, kind, subject, body_text, status, idempotency_key)
       values ($1,$2,'outbound','outreach',$3,$4,'awaiting_approval',$5) on conflict (idempotency_key) do nothing`,
      [leadId, seqId, built.subject, built.body, idem]);
    await emitEvent({ agent: "sales", leadId, type: "email.drafted", message: "touch 1 drafted (voice clean)" });

    if (mode() === "auto") { await approveAndSend(idem); return; }
    await notifyOperator({ type: "approval", title: `Approve outreach to ${lead.company_name}`, leadId });
    await advanceLead(leadId, "awaiting_approval", { agent: "sales" });
    return;
  }

  if (lead.status === "delivery_approval" && mode() === "auto") { await deliverFinal(leadId); return; }
  // Other statuses (awaiting_approval in review, contacted, replied, ...) wait for operator/reply/booking.
  await emitEvent({ agent: "sales", leadId, level: "debug", type: "sales.waiting", message: `no auto action for ${lead.status}` });
}

/** Approve + send a drafted email (operator action in review mode, or auto). Gate-checked, idempotent. */
export async function approveAndSend(idemOrEmailId: string): Promise<{ ok: boolean; reason?: string }> {
  const pool = getPool();
  const em = await pool.query<{ id: string; lead_id: string; subject: string; body_text: string; status: string; idempotency_key: string }>(
    "select id, lead_id, subject, body_text, status, idempotency_key from emails where idempotency_key=$1 or id::text=$1 limit 1", [idemOrEmailId]);
  if (!em.rowCount) return { ok: false, reason: "email not found" };
  const e = em.rows[0];
  if (e.status === "sent") return { ok: true }; // idempotent: already sent, never double-send
  const lead = await getLead(e.lead_id);

  const gate = await emailGate({ toEmail: lead.contact_email, subject: e.subject, bodyText: e.body_text });
  if (!gate.ok) {
    await pool.query("update emails set status='failed' where id=$1", [e.id]);
    await emitEvent({ agent: "sales", leadId: e.lead_id, level: "warn", type: "email.gated", message: gate.reason ?? "gate failed" });
    return { ok: false, reason: gate.reason };
  }
  const sent = await sendEmail({ toEmail: lead.contact_email!, subject: e.subject, bodyText: e.body_text, idempotencyKey: e.idempotency_key });
  await pool.query("update emails set status='sent', sent_at=now(), provider_message_id=$2 where id=$1", [e.id, sent.providerMessageId]);
  // schedule Touch 2 (the operator call) for the next business touch
  await pool.query("update email_sequences set current_step=1, next_send_at=now()+interval '1 day' where lead_id=$1", [e.lead_id]);
  await emitEvent({ agent: "sales", leadId: e.lead_id, type: "email.sent", message: `touch 1 sent${MOCK() ? " (mock /tmp/outbox)" : ""}` });
  if (lead.status === "awaiting_approval" || lead.status === "outreach_ready") await advanceLead(e.lead_id, "contacted", { agent: "sales" });
  await notifyOperator({ type: "call_due", title: `Call ${lead.company_name} (Touch 2) — sheet on the lead page`, leadId: e.lead_id });
  return { ok: true };
}

export async function rejectDraft(emailId: string): Promise<void> {
  await getPool().query("update emails set status='failed' where id=$1 and status='awaiting_approval'", [emailId]);
}

/** Classify + handle an inbound reply (spec §6.9). Sequence halts on any reply; suppress on opt-out. */
export async function ingestReply(leadId: string, text: string, forcedClass?: string): Promise<void> {
  const pool = getPool();
  const lead = await getLead(leadId);
  const outreach = await pool.query<{ id: string }>("select id from emails where lead_id=$1 and direction='outbound' order by created_at desc limit 1", [leadId]);
  const inbound = await pool.query<{ id: string }>(
    `insert into emails (lead_id, direction, kind, subject, body_text, status, idempotency_key)
     values ($1,'inbound','outreach',$2,$3,'sent',$4) returning id`,
    [leadId, `Re: their demo`, text, `inbound:${leadId}:${Date.now() % 100000}`]);

  const classification = forcedClass ?? (await classifyReply(text, leadId));
  await pool.query("insert into replies (email_id, classification, classified_by, raw) values ($1,$2,$3,$4)",
    [inbound.rows[0].id, classification, MOCK() ? "mock" : "haiku", JSON.stringify({ text })]);
  await pool.query("update email_sequences set state='replied' where lead_id=$1", [leadId]); // halt sequence

  if (classification === "unsubscribe" || classification === "not_interested") {
    await addSuppression(lead.contact_email, null, classification, "reply");
    await emitEvent({ agent: "sales", leadId, type: "reply.classified", message: `${classification} -> suppressed + halted` });
    if (lead.status !== "closed_lost" && lead.status !== "nurture") {
      await advanceLead(leadId, classification === "unsubscribe" ? "nurture" : "nurture", { agent: "sales" }).catch(() => undefined);
    }
    return;
  }
  // interested / question / other: notify the operator; draft a suggested reply (never auto-sent)
  await emitEvent({ agent: "sales", leadId, type: "reply.classified", message: `${classification} -> operator notified` });
  await notifyOperator({ type: "reply", title: `${lead.company_name} replied: ${classification}`, leadId });
  if ((classification === "interested" || classification === "question") && (lead.status === "contacted" || lead.status === "awaiting_approval")) {
    await advanceLead(leadId, "replied", { agent: "sales" }).catch(() => undefined);
  }
}

async function classifyReply(text: string, leadId: string): Promise<string> {
  const raw = await llm({
    tier: "haiku", agent: "sales", leadId, maxTokens: 20,
    system: "Classify the email reply into exactly one token: interested, question, not_interested, unsubscribe, auto_reply, other. Output only the token.",
    prompt: text,
    mockResponse: "interested",
  });
  const t = raw.toLowerCase().match(/interested|question|not_interested|unsubscribe|auto_reply|other/)?.[0];
  return t ?? "other";
}

/** Cal.com booking -> meeting + meeting_booked + confirmation (spec §6.9). Called by the webhook/dev. */
export async function ingestBooking(leadId: string, opts: { title?: string; startTime?: string; attendee?: any } = {}): Promise<void> {
  const pool = getPool();
  const lead = await getLead(leadId);
  await pool.query(
    `insert into meetings (lead_id, title, start_time, status, attendee) values ($1,$2,$3,'scheduled',$4)`,
    [leadId, opts.title ?? "Intro call", opts.startTime ?? null, JSON.stringify(opts.attendee ?? {})]);
  await pool.query("update email_sequences set state='completed' where lead_id=$1", [leadId]);
  await emitEvent({ agent: "sales", leadId, type: "meeting.booked", message: "booking received" });
  await notifyOperator({ type: "meeting_booked", title: `${lead.company_name} booked a call`, leadId });
  // meeting_booked is reachable only from contacted/replied/nurture (state machine §5).
  if (lead.status === "contacted" || lead.status === "replied" || lead.status === "nurture") {
    await advanceLead(leadId, "meeting_booked", { agent: "sales" }).catch(() => undefined);
  }
}

/** delivery_approval -> send delivery email -> delivered. */
export async function deliverFinal(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = await getLead(leadId);
  const link = await demoUrl(leadId);
  const footer = canSpamFooter() ?? "";
  const body = [`Hey ${firstName(lead.company_name) ?? "there"},`, ``, `Your new site is live and pointed at your domain: ${link ?? "[link]"}`, ``, `I'll keep it fast and updated. Reply here any time.`, ``, loadAgencyFacts().identity.operator_first_name, footer].join("\n");
  const idem = `delivery:${leadId}`;
  await pool.query(
    `insert into emails (lead_id, direction, kind, subject, body_text, status, idempotency_key)
     values ($1,'outbound','delivery',$2,$3,'awaiting_approval',$4) on conflict (idempotency_key) do nothing`,
    [leadId, "Your new site is live", body, idem]);
  if (lead.contact_email) {
    const gate = await emailGate({ toEmail: lead.contact_email, subject: "Your new site is live", bodyText: body });
    if (gate.ok) {
      const sent = await sendEmail({ toEmail: lead.contact_email, subject: "Your new site is live", bodyText: body, idempotencyKey: idem });
      await pool.query("update emails set status='sent', sent_at=now(), provider_message_id=$2 where idempotency_key=$1", [idem, sent.providerMessageId]);
    }
  }
  await emitEvent({ agent: "sales", leadId, type: "delivery.sent", message: "delivery email sent" });
  await advanceLead(leadId, "delivered", { agent: "sales" });
}
