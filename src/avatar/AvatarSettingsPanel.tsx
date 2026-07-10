"use client";
/**
 * "Padrões da agência" — os moldes reaproveitados nos avatares. A agência mantém
 * VÁRIOS padrões (ex.: "Padrão 1", "Padrão 2"): cada um é uma receita completa
 * (moldura, logo, fundo, legenda fixa, fonte, cores, posições). Aqui ela cria,
 * renomeia, duplica, exclui e marca qual é o INICIAL (vem selecionado ao criar).
 * A biblioteca de molduras enviadas (`frames`) é COMPARTILHADA por todos os
 * padrões. Uma prévia ao vivo mostra o padrão em edição ao lado do formulário.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, ImagePlus, Plus, RotateCcw, Star, Trash2, Upload } from "lucide-react";
import { Box, HStack, Image, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Accordion } from "../components/Accordion";
import { FormInput, FormSelect } from "../components/form";
import { ColorPicker } from "../components/ColorPicker";
import { SidePanel } from "../components/SidePanel";
import { toaster } from "../components/Toast";
import { AvatarCanvas } from "./AvatarCanvas";
import { AvatarStudioLayout } from "./AvatarStudioLayout";
import {
  AVATAR_COLORS,
  AVATAR_FONTS,
  avatarPresets,
  defaultAvatarConfig,
  recipeOf,
  resolveAvatarPreset,
} from "./constants";
import type {
  AvatarBrand,
  AvatarFramePreset,
  AvatarLogoCorner,
  AvatarPreset,
  AvatarSettings,
  AvatarUploadKind,
} from "./types";

/** Slider fino (mesmo padrão do estúdio). */
function Range({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "var(--admin-primary)" }}
    />
  );
}

export type AvatarSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  settings: AvatarSettings;
  brand: AvatarBrand;
  presets: readonly AvatarFramePreset[];
  onUpload: (file: File | Blob, kind: AvatarUploadKind, filename: string) => Promise<string>;
  onSave: (settings: AvatarSettings) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSaved?: () => void;
};

let seq = 0;
function uid(prefix: string): string {
  // Sequencial + índice do módulo — não usa Date.now/Math.random (proibido em
  // alguns contextos). Só precisa ser único dentro da sessão de edição.
  seq += 1;
  return `${prefix}${seq.toString(36)}`;
}

/** Texto de ajuda (explica o campo). */
function Help({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.5">
      {children}
    </Text>
  );
}

