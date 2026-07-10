"use client";
/**
 * Preview AO VIVO do avatar (WYSIWYG): desenha a MESMA cena do export, num canvas
 * menor. Quando `interactive`, arrastar a foto faz pan e a roda/slider faz zoom —
 * tudo em fração do raio, então o resultado final (1024) é idêntico ao preview.
 *
 * As imagens são cacheadas por URL (ref) pra o arraste não recarregar nada; a
 * fonte é garantida uma vez por família (`ensureAvatarFont`) antes de redesenhar.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "../primitives";
import { AVATAR_LAYOUT, avatarFontWeight } from "./constants";
import {
  avatarLogoCenterFrac,
  avatarTitleAnchorFrac,
  drawAvatarScene,
  ensureAvatarFont,
  loadAvatarImage,
  type AvatarScene,
} from "./compose";
import type { AvatarConfig, AvatarFramePreset } from "./types";

/** Lado do backing-store do preview (o export usa AVATAR_RENDER_SIZE=1024). */
const PREVIEW_RENDER = 640;

export type AvatarCanvasProps = {
  config: AvatarConfig;
  title: string;
  subtitle: string;
  presets: readonly AvatarFramePreset[];
  /** Permite pan/zoom da foto arrastando (estúdio sim, card não). */
  interactive?: boolean;
  onPhotoChange?: (photo: AvatarConfig["photo"]) => void;
  /** Arrastar o NOME na prévia → nova posição (fração do lado, relativa ao centro/baseline). */
  onTitleMove?: (offset: { x: number; y: number }) => void;
  /** Arrastar a LOGO na prévia → nova posição livre (centro, fração do lado). */
  onLogoMove?: (pos: { x: number; y: number }) => void;
  /** Tamanho CSS máximo do preview (px). */
  maxSize?: number;
};

/** URLs de imagem que a config referencia (pra carregar/cachear). */
function configUrls(config: AvatarConfig): string[] {
  const urls: string[] = [];
  if (config.photoUrl) urls.push(config.photoUrl);
  if (config.frame.kind === "image") urls.push(config.frame.url);
  if (config.background.kind === "image") urls.push(config.background.url);
  if (config.logoCorner !== "none" && config.logoUrl) urls.push(config.logoUrl);
  return urls;
}

