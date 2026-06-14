import type { ReactNode } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";

export type KpiTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type KpiTrendTone = "up" | "down" | "neutral";

const TONES: Record<KpiTone, { soft: string; strong: string }> = {
  primary: { soft: "rgba(124,110,224,0.12)", strong: "var(--admin-primary)" },
  accent: { soft: "rgba(202,138,4,0.14)", strong: "#b45309" },
  success: { soft: "rgba(34,197,94,0.12)", strong: "#15803d" },
  warning: { soft: "rgba(234,179,8,0.16)", strong: "#a16207" },
  danger: { soft: "rgba(239,68,68,0.12)", strong: "#b91c1c" },
  neutral: { soft: "rgba(100,116,139,0.12)", strong: "#475569" },
};

const TREND: Record<KpiTrendTone, string> = {
  up: "#15803d",
  down: "#b91c1c",
  neutral: "var(--admin-text-soft)",
};

/**
 * Card de indicador (KPI): valor grande, rótulo, variação e descrição, com um
 * ícone em caixa tonal. Reutilizável em qualquer painel. Sem cores hardcoded
 * fora do mapa de tons.
 */
export function KpiCard({
  label,
  value,
  description,
  trend,
  trendTone = "neutral",
  icon,
  tone = "primary",
}: {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  trend?: ReactNode;
  trendTone?: KpiTrendTone;
  icon?: ReactNode;
  tone?: KpiTone;
}) {
  const t = TONES[tone];
  return (
    <Box
      className="admin-card"
      p={{ base: 4, md: 5 }}
      position="relative"
      overflow="hidden"
      transition="transform .15s ease, box-shadow .15s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "var(--admin-card-shadow)" }}
    >
      <HStack justify="space-between" align="flex-start" gap={3}>
        <VStack align="stretch" gap={1} flex="1" minW={0}>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="var(--admin-text-soft)"
            textTransform="uppercase"
            letterSpacing="0.04em"
            lineClamp={1}
          >
            {label}
          </Text>
          <HStack align="baseline" gap={2} flexWrap="wrap">
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="800"
              lineHeight="1.1"
              color="var(--admin-text)"
              fontFamily="var(--admin-font-heading)"
            >
              {value}
            </Text>
            {trend != null && trend !== "" ? (
              <Text fontSize="sm" fontWeight="700" color={TREND[trendTone]}>
                {trend}
              </Text>
            ) : null}
          </HStack>
          {description != null && description !== "" ? (
            <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
              {description}
            </Text>
          ) : null}
        </VStack>
        {icon ? (
          <Box
            flexShrink={0}
            w={{ base: "38px", md: "44px" }}
            h={{ base: "38px", md: "44px" }}
            borderRadius="14px"
            bg={t.soft}
            color={t.strong}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {icon}
          </Box>
        ) : null}
      </HStack>
    </Box>
  );
}
