"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Box, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { MessageSquarePlus, Paperclip, RefreshCw, Search, Send, Users, X } from "lucide-react";
import { Button } from "../Button";
import { ChatMarkdown } from "../ChatMarkdown";
import { EntityAvatar } from "../EntityAvatar";
import { Field, Input, NativeSelect } from "../controls";
import { Modal } from "../Modal";

/* ============================================================
 * Inbox de WhatsApp — super-componente PURO do core (estilo do
 * app do WhatsApp: lista + fio + composer + anexos). MESMA
 * experiência no sistema e no tenant; cada app injeta o `api`
 * (server actions próprias, contra o servidor-whats dele). Zero
 * import de @/server. IDs de peer sempre STRING (E.164/dígitos).
 * ============================================================ */

export type WaInboxResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type WaMediaKind = "image" | "video" | "audio" | "document" | "sticker";

/** Uma conversa da lista (subset estrutural do BotChat do servidor-whats). */
export type WaChat = {
  _id: string;
  name?: string | null;
  unreadCount?: number;
  isGroup?: boolean;
  timestamp?: number | string | null;
  lastType?: string | null;
  lastMessage?: { fromMe?: boolean; body?: string } | null;
};

/** Uma mensagem do fio (subset estrutural do BotMessage do servidor-whats). */
export type WaMessage = {
  id: string;
  timestamp?: number | string | null;
  fromMe?: boolean;
  body?: string;
  type?: string;
  hasMedia?: boolean;
  mediaUrl?: string | null;
  direction?: "in" | "out";
  isAgentReply?: boolean;
  agentName?: string | null;
};

/** Contrato de dados/ações que cada app pluga na inbox. */
export type WaInboxApi = {
  listChats: () => Promise<WaInboxResult<WaChat[]>>;
  getMessages: (peer: string) => Promise<WaInboxResult<WaMessage[]>>;
  reply: (peer: string, text: string) => Promise<WaInboxResult>;
  sendMedia: (input: { to: string; type: WaMediaKind; url: string; caption?: string }) => Promise<WaInboxResult>;
  uploadMedia: (
    fd: FormData,
  ) => Promise<{ ok: true; url: string; kind: WaMediaKind; filename: string } | { ok: false; error: string }>;
};

// Bolha otimista: mensagem já mostrada como enviada mas ainda não confirmada
// pelo servidor (o envio passa pela fila anti-ban → só persiste depois).
type UiMessage = WaMessage & { pending?: boolean };

const lbl = { color: "var(--admin-text-soft)", fontSize: "13px", fontWeight: 600 } as const;

// ── Fundo oficial do WhatsApp: creme + textura de rabiscos discreta (SVG inline).
const WA_CREAM = "#efeae2";
const WA_DOODLE =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='84'%20height='84'%3E%3Cg%20fill='none'%20stroke='%23000'%20stroke-opacity='0.035'%20stroke-width='1.4'%3E%3Ccircle%20cx='18'%20cy='20'%20r='7'/%3E%3Cpath%20d='M46%2012q7%207%200%2014'/%3E%3Cpath%20d='M60%2054l7%207'/%3E%3Ccircle%20cx='30'%20cy='62'%20r='3.5'/%3E%3Cpath%20d='M8%2052h10'/%3E%3C/g%3E%3C/svg%3E";
const WA_SENT = "#d9fdd3";
const WA_RECV = "#ffffff";
const WA_TEXT = "#111b21";
const WA_META = "#667781";

const MEDIA_LABEL: Record<string, string> = {
  image: "📷 Foto",
  video: "🎬 Vídeo",
  audio: "🎧 Áudio",
  ptt: "🎤 Áudio",
  document: "📎 Documento",
  sticker: "💟 Figurinha",
  location: "📍 Localização",
  contact: "👤 Contato",
};

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

