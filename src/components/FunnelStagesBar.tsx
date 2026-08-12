"use client";

import { Fragment, type ReactNode } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";

export type FunnelBarStage = {
  key: string;
  label: string;
  count: number;
  /** Linha pequena sob a contagem (ex.: "62 abriram · 25 clicaram"). */
  hint?: string;
};

/**
 * Régua de etapas do funil comercial: cartões clicáveis em sequência
 * (Alcançado → Curioso → …), cada um com a contagem de leads que CHEGOU
 * àquela etapa (funil clássico: a contagem é cumulativa, não exclusiva).
 *
 * Clicar numa etapa seleciona (a tela filtra a lista por ela); clicar de novo
 * desmarca — o toggle é resolvido aqui, o pai só recebe `key | null`.
 *
 * `out` é quem SAIU do funil (descadastro): entra à direita, separado por um
 * divisor em vez de seta — não é uma etapa depois de "Ganho", é a porta de saída.
 */
export function FunnelStagesBar({
  stages,
  out,
  selected,
  onSelect,
}: {
  stages: FunnelBarStage[];
  out?: FunnelBarStage;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const card = (s: FunnelBarStage, danger: boolean): ReactNode => {
    const active = selected === s.key;
    const accent = danger ? "#b91c1c" : "var(--admin-primary)";
    return (
      <Box
        as="button"
        onClick={() => onSelect(active ? null : s.key)}
        aria-pressed={active}
        flex="1 0 auto"
        minW="118px"
        textAlign="left"
        px={3}
        py={2}
        borderWidth="1px"
        borderColor={active ? accent : "var(--admin-border)"}
        borderRadius="12px"
        bg={active ? (danger ? "rgba(239,68,68,0.08)" : "var(--admin-nav-active)") : "var(--admin-surface)"}
        cursor="pointer"
        transition="border-color .15s, background .15s"
        _hover={{ borderColor: accent }}
      >
        <Text fontSize="xs" fontWeight="600" color={danger ? "#b91c1c" : "var(--admin-text-soft)"}>
          {s.label}
        </Text>
        <Text fontSize="xl" fontWeight="800" lineHeight="1.2" color={danger ? "#b91c1c" : accent}>
          {s.count}
        </Text>
        {s.hint ? (
          <Text fontSize="11px" color="var(--admin-text-soft)" whiteSpace="nowrap">
            {s.hint}
          </Text>
        ) : null}
      </Box>
    );
  };

  return (
    <HStack gap={1.5} align="stretch" overflowX="auto" flexShrink={0} pb={1}>
      {stages.map((s, i) => (
        <Fragment key={s.key}>
          {i > 0 ? (
            <Box alignSelf="center" flexShrink={0} color="var(--admin-text-soft)" opacity={0.6}>
              <ChevronRight size={14} />
            </Box>
          ) : null}
          {card(s, false)}
        </Fragment>
      ))}
      {out ? (
        <Fragment key={out.key}>
          <Box alignSelf="stretch" flexShrink={0} w="1px" bg="var(--admin-border)" mx={1} />
          {card(out, true)}
        </Fragment>
      ) : null}
    </HStack>
  );
}
