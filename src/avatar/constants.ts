/** Constantes do Gerador de Avatares. Puro — sem React, seguro server+client. */
import type {
  AvatarBackground,
  AvatarBackgroundSpread,
  AvatarConfig,
  AvatarFramePreset,
  AvatarPreset,
  AvatarRecipe,
  AvatarSettings,
  AvatarSize,
} from "./types";

/** Tamanhos finais oferecidos (px, quadrado). */
export const AVATAR_SIZES: readonly AvatarSize[] = [1024, 512] as const;

/** Lado em que o canvas SEMPRE compõe (qualidade). 512 é um downscale disto. */
export const AVATAR_RENDER_SIZE = 1024;

/**
 * Fontes do seletor do nome — display fonts do Google. ATENÇÃO: o painel só linka
 * Hanken/Newsreader, então estas NÃO estão carregadas por padrão. O componente
 * injeta o próprio <link> (via `avatarFontsHref`) e ESPERA `document.fonts.load`
 * antes de escrever no canvas — senão o `fillText` cai no fallback em silêncio.
 */
export const AVATAR_FONTS = [
  { family: "Anton", weight: 400, label: "Anton (impacto)" },
  { family: "Bebas Neue", weight: 400, label: "Bebas Neue (condensada)" },
  { family: "Archivo Black", weight: 400, label: "Archivo Black" },
  { family: "Oswald", weight: 700, label: "Oswald" },
  { family: "Montserrat", weight: 800, label: "Montserrat (black)" },
  { family: "Poppins", weight: 700, label: "Poppins" },
  { family: "Teko", weight: 700, label: "Teko" },
  { family: "Righteous", weight: 400, label: "Righteous" },
  { family: "Alfa Slab One", weight: 400, label: "Alfa Slab One (slab)" },
  { family: "Fjalla One", weight: 400, label: "Fjalla One" },
  { family: "Staatliches", weight: 400, label: "Staatliches" },
  { family: "Bungee", weight: 400, label: "Bungee (urbana)" },
  { family: "Titan One", weight: 400, label: "Titan One (gorda)" },
  { family: "Luckiest Guy", weight: 400, label: "Luckiest Guy (cartoon)" },
  { family: "Passion One", weight: 700, label: "Passion One" },
  { family: "Squada One", weight: 400, label: "Squada One" },
  { family: "Sigmar One", weight: 400, label: "Sigmar One" },
  { family: "Rammetto One", weight: 400, label: "Rammetto One" },
] as const;

export type AvatarFont = (typeof AVATAR_FONTS)[number];

/** Peso da família (default 700 se a família não estiver na lista). */
export function avatarFontWeight(family: string): number {
  return AVATAR_FONTS.find((f) => f.family === family)?.weight ?? 700;
}

