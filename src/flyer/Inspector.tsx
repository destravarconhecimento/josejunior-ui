"use client";
/**
 * Painel de propriedades do elemento selecionado (§4 do doc). Recebe o elemento e
 * um `onPatch` — mudanças contínuas (cor/sliders) passam `coalesce` pra não poluir
 * o histórico; selects/toggles são discretos. Sem estado próprio do documento.
 */
import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "../primitives";
import { Input } from "../components/controls";
import { Button } from "../components/Button";
import {
  AlignCenter, AlignLeft, AlignRight, Copy, Crop, ImageUp, Sparkles, Trash2,
} from "lucide-react";
import { FLYER_FONTS, FONT_WEIGHTS } from "./constants";
import type { FlyerBackground, FlyerElement } from "./types";

type PatchOpts = { coalesce?: string };

export type InspectorProps = {
  element: FlyerElement | null;
  background: FlyerBackground;
  onPatch: (patch: Partial<FlyerElement>, opts?: PatchOpts) => void;
  onBackground: (value: string, opts?: PatchOpts) => void;
  onReplaceImage: () => void;
  onCropImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={1}>
      <Text fontSize="xs" fontWeight="600" color="var(--admin-text-soft)">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

function ColorField({
  value, onChange, label,
}: { value: string; onChange: (hex: string, opts?: PatchOpts) => void; label: string }) {
  return (
    <Row label={label}>
      <HStack gap={2}>
        <Box as="label" style={{ cursor: "pointer", lineHeight: 0 }}>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value, { coalesce: `color:${label}` })}
            style={{ width: 34, height: 34, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            aria-label={label}
          />
        </Box>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value, { coalesce: `hex:${label}` })}
          size="sm"
          fontFamily="mono"
          maxW="130px"
        />
      </HStack>
    </Row>
  );
}

function NumberField({
  value, onChange, min, max, step = 1, suffix,
}: {
  value: number;
  onChange: (n: number, opts?: PatchOpts) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <HStack gap={2}>
      <Input
        type="number"
        value={String(value)}
        min={min}
        max={max}
        step={step}
        size="sm"
        maxW="110px"
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n, { coalesce: "num" });
        }}
      />
      {suffix ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {suffix}
        </Text>
      ) : null}
    </HStack>
  );
}

function Seg({
  options, value, onChange,
}: {
  options: { value: string; label: ReactNode; title?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <HStack gap={0} borderWidth="1px" borderColor="var(--admin-border)" borderRadius="10px" overflow="hidden" display="inline-flex">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Box
            as="button"
            key={o.value}
            title={o.title}
            onClick={() => onChange(o.value)}
            px={3}
            py={2}
            fontSize="sm"
            fontWeight="600"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            bg={active ? "var(--admin-primary)" : "transparent"}
            color={active ? "white" : "var(--admin-text-soft)"}
            _hover={active ? undefined : { bg: "var(--admin-nav-hover)" }}
          >
            {o.label}
          </Box>
        );
      })}
    </HStack>
  );
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    height: 36,
    borderRadius: 8,
    border: "1px solid var(--admin-border)",
    background: "var(--admin-surface)",
    color: "var(--admin-text)",
    padding: "0 10px",
    fontSize: 14,
  };
}

