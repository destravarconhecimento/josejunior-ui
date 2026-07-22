"use client";

import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Box, Checkbox, HStack, Stack, Table, Text } from "@chakra-ui/react";
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

/**
 * Seleção em massa (opt-in): coluna de checkbox à esquerda + "selecionar todos".
 * `selectedKeys` são as chaves marcadas (mesmo formato de `getRowKey`); o header
 * marca/desmarca TODAS as linhas FILTRADAS (todas as páginas), não só a visível.
 */
export type Selection = {
  selectedKeys: Set<string | number>;
  onToggle: (key: string | number, checked: boolean) => void;
  /** `keys` = todas as linhas filtradas (todas as páginas); `checked` = novo estado. */
  onToggleAll: (keys: Array<string | number>, checked: boolean) => void;
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
 *
 * DUAS formas de ocupar a altura no desktop:
 *  - `fill` (PREFERIDO): o card vira uma coluna flex e a região de scroll é
 *    `flex=1 minH=0` — ela come EXATAMENTE a altura que sobra depois do que
 *    estiver acima (KPIs, abas, filtros). Sem número mágico: quem mede é o
 *    flexbox. Exige um ancestral com altura fechada — é o que o `Screen fill`
 *    dá (bounda o corpo ao `--admin-content-h` do shell). É o caminho "inteligente".
 *  - `fillHeight` (LEGADO): auto-limita à viewport com um offset em px chutado
 *    (`calc(100vh - Npx)`). Não sabe o que tem acima → sobra espaço em telas
 *    altas. Mantido pra não mexer nas dezenas de telas que ainda o usam; telas
 *    novas devem usar `Screen fill` + `DataTable fill`.
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
  fill = false,
  toolbar,
  paginate = true,
  onReorder,
  dense = false,
  selection,
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
   *  em px a descontar (default 340; use maior em telas com abas). `false` solta.
   *  LEGADO — prefira `fill` num `Screen fill` (não chuta offset). Ignorado se `fill`. */
  fillHeight?: boolean | number;
  /** Desktop: ocupa a altura livre via flexbox (scroll interno), medindo o que
   *  sobra depois dos KPIs/abas/filtros — sem número mágico. Precisa de um
   *  ancestral com altura fechada (use dentro de `Screen fill`). Desligado no
   *  mobile. Tem precedência sobre `fillHeight`. */
  fill?: boolean;
  /** Barra (busca/filtros) COLADA no topo do card, acima do cabeçalho. */
  toolbar?: ReactNode;
  /** false = sem paginação: mostra TODAS as linhas numa página só (com scroll). */
  paginate?: boolean;
  /** Habilita arrastar (handle) p/ reordenar; recebe a nova ordem das chaves. */
  onReorder?: (orderedKeys: Array<string | number>) => void;
  /** Linhas compactas (cabe mais na tela) — telas de alta densidade. */
  dense?: boolean;
  /** Seleção em massa (checkbox por linha + selecionar todos). Opt-in. */
  selection?: Selection;
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

  // Seleção em massa: "selecionar todos" abrange TODAS as linhas filtradas (todas
  // as páginas), não só a visível — por isso mapeia `rows` inteiro, não `visible`.
  const allKeys: Array<string | number> = selection ? rows.map((r, i) => getRowKey(r, i)) : [];
  const selCount = selection ? allKeys.filter((k) => selection.selectedKeys.has(k)).length : 0;
  const allChecked = selCount > 0 && selCount === allKeys.length;
  const someChecked = selCount > 0 && !allChecked;

  const rowCheckbox = (rowKey: string | number) =>
    selection ? (
      <Checkbox.Root
        size="sm"
        checked={selection.selectedKeys.has(rowKey)}
        onCheckedChange={(e) => selection.onToggle(rowKey, e.checked === true)}
        aria-label="Selecionar linha"
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
      </Checkbox.Root>
    ) : null;

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
    <Box px={3} py={2.5} borderBottomWidth="1px" borderColor="var(--admin-divider)" flexShrink={0}>
      {toolbar}
    </Box>
  ) : null;

  if (rows.length === 0) {
    return (
      <Box
        className="admin-card"
        overflow="hidden"
        p={0}
        display={fill ? { md: "flex" } : undefined}
        flexDirection={fill ? { md: "column" } : undefined}
        flex={fill ? { md: "1" } : undefined}
        minH={fill ? { md: 0 } : undefined}
      >
        {toolbarNode}
        <Box
          p={6}
          flex={fill ? { md: "1" } : undefined}
          display={fill ? { md: "flex" } : undefined}
          alignItems={fill ? { md: "center" } : undefined}
          justifyContent={fill ? { md: "center" } : undefined}
        >
          {empty ?? <EmptyState title="Nada por aqui ainda." />}
        </Box>
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
      flexShrink={0}
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
    <Box
      className="admin-card"
      overflow="hidden"
      p={0}
      // `fill`: o card vira coluna flex pra a região de scroll poder crescer
      // dentro dele (o ancestral fechado é o `Screen fill`). Desligado no mobile.
      display={fill ? { md: "flex" } : undefined}
      flexDirection={fill ? { md: "column" } : undefined}
      flex={fill ? { md: "1" } : undefined}
      minH={fill ? { md: 0 } : undefined}
    >
      {toolbarNode}
      {/* Desktop: tabela com header sticky e altura da tela */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowY="auto"
        overflowX="auto"
        // `fill` = flexbox mede a altura livre (sem número mágico); senão cai no
        // legado `fillHeight` (offset chutado da viewport).
        flex={fill ? { md: "1" } : undefined}
        maxH={!fill && fillHeight ? `calc(100vh - ${typeof fillHeight === "number" ? fillHeight : 340}px)` : undefined}
        minH={fill ? { md: 0 } : fillHeight ? "200px" : undefined}
      >
        <Table.Root size={dense ? "sm" : "md"} width="full">
          <Table.Header position="sticky" top={0} zIndex={1} bg="var(--admin-surface)" boxShadow="0 1px 0 var(--admin-divider)">
            <Table.Row>
              {selection ? (
                <Table.ColumnHeader width="40px">
                  <Checkbox.Root
                    size="sm"
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(e) => selection.onToggleAll(allKeys, e.checked === true)}
                    aria-label="Selecionar todos"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
              ) : null}
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
                // CONGELADA à direita: some o problema de "ações fora da tela" quando
                // a tabela rola na horizontal (sem overflow, fica igual a antes).
                <Table.ColumnHeader
                  textAlign="end"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                  color="var(--admin-text-soft)"
                  whiteSpace="nowrap"
                  position="sticky"
                  right={0}
                  zIndex={2}
                  bg="var(--admin-surface)"
                  boxShadow="inset 1px 0 0 var(--admin-divider)"
                >
                  Ações
                </Table.ColumnHeader>
              ) : null}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visible.map((row, i) => {
              const rowKey = getRowKey(row, i);
              const checked = selection?.selectedKeys.has(rowKey) ?? false;
              const sel = (selectedKey != null && rowKey === selectedKey) || checked;
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
                {selection ? (
                  <Table.Cell width="40px" onClick={(e) => e.stopPropagation()}>
                    {rowCheckbox(rowKey)}
                  </Table.Cell>
                ) : null}
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
                  <Table.Cell
                    textAlign="end"
                    onClick={(e) => e.stopPropagation()}
                    position="sticky"
                    right={0}
                    zIndex={1}
                    bg={sel ? "rgba(202,138,4,0.10)" : "var(--admin-surface)"}
                    boxShadow="inset 1px 0 0 var(--admin-divider)"
                  >
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
        {visible.map((row, i) => {
          const rowKey = getRowKey(row, i);
          const checked = selection?.selectedKeys.has(rowKey) ?? false;
          const hi = (selectedKey != null && rowKey === selectedKey) || checked;
          return (
          <Box
            key={rowKey}
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="var(--admin-divider)"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            cursor={onRowClick ? "pointer" : undefined}
            bg={hi ? "rgba(202,138,4,0.10)" : undefined}
            _active={onRowClick ? { bg: "var(--admin-nav-hover)" } : undefined}
          >
            <Stack gap={1.5}>
              {/* primeira coluna = título do card (com checkbox de seleção à esquerda) */}
              {selection ? (
                <HStack gap={2} align="flex-start">
                  <Box onClick={(e) => e.stopPropagation()} pt={0.5}>{rowCheckbox(rowKey)}</Box>
                  <Box flex="1" minW={0}>{cell(columns[0], row)}</Box>
                </HStack>
              ) : (
                <Box>{cell(columns[0], row)}</Box>
              )}
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
          );
        })}
      </Stack>

      {footer}
    </Box>
  );
}
