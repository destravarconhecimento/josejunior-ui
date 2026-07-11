"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, Stack } from "@chakra-ui/react";
import { Tabs } from "../Tabs";
import { Tag } from "../Badge";

/* ============================================================
 * WhatsAppWorkspace — shell PURO do WhatsApp (mesma casca no
 * sistema e no tenant): cabeçalho de status (Conectado/IA) +
 * abas [Conversas · Grupos · Fila · Conexão · IA]. Cada aba é um
 * SLOT (ReactNode) que o app pluga — a inbox rica (`WhatsAppInbox`)
 * é compartilhada; Conexão e IA são específicos de cada app
 * (backends diferentes). Só abas com slot definido aparecem.
 * ============================================================ */

export type WhatsAppWorkspaceProps = {
  /** Status da conexão do número. */
  connected: boolean;
  phone?: string | null;
  /** IA de atendimento ligada? (pinta a pílula do cabeçalho). */
  iaActive?: boolean;
  /** Rótulo custom da pílula de IA ativa (ex.: "IA ativa (modelo padrão)"). */
  iaActiveLabel?: string;
  iaOffLabel?: string;
  /** Pílulas extras à direita do status (ex.: gate por número no tenant). */
  extraTags?: ReactNode;

  /** Aba inicial. Default: "conversas" se conectado, senão "conexao". */
  defaultTab?: string;

  /** Slots das abas. Só as fornecidas viram aba. */
  conversas?: ReactNode;
  grupos?: ReactNode;
  gruposLabel?: string;
  fila?: ReactNode;
  conexao?: ReactNode;
  ia?: ReactNode;
  iaTabLabel?: string;
};

export function WhatsAppWorkspace({
  connected,
  phone,
  iaActive,
  iaActiveLabel,
  iaOffLabel = "IA desligada",
  extraTags,
  defaultTab,
  conversas,
  grupos,
  gruposLabel = "Grupos",
  fila,
  conexao,
  ia,
  iaTabLabel = "IA de atendimento",
}: WhatsAppWorkspaceProps) {
  const slots: Record<string, ReactNode> = {
    conversas,
    grupos,
    fila,
    conexao,
    ia,
  };

  const items = [
    conversas != null ? { value: "conversas", label: "Conversas" } : null,
    grupos != null ? { value: "grupos", label: gruposLabel } : null,
    fila != null ? { value: "fila", label: "Fila de envio" } : null,
    conexao != null ? { value: "conexao", label: "Conexão" } : null,
    ia != null ? { value: "ia", label: iaTabLabel } : null,
  ].filter((x): x is { value: string; label: string } => x != null);

  const initial =
    defaultTab && items.some((i) => i.value === defaultTab)
      ? defaultTab
      : connected && conversas != null
        ? "conversas"
        : (items[0]?.value ?? "conexao");

  const [tab, setTab] = useState(initial);

  return (
    <Stack gap={4}>
      <HStack gap={2} flexWrap="wrap">
        <Tag
          bg={connected ? "rgba(34,197,94,0.14)" : "rgba(245,158,11,0.14)"}
          color={connected ? "#15803d" : "#a16207"}
        >
          {connected ? `Conectado${phone ? ` · ${phone}` : ""}` : "Aguardando conexão"}
        </Tag>
        {iaActive ? (
          <Tag bg="rgba(59,130,246,0.12)" color="#1d4ed8">{iaActiveLabel || "IA ativa"}</Tag>
        ) : (
          <Tag>{iaOffLabel}</Tag>
        )}
        {extraTags}
      </HStack>

      {items.length > 1 ? <Tabs value={tab} onChange={setTab} items={items} /> : null}

      <Box>{slots[tab] ?? (items[0] ? slots[items[0].value] : null)}</Box>
    </Stack>
  );
}
