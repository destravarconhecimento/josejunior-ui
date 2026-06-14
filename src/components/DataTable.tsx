"use client";

import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Box, HStack, Stack, Table, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
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
  paginate = true,
  onReorder,
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
  /** false = sem paginação: mostra TODAS as linhas numa página só (com scroll). */
  paginate?: boolean;
  /** Habilita arrastar (handle) p/ reordenar; recebe a nova ordem das chaves. */
  onReorder?: (orderedKeys: Array<string | number>) => void;
}) {
  const [page, setPage] = useState(0);
  const [dragKey, setDragKey] = useState<string | number | null>(null);
  const [overKey, setOverKey] = useState<string | number | null>(null);
  const effPageSize = paginate ? pageSize : Math.max(rows.length, 1);
  const pages = Math.max(1, Math.ceil(rows.length / effPageSize));
  const current = Math.min(page, pages - 1);
  const visible = useMemo(
    () => rows.slice(current * effPageSize, current * effPageSize + effPageSize),
    [rows, current, effPageSize],
  );
  const from = rows.length === 0 ? 0 : current * effPageSize + 1;
  const to = Math.min(rows.length, (current + 1) * effPageSize);

  function handleDrop(targetKey: string | number) {
    const dk = dragKey;
    setDragKey(null);
    setOverKey(null);
    if (!onReorder || dk == null || dk === targetKey) return;
    const keys = rows.map((r, i) => getRowKey(r, i));
    const fromIdx = keys.indexOf(dk);
    const toIdx = keys.indexOf(targetKey);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const next = [...keys];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  }

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
              {onReorder ? <Table.ColumnHeader width="34px" /> : null}
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
              const rowKey = getRowKey(row, i);
              const sel = selectedKey != null && rowKey === selectedKey;
              const isOver = onReorder != null && dragKey != null && overKey === rowKey && dragKey !== rowKey;
              return (
              <Table.Row
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                cursor={onRowClick ? "pointer" : undefined}
                opacity={dragKey === rowKey ? 0.4 : undefined}
                boxShadow={isOver ? "inset 0 2px 0 var(--admin-primary)" : undefined}
                bg={sel ? "rgba(202,138,4,0.10)" : isOver ? "var(--admin-nav-active)" : undefined}
                _hover={onRowClick ? { bg: sel ? "rgba(202,138,4,0.14)" : "var(--admin-nav-hover)" } : undefined}
                {...(onReorder
                  ? {
                      onDragOver: (e: DragEvent) => { e.preventDefault(); setOverKey(rowKey); },
                      onDrop: () => handleDrop(rowKey),
                    }
                  : {})}
              >
                {onReorder ? (
                  <Table.Cell
                    width="34px"
                    onClick={(e) => e.stopPropagation()}
                    draggable
                    onDragStart={() => setDragKey(rowKey)}
                    onDragEnd={() => { setDragKey(null); setOverKey(null); }}
                    cursor="grab"
                    color="var(--admin-text-soft)"
                    title="Arraste para reordenar"
                  >
                    <GripVertical size={15} />
                  </Table.Cell>
                ) : null}
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
