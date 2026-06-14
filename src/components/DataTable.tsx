"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Box, HStack, Stack, Table, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
  /** No mobile (visão em cards) esconde células pouco importantes. */
  hideOnMobile?: boolean;
};

/** Container de tabela (card + scroll horizontal) p/ tabelas custom. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Box className="admin-card" overflowX="auto">
      {children}
    </Box>
  );
}

const PAGE_SIZE = 25;

/**
 * Tabela PADRÃO do painel:
 *  - paginação + contador no rodapé (PAGE_SIZE por página);
 *  - desktop: ocupa a altura disponível da tela (scroll interno, header sticky);
 *  - `actions` adiciona a coluna "Ações" à direita (editar/remover/etc.);
 *  - mobile: vira lista de CARDS (label: valor), organizada e sem scroll lateral.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
  onRowClick,
  selectedKey,
  actions,
  pageSize = PAGE_SIZE,
  fillHeight = true,
  toolbar,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Chave da linha atualmente selecionada (destaca com fundo suave). */
  selectedKey?: string | number;
  /** Célula de ações por linha — renderizada na coluna "Ações" (à direita). */
  actions?: (row: T) => ReactNode;
  pageSize?: number;
  /** Desktop: limita à altura da viewport com scroll interno. `number` = offset
   *  em px a descontar (default 340; use maior em telas com abas). `false` solta. */
  fillHeight?: boolean | number;
  /** Barra (busca/filtros) COLADA no topo do card, acima do cabeçalho. */
  toolbar?: ReactNode;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = useMemo(
    () => rows.slice(current * pageSize, current * pageSize + pageSize),
    [rows, current, pageSize],
  );
  const from = rows.length === 0 ? 0 : current * pageSize + 1;
  const to = Math.min(rows.length, (current + 1) * pageSize);

  const toolbarNode = toolbar ? (
    <Box px={3} py={2.5} borderBottomWidth="1px" borderColor="var(--admin-divider)">
      {toolbar}
    </Box>
  ) : null;

  if (rows.length === 0) {
    return (
      <Box className="admin-card" overflow="hidden" p={0}>
        {toolbarNode}
        <Box p={6}>{empty ?? <EmptyState title="Nada por aqui ainda." />}</Box>
      </Box>
    );
  }

  const cell = (c: Column<T>, row: T) =>
    c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "");

  const footer = (
    <HStack
      justify="space-between"
      px={4}
      py={2.5}
      borderTopWidth="1px"
      borderColor="var(--admin-divider)"
      bg="var(--admin-surface)"
      flexWrap="wrap"
      gap={2}
    >
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {from}–{to} de {rows.length}
      </Text>
      {pages > 1 ? (
        <HStack gap={1}>
          <Button size="xs" tone="ghost" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">
            <ChevronLeft size={14} />
          </Button>
          <Text fontSize="xs" color="var(--admin-text-soft)" px={1}>
            {current + 1}/{pages}
          </Text>
          <Button size="xs" tone="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Próxima página">
            <ChevronRight size={14} />
          </Button>
        </HStack>
      ) : null}
    </HStack>
  );

  return (
    <Box className="admin-card" overflow="hidden" p={0}>
      {toolbarNode}
      {/* Desktop: tabela com header sticky e altura da tela */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowY="auto"
        overflowX="auto"
        maxH={fillHeight ? `calc(100vh - ${typeof fillHeight === "number" ? fillHeight : 340}px)` : undefined}
        minH={fillHeight ? "200px" : undefined}
      >
        <Table.Root size="md">
          <Table.Header position="sticky" top={0} zIndex={1} bg="var(--admin-surface)" boxShadow="0 1px 0 var(--admin-divider)">
            <Table.Row>
              {columns.map((c) => (
                <Table.ColumnHeader
                  key={c.key}
                  textAlign={c.align}
                  width={c.width}
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                  color="var(--admin-text-soft)"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {c.header}
                </Table.ColumnHeader>
              ))}
              {actions ? (
                <Table.ColumnHeader textAlign="end" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)" whiteSpace="nowrap">
                  Ações
                </Table.ColumnHeader>
              ) : null}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visible.map((row, i) => {
              const sel = selectedKey != null && getRowKey(row, i) === selectedKey;
              return (
              <Table.Row
                key={getRowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                cursor={onRowClick ? "pointer" : undefined}
                bg={sel ? "rgba(202,138,4,0.10)" : undefined}
                _hover={onRowClick ? { bg: sel ? "rgba(202,138,4,0.14)" : "var(--admin-nav-hover)" } : undefined}
              >
                {columns.map((c) => (
                  <Table.Cell key={c.key} textAlign={c.align}>
                    {cell(c, row)}
                  </Table.Cell>
                ))}
                {actions ? (
                  <Table.Cell textAlign="end" onClick={(e) => e.stopPropagation()}>
                    <HStack gap={1} justify="flex-end">{actions(row)}</HStack>
                  </Table.Cell>
                ) : null}
              </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Mobile: cards empilhados (sem scroll lateral) */}
      <Stack display={{ base: "flex", md: "none" }} gap={0}>
        {visible.map((row, i) => (
          <Box
            key={getRowKey(row, i)}
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="var(--admin-divider)"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            cursor={onRowClick ? "pointer" : undefined}
            bg={selectedKey != null && getRowKey(row, i) === selectedKey ? "rgba(202,138,4,0.10)" : undefined}
            _active={onRowClick ? { bg: "var(--admin-nav-hover)" } : undefined}
          >
            <Stack gap={1.5}>
              {/* primeira coluna = título do card */}
              <Box>{cell(columns[0], row)}</Box>
              {columns.slice(1).filter((c) => !c.hideOnMobile).map((c) => (
                <HStack key={c.key} gap={2} fontSize="sm" align="baseline">
                  <Text fontSize="xs" color="var(--admin-text-soft)" minW="90px" flexShrink={0}>
                    {c.header}
                  </Text>
                  <Box minW={0}>{cell(c, row)}</Box>
                </HStack>
              ))}
              {actions ? (
                <HStack gap={1} pt={1} onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </HStack>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Stack>

      {footer}
    </Box>
  );
}
