import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

export const alt = "Weddings held in the old way, made new — Riwaaya";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage("Weddings held in the old way, made new");
}
