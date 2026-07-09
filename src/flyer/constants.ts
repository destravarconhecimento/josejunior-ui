/** Constantes do editor de flyers. Puro — sem React, seguro no server e client. */

/** "Papel" fixo (proporção ~A4). Todo elemento tem coordenadas absolutas aqui. */
export const CANVAS_W = 800;
export const CANVAS_H = 1132;

/** Gradiente dourado do texto (efeito da seção 5 do doc). */
export const GOLD_GRADIENT =
  "linear-gradient(180deg, #fdf3c9 0%, #e8c25a 35%, #a9782a 60%, #e8c25a 85%, #fdf3c9 100%)";
/** Cor sólida usada quando o gradiente não pode ser rasterizado (export/Satori). */
export const GOLD_SOLID = "#d8ae42";

/** Fontes disponíveis no seletor (Google Fonts já carregadas pelo app). */
export const FLYER_FONTS = [
  "Anton",
  "Oswald",
  "Bebas Neue",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Inter",
  "Roboto",
] as const;

export const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "600", label: "Semi-bold" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
] as const;

/** Versão do "seed"/documento — bump quando o shape do template mudar. */
export const FLYER_DOC_VERSION = 1;
