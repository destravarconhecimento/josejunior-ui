"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { UI_TEXTOS_PT, type UiTextos } from "../textos";
import { FORMATO_PT, type FormatoUi } from "../format";
import type { CatalogoEnumsUi } from "../components/table/celula-declarativa";

type ValorContexto = {
  textos: UiTextos;
  formato: FormatoUi;
  enums?: CatalogoEnumsUi;
};

const PADRAO: ValorContexto = { textos: UI_TEXTOS_PT, formato: FORMATO_PT };

const ContextoTextos = createContext<ValorContexto>(PADRAO);

/**
 * Idioma e formatos da UI compartilhada. Sem ele tudo fica em pt-BR (o padrão
 * dos 133 painéis); com ele o repo de fora (8899br) injeta as strings do
 * next-intl, o locale/moeda/fuso e o catálogo de enums — sem prop em tela.
 */
export function UiTextosProvider({
  children,
  textos,
  formato,
  enums,
}: {
  children: ReactNode;
  textos?: Partial<UiTextos>;
  formato?: Partial<FormatoUi>;
  enums?: CatalogoEnumsUi;
}) {
  const valor = useMemo<ValorContexto>(
    () => ({
      textos: textos ? { ...UI_TEXTOS_PT, ...textos } : UI_TEXTOS_PT,
      formato: formato ? { ...FORMATO_PT, ...formato } : FORMATO_PT,
      enums,
    }),
    [textos, formato, enums],
  );
  return <ContextoTextos.Provider value={valor}>{children}</ContextoTextos.Provider>;
}

export function useUiTextos(override?: Partial<UiTextos>): UiTextos {
  const { textos } = useContext(ContextoTextos);
  return useMemo(() => (override ? { ...textos, ...override } : textos), [textos, override]);
}

export function useUiFormato(override?: Partial<FormatoUi>): FormatoUi {
  const { formato } = useContext(ContextoTextos);
  return useMemo(() => (override ? { ...formato, ...override } : formato), [formato, override]);
}

export function useUiEnums(): CatalogoEnumsUi | undefined {
  return useContext(ContextoTextos).enums;
}