export function Inspector(props: InspectorProps) {
  const { element, background, onPatch, onBackground } = props;

  return (
    <Stack gap={4}>
      <Row label="Fundo da página">
        <HStack gap={2}>
          <Box as="label" style={{ cursor: "pointer", lineHeight: 0 }}>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(background.value) ? background.value : "#0b1220"}
              onChange={(e) => onBackground(e.target.value, { coalesce: "bg" })}
              style={{ width: 34, height: 34, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              aria-label="Cor de fundo"
            />
          </Box>
          <Input
            value={background.value}
            onChange={(e) => onBackground(e.target.value, { coalesce: "bghex" })}
            size="sm"
            fontFamily="mono"
            maxW="130px"
          />
        </HStack>
      </Row>

      {!element ? (
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Selecione um elemento para editar. Ou use os botões acima do papel para
          adicionar texto, imagem ou forma.
        </Text>
      ) : null}

      {element?.type === "text" ? (
        <>
          <Row label="Texto">
            <Input
              value={element.text}
              onChange={(e) => onPatch({ text: e.target.value }, { coalesce: "text" })}
            />
          </Row>
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Fonte">
              <select
                value={element.fontFamily}
                onChange={(e) => onPatch({ fontFamily: e.target.value })}
                style={selectStyle()}
              >
                {FLYER_FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Peso">
              <select
                value={element.fontWeight}
                onChange={(e) => onPatch({ fontWeight: e.target.value })}
                style={selectStyle()}
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Row>
          </HStack>
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Tamanho">
              <NumberField
                value={element.fontSize}
                min={8}
                max={300}
                onChange={(n) => onPatch({ fontSize: n }, { coalesce: "size" })}
                suffix="px"
              />
            </Row>
            <Row label="Alinhamento">
              <Seg
                value={element.align}
                onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })}
                options={[
                  { value: "left", label: <AlignLeft size={16} />, title: "Esquerda" },
                  { value: "center", label: <AlignCenter size={16} />, title: "Centro" },
                  { value: "right", label: <AlignRight size={16} />, title: "Direita" },
                ]}
              />
            </Row>
          </HStack>
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Estilo">
              <Seg
                value={element.italic ? "italic" : "normal"}
                onChange={(v) => onPatch({ italic: v === "italic" })}
                options={[
                  { value: "normal", label: "Aa" },
                  { value: "italic", label: <span style={{ fontStyle: "italic" }}>Aa</span> },
                ]}
              />
            </Row>
            <Row label="Efeito dourado">
              <Seg
                value={element.gradient ? "on" : "off"}
                onChange={(v) => onPatch({ gradient: v === "on" })}
                options={[
                  { value: "off", label: "Cor" },
                  { value: "on", label: <HStack gap={1}><Sparkles size={14} /> Ouro</HStack> },
                ]}
              />
            </Row>
          </HStack>
          {!element.gradient ? (
            <ColorField
              label="Cor do texto"
              value={element.color}
              onChange={(hex, opts) => onPatch({ color: hex }, opts)}
            />
          ) : null}
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Entrelinha">
              <NumberField
                value={element.lineHeight}
                min={0.7}
                max={3}
                step={0.05}
                onChange={(n) => onPatch({ lineHeight: n }, { coalesce: "lh" })}
              />
            </Row>
            <Row label="Espaçamento">
              <NumberField
                value={element.letterSpacing}
                min={-10}
                max={40}
                onChange={(n) => onPatch({ letterSpacing: n }, { coalesce: "ls" })}
                suffix="px"
              />
            </Row>
          </HStack>
        </>
      ) : null}

      {element?.type === "image" ? (
        <>
          <HStack gap={2} flexWrap="wrap">
            <Button tone="outline" size="sm" onClick={props.onReplaceImage}>
              <ImageUp size={16} /> Trocar imagem
            </Button>
            {element.src ? (
              <Button tone="ghost" size="sm" onClick={props.onCropImage}>
                <Crop size={16} /> Recortar
              </Button>
            ) : null}
          </HStack>
          {element.isLogo ? (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Este é o <b>logo</b>: trocar aqui atualiza o logo em todas as páginas.
            </Text>
          ) : null}
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Cantos">
              <NumberField
                value={element.radius}
                min={0}
                max={400}
                onChange={(n) => onPatch({ radius: n }, { coalesce: "radius" })}
                suffix="px"
              />
            </Row>
            <Row label="Sombra">
              <Seg
                value={element.shadow ? "on" : "off"}
                onChange={(v) => onPatch({ shadow: v === "on" })}
                options={[
                  { value: "off", label: "Não" },
                  { value: "on", label: "Sim" },
                ]}
              />
            </Row>
          </HStack>
        </>
      ) : null}

      {element?.type === "shape" ? (
        <>
          <ColorField
            label="Preenchimento"
            value={element.fill}
            onChange={(hex, opts) => onPatch({ fill: hex }, opts)}
          />
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Cantos">
              <NumberField
                value={element.radius}
                min={0}
                max={999}
                onChange={(n) => onPatch({ radius: n }, { coalesce: "radius" })}
                suffix="px"
              />
            </Row>
            <Row label="Sombra">
              <Seg
                value={element.shadow ? "on" : "off"}
                onChange={(v) => onPatch({ shadow: v === "on" })}
                options={[
                  { value: "off", label: "Não" },
                  { value: "on", label: "Sim" },
                ]}
              />
            </Row>
          </HStack>
          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Row label="Borda (px)">
              <NumberField
                value={element.borderWidth}
                min={0}
                max={40}
                onChange={(n) => onPatch({ borderWidth: n }, { coalesce: "bw" })}
              />
            </Row>
            {element.borderWidth > 0 ? (
              <ColorField
                label="Cor da borda"
                value={element.borderColor}
                onChange={(hex, opts) => onPatch({ borderColor: hex }, opts)}
              />
            ) : null}
          </HStack>
        </>
      ) : null}

      {element ? (
        <HStack gap={2} pt={2} borderTopWidth="1px" borderColor="var(--admin-border)">
          <Button tone="ghost" size="sm" onClick={props.onDuplicate}>
            <Copy size={16} /> Duplicar
          </Button>
          <Button tone="danger" size="sm" onClick={props.onDelete}>
            <Trash2 size={16} /> Excluir
          </Button>
        </HStack>
      ) : null}
    </Stack>
  );
}
