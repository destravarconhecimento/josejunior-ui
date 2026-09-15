"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
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
import {
  AcoesLinha,
  larguraAcoesLinha,
  LARGURA_ACOES_MINIMA,
  type AcoesDeclaradas,
} from "./table/AcoesLinha";
import { aplicarFiltros, valoresDistintos, type FiltroColuna } from "./table/filtros";
import { FiltroColunaMenu } from "./table/FiltroColunaMenu";
import { BarraTabela } from "./table/BarraTabela";
import { renderCelulaDeclarativa, type ColunaCelula } from "./table/celula-declarativa";
import { useUiEnums, useUiFormato, useUiTextos } from "../provider/textos";
import { fmtTexto, plural, type UiTextos } from "../textos";

export type Column<T> = ColunaCelula & {
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
  /** Esconde a coluna ABAIXO do breakpoint (`hideOnMobile` continua valendo). */
  hideBelow?: "sm" | "md" | "lg";
  /** Célula que não quebra linha (código, data, valor). */
  nowrap?: boolean;
  /**
   * Coluna PRESA na borda enquanto a tabela rola na horizontal. Só tem efeito
   * onde existe rolagem lateral (tela cheia / modo mini) — no modo página a
   * tabela cabe em 100% e a prop é inócua.
   */
  sticky?: "start" | "end";
  /** Cabeçalho quebra em duas linhas em vez de cortar com reticência. */
  headerWrap?: boolean;
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

/**
 * Card para grade fora do comum (nunca uma 2ª tabela de dados). `overflow: clip`
 * e NÃO `auto`: scroll aqui viraria o scrollport mais próximo e mataria o sticky
 * de qualquer `DataTable` colocada dentro.
 */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Box className="admin-card" overflow="clip">
      {children}
    </Box>
  );
}

const PAGE_SIZE = 25;

function ehAlturaConcreta(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s !== "" && s !== "none" && s !== "auto" && s !== "unset" && s !== "initial";
}

function scrollportAncestral(el: HTMLElement): HTMLElement | null {
  let no = el.parentElement;
  while (no && no !== document.body && no !== document.documentElement) {
    const s = getComputedStyle(no);
    const rola = (v: string) => v === "auto" || v === "scroll" || v === "hidden";
    if (rola(s.overflowY) || rola(s.overflowX)) return no;
    no = no.parentElement;
  }
  return null;
}

const DISPLAY_ACIMA = {
  sm: { base: "none", sm: "table-cell" },
  md: { base: "none", md: "table-cell" },
  lg: { base: "none", lg: "table-cell" },
} as const;

