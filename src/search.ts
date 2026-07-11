// Busca genérica "por qualquer campo" das telas de listagem.
//
// As tabelas do painel recebem `rows: T[]` (dados crus, não JSX) e cada tela
// filtra na mão escolhendo campos a dedo — o que deixava a busca cega para
// campos importantes (ex.: o ID do host em `fields.idExterno` na tela de
// agência). Este helper varre RECURSIVAMENTE todos os valores textuais/numéricos
// da linha e casa contra o termo, ignorando caixa e acentos, para que a busca
// ache QUALQUER registro visível — não só o nome.

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Achata todos os valores textuais/numéricos de um valor/objeto em `out`. */
function collectText(value: unknown, out: string[], depth: number): void {
  if (value == null) return;
  const t = typeof value;
  if (t === "string") {
    out.push(value as string);
    return;
  }
  if (t === "number" || t === "bigint") {
    out.push(String(value));
    return;
  }
  if (t === "boolean" || t === "function" || t === "symbol") return;
  if (depth > 6) return; // guarda contra estruturas muito profundas / cíclicas
  if (value instanceof Date) {
    out.push(value.toISOString());
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectText(v, out, depth + 1);
    return;
  }
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    // Ignora "não-dados" (ex.: React elements que possam vazar pra dentro da linha).
    if ((obj as { $$typeof?: unknown }).$$typeof) return;
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) collectText(obj[k], out, depth + 1);
    }
  }
}

/**
 * `true` se TODOS os termos digitados aparecem em ALGUM campo textual/numérico
 * da linha (varredura recursiva, ignora caixa e acentos). Termo vazio → `true`.
 *
 * Multi-palavra é AND por token ("joão poppo" casa nome + plataforma em campos
 * diferentes). Passe `keys` para restringir a busca a um subconjunto de campos
 * do topo do objeto (senão varre a linha inteira).
 */
export function rowMatchesQuery(row: unknown, query: string, keys?: string[]): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const parts: string[] = [];
  if (keys && keys.length && row && typeof row === "object") {
    const obj = row as Record<string, unknown>;
    for (const k of keys) collectText(obj[k], parts, 0);
  } else {
    collectText(row, parts, 0);
  }
  const hay = norm(parts.join(" "));
  return q.split(/\s+/).every((tok) => hay.includes(tok));
}
