"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TETO_CORPO, erroDaResposta, lerJson, mb, reduzirImagem } from "./envio";

export type AiChatMsg = { role: "user" | "assistant"; content: string };

export type UseAiChat = ReturnType<typeof useAiChat>;

/** O que o servidor de fato usa do histórico (`runAssistant` corta em 20 × 6000). */
const HISTORICO_TURNOS = 20;
const HISTORICO_CHARS = 6000;

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
