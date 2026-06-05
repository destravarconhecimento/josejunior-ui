"use client";

import { Box, HStack, NativeSelect, Text } from "@chakra-ui/react";

export type TabDef = { value: string; label: string };

/**
 * Barra de abas responsiva e controlada (desacoplada do Tabs do Chakra):
 *  - desktop: abas horizontais (com scroll se precisar);
 *  - mobile: um dropdown mostrando a aba atual selecionada.
 * O consumidor controla `value` e renderiza o conteúdo por `value`.
 */
export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: TabDef[];
}) {
  return (
    <Box mb={5}>
      {/* Desktop: abas */}
      <HStack
        display={{ base: "none", md: "flex" }}
        gap={1}
        borderBottomWidth="1px"
        borderColor="var(--admin-border)"
        overflowX="auto"
        className="admin-scroll"
      >
        {items.map((it) => {
          const active = it.value === value;
          return (
            <Box
              as="button"
              key={it.value}
              onClick={() => onChange(it.value)}
              px={4}
              py={2.5}
              fontSize="sm"
              fontWeight="600"
              whiteSpace="nowrap"
              borderBottomWidth="2px"
              borderColor={active ? "var(--admin-primary)" : "transparent"}
              color={active ? "var(--admin-primary)" : "var(--admin-text-soft)"}
              _hover={{ color: "var(--admin-primary)" }}
              transition="color .14s ease, border-color .14s ease"
            >
              {it.label}
            </Box>
          );
        })}
      </HStack>

      {/* Mobile: dropdown com a aba atual (estilizado como controle do painel) */}
      <Box display={{ base: "block", md: "none" }}>
        <Text
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="1.4px"
          color="var(--admin-text-soft)"
          mb={1.5}
        >
          Seção
        </Text>
        <NativeSelect.Root size="lg">
          <NativeSelect.Field
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            bg="var(--admin-surface)"
            borderColor="var(--admin-border)"
            borderRadius="12px"
            fontWeight="600"
            color="var(--admin-primary)"
            h="48px"
          >
            {items.map((it) => (
              <option key={it.value} value={it.value}>
                {it.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator color="var(--admin-primary)" />
        </NativeSelect.Root>
      </Box>
    </Box>
  );
}
