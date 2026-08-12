"use client";

import { useEffect, useRef } from "react";
import { Box, HStack, Spinner, Stack, Text, Textarea, chakra } from "@chakra-ui/react";
import { Eraser, Send, Sparkles, X } from "lucide-react";
import { ChatMarkdown } from "../ChatMarkdown";
import { useAiChat } from "../ai/useAiChat";
import { useFabSuppress } from "../fab/dock";

/**
 * IA DA CAIXA — chat encostado na direita da tela de e-mail.
 *
 * É o MESMO assistente do painel (mesmo endpoint, mesmas ferramentas): o que
 * muda é que ele sabe onde está. O `detalhe` (caixa aberta, conta, e-mail
 * selecionado) viaja na última mensagem do usuário, então a IA responde sobre o
 * que está na tela — "resuma este", "responda agradecendo", "isso é spam?" —
 * sem o José ter que descrever nada.
 *
 * Enquanto aberto, os FABs (WhatsApp e assistente) SOMEM (`useFabSuppress`):
 * dois chats no mesmo canto seria só confusão.
 */

export type MailAiChatConfig = {
  /** Endpoint do assistente (POST {text, context, history?}). Ex.: "/api/ops-chat". */
  endpoint: string;
  /** Upload de imagem (FormData `file`). Ausente = sem anexo. */
  uploadEndpoint?: string;
  /** Manda o histórico no POST (servidor stateless). */
  sendHistory?: boolean;
  /** Chave do sessionStorage — mantém a conversa ao navegar/recarregar. */
  storageKey?: string;
  /** Título do painel (padrão "IA do e-mail"). */
  title?: string;
};

const SUGESTOES = [
  "Resuma os e-mails não lidos desta caixa",
  "Quem está esperando resposta minha?",
  "Escreva uma resposta para o e-mail aberto",
  "Este remetente é spam?",
];

export function MailAiPanel({
  config,
  detalhe,
  onClose,
}: {
  config: MailAiChatConfig;
  /** O que a tela mostra agora — vai pra IA junto da pergunta. */
  detalhe: string;
  onClose: () => void;
}) {
  const chat = useAiChat({
    chatEndpoint: config.endpoint,
    uploadEndpoint: config.uploadEndpoint,
    uploadFolder: "email-ia/anexos",
    sendHistory: config.sendHistory,
    storageKey: config.storageKey ?? "jj:email-ia",
    path: "/email",
    detail: detalhe,
  });
  const { messages, input, setInput, loading, error, send, canSend, clear, scrollRef, scrollToEnd } = chat;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Chat da tela aberto → nenhum FAB no canto (nem WhatsApp, nem assistente).
  useFabSuppress(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollToEnd();
  }, [messages, loading, scrollToEnd]);

  return (
    <Stack
      w={{ base: "100%", md: "360px", xl: "400px" }}
      flexShrink={0}
      minH={{ base: "460px", md: 0 }}
      gap={0}
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="16px"
      overflow="hidden"
      bg="var(--admin-surface)"
    >
      <HStack
        px={4}
        py={3}
        gap={2}
        justify="space-between"
        flexShrink={0}
        bg="var(--admin-primary)"
        color="white"
      >
        <HStack gap={2} minW={0}>
          <Sparkles size={16} />
          <Stack gap={0} minW={0}>
            <Text fontWeight="700" fontSize="sm" truncate>
              {config.title ?? "IA do e-mail"}
            </Text>
            <Text fontSize="2xs" opacity={0.85} truncate>
              Vê a caixa aberta e opera o painel
            </Text>
          </Stack>
        </HStack>
        <HStack gap={0.5} flexShrink={0}>
          {messages.length ? (
            <chakra.button
              type="button"
              onClick={clear}
              aria-label="Limpar conversa"
              title="Limpar conversa"
              w="28px"
              h="28px"
              borderRadius="8px"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              opacity={0.85}
              _hover={{ opacity: 1, bg: "rgba(255,255,255,0.18)" }}
            >
              <Eraser size={14} />
            </chakra.button>
          ) : null}
          <chakra.button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            w="28px"
            h="28px"
            borderRadius="8px"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            opacity={0.85}
            _hover={{ opacity: 1, bg: "rgba(255,255,255,0.18)" }}
          >
            <X size={16} />
          </chakra.button>
        </HStack>
      </HStack>

      <Stack ref={scrollRef} flex="1" minH={0} overflowY="auto" p={3.5} gap={3} bg="var(--admin-surface-2)">
        {messages.length === 0 && !loading ? (
          <Stack gap={2}>
            <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.6">
              Peça em português. Eu leio a caixa, resumo, classifico, marco spam e escrevo
              respostas — e o que estiver aberto na tela eu já estou vendo.
            </Text>
            {SUGESTOES.map((s) => (
              <chakra.button
                key={s}
                type="button"
                onClick={() => void send(s)}
                textAlign="left"
                px={3}
                py={2}
                borderRadius="10px"
                borderWidth="1px"
                borderColor="var(--admin-border)"
                bg="var(--admin-surface)"
                fontSize="xs"
                color="var(--admin-text)"
                _hover={{ borderColor: "var(--admin-primary)", color: "var(--admin-primary)" }}
              >
                {s}
              </chakra.button>
            ))}
          </Stack>
        ) : null}
        {messages.map((m, i) => (
          <Box
            key={i}
            alignSelf={m.role === "user" ? "flex-end" : "flex-start"}
            maxW="92%"
            px={3}
            py={2}
            borderRadius="12px"
            fontSize="sm"
            bg={m.role === "user" ? "var(--admin-primary)" : "var(--admin-surface)"}
            color={m.role === "user" ? "white" : "var(--admin-text)"}
            borderWidth={m.role === "user" ? "0" : "1px"}
            borderColor="var(--admin-border)"
            css={{ "& img": { maxWidth: "100%", borderRadius: 8, marginTop: 6 } }}
          >
            <ChatMarkdown>{m.content}</ChatMarkdown>
          </Box>
        ))}
        {loading ? (
          <HStack alignSelf="flex-start" gap={2} color="var(--admin-text-soft)" fontSize="xs">
            <Spinner size="sm" /> <Text>pensando…</Text>
          </HStack>
        ) : null}
      </Stack>

      {error ? (
        <Box bg="rgba(220,38,38,0.06)" borderTopWidth="1px" borderColor="rgba(220,38,38,0.2)" px={3.5} py={2} flexShrink={0}>
          <Text color="#b91c1c" fontSize="xs">{error}</Text>
        </Box>
      ) : null}

      <HStack
        gap={2}
        align="flex-end"
        p={3}
        flexShrink={0}
        borderTopWidth="1px"
        borderColor="var(--admin-border)"
        bg="var(--admin-surface)"
      >
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Pergunte sobre a caixa…"
          rows={2}
          resize="none"
          bg="var(--admin-surface)"
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
          w="40px"
          h="40px"
          flexShrink={0}
          borderRadius="10px"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          bg="var(--admin-primary)"
          opacity={loading || !canSend ? 0.5 : 1}
          _hover={{ opacity: loading || !canSend ? 0.5 : 0.92 }}
          aria-label="Enviar"
        >
          <Send size={16} />
        </chakra.button>
      </HStack>
    </Stack>
  );
}
