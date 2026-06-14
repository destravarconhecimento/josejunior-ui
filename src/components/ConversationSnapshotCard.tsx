import type { ReactNode } from "react";
import { HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { Tag } from "./Badge";
import { EntityAvatar } from "./EntityAvatar";
import { EmptyState } from "./EmptyState";

export type ConversationStatusTone = "good" | "warn" | "bad" | "neutral";

const STATUS: Record<ConversationStatusTone, { soft: string; strong: string }> = {
  good: { soft: "rgba(34,197,94,0.14)", strong: "#15803d" },
  warn: { soft: "rgba(234,179,8,0.16)", strong: "#a16207" },
  bad: { soft: "rgba(239,68,68,0.12)", strong: "#b91c1c" },
  neutral: { soft: "rgba(100,116,139,0.14)", strong: "#475569" },
};

export type ConversationSnapshotItem = {
  id: string;
  name: string;
  subject?: ReactNode;
  statusLabel: ReactNode;
  statusTone?: ConversationStatusTone;
  channel?: ReactNode;
  time?: ReactNode;
  href?: string;
};

/** "Atendimento agora": lista de conversas recentes/importantes (avatar + assunto
 *  + status + tempo). Linha vira <a> quando `href`. */
export function ConversationSnapshotList({
  items,
  emptyLabel = "Nenhum atendimento ativo.",
}: {
  items: ConversationSnapshotItem[];
  emptyLabel?: ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Sem conversas."} />;
  }
  return (
    <Stack gap={0}>
      {items.map((it, i) => {
        const st = STATUS[it.statusTone ?? "neutral"];
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
            <EntityAvatar name={it.name} size="sm" />
            <VStack align="stretch" gap={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                {it.name}
              </Text>
              {it.subject ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                  {it.subject}
                </Text>
              ) : null}
            </VStack>
            <VStack align="flex-end" gap={1} flexShrink={0}>
              <Tag bg={st.soft} color={st.strong}>
                {it.statusLabel}
              </Tag>
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
