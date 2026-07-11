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
import { useMemo, useState } from "react";
import { PencilLine, Plus, Settings2, UserRound } from "lucide-react";
import {
  avatarFontsHref,
  avatarPresets,
  AVATAR_FRAME_PRESETS,
  AVATAR_SIZES,
  defaultAvatarConfig,
  recipeOf,
  resolveAvatarPreset,
} from "./constants";
import { AvatarGallery } from "./AvatarGallery";
import { AvatarStudioPanel } from "./AvatarStudioPanel";
import { AvatarSettingsPanel } from "./AvatarSettingsPanel";
import { Box, Flex, HStack, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { EntityAvatar } from "../components/EntityAvatar";
import { FormInput } from "../components/form";
import { Modal } from "../components/Modal";
import { PageBody } from "../components/PageBody";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toast";
import type {
  AvatarBrand,
  AvatarConfig,
  AvatarFramePreset,
  AvatarMember,
  AvatarPreset,
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

/**
 * Nome de membro LIMPO pro estúdio. Os nicks (Kako etc.) vêm cheios de emoji,
 * símbolos e letras "decoradas" (full-width): "✨Ｌｕａｎ✨", "『JR』". Ao escolher um
 * host (em vez de digitar à mão), tira essa sujeira — dobra full-width pra ASCII
 * (NFKC), remove tudo que não é letra/número/espaço/pontuação básica e normaliza
 * os espaços. Assim o nome que vai pro avatar (e pro registro salvo) fica legível.
 */
function cleanMemberName(raw: string): string {
  return (raw || "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s'.,&-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export type AvatarStudioProps = {
  /** Título da tela (fica no PageHeader, junto das ações). */
  title?: string;
  avatars: AvatarSummary[];
  settings: AvatarSettings;
  brand: AvatarBrand;
  /** Roster da agência: se houver membros, "Novo avatar" oferece escolher um (prefill nome+foto). */
  members?: AvatarMember[];
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
  const members = props.members ?? [];
  const padroes = useMemo(() => avatarPresets(props.settings), [props.settings]);
  const defaultPadraoId = useMemo(() => resolveAvatarPreset(props.settings).id, [props.settings]);
  const [studioOpen, setStudioOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editing, setEditing] = useState<{
    config: AvatarConfig;
    name: string;
    subtitle: string;
    size: number;
    id?: number;
    /** Settings ATIVAS (padrão escolhido espelhado na receita) que o estúdio usa de fallback. */
    settings: AvatarSettings;
  } | null>(null);

  /**
   * Abre o estúdio semeando do PADRÃO escolhido (`padraoId`), com nome/foto
   * opcionais (do membro). O estúdio recebe as settings com a receita do padrão
   * escolhido no topo, mantendo a biblioteca de molduras compartilhada.
   */
  const openBlank = (seed?: { name?: string; photoUrl?: string | null }, padraoId?: string) => {
    const preset = resolveAvatarPreset(props.settings, padraoId);
    const active: AvatarSettings = { ...props.settings, ...recipeOf(preset) };
    const base = defaultAvatarConfig(preset, props.brand.logoUrl);
    setEditing({
      config: { ...base, photoUrl: seed?.photoUrl?.trim() || base.photoUrl },
      name: seed?.name?.trim() ?? "",
      subtitle: preset.fixedSubtitle ?? "",
      size: AVATAR_SIZES[0],
      id: undefined,
      settings: active,
    });
    setPickerOpen(false);
    setStudioOpen(true);
  };

  /** "Novo avatar": se há roster OU mais de um padrão, escolhe antes; senão vai direto. */
  const openNew = () => {
    if (members.length > 0 || padroes.length > 1) setPickerOpen(true);
    else openBlank();
  };

  const pickMember = (m: AvatarMember, padraoId?: string) =>
    openBlank({ name: cleanMemberName(m.name), photoUrl: m.photoUrl }, padraoId);

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
        // Editar um avatar já criado usa as settings inteiras (biblioteca de molduras completa).
        settings: props.settings,
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

      {/* Ações primárias na LINHA do título (padrão dos painéis), não numa faixa
          solta acima da galeria. */}
      <PageHeader
        title={props.title ?? "Avatares"}
        actions={
          <>
            <Button tone="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={16} /> Padrões da agência
            </Button>
            <Button tone="primary" onClick={openNew}>
              <Plus size={18} /> Novo avatar
            </Button>
          </>
        }
      />

      <PageBody>
        <AvatarGallery
          avatars={props.avatars}
          onCreate={openNew}
          onOpen={openExisting}
          onDuplicate={duplicate}
          onDelete={remove}
        />
      </PageBody>

      {editing ? (
        <AvatarStudioPanel
          open={studioOpen}
          onClose={() => setStudioOpen(false)}
          initialConfig={editing.config}
          initialName={editing.name}
          initialSubtitle={editing.subtitle}
          initialSize={editing.size}
          avatarId={editing.id}
          settings={editing.settings}
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
        brand={props.brand}
        presets={presets}
        onUpload={props.onUpload}
        onSave={props.onSaveSettings}
        onSaved={refresh}
      />

      <MemberPicker
        open={pickerOpen}
        members={members}
        padroes={padroes}
        defaultPadraoId={defaultPadraoId}
        onClose={() => setPickerOpen(false)}
        onPick={pickMember}
        onManual={(padraoId) => openBlank(undefined, padraoId)}
      />
    </>
  );
}

/**
 * Passo do "Novo avatar": escolhe QUAL padrão aplicar (quando a agência tem mais
 * de um) e, para agências com roster, qual membro pré-preenche nome+foto — ou
 * segue no caminho manual (em branco). O padrão selecionado é passado adiante
 * para semear o avatar novo.
 */
function MemberPicker({
  open,
  members,
  padroes,
  defaultPadraoId,
  onClose,
  onPick,
  onManual,
}: {
  open: boolean;
  members: AvatarMember[];
  padroes: AvatarPreset[];
  defaultPadraoId: string;
  onClose: () => void;
  onPick: (m: AvatarMember, padraoId: string) => void;
  onManual: (padraoId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [padraoId, setPadraoId] = useState(defaultPadraoId);
  // Se o padrão selecionado sumiu (agência excluiu), cai no inicial atual.
  const selId = padroes.some((p) => p.id === padraoId) ? padraoId : defaultPadraoId;
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) => `${m.name} ${m.category ?? ""}`.toLowerCase().includes(term));
  }, [members, q]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo avatar"
      size="xl"
      footer={
        <Flex justify="space-between" align="center" w="100%" gap={2} flexWrap="wrap">
          <Button tone={members.length > 0 ? "outline" : "primary"} onClick={() => onManual(selId)}>
            <PencilLine size={16} /> {members.length > 0 ? "Preencher manualmente" : "Começar"}
          </Button>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </Flex>
      }
    >
      {padroes.length > 1 ? (
        <Stack gap={1.5}>
          <Text fontSize="xs" fontWeight="600" color="var(--admin-text-soft)">
            Padrão
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {padroes.map((p) => (
              <Button
                key={p.id}
                size="sm"
                tone={p.id === selId ? "primary" : "outline"}
                onClick={() => setPadraoId(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </HStack>
        </Stack>
      ) : null}

      {members.length === 0 ? (
        <Text fontSize="sm" color="var(--admin-text-soft)">
          {padroes.length > 1
            ? "Escolha o padrão e comece — nome e foto você preenche no estúdio."
            : "Comece um avatar do zero — nome e foto você preenche no estúdio."}
        </Text>
      ) : (
        <>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Escolha um membro para começar — nome e foto já entram preenchidos. Você ainda ajusta tudo no estúdio.
          </Text>
          <FormInput
            label="Buscar membro"
            size="sm"
            value={q}
            placeholder="Nome ou categoria…"
            onChange={(e) => setQ(e.target.value)}
          />
          {filtered.length === 0 ? (
            <Text fontSize="sm" color="var(--admin-text-soft)" py={2}>
              Nenhum membro bate com “{q}”.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3}>
              {filtered.map((m, i) => (
                <Box
                  as="button"
                  key={`${m.name}-${i}`}
                  onClick={() => onPick(m, selId)}
                  textAlign="left"
                  p={3}
                  borderRadius="12px"
                  borderWidth="1px"
                  borderColor="var(--admin-border)"
                  bg="var(--admin-surface)"
                  cursor="pointer"
                  transition="border-color .12s, background .12s"
                  _hover={{ borderColor: "var(--admin-primary)", bg: "var(--admin-bg)" }}
                >
                  <Flex gap={3} align="center" minW={0}>
                    <EntityAvatar name={m.name || "?"} src={m.photoUrl?.trim() || undefined} size="md" />
                    <Stack gap={0.5} minW={0}>
                      <Text fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                        {m.name || "(sem nome)"}
                      </Text>
                      {m.category ? (
                        <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                          {m.category}
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="var(--admin-text-soft)">
                          <UserRound size={11} style={{ display: "inline", marginRight: 3 }} /> Membro
                        </Text>
                      )}
                    </Stack>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </Modal>
  );
}
