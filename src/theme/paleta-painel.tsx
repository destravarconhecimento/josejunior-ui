import type { ReactNode } from "react";
import type { AdminPalette } from "./tokens";
import { AdminThemeShell } from "./AdminThemeShell";

const FONTE_CORPO = "var(--font-painel, Archivo), 'Segoe UI', system-ui, sans-serif";
const FONTE_TITULO =
  "var(--font-painel-titulo, 'Archivo Narrow'), var(--font-painel, Archivo), 'Segoe UI', system-ui, sans-serif";

const marca = (pct: number) => `color-mix(in srgb, var(--chakra-colors-brand-solid) ${pct}%, transparent)`;

export const PALETA_PAINEL: AdminPalette = {
  primary: "var(--chakra-colors-brand-solid)",
  primaryDark: "var(--chakra-colors-brand-emphasized)",
  dark: "var(--chakra-colors-graphite-900)",
  accent: "var(--chakra-colors-brand-fg)",
  accentSoft: marca(30),
  text: "var(--chakra-colors-fg)",
  textSoft: "var(--chakra-colors-fg-muted)",
  surface: "var(--chakra-colors-bg-panel)",
  surface2: "var(--chakra-colors-bg-inset)",
  border: "var(--chakra-colors-border)",
  divider: "var(--chakra-colors-border-muted)",
  bg: "var(--chakra-colors-bg-canvas)",
  fontHeading: FONTE_TITULO,
  fontBody: FONTE_CORPO,
  headingLetterSpacing: "-0.2px",
  navHover: marca(5),
  navActive: marca(9),
  cardShadow: "var(--chakra-shadows-card)",
  titleTransform: "uppercase",
  titleLetterSpacing: "0.01em",
  fontesDoTema: true,
};

export const PAINEL_FONTES_HREF =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&family=Archivo+Narrow:wght@400..700&display=swap";

const FONTES_CSS = `:root{--chakra-fonts-body:${FONTE_CORPO};--chakra-fonts-heading:${FONTE_TITULO};--chakra-fonts-numeric:${FONTE_TITULO};}`;

const MARCA_CSS = `:root{
  --chakra-colors-brand-50:#f1effe;--chakra-colors-brand-100:#e4e0fd;--chakra-colors-brand-200:#cbc4fb;
  --chakra-colors-brand-300:#aba0f9;--chakra-colors-brand-400:#8a7dfa;--chakra-colors-brand-500:#7567f8;
  --chakra-colors-brand-600:#5b4ae8;--chakra-colors-brand-700:#4838c4;--chakra-colors-brand-800:#392d9b;
  --chakra-colors-brand-900:#2f267c;--chakra-colors-brand-950:#1c1650;
  --chakra-colors-brand-solid:#7062ed;--chakra-colors-brand-contrast:white;--chakra-colors-brand-fg:#5b4ae8;
  --chakra-colors-brand-muted:#e4e0fd;--chakra-colors-brand-subtle:#f1effe;--chakra-colors-brand-emphasized:#5b4ae8;
  --chakra-colors-brand-focus-ring:#7567f8;
}`;

export function PainelPadraoShell({
  children,
  fontsHref,
  marcaClara,
}: {
  children: ReactNode;
  fontsHref?: string;
  marcaClara?: boolean;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTES_CSS + (marcaClara ? MARCA_CSS : "") }} />
      <AdminThemeShell palette={PALETA_PAINEL} fontsHref={fontsHref}>
        {children}
      </AdminThemeShell>
    </>
  );
}
