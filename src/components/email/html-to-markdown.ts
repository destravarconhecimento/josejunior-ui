/**
 * HTML → MARKDOWN, o caminho de volta do `markdownToEmailHtml`.
 *
 * O corpo do compositor é markdown. Mas HTML chega nele de dois jeitos:
 * o rascunho da IA (que às vezes responde com tags) e o Ctrl+V de qualquer
 * lugar (o navegador oferece `text/html` no clipboard). Sem converter, as tags
 * apareceriam CRUAS na caixa de texto e o envio ainda as escaparia — o
 * destinatário receberia "<p>Oi!</p>" escrito com todas as letras.
 *
 * Sem dependência e sem DOM (roda no SSR igual): é regex por cima do fonte.
 * Não é um parser de HTML completo — é o suficiente pro que se cola num e-mail.
 */

const BLOCK_TAGS = "p|div|br|strong|b|em|i|ul|ol|li|h[1-6]|a|blockquote|table|tr|td|span|hr|pre|code";
const HTML_HINT = new RegExp(`<\\s*/?\\s*(${BLOCK_TAGS})\\b[^>]*>`, "i");

/** Vale a pena converter? (texto comum com um "<" solto não conta.) */
export function looksLikeHtml(src: string | null | undefined): boolean {
  const t = (src ?? "").trim();
  return Boolean(t) && HTML_HINT.test(t);
}

/**
 * Nomes das entidades Latin-1 na ORDEM oficial do HTML (código 160 a 255) —
 * é daqui que sai a acentuação (`&ccedil;`, `&atilde;`, `&eacute;`…), que é o
 * que mais aparece em e-mail colado em português. Sem isso, "Abra&ccedil;o"
 * sobreviveria à conversão e o envio escaparia o `&`: o destinatário leria
 * "Abra&ccedil;o" com todas as letras.
 */
const LATIN1 =
  "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr " +
  "deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest " +
  "Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml " +
  "Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash " +
  "Ugrave Uacute Ucirc Uuml Yacute THORN szlig " +
  "agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml " +
  "igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash " +
  "ugrave uacute ucirc uuml yacute thorn yuml";

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  hellip: "…", mdash: "—", ndash: "–", ldquo: "“", rdquo: "”",
  lsquo: "‘", rsquo: "’", bull: "•", euro: "€", trade: "™",
};
LATIN1.split(" ").forEach((name, i) => {
  ENTITIES[name] = String.fromCharCode(160 + i);
});
ENTITIES.nbsp = " "; // espaço COMUM: NBSP na caixa de texto é lixo invisível
ENTITIES.shy = ""; // hífen condicional não tem o que fazer em texto puro

/** Nome é case-sensitive (`&Ccedil;` ≠ `&ccedil;`); desconhecido fica como veio. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z][a-z0-9]{1,9});/gi, (m, name) => ENTITIES[String(name)] ?? m);
}

/** Tira as tags que sobraram e devolve o texto já decodificado. */
function plain(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

export function htmlToMarkdown(src: string | null | undefined): string {
  let t = (src ?? "").replace(/\r\n?/g, "\n");
  if (!t.trim()) return "";

  // Comentário, <head>, <script> e <style> não têm nada a dizer num e-mail.
  t = t.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  t = t.replace(/<!doctype[^>]*>/gi, "");

  // Em HTML quem separa parágrafo é a TAG, não a quebra do fonte: as quebras
  // originais são só formatação e viram espaço (senão todo <p> quebrado em
  // várias linhas no fonte viraria vários parágrafos).
  t = t.replace(/[ \t]*\n[ \t]*/g, " ");

  // ── inline (antes dos blocos: não cria tag nova, então não atrapalha) ──
  t = t.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, c) => {
    const inner = plain(c);
    return inner ? `**${inner}**` : "";
  });
  t = t.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, c) => {
    const inner = plain(c);
    return inner ? `*${inner}*` : "";
  });
  t = t.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, c) => {
    const inner = plain(c);
    return inner ? `\`${inner}\`` : "";
  });
  t = t.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, c) => {
    const text = plain(c);
    const url = decodeEntities(String(href)).trim();
    if (!text) return "";
    // Só http(s) vira link markdown — mailto/tel/âncora ficam como texto, senão
    // o conversor de ida imprimiria "[x](mailto:x)" com colchetes e tudo.
    if (!/^https?:\/\//i.test(url)) return text;
    return text === url ? url : `[${text}](${url})`;
  });

  // ── blocos ──
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  t = t.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, lvl, c) => {
    const inner = plain(c);
    if (!inner) return "";
    return `\n\n${"#".repeat(Math.min(3, Number(lvl)))} ${inner}\n\n`;
  });

  t = t.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, c) => {
    const inner = plain(c.replace(/<\/(p|div)>/gi, "\n"));
    if (!inner) return "";
    return `\n\n${inner.split("\n").map((l: string) => `> ${l.trim()}`).join("\n")}\n\n`;
  });

  // Numerada ANTES da não-ordenada (as duas usam <li>).
  t = t.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    let n = 0;
    const items = String(inner).replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_x, c) => {
      const line = plain(c);
      return line ? `\n${++n}. ${line}` : "";
    });
    return `\n\n${plainLines(items)}\n\n`;
  });
  t = t.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = String(inner).replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_x, c) => {
      const line = plain(c);
      return line ? `\n- ${line}` : "";
    });
    return `\n\n${plainLines(items)}\n\n`;
  });
  // <li> solto (lista sem <ul>/<ol> em volta) ainda vira item.
  t = t.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, c) => {
    const line = plain(c);
    return line ? `\n- ${line}` : "";
  });

  // Fim de parágrafo/linha de tabela = linha em branco.
  t = t.replace(/<\/(p|div|tr|table|section|article)>/gi, "\n\n");
  t = t.replace(/<\/td>/gi, " ");

  // Sobrou tag? some. Só então decodifica (senão &lt;b&gt; viraria tag de novo).
  t = decodeEntities(t.replace(/<[^>]*>/g, ""));

  // Espaço no começo da linha é sobra das tags que viraram quebra (e 4 espaços
  // em markdown viram bloco de código) — cada linha sai limpa dos dois lados.
  return t
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Tira as tags/entidades que sobraram dentro de uma lista já montada. */
function plainLines(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ""))
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
    .join("\n");
}
