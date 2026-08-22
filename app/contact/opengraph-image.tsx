import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

export const alt = "Start the conversation — Riwaaya";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage("Start the conversation", "WhatsApp, email or the enquiry form");
}
