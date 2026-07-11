// Email adapter + the CAN-SPAM/suppression/caps gate (spec §4.2, §6.9, CLAUDE.md §0.3, §6). MOCK
// writes .eml files to /tmp/outbox and shows them in the dashboard as if sent (spec §11); REAL sends
// via Resend. Nothing sends unless the gate passes: recipient not suppressed, mode permits it, caps
// not exceeded, unsubscribe line + physical address in the footer, honest subject. The voice lint
// (CLAUDE.md §3) is enforced on every human-facing draft before it can be approved or sent.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { getPool } from "@autopilot/core";
import { MOCK, loadCaps, loadAgencyFacts, isUnconfirmed } from "./config.js";

const OUTBOX_DIR = "/tmp/outbox";

// Voice guards (CLAUDE.md §3), ported from the legacy drafter.
const BANNED = [
  "i hope this email finds you well", "i wanted to reach out", "circle back", "touch base",
  "just following up", "synergy", "game-changer", "in today's digital landscape", "leverage",
  "cutting-edge", "elevate", "seamless", "unlock", "reach out",
];

export function voiceLint(text: string): string[] {
  const problems: string[] = [];
  if (/[—–]/.test(text)) problems.push("contains an em/en dash (§3)");
  const lower = text.toLowerCase();
  for (const p of BANNED) if (lower.includes(p)) problems.push(`banned phrase: "${p}"`);
  return problems;
}

/** The CAN-SPAM footer: agency name + real physical address + a working unsubscribe line. */
export function canSpamFooter(): string | null {
  const a = loadAgencyFacts().identity;
  if (isUnconfirmed(a.name) || isUnconfirmed(a.address)) return null; // never a fake address
  return ["", a.name, a.address, `Not interested? Reply "unsubscribe" and I will not email you again.`].join("\n");
}

export interface Suppression { suppressed: boolean; reason?: string }
export async function checkSuppression(email: string | null, domain?: string | null): Promise<Suppression> {
  if (!email) return { suppressed: false };
  const dom = domain ?? email.split("@")[1] ?? null;
  const r = await getPool().query<{ reason: string }>(
    "select reason from suppression_list where lower(email)=lower($1) or (domain is not null and lower(domain)=lower($2)) limit 1",
    [email, dom],
  );
  return r.rowCount ? { suppressed: true, reason: r.rows[0].reason } : { suppressed: false };
}

export async function addSuppression(email: string | null, domain: string | null, reason: string, source: string): Promise<void> {
  if (!email && !domain) return;
  // suppress BOTH the address and its domain (spec §4.3: unsubscribe is sacred).
  const dom = domain ?? (email ? email.split("@")[1] : null);
  await getPool().query(
    `insert into suppression_list (email, domain, reason, source) values ($1,$2,$3,$4)
     on conflict do nothing`,
    [email, dom, reason, source],
  );
}

/** Sends already made today, for the daily cap (spec §4.5). Single-mailbox for now (from_email). */
export async function sendsToday(): Promise<number> {
  const r = await getPool().query<{ n: string }>(
    "select count(*)::text n from emails where direction='outbound' and status='sent' and sent_at >= date_trunc('day', now())",
  );
  return parseInt(r.rows[0].n, 10);
}

export interface GateInput { toEmail: string | null; subject: string; bodyText: string }
export interface GateResult { ok: boolean; reason?: string }

/** The email gate (spec §4.2). ALL must hold or nothing sends. */
export async function emailGate({ toEmail, subject, bodyText }: GateInput): Promise<GateResult> {
  if (!toEmail) return { ok: false, reason: "no recipient email" };
  const sup = await checkSuppression(toEmail);
  if (sup.suppressed) return { ok: false, reason: `suppressed (${sup.reason})` };
  if (!subject.trim() || /re:|fwd:/i.test(subject.slice(0, 4))) return { ok: false, reason: "subject not honest/present" };
  if (!bodyText.includes("unsubscribe")) return { ok: false, reason: "missing unsubscribe line" };
  const footer = canSpamFooter();
  if (!footer || !bodyText.includes(loadAgencyFacts().identity.address)) return { ok: false, reason: "missing physical address footer" };
  const caps = loadCaps();
  if ((await sendsToday()) >= caps.total_daily_sends) return { ok: false, reason: "daily send cap reached" };
  return { ok: true };
}

export interface SendInput { toEmail: string; subject: string; bodyText: string; bodyHtml?: string; idempotencyKey: string }
export interface SendResult { providerMessageId: string }

/** Actually send (MOCK writes .eml to /tmp/outbox; REAL via Resend). Assumes the gate already passed. */
export async function sendEmail(input: SendInput): Promise<SendResult> {
  const from = loadAgencyFacts().identity.from_email;
  if (MOCK()) {
    mkdirSync(OUTBOX_DIR, { recursive: true });
    const eml = [`From: ${from}`, `To: ${input.toEmail}`, `Subject: ${input.subject}`, `X-Idempotency-Key: ${input.idempotencyKey}`, "", input.bodyText].join("\n");
    writeFileSync(resolve(OUTBOX_DIR, `${input.idempotencyKey.replace(/[^a-z0-9]+/gi, "_")}.eml`), eml);
    return { providerMessageId: `mock-${input.idempotencyKey}` };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  // BCC every send back to the sender's own mailbox (operator ask, 2026-07-11): Resend sends via
  // its own infrastructure, so nothing appears in the Gmail Sent folder — the BCC copy is how the
  // operator keeps a searchable record (and reply context) in the inbox they actually live in.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from, to: input.toEmail, bcc: from, subject: input.subject, text: input.bodyText, ...(input.bodyHtml ? { html: input.bodyHtml } : {}) }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = (await res.json()) as { id?: string };
  return { providerMessageId: d.id ?? `resend-${input.idempotencyKey}` };
}
