import { classifyLead } from "./components/LeadKind";

/**
 * ATENDIMENTO — as regras puras de "quem procurou você", num módulo NEUTRO
 * (sem JSX, sem `"use client"`) porque quem monta as linhas é o SERVIDOR dos
 * dois painéis: `apps/sistema` (Drizzle) e `apps/representantes` (pool raw).
 *
 * Existe uma terceira cópia dessa mesma regra, e é de propósito: o
 * `inboundWhere()` de `apps/sistema/src/server/repos/captacao.ts` a escreve em
 * SQL, porque num painel com milhares de leads o recorte tem que caber no
 * WHERE. As três (SQL · `classifyLead` · o `procurouVoce` daqui) dizem a mesma
 * coisa e mudam juntas — está anotado nas três.
 *
 * Duas portas dão no Atendimento, e só duas:
 *  • o **formulário do site** (contato e cotação);
 *  • o **orçamento preenchido na PROPOSTA** (`/proposta/<código>`), que é o
 *    mesmo formulário, na peça daquela empresa.
 * O que separa uma da outra é o par `source`/`origin`, e nada mais.
 */

/** Por onde a pessoa chegou. */
export type AtendimentoCanal = "site" | "proposta" | "landing" | "outro";

/** Base pública das propostas — a peça mora sempre no domínio da plataforma. */
export const PROPOSTA_BASE_URL = "https://josejunior.dev/proposta";

/** O prefixo que o `origin` carrega quando o formulário foi o da proposta. */
export const ORIGEM_PROPOSTA = "proposta:";

/**
 * Um contato carimbado nas notas do lead.
 *
 * O `registerInboundLead` deduplica por e-mail/telefone: quem já estava na base
 * e depois preenche um formulário NÃO cria linha nova — vira uma linha
 * `[AAAA-MM-DD HH:MM] source · origin — assunto — mensagem` em `notes`. Sem ler
 * esse carimbo, o sinal mais quente que existe (o lead frio levantando a mão)
 * aparece como um lead frio qualquer.
 */
export type ContatoCarimbado = {
  /** "AAAA-MM-DD HH:MM", como foi carimbado. */
  quando: string;
  source: string;
  origin: string;
  assunto: string;
  texto: string;
};

const RE_CARIMBO = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]\s*(.*)$/;

/**
 * Os contatos carimbados nas notas, na ordem em que foram escritos.
 *
 * Varre LINHA A LINHA em vez de quebrar por carimbo: a mensagem do formulário
 * pode ter quebras de linha (o `notes` junta tudo com `\n`), e uma continuação
 * pertence ao último carimbo aberto.
 */
export function carimbosDeContato(notes: string | null | undefined): ContatoCarimbado[] {
  if (!notes) return [];
  const out: ContatoCarimbado[] = [];
  for (const linha of String(notes).split("\n")) {
    const m = RE_CARIMBO.exec(linha);
    if (!m) {
      // Continuação da mensagem anterior (ou nota solta antes de qualquer carimbo).
      const ultimo = out[out.length - 1];
      if (ultimo) ultimo.texto = [ultimo.texto, linha].filter(Boolean).join("\n");
      continue;
    }
    // `source · origin — assunto — mensagem` (assunto e mensagem podem faltar; a
    // mensagem pode conter " — ", então só os DOIS primeiros cortes são fixos).
    const partes = m[2].split(" — ");
    const [source = "", origin = ""] = partes[0].split(" · ").map((s) => s.trim());
    out.push({
      quando: m[1],
      source,
      origin,
      assunto: (partes[1] ?? "").trim(),
      texto: partes.slice(2).join(" — ").trim(),
    });
  }
  return out;
}

/** O contato mais recente carimbado nas notas (null = nenhum). */
export function ultimoContato(notes: string | null | undefined): ContatoCarimbado | null {
  const todos = carimbosDeContato(notes);
  return todos.length ? todos[todos.length - 1] : null;
}

