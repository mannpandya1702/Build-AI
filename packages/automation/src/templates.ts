// The three automation templates (MASTER_SPEC §7.4). Exactly three — versioned TypeScript, tested in
// CI, no general builder. Each SMS step runs through assertSmsAllowed before sending.

export type AutomationKey = "missed_call_text_back" | "review_requests" | "quote_follow_up";

export interface AutomationTemplate {
  key: AutomationKey;
  name: string;
  trigger: string;
  steps: readonly string[];
  stopOn: readonly string[];
  usesSms: boolean;
  /** routes negative sentiment to the owner instead of a public review (review pack) */
  negativeInterceptToOwner?: boolean;
}

export const AUTOMATION_TEMPLATES: readonly AutomationTemplate[] = [
  {
    key: "missed_call_text_back",
    name: "Missed-Call Text-Back",
    trigger: "missed call on the tracked number",
    steps: ["instant SMS with a booking link", "conversation handled by the chatbot brain over SMS"],
    stopOn: ["booked", "reply STOP"],
    usesSms: true,
  },
  {
    key: "review_requests",
    name: "Review Requests",
    trigger: "job complete (manual mark or calendar event)",
    steps: [
      "delayed review ask (SMS/email) with a direct Google review link",
      "negative-sentiment intercept routes to the owner, never a public review",
    ],
    stopOn: ["reviewed", "reply STOP"],
    usesSms: true,
    negativeInterceptToOwner: true,
  },
  {
    key: "quote_follow_up",
    name: "Quote Follow-Up",
    trigger: "quote sent",
    steps: ["day-2 follow-up", "day-5 follow-up", "day-10 follow-up"],
    stopOn: ["reply", "booking"],
    usesSms: true,
  },
];

export const AUTOMATION_BY_KEY: ReadonlyMap<AutomationKey, AutomationTemplate> = new Map(
  AUTOMATION_TEMPLATES.map((t) => [t.key, t]),
);
