import type { ReactNode } from "react";
import { Box, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { Tag } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export type QueuePriority = "high" | "normal" | "low";

const PRIORITY: Record<QueuePriority, { soft: string; strong: string; label: string }> = {
  high: { soft: "rgba(239,68,68,0.12)", strong: "#b91c1c", label: "Crítico" },
  normal: { soft: "rgba(234,179,8,0.16)", strong: "#a16207", label: "Atenção" },
  low: { soft: "rgba(100,116,139,0.12)", strong: "#475569", label: "Normal" },
};

export type OperationalQueueItem = {
  id: string;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  source?: ReactNode;
  priority: QueuePriority;
  time?: ReactNode;
  /** Tag de prioridade custom (sobrepõe o label padrão). */
  priorityLabel?: ReactNode;
  action?: { label: ReactNode; href?: string; onClick?: () => void };
  menu?: ReactNode;
};

/** "Fila de decisão": itens acionáveis priorizados. Ícone tonal pela prioridade,
 *  título/subtítulo, tags (origem/prioridade), tempo e ação. Sem visual cru. */
export function OperationalQueue({
  items,
  emptyLabel = "Nada aguardando sua decisão. 🎉",
  maxHeight,
  fill,
}: {
  items: OperationalQueueItem[];
  emptyLabel?: ReactNode;
  maxHeight?: string | number;
  /** Cresce e rola dentro de um card flex de altura definida (preenche o espaço). */
  fill?: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Tudo em dia."} />;
  }
  return (
    <Stack
      gap={0}
      flex={fill ? "1" : undefined}
      minH={fill ? 0 : undefined}
      overflowY={fill || maxHeight ? "auto" : undefined}
      maxH={maxHeight}
      className="admin-scroll"
    >
      {items.map((it, i) => {
        const p = PRIORITY[it.priority];
        return (
          <HStack
            key={it.id}
            align="flex-start"
            gap={3}
            py={3}
            borderBottomWidth={i === items.length - 1 ? "0" : "1px"}
            borderColor="var(--admin-divider)"
          >
            <Box
              w="38px"
              h="38px"
              borderRadius="11px"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={p.soft}
              color={p.strong}
            >
              {it.icon}
            </Box>

            <VStack align="stretch" gap={0.5} flex="1" minW={0}>
              <HStack gap={2} flexWrap="wrap" align="center">
                <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" lineClamp={1}>
                  {it.title}
                </Text>
                <Tag bg={p.soft} color={p.strong}>
                  {it.priorityLabel ?? p.label}
                </Tag>
              </HStack>
              {it.subtitle ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={2}>
                  {it.subtitle}
                </Text>
              ) : null}
              <HStack gap={2} flexWrap="wrap" mt={0.5}>
                {it.source ? (
                  <Text fontSize="11px" color="var(--admin-text-soft)" fontWeight="600">
                    {it.source}
                  </Text>
                ) : null}
                {it.time ? (
                  <Text fontSize="11px" color="var(--admin-text-soft)">
                    · {it.time}
                  </Text>
                ) : null}
              </HStack>
            </VStack>

            <HStack gap={1} flexShrink={0} align="center">
              {it.action ? (
                it.action.href ? (
                  <Button asChild tone="outline" size="xs">
                    <a href={it.action.href}>{it.action.label}</a>
                  </Button>
                ) : (
                  <Button tone="outline" size="xs" onClick={it.action.onClick}>
                    {it.action.label}
                  </Button>
                )
              ) : null}
              {it.menu}
            </HStack>
          </HStack>
        );
      })}
    </Stack>
  );
}
