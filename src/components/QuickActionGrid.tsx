import type { ReactNode } from "react";
import { Box, SimpleGrid, Text, VStack } from "@chakra-ui/react";

export type QuickActionTone = "primary" | "accent" | "success" | "warning" | "neutral";

const TONES: Record<QuickActionTone, { soft: string; strong: string }> = {
  primary: { soft: "rgba(124,110,224,0.12)", strong: "var(--admin-primary)" },
  accent: { soft: "rgba(202,138,4,0.14)", strong: "#b45309" },
  success: { soft: "rgba(34,197,94,0.12)", strong: "#15803d" },
  warning: { soft: "rgba(234,179,8,0.16)", strong: "#a16207" },
  neutral: { soft: "rgba(100,116,139,0.12)", strong: "#475569" },
};

export type QuickAction = {
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: QuickActionTone;
  disabled?: boolean;
};

/** Grade de ações rápidas: cartões tocáveis (ícone + rótulo). Vira <a> com href
 *  ou <button> com onClick. Pensado pra mobile e para o painel de detalhe. */
export function QuickActionGrid({
  actions,
  columns = { base: 2, md: 4 },
}: {
  actions: QuickAction[];
  columns?: number | Record<string, number>;
}) {
  return (
    <SimpleGrid columns={columns} gap={2.5}>
      {actions.map((a, i) => {
        const tone = TONES[a.tone ?? "primary"];
        return (
          <Box
            key={i}
            as={a.href ? "a" : "button"}
            {...(a.href ? { href: a.href } : { type: "button", onClick: a.onClick })}
            aria-disabled={a.disabled || undefined}
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            textAlign="center"
            p={3}
            borderRadius="14px"
            border="1px solid var(--admin-border)"
            bg="var(--admin-surface)"
            cursor={a.disabled ? "not-allowed" : "pointer"}
            opacity={a.disabled ? 0.5 : 1}
            transition="transform .12s ease, border-color .12s ease, background .12s ease"
            _hover={a.disabled ? undefined : { transform: "translateY(-2px)", borderColor: tone.strong, bg: "var(--admin-surface-2)" }}
          >
            <VStack gap={1.5}>
              {a.icon ? (
                <Box
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  bg={tone.soft}
                  color={tone.strong}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {a.icon}
                </Box>
              ) : null}
              <Text fontSize="xs" fontWeight="600" color="var(--admin-text)" lineClamp={2}>
                {a.label}
              </Text>
            </VStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
