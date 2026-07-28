/**
 * Tema de site público como DADO (não CSS). A IA e o CMS escolhem uma `vibe`
 * (ou hexes explícitos); o componente resolve pra tokens e pinta.
 *
 * Por que enum + hexes opcionais: deixar a IA escrever CSS livre dá site feio e
 * imprevisível. Deixar só cor solta dá contraste ruim. A `vibe` é um preset
 * curado (5 paletas testadas em fundo claro); os hexes são o escape hatch pra
 * quando o cliente tem cor de marca.
 *
 * O default é `institucional` — EXATAMENTE as cores que a landing de segmento
 * usava chumbadas (azul de cartório + dourado). Segmento sem tema salvo continua
 * pixel-a-pixel igual ao que estava no ar.
 */

/** Presets curados. Chave = o que a IA escolhe. */
export type SiteVibe = "institucional" | "energia" | "cuidado" | "premium" | "tech";

export type SiteTheme = {
  /** Preset de partida. Ausente = `institucional`. */
  vibe?: SiteVibe;
  /** Cor principal (hex). Vence a `vibe` quando presente. */
  primary?: string;
  /** Variante escura da principal, pros gradientes. Derivada se ausente. */
  primaryDark?: string;
  /** Cor de realce (hex). Vence a `vibe` quando presente. */
  accent?: string;
};

/** Tema já resolvido — o que os componentes consomem. */
export type ResolvedSiteTheme = {
  vibe: SiteVibe;
  primary: string;
  primaryDark: string;
  accent: string;
  /** Neutros — iguais em todas as vibes (fundo claro). */
  ink: string;
  body: string;
  soft: string;
  line: string;
  surface: string;
};

export const SITE_VIBES: Record<SiteVibe, { label: string; hint: string; primary: string; primaryDark: string; accent: string }> = {
  institucional: {
    label: "Institucional",
    hint: "Confiança e formalidade — cartório, contabilidade, advocacia, órgão público.",
    primary: "#0F4C81",
    primaryDark: "#0B3A63",
    accent: "#C08A2E",
  },
  energia: {
    label: "Energia",
    hint: "Movimento e resultado — personal trainer, academia, esporte, eventos.",
    primary: "#E11D48",
    primaryDark: "#9F1239",
    accent: "#F59E0B",
  },
  cuidado: {
    label: "Cuidado",
    hint: "Acolhimento e saúde — clínica, consultório, terapia, bem-estar, pet.",
    primary: "#0E7490",
    primaryDark: "#155E75",
    accent: "#10B981",
  },
  premium: {
    label: "Premium",
    hint: "Sofisticação e valor alto — imóveis, arquitetura, joalheria, consultoria.",
    primary: "#1E293B",
    primaryDark: "#0F172A",
    accent: "#B08D57",
  },
  tech: {
    label: "Tech",
    hint: "Inovação e automação — software, agência digital, IA, marketing.",
    primary: "#4F46E5",
    primaryDark: "#3730A3",
    accent: "#06B6D4",
  },
};

export const SITE_VIBE_NAMES = Object.keys(SITE_VIBES) as SiteVibe[];

const NEUTRALS = {
  ink: "#0F172A",
  body: "#475569",
  soft: "#64748B",
  line: "#E2E8F0",
  surface: "#F8FAFC",
} as const;

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(v: string | undefined | null): string | null {
  const s = (v ?? "").trim();
  if (!HEX.test(s)) return null;
  if (s.length === 4) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  return s.toLowerCase();
}

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Escurece um hex por um fator (0..1) — usado quando só `primary` foi informado. */
export function darken(hex: string, amount = 0.22): string {
  const norm = normalizeHex(hex);
  if (!norm) return hex;
  const [r, g, b] = channels(norm);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** `rgba()` a partir de um hex — pros fundos translúcidos (tints) das seções. */
export function tint(hex: string, alpha: number): string {
  const norm = normalizeHex(hex);
  if (!norm) return `rgba(15,76,129,${alpha})`;
  const [r, g, b] = channels(norm);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Gradiente padrão da marca (hero, botões, molduras). */
export function brandGradient(t: Pick<ResolvedSiteTheme, "primary" | "primaryDark">): string {
  return `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})`;
}

/**
 * Resolve o tema salvo em tokens completos. Sem tema → `institucional`
 * (o visual que a landing de segmento já tinha chumbado).
 */
export function resolveSiteTheme(theme?: SiteTheme | null): ResolvedSiteTheme {
  const vibe: SiteVibe = theme?.vibe && SITE_VIBES[theme.vibe] ? theme.vibe : "institucional";
  const preset = SITE_VIBES[vibe];
  const primary = normalizeHex(theme?.primary) ?? preset.primary;
  const primaryDark =
    normalizeHex(theme?.primaryDark) ??
    (normalizeHex(theme?.primary) ? darken(primary) : preset.primaryDark);
  const accent = normalizeHex(theme?.accent) ?? preset.accent;
  return { vibe, primary, primaryDark, accent, ...NEUTRALS };
}
