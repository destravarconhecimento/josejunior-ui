import type { ReactNode } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";

export type TimelineTone = "primary" | "success" | "warning" | "danger" | "neutral";

const DOT: Record<TimelineTone, string> = {
  primary: "var(--admin-primary)",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  neutral: "#94a3b8",
};

export type TimelineItem = {
  id: string | number;
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  icon?: ReactNode;
  tone?: TimelineTone;
};

/** Linha do tempo de atividades: ponto colorido + linha conectora vertical. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <VStack align="stretch" gap={0}>
      {items.map((it, i) => {
        const tone = it.tone ?? "primary";
        const last = i === items.length - 1;
        return (
          <HStack key={it.id} align="flex-start" gap={3}>
            <VStack gap={0} alignSelf="stretch" flexShrink={0}>
              <Box
                w="28px"
                h="28px"
                borderRadius="full"
                bg={`${DOT[tone]}22`}
                color={DOT[tone]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="12px"
              >
                {it.icon ?? (
                  <Box w="8px" h="8px" borderRadius="full" bg={DOT[tone]} />
                )}
              </Box>
              {!last ? <Box flex="1" w="2px" minH="14px" bg="var(--admin-divider)" /> : null}
            </VStack>
            <Box flex="1" pb={last ? 0 : 4} minW={0}>
              <HStack justify="space-between" align="baseline" gap={2}>
                <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                  {it.title}
                </Text>
                {it.time != null && it.time !== "" ? (
                  <Text fontSize="xs" color="var(--admin-text-soft)" flexShrink={0}>
                    {it.time}
                  </Text>
                ) : null}
              </HStack>
              {it.description != null && it.description !== "" ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" mt={0.5}>
                  {it.description}
                </Text>
              ) : null}
            </Box>
          </HStack>
        );
      })}
    </VStack>
  );
}
