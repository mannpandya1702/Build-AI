"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Copies one value — for the listings block, where the whole point is that
 * the name, address and phone are pasted identically everywhere rather than
 * retyped with small variations. Retyping is how NAP drift happens.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, non-secure context). Falling
      // back to selecting the text would need a visible input; simpler and
      // honest: prompt() shows the value ready to copy by hand.
      window.prompt(`Copy this ${label}:`, value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors",
        copied
          ? "border-[#3f6b3f] bg-[#3f6b3f]/10 text-[#33562f]"
          : "border-ink/20 text-stone-deep hover:border-ink/40 hover:text-ink",
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
