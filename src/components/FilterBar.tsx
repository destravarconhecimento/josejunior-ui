"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { Search, SlidersHorizontal } from "lucide-react";

export type SelectFilter = {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
};

/**
 * Barra de filtro PADRÃO das telas de operação (Clientes, Agendamentos, Atos…):
 * busca com ícone + N selects + ações à direita + contador. Estilo único.
 *
 * Mobile: a busca ocupa a linha e os selects ficam atrás de um ÍCONE de filtro
 * ao lado dela (abre/fecha); badge mostra quantos filtros estão ativos. Desktop
 * (md+): selects inline, como sempre.
 */
export function FilterBar({
  search,
  onSearch,
  placeholder = "Buscar…",
  selects = [],
  right,
  count,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  selects?: SelectFilter[];
  right?: ReactNode;
  count?: { shown: number; total: number };
}) {
  const [showFilters, setShowFilters] = useState(false);
  // "Ativo" = valor diferente da 1ª opção (convenção: a 1ª é o "todos").
  const activeCount = selects.filter(
    (s) => s.options.length > 0 && s.value !== s.options[0].value,
  ).length;

  const selectFields = selects.map((s, i) => (
    <NativeSelect.Root key={i} w={{ base: "full", md: s.width ?? "180px" }}>
      <NativeSelect.Field
        value={s.value}
        onChange={(e) => s.onChange(e.target.value)}
        bg="var(--admin-surface)"
      >
        {s.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  ));

  const countNode = count ? (
    <Text fontSize="sm" color="var(--admin-text-soft)" whiteSpace="nowrap">
      {count.shown} de {count.total}
    </Text>
  ) : null;

  return (
    <Box mb={3}>
      <HStack gap={2} align="center" flexWrap={{ base: "nowrap", md: "wrap" }}>
        <Box position="relative" flex={1} minW={0}>
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            pl={10}
            bg="var(--admin-surface)"
          />
          <Box
            position="absolute"
            top="50%"
            left="12px"
            transform="translateY(-50%)"
            color="gray.400"
            pointerEvents="none"
          >
            <Search size={16} />
          </Box>
        </Box>

        {/* Mobile: ícone de filtro ao lado da busca (abre os selects abaixo). */}
        {selects.length > 0 ? (
          <Box
            as="button"
            aria-label="Filtros"
            display={{ base: "inline-flex", md: "none" }}
            position="relative"
            flexShrink={0}
            w="40px"
            h="40px"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor={showFilters || activeCount > 0 ? "var(--admin-primary)" : "var(--admin-border)"}
            borderRadius="10px"
            bg={showFilters ? "var(--admin-nav-active)" : "var(--admin-surface)"}
            color={showFilters || activeCount > 0 ? "var(--admin-primary)" : "var(--admin-text-soft)"}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={17} />
            {activeCount > 0 ? (
              <Box
                position="absolute"
                top="-6px"
                right="-6px"
                minW="17px"
                h="17px"
                px="4px"
                borderRadius="full"
                bg="var(--admin-primary)"
                color="white"
                fontSize="10px"
                fontWeight="700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {activeCount}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {/* Desktop: selects inline. */}
        <HStack gap={3} display={{ base: "none", md: "flex" }} flexWrap="wrap" align="center">
          {selectFields}
          {countNode}
        </HStack>

        {right ? (
          <Box ml={{ md: "auto" }} flexShrink={0} display={{ base: "none", md: "block" }}>
            {right}
          </Box>
        ) : null}
      </HStack>

      {/* Mobile: selects expandem abaixo quando o filtro está aberto. */}
      {selects.length > 0 ? (
        <Stack display={{ base: showFilters ? "flex" : "none", md: "none" }} gap={2} mt={2}>
          {selectFields}
          <HStack justify="space-between">
            {countNode}
            {right ? <Box>{right}</Box> : null}
          </HStack>
        </Stack>
      ) : null}
    </Box>
  );
}
