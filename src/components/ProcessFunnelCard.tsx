import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { EmptyState } from "./EmptyState";

export type FunnelStage = { label: string; count: number; color?: string };

const DEFAULT_COLORS = [
  "var(--admin-primary)",
  "#0ea5e9",
  "#f59e0b",
  "#a855f7",
  "#22c55e",
  "#64748b",
];

/** Funil de etapas (genérico): barras horizontais proporcionais + contagem + %.
 *  CSS puro. Serve a qualquer pipeline (cartório, vendas, suporte…). */
export function ProcessFunnelCard({
  stages,
  total,
  emptyLabel = "Sem itens no funil.",
}: {
  stages: FunnelStage[];
  total?: number;
  emptyLabel?: ReactNode;
}) {
  if (stages.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Sem dados."} />;
  }
  const max = Math.max(1, ...stages.map((s) => s.count));
  const sum = total ?? stages.reduce((acc, s) => acc + s.count, 0);
  return (
    <Stack gap={3.5}>
      {stages.map((s, i) => {
        const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        const pct = sum > 0 ? Math.round((s.count / sum) * 100) : 0;
        const width = `${Math.max(4, Math.round((s.count / max) * 100))}%`;
        return (
          <Stack key={s.label} gap={1.5}>
            <HStack justify="space-between" gap={3}>
              <HStack gap={2} minW={0}>
                <Box w="10px" h="10px" borderRadius="full" bg={color} flexShrink={0} />
                <Text fontSize="sm" color="var(--admin-text)" lineClamp={1}>
                  {s.label}
                </Text>
              </HStack>
              <HStack gap={2} flexShrink={0}>
                <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">
                  {s.count}
                </Text>
                <Text fontSize="xs" color="var(--admin-text-soft)" minW="34px" textAlign="right">
                  {pct}%
                </Text>
              </HStack>
            </HStack>
            <Box h="8px" borderRadius="full" bg="var(--admin-divider)" overflow="hidden">
              <Box h="full" w={width} borderRadius="full" bg={color} transition="width .3s ease" />
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
