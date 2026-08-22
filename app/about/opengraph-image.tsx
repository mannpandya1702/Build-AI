import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

export const alt = "Riwaaya is riwaayat, in the singular — Riwaaya";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage("Riwaaya is riwaayat, in the singular", "The studio and its founder");
}
