"use client";
/**
 * Editor visual do flyer (o coração — §2/§4/§6 do doc). Client puro; guarda o
 * documento no histórico (undo/redo), calcula a escala a partir da largura REAL
 * do container (ResizeObserver), e faz seleção/arrastar/redimensionar por cima do
 * `SlidePage`. As ações de servidor (salvar/publicar/exportar/upload) chegam por
 * props — o editor nunca fala com o backend direto.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Copy, Download, FileText, Globe, ImagePlus, Images, Link2, Plus, Redo2,
  Save, Square, Trash2, Type, Undo2,
} from "lucide-react";
import { Box, Flex, Heading, HStack, SimpleGrid, Stack, Text } from "../primitives";
import { Input } from "../components/controls";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { toaster } from "../components/Toast";
import { CANVAS_W, CANVAS_H } from "./constants";
import { legendaDaFoto, linhasDaEvolucao } from "../evolucao/types";
import { useHistory, type SetMode } from "./history";
import {
  blankPage, cloneElementShifted, createImageElement, createShapeElement, createTextElement, flyerId,
} from "./seed";
import { SlidePage } from "./SlidePage";
import { Inspector } from "./Inspector";
import { CropModal } from "./CropModal";
import type { FlyerBrand, FlyerComparison, FlyerDocument, FlyerElement, FlyerPage } from "./types";

const RIGHT_W = 340;

export type FlyerSaveData = { title: string; document: FlyerDocument };

export type FlyerEditorProps = {
  brand: FlyerBrand;
  initialTitle: string;
  initialDocument: FlyerDocument;
  published: boolean;
  publicUrl: string | null;
  onBack: () => void;
  onSave: (data: FlyerSaveData) => Promise<void>;
  /** Sobe arquivo/blob e devolve a URL pública. */
  onUpload: (file: File | Blob, filename: string) => Promise<string>;
  onPublish: (next: boolean, data: FlyerSaveData) => Promise<{ url: string; published: boolean }>;
  onExport: (kind: "png" | "pdf", data: FlyerSaveData & { pageIndex: number }) => Promise<void>;
  /** Comparações antes/depois (módulo Evoluções) — só chega quando o módulo está ligado. */
  comparisons?: FlyerComparison[];
  /**
   * Abre a arte de Instagram da evolução (feed 4:5 ou story). Quando não vem, o
   * editor só insere a comparação na página — o botão "Arte" some.
   */
  onArteEvolucao?: (cmp: FlyerComparison) => void;
};

/** Miniatura do seletor: primeira, do meio e última — o resto vira contador. */
function miniaturas(c: FlyerComparison) {
  const fotos = c.photos;
  if (fotos.length <= 3) return fotos;
  return [fotos[0], fotos[Math.floor(fotos.length / 2)], fotos[fotos.length - 1]];
}

function deepClonePage(pg: FlyerPage): FlyerPage {
  return {
    id: flyerId("pg"),
    background: { ...pg.background },
    elements: pg.elements.map((el) => ({ ...el, id: flyerId(el.id.split("_")[0] || "el") })),
  };
}

