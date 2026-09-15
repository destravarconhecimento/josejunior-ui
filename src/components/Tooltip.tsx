"use client";

import { forwardRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { Portal, Tooltip as ChakraTooltip } from "@chakra-ui/react";

export type TooltipProps = ComponentProps<typeof ChakraTooltip.Root> & {
  content: ReactNode;
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: RefObject<HTMLElement>;
  contentProps?: ComponentProps<typeof ChakraTooltip.Content>;
  disabled?: boolean;
};

/**
 * Tooltip do painel. Montar o `Tooltip.Root/Trigger/Positioner/Content` do
 * Chakra na tela é onde a legenda some: sem `Portal` ela é recortada pelo card
 * e sem `asChild` no trigger vira um `div` que quebra a linha do botão.
 * `disabled` devolve o filho intocado, pra tela poder ligar e desligar a
 * legenda sem trocar a árvore.
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const { showArrow, children, disabled, portalled = true, content, contentProps, portalRef, ...rest } = props;

  if (disabled) return children;

  return (
    <ChakraTooltip.Root {...rest}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content ref={ref} {...contentProps}>
            {showArrow ? (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            ) : null}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});
