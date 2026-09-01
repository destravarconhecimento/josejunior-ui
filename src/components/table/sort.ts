// Ordenação da DataTable — helpers PUROS (sem React, sem DOM).
//
// O acessor `value` da coluna devolve um `ValorCelula` (dado cru, nunca JSX) e
// é ele que liga a coluna ao motor de ordenar/filtrar. Coluna sem `value`
// continua exatamente como sempre foi: nem ordena, nem filtra.

export type ValorCelula = string | number | boolean | Date | null | undefined;

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir };

// Singleton: criar Collator é caro; um só serve a todas as tabelas da página.
// `sensitivity: base` = ignora caixa e acento; `numeric` = "2" antes de "10".
const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/** Ciclo do clique no cabeçalho: sem → asc → desc → sem (volta à ordem da tela). */
export function proximoSort(atual: SortState | null, key: string): SortState | null {
  if (!atual || atual.key !== key) return { key, dir: "asc" };
  if (atual.dir === "asc") return { key, dir: "desc" };
  return null;
}

const vazio = (v: ValorCelula) => v == null || v === "";

/** Compara dois valores NÃO vazios (vazio é tratado fora: sempre no fim). */
export function compararValores(a: ValorCelula, b: ValorCelula): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return (a ? 1 : 0) - (b ? 1 : 0);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(String(a), String(b));
}

/**
 * Ordena as linhas pelo acessor da coluna. Regras:
 *  - ESTÁVEL (empate mantém a ordem em que as linhas chegaram);
 *  - vazio (null/undefined/"") vai SEMPRE pro fim, em asc E em desc — quem
 *    ordena por "próximo passo" quer ver quem TEM passo primeiro;
 *  - se a ordem final é a mesma da entrada, devolve a MESMA referência de
 *    `rows` (prova de não-regressão: sem sort ativo nada muda de identidade).
 */
export function ordenarLinhas<T>(rows: T[], value: (row: T) => ValorCelula, dir: SortDir): T[] {
  if (rows.length < 2) return rows;
  const dec = rows.map((r, i) => ({ r, i, v: value(r) }));
  dec.sort((x, y) => {
    const ex = vazio(x.v);
    const ey = vazio(y.v);
    if (ex || ey) return ex && ey ? x.i - y.i : ex ? 1 : -1;
    const c = compararValores(x.v, y.v);
    const s = dir === "desc" ? -c : c;
    return s !== 0 ? s : x.i - y.i;
  });
  let mudou = false;
  for (let i = 0; i < dec.length; i++) {
    if (dec[i].i !== i) {
      mudou = true;
      break;
    }
  }
  return mudou ? dec.map((d) => d.r) : rows;
}