export function AvatarSettingsPanel(props: AvatarSettingsPanelProps) {
  const framePresets = props.presets; // molduras PRESET (não confundir com os padrões)

  // Estado: biblioteca de molduras COMPARTILHADA + lista de PADRÕES + qual edito + qual é o inicial.
  const [frames, setFrames] = useState(props.settings.frames);
  const [presets, setPresets] = useState<AvatarPreset[]>(() => avatarPresets(props.settings));
  const [selId, setSelId] = useState(() => resolveAvatarPreset(props.settings).id);
  const [defId, setDefId] = useState(() => resolveAvatarPreset(props.settings).id);

  const [sampleName, setSampleName] = useState("Maria");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pending = useRef<AvatarUploadKind>("frame");

  useEffect(() => {
    if (!props.open) return;
    const list = avatarPresets(props.settings);
    const def = resolveAvatarPreset(props.settings).id;
    setFrames(props.settings.frames);
    setPresets(list);
    setDefId(def);
    setSelId(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  // Padrão em edição (sempre existe: `avatarPresets`/`removePreset` garantem ≥1).
  const sel = presets.find((p) => p.id === selId) ?? presets[0];

  const patchPreset = (id: string, partial: Partial<AvatarPreset>) =>
    setPresets((list) => list.map((p) => (p.id === id ? { ...p, ...partial } : p)));
  const patchSel = (partial: Partial<AvatarPreset>) => patchPreset(sel.id, partial);

  const addPreset = () => {
    // Novo padrão nasce "limpo" (receita default) — a agência ajusta do zero.
    const fresh: AvatarPreset = {
      id: uid("p_"),
      name: `Padrão ${presets.length + 1}`,
      ...recipeOf({
        logoUrl: "",
        backgroundUrl: "",
        fixedSubtitle: "",
        defaultFont: AVATAR_FONTS[0].family,
        defaultBackgroundColor: "#0b1220",
        defaultFramePresetId: framePresets[0]?.id ?? "",
      }),
    };
    setPresets((list) => [...list, fresh]);
    setSelId(fresh.id);
  };

  const duplicatePreset = () => {
    const copy: AvatarPreset = { ...recipeOf(sel), id: uid("p_"), name: `${sel.name} (cópia)`.slice(0, 60) };
    setPresets((list) => {
      const i = list.findIndex((p) => p.id === sel.id);
      const next = [...list];
      next.splice(i < 0 ? list.length : i + 1, 0, copy);
      return next;
    });
    setSelId(copy.id);
  };

  const removePreset = () => {
    if (presets.length <= 1) return;
    const remaining = presets.filter((p) => p.id !== sel.id);
    setPresets(remaining);
    if (defId === sel.id) setDefId(remaining[0].id);
    setSelId(remaining[0].id);
  };

  // Config do MOLDE (avatar novo já nasce assim) do padrão em edição: frame + fundo
  // + logo + fonte, derivado da receita atual. Recalcula ao vivo conforme os campos.
  const previewConfig = useMemo(
    () => defaultAvatarConfig(sel, props.brand.logoUrl),
    [sel, props.brand.logoUrl],
  );

  const pick = (kind: AvatarUploadKind) => {
    pending.current = kind;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = pending.current;
    setUploading(true);
    try {
      const url = await props.onUpload(file, kind, file.name);
      if (kind === "frame") {
        // Moldura entra na biblioteca COMPARTILHADA (qualquer padrão pode usá-la).
        setFrames((f) => [...f, { id: uid("m_"), label: `Moldura ${f.length + 1}`, url }]);
      } else if (kind === "logo") {
        patchSel({ logoUrl: url });
      } else if (kind === "background") {
        patchSel({ backgroundUrl: url });
      }
    } catch (err) {
      toaster.create({ title: "Falha no upload", description: String(err), type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const def = presets.find((p) => p.id === defId) ?? presets[0];
      // Espelha o padrão INICIAL na receita do topo (compat com leitores que usam
      // `defaultAvatarConfig(settings)` direto) + guarda a lista e o inicial.
      const next: AvatarSettings = {
        ...recipeOf(def),
        frames,
        presets,
        defaultPresetId: def.id,
      };
      const res = await props.onSave(next);
      if (!res.ok) throw new Error(res.error);
      toaster.create({ title: "Padrões salvos", type: "success" });
      props.onSaved?.();
      props.onClose();
    } catch (err) {
      toaster.create({ title: "Falha ao salvar", description: String(err), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Moldura padrão DESTE padrão: presets prontos + as PNG da biblioteca (image:<url>).
  const defaultFrameOptions = [
    ...framePresets.map((p) => ({ value: `preset:${p.id}`, label: p.label })),
    ...frames.map((f) => ({ value: `image:${f.url}`, label: `${f.label} (sua)` })),
  ];
  const defaultFrameValue = sel.defaultFrameUrl
    ? `image:${sel.defaultFrameUrl}`
    : `preset:${sel.defaultFramePresetId}`;

  const logoCornerOptions = [
    { value: "top", label: "Topo (centro)" },
    { value: "top-left", label: "Superior esquerdo" },
    { value: "top-right", label: "Superior direito" },
    { value: "bottom", label: "Rodapé (centro)" },
    { value: "bottom-left", label: "Inferior esquerdo" },
    { value: "bottom-right", label: "Inferior direito" },
    { value: "none", label: "Sem logo" },
  ];
  const defaultLogoValue = sel.defaultLogoCorner ?? "top";

  return (
    <SidePanel
      open={props.open}
      onClose={props.onClose}
      title="Padrões da agência"
      size="full"
      width={{ base: "100vw", lg: "50vw" }}
      opaque
      footer={
        <HStack gap={2} w="100%" justify="flex-end">
          <Button tone="ghost" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button tone="primary" onClick={save} loading={saving} disabled={uploading}>
            Salvar padrões
          </Button>
        </HStack>
      }
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <AvatarStudioLayout
        previewTitle="Prévia do padrão"
        preview={(variant) => (
          <Stack gap={3} align="center" w="100%">
            <AvatarCanvas
              config={previewConfig}
              title={sampleName || "Nome"}
              subtitle={sel.fixedSubtitle}
              presets={framePresets}
              interactive
              onTitleMove={(o) => patchSel({ defaultTitleOffsetX: o.x, defaultTitleOffsetY: o.y })}
              onLogoMove={(pos) => patchSel({ defaultLogoPos: pos })}
              maxSize={variant === "compact" ? 280 : 460}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center">
              {variant === "full" ? (
                <>
                  Molde do padrão <b>{sel.name}</b>. Arraste o <b>nome</b> e a <b>logo</b> na prévia
                  para definir a posição. A foto da pessoa entra depois, na hora de criar.
                </>
              ) : (
                <>
                  Molde de <b>{sel.name}</b> — arraste o <b>nome</b> e a <b>logo</b> na prévia.
                </>
              )}
            </Text>
          </Stack>
        )}
      >
        {/* FORMULÁRIO — seletor de PADRÕES no topo, depois a receita do selecionado. */}
        <Stack gap={4}>
          {/* Gerenciador de padrões: escolher qual editar, adicionar, renomear, definir o inicial. */}
          <Box borderWidth="1px" borderColor="var(--admin-border)" borderRadius="12px" p={3} bg="var(--admin-bg)">
            <Stack gap={2.5}>
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">
                  Padrões
                </Text>
                <Button size="xs" tone="outline" onClick={addPreset}>
                  <Plus size={13} /> Adicionar padrão
                </Button>
              </HStack>
              <HStack gap={2} flexWrap="wrap">
                {presets.map((p) => (
                  <Button
                    key={p.id}
                    size="sm"
                    tone={p.id === sel.id ? "primary" : "outline"}
                    onClick={() => setSelId(p.id)}
                  >
                    {p.id === defId ? <Star size={13} fill="currentColor" /> : null} {p.name}
                  </Button>
                ))}
              </HStack>
              <FormInput
                label="Nome deste padrão"
                size="sm"
                value={sel.name}
                onChange={(e) => patchSel({ name: e.target.value.slice(0, 60) })}
                placeholder="Ex.: Padrão claro"
              />
              <HStack gap={2} flexWrap="wrap" align="center">
                {defId !== sel.id ? (
                  <Button size="xs" tone="ghost" onClick={() => setDefId(sel.id)}>
                    <Star size={13} /> Definir como inicial
                  </Button>
                ) : (
                  <Text fontSize="xs" color="var(--admin-text-soft)">
                    <Star size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                    Padrão inicial (vem selecionado ao criar)
                  </Text>
                )}
                <Button size="xs" tone="ghost" onClick={duplicatePreset}>
                  <Copy size={13} /> Duplicar
                </Button>
                {presets.length > 1 ? (
                  <Button size="xs" tone="ghost" onClick={removePreset}>
                    <Trash2 size={13} /> Excluir padrão
                  </Button>
                ) : null}
              </HStack>
            </Stack>
          </Box>

          <FormInput
            label="Ver com o nome"
            size="sm"
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="Ex.: Maria"
            help="Só na prévia — não altera o padrão."
          />
          <Accordion
            multiple
            defaultValue={["texto", "logo"]}
            items={[
              {
                value: "texto",
                title: "Nome e legenda",
                content: (
                  <Stack gap={3}>
                    <FormInput
                      label="Legenda fixa"
                      value={sel.fixedSubtitle}
                      onChange={(e) => patchSel({ fixedSubtitle: e.target.value })}
                      placeholder="Ex.: CARA PINTADA"
                      help="2ª linha embaixo do nome, igual em todos deste padrão (ex.: o nome da agência). Vazio = sem 2ª linha."
                    />
                    <FormSelect
                      label="Fonte do nome"
                      value={sel.defaultFont}
                      onChange={(e) => patchSel({ defaultFont: e.target.value })}
                      options={AVATAR_FONTS.map((f) => ({ value: f.family, label: f.label }))}
                      help="A tipografia do nome."
                    />
                    <HStack gap={4} align="flex-start" flexWrap="wrap">
                      <Stack gap={1}>
                        <Text fontSize="xs" color="var(--admin-text-soft)">Cor do nome</Text>
                        <ColorPicker
                          value={sel.defaultTitleColor ?? "#ffffff"}
                          onChange={(c) => patchSel({ defaultTitleColor: c })}
                          colors={AVATAR_COLORS}
                          columns={9}
                          allowCustom
                        />
                      </Stack>
                      <Stack gap={1}>
                        <Text fontSize="xs" color="var(--admin-text-soft)">Cor da legenda</Text>
                        <ColorPicker
                          value={sel.defaultSubtitleColor ?? "#ffffff"}
                          onChange={(c) => patchSel({ defaultSubtitleColor: c })}
                          colors={AVATAR_COLORS}
                          columns={9}
                          allowCustom
                        />
                      </Stack>
                    </HStack>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={sel.defaultUppercase ?? true}
                        onChange={(e) => patchSel({ defaultUppercase: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Texto em CAIXA ALTA por padrão
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(sel.defaultSubtitleCurved)}
                        onChange={(e) => patchSel({ defaultSubtitleCurved: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Legenda curvada por padrão
                    </label>
                    <Stack gap={1}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="var(--admin-text-soft)">Tamanho padrão do nome</Text>
                        <Button size="xs" tone="ghost" onClick={() => patchSel({ defaultTitleScale: 1 })}>
                          <RotateCcw size={12} /> Padrão
                        </Button>
                      </HStack>
                      <Range
                        value={sel.defaultTitleScale ?? 1}
                        min={0.6}
                        max={1.6}
                        step={0.02}
                        onChange={(v) => patchSel({ defaultTitleScale: v })}
                      />
                    </Stack>
                    <Stack gap={1}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="var(--admin-text-soft)">Altura padrão do nome (ou arraste na prévia)</Text>
                        <Button
                          size="xs"
                          tone="ghost"
                          onClick={() => patchSel({ defaultTitleOffsetX: 0, defaultTitleOffsetY: 0 })}
                        >
                          <RotateCcw size={12} /> Padrão
                        </Button>
                      </HStack>
                      <Range
                        value={sel.defaultTitleOffsetY ?? 0}
                        min={-0.15}
                        max={0.15}
                        step={0.005}
                        onChange={(v) => patchSel({ defaultTitleOffsetY: v })}
                      />
                    </Stack>
                  </Stack>
                ),
              },
              {
                value: "logo",
                title: "Logo",
                content: (
                  <Stack gap={3}>
                    <Help>
                      Marca d’água que aparece num canto do avatar. Deixe <b>vazio</b> pra usar o logo
                      do site automaticamente. Arraste a logo na prévia para posicioná-la livremente.
                    </Help>
                    <HStack gap={3} align="center" flexWrap="wrap">
                      {sel.logoUrl ? (
                        <Box w="64px" h="64px" borderRadius="10px" borderWidth="1px" borderColor="var(--admin-border)" overflow="hidden" bg="#0b1220">
                          <Image src={sel.logoUrl} alt="Logo" w="100%" h="100%" objectFit="contain" />
                        </Box>
                      ) : null}
                      <Button tone="outline" size="sm" onClick={() => pick("logo")} loading={uploading}>
                        <Upload size={15} /> {sel.logoUrl ? "Trocar logo" : "Enviar logo"}
                      </Button>
                      {sel.logoUrl ? (
                        <Button tone="ghost" size="sm" onClick={() => patchSel({ logoUrl: "" })}>
                          Usar logo do site
                        </Button>
                      ) : null}
                    </HStack>
                    <FormSelect
                      label="Posição da logo"
                      value={defaultLogoValue}
                      onChange={(e) =>
                        patchSel({ defaultLogoCorner: e.target.value as AvatarLogoCorner, defaultLogoPos: null })
                      }
                      options={logoCornerOptions}
                      help="Canto padrão. Arrastar na prévia sobrepõe o canto."
                    />
                    {sel.defaultLogoPos ? (
                      <Button
                        size="xs"
                        tone="ghost"
                        onClick={() => patchSel({ defaultLogoPos: null })}
                        alignSelf="flex-start"
                      >
                        <RotateCcw size={12} /> Voltar a logo pro canto
                      </Button>
                    ) : null}
                  </Stack>
                ),
              },
              {
                value: "moldura",
                title: "Molduras",
                content: (
                  <Stack gap={3}>
                    <Help>
                      A <b>moldura</b> é a borda decorativa em volta da foto — tipo o anel colorido do
                      exemplo. Já vêm algumas prontas. Aqui você pode subir as <b>suas</b>: um PNG com
                      o <b>meio vazado</b> (transparente), pra a foto aparecer no buraco. As molduras
                      enviadas ficam disponíveis para <b>todos os padrões</b>.
                    </Help>
                    <FormSelect
                      label="Moldura deste padrão"
                      value={defaultFrameValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.startsWith("image:")) {
                          patchSel({ defaultFrameUrl: v.slice(6) });
                        } else {
                          patchSel({ defaultFrameUrl: "", defaultFramePresetId: v.slice(7) });
                        }
                      }}
                      options={defaultFrameOptions}
                      help="A borda que já vem selecionada nos avatares deste padrão — inclusive as suas."
                    />
                    {frames.length > 0 ? (
                      <SimpleGrid columns={{ base: 2, sm: 3 }} gap={3}>
                        {frames.map((f, i) => (
                          <Stack key={f.id} gap={1} borderWidth="1px" borderColor="var(--admin-border)" borderRadius="12px" p={2}>
                            <Box
                              aspectRatio={1}
                              borderRadius="10px"
                              bg="repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 16px 16px"
                              overflow="hidden"
                            >
                              <Image src={f.url} alt={f.label} w="100%" h="100%" objectFit="contain" />
                            </Box>
                            <FormInput
                              value={f.label}
                              onChange={(e) =>
                                setFrames((list) => {
                                  const next = [...list];
                                  next[i] = { ...next[i], label: e.target.value };
                                  return next;
                                })
                              }
                            />
                            <Button
                              tone="ghost"
                              size="xs"
                              onClick={() => setFrames((list) => list.filter((x) => x.id !== f.id))}
                            >
                              <Trash2 size={13} /> Remover
                            </Button>
                          </Stack>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Help>Nenhuma moldura sua ainda — as prontas continuam disponíveis.</Help>
                    )}
                    <Button tone="outline" size="sm" onClick={() => pick("frame")} loading={uploading} alignSelf="flex-start">
                      <ImagePlus size={15} /> Adicionar moldura
                    </Button>
                  </Stack>
                ),
              },
              {
                value: "fundo",
                title: "Fundo",
                content: (
                  <Stack gap={3}>
                    <Help>
                      O que aparece <b>atrás</b> da foto. Pode ser uma imagem (ex.: um respingo de
                      tinta) ou uma cor sólida. Sem imagem, usa a <b>cor</b> escolhida abaixo.
                    </Help>
                    <HStack gap={3} align="center" flexWrap="wrap">
                      {sel.backgroundUrl ? (
                        <Box w="64px" h="64px" borderRadius="10px" borderWidth="1px" borderColor="var(--admin-border)" overflow="hidden">
                          <Image src={sel.backgroundUrl} alt="Fundo" w="100%" h="100%" objectFit="cover" />
                        </Box>
                      ) : null}
                      <Button tone="outline" size="sm" onClick={() => pick("background")} loading={uploading}>
                        <Upload size={15} /> {sel.backgroundUrl ? "Trocar fundo" : "Enviar fundo"}
                      </Button>
                      {sel.backgroundUrl ? (
                        <Button tone="ghost" size="sm" onClick={() => patchSel({ backgroundUrl: "" })}>
                          Remover (usar cor)
                        </Button>
                      ) : null}
                    </HStack>
                    <Stack gap={1}>
                      <Text fontSize="xs" color="var(--admin-text-soft)">Cor de fundo (quando não há imagem)</Text>
                      <ColorPicker
                        value={sel.defaultBackgroundColor}
                        onChange={(c) => patchSel({ defaultBackgroundColor: c })}
                        colors={AVATAR_COLORS}
                        columns={9}
                      />
                    </Stack>
                  </Stack>
                ),
              },
            ]}
          />
        </Stack>
      </AvatarStudioLayout>
    </SidePanel>
  );
}
