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
    <Box mb={tabs ? 4 : 6}>
      <Stack
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        gap={3}
      >
        <Text
          as="h1"
          className="admin-h"
          fontSize={{ base: "22px", md: "28px" }}
          lineHeight="1.1"
          fontWeight="700"
          color="var(--admin-primary)"
          minW={0}
        >
          {title}
        </Text>
        {actions ? (
          <HStack gap={2} flexShrink={0} flexWrap="wrap">
            {actions}
          </HStack>
        ) : null}
      </Stack>
      {tabs ? <Box mt={3}>{tabs}</Box> : null}
    </Box>
  );
}
