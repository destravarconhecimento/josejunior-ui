"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AiChatMsg = { role: "user" | "assistant"; content: string };

export type UseAiChat = ReturnType<typeof useAiChat>;

/**
 * Teto de corpo de UMA requisição na Vercel: 4,5 MB. Acima disso o pedido nem
 * chega na função — quem responde é a BORDA, com uma PÁGINA HTML de erro. Os 4 MB
 * daqui são esse teto com folga pro envelope do multipart.
 */
const TETO_CORPO = 4 * 1024 * 1024;
/** Lado máximo do anexo depois de reduzido. O anexo existe pra IA OLHAR. */
const LADO_MAX = 1600;
/** Abaixo disto não vale a pena reencodar: já cabe e já é pequeno. */
const PEQUENA = 900 * 1024;
/** O que o servidor de fato usa do histórico (`runAssistant` corta em 20 × 6000). */
const HISTORICO_TURNOS = 20;
const HISTORICO_CHARS = 6000;

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Lê a resposta SEM presumir que ela é JSON.
 *
 * `await res.json()` direto era um defeito de verdade, e é a origem do "erro de
 * JSON" que aparecia no chat: quando a função estoura o tempo (504) ou o corpo
 * passa do teto da plataforma (413), quem responde é a borda da Vercel com HTML.
 * O `JSON.parse` quebrava com "Unexpected token '<' … is not valid JSON" — um
 * erro de FORMATO escondendo o erro real, que era de TAMANHO ou de tempo.
 */
async function lerJson(res: Response): Promise<Record<string, unknown>> {
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
function erroDaResposta(res: Response, data: Record<string, unknown>, padrao: string): string {
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
async function reduzirImagem(file: File): Promise<File> {
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

/**
 * Núcleo do chat com o assistente — estado, envio, anexo e persistência.
 *
 * Mora aqui porque tem DOIS donos: o FAB flutuante (`AiAssistantFab`) e o
 * console de tela cheia (`AiAssistantConsole`). Duplicar isso faria as duas
 * telas divergirem calado (uma ganha anexo, a outra não; uma manda histórico,
 * a outra não) — e a conversa não passaria de uma pra outra ao expandir.
 *
 * `storageKey`: guarda a conversa no sessionStorage. É o que faz o "expandir"
 * continuar a MESMA conversa em vez de começar do zero, e o que segura o
 * histórico ao navegar entre telas do painel (o servidor é stateless).
 */
export function useAiChat({
  chatEndpoint,
  uploadEndpoint,
  uploadFolder = "ops-chat/anexos",
  sendHistory = false,
  storageKey,
  path,
  detail,
}: {
  chatEndpoint: string;
  uploadEndpoint?: string;
  uploadFolder?: string;
  sendHistory?: boolean;
  storageKey?: string;
  path?: string;
  /**
   * O que a TELA está mostrando agora (caixa aberta, e-mail selecionado, filtro).
   * Vai junto do `path` e o servidor cola na ÚLTIMA mensagem do usuário — nunca
   * num `system` novo, senão o prompt cache do Gateway quebra a cada frase.
   */
  detail?: string;
}) {
  const [messages, setMessages] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [restored, setRestored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restaura a conversa salva ANTES de qualquer gravação, senão o primeiro
  // render (messages=[]) apagaria o que estava guardado.
  useEffect(() => {
    if (!storageKey) {
      setRestored(true);
      return;
    }
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as AiChatMsg[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {}
    setRestored(true);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !restored) return;
    try {
      // Teto: conversa longa não pode estourar a cota do sessionStorage.
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages, storageKey, restored]);

  const scrollToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const pickImage = useCallback(
    async (file: File) => {
      if (!uploadEndpoint) return;
      if (!file.type.startsWith("image/")) {
        setError("Anexe apenas imagens.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        // Reduzir ANTES de mandar: o que não cabe no corpo da requisição nunca
        // chega na função, e o erro que voltava era de JSON, não de tamanho.
        const enviar = await reduzirImagem(file);
        if (enviar.size > TETO_CORPO) {
          throw new Error(
            `A imagem tem ${mb(enviar.size)} e o teto por envio é ${mb(TETO_CORPO)}. ` +
              "Mande um print ou uma versão menor.",
          );
        }
        const fd = new FormData();
        fd.append("file", enviar);
        fd.append("folder", uploadFolder);
        const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
        const data = await lerJson(res);
        const url = typeof data.url === "string" ? data.url : "";
        if (!res.ok || !url) throw new Error(erroDaResposta(res, data, "Falha no upload."));
        setAttachment(url);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [uploadEndpoint, uploadFolder],
  );

  const canSend = input.trim().length >= 2 || !!attachment;

  const send = useCallback(
    async (override?: string) => {
      const typed = (override ?? input).trim();
      if ((typed.length < 2 && !attachment) || loading) return;
      setError(null);
      const text = attachment ? `${typed}${typed ? "\n\n" : ""}![imagem anexada](${attachment})` : typed;
      const historico = messages;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      setAttachment(null);
      setLoading(true);
      try {
        const res = await fetch(chatEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text,
            context: { path, ...(detail ? { detail } : {}) },
            // Só o que o servidor de fato usa. Mandar a conversa inteira fazia o
            // corpo crescer sem teto a cada turno até a borda recusar por
            // tamanho — e a recusa vinha em HTML, virando "erro de JSON".
            ...(sendHistory
              ? {
                  history: historico
                    .slice(-HISTORICO_TURNOS)
                    .map((m) => ({ role: m.role, content: m.content.slice(0, HISTORICO_CHARS) })),
                }
              : {}),
          }),
        });
        const data = await lerJson(res);
        const reply = typeof data.reply === "string" ? data.reply : "";
        if (!res.ok || data.ok === false) throw new Error(erroDaResposta(res, data, "Falha ao processar."));
        if (Array.isArray(data.messages)) {
          setMessages((data.messages as AiChatMsg[]).map((m) => ({ role: m.role, content: m.content })));
        } else if (reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [input, attachment, loading, messages, chatEndpoint, sendHistory, path, detail],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setAttachment(null);
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
    }
  }, [storageKey]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    error,
    setError,
    attachment,
    setAttachment,
    uploading,
    pickImage,
    send,
    clear,
    canSend,
    scrollRef,
    scrollToEnd,
    restored,
  };
}
