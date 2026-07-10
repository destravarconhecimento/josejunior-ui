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
import { drawAvatarScene, ensureAvatarFont, loadAvatarImage, type AvatarScene } from "./compose";
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
      title,
      subtitle,
      font: config.font,
      titleColor: config.titleColor,
      subtitleColor: config.subtitleColor,
      uppercase: config.uppercase,
      subtitleCurved: config.subtitleCurved ?? false,
      titleOffsetY: config.titleOffsetY ?? 0,
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

  // ---- pan (arraste) ----
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number; w: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive || !onPhotoChange || !config.photoUrl) return;
      const rect = e.currentTarget.getBoundingClientRect();
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: config.photo.offsetX,
        oy: config.photo.offsetY,
        w: rect.width || maxSize,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [interactive, onPhotoChange, config.photoUrl, config.photo.offsetX, config.photo.offsetY, maxSize],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || !onPhotoChange) return;
      // px CSS → fração do lado → fração do raio (dividindo por circleR).
      const dxFrac = (e.clientX - d.x) / d.w / AVATAR_LAYOUT.circleR;
      const dyFrac = (e.clientY - d.y) / d.w / AVATAR_LAYOUT.circleR;
      const clamp = (n: number) => Math.max(-1.5, Math.min(1.5, n));
      onPhotoChange({ ...config.photo, offsetX: clamp(d.ox + dxFrac), offsetY: clamp(d.oy + dyFrac) });
    },
    [onPhotoChange, config.photo],
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
          touchAction: interactive && config.photoUrl ? "none" : "auto",
          cursor: interactive && config.photoUrl ? "grab" : "default",
        }}
      />
    </Box>
  );
}
