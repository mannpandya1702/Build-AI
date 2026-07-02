"use client";

// /settings (spec §8.8, Phase 2 scope): ICP overrides + outreach mode. More controls per phase.
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [icp, setIcp] = useState("");
  const [mode, setMode] = useState("review");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setIcp(JSON.stringify(d.settings.icp_overrides ?? { cities: [], active_vertical: "roofing", qualify_threshold: 60 }, null, 2));
        setMode(d.settings.outreach_mode ?? "review");
      });
  }, []);

  async function save() {
    try {
      const parsed = JSON.parse(icp);
      await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "icp_overrides", value: parsed }) });
      await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "outreach_mode", value: mode }) });
      setSaved("saved");
      setTimeout(() => setSaved(""), 2000);
    } catch (e) {
      setSaved(`error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold">Settings</h1>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-400">Outreach mode</h2>
      <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
        <option value="review">review (emails queue for approval)</option>
        <option value="auto">auto (sends within caps; delivery always review)</option>
      </select>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-400">ICP overrides (merged over config/icp.yaml)</h2>
      <textarea value={icp} onChange={(e) => setIcp(e.target.value)} rows={12} className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs" />
      <button onClick={save} className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
        Save
      </button>
      {saved && <span className="ml-3 text-sm text-zinc-400">{saved}</span>}
    </div>
  );
}
