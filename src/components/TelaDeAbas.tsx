"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Screen } from "./Screen";
import { KpiRow, type KpiRowItem } from "./KpiCard";
import { Tabs, type TabDef } from "./Tabs";

export type AbaPainel = TabDef & { conteudo: ReactNode };

export function TelaDeAbas({
  titulo,
  subtitulo,
  contador,
  tituloDepois,
  acoes,
  abas,
  aba,
  onAba,
  rotuloSidebar,
  kpis,
  kpisAcoes,
  blocos,
  overlays,
  maxW,
  fill = false,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  contador?: number | string;
  tituloDepois?: ReactNode;
  acoes?: ReactNode;
  abas: AbaPainel[];
  aba?: string;
  onAba?: (value: string) => void;
  /** Rótulo no topo da sidebar. Omitido, usa o título da tela. */
  rotuloSidebar?: string;
  kpis?: Array<KpiRowItem | null | undefined | false>;
  kpisAcoes?: ReactNode;
  blocos?: ReactNode;
  overlays?: ReactNode;
  maxW?: string;
  fill?: boolean;
}) {
  const [abaInterna, setAbaInterna] = useState(abas[0]?.value ?? "");
  const abaAtual = aba ?? abaInterna;
  const trocarAba = onAba ?? setAbaInterna;
  const ativa = abas.find((a) => a.value === abaAtual) ?? abas[0];

  return (
    <Screen
      title={titulo}
      subtitle={subtitulo}
      count={contador}
      titleAfter={tituloDepois}
      actions={acoes}
      kpis={kpis && kpis.length > 0 ? <KpiRow items={kpis} acoes={kpisAcoes} /> : undefined}
      blocos={blocos}
      maxW={maxW}
      fill={fill}
    >
      <HStack
        align="flex-start"
        gap={{ base: 4, md: 6 }}
        flexDirection={{ base: "column", md: "row" }}
        flex={fill ? "1" : undefined}
        minH={fill ? 0 : undefined}
        w="full"
      >
        <Tabs
          orientation="vertical"
          value={abaAtual}
          onChange={trocarAba}
          sidebarLabel={rotuloSidebar ?? titulo}
          items={abas.map(({ value, label, icon }) => ({ value, label, icon }))}
        />
        <Box flex="1" minW={0} minH={fill ? 0 : undefined} w="full">
          {ativa ? <Box key={ativa.value}>{ativa.conteudo}</Box> : null}
        </Box>
      </HStack>
      {overlays}
    </Screen>
  );
}
