"use client";
/**
 * Recorte de imagem (§4/§10 do doc). Mostra a imagem, um retângulo de recorte
 * arrastável/redimensionável, e ao confirmar desenha o pedaço na resolução real
 * num canvas → devolve um Blob (o pai faz o upload e troca o `src` do elemento).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";

type Rect = { x: number; y: number; w: number; h: number };

export type CropModalProps = {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
};

export function CropModal({ open, src, onClose, onCropped }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; start: Rect } | null>(null);

  // Ao carregar (ou trocar) a imagem, o recorte cobre a imagem inteira.
  const initRect = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setRect({ x: 0, y: 0, w: img.clientWidth, h: img.clientHeight });
  }, []);

  useEffect(() => {
    if (!open) setRect(null);
  }, [open]);

  const clamp = (r: Rect): Rect => {
    const img = imgRef.current;
    const maxW = img?.clientWidth ?? r.w;
    const maxH = img?.clientHeight ?? r.h;
    const w = Math.max(24, Math.min(r.w, maxW));
    const h = Math.max(24, Math.min(r.h, maxH));
    const x = Math.max(0, Math.min(r.x, maxW - w));
    const y = Math.max(0, Math.min(r.y, maxH - h));
    return { x, y, w, h };
  };

  useEffect(() => {
    if (!drag.current) return;
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (d.mode === "move") {
        setRect(clamp({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }));
      } else {
        setRect(clamp({ ...d.start, w: d.start.w + dx, h: d.start.h + dy }));
      }
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect]);

  const startDrag = (mode: "move" | "resize", e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rect) return;
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: rect };
    setRect({ ...rect }); // dispara o efeito que registra os listeners
  };

  const confirm = async () => {
    const img = imgRef.current;
    if (!img || !rect) return;
    setBusy(true);
    try {
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;
      const sx = Math.round(rect.x * scaleX);
      const sy = Math.round(rect.y * scaleY);
      const sw = Math.max(1, Math.round(rect.w * scaleX));
      const sh = Math.max(1, Math.round(rect.h * scaleY));
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png", 0.92));
      if (blob) await onCropped(blob);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recortar imagem"
      size="lg"
      footer={
        <>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button tone="primary" onClick={confirm} loading={busy} disabled={!rect}>
            Aplicar recorte
          </Button>
        </>
      }
    >
      <Text fontSize="sm" color="var(--admin-text-soft)">
        Arraste a área para posicionar e a alça no canto para ajustar o tamanho.
      </Text>
      <Box
        ref={wrapRef}
        position="relative"
        display="inline-block"
        maxW="100%"
        style={{ touchAction: "none", userSelect: "none", lineHeight: 0 }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={src}
            alt=""
            crossOrigin="anonymous"
            onLoad={initRect}
            draggable={false}
            style={{ maxWidth: "100%", maxHeight: "60vh", display: "block", borderRadius: 8 }}
          />
        ) : null}
        {rect ? (
          <div
            onPointerDown={(e) => startDrag("move", e)}
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              border: "2px solid #4c8bf5",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
              cursor: "move",
              boxSizing: "border-box",
            }}
          >
            <div
              onPointerDown={(e) => startDrag("resize", e)}
              style={{
                position: "absolute",
                right: -8,
                bottom: -8,
                width: 18,
                height: 18,
                background: "#4c8bf5",
                border: "2px solid #fff",
                borderRadius: 4,
                cursor: "nwse-resize",
              }}
            />
          </div>
        ) : null}
      </Box>
    </Modal>
  );
}
