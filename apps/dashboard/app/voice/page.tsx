// /voice (MASTER_SPEC §7.3/§10): the voice-agent product surface. Presents the four assistant
// templates + the TCPA consent model that governs them. Server component — pure static data from
// @autopilot/voice (single source of truth), no client interactivity needed.
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ASSISTANT_TEMPLATES } from "@autopilot/voice";

export const dynamic = "force-static";

const SAFETY = [
  "Inbound calls are always allowed — the prospect called the business.",
  "Every outbound call is consent-gated in code: no matching consent record, the dialer refuses (TCPA, up to $1,500/call).",
  "The suppression list is absolute — an opted-out number is never dialed.",
  "Outbound only within the 8am–9pm recipient-local window.",
  "Every call opens with a spoken AI-disclosure line. No exceptions.",
  "Reactivation uses the client's OWN past customers (established relationship + stored opt-in). Never cold lists.",
];

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Voice Agent"
        description="Inbound reception + consent-based outbound follow-up. Never a cold-call dialer — the consent gate is enforced in code."
      />

      {/* The safety model is the product's whole credibility — lead with it. */}
      <Card className="border-l-2 border-l-accent p-4">
        <SectionTitle>How it stays compliant</SectionTitle>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-muted md:grid-cols-2">
          {SAFETY.map((s) => (
            <li key={s} className="flex gap-2 leading-snug">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
              {s}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4">
        <SectionTitle>Assistant templates ({ASSISTANT_TEMPLATES.length})</SectionTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {ASSISTANT_TEMPLATES.map((t) => (
            <Card key={t.key} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-faint">{t.summary}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-md px-2 py-0.5 font-display text-[11px] ${t.direction === "inbound" ? "bg-ok/10 text-ok" : "bg-data/10 text-data"}`}
                  >
                    {t.direction}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-display text-[11px] ${t.requiresConsent ? "bg-warn/10 text-warn" : "bg-surface2 text-faint"}`}
                  >
                    {t.requiresConsent ? "consent-gated" : "no consent needed"}
                  </span>
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-2.5">
                <p className="font-display text-[11px] uppercase tracking-wide text-faint">Opens with</p>
                <p className="mt-1 text-[13px] italic leading-snug text-muted">“{t.disclosureLine}”</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md bg-surface2 px-1.5 py-0.5 font-display text-[11px] text-muted"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activation placeholder — the operator inputs to flip this MOCK→LIVE (NEEDS_FROM_OPERATOR.md). */}
      <Card className="mt-4 border border-dashed border-line p-4">
        <SectionTitle>To go live</SectionTitle>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>A Vapi API key (assistant hosting + telephony).</li>
          <li>A US phone number for the business (or a shared studio number, per client).</li>
          <li>Documented consent basis per outbound campaign (form / written / established relationship).</li>
        </ul>
        <p className="mt-3 font-display text-[11px] text-faint">
          Until these are provided the assistants run in preview only. The consent gate is already enforced in
          code, so nothing dials without a matching consent record.
        </p>
      </Card>
    </div>
  );
}
