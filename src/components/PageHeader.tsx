import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

/**
 * Cabeçalho ÚNICO de todas as telas logadas: só TÍTULO + AÇÕES (à direita).
 * Padronizado de propósito — sem eyebrow nem descrição (ganho de altura e
 * consistência). `tabs`, quando passado, renderiza as abas de contexto logo
 * abaixo do título, ainda no topo (maior ganho de espaço vertical).
 * `eyebrow`/`description` são aceitos por compatibilidade, mas IGNORADOS.
 */
export function PageHeader({
  title,
  actions,
  tabs,
}: {
  title: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  /** @deprecated ignorado — mantido só pra não quebrar chamadas antigas. */
  eyebrow?: string;
  /** @deprecated ignorado — mantido só pra não quebrar chamadas antigas. */
  description?: ReactNode;
}) {
  return (
    <Box mb={tabs ? 3 : 5}>
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 2.5, md: 3 }}
      >
        <Text
          as="h1"
          className="admin-h"
          fontSize={{ base: "20px", md: "28px" }}
          lineHeight="1.15"
          fontWeight="700"
          color="var(--admin-primary)"
          minW={0}
        >
          {title}
        </Text>
        {actions ? (
          // Mobile: UMA linha que rola na horizontal (não empilha/quebra feio).
          // Desktop (md+): alinha à direita e quebra normalmente.
          <HStack
            gap={2}
            flexShrink={0}
            flexWrap={{ base: "nowrap", md: "wrap" }}
            justify={{ md: "flex-end" }}
            overflowX={{ base: "auto", md: "visible" }}
            className="admin-scroll"
            pb={{ base: 1, md: 0 }}
            css={{ "& > *": { flexShrink: 0 } }}
          >
            {actions}
          </HStack>
        ) : null}
      </Stack>
      {tabs ? <Box mt={2}>{tabs}</Box> : null}
    </Box>
  );
}
