/**
 * Modelo de dados do Editor de Flyers (o "documento"). É o MESMO shape guardado
 * na coluna jsonb `flyers.document` (apps/site/src/server/db/schema.ts) — os dois
 * são estruturalmente idênticos de propósito (o pacote não pode importar do app).
 * Se mexer aqui, espelhe lá.
 *
 * Diferença proposital do protótipo (editor-flyers-docs.md): imagens guardam a
 * URL do Blob em `src` (nunca base64) — o JSON fica leve e a URL é compartilhável.
 */

export type FlyerBackground =
  | { type: "color"; value: string; image?: string }
  | { type: "image"; value: string; image: string };

export type FlyerTextElement = {
  id: string;
  type: "text";
  x: number; y: number; w: number; h: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string; // '400' | '600' | '700' | '900'
  color: string; // cor sólida (ignorada se gradient=true)
  gradient: boolean; // efeito dourado
  align: "left" | "center" | "right";
  italic: boolean;
  lineHeight: number;
  letterSpacing: number;
};

export type FlyerImageElement = {
  id: string;
  type: "image";
  x: number; y: number; w: number; h: number;
  src: string | null; // URL do Blob
  radius: number;
  shadow: boolean;
  isLogo?: boolean; // logo "global" (um upload → todas as páginas)
};

export type FlyerShapeElement = {
  id: string;
  type: "shape";
  x: number; y: number; w: number; h: number;
  fill: string;
  borderColor: string;
  borderWidth: number;
  radius: number;
  shadow: boolean;
};

export type FlyerElement = FlyerTextElement | FlyerImageElement | FlyerShapeElement;

export type FlyerPage = {
  id: string;
  background: FlyerBackground;
  elements: FlyerElement[];
};

export type FlyerDocument = {
  version: number;
  pages: FlyerPage[];
};

/** Marca do tenant que semeia cores/logo/fontes do flyer (vem do CMS/landing). */
export type FlyerBrand = {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  darkColor?: string;
  fontHeading?: string;
  fontBody?: string;
  whatsapp?: string;
  siteUrl?: string;
};

/**
 * Comparação "antes e depois" (módulo Evoluções) disponível para o editor puxar
 * pro flyer. O app só passa isto quando o tenant tem o módulo `evolucoes` ligado;
 * o editor insere as duas fotos + título/subtítulo num clique.
 */
export type FlyerComparison = {
  id: number;
  title: string;
  subtitle: string | null;
  beforeUrl: string;
  /** Foto do "durante" (opcional); quando existe, o flyer insere 3 fotos. */
  duringUrl: string | null;
  afterUrl: string;
};

/** Linha resumida de flyer para a galeria/lista. */
export type FlyerSummary = {
  id: number;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  /** 1ª página serializada — a galeria renderiza o preview ao vivo (sem raster). */
  page: FlyerPage | null;
  published: boolean;
  updatedAt: string;
  pageCount: number;
};
