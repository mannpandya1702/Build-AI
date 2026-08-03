// A2P 10DLC / SMS compliance gate (MASTER_SPEC §10). SMS for a client is HARD-BLOCKED until their
// brand + campaign are approved; every send checks a stored opt-in; STOP is global and absolute;
// quiet hours (8am-9pm recipient local) are enforced. Pure + tested — the send path calls this first.

export type CampaignStatus = "pending" | "approved" | "rejected";

export interface SmsGateInput {
  toNumber: string;
  /** the client's A2P 10DLC campaign state */
  campaignStatus: CampaignStatus;
  /** a stored opt-in exists for this recipient */
  optedIn: boolean;
  /** global STOP/opt-out list (absolute) */
  suppressed?: readonly string[];
  /** recipient local hour (0-23) for quiet-hours; omit to skip */
  localHour?: number;
}

export interface SmsDecision {
  allowed: boolean;
  reason: string;
}

const QUIET_START = 8;
const QUIET_END = 21;

export function assertSmsAllowed(input: SmsGateInput): SmsDecision {
  if ((input.suppressed ?? []).includes(input.toNumber))
    return { allowed: false, reason: "recipient opted out (STOP) — suppressed" };
  if (input.campaignStatus !== "approved")
    return { allowed: false, reason: `A2P campaign not approved (${input.campaignStatus}) — SMS blocked` };
  if (!input.optedIn) return { allowed: false, reason: "no stored opt-in for this recipient" };
  if (typeof input.localHour === "number" && (input.localHour < QUIET_START || input.localHour >= QUIET_END))
    return { allowed: false, reason: "outside the 8am-9pm quiet-hours window" };
  return { allowed: true, reason: "campaign approved + opt-in on file" };
}

/** Global STOP/HELP handling: STOP suppresses across all channels; HELP returns info. */
export function classifyInboundSms(body: string): "stop" | "help" | "other" {
  const b = body.trim().toLowerCase();
  if (/^(stop|unsubscribe|cancel|end|quit|stopall)\b/.test(b)) return "stop";
  if (/^(help|info)\b/.test(b)) return "help";
  return "other";
}
