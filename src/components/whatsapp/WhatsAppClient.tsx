"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Flex, HStack, Portal, SimpleGrid, Spinner, Stack, Text } from "@chakra-ui/react";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bot,
  Check,
  CheckCheck,
  FileText,
  Link2,
  Maximize2,
  MessageCircle,
  Minimize2,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Star,
  Unlink,
  Users,
} from "lucide-react";
import { Button } from "../Button";
import { Tag } from "../Badge";
import { Screen } from "../Screen";
import { EmptyState } from "../EmptyState";
import { EntityAvatar } from "../EntityAvatar";
import { ActionMenu, type ActionMenuItem } from "../ActionMenu";
import { SearchSelect, type SearchSelectOption } from "../SearchSelect";
import { Accordion, type AccordionItemDef } from "../Accordion";
import { Modal } from "../Modal";
import { ChatMarkdown } from "../ChatMarkdown";
import { Input, Textarea } from "../controls";
import { useConfirm } from "../useConfirm";
import type { UiRealtimeSubscribe } from "../realtime";

/* ============================================================
 * WhatsAppClient — super-componente PURO do WhatsApp (o "cliente
 * de e-mail", só que de WhatsApp): abre SEMPRE nas conversas,
 * categorias tipo pastas (Conversas/Grupos/Favoritos/Arquivados),
 * config e estatísticas viram BOTÃO no cabeçalho (não abas), e
 * vincular a lead/cliente puxa os dados pro painel da conversa.
 *
 * Autoria da mensagem (regra central — NUNCA inventar nome):
 *   sentBy "ia"       → nome do assistente (sentByName ?? assistantName)
 *   sentBy "painel"   → nome da PESSOA (sentByName; sem nome = silêncio)
 *   sentBy "campanha" → "Campanha"
 *   sentBy "fila"     → nome da fila (sentByName ?? "Fila de envio")
 *   sentBy "mfa"      → nome (sentByName ?? "Verificação (MFA)")
 *   sentBy "aparelho" → NADA (foi digitado no telemóvel)
 *   sentBy null       → NADA (legado)
 *
 * Zero fetch/server action aqui dentro: dados+callbacks por props,
 * IDs sempre STRING. Config chega pronta via `configSlots` (QR,
 * agente, fila, pacing… já existem nos apps — não são recriados aqui).
 * ============================================================ */

/**
 * `talvezEnviada` só existe na falha de ENVIO: quando o gateway estoura o
 * tempo, a mensagem pode ter saído mesmo assim (o pipeline dele é síncrono e
 * legitimamente lento). A UI então CONFERE o fio antes de desfazer a bolha —
 * sem isso, a pessoa reenviava e o contato recebia em dobro.
 */
export type WhatsAppResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; talvezEnviada?: boolean };

/** Quem mandou — espelha o servidor-whats (contrato v2.2.4). */
export type WhatsAppSentBy = "ia" | "painel" | "campanha" | "fila" | "mfa" | "aparelho" | null;

export type WhatsAppVinculoLead = {
  kind: "lead";
  id: string;
  nome: string;
  empresa?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: string | null;
};

export type WhatsAppVinculoTenant = {
  kind: "tenant";
  id: string;
  nome: string;
  /**
   * Só o sistema tem slug (o tenant é uma linha em `tenants`). No painel de um
   * tenant, "Cliente" é uma pessoa do CRM dele e não tem slug nenhum — por isso
   * é opcional, e a linha "/slug" só sai quando existe mesmo.
   */
  slug?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: string | null;
};

export type WhatsAppVinculo = WhatsAppVinculoLead | WhatsAppVinculoTenant;

/** Resultado de busca (alimenta o SearchSelect de "Vincular a lead ou cliente"). */
export type WhatsAppVinculoOption = {
  /** valor único pro SearchSelect — não precisa ser o id puro. */
  value: string;
  kind: "lead" | "tenant";
  id: string;
  label: string;
  hint?: string;
};

export type WhatsAppChat = {
  chatId: string;
  peer: string;
  isGroup: boolean;
  contactName: string | null;
  savedName: string | null;
  lastBody: string;
  lastDirection: "in" | "out";
  lastType: string;
  lastAt: string | null;
  lastSentBy: WhatsAppSentBy;
  lastSentByName: string | null;
  total: number;
  /** Não lidas — ausente/0 = sem contador. */
  unreadCount?: number;
  favorito?: boolean;
  fixado?: boolean;
  arquivado?: boolean;
  /** "a escrever…" (presence) — best-effort; ausente = não mostra. */
  digitando?: boolean;
  vinculo?: WhatsAppVinculo | null;
  /** Nota interna inicial (CRM leve) — salva via `onGuardarNotas`. */
  notas?: string | null;
};

export type WhatsAppMessage = {
  id: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  type: string;
  direction: "in" | "out";
  fromMe: boolean;
  status?: string | null;
  hasMedia: boolean;
  mediaUrl: string | null;
  mediaType: string | null;
  contactName: string | null;
  savedName: string | null;
  sentBy: WhatsAppSentBy;
  sentByName: string | null;
  at: string;
};

/**
 * A mensagem que acabei de mandar já está no fio do servidor? Serve pra decidir
 * se um envio "que falhou" falhou mesmo: o gateway grava a mensagem ANTES de
 * responder, então tempo esgotado costuma ser lentidão dele, não mensagem
 * perdida. Compara texto (aparado) e janela de tempo — sem `messageId`, porque
 * quando o envio estoura o tempo o painel nunca chega a receber um.
 */
export function mensagemJaNoFio(fio: WhatsAppMessage[], texto: string, janelaMs = 5 * 60_000): boolean {
  const alvo = texto.trim();
  if (!alvo) return false;
  const agora = Date.now();
  return fio.some(
    (m) =>
      m.direction === "out" &&
      (m.body || "").trim() === alvo &&
      Math.abs(agora - new Date(m.at).getTime()) < janelaMs,
  );
}

export type WhatsAppStats = {
  conversas: number;
  grupos: number;
  mensagens: number;
  recebidas: number;
  enviadas: number;
  porAutor: { ia: number; painel: number; campanha: number; aparelho: number };
  ultimaAt: string | null;
};

/** Slot de configuração já pronto (QR, agente, fila, pacing…) injetado pelo app. */
export type WhatsAppConfigSlot = {
  id: string;
  titulo: string;
  descricao?: string;
  node: ReactNode;
};

export type WhatsAppCallbacks = {
  /** Abriu a conversa (ou recarregou) — devolve o fio completo de mensagens. */
  onSelecionar: (chatId: string) => Promise<WhatsAppResult<WhatsAppMessage[]>>;
  onResponder: (chatId: string, texto: string) => Promise<WhatsAppResult<{ messageId?: string }>>;
  /** Sobe + envia um anexo (imagem/vídeo/áudio/documento) pela conversa. */
  onEnviarAnexo: (chatId: string, file: File) => Promise<WhatsAppResult>;
  onFavoritar: (chatId: string, favorito: boolean) => Promise<WhatsAppResult>;
  onArquivar: (chatId: string, arquivado: boolean) => Promise<WhatsAppResult>;
  onFixar: (chatId: string, fixado: boolean) => Promise<WhatsAppResult>;
  /** Busca leads/clientes por termo — alimenta o SearchSelect de vínculo. */
  onProcurarVinculo: (termo: string) => Promise<WhatsAppVinculoOption[]>;
  onVincularLead: (chatId: string, leadId: string) => Promise<WhatsAppResult>;
  onVincularTenant: (chatId: string, tenantId: string) => Promise<WhatsAppResult>;
  onDesvincular: (chatId: string) => Promise<WhatsAppResult>;
  onGuardarNotas?: (chatId: string, notas: string) => Promise<WhatsAppResult>;
  /** Recarrega a lista de conversas (ex.: router.refresh no app). */
  onActualizar: () => void;
  onCarregarStats: () => Promise<WhatsAppResult<WhatsAppStats>>;
  /**
   * Inicia conversa com um número novo. Pede TEXTO também porque no WhatsApp não
   * existe "abrir conversa vazia": a conversa nasce da primeira mensagem enviada.
   * Devolve o `chatId` pra tela abrir o fio logo a seguir. Sem esta callback o
   * botão "Nova conversa" nem aparece (ex.: tela só de leitura).
   *
   * `nome` é OPCIONAL de propósito: é só como o painel passa a chamar o contacto
   * enquanto o WhatsApp não devolve o `pushName` dele (número novo ainda não tem
   * nome nenhum). Vazio = fica o número, e o nome real entra quando chegar.
   */
  onNovaConversa?: (
    numeroDigits: string,
    texto: string,
    nome?: string,
  ) => Promise<WhatsAppResult<{ chatId: string }>>;
};

