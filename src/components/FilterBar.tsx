"use client";

import type { ReactNode } from "react";
import { Box, HStack, Input, NativeSelect, Text } from "@chakra-ui/react";
import { Search } from "lucide-react";

export type SelectFilter = {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
};

/**
 * Barra de filtro PADRÃO das telas de operação (Clientes, Agendamentos, Atos…):
 * busca com ícone + N selects + ações à direita + contador. Estilo único.
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
  return (
    <HStack gap={3} flexWrap="wrap" mb={3} align="center">
      <Box position="relative" flex={1} minW="220px">
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          pl={10}
          bg="var(--admin-surface)"
        />
        <Box position="absolute" top="50%" left="12px" transform="translateY(-50%)" color="gray.400" pointerEvents="none">
          <Search size={16} />
        </Box>
      </Box>
      {selects.map((s, i) => (
        <NativeSelect.Root key={i} w={s.width ?? "180px"}>
          <NativeSelect.Field value={s.value} onChange={(e) => s.onChange(e.target.value)} bg="var(--admin-surface)">
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ))}
      {count ? (
        <Text fontSize="sm" color="var(--admin-text-soft)" whiteSpace="nowrap">
          {count.shown} de {count.total}
        </Text>
      ) : null}
      {right ? <Box ml="auto">{right}</Box> : null}
    </HStack>
  );
}
