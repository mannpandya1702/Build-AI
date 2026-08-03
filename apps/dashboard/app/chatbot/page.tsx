"use client";

// /chatbot (MASTER_SPEC §7.2): the chatbot product surface — a live preview of the embeddable widget
// plus the copy-paste embed snippet. The widget answers only from the client's real facts and declines
// rather than fabricate; the preview runs against a labeled SAMPLE business (Demo Co), never a real one.
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";

const EMBED = `<script src="https://your-studio.vercel.app/chat-widget.js"
        data-endpoint="https://your-studio.vercel.app/api/chat"
        data-lead="<leadId>"
        data-name="Your Business"
        data-accent="#b91c1c"></script>`;

export default function ChatbotPage() {
  useEffect(() => {
    // Mount the real widget inline in the preview container (uses the sample "demo" KB).
    const s = document.createElement("script");
    s.src = "/chat-widget.js";
    s.dataset.mount = "#chat-preview";
    s.dataset.endpoint = "/api/chat";
    s.dataset.lead = "demo";
    s.dataset.name = "Demo Co";
    s.dataset.accent = "#b45309";
    s.dataset.greeting = "Hi. I'm the Demo Co assistant. Ask about our services, hours, or how to reach us.";
    document.body.appendChild(s);
    return () => {
      s.remove();
      document.getElementById("aicw-styles")?.remove();
      const host = document.getElementById("chat-preview");
      if (host) host.innerHTML = "";
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Chatbot"
        description="The site lead-capture widget. It answers only from the business's real facts and declines rather than guess."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>Live preview</SectionTitle>
          <p className="mt-1 text-xs text-faint">
            Grounded in a labeled sample business (Demo Co). Try “what are your hours?” or “how do I reach
            you?”.
          </p>
          <div id="chat-preview" className="mt-3 h-[520px] overflow-hidden rounded-xl border border-line" />
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle>Embed snippet</SectionTitle>
            <p className="mt-1 text-xs text-faint">
              Paste before the closing body tag on the client's site. One line per client, keyed to their
              lead.
            </p>
            <pre className="mt-3 overflow-auto rounded-lg bg-bg p-3 font-display text-[11px] leading-relaxed text-muted">
              {EMBED}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                navigator.clipboard?.writeText(EMBED);
                toast.success("Embed snippet copied");
              }}
            >
              Copy snippet
            </Button>
          </Card>

          <Card className="p-4">
            <SectionTitle>How it stays safe</SectionTitle>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>Answers only from the business's real facts (their GBP + site content).</li>
              <li>Declines instead of inventing a price, availability, or claim.</li>
              <li>Message text is rendered safely, so nothing a user types can inject markup.</li>
              <li>Live answers use a Haiku model once an Anthropic key is set; grounded either way.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