export type WhatsAppClientProps = {
  title?: string;
  /** Linha de apoio do cabeçalho (a moldura `Screen` é DESTE componente). */
  subtitle?: ReactNode;
  connected: boolean;
  phone?: string | null;
  chats: WhatsAppChat[];
  /** Carregando a lista de conversas (spinner leve sobre a coluna 2). */
  loadingChats?: boolean;
  /** Nome padrão do assistente IA (fallback quando sentByName vier vazio). */
  assistantName?: string;
  /** Slots de configuração já prontos (QR, agente, fila, pacing…). */
  configSlots?: WhatsAppConfigSlot[];
  callbacks: WhatsAppCallbacks;
  /**
   * TEMPO REAL por injeção (opcional): `(aviso) => cancelar`. Quando vem, o fio
   * aberto recarrega no instante em que uma mensagem entra/sai, e o ciclo de 4s
   * afrouxa pra 20s (rede de segurança). Sem ela, nada muda: 4s como sempre.
   */
  onRealtime?: UiRealtimeSubscribe;
};

/* ── Constantes visuais (identidade real do WhatsApp) ───────── */

export const WA_CREAM = "#efeae2";
export const WA_DOODLE =
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

/* ── Helpers ─────────────────────────────────────────────────── */

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

export function displayName(chat: WhatsAppChat): string {
  return chat.savedName?.trim() || chat.contactName?.trim() || (chat.isGroup ? "Grupo" : fmtPhone(chat.peer));
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "agora" | "14:32" | "ontem" | "12/07" — pro snippet da lista. */
function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "agora";
  if (d.toDateString() === now.toDateString()) return fmtTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** "Hoje" | "Ontem" | "12 de julho" — separador de dia no fio de mensagens. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function groupByDay<T extends { at: string }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const m of items) {
    const label = dayLabel(m.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

/** Rótulo de autoria (regra central) — usado na lista E nas bolhas, sem inventar nomes. */
function authorLabel(
  m: { sentBy: WhatsAppSentBy; sentByName: string | null },
  assistantName?: string,
): string | null {
  const name = m.sentByName?.trim() || null;
  switch (m.sentBy) {
    case "ia":
      return name || assistantName?.trim() || "Assistente IA";
    case "painel":
      return name;
    case "campanha":
      return "Campanha";
    case "fila":
      return name || "Fila de envio";
    case "mfa":
      return name || "Verificação (MFA)";
    case "aparelho":
      return null; // foi digitado no telemóvel — silêncio, de propósito
    case null:
    default:
      return null;
  }
}

function resolveMediaKind(m: Pick<WhatsAppMessage, "mediaType" | "type">): string {
  return (m.mediaType || m.type || "").toLowerCase();
}

export type UiMessage = WhatsAppMessage & { pendingLocal?: boolean };

/* ============================================================
 * Subcomponentes
 * ============================================================ */

function CategoryButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <HStack
      as="button"
      onClick={onClick}
      w="100%"
      justify="space-between"
      px={3}
      py={2}
      borderRadius="10px"
      cursor="pointer"
      bg={active ? "var(--admin-nav-active)" : "transparent"}
      color={active ? "var(--admin-primary)" : "var(--admin-text)"}
      _hover={{ bg: active ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
    >
      <HStack gap={2}>
        {icon}
        <Text fontSize="sm" fontWeight={active ? "700" : "500"}>
          {label}
        </Text>
      </HStack>
      {count > 0 ? (
        <Text
          fontSize="11px"
          fontWeight="700"
          color="var(--admin-text-soft)"
          bg="var(--admin-surface)"
          borderRadius="full"
          px={2}
          py="1px"
        >
          {count}
        </Text>
      ) : null}
    </HStack>
  );
}

export function ChatRow({
  chat,
  active,
  busy,
  assistantName,
  onOpen,
  onToggleFavorito,
}: {
  chat: WhatsAppChat;
  active: boolean;
  busy?: boolean;
  assistantName?: string;
  onOpen: (chatId: string) => void;
  onToggleFavorito: (chat: WhatsAppChat) => void;
}) {
  const name = displayName(chat);
  const time = fmtRelative(chat.lastAt);
  const prefix = (() => {
    if (chat.lastDirection !== "out") {
      return chat.isGroup && chat.contactName ? `${chat.contactName}: ` : "";
    }
    const label = authorLabel({ sentBy: chat.lastSentBy, sentByName: chat.lastSentByName }, assistantName);
    return label ? `${label}: ` : "";
  })();
  const snippet = chat.lastBody?.trim() || MEDIA_LABEL[chat.lastType] || (chat.lastType ? "📎 mídia" : "");

  return (
    <Box
      onClick={() => onOpen(chat.chatId)}
      cursor="pointer"
      px={3}
      py={2.5}
      borderBottomWidth="1px"
      borderColor="var(--admin-border)"
      bg={active ? "var(--admin-nav-active)" : "transparent"}
      _hover={{ bg: active ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
    >
      <HStack gap={2.5} align="flex-start">
        <EntityAvatar name={name} size="sm" />
        <Stack gap={0} flex={1} minW={0}>
          <HStack justify="space-between" gap={2}>
            <HStack gap={1} minW={0}>
              {chat.fixado ? <Pin size={11} color="var(--admin-text-soft)" style={{ flexShrink: 0 }} /> : null}
              {chat.isGroup ? <Users size={12} color="var(--admin-text-soft)" style={{ flexShrink: 0 }} /> : null}
              <Text fontSize="sm" fontWeight={chat.unreadCount ? "800" : "600"} lineClamp={1}>
                {name}
              </Text>
            </HStack>
            <Text fontSize="10px" color="var(--admin-text-soft)" flexShrink={0}>
              {time}
            </Text>
          </HStack>
          <HStack justify="space-between" gap={2}>
            <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1} flex={1}>
              {chat.digitando ? <Box as="span" color="#25a35a" fontWeight="600">a escrever…</Box> : `${prefix}${snippet}`}
            </Text>
            {chat.unreadCount ? (
              <Box
                bg="#25d366"
                color="white"
                borderRadius="full"
                minW="18px"
                textAlign="center"
                px={1.5}
                fontSize="10px"
                fontWeight="700"
                flexShrink={0}
              >
                {chat.unreadCount}
              </Box>
            ) : null}
          </HStack>
        </Stack>
        <Box
          as="button"
          aria-label={chat.favorito ? "Desfavoritar" : "Favoritar"}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleFavorito(chat);
          }}
          color={chat.favorito ? "#eab308" : "var(--admin-text-soft)"}
          mt="2px"
          opacity={busy ? 0.5 : 1}
          flexShrink={0}
        >
          <Star size={15} fill={chat.favorito ? "#eab308" : "none"} />
        </Box>
      </HStack>
    </Box>
  );
}

function LinkedCard({
  vinculo,
  onUnlink,
  busy,
}: {
  vinculo: WhatsAppVinculo;
  onUnlink: () => void;
  busy: boolean;
}) {
  const isLead = vinculo.kind === "lead";
  return (
    <Box borderWidth="1px" borderColor="var(--admin-border)" borderRadius="12px" p={3} bg="var(--admin-surface-2)">
      <HStack justify="space-between" mb={1.5}>
        <Tag
          bg={isLead ? "rgba(59,130,246,0.14)" : "rgba(124,110,224,0.14)"}
          color={isLead ? "#1d4ed8" : "#6d28d9"}
        >
          {isLead ? "Lead" : "Cliente"}
        </Tag>
        <Button size="xs" tone="ghost" onClick={onUnlink} loading={busy}>
          <Unlink size={13} style={{ marginRight: 4 }} /> Desvincular
        </Button>
      </HStack>
      <Text fontWeight="700" fontSize="sm" color="var(--admin-text)">
        {vinculo.nome}
      </Text>
      {!isLead && vinculo.slug ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          /{vinculo.slug}
        </Text>
      ) : null}
      {isLead && vinculo.empresa ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {vinculo.empresa}
        </Text>
      ) : null}
      {vinculo.email ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {vinculo.email}
        </Text>
      ) : null}
      {vinculo.telefone ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {vinculo.telefone}
        </Text>
      ) : null}
      {vinculo.status ? (
        <Box mt={1}>
          <Tag>{vinculo.status}</Tag>
        </Box>
      ) : null}
    </Box>
  );
}

