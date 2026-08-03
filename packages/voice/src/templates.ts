// The four voice-assistant templates (MASTER_SPEC §7.3), stamped per client from config + KB. Every
// template carries a hard AI-disclosure line spoken FIRST (TCPA §10). Outbound templates are
// consent-gated (the dialer runs assertCallAllowed before any call).

export type AssistantKey =
  | "inbound_receptionist"
  | "speed_to_lead"
  | "appointment_confirmation"
  | "reactivation";

export interface AssistantTemplate {
  key: AssistantKey;
  name: string;
  direction: "inbound" | "outbound";
  /** consent-gated before dialing (all outbound) */
  requiresConsent: boolean;
  /** spoken as the first utterance of every call (mandatory AI disclosure) */
  disclosureLine: string;
  tools: readonly string[];
  summary: string;
}

const DISCLOSURE = "Hi, this is an AI assistant calling on behalf of {business}.";

export const ASSISTANT_TEMPLATES: readonly AssistantTemplate[] = [
  {
    key: "inbound_receptionist",
    name: "Inbound Receptionist",
    direction: "inbound",
    requiresConsent: false,
    disclosureLine: "Thanks for calling {business}. You're speaking with an AI assistant.",
    tools: ["book", "kb_lookup", "transfer", "take_message"],
    summary: "Answers 24/7, discloses AI, qualifies, books, takes messages, transfers on request.",
  },
  {
    key: "speed_to_lead",
    name: "Speed-to-Lead Responder",
    direction: "outbound",
    requiresConsent: true,
    disclosureLine: DISCLOSURE,
    tools: ["book", "kb_lookup", "sms_fallback"],
    summary: "Calls a fresh web lead in under 60s (consent from the form), SMS fallback if no answer.",
  },
  {
    key: "appointment_confirmation",
    name: "Appointment Confirmation",
    direction: "outbound",
    requiresConsent: true,
    disclosureLine: DISCLOSURE,
    tools: ["confirm", "reschedule", "sms_fallback"],
    summary: "SMS-first confirm/remind with voice fallback; feeds no-show recovery.",
  },
  {
    key: "reactivation",
    name: "Reactivation Assistant",
    direction: "outbound",
    requiresConsent: true,
    disclosureLine: DISCLOSURE,
    tools: ["sms_campaign", "book"],
    summary: "Re-engages the client's OWN past customers (EBR + stored opt-in only). Never cold lists.",
  },
];

export const ASSISTANT_BY_KEY: ReadonlyMap<AssistantKey, AssistantTemplate> = new Map(
  ASSISTANT_TEMPLATES.map((t) => [t.key, t]),
);
