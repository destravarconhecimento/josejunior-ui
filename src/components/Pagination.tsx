"use client";

import type { ReactNode } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { LinkDaUi } from "./LinkDaUi";

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
  hrefAnterior,
  hrefProxima,
}: {
  /** Página atual (base 0). */
  page: number;
  /** Total de páginas. */
  pageCount: number;
  /** Total de itens (para o contador). */
  total?: number;
  /** Itens por página (para calcular o intervalo do contador). */
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Texto do contador (sobrescreve o "x–y de z" padrão). */
  label?: ReactNode;
  /**
   * Paginação do SERVIDOR: a página anterior/próxima já é uma URL (a lista vem
   * paginada do banco). Com href a seta vira link — abre em nova aba, o
   * navegador pré-carrega, e a URL continua sendo a fonte da verdade.
   */
  hrefAnterior?: string;
  hrefProxima?: string;
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
          <Seta
            aria="Página anterior"
            icone={<ChevronLeft size={14} />}
            href={hrefAnterior}
            desabilitada={current === 0}
            onClick={onPageChange ? () => onPageChange(current - 1) : undefined}
          />
          <Text fontSize="xs" color="var(--admin-text-soft)" px={1}>
            {current + 1}/{pageCount}
          </Text>
          <Seta
            aria="Próxima página"
            icone={<ChevronRight size={14} />}
            href={hrefProxima}
            desabilitada={current >= pageCount - 1}
            onClick={onPageChange ? () => onPageChange(current + 1) : undefined}
          />
        </HStack>
      ) : null}
    </HStack>
  );
}

function Seta({
  aria,
  icone,
  href,
  desabilitada,
  onClick,
}: {
  aria: string;
  icone: ReactNode;
  href?: string;
  desabilitada: boolean;
  onClick?: () => void;
}) {
  if (href && !desabilitada) {
    return (
      <Button size="xs" tone="ghost" aria-label={aria} asChild>
        <LinkDaUi href={href}>{icone}</LinkDaUi>
      </Button>
    );
  }
  return (
    <Button size="xs" tone="ghost" aria-label={aria} disabled={desabilitada || !onClick} onClick={onClick}>
      {icone}
    </Button>
  );
}
