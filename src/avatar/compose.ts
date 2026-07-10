/**
 * Motor de composição do avatar — canvas PURO (Web APIs, sem React, sem deps).
 *
 * A MESMA função `drawAvatarScene` desenha o preview ao vivo (num tamanho de
 * exibição) e o export final (em alta): tudo é medido em FRAÇÃO do lado (S), então
 * o resultado é idêntico em qualquer resolução. `composeAvatar` carrega as
 * imagens, garante a fonte e devolve o PNG final (Blob) já no tamanho pedido.
 *
 * Cuidados que custam tempo:
 *  - Fonte: `ctx.fillText` cai no fallback SILENCIOSO se a fonte não estiver
 *    carregada → sempre `ensureAvatarFont` (document.fonts.load) antes de escrever.
 *  - CORS: imagens do Blob precisam de `crossOrigin="anonymous"` ANTES do `src`,
 *    ou o canvas fica "tainted" e o `toBlob` lança. O Blob da Vercel serve
 *    `Access-Control-Allow-Origin: *`, então isso funciona.
 */
import { AVATAR_LAYOUT, AVATAR_RENDER_SIZE, avatarFontWeight } from "./constants";
import type {
  AvatarBackground,
  AvatarConfig,
  AvatarFrameChoice,
  AvatarFramePreset,
  AvatarLogoCorner,
  AvatarPhotoTransform,
} from "./types";

/** Imagem desenhável já carregada (ou nula). */
type Img = CanvasImageSource | null | undefined;

function imgW(s: CanvasImageSource): number {
  const anyS = s as { naturalWidth?: number; width?: number };
  return anyS.naturalWidth ?? anyS.width ?? 0;
}
function imgH(s: CanvasImageSource): number {
  const anyS = s as { naturalHeight?: number; height?: number };
  return anyS.naturalHeight ?? anyS.height ?? 0;
}

/** "Cena" resolvida — o que `drawAvatarScene` precisa (config + imagens prontas). */
export type AvatarScene = {
  background: AvatarBackground;
  backgroundImg?: Img;
  photoImg?: Img;
  photo: AvatarPhotoTransform;
  frame: AvatarFrameChoice;
  frameImg?: Img;
  presets: readonly AvatarFramePreset[];
  logoImg?: Img;
  logoCorner: AvatarLogoCorner;
  title: string;
  subtitle: string;
  font: string;
  titleColor: string;
  subtitleColor: string;
  uppercase: boolean;
  /** Legenda curvada acompanhando a moldura (senão reta no rodapé). */
  subtitleCurved: boolean;
  /** Ajuste fino da altura do nome (fração do lado). */
  titleOffsetY: number;
};

/** Desenha uma imagem cobrindo (object-fit: cover) o retângulo dst. */
function coverRect(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const iw = imgW(img);
  const ih = imgH(img);
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}

/** Desenha o fundo (cor/gradiente/imagem/transparente) preenchendo o quadrado. */
function drawBackground(ctx: CanvasRenderingContext2D, S: number, scene: AvatarScene): void {
  ctx.clearRect(0, 0, S, S);
  const bg = scene.background;
  if (bg.kind === "image" && scene.backgroundImg) {
    coverRect(ctx, scene.backgroundImg, 0, 0, S, S);
    return;
  }
  if (bg.kind === "color") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, S, S);
    return;
  }
  if (bg.kind === "gradient") {
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, bg.from);
    g.addColorStop(1, bg.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return;
  }
  if (bg.kind === "image") {
    // imagem pedida mas ainda não carregou → fundo neutro pra não "piscar" branco.
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, S, S);
  }
  // kind === "none": deixa transparente.
}

