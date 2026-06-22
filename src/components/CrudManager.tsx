"use client";

import type { ReactNode } from "react";
import { HStack } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Casca padrão de telas CRUD: a LISTA é a tela principal (sem espaço morto), um
 * botão "Novo" no topo e o editor abre num MODAL (criar ou editar). O conteúdo da
 * lista e do editor são fornecidos pelo chamador — toda a lógica/estado fica nele.
 */
export function CrudManager({
  newLabel,
  onNew,
  open,
  onClose,
  editorTitle,
  editor,
  editorFooter,
  modalSize = "lg",
  toolbar,
  children,
}: {
  /** Rótulo do botão de criar (ex.: "Novo post"). */
  newLabel: string;
  onNew: () => void;
  /** Modal aberto? (editar/criar) */
  open: boolean;
  onClose: () => void;
  editorTitle: string;
  editor: ReactNode;
  editorFooter?: ReactNode;
  modalSize?: React.ComponentProps<typeof Modal>["size"];
  /** Conteúdo extra à esquerda do botão "Novo" (ex.: filtros). */
  toolbar?: ReactNode;
  /** A LISTA (tela principal). */
  children: ReactNode;
}) {
  return (
    <>
      <HStack justify="space-between" align="center" gap={2} flexWrap="wrap" mb={4}>
        <HStack gap={2} flexWrap="wrap">{toolbar}</HStack>
        <Button onClick={onNew}>
          <Plus size={16} style={{ marginRight: 6 }} /> {newLabel}
        </Button>
      </HStack>

      {children}

      {open ? (
        <Modal open onClose={onClose} size={modalSize} title={editorTitle} footer={editorFooter}>
          {editor}
        </Modal>
      ) : null}
    </>
  );
}
