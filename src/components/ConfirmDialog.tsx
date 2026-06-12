"use client";

import { useState, type ReactNode } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { Modal } from "./Modal";
import { Button, type ButtonTone } from "./Button";

/**
 * Diálogo de confirmação padrão (substitui o `confirm()` nativo). `onConfirm`
 * pode ser async — mostra loading e fecha ao concluir.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ButtonTone;
}) {
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button tone={tone} onClick={run} loading={loading}>
            {confirmLabel}
          </Button>
        </HStack>
      }
    >
      {description ? (
        <Text fontSize="sm" color="var(--admin-text)">
          {description}
        </Text>
      ) : null}
    </Modal>
  );
}