/** Desenha a foto recortada no círculo (cover + pan/zoom). */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  S: number,
  cx: number,
  cy: number,
  rP: number,
  scene: AvatarScene,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rP, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (scene.photoImg) {
    const iw = imgW(scene.photoImg);
    const ih = imgH(scene.photoImg);
    if (iw && ih) {
      const box = 2 * rP * Math.max(0.2, scene.photo.zoom);
      const scale = Math.max(box / iw, box / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = cx - dw / 2 + scene.photo.offsetX * rP;
      const dy = cy - dh / 2 + scene.photo.offsetY * rP;
      ctx.drawImage(scene.photoImg, dx, dy, dw, dh);
    }
  } else {
    // Sem foto ainda: disco neutro (placeholder) pra a moldura ter o que cercar.
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(cx - rP, cy - rP, 2 * rP, 2 * rP);
  }
  ctx.restore();
}

/** Desenha a moldura: anéis procedurais OU o PNG (centro transparente) da agência. */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  S: number,
  cx: number,
  cy: number,
  rP: number,
  scene: AvatarScene,
): void {
  if (scene.frame.kind === "image") {
    if (scene.frameImg) ctx.drawImage(scene.frameImg, 0, 0, S, S);
    return;
  }
  if (scene.frame.kind === "preset") {
    const preset = scene.presets.find((p) => p.id === (scene.frame as { presetId: string }).presetId);
    if (!preset) return;
    let r = rP;
    for (const ring of preset.rings) {
      const w = ring.width * S;
      if (w <= 0) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r + w / 2, 0, Math.PI * 2);
      ctx.lineWidth = w;
      // Anel "rajado": gradiente cônico dando a volta na moldura (senão cor sólida).
      const makeConic = (ctx as unknown as {
        createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
      }).createConicGradient;
      if (ring.colors && ring.colors.length > 1 && typeof makeConic === "function") {
        const g = makeConic.call(ctx, -Math.PI / 2, cx, cy);
        const stops = ring.colors;
        stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
        ctx.strokeStyle = g;
      } else {
        ctx.strokeStyle = ring.color;
      }
      ctx.stroke();
      r += w;
    }
  }
  // kind === "none": nada.
}

/** Largura total da faixa da moldura (fração do lado × S) — pra ancorar texto curvo. */
function frameBandPx(S: number, scene: AvatarScene): number {
  if (scene.frame.kind === "preset") {
    const preset = scene.presets.find((p) => p.id === (scene.frame as { presetId: string }).presetId);
    if (!preset) return 0;
    return preset.rings.reduce((sum, r) => sum + (r.width > 0 ? r.width : 0), 0) * S;
  }
  if (scene.frame.kind === "image") return S * 0.03;
  return 0;
}

/** Desenha a logo (contida) no canto configurado. */
function drawLogo(ctx: CanvasRenderingContext2D, S: number, scene: AvatarScene): void {
  if (scene.logoCorner === "none" || !scene.logoImg) return;
  const iw = imgW(scene.logoImg);
  const ih = imgH(scene.logoImg);
  if (!iw || !ih) return;
  const targetW = S * AVATAR_LAYOUT.logoWidthFrac;
  const scale = targetW / iw;
  const w = targetW;
  const h = ih * scale;
  const m = S * AVATAR_LAYOUT.logoMarginFrac;
  let x = m;
  let y = m;
  if (scene.logoCorner === "top") {
    x = (S - w) / 2;
    y = m;
  } else if (scene.logoCorner === "bottom") {
    x = (S - w) / 2;
    y = S - h - m;
  } else if (scene.logoCorner === "bottom-left") {
    x = m;
    y = S - h - m;
  } else if (scene.logoCorner === "bottom-right") {
    x = S - w - m;
    y = S - h - m;
  }
  ctx.drawImage(scene.logoImg, x, y, w, h);
}

/** Ajusta o tamanho da fonte pra caber em `maxW` (uma medição, por proporção). */
function fitFontPx(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  startPx: number,
  weight: number,
  family: string,
  minPx: number,
): number {
  ctx.font = `${weight} ${startPx}px "${family}", system-ui, sans-serif`;
  const w = ctx.measureText(text).width;
  if (w <= maxW || w === 0) return startPx;
  return Math.max(minPx, Math.floor((startPx * maxW) / w));
}

