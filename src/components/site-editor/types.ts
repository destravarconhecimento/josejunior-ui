/**
 * Contrato do editor "Meu site" (a landing institucional do José — josejunior.dev).
 * É a FONTE ÚNICA da forma do conteúdo editável; o app (apps/sistema) valida com
 * zod contra ESTES tipos (o `editableLandingSchema` casa campo a campo). O molde é
 * o `MailClient`: componente PURO, dados + callbacks por props, sem action embutida.
 *
 * Espelha `apps/web/src/content/types.ts` (quem renderiza). Ícones são NOMES de
 * string (ver `icon-options.ts`).
 */

export type SiteProjectStatus = "live" | "beta" | "wip";
export type SiteSocialKind = "whatsapp" | "instagram" | "linkedin" | "email";

export interface SiteIconItem {
  icon: string;
  title: string;
  desc: string;
}
export interface SiteStepItem {
  number: string;
  title: string;
  desc: string;
}
export interface SiteProjectItem {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: SiteProjectStatus;
  stack: string[];
  color: string;
  website?: string;
}
export interface SiteTimelineItem {
  year: string;
  title: string;
  desc: string;
}
export interface SiteTestimonialItem {
  name: string;
  role: string;
  quote: string;
}
export interface SiteHighlightItem {
  icon: string;
  title: string;
  unit?: string;
  subtitle: string;
}
export interface SiteContactInfoItem {
  icon: string;
  label: string;
  value: string;
}
export interface SiteSkillItem {
  name: string;
  level: number;
  color: string;
}
export interface SiteSocialItem {
  kind: SiteSocialKind;
  href: string;
  label: string;
}
export interface SiteStatItem {
  value: string;
  label: string;
}

/** Cores/fontes do site — mesmo vocabulário do tema dos tenants. Tudo opcional. */
export interface SiteThemeContent {
  primaryColor?: string;
  accentColor?: string;
  darkColor?: string;
  fontHeading?: string;
  fontBody?: string;
}

/** Forma COMPLETA do conteúdo editável do "Meu site". */
export interface SiteIdentityContent {
  brand: { name: string; wordmark: string; role: string; whatsapp: string };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleHighlight: string;
    subtitle: string;
    photo?: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    stats: SiteStatItem[];
  };
  benefits: { eyebrow: string; title: string; items: SiteIconItem[] };
  howItWorks: { eyebrow: string; title: string; steps: SiteStepItem[] };
  services: { eyebrow: string; title: string; items: SiteIconItem[] };
  projects: { eyebrow: string; title: string; subtitle: string; items: SiteProjectItem[] };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    roleCardText: string;
    bio: string;
    highlights: SiteHighlightItem[];
    contactInfo: SiteContactInfoItem[];
    skills: SiteSkillItem[];
  };
  trajectory: { eyebrow: string; title: string; items: SiteTimelineItem[] };
  testimonials: { eyebrow: string; title: string; items: SiteTestimonialItem[] };
  finalCta: { title: string; text: string; whatsappLabel: string; projectsLabel: string };
  contact: { eyebrow: string; title: string; subtitle: string; email: string };
  socials: SiteSocialItem[];
  seo: { title: string; description: string };
  theme?: SiteThemeContent;
}

/** Rastreamento/marketing do site (GA4 + Meta Pixel + Conversions API). */
export interface SiteMarketing {
  ga4MeasurementId: string;
  ga4Enabled: boolean;
  facebookPixelId: string;
  facebookPixelEnabled: boolean;
  facebookConversionsApiEnabled: boolean;
  facebookAccessToken: string;
  facebookTestEventCode: string;
}

/** Resultado padronizado das actions de salvar (mesmo shape do app). */
export type SiteSaveResult = { ok: true } | { ok: false; error: string };

/** Slot de upload (o app injeta o botão que faz o upload no Blob). */
export interface SiteImageUploadSlot {
  folder: string;
  label: string;
  onUploaded: (url: string) => void;
}
