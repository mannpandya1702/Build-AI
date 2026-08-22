import { founder } from "@/content/about";
import { destinations } from "@/content/destinations";
import { services } from "@/content/services";
import { venueRegions } from "@/content/venues";
import { WHATSAPP_NUMBER, site } from "@/lib/site";

/**
 * JSON-LD. LocalBusiness sits in the root layout; Event schema is emitted per
 * service page so each one describes what it actually organises.
 */

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${site.url}/#business`,
    name: site.name,
    legalName: site.legalName,
    alternateName: site.alternateNames,
    slogan: site.tagline,
    founder: { "@type": "Person", name: site.founder },
    description: site.description,
    url: site.url,
    telephone: `+${WHATSAPP_NUMBER}`,
    email: site.email,
    // The generated home card, not the old static file — one image, always in
    // step with the brand, and the only one guaranteed to exist.
    image: `${site.url}/opengraph-image`,
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      // Omitted rather than guessed while the PIN is unconfirmed — a wrong
      // postcode in LocalBusiness is worse for local search than none.
      ...(site.address.postalCode ? { postalCode: site.address.postalCode } : {}),
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    areaServed: site.cities.map((city) => ({ "@type": "City", name: city })),
    sameAs: site.socials.map((social) => social.href),
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.summary,
        url: `${site.url}/services/${service.slug}`,
      },
    })),
  };
}

/**
 * Event schema for a service. These are services that organise events rather
 * than scheduled events with a fixed date, so `eventSchedule` is omitted and
 * the organiser relationship carries the meaning.
 */
export function eventSchema(slug: string) {
  const service = services.find((item) => item.slug === slug);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${service.title} by ${site.name}`,
    description: service.intro,
    url: `${site.url}/services/${service.slug}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: {
      "@type": "Organization",
      name: site.legalName,
      url: site.url,
    },
    location: site.cities.map((city) => ({
      "@type": "Place",
      name: city,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "IN",
      },
    })),
    image: `${site.url}/services/${service.slug}/opengraph-image`,
  };
}

/**
 * Service schema for each of the eleven lines of work, with `provider`
 * pointing back at the business node. Emitted alongside the Event schema on
 * each service page — the Event says what kind of occasion it organises, this
 * says it is a service line of this business.
 */
export function serviceSchema(slug: string) {
  const service = services.find((item) => item.slug === slug);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${site.url}/services/${slug}#service`,
    name: service.title,
    serviceType: service.title,
    description: service.summary,
    url: `${site.url}/services/${slug}`,
    provider: { "@id": `${site.url}/#business` },
  };
}

/**
 * The destination weddings page describes a service with a defined coverage
 * area, so it is typed as a Service with an areaServed list rather than an
 * Event — there is no date attached to it.
 */
export function destinationServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${site.url}/destination-weddings#service`,
    name: "Destination wedding planning",
    serviceType: "Destination wedding planning",
    description:
      "End-to-end planning for weddings held away from home: venue recce and shortlist, rooming lists, guest movement, permissions and an on-site team that travels with the family.",
    url: `${site.url}/destination-weddings`,
    provider: { "@id": `${site.url}/#business` },
    areaServed: destinations.map((destination) => ({
      "@type": "Place",
      name: destination.name,
      address: {
        "@type": "PostalAddress",
        addressRegion: destination.region,
        addressCountry: "IN",
      },
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Destinations",
      itemListElement: destinations.map((destination) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `Wedding planning in ${destination.name}`,
          description: destination.blurb,
        },
      })),
    },
  };
}

/**
 * The venue hub. Typed the same way as the destination service — a Service
 * with an areaServed, because there is no date attached to it — with the
 * regions as the offer catalogue.
 */
export function venueServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${site.url}/wedding-venues#service`,
    name: "Wedding venue selection",
    serviceType: "Wedding venue selection and booking",
    description:
      "Venue shortlisting, site visits and contract negotiation for weddings across India. Rooms counted before capacity, kitchen and access checked before the shortlist, and no commission taken from any property.",
    url: `${site.url}/wedding-venues`,
    provider: { "@id": `${site.url}/#business` },
    areaServed: site.cities.map((city) => ({ "@type": "City", name: city })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Venues by region",
      itemListElement: venueRegions.map((region) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `Wedding venues in ${region.title}`,
          description: region.cities,
          url: `${site.url}/wedding-venues#${region.id}`,
        },
      })),
    },
  };
}

/**
 * FAQPage. Google will only surface one FAQ block per page, so this is emitted
 * only where a page renders genuinely distinct questions — the destinations
 * and venues pages — rather than on every route.
 */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * The founder, as a Person. Worth its own node: the studio is one person, and
 * "Bhumi Sandhu" is a query the site should answer.
 */
export function founderSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site.url}/about#founder`,
    name: founder.name,
    jobTitle: "Founder & Director",
    description: founder.paragraphs[0],
    worksFor: { "@id": `${site.url}/#business` },
    url: `${site.url}/about`,
    sameAs: site.socials.map((social) => social.href),
  };
}

/**
 * The site itself, as an entity. What this buys: Google associating the name
 * "Riwaaya" (and the alternate names) with this URL as a *site*, which is a
 * step toward the brand query showing a proper site card rather than a bare
 * link. Cheap, standard, and referenced by the page-level nodes below.
 */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    alternateName: site.alternateNames,
    inLanguage: "en-IN",
    publisher: { "@id": `${site.url}/#business` },
  };
}

/**
 * Typed page nodes for the two pages Google has a specific vocabulary for.
 * An AboutPage and a ContactPage are explicit signals about which page holds
 * the founder story and which holds the phone number — exactly the two things
 * a brand-query result panel wants to link.
 */
export function webPageSchema(
  type: "AboutPage" | "ContactPage",
  name: string,
  pagePath: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${site.url}${pagePath}#webpage`,
    url: `${site.url}${pagePath}`,
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${site.url}/#website` },
    about: { "@id": `${site.url}/#business` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${site.url}${crumb.path}`,
    })),
  };
}
