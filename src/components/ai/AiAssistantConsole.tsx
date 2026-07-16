"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Box, HStack, Image, Spinner, Stack, Text, Textarea, chakra } from "@chakra-ui/react";
import { Sparkles, X, Send, Paperclip, Loader2, Plus, User } from "lucide-react";
import { ChatMarkdown } from "../ChatMarkdown";
import { useAiChat } from "./useAiChat";

export type AiConsoleSuggestion = { titulo: string; prompt: string };

/**
 * CONSOLE do assistente — o chat em tela cheia (a versão "expandida" do FAB).
 *
 * Componente PURO do design-system: recebe endpoints/textos por props e não sabe
 * de que app veio. Divide o miolo com o `AiAssistantFab` via `useAiChat`, então a
 * conversa iniciada no FAB continua aqui (mesmo `storageKey`) e o comportamento
 * de envio/anexo é literalmente o mesmo código.
 */
export function AiAssistantConsole({
  title = "Assistente",
  subtitle = "Peça qualquer coisa — eu opero o painel pra você.",
  greeting = "Por onde começamos?",
  suggestions = [],
  chatEndpoint = "/api/ops-chat",
  uploadEndpoint,
  uploadFolder = "ops-chat/anexos",
  sendHistory = false,
  storageKey,
  accent = "var(--admin-primary)",
}: {
  title?: string;
  subtitle?: string;
  greeting?: string;
  /** Cartões de partida (some depois da 1ª mensagem). */
  suggestions?: AiConsoleSuggestion[];
  chatEndpoint?: string;
  uploadEndpoint?: string;
  uploadFolder?: string;
  sendHistory?: boolean;
  storageKey?: string;
  accent?: string;
}) {
  const pathname = usePathname();
  const chat = useAiChat({ chatEndpoint, uploadEndpoint, uploadFolder, sendHistory, storageKey, path: pathname });
  const { messages, input, setInput, loading, error, attachment, setAttachment, uploading, pickImage, send, clear, canSend, scrollRef, scrollToEnd } = chat;
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToEnd();
  }, [messages, loading, scrollToEnd]);

  // Textarea cresce com o texto (até um teto) — escrever o corpo de um e-mail
  // numa caixa de 2 linhas é sofrimento.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const vazio = messages.length === 0 && !loading;

  return (
    <Box display="flex" flexDirection="column" h="calc(100vh - 140px)" minH="480px">
      <HStack justify="space-between" align="center" pb={3} flexShrink={0}>
        <HStack gap={2.5}>
          <Box w="34px" h="34px" borderRadius="10px" display="inline-flex" alignItems="center" justifyContent="center" color="white" style={{ background: accent }}>
            <Sparkles size={17} />
          </Box>
          <Box>
            <Text fontWeight="700" fontSize="md" color="var(--admin-text)" lineHeight="1.2">{title}</Text>
            <Text fontSize="xs" color="var(--admin-text-soft)">{subtitle}</Text>
          </Box>
        </HStack>
        {messages.length > 0 && (
          <chakra.button
            type="button"
            onClick={clear}
            px={3}
            h="34px"
            borderRadius="9px"
            border="1px solid var(--admin-border)"
            color="var(--admin-text-soft)"
            fontSize="sm"
            fontWeight="600"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            _hover={{ bg: "var(--admin-nav-hover)", color: "var(--admin-primary)" }}
            aria-label="Nova conversa"
          >
            <Plus size={15} /> Nova conversa
          </chakra.button>
        )}
      </HStack>

      <Box
        flex={1}
        minH={0}
        display="flex"
        flexDirection="column"
        bg="var(--admin-surface, white)"
        border="1px solid var(--admin-border)"
        borderRadius="16px"
        overflow="hidden"
      >
        <Stack ref={scrollRef} flex={1} overflowY="auto" px={{ base: 4, md: 6 }} py={5} gap={5} bg="var(--admin-surface-2, #f7f8fa)">
          {vazio ? (
            <Stack gap={5} m="auto" w="100%" maxW="720px" textAlign="center" py={6}>
              <Box>
                <Box w="52px" h="52px" mx="auto" mb={3} borderRadius="14px" display="inline-flex" alignItems="center" justifyContent="center" color="white" style={{ background: accent }}>
                  <Sparkles size={26} />
                </Box>
                <Text fontSize="xl" fontWeight="800" color="var(--admin-text)">{greeting}</Text>
                <Text fontSize="sm" color="var(--admin-text-soft)" mt={1}>{subtitle}</Text>
              </Box>
              {suggestions.length > 0 && (
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} textAlign="left">
                  {suggestions.map((s) => (
                    <chakra.button
                      key={s.titulo}
                      type="button"
                      onClick={() => void send(s.prompt)}
                      p={3.5}
                      bg="var(--admin-surface, white)"
                      border="1px solid var(--admin-border)"
                      borderRadius="12px"
                      textAlign="left"
                      transition="border-color .15s, transform .15s"
                      _hover={{ borderColor: "var(--admin-primary)", transform: "translateY(-1px)" }}
                    >
                      <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" mb={0.5}>{s.titulo}</Text>
                      <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.5">{s.prompt}</Text>
                    </chakra.button>
                  ))}
                </Box>
              )}
            </Stack>
          ) : (
            <Stack gap={5} w="100%" maxW="820px" mx="auto">
              {messages.map((m, i) => (
                <HStack key={i} align="flex-start" gap={3}>
                  <Box
                    w="30px"
                    h="30px"
                    flexShrink={0}
                    mt={0.5}
                    borderRadius="8px"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    color={m.role === "user" ? "var(--admin-text-soft)" : "white"}
                    border={m.role === "user" ? "1px solid var(--admin-border)" : "none"}
                    style={m.role === "user" ? undefined : { background: accent }}
                  >
                    {m.role === "user" ? <User size={15} /> : <Sparkles size={15} />}
                  </Box>
                  <Box
                    flex={1}
                    minW={0}
                    fontSize="sm"
                    color="var(--admin-text)"
                    bg={m.role === "user" ? "transparent" : "var(--admin-surface, white)"}
                    border={m.role === "user" ? "none" : "1px solid var(--admin-border)"}
                    borderRadius="12px"
                    px={m.role === "user" ? 0 : 4}
                    py={m.role === "user" ? 0.5 : 3}
                    css={{ "& img": { maxWidth: "100%", borderRadius: 10, marginTop: 8 } }}
                  >
                    <ChatMarkdown>{m.content}</ChatMarkdown>
                  </Box>
                </HStack>
              ))}
              {loading && (
                <HStack gap={3} color="var(--admin-text-soft)" fontSize="sm">
                  <Box w="30px" h="30px" flexShrink={0} borderRadius="8px" display="inline-flex" alignItems="center" justifyContent="center" color="white" style={{ background: accent }}>
                    <Sparkles size={15} />
                  </Box>
                  <HStack gap={2}><Spinner size="sm" /> <Text>{title} está trabalhando…</Text></HStack>
                </HStack>
              )}
            </Stack>
          )}
        </Stack>

        {error && (
          <Box bg="rgba(220,38,38,0.06)" borderTop="1px solid rgba(220,38,38,0.2)" px={5} py={2.5} flexShrink={0}>
            <Text color="red.700" fontSize="xs">{error}</Text>
          </Box>
        )}

        <Box borderTop="1px solid var(--admin-border)" p={{ base: 3, md: 4 }} flexShrink={0} bg="var(--admin-surface, white)">
          <Box w="100%" maxW="820px" mx="auto">
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
                    w="44px"
                    h="44px"
                    flexShrink={0}
                    borderRadius="11px"
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
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Peça o que quiser — ex.: prospecta 15 clínicas em Divinópolis e escreve o e-mail de apresentação."
                rows={1}
                resize="none"
                minH="44px"
                maxH="200px"
                py={2.5}
                bg="var(--admin-surface, white)"
                borderColor="var(--admin-border)"
                _focus={{ borderColor: "var(--admin-primary)", boxShadow: "0 0 0 3px var(--admin-nav-active)" }}
                borderRadius="11px"
                fontSize="sm"
                css={{ "&::placeholder": { fontSize: "13px" } }}
              />
              <chakra.button
                type="button"
                onClick={() => void send()}
                disabled={loading || !canSend}
                w="44px"
                h="44px"
                flexShrink={0}
                borderRadius="11px"
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
            <Text fontSize="11px" color="var(--admin-text-soft)" mt={2} textAlign="center">
              Enter envia · Shift+Enter quebra linha. Ações que saem pra fora (campanha, publicação) são confirmadas antes.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