export function FlyerEditor(props: FlyerEditorProps) {
  const { brand } = props;
  const hist = useHistory<FlyerDocument>(props.initialDocument);
  const doc = hist.state;

  const [title, setTitle] = useState(props.initialTitle);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [published, setPublished] = useState(props.published);
  const [publicUrl, setPublicUrl] = useState<string | null>(props.publicUrl);
  const [cropOpen, setCropOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const cropTargetRef = useRef<string | null>(null);
  const comparisons = props.comparisons ?? [];
  const onArteEvolucao = props.onArteEvolucao;

  const pageIndexRef = useRef(0);
  pageIndexRef.current = Math.min(pageIndex, doc.pages.length - 1);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pendingUpload = useRef<{ kind: "add" | "replace" | "logo"; id?: string } | null>(null);
  const dragRef = useRef<
    | null
    | { kind: "move" | "resize"; id: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }
  >(null);

  const page = doc.pages[pageIndexRef.current] ?? doc.pages[0];
  const selected = page?.elements.find((e) => e.id === selectedId) ?? null;

  // ---- escala pela largura REAL do container (gotcha §7 do doc) ----
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const recompute = () => {
      const availW = el.clientWidth - 32;
      const availH = (typeof window !== "undefined" ? window.innerHeight : 900) - 220;
      const s = Math.max(0.15, Math.min(availW / CANVAS_W, availH / CANVAS_H, 0.85));
      setScale(s);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  // ---- mutações do documento ----
  const patchElement = useCallback(
    (id: string, patch: Partial<FlyerElement>, opts?: SetMode) => {
      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) =>
            i === pi
              ? { ...pg, elements: pg.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as FlyerElement) : el)) }
              : pg,
          ),
        };
      }, opts);
    },
    [hist],
  );

  const setLogoSrc = useCallback(
    (src: string) => {
      hist.set((d) => ({
        ...d,
        pages: d.pages.map((pg) => ({
          ...pg,
          elements: pg.elements.map((el) => (el.type === "image" && el.isLogo ? { ...el, src } : el)),
        })),
      }));
    },
    [hist],
  );

  const setBackground = useCallback(
    (value: string, opts?: SetMode) => {
      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) =>
            i === pi ? { ...pg, background: { type: "color", value } } : pg,
          ),
        };
      }, opts);
    },
    [hist],
  );

  const addElement = useCallback(
    (el: FlyerElement) => {
      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) => (i === pi ? { ...pg, elements: [...pg.elements, el] } : pg)),
        };
      });
      setSelectedId(el.id);
    },
    [hist],
  );

  const removeElement = useCallback(
    (id: string) => {
      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) => (i === pi ? { ...pg, elements: pg.elements.filter((e) => e.id !== id) } : pg)),
        };
      });
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [hist],
  );

  /**
   * Insere uma comparação inteira na página atual num único passo de histórico:
   * as fotos com o rótulo em cima + título/subtítulo. De 2 a 5 fotos: até 3 ficam
   * numa fileira só; 4 vira 2+2 e 5 vira 3+2 (`linhasDaEvolucao`), pra foto nunca
   * ficar espremida. O usuário reposiciona/edita cada peça depois.
   */
  const insertComparison = useCallback(
    (cmp: FlyerComparison) => {
      const M = 60; // margem lateral
      const total = cmp.photos.length;
      if (!total) return;
      const stages = cmp.photos.map((foto, i) => ({
        src: foto.url,
        label: legendaDaFoto(foto, i, total).toUpperCase(),
        accent: i === total - 1,
      }));

      const rows = linhasDaEvolucao(total);
      const maxPorLinha = Math.max(...rows);
      const GAP = maxPorLinha >= 3 ? 28 : 40; // aperta um pouco com 3 na fileira
      const LABEL_H = 44;
      const imgW = Math.round((CANVAS_W - M * 2 - GAP * (maxPorLinha - 1)) / maxPorLinha);
      const imgH = Math.round((imgW * 4) / 3); // proporção 3:4
      const topo = 340 - (rows.length - 1) * 150; // sobe o bloco quando há 2 fileiras
      const linhaH = LABEL_H + 8 + imgH;
      const fontLabel = maxPorLinha >= 3 ? 22 : 26;

      const els: FlyerElement[] = [];
      let idx = 0;
      let y = topo;
      for (const n of rows) {
        const larguraLinha = n * imgW + (n - 1) * GAP;
        const x0 = Math.round((CANVAS_W - larguraLinha) / 2); // fileira curta fica centrada
        for (let i = 0; i < n && idx < stages.length; i++, idx++) {
          const s = stages[idx];
          const x = x0 + i * (imgW + GAP);
          els.push(
            createTextElement({
              x, y, w: imgW, h: LABEL_H,
              text: s.label, fontSize: fontLabel, fontWeight: "700",
              color: s.accent ? "#ffffff" : "#e6e9f2", align: "center", letterSpacing: 2, lineHeight: 1.1,
            }),
            createImageElement({ x, y: y + LABEL_H + 8, w: imgW, h: imgH, src: s.src, radius: 18, shadow: true }),
          );
        }
        y += linhaH + GAP;
      }

      const titleY = y - GAP + 28;
      els.push(
        createTextElement({
          x: M, y: titleY, w: CANVAS_W - M * 2, h: 90,
          text: cmp.title || "Evolução", fontSize: 52, fontWeight: "900",
          color: "#ffffff", align: "center", lineHeight: 1.05,
        }),
      );
      if (cmp.subtitle && cmp.subtitle.trim()) {
        els.push(
          createTextElement({
            x: M + 20, y: titleY + 96, w: CANVAS_W - (M + 20) * 2, h: 80,
            text: cmp.subtitle, fontSize: 30, fontWeight: "600",
            color: "#e6e9f2", align: "center", lineHeight: 1.25,
          }),
        );
      }

      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) => (i === pi ? { ...pg, elements: [...pg.elements, ...els] } : pg)),
        };
      });
      setSelectedId(els[els.length - 1].id);
      setCompareOpen(false);
    },
    [hist],
  );

  const duplicateElement = useCallback(
    (id: string) => {
      const src = doc.pages[pageIndexRef.current]?.elements.find((e) => e.id === id);
      if (!src) return;
      const clone = cloneElementShifted(src);
      addElement(clone);
    },
    [doc, addElement],
  );

  const reorderElement = useCallback(
    (id: string, dir: 1 | -1) => {
      hist.set((d) => {
        const pi = pageIndexRef.current;
        return {
          ...d,
          pages: d.pages.map((pg, i) => {
            if (i !== pi) return pg;
            const idx = pg.elements.findIndex((e) => e.id === id);
            if (idx < 0) return pg;
            const j = idx + dir;
            if (j < 0 || j >= pg.elements.length) return pg;
            const arr = pg.elements.slice();
            const [it] = arr.splice(idx, 1);
            arr.splice(j, 0, it);
            return { ...pg, elements: arr };
          }),
        };
      });
    },
    [hist],
  );

  // ---- páginas ----
  const addPage = () => {
    hist.set((d) => ({ ...d, pages: [...d.pages, blankPage(brand)] }));
    setPageIndex(doc.pages.length);
    setSelectedId(null);
  };
  const duplicatePage = () => {
    const src = doc.pages[pageIndexRef.current];
    if (!src) return;
    const clone = deepClonePage(src);
    hist.set((d) => {
      const arr = d.pages.slice();
      arr.splice(pageIndexRef.current + 1, 0, clone);
      return { ...d, pages: arr };
    });
    setPageIndex(pageIndexRef.current + 1);
    setSelectedId(null);
  };
  const deletePage = () => {
    if (doc.pages.length <= 1) return;
    const pi = pageIndexRef.current;
    hist.set((d) => ({ ...d, pages: d.pages.filter((_, i) => i !== pi) }));
    setPageIndex(Math.max(0, pi - 1));
    setSelectedId(null);
  };

  // ---- drag / resize (transient — 1 snapshot por gesto) ----
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const s = scaleRef.current || 1;
      const dx = (e.clientX - d.sx) / s;
      const dy = (e.clientY - d.sy) / s;
      if (d.kind === "move") {
        patchElement(d.id, { x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) }, { transient: true });
      } else {
        patchElement(d.id, { w: Math.max(20, Math.round(d.ow + dx)), h: Math.max(20, Math.round(d.oh + dy)) }, { transient: true });
      }
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        hist.endTransient();
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [patchElement, hist]);

  const startGesture = (kind: "move" | "resize", id: string, e: React.PointerEvent) => {
    const el = doc.pages[pageIndexRef.current]?.elements.find((x) => x.id === id);
    if (!el) return;
    setSelectedId(id);
    hist.beginTransient();
    dragRef.current = { kind, id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h };
  };

  // ---- teclado ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) hist.redo();
        else hist.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        hist.redo();
        return;
      }
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeElement(selectedId);
        return;
      }
      if (selectedId && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const cur = doc.pages[pageIndexRef.current]?.elements.find((x) => x.id === selectedId);
        if (!cur) return;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        patchElement(selectedId, { x: cur.x + dx, y: cur.y + dy }, { coalesce: "nudge" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hist, selectedId, removeElement, patchElement, doc]);

  // ---- upload ----
  const openFilePicker = (action: { kind: "add" | "replace" | "logo"; id?: string }) => {
    pendingUpload.current = action;
    fileRef.current?.click();
  };
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const action = pendingUpload.current;
    e.target.value = "";
    if (!file || !action) return;
    setUploading(true);
    try {
      const url = await props.onUpload(file, file.name);
      if (action.kind === "add") {
        addElement(createImageElement({ x: (CANVAS_W - 480) / 2, y: 320, w: 480, h: 480, src: url }));
      } else if (action.kind === "logo") {
        setLogoSrc(url);
      } else if (action.id) {
        const el = doc.pages[pageIndexRef.current]?.elements.find((x) => x.id === action.id);
        if (el && el.type === "image" && el.isLogo) setLogoSrc(url);
        else patchElement(action.id, { src: url });
      }
    } catch (err) {
      toaster.create({ title: "Falha no upload", description: String(err), type: "error" });
    } finally {
      setUploading(false);
      pendingUpload.current = null;
    }
  };

  const onCropped = async (blob: Blob) => {
    const id = cropTargetRef.current;
    if (!id) return;
    setUploading(true);
    try {
      const url = await props.onUpload(blob, `${id}-crop.png`);
      const el = doc.pages[pageIndexRef.current]?.elements.find((x) => x.id === id);
      if (el && el.type === "image" && el.isLogo) setLogoSrc(url);
      else patchElement(id, { src: url });
    } catch (err) {
      toaster.create({ title: "Falha ao recortar", description: String(err), type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // ---- servidor ----
  const saveData = (): FlyerSaveData => ({ title: title.trim() || "Sem título", document: doc });
  const doSave = async () => {
    setSaving(true);
    try {
      await props.onSave(saveData());
      toaster.create({ title: "Flyer salvo", type: "success" });
    } catch (err) {
      toaster.create({ title: "Falha ao salvar", description: String(err), type: "error" });
    } finally {
      setSaving(false);
    }
  };
  const doPublish = async (next: boolean) => {
    setPublishing(true);
    try {
      await props.onSave(saveData());
      const r = await props.onPublish(next, saveData());
      setPublished(r.published);
      setPublicUrl(r.url);
      toaster.create({ title: next ? "Página publicada" : "Publicação removida", type: "success" });
    } catch (err) {
      toaster.create({ title: "Falha ao publicar", description: String(err), type: "error" });
    } finally {
      setPublishing(false);
    }
  };
  const doExport = async (kind: "png" | "pdf") => {
    setExporting(kind);
    try {
      await props.onSave(saveData());
      await props.onExport(kind, { ...saveData(), pageIndex: pageIndexRef.current });
    } catch (err) {
      toaster.create({ title: "Falha ao exportar", description: String(err), type: "error" });
    } finally {
      setExporting(null);
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toaster.create({ title: "Link copiado", type: "success" });
    } catch {
      toaster.create({ title: publicUrl, type: "info" });
    }
  };

  const scaledW = Math.round(CANVAS_W * scale);
  const scaledH = Math.round(CANVAS_H * scale);
  const pageThumbScale = 84 / CANVAS_W;

  const inspectorEl = useMemo(() => selected, [selected]);

  return (
    <Stack gap={3} h="100%">
      {/* Barra superior */}
      <Flex align="center" gap={3} flexWrap="wrap">
        <Button tone="ghost" size="sm" onClick={props.onBack}>
          <ArrowLeft size={16} /> Voltar
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do flyer"
          maxW="280px"
          fontWeight="600"
        />
        <HStack gap={1}>
          <Button tone="ghost" size="sm" onClick={hist.undo} disabled={!hist.canUndo} title="Desfazer (Ctrl+Z)">
            <Undo2 size={16} />
          </Button>
          <Button tone="ghost" size="sm" onClick={hist.redo} disabled={!hist.canRedo} title="Refazer (Ctrl+Shift+Z)">
            <Redo2 size={16} />
          </Button>
        </HStack>
        <Box flex="1" />
        <Button tone="outline" size="sm" onClick={() => doExport("png")} loading={exporting === "png"}>
          <Download size={16} /> PNG
        </Button>
        <Button tone="outline" size="sm" onClick={() => doExport("pdf")} loading={exporting === "pdf"}>
          <FileText size={16} /> PDF
        </Button>
        <Button
          tone={published ? "whatsapp" : "outline"}
          size="sm"
          onClick={() => doPublish(!published)}
          loading={publishing}
        >
          <Globe size={16} /> {published ? "Publicado" : "Publicar página"}
        </Button>
        <Button tone="primary" size="sm" onClick={doSave} loading={saving}>
          <Save size={16} /> Salvar
        </Button>
      </Flex>

      {/* Link público */}
      {published && publicUrl ? (
        <HStack gap={2} px={3} py={2} bg="var(--admin-nav-hover)" borderRadius="10px" flexWrap="wrap">
          <Link2 size={16} />
          <Text fontSize="sm" fontFamily="mono" truncate maxW="60%">
            {publicUrl}
          </Text>
          <Button tone="ghost" size="xs" onClick={copyLink}>
            Copiar
          </Button>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <Button tone="ghost" size="xs">
              Abrir
            </Button>
          </a>
        </HStack>
      ) : null}

      <Flex gap={4} flex="1" minH="0" align="stretch" flexWrap={{ base: "wrap", lg: "nowrap" }}>
        {/* Coluna do papel */}
        <Stack gap={3} flex="1" minW="0">
          {/* Adicionar elementos */}
          <HStack gap={2} flexWrap="wrap">
            <Button tone="outline" size="sm" onClick={() => addElement(createTextElement({ text: "Novo texto" }))}>
              <Type size={16} /> Texto
            </Button>
            <Button tone="outline" size="sm" onClick={() => openFilePicker({ kind: "add" })} loading={uploading}>
              <ImagePlus size={16} /> Imagem
            </Button>
            <Button tone="outline" size="sm" onClick={() => addElement(createShapeElement())}>
              <Square size={16} /> Forma
            </Button>
            {comparisons.length > 0 ? (
              <Button tone="outline" size="sm" onClick={() => setCompareOpen(true)} title="Inserir uma evolução (antes/depois)">
                <Images size={16} /> Comparação
              </Button>
            ) : null}
          </HStack>

          {/* Papel */}
          <Box
            ref={wrapRef}
            flex="1"
            minH="0"
            overflow="auto"
            bg="var(--admin-bg, #eef1f6)"
            borderRadius="14px"
            p={4}
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
          >
            {page ? (
              <Box
                style={{ width: scaledW, height: scaledH }}
                position="relative"
                borderRadius="6px"
                overflow="hidden"
                boxShadow="0 12px 40px rgba(15,23,42,0.25)"
                flex="none"
              >
                <SlidePage
                  page={page}
                  scale={scale}
                  mode="edit"
                  selectedId={selectedId}
                  onBackgroundPointerDown={() => setSelectedId(null)}
                  onElementPointerDown={(id, e) => startGesture("move", id, e)}
                  onResizePointerDown={(id, e) => startGesture("resize", id, e)}
                  onElementDoubleClick={(id) => {
                    const el = page.elements.find((x) => x.id === id);
                    if (el?.type === "image") openFilePicker({ kind: "replace", id });
                  }}
                  onDuplicateEl={duplicateElement}
                  onDeleteEl={removeElement}
                  onBringForward={(id) => reorderElement(id, 1)}
                  onSendBackward={(id) => reorderElement(id, -1)}
                />
              </Box>
            ) : null}
          </Box>

          {/* Tira de páginas */}
          <HStack gap={2} overflowX="auto" py={1}>
            {doc.pages.map((pg, i) => {
              const active = i === pageIndexRef.current;
              return (
                <Box
                  key={pg.id}
                  as="button"
                  onClick={() => {
                    setPageIndex(i);
                    setSelectedId(null);
                  }}
                  flex="none"
                  borderRadius="8px"
                  overflow="hidden"
                  borderWidth="2px"
                  borderColor={active ? "var(--admin-primary)" : "var(--admin-border)"}
                  position="relative"
                  style={{ width: 84, height: Math.round(CANVAS_H * pageThumbScale) }}
                  title={`Página ${i + 1}`}
                >
                  <SlidePage page={pg} scale={pageThumbScale} />
                  <Box position="absolute" bottom="0" right="0" bg="rgba(0,0,0,0.6)" color="white" fontSize="10px" px={1}>
                    {i + 1}
                  </Box>
                </Box>
              );
            })}
            <Stack gap={1}>
              <Button tone="outline" size="xs" onClick={addPage} title="Nova página">
                <Plus size={14} /> Página
              </Button>
              <HStack gap={1}>
                <Button tone="ghost" size="xs" onClick={duplicatePage} title="Duplicar página">
                  <Copy size={14} />
                </Button>
                <Button tone="ghost" size="xs" onClick={deletePage} disabled={doc.pages.length <= 1} title="Excluir página">
                  <Trash2 size={14} />
                </Button>
              </HStack>
            </Stack>
          </HStack>
        </Stack>

        {/* Inspetor */}
        <Box flex="none" w={{ base: "100%", lg: `${RIGHT_W}px` }} minW="0">
          <Card>
            <Stack gap={4}>
              <Heading size="sm" color="var(--admin-primary)">
                {inspectorEl
                  ? inspectorEl.type === "text"
                    ? "Texto"
                    : inspectorEl.type === "image"
                      ? "Imagem"
                      : "Forma"
                  : "Página"}
              </Heading>
              <Inspector
                element={inspectorEl}
                background={page?.background ?? { type: "color", value: "#0b1220" }}
                onPatch={(patch, opts) => selectedId && patchElement(selectedId, patch, opts)}
                onBackground={setBackground}
                onReplaceImage={() => selectedId && openFilePicker({ kind: "replace", id: selectedId })}
                onCropImage={() => {
                  if (!selected || selected.type !== "image" || !selected.src) return;
                  cropTargetRef.current = selected.id;
                  setCropOpen(true);
                }}
                onDuplicate={() => selectedId && duplicateElement(selectedId)}
                onDelete={() => selectedId && removeElement(selectedId)}
              />
            </Stack>
          </Card>
        </Box>
      </Flex>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
      <CropModal
        open={cropOpen}
        src={selected?.type === "image" ? selected.src : null}
        onClose={() => setCropOpen(false)}
        onCropped={onCropped}
      />

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Inserir uma evolução" size="lg">
        {comparisons.length === 0 ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Nenhuma comparação com as duas fotos ainda. Cadastre em Evoluções.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
            {comparisons.map((c) => (
              <Box
                key={c.id}
                borderWidth="1px"
                borderColor="var(--admin-border)"
                borderRadius="12px"
                overflow="hidden"
                bg="var(--admin-surface)"
                _hover={{ borderColor: "var(--admin-primary)" }}
              >
                {/* Miniatura: até 3 fotos (a 1ª, a do meio e a última) — o resto vira contador. */}
                <Box as="button" onClick={() => insertComparison(c)} display="block" w="100%" cursor="pointer" textAlign="left">
                  <HStack gap={0} position="relative">
                    {miniaturas(c).map((foto, i) => (
                      <Box
                        key={`${foto.url}-${i}`}
                        flex="1"
                        style={{ aspectRatio: "3 / 4" }}
                        backgroundImage={`url(${foto.url})`}
                        backgroundSize="cover"
                        backgroundPosition="center"
                      />
                    ))}
                    {c.photos.length > 3 ? (
                      <Box
                        position="absolute"
                        right="6px"
                        bottom="6px"
                        px={1.5}
                        borderRadius="6px"
                        bg="rgba(11,18,32,.82)"
                        color="#fff"
                        fontSize="10px"
                        fontWeight="700"
                      >
                        {c.photos.length} fotos
                      </Box>
                    ) : null}
                  </HStack>
                  <Text fontSize="xs" fontWeight="600" px={2} pt={2} lineClamp={1} title={c.title}>
                    {c.title}
                  </Text>
                </Box>
                <HStack justify="space-between" px={2} pb={2} pt={1} gap={2}>
                  <Text fontSize="10px" color="var(--admin-text-soft)">
                    Clique = inserir
                  </Text>
                  {onArteEvolucao ? (
                    <Button
                      tone="ghost"
                      size="xs"
                      onClick={() => {
                        setCompareOpen(false);
                        onArteEvolucao(c);
                      }}
                      title="Baixar como arte de Instagram (feed 4:5 ou story)"
                    >
                      <Download size={12} /> Arte
                    </Button>
                  ) : null}
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Modal>
    </Stack>
  );
}
