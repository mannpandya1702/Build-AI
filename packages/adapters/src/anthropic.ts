// Anthropic adapter (spec §3 model map): Haiku for extraction/scoring/classification, Sonnet for
// analysis/solution/design/codegen/QA. Every call's cost lands in agent_events.cost_usd (§9).
// MOCK_MODE returns canned responses with zero spend.
import { readFileSync, existsSync } from "node:fs";
import { emitEvent } from "@autopilot/core";
import { MOCK } from "./config.js";
import { anthropicSpendToday } from "./caps.js";
import { loadCaps } from "./config.js";

export type ModelTier = "haiku" | "sonnet";
const MODELS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-5",
};
// USD per 1M tokens (input, output). Config-not-code would move this to caps.yaml later.
const PRICES: Record<ModelTier, [number, number]> = {
  haiku: [1, 5],
  sonnet: [3, 15],
};

export interface LlmCall {
  tier: ModelTier;
  system?: string;
  prompt: string;
  maxTokens?: number;
  agent: string;
  leadId?: string | null;
  mockResponse?: string;
  /** PNG file paths to include as vision inputs (e.g. rendered site screenshots). Missing files
   *  are skipped silently so a failed screenshot never blocks the call. */
  images?: string[];
}

/** Build the message content: image blocks first (recommended ordering), then the text prompt. */
function buildContent(prompt: string, images?: string[]): unknown {
  const imgs = (images ?? []).filter((p) => existsSync(p));
  if (imgs.length === 0) return prompt;
  const blocks: unknown[] = imgs.map((p) => ({
    type: "image",
    source: { type: "base64", media_type: "image/png", data: readFileSync(p).toString("base64") },
  }));
  blocks.push({ type: "text", text: prompt });
  return blocks;
}

export async function llm(call: LlmCall): Promise<string> {
  if (MOCK()) return call.mockResponse ?? "{}";

  const caps = loadCaps();
  const spent = await anthropicSpendToday();
  if (spent >= caps.anthropic_usd_per_day) {
    throw new Error(`anthropic daily budget exhausted ($${spent.toFixed(2)}/$${caps.anthropic_usd_per_day})`);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELS[call.tier],
      max_tokens: call.maxTokens ?? 1024,
      ...(call.system ? { system: call.system } : {}),
      messages: [{ role: "user", content: buildContent(call.prompt, call.images) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
    usage: { input_tokens: number; output_tokens: number };
  };
  const [inP, outP] = PRICES[call.tier];
  const cost = (data.usage.input_tokens * inP + data.usage.output_tokens * outP) / 1_000_000;
  await emitEvent({
    agent: call.agent,
    leadId: call.leadId ?? null,
    level: "debug",
    type: "llm.call",
    message: `${call.tier} ${data.usage.input_tokens}in/${data.usage.output_tokens}out`,
    costUsd: cost,
  });
  return data.content.find((c) => c.type === "text")?.text ?? "";
}
