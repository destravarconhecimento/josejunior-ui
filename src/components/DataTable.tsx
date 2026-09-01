"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Box, Checkbox, HStack, Input, Portal, Stack, Table, Text } from "@chakra-ui/react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GripVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";
import { ordenarLinhas, proximoSort, type SortState, type ValorCelula } from "./table/sort";
import { aplicarFiltros, valoresDistintos, type FiltroColuna } from "./table/filtros";
import { FiltroColunaMenu } from "./table/FiltroColunaMenu";
import { BarraTabela } from "./table/BarraTabela";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
  /** No mobile (visão em cards) esconde células pouco importantes. */
  hideOnMobile?: boolean;
  /**
   * Acessor do DADO CRU da célula (o `render` é JSX — não dá pra comparar). É o
   * que liga a coluna ao motor "quase Excel": com `value` a coluna ordena pelo
   * clique no cabeçalho e ganha o funil de filtro por valores (com contagem).
   * Sem `value` a coluna fica EXATAMENTE como sempre foi.
   */
  value?: (row: T) => ValorCelula;
  /** Desliga a ordenação mesmo com `value` (default: ordena se tem `value`). */
  sortable?: boolean;
  /** Desliga o filtro mesmo com `value` (default: filtra se tem `value`). */
  filterable?: boolean;
  /** Nome da coluna em chips/menus quando `header` é JSX (senão usa o texto). */
  headerLabel?: string;
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
  actionsWidth,
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
  defaultSort,
  sort: sortProp,
  onSortChange,
  defaultFiltros,
  filtros: filtrosProp,
  onFiltrosChange,
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
  /**
   * Largura RESERVADA da coluna de ações (ex.: `"176px"`).
   *
   * No modo página não há rolagem horizontal: a tabela cabe em 100% e o
   * navegador reparte a largura entre as colunas. Sem reserva, uma coluna de
   * texto longo espremia a de ações abaixo do tamanho natural dos botões e
   * eles VAZAVAM da célula — foi o que a operadora viu cortado na borda.
   * Com a reserva, a coluna tem piso e quem cede largura é o texto.
   */
  actionsWidth?: string;
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
  /** Ordenação inicial (modo interno). Só vale pra colunas com `value`. */
  defaultSort?: SortState | null;
  /** Ordenação CONTROLADA — a PRESENÇA da prop liga o modo controlado. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Filtros de coluna iniciais (modo interno). */
  defaultFiltros?: FiltroColuna[];
  /** Filtros CONTROLADOS — a PRESENÇA da prop liga o modo controlado. */
  filtros?: FiltroColuna[];
  onFiltrosChange?: (filtros: FiltroColuna[]) => void;
}) {
  const [page, setPage] = useState(0);
  const [dragKey, setDragKey] = useState<string | number | null>(null);
  const [overKey, setOverKey] = useState<string | number | null>(null);
  const [expandido, setExpandido] = useState(false);

  // ORDENAR/FILTRAR ("quase Excel") — só existe pra coluna com `value`. Estado
  // interno por padrão; a PRESENÇA de `sort`/`filtros` liga o modo controlado
  // (é como a tela liga KPIs clicáveis e presets aos filtros da tabela).
  const sortControlado = sortProp !== undefined;
  const [sortInterno, setSortInterno] = useState<SortState | null>(defaultSort ?? null);
  const sortAtivo = sortControlado ? (sortProp ?? null) : sortInterno;
  const mudarSort = (s: SortState | null) => {
    if (!sortControlado) setSortInterno(s);
    onSortChange?.(s);
  };
  const filtrosControlados = filtrosProp !== undefined;
  const [filtrosInternos, setFiltrosInternos] = useState<FiltroColuna[]>(defaultFiltros ?? []);
  const filtrosAtivos = filtrosControlados ? (filtrosProp ?? []) : filtrosInternos;
  const mudarFiltros = (f: FiltroColuna[]) => {
    if (!filtrosControlados) setFiltrosInternos(f);
    onFiltrosChange?.(f);
  };
  const mudarFiltroColuna = (key: string, valores: string[] | null) => {
    const sem = filtrosAtivos.filter((f) => f.key !== key);
    mudarFiltros(valores && valores.length > 0 ? [...sem, { key, valores }] : sem);
  };
  const ativoDe = (key: string) => {
    const v = filtrosAtivos.find((f) => f.key === key)?.valores;
    return v && v.length > 0 ? v : null;
  };

  const valueDe = useCallback(
    (key: string) => columns.find((c) => c.key === key)?.value,
    [columns],
  );
  // Pipeline: `rows` (a tela já filtrou o dela) → filtros de coluna → ordenação
  // → paginação. Sem filtro/sort ativo os helpers devolvem a MESMA referência de
  // `rows` — nos call sites que não aderiram, nada muda nem de identidade.
  const linhasFiltradas = useMemo(
    () => aplicarFiltros(rows, filtrosAtivos, valueDe),
    [rows, filtrosAtivos, valueDe],
  );
  const linhasVisiveis = useMemo(() => {
    const v = sortAtivo ? valueDe(sortAtivo.key) : undefined;
    return sortAtivo && v ? ordenarLinhas(linhasFiltradas, v, sortAtivo.dir) : linhasFiltradas;
  }, [linhasFiltradas, sortAtivo, valueDe]);

  // Filtro/ordenação/tamanho mudou → volta pra 1ª página. A ASSINATURA (e não o
  // array) é a dependência: pai que recria `filtros` a cada render não reseta à toa.
  const assinaturaExcel = `${rows.length}|${JSON.stringify(filtrosAtivos)}|${JSON.stringify(sortAtivo)}`;
  useEffect(() => {
    setPage(0);
  }, [assinaturaExcel]);

  const effPageSize = paginate ? pageSize : Math.max(linhasVisiveis.length, 1);
  const pages = Math.max(1, Math.ceil(linhasVisiveis.length / effPageSize));
  const current = Math.min(page, pages - 1);
  const visible = useMemo(
    () => linhasVisiveis.slice(current * effPageSize, current * effPageSize + effPageSize),
    [linhasVisiveis, current, effPageSize],
  );
  const from = linhasVisiveis.length === 0 ? 0 : current * effPageSize + 1;
  const to = Math.min(linhasVisiveis.length, (current + 1) * effPageSize);

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
  // as páginas), não só a visível. Filtro de coluna ativo corta daqui também —
  // selecionar todos com a lista filtrada seleciona só o que a pessoa está vendo.
  const allKeys: Array<string | number> = selection ? linhasVisiveis.map((r, i) => getRowKey(r, i)) : [];
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

  const rotuloColuna = (c: Column<T>) =>
    c.headerLabel ?? (typeof c.header === "string" ? c.header : c.key);
  const ordenaveis = columns.filter((c) => c.value && c.sortable !== false);
  const filtraveis = columns.filter((c) => c.value && c.filterable !== false);
  // Facetas LAZY (só ao abrir o menu/modal): valores da coluna X contados sobre
  // as linhas filtradas por TODAS as OUTRAS colunas — a conta do Excel.
  const facetasDe = (c: Column<T>) => () =>
    valoresDistintos(aplicarFiltros(rows, filtrosAtivos, valueDe, c.key), c.value!);
  const temChips = sortAtivo != null || filtrosAtivos.some((f) => f.valores.length > 0);

  const toolbarNode =
    toolbar || temChips || ordenaveis.length > 0 || filtraveis.length > 0 ? (
      <Box
        ref={medirToolbar}
        flexShrink={0}
        // Gruda no topo junto com o `thead`. `bg` opaco é obrigatório: sem ele as
        // linhas passariam por baixo e apareceriam através da barra de filtros.
        // Os chips moram AQUI DENTRO (box medido): quando aparecem, o offset do
        // `thead` se ajusta sozinho pelo ResizeObserver.
        position={stickyToolbar ? "sticky" : undefined}
        top={stickyToolbar}
        zIndex={stickyToolbar ? 3 : undefined}
        bg="var(--admin-surface)"
      >
        {toolbar ? (
          <Box px={3} py={2.5} borderBottomWidth="1px" borderColor="var(--admin-divider)">
            {toolbar}
          </Box>
        ) : null}
        <BarraTabela
          ordenaveis={ordenaveis.map((c) => ({ key: c.key, rotulo: rotuloColuna(c) }))}
          filtraveis={filtraveis.map((c) => ({ key: c.key, rotulo: rotuloColuna(c), facetas: facetasDe(c) }))}
          sort={sortAtivo}
          onSortChange={mudarSort}
          filtros={filtrosAtivos}
          onFiltroChange={mudarFiltroColuna}
          onLimparTudo={() => {
            mudarFiltros([]);
            mudarSort(null);
          }}
        />
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

  if (linhasVisiveis.length === 0) {
    // TEM linha, mas os filtros de coluna esconderam todas — diferente de vazio
    // de verdade: aqui a saída é limpar o filtro, e o botão faz isso.
    return (
      <Box
        className="admin-card"
        data-jj-table={modoPagina ? "pagina" : undefined}
        overflow={modoPagina ? "clip" : "hidden"}
        p={0}
      >
        {toolbarNode}
        <Box p={6}>
          <EmptyState
            title="Nenhuma linha passa nos filtros."
            description={`${rows.length} ${rows.length === 1 ? "linha escondida" : "linhas escondidas"} pelos filtros da tabela.`}
            action={
              <Button
                size="sm"
                tone="outline"
                onClick={() => {
                  mudarFiltros([]);
                  mudarSort(null);
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        </Box>
      </Box>
    );
  }

  const cell = (c: Column<T>, row: T) =>
    c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "");

  // Só faz sentido expandir o que tem altura de verdade: mini embutida fica fora.
  const mostraExpandir = expansivel && !mini;

  const irParaPagina = (texto: string) => {
    const n = Math.floor(Number(texto));
    if (!Number.isFinite(n) || n < 1) return;
    setPage(Math.min(pages - 1, n - 1));
  };

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
        {from}–{to} de {linhasVisiveis.length}
        {linhasVisiveis.length !== rows.length ? ` · filtrado de ${rows.length}` : ""}
      </Text>
      <HStack gap={1}>
        {pages > 1 ? (
          <>
            <Button size="xs" tone="ghost" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">
              <ChevronLeft size={14} />
            </Button>
            {/* Salto direto: 80 páginas de leads não se atravessam de chevron em
                chevron. `key` remonta o input quando a página muda por fora. */}
            <Input
              key={current}
              size="xs"
              w="48px"
              textAlign="center"
              type="number"
              min={1}
              max={pages}
              defaultValue={current + 1}
              aria-label="Ir para a página"
              onBlur={(e) => irParaPagina(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") irParaPagina((e.target as HTMLInputElement).value);
              }}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)" pr={1}>
              /{pages}
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
              {columns.map((c) => {
                const ordenavel = !!c.value && c.sortable !== false;
                const filtravel = !!c.value && c.filterable !== false;
                const ordem = sortAtivo && sortAtivo.key === c.key ? sortAtivo.dir : null;
                return (
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
                    overflow={ordenavel || filtravel ? undefined : "hidden"}
                    textOverflow={ordenavel || filtravel ? undefined : "ellipsis"}
                    aria-sort={ordem ? (ordem === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {ordenavel || filtravel ? (
                      <HStack
                        gap={0.5}
                        flexWrap="nowrap"
                        justify={c.align === "end" ? "flex-end" : c.align === "center" ? "center" : undefined}
                      >
                        {ordenavel ? (
                          // O th INTEIRO (menos o funil) é o botão de ordenar:
                          // ciclo sem → asc → desc → sem (volta à ordem da tela).
                          <Box
                            as="button"
                            onClick={() => mudarSort(proximoSort(sortAtivo, c.key))}
                            display="inline-flex"
                            alignItems="center"
                            gap={0.5}
                            minW={0}
                            cursor="pointer"
                            fontSize="inherit"
                            fontWeight="inherit"
                            textTransform="inherit"
                            letterSpacing="inherit"
                            color={ordem ? "var(--admin-primary)" : "inherit"}
                            _hover={{ color: "var(--admin-primary)" }}
                            title={`Ordenar por ${rotuloColuna(c)}`}
                          >
                            <Box as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {c.header}
                            </Box>
                            <Box as="span" display="inline-flex" flexShrink={0} opacity={ordem ? 1 : 0.6}>
                              {ordem === "asc" ? (
                                <ArrowUp size={12} />
                              ) : ordem === "desc" ? (
                                <ArrowDown size={12} />
                              ) : (
                                <ChevronsUpDown size={12} />
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Box as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" minW={0}>
                            {c.header}
                          </Box>
                        )}
                        {filtravel ? (
                          <FiltroColunaMenu
                            rotulo={rotuloColuna(c)}
                            ativo={ativoDe(c.key)}
                            facetas={facetasDe(c)}
                            onChange={(valores) => mudarFiltroColuna(c.key, valores)}
                          />
                        ) : null}
                      </HStack>
                    ) : (
                      c.header
                    )}
                  </Table.ColumnHeader>
                );
              })}
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
                  width={actionsWidth}
                  minW={actionsWidth}
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
                    width={actionsWidth}
                    minW={actionsWidth}
                    // O `overflowWrap: anywhere` do modo página vale pra TODA
                    // `td`; aqui ele quebraria a fila de botões. Ações não são
                    // texto — não quebram, não encolhem.
                    whiteSpace="nowrap"
                    bg={sel ? "rgba(202,138,4,0.10)" : "var(--admin-surface)"}
                    boxShadow="inset 1px 0 0 var(--admin-divider)"
                  >
                    <HStack gap={1} justify="flex-end" flexWrap="nowrap" css={{ "& > *": { flexShrink: 0 } }}>
                      {actions(row)}
                    </HStack>
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
              · {linhasVisiveis.length} {linhasVisiveis.length === 1 ? "item" : "itens"}
              {linhasVisiveis.length !== rows.length ? ` (de ${rows.length})` : ""}
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
