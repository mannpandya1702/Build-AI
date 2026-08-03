"use client";

import { Card, PageHeader, SectionTitle } from "@/components/ui";
// /settings (spec §8.8): outreach mode + ICP overrides. Visible labels, helper text, save feedback
// (skill §8: input-labels, input-helper-text, submit-feedback).
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [icp, setIcp] = useState("");
  const [mode, setMode] = useState("review");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setIcp(
          JSON.stringify(
            d.settings.icp_overrides ?? { cities: [], active_vertical: "roofing", qualify_threshold: 60 },
            null,
            2,
          ),
        );
        setMode(d.settings.outreach_mode ?? "review");
      });
  }, []);

  async function save() {
    try {
      const parsed = JSON.parse(icp);
      await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "icp_overrides", value: parsed }),
      });
      await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "outreach_mode", value: mode }),
      });
      setSaved("saved ✓");
      setTimeout(() => setSaved(""), 2500);
    } catch (e) {
      setSaved(`error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Outreach mode and ICP overrides. Caps live in config/caps.yaml."
      />

      <Card className="p-4">
        <SectionTitle>Outreach mode</SectionTitle>
        <label htmlFor="mode" className="mt-3 block text-sm text-muted">
          How outbound email leaves the system
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface2 px-3 text-sm text-ink outline-none transition-colors duration-150 focus:border-data/60"
        >
          <option value="review">review — emails queue in the Outbox for approval</option>
          <option value="auto">auto — sends within caps; delivery always review</option>
        </select>
        <p className="mt-1.5 text-xs text-faint">
          Review is the safe default. Auto respects daily caps and the suppression list either way.
        </p>
      </Card>

      <Card className="mt-4 p-4">
        <SectionTitle>ICP overrides</SectionTitle>
        <label htmlFor="icp" className="mt-3 block text-sm text-muted">
          Merged over config/icp.yaml at runtime (JSON)
        </label>
        <textarea
          id="icp"
          value={icp}
          onChange={(e) => setIcp(e.target.value)}
          rows={12}
          spellCheck={false}
          className="mt-1.5 w-full rounded-lg border border-line bg-bg p-3 font-display text-xs leading-relaxed text-ink outline-none transition-colors duration-150 focus:border-data/60"
        />
      </Card>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          className="h-10 cursor-pointer rounded-lg bg-accent px-5 font-display text-sm font-semibold text-accentink transition-opacity duration-150 hover:opacity-90"
        >
          Save
        </button>
        {saved && (
          <span className={`text-sm ${saved.startsWith("error") ? "text-danger" : "text-ok"}`} role="status">
            {saved}
          </span>
        )}
      </div>
    </div>
  );
}
