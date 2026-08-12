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

export type KpiRowItem = {
  label: ReactNode;
  value: ReactNode;
  /** Colore só o valor (o número é o que se lê primeiro). */
  tone?: KpiTone;
  /** Ícone pequeno, na frente do rótulo. Opcional — a faixa vive bem sem ele. */
  icon?: ReactNode;
};

/**
 * FAIXA de indicadores — a mesma informação do grid de `KpiCard`, em UMA LINHA.
 *
 * Existe porque em tela pequena a grade de cards comia metade da altura antes de
 * a tabela começar: 4 KPIs viravam 2 ou 4 fileiras de ~90px e sobrava uma
 * janelinha pro que interessa. Aqui a régua é a linha de métricas do funil
 * ("pra você hoje: 3 · fila: 12 · e-mails hoje: 40 de 60"): um card raso, os
 * números lado a lado, ~40px no total em qualquer largura.
 *
 * Não substitui o `KpiCard` — dashboard, onde o indicador É a tela, continua com
 * os cards. A faixa é pra tela de TABELA, onde o KPI é contexto e a lista é o
 * assunto.
 *
 * Em largura curta ela rola na horizontal em vez de quebrar: uma linha é uma
 * linha, e esconder métrica atrás de um swipe é melhor que roubar altura da lista.
 */
export function KpiRow({ items }: { items: KpiRowItem[] }) {
  if (items.length === 0) return null;
  return (
    <Box className="admin-card" px={3} py={2} overflowX="auto" overflowY="hidden">
      <HStack gap={0} align="center" minW="max-content">
        {items.map((item, i) => {
          const t = TONES[item.tone ?? "neutral"];
          return (
            <HStack
              key={i}
              gap={2}
              align="baseline"
              flexShrink={0}
              px={3}
              borderLeftWidth={i === 0 ? 0 : "1px"}
              borderColor="var(--admin-divider)"
            >
              {item.icon ? (
                <Box color={t.strong} flexShrink={0} alignSelf="center" display="flex">
                  {item.icon}
                </Box>
              ) : null}
              <Text
                fontSize="10px"
                fontWeight="600"
                color="var(--admin-text-soft)"
                textTransform="uppercase"
                letterSpacing="0.04em"
                whiteSpace="nowrap"
              >
                {item.label}
              </Text>
              <Text
                fontSize="md"
                fontWeight="700"
                lineHeight="1.2"
                color={item.tone && item.tone !== "neutral" ? t.strong : "var(--admin-text)"}
                fontFamily="var(--admin-font-heading)"
                whiteSpace="nowrap"
              >
                {item.value}
              </Text>
            </HStack>
          );
        })}
      </HStack>
    </Box>
  );
}
