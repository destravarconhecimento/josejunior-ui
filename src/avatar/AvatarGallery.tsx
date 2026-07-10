"use client";
/**
 * Galeria de avatares já criados (a tela de lista, no espírito da de Flyers).
 * Cada card mostra o PNG gerado num círculo sobre xadrez (pra ver transparência),
 * com nome + legenda. Clicar abre o estúdio pra editar/regerar; ações por card
 * copiam a URL, baixam, duplicam ou excluem. Botões no topo: novo + padrão da agência.
 */
import { useState } from "react";
import { Check, Copy, Download, Files, Plus, Sparkles, Trash2 } from "lucide-react";
import { Box, Flex, Heading, HStack, Image, SimpleGrid, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/controls";
import { EmptyState } from "../components/EmptyState";
import { useConfirm } from "../components/useConfirm";
import { toaster } from "../components/Toast";
import type { AvatarSummary } from "./types";

export type AvatarGalleryProps = {
  avatars: AvatarSummary[];
  onCreate: () => void;
  onOpen: (id: number) => void;
  onDuplicate: (id: number) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

/** Baixa uma URL (cross-origin) forçando download via blob. */
async function downloadUrl(url: string, filename: string) {
  try {
    const blob = await (await fetch(url)).blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 4000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

export function AvatarGallery({ avatars, onCreate, onOpen, onDuplicate, onDelete }: AvatarGalleryProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copy = async (a: AvatarSummary) => {
    if (!a.resultUrl) return;
    try {
      await navigator.clipboard.writeText(a.resultUrl);
      setCopiedId(a.id);
      setTimeout(() => setCopiedId((c) => (c === a.id ? null : c)), 1600);
    } catch {
      toaster.create({ title: "Copie manualmente", description: a.resultUrl, type: "info" });
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

  const remove = async (a: AvatarSummary) => {
    const ok = await confirm({
      title: "Excluir avatar?",
      description: `“${a.name}” será removido. Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(a.id);
    try {
      await onDelete(a.id);
    } catch (err) {
      toaster.create({ title: "Falha ao excluir", description: String(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Stack gap={5}>
      {avatars.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhum avatar ainda"
          description="Gere o primeiro: suba a foto da pessoa, remova o fundo, escolha a moldura e escreva o nome. Sai um PNG pronto pra usar."
          action={
            <Button tone="primary" onClick={onCreate}>
              <Plus size={18} /> Gerar avatar
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} gap={5}>
          {avatars.map((a) => (
            <Card key={a.id} p={0} overflow="hidden">
              <Box
                as="button"
                onClick={() => onOpen(a.id)}
                display="block"
                w="100%"
                position="relative"
                aspectRatio={1}
                cursor="pointer"
                bg="repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 22px 22px"
                overflow="hidden"
              >
                {a.thumbnailUrl || a.resultUrl ? (
                  <Image
                    src={(a.thumbnailUrl || a.resultUrl) as string}
                    alt={a.name}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Flex align="center" justify="center" h="100%" color="var(--admin-text-soft)">
                    <Text fontSize="sm">Sem imagem</Text>
                  </Flex>
                )}
                <Box position="absolute" top="2" right="2">
                  <Badge colorPalette="gray">{a.size}px</Badge>
                </Box>
              </Box>
              <Stack gap={2} p={3}>
                <Box>
                  <Heading size="sm" lineClamp={1} title={a.name}>
                    {a.name}
                  </Heading>
                  {a.subtitle ? (
                    <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                      {a.subtitle}
                    </Text>
                  ) : null}
                </Box>
                <HStack gap={1} justify="flex-end">
                  <Button
                    tone="ghost"
                    size="xs"
                    onClick={() => copy(a)}
                    disabled={!a.resultUrl}
                    title="Copiar URL"
                  >
                    {copiedId === a.id ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                  <Button
                    tone="ghost"
                    size="xs"
                    onClick={() => a.resultUrl && downloadUrl(a.resultUrl, `${a.name || "avatar"}.png`)}
                    disabled={!a.resultUrl}
                    title="Baixar"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    tone="ghost"
                    size="xs"
                    onClick={() => duplicate(a.id)}
                    loading={busyId === a.id}
                    title="Duplicar"
                  >
                    <Files size={14} />
                  </Button>
                  <Button
                    tone="ghost"
                    size="xs"
                    onClick={() => remove(a)}
                    disabled={busyId === a.id}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </Button>
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
