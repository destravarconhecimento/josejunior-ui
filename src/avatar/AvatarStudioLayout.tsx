"use client";
/**
 * Layout dos painéis de avatar dentro do drawer (≤50% no desktop).
 *
 * DESKTOP: um SimpleGrid de 2 colunas — de um lado a PRÉVIA (grudada no topo,
 *   sticky, pra acompanhar a rolagem) e do outro os CONTROLES de edição, uma
 *   seção embaixo da outra (coluna única).
 * MOBILE: a prévia vira um botão "Previsualizar" (abre num modal); os controles
 *   ficam empilhados à mostra o tempo todo.
 *
 * `preview(variant)` desenha a prévia: "compact" (coluna do desktop) ou "full"
 * (dentro do modal, no mobile). `children` são os controles (edição).
 */
import { useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { Box, SimpleGrid, Stack } from "../primitives";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";

export function AvatarStudioLayout({
  preview,
  children,
  previewTitle = "Prévia do avatar",
}: {
  preview: (variant: "compact" | "full") => ReactNode;
  children: ReactNode;
  previewTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile: botão que abre a prévia num modal + controles empilhados. */}
      <Box display={{ base: "block", lg: "none" }}>
        <Stack gap={4}>
          <Button tone="outline" w="100%" onClick={() => setOpen(true)}>
            <Eye size={16} /> Previsualizar
          </Button>
          {children}
        </Stack>
      </Box>

      {/* Desktop: prévia de um lado (sticky), controles do outro (coluna única). */}
      <SimpleGrid display={{ base: "none", lg: "grid" }} columns={2} gap={5} alignItems="start">
        <Box
          position="sticky"
          top="0"
          alignSelf="start"
          display="flex"
          flexDirection="column"
          alignItems="center"
          bg="var(--admin-surface)"
          pt={1}
          pb={3}
        >
          {preview("compact")}
        </Box>
        <Stack gap={4} minW="0">
          {children}
        </Stack>
      </SimpleGrid>

      <Modal open={open} onClose={() => setOpen(false)} title={previewTitle} size="md">
        {open ? preview("full") : null}
      </Modal>
    </>
  );
}
