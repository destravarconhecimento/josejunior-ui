"use client";

import type { ReactElement, ReactNode } from "react";
import { Popover, Portal } from "../chakra-controls";

/**
 * Popover com título e corpo. Existe pelo mesmo motivo do `Tooltip` do kit:
 * montar `Popover.Root/Trigger/Positioner/Content` na tela é onde o balão some
 * — sem `Portal` ele é recortado pelo card, e sem `asChild` no gatilho vira um
 * `div` que quebra a linha do botão.
 *
 * `Tooltip` é para LEGENDA (texto curto, sem foco). `Balao` é para conteúdo que
 * a pessoa lê e às vezes clica (uma explicação, uma lista curta, um mini-form).
 */
export function Balao({
  gatilho,
  titulo,
  children,
  aberto,
  aoMudar,
  largura = "xs",
}: {
  gatilho: ReactElement;
  titulo?: ReactNode;
  children: ReactNode;
  aberto?: boolean;
  aoMudar?: (aberto: boolean) => void;
  largura?: "xs" | "sm" | "md";
}) {
  return (
    <Popover.Root
      open={aberto}
      onOpenChange={aoMudar ? (e) => aoMudar(e.open) : undefined}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>{gatilho}</Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW={largura} w="auto">
            <Popover.Arrow />
            {titulo && (
              <Popover.Header fontSize="sm" fontWeight="semibold">
                {titulo}
              </Popover.Header>
            )}
            <Popover.Body>{children}</Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
