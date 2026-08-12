"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Box, Checkbox, HStack, Portal, Stack, Table, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, GripVertical, Maximize2, Minimize2 } from "lucide-react";
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
 *  - `actions` adiciona a coluna "Ações" à direita (editar/remover/etc.);
 *  - mobile: vira lista de CARDS (label: valor), organizada e sem scroll lateral.
 *
 * ALTURA — quem rola é a PÁGINA (modo `pagina`, o padrão):
 *  A tabela desenha TODAS as linhas da página em altura natural e NÃO tem scroll
 *  próprio. Quem rola é a janela; grudam no lugar: a toolbar (busca/filtros) no
 *  topo, o `thead` logo abaixo dela e o rodapé (contador + paginação) no fundo.
 *  Em tela pequena isso é a diferença entre ver 3 linhas e ver a lista inteira —
 *  antes o miolo era o que sobrava depois de KPIs + abas + filtros.
 *
 *  ⚠️ Por que não dá pra "só tirar a altura": `position: sticky` só enxerga o
 *  scrollport mais próximo, e QUALQUER ancestral com `overflow: auto|scroll|hidden`
 *  vira um. Por isso, no modo página, o card usa `overflow: clip` (recorta igual,
 *  mas NÃO cria scroll container) e a região da tabela não tem overflow nenhum —
 *  inclusive no eixo X. Tabela larga demais é caso do `expandir` (abaixo).
 *
 *  O offset do sticky vem dos shells em `--admin-sticky-top` / `--admin-sticky-bottom`
 *  (topbar do mobile, BottomNav) — nada de número mágico aqui. A altura da toolbar
 *  é MEDIDA, porque ela cresce quando os filtros quebram linha.
 *
 * EXPANDIR: botão no rodapé joga a tabela em tela cheia (`100dvh`, fora do fluxo
 *  da página) com scroll interno nos dois eixos e cabeçalho grudado. É o lugar de
 *  tabela larga e de "quero ver tudo de uma vez". ESC fecha. `expansivel={false}`
 *  tira o botão.
 *
 * MODOS ANTIGOS (retrocompat, nenhum call-site precisou mudar):
 *  - `fillHeight={false}`: mini/natural, sem sticky e sem expandir — tabela
 *    secundária embutida (várias empilhadas, dentro de card/modal).
 *  - `fillHeight={number}` (LEGADO, EVITE): scroll interno limitado à viewport por
 *    um offset chutado (`calc(100vh - Npx)`). O guardrail proíbe número novo.
 *  - `fill` / `fillHeight={true}`: hoje são o próprio padrão (modo página).
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
  // Default = modo PÁGINA (sem scroll interno; quem rola é a janela). `false` =
  // mini/natural; `number` = offset legado (evite). Ver o bloco ALTURA no doc acima.
  fillHeight = true,
  fill = false,
  toolbar,
  paginate = true,
  onReorder,
  dense = false,
  selection,
  titulo,
  expansivel = true,
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
  /** Altura. Default (`true`) = modo PÁGINA: altura natural, sem scroll interno,
   *  sticky na toolbar/`thead`/rodapé. `false` = mini/natural (tabela secundária
   *  embutida: sem sticky, sem expandir). `number` = offset legado em px a
   *  descontar da viewport (`calc(100vh - Npx)`) — EVITE, o guardrail proíbe. */
  fillHeight?: boolean | number;
  /** Redundante: hoje o padrão JÁ é o modo página. Mantido por retrocompat —
   *  quando presente, vence `fillHeight` (era o marcador de "esta enche"). */
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
  /** Nome da tabela — só aparece na barra do modo expandido (tela cheia). */
  titulo?: string;
  /** false = esconde o botão "expandir" do rodapé. */
  expansivel?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [dragKey, setDragKey] = useState<string | number | null>(null);
  const [overKey, setOverKey] = useState<string | number | null>(null);
  const [expandido, setExpandido] = useState(false);
  const effPageSize = paginate ? pageSize : Math.max(rows.length, 1);
  const pages = Math.max(1, Math.ceil(rows.length / effPageSize));
  const current = Math.min(page, pages - 1);
  const visible = useMemo(
    () => rows.slice(current * effPageSize, current * effPageSize + effPageSize),
    [rows, current, effPageSize],
  );
  const from = rows.length === 0 ? 0 : current * effPageSize + 1;
  const to = Math.min(rows.length, (current + 1) * effPageSize);

  // ALTURA — 3 modos. `fill` continua vencendo `fillHeight` (era o marcador de
  // "esta enche"; hoje "encher" virou o padrão, então ele só anula os outros dois).
  const magicOffset = !fill && typeof fillHeight === "number" ? fillHeight : null;
  const mini = !fill && fillHeight === false;
  /** Padrão: altura natural, zero scroll interno — quem rola é a janela. */
  const modoPagina = !mini && magicOffset === null;

  // A toolbar é MEDIDA (e não chutada) porque ela cresce quando os filtros quebram
  // linha — é o offset de onde o `thead` gruda. Ref com cleanup (React 19).
  const [alturaToolbar, setAlturaToolbar] = useState(0);
  const medirToolbar = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const medir = () => setAlturaToolbar(el.getBoundingClientRect().height);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Offsets do sticky. No modo página quem manda são as vars dos shells (topbar do
  // mobile em cima, BottomNav embaixo); no expandido o scrollport é o overlay, e aí
  // não há nada acima nem abaixo pra descontar.
  const topoBase = expandido ? "0px" : "var(--admin-sticky-top, 0px)";
  const stickyToolbar = modoPagina || expandido ? topoBase : undefined;
  const stickyCabecalho =
    modoPagina || expandido ? `calc(${topoBase} + ${alturaToolbar}px)` : 0;
  const stickyRodape = modoPagina && !expandido ? "var(--admin-sticky-bottom, 0px)" : undefined;

  // Tela cheia: ESC fecha e a página de trás não rola junto.
  useEffect(() => {
    if (!expandido) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandido(false);
    };
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [expandido]);

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
    <Box
      ref={medirToolbar}
      px={3}
      py={2.5}
      borderBottomWidth="1px"
      borderColor="var(--admin-divider)"
      flexShrink={0}
      // Gruda no topo junto com o `thead`. `bg` opaco é obrigatório: sem ele as
      // linhas passariam por baixo e apareceriam através da barra de filtros.
      position={stickyToolbar ? "sticky" : undefined}
      top={stickyToolbar}
      zIndex={stickyToolbar ? 3 : undefined}
      bg="var(--admin-surface)"
    >
      {toolbar}
    </Box>
  ) : null;

  if (rows.length === 0) {
    // Vazia não tem o que rolar: fica em altura natural e, no modo página, ainda
    // marca `data-jj-table` pro `Screen fill` soltar o teto (senão sobraria um
    // retângulo vazio do tamanho da tela).
    return (
      <Box
        className="admin-card"
        data-jj-table={modoPagina ? "pagina" : undefined}
        overflow={modoPagina ? "clip" : "hidden"}
        p={0}
      >
        {toolbarNode}
        <Box p={6}>{empty ?? <EmptyState title="Nada por aqui ainda." />}</Box>
      </Box>
    );
  }

  const cell = (c: Column<T>, row: T) =>
    c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "");

  // Só faz sentido expandir o que tem altura de verdade: mini embutida fica fora.
  const mostraExpandir = expansivel && !mini;

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
      // Gruda no fundo da janela (acima da BottomNav do mobile): a paginação e o
      // contador ficam ao alcance sem precisar rolar a lista inteira.
      position={stickyRodape ? "sticky" : undefined}
      bottom={stickyRodape}
      zIndex={stickyRodape ? 3 : undefined}
    >
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {from}–{to} de {rows.length}
      </Text>
      <HStack gap={1}>
        {pages > 1 ? (
          <>
            <Button size="xs" tone="ghost" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">
              <ChevronLeft size={14} />
            </Button>
            <Text fontSize="xs" color="var(--admin-text-soft)" px={1}>
              {current + 1}/{pages}
            </Text>
            <Button size="xs" tone="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Próxima página">
              <ChevronRight size={14} />
            </Button>
          </>
        ) : null}
        {mostraExpandir ? (
          <Button
            size="xs"
            tone="ghost"
            onClick={() => setExpandido((v) => !v)}
            aria-label={expandido ? "Sair da tela cheia" : "Expandir para tela cheia"}
            title={expandido ? "Sair da tela cheia (Esc)" : "Expandir para tela cheia"}
          >
            {expandido ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        ) : null}
      </HStack>
    </HStack>
  );

  const cartao = (
    <Box
      className="admin-card"
      // Marcador lido pelo `Screen` (`:has([data-jj-table="pagina"])`): é ele que
      // faz o `Screen fill` SOLTAR o teto de altura — sem isso a tabela em altura
      // natural vazaria pra fora do box da tela. Nenhum call-site precisa mudar.
      data-jj-table={expandido ? "expandido" : modoPagina ? "pagina" : undefined}
      // ⚠️ `clip` (e NÃO `hidden`) no modo página: recorta o card do mesmo jeito
      // mas não cria scroll container — é a única razão do sticky continuar de pé.
      overflow={modoPagina && !expandido ? "clip" : "hidden"}
      p={0}
      // Expandido: o card é a coluna que ocupa o overlay inteiro.
      display={expandido ? "flex" : undefined}
      flexDirection={expandido ? "column" : undefined}
      flex={expandido ? "1" : undefined}
      minH={expandido ? 0 : undefined}
    >
      {toolbarNode}
      {/* Desktop: tabela. Modo página = sem overflow NENHUM (senão mata o sticky). */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowY={modoPagina && !expandido ? undefined : "auto"}
        overflowX={modoPagina && !expandido ? undefined : "auto"}
        flex={expandido ? "1" : undefined}
        maxH={magicOffset !== null ? `calc(100vh - ${magicOffset}px)` : undefined}
        minH={expandido ? 0 : magicOffset !== null ? "200px" : undefined}
        // Sem scroll horizontal no modo página, texto longo QUEBRA em vez de
        // empurrar a tabela pra fora do card. Quem precisa de largura usa o expandir.
        css={
          modoPagina && !expandido
            ? { "& tbody td": { overflowWrap: "anywhere" } }
            : undefined
        }
      >
        <Table.Root size={dense ? "sm" : "md"} width="full">
          <Table.Header
            position="sticky"
            // Gruda LOGO ABAIXO da toolbar (que já está grudada no topo da janela).
            top={stickyCabecalho}
            zIndex={2}
            bg="var(--admin-surface)"
            boxShadow="0 1px 0 var(--admin-divider)"
          >
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
      <Stack
        display={{ base: "flex", md: "none" }}
        gap={0}
        // No expandido o desktop some, então é esta lista que vira a área rolável.
        flex={expandido ? "1" : undefined}
        minH={expandido ? 0 : undefined}
        overflowY={expandido ? "auto" : undefined}
      >
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

  if (!expandido) return cartao;

  // Tela cheia: sai do fluxo da página (por isso o Portal — dentro da tela ele
  // herdaria qualquer `transform`/`overflow` de ancestral e o `fixed` viraria
  // relativo). Aqui o scrollport é este box, então o sticky volta a ser `top: 0`.
  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        // Não é `inset: 0`: com um FAB ACOPLADO à direita, a janela útil termina
        // onde o painel começa — senão a tela cheia nasceria por baixo dele
        // (o painel está em z-index maior) e a última coluna ficava tapada.
        right="var(--jj-fab-dock, 0px)"
        zIndex={1300}
        bg="var(--admin-bg)"
        display="flex"
        flexDirection="column"
        gap={2}
        p={{ base: 2, md: 3 }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo ? `${titulo} em tela cheia` : "Tabela em tela cheia"}
      >
        <HStack justify="space-between" px={1} flexShrink={0}>
          <Text fontSize="sm" fontWeight="600" lineClamp={1}>
            {titulo ?? "Tabela"}{" "}
            <Text as="span" color="var(--admin-text-soft)" fontWeight="400">
              · {rows.length} {rows.length === 1 ? "item" : "itens"}
            </Text>
          </Text>
          <Button size="xs" tone="ghost" onClick={() => setExpandido(false)}>
            <Minimize2 size={14} /> Fechar (Esc)
          </Button>
        </HStack>
        {cartao}
      </Box>
    </Portal>
  );
}
