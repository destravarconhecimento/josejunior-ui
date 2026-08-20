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
/**
 * Porta de contexto da home ("Tenho uma clínica"). `vertical` é o SLUG do
 * registro de segmentos — é ele que vai no `?vertical=` do diagnóstico e no
 * evento de funil; `href` é a página de destino (nem sempre tem o mesmo nome).
 */
export interface SiteDoorItem {
  vertical: string;
  label: string;
  desc: string;
  href: string;
  icon?: string;
}
/** Dor concreta → o que muda, por contexto. */
export interface SitePainItem {
  vertical: string;
  label: string;
  pain: string;
  after: string;
}
/** Etapa do fluxo "uma operação rodando" (ícone + título + descrição). */
export interface SiteFlowStepItem {
  icon: string;
  title: string;
  desc: string;
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
  brand: {
    name: string;
    wordmark: string;
    role: string;
    whatsapp: string;
    /** A logo — a MESMA no site e na topbar do painel. Vazio = ícone do app. */
    logo?: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleHighlight: string;
    subtitle: string;
    /** Foto de PERFIL (seção "Sobre"). Vazio = /assets/perfil.png. */
    photo?: string;
    /**
     * Imagem de FUNDO do topo da home (hero). O layout escurece e derrete a
     * imagem no chão do tema; vazio = sem imagem, só a atmosfera do layout.
     */
    image?: string;
    /**
     * Posição do fundo quando a imagem é maior que a tela: que lado fica
     * visível. Vazio = center/top. Parallax = fundo fixo enquanto rola.
     */
    imagePosX?: "left" | "center" | "right";
    imagePosY?: "top" | "center" | "bottom";
    imageParallax?: boolean;
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
  /* ── Blocos da HOME nova (7 blocos). Renderizados por `HomeBlocks.tsx`. ── */
  /** Bloco 1 — hero de operação (topo da home). UMA CTA só (→ /diagnostico). */
  operationHero: {
    eyebrow: string;
    titleLead: string;
    /** Compatibilidade: 1ª frase quando `rotating` está vazio. */
    titleHighlight: string;
    /** Frases que giram no fim do título (o `titleLead` fica parado). */
    rotating: string[];
    subtitle: string;
    ctaLabel: string;
  };
  /** Bloco 2 — escolha de contexto (as portas). */
  contextDoors: { eyebrow: string; title: string; subtitle: string; doors: SiteDoorItem[] };
  /** Bloco 4 — dor concreta → o que muda, por contexto. */
  painToChange: { eyebrow: string; title: string; items: SitePainItem[] };
  /** Bloco 5 — uma operação rodando (mensagem → agendamento → ficha → portal). */
  operationShowcase: { eyebrow: string; title: string; subtitle: string; steps: SiteFlowStepItem[] };
  /** Bloco 6 — como a implantação acontece. Sem preço, nunca. */
  implantation: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: SiteStepItem[];
    needsTitle: string;
    needs: string[];
    note: string;
  };
  /** Bloco 7 — a mesma conversão do topo, repetida no fim. */
  diagnosticCta: { title: string; text: string; ctaLabel: string };
  /** Faixa final — convite para quem quer VENDER comigo (→ /representante). */
  representanteCta: {
    /** false = a faixa some da home (o rodapé mantém o link /representante). */
    enabled: boolean;
    eyebrow: string;
    title: string;
    text: string;
    ctaLabel: string;
  };
  socials: SiteSocialItem[];
  /**
   * Layout (tema) do site — a ROUPA. A marca (cores/fontes/logo) é outra
   * camada e vale por cima de qualquer layout. Vazio = "obsidian".
   */
  tema?: { layout?: "nocturne" | "obsidian" };
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
