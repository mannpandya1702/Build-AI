// Chatbot runtime (MASTER_SPEC §7.2). Answers ONLY from the client KB and DECLINES rather than ship a
// fabricated price/availability. The LLM call is injected (`generate`) so the safety behavior is
// deterministically testable; the live path passes a Haiku-backed generator, MOCK passes the default
// (which echoes retrieved context, grounded by construction).
import { claimsUnbackedAvailability, findInventedPrices, isBlockedTopic } from "./guardrails.js";
import { type KbDoc, retrieveContext } from "./kb.js";

export type Generator = (question: string, context: string) => string | Promise<string>;

const DECLINE_BLOCKED = "I can't help with that here, but I can connect you with the team.";
const DECLINE_UNKNOWN = "I don't have that detail on hand. I'll have the team follow up with you.";

// MOCK generator: answers strictly from the retrieved context (grounded by construction).
const mockGenerate: Generator = (_q, context) => `Here's what I can share: ${context.split("\n")[0]}`;

export interface AnswerInput {
  kb: KbDoc[];
  question: string;
  blockedTopics?: readonly string[];
  generate?: Generator;
}

export interface AnswerResult {
  answer: string;
  declined: boolean;
  reason?: "blocked_topic" | "no_context" | "fabrication_guard";
}

export async function answerQuestion(input: AnswerInput): Promise<AnswerResult> {
  const blocked = input.blockedTopics ?? [];
  if (isBlockedTopic(input.question, blocked)) {
    return { answer: DECLINE_BLOCKED, declined: true, reason: "blocked_topic" };
  }

  const context = retrieveContext(input.kb, input.question);
  if (!context) {
    return { answer: DECLINE_UNKNOWN, declined: true, reason: "no_context" };
  }

  const candidate = (await (input.generate ?? mockGenerate)(input.question, context)).trim();

  // Anti-fabrication: never ship an answer that invents a price or unbacked availability.
  if (findInventedPrices(candidate, context).length > 0 || claimsUnbackedAvailability(candidate, context)) {
    return { answer: DECLINE_UNKNOWN, declined: true, reason: "fabrication_guard" };
  }

  return { answer: candidate, declined: false };
}
