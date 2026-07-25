"use client";
/**
 * Gestão de "Evoluções" (comparações antes/depois) — módulo do personal trainer.
 * Componente PURO do design-system: recebe a lista + callbacks e não sabe nada de
 * server actions. Cada card mostra as duas fotos lado a lado, o título/subtítulo e
 * o destaque na home. O modal cria/edita com dois campos de upload (antes/depois),
 * título, subtítulo e o switch de destaque.
 *
 * Upload: `onUpload(file)` sobe direto pro Blob e devolve a URL pública (o app liga
 * isso no client-upload). Aqui só guardamos a URL no rascunho.
 */
import { useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Star, Trash2, TrendingUp } from "lucide-react";
import { Box, Flex, Heading, HStack, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { Screen } from "./Screen";
import { FormInput, FormTextarea } from "./form";
import { Switch } from "./controls";
import { useConfirm } from "./useConfirm";
import { toaster } from "./Toast";

export type EvolucaoItem = {
  id: number;
  title: string;
  subtitle: string | null;
  beforeUrl: string | null;
  /** Foto do "durante" — opcional (antes/durante/depois). */
  duringUrl: string | null;
  afterUrl: string | null;
  featured: boolean;
};

export type EvolucaoSaveData = {
  title: string;
  subtitle: string;
  beforeUrl: string | null;
  duringUrl: string | null;
  afterUrl: string | null;
  featured: boolean;
};

export type EvolucoesManagerProps = {
  /** Título da tela (o componente é dono do `Screen` — a ação "Nova evolução" vive no header). */
  title: string;
  items: EvolucaoItem[];
  onCreate: (data: EvolucaoSaveData) => Promise<void> | void;
  onUpdate: (id: number, data: EvolucaoSaveData) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
  onToggleFeatured: (id: number, featured: boolean) => Promise<void> | void;
  /** Sobe o arquivo pro Blob e devolve a URL pública. */
  onUpload: (file: File) => Promise<string>;
};

type Draft = {
  title: string;
  subtitle: string;
  beforeUrl: string | null;
  duringUrl: string | null;
  afterUrl: string | null;
  featured: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  subtitle: "",
  beforeUrl: null,
  duringUrl: null,
  afterUrl: null,
  featured: true,
};

export function EvolucoesManager({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onToggleFeatured,
  onUpload,
}: EvolucoesManagerProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const openNew = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setOpen(true);
  };

  const openEdit = (it: EvolucaoItem) => {
    setEditingId(it.id);
    setDraft({
      title: it.title,
      subtitle: it.subtitle ?? "",
      beforeUrl: it.beforeUrl,
      duringUrl: it.duringUrl,
      afterUrl: it.afterUrl,
      featured: it.featured,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title.trim()) {
      toaster.create({ title: "Dê um título", description: "Nome da pessoa ou título da evolução.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const data: EvolucaoSaveData = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        beforeUrl: draft.beforeUrl,
        duringUrl: draft.duringUrl,
        afterUrl: draft.afterUrl,
        featured: draft.featured,
      };
      if (editingId == null) await onCreate(data);
      else await onUpdate(editingId, data);
      setOpen(false);
    } catch (err) {
      toaster.create({ title: "Falha ao salvar", description: String(err), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (it: EvolucaoItem) => {
    const ok = await confirm({
      title: "Excluir evolução?",
      description: `“${it.title}” será removida. Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(it.id);
    try {
      await onDelete(it.id);
    } catch (err) {
      toaster.create({ title: "Falha ao excluir", description: String(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (it: EvolucaoItem) => {
    setBusyId(it.id);
    try {
      await onToggleFeatured(it.id, !it.featured);
    } catch (err) {
      toaster.create({ title: "Falha ao atualizar", description: String(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen
      title={title}
      actions={
        <Button tone="primary" onClick={openNew}>
          <Plus size={18} /> Nova evolução
        </Button>
      }
    >
      <Stack gap={5}>
        {items.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhuma evolução ainda"
          description="Mostre resultados reais: envie a foto do antes e do depois, dê um título e pronto — a seção aparece sozinha no seu site."
          action={
            <Button tone="primary" onClick={openNew}>
              <Plus size={18} /> Criar evolução
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5}>
          {items.map((it) => (
            <Card key={it.id} p={0} overflow="hidden">
              <SimpleGrid columns={it.duringUrl ? 3 : 2} gap={0}>
                <Thumb url={it.beforeUrl} label="Antes" />
                {it.duringUrl ? <Thumb url={it.duringUrl} label="Durante" /> : null}
                <Thumb url={it.afterUrl} label="Depois" accent />
              </SimpleGrid>
              <Stack gap={2} p={3}>
                <Heading size="sm" lineClamp={1} title={it.title}>
                  {it.title}
                </Heading>
                {it.subtitle ? (
                  <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={2}>
                    {it.subtitle}
                  </Text>
                ) : null}
                <HStack justify="space-between" pt={1}>
                  <Button
                    tone={it.featured ? "primary" : "ghost"}
                    size="xs"
                    onClick={() => toggle(it)}
                    disabled={busyId === it.id}
                    title={it.featured ? "Em destaque na home" : "Fora da home"}
                  >
                    <Star size={14} fill={it.featured ? "currentColor" : "none"} />
                    {it.featured ? "Na home" : "Oculta"}
                  </Button>
                  <HStack gap={1}>
                    <Button tone="ghost" size="xs" onClick={() => openEdit(it)} title="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      tone="ghost"
                      size="xs"
                      onClick={() => remove(it)}
                      disabled={busyId === it.id}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </HStack>
                </HStack>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId == null ? "Nova evolução" : "Editar evolução"}
        footer={
          <>
            <Button tone="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button tone="primary" onClick={save} loading={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <SimpleGrid columns={3} gap={4}>
          <ImageDrop
            label="Antes"
            url={draft.beforeUrl}
            onUpload={onUpload}
            onChange={(url) => setDraft((d) => ({ ...d, beforeUrl: url }))}
          />
          <ImageDrop
            label="Durante"
            hint="opcional"
            url={draft.duringUrl}
            onUpload={onUpload}
            onChange={(url) => setDraft((d) => ({ ...d, duringUrl: url }))}
            onClear={() => setDraft((d) => ({ ...d, duringUrl: null }))}
          />
          <ImageDrop
            label="Depois"
            url={draft.afterUrl}
            onUpload={onUpload}
            onChange={(url) => setDraft((d) => ({ ...d, afterUrl: url }))}
          />
        </SimpleGrid>

        <FormInput
          label="Título (nome da pessoa ou chamada)"
          required
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Ex.: Maria — 8 meses de treino"
        />
        <FormTextarea
          label="Subtítulo (opcional)"
          value={draft.subtitle}
          onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
          placeholder="Ex.: -12kg, ganho de massa e mais disposição"
          rows={2}
        />

        <Switch.Root
          checked={draft.featured}
          onCheckedChange={(e) => setDraft((d) => ({ ...d, featured: e.checked }))}
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Mostrar na home (seção de destaque)</Switch.Label>
        </Switch.Root>
      </Modal>

        {confirmDialog}
      </Stack>
    </Screen>
  );
}

/** Miniatura de uma foto (card da lista) com o rótulo Antes/Depois. */
function Thumb({ url, label, accent }: { url: string | null; label: string; accent?: boolean }) {
  return (
    <Box position="relative" style={{ aspectRatio: "3 / 4" }} bg="#0b1220" overflow="hidden">
      {url ? (
        <Box
          position="absolute"
          inset="0"
          backgroundImage={`url(${url})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        />
      ) : (
        <Flex align="center" justify="center" h="100%" color="whiteAlpha.500">
          <ImagePlus size={20} />
        </Flex>
      )}
      <Box
        position="absolute"
        top="1.5"
        left="1.5"
        px={2}
        py={0.5}
        borderRadius="999px"
        fontSize="10px"
        fontWeight="700"
        color="white"
        bg={accent ? "var(--admin-primary)" : "rgba(15,23,42,0.72)"}
      >
        {label}
      </Box>
    </Box>
  );
}

/** Campo de upload de UMA foto: mostra a prévia ou o placeholder; sobe no clique. */
function ImageDrop({
  label,
  hint,
  url,
  onUpload,
  onChange,
  onClear,
}: {
  label: string;
  /** Ex.: "opcional" — texto discreto ao lado do rótulo. */
  hint?: string;
  url: string | null;
  onUpload: (file: File) => Promise<string>;
  onChange: (url: string) => void;
  /** Quando definido, mostra um "×" para remover a foto (usado no campo opcional). */
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const uploaded = await onUpload(file);
      onChange(uploaded);
    } catch (err) {
      toaster.create({ title: "Falha no envio", description: String(err), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap={1.5}>
      <HStack gap={1.5} justify="space-between">
        <Text fontSize="sm" fontWeight="600" color="var(--admin-primary)">
          {label}
          {hint ? (
            <Text as="span" fontWeight="500" color="var(--admin-text-soft)">
              {" "}
              ({hint})
            </Text>
          ) : null}
        </Text>
        {url && onClear ? (
          <Box
            as="button"
            onClick={onClear}
            fontSize="xs"
            color="var(--admin-text-soft)"
            _hover={{ color: "var(--admin-primary)" }}
            title="Remover foto"
          >
            <Trash2 size={14} />
          </Box>
        ) : null}
      </HStack>
      <Box
        as="button"
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        position="relative"
        w="100%"
        style={{ aspectRatio: "3 / 4" }}
        borderRadius="12px"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="var(--admin-border)"
        bg="var(--admin-surface)"
        backgroundImage={url ? `url(${url})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        overflow="hidden"
        cursor={busy ? "wait" : "pointer"}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {!url || busy ? (
          <Stack gap={1} align="center" color="var(--admin-text-soft)">
            <ImagePlus size={22} />
            <Text fontSize="xs">{busy ? "Enviando…" : "Enviar foto"}</Text>
          </Stack>
        ) : null}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = "";
        }}
      />
    </Stack>
  );
}
