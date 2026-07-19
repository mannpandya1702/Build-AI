/**
 * site.config.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for ALL user-facing content on the site.
 *
 * To swap in a real client: edit the values in `siteConfig` below. You should
 * never need to touch a component file to rebrand this site. Every string,
 * phone number, service, material, process step, trust badge, and footer line
 * is read from here.
 *
 * Copy voice: short, confident, human. Written like a Texas roofer who takes
 * pride in the work. No em dashes anywhere. No corporate filler.
 *
 * The content below is realistic PLACEHOLDER data for a fictional Dallas firm
 * ("Lone Star Roofing Co."). Replace with the real client's details.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Home,
  CloudHail,
  FileCheck,
  Wrench,
  Search,
  Fence,
} from 'lucide-react'

export interface HeroPhase {
  /** Full headline. The `accent` substring is rendered in the script font. */
  headline: string
  /** The single word inside `headline` shown in the signature script font. */
  accent: string
  sub: string
}

export interface Service {
  icon: LucideIcon
  title: string
  description: string
}

export interface Material {
  name: string
  tier: string
  /** Hex used for the swatch. */
  swatch: string
  blurb: string
  bestFor: string
}

export interface ProcessStep {
  title: string
  description: string
}

export interface TrustItem {
  label: string
  detail: string
}

export interface DamageType {
  value: string
  label: string
}

export interface SiteConfig {
  company: {
    name: string
    logoMark: string
    tagline: string
    phone: string
    phoneHref: string
    email: string
    hours: string
  }
  serviceAreas: string[]
  serviceAreaLine: string
  hero: {
    reticleLabel: string
    phases: HeroPhase[]
    sideCaptions: string[]
  }
  services: Service[]
  materials: Material[]
  process: ProcessStep[]
  trust: TrustItem[]
  cta: {
    heading: string
    accent: string
    sub: string
    damageTypes: DamageType[]
    successTitle: string
    successBody: string
  }
  footer: {
    blurb: string
    socials: { label: string; href: string }[]
    legalLinks: { label: string; href: string }[]
    license: string
  }
}

