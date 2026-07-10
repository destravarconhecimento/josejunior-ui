import type { ReactNode } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";

export type ProgressTone = "primary" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<ProgressTone, string> = {
  primary: "var(--admin-primary)",
  success: "#15803d",
  warning: "#a16207",
  danger: "#b91c1c",
  neutral: "#475569",
};

/**
 * Barra de progresso do design-system. Aceita `value`/`max` (ou `percent` direto).
 * Opcional: rótulo à esquerda e valor formatado à direita. `indeterminate` para
 * quando o total ainda é desconhecido. Sem cores hardcoded fora do mapa de tons.
 */
export function ProgressBar({
  value,
  max = 100,
  percent,
  label,
  hint,
  tone = "primary",
  indeterminate = false,
  size = "md",
}: {
  value?: number;
  max?: number;
  percent?: number;
  label?: ReactNode;
  /** Texto à direita (ex.: "12 / 50"). Se omitido, mostra a %. */
  hint?: ReactNode;
  tone?: ProgressTone;
  indeterminate?: boolean;
  size?: "sm" | "md";
}) {
  const raw =
    percent != null ? percent : max > 0 ? ((value ?? 0) / max) * 100 : 0;
  const pct = Math.max(0, Math.min(100, Math.round(raw)));
  const strong = TONES[tone];
  const h = size === "sm" ? "6px" : "10px";

  return (
    <Box>
      {(label != null || hint != null || !indeterminate) && (
        <HStack justify="space-between" align="baseline" mb={1.5} gap={2}>
          {label != null ? (
            <Text fontSize="xs" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
              {label}
            </Text>
          ) : (
            <Box />
          )}
          <Text fontSize="xs" fontWeight="700" color="var(--admin-text-soft)" whiteSpace="nowrap">
            {hint != null ? hint : indeterminate ? "" : `${pct}%`}
          </Text>
        </HStack>
      )}
      <Box
        position="relative"
        w="100%"
        h={h}
        borderRadius="999px"
        bg="rgba(100,116,139,0.16)"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          w={indeterminate ? "40%" : `${pct}%`}
          borderRadius="999px"
          bg={strong}
          transition="width .35s ease"
          animation={indeterminate ? "jjProgressIndeterminate 1.1s ease-in-out infinite" : undefined}
        />
      </Box>
    </Box>
  );
}