function StatusTicks({ status }: { status?: string | null }) {
  const s = (status || "").toLowerCase();
  if (!s) return null;
  if (s.includes("read") || s.includes("lida")) return <CheckCheck size={13} color="#53bdeb" />;
  if (s.includes("deliver") || s.includes("entreg")) return <CheckCheck size={13} color={WA_META} />;
  if (s.includes("sent") || s.includes("enviad")) return <Check size={13} color={WA_META} />;
  return null;
}

function renderMedia(m: UiMessage): ReactNode {
  if (!m.hasMedia) return null;
  const kind = resolveMediaKind(m);
  if (!m.mediaUrl) {
    return (
      <Text fontSize="sm" color={WA_META} fontStyle="italic" mb={m.body ? 1 : 0}>
        {MEDIA_LABEL[kind] || "📎 Mídia indisponível"}
      </Text>
    );
  }
  if (kind.includes("image") || kind === "sticker") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.mediaUrl} alt="mídia" style={{ maxWidth: 240, borderRadius: 6, marginBottom: m.body ? 6 : 0, display: "block" }} />;
  }
  if (kind.includes("video")) {
    return (
      <video src={m.mediaUrl} controls style={{ maxWidth: 260, borderRadius: 6, marginBottom: m.body ? 6 : 0, display: "block" }} />
    );
  }
  if (kind.includes("audio") || kind === "ptt") {
    return <audio src={m.mediaUrl} controls style={{ marginBottom: m.body ? 6 : 0 }} />;
  }
  return (
    <HStack gap={2} mb={m.body ? 1.5 : 0} bg="rgba(0,0,0,0.05)" borderRadius="8px" px={2.5} py={2}>
      <FileText size={16} />
      <a href={m.mediaUrl} target="_blank" rel="noreferrer" style={{ fontSize: "13px", textDecoration: "underline" }}>
        Abrir documento
      </a>
    </HStack>
  );
}

export function MessageBubble({
  m,
  isGroup,
  assistantName,
}: {
  m: UiMessage;
  isGroup: boolean;
  assistantName?: string;
}) {
  const isMe = m.direction === "out" || m.fromMe;
  const label = isMe ? authorLabel(m, assistantName) : null;
  const groupSender = !isMe && isGroup ? m.savedName?.trim() || m.contactName?.trim() || null : null;

  return (
    <Box
      alignSelf={isMe ? "flex-end" : "flex-start"}
      maxW="76%"
      bg={isMe ? WA_SENT : WA_RECV}
      color={WA_TEXT}
      px={2.5}
      py={1.5}
      borderRadius="8px"
      borderTopRightRadius={isMe ? "2px" : "8px"}
      borderTopLeftRadius={isMe ? "8px" : "2px"}
      boxShadow="0 1px 0.5px rgba(11,20,26,0.13)"
      opacity={m.pendingLocal ? 0.65 : 1}
    >
      {groupSender ? (
        <Text fontSize="11px" fontWeight="700" color="#0369a1" mb={0.5}>
          {groupSender}
        </Text>
      ) : null}
      {label ? (
        <HStack gap={1} mb={0.5}>
          {m.sentBy === "ia" ? <Bot size={11} color="#0369a1" /> : null}
          <Text
            fontSize="11px"
            fontWeight="700"
            color={m.sentBy === "ia" ? "#0369a1" : m.sentBy === "campanha" ? "#7c3aed" : "#111b21"}
          >
            {label}
          </Text>
        </HStack>
      ) : null}
      {renderMedia(m)}
      {m.body ? <ChatMarkdown>{m.body}</ChatMarkdown> : null}
      <HStack justify="flex-end" gap={1} mt={0.5}>
        <Text fontSize="10px" color={WA_META}>
          {m.pendingLocal ? "a enviar…" : fmtTime(m.at)}
        </Text>
        {isMe && !m.pendingLocal ? <StatusTicks status={m.status} /> : null}
      </HStack>
    </Box>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Box borderWidth="1px" borderColor="var(--admin-border)" borderRadius="12px" p={3} bg="var(--admin-surface-2)">
      <Text fontSize="20px" fontWeight="800" color="var(--admin-primary)">
        {value}
      </Text>
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {label}
      </Text>
    </Box>
  );
}

function AutorRow({ label, value }: { label: string; value: number }) {
  return (
    <HStack justify="space-between" fontSize="sm">
      <Text color="var(--admin-text-soft)">{label}</Text>
      <Text fontWeight="700">{value}</Text>
    </HStack>
  );
}

function StatsModal({
  open,
  onClose,
  onCarregarStats,
}: {
  open: boolean;
  onClose: () => void;
  onCarregarStats: () => Promise<WhatsAppResult<WhatsAppStats>>;
}) {
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setErr(null);
    void (async () => {
      const r = await onCarregarStats();
      if (!alive) return;
      setLoading(false);
      if (r.ok) setStats(r.data ?? null);
      else setErr(r.error);
    })();
    return () => {
      alive = false;
    };
  }, [open, onCarregarStats]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Estatísticas do WhatsApp"
      size="lg"
      footer={
        <Button tone="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {loading ? (
        <HStack justify="center" py={6}>
          <Spinner size="sm" />
        </HStack>
      ) : err ? (
        <Text color="red.600" fontSize="sm">
          {err}
        </Text>
      ) : stats ? (
        <Stack gap={4}>
          <SimpleGrid columns={{ base: 2, sm: 3 }} gap={3}>
            <StatTile label="Conversas" value={stats.conversas} />
            <StatTile label="Grupos" value={stats.grupos} />
            <StatTile label="Mensagens" value={stats.mensagens} />
            <StatTile label="Recebidas" value={stats.recebidas} />
            <StatTile label="Enviadas" value={stats.enviadas} />
          </SimpleGrid>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="var(--admin-text-soft)" mb={2}>
              Enviadas por origem
            </Text>
            <Stack gap={1.5}>
              <AutorRow label="IA" value={stats.porAutor.ia} />
              <AutorRow label="Painel" value={stats.porAutor.painel} />
              <AutorRow label="Campanha" value={stats.porAutor.campanha} />
              <AutorRow label="Aparelho" value={stats.porAutor.aparelho} />
            </Stack>
          </Box>
          {stats.ultimaAt ? (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Última mensagem: {new Date(stats.ultimaAt).toLocaleString("pt-BR")}
            </Text>
          ) : null}
        </Stack>
      ) : (
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Sem dados ainda.
        </Text>
      )}
    </Modal>
  );
}

