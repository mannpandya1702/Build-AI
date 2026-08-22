import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

export const alt = "How we shortlist a wedding venue — Riwaaya";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage("How we shortlist a wedding venue", "Venue types and regions across India");
}
