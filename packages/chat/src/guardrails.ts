// Chatbot anti-fabrication guardrails (MASTER_SPEC §7.2: "never invents prices or availability").
// Pure + tested. The runtime declines rather than ship any answer that fails these checks.

/**
 * Returns every monetary amount in `answer` that does NOT appear in `sourceText`. A non-empty result
 * means the answer invented a price — the runtime must decline instead of sending it.
 */
export function findInventedPrices(answer: string, sourceText: string): string[] {
  const src = sourceText.replace(/[,\s]/g, "");
  const invented: string[] = [];
  for (const p of answer.match(/\$\d[\d,]*(?:\.\d+)?/g) ?? []) {
    const bare = p.replace(/[$,\s]/g, "");
    if (!src.includes(bare)) invented.push(p);
  }
  return invented;
}

/** True if the question hits a configured blocked topic (medical/legal advice, competitors, etc.). */
export function isBlockedTopic(question: string, blocked: readonly string[]): boolean {
  const q = question.toLowerCase();
  return blocked.some((t) => t && q.includes(t.toLowerCase()));
}

// Phrases that signal the model is inventing availability/scheduling it cannot know from the KB.
const AVAILABILITY_CLAIMS = [
  /\bwe(?:'re| are)\s+open\s+(?:24\/7|right now|now)\b/i,
  /\bavailable\s+(?:right\s+)?now\b/i,
  /\bi can book you (?:for|at)\b/i,
];

/** True if the answer asserts availability/booking not backed by the source text. */
export function claimsUnbackedAvailability(answer: string, sourceText: string): boolean {
  const src = sourceText.toLowerCase();
  return AVAILABILITY_CLAIMS.some((re) => re.test(answer) && !re.test(src));
}
