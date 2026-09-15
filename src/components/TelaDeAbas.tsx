"use client";

import { useState, type ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import { Screen } from "./Screen";
import { KpiRow, type KpiRowItem } from "./KpiCard";
import { LayoutDeAbas } from "./LayoutDeAbas";
import type { TabDef } from "./Tabs";

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
      <LayoutDeAbas
        abas={abas.map(({ value, label, icon }) => ({ value, label, icon }))}
        aba={abaAtual}
        onAba={trocarAba}
        rotuloSidebar={rotuloSidebar ?? titulo}
        fill={fill}
      >
        {ativa ? <Box key={ativa.value}>{ativa.conteudo}</Box> : null}
      </LayoutDeAbas>
      {overlays}
    </Screen>
  );
}
