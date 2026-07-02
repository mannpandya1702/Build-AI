// src/outreach/draft.ts — Module 4: draft touch-1 email + call script in the founder's voice.
// Run: `npm run draft <place_id>`
//
// Draft only. Nothing sends. Obeys CLAUDE.md §3 (voice), §6 (sequence), §7 (objections). If any
// business-identity field is still [NEEDS: ...], it REFUSES to finalize the email and names the
// missing field, because a CAN-SPAM footer with a fake address is not allowed (CLAUDE.md §0.3).

import "../env";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  STUDIO_NAME,
  STUDIO_ADDRESS,
  STUDIO_US_PHONE,
  FROM_EMAIL,
  isPlaceholder,
} from "../../config";

// The human who signs the email and opens the call: derived from FROM_EMAIL ("mann@..." -> "Mann").
function senderName(): string {
  if (!isPlaceholder(FROM_EMAIL) && FROM_EMAIL.includes("@")) {
    const local = FROM_EMAIL.split("@")[0].split(/[._+-]/)[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return isPlaceholder(STUDIO_NAME) ? "[your name]" : STUDIO_NAME.split(" ")[0];
}
import { getLead, upsertLead, type Lead } from "../crm/leads";

// Voice guards (CLAUDE.md §3). Used to self-check generated copy before writing it.
const BANNED = [
  "i hope this email finds you well",
  "i wanted to reach out",
  "circle back",
  "touch base",
  "just following up",
  "synergy",
  "game-changer",
  "in today's digital landscape",
  "leverage",
  "cutting-edge",
  "elevate",
  "seamless",
  "unlock",
  "reach out",
];

// Owner's first name: prefer the CRM's owner_name (found via directories/FB), else parse
// possessive business names ("Joe's Roofing" -> "Joe"). Null when unknown.
function ownerFirstName(lead: Lead): string | null {
  if (lead.owner_name) return lead.owner_name.trim().split(/\s+/)[0];
  const m = lead.business_name.match(/^([A-Z][a-z]+)'s\b/);
  return m ? m[1] : null;
}

// Conversational business name: "Myriad Roofing & Construction LLC" -> "Myriad Roofing".
// Strips legal suffixes, "& ..." tails, and a trailing city token. How a human says the name.
function shortBusinessName(business: string, city?: string): string {
  let s = business
    .replace(/[,\s]+(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Co\.?|Ltd\.?|LLP)\.?$/i, "")
    .replace(/\s*&\s+[A-Za-z].*$/, "")
    .trim();
  if (city) {
    const re = new RegExp(`\\s+${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    s = s.replace(re, "").trim();
  }
  return s || business;
}

// Greeting line: a real first name beats everything; otherwise address the crew like a human would.
function greeting(lead: Lead): string {
  const first = ownerFirstName(lead);
  return first ? `Hey ${first},` : `Hey ${shortBusinessName(lead.business_name, lead.city)} team,`;
}

function realObservation(lead: Lead): string {
  const reviews = lead.review_count ?? 0;
  if (!lead.has_website && reviews >= 20) {
    // Anchored on the Google listing: verifiably true even if a site exists somewhere unlinked.
    return `Your Google listing has ${reviews} five-star-level reviews and no website on it, so the people who find you there hit a dead end.`;
  }
  if (lead.has_website && (lead.site_quality_score ?? 100) < 60) {
    return `Your site is not loading great on phones and your number is buried, which is where most of your customers are.`;
  }
  if (reviews >= 20) {
    return `You have ${reviews} Google reviews, and the site does not do them justice.`;
  }
  return `Your competitors are showing up ahead of you on phones, where your customers are searching.`;
}

function canSpamFooter(): string {
  return [
    "",
    `${STUDIO_NAME}`,
    `${STUDIO_ADDRESS}`,
    `Not interested? Reply "unsubscribe" and I will not email you again.`,
  ].join("\n");
}

function buildEmail(lead: Lead): { subject: string; body: string } {
  const short = shortBusinessName(lead.business_name, lead.city);
  const link = lead.demo_url ?? "[NEEDS: demo_url] deploy the demo first, then paste the live link here";
  const subject = `Built ${short} a new site (2 min look?)`;
  const body = [
    greeting(lead),
    ``,
    realObservation(lead),
    `So I built you a version. Here it is: ${link}`,
    `It loads fast on phones and puts your number one tap away, so the people finding you at midnight actually call you instead of the next guy.`,
    `If you like it, I can have it live on your domain this week. Want me to?`,
    ``,
    senderName(),
    canSpamFooter(),
  ]
    .filter((l) => l !== undefined)
    .join("\n");
  return { subject, body };
}

function buildCallScript(lead: Lead): string {
  const short = shortBusinessName(lead.business_name, lead.city);
  const owner = ownerFirstName(lead);
  const reviews = lead.review_count ?? 0;
  const phoneLine = isPlaceholder(STUDIO_US_PHONE)
    ? "[NEEDS: STUDIO_US_PHONE] call from your US number, never the +91 number"
    : `Call from ${STUDIO_US_PHONE} (US number, never the +91 number).`;
  return [
    `CALL SCRIPT — ${lead.business_name}`,
    phoneLine,
    ``,
    `Opener:`,
    `"Hey ${owner ?? "there"}, it's ${senderName()} from ${isPlaceholder(STUDIO_NAME) ? "[studio]" : STUDIO_NAME}. I built ${short} a new website and emailed you the link. Did you get a chance to click it?"`,
    ``,
    `If not opened: walk them to it live on the call.`,
    reviews >= 40 ? `Hook: "${reviews} five-star reviews and your site doesn't show a single one. The new one puts them front and center."` : `Hook: lead with their gap (buried number / not mobile-friendly).`,
    ``,
    `Objections (CLAUDE.md §7):`,
    `- "How much?" -> "Setup's [X], then $99 to $149/mo for hosting and updates so you never touch it. You pay nothing until it's live and you're happy."`,
    `- "I already have a website." -> "I saw it. It's not loading great on phones and your number's buried. The one I built fixes both. Worth a 2-minute look?"`,
    `- "Where are you based?" -> "India. Here's the live demo and a few other local businesses I've built for. The work speaks for itself, click it."`,
    `- "I need to think about it." -> "Totally fair. It's already built and live, no rush, no cost to sit on it. Want me to leave the link up so you can show your partner?"`,
    `- "Not interested." -> one graceful line, leave the demo link, move to nurture. Never argue.`,
    ``,
    `Close: ask for the next step. Point it at their domain this week.`,
  ].join("\n");
}

function assertVoice(text: string): string[] {
  const problems: string[] = [];
  if (/[—–]/.test(text)) problems.push("contains an em/en dash (banned by §3)");
  const lower = text.toLowerCase();
  for (const phrase of BANNED) if (lower.includes(phrase)) problems.push(`contains banned phrase: "${phrase}"`);
  return problems;
}

async function main(): Promise<void> {
  const placeId = process.argv[2];
  if (!placeId) {
    console.error("Usage: npm run draft <place_id>");
    process.exit(1);
  }
  const lead = getLead(placeId);
  if (!lead) throw new Error(`No lead for place_id ${placeId}. Run \`npm run find\` first.`);

  // Identity gate for the email (CAN-SPAM). Names the missing fields; refuses to finalize.
  const missingForEmail = [
    ["STUDIO_NAME", STUDIO_NAME],
    ["STUDIO_ADDRESS", STUDIO_ADDRESS],
    ["FROM_EMAIL", FROM_EMAIL],
  ].filter(([, v]) => isPlaceholder(v as string)).map(([k]) => k as string);

  const callScript = buildCallScript(lead);
  const { subject, body } = buildEmail(lead);

  mkdirSync(resolve(process.cwd(), "drafts"), { recursive: true });
  const draftPath = resolve(process.cwd(), "drafts", `${placeId}.md`);

  let emailSection: string;
  let outreachStatus: string;
  if (missingForEmail.length) {
    emailSection = [
      `## Touch-1 email — NOT FINALIZED`,
      ``,
      `REFUSED to finalize: a CAN-SPAM footer needs real values. Missing: ${missingForEmail.join(", ")}.`,
      `Fill these in config.ts, then re-run \`npm run draft ${placeId}\`.`,
      ``,
      `Draft preview (do not send until the fields above are real):`,
      "```",
      `Subject: ${subject}`,
      ``,
      body,
      "```",
    ].join("\n");
    outreachStatus = `draft_blocked: missing ${missingForEmail.join("/")}`;
  } else {
    const voiceProblems = assertVoice(`${subject}\n${body}`);
    emailSection = [
      `## Touch-1 email`,
      voiceProblems.length ? `> voice check: ${voiceProblems.join("; ")}` : `> voice check: clean`,
      ``,
      "```",
      `From: ${FROM_EMAIL}`,
      `Subject: ${subject}`,
      ``,
      body,
      "```",
      lead.demo_url ? "" : `> [NEEDS: demo_url] deploy the demo first so the link is real.`,
      `> Attach: inline hero screenshot (${lead.demo_screenshot ?? "[NEEDS: demo_screenshot]"}).`,
      ownerFirstName(lead) ? "" : `> [NEEDS: owner first name] check their GBP/Facebook before sending; a real first name in the greeting beats "team".`,
    ].join("\n");
    outreachStatus = "touch1_drafted";
  }

  const doc = [
    `# Outreach draft — ${lead.business_name}`,
    `place_id: ${placeId} | ${lead.review_count ?? 0} reviews | ${lead.rating ?? "?"} stars | demo: ${lead.demo_url ?? "not deployed"}`,
    ``,
    emailSection,
    ``,
    `## Touch-2 call script`,
    "```",
    callScript,
    "```",
    ``,
    `Reminder: no cold SMS. SMS only if they reply or give a number (CLAUDE.md §0.4).`,
  ].join("\n");

  writeFileSync(draftPath, doc + "\n", "utf8");
  upsertLead({ place_id: placeId, outreach_status: outreachStatus });

  console.log(`Wrote drafts/${placeId}.md`);
  if (missingForEmail.length) {
    console.log(`Email NOT finalized. Missing identity fields: ${missingForEmail.join(", ")}.`);
  } else {
    console.log(`Touch-1 email + call script drafted in your voice.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
