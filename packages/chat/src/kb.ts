// Chatbot knowledge base (MASTER_SPEC §7.2). The KB is seeded from the client's scraped content; the
// chatbot answers ONLY from it. Retrieval here is a dependency-light keyword overlap for MOCK + tests;
// the live path swaps in embeddings (kb_documents) without changing the runtime contract.

export interface KbDoc {
  id: string;
  title?: string;
  text: string;
}

const WORD = /[a-z0-9]+/g;

export function kbText(kb: KbDoc[]): string {
  return kb.map((d) => d.text).join("\n");
}

/** Return the most relevant KB text for a question (overlap-ranked, char-capped). Empty if nothing matches. */
export function retrieveContext(kb: KbDoc[], question: string, maxChars = 1500): string {
  const qWords = new Set(question.toLowerCase().match(WORD) ?? []);
  if (qWords.size === 0) return "";
  const scored = kb
    .map((d) => {
      // Titles carry meaningful keywords (a doc titled "Hours" should match "what are your hours").
      const words = `${d.title ?? ""} ${d.text}`.toLowerCase().match(WORD) ?? [];
      let s = 0;
      for (const w of words) if (qWords.has(w)) s++;
      return { d, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  let out = "";
  for (const { d } of scored) {
    if (out.length + d.text.length + 1 > maxChars) break;
    out += (out ? "\n" : "") + d.text;
  }
  return out;
}
