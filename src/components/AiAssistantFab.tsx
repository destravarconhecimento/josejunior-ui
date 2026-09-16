"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, HStack, Image, Spinner, Stack, Text, Textarea, chakra } from "@chakra-ui/react";
import {
  Sparkles,
  X,
  Send,
  Paperclip,
  Loader2,
  Maximize2,
  PanelRight,
  PictureInPicture2,
} from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";
import { useAiChat } from "./ai/useAiChat";
import {
  useFabAcoplado,
  useFabDock,
  useFabModo,
  setFabOpen,
  FAB_BASE,
  FAB_LATERAL_W,
  FAB_SIZE,
} from "./fab/dock";

/** Link do Next com as props de estilo do Chakra (o botão de expandir). */
const ChakraLink = chakra(Link);

/**
 * Assistente FLUTUANTE do painel (FAB): botão arrastável que abre um chat com a
 * IA, e a IA OPERA o painel via tools no endpoint `chatEndpoint`. Componente ÚNICO
 * e centralizado — usado no `apps/site` (tenant) e no `apps/sistema`. O que muda
 * por app são as props (endpoint, upload, persistência de histórico).
 *
 * O miolo do chat (estado/envio/anexo/persistência) mora em `ai/useAiChat` —
 * o mesmo do `AiAssistantConsole` (a tela cheia), pra que "expandir" continue a
 * MESMA conversa e as duas superfícies não divirjam.
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
  /** Rota do console de tela cheia. Presente = mostra o botão de expandir. */
  expandHref,
  /** Chave do sessionStorage: guarda a conversa e a leva pro console ao expandir. */
  storageKey,
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
  expandHref?: string;
  storageKey?: string;
  accent?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chat = useAiChat({ chatEndpoint, uploadEndpoint, uploadFolder, sendHistory, storageKey, path: pathname });
  const { messages, setMessages, input, setInput, loading, error, attachment, setAttachment, uploading, pickImage, send, canSend, scrollRef, scrollToEnd, restored } = chat;
  const fileRef = useRef<HTMLInputElement>(null);

  // Dock partilhado: empilha os FABs e garante que só um painel abre de cada vez.
  const wantShow = !hideOnPaths.includes(pathname);
  const { bottom, lado, othersOpen, arrastoProps, arrastando, arrastou } = useFabDock("ai", wantShow);
  const { style: arrastoStyle, ...arrastoHandlers } = arrastoProps;

  // Flutuante (janelinha no canto) × lateral (encostado na direita, altura
  // inteira). A escolha fica guardada — ver `useFabModo`.
  const [modo, setModo] = useFabModo("ai");
  const lateral = modo === "lateral";
  // Encostado = ACOPLADO: a página encolhe pela direita em vez de ficar tapada.
  // A condição espelha o que de facto aparece na tela (`hidden` logo abaixo) —
  // reservar espaço pra um painel escondido deixaria um vão vazio.
  useFabAcoplado("ai", lateral && open && wantShow && !othersOpen);

  // Espelha o estado de aberto no dock e recua se o irmão (WhatsApp) abrir.
  useEffect(() => setFabOpen("ai", open), [open]);
  useEffect(() => {
    if (othersOpen && open) setOpen(false);
  }, [othersOpen, open]);

  useEffect(() => {
    const openFab = () => setOpen(true);
    window.addEventListener("ai-fab:open", openFab);
    return () => window.removeEventListener("ai-fab:open", openFab);
  }, []);

  const hidden = !wantShow || othersOpen;

  // Só busca o histórico do servidor se não houver conversa restaurada — no
  // sistema o GET devolve vazio de propósito (stateless), e sobrescrever aqui
  // apagaria a conversa que veio do sessionStorage.
  useEffect(() => {
    if (!open || historyLoaded || !restored) return;
    setHistoryLoaded(true);
    if (messages.length) return;
    fetch(chatEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { messages?: { role: "user" | "assistant"; content: string }[] } | null) => {
        if (d?.messages?.length) setMessages(d.messages.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => {});
  }, [open, historyLoaded, restored, messages.length, chatEndpoint, setMessages]);

  useEffect(() => {
    if (!open) return;
    scrollToEnd();
  }, [open, messages, loading, scrollToEnd]);

  if (hidden) return null;

  // O botão redondo só existe com o painel FECHADO: quem abriu fecha pelo X do
  // topo. Antes ele virava um "X" por cima da janela e disputava o canto com ela.
  if (!open) {
    return (
      <chakra.button
        type="button"
        // Arrastar não pode abrir o chat: `arrastou()` diz se este clique é o
        // fim de um arrasto (ver o dock).
        onClick={() => {
          if (arrastou()) return;
          setOpen(true);
        }}
        position="fixed"
        data-jj-fab=""
        {...arrastoHandlers}
        style={{ background: accent, boxShadow: "0 8px 22px rgba(7,26,51,0.28)", ...arrastoStyle }}
        bottom={`${bottom}px`}
        left={lado === "esq" ? `${FAB_BASE}px` : undefined}
        right={lado === "dir" ? `${FAB_BASE}px` : undefined}
        zIndex={1400}
        w={`${FAB_SIZE}px`}
        h={`${FAB_SIZE}px`}
        borderRadius="full"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        color="white"
        _hover={arrastando ? undefined : { transform: "scale(1.06)" }}
        transition={arrastando ? "none" : "transform .15s, bottom .18s ease"}
        aria-label={`Falar com ${title} (arraste pra mudar de canto)`}
        title={`${title} — arraste pra mudar de canto`}
      >
        <Sparkles size={16} />
      </chakra.button>
    );
  }

  // Uma moldura, dois formatos. As MESMAS chaves nos dois ramos — assim o objeto
  // tem um tipo só e entra no `Box` sem ginástica de tipos.
  const moldura = {
    top: lateral ? "0px" : undefined,
    // O botão SOME quando o painel abre, então o painel ocupa o lugar dele —
    // é o que faz a janelinha acompanhar o dock arrastado.
    bottom: lateral ? "0px" : `${bottom}px`,
    // Flutuante abre pro MESMO lado em que o dock está encostado — o balão
    // saindo do lado oposto ao botão é o que fazia ele tapar a tabela.
    // Encostado (`lateral`) é sempre à direita: é o lado que o `--jj-fab-dock`
    // reserva no shell.
    left: lateral || lado === "dir" ? undefined : `${FAB_BASE}px`,
    right: lateral ? "0px" : lado === "dir" ? `${FAB_BASE}px` : undefined,
    w: lateral
      ? { base: "100vw", sm: `min(${FAB_LATERAL_W}px, 100vw)` }
      : { base: "calc(100vw - 32px)", sm: "400px" },
    h: lateral ? undefined : { base: "70vh", sm: "560px" },
    maxH: lateral ? undefined : "calc(100vh - 120px)",
    borderRadius: lateral ? "0" : "18px",
    boxShadow: lateral ? "-18px 0 44px rgba(17,12,40,0.16)" : "0 24px 60px rgba(17,12,40,0.22)",
  };

  /** Os três botõezinhos do cabeçalho (encostar · tela cheia · fechar). */
  const botaoTopo = {
    flexShrink: 0,
    w: "30px",
    h: "30px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    opacity: 0.85,
    _hover: { opacity: 1, bg: "rgba(255,255,255,0.18)" },
    transition: "opacity .15s, background .15s",
  } as const;

  return (
    <Box
      position="fixed"
      data-jj-fab=""
      {...moldura}
      zIndex={1400}
      bg="white"
      border="1px solid var(--admin-border)"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box px={5} py={3.5} style={{ background: accent }} color="white" flexShrink={0}>
        <HStack gap={2} justify="space-between" align="flex-start">
          <Box>
            <HStack gap={2}>
              <Sparkles size={18} />
              <Text fontWeight="700">{title}</Text>
            </HStack>
            <Text fontSize="xs" opacity={0.9} mt={0.5}>{subtitle}</Text>
          </Box>
          <HStack gap={0.5} flexShrink={0} mt={-1} mr={-1.5}>
            <chakra.button
              type="button"
              onClick={() => setModo(lateral ? "flutuante" : "lateral")}
              aria-label={lateral ? "Voltar pro balão" : "Encostar na lateral"}
              title={lateral ? "Voltar pro balão" : "Encostar na lateral"}
              {...botaoTopo}
            >
              {lateral ? <PictureInPicture2 size={15} /> : <PanelRight size={15} />}
            </chakra.button>
            {expandHref && (
              <ChakraLink
                href={expandHref}
                aria-label="Abrir em tela cheia"
                title="Abrir em tela cheia"
                {...botaoTopo}
              >
                <Maximize2 size={15} />
              </ChakraLink>
            )}
            <chakra.button type="button" onClick={() => setOpen(false)} aria-label="Fechar" title="Fechar" {...botaoTopo}>
              <X size={16} />
            </chakra.button>
          </HStack>
        </HStack>
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
            disabled={loading || !canSend}
            w="42px"
            h="42px"
            flexShrink={0}
            borderRadius="10px"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            style={{ background: accent, opacity: loading || !canSend ? 0.5 : 1 }}
            _hover={{ opacity: 0.92 }}
            aria-label="Enviar"
          >
            <Send size={18} />
          </chakra.button>
        </HStack>
      </Box>
    </Box>
  );
}