/**
 * As fontes que só um FORMULÁRIO escreve — a mesma lista do `inboundWhere()`
 * em SQL (`apps/sistema/src/server/repos/captacao.ts`). Mudou aqui, mudou lá.
 */
const RE_FONTE_FORMULARIO = /^(site_|rep:|venda:|proposta)/i;

/**
 * O último carimbo que veio de FORMULÁRIO (null = nenhum).
 *
 * É ele que a tela lê no lead que já estava na base: o `registerInboundLead`
 * deduplica sem reescrever `subject`/`message` da linha, então num lead
 * reaberto o pedido NOVO só existe no carimbo. Ignora nota de outra natureza
 * (contato registrado à mão, abertura de proposta) — senão a coluna "o que
 * escreveu" mostraria a última anotação do painel, não o que a pessoa mandou.
 */
export function ultimoContatoDeFormulario(notes: string | null | undefined): ContatoCarimbado | null {
  const todos = carimbosDeContato(notes).filter((c) => RE_FONTE_FORMULARIO.test(c.source));
  return todos.length ? todos[todos.length - 1] : null;
}

/**
 * "Esta pessoa procurou VOCÊ?" — o mesmo recorte do `inboundWhere()` em SQL.
 *
 * Duas maneiras de entrar: a linha nasceu de um formulário (o que o
 * `classifyLead` chama de contato/orçamento) **ou** ela é fria mas tem um
 * carimbo de formulário nas notas.
 */
export function procurouVoce(lead: {
  source?: string | null;
  origin?: string | null;
  notes?: string | null;
}): boolean {
  const tipo = classifyLead(lead);
  if (tipo === "contato" || tipo === "orcamento") return true;
  return carimbosDeContato(lead.notes).some((c) => RE_FONTE_FORMULARIO.test(c.source));
}

/** O código da proposta quando o contato veio dela ("" = não veio). */
export function tokenDaProposta(origin: string | null | undefined): string {
  const v = (origin || "").trim();
  return v.toLowerCase().startsWith(ORIGEM_PROPOSTA) ? v.slice(ORIGEM_PROPOSTA.length) : "";
}

/** Por onde ele chegou, pelo par (source, origin). */
export function canalDoContato(lead: { source?: string | null; origin?: string | null }): AtendimentoCanal {
  const source = (lead.source || "").toLowerCase();
  const origin = (lead.origin || "").toLowerCase();
  if (source === "proposta" || origin.startsWith(ORIGEM_PROPOSTA)) return "proposta";
  // Landing de segmento / de anúncio: o link de venda carimba `venda:<segmento>`.
  if (source.startsWith("venda:") || origin.startsWith("venda:") || origin.startsWith("lp:")) return "landing";
  if (source.startsWith("site_") || source.startsWith("rep:")) return "site";
  return "outro";
}

/**
 * O que a tela escreve no "veio de" e para onde ela leva.
 *
 * `nomeDaProposta` resolve o código no nome da empresa quando quem chama tem
 * essa lista em mãos (o painel do José tem; vale para não mostrar um código
 * cru a quem opera).
 */
export function origemDoContato(
  lead: { source?: string | null; origin?: string | null },
  nomeDaProposta?: (token: string) => string | undefined,
): { origem: string; origemUrl: string | null } {
  const token = tokenDaProposta(lead.origin);
  if (token) {
    const nome = nomeDaProposta?.(token);
    return {
      origem: nome ? `Proposta · ${nome}` : "Proposta enviada",
      origemUrl: `${PROPOSTA_BASE_URL}/${token}`,
    };
  }
  const origin = (lead.origin || "").trim();
  const source = (lead.source || "").trim();
  if (origin) return { origem: origin, origemUrl: null };
  if (source.startsWith("rep:")) return { origem: "Página do representante", origemUrl: null };
  return { origem: source || "—", origemUrl: null };
}