export const siteConfig: SiteConfig = {
  company: {
    name: 'Lone Star Roofing Co.',
    logoMark: 'LONE STAR ROOFING',
    tagline: 'Dallas roofs built to take a beating and keep their looks.',
    phone: '(214) 555-0148',
    phoneHref: 'tel:+12145550148',
    email: 'hello@lonestarroofing.example',
    hours: 'Mon to Sat, 7am to 7pm',
  },

  serviceAreas: ['Dallas', 'Plano', 'Frisco', 'McKinney', 'Allen', 'Richardson'],
  serviceAreaLine: 'Serving Dallas, Plano, Frisco, McKinney and the wider DFW metroplex.',

  hero: {
    reticleLabel: 'SCROLL TO EXPLORE',
    // One headline per scroll phase. The `accent` word renders in script.
    phases: [
      {
        headline: 'It begins as a frame.',
        accent: 'frame',
        sub: 'Every roof starts with structure. We get it right.',
      },
      {
        headline: 'Built in layers.',
        accent: 'layers',
        sub: 'Decking, underlayment, flashing. The parts you never see are the ones that hold.',
      },
      {
        headline: 'Made to outlast the storm.',
        accent: 'storm',
        sub: 'Dallas hail is relentless. Your roof should not blink.',
      },
    ],
    sideCaptions: [
      'Licensed & insured',
      'GAF certified installers',
      'Storm restoration specialists',
    ],
  },

  services: [
    {
      icon: Home,
      title: 'Roof Replacement',
      description: 'A full tear off and rebuild done right the first time, with a clean site at the end of every day.',
    },
    {
      icon: CloudHail,
      title: 'Storm & Hail Damage Restoration',
      description: 'Fast response after North Texas storms. We document the damage and put your roof back to new.',
    },
    {
      icon: FileCheck,
      title: 'Insurance Claim Assistance',
      description: 'We meet your adjuster on the roof and speak their language so your claim gets handled fairly.',
    },
    {
      icon: Wrench,
      title: 'Roof Repair & Leak Fixes',
      description: 'Missing shingles, a stubborn leak, worn flashing. We find the cause and fix it, not just cover it.',
    },
    {
      icon: Search,
      title: 'Free Roof Inspections',
      description: 'A thorough top to bottom look with honest photos. No pressure, no scare tactics, just the facts.',
    },
    {
      icon: Fence,
      title: 'Gutters & Fascia',
      description: 'The details that protect the rest of the house. Seamless gutters, solid fascia, clean lines.',
    },
  ],

  materials: [
    {
      name: 'Architectural Asphalt Shingle',
      tier: 'The everyday workhorse',
      swatch: '#3b3f46',
      blurb: 'Impact rated shingles that shrug off hail and look sharp on any Dallas street. The value most homeowners land on.',
      bestFor: 'Most homes across DFW',
    },
    {
      name: 'Standing Seam Metal',
      tier: 'The long hauler',
      swatch: '#8a8f96',
      blurb: 'Concealed fasteners, clean vertical lines, and a lifespan measured in decades. Reflects the Texas heat and sheds water fast.',
      bestFor: 'Modern builds and low slopes',
    },
    {
      name: 'Clay & Concrete Tile',
      tier: 'The statement',
      swatch: '#b05c3c',
      blurb: 'Timeless Spanish and Mediterranean character with serious staying power. Heavy, handsome, and built to last generations.',
      bestFor: 'Stucco and estate homes',
    },
  ],

  process: [
    {
      title: 'Free Inspection',
      description: 'We climb up, take photos, and tell you straight what your roof needs. No obligation.',
    },
    {
      title: 'Estimate & Insurance Help',
      description: 'A clear written estimate. If a claim makes sense, we walk it with your adjuster.',
    },
    {
      title: 'Professional Install',
      description: 'Our own crews, not day labor. Protected landscaping and a clean site every evening.',
    },
    {
      title: 'Warranty & Follow-up',
      description: 'Manufacturer and workmanship coverage, plus a follow-up to make sure it is right.',
    },
  ],

  // NOTE: The items below are common US roofing trust anchors used as
  // PLACEHOLDERS. Replace with the real client's licensing, certifications,
  // warranty terms, financing partners, and verified review numbers before
  // launch. Do not publish unverified claims.
  trust: [
    { label: 'Licensed & Insured', detail: 'Texas (placeholder license #)' },
    { label: 'GAF / Owens Corning', detail: 'Certified installers' },
    { label: 'Warranty', detail: 'Manufacturer + workmanship' },
    { label: 'Financing', detail: 'Flexible plans available' },
    { label: '4.9 stars', detail: 'Across verified reviews' },
    { label: '3,000+ roofs', detail: 'Completed across Dallas' },
  ],

  cta: {
    heading: 'Book your free roof inspection.',
    accent: 'free',
    sub: 'Tell us a little about your roof. We will call to set a time that works for you, usually same week.',
    damageTypes: [
      { value: 'hail', label: 'Hail' },
      { value: 'wind', label: 'Wind' },
      { value: 'leak', label: 'Leak' },
      { value: 'age', label: 'Age' },
      { value: 'other', label: 'Other' },
    ],
    successTitle: 'Got it. Thank you.',
    successBody: 'Your request is in. A Lone Star roofer will reach out shortly to lock in your inspection.',
  },

  footer: {
    blurb: 'A Dallas roofing crew that shows up, does the work right, and stands behind it.',
    socials: [
      { label: 'Facebook', href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'Google', href: '#' },
    ],
    legalLinks: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Warranty', href: '#' },
    ],
    license: 'Placeholder license and bonding details go here. Insured in the State of Texas.',
  },
}

export default siteConfig
