// TCPA consent gate (MASTER_SPEC §10). The FCC's Feb-2024 ruling makes AI voices "artificial or
// prerecorded" under the TCPA ($500-$1,500 per call, no cap). Enforced in CODE: an outbound AI call
// only proceeds for a number with a matching consent record; no record, the dialer REFUSES. Inbound
// is always allowed (the prospect called us). Pure + exhaustively tested.

export type ConsentBasis = "form" | "written" | "ebr"; // ebr = established business relationship

export interface ConsentRecord {
  /** E.164 number the consent applies to */
  number: string;
  basis: ConsentBasis;
  /** the form/agreement explicitly included call-consent language */
  callConsent: boolean;
  capturedAt: string;
}

export interface CallGateInput {
  number: string;
  direction: "inbound" | "outbound";
  consentRecords: readonly ConsentRecord[];
  /** global suppression list (numbers that opted out — absolute) */
  suppressed?: readonly string[];
  /** recipient local hour (0-23) for the calling-window check; omit to skip */
  localHour?: number;
}

export interface CallDecision {
  allowed: boolean;
  reason: string;
}

// Calling window: 8:00-21:00 recipient local time (MASTER_SPEC §10).
const WINDOW_START = 8;
const WINDOW_END = 21;

export function assertCallAllowed(input: CallGateInput): CallDecision {
  if (input.direction === "inbound") return { allowed: true, reason: "inbound call" };

  const suppressed = input.suppressed ?? [];
  if (suppressed.includes(input.number))
    return { allowed: false, reason: "number is on the suppression list" };

  const rec = input.consentRecords.find((r) => r.number === input.number);
  if (!rec) return { allowed: false, reason: "no consent record — the dialer refuses (TCPA)" };
  if (rec.basis === "form" && !rec.callConsent)
    return { allowed: false, reason: "form consent lacks call-consent language" };

  if (
    typeof input.localHour === "number" &&
    (input.localHour < WINDOW_START || input.localHour >= WINDOW_END)
  )
    return { allowed: false, reason: "outside the 8am-9pm recipient-local calling window" };

  return { allowed: true, reason: `consent on file (${rec.basis})` };
}