function ConfigView({ slots }: { slots: WhatsAppConfigSlot[] }) {
  if (slots.length === 0) {
    return (
      <EmptyState
        icon={Settings}
        title="Nada para configurar aqui"
        description="Este número ainda não tem opções de configuração disponíveis."
      />
    );
  }
  const items: AccordionItemDef[] = slots.map((s) => ({
    value: s.id,
    title: s.titulo,
    content: (
      <Stack gap={3}>
        {s.descricao ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">
            {s.descricao}
          </Text>
        ) : null}
        {s.node}
      </Stack>
    ),
  }));
  return <Accordion items={items} multiple defaultValue={[items[0].value]} />;
}

/* ============================================================
 * ChatWorkspace — as 3 colunas (categorias · lista · conversa)
 * ============================================================ */

type Categoria = "conversas" | "grupos" | "favoritos" | "arquivados";

/* ── Nova conversa ──────────────────────────────────────────────
 * No WhatsApp não se "abre" uma conversa: ela nasce da primeira mensagem. Por
 * isso o modal pede número E texto — pedir só o número criaria uma conversa
 * fantasma na lista que o telemóvel não conhece.
 * Exportado: o `WhatsAppFab` usa o MESMO modal (uma implementação só). */
export function NovaConversaModal({
  open,
  onClose,
  onEnviar,
  onCriada,
}: {
  open: boolean;
  onClose: () => void;
  onEnviar: (numeroDigits: string, texto: string, nome?: string) => Promise<WhatsAppResult<{ chatId: string }>>;
  onCriada: (chatId: string) => void;
}) {
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Envio que MORREU por tempo esgotado pode ter saído: aqui não dá pra
  // conferir o fio (a conversa ainda não existe na lista), então o botão deixa
  // de ser "Enviar" e passa a "Fechar e conferir" — nunca um reenvio às cegas.
  const [talvez, setTalvez] = useState(false);

  const digits = onlyDigits(numero);
  // 10 = fixo BR sem DDI; abaixo disso não é número, é engano de digitação.
  // O nome NÃO entra aqui: é opcional (ver `onNovaConversa`).
  const valido = digits.length >= 10 && texto.trim().length > 0;

  useEffect(() => {
    if (open) {
      setNumero("");
      setNome("");
      setTexto("");
      setErro(null);
      setBusy(false);
      setTalvez(false);
    }
  }, [open]);

  async function enviar() {
    if (!valido || busy || talvez) return;
    setBusy(true);
    setErro(null);
    const r = await onEnviar(digits, texto.trim(), nome.trim() || undefined);
    setBusy(false);
    if (r.ok && r.data) {
      onCriada(r.data.chatId);
      return;
    }
    if (r.ok) {
      setErro("O servidor não devolveu a conversa criada.");
      return;
    }
    setErro(r.error);
    if (r.talvezEnviada) setTalvez(true);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova conversa"
      footer={
        <>
          <Button tone="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          {talvez ? (
            <Button tone="whatsapp" onClick={onClose}>
              Fechar e conferir
            </Button>
          ) : (
            <Button tone="whatsapp" onClick={() => void enviar()} loading={busy} disabled={!valido}>
              <Send size={15} style={{ marginRight: 6 }} /> Enviar
            </Button>
          )}
        </>
      }
    >
      <Stack gap={4}>
        <Stack gap={1}>
          <Text fontSize="sm" fontWeight="600" color="var(--admin-text)">
            Número (com DDI e DDD)
          </Text>
          <Input
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
              setTalvez(false); // outro destinatário = outro envio, não um reenvio
            }}
            placeholder="55 11 91234-5678"
            autoFocus
          />
          {digits ? (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Vai para {fmtPhone(digits)}
            </Text>
          ) : null}
        </Stack>
        <Stack gap={1}>
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="600" color="var(--admin-text)">
              Nome
            </Text>
            <Text fontSize="xs" color="var(--admin-text-soft)">
              opcional
            </Text>
          </HStack>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como chamar este contato" />
          <Text fontSize="xs" color="var(--admin-text-soft)">
            Só pra você achar a conversa. Assim que o WhatsApp disser o nome dele, é esse que aparece.
          </Text>
        </Stack>
        <Stack gap={1}>
          <Text fontSize="sm" fontWeight="600" color="var(--admin-text)">
            Primeira mensagem
          </Text>
          <Textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setTalvez(false); // outra mensagem = outro envio, não um reenvio
            }}
            placeholder="Escreva a mensagem que abre a conversa…"
            rows={4}
          />
        </Stack>
        {erro ? (
          <Text fontSize="sm" color="red.600">
            Erro: {erro}
          </Text>
        ) : null}
      </Stack>
    </Modal>
  );
}

