"use client";
/**
 * Orquestrador do Gerador de Avatares (o componente que a tela do app monta).
 * Junta a galeria + o estúdio de geração + o painel "padrão da agência", e injeta
 * o <link> das fontes de display (o painel só carrega Hanken/Newsreader; sem isso
 * o canvas escreveria na fonte errada).
 *
 * Regra do design-system: dados + callbacks por props, IDs string→number nas bordas.
 * As actions (DB/Blob/remoção de fundo) ficam no app; aqui é UI pura.
 */
import { useState } from "react";
import { avatarFontsHref, AVATAR_FRAME_PRESETS, AVATAR_SIZES, defaultAvatarConfig } from "./constants";
import { AvatarGallery } from "./AvatarGallery";
import { AvatarStudioPanel } from "./AvatarStudioPanel";
import { AvatarSettingsPanel } from "./AvatarSettingsPanel";
import { toaster } from "../components/Toast";
import type {
  AvatarBrand,
  AvatarConfig,
  AvatarFramePreset,
  AvatarSaveData,
  AvatarSettings,
  AvatarSummary,
  AvatarUploadKind,
} from "./types";

/** Dados p/ reabrir um avatar no estúdio (buscados sob demanda ao abrir o card). */
export type AvatarEditData = {
  config: AvatarConfig;
  name: string;
  subtitle: string | null;
  size: number;
};

type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

export type AvatarStudioProps = {
  avatars: AvatarSummary[];
  settings: AvatarSettings;
  brand: AvatarBrand;
  framePresets?: readonly AvatarFramePreset[];
  onUpload: (file: File | Blob, kind: AvatarUploadKind, filename: string) => Promise<string>;
  onRemoveBackground?: (blob: Blob) => Promise<Blob>;
  onSave: (data: AvatarSaveData) => Promise<ActionResult>;
  onDelete: (id: number) => Promise<ActionResult>;
  onDuplicate: (id: number) => Promise<ActionResult>;
  onLoadConfig: (id: number) => Promise<AvatarEditData | null>;
  onSaveSettings: (settings: AvatarSettings) => Promise<{ ok: true } | { ok: false; error: string }>;
  onRefresh?: () => void;
};

export function AvatarStudio(props: AvatarStudioProps) {
  const presets = props.framePresets ?? AVATAR_FRAME_PRESETS;
  const [studioOpen, setStudioOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editing, setEditing] = useState<{
    config: AvatarConfig;
    name: string;
    subtitle: string;
    size: number;
    id?: number;
  } | null>(null);

  const openNew = () => {
    setEditing({
      config: defaultAvatarConfig(props.settings, props.brand.logoUrl),
      name: "",
      subtitle: props.settings.fixedSubtitle ?? "",
      size: AVATAR_SIZES[0],
      id: undefined,
    });
    setStudioOpen(true);
  };

  const openExisting = async (id: number) => {
    if (opening) return;
    setOpening(true);
    try {
      const data = await props.onLoadConfig(id);
      if (!data) {
        toaster.create({ title: "Avatar não encontrado", type: "error" });
        return;
      }
      setEditing({
        config: data.config,
        name: data.name,
        subtitle: data.subtitle ?? "",
        size: AVATAR_SIZES.includes(data.size as (typeof AVATAR_SIZES)[number]) ? data.size : AVATAR_SIZES[0],
        id,
      });
      setStudioOpen(true);
    } catch (err) {
      toaster.create({ title: "Falha ao abrir", description: String(err), type: "error" });
    } finally {
      setOpening(false);
    }
  };

  const refresh = () => props.onRefresh?.();

  const duplicate = async (id: number) => {
    const res = await props.onDuplicate(id);
    if (!res.ok) throw new Error(res.error);
    refresh();
  };

  const remove = async (id: number) => {
    const res = await props.onDelete(id);
    if (!res.ok) throw new Error(res.error);
    refresh();
  };

  return (
    <>
      {/* React 19 iça este <link> pro <head> e deduplica. Carrega as fontes de
          display do seletor — sem isso o canvas cai no fallback (texto errado). */}
      <link rel="stylesheet" href={avatarFontsHref()} />

      <AvatarGallery
        avatars={props.avatars}
        onCreate={openNew}
        onOpen={openExisting}
        onDuplicate={duplicate}
        onDelete={remove}
        onSettings={() => setSettingsOpen(true)}
      />

      {editing ? (
        <AvatarStudioPanel
          open={studioOpen}
          onClose={() => setStudioOpen(false)}
          initialConfig={editing.config}
          initialName={editing.name}
          initialSubtitle={editing.subtitle}
          initialSize={editing.size}
          avatarId={editing.id}
          settings={props.settings}
          brand={props.brand}
          presets={presets}
          onUpload={props.onUpload}
          onRemoveBackground={props.onRemoveBackground}
          onSave={props.onSave}
          onSaved={refresh}
        />
      ) : null}

      <AvatarSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={props.settings}
        presets={presets}
        onUpload={props.onUpload}
        onSave={props.onSaveSettings}
        onSaved={refresh}
      />
    </>
  );
}