/** URL do stylesheet Google Fonts com TODAS as famílias/pesos do seletor. */
export function avatarFontsHref(): string {
  const families = AVATAR_FONTS.map(
    (f) => `family=${encodeURIComponent(f.family).replace(/%20/g, "+")}:wght@${f.weight}`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Molduras "preset" — anéis concêntricos (de dentro pra fora) desenhados no
 * canvas. O primeiro é o mais colado na foto. `width` = fração do lado (S).
 */
export const AVATAR_FRAME_PRESETS: readonly AvatarFramePreset[] = [
  {
    id: "rasta",
    label: "Rasta (verde·amarelo·vermelho)",
    rings: [
      { color: "#149a4b", width: 0.02 },
      { color: "#f2c500", width: 0.02 },
      { color: "#e0311d", width: 0.02 },
    ],
  },
  {
    id: "gold",
    label: "Dourado",
    rings: [
      { color: "#0b1220", width: 0.01 },
      { color: "#e8c25a", width: 0.028 },
    ],
  },
  {
    id: "white",
    label: "Branco",
    rings: [{ color: "#ffffff", width: 0.032 }],
  },
  {
    id: "neon",
    label: "Neon",
    rings: [
      { color: "#050505", width: 0.012 },
      { color: "#39ff14", width: 0.026 },
    ],
  },
  {
    id: "fina",
    label: "Fina (linha)",
    rings: [{ color: "#ffffff", width: 0.008 }],
  },
  {
    id: "dupla",
    label: "Dupla (dois fios)",
    rings: [
      { color: "#ffffff", width: 0.007 },
      { color: "rgba(0,0,0,0)", width: 0.012 },
      { color: "#ffffff", width: 0.007 },
    ],
  },
  {
    id: "solida",
    label: "Sólida (faixa)",
    rings: [{ color: "#0b1220", width: 0.036 }],
  },
  {
    id: "rajada",
    label: "Rajada (colorida)",
    rings: [
      {
        color: "#e0311d",
        width: 0.034,
        colors: ["#e0311d", "#f2c500", "#149a4b", "#2563eb", "#7c3aed", "#e0311d"],
      },
    ],
  },
] as const;

/**
 * Geometria da composição, em frações do lado (S). O círculo é GRANDE e centrado:
 * a moldura chega até a borda do quadrado (`outerRFrac`) e a foto ocupa o miolo
 * (raio = outer − faixa da moldura). O fundo e o nome vivem DENTRO do círculo — o
 * nome sobrepõe a base da foto com um escurecimento (scrim) pra legibilidade.
 */
export const AVATAR_LAYOUT = {
  /** Centro do círculo — no meio exato do quadrado. */
  circleCx: 0.5,
  circleCy: 0.5,
  /** Raio EXTERNO da moldura (quase encostando na borda do quadrado). */
  outerRFrac: 0.49,
  /** Raio nominal da foto (fallback do pan/zoom; o real desconta a faixa da moldura). */
  circleR: 0.45,
  /** Rodapé do NOME, sobreposto à base da foto (fração do lado). */
  titleBaselineY: 0.82,
  /** Rodapé da LEGENDA fixa, logo abaixo do nome. */
  subtitleBaselineY: 0.915,
  textMaxWidth: 0.82,
  titleFontFrac: 0.12,
  subtitleFontFrac: 0.048,
  logoWidthFrac: 0.2,
  logoMarginFrac: 0.05,
} as const;

/** Paleta do seletor de cor (fundo/texto). */
export const AVATAR_COLORS = [
  "#050505", "#0b1220", "#111827", "#1f2937", "#374151", "#ffffff",
  "#e0311d", "#f2c500", "#149a4b", "#e8c25a", "#39ff14", "#7c3aed",
  "#2563eb", "#0ea5e9", "#ec4899", "#f97316", "#dc2626", "#16a34a",
] as const;

/**
 * Config default de um avatar novo, semeada com uma RECEITA de padrão + marca.
 * Aceita tanto o `AvatarSettings` (padrão da agência) quanto um `AvatarPreset`
 * escolhido — os dois são `AvatarRecipe`.
 */
export function defaultAvatarConfig(settings: AvatarRecipe, brandLogoUrl?: string): AvatarConfig {
  const framePresetId = settings.defaultFramePresetId || AVATAR_FRAME_PRESETS[0].id;
  // Moldura padrão: se a agência definiu uma PNG enviada, o avatar novo já nasce
  // com ela; senão cai no preset. (É o "padrão da agência" — criar = só nome+foto.)
  const defaultFrameUrl = (settings.defaultFrameUrl || "").trim();
  const frame: AvatarConfig["frame"] = defaultFrameUrl
    ? { kind: "image", url: defaultFrameUrl }
    : { kind: "preset", presetId: framePresetId };
  const bgSpread: AvatarBackgroundSpread = settings.defaultBackgroundSpread ?? "circle";
  const bgColor = settings.defaultBackgroundColor || "#0b1220";
  const background: AvatarConfig["background"] = settings.backgroundUrl
    ? { kind: "image", url: settings.backgroundUrl, spread: bgSpread, baseColor: bgColor }
    : { kind: "color", color: bgColor, spread: bgSpread };
  const logoUrl = (settings.logoUrl || brandLogoUrl || "").trim() || null;
  // O "padrão da agência" é herdado POR INTEIRO: cor, caixa, posição, tamanho —
  // tudo que a agência salvou já vem pronto no avatar novo (só falta foto + nome).
  return {
    photoUrl: null,
    photo: { offsetX: 0, offsetY: 0, zoom: 1 },
    frame,
    background,
    logoUrl,
    logoCorner: settings.defaultLogoCorner ?? (logoUrl ? "top" : "none"),
    logoPos: settings.defaultLogoPos ?? null,
    font: settings.defaultFont || AVATAR_FONTS[0].family,
    titleColor: settings.defaultTitleColor || "#ffffff",
    subtitleColor: settings.defaultSubtitleColor || "#ffffff",
    uppercase: settings.defaultUppercase ?? true,
    subtitleCurved: settings.defaultSubtitleCurved ?? false,
    titleOffsetY: settings.defaultTitleOffsetY ?? 0,
    titleOffsetX: settings.defaultTitleOffsetX ?? 0,
    titleScale: settings.defaultTitleScale ?? 1,
  };
}

/** Settings default (agência ainda não configurou). */
export const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  frames: [],
  logoUrl: "",
  backgroundUrl: "",
  fixedSubtitle: "",
  defaultFont: AVATAR_FONTS[0].family,
  defaultBackgroundColor: "#0b1220",
  defaultFramePresetId: AVATAR_FRAME_PRESETS[0].id,
  presets: [],
};

/** Lê a cobertura de um fundo (padrão "circle"; transparente também é "circle"). */
export function bgSpreadOf(bg: AvatarBackground): AvatarBackgroundSpread {
  return bg.kind === "none" ? "circle" : bg.spread ?? "circle";
}

/** Aplica a cobertura a um fundo, preservando o resto (no-op se transparente). */
export function withBgSpread(bg: AvatarBackground, spread: AvatarBackgroundSpread): AvatarBackground {
  return bg.kind === "none" ? bg : { ...bg, spread };
}

/** Extrai só os campos de RECEITA (sem frames/presets) de um settings ou padrão. */
export function recipeOf(r: AvatarRecipe): AvatarRecipe {
  return {
    logoUrl: r.logoUrl,
    backgroundUrl: r.backgroundUrl,
    fixedSubtitle: r.fixedSubtitle,
    defaultFont: r.defaultFont,
    defaultBackgroundColor: r.defaultBackgroundColor,
    defaultBackgroundSpread: r.defaultBackgroundSpread,
    defaultFramePresetId: r.defaultFramePresetId,
    defaultFrameUrl: r.defaultFrameUrl,
    defaultLogoCorner: r.defaultLogoCorner,
    defaultLogoPos: r.defaultLogoPos,
    defaultTitleColor: r.defaultTitleColor,
    defaultSubtitleColor: r.defaultSubtitleColor,
    defaultUppercase: r.defaultUppercase,
    defaultSubtitleCurved: r.defaultSubtitleCurved,
    defaultTitleScale: r.defaultTitleScale,
    defaultTitleOffsetY: r.defaultTitleOffsetY,
    defaultTitleOffsetX: r.defaultTitleOffsetX,
  };
}

/**
 * Lista de PADRÕES a partir do settings. Se a agência ainda não criou padrões
 * nomeados, sintetiza UM ("Padrão 1") a partir da receita do topo — assim os
 * dados de padrão ÚNICO legado viram automaticamente o primeiro padrão. Garante
 * sempre ≥ 1 padrão.
 */
export function avatarPresets(settings: AvatarSettings): AvatarPreset[] {
  const list = (settings.presets ?? []).filter(
    (p): p is AvatarPreset => !!p && typeof p.id === "string" && !!p.id,
  );
  if (list.length > 0) return list;
  return [{ id: settings.defaultPresetId || "principal", name: "Padrão 1", ...recipeOf(settings) }];
}

/**
 * Resolve QUAL padrão usar: o de `id` pedido, senão o marcado como inicial
 * (`defaultPresetId`), senão o primeiro. Nunca devolve `undefined`.
 */
export function resolveAvatarPreset(settings: AvatarSettings, id?: string): AvatarPreset {
  const list = avatarPresets(settings);
  return (
    (id ? list.find((p) => p.id === id) : undefined) ??
    list.find((p) => p.id === settings.defaultPresetId) ??
    list[0]
  );
}
