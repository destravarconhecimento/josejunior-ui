/**
 * `SlidePage` — renderiza UMA página do flyer a partir dos dados (§3 do doc). É
 * PURO e sem hooks (RSC-safe): serve pro canvas do editor, pras miniaturas E pra
 * página pública dentro do site. O "papel" é fixo (CANVAS_W×CANVAS_H) e a
 * visualização escala via `transform: scale(scale)`.
 *
 * `mode="edit"` liga a moldura de seleção (handles + toolbar DENTRO dos limites
 * do elemento — nunca fora, senão o overflow:hidden do canvas corta o botão de
 * excluir; ver §4/§12 do doc). Os handlers são opcionais (undefined no server).
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { CANVAS_W, CANVAS_H, GOLD_GRADIENT, GOLD_SOLID } from "./constants";
import type { FlyerElement, FlyerPage } from "./types";

export type SlideMode = "static" | "edit";

export type SlidePageProps = {
  page: FlyerPage;
  scale: number;
  mode?: SlideMode;
  selectedId?: string | null;
  /** Export/rasterização: troca o gradiente dourado por cor sólida (§5). */
  goldFallback?: boolean;
  onElementPointerDown?: (id: string, e: ReactPointerEvent) => void;
  onElementDoubleClick?: (id: string) => void;
  onResizePointerDown?: (id: string, e: ReactPointerEvent) => void;
  onDuplicateEl?: (id: string) => void;
  onDeleteEl?: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
  onBackgroundPointerDown?: () => void;
};

function boxStyle(el: FlyerElement): CSSProperties {
  return { position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h };
}

function textFillStyle(gradient: boolean, color: string, goldFallback: boolean): CSSProperties {
  if (!gradient) return { color };
  if (goldFallback) return { color: GOLD_SOLID };
  return {
    backgroundImage: GOLD_GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

export function SlidePage(props: SlidePageProps) {
  const {
    page, scale, mode = "static", selectedId, goldFallback = false,
    onElementPointerDown, onElementDoubleClick, onResizePointerDown,
    onDuplicateEl, onDeleteEl, onBringForward, onSendBackward, onBackgroundPointerDown,
  } = props;
  const editable = mode === "edit";

  const bg = page.background;
  const stageStyle: CSSProperties = {
    position: "relative",
    width: CANVAS_W,
    height: CANVAS_H,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    overflow: "hidden",
    background: bg.type === "image" && bg.image ? `#000 url(${bg.image}) center/cover no-repeat` : bg.value,
    flex: "none",
  };
  // counter-escala pra moldura de edição ficar do mesmo tamanho na tela.
  const inv = scale > 0 ? 1 / scale : 1;

  return (
    <div style={stageStyle} onPointerDown={editable ? onBackgroundPointerDown : undefined}>
      {page.elements.map((el) => {
        const selected = editable && selectedId === el.id;
        const wrapper: CSSProperties = {
          ...boxStyle(el),
          cursor: editable ? "move" : "default",
          outline: selected ? "2px solid #4c8bf5" : "none",
          outlineOffset: 0,
          userSelect: "none",
        };
        const handlePointerDown = editable && onElementPointerDown
          ? (e: ReactPointerEvent) => onElementPointerDown(el.id, e)
          : undefined;
        const dblClick = editable && onElementDoubleClick ? () => onElementDoubleClick(el.id) : undefined;

        return (
          <div key={el.id} style={wrapper} onPointerDown={handlePointerDown} onDoubleClick={dblClick}>
            {el.type === "text" && (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <div
                  style={{
                    width: "100%",
                    fontFamily: `"${el.fontFamily}", system-ui, sans-serif`,
                    fontSize: el.fontSize,
                    fontWeight: el.fontWeight as CSSProperties["fontWeight"],
                    fontStyle: el.italic ? "italic" : "normal",
                    textAlign: el.align,
                    lineHeight: el.lineHeight,
                    letterSpacing: el.letterSpacing,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...textFillStyle(el.gradient, el.color, goldFallback),
                  }}
                >
                  {el.text}
                </div>
              </div>
            )}

            {el.type === "image" &&
              (el.src ? (
                <img
                  src={el.src}
                  alt=""
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: el.radius,
                    boxShadow: el.shadow ? "0 18px 40px rgba(0,0,0,0.35)" : "none",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
              ) : editable ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed rgba(255,255,255,0.5)",
                    borderRadius: el.radius,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 20,
                    textAlign: "center",
                    padding: 12,
                  }}
                >
                  {el.isLogo ? "Logo — clique 2× p/ enviar" : "Imagem — clique 2× p/ enviar"}
                </div>
              ) : null)}

            {el.type === "shape" && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: el.fill,
                  border: el.borderWidth > 0 ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
                  borderRadius: el.radius,
                  boxShadow: el.shadow ? "0 18px 40px rgba(0,0,0,0.28)" : "none",
                }}
              />
            )}

            {selected && (
              <>
                {/* Toolbar do elemento — DENTRO dos limites (top-right), contra-escalada. */}
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    display: "flex",
                    gap: 4,
                    transform: `scale(${inv})`,
                    transformOrigin: "top right",
                    zIndex: 5,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ToolBtn label="Trazer p/ frente" onClick={() => onBringForward?.(el.id)}>▲</ToolBtn>
                  <ToolBtn label="Enviar p/ trás" onClick={() => onSendBackward?.(el.id)}>▼</ToolBtn>
                  <ToolBtn label="Duplicar" onClick={() => onDuplicateEl?.(el.id)}>⧉</ToolBtn>
                  <ToolBtn label="Excluir" danger onClick={() => onDeleteEl?.(el.id)}>✕</ToolBtn>
                </div>
                {/* Alça de redimensionar — canto inferior direito, contra-escalada. */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onResizePointerDown?.(el.id, e);
                  }}
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 18,
                    height: 18,
                    background: "#4c8bf5",
                    border: "2px solid #fff",
                    borderRadius: 4,
                    cursor: "nwse-resize",
                    transform: `scale(${inv})`,
                    transformOrigin: "bottom right",
                    zIndex: 5,
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToolBtn(props: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        color: "#fff",
        background: props.danger ? "#e5484d" : "rgba(17,24,39,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {props.children}
    </button>
  );
}