/** Formata E.164 → +55 (81) 99999-0000 quando reconhece BR; senão +digits. */
function fmtPhone(peer: string): string {
  const d = onlyDigits(peer);
  if (!d) return peer || "—";
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const mid = rest.length === 9 ? `${rest.slice(0, 5)}-${rest.slice(5)}` : `${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `+55 (${ddd}) ${mid}`;
  }
  return `+${d}`;
}

/** timestamp cru (segundos | ms | ISO | Date) → Date, robusto. */
function tsToDate(ts: unknown): Date | null {
  if (ts == null) return null;
  const n = typeof ts === "number" ? ts : Date.parse(String(ts));
  if (!Number.isFinite(n)) return null;
  return new Date(n >= 1e12 ? n : n * 1000);
}
function fmtTime(ts: unknown): string {
  return tsToDate(ts)?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "";
}

function chatPreview(c: WaChat): string {
  const b = c.lastMessage?.body?.trim();
  if (b) return b;
  const t = c.lastType || "";
  return MEDIA_LABEL[t] || (t ? "[mídia]" : "");
}

function displayName(c: WaChat): string {
  return c.name?.trim() || (c.isGroup ? "Grupo" : fmtPhone(c._id));
}

export function WhatsAppInbox({ api }: { api: WaInboxApi }) {
  const [chats, setChats] = useState<WaChat[] | null>(null);
  const [chatsErr, setChatsErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [peer, setPeer] = useState<string | null>(null);
  const [peerName, setPeerName] = useState("");
  const [peerIsGroup, setPeerIsGroup] = useState(false);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // envio otimista: bolhas mostradas na hora, reconciliadas quando o servidor confirma
  const [pending, setPending] = useState<UiMessage[]>([]);
  const pendingSeq = useRef(0);

  const [reply, setReply] = useState("");
  const [replyErr, setReplyErr] = useState<string | null>(null);
  const [replying, startReply] = useTransition();

  // anexar mídia: escolher arquivo (sobe pro Blob) OU colar URL
  const [showMedia, setShowMedia] = useState(false);
  const [mediaType, setMediaType] = useState<WaMediaKind>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaMsg, setMediaMsg] = useState<string | null>(null);
  const [sendingMedia, startSendMedia] = useTransition();
  const [stagedName, setStagedName] = useState(""); // arquivo já subido pro Blob (pendente de envio)
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // nova conversa
  const [newOpen, setNewOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const replyRef = useRef<HTMLInputElement | null>(null);

  const loadChats = async () => {
    const res = await api.listChats();
    if (!res.ok) { setChatsErr(res.error); setChats((c) => c ?? []); return; }
    setChatsErr(null);
    setChats(res.data ?? []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await api.listChats();
      if (!alive) return;
      if (!res.ok) { setChatsErr(res.error); setChats([]); return; }
      setChats(res.data ?? []);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // rola pro fim quando as mensagens mudam (inclui a bolha otimista)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, loadingMsgs]);

  // Reconcilia servidor (verdade) × bolhas otimistas: quando uma saída com o
  // mesmo texto já consta no servidor, some com a bolha pendente (sem piscar).
  const applyServer = useCallback((list: WaMessage[]) => {
    setMessages(list);
    setPending((pend) => {
      if (pend.length === 0) return pend;
      const outBodies = new Set(
        list
          .filter((m) => (m.direction ? m.direction === "out" : !!m.fromMe) && m.body)
          .map((m) => (m.body || "").trim()),
      );
      return pend.filter((p) => !outBodies.has((p.body || "").trim()));
    });
  }, []);

  const reloadThread = useCallback(
    async (id: string) => {
      const res = await api.getMessages(id);
      if (res.ok) applyServer(res.data ?? []);
    },
    [api, applyServer],
  );

  // fio exibido = servidor + pendentes (otimistas) ainda não confirmados
  const thread = useMemo<UiMessage[]>(
    () => (pending.length ? [...messages, ...pending] : messages),
    [messages, pending],
  );

  // Enquanto um chat está aberto, sincroniza sozinho: mensagens novas, respostas
  // da IA e a versão persistida do que você enviou aparecem sem apertar Atualizar.
  useEffect(() => {
    if (!peer) return;
    let alive = true;
    const id = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const res = await api.getMessages(peer);
      if (alive && res.ok) applyServer(res.data ?? []);
    }, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [peer, api, applyServer]);

  const openChat = async (id: string, name: string, isGroup: boolean) => {
    setPeer(id);
    setPeerName(name);
    setPeerIsGroup(isGroup);
    setReply("");
    setReplyErr(null);
    setShowMedia(false);
    setMediaMsg(null);
    setMediaUrl("");
    setMediaCaption("");
    setStagedName("");
    setMessages([]);
    setPending([]);
    setLoadingMsgs(true);
    const res = await api.getMessages(id);
    setLoadingMsgs(false);
    setMessages(res.ok ? (res.data ?? []) : []);
    setTimeout(() => replyRef.current?.focus(), 60);
  };

  const openNew = () => {
    const d = onlyDigits(newPhone);
    if (d.length < 8) return;
    setNewOpen(false);
    setNewPhone("");
    void openChat(d, fmtPhone(d), false);
  };

  const doReply = () => {
    const text = reply.trim();
    if (!peer || !text) return;
    const targetPeer = peer;
    // bolha otimista na hora + limpa o campo + rola pro fim (aparece que foi)
    const tempId = `pending-${++pendingSeq.current}`;
    setPending((p) => [
      ...p,
      { id: tempId, direction: "out", fromMe: true, body: text, timestamp: Date.now(), type: "chat", pending: true },
    ]);
    setReply("");
    setReplyErr(null);
    startReply(async () => {
      const res = await api.reply(targetPeer, text);
      if (!res.ok) {
        // falhou: remove a bolha, devolve o texto e mostra o erro
        setPending((p) => p.filter((m) => m.id !== tempId));
        setReplyErr(res.error);
        setReply((cur) => cur || text);
        return;
      }
      await reloadThread(targetPeer);
      void loadChats();
      // reforço: o envio passa pela fila anti-ban → recarrega de novo p/ pegar a
      // versão persistida caso ainda não estivesse pronta no 1º reload.
      setTimeout(() => { void reloadThread(targetPeer); }, 2500);
    });
  };

  // escolheu um arquivo → sobe pro Blob e deixa pronto pra enviar (preenche URL + tipo)
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo depois
    if (!file) return;
    setMediaMsg(null);
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.uploadMedia(fd);
      if (!res.ok) { setMediaMsg(`Erro: ${res.error}`); return; }
      setMediaUrl(res.url);
      setMediaType(res.kind);
      setStagedName(res.filename);
    });
  };

  const clearStaged = () => { setStagedName(""); setMediaUrl(""); setMediaMsg(null); };

  const doSendMedia = () =>
    startSendMedia(async () => {
      if (!peer || !mediaUrl.trim()) return;
      setMediaMsg(null);
      const res = await api.sendMedia({ to: onlyDigits(peer), type: mediaType, url: mediaUrl.trim(), caption: mediaCaption.trim() || undefined });
      if (!res.ok) { setMediaMsg(`Erro: ${res.error}`); return; }
      setMediaMsg("Mídia enviada (na fila anti-ban).");
      setMediaUrl("");
      setMediaCaption("");
      setStagedName("");
      await reloadThread(peer);
      void loadChats();
    });

  const filtered = useMemo(() => {
    if (!chats) return null;
    const term = q.trim().toLowerCase();
    if (!term) return chats;
    const digits = onlyDigits(term);
    return chats.filter((c) => {
      const n = (c.name || "").toLowerCase();
      return n.includes(term) || (digits.length > 0 && onlyDigits(c._id).includes(digits));
    });
  }, [chats, q]);

  return (
    <Box className="admin-card" p={0} overflow="hidden">
      <HStack align="stretch" gap={0} minH="520px">
        {/* ── LISTA ─────────────────────────────────────────── */}
        <Stack w={{ base: "260px", md: "320px" }} gap={0} borderRightWidth="1px" borderColor="var(--admin-divider)" flexShrink={0}>
          <Stack p={3} gap={2} borderBottomWidth="1px" borderColor="var(--admin-divider)">
            <Button onClick={() => setNewOpen(true)} w="full">
              <MessageSquarePlus size={16} style={{ marginRight: 8 }} /> Nova conversa
            </Button>
            <HStack gap={2} px={1} py={1} borderRadius="8px" bg="var(--admin-surface-2)">
              <Search size={15} color="var(--admin-text-soft)" style={{ flexShrink: 0, marginLeft: 4 }} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar nome ou número…"
                variant="flushed"
                border="none"
                _focus={{ boxShadow: "none" }}
                size="sm"
              />
            </HStack>
          </Stack>

          <Box overflowY="auto" flex={1} maxH="560px">
            {filtered === null ? (
              <HStack p={4}><Spinner size="sm" /> <Text fontSize="sm" color="var(--admin-text-soft)">Carregando…</Text></HStack>
            ) : filtered.length === 0 ? (
              <Stack p={4} gap={1}>
                <Text fontSize="sm" color="var(--admin-text-soft)">{chats && chats.length > 0 ? "Nada encontrado." : "Sem conversas ainda."}</Text>
                {chatsErr && <Text fontSize="xs" color="var(--admin-text-soft)">{chatsErr}</Text>}
                {chats && chats.length === 0 && !chatsErr && (
                  <Text fontSize="xs" color="var(--admin-text-soft)">Requer histórico salvo no servidor. Use “Nova conversa” para iniciar.</Text>
                )}
              </Stack>
            ) : (
              filtered.map((c) => {
                const name = displayName(c);
                const active = peer === c._id;
                return (
                  <HStack
                    key={c._id}
                    px={3}
                    py={3}
                    gap={3}
                    cursor="pointer"
                    align="center"
                    bg={active ? "var(--admin-nav-hover)" : undefined}
                    _hover={{ bg: "var(--admin-nav-hover)" }}
                    borderBottomWidth="1px"
                    borderColor="var(--admin-divider)"
                    onClick={() => openChat(c._id, name, !!c.isGroup)}
                  >
                    <EntityAvatar name={name} size="sm" />
                    <Stack gap={0} flex={1} minW={0}>
                      <HStack justify="space-between" gap={2}>
                        <HStack gap={1} minW={0}>
                          {c.isGroup ? <Users size={13} color="var(--admin-text-soft)" style={{ flexShrink: 0 }} /> : null}
                          <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>{name}</Text>
                        </HStack>
                        <Text fontSize="10px" color="var(--admin-text-soft)" flexShrink={0}>{fmtTime(c.timestamp)}</Text>
                      </HStack>
                      <HStack justify="space-between" gap={2}>
                        <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                          {c.lastMessage?.fromMe ? "Você: " : ""}{chatPreview(c)}
                        </Text>
                        {c.unreadCount ? (
                          <Box bg="#25d366" color="white" borderRadius="full" minW="18px" textAlign="center" px={1.5} fontSize="10px" fontWeight="700">{c.unreadCount}</Box>
                        ) : null}
                      </HStack>
                    </Stack>
                  </HStack>
                );
              })
            )}
          </Box>
        </Stack>

        {/* ── THREAD ────────────────────────────────────────── */}
        <Stack flex={1} gap={0} minW={0}>
          {!peer ? (
            <HStack flex={1} justify="center" align="center" p={8}>
              <Stack align="center" gap={2}>
                <MessageSquarePlus size={40} color="var(--admin-text-soft)" />
                <Text fontSize="sm" color="var(--admin-text-soft)">Selecione uma conversa ou inicie uma nova.</Text>
              </Stack>
            </HStack>
          ) : (
            <>
              {/* cabeçalho */}
              <HStack px={4} py={3} gap={3} borderBottomWidth="1px" borderColor="var(--admin-divider)" bg="var(--admin-surface)" flexShrink={0}>
                <EntityAvatar name={peerName} size="sm" />
                <Stack gap={0} flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" lineClamp={1}>{peerName}</Text>
                  <Text fontSize="xs" color="var(--admin-text-soft)">{peerIsGroup ? "Grupo" : fmtPhone(peer)}</Text>
                </Stack>
                <Button tone="ghost" size="sm" onClick={() => reloadThread(peer)} aria-label="Atualizar">
                  <RefreshCw size={15} />
                </Button>
              </HStack>

              {/* mensagens sobre o fundo do WhatsApp */}
              <Box
                ref={scrollRef}
                flex={1}
                overflowY="auto"
                maxH="440px"
                p={4}
                bg={WA_CREAM}
                backgroundImage={`url("${WA_DOODLE}")`}
              >
                {loadingMsgs ? (
                  <HStack justify="center" pt={6}><Spinner size="sm" /></HStack>
                ) : thread.length === 0 ? (
                  <HStack justify="center" pt={6}>
                    <Text fontSize="sm" color={WA_META} bg="rgba(255,255,255,0.7)" px={3} py={1} borderRadius="8px">
                      Nenhuma mensagem ainda. Escreva abaixo para iniciar.
                    </Text>
                  </HStack>
                ) : (
                  <Stack gap={1.5}>
                    {thread.map((m) => {
                      const isMe = m.direction ? m.direction === "out" : !!m.fromMe;
                      const isImg = m.hasMedia && (m.type === "image" || m.type === "sticker") && !!m.mediaUrl;
                      return (
                        <Box
                          key={m.id}
                          alignSelf={isMe ? "flex-end" : "flex-start"}
                          bg={isMe ? WA_SENT : WA_RECV}
                          color={WA_TEXT}
                          opacity={m.pending ? 0.65 : 1}
                          px={2.5}
                          py={1.5}
                          borderRadius="8px"
                          borderTopRightRadius={isMe ? "2px" : "8px"}
                          borderTopLeftRadius={isMe ? "8px" : "2px"}
                          maxW="76%"
                          boxShadow="0 1px 0.5px rgba(11,20,26,0.13)"
                        >
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.mediaUrl!} alt="mídia" style={{ maxWidth: "240px", borderRadius: 6, marginBottom: m.body ? 6 : 0 }} />
                          ) : m.hasMedia && !m.body ? (
                            <Text fontSize="sm">{MEDIA_LABEL[m.type || ""] || "📎 Mídia"}{m.mediaUrl ? <> · <a href={m.mediaUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>abrir</a></> : null}</Text>
                          ) : null}
                          {m.body ? <ChatMarkdown>{m.body}</ChatMarkdown> : null}
                          <HStack justify="flex-end" gap={1} mt={0.5}>
                            {isMe && m.isAgentReply ? (
                              <Text fontSize="9px" fontWeight="700" color="#0369a1" letterSpacing="0.03em">IA{m.agentName ? ` · ${m.agentName}` : ""}</Text>
                            ) : null}
                            <Text fontSize="10px" color={WA_META}>{m.pending ? "enviando…" : fmtTime(m.timestamp)}</Text>
                          </HStack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {/* painel de anexo: escolher arquivo (sobe pro Blob) ou colar URL */}
              {showMedia && (
                <Box px={4} py={3} borderTopWidth="1px" borderColor="var(--admin-divider)" bg="var(--admin-surface-2)">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="600" color="var(--admin-text)">Anexar mídia</Text>
                    <Button tone="ghost" size="xs" onClick={() => setShowMedia(false)} aria-label="Fechar"><X size={13} /></Button>
                  </HStack>

                  {/* escolher arquivo do computador → upload direto pro Blob */}
                  <input ref={fileRef} type="file" hidden onChange={onPickFile} />
                  <HStack gap={3} mb={3} flexWrap="wrap" align="center">
                    <Button onClick={() => fileRef.current?.click()} loading={uploading}>
                      <Paperclip size={15} style={{ marginRight: 6 }} /> Escolher arquivo
                    </Button>
                    {stagedName ? (
                      <HStack gap={2} minW={0} maxW="60%">
                        <Text fontSize="xs" color="var(--admin-text)" lineClamp={1}>📎 {stagedName}</Text>
                        <Button tone="ghost" size="xs" onClick={clearStaged} aria-label="Remover arquivo"><X size={12} /></Button>
                      </HStack>
                    ) : (
                      <Text fontSize="xs" color="var(--admin-text-soft)">Até 16 MB · imagem, vídeo, áudio ou documento.</Text>
                    )}
                  </HStack>

                  {/* preview de imagem já no Blob */}
                  {mediaUrl && mediaType === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt="pré-visualização" style={{ maxWidth: 160, borderRadius: 8, marginBottom: 12 }} />
                  )}

                  <HStack gap={3} align="flex-end" flexWrap="wrap">
                    <Field.Root maxW="140px">
                      <Field.Label style={lbl}>Tipo</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field value={mediaType} onChange={(e) => setMediaType(e.target.value as WaMediaKind)}>
                          <option value="image">Imagem</option>
                          <option value="video">Vídeo</option>
                          <option value="audio">Áudio</option>
                          <option value="document">Documento</option>
                          <option value="sticker">Figurinha</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root flex={1} minW="220px">
                      <Field.Label style={lbl}>URL da mídia</Field.Label>
                      <Input value={mediaUrl} onChange={(e) => { setMediaUrl(e.target.value); setStagedName(""); }} placeholder="cole um link ou escolha um arquivo acima" />
                    </Field.Root>
                    <Field.Root flex={1} minW="160px">
                      <Field.Label style={lbl}>Legenda (opcional)</Field.Label>
                      <Input value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} placeholder="Descrição…" />
                    </Field.Root>
                    <Button onClick={doSendMedia} loading={sendingMedia} disabled={!mediaUrl.trim() || uploading}>
                      <Send size={15} style={{ marginRight: 6 }} /> Enviar
                    </Button>
                  </HStack>
                  {mediaMsg && <Text fontSize="sm" color={mediaMsg.startsWith("Erro") ? "red.600" : "#15803d"} mt={2}>{mediaMsg}</Text>}
                </Box>
              )}

              {/* composer */}
              <Stack gap={1} px={3} py={3} borderTopWidth="1px" borderColor="var(--admin-divider)" bg="var(--admin-surface)" flexShrink={0}>
                <HStack gap={2}>
                  <Button tone="ghost" size="sm" onClick={() => setShowMedia((s) => !s)} aria-label="Anexar">
                    <Paperclip size={18} />
                  </Button>
                  <Input
                    ref={replyRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Digite uma mensagem…"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doReply(); } }}
                    borderRadius="20px"
                  />
                  <Button onClick={doReply} loading={replying} disabled={!reply.trim()} px={3} borderRadius="full" aria-label="Enviar">
                    <Send size={16} />
                  </Button>
                </HStack>
                {replyErr && <Text fontSize="xs" color="red.600" px={2}>Erro: {replyErr}</Text>}
              </Stack>
            </>
          )}
        </Stack>
      </HStack>

      {/* modal Nova conversa */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nova conversa"
        footer={
          <>
            <Button tone="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={openNew} disabled={onlyDigits(newPhone).length < 8}>Abrir conversa</Button>
          </>
        }
      >
        <Field.Root>
          <Field.Label style={lbl}>Número (com DDI + DDD)</Field.Label>
          <Input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="5581999990000"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") openNew(); }}
          />
          <Field.HelperText>Só números. Ex.: 55 (Brasil) + 81 (DDD) + número.</Field.HelperText>
        </Field.Root>
      </Modal>
    </Box>
  );
}
