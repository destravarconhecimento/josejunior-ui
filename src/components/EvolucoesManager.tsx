"use client";
/**
 * Gestão de "Evoluções" (comparações antes/depois) — módulo do personal trainer.
 * Componente PURO do design-system: recebe a lista + callbacks e não sabe nada de
 * server actions. Cada card mostra a faixa de fotos, o título/subtítulo e o
 * destaque na home. O modal cria/edita com ATÉ 5 fotos, cada uma com a sua
 * legenda editável (vazia = a padrão Antes/Durante/Depois).
 *
 * Alinhamento do grid: a faixa de fotos tem proporção FIXA (3:2), não importa se
 * o item tem 2 ou 5 fotos — sem isso, um card de 3 fotos ficava mais baixo e
 * desalinhava a linha inteira.
 *
 * Upload: `onUpload(file)` sobe direto pro Blob e devolve a URL pública (o app liga
 * isso no client-upload). Aqui só guardamos a URL no rascunho.
 */
import { useRef, useState } from "react";
import { Download, ImagePlus, Pencil, Plus, Star, Trash2, TrendingUp } from "lucide-react";
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
import {
  legendaDaFoto,
  legendaPadraoEvolucao,
  MAX_EVOLUCAO_FOTOS,
  type EvolucaoFoto,
} from "../evolucao/types";

export type EvolucaoItem = {
  id: number;
  title: string;
  subtitle: string | null;
  /** Fotos na ordem em que aparecem (até 5), cada uma com a sua legenda. */
  photos: EvolucaoFoto[];
  featured: boolean;
};

export type EvolucaoSaveData = {
  title: string;
  subtitle: string;
  photos: EvolucaoFoto[];
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
  /** Quando definido, cada card ganha o botão de baixar a arte 9:16. */
  onArte?: (item: EvolucaoItem) => void;
};

/** Slot do formulário: a URL pode estar vazia (o campo ainda não recebeu foto). */
type Slot = { url: string; caption: string };

type Draft = {
  title: string;
  subtitle: string;
  slots: Slot[];
  featured: boolean;
};

const SLOT_VAZIO: Slot = { url: "", caption: "" };

