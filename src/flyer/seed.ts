/** Fábrica de elementos + template inicial do flyer (a partir da marca do tenant). */
import { CANVAS_W, CANVAS_H, FLYER_DOC_VERSION } from "./constants";
import type {
  FlyerBrand,
  FlyerDocument,
  FlyerImageElement,
  FlyerPage,
  FlyerShapeElement,
  FlyerTextElement,
} from "./types";

/** id curto e único o suficiente (client/runtime — Math.random/Date OK aqui). */
export function flyerId(prefix = "el"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function createTextElement(patch: Partial<FlyerTextElement> = {}): FlyerTextElement {
  return {
    id: flyerId("tx"),
    type: "text",
    x: 80, y: 80, w: 640, h: 120,
    text: "Texto",
    fontFamily: "Montserrat",
    fontSize: 56,
    fontWeight: "700",
    color: "#ffffff",
    gradient: false,
    align: "left",
    italic: false,
    lineHeight: 1.15,
    letterSpacing: 0,
    ...patch,
  };
}

export function createImageElement(patch: Partial<FlyerImageElement> = {}): FlyerImageElement {
  return {
    id: flyerId("img"),
    type: "image",
    x: 120, y: 300, w: 560, h: 560,
    src: null,
    radius: 16,
    shadow: true,
    ...patch,
  };
}

export function createShapeElement(patch: Partial<FlyerShapeElement> = {}): FlyerShapeElement {
  return {
    id: flyerId("sh"),
    type: "shape",
    x: 120, y: 900, w: 560, h: 120,
    fill: "#ffffff",
    borderColor: "#000000",
    borderWidth: 0,
    radius: 999,
    shadow: true,
    ...patch,
  };
}

/** Uma página em branco com o fundo escuro da marca + logo (se houver). */
export function blankPage(brand: FlyerBrand): FlyerPage {
  const dark = brand.darkColor?.trim() || brand.primaryColor || "#0b1220";
  const elements: FlyerPage["elements"] = [];
  // Logo global (isLogo) — trocar num lugar troca em todas as páginas.
  elements.push(
    createImageElement({
      x: (CANVAS_W - 240) / 2,
      y: 64,
      w: 240,
      h: 120,
      src: brand.logoUrl?.trim() || null,
      radius: 0,
      shadow: false,
      isLogo: true,
    }),
  );
  return { id: flyerId("pg"), background: { type: "color", value: dark }, elements };
}

/** Template inicial ("modelo") de um flyer novo, já com a cara da marca. */
export function seedFlyerDocument(brand: FlyerBrand): FlyerDocument {
  const dark = brand.darkColor?.trim() || brand.primaryColor || "#0b1220";
  const accent = brand.accentColor?.trim() || brand.secondaryColor?.trim() || brand.primaryColor || "#22c55e";
  const heading = brand.fontHeading?.trim() || "Anton";
  const body = brand.fontBody?.trim() || "Montserrat";

  const elements: FlyerPage["elements"] = [
    createImageElement({
      x: (CANVAS_W - 240) / 2, y: 72, w: 240, h: 110,
      src: brand.logoUrl?.trim() || null,
      radius: 0, shadow: false, isLogo: true,
    }),
    createTextElement({
      x: 80, y: 260, w: CANVAS_W - 160, h: 200,
      text: brand.name || "Seu título aqui",
      fontFamily: heading, fontSize: 88, fontWeight: "900",
      gradient: true, align: "center", lineHeight: 1.0,
    }),
    createTextElement({
      x: 100, y: 500, w: CANVAS_W - 200, h: 120,
      text: "Uma chamada curta e direta para o seu público.",
      fontFamily: body, fontSize: 34, fontWeight: "600",
      color: "#e6e9f2", align: "center", lineHeight: 1.25,
    }),
    createShapeElement({
      x: (CANVAS_W - 420) / 2, y: 940, w: 420, h: 96,
      fill: accent, borderWidth: 0, radius: 999, shadow: true,
    }),
    createTextElement({
      x: (CANVAS_W - 420) / 2, y: 966, w: 420, h: 60,
      text: "Fale conosco",
      fontFamily: body, fontSize: 30, fontWeight: "700",
      color: "#ffffff", align: "center", lineHeight: 1.1,
    }),
  ];

  return {
    version: FLYER_DOC_VERSION,
    pages: [{ id: flyerId("pg"), background: { type: "color", value: dark }, elements }],
  };
}

/** Duplica um elemento com um leve deslocamento e novo id. */
export function cloneElementShifted<T extends { id: string; x: number; y: number }>(el: T): T {
  const prefix = el.id.split("_")[0] || "el";
  return { ...el, id: flyerId(prefix), x: el.x + 24, y: el.y + 24 };
}
