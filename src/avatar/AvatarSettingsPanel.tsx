"use client";
/**
 * "Padrão da agência" — o molde reaproveitado em TODO avatar: molduras próprias
 * (PNG com centro vazado), logo, fundo padrão, legenda fixa, fonte e moldura
 * default. A agência configura uma vez; todo avatar novo já nasce com esse padrão
 * (`defaultAvatarConfig`). O painel mostra uma PRÉVIA ao vivo do molde ao lado do
 * formulário, e explica cada campo (o usuário se confundia com "moldura" etc.).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Box, Flex, HStack, Image, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormInput, FormSelect } from "../components/form";
import { ColorPicker } from "../components/ColorPicker";
import { SidePanel } from "../components/SidePanel";
import { toaster } from "../components/Toast";
import { AvatarCanvas } from "./AvatarCanvas";
import { AVATAR_COLORS, AVATAR_FONTS, defaultAvatarConfig } from "./constants";
import type {
  AvatarBrand,
  AvatarFramePreset,
  AvatarSettings,
  AvatarUploadKind,
} from "./types";

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

/** Rótulo em maiúsculas de seção (padrão dos painéis). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">
      {children}
    </Text>
  );
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

  const presetOptions = props.presets.map((p) => ({ value: p.id, label: p.label }));

  return (
    <SidePanel
      open={props.open}
      onClose={props.onClose}
      title="Padrão da agência"
      size="xl"
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

      <Flex gap={6} direction={{ base: "column", lg: "row" }} align="flex-start">
        {/* PRÉVIA ao vivo do molde — fica visível enquanto se edita (sticky no desktop). */}
        <Stack
          gap={3}
          w={{ base: "100%", lg: "300px" }}
          flexShrink={0}
          position={{ lg: "sticky" }}
          top="0"
        >
          <SectionLabel>Prévia</SectionLabel>
          <AvatarCanvas
            config={previewConfig}
            title={sampleName || "Nome"}
            subtitle={s.fixedSubtitle}
            presets={props.presets}
            maxSize={300}
          />
          <Help>
            É assim que <b>todo avatar novo</b> já começa. A foto da pessoa entra no círculo
            depois, na hora de criar.
          </Help>
          <FormInput
            label="Ver com o nome"
            size="sm"
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="Ex.: Maria"
          />
        </Stack>

        {/* FORMULÁRIO do padrão. */}
        <Stack gap={4} flex="1" minW={0} w="100%">
          <Help>
            O <b>padrão da agência</b> é o molde dos seus avatares: tudo que você definir aqui já
            vem pronto em todo avatar novo. Configure uma vez — depois é só subir a foto de cada
            pessoa e ajustar o que quiser.
          </Help>

          {/* Molduras */}
          <Card p={4}>
            <Stack gap={3}>
              <SectionLabel>Molduras</SectionLabel>
              <Help>
                A <b>moldura</b> é a borda decorativa em volta da foto — tipo o anel colorido do
                exemplo. Já vêm algumas prontas (você escolhe a padrão em “Estilo”, abaixo). Aqui
                você pode subir as <b>suas</b>: um PNG com o <b>meio vazado</b> (transparente), pra
                a foto aparecer no buraco. Elas ficam disponíveis na hora de criar cada avatar.
              </Help>
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
          </Card>

          {/* Logo */}
          <Card p={4}>
            <Stack gap={3}>
              <SectionLabel>Logo</SectionLabel>
              <Help>
                Marca d’água que aparece num canto do avatar. Deixe <b>vazio</b> pra usar o logo do
                site automaticamente.
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
            </Stack>
          </Card>

          {/* Fundo */}
          <Card p={4}>
            <Stack gap={3}>
              <SectionLabel>Fundo</SectionLabel>
              <Help>
                O que aparece <b>atrás</b> da foto. Pode ser uma imagem (ex.: um respingo de tinta)
                ou uma cor sólida. Sem imagem, usa a <b>cor</b> escolhida abaixo.
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
          </Card>

          {/* Texto & estilo */}
          <Card p={4}>
            <Stack gap={3}>
              <SectionLabel>Texto e estilo</SectionLabel>
              <FormInput
                label="Legenda fixa"
                value={s.fixedSubtitle}
                onChange={(e) => setS((p) => ({ ...p, fixedSubtitle: e.target.value }))}
                placeholder="Ex.: CARA PINTADA"
                help="2ª linha embaixo do nome, igual em todos (ex.: o nome da agência). Vazio = sem 2ª linha."
              />
              <Flex gap={4} direction={{ base: "column", sm: "row" }}>
                <Box flex="1">
                  <FormSelect
                    label="Fonte"
                    value={s.defaultFont}
                    onChange={(e) => setS((p) => ({ ...p, defaultFont: e.target.value }))}
                    options={AVATAR_FONTS.map((f) => ({ value: f.family, label: f.label }))}
                    help="A tipografia do nome."
                  />
                </Box>
                <Box flex="1">
                  <FormSelect
                    label="Moldura padrão"
                    value={s.defaultFramePresetId}
                    onChange={(e) => setS((p) => ({ ...p, defaultFramePresetId: e.target.value }))}
                    options={presetOptions}
                    help="A borda que já vem selecionada em cada avatar novo."
                  />
                </Box>
              </Flex>
            </Stack>
          </Card>
        </Stack>
      </Flex>
    </SidePanel>
  );
}
