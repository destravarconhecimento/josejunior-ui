"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Screen } from "./Screen";
import { Button } from "./Button";
import { KpiRow, type KpiRowItem } from "./KpiCard";
import { Tabs, type TabDef } from "./Tabs";
import { DataTable, type Column, type Selection } from "./DataTable";
import { FilterBar, type SelectFilter } from "./FilterBar";
import type { FiltroColuna } from "./table/filtros";
import type { SortState } from "./table/sort";
import { rowMatchesQuery } from "../search";

export type AcaoNova = {
  rotulo: string;
  onClick?: () => void;
  href?: string;
  icone?: ReactNode;
};

export function TelaDeLista<T>({
  titulo,
  subtitulo,
  contador,
  tituloDepois,
  acoes,
  acaoNova,
  abas,
  aba,
  onAba,
  kpis,
  kpisAcoes,
  blocos,
  buscar,
  buscaPlaceholder,
  filtrosSelect,
  filtrosDaTela,
  filtrosDaTelaAtivos,
  overlays,
  maxW,
  ...tabela
}: {
  titulo: string;
  subtitulo?: ReactNode;
  /** Contador colado no título. Omitido, usa o total de linhas visíveis. */
  contador?: number | string;
  tituloDepois?: ReactNode;
  acoes?: ReactNode;
  /** Botão de criar item, sempre no cabeçalho. */
  acaoNova?: AcaoNova;
  abas?: TabDef[];
  aba?: string;
  onAba?: (value: string) => void;
  kpis?: Array<KpiRowItem | null | undefined | false>;
  kpisAcoes?: ReactNode;
  blocos?: ReactNode;
  /** Liga a busca: `true` varre a linha inteira, lista de campos restringe,
   *  função devolve o texto pesquisável. */
  buscar?: true | Array<keyof T & string> | ((row: T) => string);
  buscaPlaceholder?: string;
  /** Selects na mesma barra da busca. A 1ª opção de cada um é o "todos". */
  filtrosSelect?: SelectFilter[];
  /** Filtros que não são de coluna — desenhados pela tabela, junto da busca. */
  filtrosDaTela?: ReactNode;
  filtrosDaTelaAtivos?: number;
  /** Modais, gavetas e confirmações da tela — vão depois da tabela. */
  overlays?: ReactNode;
  maxW?: string;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  actions?: (row: T) => ReactNode;
  actionsWidth?: string;
  acoesDaLinha?: React.ComponentProps<typeof DataTable<T>>["acoesDaLinha"];
  pageSize?: number;
  paginate?: boolean;
  dense?: boolean;
  selection?: Selection;
  onReorder?: (orderedKeys: Array<string | number>) => void;
  cards?: boolean;
  renderCard?: (row: T) => ReactNode;
  rowProps?: (row: T, index: number) => Record<string, unknown> | undefined;
  secaoDaLinha?: (row: T) => ReactNode;
  carregando?: boolean;
  expansivel?: boolean;
  defaultSort?: SortState | null;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  defaultFiltros?: FiltroColuna[];
  filtros?: FiltroColuna[];
  onFiltrosChange?: (filtros: FiltroColuna[]) => void;
  chipsExtras?: ReactNode;
}) {
  const [abaInterna, setAbaInterna] = useState(abas?.[0]?.value ?? "");
  const [termo, setTermo] = useState("");

  const abaAtual = aba ?? abaInterna;
  const trocarAba = onAba ?? setAbaInterna;

  const casa = useMemo(() => {
    if (!buscar) return null;
    if (buscar === true) return (row: T, q: string) => rowMatchesQuery(row, q);
    if (typeof buscar === "function") return (row: T, q: string) => rowMatchesQuery(buscar(row), q);
    const campos = buscar as string[];
    return (row: T, q: string) => rowMatchesQuery(row, q, campos);
  }, [buscar]);

  const linhas = useMemo(() => {
    if (!casa || termo.trim() === "") return tabela.rows;
    return tabela.rows.filter((r) => casa(r, termo));
  }, [casa, termo, tabela.rows]);

  const botaoNovo = acaoNova ? (
    acaoNova.href ? (
      <Button asChild tone="primary" size="sm">
        <a href={acaoNova.href}>
          {acaoNova.icone ?? <Plus size={16} />}
          {acaoNova.rotulo}
        </a>
      </Button>
    ) : (
      <Button tone="primary" size="sm" onClick={acaoNova.onClick}>
        {acaoNova.icone ?? <Plus size={16} />}
        {acaoNova.rotulo}
      </Button>
    )
  ) : null;

  return (
    <Screen
      title={titulo}
      subtitle={subtitulo}
      count={contador ?? linhas.length}
      titleAfter={tituloDepois}
      maxW={maxW}
      actions={
        acoes || botaoNovo ? (
          <>
            {acoes}
            {botaoNovo}
          </>
        ) : undefined
      }
      tabs={
        abas && abas.length > 0 ? (
          <Tabs value={abaAtual} onChange={trocarAba} items={abas} />
        ) : undefined
      }
      kpis={kpis && kpis.length > 0 ? <KpiRow items={kpis} acoes={kpisAcoes} /> : undefined}
      blocos={blocos}
    >
      <DataTable
        {...tabela}
        rows={linhas}
        titulo={titulo}
        busca={
          casa || (filtrosSelect && filtrosSelect.length > 0) ? (
            <FilterBar
              attached
              search={termo}
              onSearch={setTermo}
              selects={filtrosSelect}
              placeholder={buscaPlaceholder ?? `Buscar em ${titulo.toLowerCase()}…`}
            />
          ) : undefined
        }
        filtrosDaTela={filtrosDaTela}
        filtrosDaTelaAtivos={filtrosDaTelaAtivos}
      />
      {overlays}
    </Screen>
  );
}
