"use client";

import type { ReactNode } from "react";
import { Box, HStack, Stack, NativeSelect, Text } from "@chakra-ui/react";

export type TabDef = { value: string; label: string; icon?: ReactNode };

/**
 * Abas controladas do design-system (desacopladas do Tabs do Chakra):
 *  - `orientation="horizontal"` (padrão): barra no topo, com scroll se precisar;
 *  - `orientation="vertical"`: sidebar de abas (cartão à esquerda);
 *  - mobile (qualquer orientação): dropdown com a aba atual.
 * O consumidor controla `value` e renderiza o conteúdo por `value`.
 */
export function Tabs({
  value,
  onChange,
  items,
  orientation = "horizontal",
  sidebarLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  items: TabDef[];
  orientation?: "horizontal" | "vertical";
  /** Rótulo opcional no topo da sidebar (só na orientação vertical). */
  sidebarLabel?: string;
}) {
  const vertical = orientation === "vertical";

  const triggers = items.map((it) => {
    const active = it.value === value;
    return (
      <Box
        as="button"
        key={it.value}
        onClick={() => onChange(it.value)}
        px={vertical ? 3 : 4}
        py={2.5}
        fontSize="sm"
        fontWeight="600"
        whiteSpace="nowrap"
        textAlign={vertical ? "left" : "center"}
        w={vertical ? "100%" : undefined}
        borderRadius={vertical ? "10px" : undefined}
        borderBottomWidth={vertical ? undefined : "2px"}
        borderColor={
          vertical
            ? "transparent"
            : active
              ? "var(--admin-primary)"
              : "transparent"
        }
        bg={vertical && active ? "var(--admin-nav-active)" : "transparent"}
        color={active ? "var(--admin-primary)" : "var(--admin-text-soft)"}
        _hover={{
          color: "var(--admin-primary)",
          bg: vertical ? "var(--admin-nav-hover)" : undefined,
        }}
        transition="color .14s ease, border-color .14s ease, background .14s ease"
      >
        <HStack gap={2} justify={vertical ? "flex-start" : "center"}>
          {it.icon}
          <Text fontSize="sm" as="span">
            {it.label}
          </Text>
        </HStack>
      </Box>
    );
  });

  return (
    <Box w={vertical ? { base: "full", md: "200px" } : undefined} flexShrink={vertical ? 0 : undefined}>
      {/* Desktop */}
      {vertical ? (
        <Stack
          display={{ base: "none", md: "flex" }}
          gap={1}
          p={2}
          bg="var(--admin-surface)"
          border="1px solid var(--admin-border)"
          borderRadius="14px"
          position={{ md: "sticky" }}
          top={{ md: "16px" }}
        >
          {sidebarLabel ? (
            <Text
              px={2}
              pt={1}
              pb={0.5}
              fontSize="10px"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="1.2px"
              color="var(--admin-text-soft)"
            >
              {sidebarLabel}
            </Text>
          ) : null}
          {triggers}
        </Stack>
      ) : (
        <HStack
          display={{ base: "none", md: "flex" }}
          gap={1}
          borderBottomWidth="1px"
          borderColor="var(--admin-border)"
          overflowX="auto"
          className="admin-scroll"
        >
          {triggers}
        </HStack>
      )}

      {/* Mobile: dropdown com a aba atual */}
      <Box display={{ base: "block", md: "none" }} mb={vertical ? 3 : 0}>
        <Text
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="1.4px"
          color="var(--admin-text-soft)"
          mb={1.5}
        >
          {sidebarLabel ?? "Seção"}
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
