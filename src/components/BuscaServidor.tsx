"use client";

import { Search } from "lucide-react";
import { Flex } from "../primitives";
import { chakra } from "../chakra-controls";
import { Field, Input } from "./controls";
import { Button } from "./Button";
import { useUiTextos } from "../provider/textos";

/**
 * Busca que vai ao SERVIDOR — o único `method="get"` do painel.
 *
 * Existe para a lista que é grande demais para vir inteira ao navegador: aqui
 * a palavra vira query string, o servidor devolve a página filtrada, e o
 * resultado sobrevive ao F5 e ao link colado no WhatsApp. (Lista que já está na
 * tela filtra pela `busca` da `DataTable`, sem passar pelo servidor.)
 *
 * O `ocultos` é o que impede o pior defeito desta peça: um form GET só manda os
 * campos que ele tem, então buscar dentro de uma lista já filtrada JOGA FORA a
 * aba e os filtros que estavam na URL. Quem chama declara o que preservar e
 * eles viajam como campos escondidos.
 */
export function BuscaServidor({
  nome = "q",
  valor,
  rotulo,
  placeholder,
  ocultos,
  rotuloBotao,
  larguraMax,
}: {
  nome?: string;
  valor?: string;
  rotulo?: string;
  placeholder?: string;
  /** Pares da URL a preservar no envio (aba, filtros, ordenação). */
  ocultos?: Record<string, string | undefined | null>;
  rotuloBotao?: string;
  larguraMax?: string;
}) {
  const textos = useUiTextos();
  const legenda = rotulo ?? rotuloBotao ?? textos.buscar;
  return (
    <chakra.form
      method="get"
      flex={larguraMax ? undefined : "1 1 260px"}
      minW="0"
      maxW={larguraMax}
    >
      {Object.entries(ocultos ?? {})
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v as string} />
        ))}
      <Flex gap="2" align="end">
        <Field.Root flex="1" minW="0">
          {rotulo ? <Field.Label>{rotulo}</Field.Label> : null}
          <Input
            name={nome}
            defaultValue={valor ?? ""}
            placeholder={placeholder}
            aria-label={legenda}
            size="sm"
          />
        </Field.Root>
        <Button tone="outline" size="sm" type="submit">
          <Search />
          {rotuloBotao ?? textos.buscar}
        </Button>
      </Flex>
    </chakra.form>
  );
}
