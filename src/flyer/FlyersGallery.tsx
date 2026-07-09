"use client";
/**
 * Galeria de flyers (a tela de lista — §11 do doc). Cada card mostra um preview
 * AO VIVO da 1ª página (renderiza o próprio `SlidePage` em escala pequena, sem
 * rasterizar). Clicar abre o editor; menu por card duplica/exclui. Botão cria um
 * flyer novo já com a cara da marca.
 */
import { useState } from "react";
import { Copy, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Box, Flex, Heading, HStack, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/controls";
import { EmptyState } from "../components/EmptyState";
import { useConfirm } from "../components/useConfirm";
import { toaster } from "../components/Toast";
import { CANVAS_W, CANVAS_H } from "./constants";
import { SlidePage } from "./SlidePage";
import type { FlyerSummary } from "./types";

const CARD_W = 220;
const PREVIEW_SCALE = CARD_W / CANVAS_W;

export type FlyersGalleryProps = {
  flyers: FlyerSummary[];
  onCreate: () => Promise<void> | void;
  onOpen: (id: number) => void;
  onDuplicate: (id: number) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

export function FlyersGallery({ flyers, onCreate, onOpen, onDuplicate, onDelete }: FlyersGalleryProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const create = async () => {
    setCreating(true);
    try {
      await onCreate();
    } catch (err) {
      toaster.create({ title: "Falha ao criar", description: String(err), type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const duplicate = async (id: number) => {
    setBusyId(id);
    try {
      await onDuplicate(id);
    } catch (err) {
      toaster.create({ title: "Falha ao duplicar", description: String(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number, title: string) => {
    const ok = await confirm({
      title: "Excluir flyer?",
      description: `“${title}” será removido. Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await onDelete(id);
    } catch (err) {
      toaster.create({ title: "Falha ao excluir", description: String(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Stack gap={5}>
      <Flex justify="flex-end">
        <Button tone="primary" onClick={create} loading={creating}>
          <Plus size={18} /> Novo flyer
        </Button>
      </Flex>

      {flyers.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Nenhum flyer ainda"
          description="Crie o primeiro flyer — ele já vem com as cores e o logo da sua marca."
          action={
            <Button tone="primary" onClick={create} loading={creating}>
              <Plus size={18} /> Criar flyer
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} gap={5}>
          {flyers.map((f) => (
            <Card key={f.id} p={0} overflow="hidden">
              <Box
                as="button"
                onClick={() => onOpen(f.id)}
                display="block"
                w="100%"
                bg="#0b1220"
                position="relative"
                style={{ height: Math.round(CANVAS_H * PREVIEW_SCALE) }}
                overflow="hidden"
                cursor="pointer"
              >
                {f.page ? (
                  <SlidePage page={f.page} scale={PREVIEW_SCALE} />
                ) : (
                  <Flex align="center" justify="center" h="100%" color="whiteAlpha.700">
                    <Text fontSize="sm">Sem preview</Text>
                  </Flex>
                )}
                {f.published ? (
                  <Box position="absolute" top="2" left="2">
                    <Badge colorPalette="green">Publicado</Badge>
                  </Box>
                ) : null}
              </Box>
              <Stack gap={2} p={3}>
                <Heading size="sm" lineClamp={1} title={f.title}>
                  {f.title}
                </Heading>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="var(--admin-text-soft)">
                    {f.pageCount} {f.pageCount === 1 ? "página" : "páginas"}
                  </Text>
                  <HStack gap={1}>
                    <Button
                      tone="ghost"
                      size="xs"
                      onClick={() => duplicate(f.id)}
                      loading={busyId === f.id}
                      title="Duplicar"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      tone="ghost"
                      size="xs"
                      onClick={() => remove(f.id, f.title)}
                      disabled={busyId === f.id}
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
      {confirmDialog}
    </Stack>
  );
}
