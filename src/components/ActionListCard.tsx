import type { ReactNode } from "react";
import { Box, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";

export type ActionTone = "primary" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<ActionTone, { soft: string; strong: string }> = {
  primary: { soft: "rgba(124,110,224,0.12)", strong: "var(--admin-primary)" },
  success: { soft: "rgba(34,197,94,0.12)", strong: "#15803d" },
  warning: { soft: "rgba(234,179,8,0.16)", strong: "#a16207" },
  danger: { soft: "rgba(239,68,68,0.12)", strong: "#b91c1c" },
  neutral: { soft: "rgba(100,116,139,0.12)", strong: "#475569" },
};

export type ActionListItem = {
  id: string;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: ActionTone;
  href?: string;
  onClick?: () => void;
};

/** "Próximas ações": lista compacta de atalhos inteligentes (ícone tonal + título
 *  + subtítulo + seta). Linha clicável (<a> ou button). */
export function ActionListCard({
  items,
  emptyLabel = "Nada pendente por agora.",
}: {
  items: ActionListItem[];
  emptyLabel?: ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title={typeof emptyLabel === "string" ? emptyLabel : "Tudo certo."} />;
  }
  return (
    <Stack gap={1.5}>
      {items.map((it) => {
        const t = TONE[it.tone ?? "primary"];
        const interactive = Boolean(it.href || it.onClick);
        return (
          <HStack
            key={it.id}
            {...(it.href ? { as: "a", href: it.href } : it.onClick ? { as: "button", onClick: it.onClick } : {})}
            gap={3}
            p={2.5}
            borderRadius="12px"
            border="1px solid var(--admin-divider)"
            bg="var(--admin-surface)"
            w="full"
            textAlign="left"
            cursor={interactive ? "pointer" : undefined}
            transition="border-color .12s ease, background .12s ease"
            _hover={interactive ? { borderColor: t.strong, bg: "var(--admin-surface-2)" } : undefined}
          >
            <Box
              w="34px"
              h="34px"
              borderRadius="10px"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={t.soft}
              color={t.strong}
            >
              {it.icon}
            </Box>
            <VStack align="stretch" gap={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                {it.title}
              </Text>
              {it.subtitle ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                  {it.subtitle}
                </Text>
              ) : null}
            </VStack>
            {interactive ? (
              <Box color="var(--admin-text-soft)" flexShrink={0}>
                <ChevronRight size={16} />
              </Box>
            ) : null}
          </HStack>
        );
      })}
    </Stack>
  );
}
