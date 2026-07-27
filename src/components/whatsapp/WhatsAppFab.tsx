"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, Flex, HStack, Spinner, Stack, Text, chakra } from "@chakra-ui/react";
import { ArrowLeft, Maximize2, MessageCircle, RefreshCw, Search, Send, Users, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { EntityAvatar } from "../EntityAvatar";
import { Input } from "../controls";
import { useFabDock, setFabOpen, FAB_BASE, FAB_PANEL_BOTTOM } from "../fab/dock";
import type { UiRealtimeSubscribe } from "../realtime";
import {
  ChatRow,
  MessageBubble,
  WA_CREAM,
  WA_DOODLE,
  displayName,
  groupByDay,
  type UiMessage,
  type WhatsAppChat,
  type WhatsAppMessage,
  type WhatsAppResult,
} from "./WhatsAppClient";

/* ============================================================
 * WhatsAppFab — o WhatsApp FLUTUANTE do painel: botão arrastável
 * que abre uma janelinha "de telemóvel" (lista → conversa) em
 * QUALQUER tela, sem sair de onde se está.
 *
 * Não é uma segunda implementação do WhatsApp: a linha da lista
 * (`ChatRow`) e a bolha (`MessageBubble`) são as MESMAS do
 * `WhatsAppClient` — importadas dele. O que muda aqui é só a
 * moldura (janela pequena, uma coluna de cada vez) e o seletor
 * Conversas/Grupos, que na tela cheia é a barra de categorias.
 *
 * Puro: zero fetch/server action. Dados+callbacks por props, IDs
 * string. Quem monta decide de onde vêm os chats.
 * ============================================================ */

const WA_GREEN = "#128c7e";
const WA_GREEN_DARK = "#075e54";

/** Link do Next com as props de estilo do Chakra (o botão de expandir). */
const ChakraLink = chakra(Link);

export type WhatsAppFabCallbacks = {
  /** Abre a conversa — devolve o fio completo (mesma callback da tela cheia). */
  onSelecionar: (chatId: string) => Promise<WhatsAppResult<WhatsAppMessage[]>>;
  onResponder: (chatId: string, texto: string) => Promise<WhatsAppResult<{ messageId?: string }>>;
  /** Recarrega a lista de conversas (o dono é que sabe como). */
  onActualizar: () => void | Promise<void>;
};

export type WhatsAppFabProps = {
  /** Desligado = o FAB nem existe (é o "se tiver conectado" do pedido). */
  connected: boolean;
  phone?: string | null;
  chats: WhatsAppChat[];
  loadingChats?: boolean;
  assistantName?: string;
  /** Rota da tela cheia — presente = mostra o botão de expandir. */
  expandHref?: string;
  /** Rotas onde o FAB some (a própria tela do WhatsApp, por exemplo). */
  hideOnPaths?: string[];
  /** Avisa quando abre/fecha — o dono usa pra ligar/desligar o polling. */
  onOpenChange?: (open: boolean) => void;
  callbacks: WhatsAppFabCallbacks;
  /**
   * TEMPO REAL por injeção (opcional): `(aviso) => cancelar`. O FAB não tinha
   * ciclo nenhum — o fio aberto ficava congelado até fechar e abrir de novo.
   * Com isto, mensagem nova aparece sozinha (e a lista se atualiza pelo dono).
   */
  onRealtime?: UiRealtimeSubscribe;
};

export function WhatsAppFab({
  connected,
  phone,
  chats,
  loadingChats = false,
  assistantName,
  expandHref,
  hideOnPaths = [],
  onOpenChange,
  callbacks,
  onRealtime,
}: WhatsAppFabProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState<"conversas" | "grupos">("conversas");
  const [busca, setBusca] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<UiMessage[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fioRef = useRef<HTMLDivElement>(null);

  // Dock partilhado: empilha os FABs (WhatsApp em baixo) e garante que só um
  // painel abre de cada vez — abrir a IA some com este, e vice-versa.
  const wantShow = connected && !hideOnPaths.includes(pathname);
  const { bottom, othersOpen } = useFabDock("whatsapp", wantShow);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Espelha o aberto no dock e recua se o irmão (IA) abrir.
  useEffect(() => setFabOpen("whatsapp", open), [open]);
  useEffect(() => {
    if (othersOpen && open) setOpen(false);
  }, [othersOpen, open]);

  // Abrir por evento: dá um atalho a quem quiser ("abrir o WhatsApp") sem prop drilling.
  useEffect(() => {
    const abrir = () => setOpen(true);
    window.addEventListener("wa-fab:open", abrir);
    return () => window.removeEventListener("wa-fab:open", abrir);
  }, []);

  const abrirConversa = useCallback(
    async (id: string) => {
      setChatId(id);
      setMsgs([]);
      setErro(null);
      setCarregando(true);
      const r = await callbacks.onSelecionar(id);
      setCarregando(false);
      if (r.ok) setMsgs(r.data ?? []);
      else setErro(r.error);
    },
    [callbacks],
  );

  // TEMPO REAL: recarrega o fio aberto SEM piscar (não limpa as mensagens nem
  // acende o spinner — a bolha nova entra e pronto).
  useEffect(() => {
    if (!open || !chatId || !onRealtime) return;
    return onRealtime(() => {
      void callbacks.onSelecionar(chatId).then((r) => {
        if (r.ok) setMsgs(r.data ?? []);
      });
    });
  }, [open, chatId, onRealtime, callbacks]);

  const enviar = useCallback(async () => {
    const t = texto.trim();
    if (!t || !chatId || enviando) return;
    setTexto("");
    setEnviando(true);
    // Bolha otimista: a mensagem aparece já, marcada "a enviar…", e é
    // substituída pelo fio real assim que o servidor confirma.
    const local: UiMessage = {
      id: `local-${chatId}-${msgs.length}`,
      chatId,
      from: "",
      to: chatId,
      body: t,
      type: "text",
      direction: "out",
      fromMe: true,
      status: null,
      hasMedia: false,
      mediaUrl: null,
      mediaType: null,
      contactName: null,
      savedName: null,
      sentBy: "painel",
      sentByName: null,
      at: new Date().toISOString(),
      pendingLocal: true,
    };
    setMsgs((prev) => [...prev, local]);
    const r = await callbacks.onResponder(chatId, t);
    setEnviando(false);
    if (!r.ok) {
      setErro(r.error);
      setMsgs((prev) => prev.filter((m) => m.id !== local.id));
      setTexto(t);
      return;
    }
    const fresco = await callbacks.onSelecionar(chatId);
    if (fresco.ok) setMsgs(fresco.data ?? []);
    void callbacks.onActualizar();
  }, [texto, chatId, enviando, msgs.length, callbacks]);

  // Rola pro fim sempre que o fio muda (abrir conversa ou mensagem nova).
  useEffect(() => {
    if (!open || !chatId) return;
    const el = fioRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, chatId, msgs]);

  const chatAberto = useMemo(() => chats.find((c) => c.chatId === chatId) ?? null, [chats, chatId]);

  const { conversas, grupos } = useMemo(() => {
    const naoArquivados = chats.filter((c) => !c.arquivado);
    return {
      conversas: naoArquivados.filter((c) => !c.isGroup),
      grupos: naoArquivados.filter((c) => c.isGroup),
    };
  }, [chats]);

  const lista = useMemo(() => {
    const base = vista === "grupos" ? grupos : conversas;
    const q = busca.trim().toLowerCase();
    const filtrados = q
      ? base.filter((c) => `${displayName(c)} ${c.peer} ${c.lastBody}`.toLowerCase().includes(q))
      : base;
    // Fixados primeiro; o resto mantém a ordem que veio do servidor (mais recente).
    return [...filtrados].sort((a, b) => Number(b.fixado) - Number(a.fixado));
  }, [vista, grupos, conversas, busca]);

  const naoLidas = useMemo(() => chats.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0), [chats]);

  if (!wantShow || othersOpen) return null;

  const botao = (
    <chakra.button
      type="button"
      onClick={() => setOpen((v) => !v)}
      position="fixed"
      style={{ background: "#25d366", boxShadow: "0 12px 34px rgba(7,26,51,0.35)" }}
      bottom={`${open ? FAB_BASE : bottom}px`}
      right={`${FAB_BASE}px`}
      zIndex={1400}
      w="56px"
      h="56px"
      borderRadius="full"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      color="white"
      _hover={{ transform: "scale(1.06)" }}
      transition="transform .15s, bottom .18s ease"
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      {open ? <X size={22} /> : <FaWhatsapp size={26} />}
      {!open && naoLidas > 0 ? (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          bg="#ef4444"
          color="white"
          borderRadius="full"
          minW="20px"
          h="20px"
          px={1}
          fontSize="11px"
          fontWeight="700"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          border="2px solid white"
        >
          {naoLidas > 99 ? "99+" : naoLidas}
        </Box>
      ) : null}
    </chakra.button>
  );

  if (!open) return botao;

  return (
    <>
      {botao}
      <Flex
        position="fixed"
        bottom={`${FAB_PANEL_BOTTOM}px`}
        right={`${FAB_BASE}px`}
        zIndex={1400}
        w={{ base: "calc(100vw - 32px)", sm: "380px" }}
        h={{ base: "72vh", sm: "580px" }}
        maxH="calc(100vh - 120px)"
        borderRadius="18px"
        bg="var(--admin-surface, white)"
        border="1px solid var(--admin-border)"
        boxShadow="0 24px 60px rgba(17,12,40,0.22)"
        overflow="hidden"
        direction="column"
      >
        {/* ── Cabeçalho ───────────────────────────────────── */}
        <HStack
          px={3.5}
          py={2.5}
          gap={2}
          flexShrink={0}
          style={{ background: chatAberto ? WA_GREEN_DARK : WA_GREEN }}
          color="white"
        >
          {chatAberto ? (
            <>
              <chakra.button
                type="button"
                onClick={() => {
                  setChatId(null);
                  setMsgs([]);
                  setErro(null);
                }}
                aria-label="Voltar"
                display="inline-flex"
                alignItems="center"
                flexShrink={0}
              >
                <ArrowLeft size={18} />
              </chakra.button>
              <EntityAvatar name={displayName(chatAberto)} size="sm" />
              <Stack gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700" lineClamp={1}>
                  {displayName(chatAberto)}
                </Text>
                <Text fontSize="10px" opacity={0.85} lineClamp={1}>
                  {chatAberto.isGroup ? "Grupo" : chatAberto.peer.replace(/\D/g, "")}
                </Text>
              </Stack>
            </>
          ) : (
            <>
              <FaWhatsapp size={18} />
              <Stack gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700">
                  WhatsApp
                </Text>
                <Text fontSize="10px" opacity={0.85} lineClamp={1}>
                  {phone ? `Conectado — ${phone}` : "Conectado"}
                </Text>
              </Stack>
              <chakra.button
                type="button"
                onClick={() => void callbacks.onActualizar()}
                aria-label="Atualizar"
                title="Atualizar"
                opacity={0.85}
                _hover={{ opacity: 1 }}
                flexShrink={0}
              >
                <RefreshCw size={15} />
              </chakra.button>
            </>
          )}
          {expandHref ? (
            <ChakraLink
              href={expandHref}
              aria-label="Abrir em tela cheia"
              title="Abrir em tela cheia"
              display="inline-flex"
              alignItems="center"
              color="white"
              opacity={0.85}
              _hover={{ opacity: 1 }}
              flexShrink={0}
            >
              <Maximize2 size={15} />
            </ChakraLink>
          ) : null}
          <chakra.button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            opacity={0.85}
            _hover={{ opacity: 1 }}
            flexShrink={0}
          >
            <X size={16} />
          </chakra.button>
        </HStack>

        {chatAberto ? (
          /* ── Conversa ──────────────────────────────────── */
          <>
            <Box
              ref={fioRef}
              flex={1}
              overflowY="auto"
              px={3}
              py={2.5}
              style={{ background: WA_CREAM, backgroundImage: `url("${WA_DOODLE}")` }}
            >
              {carregando ? (
                <HStack justify="center" py={6}>
                  <Spinner size="sm" />
                </HStack>
              ) : msgs.length === 0 ? (
                <Text fontSize="xs" color="#667781" textAlign="center" py={6}>
                  Sem mensagens nesta conversa.
                </Text>
              ) : (
                <Stack gap={1.5}>
                  {groupByDay(msgs).map((g) => (
                    <Stack key={g.label} gap={1.5}>
                      <Text
                        alignSelf="center"
                        fontSize="10px"
                        fontWeight="600"
                        color="#667781"
                        bg="rgba(255,255,255,0.85)"
                        borderRadius="6px"
                        px={2}
                        py="2px"
                      >
                        {g.label}
                      </Text>
                      {g.items.map((m) => (
                        <MessageBubble key={m.id} m={m} isGroup={chatAberto.isGroup} assistantName={assistantName} />
                      ))}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            {erro ? (
              <Box bg="rgba(220,38,38,0.06)" borderTopWidth="1px" borderColor="rgba(220,38,38,0.2)" px={3} py={1.5} flexShrink={0}>
                <Text color="red.700" fontSize="11px">
                  {erro}
                </Text>
              </Box>
            ) : null}

            <HStack
              gap={2}
              p={2.5}
              flexShrink={0}
              borderTopWidth="1px"
              borderColor="var(--admin-border)"
              bg="var(--admin-surface, white)"
            >
              <Input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                placeholder="Escreva uma mensagem…"
                size="sm"
                borderRadius="18px"
              />
              <chakra.button
                type="button"
                onClick={() => void enviar()}
                disabled={enviando || !texto.trim()}
                w="36px"
                h="36px"
                flexShrink={0}
                borderRadius="full"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                style={{ background: "#25d366", opacity: enviando || !texto.trim() ? 0.5 : 1 }}
                aria-label="Enviar"
              >
                <Send size={16} />
              </chakra.button>
            </HStack>
          </>
        ) : (
          /* ── Lista (com o seletor Conversas/Grupos) ────── */
          <>
            <HStack gap={1.5} px={2.5} pt={2.5} pb={1.5} flexShrink={0}>
              <SeletorBotao
                ativo={vista === "conversas"}
                onClick={() => setVista("conversas")}
                icon={<MessageCircle size={13} />}
                label="Conversas"
                count={conversas.length}
              />
              <SeletorBotao
                ativo={vista === "grupos"}
                onClick={() => setVista("grupos")}
                icon={<Users size={13} />}
                label="Grupos"
                count={grupos.length}
              />
            </HStack>

            <Box px={2.5} pb={2} flexShrink={0}>
              <HStack
                gap={2}
                px={2.5}
                py={1.5}
                borderRadius="10px"
                bg="var(--admin-surface-2)"
                borderWidth="1px"
                borderColor="var(--admin-border)"
              >
                <Search size={13} color="var(--admin-text-soft)" />
                <chakra.input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Procurar…"
                  flex={1}
                  fontSize="13px"
                  bg="transparent"
                  outline="none"
                  color="var(--admin-text)"
                />
              </HStack>
            </Box>

            <Box flex={1} overflowY="auto" borderTopWidth="1px" borderColor="var(--admin-border)">
              {loadingChats && lista.length === 0 ? (
                <HStack justify="center" py={8}>
                  <Spinner size="sm" />
                </HStack>
              ) : lista.length === 0 ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center" py={8} px={4}>
                  {busca.trim()
                    ? "Nada encontrado."
                    : vista === "grupos"
                      ? "Nenhum grupo por aqui."
                      : "Nenhuma conversa ainda."}
                </Text>
              ) : (
                lista.map((c) => (
                  <ChatRow
                    key={c.chatId}
                    chat={c}
                    active={false}
                    assistantName={assistantName}
                    onOpen={(id) => void abrirConversa(id)}
                    onToggleFavorito={() => {}}
                  />
                ))
              )}
            </Box>
          </>
        )}
      </Flex>
    </>
  );
}

function SeletorBotao({
  ativo,
  onClick,
  icon,
  label,
  count,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <HStack
      as="button"
      onClick={onClick}
      flex={1}
      justify="center"
      gap={1.5}
      px={2}
      py={1.5}
      borderRadius="9px"
      cursor="pointer"
      bg={ativo ? "var(--admin-nav-active)" : "transparent"}
      color={ativo ? "var(--admin-primary)" : "var(--admin-text-soft)"}
      _hover={{ bg: ativo ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
    >
      {icon}
      <Text fontSize="12px" fontWeight={ativo ? "700" : "500"}>
        {label}
      </Text>
      {count > 0 ? (
        <Text fontSize="10px" fontWeight="700" opacity={0.75}>
          {count}
        </Text>
      ) : null}
    </HStack>
  );
}
