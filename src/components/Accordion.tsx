"use client";

import type { ReactNode } from "react";
import { Accordion as ChakraAccordion, Box, HStack } from "@chakra-ui/react";

export type AccordionItemDef = {
  /** Identificador único do item (controla aberto/fechado). */
  value: string;
  /** Conteúdo do cabeçalho (lado esquerdo). */
  title: ReactNode;
  /** Conteúdo opcional à direita do cabeçalho (badges, contadores). */
  meta?: ReactNode;
  /** Corpo expansível. */
  content: ReactNode;
  disabled?: boolean;
};

/**
 * Acordeão padrão do painel sobre o `Accordion` do Chakra. Data-driven via
 * `items`. `multiple` permite vários itens abertos ao mesmo tempo; `defaultValue`
 * abre itens já no mount. Use `value`/`onValueChange` para controlar de fora.
 */
export function Accordion({
  items,
  multiple = false,
  collapsible = true,
  defaultValue,
  value,
  onValueChange,
  size = "md",
}: {
  items: AccordionItemDef[];
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <ChakraAccordion.Root
      multiple={multiple}
      collapsible={collapsible}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange ? (e) => onValueChange(e.value) : undefined}
      size={size}
      variant="outline"
      borderColor="var(--admin-border)"
    >
      {items.map((item) => (
        <ChakraAccordion.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          borderColor="var(--admin-border)"
        >
          <ChakraAccordion.ItemTrigger cursor="pointer" py={3} gap={3}>
            <Box
              flex="1"
              minW={0}
              textAlign="left"
              fontWeight="600"
              color="var(--admin-primary)"
            >
              {item.title}
            </Box>
            <HStack gap={2} flexShrink={0}>
              {item.meta}
              <ChakraAccordion.ItemIndicator />
            </HStack>
          </ChakraAccordion.ItemTrigger>
          <ChakraAccordion.ItemContent>
            <ChakraAccordion.ItemBody>{item.content}</ChakraAccordion.ItemBody>
          </ChakraAccordion.ItemContent>
        </ChakraAccordion.Item>
      ))}
    </ChakraAccordion.Root>
  );
}
