"use client";
/**
 * Layout dos painéis de avatar dentro do drawer estreito (≤50% no desktop).
 *
 * DESKTOP: a prévia entra ENCOLHIDA e "grudada" no topo (sticky), enquanto os
 *   controles de edição rolam por baixo — cabe tudo sem esticar o painel.
 * MOBILE: a prévia vira um botão "Previsualizar" (abre num modal); a edição fica
 *   à mostra o tempo todo, que é o que se está digitando.
 *
 * `preview(variant)` desenha a prévia: "compact" (topo do desktop) ou "full"
 * (dentro do modal, no mobile). `children` são os controles (edição).
 */
import { useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { Box, Stack } from "../primitives";
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
    <Stack gap={4}>
      {/* Mobile: botão que abre a prévia num modal (a edição continua à mostra). */}
      <Box display={{ base: "block", lg: "none" }}>
        <Button tone="outline" w="100%" onClick={() => setOpen(true)}>
          <Eye size={16} /> Previsualizar
        </Button>
      </Box>

      {/* Desktop: prévia encolhida, grudada no topo enquanto os controles rolam. */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        alignItems="center"
        position="sticky"
        top="0"
        zIndex={1}
        bg="var(--admin-surface)"
        pt={1}
        pb={3}
      >
        {preview("compact")}
      </Box>

      {/* Controles (edição) — sempre visíveis. */}
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title={previewTitle} size="md">
        {open ? preview("full") : null}
      </Modal>
    </Stack>
  );
}
