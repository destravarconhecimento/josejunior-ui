"use client";
/**
 * "Padrão da agência" — o molde reaproveitado em TODO avatar: molduras próprias
 * (PNG com centro vazado), logo, fundo padrão, legenda fixa, fonte e moldura
 * default. A agência configura uma vez; todo avatar novo já nasce com esse padrão
 * (`defaultAvatarConfig`). O painel mostra uma PRÉVIA ao vivo do molde ao lado do
 * formulário, e explica cada campo (o usuário se confundia com "moldura" etc.).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2, Upload } from "lucide-react";
import { Box, HStack, Image, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Accordion } from "../components/Accordion";
import { FormInput, FormSelect } from "../components/form";
import { ColorPicker } from "../components/ColorPicker";
import { SidePanel } from "../components/SidePanel";
import { toaster } from "../components/Toast";
import { AvatarCanvas } from "./AvatarCanvas";
import { AvatarStudioLayout } from "./AvatarStudioLayout";
import { AVATAR_COLORS, AVATAR_FONTS, defaultAvatarConfig } from "./constants";
import type {
  AvatarBrand,
  AvatarFramePreset,
  AvatarLogoCorner,
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

function frameId(): string {
  return `m_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
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
  const [s, setS] = useState<AvatarSettings>(props.settings);
  const [sampleName, setSampleName] = useState("Maria");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pending = useRef<AvatarUploadKind>("frame");

  useEffect(() => {
    if (props.open) setS(props.settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  // Config do MOLDE (avatar novo já nasce assim): frame preset + fundo + logo +
  // fonte, tudo derivado do padrão atual. Sem foto — o círculo mostra o fundo, e a
  // prévia deixa claro onde a foto entra. Recalcula ao vivo conforme os campos.
  const previewConfig = useMemo(
    () => defaultAvatarConfig(s, props.brand.logoUrl),
    [s, props.brand.logoUrl],
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
        setS((p) => ({
          ...p,
          frames: [...p.frames, { id: frameId(), label: `Moldura ${p.frames.length + 1}`, url }],
        }));
      } else if (kind === "logo") {
        setS((p) => ({ ...p, logoUrl: url }));
      } else if (kind === "background") {
        setS((p) => ({ ...p, backgroundUrl: url }));
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
      const res = await props.onSave(s);
      if (!res.ok) throw new Error(res.error);
      toaster.create({ title: "Padrão salvo", type: "success" });
      props.onSaved?.();
      props.onClose();
    } catch (err) {
      toaster.create({ title: "Falha ao salvar", description: String(err), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Moldura padrão: presets prontos + as PNG que a agência subiu (image:<url>).
  const defaultFrameOptions = [
    ...props.presets.map((p) => ({ value: `preset:${p.id}`, label: p.label })),
    ...s.frames.map((f) => ({ value: `image:${f.url}`, label: `${f.label} (sua)` })),
  ];
  const defaultFrameValue = s.defaultFrameUrl
    ? `image:${s.defaultFrameUrl}`
    : `preset:${s.defaultFramePresetId}`;

  const logoCornerOptions = [
    { value: "top", label: "Topo (centro)" },
    { value: "top-left", label: "Superior esquerdo" },
    { value: "top-right", label: "Superior direito" },
    { value: "bottom", label: "Rodapé (centro)" },
    { value: "bottom-left", label: "Inferior esquerdo" },
    { value: "bottom-right", label: "Inferior direito" },
    { value: "none", label: "Sem logo" },
  ];
  const defaultLogoValue = s.defaultLogoCorner ?? "top";

  return (
    <SidePanel
      open={props.open}
      onClose={props.onClose}
      title="Padrão da agência"
      size="full"
      width={{ base: "100vw", lg: "50vw" }}
      opaque
      footer={
        <HStack gap={2} w="100%" justify="flex-end">
          <Button tone="ghost" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button tone="primary" onClick={save} loading={saving} disabled={uploading}>
            Salvar padrão
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
              subtitle={s.fixedSubtitle}
              presets={props.presets}
              interactive
              onTitleMove={(o) => setS((p) => ({ ...p, defaultTitleOffsetX: o.x, defaultTitleOffsetY: o.y }))}
              onLogoMove={(pos) => setS((p) => ({ ...p, defaultLogoPos: pos }))}
              maxSize={variant === "compact" ? 280 : 460}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center">
              {variant === "full" ? (
                <>
                  Este é o molde de <b>todo avatar novo</b>. Arraste o <b>nome</b> e a <b>logo</b> na
                  prévia para definir a posição padrão. A foto da pessoa entra depois, na hora de criar.
                </>
              ) : (
                <>
                  Molde de <b>todo avatar novo</b> — arraste o <b>nome</b> e a <b>logo</b> na prévia.
                </>
              )}
            </Text>
          </Stack>
        )}
      >
        {/* FORMULÁRIO do padrão — por categoria (acordeão). */}
        <Stack gap={4}>
          <FormInput
            label="Ver com o nome"
            size="sm"
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="Ex.: Maria"
            help="Só na prévia — não altera o padrão."
          />
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
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
                      value={s.fixedSubtitle}
                      onChange={(e) => setS((p) => ({ ...p, fixedSubtitle: e.target.value }))}
                      placeholder="Ex.: CARA PINTADA"
                      help="2ª linha embaixo do nome, igual em todos (ex.: o nome da agência). Vazio = sem 2ª linha."
                    />
                    <FormSelect
                      label="Fonte do nome"
                      value={s.defaultFont}
                      onChange={(e) => setS((p) => ({ ...p, defaultFont: e.target.value }))}
                      options={AVATAR_FONTS.map((f) => ({ value: f.family, label: f.label }))}
                      help="A tipografia do nome."
                    />
                    <HStack gap={4} align="flex-start" flexWrap="wrap">
                      <Stack gap={1}>
                        <Text fontSize="xs" color="var(--admin-text-soft)">Cor do nome</Text>
                        <ColorPicker
                          value={s.defaultTitleColor ?? "#ffffff"}
                          onChange={(c) => setS((p) => ({ ...p, defaultTitleColor: c }))}
                          colors={AVATAR_COLORS}
                          columns={9}
                          allowCustom
                        />
                      </Stack>
                      <Stack gap={1}>
                        <Text fontSize="xs" color="var(--admin-text-soft)">Cor da legenda</Text>
                        <ColorPicker
                          value={s.defaultSubtitleColor ?? "#ffffff"}
                          onChange={(c) => setS((p) => ({ ...p, defaultSubtitleColor: c }))}
                          colors={AVATAR_COLORS}
                          columns={9}
                          allowCustom
                        />
                      </Stack>
                    </HStack>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={s.defaultUppercase ?? true}
                        onChange={(e) => setS((p) => ({ ...p, defaultUppercase: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Texto em CAIXA ALTA por padrão
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(s.defaultSubtitleCurved)}
                        onChange={(e) => setS((p) => ({ ...p, defaultSubtitleCurved: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Legenda curvada por padrão
                    </label>
                    <Stack gap={1}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="var(--admin-text-soft)">Tamanho padrão do nome</Text>
                        <Button size="xs" tone="ghost" onClick={() => setS((p) => ({ ...p, defaultTitleScale: 1 }))}>
                          <RotateCcw size={12} /> Padrão
                        </Button>
                      </HStack>
                      <Range
                        value={s.defaultTitleScale ?? 1}
                        min={0.6}
                        max={1.6}
                        step={0.02}
                        onChange={(v) => setS((p) => ({ ...p, defaultTitleScale: v }))}
                      />
                    </Stack>
                    <Stack gap={1}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="var(--admin-text-soft)">Altura padrão do nome (ou arraste na prévia)</Text>
                        <Button
                          size="xs"
                          tone="ghost"
                          onClick={() => setS((p) => ({ ...p, defaultTitleOffsetX: 0, defaultTitleOffsetY: 0 }))}
                        >
                          <RotateCcw size={12} /> Padrão
                        </Button>
                      </HStack>
                      <Range
                        value={s.defaultTitleOffsetY ?? 0}
                        min={-0.15}
                        max={0.15}
                        step={0.005}
                        onChange={(v) => setS((p) => ({ ...p, defaultTitleOffsetY: v }))}
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
                      {s.logoUrl ? (
                        <Box w="64px" h="64px" borderRadius="10px" borderWidth="1px" borderColor="var(--admin-border)" overflow="hidden" bg="#0b1220">
                          <Image src={s.logoUrl} alt="Logo" w="100%" h="100%" objectFit="contain" />
                        </Box>
                      ) : null}
                      <Button tone="outline" size="sm" onClick={() => pick("logo")} loading={uploading}>
                        <Upload size={15} /> {s.logoUrl ? "Trocar logo" : "Enviar logo"}
                      </Button>
                      {s.logoUrl ? (
                        <Button tone="ghost" size="sm" onClick={() => setS((p) => ({ ...p, logoUrl: "" }))}>
                          Usar logo do site
                        </Button>
                      ) : null}
                    </HStack>
                    <FormSelect
                      label="Posição da logo"
                      value={defaultLogoValue}
                      onChange={(e) =>
                        setS((p) => ({ ...p, defaultLogoCorner: e.target.value as AvatarLogoCorner, defaultLogoPos: null }))
                      }
                      options={logoCornerOptions}
                      help="Canto padrão. Arrastar na prévia sobrepõe o canto."
                    />
                    {s.defaultLogoPos ? (
                      <Button
                        size="xs"
                        tone="ghost"
                        onClick={() => setS((p) => ({ ...p, defaultLogoPos: null }))}
                        alignSelf="flex-start"
                      >
                        <RotateCcw size={12} /> Voltar a logo pro canto
                      </Button>
                    ) : null}
                  </Stack>
                ),
              },
            ]}
          />
          <Accordion
            multiple
            defaultValue={[]}
            items={[
              {
                value: "moldura",
                title: "Molduras",
                content: (
                  <Stack gap={3}>
                    <Help>
                      A <b>moldura</b> é a borda decorativa em volta da foto — tipo o anel colorido do
                      exemplo. Já vêm algumas prontas. Aqui você pode subir as <b>suas</b>: um PNG com
                      o <b>meio vazado</b> (transparente), pra a foto aparecer no buraco.
                    </Help>
                    <FormSelect
                      label="Moldura padrão"
                      value={defaultFrameValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.startsWith("image:")) {
                          setS((p) => ({ ...p, defaultFrameUrl: v.slice(6) }));
                        } else {
                          setS((p) => ({ ...p, defaultFrameUrl: "", defaultFramePresetId: v.slice(7) }));
                        }
                      }}
                      options={defaultFrameOptions}
                      help="A borda que já vem selecionada em cada avatar novo — inclusive as suas."
                    />
                    {s.frames.length > 0 ? (
                      <SimpleGrid columns={{ base: 2, sm: 3 }} gap={3}>
                        {s.frames.map((f, i) => (
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
                                setS((p) => {
                                  const frames = [...p.frames];
                                  frames[i] = { ...frames[i], label: e.target.value };
                                  return { ...p, frames };
                                })
                              }
                            />
                            <Button
                              tone="ghost"
                              size="xs"
                              onClick={() => setS((p) => ({ ...p, frames: p.frames.filter((x) => x.id !== f.id) }))}
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
                      {s.backgroundUrl ? (
                        <Box w="64px" h="64px" borderRadius="10px" borderWidth="1px" borderColor="var(--admin-border)" overflow="hidden">
                          <Image src={s.backgroundUrl} alt="Fundo" w="100%" h="100%" objectFit="cover" />
                        </Box>
                      ) : null}
                      <Button tone="outline" size="sm" onClick={() => pick("background")} loading={uploading}>
                        <Upload size={15} /> {s.backgroundUrl ? "Trocar fundo" : "Enviar fundo"}
                      </Button>
                      {s.backgroundUrl ? (
                        <Button tone="ghost" size="sm" onClick={() => setS((p) => ({ ...p, backgroundUrl: "" }))}>
                          Remover (usar cor)
                        </Button>
                      ) : null}
                    </HStack>
                    <Stack gap={1}>
                      <Text fontSize="xs" color="var(--admin-text-soft)">Cor de fundo (quando não há imagem)</Text>
                      <ColorPicker
                        value={s.defaultBackgroundColor}
                        onChange={(c) => setS((p) => ({ ...p, defaultBackgroundColor: c }))}
                        colors={AVATAR_COLORS}
                        columns={9}
                      />
                    </Stack>
                  </Stack>
                ),
              },
            ]}
          />
          </SimpleGrid>
        </Stack>
      </AvatarStudioLayout>
    </SidePanel>
  );
}