function ChatWorkspace({
  chats,
  loadingChats,
  assistantName,
  callbacks,
  abrirId,
  onAbriu,
  onNovaConversa,
  onRealtime,
}: {
  chats: WhatsAppChat[];
  loadingChats?: boolean;
  assistantName?: string;
  callbacks: WhatsAppCallbacks;
  /** Pedido de abertura vindo de fora (ex.: conversa acabada de criar). */
  abrirId?: string | null;
  onAbriu?: () => void;
  onNovaConversa?: () => void;
  onRealtime?: UiRealtimeSubscribe;
}) {
  const [categoria, setCategoria] = useState<Categoria>("conversas");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [thread, setThread] = useState<WhatsAppMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadErr, setThreadErr] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<UiMessage[]>([]);
  const optSeq = useRef(0);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [linkQuery, setLinkQuery] = useState("");
  const [linkOptions, setLinkOptions] = useState<WhatsAppVinculoOption[]>([]);
  const [linkFilter, setLinkFilter] = useState<"lead" | "tenant" | null>(null);
  const [linkSearching, setLinkSearching] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(null);

  // Vínculo + notas vivem num MODAL, não num painel fixo sobre a thread: fixo,
  // eles comiam ~150px de altura entre o cabeçalho e as mensagens (e o campo de
  // notas crescia), empurrando o composer pra fora e passando o scroll pra
  // página — o oposto do que o `fill` do `Screen` promete. São dados de apoio
  // que se consultam de vez em quando; a conversa é o que a tela é.
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  const [notas, setNotas] = useState("");
  const [notasBusy, setNotasBusy] = useState(false);
  const [notasMsg, setNotasMsg] = useState<string | null>(null);

  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const { confirm, confirmDialog } = useConfirm();

  const selected = chats.find((c) => c.chatId === selectedId) ?? null;

  const counts = useMemo(() => {
    const active = chats.filter((c) => !c.arquivado);
    return {
      conversas: active.filter((c) => !c.isGroup).length,
      grupos: active.filter((c) => c.isGroup).length,
      favoritos: active.filter((c) => c.favorito).length,
      arquivados: chats.filter((c) => c.arquivado).length,
    };
  }, [chats]);

  const list = useMemo(() => {
    let base = chats;
    if (categoria === "arquivados") {
      base = base.filter((c) => c.arquivado);
    } else {
      base = base.filter((c) => !c.arquivado);
      if (categoria === "grupos") base = base.filter((c) => c.isGroup);
      else if (categoria === "favoritos") base = base.filter((c) => c.favorito);
      else base = base.filter((c) => !c.isGroup);
    }
    const term = query.trim().toLowerCase();
    if (term) {
      const digits = onlyDigits(term);
      base = base.filter((c) => {
        const n = displayName(c).toLowerCase();
        return n.includes(term) || (digits.length > 0 && onlyDigits(c.peer).includes(digits));
      });
    }
    return [...base].sort((a, b) => {
      if (!!a.fixado !== !!b.fixado) return a.fixado ? -1 : 1;
      return new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime();
    });
  }, [chats, categoria, query]);

  const applyServerThread = useCallback((serverList: WhatsAppMessage[]) => {
    setThread(serverList);
    setOptimistic((pend) => {
      if (pend.length === 0) return pend;
      const outBodies = new Set(
        serverList.filter((m) => m.direction === "out" && m.body).map((m) => m.body.trim()),
      );
      return pend.filter((p) => !outBodies.has((p.body || "").trim()));
    });
  }, []);

  const loadThread = useCallback(
    async (chatId: string) => {
      const r = await callbacks.onSelecionar(chatId);
      setThreadLoading(false);
      if (!r.ok) {
        setThreadErr(r.error);
        return;
      }
      setThreadErr(null);
      applyServerThread(r.data ?? []);
    },
    [callbacks, applyServerThread],
  );

  /**
   * "Falhou" nem sempre é "não foi": o gateway grava a mensagem ANTES de
   * responder, então um tempo esgotado pode ser só lentidão dele. Antes de
   * desfazer a bolha, recarrega o fio e procura a mesma mensagem saindo daqui
   * a pouco — se está lá, foi enviada e não se mexe em nada. Sem isto a pessoa
   * reenviava e o contacto recebia em dobro.
   */
  const saiuMesmo = useCallback(
    async (chatId: string, texto: string): Promise<boolean> => {
      const r = await callbacks.onSelecionar(chatId);
      if (!r.ok) return false;
      const lista = r.data ?? [];
      const achou = mensagemJaNoFio(lista, texto);
      if (achou) {
        setThreadErr(null);
        applyServerThread(lista);
      }
      return achou;
    },
    [callbacks, applyServerThread],
  );

  const openChat = useCallback(
    (chatId: string) => {
      setSelectedId(chatId);
      setThread([]);
      setOptimistic([]);
      setThreadErr(null);
      setThreadLoading(true);
      setReply("");
      setSendErr(null);
      setLinkQuery("");
      setLinkOptions([]);
      setLinkFilter(null);
      setLinkErr(null);
      // O modal é da conversa que estava aberta — trocar de fio fecha-o, senão
      // ficava a mostrar o vínculo/notas do contacto anterior.
      setDetalhesOpen(false);
      const c = chats.find((x) => x.chatId === chatId);
      setNotas(c?.notas ?? "");
      setNotasMsg(null);
      void loadThread(chatId);
      setTimeout(() => replyRef.current?.focus(), 60);
    },
    [chats, loadThread],
  );

  // Conversa acabada de criar: abre o fio sem esperar a lista chegar do servidor
  // (o `onActualizar` do pai é que a traz, e chega depois).
  useEffect(() => {
    if (!abrirId) return;
    openChat(abrirId);
    onAbriu?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirId]);

  // TEMPO REAL: mensagem entrou/saiu → o fio aberto recarrega na hora.
  useEffect(() => {
    if (!selectedId || !onRealtime) return;
    return onRealtime(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadThread(selectedId);
    });
  }, [selectedId, onRealtime, loadThread]);

  // polling: enquanto uma conversa está aberta, sincroniza sozinho. Com tempo
  // real ligado ele vira só rede de segurança (20s) — sem ele, 4s como sempre.
  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(
      () => {
        if (typeof document !== "undefined" && document.hidden) return;
        void loadThread(selectedId);
      },
      onRealtime ? 20_000 : 4000,
    );
    return () => clearInterval(id);
  }, [selectedId, loadThread, onRealtime]);

  // rola pro fim quando o fio muda (inclui bolhas otimistas)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, optimistic, threadLoading]);

  // fio exibido = servidor + otimistas ainda não confirmadas
  const displayedThread = useMemo<UiMessage[]>(
    () => (optimistic.length ? [...thread, ...optimistic] : thread),
    [thread, optimistic],
  );
  const dayGroups = useMemo(() => groupByDay(displayedThread), [displayedThread]);

  // teclado: Esc fecha a conversa aberta, setas navegam a lista — desliga
  // enquanto o foco está num campo de texto ou há um dialog aberto (Estatísticas).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea";
      const dialogOpen = typeof document !== "undefined" && !!document.querySelector('[role="dialog"]');
      if (dialogOpen) return;
      if (e.key === "Escape") {
        if (!typing) setSelectedId(null);
        return;
      }
      if (typing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (list.length === 0) return;
        e.preventDefault();
        const idx = list.findIndex((c) => c.chatId === selectedId);
        const next = e.key === "ArrowDown" ? Math.min(idx + 1, list.length - 1) : Math.max(idx - 1, 0);
        const target = list[next < 0 ? 0 : next];
        if (target) openChat(target.chatId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, selectedId, openChat]);

  // busca de vínculo (debounced) — pré-carrega com o nome do contato. Só com o
  // modal aberto: antes corria a cada conversa aberta, batendo no servidor por
  // um resultado que ninguém pediu para ver.
  useEffect(() => {
    if (!detalhesOpen || !selected || selected.vinculo) return;
    const term = linkQuery.trim();
    let alive = true;
    setLinkSearching(true);
    const t = setTimeout(() => {
      void (async () => {
        const opts = await callbacks.onProcurarVinculo(term);
        if (alive) {
          setLinkOptions(opts);
          setLinkSearching(false);
        }
      })();
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalhesOpen, linkQuery, selected?.chatId, selected?.vinculo]);

  useEffect(() => {
    if (selected && !selected.vinculo) {
      const seed = selected.savedName?.trim() || selected.contactName?.trim() || "";
      setLinkQuery(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.chatId]);

  function doSend() {
    const text = reply.trim();
    if (!selectedId || !text) return;
    const chatId = selectedId;
    const tempId = `tmp-${++optSeq.current}`;
    setOptimistic((p) => [
      ...p,
      {
        id: tempId,
        chatId,
        from: "",
        to: chatId,
        body: text,
        type: "chat",
        direction: "out",
        fromMe: true,
        hasMedia: false,
        mediaUrl: null,
        mediaType: null,
        contactName: null,
        savedName: null,
        sentBy: "painel",
        sentByName: null,
        at: new Date().toISOString(),
        pendingLocal: true,
      },
    ]);
    setReply("");
    setSendErr(null);
    setSending(true);
    void (async () => {
      const r = await callbacks.onResponder(chatId, text);
      setSending(false);
      if (!r.ok) {
        // Tempo esgotado do gateway ≠ mensagem não enviada — confere o fio
        // antes de devolver o texto pra caixa (senão vira reenvio em dobro).
        if (r.talvezEnviada && (await saiuMesmo(chatId, text))) return; // `applyServerThread` já troca a bolha pela do servidor
        setOptimistic((p) => p.filter((m) => m.id !== tempId));
        setSendErr(r.error);
        setReply((cur) => cur || text);
        return;
      }
      await loadThread(chatId);
      setTimeout(() => {
        void loadThread(chatId);
      }, 2500);
    })();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId) return;
    const chatId = selectedId;
    setUploading(true);
    setSendErr(null);
    void (async () => {
      const r = await callbacks.onEnviarAnexo(chatId, file);
      setUploading(false);
      if (!r.ok) {
        setSendErr(r.error);
        // Anexo não dá pra conferir por texto — mas recarrega o fio pra pessoa
        // VER se o ficheiro saiu antes de mandar de novo.
        if (r.talvezEnviada) await loadThread(chatId);
        return;
      }
      await loadThread(chatId);
    })();
  }

  function toggleFavorito(chat: WhatsAppChat) {
    setRowBusy((b) => ({ ...b, [chat.chatId]: true }));
    void (async () => {
      const r = await callbacks.onFavoritar(chat.chatId, !chat.favorito);
      setRowBusy((b) => ({ ...b, [chat.chatId]: false }));
      if (r.ok) callbacks.onActualizar();
    })();
  }

  function toggleFixar(chat: WhatsAppChat) {
    setRowBusy((b) => ({ ...b, [chat.chatId]: true }));
    void (async () => {
      const r = await callbacks.onFixar(chat.chatId, !chat.fixado);
      setRowBusy((b) => ({ ...b, [chat.chatId]: false }));
      if (r.ok) callbacks.onActualizar();
    })();
  }

  async function toggleArquivar(chat: WhatsAppChat) {
    if (!chat.arquivado) {
      const ok = await confirm({
        title: "Arquivar conversa?",
        description: `"${displayName(chat)}" some da lista principal. Pode ser encontrada em Arquivados.`,
        confirmLabel: "Arquivar",
      });
      if (!ok) return;
    }
    setRowBusy((b) => ({ ...b, [chat.chatId]: true }));
    const r = await callbacks.onArquivar(chat.chatId, !chat.arquivado);
    setRowBusy((b) => ({ ...b, [chat.chatId]: false }));
    if (r.ok) callbacks.onActualizar();
  }

  /** `filtro` vem do menu de Ações ("Vincular a lead"/"…a cliente"). */
  function abrirDetalhes(filtro: "lead" | "tenant" | null = null) {
    setLinkFilter(filtro);
    setLinkErr(null);
    setNotasMsg(null);
    setDetalhesOpen(true);
  }

  function handlePickVinculo(value: string) {
    const opt = linkOptions.find((o) => o.value === value);
    if (!selected || !opt) return;
    setLinkBusy(true);
    setLinkErr(null);
    void (async () => {
      const r =
        opt.kind === "tenant"
          ? await callbacks.onVincularTenant(selected.chatId, opt.id)
          : await callbacks.onVincularLead(selected.chatId, opt.id);
      setLinkBusy(false);
      if (!r.ok) {
        setLinkErr(r.error);
        return;
      }
      setLinkQuery("");
      setLinkOptions([]);
      // Vinculou: o modal cumpriu o que abriu para fazer. O card do vínculo
      // fica no chip do cabeçalho, então não há o que ficar a ver aqui.
      setDetalhesOpen(false);
      callbacks.onActualizar();
    })();
  }

  async function handleUnlink() {
    if (!selected) return;
    const ok = await confirm({ title: "Desvincular?", description: "A conversa deixa de puxar dados do lead/cliente." });
    if (!ok) return;
    setLinkBusy(true);
    const r = await callbacks.onDesvincular(selected.chatId);
    setLinkBusy(false);
    if (r.ok) callbacks.onActualizar();
    else setLinkErr(r.error);
  }

  function saveNotas() {
    if (!selected || !callbacks.onGuardarNotas) return;
    setNotasBusy(true);
    setNotasMsg(null);
    void (async () => {
      const r = await callbacks.onGuardarNotas!(selected.chatId, notas);
      setNotasBusy(false);
      setNotasMsg(r.ok ? "Nota salva." : r.error);
    })();
  }

  const visibleLinkOptions = linkFilter ? linkOptions.filter((o) => o.kind === linkFilter) : linkOptions;
  const linkSelectOptions: SearchSelectOption[] = visibleLinkOptions.map((o) => ({
    value: o.value,
    label: o.label,
    hint: o.hint ? `${o.kind === "lead" ? "Lead" : "Cliente"} · ${o.hint}` : o.kind === "lead" ? "Lead" : "Cliente",
  }));

  const menuItems: ActionMenuItem[] = selected
    ? [
        {
          label: selected.arquivado ? "Desarquivar" : "Arquivar",
          icon: <Archive size={14} />,
          onClick: () => void toggleArquivar(selected),
        },
        {
          label: selected.fixado ? "Desafixar" : "Fixar",
          icon: <Pin size={14} />,
          onClick: () => toggleFixar(selected),
        },
        ...(selected.vinculo
          ? [
              {
                label: "Ver vínculo e notas",
                icon: <Link2 size={14} />,
                onClick: () => abrirDetalhes(),
              },
            ]
          : [
              {
                label: "Vincular a lead",
                icon: <Link2 size={14} />,
                onClick: () => abrirDetalhes("lead"),
              },
              {
                label: "Vincular a cliente",
                icon: <Link2 size={14} />,
                onClick: () => abrirDetalhes("tenant"),
              },
            ]),
      ]
    : [];

  return (
    <Flex direction={{ base: "column", md: "row" }} flex="1" minH={0} className="admin-card" p={0} overflow="hidden">
      {/* ── COLUNA 1: categorias + busca ─────────────────────── */}
      <Box
        display={{ base: selectedId ? "none" : "block", md: "block" }}
        w={{ md: "240px" }}
        flexShrink={0}
        borderRightWidth={{ md: "1px" }}
        borderBottomWidth={{ base: "1px", md: 0 }}
        borderColor="var(--admin-border)"
        p={4}
      >
        <Stack gap={4}>
          {/* Começar conversa fica com a LISTA, não no cabeçalho: é ação da
              coluna que ela muda, e o cabeçalho é da tela toda. */}
          {onNovaConversa ? (
            <Button tone="whatsapp" onClick={onNovaConversa} w="full">
              <Plus size={16} style={{ marginRight: 6 }} /> Nova conversa
            </Button>
          ) : null}
          <HStack gap={2} px={1} py={1} borderRadius="8px" bg="var(--admin-surface-2)">
            <Search size={15} color="var(--admin-text-soft)" style={{ flexShrink: 0, marginLeft: 4 }} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou número…"
              variant="flushed"
              border="none"
              _focus={{ boxShadow: "none" }}
              size="sm"
            />
          </HStack>
          <Stack gap={1}>
            <CategoryButton
              active={categoria === "conversas"}
              onClick={() => setCategoria("conversas")}
              icon={<MessageCircle size={16} />}
              label="Conversas"
              count={counts.conversas}
            />
            <CategoryButton
              active={categoria === "grupos"}
              onClick={() => setCategoria("grupos")}
              icon={<Users size={16} />}
              label="Grupos"
              count={counts.grupos}
            />
            <CategoryButton
              active={categoria === "favoritos"}
              onClick={() => setCategoria("favoritos")}
              icon={<Star size={16} />}
              label="Favoritos"
              count={counts.favoritos}
            />
            <CategoryButton
              active={categoria === "arquivados"}
              onClick={() => setCategoria("arquivados")}
              icon={<Archive size={16} />}
              label="Arquivados"
              count={counts.arquivados}
            />
          </Stack>
        </Stack>
      </Box>

      {/* ── COLUNA 2: lista de conversas ──────────────────────── */}
      <Box
        display={{ base: selectedId ? "none" : "block", md: "block" }}
        w={{ md: "340px" }}
        flexShrink={0}
        borderRightWidth={{ md: "1px" }}
        borderColor="var(--admin-border)"
        overflowY="auto"
        position="relative"
      >
        {loadingChats ? (
          <HStack p={4}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Carregando…
            </Text>
          </HStack>
        ) : list.length === 0 ? (
          <Box p={5}>
            <Text fontSize="sm" color="var(--admin-text-soft)" textAlign="center">
              {chats.length === 0 ? "Sem conversas ainda." : "Nada encontrado nesta categoria."}
            </Text>
          </Box>
        ) : (
          list.map((c) => (
            <ChatRow
              key={c.chatId}
              chat={c}
              active={c.chatId === selectedId}
              busy={rowBusy[c.chatId]}
              assistantName={assistantName}
              onOpen={openChat}
              onToggleFavorito={toggleFavorito}
            />
          ))
        )}
      </Box>

      {/* ── COLUNA 3: a conversa ──────────────────────────────── */}
      <Box
        display={{ base: selectedId ? "flex" : "none", md: "flex" }}
        flexDirection="column"
        flex="1"
        minW={0}
        minH={0}
      >
        {!selected ? (
          <Box flex="1" display="flex" alignItems="center" justifyContent="center" p={6}>
            {/* Lista vazia não manda "escolher da lista" — não há lista. Diz o que
                é e dá a saída (começar uma). Só depois de carregar, senão o
                primeiro render acusa "sem conversas" antes de as ter pedido. */}
            {chats.length === 0 && !loadingChats ? (
              <EmptyState
                icon={MessageCircle}
                title="Ainda não há conversa"
                description="As conversas deste número aparecem aqui assim que alguém escrever — ou comece você."
                action={
                  onNovaConversa ? (
                    <Button tone="whatsapp" onClick={onNovaConversa}>
                      <Plus size={16} style={{ marginRight: 6 }} /> Nova conversa
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="Escolhe uma conversa"
                description="Selecione uma conversa na lista ao lado para ver o histórico e responder."
              />
            )}
          </Box>
        ) : (
          <>
            {/* cabeçalho da conversa */}
            <HStack px={4} py={3} gap={3} borderBottomWidth="1px" borderColor="var(--admin-border)" bg="var(--admin-surface)" flexShrink={0}>
              <Button
                tone="ghost"
                size="sm"
                display={{ base: "inline-flex", md: "none" }}
                onClick={() => setSelectedId(null)}
                aria-label="Voltar"
              >
                <ArrowLeft size={16} />
              </Button>
              <EntityAvatar name={displayName(selected)} size="sm" />
              <Stack gap={0} flex={1} minW={0}>
                <HStack gap={1.5}>
                  <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" lineClamp={1}>
                    {displayName(selected)}
                  </Text>
                  {selected.isGroup ? <Tag>Grupo</Tag> : null}
                </HStack>
                {selected.digitando ? (
                  <Text fontSize="xs" color="#25a35a" fontWeight="600">
                    a escrever…
                  </Text>
                ) : (
                  <Text fontSize="xs" color="var(--admin-text-soft)">
                    {selected.isGroup ? `${selected.total} mensagens` : fmtPhone(selected.peer)}
                  </Text>
                )}
              </Stack>
              {/* Vínculo: chip quando já ligado, convite quando não. Abre o
                  modal — o painel inline saía sempre aberto e roubava a altura
                  da thread. */}
              <Button
                tone={selected.vinculo ? "outline" : "ghost"}
                size="sm"
                onClick={() => abrirDetalhes()}
                aria-label={selected.vinculo ? "Ver vínculo e notas" : "Vincular a lead ou cliente"}
              >
                <Link2 size={15} style={{ marginRight: 6, flexShrink: 0 }} />
                <Text as="span" fontSize="xs" lineClamp={1} maxW="150px">
                  {selected.vinculo ? selected.vinculo.nome : "Vincular"}
                </Text>
              </Button>
              <Box
                as="button"
                aria-label={selected.favorito ? "Desfavoritar" : "Favoritar"}
                onClick={() => toggleFavorito(selected)}
                color={selected.favorito ? "#eab308" : "var(--admin-text-soft)"}
              >
                <Star size={17} fill={selected.favorito ? "#eab308" : "none"} />
              </Box>
              <Button tone="ghost" size="sm" onClick={() => void loadThread(selected.chatId)} aria-label="Atualizar conversa">
                <RefreshCw size={15} />
              </Button>
              <ActionMenu label="Ações" items={menuItems} size="sm" />
            </HStack>

            {/* mensagens sobre o fundo do WhatsApp */}
            <Box ref={scrollRef} flex="1" minH={0} overflowY="auto" p={4} bg={WA_CREAM} backgroundImage={`url("${WA_DOODLE}")`}>
              {threadLoading ? (
                <HStack justify="center" pt={6}>
                  <Spinner size="sm" />
                </HStack>
              ) : threadErr ? (
                <HStack justify="center" pt={6}>
                  <Text fontSize="sm" color="red.600" bg="rgba(255,255,255,0.85)" px={3} py={1} borderRadius="8px">
                    {threadErr}
                  </Text>
                </HStack>
              ) : displayedThread.length === 0 ? (
                <HStack justify="center" pt={6}>
                  <Text fontSize="sm" color={WA_META} bg="rgba(255,255,255,0.7)" px={3} py={1} borderRadius="8px">
                    Nenhuma mensagem ainda. Escreva abaixo para iniciar.
                  </Text>
                </HStack>
              ) : (
                <Stack gap={3}>
                  {dayGroups.map((g) => (
                    <Stack key={g.label} gap={1.5}>
                      <HStack justify="center">
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color={WA_META}
                          bg="rgba(255,255,255,0.8)"
                          px={2.5}
                          py={0.5}
                          borderRadius="8px"
                        >
                          {g.label}
                        </Text>
                      </HStack>
                      <Stack gap={1.5}>
                        {g.items.map((m) => (
                          <MessageBubble key={m.id} m={m} isGroup={selected.isGroup} assistantName={assistantName} />
                        ))}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            {/* composer */}
            <Stack gap={1} px={3} py={3} borderTopWidth="1px" borderColor="var(--admin-border)" bg="var(--admin-surface)" flexShrink={0}>
              <HStack gap={2} align="flex-end">
                <input ref={fileRef} type="file" hidden onChange={onPickFile} />
                <Button tone="ghost" size="sm" onClick={() => fileRef.current?.click()} loading={uploading} aria-label="Anexar">
                  <Paperclip size={18} />
                </Button>
                <Textarea
                  ref={replyRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Escreva uma mensagem…"
                  rows={1}
                  resize="none"
                  borderRadius="20px"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      doSend();
                    }
                  }}
                />
                <Button onClick={doSend} loading={sending} disabled={!reply.trim()} tone="whatsapp" px={3} borderRadius="full" aria-label="Enviar">
                  <Send size={16} />
                </Button>
              </HStack>
              {sendErr ? (
                <Text fontSize="xs" color="red.600" px={2}>
                  Erro: {sendErr}
                </Text>
              ) : null}
            </Stack>
          </>
        )}
      </Box>

      {/* Vínculo + notas: a gaveta de apoio da conversa. */}
      <Modal
        open={detalhesOpen && !!selected}
        onClose={() => setDetalhesOpen(false)}
        title="Vínculo e notas"
        footer={
          <Button tone="outline" onClick={() => setDetalhesOpen(false)}>
            Fechar
          </Button>
        }
      >
        <Stack gap={5}>
          <Stack gap={2}>
            {selected?.vinculo ? (
              <LinkedCard vinculo={selected.vinculo} onUnlink={() => void handleUnlink()} busy={linkBusy} />
            ) : (
              <>
                <Input
                  ref={linkInputRef}
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  placeholder="Buscar por nome, empresa, e-mail ou telefone…"
                  size="sm"
                  autoFocus
                />
                <SearchSelect
                  label="Vincular a lead ou cliente"
                  value=""
                  onChange={handlePickVinculo}
                  options={linkSelectOptions}
                  placeholder={linkSearching ? "Buscando…" : "Selecione um resultado…"}
                  emptyLabel={linkSearching ? "Buscando…" : "Nenhum resultado — ajuste a busca acima."}
                  clearable={false}
                />
              </>
            )}
            {linkErr ? (
              <Text fontSize="xs" color="red.600">
                {linkErr}
              </Text>
            ) : null}
          </Stack>

          {callbacks.onGuardarNotas ? (
            <Stack gap={1.5}>
              <Text fontSize="xs" fontWeight="700" color="var(--admin-text-soft)">
                Notas internas
              </Text>
              <Textarea
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Só a equipe vê…"
                size="sm"
              />
              <HStack justify="flex-end" gap={2}>
                {notasMsg ? (
                  <Text fontSize="xs" color="#15803d">
                    {notasMsg}
                  </Text>
                ) : null}
                <Button size="xs" tone="outline" onClick={saveNotas} loading={notasBusy}>
                  Salvar nota
                </Button>
              </HStack>
            </Stack>
          ) : null}
        </Stack>
      </Modal>

      {confirmDialog}
    </Flex>
  );
}

/* ============================================================
 * WhatsAppClient — componente de topo
 * ============================================================ */

export function WhatsAppClient({
  title = "WhatsApp",
  subtitle,
  connected,
  phone,
  chats,
  loadingChats,
  assistantName,
  configSlots = [],
  callbacks,
  onRealtime,
}: WhatsAppClientProps) {
  const [view, setView] = useState<"conversas" | "config">("conversas");
  const [statsOpen, setStatsOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [abrirId, setAbrirId] = useState<string | null>(null);
  const [maximizado, setMaximizado] = useState(false);

  // Maximizado: Esc sai, e a página de baixo não rola (senão fica um scroll
  // fantasma por trás). O Esc cede a vez aos modais — quem está por cima é que
  // manda no Esc, senão fecharia o modal E o maximizado de uma vez.
  useEffect(() => {
    if (!maximizado) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !novaOpen && !statsOpen) setMaximizado(false);
    }
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", onKey);
    };
  }, [maximizado, novaOpen, statsOpen]);

  // Ícone só, com `aria-label`+`title`: o cabeçalho é de opções da tela, e o que
  // ele precisa de gritar é o estado da ligação e a ação de começar conversa
  // (essa vive na coluna da lista). Config/Estatísticas são visita rara.
  const acoes = (
    <>
      <Tag
        bg={connected ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.12)"}
        color={connected ? "#15803d" : "#b91c1c"}
      >
        {connected ? `Ligado${phone ? ` · ${fmtPhone(phone)}` : ""}` : "Desligado"}
      </Tag>
      {view === "config" ? (
        <Button tone="outline" size="sm" onClick={() => setView("conversas")}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} /> Voltar
        </Button>
      ) : (
        <>
          <Button tone="ghost" size="sm" onClick={callbacks.onActualizar} aria-label="Atualizar" title="Atualizar">
            <RefreshCw size={16} />
          </Button>
          <Button
            tone="outline"
            size="sm"
            onClick={() => setStatsOpen(true)}
            aria-label="Estatísticas"
            title="Estatísticas"
          >
            <BarChart3 size={16} />
          </Button>
          {configSlots.length > 0 ? (
            <Button
              tone="outline"
              size="sm"
              onClick={() => setView("config")}
              aria-label="Configurações"
              title="Configurações"
            >
              <Settings size={16} />
            </Button>
          ) : null}
        </>
      )}
      {/* Sair do maximizado leva TEXTO: entrar é opcional e o ícone chega, sair
          não pode depender de o utilizador adivinhar o ícone certo. */}
      <Button
        tone="outline"
        size="sm"
        onClick={() => setMaximizado((v) => !v)}
        aria-label={maximizado ? "Sair do maximizado" : "Maximizar"}
        title={maximizado ? "Sair do maximizado (Esc)" : "Maximizar"}
      >
        {maximizado ? (
          <>
            <Minimize2 size={16} style={{ marginRight: 6 }} /> Sair do maximizado
          </>
        ) : (
          <Maximize2 size={16} />
        )}
      </Button>
    </>
  );

  const corpo =
    view === "config" ? (
      <ConfigView slots={configSlots} />
    ) : (
      <ChatWorkspace
        chats={chats}
        loadingChats={loadingChats}
        assistantName={assistantName}
        callbacks={callbacks}
        abrirId={abrirId}
        onAbriu={() => setAbrirId(null)}
        onNovaConversa={callbacks.onNovaConversa && connected ? () => setNovaOpen(true) : undefined}
        onRealtime={onRealtime}
      />
    );

  // A moldura `Screen` é DESTE componente, e a página NÃO o embrulha noutra — dois
  // `Screen` aninhados dão dois cabeçalhos e matam o `fill` (o de fora, sem fill,
  // não passa altura ao de dentro; o workspace encolhe a meio da página). Fica aqui
  // porque as opções do cabeçalho (Estatísticas/Configurações/Maximizar) são estado
  // deste componente: se a moldura fosse da página, cada app teria de reimplementar
  // os mesmos botões — e divergir. Um componente, um cabeçalho, dois consumidores
  // (sistema e tenants com o módulo whatsapp).
  //
  // Altura: quem manda é o `fill` do `Screen`, que usa o `--admin-content-h` que os
  // dois shells publicam (já descontando a `BottomNav`). Nada de `100dvh`/`calc()`
  // chumbado aqui. Em `config` não — formulário quer crescer e a página rola.
  return (
    <>
      {maximizado ? (
        // Foco total: cobre shell, cabeçalho da página e o FAB da IA sem que
        // NENHUM deles saiba deste modo — é só pintar por cima. O `Portal` é o que
        // torna isso fiável: à solta na árvore, qualquer ancestral com `transform`
        // /`filter` viraria bloco-contentor do `fixed` e o overlay ficaria preso na
        // área da página. Camadas: FAB 1400 < overlay 1450 < Dialog/popover 1500 —
        // por isso os modais e o popover do vínculo continuam a abrir por cima.
        // Nada de `role="dialog"` aqui: o `SearchSelect` porta o popover para
        // dentro do diálogo mais próximo, e ele ficaria com a MESMA camada do
        // overlay — o clique morria (é o bug que já pagámos noutra tela).
        <Portal>
          <Box
            position="fixed"
            inset={0}
            zIndex={1450}
            bg="var(--admin-bg)"
            display="flex"
            flexDirection="column"
            gap={3}
            p={{ base: 2, md: 3 }}
          >
            <HStack justify="space-between" gap={3} flexShrink={0} px={1}>
              <HStack gap={2} minW={0}>
                <MessageCircle size={18} color="var(--admin-text-soft)" />
                <Text fontWeight="700" color="var(--admin-text)" truncate>
                  {title}
                </Text>
              </HStack>
              <HStack gap={2}>{acoes}</HStack>
            </HStack>
            {view === "config" ? (
              <Box flex="1" minH={0} overflowY="auto">
                {corpo}
              </Box>
            ) : (
              corpo
            )}
          </Box>
        </Portal>
      ) : (
        <Screen title={title} subtitle={subtitle} fill={view !== "config"} actions={acoes}>
          {corpo}
        </Screen>
      )}

      {callbacks.onNovaConversa ? (
        <NovaConversaModal
          open={novaOpen}
          onClose={() => setNovaOpen(false)}
          onEnviar={callbacks.onNovaConversa}
          onCriada={(chatId) => {
            setNovaOpen(false);
            setView("conversas");
            setAbrirId(chatId);
            callbacks.onActualizar();
          }}
        />
      ) : null}
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} onCarregarStats={callbacks.onCarregarStats} />
    </>
  );
}