const CORES_LINHA = {
  "--jj-fundo": "var(--admin-surface, #fff)",
  "--jj-tinta": "var(--admin-text, #101828)",
  "--jj-marca": "var(--admin-primary, #2563eb)",
  "--jj-zebra": "color-mix(in srgb, var(--jj-tinta) 3.5%, var(--jj-fundo))",
  "--jj-hover": "color-mix(in srgb, var(--jj-marca) 7%, var(--jj-fundo))",
  "--jj-sel": "color-mix(in srgb, #ca8a04 12%, var(--jj-fundo))",
  "--jj-sel-hover": "color-mix(in srgb, #ca8a04 18%, var(--jj-fundo))",
  "--jj-arraste": "color-mix(in srgb, var(--jj-marca) 12%, var(--jj-fundo))",
  "@supports not (color: color-mix(in srgb, red 50%, blue))": {
    "--jj-zebra": "rgba(16,24,40,0.035)",
    "--jj-hover": "rgba(37,99,235,0.07)",
    "--jj-sel": "rgba(202,138,4,0.12)",
    "--jj-sel-hover": "rgba(202,138,4,0.18)",
    "--jj-arraste": "rgba(37,99,235,0.12)",
  },
  "& tbody td": { borderColor: "var(--admin-divider, rgba(16,24,40,0.12))" },
  _dark: {
    "--jj-fundo": "var(--admin-surface, #1a1d21)",
    "--jj-tinta": "var(--admin-text, #ecedee)",
    "--jj-zebra": "color-mix(in srgb, var(--jj-tinta) 4.5%, var(--jj-fundo))",
    "--jj-hover": "color-mix(in srgb, var(--jj-marca) 14%, var(--jj-fundo))",
    "@supports not (color: color-mix(in srgb, red 50%, blue))": {
      "--jj-zebra": "rgba(255,255,255,0.045)",
      "--jj-hover": "rgba(37,99,235,0.14)",
    },
  },
};

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
 * A TABELA É SOBERANA — ela se defende do que a tela fizer em volta:
 *  - Se ALGUM ancestral virou scrollport (a tela pôs `overflow` em volta), o
 *    componente DETECTA em runtime e passa a grudar em `0` — relativo àquele
 *    scrollport — em vez do offset da topbar, que ali não significa nada. Em dev
 *    ainda avisa no console apontando o elemento culpado quando esse ancestral
 *    tem `overflow` mas não rola (aí o sticky ficaria inerte).
 *  - `fillHeight={false}` SEM `alturaMax` concreta não liga mais scroll interno:
 *    um `overflow: auto` sem teto de altura é um scrollport que nunca rola, e era
 *    a causa de "gruda mas não sobe". Sem altura, mini = altura natural.
 *  - Se a soma das colunas não cabe no card (a primeira coluna com conteúdo longo
 *    demais empurrando o resto pra fora), o componente entra em modo APERTADO
 *    — medido por ResizeObserver: `table-layout: fixed` + reticência nas células.
 *    Ficam de fora (`data-jj-fixa`) seleção, reordenar, ações e a linha de seção.
 *    Quem precisa ver o texto inteiro usa o `expandir`.
 *  - A coluna de ações SEMPRE reserva largura (`larguraAcoesLinha` nunca devolve
 *    vazio), senão ela é a última e é justamente a que o recorte come.
 *  - A zebra tem fallback literal em toda cor: `color-mix` com uma var ausente é
 *    declaração inválida, e isso apagava a zebra inteira fora do shell do painel.
 *
 * EXPANDIR: botão no rodapé joga a tabela em tela cheia (`100dvh`, fora do fluxo
 *  da página) com scroll interno nos dois eixos e cabeçalho grudado. É o lugar de
 *  tabela larga e de "quero ver tudo de uma vez". ESC fecha. `expansivel={false}`
 *  tira o botão.
 *
 * MODOS ANTIGOS (retrocompat, nenhum call-site precisou mudar):
 *  - `fillHeight={false}`: mini/natural, sem sticky e sem expandir — tabela
 *    secundária embutida (várias empilhadas, dentro de card/modal). Só ganha
 *    scroll interno com `alturaMax` concreta.
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
  acoesDaLinha,
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
  chipsExtras,
  textos: textosProp,
  carregando = false,
  cards = true,
  renderCard,
  filtrosEmSheet = true,
  rowProps,
  secaoDaLinha,
  alturaMax,
  busca,
  filtrosDaTela,
  filtrosDaTelaAtivos,
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
  acoesDaLinha?: (row: T) => AcoesDeclaradas;
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
  /** Chips extras na linha de chips (filtros que vivem fora das colunas). */
  chipsExtras?: ReactNode;
  /** Sobrescreve as strings desta tabela (o resto vem do `UiTextosProvider`). */
  textos?: Partial<UiTextos>;
  /** Carregando NAO e vazio: sem linha ainda, mostra o aviso em vez do EmptyState. */
  carregando?: boolean;
  /** false = no mobile continua tabela (não vira lista de cards). */
  cards?: boolean;
  /** Card do mobile por conta da tela (substitui a lista rótulo/valor). */
  renderCard?: (row: T) => ReactNode;
  /** false = as colunas em acordeão abrem na página, não num modal. */
  filtrosEmSheet?: boolean;
  /** Props extras no elemento da linha (estado visual que a tela conhece). */
  rowProps?: (row: T, index: number) => Record<string, unknown> | undefined;
  /**
   * Linha que é RÓTULO DE SEÇÃO (agrupa o que vem abaixo) em vez de dado:
   * devolva o rótulo e a linha ocupa a largura toda, sem células.
   */
  secaoDaLinha?: (row: T) => ReactNode;
  /**
   * Teto de altura da área rolável, só no modo mini (`fillHeight={false}`).
   * NÃO é o offset legado: é altura fixa de bloco embutido (`"14rem"`), não
   * conta de viewport. No modo página quem rola é a janela e a prop é inócua.
   */
  alturaMax?: string;
  busca?: ReactNode;
  filtrosDaTela?: ReactNode;
  filtrosDaTelaAtivos?: number;
}) {
  const acoesPorLinha = acoesDaLinha ? rows.map((r) => acoesDaLinha(r)) : null;
  const celulaAcoes = acoesDaLinha
    ? acoesPorLinha?.some((l) => l.some((a) => a && !a.oculta))
      ? (row: T) => <AcoesLinha acoes={acoesDaLinha(row)} />
      : undefined
    : actions;
  const larguraAcoes =
    actionsWidth ??
    (acoesPorLinha ? larguraAcoesLinha(acoesPorLinha, { dense }) : LARGURA_ACOES_MINIMA);
  const textos = useUiTextos(textosProp);
  const formato = useUiFormato();
  const enums = useUiEnums();
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

  const magicOffset = !fill && typeof fillHeight === "number" ? fillHeight : null;
  const mini = !fill && fillHeight === false;
  const alturaMini = mini && ehAlturaConcreta(alturaMax) ? alturaMax! : null;
  const rolaDentro = expandido || magicOffset !== null || alturaMini !== null;
  const modoPagina = !rolaDentro;
  const modoJanela = modoPagina && !mini;

  const [alturaToolbar, setAlturaToolbar] = useState(0);
  const medirToolbar = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const medir = () => setAlturaToolbar(el.getBoundingClientRect().height);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [emScrollport, setEmScrollport] = useState(false);
  const medirContexto = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof window === "undefined") return;
    const sp = scrollportAncestral(el);
    setEmScrollport(sp != null);
    if (sp && process.env.NODE_ENV !== "production" && sp.scrollHeight <= sp.clientHeight + 1) {
      console.warn(
        "[DataTable] o ancestral abaixo tem overflow mas não rola: ele vira o scrollport e o cabeçalho não gruda. Tire o overflow (ou dê altura a ele).",
        sp,
      );
    }
  }, []);

  const areaRef = useRef<HTMLDivElement | null>(null);
  const [apertado, setApertado] = useState(false);
  const apertadoRef = useRef(false);
  const larguraNaturalRef = useRef(0);
  apertadoRef.current = apertado;
  const medirLargura = useCallback(() => {
    const el = areaRef.current;
    const tabela = el?.querySelector("table");
    if (!el || !tabela) return;
    const disponivel = el.clientWidth;
    if (disponivel === 0) return;
    if (!apertadoRef.current) {
      if (tabela.scrollWidth > disponivel + 1) {
        larguraNaturalRef.current = tabela.scrollWidth;
        setApertado(true);
      }
    } else if (larguraNaturalRef.current > 0 && disponivel >= larguraNaturalRef.current) {
      setApertado(false);
    }
  }, []);
  const medirArea = useCallback(
    (el: HTMLDivElement | null) => {
      areaRef.current = el;
      if (!el || typeof ResizeObserver === "undefined") return;
      medirLargura();
      const ro = new ResizeObserver(medirLargura);
      ro.observe(el);
      const tabela = el.querySelector("table");
      if (tabela) ro.observe(tabela);
      return () => ro.disconnect();
    },
    [medirLargura],
  );

  const topoBase = expandido || emScrollport ? "0px" : "var(--admin-sticky-top, 0px)";
  const stickyToolbar = modoJanela || expandido ? topoBase : undefined;
  const stickyCabecalho: string | number | undefined =
    modoJanela || expandido
      ? `calc(${topoBase} + ${alturaToolbar}px)`
      : rolaDentro
        ? 0
        : undefined;
  const stickyRodape = !modoJanela || expandido
    ? undefined
    : emScrollport
      ? "0px"
      : "var(--admin-sticky-bottom, 0px)";

  const cssArea = useMemo(() => {
    const regras: Record<string, Record<string, string | number>> = {};
    if (!rolaDentro) regras["& tbody td"] = { overflowWrap: "anywhere" };
    if (apertado) {
      regras["& table"] = { tableLayout: "fixed", width: "100%" };
      regras["& th:not([data-jj-fixa]), & td:not([data-jj-fixa])"] = {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflowWrap: "normal",
      };
      regras["& th:not([data-jj-fixa]) *, & td:not([data-jj-fixa]) *"] = { minWidth: 0 };
    }
    return regras;
  }, [rolaDentro, apertado]);

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
        aria-label={textos.selecionarLinha}
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
    valoresDistintos(aplicarFiltros(rows, filtrosAtivos, valueDe, c.key), c.value!, textos);
  const temChips = sortAtivo != null || filtrosAtivos.some((f) => f.valores.length > 0);

  const hideProps = (c: Column<T>) => (c.hideBelow ? { display: DISPLAY_ACIMA[c.hideBelow] } : {});

  // Coluna presa só faz sentido onde a tabela ROLA na horizontal: no modo página
  // ela cabe em 100% e não há de quem se soltar. Por isso a prop é inócua nas
  // telas que já existem — só acorda na tela cheia e no modo mini.
  const rolaX = rolaDentro;
  const presasInicio = rolaX ? columns.filter((c) => c.sticky === "start") : [];
  const presasFim = rolaX ? columns.filter((c) => c.sticky === "end") : [];
  const somaLarguras = (partes: string[]) =>
    partes.length === 0 ? "0px" : `calc(${partes.join(" + ")})`;
  const offsetPresa = (c: Column<T>) => {
    if (c.sticky === "start") {
      const partes = [...(selection ? ["40px"] : []), ...(onReorder ? ["34px"] : [])];
      for (const outra of presasInicio) {
        if (outra.key === c.key) break;
        partes.push(outra.width ?? "0px");
      }
      return somaLarguras(partes);
    }
    const partes = celulaAcoes ? [larguraAcoes ?? "0px"] : [];
    const idx = presasFim.findIndex((outra) => outra.key === c.key);
    for (let i = presasFim.length - 1; i > idx; i--) partes.push(presasFim[i].width ?? "0px");
    return somaLarguras(partes);
  };
  const zebra: boolean[] = [];
  {
    let n = 0;
    for (const row of visible) {
      if (secaoDaLinha?.(row) != null) {
        n = 0;
        zebra.push(false);
      } else {
        zebra.push(n % 2 === 1);
        n++;
      }
    }
  }

  const presoProps = (c: Column<T>, cabecalho: boolean) => {
    if (!rolaX || !c.sticky) return {};
    const offset = offsetPresa(c);
    return {
      position: "sticky" as const,
      ...(c.sticky === "start" ? { left: offset } : { right: offset }),
      zIndex: cabecalho ? 3 : 1,
      bg: cabecalho ? "var(--admin-surface)" : "var(--jj-linha, var(--admin-surface))",
      boxShadow:
        c.sticky === "start"
          ? "inset -1px 0 0 var(--admin-divider)"
          : "inset 1px 0 0 var(--admin-divider)",
    };
  };

  const unificado = busca != null || filtrosDaTela != null;
  const painelDaTela =
    filtrosDaTela != null || (unificado && toolbar) ? (
      <>
        {filtrosDaTela}
        {toolbar}
      </>
    ) : undefined;

  const toolbarNode =
    unificado || toolbar || temChips || chipsExtras != null || ordenaveis.length > 0 || filtraveis.length > 0 ? (
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
        {unificado ? (
          <Box
            display={{ base: "none", md: "block" }}
            px={3}
            py={2.5}
            borderBottomWidth="1px"
            borderColor="var(--admin-divider)"
          >
            <HStack gap={2} flexWrap="wrap" align="center">
              {busca != null ? (
                <Box flex="1" minW="14rem" maxW="sm">
                  {busca}
                </Box>
              ) : null}
              <HStack gap={2} flexWrap="wrap" align="center" ml="auto" justify="flex-end">
                {filtrosDaTela}
                {toolbar}
              </HStack>
            </HStack>
          </Box>
        ) : toolbar ? (
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
          chipsExtras={chipsExtras}
          textos={textos}
          filtrosEmSheet={filtrosEmSheet}
          busca={busca}
          filtrosDaTela={painelDaTela}
          filtrosDaTelaAtivos={filtrosDaTelaAtivos}
        />
      </Box>
    ) : null;

  if (rows.length === 0) {
    return (
      <Box
        className="admin-card"
        data-jj-table={modoJanela ? "pagina" : undefined}
        overflow={rolaDentro ? "hidden" : "clip"}
        p={0}
      >
        {toolbarNode}
        <Box p={6}>
          {carregando ? (
            <Text fontSize="sm" color="var(--admin-text-soft)">
              {textos.carregando}
            </Text>
          ) : (
            empty ?? <EmptyState title={textos.vazioTitulo} />
          )}
        </Box>
      </Box>
    );
  }

  if (linhasVisiveis.length === 0) {
    return (
      <Box
        className="admin-card"
        data-jj-table={modoJanela ? "pagina" : undefined}
        overflow={rolaDentro ? "hidden" : "clip"}
        p={0}
      >
        {toolbarNode}
        <Box p={6}>
          <EmptyState
            title={textos.filtradoVazioTitulo}
            description={plural(rows.length, textos.filtradoVazioUma, textos.filtradoVazioMuitas)}
            action={
              <Button
                size="sm"
                tone="outline"
                onClick={() => {
                  mudarFiltros([]);
                  mudarSort(null);
                }}
              >
                {textos.limparFiltros}
              </Button>
            }
          />
        </Box>
      </Box>
    );
  }

  const cell = (c: Column<T>, row: T) => {
    if (c.render) return c.render(row);
    const linha = row as Record<string, unknown>;
    if (c.kind) return renderCelulaDeclarativa(c, linha[c.key], linha, { textos, formato, enums });
    return String(linha[c.key] ?? "");
  };

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
      pl={4}
      pr="calc(1rem + var(--admin-rodape-reserva, 0px))"
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
        {fmtTexto(textos.rodapeFaixa, { de: from, ate: to, total: linhasVisiveis.length })}
        {linhasVisiveis.length !== rows.length
          ? fmtTexto(textos.rodapeFiltradoDe, { total: rows.length })
          : ""}
      </Text>
      <HStack gap={1}>
        {pages > 1 ? (
          <>
            <Button size="xs" tone="ghost" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label={textos.paginaAnterior}>
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
              aria-label={textos.irParaPagina}
              onBlur={(e) => irParaPagina(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") irParaPagina((e.target as HTMLInputElement).value);
              }}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)" pr={1}>
              /{pages}
            </Text>
            <Button size="xs" tone="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label={textos.paginaProxima}>
              <ChevronRight size={14} />
            </Button>
          </>
        ) : null}
        {mostraExpandir ? (
          <Button
            size="xs"
            tone="ghost"
            onClick={() => setExpandido((v) => !v)}
            aria-label={expandido ? textos.recolher : textos.expandir}
            title={expandido ? textos.recolherDica : textos.expandir}
          >
            {expandido ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        ) : null}
      </HStack>
    </HStack>
  );

  const cartao = (
    <Box
      ref={medirContexto}
      className="admin-card"
      data-jj-table={expandido ? "expandido" : modoJanela ? "pagina" : undefined}
      data-jj-apertado={apertado ? "sim" : undefined}
      overflow={rolaDentro ? "hidden" : "clip"}
      p={0}
      display={expandido ? "flex" : undefined}
      flexDirection={expandido ? "column" : undefined}
      flex={expandido ? "1" : undefined}
      minH={expandido ? 0 : undefined}
    >
      {toolbarNode}
      <Box
        ref={medirArea}
        display={cards ? { base: "none", md: "block" } : "block"}
        overflowY={rolaDentro ? "auto" : undefined}
        overflowX={rolaDentro ? "auto" : undefined}
        flex={expandido ? "1" : undefined}
        maxH={magicOffset !== null ? `calc(100vh - ${magicOffset}px)` : (alturaMini ?? undefined)}
        minH={expandido ? 0 : magicOffset !== null ? "200px" : undefined}
        css={cssArea}
      >
        <Table.Root size={dense ? "sm" : "md"} width="full" css={CORES_LINHA}>
          <Table.Header
            position={stickyCabecalho !== undefined ? "sticky" : undefined}
            top={stickyCabecalho}
            zIndex={2}
            bg="var(--admin-surface)"
            boxShadow="0 1px 0 var(--admin-divider)"
          >
            <Table.Row>
              {selection ? (
                <Table.ColumnHeader width="40px" data-jj-fixa="">
                  <Checkbox.Root
                    size="sm"
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(e) => selection.onToggleAll(allKeys, e.checked === true)}
                    aria-label={textos.selecionarTodos}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
              ) : null}
              {onReorder ? <Table.ColumnHeader width="34px" data-jj-fixa="" /> : null}
              {columns.map((c) => {
                const ordenavel = !!c.value && c.sortable !== false;
                const filtravel = !!c.value && c.filterable !== false;
                const ordem = sortAtivo && sortAtivo.key === c.key ? sortAtivo.dir : null;
                const rotuloProps = c.headerWrap
                  ? {}
                  : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };
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
                    whiteSpace={c.headerWrap ? "normal" : "nowrap"}
                    overflow={c.headerWrap || ordenavel || filtravel ? undefined : "hidden"}
                    textOverflow={c.headerWrap || ordenavel || filtravel ? undefined : "ellipsis"}
                    aria-sort={ordem ? (ordem === "asc" ? "ascending" : "descending") : undefined}
                    {...hideProps(c)}
                    {...presoProps(c, true)}
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
                            title={fmtTexto(textos.ordenarPor, { coluna: rotuloColuna(c) })}
                          >
                            <Box as="span" {...rotuloProps}>
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
                          <Box as="span" {...rotuloProps} minW={0}>
                            {c.header}
                          </Box>
                        )}
                        {filtravel ? (
                          <FiltroColunaMenu
                            rotulo={rotuloColuna(c)}
                            ativo={ativoDe(c.key)}
                            facetas={facetasDe(c)}
                            onChange={(valores) => mudarFiltroColuna(c.key, valores)}
                            textos={textos}
                          />
                        ) : null}
                      </HStack>
                    ) : (
                      c.header
                    )}
                  </Table.ColumnHeader>
                );
              })}
              {celulaAcoes ? (
                <Table.ColumnHeader
                  data-jj-fixa=""
                  textAlign="end"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                  color="var(--admin-text-soft)"
                  whiteSpace="nowrap"
                  width={larguraAcoes}
                  minW={larguraAcoes}
                  position="sticky"
                  right={0}
                  zIndex={2}
                  bg="var(--admin-surface)"
                  boxShadow="inset 1px 0 0 var(--admin-divider)"
                >
                  {textos.acoes}
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
              const extras = rowProps?.(row, i) ?? {};
              const secao = secaoDaLinha?.(row);
              if (secao != null) {
                return (
                  <Table.Row key={rowKey} bg="var(--admin-surface-2)" {...extras}>
                    <Table.Cell
                      data-jj-fixa=""
                      colSpan={columns.length + (selection ? 1 : 0) + (onReorder ? 1 : 0) + (celulaAcoes ? 1 : 0)}
                      fontSize="xs"
                      fontWeight="600"
                      color="var(--admin-text-soft)"
                    >
                      {secao}
                    </Table.Cell>
                  </Table.Row>
                );
              }
              return (
              <Table.Row
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                cursor={onRowClick ? "pointer" : undefined}
                opacity={dragKey === rowKey ? 0.4 : undefined}
                boxShadow={isOver ? "inset 0 2px 0 var(--admin-primary)" : undefined}
                bg="var(--jj-linha)"
                transition="background-color 120ms ease"
                css={{
                  "--jj-linha": sel
                    ? "var(--jj-sel)"
                    : isOver
                      ? "var(--jj-arraste)"
                      : zebra[i]
                        ? "var(--jj-zebra)"
                        : "var(--admin-surface)",
                  "&:hover": { "--jj-linha": sel ? "var(--jj-sel-hover)" : "var(--jj-hover)" },
                }}
                {...(onReorder
                  ? {
                      onDragOver: (e: DragEvent) => { e.preventDefault(); setOverKey(rowKey); },
                      onDrop: () => handleDrop(rowKey),
                    }
                  : {})}
                {...extras}
              >
                {selection ? (
                  <Table.Cell width="40px" data-jj-fixa="" onClick={(e) => e.stopPropagation()}>
                    {rowCheckbox(rowKey)}
                  </Table.Cell>
                ) : null}
                {onReorder ? (
                  <Table.Cell
                    width="34px"
                    data-jj-fixa=""
                    onClick={(e) => e.stopPropagation()}
                    draggable
                    onDragStart={() => setDragKey(rowKey)}
                    onDragEnd={() => { setDragKey(null); setOverKey(null); }}
                    cursor="grab"
                    color="var(--admin-text-soft)"
                    title={textos.arrasteParaReordenar}
                  >
                    <GripVertical size={15} />
                  </Table.Cell>
                ) : null}
                {columns.map((c) => (
                  <Table.Cell
                    key={c.key}
                    textAlign={c.align}
                    whiteSpace={c.nowrap ? "nowrap" : undefined}
                    {...hideProps(c)}
                    {...presoProps(c, false)}
                  >
                    {cell(c, row)}
                  </Table.Cell>
                ))}
                {celulaAcoes ? (
                  <Table.Cell
                    data-jj-fixa=""
                    textAlign="end"
                    onClick={(e) => e.stopPropagation()}
                    position="sticky"
                    right={0}
                    zIndex={1}
                    width={larguraAcoes}
                    minW={larguraAcoes}
                    whiteSpace="nowrap"
                    bg="var(--jj-linha)"
                    boxShadow="inset 1px 0 0 var(--admin-divider)"
                  >
                    <HStack gap={1} justify="flex-end" flexWrap="nowrap" css={{ "& > *": { flexShrink: 0 } }}>
                      {celulaAcoes(row)}
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
      {cards ? (
      <Stack
        display={{ base: "flex", md: "none" }}
        gap={0}
        css={CORES_LINHA}
        // No expandido o desktop some, então é esta lista que vira a área rolável.
        flex={expandido ? "1" : undefined}
        minH={expandido ? 0 : undefined}
        overflowY={expandido ? "auto" : undefined}
      >
        {visible.map((row, i) => {
          const rowKey = getRowKey(row, i);
          const checked = selection?.selectedKeys.has(rowKey) ?? false;
          const hi = (selectedKey != null && rowKey === selectedKey) || checked;
          const extras = rowProps?.(row, i) ?? {};
          const secao = secaoDaLinha?.(row);
          if (secao != null) {
            return (
              <Box
                key={rowKey}
                px={4}
                pt={i ? 4 : 3}
                pb={1}
                fontSize="xs"
                fontWeight="600"
                color="var(--admin-text-soft)"
                {...extras}
              >
                {secao}
              </Box>
            );
          }
          return (
          <Box
            key={rowKey}
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="var(--admin-divider)"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            cursor={onRowClick ? "pointer" : undefined}
            bg={hi ? "var(--jj-sel)" : zebra[i] ? "var(--jj-zebra)" : undefined}
            _active={onRowClick ? { bg: "var(--admin-nav-hover)" } : undefined}
            {...extras}
          >
            {renderCard ? (
              renderCard(row)
            ) : (
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
              {columns.slice(1).filter((c) => !c.hideOnMobile && !c.hideBelow).map((c) => (
                <HStack key={c.key} gap={2} fontSize="sm" align="baseline">
                  <Text fontSize="xs" color="var(--admin-text-soft)" minW="90px" flexShrink={0}>
                    {c.header}
                  </Text>
                  <Box minW={0}>{cell(c, row)}</Box>
                </HStack>
              ))}
              {celulaAcoes ? (
                <HStack gap={1} pt={1} onClick={(e) => e.stopPropagation()}>
                  {celulaAcoes(row)}
                </HStack>
              ) : null}
            </Stack>
            )}
          </Box>
          );
        })}
      </Stack>
      ) : null}

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
        aria-label={titulo ? fmtTexto(textos.telaCheiaDe, { titulo }) : textos.tabelaTelaCheia}
      >
        <HStack justify="space-between" px={1} flexShrink={0}>
          <Text fontSize="sm" fontWeight="600" lineClamp={1}>
            {titulo ?? textos.tabela}{" "}
            <Text as="span" color="var(--admin-text-soft)" fontWeight="400">
              · {plural(linhasVisiveis.length, textos.umItem, textos.muitosItens)}
              {linhasVisiveis.length !== rows.length
                ? fmtTexto(textos.itensDeTotal, { total: rows.length })
                : ""}
            </Text>
          </Text>
          <Button size="xs" tone="ghost" onClick={() => setExpandido(false)}>
            <Minimize2 size={14} /> {textos.fechar}
          </Button>
        </HStack>
        {cartao}
      </Box>
    </Portal>
  );
}
