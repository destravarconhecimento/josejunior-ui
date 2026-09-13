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
  titleTransform?: string;
  titleLetterSpacing?: string;
  /**
   * Liga o MODO ESCURO do painel: o claro segue exatamente esta paleta e, sob
   * `:root.dark`, os campos NEUTROS (texto, superfícies, borda, fundo, sombra)
   * passam a ler os tokens semânticos do Chakra (`createPainelSystem`). A cor
   * de MARCA (primary/accent/dark, nav, fontes) continua vindo daqui nos dois
   * modos. Opt-in: paleta que não liga não muda em nada.
   */
  dualMode?: boolean;
};

/**
 * Neutros do `--admin-*` lidos dos tokens semânticos do Chakra (só no escuro).
 *
 * O seletor leva `.dark body` junto do `:root.dark` de propósito: a condição
 * escura do Chakra compila para `.dark &`, e o `&` no topo do arquivo global
 * pode resolver tanto para o PRÓPRIO `.dark` quanto para um DESCENDENTE dele.
 * Se fosse só `:root.dark`, na segunda leitura o `var(--chakra-colors-*)` seria
 * substituído no `<html>`, onde só existe o valor CLARO — o painel "escuro"
 * sairia com superfície branca. Declarando também no `<body>`, que é
 * descendente em qualquer leitura, o valor certo é o que todo mundo herda.
 */
const NEUTROS_NO_ESCURO = `:root.dark,.dark body{
  --admin-text:var(--chakra-colors-fg);
  --admin-text-soft:var(--chakra-colors-fg-muted);
  --admin-surface:var(--chakra-colors-bg-panel);
  --admin-surface-2:var(--chakra-colors-bg-inset);
  --admin-border:var(--chakra-colors-border);
  --admin-divider:var(--chakra-colors-border-muted);
  --admin-bg:var(--chakra-colors-bg-subtle);
  --admin-card-shadow:var(--chakra-shadows-card);
}`;

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
  --admin-title-transform:${p.titleTransform ?? "none"};
  --admin-title-ls:${p.titleLetterSpacing ?? "var(--admin-heading-ls, -0.2px)"};
}${p.dualMode ? `
${NEUTROS_NO_ESCURO}` : ""}`;
}
