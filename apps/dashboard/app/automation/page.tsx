// /automation (MASTER_SPEC §7.4/§10): the workflow-automation product surface. Presents the three
// productized templates + the A2P/SMS consent model. Server component — pure static data from
// @autopilot/automation (single source of truth), no client interactivity needed.
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { AUTOMATION_TEMPLATES } from "@autopilot/automation";

export const dynamic = "force-static";

const SAFETY = [
  "Every SMS runs through the gate: blocked until the client's A2P campaign is approved.",
  "Recipient opt-in is required — these message the business's OWN customers, never cold lists.",
  "STOP is absolute and instant — one reply suppresses the number forever.",
  "Quiet hours are enforced (no late-night sends).",
  "Negative sentiment on a review ask routes privately to the owner, never a public review.",
];

export default function AutomationPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Automation"
        description="Productized workflows on the client's existing customer relationships. Three templates, versioned and tested — not a general builder."
      />

      {/* The A2P/SMS consent model is the credibility — lead with it. */}
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
        <SectionTitle>Templates ({AUTOMATION_TEMPLATES.length})</SectionTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          {AUTOMATION_TEMPLATES.map((t) => (
            <Card key={t.key} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-sm font-semibold text-ink">{t.name}</p>
                {t.usesSms && (
                  <span className="shrink-0 rounded-md bg-data/10 px-2 py-0.5 font-display text-[11px] text-data">
                    SMS
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-faint">
                <span className="font-display uppercase tracking-wide">Trigger:</span> {t.trigger}
              </p>
              <ol className="mt-3 space-y-1.5 text-[13px] text-muted">
                {t.steps.map((step, i) => (
                  <li key={step} className="flex gap-2 leading-snug">
                    <span className="font-display text-[11px] text-faint">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                {t.stopOn.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-surface2 px-1.5 py-0.5 font-display text-[11px] text-muted"
                  >
                    stops on: {s}
                  </span>
                ))}
              </div>
              {t.negativeInterceptToOwner && (
                <p className="mt-2 font-display text-[11px] text-ok">✓ negative-sentiment intercept</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Activation placeholder — the operator inputs to flip this MOCK→LIVE (NEEDS_FROM_OPERATOR.md). */}
      <Card className="mt-4 border border-dashed border-line p-4">
        <SectionTitle>To go live</SectionTitle>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>Twilio credentials + a registered A2P 10DLC campaign for the client's SMS traffic.</li>
          <li>Trigger.dev (or the chosen scheduler) for the delayed/multi-step sequences.</li>
          <li>Documented opt-in per client (the message audience is their existing customers).</li>
        </ul>
        <p className="mt-3 font-display text-[11px] text-faint">
          Until these are provided the templates run in preview only. The SMS gate is already enforced in
          code, so nothing sends before a campaign is approved and the recipient opted in.
        </p>
      </Card>
    </div>
  );
}
