import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

export function PageHeader({
  title,
  rawTitle,
  titleAfter,
  subtitle,
  description,
  count,
  filters,
  actions,
  tabs,
  kpis,
}: {
  title: string;
  rawTitle?: boolean;
  titleAfter?: ReactNode;
  subtitle?: ReactNode;
  /** @deprecated use `subtitle`. */
  description?: ReactNode;
  count?: number | string;
  /** @deprecated a busca/filtro pertence à tabela. */
  filters?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  /** Faixa de indicadores — só `KpiRow`, no máximo uma por tela. */
  kpis?: ReactNode;
}) {
  const sub = subtitle ?? description;
  const showCount = count !== undefined && count !== null && count !== 0 && count !== "";

  return (
    <Box mb={3} flexShrink={0}>
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 2, md: 3 }}
        minH={{ md: "34px" }}
      >
        <HStack gap={2} minW={0} align="center">
          <Text
            as="h1"
            className="admin-h admin-titulo-tela"
            data-cru={rawTitle ? "" : undefined}
            fontSize={{ base: "18px", md: "20px" }}
            lineHeight="1.2"
            fontWeight="700"
            color="var(--admin-primary)"
            minW={0}
          >
            {title}
          </Text>
          {showCount ? (
            <Text
              flexShrink={0}
              px="7px"
              h="20px"
              lineHeight="20px"
              borderRadius="full"
              bg="var(--admin-surface-2)"
              color="var(--admin-text-soft)"
              fontSize="11px"
              fontWeight="700"
            >
              {count}
            </Text>
          ) : null}
          {titleAfter ? (
            <Box flexShrink={0} minW={0}>
              {titleAfter}
            </Box>
          ) : null}
        </HStack>

        {actions ? (
          <HStack
            gap={2}
            flexShrink={0}
            align="center"
            flexWrap={{ base: "nowrap", md: "wrap" }}
            justify={{ md: "flex-end" }}
            overflowX={{ base: "auto", md: "visible" }}
            className="admin-scroll"
            pb={{ base: 1, md: 0 }}
            css={{
              "& > *:not(style):not(script)": {
                flexShrink: 0,
                minHeight: "34px",
                display: "inline-flex",
                alignItems: "center",
              },
            }}
          >
            {actions}
          </HStack>
        ) : null}
      </Stack>

      {sub ? (
        <Text mt={0.5} fontSize="13px" lineHeight="1.35" color="var(--admin-text-soft)">
          {sub}
        </Text>
      ) : null}

      {tabs ? <Box mt={2}>{tabs}</Box> : null}
      {kpis ? <Box mt={2.5}>{kpis}</Box> : null}
      {filters ? <Box mt={2.5}>{filters}</Box> : null}
    </Box>
  );
}
