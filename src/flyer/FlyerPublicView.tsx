"use client";
/**
 * Visualização pública das páginas do flyer (dentro do site do cliente — §10 do
 * doc). Renderiza o `SlidePage` REAL (HTML/CSS, fiel — sem rasterizar) e escala
 * de forma responsiva pela largura do container. Só leitura (mode="static").
 */
import { useEffect, useRef, useState } from "react";
import { CANVAS_W, CANVAS_H } from "./constants";
import { SlidePage } from "./SlidePage";
import type { FlyerPage } from "./types";

export type FlyerPublicViewProps = {
  pages: FlyerPage[];
  /** Largura máxima do papel na tela (px). Default 760. */
  maxWidth?: number;
};

export function FlyerPublicView({ pages, maxWidth = 760 }: FlyerPublicViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const recompute = () => setWidth(Math.min(maxWidth, el.clientWidth));
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  const scale = width / CANVAS_W;
  const h = Math.round(CANVAS_H * scale);

  return (
    <div
      ref={ref}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}
    >
      {pages.map((pg, i) => (
        <div
          key={pg.id || i}
          style={{
            width,
            height: h,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(15,23,42,0.28)",
            flex: "none",
          }}
        >
          <SlidePage page={pg} scale={scale} />
        </div>
      ))}
    </div>
  );
}
