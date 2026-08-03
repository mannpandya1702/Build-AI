// Gemini adapter — free-tier LLM alternative, used when LLM_PROVIDER=gemini. Matches the llm()
// contract (see anthropic.ts) exactly, so every agent stays provider-agnostic: same tiers, same
// vision inputs, same llm.call cost event. Uses the `-latest` flash aliases on purpose — the pinned
// versions (gemini-2.0-flash…) are quota-walled on the free tier, while `-latest` routes to a
// currently-free multimodal model. maxOutputTokens is floored generously so a "thinking" flash model
// can't spend its whole budget reasoning and return empty text.
import { existsSync, readFileSync } from "node:fs";
import { emitEvent } from "@autopilot/core";
import type { LlmCall, ModelTier } from "./anthropic.js";
import { anthropicSpendToday } from "./caps.js";
import { loadCaps } from "./config.js";

const GEMINI_MODELS: Record<ModelTier, string> = {
  haiku: "gemini-flash-lite-latest",
  sonnet: "gemini-flash-latest",
};
// Approx published flash prices (USD per 1M input, output) for cost ACCOUNTING only; the free tier
// bills $0. Keeps the llm.call cost event meaningful if usage ever crosses into paid.
const GEMINI_PRICES: Record<ModelTier, [number, number]> = {
  haiku: [0.075, 0.3],
  sonnet: [0.1, 0.4],
};

function geminiParts(prompt: string, images?: string[]): unknown[] {
  const parts: unknown[] = [];
  for (const p of (images ?? []).filter((x) => existsSync(x))) {
    parts.push({ inline_data: { mime_type: "image/png", data: readFileSync(p).toString("base64") } });
  }
  parts.push({ text: prompt });
  return parts;
}

export async function geminiLlm(call: LlmCall): Promise<string> {
  const caps = loadCaps();
  const spent = await anthropicSpendToday(); // shared daily LLM-spend guard (sums llm.call costs)
  if (spent >= caps.anthropic_usd_per_day) {
    throw new Error(`llm daily budget exhausted ($${spent.toFixed(2)}/$${caps.anthropic_usd_per_day})`);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = GEMINI_MODELS[call.tier];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...(call.system ? { system_instruction: { parts: [{ text: call.system }] } } : {}),
        contents: [{ role: "user", parts: geminiParts(call.prompt, call.images) }],
        generationConfig: { maxOutputTokens: Math.max(call.maxTokens ?? 1024, 2048), temperature: 0.7 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const inTok = data.usageMetadata?.promptTokenCount ?? 0;
  // flash-latest is a "thinking" model; thinking tokens bill as output on paid tier, so count them.
  const outTok =
    (data.usageMetadata?.candidatesTokenCount ?? 0) +
    ((data.usageMetadata as { thoughtsTokenCount?: number })?.thoughtsTokenCount ?? 0);
  const [inP, outP] = GEMINI_PRICES[call.tier];
  const cost = (inTok * inP + outTok * outP) / 1_000_000;
  await emitEvent({
    agent: call.agent,
    leadId: call.leadId ?? null,
    level: "debug",
    type: "llm.call",
    message: `${call.tier}(gemini:${model}) ${inTok}in/${outTok}out`,
    costUsd: cost,
  });
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}
