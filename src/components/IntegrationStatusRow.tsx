import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { Tag } from "./Badge";
import { EmptyState } from "./EmptyState";

export type IntegrationTone = "good" | "bad" | "warn" | "info" | "neutral";

const TONE: Record<IntegrationTone, { color: string; soft: string }> = {
  good: { color: "#15803d", soft: "rgba(34,197,94,0.12)" },
  bad: { color: "#dc2626", soft: "rgba(220,38,38,0.10)" },
  warn: { color: "#b45309", soft: "rgba(245,158,11,0.15)" },
  info: { color: "var(--admin-primary)", soft: "var(--admin-nav-active)" },
  neutral: { color: "var(--admin-primary)", soft: "var(--admin-nav-active)" },
};

export type IntegrationStatusItem = {
  key: string;
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  tone: IntegrationTone;
  href?: string;
};

/** Linha de status de integração/serviço: ícone tonal + label/helper + pílula + dot.
 *  Vira <a> quando `href`. (Extraído do antigo SignalRow do dashboard.) */
export function IntegrationStatusRow({
  icon,
  label,
  value,
  helper,
  tone,
  href,
}: Omit<IntegrationStatusItem, "key">) {
  const t = TONE[tone];
  return (
    <HStack
      {...(href ? { as: "a", href } : {})}
      justify="space-between"
      align="center"
      gap={3}
      border="1px solid var(--admin-divider)"
      borderRadius="14px"
      bg="var(--admin-surface)"
      p={3.5}
      transition="border-color .15s ease, box-shadow .15s ease"
      cursor={href ? "pointer" : undefined}
      _hover={href ? { borderColor: "var(--admin-primary)", boxShadow: "0 8px 18px rgba(11,35,74,0.08)" } : undefined}
    >
      <HStack gap={3} minW={0}>
        <Box
          w="38px"
          h="38px"
          borderRadius="11px"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={t.soft}
          color={t.color}
        >
          {icon}
        </Box>
        <Stack gap={0.5} minW={0}>
          <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" lineClamp={1}>
            {label}
          </Text>
          {helper ? (
            <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.4" lineClamp={2}>
              {helper}
            </Text>
          ) : null}
        </Stack>
      </HStack>
      <HStack gap={2} flexShrink={0}>
        <Tag bg={t.soft} color={t.color}>
          {value}
        </Tag>
        <Box w="8px" h="8px" borderRadius="full" bg={t.color} />
      </HStack>
    </HStack>
  );
}

/** Lista de status de integrações (usa IntegrationStatusRow). */
export function IntegrationStatusCard({
  items,
  emptyLabel = "Nenhuma integração ativa.",
}: {
  items: IntegrationStatusItem[];
  emptyLabel?: ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Nada por aqui."} />;
  }
  return (
    <Stack gap={2.5}>
      {items.map(({ key, ...row }) => (
        <IntegrationStatusRow key={key} {...row} />
      ))}
    </Stack>
  );
}