/** Desenha uma linha de texto centrada, com contorno pra legibilidade. */
function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baselineY: number,
  px: number,
  weight: number,
  family: string,
  color: string,
  letterSpacingPx: number,
): void {
  ctx.font = `${weight} ${px}px "${family}", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  // letterSpacing é opcional (nem todo browser) — protegido.
  const hasSpacing = "letterSpacing" in ctx;
  if (hasSpacing) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${letterSpacingPx}px`;
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = Math.max(2, px * 0.09);
  ctx.strokeText(text, cx, baselineY);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, baselineY);
  if (hasSpacing) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
}

/**
 * Desenha uma linha de texto CURVADA acompanhando a parte de baixo de um círculo
 * (centro cx,cy · raio radius). Lê da esquerda pra direita, em pé (as bases das
 * letras apontam pra fora). Cada glifo é posicionado e girado pela tangente.
 */
function drawTextArc(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  px: number,
  weight: number,
  family: string,
  color: string,
  letterSpacingPx: number,
): void {
  const chars = [...text];
  if (!chars.length || radius <= 0) return;
  ctx.save();
  ctx.font = `${weight} ${px}px "${family}", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  const widths = chars.map((c) => ctx.measureText(c).width + letterSpacingPx);
  const totalAngle = widths.reduce((a, b) => a + b, 0) / radius;
  // Começa na esquerda do arco de baixo e vai reduzindo o ângulo (→ direita).
  let theta = Math.PI / 2 + totalAngle / 2;
  const strokeW = Math.max(2, px * 0.09);
  for (let i = 0; i < chars.length; i++) {
    const charAngle = widths[i] / radius;
    const t = theta - charAngle / 2; // centro do glifo
    const x = cx + radius * Math.cos(t);
    const y = cy + radius * Math.sin(t);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t - Math.PI / 2);
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(chars[i], 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    theta -= charAngle;
  }
  ctx.restore();
}

/** Desenha as 2 linhas do rodapé (nome + legenda fixa, reta ou curvada). */
function drawText(ctx: CanvasRenderingContext2D, S: number, scene: AvatarScene): void {
  const cx = S / 2;
  const maxW = S * AVATAR_LAYOUT.textMaxWidth;
  const weight = avatarFontWeight(scene.font);
  const cap = (s: string) => (scene.uppercase ? s.toUpperCase() : s);

  const title = cap((scene.title || "").trim());
  if (title) {
    const px = fitFontPx(ctx, title, maxW, S * AVATAR_LAYOUT.titleFontFrac, weight, scene.font, S * 0.03);
    const baselineY = (AVATAR_LAYOUT.titleBaselineY + (scene.titleOffsetY || 0)) * S;
    drawTextLine(ctx, title, cx, baselineY, px, weight, scene.font, scene.titleColor, px * 0.01);
  }

  const subtitle = cap((scene.subtitle || "").trim());
  if (!subtitle) return;

  if (scene.subtitleCurved) {
    // Curvada: hugueia a moldura (raio = foto + faixa da moldura + folga).
    const cxCircle = S * AVATAR_LAYOUT.circleCx;
    const cyCircle = S * AVATAR_LAYOUT.circleCy;
    const rP = S * AVATAR_LAYOUT.circleR;
    const px = Math.min(
      S * AVATAR_LAYOUT.subtitleFontFrac * 1.1,
      fitFontPx(ctx, subtitle, S * 1.4, S * AVATAR_LAYOUT.subtitleFontFrac * 1.1, weight, scene.font, S * 0.02),
    );
    const arcR = rP + frameBandPx(S, scene) + px * 0.62 + S * 0.01;
    drawTextArc(ctx, subtitle, cxCircle, cyCircle, arcR, px, weight, scene.font, scene.subtitleColor, px * 0.12);
    return;
  }

  const px = fitFontPx(ctx, subtitle, maxW, S * AVATAR_LAYOUT.subtitleFontFrac, weight, scene.font, S * 0.02);
  drawTextLine(
    ctx,
    subtitle,
    cx,
    S * AVATAR_LAYOUT.subtitleBaselineY,
    px,
    weight,
    scene.font,
    scene.subtitleColor,
    px * 0.14,
  );
}

/** Desenha a cena completa num contexto de lado S (preview ou export). */
export function drawAvatarScene(ctx: CanvasRenderingContext2D, S: number, scene: AvatarScene): void {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const cx = S * AVATAR_LAYOUT.circleCx;
  const cy = S * AVATAR_LAYOUT.circleCy;
  const rP = S * AVATAR_LAYOUT.circleR;

  drawBackground(ctx, S, scene);
  drawPhoto(ctx, S, cx, cy, rP, scene);
  drawFrame(ctx, S, cx, cy, rP, scene);
  drawLogo(ctx, S, scene);
  drawText(ctx, S, scene);
  ctx.restore();
}

/** Carrega uma imagem (CORS-safe). Rejeita em erro. */
export function loadAvatarImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
    img.src = url;
  });
}

/** Carrega a imagem se a URL existir, senão devolve null (nunca lança). */
async function loadMaybe(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return null;
  try {
    return await loadAvatarImage(url);
  } catch {
    return null;
  }
}

/** Garante que a fonte está carregada antes de escrever no canvas. */
export async function ensureAvatarFont(family: string, weight: number): Promise<void> {
  try {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    await Promise.race([
      (async () => {
        await document.fonts.load(`${weight} 64px "${family}"`);
        await document.fonts.ready;
      })(),
      // Não trava a geração se a fonte demorar/falhar — cai no fallback.
      new Promise<void>((r) => setTimeout(r, 4000)),
    ]);
  } catch {
    /* fallback: browser usa a fonte padrão; o texto ainda sai. */
  }
}

function toBlobAsync(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob retornou null"))), "image/png");
  });
}

/**
 * Compõe o avatar final e devolve o PNG (Blob) no tamanho pedido. Carrega as
 * imagens da config (CORS-safe), garante a fonte, desenha em alta e faz downscale
 * pro tamanho final se preciso.
 */
export async function composeAvatar(input: {
  size: number;
  config: AvatarConfig;
  presets: readonly AvatarFramePreset[];
  title: string;
  subtitle: string;
}): Promise<{ blob: Blob; objectUrl: string; width: number }> {
  const { config } = input;
  const [photoImg, frameImg, backgroundImg, logoImg] = await Promise.all([
    loadMaybe(config.photoUrl),
    config.frame.kind === "image" ? loadMaybe(config.frame.url) : Promise.resolve(null),
    config.background.kind === "image" ? loadMaybe(config.background.url) : Promise.resolve(null),
    config.logoCorner !== "none" ? loadMaybe(config.logoUrl) : Promise.resolve(null),
  ]);

  await ensureAvatarFont(config.font, avatarFontWeight(config.font));

  const scene: AvatarScene = {
    background: config.background,
    backgroundImg,
    photoImg,
    photo: config.photo,
    frame: config.frame,
    frameImg,
    presets: input.presets,
    logoImg,
    logoCorner: config.logoCorner,
    title: input.title,
    subtitle: input.subtitle,
    font: config.font,
    titleColor: config.titleColor,
    subtitleColor: config.subtitleColor,
    uppercase: config.uppercase,
    subtitleCurved: config.subtitleCurved ?? false,
    titleOffsetY: config.titleOffsetY ?? 0,
  };

  const render = document.createElement("canvas");
  render.width = AVATAR_RENDER_SIZE;
  render.height = AVATAR_RENDER_SIZE;
  const rctx = render.getContext("2d");
  if (!rctx) throw new Error("Canvas 2D indisponível.");
  drawAvatarScene(rctx, AVATAR_RENDER_SIZE, scene);

  let out = render;
  if (input.size !== AVATAR_RENDER_SIZE) {
    const down = document.createElement("canvas");
    down.width = input.size;
    down.height = input.size;
    const dctx = down.getContext("2d");
    if (!dctx) throw new Error("Canvas 2D indisponível.");
    dctx.imageSmoothingEnabled = true;
    dctx.imageSmoothingQuality = "high";
    dctx.drawImage(render, 0, 0, input.size, input.size);
    out = down;
  }

  const blob = await toBlobAsync(out);
  return { blob, objectUrl: URL.createObjectURL(blob), width: input.size };
}
