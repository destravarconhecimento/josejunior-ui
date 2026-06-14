"use client";

import type { ReactNode } from "react";
import { CloseButton, Dialog, Portal, Stack } from "@chakra-ui/react";

/** Modal padrão sobre o Dialog do Chakra. Controlado por `open`/`onClose`. */
export function Modal({
  open,
  onClose,
  title,
  footer,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: React.ComponentProps<typeof Dialog.Root>["size"];
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => { if (!e.open) onClose(); }}
      size={size}
      // Centralizada na viewport; corpo rola por dentro (header + rodapé fixos).
      placement="center"
      scrollBehavior="inside"
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(15,23,42,0.5)" backdropFilter="blur(4px)" />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            bg="var(--admin-surface)"
            borderRadius="16px"
            boxShadow="0 24px 60px rgba(15,23,42,0.22)"
            maxH="85vh"
            overflow="hidden"
          >
            {title ? (
              <Dialog.Header
                borderBottomWidth="1px"
                borderColor="var(--admin-border)"
                pb={3}
                flexShrink={0}
              >
                <Dialog.Title className="admin-h" color="var(--admin-primary)">
                  {title}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
              </Dialog.Header>
            ) : null}
            <Dialog.Body py={5}>
              <Stack gap={4}>{children}</Stack>
            </Dialog.Body>
            {footer ? (
              <Dialog.Footer
                borderTopWidth="1px"
                borderColor="var(--admin-border)"
                pt={3}
                gap={2}
                flexShrink={0}
              >
                {footer}
              </Dialog.Footer>
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
