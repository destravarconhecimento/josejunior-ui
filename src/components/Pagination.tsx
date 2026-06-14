"use client";

import type { ReactNode } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/**
 * Paginação PADRÃO do painel (mesmo visual do rodapé do `DataTable`), porém
 * solta — para listas em cards (mural de avisos, etc.). Controlada:
 *  - `page` em base 0, `pageCount` total de páginas;
 *  - contador "x–y de z" quando `total`+`pageSize` forem informados;
 *  - os botões anterior/próxima só aparecem quando há mais de uma página.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  label,
}: {
  /** Página atual (base 0). */
  page: number;
  /** Total de páginas. */
  pageCount: number;
  /** Total de itens (para o contador). */
  total?: number;
  /** Itens por página (para calcular o intervalo do contador). */
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Texto do contador (sobrescreve o "x–y de z" padrão). */
  label?: ReactNode;
}) {
  const current = Math.min(Math.max(page, 0), Math.max(0, pageCount - 1));

  const counter =
    label ??
    (total != null && pageSize != null
      ? `${total === 0 ? 0 : current * pageSize + 1}–${Math.min(total, (current + 1) * pageSize)} de ${total}`
      : total != null
        ? `${total} ${total === 1 ? "item" : "itens"}`
        : null);

  return (
    <HStack
      justify="space-between"
      px={4}
      py={2.5}
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="12px"
      bg="var(--admin-surface)"
      flexWrap="wrap"
      gap={2}
    >
      {counter != null ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {counter}
        </Text>
      ) : (
        <span />
      )}
      {pageCount > 1 ? (
        <HStack gap={1}>
          <Button
            size="xs"
            tone="ghost"
            disabled={current === 0}
            onClick={() => onPageChange(current - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </Button>
          <Text fontSize="xs" color="var(--admin-text-soft)" px={1}>
            {current + 1}/{pageCount}
          </Text>
          <Button
            size="xs"
            tone="ghost"
            disabled={current >= pageCount - 1}
            onClick={() => onPageChange(current + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight size={14} />
          </Button>
        </HStack>
      ) : null}
    </HStack>
  );
}
