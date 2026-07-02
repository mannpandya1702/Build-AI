// src/discovery/address.ts — parse city/state out of a Google Places formattedAddress. Shared by
// find.ts and the --rescore path. Handles both "123 Main St, Plano, TX 75023, USA" and the
// country-less "123 Main St, Plano, TX 75023" shape common for US businesses.

export function stateFromAddress(addr?: string): string {
  const m = (addr ?? "").match(/,\s*([A-Z]{2})\s*\d{5}/);
  return m ? m[1] : "";
}

export function cityFromAddress(addr?: string): string {
  if (!addr) return "";
  const parts = addr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/^(USA|United States)$/i.test(p));
  // The city is the token right before the "STATE ZIP" component.
  const stateIdx = parts.findIndex((p) => /^[A-Z]{2}\s*\d{5}(-\d{4})?$/.test(p));
  if (stateIdx > 0) return parts[stateIdx - 1];
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] ?? "";
}
