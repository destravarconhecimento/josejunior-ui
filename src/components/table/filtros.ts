// Filtro por coluna da DataTable (estilo Excel) — helpers PUROS.
//
// Um filtro é `{ key, valores }`: a coluna e o CONJUNTO de chaves marcadas.
// Entre colunas é E; dentro da coluna é OU. O valor vira "chave" por
// `chaveDoValor` (Date vira o DIA local — filtrar por data é filtrar por dia,
// nunca por milissegundo).

import { compararValores, type ValorCelula } from "./sort";

export type FiltroColuna = {
  key: string;
  /** Chaves marcadas (formato de `chaveDoValor`). Lista vazia = filtro inativo. */
  valores: string[];
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Valor → chave de faceta. Date vira o dia LOCAL `aaaa-mm-dd`; vazio vira `""`. */
export function chaveDoValor(v: ValorCelula): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    return `${v.getFullYear()}-${pad2(v.getMonth() + 1)}-${pad2(v.getDate())}`;
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

/** Chave → rótulo humano (menu do funil e chips). `exemplo` refina data/booleano. */
export function rotuloDoValor(chave: string, exemplo?: ValorCelula): string {
  if (chave === "") return "(Vazio)";
  if (exemplo instanceof Date || /^\d{4}-\d{2}-\d{2}$/.test(chave)) {
    const [y, m, d] = chave.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  }
  if (typeof exemplo === "boolean" || chave === "true" || chave === "false") {
    return chave === "true" ? "Sim" : "Não";
  }
  return chave;
}

/**
 * Aplica os filtros ativos (E entre colunas, OU dentro). `exceto` pula UMA
 * coluna — é o cálculo Excel das facetas: o menu da coluna X lista os valores
 * das linhas filtradas por TODAS as outras, não por X. Sem filtro ativo (ou
 * sem nada cortado) devolve a MESMA referência de `rows`.
 */
export function aplicarFiltros<T>(
  rows: T[],
  filtros: FiltroColuna[],
  valueDe: (key: string) => ((row: T) => ValorCelula) | undefined,
  exceto?: string,
): T[] {
  const ativos: Array<{ value: (row: T) => ValorCelula; set: Set<string> }> = [];
  for (const f of filtros) {
    if (f.key === exceto || f.valores.length === 0) continue;
    const value = valueDe(f.key);
    if (value) ativos.push({ value, set: new Set(f.valores) });
  }
  if (ativos.length === 0) return rows;
  const out = rows.filter((r) => ativos.every((f) => f.set.has(chaveDoValor(f.value(r)))));
  return out.length === rows.length ? rows : out;
}

export type ValorFaceta = { chave: string; rotulo: string; n: number };

/**
 * Valores distintos da coluna com CONTAGEM (as facetas do menu). Chame LAZY
 * (só ao abrir o menu) — varre as linhas inteiras. Ordena pelo collator do
 * sort; "(Vazio)" vai pro fim.
 */
export function valoresDistintos<T>(rows: T[], value: (row: T) => ValorCelula): ValorFaceta[] {
  const m = new Map<string, ValorFaceta>();
  for (const r of rows) {
    const v = value(r);
    const chave = chaveDoValor(v);
    const e = m.get(chave);
    if (e) e.n++;
    else m.set(chave, { chave, rotulo: rotuloDoValor(chave, v), n: 1 });
  }
  return [...m.values()].sort((a, b) => {
    if (a.chave === "") return 1;
    if (b.chave === "") return -1;
    return compararValores(a.rotulo, b.rotulo);
  });
}
