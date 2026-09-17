"use client";

import type { ReactNode } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { Button } from "./Button";
import { Modal, type ModalPropsCurto } from "./Modal";

/**
 * Casca padrão de telas CRUD: a LISTA é a tela principal (sem espaço morto), um
 * botão "Novo" no topo e o editor abre num MODAL (criar ou editar). O conteúdo da
 * lista e do editor são fornecidos pelo chamador — toda a lógica/estado fica nele.
 */
export function CrudManager({
  title,
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
  /** Título à esquerda da barra (preenche o espaço ao lado do "Novo"). */
  title?: string;
  /** Rótulo do botão de criar (ex.: "Novo post"). */
  newLabel: string;
  onNew: () => void;
  /** Modal aberto? (editar/criar) */
  open: boolean;
  onClose: () => void;
  editorTitle: string;
  editor: ReactNode;
  editorFooter?: ReactNode;
  modalSize?: ModalPropsCurto["size"];
  /** Conteúdo extra à esquerda do botão "Novo" (ex.: filtros). */
  toolbar?: ReactNode;
  /** A LISTA (tela principal). */
  children: ReactNode;
}) {
  return (
    <>
      <HStack justify="space-between" align="center" gap={2} flexWrap="wrap" mb={4}>
        <HStack gap={3} flexWrap="wrap" align="center">
          {title ? <Text fontWeight="700" fontSize="md" color="var(--admin-primary)">{title}</Text> : null}
          {toolbar}
        </HStack>
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
