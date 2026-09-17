"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { UI_TEXTOS_PT, type UiTextos } from "../textos";
import { FORMATO_PT, type FormatoUi } from "../format";
import type { CatalogoEnumsUi } from "../components/table/celula-declarativa";

/**
 * Uma máscara de campo: o que se vê enquanto digita e o que vai no envio.
 * O design-system NÃO tem as máscaras — CPF, CNPJ, CEP e telefone são regra de
 * cada sistema e valem também no servidor (validar, gravar, imprimir). Duplicar
 * aqui criaria uma segunda verdade; então o app injeta as suas.
 */
export type MascaraUi = {
  formatar: (texto: string) => string;
  crua: (texto: string) => string;
};

type ValorContexto = {
  textos: UiTextos;
  formato: FormatoUi;
  enums?: CatalogoEnumsUi;
  traduzirChave?: (chave: string) => string | null;
  mascaras?: Record<string, MascaraUi>;
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
  traduzirChave,
  mascaras,
}: {
  children: ReactNode;
  textos?: Partial<UiTextos>;
  formato?: Partial<FormatoUi>;
  enums?: CatalogoEnumsUi;
  /**
   * Traduz a `messageKey` que a server action devolve. Devolve `null` quando a
   * chave não existe — e aí o motor de envio cai no `message` cru em vez de
   * mostrar o caminho da chave a quem está usando.
   */
  traduzirChave?: (chave: string) => string | null;
  mascaras?: Record<string, MascaraUi>;
}) {
  const valor = useMemo<ValorContexto>(
    () => ({
      textos: textos ? { ...UI_TEXTOS_PT, ...textos } : UI_TEXTOS_PT,
      formato: formato ? { ...FORMATO_PT, ...formato } : FORMATO_PT,
      enums,
      traduzirChave,
      mascaras,
    }),
    [textos, formato, enums, traduzirChave, mascaras],
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

export function useUiTraducao(): (chave: string) => string | null {
  const { traduzirChave } = useContext(ContextoTextos);
  return traduzirChave ?? (() => null);
}

export function useUiMascaras(): Record<string, MascaraUi> {
  return useContext(ContextoTextos).mascaras ?? {};
}
