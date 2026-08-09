import { services } from "@/content/services";
import { WHATSAPP_NUMBER, site } from "@/lib/site";

/**
 * JSON-LD. LocalBusiness sits in the root layout; Event schema is emitted per
 * service page so each one describes what it actually organises.
 */

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.url}/#business`,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: `+${WHATSAPP_NUMBER}`,
    email: site.email,
    image: `${site.url}/og.png`,
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
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
      name: site.name,
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
    image: `${site.url}/og.png`,
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
