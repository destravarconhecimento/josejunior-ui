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
  /** "danger" pinta o cartão como alerta (ex.: bloco "Sem próxima ação"). */
  tone?: "default" | "danger";
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
 *
 * `dense` encolhe os cartões (padding/fonte) pra régua virar KPI de canto e
 * sobrar espaço pra lista — a tela de trabalho diário usa assim.
 */
export function FunnelStagesBar({
  stages,
  out,
  selected,
  onSelect,
  dense = false,
}: {
  stages: FunnelBarStage[];
  out?: FunnelBarStage;
  selected: string | null;
  onSelect: (key: string | null) => void;
  dense?: boolean;
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
        minW={dense ? "104px" : "118px"}
        textAlign="left"
        px={dense ? 2.5 : 3}
        py={dense ? 1 : 2}
        borderWidth="1px"
        borderColor={active ? accent : "var(--admin-border)"}
        borderRadius="12px"
        bg={active ? (danger ? "rgba(239,68,68,0.08)" : "var(--admin-nav-active)") : "var(--admin-surface)"}
        cursor="pointer"
        transition="border-color .15s, background .15s"
        _hover={{ borderColor: accent }}
      >
        <Text fontSize={dense ? "11px" : "xs"} fontWeight="600" color={danger ? "#b91c1c" : "var(--admin-text-soft)"}>
          {s.label}
        </Text>
        <Text
          fontSize={dense ? "lg" : "xl"}
          fontWeight={dense ? "700" : "800"}
          lineHeight={dense ? "1.1" : "1.2"}
          color={danger ? "#b91c1c" : accent}
        >
          {s.count}
        </Text>
        {s.hint ? (
          <Text fontSize={dense ? "10px" : "11px"} color="var(--admin-text-soft)" whiteSpace="nowrap">
            {s.hint}
          </Text>
        ) : null}
      </Box>
    );
  };

  return (
    // `admin-scroll`: quando a faixa não cabe e precisa rolar de lado, a barra
    // é a fina do painel (8px, cor da borda) — a nativa do Windows é grossa e
    // fica atravessada no meio da tela.
    <HStack
      className="admin-scroll"
      gap={1.5}
      align="stretch"
      overflowX="auto"
      flexShrink={0}
      pb={dense ? 0.5 : 1}
    >
      {stages.map((s, i) => (
        <Fragment key={s.key}>
          {i > 0 ? (
            <Box alignSelf="center" flexShrink={0} color="var(--admin-text-soft)" opacity={0.6}>
              <ChevronRight size={14} />
            </Box>
          ) : null}
          {card(s, s.tone === "danger")}
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
