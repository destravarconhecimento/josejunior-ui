import type { ReactNode } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LinkDaUi } from "./LinkDaUi";

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

export function KpiCard({
  label,
  value,
  description,
  trend,
  trendTone = "neutral",
  icon,
  tone = "primary",
  size = "md",
  href,
}: {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  trend?: ReactNode;
  trendTone?: KpiTrendTone;
  icon?: ReactNode;
  tone?: KpiTone;
  size?: "sm" | "md";
  /** Faz o cartão inteiro virar link (navegação injetada pelo shell). */
  href?: string;
}) {
  const t = TONES[tone];
  const sm = size === "sm";
  const cartao = (
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

  if (!href) return cartao;
  return (
    <LinkDaUi href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      {cartao}
    </LinkDaUi>
  );
}

export type KpiRowItem = {
  label: ReactNode;
  value: ReactNode;
  tone?: KpiTone;
  icon?: ReactNode;
  hint?: string;
  trend?: ReactNode;
  trendTone?: KpiTrendTone;
  onClick?: () => void;
  active?: boolean;
  atributos?: Record<`data-${string}`, string | number | undefined>;
};

export function KpiRow({
  items,
  acoes,
}: {
  items: Array<KpiRowItem | null | undefined | false>;
  acoes?: ReactNode;
}) {
  const lista = items.filter((item): item is KpiRowItem => Boolean(item));
  if (lista.length === 0 && !acoes) return null;
  const amplo = lista.length <= 5;
  const espalhar = amplo && lista.length >= 3;
  return (
    <HStack
      className="admin-card"
      px={amplo ? 4 : 3}
      py={amplo ? 3 : 2}
      gap={3}
      align="center"
      flexWrap={{ base: "wrap", md: "nowrap" }}
    >
      <Box className="admin-scroll" flex="1 1 auto" minW={0} overflowX="auto" overflowY="hidden">
        <HStack
          gap={0}
          align="center"
          minW="max-content"
          w={espalhar ? "100%" : undefined}
          justify={espalhar ? "space-between" : undefined}
        >
          {lista.map((item, i) => {
            const t = TONES[item.tone ?? "neutral"];
            const clicavel = Boolean(item.onClick);
            return (
              <HStack
                key={i}
                {...item.atributos}
                gap={amplo ? 2.5 : 2}
                align="baseline"
                flexShrink={0}
                px={amplo ? 4 : 3}
                py={clicavel ? 1 : 0}
                borderLeftWidth={i === 0 ? 0 : "1px"}
                borderColor="var(--admin-divider)"
                cursor={clicavel ? "pointer" : undefined}
                role={clicavel ? "button" : undefined}
                tabIndex={clicavel ? 0 : undefined}
                aria-pressed={clicavel ? Boolean(item.active) : undefined}
                onClick={item.onClick}
                onKeyDown={
                  clicavel
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          item.onClick?.();
                        }
                      }
                    : undefined
                }
                borderRadius="md"
                bg={item.active ? t.soft : undefined}
                boxShadow={item.active ? `inset 0 0 0 1px ${t.strong}` : undefined}
                _hover={clicavel && !item.active ? { bg: "var(--admin-surface-2, rgba(0,0,0,0.04))" } : undefined}
                title={item.hint ?? (clicavel ? (item.active ? "Tirar o filtro" : "Filtrar por este indicador") : undefined)}
              >
                {item.icon ? (
                  <Box color={t.strong} flexShrink={0} alignSelf="center" display="flex">
                    {item.icon}
                  </Box>
                ) : null}
                <Text
                  fontSize={amplo ? "11px" : "10px"}
                  fontWeight="600"
                  color="var(--admin-text-soft)"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                  whiteSpace="nowrap"
                >
                  {item.label}
                </Text>
                <Text
                  fontSize={amplo ? { base: "lg", md: "2xl" } : "md"}
                  fontWeight="700"
                  lineHeight="1.2"
                  color={item.tone && item.tone !== "neutral" ? t.strong : "var(--admin-text)"}
                  fontFamily="var(--admin-font-heading)"
                  whiteSpace="nowrap"
                >
                  {item.value}
                </Text>
                {item.trend != null && item.trend !== "" ? (
                  <Text
                    fontSize={amplo ? "sm" : "xs"}
                    fontWeight="700"
                    color={TREND[item.trendTone ?? "neutral"]}
                    whiteSpace="nowrap"
                  >
                    {item.trend}
                  </Text>
                ) : null}
              </HStack>
            );
          })}
        </HStack>
      </Box>
      {acoes ? (
        <HStack gap={2} flexShrink={0} ml="auto" flexWrap="wrap" justify="flex-end">
          {acoes}
        </HStack>
      ) : null}
    </HStack>
  );
}
