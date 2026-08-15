import { services } from "@/content/services";
import { WHATSAPP_DISPLAY, site } from "@/lib/site";

/**
 * /llms.txt — a plain-text summary of who Riwaaya is and where the key pages
 * are, for AI assistants that read it before answering "which wedding planner
 * in Chandigarh" (SEO plan, 15 Aug 2026: cheap, no downside).
 *
 * A route rather than a file in /public so the URLs, the address and the list
 * of services come from the same content files as the pages — it can never
 * say something the site does not.
 */
export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.category}, led by founder ${site.founder}. A luxury and`,
    "> destination wedding planner based in Chandigarh, with an office in",
    "> Mohali, Punjab, working across India. A small number of weddings each",
    "> year, one wedding at a time — never two on the same dates.",
    "",
    "Riwaaya is riwaayat in the singular — not tradition in general, but one",
    "family's version of it. The studio finds that thread and builds the",
    "celebration around it.",
    "",
    `The eleven contracted lines of work: ${services
      .map((service) => service.title.toLowerCase())
      .join("; ")}.`,
    "",
    "## Key pages",
    "",
    `- [Home](${site.url}/): who the studio is and how a wedding is built`,
    `- [Approach](${site.url}/about): the riwaayat thesis, the four pillars and the founder`,
    `- [Destination weddings](${site.url}/destination-weddings): the destinations asked for most, with seasons and practical notes`,
    `- [Wedding venues](${site.url}/wedding-venues): venue types across India and how the shortlist is built`,
    `- [Weddings](${site.url}/gallery): functions the studio has planned`,
    `- [Enquire](${site.url}/contact): office address, WhatsApp and the enquiry form`,
    "",
    "## Contact",
    "",
    `- Email: ${site.email}`,
    `- WhatsApp: ${WHATSAPP_DISPLAY}`,
    `- Office: ${site.address.street}, ${site.address.locality}, ${site.address.region}, India`,
    ...site.socials.map((social) => `- ${social.label}: ${social.href}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