const EMPTY_DRAFT: Draft = {
  title: "",
  subtitle: "",
  slots: [{ ...SLOT_VAZIO }, { ...SLOT_VAZIO }],
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
  onArte,
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
    const slots: Slot[] = it.photos.map((p) => ({ url: p.url, caption: p.caption ?? "" }));
    while (slots.length < 2) slots.push({ ...SLOT_VAZIO });
    setDraft({
      title: it.title,
      subtitle: it.subtitle ?? "",
      slots,
      featured: it.featured,
    });
    setOpen(true);
  };

  const setSlot = (i: number, patch: Partial<Slot>) =>
    setDraft((d) => ({ ...d, slots: d.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const addSlot = () =>
    setDraft((d) =>
      d.slots.length >= MAX_EVOLUCAO_FOTOS ? d : { ...d, slots: [...d.slots, { ...SLOT_VAZIO }] },
    );

  const removeSlot = (i: number) =>
    setDraft((d) => ({ ...d, slots: d.slots.filter((_, j) => j !== i) }));

  const save = async () => {
    if (!draft.title.trim()) {
      toaster.create({ title: "Dê um título", description: "Nome da pessoa ou título da evolução.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const photos: EvolucaoFoto[] = draft.slots
        .filter((s) => s.url.trim())
        .slice(0, MAX_EVOLUCAO_FOTOS)
        .map((s) => ({ url: s.url.trim(), caption: s.caption.trim() || null }));
      const data: EvolucaoSaveData = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        photos,
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

  const total = draft.slots.length;

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
          description="Mostre resultados reais: envie as fotos do antes e do depois, dê um título e pronto — a seção aparece sozinha no seu site."
          action={
            <Button tone="primary" onClick={openNew}>
              <Plus size={18} /> Criar evolução
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5}>
          {items.map((it) => (
            <Card
              key={it.id}
              p={0}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              bodyProps={{ display: "flex", flexDirection: "column", flex: "1", minHeight: 0 }}
            >
              {/* Faixa de fotos: proporção FIXA (3:2) e as fotos dividindo a
                  largura — 2 ou 5 fotos ocupam a mesma altura, então os cards
                  da linha continuam alinhados. */}
              <Flex style={{ aspectRatio: "3 / 2" }} bg="#0b1220" flexShrink={0}>
                {(it.photos.length ? it.photos : [{ url: "", caption: null }]).map((p, i) => (
                  <Thumb
                    key={`${it.id}-${i}`}
                    url={p.url || null}
                    label={legendaDaFoto(p, i, it.photos.length)}
                    accent={i === it.photos.length - 1 && it.photos.length > 1}
                  />
                ))}
              </Flex>
              <Stack gap={2} p={3} flex="1">
                <Heading size="sm" lineClamp={1} title={it.title}>
                  {it.title}
                </Heading>
                {it.subtitle ? (
                  <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={2}>
                    {it.subtitle}
                  </Text>
                ) : null}
                <HStack justify="space-between" pt={1} mt="auto">
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
                    {onArte ? (
                      <Button
                        tone="ghost"
                        size="xs"
                        onClick={() => onArte(it)}
                        disabled={it.photos.length === 0}
                        title="Baixar arte 9:16"
                      >
                        <Download size={14} />
                      </Button>
                    ) : null}
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
        size="lg"
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
        <Stack gap={3}>
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="600">
              Fotos <Text as="span" color="var(--admin-text-soft)">({total} de {MAX_EVOLUCAO_FOTOS})</Text>
            </Text>
            <Button tone="outline" size="xs" onClick={addSlot} disabled={total >= MAX_EVOLUCAO_FOTOS}>
              <Plus size={14} /> Adicionar foto
            </Button>
          </HStack>
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
            {draft.slots.map((slot, i) => (
              <ImageDrop
                key={i}
                caption={slot.caption}
                placeholder={legendaPadraoEvolucao(i, total)}
                onCaption={(caption) => setSlot(i, { caption })}
                url={slot.url || null}
                onUpload={onUpload}
                onChange={(url) => setSlot(i, { url })}
                onRemove={total > 1 ? () => removeSlot(i) : undefined}
              />
            ))}
          </SimpleGrid>
          <Text fontSize="xs" color="var(--admin-text-soft)">
            A legenda acima de cada foto é sua: deixe em branco e vale o padrão
            (Antes · Durante · Depois).
          </Text>
        </Stack>

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

/** Miniatura de uma foto (card da lista) com a legenda. */
function Thumb({ url, label, accent }: { url: string | null; label: string; accent?: boolean }) {
  return (
    <Box position="relative" flex="1" minW={0} h="100%" bg="#0b1220" overflow="hidden">
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
        maxW="calc(100% - 12px)"
        px={2}
        py={0.5}
        borderRadius="999px"
        fontSize="10px"
        fontWeight="700"
        color="white"
        bg={accent ? "var(--admin-primary)" : "rgba(15,23,42,0.72)"}
        lineClamp={1}
        title={label}
      >
        {label}
      </Box>
    </Box>
  );
}

/**
 * Uma foto do formulário: a LEGENDA em cima (editável, com o padrão da posição
 * como placeholder) e o campo de upload embaixo — sobe no clique.
 */
function ImageDrop({
  caption,
  placeholder,
  onCaption,
  url,
  onUpload,
  onChange,
  onRemove,
}: {
  caption: string;
  /** Legenda padrão da posição (Antes/Durante/Depois) — só o placeholder. */
  placeholder: string;
  onCaption: (v: string) => void;
  url: string | null;
  onUpload: (file: File) => Promise<string>;
  onChange: (url: string) => void;
  /** Quando definido, mostra o "×" que tira a foto da lista. */
  onRemove?: () => void;
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
      <HStack gap={1.5}>
        <Box flex="1" minW={0}>
          <FormInput
            value={caption}
            onChange={(e) => onCaption(e.target.value)}
            placeholder={placeholder}
            size="sm"
            aria-label="Legenda da foto"
          />
        </Box>
        {onRemove ? (
          <Box
            as="button"
            onClick={onRemove}
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
