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
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }} size={size}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.45)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content bg="var(--admin-surface)" borderRadius="16px">
            {title ? (
              <Dialog.Header>
                <Dialog.Title className="admin-h" color="var(--admin-primary)">
                  {title}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
              </Dialog.Header>
            ) : null}
            <Dialog.Body>
              <Stack gap={4}>{children}</Stack>
            </Dialog.Body>
            {footer ? <Dialog.Footer>{footer}</Dialog.Footer> : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
