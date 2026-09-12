"use client";

import type { ReactNode } from "react";
import { Link as ChakraLink, Text } from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import { Tag, estiloDeStatus } from "../Badge";
import { formatarData, formatarDataHora, formatarMoeda, type FormatoUi } from "../../format";
import type { UiTextos } from "../../textos";

export type KindCelula =
  | "text"
  | "strong"
  | "subtext"
  | "enum"
  | "bool"
  | "currency"
  | "date"
  | "datetime"
  | "mono"
  | "link";

export type PaletaEnum =
  | "green"
  | "red"
  | "orange"
  | "yellow"
  | "blue"
  | "purple"
  | "teal"
  | "gray";

export const CORES_ENUM: Record<PaletaEnum, { bg: string; color: string }> = {
  green: { bg: "rgba(34,197,94,0.12)", color: "#15803d" },
  red: { bg: "rgba(239,68,68,0.12)", color: "#b91c1c" },
  orange: { bg: "rgba(245,158,11,0.16)", color: "#b45309" },
  yellow: { bg: "rgba(234,179,8,0.14)", color: "#a16207" },
  blue: { bg: "rgba(37,99,235,0.12)", color: "#1d4ed8" },
  purple: { bg: "rgba(168,85,247,0.12)", color: "#7c3aed" },
  teal: { bg: "rgba(20,184,166,0.14)", color: "#0f766e" },
  gray: { bg: "rgba(100,116,139,0.14)", color: "#475569" },
};

export type CatalogoEnumsUi = {
  rotulo?: (kind: string, valor: string) => string | undefined;
  paleta?: (kind: string, valor: string) => PaletaEnum | undefined;
};

export type ColunaCelula = {
  kind?: KindCelula;
  /** Para `kind: "enum"`: o namespace do catálogo de rótulos/paletas. */
  enumKind?: string;
  /** Para `kind: "subtext"`: a chave da segunda linha, menor e apagada. */
  subKey?: string;
  /** Para `kind: "link"`: a chave que guarda o endereço. */
  hrefKey?: string;
  /** Para `kind: "currency"`: moeda desta coluna (default: a do formato). */
  moeda?: string;
};

export function humanizarEnum(valor: string): string {
  const limpo = valor.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!limpo) return "";
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

export function chavePaletaEnum(valor: string): string {
  const corte = valor.indexOf(":");
  return corte === -1 ? valor : valor.slice(0, corte);
}

export function rotuloEnum(kind: string, valor: string, enums?: CatalogoEnumsUi): string {
  const exato = enums?.rotulo?.(kind, valor);
  if (exato) return exato;
  return valor
    .split(":")
    .map((parte) => enums?.rotulo?.(kind, parte) ?? humanizarEnum(parte))
    .filter(Boolean)
    .join(" · ");
}

export function paletaEnum(kind: string, valor: string, enums?: CatalogoEnumsUi): PaletaEnum {
  const chave = chavePaletaEnum(valor);
  const dada = enums?.paleta?.(kind, chave) ?? enums?.paleta?.(kind, valor);
  if (dada && dada in CORES_ENUM) return dada;
  return "gray";
}

export function EnumTag({
  kind,
  valor,
  enums,
  semValor = "—",
}: {
  kind: string;
  valor: unknown;
  enums?: CatalogoEnumsUi;
  semValor?: string;
}) {
  if (valor == null || valor === "") return <>{semValor}</>;
  const bruto = String(valor);
  const rotulo = rotuloEnum(kind, bruto, enums);
  const doStatus = enums?.paleta?.(kind, chavePaletaEnum(bruto)) ? undefined : estiloDeStatus(bruto);
  const cor = doStatus ?? CORES_ENUM[paletaEnum(kind, bruto, enums)];
  return (
    <Tag bg={cor.bg} color={cor.color} title={rotulo}>
      {rotulo}
    </Tag>
  );
}

export type ContextoCelula = {
  textos: UiTextos;
  formato: FormatoUi;
  enums?: CatalogoEnumsUi;
};

export function renderCelulaDeclarativa(
  c: ColunaCelula,
  valor: unknown,
  row: Record<string, unknown>,
  ctx: ContextoCelula,
): ReactNode {
  const { textos, formato, enums } = ctx;
  const texto = valor == null || valor === "" ? "" : String(valor);
  switch (c.kind) {
    case "strong":
      return (
        <Text fontWeight="medium" lineClamp="1">
          {texto || textos.semValor}
        </Text>
      );
    case "subtext": {
      const sub = c.subKey ? row[c.subKey] : undefined;
      return (
        <>
          <Text fontWeight="medium" lineClamp="1">
            {texto || textos.semValor}
          </Text>
          {sub != null && String(sub) !== "" && (
            <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp="1">
              {String(sub)}
            </Text>
          )}
        </>
      );
    }
    case "enum":
      return (
        <EnumTag kind={c.enumKind ?? ""} valor={valor} enums={enums} semValor={textos.semValor} />
      );
    case "bool": {
      if (valor == null || valor === "") return textos.semValor;
      const cor = valor ? CORES_ENUM.green : CORES_ENUM.gray;
      return (
        <Tag bg={cor.bg} color={cor.color}>
          {valor ? textos.sim : textos.nao}
        </Tag>
      );
    }
    case "currency":
      return formatarMoeda(
        valor,
        c.moeda ? { ...formato, moeda: c.moeda } : formato,
        textos.semValor,
      );
    case "date":
      return formatarData(valor, formato, textos.semValor);
    case "datetime":
      return formatarDataHora(valor, formato, textos.semValor);
    case "mono":
      return (
        <Text fontFamily="mono" fontSize="xs" lineClamp="1">
          {texto || textos.semValor}
        </Text>
      );
    case "link": {
      const rotulo = texto || textos.semValor;
      const href = c.hrefKey ? (row[c.hrefKey] as string | undefined) : undefined;
      if (!href) return <Text fontWeight="medium">{rotulo}</Text>;
      if (href.startsWith("/")) {
        return (
          <ChakraLink href={href} color="var(--admin-primary)" fontWeight="medium">
            {rotulo}
          </ChakraLink>
        );
      }
      return (
        <ChakraLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          color="var(--admin-primary)"
          fontWeight="medium"
        >
          {rotulo} <ExternalLink size={12} style={{ display: "inline", verticalAlign: "middle" }} />
        </ChakraLink>
      );
    }
    default:
      return texto || textos.semValor;
  }
}
