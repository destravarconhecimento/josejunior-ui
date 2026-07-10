import type { ReactNode } from "react";
import { HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { Tag } from "./Badge";
import { EntityAvatar } from "./EntityAvatar";
import { EmptyState } from "./EmptyState";

/** Estados de um pedido de venda de coins (coin_sale_orders.status). */
export type CoinSaleStatus =
  | "aguardando_pagamento"
  | "pagamento_enviado"
  | "confirmado"
  | "entregue"
  | "cancelado";

const SALE_STATUS: Record<string, { label: string; soft: string; strong: string }> = {
  aguardando_pagamento: { label: "Aguardando", soft: "rgba(234,179,8,0.16)", strong: "#a16207" },
  pagamento_enviado: { label: "Pagto enviado", soft: "rgba(37,99,235,0.12)", strong: "#1d4ed8" },
  confirmado: { label: "Pago", soft: "rgba(20,184,166,0.14)", strong: "#0f766e" },
  entregue: { label: "Entregue", soft: "rgba(34,197,94,0.14)", strong: "#15803d" },
  cancelado: { label: "Cancelado", soft: "rgba(100,116,139,0.14)", strong: "#475569" },
};

export type RecentSaleItem = {
  id: string;
  /** Nome do comprador. */
  buyer: string;
  /** Plataforma da venda (ex.: "Kako", "Poppo") + @nick, se houver. */
  platform?: ReactNode;
  /** Quantidade de coins, já rotulada ("1.000 coins"). */
  coinsLabel?: ReactNode;
  /** Valor JÁ formatado (ex.: "R$ 50,00"). */
  amount: ReactNode;
  /** Status do pedido — mapeia pro badge (fallback: mostra o texto cru). */
  status: CoinSaleStatus | string;
  /** Entrega automática (API do Kako) ou manual — só marca a manual (precisa de você). */
  delivery?: "auto" | "manual";
  time?: ReactNode;
  href?: string;
};

/**
 * "Últimas vendas" (painel da agência): comprador + plataforma/coins → valor +
 * status do pedido + tempo. Puro (dados por props, ids string); reaproveitável no
 * sistema. Linha vira <a> quando `href`.
 */
export function RecentSalesList({
  items,
  emptyLabel = "Nenhuma venda ainda.",
}: {
  items: RecentSaleItem[];
  emptyLabel?: ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Nenhuma venda ainda."} />;
  }
  return (
    <Stack gap={0}>
      {items.map((it, i) => {
        const st = SALE_STATUS[it.status] ?? { label: String(it.status), soft: "rgba(100,116,139,0.14)", strong: "#475569" };
        const meta = [it.platform, it.coinsLabel].filter(Boolean);
        return (
          <HStack
            key={it.id}
            {...(it.href ? { as: "a", href: it.href } : {})}
            gap={3}
            py={2.5}
            borderBottomWidth={i === items.length - 1 ? "0" : "1px"}
            borderColor="var(--admin-divider)"
            cursor={it.href ? "pointer" : undefined}
            transition="background .12s ease"
            _hover={it.href ? { bg: "var(--admin-nav-hover)" } : undefined}
            borderRadius={it.href ? "8px" : undefined}
            px={it.href ? 1 : 0}
          >
            <EntityAvatar name={it.buyer} size="sm" />
            <VStack align="stretch" gap={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                {it.buyer}
              </Text>
              {meta.length > 0 ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                  {meta.map((m, idx) => (
                    <span key={idx}>
                      {idx > 0 ? " · " : ""}
                      {m}
                    </span>
                  ))}
                </Text>
              ) : null}
            </VStack>
            <VStack align="flex-end" gap={1} flexShrink={0}>
              <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" whiteSpace="nowrap">
                {it.amount}
              </Text>
              <HStack gap={1.5}>
                {it.delivery === "manual" && it.status !== "cancelado" ? (
                  <Tag bg="rgba(124,110,224,0.12)" color="#6d28d9">
                    Manual
                  </Tag>
                ) : null}
                <Tag bg={st.soft} color={st.strong}>
                  {st.label}
                </Tag>
              </HStack>
              {it.time ? (
                <Text fontSize="10px" color="var(--admin-text-soft)">
                  {it.time}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        );
      })}
    </Stack>
  );
}
