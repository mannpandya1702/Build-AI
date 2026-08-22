import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

export const alt = "Weddings we have planned — Riwaaya";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage("Weddings we have planned", "Functions, courtyards and mornings");
}
