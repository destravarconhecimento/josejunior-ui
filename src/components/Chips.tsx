"use client";

import { Flex } from "../primitives";
import { Field } from "./controls";
import { Button } from "./Button";

/**
 * Multi-seleção por PÍLULAS. Para 2 a 8 opções curtas (dias da semana, canais,
 * tipos), onde um select múltiplo esconde o que está marcado atrás de um clique
 * e um grid de checkbox ocupa a coluna inteira.
 *
 * Não confundir com o `ChipFiltro` da tabela: aquele filtra uma lista já na
 * tela; este é CAMPO de formulário — o valor sai daqui para o envio.
 */
export function Chips({
  label,
  hint,
  opcoes,
  selecionadas,
  aoMudar,
  desabilitado = false,
}: {
  label?: string;
  hint?: string;
  opcoes: ReadonlyArray<{ value: string; label: string }>;
  selecionadas: ReadonlyArray<string>;
  aoMudar: (v: string[]) => void;
  desabilitado?: boolean;
}) {
  const set = new Set(selecionadas);
  const pilulas = (
    <Flex gap="1.5" wrap="wrap">
      {opcoes.map((o) => {
        const on = set.has(o.value);
        return (
          <Button
            key={o.value}
            size="2xs"
            type="button"
            // `tone` em vez de variant/colorPalette: a cor de marcado vem do
            // tema do painel (`--admin-primary`), não de uma paleta literal que
            // só existe num dos sistemas.
            tone={on ? "primary" : "outline"}
            disabled={desabilitado}
            aria-pressed={on}
            onClick={() => {
              const prox = new Set(set);
              if (on) prox.delete(o.value);
              else prox.add(o.value);
              // devolve na ORDEM das opções, não na ordem dos cliques: o valor
              // de um mesmo conjunto tem de ser sempre o mesmo texto.
              aoMudar(opcoes.map((x) => x.value).filter((v) => prox.has(v)));
            }}
          >
            {o.label}
          </Button>
        );
      })}
    </Flex>
  );
  if (!label) return pilulas;
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      {pilulas}
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
}
