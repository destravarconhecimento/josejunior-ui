"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, HStack, Image, Spinner, Stack, Text, Textarea, chakra } from "@chakra-ui/react";
import { Sparkles, X, Send, Paperclip, Loader2 } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Assistente FLUTUANTE do painel (FAB): botão arrastável que abre um chat com a
 * IA, e a IA OPERA o painel via tools no endpoint `chatEndpoint`. Componente ÚNICO
 * e centralizado — usado no `apps/site` (tenant) e no `apps/sistema`. O que muda
 * por app são as props (endpoint, upload, persistência de histórico).
 */
export function AiAssistantFab({
  title = "Assistente",
  subtitle = "Peça qualquer coisa — eu opero o painel pra você.",
  capabilities = [],
  chatEndpoint = "/api/ops-chat",
  /** Endpoint de upload de imagem (FormData `file`). Omitido = sem anexo. */
  uploadEndpoint,
  uploadFolder = "ops-chat/anexos",
  /** Rotas onde o FAB some (ex.: a tela que já tem o chat). */
  hideOnPaths = [],
  /** Stateless: manda o histórico no POST (servidor não guarda conversa). */
  sendHistory = false,
  accent = "var(--admin-primary)",
}: {
  title?: string;
  subtitle?: string;
  capabilities?: string[];
  chatEndpoint?: string;
  uploadEndpoint?: string;
  uploadFolder?: string;
  hideOnPaths?: string[];
  sendHistory?: boolean;
  accent?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-fab-pos");
      if (saved) setPos(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    const openFab = () => setOpen(true);
    window.addEventListener("ai-fab:open", openFab);
    return () => window.removeEventListener("ai-fab:open", openFab);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: rect.left, baseY: rect.top, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) {
      const x = Math.min(window.innerWidth - 60, Math.max(4, d.baseX + dx));
      const y = Math.min(window.innerHeight - 60, Math.max(4, d.baseY + dy));
      setPos({ x, y });
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      try { localStorage.setItem("ai-fab-pos", JSON.stringify(pos)); } catch {}
    } else {
      setOpen((v) => !v);
    }
  };

  const hidden = hideOnPaths.includes(pathname);

  useEffect(() => {
    if (!open || historyLoaded) return;
    setHistoryLoaded(true);
    fetch(chatEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { messages?: Msg[] } | null) => {
        if (d?.messages?.length) setMessages(d.messages.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => {});
  }, [open, historyLoaded, chatEndpoint]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [open, messages, loading]);

  const pickImage = async (file: File) => {
    if (!uploadEndpoint) return;
    if (!file.type.startsWith("image/")) {
      setError("Anexe apenas imagens.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", uploadFolder);
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Falha no upload.");
      setAttachment(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    const typed = input.trim();
    if ((typed.length < 2 && !attachment) || loading) return;
    setError(null);
    const text = attachment ? `${typed}${typed ? "\n\n" : ""}![imagem anexada](${attachment})` : typed;
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setLoading(true);
    try {
      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, context: { path: pathname }, ...(sendHistory ? { history: messages } : {}) }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string; error?: string; reply?: string; messages?: Msg[] };
      if (!res.ok || data.ok === false) throw new Error(data.error || data.reason || "Falha ao processar.");
      if (Array.isArray(data.messages)) setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
      else if (data.reply) setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      <chakra.button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        position="fixed"
        style={pos ? { left: pos.x, top: pos.y, background: accent, boxShadow: "0 12px 34px rgba(7,26,51,0.35)", touchAction: "none" } : { background: accent, boxShadow: "0 12px 34px rgba(7,26,51,0.35)", touchAction: "none" }}
        bottom={pos ? undefined : 6}
        right={pos ? undefined : 6}
        zIndex={1400}
        w="56px"
        h="56px"
        borderRadius="full"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        color="white"
        _hover={{ transform: "scale(1.06)" }}
        transition="transform .15s"
        aria-label={`Falar com ${title}`}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </chakra.button>

      {open && (
        <Box
          position="fixed"
          bottom="92px"
          right={6}
          zIndex={1400}
          w={{ base: "calc(100vw - 32px)", sm: "400px" }}
          h={{ base: "70vh", sm: "560px" }}
          maxH="calc(100vh - 120px)"
          borderRadius="18px"
          bg="white"
          border="1px solid var(--admin-border)"
          boxShadow="0 24px 60px rgba(17,12,40,0.22)"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Box px={5} py={3.5} style={{ background: accent }} color="white" flexShrink={0}>
            <HStack gap={2}>
              <Sparkles size={18} />
              <Text fontWeight="700">{title}</Text>
            </HStack>
            <Text fontSize="xs" opacity={0.9} mt={0.5}>{subtitle}</Text>
          </Box>

          <Stack ref={scrollRef} flex={1} overflowY="auto" p={4} gap={3} bg="var(--admin-surface-2, #f7f8fa)">
            {messages.length === 0 && !loading && capabilities.length > 0 && (
              <Box bg="white" border="1px solid var(--admin-border)" borderRadius="14px" p={4}>
                <Text fontSize="sm" fontWeight="700" color="var(--admin-primary)" mb={2}>O que posso fazer?</Text>
                <Stack gap={1.5}>
                  {capabilities.map((c) => (
                    <Text key={c} fontSize="sm" color="var(--admin-text)">• {c}</Text>
                  ))}
                </Stack>
                <Text fontSize="xs" color="var(--admin-text-soft)" mt={2}>É só pedir em linguagem natural que eu executo.</Text>
              </Box>
            )}
            {messages.map((m, i) => (
              <Box
                key={i}
                alignSelf={m.role === "user" ? "flex-end" : "flex-start"}
                maxW="88%"
                px={3.5}
                py={2}
                borderRadius="14px"
                fontSize="sm"
                bg={m.role === "user" ? "var(--admin-primary)" : "white"}
                color={m.role === "user" ? "white" : "var(--admin-text)"}
                border={m.role === "user" ? "none" : "1px solid var(--admin-border)"}
                css={{ "& img": { maxWidth: "100%", borderRadius: 8, marginTop: 6 } }}
              >
                <ChatMarkdown>{m.content}</ChatMarkdown>
              </Box>
            ))}
            {loading && (
              <HStack alignSelf="flex-start" gap={2} color="var(--admin-text-soft)" fontSize="sm">
                <Spinner size="sm" /> <Text>{title} está pensando…</Text>
              </HStack>
            )}
          </Stack>

          {error && (
            <Box bg="rgba(220,38,38,0.06)" borderTop="1px solid rgba(220,38,38,0.2)" px={4} py={2} flexShrink={0}>
              <Text color="red.700" fontSize="xs">{error}</Text>
            </Box>
          )}

          <Box borderTop="1px solid var(--admin-border)" p={3} flexShrink={0} bg="white">
            {attachment && (
              <HStack mb={2} gap={2} bg="var(--admin-surface-2, #f3f4f6)" borderRadius="10px" p={1.5} pr={2.5} w="fit-content">
                <Image src={attachment} alt="anexo" h="40px" w="40px" objectFit="cover" borderRadius="8px" />
                <Text fontSize="xs" color="var(--admin-text-soft)">imagem anexada</Text>
                <chakra.button type="button" onClick={() => setAttachment(null)} aria-label="Remover anexo" color="var(--admin-text-soft)" _hover={{ color: "red.500" }}>
                  <X size={14} />
                </chakra.button>
              </HStack>
            )}
            <HStack gap={2} align="flex-end">
              {uploadEndpoint && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void pickImage(f);
                      e.target.value = "";
                    }}
                  />
                  <chakra.button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    w="42px"
                    h="42px"
                    flexShrink={0}
                    borderRadius="10px"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    color="var(--admin-text-soft)"
                    border="1px solid var(--admin-border)"
                    _hover={{ bg: "var(--admin-nav-hover)", color: "var(--admin-primary)" }}
                    aria-label="Anexar imagem"
                  >
                    {uploading ? <Box css={{ animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}><Loader2 size={18} /></Box> : <Paperclip size={18} />}
                  </chakra.button>
                </>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Peça algo…"
                rows={2}
                resize="none"
                bg="white"
                borderColor="var(--admin-border)"
                _focus={{ borderColor: "var(--admin-primary)", boxShadow: "0 0 0 3px var(--admin-nav-active)" }}
                borderRadius="10px"
                fontSize="sm"
                css={{ "&::placeholder": { fontSize: "13px" } }}
              />
              <chakra.button
                type="button"
                onClick={() => void send()}
                disabled={loading || (input.trim().length < 2 && !attachment)}
                w="42px"
                h="42px"
                flexShrink={0}
                borderRadius="10px"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                style={{ background: accent, opacity: loading || (input.trim().length < 2 && !attachment) ? 0.5 : 1 }}
                _hover={{ opacity: 0.92 }}
                aria-label="Enviar"
              >
                <Send size={18} />
              </chakra.button>
            </HStack>
          </Box>
        </Box>
      )}
    </>
  );
}
