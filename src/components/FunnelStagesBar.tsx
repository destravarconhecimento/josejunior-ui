"use client";

import { Fragment, type MouseEvent, type ReactNode } from "react";
import { Box, HStack, Portal, Text, Tooltip } from "@chakra-ui/react";
import { ChevronRight, Info } from "lucide-react";

export type FunnelBarStage = {
  key: string;
  label: string;
  count: number;
  /**
   * O que a etapa significa ("62 abriram · 25 clicaram"). Vira a DICA do ícone
   * de info no topo do cartão — não uma terceira linha embaixo do número.
   */
  hint?: string;
  /** "danger" pinta o cartão como alerta (ex.: bloco "Sem próxima ação"). */
  tone?: "default" | "danger";
};

/**
 * Ícone de info no canto do cartão: passa o mouse (ou toca, no celular) e ele
 * diz o que a etapa é.
 *
 * Existe porque a explicação embaixo do número custava uma linha em TODO cartão
 * — e no celular ela nem aparecia, só espremia a régua. Assim a explicação
 * continua a um gesto de distância e o cartão fica com o que se lê de relance:
 * título e número.
 */
function DicaEtapa({ titulo, texto, danger }: { titulo: string; texto: string; danger: boolean }) {
  // O leitor de tela não passa por aqui: a explicação já está no `aria-label` do
  // cartão inteiro (abaixo). Este ícone é a afordância VISUAL da mesma coisa —
  // marcá-lo como decorativo evita anunciar o texto duas vezes.
  return (
    <Tooltip.Root openDelay={120} closeDelay={80} positioning={{ placement: "top" }}>
      <Tooltip.Trigger asChild>
        <Box
          as="span"
          // SPAN, não botão: isto vive DENTRO de um <button> (o cartão), e botão
          // dentro de botão é HTML inválido. O clique morre aqui — tocar na dica
          // não pode filtrar a lista sem querer.
          onClick={(e: MouseEvent) => e.stopPropagation()}
          display="inline-flex"
          alignItems="center"
          flexShrink={0}
          color={danger ? "#b91c1c" : "var(--admin-text-soft)"}
          opacity={0.5}
          _hover={{ opacity: 1 }}
          transition="opacity .15s"
          aria-hidden="true"
        >
          <Info size={12} />
        </Box>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content
            maxW="260px"
            px={2.5}
            py={2}
            borderRadius="10px"
            bg="var(--admin-text)"
            color="white"
            boxShadow="0 10px 30px rgba(17,12,40,0.28)"
            zIndex={1600}
          >
            {/* O título repetido na dica salva o rótulo cortado: cartão estreito
                trunca "Clicaram — você decide", e aqui ele aparece inteiro. */}
            <Text fontSize="11px" fontWeight="700" mb={0.5}>
              {titulo}
            </Text>
            <Text fontSize="11px" lineHeight="1.45" opacity={0.85}>
              {texto}
            </Text>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}

/**
 * Régua de etapas do funil comercial: cartões clicáveis em sequência
 * (Alcançado → Curioso → …), cada um com a contagem de leads que CHEGOU
 * àquela etapa (funil clássico: a contagem é cumulativa, não exclusiva).
 *
 * Cada cartão mostra só TÍTULO e NÚMERO, e todos têm a MESMA largura, repartindo
 * a linha inteira (`flex: 1 1 0`). Antes cada um crescia conforme o próprio
 * texto e a régua ficava torta — cartão de rótulo comprido roubava o espaço do
 * vizinho. A explicação de cada etapa foi pro ícone de info do topo.
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
        // A explicação saiu da tela mas não some pra quem usa leitor: ela entra
        // no nome do cartão, junto com o número.
        aria-label={s.hint ? `${s.label}: ${s.count} — ${s.hint}` : `${s.label}: ${s.count}`}
        // `1 1 0` reparte a linha em partes IGUAIS (o `0` de base ignora o
        // tamanho do texto); o `minW` é o piso — abaixo dele a régua rola de
        // lado em vez de espremer os números.
        flex="1 1 0"
        minW={dense ? "104px" : "118px"}
        textAlign="left"
        px={dense ? 2.5 : 3}
        py={dense ? 1.5 : 2}
        borderWidth="1px"
        borderColor={active ? accent : "var(--admin-border)"}
        borderRadius="12px"
        bg={active ? (danger ? "rgba(239,68,68,0.08)" : "var(--admin-nav-active)") : "var(--admin-surface)"}
        cursor="pointer"
        transition="border-color .15s, background .15s"
        _hover={{ borderColor: accent }}
      >
        <HStack gap={1} align="center" justify="space-between" minW={0}>
          <Text
            fontSize={dense ? "11px" : "xs"}
            fontWeight="600"
            color={danger ? "#b91c1c" : "var(--admin-text-soft)"}
            lineClamp={1}
            minW={0}
          >
            {s.label}
          </Text>
          {s.hint ? <DicaEtapa titulo={s.label} texto={s.hint} danger={danger} /> : null}
        </HStack>
        <Text
          fontSize={dense ? "lg" : "xl"}
          fontWeight={dense ? "700" : "800"}
          lineHeight={dense ? "1.15" : "1.2"}
          color={danger ? "#b91c1c" : accent}
        >
          {s.count}
        </Text>
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
