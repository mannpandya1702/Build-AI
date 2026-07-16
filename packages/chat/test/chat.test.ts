import { describe, expect, it } from "vitest";
import { findInventedPrices, isBlockedTopic } from "../src/guardrails.js";
import { type KbDoc, retrieveContext } from "../src/kb.js";
import { answerQuestion } from "../src/runtime.js";

const KB: KbDoc[] = [
  { id: "1", title: "Services", text: "We offer roof repair, replacement, and storm damage inspection." },
  { id: "2", title: "Hours", text: "Our office is open Monday to Friday, 8am to 5pm." },
  { id: "3", title: "Service area", text: "We serve Dallas and surrounding suburbs." },
];

describe("chatbot guardrails", () => {
  it("flags a price not present in the source (anti-fabrication)", () => {
    expect(findInventedPrices("It costs $499 to start.", "roof repair and replacement")).toEqual(["$499"]);
  });
  it("allows a price that IS in the source", () => {
    expect(findInventedPrices("Setup is $1,500.", "setup fee is $1500 one time")).toEqual([]);
  });
  it("detects blocked topics", () => {
    expect(isBlockedTopic("can you give me medical advice?", ["medical advice"])).toBe(true);
    expect(isBlockedTopic("do you repair roofs?", ["medical advice"])).toBe(false);
  });
});

describe("chatbot retrieval", () => {
  it("returns relevant KB text and nothing for an off-topic question", () => {
    expect(retrieveContext(KB, "what are your hours?")).toContain("8am to 5pm");
    expect(retrieveContext(KB, "quantum entanglement thermodynamics")).toBe("");
  });
});

describe("chatbot runtime (never fabricates)", () => {
  it("answers grounded questions from the KB", async () => {
    const r = await answerQuestion({ kb: KB, question: "what services do you offer?" });
    expect(r.declined).toBe(false);
    expect(r.answer.toLowerCase()).toContain("roof");
  });

  it("declines when there is no relevant context (never invents)", async () => {
    const r = await answerQuestion({ kb: KB, question: "do you sell insurance policies in Alaska?" });
    expect(r.declined).toBe(true);
    expect(r.reason).toBe("no_context");
  });

  it("declines a blocked topic", async () => {
    const r = await answerQuestion({
      kb: KB,
      question: "give me legal advice about my claim",
      blockedTopics: ["legal advice"],
    });
    expect(r.declined).toBe(true);
    expect(r.reason).toBe("blocked_topic");
  });

  it("declines when the model would invent a price (fabrication guard)", async () => {
    const r = await answerQuestion({
      kb: KB,
      question: "how much is a roof repair?",
      generate: () => "A roof repair is $2,999 flat.", // price not in KB
    });
    expect(r.declined).toBe(true);
    expect(r.reason).toBe("fabrication_guard");
  });
});
