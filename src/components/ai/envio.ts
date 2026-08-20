/**
 * Envio de arquivo e leitura de resposta — o que o chat e o compositor de Redes
 * Sociais fazem IGUAL.
 *
 * Mora fora do `useAiChat` porque tem dois donos: o anexo do FAB e o upload de
 * mídia do compositor batem na MESMA rota (`/api/admin/blob`) e no mesmo teto de
 * corpo da plataforma. Enquanto cada tela tinha a sua cópia, uma aprendia a
 * recusar direito e a outra continuava mostrando "Unexpected token '<'".
 */

/**
 * Teto de corpo de UMA requisição na Vercel: 4,5 MB. Acima disso o pedido nem
 * chega na função — quem responde é a BORDA, com uma PÁGINA HTML de erro. Os 4 MB
 * daqui são esse teto com folga pro envelope do multipart.
 */
export const TETO_CORPO = 4 * 1024 * 1024;
/** Lado máximo do anexo depois de reduzido. O anexo existe pra IA OLHAR. */
const LADO_MAX = 1600;
/** Abaixo disto não vale a pena reencodar: já cabe e já é pequeno. */
const PEQUENA = 900 * 1024;

export const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Lê a resposta SEM presumir que ela é JSON.
 *
 * `await res.json()` direto era um defeito de verdade, e é a origem do "erro de
 * JSON" que aparecia no chat: quando a função estoura o tempo (504) ou o corpo
 * passa do teto da plataforma (413), quem responde é a borda da Vercel com HTML.
 * O `JSON.parse` quebrava com "Unexpected token '<' … is not valid JSON" — um
 * erro de FORMATO escondendo o erro real, que era de TAMANHO ou de tempo.
 */
export async function lerJson(res: Response): Promise<Record<string, unknown>> {
  const cru = await res.text();
  try {
    const d: unknown = JSON.parse(cru);
    if (d && typeof d === "object") return d as Record<string, unknown>;
  } catch {}
  return { __cru: cru };
}

/** Frase honesta pro que a borda devolve sem JSON — vinda do código HTTP. */
function recadoHttp(status: number, cru: string): string {
  if (status === 413) return `O anexo passou do teto de ${mb(TETO_CORPO)} por envio.`;
  if (status === 504 || status === 408)
    return "A IA passou do tempo limite antes de responder. Peça em partes menores.";
  if (status === 401 || status === 403) return "Sua sessão expirou. Recarregue a página e entre de novo.";
  if (status === 429) return "Pedidos demais seguidos. Espere alguns segundos e tente de novo.";
  if (status >= 500) return `O servidor falhou (${status}). Tente de novo em instantes.`;
  const enxuto = cru.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return enxuto
    ? `Resposta inesperada do servidor (${status}): ${enxuto.slice(0, 160)}`
    : `Resposta inesperada do servidor (${status}).`;
}

/** O texto do erro: o que o servidor explicou; se não explicou, o HTTP explica. */
export function erroDaResposta(res: Response, data: Record<string, unknown>, padrao: string): string {
  const dito = [data.error, data.reason, data.reply].find((v) => typeof v === "string" && v.trim());
  if (typeof dito === "string") return dito;
  if (typeof data.__cru === "string") return recadoHttp(res.status, data.__cru);
  return res.ok ? padrao : recadoHttp(res.status, "");
}

/**
 * Reduz a imagem NO NAVEGADOR antes de subir.
 *
 * Foto de celular sai com 5–12 MB e 4000 px de lado; nada disso chega na função,
 * porque o teto de corpo da plataforma é menor que o arquivo. E não faz falta: o
 * anexo do chat existe pra IA olhar. Reduzir aqui é o conserto de raiz do
 * "arquivo grande demais" — em vez de recusar, faz caber.
 *
 * GIF sai inteiro de propósito (o canvas mataria a animação) e cai no teto.
 */
export async function reduzirImagem(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size <= PEQUENA) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * escala));
    const h = Math.max(1, Math.round(bmp.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Fundo branco antes de desenhar: PNG com transparência vira JPEG, e sem
    // isto o transparente sairia PRETO — print de tela ilegível pra IA.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") || "imagem";
    return new File([blob], `${nome}.jpg`, { type: "image/jpeg" });
  } catch {
    // Formato que o navegador não decodifica: sobe como veio e o teto decide.
    return file;
  }
}
