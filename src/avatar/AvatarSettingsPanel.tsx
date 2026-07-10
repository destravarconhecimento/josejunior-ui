"use client";
/**
 * "Padrão da agência" — o que fica DETERMINADO e reaproveitado em todo avatar:
 * molduras próprias (PNG com centro vazado), logo, fundo padrão, legenda fixa,
 * fonte e moldura default. A agência configura uma vez; todo avatar novo já nasce
 * com esse padrão (`defaultAvatarConfig`).
 */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Box, Flex, HStack, Image, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { FormInput, FormSelect } from "../components/form";
import { ColorPicker } from "../components/ColorPicker";
import { SidePanel } from "../components/SidePanel";
import { toaster } from "../components/Toast";
import { AVATAR_COLORS, AVATAR_FONTS } from "./constants";
import type { AvatarFramePreset, AvatarSettings, AvatarUploadKind } from "./types";

export type AvatarSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  settings: AvatarSettings;
  presets: readonly AvatarFramePreset[];
  onUpload: (file: File | Blob, kind: AvatarUploadKind, filename: string) => Promise<string>;
  onSave: (settings: AvatarSettings) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSaved?: () => void;
};

function frameId(): string {
  return `m_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

export function AvatarSettingsPanel(props: AvatarSettingsPanelProps) {
  const [s, setS] = useState<AvatarSettings>(props.settings);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pending = useRef<AvatarUploadKind>("frame");

  useEffect(() => {
    if (props.open) setS(props.settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

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
      size="lg"
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

      <Stack gap={2}>
        <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)">
          Molduras da agência
        </Text>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          PNGs com o miolo transparente (a foto aparece por baixo). Além dos presets prontos.
        </Text>
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
        ) : null}
        <Button tone="outline" size="sm" onClick={() => pick("frame")} loading={uploading} alignSelf="flex-start">
          <ImagePlus size={15} /> Adicionar moldura
        </Button>
      </Stack>

      <Stack gap={3}>
        <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)">
          Logo padrão
        </Text>
        <HStack gap={3} align="center">
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
              Usar logo da marca
            </Button>
          ) : null}
        </HStack>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          Vazio = usa o logo da marca do site.
        </Text>
      </Stack>

      <Stack gap={3}>
        <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)">
          Fundo padrão
        </Text>
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
          <Text fontSize="xs" color="var(--admin-text-soft)">Cor de fundo padrão (quando não há imagem)</Text>
          <ColorPicker
            value={s.defaultBackgroundColor}
            onChange={(c) => setS((p) => ({ ...p, defaultBackgroundColor: c }))}
            colors={AVATAR_COLORS}
            columns={9}
          />
        </Stack>
      </Stack>

      <Flex gap={4} direction={{ base: "column", sm: "row" }}>
        <Box flex="1">
          <FormInput
            label="Legenda fixa"
            value={s.fixedSubtitle}
            onChange={(e) => setS((p) => ({ ...p, fixedSubtitle: e.target.value }))}
            placeholder="Ex.: CARA PINTADA"
            help="2ª linha embaixo do nome, igual em todos."
          />
        </Box>
      </Flex>

      <Flex gap={4} direction={{ base: "column", sm: "row" }}>
        <Box flex="1">
          <FormSelect
            label="Fonte padrão"
            value={s.defaultFont}
            onChange={(e) => setS((p) => ({ ...p, defaultFont: e.target.value }))}
            options={AVATAR_FONTS.map((f) => ({ value: f.family, label: f.label }))}
          />
        </Box>
        <Box flex="1">
          <FormSelect
            label="Moldura padrão"
            value={s.defaultFramePresetId}
            onChange={(e) => setS((p) => ({ ...p, defaultFramePresetId: e.target.value }))}
            options={presetOptions}
          />
        </Box>
      </Flex>
    </SidePanel>
  );
}
