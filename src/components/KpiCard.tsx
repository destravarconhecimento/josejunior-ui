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
  size = "md",
}: {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  trend?: ReactNode;
  trendTone?: KpiTrendTone;
  icon?: ReactNode;
  tone?: KpiTone;
  /** `sm` = compacto (telas com tabela: menos altura/fonte, sobra espaço pra planilha). */
  size?: "sm" | "md";
}) {
  const t = TONES[tone];
  const sm = size === "sm";
  return (
    <Box
      className="admin-card"
      p={sm ? 3 : { base: 3, md: 5 }}
      position="relative"
      overflow="hidden"
      transition="transform .15s ease, box-shadow .15s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "var(--admin-card-shadow)" }}
    >
      <HStack justify="space-between" align="flex-start" gap={sm ? 2 : { base: 2, md: 3 }}>
        <VStack align="stretch" gap={0.5} flex="1" minW={0}>
          <Text
            fontSize="10px"
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
              fontSize={sm ? { base: "md", md: "lg" } : { base: "lg", md: "2xl" }}
              fontWeight="700"
              lineHeight="1.15"
              color="var(--admin-text)"
              fontFamily="var(--admin-font-heading)"
              whiteSpace="nowrap"
            >
              {value}
            </Text>
            {trend != null && trend !== "" ? (
              <Text fontSize={sm ? "xs" : { base: "xs", md: "sm" }} fontWeight="700" color={TREND[trendTone]}>
                {trend}
              </Text>
            ) : null}
          </HStack>
          {description != null && description !== "" ? (
            <Text fontSize="10px" color="var(--admin-text-soft)" lineClamp={1}>
              {description}
            </Text>
          ) : null}
        </VStack>
        {icon ? (
          <Box
            flexShrink={0}
            w={sm ? "30px" : { base: "30px", md: "44px" }}
            h={sm ? "30px" : { base: "30px", md: "44px" }}
            borderRadius={sm ? "10px" : { base: "10px", md: "14px" }}
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
