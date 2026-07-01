"use client";

import { useState } from "react";
import { site } from "../lib/content";

// Short quote form: 4 fields (name, phone, service, timing) per CLAUDE.md §5b. Client-side
// validation for fast feedback; the /api/quote route re-validates and sanitizes server-side, because
// client checks are never trusted (CLAUDE.md §5e).
type Status = "idle" | "submitting" | "ok" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      timing: (form.elements.namedItem("timing") as HTMLSelectElement).value,
    };

    if (data.name.length < 2) return setError("Please enter your name.");
    if (data.phone.replace(/[^0-9]/g, "").length < 10) return setError("Please enter a valid phone number.");

    setStatus("submitting");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
      setError("Something went wrong. Please call us instead.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-gray-900">Got it. We will call you back.</p>
        <p className="mt-1 text-gray-600">Need us now? {site.phone ? `Call ${site.phone}.` : "Give us a call."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm" noValidate>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-gray-800">Name</label>
        <input id="name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={80}
          className="min-h-tap w-full rounded-lg border border-gray-300 px-3 text-base" />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-gray-800">Phone</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20}
          className="min-h-tap w-full rounded-lg border border-gray-300 px-3 text-base" />
      </div>
      <div>
        <label htmlFor="service" className="mb-1 block text-sm font-semibold text-gray-800">What do you need?</label>
        <select id="service" name="service" className="min-h-tap w-full rounded-lg border border-gray-300 px-3 text-base">
          {site.services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="timing" className="mb-1 block text-sm font-semibold text-gray-800">How soon?</label>
        <select id="timing" name="timing" className="min-h-tap w-full rounded-lg border border-gray-300 px-3 text-base">
          <option value="emergency">Emergency (today)</option>
          <option value="this-week">This week</option>
          <option value="this-month">This month</option>
          <option value="just-looking">Just getting a quote</option>
        </select>
      </div>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={status === "submitting"}
        className="min-h-tap w-full rounded-full bg-brand text-lg font-bold text-brandink shadow-lg active:scale-95 disabled:opacity-60">
        {status === "submitting" ? "Sending..." : "Get my free quote"}
      </button>
    </form>
  );
}