export function AvatarCanvas({
  config,
  title,
  subtitle,
  presets,
  interactive = false,
  onPhotoChange,
  onTitleMove,
  onLogoMove,
  maxSize = 380,
}: AvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imgVersion, setImgVersion] = useState(0);
  const [fontReady, setFontReady] = useState(false);

  const frameUrl = config.frame.kind === "image" ? config.frame.url : "";
  const bgUrl = config.background.kind === "image" ? config.background.url : "";
  const logoUrl = config.logoCorner !== "none" ? config.logoUrl ?? "" : "";

  // Garante a fonte da família atual antes de escrever (fillText cai no fallback
  // silencioso se a fonte não estiver carregada).
  useEffect(() => {
    let cancelled = false;
    setFontReady(false);
    ensureAvatarFont(config.font, avatarFontWeight(config.font)).then(() => {
      if (!cancelled) setFontReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [config.font]);

  // Carrega (uma vez, cacheado) as imagens que a config usa.
  useEffect(() => {
    const urls = configUrls(config);
    let cancelled = false;
    Promise.all(
      urls.map(async (u) => {
        if (cacheRef.current.has(u)) return;
        try {
          const img = await loadAvatarImage(u);
          if (!cancelled) cacheRef.current.set(u, img);
        } catch {
          /* imagem quebrada é ignorada — desenha sem ela */
        }
      }),
    ).then(() => {
      if (!cancelled) setImgVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.photoUrl, frameUrl, bgUrl, logoUrl]);

  const scene = useMemo<AvatarScene>(() => {
    const cache = cacheRef.current;
    const pick = (url: string) => cache.get(url);
    return {
      background: config.background,
      backgroundImg: bgUrl ? pick(bgUrl) : undefined,
      photoImg: config.photoUrl ? pick(config.photoUrl) : undefined,
      photo: config.photo,
      frame: config.frame,
      frameImg: frameUrl ? pick(frameUrl) : undefined,
      presets,
      logoImg: logoUrl ? pick(logoUrl) : undefined,
      logoCorner: config.logoCorner,
      logoPos: config.logoPos ?? null,
      title,
      subtitle,
      font: config.font,
      titleColor: config.titleColor,
      subtitleColor: config.subtitleColor,
      uppercase: config.uppercase,
      subtitleCurved: config.subtitleCurved ?? false,
      titleOffsetY: config.titleOffsetY ?? 0,
      titleOffsetX: config.titleOffsetX ?? 0,
      titleScale: config.titleScale ?? 1,
    };
    // imgVersion força recomputo quando uma imagem termina de carregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, title, subtitle, presets, imgVersion, bgUrl, frameUrl, logoUrl]);

  // Redesenha a cena (throttle por rAF).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    raf = requestAnimationFrame(() => drawAvatarScene(ctx, PREVIEW_RENDER, scene));
    return () => cancelAnimationFrame(raf);
  }, [scene, fontReady]);

  // ---- arraste: foto (pan), NOME e LOGO ----
  // Ref com a cena atual pra o hit-test ler a geometria mais recente sem recriar
  // os handlers a cada frame.
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  type DragState = {
    mode: "photo" | "title" | "logo";
    sx: number; // fração do lado no ponto onde pegou
    sy: number;
    bx: number; // valor base do alvo ao começar
    by: number;
  };
  const dragRef = useRef<DragState | null>(null);

  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  // Fração do lado a partir do evento (0..1 em cada eixo).
  const fracOf = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const w = rect.width || maxSize;
    const h = rect.height || maxSize;
    return { fx: (e.clientX - rect.left) / w, fy: (e.clientY - rect.top) / h };
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const sc = sceneRef.current;
      const { fx, fy } = fracOf(e);

      // 1) Logo (camada de cima) — caixa em torno do centro dela.
      const hasLogo = sc.logoCorner !== "none" && !!logoUrl;
      if (onLogoMove && hasLogo) {
        const c = avatarLogoCenterFrac(sc);
        const half = AVATAR_LAYOUT.logoWidthFrac * 0.62;
        if (Math.abs(fx - c.x) < half && Math.abs(fy - c.y) < half) {
          dragRef.current = { mode: "logo", sx: fx, sy: fy, bx: c.x, by: c.y };
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
      }

      // 2) Nome — faixa em torno da baseline do título.
      if (onTitleMove && (title || "").trim()) {
        const a = avatarTitleAnchorFrac(sc);
        const th = AVATAR_LAYOUT.titleFontFrac * (config.titleScale ?? 1);
        if (Math.abs(fx - a.x) < 0.42 && fy > a.y - th - 0.03 && fy < a.y + 0.06) {
          dragRef.current = {
            mode: "title",
            sx: fx,
            sy: fy,
            bx: config.titleOffsetX ?? 0,
            by: config.titleOffsetY ?? 0,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
      }

      // 3) Foto (pan).
      if (onPhotoChange && config.photoUrl) {
        dragRef.current = {
          mode: "photo",
          sx: fx,
          sy: fy,
          bx: config.photo.offsetX,
          by: config.photo.offsetY,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [
      interactive,
      onLogoMove,
      onTitleMove,
      onPhotoChange,
      logoUrl,
      title,
      config.titleScale,
      config.titleOffsetX,
      config.titleOffsetY,
      config.photoUrl,
      config.photo.offsetX,
      config.photo.offsetY,
      maxSize,
    ],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d) return;
      const { fx, fy } = fracOf(e);
      const dxFrac = fx - d.sx;
      const dyFrac = fy - d.sy;
      if (d.mode === "logo" && onLogoMove) {
        onLogoMove({ x: clamp(d.bx + dxFrac, 0.04, 0.96), y: clamp(d.by + dyFrac, 0.04, 0.96) });
      } else if (d.mode === "title" && onTitleMove) {
        onTitleMove({ x: clamp(d.bx + dxFrac, -0.45, 0.45), y: clamp(d.by + dyFrac, -0.4, 0.4) });
      } else if (d.mode === "photo" && onPhotoChange) {
        // fração do lado → fração do raio (÷ circleR).
        const ox = clamp(d.bx + dxFrac / AVATAR_LAYOUT.circleR, -1.5, 1.5);
        const oy = clamp(d.by + dyFrac / AVATAR_LAYOUT.circleR, -1.5, 1.5);
        onPhotoChange({ ...config.photo, offsetX: ox, offsetY: oy });
      }
    },
    [onLogoMove, onTitleMove, onPhotoChange, config.photo, maxSize],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ok */
      }
    }
  }, []);

  // ---- zoom (roda) ---- listener nativo non-passive pra poder preventDefault.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive || !onPhotoChange || !config.photoUrl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;
      const zoom = Math.max(0.5, Math.min(4, config.photo.zoom * factor));
      onPhotoChange({ ...config.photo, zoom });
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [interactive, onPhotoChange, config.photoUrl, config.photo]);

  return (
    <Box
      w="100%"
      maxW={`${maxSize}px`}
      mx="auto"
      aspectRatio={1}
      borderRadius="16px"
      overflow="hidden"
      bg="repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px"
      boxShadow="inset 0 0 0 1px var(--admin-border)"
    >
      <canvas
        ref={canvasRef}
        width={PREVIEW_RENDER}
        height={PREVIEW_RENDER}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: interactive ? "none" : "auto",
          cursor: interactive ? "grab" : "default",
        }}
      />
    </Box>
  );
}
