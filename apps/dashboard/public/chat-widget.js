/*
 * Embeddable chat widget (MASTER_SPEC §7.2) — the chatbot product's client-side artifact.
 * Self-contained (no deps, no build), themeable via data-attributes on the <script> tag, and safe:
 * message text is rendered with textContent (never innerHTML), so a business's real answers — or a
 * user's typed question — can never inject markup. Answers come from /api/chat, which only speaks
 * from the client's real facts and declines rather than fabricate.
 *
 * Embed:
 *   <script src="https://…/chat-widget.js"
 *           data-endpoint="/api/chat" data-lead="<leadId>"
 *           data-name="Joe's Roofing" data-accent="#b91c1c"></script>
 * Inline preview: add data-mount="#some-container" to render in place instead of floating.
 */
(() => {
  const script = document.currentScript;
  if (!script) return;
  const cfg = {
    endpoint: script.dataset.endpoint || "/api/chat",
    leadId: script.dataset.lead || "",
    name: script.dataset.name || "Chat",
    accent: script.dataset.accent || "#c2410c",
    mount: script.dataset.mount || "",
    greeting: script.dataset.greeting || "Hi. Ask about our services, hours, or how to reach us.",
  };

  // ---- one-time scoped styles ----
  if (!document.getElementById("aicw-styles")) {
    const css = `
.aicw-root{--aicw-accent:${cfg.accent};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.aicw-bubble{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:999px;background:var(--aicw-accent);color:#fff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);display:grid;place-items:center;z-index:2147483000;transition:transform .15s}
.aicw-bubble:hover{transform:translateY(-2px)}
.aicw-bubble svg{width:26px;height:26px}
.aicw-panel{display:flex;flex-direction:column;background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.22)}
.aicw-floating{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);z-index:2147483000}
.aicw-inline{width:100%;height:100%}
.aicw-head{background:var(--aicw-accent);color:#fff;padding:14px 16px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:space-between}
.aicw-head button{background:transparent;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;opacity:.85}
.aicw-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f8fafc}
.aicw-msg{max-width:82%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
.aicw-bot{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px}
.aicw-user{align-self:flex-end;background:var(--aicw-accent);color:#fff;border-bottom-right-radius:4px}
.aicw-dots{align-self:flex-start;display:flex;gap:4px;padding:12px}
.aicw-dots i{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:aicw-b 1s infinite}
.aicw-dots i:nth-child(2){animation-delay:.15s}.aicw-dots i:nth-child(3){animation-delay:.3s}
@keyframes aicw-b{0%,60%,100%{opacity:.3}30%{opacity:1}}
.aicw-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff}
.aicw-form input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;outline:none}
.aicw-form input:focus{border-color:var(--aicw-accent)}
.aicw-form button{background:var(--aicw-accent);color:#fff;border:none;border-radius:10px;padding:0 16px;font-weight:600;cursor:pointer}
.aicw-form button:disabled{opacity:.5;cursor:default}
@media(prefers-color-scheme:dark){.aicw-panel{background:#0f172a;color:#e2e8f0;border-color:#1e293b}.aicw-log{background:#0b1220}.aicw-bot{background:#0f172a;border-color:#1e293b}.aicw-form{background:#0f172a;border-color:#1e293b}.aicw-form input{background:#0b1220;border-color:#1e293b;color:#e2e8f0}}
`;
    const style = document.createElement("style");
    style.id = "aicw-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  const root = document.createElement("div");
  root.className = "aicw-root";

  // ---- panel ----
  const panel = document.createElement("div");
  panel.className = `aicw-panel ${cfg.mount ? "aicw-inline" : "aicw-floating"}`;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", `${cfg.name} chat`);

  const head = document.createElement("div");
  head.className = "aicw-head";
  const title = document.createElement("span");
  title.textContent = cfg.name;
  head.appendChild(title);
  if (!cfg.mount) {
    const close = document.createElement("button");
    close.setAttribute("aria-label", "Close chat");
    close.textContent = "×";
    close.onclick = () => togglePanel(false);
    head.appendChild(close);
  }

  const log = document.createElement("div");
  log.className = "aicw-log";

  const form = document.createElement("form");
  form.className = "aicw-form";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your question…";
  input.setAttribute("aria-label", "Your question");
  const send = document.createElement("button");
  send.type = "submit";
  send.textContent = "Send";
  form.append(input, send);

  panel.append(head, log, form);

  // ---- helpers ----
  function addMsg(text, who) {
    const el = document.createElement("div");
    el.className = `aicw-msg aicw-${who}`;
    el.textContent = text; // XSS-safe: never innerHTML
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function showTyping() {
    const t = document.createElement("div");
    t.className = "aicw-dots";
    t.innerHTML = "<i></i><i></i><i></i>"; // static markup, no user data
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    return t;
  }

  let busy = false;
  async function ask(question) {
    if (busy) return;
    busy = true;
    send.disabled = true;
    addMsg(question, "user");
    const typing = showTyping();
    try {
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, leadId: cfg.leadId }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      addMsg(data.answer || "Sorry, something went wrong. Please try again.", "bot");
    } catch {
      typing.remove();
      addMsg("I couldn't reach the server. Please try again in a moment.", "bot");
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });

  // ---- toggle (floating only; inline is always open) ----
  function togglePanel(open) {
    panel.style.display = open ? "flex" : "none";
    if (open) input.focus();
  }

  // ---- mount ----
  addMsg(cfg.greeting, "bot");
  if (cfg.mount) {
    const host = document.querySelector(cfg.mount);
    if (host) {
      root.appendChild(panel);
      host.appendChild(root);
    }
  } else {
    const bubble = document.createElement("button");
    bubble.className = "aicw-bubble";
    bubble.setAttribute("aria-label", `Open ${cfg.name} chat`);
    bubble.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    panel.style.display = "none";
    bubble.onclick = () => togglePanel(panel.style.display === "none");
    root.append(bubble, panel);
    document.body.appendChild(root);
  }
})();
