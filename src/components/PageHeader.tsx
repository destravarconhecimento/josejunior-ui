import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

/**
 * Cabeçalho ÚNICO de toda tela logada. Tudo que é "topo de tela" entra aqui —
 * título, contador, subtítulo, filtros, ações e abas — pra não existirem dois
 * jeitos de coroar uma tela.
 *
 * Ordem visual (cada linha só existe se receber conteúdo):
 *   [título + contador] ................... [ações]
 *   subtítulo
 *   abas
 *   filtros
 *
 * Filtro DEPOIS das abas de propósito: a aba troca de visão, o filtro refina a
 * visão aberta. Invertido, o filtro parece valer pra tela toda.
 *
 * `description` é ALIAS de `subtitle` (compat com chamadas antigas). Os dois
 * RENDERIZAM: até 2026-07 eram ignorados de propósito, e o resultado foi ~13
 * telas passando texto que nunca aparecia. Se não quer subtítulo, não passe.
 */
export function PageHeader({
  title,
  titleAfter,
  subtitle,
  description,
  count,
  filters,
  actions,
  tabs,
}: {
  title: string;
  /** Controle colado ao título, na MESMA linha (ex.: seletor de contas do e-mail).
   *  Fica depois do contador; some se não passar. */
  titleAfter?: ReactNode;
  /** Linha de apoio sob o título (ex.: "12 clientes cadastrados"). */
  subtitle?: ReactNode;
  /** @deprecated use `subtitle` — mantido porque adaptadores antigos passam isto. */
  description?: ReactNode;
  /** Contador colado no título (ex.: total da tabela). 0 e undefined somem. */
  count?: number | string;
  /** Busca/filtros da tela (normalmente um `FilterBar`) — o lugar deles é AQUI,
   *  no header, não soltos no corpo nem no toolbar da tabela. */
  filters?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
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
            className="admin-h"
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
          // Mobile: UMA linha que rola na horizontal (não empilha/quebra feio).
          // Desktop (md+): alinha à direita e quebra normalmente.
          <HStack
            gap={2}
            flexShrink={0}
            align="center"
            flexWrap={{ base: "nowrap", md: "wrap" }}
            justify={{ md: "flex-end" }}
            overflowX={{ base: "auto", md: "visible" }}
            className="admin-scroll"
            pb={{ base: 1, md: 0 }}
            // Altura ÚNICA pra tudo que entra aqui: botão, tag, badge ou link.
            // Sem isto cada primitivo traz a sua (Tag é mais baixa que Button) e
            // a linha de ações sai desalinhada.
            css={{
              "& > *": {
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
      {filters ? <Box mt={2.5}>{filters}</Box> : null}
    </Box>
  );
}
