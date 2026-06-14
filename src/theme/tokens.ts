/**
 * Paleta do painel admin (tokens --admin-*). Cada app passa a SUA marca; a
 * estrutura/CSS é compartilhada (ver structural-css.ts). Só os valores mudam.
 */
export type AdminPalette = {
  primary: string;
  /** Primary ESCURECIDO — hover de botão primário, gradientes. */
  primaryDark: string;
  /** Cor de FUNDO escura da identidade (sidebar). Default = primaryDark. */
  dark?: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSoft: string;
  surface: string;
  surface2: string;
  border: string;
  divider: string;
  /** Fundo da página (gradiente completo). */
  bg: string;
  fontHeading: string;
  fontBody: string;
  /** Letter-spacing dos títulos (site -0.4px, sistema 0.2px). */
  headingLetterSpacing: string;
  /** Fundo do hover de nav. */
  navHover: string;
  /** Fundo do item de nav ativo. */
  navActive: string;
  /** Sombra dos cards. */
  cardShadow: string;
};

/** Monta o bloco `:root{ --admin-* }` a partir da paleta. */
export function buildAdminTokensCss(p: AdminPalette): string {
  return `:root{
  --admin-primary:${p.primary};
  --admin-primary-dark:${p.primaryDark};
  --admin-dark:${p.dark ?? p.primaryDark};
  --admin-accent:${p.accent};
  --admin-accent-soft:${p.accentSoft};
  --admin-text:${p.text};
  --admin-text-soft:${p.textSoft};
  --admin-surface:${p.surface};
  --admin-surface-2:${p.surface2};
  --admin-border:${p.border};
  --admin-divider:${p.divider};
  --admin-bg:${p.bg};
  --admin-font-heading:${p.fontHeading};
  --admin-font-body:${p.fontBody};
  --admin-heading-ls:${p.headingLetterSpacing};
  --admin-nav-hover:${p.navHover};
  --admin-nav-active:${p.navActive};
  --admin-card-shadow:${p.cardShadow};
}`;
}
