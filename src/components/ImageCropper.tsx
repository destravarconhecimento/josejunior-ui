"use client";

/**
 * Recorte de imagem antes do upload.
 *
 * Por que existe: os cards do site têm proporção fixa (3:4 no retrato de host e
 * de parceiro, 16:9 na capa). Quem sobe a foto manda o que tem — e o `objectFit:
 * cover` do card decide sozinho o que cortar, quase sempre cortando a cabeça da
 * pessoa. Aqui quem enquadra é quem sobe: arrasta, dá zoom, confirma.
 *
 * O que sai é um File novo (webp) com EXATAMENTE o que estava na moldura — o
 * servidor só comprime/redimensiona depois, sem recortar de novo.
 *
 * Sem dependência nova: `<canvas>` + transform CSS. A mesma conta desenha a
 * prévia e produz o recorte, então o que a pessoa vê é o que ela leva.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { Button } from "./Button";
import { Modal } from "./Modal";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** Teto do lado maior do recorte. Acima disso é peso sem ganho visível no card. */
const MAX_OUT_PX = 1600;

type Point = { x: number; y: number };

/** Limite do arrasto: a imagem nunca descola da moldura (sem faixa vazia). */
function clampOffset(offset: Point, drawn: { w: number; h: number }, frame: { w: number; h: number }): Point {
  const maxX = Math.max(0, (drawn.w - frame.w) / 2);
  const maxY = Math.max(0, (drawn.h - frame.h) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export function ImageCropper({
  open,
  file,
  aspect = 1,
  title = "Ajustar imagem",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** Arquivo escolhido no seletor. `null` = nada a recortar (modal fechada). */
  file: File | null;
  /** Proporção da moldura (largura / altura). 3/4 = retrato dos cards. */
  aspect?: number;
  title?: string;
  onCancel: () => void;
  /** Recebe um File novo já recortado — é ele que sobe. */
  onConfirm: (file: File) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ from: Point; start: Point } | null>(null);

  // Object URL da imagem escolhida — revogado ao trocar/fechar (senão vaza).
  useEffect(() => {
    if (!file) { setSrc(null); return; }
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Cada imagem nova entra centralizada e sem zoom.
  useEffect(() => {
    setImg(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (!src) return;
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = src;
  }, [src]);

  // A moldura acompanha a largura da modal (responsiva) — a altura sai do aspect.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || !open) return;
    const measure = () => {
      const w = el.clientWidth;
      setFrame({ w, h: Math.round(w / aspect) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, aspect, img]);

  // `cover`: a menor escala que preenche a moldura inteira. É o piso do zoom.
  const baseScale = img && frame.w ? Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const drawn = img ? { w: img.naturalWidth * scale, h: img.naturalHeight * scale } : { w: 0, h: 0 };

  // Zoom re-clampa o arrasto: diminuir podia deixar a imagem fora da moldura.
  useEffect(() => {
    if (!img || !frame.w) return;
    setOffset((o) => clampOffset(o, { w: img.naturalWidth * baseScale * zoom, h: img.naturalHeight * baseScale * zoom }, frame));
  }, [zoom, img, frame, baseScale]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { from: { x: e.clientX, y: e.clientY }, start: offset };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !img) return;
    setOffset(clampOffset({ x: d.start.x + (e.clientX - d.from.x), y: d.start.y + (e.clientY - d.from.y) }, drawn, frame));
  };
  const endDrag = () => { drag.current = null; };

  const confirm = useCallback(async () => {
    if (!img || !file || !frame.w) return;
    setBusy(true);
    try {
      // Da moldura de volta pra imagem original: o que está visível é um
      // retângulo de `frame/scale` px centrado em `-offset/scale`.
      const sw = frame.w / scale;
      const sh = frame.h / scale;
      const sx = (img.naturalWidth - sw) / 2 - offset.x / scale;
      const sy = (img.naturalHeight - sh) / 2 - offset.y / scale;

      const outW = Math.max(1, Math.min(Math.round(sw), MAX_OUT_PX));
      const outH = Math.max(1, Math.round(outW / aspect));
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.92));
      if (!blob) return;
      const name = file.name.replace(/\.[^.]+$/, "") || "imagem";
      onConfirm(new File([blob], `${name}.webp`, { type: "image/webp" }));
    } finally {
      setBusy(false);
    }
  }, [img, file, frame, scale, offset, aspect, onConfirm]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="lg"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button onClick={() => void confirm()} loading={busy} disabled={!img}>Usar este recorte</Button>
        </HStack>
      }
    >
      <Stack gap={4}>
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Arraste para escolher o enquadramento e use o zoom. O que estiver dentro da moldura é o que vai pro site.
        </Text>
        <Box
          ref={frameRef}
          position="relative"
          w="full"
          h={frame.h ? `${frame.h}px` : undefined}
          minH="120px"
          overflow="hidden"
          borderRadius="14px"
          bg="var(--admin-surface-2)"
          borderWidth="1px"
          borderColor="var(--admin-border)"
          style={{ cursor: img ? "grab" : "default", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {img && src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${drawn.w}px`,
                height: `${drawn.h}px`,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
          ) : (
            <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="sm" color="var(--admin-text-soft)">Carregando…</Text>
            </Box>
          )}
        </Box>
        <HStack gap={3}>
          <Text fontSize="xs" fontWeight="600" color="var(--admin-text-soft)" flexShrink={0}>Zoom</Text>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--admin-primary)" }}
            aria-label="Zoom"
          />
        </HStack>
      </Stack>
    </Modal>
  );
}
