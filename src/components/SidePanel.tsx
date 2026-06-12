"use client";

import type { ReactNode } from "react";
import { CloseButton, Drawer, Portal, Stack } from "@chakra-ui/react";

/**
 * Painel lateral padrão (drawer à direita) sobre o Drawer do Chakra. Controlado
 * por `open`/`onClose`. Substitui os "Backdrop + painel" feitos à mão nas telas.
 */
export function SidePanel({
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
  size?: React.ComponentProps<typeof Drawer.Root>["size"];
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size={size}
      placement="end"
    >
      <Portal>
        <Drawer.Backdrop bg="rgba(7,26,51,0.55)" />
        <Drawer.Positioner>
          <Drawer.Content bg="var(--admin-surface)">
            {title ? (
              <Drawer.Header borderBottomWidth="1px" borderColor="var(--admin-border)">
                <Drawer.Title className="admin-h" color="var(--admin-primary)">
                  {title}
                </Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <CloseButton />
                </Drawer.CloseTrigger>
              </Drawer.Header>
            ) : null}
            <Drawer.Body>
              <Stack gap={4}>{children}</Stack>
            </Drawer.Body>
            {footer ? (
              <Drawer.Footer borderTopWidth="1px" borderColor="var(--admin-border)">
                {footer}
              </Drawer.Footer>
            ) : null}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
