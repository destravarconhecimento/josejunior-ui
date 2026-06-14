import type { ReactNode } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";

export type InsightTone = "primary" | "accent";

const TONES: Record<InsightTone, { from: string; to: string; chip: string; chipFg: string }> = {
  primary: {
    from: "rgba(124,110,224,0.10)",
    to: "rgba(124,110,224,0.02)",
    chip: "rgba(124,110,224,0.16)",
    chipFg: "var(--admin-primary)",
  },
  accent: {
    from: "rgba(202,138,4,0.12)",
    to: "rgba(202,138,4,0.02)",
    chip: "rgba(202,138,4,0.18)",
    chipFg: "#b45309",
  },
};

/**
 * Card de insight/IA: cabeçalho com selo (ícone + título), corpo livre e ação
 * opcional no rodapé. Fundo com gradiente sutil pra dar o tom "premium/IA".
 */
export function InsightCard({
  title = "Resumo com IA",
  icon,
  action,
  children,
  tone = "primary",
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: InsightTone;
}) {
  const t = TONES[tone];
  return (
    <Box
      borderRadius="16px"
      border="1px solid var(--admin-border)"
      bg={`linear-gradient(to bottom right, ${t.from}, ${t.to})`}
      p={{ base: 4, md: 5 }}
    >
      <HStack gap={2} mb={2.5} align="center">
        {icon ? (
          <Box
            w="26px"
            h="26px"
            borderRadius="8px"
            bg={t.chip}
            color={t.chipFg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            {icon}
          </Box>
        ) : null}
        <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">
          {title}
        </Text>
      </HStack>
      <Box fontSize="sm" color="var(--admin-text-soft)" lineHeight="1.55">
        {children}
      </Box>
      {action ? <Box mt={3}>{action}</Box> : null}
    </Box>
  );
}
